import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetPasswordRequest {
  email: string;
  redirect_url?: string;
}

const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    'Admin': 'Administrateur',
    'AdminPrincipal': 'Administrateur Principal',
    'Formateur': 'Formateur',
    'Étudiant': 'Étudiant',
    'Tuteur': 'Tuteur',
  };
  return labels[role] || role;
};

// Logo removed - using text-only header

const sendEmailWithBrevo = async (to: string, subject: string, htmlContent: string) => {
  const brevoApiKey = Deno.env.get("BREVO_API_KEY");
  if (!brevoApiKey) {
    throw new Error("BREVO_API_KEY non configurée");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": brevoApiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: "NECTFORMA",
        email: "noreply@nectforma.com",
      },
      to: [{ email: to }],
      subject: subject,
      htmlContent: htmlContent,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error("[reset-password-native] ❌ Brevo API error:", errorData);
    throw new Error(`Brevo API error: ${response.status} - ${errorData}`);
  }

  return await response.json();
};

// Build the branded email header
const emailHeader = `
  <div style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 50%, #9333EA 100%); padding: 32px 30px; text-align: center;">
    <span style="color:#ffffff;font-size:28px;font-weight:800;letter-spacing:3px;text-transform:uppercase;font-family:'Segoe UI',Arial,sans-serif;">NECTFORMA</span>
  </div>
`;

// Build the branded email footer
const emailFooter = (year: number) => `
  <div style="background-color: #f8f7ff; padding: 24px 30px; border-top: 1px solid #e5e7eb;">
    <p style="color: #4a4a4a; font-size: 14px; margin: 0 0 12px; font-weight: 600;">
      🔒 Sécurité & confidentialité
    </p>
    <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 0;">
      📄 <a href="https://nectforma.com/cgu" target="_blank" style="color: #8B5CF6; text-decoration: none;">Conditions Générales d'Utilisation</a><br>
      🔐 <a href="https://nectforma.com/politique-confidentialite" target="_blank" style="color: #8B5CF6; text-decoration: none;">Politique de Confidentialité</a>
    </p>
  </div>
  <div style="background-color: #1a1a2e; padding: 32px 30px; text-align: center;">
    <p style="color: #ffffff; font-size: 14px; margin: 0 0 8px; font-weight: 500;">
      Cordialement,<br>
      L'équipe Nectforma
    </p>
    <p style="color: rgba(255,255,255,0.7); font-size: 13px; margin: 8px 0 16px;">
      Plateforme intelligente de gestion de formation
    </p>
    <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; margin-top: 16px;">
      <p style="color: rgba(255,255,255,0.6); font-size: 12px; margin: 0;">
        🌐 <a href="https://nectforma.com" style="color: #a78bfa; text-decoration: none;">https://nectforma.com</a><br>
        📩 <a href="mailto:contact@nectforma.com" style="color: #a78bfa; text-decoration: none;">contact@nectforma.com</a>
      </p>
    </div>
    <p style="color: rgba(255,255,255,0.4); font-size: 11px; margin-top: 16px;">
      © ${year} NECTFORMA. Tous droits réservés.
    </p>
  </div>
`;

