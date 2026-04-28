/**
 * Shared authentication helpers for Edge Functions.
 *
 * Usage:
 *   import { requireAuthenticatedUser, requireSuperAdmin, requireCronSecret } from "../_shared/auth.ts";
 *
 * Each helper throws an `AuthError` when the request is not authorized.
 * Catch it at the top of your handler and return a 401/403 response.
 *
 * IMPORTANT: All Edge Functions must call exactly one of these helpers
 * before performing any privileged operation, EXCEPT functions that are
 * legitimately public by design (signup, password reset, contact form, ...).
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  role: string | null;
  establishmentId: string | null;
  isSuperAdmin: boolean;
}

/**
 * Build a Supabase admin client (uses service role key — never expose to frontend).
 */
export function createSupabaseAdmin(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error("Supabase admin credentials not configured");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Extract and verify the JWT from the Authorization header.
 * Returns the authenticated user with their role and establishment.
 *
 * Throws AuthError(401) if the header is missing or the token is invalid.
 */
export async function requireAuthenticatedUser(
  req: Request,
  supabaseAdmin: SupabaseClient,
): Promise<AuthenticatedUser> {
  const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!authHeader) {
    throw new AuthError("Authentification requise", 401);
  }

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    throw new AuthError("Token manquant", 401);
  }

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) {
    throw new AuthError("Token invalide ou expiré", 401);
  }

  // Fetch role + establishment from profile / platform_user_roles in one shot
  const [{ data: profile }, { data: superAdminRow }] = await Promise.all([
    supabaseAdmin
      .from("users")
      .select("role, establishment_id")
      .eq("id", user.id)
      .maybeSingle(),
    supabaseAdmin
      .from("platform_user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "super_admin")
      .maybeSingle(),
  ]);

  return {
    id: user.id,
    email: user.email ?? null,
    role: profile?.role ?? null,
    establishmentId: profile?.establishment_id ?? null,
    isSuperAdmin: !!superAdminRow,
  };
}

/**
 * Like requireAuthenticatedUser, but additionally checks that the user is a SuperAdmin.
 * Throws AuthError(403) otherwise.
 */
export async function requireSuperAdmin(
  req: Request,
  supabaseAdmin: SupabaseClient,
): Promise<AuthenticatedUser> {
  const user = await requireAuthenticatedUser(req, supabaseAdmin);
  if (!user.isSuperAdmin) {
    throw new AuthError("Accès réservé aux super-administrateurs", 403);
  }
  return user;
}

/**
 * Like requireAuthenticatedUser, but additionally checks that the user is admin
 * of an establishment (Admin or AdminPrincipal role).
 * Throws AuthError(403) otherwise.
 */
export async function requireEstablishmentAdmin(
  req: Request,
  supabaseAdmin: SupabaseClient,
): Promise<AuthenticatedUser> {
  const user = await requireAuthenticatedUser(req, supabaseAdmin);
  if (user.isSuperAdmin) return user;
  if (user.role !== "Admin" && user.role !== "AdminPrincipal") {
    throw new AuthError("Accès réservé aux administrateurs d'établissement", 403);
  }
  return user;
}

/**
 * Verify a cron secret in the header `x-cron-secret`.
 * The secret must match the `CRON_SECRET` environment variable.
 *
 * Use this for Edge Functions that are invoked by Supabase scheduled triggers
 * (pg_cron / external schedulers). Set the secret in Supabase Function secrets:
 *   supabase secrets set CRON_SECRET="<random-long-string>"
 *
 * Throws AuthError(403) if the secret is missing or doesn't match.
 */
export function requireCronSecret(req: Request): void {
  const expected = Deno.env.get("CRON_SECRET");
  if (!expected) {
    // Fail closed: if the secret isn't configured, refuse all calls.
    throw new AuthError(
      "CRON_SECRET non configuré côté serveur — refus par défaut",
      503,
    );
  }
  const provided = req.headers.get("x-cron-secret");
  if (!provided || provided !== expected) {
    throw new AuthError("Secret cron invalide", 403);
  }
}

/**
 * Accept EITHER a valid cron secret OR a valid authenticated user.
 * Use for Edge Functions invoked both by cron (Supabase scheduler) and
 * manually from the frontend by an admin (e.g. trigger refresh button).
 *
 * Returns the AuthenticatedUser if invoked by a user, or `null` if invoked by cron.
 * Throws AuthError if neither check passes.
 */
export async function requireAuthOrCron(
  req: Request,
  supabaseAdmin: SupabaseClient,
): Promise<AuthenticatedUser | null> {
  // Try cron secret first (cheap, no DB call)
  const provided = req.headers.get("x-cron-secret");
  const expected = Deno.env.get("CRON_SECRET");
  if (provided && expected && provided === expected) {
    return null;
  }
  // Fallback: require authenticated user
  return await requireAuthenticatedUser(req, supabaseAdmin);
}

/**
 * Build a JSON error Response for an AuthError or generic error.
 * Use it in your `catch` block:
 *
 *   try {
 *     await requireSuperAdmin(req, sb);
 *     // ...
 *   } catch (e) {
 *     return authErrorResponse(e, corsHeaders);
 *   }
 */
export function authErrorResponse(
  error: unknown,
  corsHeaders: Record<string, string>,
): Response {
  if (error instanceof AuthError) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: error.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
  const message = error instanceof Error ? error.message : "Erreur inconnue";
  return new Response(
    JSON.stringify({ success: false, error: message }),
    {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}
