import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ZoomTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

async function getZoomAccessToken(accountId: string, clientId: string, clientSecret: string): Promise<string> {
  const credentials = btoa(`${clientId}:${clientSecret}`);
  
  const response = await fetch('https://zoom.us/oauth/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=account_credentials&account_id=${accountId}`,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Zoom OAuth failed [${response.status}]: ${errorText}`);
  }

  const data: ZoomTokenResponse = await response.json();
  return data.access_token;
}

async function createZoomMeeting(accessToken: string, params: {
  topic: string;
  start_time: string;
  duration: number;
  agenda?: string;
}) {
  const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic: params.topic,
      type: 2, // Scheduled meeting
      start_time: params.start_time,
      duration: params.duration,
      timezone: 'Europe/Paris',
      agenda: params.agenda || '',
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: true,
        waiting_room: false,
        auto_recording: 'none',
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Zoom create meeting failed [${response.status}]: ${errorText}`);
  }

  return await response.json();
}

async function updateZoomMeeting(accessToken: string, meetingId: string, params: {
  topic?: string;
  start_time?: string;
  duration?: number;
  agenda?: string;
}) {
  const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic: params.topic,
      start_time: params.start_time,
      duration: params.duration,
      agenda: params.agenda,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Zoom update meeting failed [${response.status}]: ${errorText}`);
  }

  return true;
}

async function deleteZoomMeeting(accessToken: string, meetingId: string) {
  const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    const errorText = await response.text();
    throw new Error(`Zoom delete meeting failed [${response.status}]: ${errorText}`);
  }

  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const { action, establishment_id, virtual_class_id, ...params } = body;

    if (!action || !establishment_id) {
      return new Response(JSON.stringify({ error: 'action et establishment_id requis' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get Zoom connection for this establishment
    const { data: zoomConn, error: connError } = await supabase
      .from('zoom_connections')
      .select('*')
      .eq('establishment_id', establishment_id)
      .eq('status', 'active')
      .single();

    if (connError || !zoomConn) {
      return new Response(JSON.stringify({ error: 'Aucune connexion Zoom active pour cet établissement' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get access token
    const accessToken = await getZoomAccessToken(
      zoomConn.account_id,
      zoomConn.client_id,
      zoomConn.client_secret_encrypted
    );

    let result: any = {};

    if (action === 'create') {
      const meeting = await createZoomMeeting(accessToken, {
        topic: params.title,
        start_time: params.scheduled_at,
        duration: params.duration || 60,
        agenda: params.description,
      });

      // Update virtual class with Zoom data
      if (virtual_class_id) {
        await supabase
          .from('virtual_classes')
          .update({
            provider_meeting_id: String(meeting.id),
            join_url: meeting.join_url,
            start_url: meeting.start_url,
            password: meeting.password,
            status: 'synced',
            last_sync_at: new Date().toISOString(),
            error_message: null,
          })
          .eq('id', virtual_class_id);
      }

      // Log
      await supabase.from('integration_logs').insert({
        establishment_id,
        virtual_class_id,
        action: 'create_meeting',
        provider: 'zoom',
        request_data: { title: params.title, scheduled_at: params.scheduled_at },
        response_data: { meeting_id: meeting.id, join_url: meeting.join_url },
        status: 'success',
        performed_by: user.id,
      });

      result = { meeting_id: meeting.id, join_url: meeting.join_url, start_url: meeting.start_url, password: meeting.password };

    } else if (action === 'update') {
      const { data: vc } = await supabase
        .from('virtual_classes')
        .select('provider_meeting_id')
        .eq('id', virtual_class_id)
        .single();

      if (!vc?.provider_meeting_id) {
        throw new Error('Aucun meeting Zoom associé');
      }

      await updateZoomMeeting(accessToken, vc.provider_meeting_id, {
        topic: params.title,
        start_time: params.scheduled_at,
        duration: params.duration,
        agenda: params.description,
      });

      await supabase
        .from('virtual_classes')
        .update({ last_sync_at: new Date().toISOString(), status: 'synced', error_message: null })
        .eq('id', virtual_class_id);

      await supabase.from('integration_logs').insert({
        establishment_id,
        virtual_class_id,
        action: 'update_meeting',
        provider: 'zoom',
        request_data: params,
        status: 'success',
        performed_by: user.id,
      });

      result = { success: true };

    } else if (action === 'delete') {
      const { data: vc } = await supabase
        .from('virtual_classes')
        .select('provider_meeting_id')
        .eq('id', virtual_class_id)
        .single();

      if (vc?.provider_meeting_id) {
        await deleteZoomMeeting(accessToken, vc.provider_meeting_id);
      }

      await supabase
        .from('virtual_classes')
        .update({ status: 'cancelled', last_sync_at: new Date().toISOString() })
        .eq('id', virtual_class_id);

      await supabase.from('integration_logs').insert({
        establishment_id,
        virtual_class_id,
        action: 'delete_meeting',
        provider: 'zoom',
        status: 'success',
        performed_by: user.id,
      });

      result = { success: true };

    } else if (action === 'test_connection') {
      // Just verify we can get a token
      result = { success: true, message: 'Connexion Zoom vérifiée avec succès' };

    } else {
      return new Response(JSON.stringify({ error: `Action inconnue: ${action}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(result), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Zoom meeting error:', error);

    // Try to log error
    try {
      const body = await req.clone().json().catch(() => ({}));
      if (body.establishment_id && body.virtual_class_id) {
        const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
        
        await supabase
          .from('virtual_classes')
          .update({ status: 'error', error_message: error.message })
          .eq('id', body.virtual_class_id);

        await supabase.from('integration_logs').insert({
          establishment_id: body.establishment_id,
          virtual_class_id: body.virtual_class_id,
          action: body.action || 'unknown',
          provider: 'zoom',
          status: 'error',
          error_message: error.message,
        });
      }
    } catch (logErr) {
      console.error('Failed to log error:', logErr);
    }

    return new Response(
      JSON.stringify({ error: error.message || 'Erreur interne' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
