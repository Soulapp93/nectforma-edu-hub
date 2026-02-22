import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const supabaseAdmin = () => createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// ─── STEP 1: Detect trending topics via Perplexity ───
async function detectTrends(topics: string[]): Promise<{ topic: string; context: string; sources: string[] }> {
  const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
  if (!PERPLEXITY_API_KEY) throw new Error('PERPLEXITY_API_KEY not configured');

  const topicsList = topics.join(', ');
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: 'Tu es un analyste de tendances spécialisé EdTech, formation professionnelle et SaaS éducation. Réponds TOUJOURS en JSON valide.'
        },
        {
          role: 'user',
          content: `Identifie LE sujet tendance le plus pertinent aujourd'hui pour un blog SaaS de gestion de formation (Nectforma). 
Domaines à explorer: ${topicsList}.
Cherche les actualités, réglementations, tendances du moment.

Réponds en JSON:
{
  "topic": "Le sujet tendance choisi (titre d'article potentiel)",
  "context": "Contexte détaillé (200 mots) expliquant pourquoi ce sujet est tendance et pertinent",
  "keywords": ["mot-clé1", "mot-clé2", "mot-clé3"],
  "angle": "L'angle éditorial recommandé"
}`
        }
      ],
      search_recency_filter: 'week',
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Perplexity error:', response.status, err);
    throw new Error(`Perplexity API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  const sources = data.citations || [];

  let parsed;
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
  } catch {
    parsed = { topic: content.substring(0, 100), context: content, keywords: [] };
  }

  return {
    topic: parsed.topic || 'Formation professionnelle: tendances actuelles',
    context: parsed.context || content,
    sources,
  };
}

// ─── STEP 2: Scrape additional context via Firecrawl ───
async function scrapeContext(topic: string): Promise<string> {
  const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
  if (!FIRECRAWL_API_KEY) {
    console.log('Firecrawl not configured, skipping scraping');
    return '';
  }

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `${topic} formation professionnelle EdTech France`,
        limit: 3,
        lang: 'fr',
        tbs: 'qdr:w',
        scrapeOptions: { formats: ['markdown'] },
      }),
    });

    if (!response.ok) {
      console.error('Firecrawl search error:', response.status);
      return '';
    }

    const data = await response.json();
    const results = data.data || [];
    return results
      .map((r: any) => `Source: ${r.url}\n${(r.markdown || r.description || '').substring(0, 500)}`)
      .join('\n\n---\n\n');
  } catch (e) {
    console.error('Firecrawl error:', e);
    return '';
  }
}

// ─── STEP 3: Generate ALL content simultaneously via Lovable AI ───
async function generateMultiChannelContent(topic: string, context: string, scrapedContent: string, tone: string): Promise<any> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        {
          role: 'system',
          content: `Tu es un expert en content marketing multi-canal pour Nectforma, une plateforme SaaS de gestion de formation professionnelle.
Ton: ${tone}.
Tu dois générer SIMULTANÉMENT un article de blog ET du contenu adapté pour chaque réseau social.

RÈGLES DE CAPITALISATION STRICTES:
- Utilise la capitalisation de type "phrase" (sentence-case) PARTOUT
- Seule la première lettre de chaque phrase/titre est en majuscule
- JAMAIS de majuscule en milieu de phrase sauf noms propres (Nectforma, France, Qualiopi, etc.)
- Exemples corrects: "Comment digitaliser votre gestion de formation", "Les tendances clés de la formation en 2025"
- Exemples incorrects: "Comment Digitaliser Votre Gestion De Formation", "Les Tendances Clés"

RÈGLES POUR L'ILLUSTRATION DE COUVERTURE:
- Chaque article DOIT avoir un champ "cover_image_prompt" UNIQUE et DIFFÉRENT
- VARIE les types d'illustrations: infographies, schémas de processus, cartographies conceptuelles, tableaux de bord, diagrammes, mind maps, graphiques comparatifs, flux de données, architectures système, illustrations de personnages, icônes 3D thématiques
- NE RÉPÈTE JAMAIS le même style d'illustration entre les articles
- Utilise des couleurs vives et une palette violette/bleue cohérente avec Nectforma

Tu dois TOUJOURS répondre en JSON valide.`
        },
        {
          role: 'user',
          content: `Génère un contenu COMPLET multi-canal sur ce sujet tendance:

SUJET: ${topic}

CONTEXTE TENDANCE:
${context}

${scrapedContent ? `SOURCES WEB RÉCENTES:\n${scrapedContent.substring(0, 2000)}` : ''}

Réponds en JSON avec cette structure EXACTE:
{
  "article": {
    "title": "Titre optimisé SEO en sentence-case (max 60 chars)",
    "seo_title": "Meta title (max 60 chars)",
    "seo_description": "Meta description (max 160 chars)",
    "slug": "url-slug-optimise",
    "excerpt": "Résumé accrocheur (max 200 chars)",
    "content": "<article HTML TRÈS LONG avec h2, h3, p, ul, li, strong, em, highlight-box, stat-box, info-box, warning-box, schema-box, tableaux - min 2000 mots>",
    "seo_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
    "cover_image_prompt": "Description UNIQUE et DÉTAILLÉE pour générer une illustration originale. VARIE le style: infographie, schéma de processus, cartographie, mind map, diagramme, tableau de bord, illustration 3D isométrique, graphique comparatif. Palette violette et bleue, style SaaS moderne."
  },
  "linkedin": {
    "caption": "Post LinkedIn professionnel (max 1500 chars) avec emojis et hashtags",
    "hashtags": ["#EdTech", "#Formation", "#Nectforma"],
    "carousel": {
      "slides": [
        {
          "slide_number": 1,
          "title": "Titre accrocheur de couverture",
          "subtitle": "Sous-titre",
          "content": "Texte court",
          "type": "cover"
        },
        {
          "slide_number": 2,
          "title": "Point clé 1",
          "subtitle": "",
          "content": "Explication concise du point",
          "bullet_points": ["Point A", "Point B", "Point C"],
          "type": "content"
        },
        {
          "slide_number": 3,
          "title": "Point clé 2",
          "subtitle": "",
          "content": "Explication",
          "bullet_points": ["Point A", "Point B"],
          "type": "content"
        },
        {
          "slide_number": 4,
          "title": "Point clé 3",
          "subtitle": "",
          "content": "Explication",
          "bullet_points": ["Point A", "Point B"],
          "type": "content"
        },
        {
          "slide_number": 5,
          "title": "Statistique clé",
          "subtitle": "Chiffre marquant",
          "content": "Contexte du chiffre",
          "type": "stat"
        },
        {
          "slide_number": 6,
          "title": "Passez à l'action",
          "subtitle": "Découvrez Nectforma",
          "content": "CTA engageant",
          "type": "cta"
        }
      ]
    }
  },
  "instagram": {
    "caption": "Caption Instagram engageante avec emojis (max 2200 chars)",
    "hashtags": ["#EdTech", "#Formation", "#DigitalLearning", "#Nectforma"],
    "carousel": {
      "slides": [
        {
          "slide_number": 1,
          "title": "Titre visuel accrocheur",
          "content": "Texte court et impactant",
          "type": "cover",
          "color_accent": "#8B5CF6"
        },
        {
          "slide_number": 2,
          "title": "Saviez-vous que...",
          "content": "Fait surprenant ou statistique",
          "type": "fact"
        },
        {
          "slide_number": 3,
          "title": "La solution",
          "content": "Comment résoudre le problème",
          "bullet_points": ["Étape 1", "Étape 2", "Étape 3"],
          "type": "solution"
        },
        {
          "slide_number": 4,
          "title": "Résultat",
          "content": "Ce que vous obtenez",
          "type": "result"
        },
        {
          "slide_number": 5,
          "title": "Suivez-nous !",
          "content": "Pour plus de conseils formation",
          "type": "cta"
        }
      ]
    }
  },
  "tiktok": {
    "caption": "Caption TikTok courte et punchy (max 300 chars)",
    "hashtags": ["#EdTech", "#Formation", "#ApprendreAutrement", "#fyp"],
    "video_script": {
      "hook": "Les 3 premières secondes qui captent l'attention (question choc ou fait surprenant)",
      "scenes": [
        { "duration_seconds": 3, "text": "Hook visuel", "action": "Texte à l'écran avec zoom rapide" },
        { "duration_seconds": 5, "text": "Le problème", "action": "Description du problème courant" },
        { "duration_seconds": 5, "text": "La solution", "action": "Présentation de la solution" },
        { "duration_seconds": 4, "text": "Le résultat", "action": "Montrer le bénéfice" },
        { "duration_seconds": 3, "text": "CTA", "action": "Appel à l'action + lien en bio" }
      ],
      "music_suggestion": "Son tendance suggéré",
      "total_duration_seconds": 20
    },
    "carousel": {
      "slides": [
        {
          "slide_number": 1,
          "title": "Titre punchy",
          "content": "Accroche courte",
          "type": "cover"
        },
        {
          "slide_number": 2,
          "title": "Le saviez-vous ?",
          "content": "Fait viral",
          "type": "fact"
        },
        {
          "slide_number": 3,
          "title": "3 astuces",
          "content": "Tips pratiques",
          "bullet_points": ["Astuce 1", "Astuce 2", "Astuce 3"],
          "type": "tips"
        },
        {
          "slide_number": 4,
          "title": "Lien en bio 👆",
          "content": "Découvrez Nectforma",
          "type": "cta"
        }
      ]
    }
  },
  "twitter": {
    "thread": [
      "🧵 Tweet 1/5 - Accroche du thread avec emoji (max 280 chars)",
      "2/5 - Développement du point principal",
      "3/5 - Statistique ou fait marquant",
      "4/5 - Solution ou conseil actionnable",
      "5/5 - CTA + mention @Nectforma + hashtags"
    ],
    "hashtags": ["#EdTech", "#Formation"]
  }
}`
        }
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error('Rate limit exceeded');
    if (response.status === 402) throw new Error('Payment required');
    const err = await response.text();
    throw new Error(`AI generation error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : content);
  } catch {
    throw new Error('Failed to parse AI response as JSON');
  }
}

