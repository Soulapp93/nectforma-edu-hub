import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ValidateActivationTokenRequest {
  token: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token }: ValidateActivationTokenRequest = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log("[validate-activation-token] 🔎 Validating token:", token.substring(0, 8) + "...");

    const nowIso = new Date().toISOString();
    
    // Step 1: Get the token data
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from("user_activation_tokens")
      .select("user_id, token, expires_at, used_at")
      .eq("token", token)
      .is("used_at", null)
      .gt("expires_at", nowIso)
      .single();

    if (tokenError || !tokenData) {
      console.warn("[validate-activation-token] ❌ Invalid/expired token", { tokenError: tokenError?.message });
      return new Response(
        JSON.stringify({ error: "Token d'activation invalide ou expiré" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log("[validate-activation-token] ✅ Token valid, fetching user:", tokenData.user_id);

    // Step 2: Try to get user from users table first
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, email, first_name, last_name, role, establishment_id")
      .eq("id", tokenData.user_id)
      .maybeSingle();

    // Step 2b: If not found in users, try tutors table
    let isTutor = false;
    let resolvedUser: { id: string; email: string; first_name: string; last_name: string; role: string; establishment_id: string | null } | null = null;

    if (userData) {
      resolvedUser = userData;
    } else {
      console.log("[validate-activation-token] 🔄 User not in users table, checking tutors...");
      const { data: tutorData, error: tutorError } = await supabaseAdmin
        .from("tutors")
        .select("id, email, first_name, last_name, establishment_id")
        .eq("id", tokenData.user_id)
        .maybeSingle();

      if (tutorData) {
        isTutor = true;
        resolvedUser = {
          id: tutorData.id,
          email: tutorData.email,
          first_name: tutorData.first_name,
          last_name: tutorData.last_name,
          role: "Tuteur",
          establishment_id: tutorData.establishment_id,
        };
        console.log("[validate-activation-token] ✅ Found tutor:", tutorData.email);
      } else {
        console.warn("[validate-activation-token] ❌ User not found in users or tutors", { userError: userError?.message, tutorError: tutorError?.message });
        return new Response(
          JSON.stringify({ error: "Utilisateur introuvable" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Step 3: Get establishment name
    let establishmentName = "NECTFORMA";
    if (resolvedUser.establishment_id) {
      const { data: estData } = await supabaseAdmin
        .from("establishments")
        .select("name")
        .eq("id", resolvedUser.establishment_id)
        .single();
      if (estData?.name) {
        establishmentName = estData.name;
      }
    }

    console.log("[validate-activation-token] ✅ User found:", resolvedUser.email, isTutor ? "(tutor)" : "");

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: resolvedUser.id,
          email: resolvedUser.email,
          first_name: resolvedUser.first_name,
          last_name: resolvedUser.last_name,
          role: resolvedUser.role,
          establishment_id: resolvedUser.establishment_id,
          establishment_name: establishmentName,
          is_tutor: isTutor,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[validate-activation-token] ❌ Critical error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
