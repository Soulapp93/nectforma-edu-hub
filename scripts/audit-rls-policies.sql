-- =====================================================================
-- RLS Security Audit Script
-- =====================================================================
-- Run this script in the Supabase SQL Editor (production database) to
-- verify the actual state of Row Level Security policies.
--
-- This audit was triggered by AUDIT_APPROFONDI_2026.md §3.2 (P0).
-- Source code analysis suggests 30 "Allow all" / USING (true) policies
-- may still be active. This script confirms it against the live DB.
--
-- ⚠️  READ-ONLY: this script only reads pg_policies, it does not modify anything.
-- =====================================================================

-- =====================================================================
-- 1. TOUTES LES POLITIQUES `USING (true)` SUR LE SCHÉMA PUBLIC
-- =====================================================================
-- Une politique avec qual = 'true' OU with_check = 'true' est permissive
-- et ne filtre rien. Si l'opération est INSERT, c'est attendu pour les
-- inscriptions publiques. Si c'est SELECT/UPDATE/DELETE, c'est un risque.
--
-- Lignes attendues : 0 sur les tables métier (formations, users, etc.)

SELECT
  schemaname,
  tablename,
  policyname,
  cmd AS operation,
  roles,
  CASE
    WHEN qual = 'true' AND with_check = 'true' THEN '🚨 FOR ALL — completely permissive'
    WHEN qual = 'true' THEN '🚨 USING (true) — read/match permissive'
    WHEN with_check = 'true' THEN '⚠️  WITH CHECK (true) — write permissive (sometimes OK for INSERT)'
    ELSE 'OK'
  END AS verdict,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual = 'true' OR with_check = 'true')
ORDER BY
  CASE WHEN qual = 'true' THEN 0 ELSE 1 END,
  tablename,
  policyname;

-- =====================================================================
-- 2. POLITIQUES "Allow all for development" RÉSIDUELLES
-- =====================================================================
-- Ces politiques étaient prévues pour le développement initial et ne
-- devraient PAS être présentes en production.

SELECT
  tablename,
  policyname,
  cmd AS operation,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    policyname ILIKE '%development%'
    OR policyname ILIKE '%allow all%'
  )
ORDER BY tablename, policyname;

-- =====================================================================
-- 3. TABLES SANS POLITIQUE RESTRICTIVE (DANGER MULTI-TENANT)
-- =====================================================================
-- Liste les tables où il n'existe AUCUNE politique avec un filtre sur
-- establishment_id, user_id, ou un appel à get_current_user_*().
-- Ces tables sont potentiellement accessibles à tous les utilisateurs
-- authentifiés sans restriction.

WITH restrictive_policies AS (
  SELECT DISTINCT tablename
  FROM pg_policies
  WHERE schemaname = 'public'
    AND (
      qual ILIKE '%establishment_id%'
      OR qual ILIKE '%get_current_user%'
      OR qual ILIKE '%is_current_user_admin%'
      OR qual ILIKE '%is_super_admin%'
      OR qual ILIKE '%user_id%'
      OR qual ILIKE '%auth.uid()%'
    )
),
all_tables_with_rls AS (
  SELECT c.relname AS tablename
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relrowsecurity = true
)
SELECT
  t.tablename,
  COALESCE(
    (SELECT count(*) FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = t.tablename),
    0
  ) AS total_policies,
  '⚠️  No restrictive policy detected' AS warning
FROM all_tables_with_rls t
WHERE t.tablename NOT IN (SELECT tablename FROM restrictive_policies)
ORDER BY t.tablename;

-- =====================================================================
-- 4. TABLES AVEC RLS DÉSACTIVÉ (DANGER ABSOLU)
-- =====================================================================
-- Ces tables n'ont aucune protection RLS. Tout utilisateur authentifié
-- avec l'anon key peut lire/écrire.

SELECT
  c.relname AS tablename,
  '🚨 RLS NOT ENABLED — full read/write access' AS warning
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity = false
  AND c.relname NOT LIKE 'pg_%'
ORDER BY c.relname;

-- =====================================================================
-- 5. RÉCAPITULATIF GÉNÉRAL
-- =====================================================================

SELECT
  'Total tables in public schema' AS metric,
  count(*) AS value
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname NOT LIKE 'pg_%'
UNION ALL
SELECT 'Tables with RLS enabled', count(*)
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity = true
UNION ALL
SELECT 'Tables with RLS disabled', count(*)
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity = false AND c.relname NOT LIKE 'pg_%'
UNION ALL
SELECT 'Total RLS policies', count(*) FROM pg_policies WHERE schemaname = 'public'
UNION ALL
SELECT 'Policies with USING (true)', count(*) FROM pg_policies WHERE schemaname = 'public' AND qual = 'true'
UNION ALL
SELECT 'Policies with WITH CHECK (true)', count(*) FROM pg_policies WHERE schemaname = 'public' AND with_check = 'true'
UNION ALL
SELECT 'Policies "Allow all" / "development"', count(*)
FROM pg_policies
WHERE schemaname = 'public'
  AND (policyname ILIKE '%development%' OR policyname ILIKE '%allow all%');

-- =====================================================================
-- INTERPRÉTATION DES RÉSULTATS
-- =====================================================================
-- ✓ Section 1 : 0 ligne attendu (sauf cas légitimes : blog public,
--   create-establishment INSERT, quiz publics par lien).
-- ✓ Section 2 : 0 ligne attendu en production. Toute ligne ici doit être
--   nettoyée via la migration `20260429120000_secure_rls_drop_legacy_allow_all.sql`.
-- ✓ Section 3 : 0 ligne attendu pour les tables métier (users, formations,
--   etc.). Les tables techniques (rate_limits, etc.) peuvent y figurer.
-- ✓ Section 4 : 0 ligne attendu sur le schéma public.
-- =====================================================================