// ─── STEP 3b: Generate TikTok video via Runway ML ───
async function generateTikTokVideo(videoScript: any, topic: string): Promise<string[]> {
  const RUNWAY_API_KEY = Deno.env.get('RUNWAY_API_KEY');
  if (!RUNWAY_API_KEY) {
    console.log('RUNWAY_API_KEY not configured, skipping video generation');
    return [];
  }

  const sb = supabaseAdmin();
  const scenes = videoScript?.scenes || [];
  if (scenes.length === 0) return [];

  // Build a prompt from the video script
  const sceneDescriptions = scenes
    .map((s: any, i: number) => `Scene ${i + 1} (${s.duration_seconds}s): ${s.text} - ${s.action}`)
    .join('. ');

  const promptText = `A professional, modern, vertical 9:16 short-form video for TikTok about "${topic}". ${sceneDescriptions}. Style: Clean motion graphics, bold text overlays, vibrant colors, dynamic transitions. Professional education/EdTech theme.`;

  console.log('🎬 Starting Runway ML video generation...');

  try {
    // Step 1: Create a text-to-video task
    const createResponse = await fetch('https://api.dev.runwayml.com/v1/text_to_video', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RUNWAY_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-11-06',
      },
      body: JSON.stringify({
        model: 'gen4_turbo',
        promptText: promptText,
        ratio: '720:1280',
        duration: 10,
      }),
    });

    if (!createResponse.ok) {
      const errText = await createResponse.text();
      console.error('Runway create task error:', createResponse.status, errText);
      return [];
    }

    const taskData = await createResponse.json();
    const taskId = taskData.id;
    console.log('🎬 Runway task created:', taskId);

    // Step 2: Poll until completed (max 5 minutes)
    const maxAttempts = 60;
    const pollInterval = 5000; // 5 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const pollResponse = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${RUNWAY_API_KEY}`,
          'X-Runway-Version': '2024-11-06',
        },
      });

      if (!pollResponse.ok) {
        const errText = await pollResponse.text();
        console.error('Runway poll error:', pollResponse.status, errText);
        continue;
      }

      const pollData = await pollResponse.json();
      console.log(`🎬 Runway task status (${attempt + 1}/${maxAttempts}):`, pollData.status);

      if (pollData.status === 'SUCCEEDED') {
        const videoUrl = pollData.output?.[0];
        if (!videoUrl) {
          console.error('Runway task succeeded but no output URL');
          return [];
        }

        console.log('🎬 Runway video ready, downloading...');

        // Step 3: Download the video and upload to storage
        const videoResponse = await fetch(videoUrl);
        if (!videoResponse.ok) {
          console.error('Failed to download video from Runway');
          return [];
        }

        const videoBuffer = await videoResponse.arrayBuffer();
        const fileName = `tiktok-video-${Date.now()}.mp4`;
        const filePath = `tiktok/${fileName}`;

        const { error: uploadError } = await sb.storage
          .from('blog-assets')
          .upload(filePath, videoBuffer, {
            contentType: 'video/mp4',
            upsert: true,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          return [];
        }

        const { data: publicUrl } = sb.storage.from('blog-assets').getPublicUrl(filePath);
        console.log('✅ TikTok video generated and uploaded:', publicUrl.publicUrl);
        return [publicUrl.publicUrl];
      }

      if (pollData.status === 'FAILED' || pollData.status === 'CANCELED') {
        console.error('Runway task failed:', pollData.failure || pollData.failureCode);
        return [];
      }
    }

    console.error('Runway task timed out after polling');
    return [];
  } catch (e) {
    console.error('Runway video generation error:', e);
    return [];
  }
}

