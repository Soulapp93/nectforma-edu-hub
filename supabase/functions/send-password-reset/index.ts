import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  redirectUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, redirectUrl }: PasswordResetRequest = await req.json();

    console.log(`Processing password reset request for: ${email}`);

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Generate password reset link using Supabase Admin API
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectUrl,
      }
    });

    if (linkError) {
      console.error('Error generating reset link:', linkError);
      return new Response(
        JSON.stringify({ error: "Failed to generate reset link" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resetLink = linkData.properties?.action_link;

    if (!resetLink) {
      console.error('No reset link generated');
      return new Response(
        JSON.stringify({ error: "Failed to generate reset link" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get user's first name for personalization
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('first_name, last_name')
      .eq('email', email)
      .single();

    const firstName = userData?.first_name || 'Utilisateur';
    const fullName = userData ? `${userData.first_name} ${userData.last_name}` : 'Utilisateur';

    // Send branded email via Resend
    const emailResponse = await resend.emails.send({
      from: "NECTFY <noreply@resend.dev>",
      to: [email],
      subject: "Réinitialisez votre mot de passe NECTFY",
      html: `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Réinitialisation de mot de passe - NECTFY</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="min-height: 100vh;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden;">
                  
                  <!-- Header with gradient -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); padding: 40px 40px 30px; text-align: center;">
                      <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                        <tr>
                          <td style="background-color: #ffffff; width: 56px; height: 56px; border-radius: 12px; text-align: center; vertical-align: middle;">
                            <span style="color: #8B5CF6; font-size: 28px; font-weight: bold; line-height: 56px;">N</span>
                          </td>
                          <td style="padding-left: 16px;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold; letter-spacing: -0.5px;">NECTFY</h1>
                          </td>
                        </tr>
                      </table>
                      <p style="margin: 16px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">Plateforme de gestion éducative</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 24px; color: #1f2937; font-size: 24px; font-weight: 600; text-align: center;">
                        Réinitialisation de mot de passe
                      </h2>
                      
                      <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                        Bonjour <strong>${firstName}</strong>,
                      </p>
                      
                      <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                        Vous avez demandé à réinitialiser le mot de passe de votre compte NECTFY. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
                      </p>
                      
                      <!-- CTA Button -->
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center" style="padding: 16px 0;">
                            <a href="${resetLink}" 
                               style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 16px 40px; border-radius: 12px; box-shadow: 0 4px 14px 0 rgba(139, 92, 246, 0.4);">
                              Réinitialiser mon mot de passe
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 24px 0 16px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                        Ce lien expirera dans <strong>24 heures</strong>. Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.
                      </p>
                      
                      <div style="margin-top: 24px; padding: 16px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #8B5CF6;">
                        <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.5;">
                          Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
                        </p>
                        <p style="margin: 8px 0 0; word-break: break-all;">
                          <a href="${resetLink}" style="color: #8B5CF6; font-size: 13px; text-decoration: underline;">${resetLink}</a>
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 32px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">
                        © ${new Date().getFullYear()} NECTFY. Tous droits réservés.
                      </p>
                      <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                        Cet email a été envoyé à ${email}
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Password reset email sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
