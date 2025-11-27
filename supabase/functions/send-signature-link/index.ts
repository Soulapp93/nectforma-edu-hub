import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { attendanceSheetId, studentIds } = await req.json();

    if (!attendanceSheetId || !studentIds || !Array.isArray(studentIds)) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Récupérer les informations de la feuille d'émargement
    const { data: sheet, error: sheetError } = await supabase
      .from("attendance_sheets")
      .select(`
        *,
        formations(title, level)
      `)
      .eq("id", attendanceSheetId)
      .single();

    if (sheetError || !sheet) {
      console.error("Error fetching attendance sheet:", sheetError);
      return new Response(
        JSON.stringify({ error: "Attendance sheet not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const signatureLink = `${Deno.env.get("SUPABASE_URL").replace("https://", "https://app.")}/emargement/signer/${sheet.signature_link_token}`;

    const notificationTitle = "Nouveau lien d'émargement";
    const notificationMessage = `Un lien d'émargement a été envoyé pour la session "${sheet.formations.title}" du ${new Date(sheet.date).toLocaleDateString('fr-FR')}. Cliquez pour signer.`;

    // Créer les notifications pour chaque étudiant
    const notifications = studentIds.map((studentId: string) => ({
      user_id: studentId,
      type: "attendance",
      title: notificationTitle,
      message: notificationMessage,
      metadata: {
        attendance_sheet_id: attendanceSheetId,
        signature_link: signatureLink,
        expires_at: sheet.signature_link_expires_at
      }
    }));

    // Insérer les notifications
    const { error: notifError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (notifError) {
      console.error("Error creating notifications:", notifError);
      return new Response(
        JSON.stringify({ error: "Failed to send notifications" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Créer un message dans la messagerie pour chaque étudiant
    const { data: { user: sender } } = await supabase.auth.admin.listUsers();
    const adminUser = sender?.[0]; // Premier admin comme expéditeur

    if (adminUser) {
      const messageContent = `${notificationMessage}\n\nLien de signature: ${signatureLink}\n\nExpire le: ${new Date(sheet.signature_link_expires_at).toLocaleString('fr-FR')}`;
      
      const { data: message, error: messageError } = await supabase
        .from("messages")
        .insert({
          sender_id: adminUser.id,
          subject: notificationTitle,
          content: messageContent,
          is_draft: false,
          attachment_count: 0
        })
        .select()
        .single();

      if (!messageError && message) {
        // Créer les destinataires du message
        const recipients = studentIds.map((studentId: string) => ({
          message_id: message.id,
          recipient_id: studentId,
          recipient_type: 'user'
        }));

        await supabase.from("message_recipients").insert(recipients);
      }
    }

    // Récupérer les emails des étudiants pour l'envoi d'email Gmail
    const { data: students, error: studentsError } = await supabase
      .from("users")
      .select("email")
      .in("id", studentIds);

    if (!studentsError && students && students.length > 0) {
      const userEmails = students.map(s => s.email);
      
      // Appeler l'edge function pour envoyer les emails
      try {
        await supabase.functions.invoke("send-notification-email", {
          body: {
            userEmails,
            title: notificationTitle,
            message: notificationMessage,
            type: "attendance"
          }
        });
        console.log(`Gmail notifications sent to ${userEmails.length} students`);
      } catch (emailError) {
        console.error("Failed to send Gmail notifications:", emailError);
        // Ne pas bloquer si l'envoi d'email échoue
      }
    }

    console.log(`Sent signature link to ${studentIds.length} students for attendance sheet ${attendanceSheetId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notifications sent to ${studentIds.length} students`,
        link: signatureLink
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-signature-link function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
