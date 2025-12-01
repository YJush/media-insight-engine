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
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Analyzing article:", url);

    // Step 1: Fetch article content (simplified - using a basic fetch)
    let articleText = "";
    try {
      const articleResponse = await fetch(url);
      const html = await articleResponse.text();
      
      // Basic extraction - in production, use a proper scraper
      // Remove HTML tags and get text content
      articleText = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .substring(0, 15000); // Limit to first 15k chars

      console.log("Article text length:", articleText.length);
    } catch (error) {
      console.error("Error fetching article:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch article content" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Classify article type
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

    // Step 3: Comprehensive analysis based on article type
    const isPolitical = articleType === "political";
    
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
      : `You are a Decision Intelligence AI for Small and Medium Enterprises (SMEs). 
         Do not just summarize. Analyze the STRATEGIC IMPACT of this content.

         Analyze the article and return structured JSON with:

        1. "article_summary": "Executive summary (2 sentences)",
        2. "risk_level": "low" | "medium" | "high",
        3. "decision_impact_analysis": A list of 3 items. For each major claim in the text, identify:
           - "claim": The specific assertion made.
           - "domain": "Marketing", "Finance", "HR", "Tech", or "Strategy".
           - "implied_action": What might a business owner do if they blindly believe this? (e.g., "Shift budget to TikTok ads", "Fire remote staff").
           - "predicted_consequence": The negative outcome if the article is biased/wrong (e.g., "Wasted ad spend due to unverified demographics").
           - "recommendation": A specific counter-measure or verification step (e.g., "Run a $500 pilot test before shifting full budget").
        4. "missing_perspectives": List of strings. What data or viewpoints did the author intentionally leave out?
        5. "credibility_check": A 1-sentence assessment of the source's historical reliability on this specific topic.
        
        // Keep these legacy fields for backward compatibility if needed, or remove if you fully update the UI:
        6. "political_bias_score": set to 50
        7. "writing_style_score": numeric 0-100 based on objectivity

        Article text:
        ${articleText}

        Return ONLY valid JSON.`;

    console.log("Calling Lovable AI for comprehensive analysis...");
    const analysisResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: analysisPrompt }],
        temperature: 0.3,
      }),
    });

    if (!analysisResponse.ok) {
      if (analysisResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (analysisResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await analysisResponse.text();
      console.error("AI gateway error:", analysisResponse.status, errorText);
      throw new Error("AI gateway error");
    }

    const analysisData = await analysisResponse.json();
    console.log("Analysis response:", JSON.stringify(analysisData));

    let fullAnalysis;
    try {
      const content = analysisData.choices[0].message.content;
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || content.match(/(\{[\s\S]*\})/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      fullAnalysis = JSON.parse(jsonStr);
    } catch (error) {
      console.error("Failed to parse analysis JSON:", error);
      throw new Error("Failed to parse AI response");
    }

    // Add article type to result
    const finalResult = {
      article_type: articleType,
      ...fullAnalysis,
    };

    console.log("Analysis complete:", JSON.stringify(finalResult));

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
