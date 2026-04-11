import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

function generateReminderEmailHtml(
  recipientName: string,
  classTitle: string,
  formattedDate: string,
  formattedTime: string,
  endTime: string,
  duration: number,
  joinUrl: string | null,
  password: string | null
): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f4f7;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f7;padding:40px 20px;">
<tr><td align="center">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
<tr><td style="background:linear-gradient(135deg,#1e1e5a 0%,#2a2a70 50%,#1e1e5a 100%);padding:30px 40px;border-radius:12px 12px 0 0;">
<h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:600;">NECTFORMA</h1>
<p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">Rappel - Classe virtuelle dans 15 minutes</p>
</td></tr>
<tr><td style="padding:40px;">
<p style="color:#374151;font-size:16px;margin:0 0 20px;">Bonjour <strong>${recipientName}</strong>,</p>
<div style="background-color:#FEF3C7;border-left:4px solid #F59E0B;padding:20px;border-radius:0 8px 8px 0;margin-bottom:24px;">
<h2 style="color:#92400E;font-size:18px;margin:0 0 12px;">Votre classe virtuelle commence dans 15 minutes !</h2>
<p style="color:#78350F;font-size:15px;margin:0;line-height:1.6;">"${classTitle}" demarre bientot. Preparez-vous a rejoindre la session.</p>
</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
<tr><td style="padding:8px 0;border-bottom:1px solid #E5E7EB;"><span style="color:#6B7280;font-size:14px;">Classe virtuelle</span></td><td style="padding:8px 0;border-bottom:1px solid #E5E7EB;text-align:right;"><span style="color:#1F2937;font-size:14px;font-weight:500;">${classTitle}</span></td></tr>
<tr><td style="padding:8px 0;border-bottom:1px solid #E5E7EB;"><span style="color:#6B7280;font-size:14px;">Date</span></td><td style="padding:8px 0;border-bottom:1px solid #E5E7EB;text-align:right;"><span style="color:#1F2937;font-size:14px;font-weight:500;">${formattedDate}</span></td></tr>
<tr><td style="padding:8px 0;border-bottom:1px solid #E5E7EB;"><span style="color:#6B7280;font-size:14px;">Horaires</span></td><td style="padding:8px 0;border-bottom:1px solid #E5E7EB;text-align:right;"><span style="color:#1F2937;font-size:14px;font-weight:500;">${formattedTime} - ${endTime} (${duration} min)</span></td></tr>
${joinUrl ? `<tr><td style="padding:8px 0;border-bottom:1px solid #E5E7EB;"><span style="color:#6B7280;font-size:14px;">Lien Zoom</span></td><td style="padding:8px 0;border-bottom:1px solid #E5E7EB;text-align:right;"><a href="${joinUrl}" style="color:#7C3AED;font-weight:600;font-size:14px;">Rejoindre</a></td></tr>` : ""}
${password ? `<tr><td style="padding:8px 0;border-bottom:1px solid #E5E7EB;"><span style="color:#6B7280;font-size:14px;">Code d'acces</span></td><td style="padding:8px 0;border-bottom:1px solid #E5E7EB;text-align:right;"><span style="color:#1F2937;font-size:14px;font-weight:500;">${password}</span></td></tr>` : ""}
</table>
${joinUrl ? `<table role="presentation" width="100%"><tr><td align="center" style="padding:20px 0;"><a href="${joinUrl}" style="display:inline-block;background:linear-gradient(135deg,#F59E0B 0%,#D97706 100%);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;box-shadow:0 4px 6px rgba(245,158,11,0.3);">Rejoindre maintenant</a></td></tr></table>` : ""}
</td></tr>
<tr><td style="background-color:#F9FAFB;padding:24px 40px;border-radius:0 0 12px 12px;border-top:1px solid #E5E7EB;">
<p style="color:#6B7280;font-size:13px;margin:0 0 8px;text-align:center;">Cet email a ete envoye automatiquement par NECTFORMA.</p>
<p style="color:#9CA3AF;font-size:12px;margin:0;text-align:center;">&copy; ${new Date().getFullYear()} NECTFORMA. Tous droits reserves.</p>
</td></tr></table></td></tr></table></body></html>`;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find classes starting in the next 10-20 minutes with no reminder sent
    const now = new Date();
    const in10min = new Date(now.getTime() + 10 * 60000).toISOString();
    const in20min = new Date(now.getTime() + 20 * 60000).toISOString();

    const { data: upcomingClasses, error: fetchError } = await supabase
      .from("virtual_classes")
      .select("*")
      .gte("scheduled_at", in10min)
      .lte("scheduled_at", in20min)
      .is("reminder_sent_at", null)
      .in("status", ["synced", "pending"]);

    if (fetchError) {
      console.error("Error fetching classes:", fetchError);
      throw fetchError;
    }

    if (!upcomingClasses || upcomingClasses.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No upcoming classes to remind", processed: 0 }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${upcomingClasses.length} classes to send reminders for`);
    let totalNotifications = 0;
    let totalEmails = 0;

    for (const vc of upcomingClasses) {
      // Get users to notify
      let userIds: string[] = [];

      if (vc.formation_id) {
        const { data: assignments } = await supabase
          .from("user_formation_assignments")
          .select("user_id")
          .eq("formation_id", vc.formation_id);
        if (assignments) userIds = assignments.map((a: any) => a.user_id);
      } else if (vc.establishment_id) {
        const { data: users } = await supabase
          .from("users")
          .select("id")
          .eq("establishment_id", vc.establishment_id)
          .in("role", ["Étudiant", "Formateur"]);
        if (users) userIds = users.map((u: any) => u.id);
      }

      if (vc.instructor_id && !userIds.includes(vc.instructor_id)) {
        userIds.push(vc.instructor_id);
      }

      if (userIds.length === 0) {
        console.log(`No users to notify for class: ${vc.title}`);
        continue;
      }

      // Format dates
      const scheduledDate = new Date(vc.scheduled_at);
      const formattedDate = scheduledDate.toLocaleDateString("fr-FR", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      });
      const formattedTime = scheduledDate.toLocaleTimeString("fr-FR", {
        hour: "2-digit", minute: "2-digit",
      });
      const endDate = new Date(scheduledDate.getTime() + vc.duration * 60000);
      const endTime = endDate.toLocaleTimeString("fr-FR", {
        hour: "2-digit", minute: "2-digit",
      });

      const zoomText = vc.join_url ? `\nLien Zoom : ${vc.join_url}` : "";
      const passwordText = vc.password ? `\nCode d'acces : ${vc.password}` : "";

      // 1. Send in-app notifications
      const notifications = userIds.map((userId: string) => ({
        user_id: userId,
        title: "Rappel : Classe virtuelle dans 15 min",
        message: `La classe "${vc.title}" commence a ${formattedTime}.${zoomText}${passwordText}`,
        type: "virtual_class",
        metadata: { action_url: vc.join_url || "/classes-virtuelles", date: vc.scheduled_at },
        is_read: false,
      }));

      const { error: notifError } = await supabase.from("notifications").insert(notifications);
      if (notifError) {
        console.error("Notification insert error:", notifError);
      } else {
        totalNotifications += notifications.length;
      }

      // 2. Send a message in messagerie
      // Find an admin to send from
      const { data: adminUser } = await supabase
        .from("users")
        .select("id")
        .eq("establishment_id", vc.establishment_id)
        .in("role", ["AdminPrincipal", "Admin"])
        .limit(1)
        .single();

      if (adminUser) {
        const msgContent = [
          `Rappel : votre classe virtuelle commence dans 15 minutes !`,
          ``,
          `Titre : ${vc.title}`,
          vc.description ? `Description : ${vc.description}` : null,
          `Date : ${formattedDate}`,
          `Horaires : ${formattedTime} - ${endTime} (${vc.duration} min)`,
          ``,
          vc.join_url ? `Lien pour rejoindre la session :` : null,
          vc.join_url ? vc.join_url : null,
          vc.password ? `Code d'acces : ${vc.password}` : null,
          ``,
          `Bonne session !`,
          `L'equipe Nectforma`,
        ].filter(Boolean).join("\n");

        // Insert message
        const { data: msg, error: msgError } = await supabase.from("messages").insert({
          sender_id: adminUser.id,
          subject: `Rappel : ${vc.title} commence dans 15 min`,
          content: msgContent,
          is_draft: false,
          attachment_count: 0,
        }).select().single();

        if (!msgError && msg) {
          // Insert recipients
          const recipientRows = [
            { message_id: msg.id, recipient_id: adminUser.id, recipient_type: "user", is_read: true, read_at: new Date().toISOString() },
            ...userIds.map((uid: string) => ({ message_id: msg.id, recipient_id: uid, recipient_type: "user" })),
          ];
          await supabase.from("message_recipients").insert(recipientRows);
        }
      }

      // 3. Send emails via Brevo
      if (brevoApiKey) {
        for (const userId of userIds) {
          const { data: user } = await supabase
            .from("users")
            .select("email, first_name, last_name")
            .eq("id", userId)
            .single();

          if (user?.email) {
            const recipientName = `${user.first_name} ${user.last_name}`;
            const htmlContent = generateReminderEmailHtml(
              recipientName, vc.title, formattedDate, formattedTime, endTime,
              vc.duration, vc.join_url, vc.password
            );

            try {
              const emailResponse = await fetch(BREVO_API_URL, {
                method: "POST",
                headers: {
                  accept: "application/json",
                  "api-key": brevoApiKey,
                  "content-type": "application/json",
                },
                body: JSON.stringify({
                  sender: { name: "NECTFORMA", email: "noreply@nectforma.com" },
                  to: [{ email: user.email, name: recipientName }],
                  subject: `Rappel : "${vc.title}" commence dans 15 min - NECTFORMA`,
                  htmlContent,
                  tags: ["notification", "virtual_class_reminder"],
                }),
              });

              if (emailResponse.ok) {
                totalEmails++;
                console.log(`Reminder email sent to ${user.email}`);
              } else {
                const errData = await emailResponse.text();
                console.error(`Email failed for ${user.email}:`, errData);
              }
            } catch (emailErr) {
              console.error(`Email error for ${user.email}:`, emailErr);
            }
          }
        }
      }

      // 4. Mark reminder as sent
      await supabase
        .from("virtual_classes")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", vc.id);

      console.log(`Reminders sent for "${vc.title}": ${userIds.length} users`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: upcomingClasses.length,
        notifications: totalNotifications,
        emails: totalEmails,
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Reminder function error:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
