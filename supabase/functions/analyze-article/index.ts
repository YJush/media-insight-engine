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

    // Step 2: Extract claims, tone, and bias using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const step1Prompt = `You are an expert media analyst. Analyze the following article and return structured JSON:

1. "claims": a list of the main factual or forward-looking claims in the article (array of strings).
2. "tone": overall tone (neutral, optimistic, alarmist, negative, or similar).
3. "bias": any ideological, framing, or source bias (brief label or "none").

Article text:
${articleText}

Return ONLY valid JSON in this exact format:
{
  "claims": ["claim 1", "claim 2", "claim 3"],
  "tone": "tone description",
  "bias": "bias description"
}`;

    console.log("Calling Lovable AI for Step 1...");
    const step1Response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "user", content: step1Prompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!step1Response.ok) {
      if (step1Response.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (step1Response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await step1Response.text();
      console.error("AI gateway error:", step1Response.status, errorText);
      throw new Error("AI gateway error");
    }

    const step1Data = await step1Response.json();
    console.log("Step 1 response:", JSON.stringify(step1Data));

    let claimsAnalysis;
    try {
      const content = step1Data.choices[0].message.content;
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || content.match(/(\{[\s\S]*\})/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      claimsAnalysis = JSON.parse(jsonStr);
    } catch (error) {
      console.error("Failed to parse Step 1 JSON:", error);
      throw new Error("Failed to parse AI response");
    }

    // Step 3: Predict downstream impact using the claims analysis
    const step2Prompt = `You are an AI decision-intelligence assistant. Based on the claims analysis below, predict potential business impact for a small or medium-sized enterprise (SME) reading this article. Return JSON:

1. "risk_level": low / medium / high — likelihood the article could lead to risky decisions.
2. "possible_negative_consequences": up to 3 potential mis-decisions or risks for the SME (array of strings).
3. "suggested_actions": up to 3 actionable next steps or counterpoints to mitigate bias, misinformation, or overreaction (array of strings).

Claims analysis:
${JSON.stringify(claimsAnalysis)}

Return ONLY valid JSON in this exact format:
{
  "risk_level": "low",
  "possible_negative_consequences": ["consequence 1", "consequence 2"],
  "suggested_actions": ["action 1", "action 2", "action 3"]
}`;

    console.log("Calling Lovable AI for Step 2...");
    const step2Response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "user", content: step2Prompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!step2Response.ok) {
      const errorText = await step2Response.text();
      console.error("AI gateway error (Step 2):", step2Response.status, errorText);
      throw new Error("AI gateway error in Step 2");
    }

    const step2Data = await step2Response.json();
    console.log("Step 2 response:", JSON.stringify(step2Data));

    let impactAnalysis;
    try {
      const content = step2Data.choices[0].message.content;
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || content.match(/(\{[\s\S]*\})/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      impactAnalysis = JSON.parse(jsonStr);
    } catch (error) {
      console.error("Failed to parse Step 2 JSON:", error);
      throw new Error("Failed to parse AI response in Step 2");
    }

    // Combine results
    const finalResult = {
      ...claimsAnalysis,
      ...impactAnalysis,
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