// ─── STEP 3c: Auto-publish LinkedIn post ───
async function autoPublishLinkedIn(postId: string): Promise<{ success: boolean; url?: string }> {
  const sb = supabaseAdmin();

  // Check if LinkedIn is connected
  const { data: connection } = await sb
    .from('social_media_connections')
    .select('access_token, token_expires_at, connection_status, page_id, account_id, metadata')
    .eq('platform', 'linkedin')
    .eq('connection_status', 'connected')
    .single();

  if (!connection?.access_token) {
    console.log('⚠️ LinkedIn not connected, skipping auto-publish');
    return { success: false };
  }

  // Check token expiry
  if (connection.token_expires_at && new Date(connection.token_expires_at) < new Date()) {
    console.log('⚠️ LinkedIn token expired, skipping auto-publish');
    return { success: false };
  }

  // Get post data
  const { data: post } = await sb
    .from('social_posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (!post) return { success: false };

  const metadata = connection.metadata as any;
  const organizationId = metadata?.organization_id || connection.page_id;
  const personUrn = metadata?.person_urn;

  const author = organizationId
    ? `urn:li:organization:${organizationId}`
    : personUrn || `urn:li:person:${connection.account_id}`;

  const caption = post.caption + (post.hashtags?.length ? '\n\n' + post.hashtags.join(' ') : '');

  const linkedinPayload: any = {
    author,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: caption },
        shareMediaCategory: 'NONE',
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };

  try {
    const publishResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connection.access_token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(linkedinPayload),
    });

    if (!publishResponse.ok) {
      const errText = await publishResponse.text();
      console.error('LinkedIn auto-publish error:', publishResponse.status, errText);
      await sb.from('social_publication_logs').insert({
        social_post_id: postId,
        platform: 'linkedin',
        action: 'auto_publish',
        status: 'failed',
        error_message: `${publishResponse.status}: ${errText}`,
      });
      return { success: false };
    }

    const publishData = await publishResponse.json();
    const externalPostId = publishData.id || publishResponse.headers.get('x-restli-id') || '';
    const postUrl = `https://www.linkedin.com/feed/update/${externalPostId}`;

    await sb.from('social_posts').update({
      status: 'published',
      published_at: new Date().toISOString(),
      external_post_id: externalPostId,
      external_post_url: postUrl,
      auto_published: true,
    }).eq('id', postId);

    await sb.from('social_publication_logs').insert({
      social_post_id: postId,
      platform: 'linkedin',
      action: 'auto_publish',
      status: 'success',
      details: { external_post_id: externalPostId, post_url: postUrl },
    });

    console.log('✅ LinkedIn post auto-published:', postUrl);
    return { success: true, url: postUrl };
  } catch (e) {
    console.error('LinkedIn auto-publish error:', e);
    return { success: false };
  }
}

