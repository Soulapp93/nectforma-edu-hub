import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { analytics } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const analyticsText = JSON.stringify({
      totalResponses: analytics.totalResponses,
      completionRate: analytics.completionRate,
      avgScore: analytics.avgScore,
      questions: analytics.questionAnalytics?.map((qa: any) => ({
        title: qa.question.title,
        type: qa.type,
        totalAnswers: qa.totalAnswers,
        data: qa.data,
      })),
    });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Tu es un expert en analyse de questionnaires et sondages. Analyse les données fournies et donne un rapport détaillé en français incluant:
1. **Résumé général** : vue d'ensemble des réponses
2. **Points clés** : tendances et insights principaux
3. **Analyse par question** : pour chaque question, analyse les réponses (distribution, consensus, divergences)
4. **Sentiment général** : pour les questions texte, identifie les sentiments dominants
5. **Recommandations** : suggestions d'actions basées sur les données
6. **Points d'attention** : alertes ou anomalies à surveiller

Utilise des emojis pour rendre le rapport lisible. Sois précis avec les données chiffrées.`,
          },
          {
            role: "user",
            content: `Voici les données analytiques du questionnaire à analyser:\n\n${analyticsText}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes atteinte, réessayez plus tard." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("OpenAI error:", response.status, t);
      throw new Error("OpenAI API error");
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || "Aucune analyse générée.";

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-questionnaire error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
