import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // 1. Setup: Allow the frontend to talk to this backend
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log("Analyzing article:", url);

    // 2. Fetch the text from the website
    let articleText = "";
    try {
      const articleResponse = await fetch(url);
      const html = await articleResponse.text();
      // Clean up the HTML to get just the text
      articleText = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .substring(0, 15000); 
    } catch (error) {
      return new Response(JSON.stringify({ error: "Failed to fetch article content" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 3. Get the Google Key
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
    if (!GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY is missing. Please add it to your .env file!");
    }

    // 4. The "Strict Template" Prompt
    // We tell Gemini explicitly what JSON fields we need so the UI isn't empty.
    const analysisPrompt = `
      You are a Decision Intelligence AI for Business. 
      Analyze the following article text.
      
      CRITICAL INSTRUCTION: You must return a valid JSON object. Do not wrap it in markdown. 
      You MUST populate the "decision_impact_analysis", "integrity_analysis", and "entities_and_funding" fields. Do not leave them empty.

      Required JSON Structure:
      {
        "article_summary": "Executive summary (max 2 sentences)",
        "risk_level": "low" or "medium" or "high",
        "credibility_check": "1 sentence on source reliability",
        
        "decision_impact_analysis": [
           {
             "claim": "Extract a specific claim from the text",
             "domain": "Strategy" or "Finance" or "Tech",
             "implied_action": "What a reader might do if they believe this",
             "predicted_consequence": "What happens if this goes wrong",
             "recommendation": "Verification step"
           },
           {
             "claim": "Extract another key claim",
             "domain": "Operations",
             "implied_action": "Action...",
             "predicted_consequence": "Consequence...",
             "recommendation": "Recommendation..."
           }
        ],
        
        "integrity_analysis": {
           "promotional_score": number 0-100,
           "intent": "Informational" or "Commercial",
           "logical_fallacies": ["List fallacies if any, or 'None'"],
           "conflict_of_interest_warning": "Note any potential bias or funding issues"
        },
        
        "entities_and_funding": [
           {
             "name": "Key Company/Person",
             "role": "Subject",
             "background_check": "Brief context on who they are"
           }
        ],

        "missing_perspectives": ["List 2-3 viewpoints missing from the article"]
      }

      Article Text:
      ${articleText}
    `;

    console.log("Asking Gemini...");

    // 5. Call Google Gemini
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
    
    // 6. Clean and Parse the Answer
    // This fixes the error where the app crashes if Gemini adds "```json" to the answer.
    const textContent = data.candidates[0].content.parts[0].text;
    const cleanedText = textContent.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanedText);

    return new Response(JSON.stringify(result), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