// ─── STEP 4: Save article + ALL social posts to DB ───
async function saveMultiChannelContent(
  generated: any,
  trendTopic: string,
  trendSources: string[],
  runId: string,
  autoPublish: boolean
) {
  const sb = supabaseAdmin();
  const article = generated.article || generated;

  const generateSlug = (title: string) => {
    const base = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return `${base}-${Date.now().toString(36)}`;
  };

  // Get author (super admin)
  const { data: superAdmin } = await sb
    .from('platform_user_roles')
    .select('user_id')
    .eq('role', 'super_admin')
    .limit(1)
    .single();

  const authorId = superAdmin?.user_id;
  if (!authorId) throw new Error('No super admin found for authoring');

  // Generate cover image if prompt available
  let coverImageUrl: string | null = null;
  const coverPrompt = article.cover_image_prompt;
  if (coverPrompt) {
    try {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (LOVABLE_API_KEY) {
        console.log('🎨 Generating cover image...');
        const imgResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image',
            messages: [{ role: 'user', content: `Generate a professional blog cover image: ${coverPrompt}. Ultra high resolution, 16:9 aspect ratio, modern SaaS aesthetic with purple and blue palette.` }],
            modalities: ['image', 'text'],
          }),
        });

        if (imgResponse.ok) {
          const imgData = await imgResponse.json();
          const imageUrl = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          
          if (imageUrl?.startsWith('data:')) {
            const base64Match = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
            if (base64Match) {
              const ext = base64Match[1] === 'jpeg' ? 'jpg' : base64Match[1];
              const binaryData = Uint8Array.from(atob(base64Match[2]), (c: string) => c.charCodeAt(0));
              const fileName = `cover-images/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
              
              const { error: uploadError } = await sb.storage
                .from('blog-assets')
                .upload(fileName, binaryData, { contentType: `image/${base64Match[1]}`, upsert: false });

              if (!uploadError) {
                const { data: publicUrlData } = sb.storage.from('blog-assets').getPublicUrl(fileName);
                coverImageUrl = publicUrlData.publicUrl;
                console.log('✅ Cover image generated:', coverImageUrl);
              }
            }
          }
        }
      }
    } catch (imgErr) {
      console.error('Cover image generation failed (non-blocking):', imgErr);
    }
  }

  // Always auto-publish when autopilot is active
  const postData: any = {
    title: article.title,
    slug: generateSlug(article.title || 'article-auto'),
    excerpt: article.excerpt,
    content: article.content,
    seo_title: article.seo_title,
    seo_description: article.seo_description,
    seo_keywords: article.seo_keywords || [],
    author_id: authorId,
    status: 'published',
    published_at: new Date().toISOString(),
    cover_image_url: coverImageUrl,
  };

  const { data: savedPost, error: postError } = await sb
    .from('blog_posts')
    .insert(postData)
    .select()
    .single();

  if (postError) {
    console.error('Error saving post:', postError);
    throw postError;
  }

  console.log('Article saved:', savedPost.id, savedPost.title);

  // Save multi-channel social posts
  let socialCount = 0;
  const channelConfigs = [
    {
      platform: 'linkedin',
      data: generated.linkedin,
      getPost: (d: any) => ({
        caption: d.caption || '',
        hashtags: d.hashtags || [],
        content_type: 'carousel',
        structured_content: d.carousel || {},
        slide_count: d.carousel?.slides?.length || 0,
      })
    },
    {
      platform: 'instagram',
      data: generated.instagram,
      getPost: (d: any) => ({
        caption: d.caption || '',
        hashtags: d.hashtags || [],
        content_type: 'carousel',
        structured_content: d.carousel || {},
        slide_count: d.carousel?.slides?.length || 0,
      })
    },
    {
      platform: 'tiktok',
      data: generated.tiktok,
      getPost: (d: any) => ({
        caption: d.caption || '',
        hashtags: d.hashtags || [],
        content_type: 'video_script',
        structured_content: { carousel: d.carousel || {}, video_script: d.video_script || {} },
        video_script: JSON.stringify(d.video_script || {}),
        slide_count: d.carousel?.slides?.length || 0,
        media_urls: d._media_urls || [],
      })
    },
    {
      platform: 'twitter',
      data: generated.twitter,
      getPost: (d: any) => ({
        caption: (d.thread || [])[0] || '',
        hashtags: d.hashtags || [],
        content_type: 'thread',
        structured_content: { thread: d.thread || [] },
        thread_tweets: d.thread || [],
        slide_count: 0,
      })
    },
  ];

  for (const channel of channelConfigs) {
    if (!channel.data) continue;
    
    const postPayload = channel.getPost(channel.data);
    const { error: socialError } = await sb
      .from('social_posts')
      .insert({
        blog_post_id: savedPost.id,
        platform: channel.platform,
        caption: postPayload.caption,
        hashtags: postPayload.hashtags,
        content_type: postPayload.content_type,
        structured_content: postPayload.structured_content,
        slide_count: postPayload.slide_count,
        video_script: postPayload.video_script || null,
        thread_tweets: postPayload.thread_tweets || [],
        media_urls: postPayload.media_urls || [],
        status: 'draft',
        approval_status: 'pending',
        ai_generated: true,
        created_by: authorId,
      });

    if (socialError) {
      console.error(`Error saving ${channel.platform} post:`, socialError);
    } else {
      socialCount++;
      console.log(`✅ ${channel.platform} content saved`);
    }
  }

  // Update run with results
  await sb
    .from('ai_autopilot_runs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      trend_topic: trendTopic,
      trend_sources: trendSources,
      article_id: savedPost.id,
      social_posts_generated: socialCount,
      metadata: {
        channels: channelConfigs.filter(c => c.data).map(c => c.platform),
        has_carousel: !!(generated.linkedin?.carousel || generated.instagram?.carousel),
        has_video_script: !!generated.tiktok?.video_script,
        has_thread: !!generated.twitter?.thread,
      }
    })
    .eq('id', runId);

  // Update last run timestamp
  await sb
    .from('social_publishing_settings')
    .update({ autopilot_last_run: new Date().toISOString() })
    .limit(1);

  return { articleId: savedPost.id, articleSlug: savedPost.slug, socialCount };
}

// ─── MAIN HANDLER ───
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'run';

    const sb = supabaseAdmin();

    // ── Toggle autopilot ──
    if (action === 'toggle') {
      const { enabled } = body;
      const { data: existing } = await sb.from('social_publishing_settings').select('id').limit(1).single();
      
      if (existing) {
        await sb.from('social_publishing_settings').update({
          autopilot_enabled: enabled,
          emergency_stop: !enabled,
        }).eq('id', existing.id);
      } else {
        await sb.from('social_publishing_settings').insert({
          autopilot_enabled: enabled,
          emergency_stop: !enabled,
        });
      }

      return new Response(
        JSON.stringify({ success: true, autopilot_enabled: enabled }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Get status ──
    if (action === 'status') {
      const { data: settings } = await sb.from('social_publishing_settings').select('*').limit(1).single();
      const { data: runs } = await sb
        .from('ai_autopilot_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      return new Response(
        JSON.stringify({ success: true, settings, runs: runs || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Get social posts for an article ──
    if (action === 'get-social-posts') {
      const { article_id } = body;
      if (!article_id) {
        return new Response(
          JSON.stringify({ success: false, error: 'article_id required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: socialPosts } = await sb
        .from('social_posts')
        .select('*')
        .eq('blog_post_id', article_id)
        .order('platform');

      return new Response(
        JSON.stringify({ success: true, posts: socialPosts || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Update social post approval ──
    if (action === 'approve-post') {
      const { post_id, approved } = body;
      await sb.from('social_posts').update({
        approval_status: approved ? 'approved' : 'rejected',
        approved_at: approved ? new Date().toISOString() : null,
      }).eq('id', post_id);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Test trend detection only ──
    if (action === 'test-trends') {
      const topics = body.topics || ['EdTech', 'Formation professionnelle', 'Digital learning'];
      const trends = await detectTrends(topics);
      return new Response(
        JSON.stringify({ success: true, trends }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Update settings ──
    if (action === 'update-settings') {
      const { topics, tone, frequency, require_approval, auto_publish_enabled } = body;
      const { data: existing } = await sb.from('social_publishing_settings').select('id').limit(1).single();
      
      const updates: any = {};
      if (topics) updates.autopilot_topics = topics;
      if (tone) updates.autopilot_tone = tone;
      if (frequency) updates.autopilot_frequency = frequency;
      if (require_approval !== undefined) updates.require_approval = require_approval;
      if (auto_publish_enabled !== undefined) updates.auto_publish_enabled = auto_publish_enabled;

      if (existing) {
        await sb.from('social_publishing_settings').update(updates).eq('id', existing.id);
      } else {
        await sb.from('social_publishing_settings').insert(updates);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Full autopilot run ──
    if (!body.force) {
      const { data: settings } = await sb.from('social_publishing_settings').select('autopilot_enabled, emergency_stop').limit(1).single();
      if (settings?.emergency_stop) {
        return new Response(
          JSON.stringify({ success: false, error: 'Emergency stop is active' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (!settings?.autopilot_enabled && action !== 'run-once') {
        return new Response(
          JSON.stringify({ success: false, error: 'Autopilot is not enabled' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create run record
    const { data: run, error: runError } = await sb
      .from('ai_autopilot_runs')
      .insert({
        run_type: 'multi_channel_content',
        status: 'running',
        ai_model: 'google/gemini-3-flash-preview',
      })
      .select()
      .single();

    if (runError) throw runError;
    const runId = run.id;

    try {
      const { data: settings } = await sb.from('social_publishing_settings').select('*').limit(1).single();
      const topics = settings?.autopilot_topics || ['EdTech', 'Formation professionnelle', 'SaaS éducation'];
      const tone = settings?.autopilot_tone || 'professionnel';
      const autoPublish = settings?.auto_publish_enabled && !settings?.require_approval;

      console.log('🚀 Multi-channel autopilot run started:', runId);

      // Step 1: Detect trends
      console.log('📊 Step 1: Detecting trends...');
      const trends = await detectTrends(topics);
      console.log('📊 Trend detected:', trends.topic);

      // Step 2: Scrape additional context
      console.log('🔍 Step 2: Scraping context...');
      const scrapedContent = await scrapeContext(trends.topic);

      // Step 3: Generate ALL content simultaneously
      console.log('✍️ Step 3: Generating multi-channel content...');
      const generated = await generateMultiChannelContent(trends.topic, trends.context, scrapedContent, tone);
      console.log('✍️ Content generated for all channels');

      // Step 3b: Generate TikTok video via Runway ML
      let tiktokVideoUrls: string[] = [];
      if (generated.tiktok?.video_script) {
        console.log('🎬 Step 3b: Generating TikTok video via Runway ML...');
        tiktokVideoUrls = await generateTikTokVideo(generated.tiktok.video_script, trends.topic);
        console.log(`🎬 Generated ${tiktokVideoUrls.length} TikTok video(s)`);
      }

      // Attach media_urls to tiktok data
      if (tiktokVideoUrls.length > 0 && generated.tiktok) {
        generated.tiktok._media_urls = tiktokVideoUrls;
      }

      // Step 4: Save everything to database
      console.log('💾 Step 4: Saving multi-channel content...');
      const result = await saveMultiChannelContent(generated, trends.topic, trends.sources, runId, !!autoPublish);
      console.log('✅ Multi-channel autopilot run completed!', result);

      // Step 5: Auto-publish LinkedIn if enabled
      let linkedinPublishResult = { success: false, url: undefined as string | undefined };
      if (autoPublish) {
        console.log('📤 Step 5: Auto-publishing to LinkedIn...');
        const { data: linkedinPost } = await sb
          .from('social_posts')
          .select('id')
          .eq('blog_post_id', result.articleId)
          .eq('platform', 'linkedin')
          .single();

        if (linkedinPost) {
          linkedinPublishResult = await autoPublishLinkedIn(linkedinPost.id);
          console.log('📤 LinkedIn auto-publish result:', linkedinPublishResult.success);
        }
      }

      // Step 6: Send newsletter to all subscribers
      console.log('📧 Step 6: Sending newsletter to subscribers...');
      try {
        const { data: subscribers } = await sb
          .from('newsletter_subscribers')
          .select('email')
          .eq('is_active', true);

        if (subscribers && subscribers.length > 0) {
          const article = generated.article || generated;
          // Use the actual slug saved in the database (result.articleSlug), not the AI-generated one
          const articleUrl = `https://nectforma.com/blog/${result.articleSlug || article.slug || 'article'}`;
          const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
          const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

          // Send individually to include personalized unsubscribe link
          for (let i = 0; i < subscribers.length; i += 50) {
            const batch = subscribers.slice(i, i + 50);
            
            for (const subscriber of batch) {
              const unsubscribeUrl = `${SUPABASE_URL}/functions/v1/unsubscribe-newsletter?email=${encodeURIComponent(subscriber.email)}`;
              
              await fetch(`${SUPABASE_URL}/functions/v1/send-email-brevo`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify({
                  to: subscriber.email,
                  subject: `📰 Nouvel article : ${article.title}`,
                  htmlContent: `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;margin-top:20px;margin-bottom:20px;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:28px 20px;text-align:center;">
      <img src="https://utjdigcdlwqztwmgoomv.supabase.co/storage/v1/object/public/email-assets/logo-nectforma.png?v=2" alt="Nectforma" width="140" style="display:block;margin:0 auto 8px;" />
      <p style="color:rgba(255,255,255,0.85);font-size:13px;margin:8px 0 0;">La newsletter de Nectforma</p>
    </div>
    <!-- Content -->
    <div style="padding:32px 28px;">
      <h1 style="color:#1f2937;font-size:21px;line-height:1.4;margin:0 0 16px;text-align:center;">${article.title}</h1>
      <div style="width:40px;height:3px;background:linear-gradient(135deg,#8B5CF6,#A855F7);margin:0 auto 20px;border-radius:2px;"></div>
      <p style="color:#6b7280;font-size:15px;line-height:1.7;text-align:center;margin:0 0 28px;">${article.excerpt || ''}</p>
      <div style="text-align:center;">
        <a href="${articleUrl}" style="display:inline-block;background:linear-gradient(135deg,#8B5CF6,#A855F7);color:white;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Lire l'article</a>
      </div>
    </div>
    <!-- Footer -->
    <div style="background:#f9fafb;padding:20px 28px;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0 0 8px;line-height:1.5;">Vous recevez cet email car vous êtes inscrit à la newsletter Nectforma.</p>
      <a href="${unsubscribeUrl}" style="color:#8B5CF6;font-size:12px;text-decoration:underline;">Se désinscrire de la newsletter</a>
      <p style="color:#d1d5db;font-size:11px;margin:12px 0 0;">© ${new Date().getFullYear()} Nectforma — Tous droits réservés</p>
    </div>
  </div>
</body>
</html>`,
                  tags: ['newsletter', 'autopilot'],
                }),
              });
            }
            console.log(`📧 Newsletter batch sent to ${batch.length} subscribers`);
          }
        }
      } catch (newsletterErr) {
        console.error('Newsletter sending failed (non-blocking):', newsletterErr);
      }

      return new Response(
        JSON.stringify({
          success: true,
          runId,
          articleId: result.articleId,
          socialPostsGenerated: result.socialCount,
          topic: trends.topic,
          autoPublished: !!autoPublish,
          linkedinPublished: linkedinPublishResult.success,
          linkedinUrl: linkedinPublishResult.url,
          channels: ['article', 'linkedin', 'instagram', 'tiktok', 'twitter'],
          newsletterSent: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Autopilot run failed:', error);
      await sb
        .from('ai_autopilot_runs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', runId);

      return new Response(
        JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Run failed', runId }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Content autopilot error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
