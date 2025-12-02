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
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "Valid 'url' is required in JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Analyzing URL:", url);

    // ——— Jina Reader – gets clean markdown, renders JS, bypasses most bot blocks ———
    let articleText = "";
    try {
      const jinaResponse = await fetch(`https://r.jina.ai/${encodeURIComponent(url)}`);
      if (!jinaResponse.ok) {
        throw new Error(`Jina returned ${jinaResponse.status}`);
      }
      articleText = await jinaResponse.text();
      console.log("Jina fetched article – length:", articleText.length);

      if (articleText.length < 500) {
        console.warn("Very short content – possibly failed scrape");
      }
      articleText = articleText.substring(0, 20_000); // safe for Gemini
    } catch (e) {
      console.error("Jina scrape failed:", e);
      return new Response(JSON.stringify({ error: "Could not fetch article content (blocked or invalid URL)" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ——— Google Gemini key ———
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
    if (!GOOGLE_API_KEY) {
      console.error("Missing GOOGLE_API_KEY secret");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `
You are a Decision Intelligence AI for Business. Analyze the following article (Markdown format) and return a **valid JSON object only** (no markdown fences).

Required exact structure:
{
  "article_summary": "Max 2 sentences",
  "risk_level": "low"|"medium"|"high",
  "credibility_check": "One-sentence source assessment",
  "decision_impact_analysis": [
    {
      "claim": "Specific claim from article",
      "domain": "Strategy"|"Finance"|"Tech",
      "implied_action": "What a reader might do",
      "predicted_consequence": "If it goes wrong",
      "recommendation": "Verification step"
    }
  ],
  "integrity_analysis": {
    "promotional_score": 0,
    "intent": "Informational"|"Commercial",
    "logical_fallacies": []|"None",
    "conflict_of_interest_warning": "Any bias note or 'None detected'"
  },
  "entities_and_funding": [
    {
      "name": "Company/Person",
      "role": "Subject"|"Investor"|"Critic",
      "background_check": "Short context"
    }
  ],
  "missing_perspectives": ["Viewpoint 1", "Viewpoint 2"]
}

Article Markdown:
${articleText}
`;

    const geminiRes = await fetch(
     `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3 },
        }),
      },
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      console.error("Gemini error:", err);
      throw new Error("Gemini API failed");
    }

    const data = await geminiRes.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Clean any leftover markdown fences
    const cleaned = rawText
      .replace(/^```json\s*\n?/, "")
      .replace(/^```\s*\n?/, "")
      .replace(/\n?```$/, "")
      .trim();

    let result;
    try {
      result = JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse Gemini JSON. Raw output:", rawText);
      throw new Error("Invalid JSON from AI");
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unhandled error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
