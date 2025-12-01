import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    console.log("Analyzing article via Jina Reader:", url);

    // --- FIX STARTS HERE ---
    // Use Jina Reader to fetch clean markdown content
    // This handles JS rendering and cleaning automatically
    let articleText = "";
    try {
      const articleResponse = await fetch(`https://r.jina.ai/${url}`);
      
      if (!articleResponse.ok) {
        throw new Error(`Failed to scrape: ${articleResponse.statusText}`);
      }

      articleText = await articleResponse.text();
      
      // Basic check to ensure we actually got content
      if (articleText.length < 500) {
        console.warn("Warning: Scraped text is very short.");
      }
      
      // Truncate to avoid token limits (Markdown is denser, so 20k chars is safe)
      articleText = articleText.substring(0, 20000);
      
    } catch (error) {
      console.error("Scraping Error:", error);
      return new Response(JSON.stringify({ 
        error: "Failed to fetch article content. The site might be blocking bots." 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }
    // --- FIX ENDS HERE ---

    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
    if (!GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY is missing.");
    }

    const analysisPrompt = `
      You are a Decision Intelligence AI for Business. 
      Analyze the following article (provided in Markdown format).
      
      CRITICAL INSTRUCTION: You must return a valid JSON object. Do not wrap it in markdown code blocks.
      You MUST populate the "decision_impact_analysis", "integrity_analysis", and "entities_and_funding" fields.

      Required JSON Structure:
      {
        "article_summary": "Executive summary (max 2 sentences)",
        "risk_level": "low" or "medium" or "high",
        "credibility_check": "1 sentence on source reliability",
        
        "decision_impact_analysis": [
           {
             "claim": "Extract a specific claim",
             "domain": "Strategy" or "Finance" or "Tech",
             "implied_action": "What a reader might do",
             "predicted_consequence": "What happens if this goes wrong",
             "recommendation": "Verification step"
           }
        ],
        
        "integrity_analysis": {
           "promotional_score": number 0-100,
           "intent": "Informational" or "Commercial",
           "logical_fallacies": ["List fallacies or 'None'"],
           "conflict_of_interest_warning": "Note any potential bias"
        },
        
        "entities_and_funding": [
           {
             "name": "Key Company/Person",
             "role": "Subject",
             "background_check": "Brief context"
           }
        ],

        "missing_perspectives": ["List 2-3 viewpoints missing"]
      }

      Article Markdown:
      ${articleText}
    `;

    // ... rest of your code remains the same ...
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: analysisPrompt }] }],
          generationConfig: { temperature: 0.3 }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google API Error: ${errorText}`);
    }

    const data = await response.json();
    const textContent = data.candidates[0].content.parts[0].text;
    
    // Improved cleaning to handle markdown code blocks better
    const cleanedText = textContent
      .replace(/^```json\s*/, '')
      .replace(/^```\s*/, '')
      .replace(/\s*```$/, '')
      .trim();
      
    const result = JSON.parse(cleanedText);

    return new Response(JSON.stringify(result), { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
