import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // 1. Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "Valid 'url' is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Analyzing URL:", url);

    // --- Step 2: Scrape with Jina Reader ---
    let articleText = "";
    try {
      // We send the URL directly. Jina handles the parsing.
      const jinaResponse = await fetch(`https://r.jina.ai/${url}`);
      
      if (!jinaResponse.ok) {
        throw new Error(`Jina Reader returned status ${jinaResponse.status}`);
      }
      
      articleText = await jinaResponse.text();
      console.log("Jina fetched characters:", articleText.length);

      if (articleText.length < 200) {
        console.warn("Warning: Scraped text is surprisingly short.");
      }
      
      // Limit text length to prevent hitting Gemini context limits
      articleText = articleText.substring(0, 30000); 
      
    } catch (error) {
      console.error("Scraping failed:", error);
      return new Response(JSON.stringify({ error: "Failed to scrape article content. The site may be blocking bots." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Step 3: Check API Key ---
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
    if (!GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY is missing in Supabase secrets.");
    }

    // --- Step 4: Construct Prompt ---
    const prompt = `
      You are a Decision Intelligence AI for Business. 
      Analyze the following article (provided in Markdown format) and return a **valid JSON object**.
      Do not include markdown formatting (like \`\`\`json) in your response.

      Required JSON Structure:
      {
        "article_summary": "Executive summary (max 2 sentences)",
        "risk_level": "low" or "medium" or "high",
        "credibility_check": "1 sentence on source reliability",
        
        "decision_impact_analysis": [
           {
             "claim": "Specific claim from the text",
             "domain": "Strategy" or "Finance" or "Tech",
             "implied_action": "What a reader might do",
             "predicted_consequence": "Risk if this is wrong",
             "recommendation": "Verification step"
           }
        ],
        
        "integrity_analysis": {
           "promotional_score": number 0-100,
           "intent": "Informational" or "Commercial",
           "logical_fallacies": ["List fallacies or 'None'"],
           "conflict_of_interest_warning": "Any potential bias detected"
        },
        
        "entities_and_funding": [
           {
             "name": "Company/Person",
             "role": "Subject",
             "background_check": "Brief context"
           }
        ],

        "missing_perspectives": ["List 2-3 missing viewpoints"]
      }

      Article Markdown:
      ${articleText}
    `;

    // --- Step 5: Call Gemini API ---
    // Using the stable v1beta version for 1.5 Flash
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
            temperature: 0.3,
            // Enforce JSON output format for stability
            responseMimeType: "application/json"
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", errorText);
      throw new Error(`Gemini API Error: ${response.statusText}`);
    }

    const data = await response.json();
    let rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    // --- Step 6: Robust JSON Cleaning ---
    // Sometimes AI adds ```json ... ``` despite instructions. We strip it carefully.
    rawContent = rawContent.replace(/```json/g, '').replace(/```/g, '');
    
    // Ensure we only parse from the first '{' to the last '}'
    const firstBrace = rawContent.indexOf('{');
    const lastBrace = rawContent.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      rawContent = rawContent.substring(firstBrace, lastBrace + 1);
    }

    let analysisResult;
    try {
      analysisResult = JSON.parse(rawContent);
    } catch (e) {
      console.error("JSON Parse Error:", e);
      console.log("Raw output was:", rawContent);
      throw new Error("Failed to parse AI response as JSON");
    }

    return new Response(JSON.stringify(analysisResult), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Function Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
