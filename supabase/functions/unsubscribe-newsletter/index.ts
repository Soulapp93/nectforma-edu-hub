import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email");

    if (!email) {
      return new Response(renderPage("Erreur", "Lien de désinscription invalide.", false), {
        status: 400,
        headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from("newsletter_subscribers")
      .update({ is_active: false, unsubscribed_at: new Date().toISOString() })
      .eq("email", email.toLowerCase())
      .eq("is_active", true);

    if (error) {
      console.error("Unsubscribe error:", error);
      return new Response(renderPage("Erreur", "Une erreur est survenue. Veuillez réessayer.", false), {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
      });
    }

    return new Response(
      renderPage("Désinscription confirmée", "Vous avez été désinscrit de la newsletter Nectforma. Vous ne recevrez plus nos emails.", true),
      {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
      }
    );
  } catch (err) {
    console.error("Unsubscribe error:", err);
    return new Response(renderPage("Erreur", "Une erreur inattendue est survenue.", false), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
    });
  }
});

function renderPage(title: string, message: string, success: boolean): string {
  const icon = success
    ? `<div style="width:64px;height:64px;border-radius:50%;background:#10b981;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
       </div>`
    : `<div style="width:64px;height:64px;border-radius:50%;background:#ef4444;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
       </div>`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Nectforma</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f3f4f6;display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <div style="max-width:440px;margin:20px;padding:40px;background:white;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);text-align:center;">
    ${icon}
    <h1 style="color:#1f2937;font-size:22px;margin-bottom:12px;">${title}</h1>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;">${message}</p>
    <a href="https://nectforma.com" style="display:inline-block;margin-top:24px;background:linear-gradient(135deg,#1e1e5a,#2a2a70);color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Retour à Nectforma</a>
  </div>
</body>
</html>`;
}
