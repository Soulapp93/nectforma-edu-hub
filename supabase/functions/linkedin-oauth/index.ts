import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireSuperAdmin, createSupabaseAdmin, authErrorResponse } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const supabaseAdmin = () => createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const LINKEDIN_CLIENT_ID = () => Deno.env.get('LINKEDIN_CLIENT_ID')!;
const LINKEDIN_CLIENT_SECRET = () => Deno.env.get('LINKEDIN_CLIENT_SECRET')!;

// Scopes for posting on personal profile
const SCOPES = 'openid profile email w_member_social';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // SECURITY: All LinkedIn OAuth actions are SuperAdmin-only (manage social
  // media connection for the blog). Tokens are sensitive — protect at all costs.
  try {
    await requireSuperAdmin(req, createSupabaseAdmin());
  } catch (e) {
    return authErrorResponse(e, corsHeaders);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action;

    // ── Generate OAuth authorization URL ──
    if (action === 'get-auth-url') {
      const redirectUri = body.redirect_uri;
      if (!redirectUri) {
        return new Response(
          JSON.stringify({ success: false, error: 'redirect_uri required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const state = crypto.randomUUID();
      const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
        `response_type=code&` +
        `client_id=${LINKEDIN_CLIENT_ID()}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${state}&` +
        `scope=${encodeURIComponent(SCOPES)}`;

      return new Response(
        JSON.stringify({ success: true, auth_url: authUrl, state }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Exchange authorization code for access token ──
    if (action === 'exchange-code') {
      const { code, redirect_uri } = body;
      if (!code || !redirect_uri) {
        return new Response(
          JSON.stringify({ success: false, error: 'code and redirect_uri required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Exchange code for token
      const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri,
          client_id: LINKEDIN_CLIENT_ID(),
          client_secret: LINKEDIN_CLIENT_SECRET(),
        }),
      });

      if (!tokenResponse.ok) {
        const errText = await tokenResponse.text();
        console.error('LinkedIn token exchange error:', tokenResponse.status, errText);
        return new Response(
          JSON.stringify({ success: false, error: 'Token exchange failed', details: errText }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;
      const expiresIn = tokenData.expires_in; // seconds

      // Get user profile info
      const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      let profileData: any = {};
      if (profileResponse.ok) {
        profileData = await profileResponse.json();
      }

      // Get organization pages the user admins
      let organizationId: string | null = null;
      let organizationName: string | null = null;
      
      try {
        const orgsResponse = await fetch(
          'https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organizationalTarget~(localizedName)))',
          { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );
        
        if (orgsResponse.ok) {
          const orgsData = await orgsResponse.json();
          const firstOrg = orgsData.elements?.[0];
          if (firstOrg) {
            const orgUrn = firstOrg.organizationalTarget;
            organizationId = orgUrn?.replace('urn:li:organization:', '') || null;
            organizationName = firstOrg['organizationalTarget~']?.localizedName || null;
          }
        }
      } catch (e) {
        console.log('Could not fetch organizations, will post as personal:', e);
      }

      // Save connection to database
      const sb = supabaseAdmin();
      const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

      const { error: saveError } = await sb
        .from('social_media_connections')
        .upsert({
          platform: 'linkedin',
          access_token: accessToken,
          token_expires_at: expiresAt,
          connection_status: 'connected',
          account_name: organizationName || profileData.name || `${profileData.given_name || ''} ${profileData.family_name || ''}`.trim() || 'LinkedIn Account',
          account_id: profileData.sub || null,
          page_id: organizationId,
          last_connected_at: new Date().toISOString(),
          permissions_scope: SCOPES.split(' '),
          metadata: {
            person_urn: profileData.sub ? `urn:li:person:${profileData.sub}` : null,
            organization_id: organizationId,
            organization_name: organizationName,
            profile_picture: profileData.picture || null,
            email: profileData.email || null,
          },
        }, { onConflict: 'platform' });

      if (saveError) {
        console.error('Error saving LinkedIn connection:', saveError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to save connection' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          account_name: organizationName || profileData.name || 'LinkedIn',
          organization_id: organizationId,
          organization_name: organizationName,
          expires_at: expiresAt,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Publish a post to LinkedIn ──
    if (action === 'publish') {
      const { post_id } = body;
      const sb = supabaseAdmin();

      // Get connection
      const { data: connection } = await sb
        .from('social_media_connections')
        .select('*')
        .eq('platform', 'linkedin')
        .eq('connection_status', 'connected')
        .single();

      if (!connection?.access_token) {
        return new Response(
          JSON.stringify({ success: false, error: 'LinkedIn not connected. Please authorize first.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check token expiry
      if (connection.token_expires_at && new Date(connection.token_expires_at) < new Date()) {
        await sb.from('social_media_connections')
          .update({ connection_status: 'expired' })
          .eq('platform', 'linkedin');
        return new Response(
          JSON.stringify({ success: false, error: 'LinkedIn token expired. Please re-authorize.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get post data
      const { data: post } = await sb
        .from('social_posts')
        .select('*')
        .eq('id', post_id)
        .single();

      if (!post) {
        return new Response(
          JSON.stringify({ success: false, error: 'Post not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const metadata = connection.metadata as any;
      const organizationId = metadata?.organization_id || connection.page_id;
      const personUrn = metadata?.person_urn;

      // Determine author: organization page or personal profile
      const author = organizationId
        ? `urn:li:organization:${organizationId}`
        : personUrn || `urn:li:person:${connection.account_id}`;

      // Build LinkedIn API post payload
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

      // Publish to LinkedIn
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
        console.error('LinkedIn publish error:', publishResponse.status, errText);

        // Log the failure
        await sb.from('social_publication_logs').insert({
          social_post_id: post_id,
          platform: 'linkedin',
          action: 'publish',
          status: 'failed',
          error_message: `${publishResponse.status}: ${errText}`,
        });

        await sb.from('social_posts').update({
          status: 'failed',
          error_message: `LinkedIn API error: ${publishResponse.status}`,
        }).eq('id', post_id);

        return new Response(
          JSON.stringify({ success: false, error: `LinkedIn API error: ${publishResponse.status}`, details: errText }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const publishData = await publishResponse.json();
      const externalPostId = publishData.id || publishResponse.headers.get('x-restli-id') || '';
      const postUrl = `https://www.linkedin.com/feed/update/${externalPostId}`;

      // Update post status
      await sb.from('social_posts').update({
        status: 'published',
        published_at: new Date().toISOString(),
        external_post_id: externalPostId,
        external_post_url: postUrl,
        auto_published: body.auto || false,
      }).eq('id', post_id);

      // Log success
      await sb.from('social_publication_logs').insert({
        social_post_id: post_id,
        platform: 'linkedin',
        action: 'publish',
        status: 'success',
        details: { external_post_id: externalPostId, post_url: postUrl },
      });

      return new Response(
        JSON.stringify({ success: true, external_post_url: postUrl, external_post_id: externalPostId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Refresh token (LinkedIn tokens last 60 days, refresh tokens 365 days) ──
    if (action === 'refresh-token') {
      const sb = supabaseAdmin();
      const { data: connection } = await sb
        .from('social_media_connections')
        .select('*')
        .eq('platform', 'linkedin')
        .single();

      if (!connection?.refresh_token) {
        return new Response(
          JSON.stringify({ success: false, error: 'No refresh token available' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const refreshResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: connection.refresh_token,
          client_id: LINKEDIN_CLIENT_ID(),
          client_secret: LINKEDIN_CLIENT_SECRET(),
        }),
      });

      if (!refreshResponse.ok) {
        const errText = await refreshResponse.text();
        return new Response(
          JSON.stringify({ success: false, error: 'Token refresh failed', details: errText }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const refreshData = await refreshResponse.json();
      const expiresAt = new Date(Date.now() + refreshData.expires_in * 1000).toISOString();

      await sb.from('social_media_connections').update({
        access_token: refreshData.access_token,
        refresh_token: refreshData.refresh_token || connection.refresh_token,
        token_expires_at: expiresAt,
        connection_status: 'connected',
        last_connected_at: new Date().toISOString(),
      }).eq('platform', 'linkedin');

      return new Response(
        JSON.stringify({ success: true, expires_at: expiresAt }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Check connection status ──
    if (action === 'status') {
      const sb = supabaseAdmin();
      const { data: connection } = await sb
        .from('social_media_connections')
        .select('platform, connection_status, account_name, page_id, last_connected_at, token_expires_at, metadata')
        .eq('platform', 'linkedin')
        .single();

      const isExpired = connection?.token_expires_at
        ? new Date(connection.token_expires_at) < new Date()
        : false;

      return new Response(
        JSON.stringify({
          success: true,
          connected: connection?.connection_status === 'connected' && !isExpired,
          connection: connection ? {
            ...connection,
            is_expired: isExpired,
          } : null,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('LinkedIn OAuth error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
