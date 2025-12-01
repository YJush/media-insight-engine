import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Analyzing article:", url);

    // -----------------------------------------------------------------------
    // Step 1: Fetch article content (Basic extraction)
    // -----------------------------------------------------------------------
    let articleText = "";
    try {
      const articleResponse = await fetch(url);
      const html = await articleResponse.text();
      
      // Basic extraction - removes scripts, styles, and tags to get raw text
      articleText = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .substring(0, 15000); // Limit to first 15k chars for prompt limits

      console.log("Article text length:", articleText.length);
    } catch (error) {
      console.error("Error fetching article:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch article content" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // -----------------------------------------------------------------------
    // Step 2: Classify article type (Using Lovable Gateway for speed)
    // -----------------------------------------------------------------------
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const classifyPrompt = `Classify the following article as "political", "business", "general", or "other". Return a single word only.

Article text:
${articleText.substring(0, 5000)}`;

    console.log("Classifying article type...");
    const classifyResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: classifyPrompt }],
        temperature: 0.2,
      }),
    });

    if (!classifyResponse.ok) {
      const errorText = await classifyResponse.text();
      console.error("Classification error:", classifyResponse.status, errorText);
      throw new Error("Failed to classify article");
    }

    const classifyData = await classifyResponse.json();
    const articleType = classifyData.choices[0].message.content.trim().toLowerCase();
    console.log("Article type:", articleType);

    // -----------------------------------------------------------------------
    // Step 3: Comprehensive Analysis (Decision & Integrity) - Using Google Direct
    // -----------------------------------------------------------------------
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
    if (!GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY is not configured in secrets.");
    }

    const isPolitical = articleType === "political";
    
    // UPDATED PROMPT: Adds Integrity, Intent, and Funding checks
    const analysisPrompt = isPolitical 
      ? `You are an expert AI analyst. Analyze the article and return structured JSON with:
         1. "political_bias_score": numeric 0-100
         2. "writing_style_score": numeric 0-100
         3. "article_summary": short summary
         4. "claims": list of key claims
         5. "tone": overall tone
         6. "bias": framing bias
         7. "political_slant": slant description
         8. "source_influence": source credibility
         9. "risk_level": low/medium/high
         10. "possible_negative_consequences": risks
         11. "suggested_actions": recommendations
         
         Article text:
         ${articleText}
         
         Return ONLY valid JSON.`
      : `You are a Decision Intelligence AI for Business. 
         Use Google Search to investigate the publisher, author, and companies mentioned.
         
         Analyze the article for STRATEGIC IMPACT, INTEGRITY, and HIDDEN MOTIVES.
         Return structured JSON with:

        1. "article_summary": "Executive summary (2 sentences)",
        2. "risk_level": "low" | "medium" | "high",
        3. "decision_impact_analysis": A list of 3 items. For each major claim:
           - "claim": The specific assertion made.
           - "domain": "Marketing", "Finance", "HR", "Tech", or "Strategy".
           - "implied_action": What might a business owner do if they blindly believe this?
           - "predicted_consequence": The negative outcome if the article is biased/wrong.
           - "recommendation": A specific counter-measure or verification step.
        
        4. "integrity_analysis": {
           "promotional_score": numeric 0-100 (0 = Objective reporting, 100 = Pure sales copy),
           "intent": "Informational" | "Persuasive" | "Commercial/Sales" | "Disinformation",
           "logical_fallacies": ["List any fallacies found, e.g., 'Strawman', 'Appeal to Authority', 'False Dichotomy'"],
           "conflict_of_interest_warning": "Use Google Search to check if the publisher/author has financial ties to the subjects. If yes, explain. If no, return null."
        },
        
        5. "entities_and_funding": [
           {
             "name": "Company/Person Name",
             "role": "Subject" or "Source",
             "background_check": "1 sentence on their reputation/funding based on search results."
           }
        ],

        6. "missing_perspectives": List of strings. What data or viewpoints did the author intentionally leave out?
        7. "credibility_check": A 1-sentence assessment of the source's historical reliability on this specific topic.
        
        // Legacy fields for UI compatibility:
        8. "political_bias_score": 50,
        9. "writing_style_score": 50

        Article text:
        ${articleText}

        Return ONLY valid JSON.`;

    console.log("Calling Google Gemini directly for analysis...");
    
    // DIRECT GOOGLE API CALL with Search Tool
    const analysisResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: analysisPrompt }]
          }],
          tools: [{
            google_search_retrieval: {
              dynamic_retrieval_config: {
                mode: "MODE_DYNAMIC",
                dynamic_threshold: 0.7,
              }
            }
          }],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: "application/json"
          }
        }),
      }
    );

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error("Google API Error:", errorText);
      throw new Error(`Google API Error: ${errorText}`);
    }

    const analysisData = await analysisResponse.json();
    console.log("Analysis response received.");

    let fullAnalysis;
    try {
      // Google API returns the text in this specific path
      const textContent = analysisData.candidates[0].content.parts[0].text;
      fullAnalysis = JSON.parse(textContent);
    } catch (error) {
      console.error("Failed to parse Google JSON:", error);
      console.log("Raw text:", analysisData.candidates[0]?.content?.parts[0]?.text);
      throw new Error("Failed to parse AI response");
    }

    // Combine results
    const finalResult = {
      article_type: articleType,
      ...fullAnalysis,
    };

    console.log("Analysis complete.");

    return new Response(
      JSON.stringify(finalResult),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Analysis error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
