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

    // Créer les notifications pour chaque étudiant
    const notifications = studentIds.map((studentId: string) => ({
      user_id: studentId,
      type: "attendance",
      title: "Nouveau lien d'émargement",
      message: `Un lien d'émargement a été envoyé pour la session "${sheet.formations.title}" du ${new Date(sheet.date).toLocaleDateString('fr-FR')}. Cliquez pour signer.`,
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
