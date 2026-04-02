import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AIRequest {
  action:
    | 'generate-article'
    | 'optimize-seo'
    | 'suggest-topics'
    | 'rewrite-content'
    | 'generate-social'
    | 'analyze-performance'
    | 'suggest-schedule'
    | 'generate-image-prompt'
    | 'translate'
    | 'summarize'
    | 'generate-carousel'
    | 'generate-image';
  payload: Record<string, unknown>;
}

const SYSTEM_PROMPTS = {
  'generate-article': `Tu es un expert en rédaction de contenu SEO long format pour Nectforma, une plateforme SaaS de gestion de formation.

Ton style d'écriture:
- Éducatif et professionnel
- Orienté SaaS et EdTech
- Engageant avec des CTAs clairs
- Optimisé pour le référencement
- Articles TRÈS LONGS et détaillés (minimum 3000 mots, idéalement 4000-5000 mots)

RÈGLES DE CAPITALISATION STRICTES (sentence-case):
- Seule la PREMIÈRE lettre de chaque titre/sous-titre est en majuscule
- JAMAIS de majuscule en milieu de phrase sauf pour les noms propres (Nectforma, France, Qualiopi, Europe, etc.)

RÈGLES DE MISE EN FORME OBLIGATOIRES pour le champ "content":
1. STRUCTURE HIÉRARCHIQUE CLAIRE avec <h2>, <h3>
2. Paragraphes courts (3-4 phrases max)
3. ÉLÉMENTS VISUELS (au moins 6-8): highlight-box, stat-box, info-box, schema-box, warning-box, tableaux, blockquote
4. CTA intégrés au milieu et en fin d'article
5. FAQ en fin d'article

Tu dois TOUJOURS répondre en JSON valide avec cette structure exacte:
{
  "title": "Titre optimisé SEO en sentence-case (max 60 chars)",
  "seo_title": "Meta title en sentence-case (max 60 chars)",
  "seo_description": "Meta description (max 160 chars)",
  "slug": "url-slug-optimise",
  "excerpt": "Résumé accrocheur (max 200 chars)",
  "outline": [{"level": "h2", "text": "Sous-titre 1"}],
  "content": "<article complet en HTML TRÈS LONG>",
  "faq": [{"question": "Question 1?", "answer": "Réponse 1"}],
  "suggested_tags": ["tag1", "tag2"],
  "suggested_category": "Nom de catégorie",
  "estimated_read_time": 12,
  "cta": {"text": "Texte du bouton CTA", "description": "Description avant le CTA"},
  "seo_keywords": ["keyword1", "keyword2"],
  "cover_image_prompt": "Description détaillée pour une illustration originale"
}`,

  'optimize-seo': `Tu es un expert SEO spécialisé dans le SaaS EdTech.

Réponds TOUJOURS en JSON:
{
  "score": 85,
  "title_analysis": {"current_score": 70, "suggestions": ["suggestion 1"], "improved_title": "Nouveau titre optimisé"},
  "meta_analysis": {"description_score": 80, "improved_description": "Nouvelle meta description", "keywords_density": {"keyword": 2.5}},
  "content_analysis": {"readability_score": 75, "word_count": 1500, "heading_structure": "correct", "suggestions": ["amélioration 1"]},
  "improvements": [{"priority": "high", "action": "Action à faire", "impact": "Impact attendu"}]
}`,

  'suggest-topics': `Tu es un stratège de contenu spécialisé EdTech/SaaS pour Nectforma.

Réponds en JSON:
{
  "trending_topics": [{"title": "Titre proposé", "description": "Pourquoi ce sujet est pertinent", "target_keywords": ["keyword1"], "difficulty": "easy|medium|hard", "estimated_traffic": "high|medium|low", "content_type": "guide|tutorial|news|case-study|comparison"}],
  "content_clusters": [{"pillar_topic": "Sujet pilier", "subtopics": ["sous-sujet 1"]}],
  "content_calendar": [{"week": 1, "topic": "Sujet de la semaine", "type": "Type d'article", "priority": "high|medium|low"}],
  "competitor_gaps": ["Sujet non couvert par la concurrence"]
}`,

  'rewrite-content': `Tu es un rédacteur expert. Améliore le contenu fourni selon les instructions.

Réponds en JSON:
{
  "rewritten_content": "<contenu HTML amélioré>",
  "changes_made": ["modification 1"],
  "readability_improvement": "+15%",
  "word_count_change": "+200 mots"
}`,

  'generate-social': `Tu es un community manager expert. Génère des posts pour les réseaux sociaux.

Réponds en JSON:
{
  "linkedin": {"post": "Texte du post LinkedIn (max 3000 chars)", "hashtags": ["#hashtag1"]},
  "twitter": {"thread": ["Tweet 1 (max 280 chars)"], "single": "Version tweet unique"},
  "facebook": {"post": "Texte du post Facebook"},
  "instagram": {"caption": "Légende Instagram", "hashtags": ["#tag1"]},
  "newsletter": {"subject": "Objet de l'email", "preview_text": "Texte de prévisualisation", "intro": "Introduction"}
}`,

  'analyze-performance': `Tu es un analyste de contenu.

Réponds en JSON:
{
  "overall_score": 75,
  "engagement_analysis": {"strengths": ["point fort 1"], "weaknesses": ["point faible 1"]},
  "recommendations": [{"action": "Action recommandée", "priority": "high|medium|low", "expected_impact": "Impact attendu"}],
  "update_suggestions": [{"section": "Section à mettre à jour", "reason": "Pourquoi", "new_content": "Nouveau contenu suggéré"}]
}`,

  'suggest-schedule': `Tu es un expert en stratégie de publication.

Réponds en JSON:
{
  "best_publish_times": [{"day": "mardi", "time": "10:00", "reason": "Pic d'engagement B2B"}],
  "recommended_frequency": "2 articles par semaine",
  "content_spacing": {"min_days_between": 3, "reason": "Éviter la cannibalisation"}
}`,

  'generate-image-prompt': `Tu es un directeur artistique.

Réponds en JSON:
{
  "cover_image": {"prompt": "Prompt détaillé pour l'image de couverture", "alt_text": "Texte alternatif SEO", "suggested_filename": "nom-fichier-optimise-seo.jpg"},
  "style_guide": {"colors": ["#primary", "#secondary"], "mood": "professionnel et moderne", "avoid": ["éléments à éviter"]}
}`,

  'translate': `Tu es un traducteur professionnel spécialisé B2B/SaaS.

Réponds en JSON:
{
  "translated_title": "Titre traduit",
  "translated_content": "<contenu HTML traduit>",
  "translated_excerpt": "Extrait traduit",
  "translated_seo": {"title": "Meta title traduit", "description": "Meta description traduite", "keywords": ["mot-clé traduit"]},
  "cultural_adaptations": ["adaptation culturelle effectuée"]
}`,

  'summarize': `Tu es un expert en synthèse de contenu.

Réponds en JSON:
{
  "summary": "Résumé court (50 mots)",
  "key_points": ["Point clé 1", "Point clé 2"],
  "executive_summary": "Résumé exécutif (100 mots)",
  "tl_dr": "Version ultra-courte (20 mots)"
}`,

  'generate-carousel': `Tu es un expert en création de contenu visuel pour réseaux sociaux.

Réponds TOUJOURS en JSON:
{
  "slides": [{"title": "Titre accrocheur (max 50 chars)", "subtitle": "Sous-titre (max 80 chars)", "content": "Contenu (max 150 chars)", "bullet_points": ["Point 1"], "cta": "Call-to-action", "slide_type": "intro|content|stats|quote|cta|conclusion"}],
  "carousel_title": "Titre global du carrousel",
  "hashtags": ["#hashtag1"],
  "caption": "Légende pour accompagner le carrousel",
  "platform_tips": {"linkedin": "Conseil LinkedIn", "instagram": "Conseil Instagram"},
  "color_suggestion": {"primary": "#hex", "secondary": "#hex", "accent": "#hex"}
}`,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json() as Record<string, unknown>;
    const action = body.action as AIRequest['action'];
    const payload = (body.payload ?? body.data ?? {}) as Record<string, unknown>;

    console.log(`Blog AI action: ${action}`);

    // Image generation — use DALL-E 3
    if (action === 'generate-image') {
      const prompt = (payload.prompt || payload.title || 'Professional blog image for SaaS platform') as string;

      const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: `${prompt}. Style: professional SaaS blog cover, modern, clean design, violet and blue palette, Nectforma branding. 16:9 aspect ratio.`,
          n: 1,
          size: '1792x1024',
          quality: 'standard',
          response_format: 'url',
        }),
      });

      if (!imageResponse.ok) {
        const errText = await imageResponse.text();
        console.error('DALL-E error:', imageResponse.status, errText);
        return new Response(
          JSON.stringify({ error: "Erreur lors de la génération de l'image" }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const imageData = await imageResponse.json();
      const imageUrl = imageData.data?.[0]?.url;

      if (!imageUrl) {
        return new Response(
          JSON.stringify({ error: 'Aucune image générée' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Upload to Supabase Storage if service role key is available
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      if (serviceKey && supabaseUrl) {
        try {
          const supabaseAdmin = createClient(supabaseUrl, serviceKey);
          const imgRes = await fetch(imageUrl);
          const imgBuffer = await imgRes.arrayBuffer();
          const fileName = `blog-images/${Date.now()}-${Math.random().toString(36).substring(7)}.png`;

          const { error: uploadError } = await supabaseAdmin.storage
            .from('blog-assets')
            .upload(fileName, imgBuffer, { contentType: 'image/png', upsert: false });

          if (!uploadError) {
            const { data: publicUrlData } = supabaseAdmin.storage.from('blog-assets').getPublicUrl(fileName);
            return new Response(
              JSON.stringify({ success: true, imageUrl: publicUrlData.publicUrl }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } catch (uploadErr) {
          console.error('Storage upload failed, returning direct URL:', uploadErr);
        }
      }

      return new Response(
        JSON.stringify({ success: true, imageUrl }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = SYSTEM_PROMPTS[action as keyof typeof SYSTEM_PROMPTS];
    if (!systemPrompt) {
      return new Response(
        JSON.stringify({ error: `Unknown action: ${action}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build user message
    let userMessage = '';
    switch (action) {
      case 'generate-article':
        userMessage = `Génère un article de blog TRÈS LONG et DÉTAILLÉ (minimum 3000 mots) avec ces paramètres:
- Sujet: ${payload.topic}
- Audience cible: ${payload.audience || 'Responsables formation, RH, dirigeants de centres de formation'}
- Ton: ${payload.tone || 'Professionnel et éducatif'}
- Langue: ${payload.language || 'Français'}
- Mots-clés cibles: ${(payload.keywords as string[])?.join(', ') || 'gestion formation, digitalisation'}
- Catégorie: ${payload.category || 'Formation professionnelle'}
Instructions supplémentaires: ${payload.instructions || 'Aucune'}`;
        break;
      case 'optimize-seo':
        userMessage = `Analyse et optimise le SEO de cet article:\nTitre: ${payload.title}\nMeta description: ${payload.seo_description || 'Non définie'}\nMots-clés: ${(payload.seo_keywords as string[])?.join(', ') || 'Aucun'}\nContenu:\n${payload.content}`;
        break;
      case 'suggest-topics':
        userMessage = `Suggère des idées d'articles pour Nectforma.\nArticles existants: ${(payload.existing_topics as string[])?.join(', ') || 'Aucun'}\nPériode: ${payload.period || '3 mois'}\nNombre d'idées: ${payload.count || 10}`;
        break;
      case 'rewrite-content':
        userMessage = `Réécris ce contenu.\nMode: ${payload.mode || 'improve'}\nTon: ${payload.tone || 'Professionnel'}\n\nContenu original:\n${payload.content}`;
        break;
      case 'generate-social':
        userMessage = `Génère des posts réseaux sociaux à partir de:\nTitre: ${payload.title}\nExtrait: ${payload.excerpt}\nURL: ${payload.url || 'https://nectforma.com/blog'}`;
        break;
      case 'analyze-performance':
        userMessage = `Analyse les performances:\nTitre: ${payload.title}\nVues: ${payload.views || 0}\nTaux de rebond: ${payload.bounce_rate || 'N/A'}\nContenu:\n${payload.content}`;
        break;
      case 'suggest-schedule':
        userMessage = `Suggère le meilleur moment de publication.\nType: ${payload.content_type || 'Article'}\nAudience: ${payload.audience || 'B2B formation'}`;
        break;
      case 'generate-image-prompt':
        userMessage = `Génère des prompts d'images pour:\nTitre: ${payload.title}\nCatégorie: ${payload.category || 'Formation professionnelle'}`;
        break;
      case 'translate':
        userMessage = `Traduis en ${payload.target_language || 'Anglais'}:\nTitre: ${payload.title}\nContenu:\n${payload.content}`;
        break;
      case 'summarize':
        userMessage = `Résume cet article:\nTitre: ${payload.title}\nContenu:\n${payload.content}`;
        break;
      case 'generate-carousel': {
        const slideCount = Number(payload.slideCount ?? payload.slide_count ?? 5) || 5;
        userMessage = `Génère un carrousel de ${slideCount} slides.\nSujet: ${payload.topic || payload.title}\nPlateforme: ${payload.platform || 'LinkedIn'}\nTon: ${payload.tone || 'Professionnel'}`;
        break;
      }
      default:
        userMessage = JSON.stringify(payload);
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 8000,
        response_format: action === 'generate-article' || action === 'optimize-seo' || action === 'suggest-topics' || action === 'generate-carousel' ? { type: 'json_object' } : undefined,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI error: ${response.status}`, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requêtes atteinte, réessayez plus tard.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ error: 'Erreur du service AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Réponse AI vide' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let parsedResult;
    try {
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) cleanContent = cleanContent.slice(7);
      else if (cleanContent.startsWith('```')) cleanContent = cleanContent.slice(3);
      if (cleanContent.endsWith('```')) cleanContent = cleanContent.slice(0, -3);
      parsedResult = JSON.parse(cleanContent.trim());
    } catch {
      parsedResult = { raw_content: content };
    }

    return new Response(
      JSON.stringify({ success: true, data: parsedResult }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Blog AI error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erreur inconnue' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
