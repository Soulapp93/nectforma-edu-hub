import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailNotificationRequest {
  userEmails: string[];
  title: string;
  message: string;
  type: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmails, title, message, type }: EmailNotificationRequest = await req.json();

    if (!userEmails || !Array.isArray(userEmails) || userEmails.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing user emails" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending email notifications to ${userEmails.length} users`);

    // Envoyer un email à chaque utilisateur
    const emailPromises = userEmails.map(async (email) => {
      try {
        const emailResponse = await resend.emails.send({
          from: "Nectfy <onboarding@resend.dev>",
          to: [email],
          subject: "Nouvelle notification Nectfy",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">
                Notification Nectfy
              </h2>
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #4CAF50; margin-top: 0;">${title}</h3>
                <p style="color: #666; line-height: 1.6;">${message}</p>
              </div>
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #856404;">
                  <strong>📬 Vous avez reçu un message sur votre espace Nectfy</strong><br>
                  Veuillez vous connecter à votre compte pour voir tous les détails.
                </p>
              </div>
              <div style="text-align: center; margin-top: 30px;">
                <a href="${Deno.env.get("SUPABASE_URL")?.replace("https://cvuyglhivifusdahoztd.supabase.co", "https://app.cvuyglhivifusdahoztd.supabase.co")}" 
                   style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Se connecter à Nectfy
                </a>
              </div>
              <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
                Cet email a été envoyé automatiquement par Nectfy.<br>
                Type de notification: ${type}
              </p>
            </div>
          `,
        });

        console.log(`Email sent to ${email}:`, emailResponse);
        return { email, success: true };
      } catch (error) {
        console.error(`Failed to send email to ${email}:`, error);
        return { email, success: false, error: error.message };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`Email notifications sent: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Emails sent: ${successCount} success, ${failCount} failed`,
        results
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-notification-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