const buildResetEmail = (firstName: string, lastName: string, establishmentName: string, resetLink: string) => {
  const year = new Date().getFullYear();
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        ${emailHeader}
        <div style="padding: 40px 30px;">
          <h2 style="color: #1a1a1a; margin: 0 0 24px; font-size: 24px; font-weight: 600;">
            Réinitialisation du mot de passe 🔐
          </h2>
          <p style="color: #4a4a4a; line-height: 1.7; font-size: 16px; margin-bottom: 20px;">
            Bonjour <strong>${firstName} ${lastName}</strong>,
          </p>
          <p style="color: #4a4a4a; line-height: 1.7; font-size: 16px; margin-bottom: 20px;">
            Vous avez demandé la réinitialisation de votre mot de passe sur <strong style="color: #8B5CF6;">${establishmentName}</strong>.
          </p>
          <p style="color: #4a4a4a; line-height: 1.7; font-size: 16px; margin-bottom: 8px;">
            👉 Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetLink}" 
               style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4);">
              🔑 Réinitialiser mon mot de passe
            </a>
          </div>
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px 20px; margin: 24px 0;">
            <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 500;">
              ⚠️ Ce lien expire dans <strong>15 minutes</strong> pour des raisons de sécurité.<br>
              Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
            </p>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 0;">
            Votre mot de passe actuel restera inchangé si vous n'utilisez pas ce lien.
          </p>
        </div>
        ${emailFooter(year)}
      </div>
      <div style="max-width: 600px; margin: 16px auto 0; text-align: center;">
        <p style="color: #9ca3af; font-size: 11px;">
          Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
          <a href="${resetLink}" style="color: #8B5CF6; word-break: break-all; font-size: 10px;">${resetLink}</a>
        </p>
      </div>
    </body>
    </html>
  `;
};

const buildActivationEmail = (firstName: string, lastName: string, role: string, establishmentName: string, activationLink: string) => {
  const year = new Date().getFullYear();
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        ${emailHeader}
        <div style="padding: 40px 30px;">
          <h2 style="color: #1a1a1a; margin: 0 0 24px; font-size: 24px; font-weight: 600;">
            Activation de votre compte
          </h2>
          <p style="color: #4a4a4a; line-height: 1.7; font-size: 16px; margin-bottom: 20px;">
            Bonjour <strong>${firstName} ${lastName}</strong>,
          </p>
          <p style="color: #4a4a4a; line-height: 1.7; font-size: 16px; margin-bottom: 20px;">
            Bienvenue sur <strong style="color: #8B5CF6;">${establishmentName}</strong> — Nectforma 🎓
          </p>
          <p style="color: #4a4a4a; line-height: 1.7; font-size: 16px; margin-bottom: 20px;">
            Votre compte <strong>${getRoleLabel(role)}</strong> n'est pas encore activé.<br>
            Pour accéder à votre espace personnel et commencer à utiliser la plateforme, veuillez activer votre compte en définissant votre mot de passe.
          </p>
          <p style="color: #4a4a4a; line-height: 1.7; font-size: 16px; margin-bottom: 8px;">
            👉 Cliquez sur le bouton ci-dessous pour activer votre compte en toute sécurité :
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${activationLink}" 
               style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4);">
              🔐 Activer mon compte
            </a>
          </div>
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px 20px; margin: 24px 0;">
            <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 500;">
              ⏳ Ce lien est valide pendant 7 jours.
            </p>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 0;">
            Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité.
          </p>
        </div>
        ${emailFooter(year)}
      </div>
      <div style="max-width: 600px; margin: 16px auto 0; text-align: center;">
        <p style="color: #9ca3af; font-size: 11px;">
          Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
          <a href="${activationLink}" style="color: #8B5CF6; word-break: break-all; font-size: 10px;">${activationLink}</a>
        </p>
      </div>
    </body>
    </html>
  `;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    console.log("[reset-password-native] 🔄 Request received");
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const body: ResetPasswordRequest = await req.json();
    const { email, redirect_url } = body;

    // --- Authorization check ---
    const authHeader = req.headers.get("Authorization");
    const isSelfServiceReset = !authHeader;

    if (!isSelfServiceReset) {
      const callerToken = authHeader!.replace("Bearer ", "");
      const supabaseCaller = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader! } },
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data: claimsData, error: claimsError } = await supabaseCaller.auth.getClaims(callerToken);

      if (claimsError || !claimsData?.claims) {
        return new Response(
          JSON.stringify({ error: "Non autorisé" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const callerId = claimsData.claims.sub;

      const { data: callerProfile } = await supabaseAdmin
        .from("users")
        .select("role, establishment_id")
        .eq("id", callerId)
        .single();

      if (!callerProfile || !["Admin", "AdminPrincipal"].includes(callerProfile.role)) {
        return new Response(
          JSON.stringify({ error: "Droits insuffisants" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (email) {
        const { data: targetUsers } = await supabaseAdmin
          .from("users")
          .select("establishment_id")
          .eq("email", email.toLowerCase())
          .limit(1);

        const targetUser = targetUsers && targetUsers.length > 0 ? targetUsers[0] : null;
        if (targetUser && targetUser.establishment_id !== callerProfile.establishment_id) {
          return new Response(
            JSON.stringify({ error: "Impossible de réinitialiser le mot de passe d'un utilisateur d'un autre établissement" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    console.log(`[reset-password-native] 📧 Processing reset for email: ${email}`);

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = redirect_url || `${req.headers.get("origin") || "https://nectforma.com"}`;

    // ===== STEP 1: Search in public.users =====
    const { data: usersData } = await supabaseAdmin
      .from("users")
      .select("id, email, first_name, last_name, role, is_activated, status, establishment_id")
      .eq("email", email.toLowerCase())
      .order("created_at", { ascending: false })
      .limit(1);
    
    const userData = usersData && usersData.length > 0 ? usersData[0] : null;

    if (userData) {
      console.log(`[reset-password-native] 👤 User found in public.users: ${userData.first_name} ${userData.last_name}, role: ${userData.role}`);
      return await handleUserReset(supabaseAdmin, userData, userData.role, baseUrl, email);
    }

    // ===== STEP 2: Search in public.tutors =====
    console.log(`[reset-password-native] 🔍 User not found in public.users, searching tutors...`);
    const { data: tutorsData } = await supabaseAdmin
      .from("tutors")
      .select("id, email, first_name, last_name, is_activated, establishment_id")
      .eq("email", email.toLowerCase())
      .order("created_at", { ascending: false })
      .limit(1);

    const tutorData = tutorsData && tutorsData.length > 0 ? tutorsData[0] : null;

    if (tutorData) {
      console.log(`[reset-password-native] 👤 User found in public.tutors: ${tutorData.first_name} ${tutorData.last_name}`);
      const tutorAsUser = {
        ...tutorData,
        role: 'Tuteur',
        status: tutorData.is_activated ? 'Actif' : 'En attente',
      };
      return await handleUserReset(supabaseAdmin, tutorAsUser, 'Tuteur', baseUrl, email);
    }

    // ===== STEP 3: Search in auth.users (SuperAdmin without profile) =====
    console.log(`[reset-password-native] 🔍 User not found in tutors, searching auth.users...`);
    try {
      const { data: authUsersData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1,
      });

      // listUsers doesn't support email filter, so search manually
      let authUser = null;
      if (!authError && authUsersData?.users) {
        authUser = authUsersData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      }

      // If not found in first page, try broader search
      if (!authUser && !authError) {
        const { data: allUsersData } = await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });
        if (allUsersData?.users) {
          authUser = allUsersData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
        }
      }

      if (authUser) {
        console.log(`[reset-password-native] 👤 User found in auth.users (SuperAdmin/auth-only): ${authUser.email}`);
        
        // Use Supabase native recovery link for auth-only users
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: authUser.email!,
          options: {
            redirectTo: `${baseUrl}/reset-password`,
          },
        });

        if (linkError) {
          console.error("[reset-password-native] ❌ generateLink error:", linkError);
          return new Response(
            JSON.stringify({ success: true, message: "Si l'email existe, un lien de réinitialisation a été envoyé" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const recoveryLink = linkData?.properties?.action_link;
        if (!recoveryLink) {
          console.error("[reset-password-native] ❌ No action_link returned from generateLink");
          return new Response(
            JSON.stringify({ success: true, message: "Si l'email existe, un lien de réinitialisation a été envoyé" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Extract name from user metadata or fallback
        const firstName = (authUser.user_metadata?.first_name || authUser.user_metadata?.firstName || 'Utilisateur') as string;
        const lastName = (authUser.user_metadata?.last_name || authUser.user_metadata?.lastName || '') as string;

        const htmlContent = buildResetEmail(firstName, lastName, 'NECTFORMA', recoveryLink);

        const emailResult = await sendEmailWithBrevo(
          email,
          `Réinitialisation de votre mot de passe - NECTFORMA`,
          htmlContent
        );

        console.log(`[reset-password-native] ✅ SuperAdmin reset email sent via Brevo`, { messageId: emailResult.messageId });

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Lien de réinitialisation envoyé avec succès",
            email_id: emailResult.messageId
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (authSearchError) {
      console.error("[reset-password-native] ⚠️ Error searching auth.users:", authSearchError);
    }

    // ===== Not found anywhere =====
    console.log(`[reset-password-native] ⚠️ User not found in any table for email: ${email}`);
    return new Response(
      JSON.stringify({ success: true, message: "Si l'email existe, un lien de réinitialisation a été envoyé" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[reset-password-native] ❌ Critical error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Handle reset for users found in public.users or public.tutors
async function handleUserReset(
  supabaseAdmin: any,
  userData: { id: string; first_name: string; last_name: string; role: string; is_activated: boolean; status?: string; establishment_id: string },
  role: string,
  baseUrl: string,
  email: string
) {
  // Get establishment name
  const { data: establishment } = await supabaseAdmin
    .from('establishments')
    .select('name')
    .eq('id', userData.establishment_id)
    .single();

  const establishmentName = establishment?.name || 'NECTFORMA';

  const statusRaw = (userData.status || "").toString();
  const isPendingStatus = ["pending", "en attente", "En attente"].includes(statusRaw) || statusRaw.toLowerCase() === "en attente";

  // If user is not activated, resend activation email instead
  if (!userData.is_activated || isPendingStatus) {
    console.log(`[reset-password-native] 📨 User not activated, sending activation email instead`);

    await supabaseAdmin
      .from('user_activation_tokens')
      .delete()
      .eq('user_id', userData.id);

    const activationToken = crypto.randomUUID() + '-' + Date.now();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const { error: tokenError } = await supabaseAdmin
      .from('user_activation_tokens')
      .insert({
        user_id: userData.id,
        token: activationToken,
        expires_at: expiresAt.toISOString()
      });

    if (tokenError) {
      console.error("[reset-password-native] ❌ Token creation error:", tokenError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la création du token d'activation" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const activationLink = `${baseUrl}/activation?token=${activationToken}`;
    const htmlContent = buildActivationEmail(userData.first_name, userData.last_name, role, establishmentName, activationLink);

    try {
      const emailResult = await sendEmailWithBrevo(
        email,
        `Activez votre compte ${establishmentName} - NECTFORMA`,
        htmlContent
      );

      console.log(`[reset-password-native] ✅ Activation email sent via Brevo`, { messageId: emailResult.messageId });

      return new Response(
        JSON.stringify({
          action: "resend_invitation",
          success: true,
          message: "Compte non activé - Un lien d'activation a été envoyé via Brevo",
          email_id: emailResult.messageId
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (emailError) {
      console.error("[reset-password-native] ❌ Brevo email error:", emailError);
      return new Response(
        JSON.stringify({ 
          action: "resend_invitation",
          error: "Erreur envoi email",
          details: emailError instanceof Error ? emailError.message : "Erreur inconnue"
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // User is activated - generate password reset token
  console.log(`[reset-password-native] 🔑 User is activated, generating reset token`);

  const resetToken = crypto.randomUUID() + '-' + Date.now();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await supabaseAdmin
    .from('user_activation_tokens')
    .delete()
    .eq('user_id', userData.id);

  const { error: tokenError } = await supabaseAdmin
    .from('user_activation_tokens')
    .insert({
      user_id: userData.id,
      token: resetToken,
      expires_at: expiresAt.toISOString()
    });

  if (tokenError) {
    console.error("[reset-password-native] ❌ Token creation error:", tokenError);
    return new Response(
      JSON.stringify({ error: "Erreur lors de la création du token de réinitialisation" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
  console.log(`[reset-password-native] 📧 Sending reset email via Brevo to ${email}`);

  const htmlContent = buildResetEmail(userData.first_name, userData.last_name, establishmentName, resetLink);

  try {
    const emailResult = await sendEmailWithBrevo(
      email,
      `Réinitialisation de votre mot de passe - NECTFORMA`,
      htmlContent
    );

    console.log(`[reset-password-native] ✅ Reset email sent successfully via Brevo`, { messageId: emailResult.messageId });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Lien de réinitialisation envoyé avec succès via Brevo",
        email_id: emailResult.messageId
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (emailError) {
    console.error("[reset-password-native] ❌ Brevo email error:", emailError);
    return new Response(
      JSON.stringify({ 
        error: "Erreur lors de l'envoi de l'email",
        details: emailError instanceof Error ? emailError.message : "Erreur inconnue"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
