-- =====================================================================
-- Migration : Sécurisation RLS — suppression des politiques "Allow all"
-- =====================================================================
-- Date : 2026-04-29
-- Contexte : Audit P0 issue de AUDIT_APPROFONDI_2026.md §3.2
--
-- Cette migration :
-- 1. CRÉE des politiques restrictives sur les 4 tables critiques sans
--    aucune politique restrictive active (formations, formation_modules,
--    schedules, schedule_slots) pour éviter de bloquer l'accès.
-- 2. SUPPRIME les 30 politiques "Allow all for development" résiduelles.
--
-- ⚠️  AVANT D'APPLIQUER EN PRODUCTION :
--   1. Exécuter `scripts/audit-rls-policies.sql` pour confirmer l'état
--      actuel (les politiques pourraient déjà avoir été nettoyées
--      manuellement).
--   2. Vérifier en staging que les flux principaux fonctionnent
--      (login, listing formations, signature émargement, ...).
--
-- IDEMPOTENT : utilise IF NOT EXISTS / IF EXISTS partout.
-- =====================================================================

-- =====================================================================
-- ÉTAPE 1 : Créer des politiques restrictives sur les tables critiques
-- (formations, formation_modules, schedules, schedule_slots)
-- =====================================================================
-- Ces 4 tables n'ont AUCUNE autre politique restrictive active.
-- Si on dropait juste leur "Allow all", l'accès serait bloqué pour tous.

-- ─── formations ───────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'formations'
      AND policyname = 'formations_select_establishment_members'
  ) THEN
    CREATE POLICY "formations_select_establishment_members"
      ON public.formations FOR SELECT TO authenticated
      USING (
        public.is_super_admin()
        OR establishment_id = public.get_current_user_establishment()
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'formations'
      AND policyname = 'formations_admins_manage'
  ) THEN
    CREATE POLICY "formations_admins_manage"
      ON public.formations FOR ALL TO authenticated
      USING (
        public.is_super_admin()
        OR (
          establishment_id = public.get_current_user_establishment()
          AND public.is_current_user_admin()
        )
      )
      WITH CHECK (
        public.is_super_admin()
        OR (
          establishment_id = public.get_current_user_establishment()
          AND public.is_current_user_admin()
        )
      );
  END IF;
END $$;

-- ─── formation_modules ────────────────────────────────────────────────
-- Hérite via formation_id → formations.establishment_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'formation_modules'
      AND policyname = 'formation_modules_select_establishment_members'
  ) THEN
    CREATE POLICY "formation_modules_select_establishment_members"
      ON public.formation_modules FOR SELECT TO authenticated
      USING (
        public.is_super_admin()
        OR EXISTS (
          SELECT 1 FROM public.formations f
          WHERE f.id = formation_modules.formation_id
            AND f.establishment_id = public.get_current_user_establishment()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'formation_modules'
      AND policyname = 'formation_modules_admins_manage'
  ) THEN
    CREATE POLICY "formation_modules_admins_manage"
      ON public.formation_modules FOR ALL TO authenticated
      USING (
        public.is_super_admin()
        OR (
          public.is_current_user_admin()
          AND EXISTS (
            SELECT 1 FROM public.formations f
            WHERE f.id = formation_modules.formation_id
              AND f.establishment_id = public.get_current_user_establishment()
          )
        )
      )
      WITH CHECK (
        public.is_super_admin()
        OR (
          public.is_current_user_admin()
          AND EXISTS (
            SELECT 1 FROM public.formations f
            WHERE f.id = formation_modules.formation_id
              AND f.establishment_id = public.get_current_user_establishment()
          )
        )
      );
  END IF;
END $$;

-- ─── schedules ────────────────────────────────────────────────────────
-- Hérite via formation_id → formations.establishment_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'schedules'
      AND policyname = 'schedules_select_establishment_members'
  ) THEN
    CREATE POLICY "schedules_select_establishment_members"
      ON public.schedules FOR SELECT TO authenticated
      USING (
        public.is_super_admin()
        OR EXISTS (
          SELECT 1 FROM public.formations f
          WHERE f.id = schedules.formation_id
            AND f.establishment_id = public.get_current_user_establishment()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'schedules'
      AND policyname = 'schedules_admins_manage'
  ) THEN
    CREATE POLICY "schedules_admins_manage"
      ON public.schedules FOR ALL TO authenticated
      USING (
        public.is_super_admin()
        OR (
          public.is_current_user_admin()
          AND EXISTS (
            SELECT 1 FROM public.formations f
            WHERE f.id = schedules.formation_id
              AND f.establishment_id = public.get_current_user_establishment()
          )
        )
      )
      WITH CHECK (
        public.is_super_admin()
        OR (
          public.is_current_user_admin()
          AND EXISTS (
            SELECT 1 FROM public.formations f
            WHERE f.id = schedules.formation_id
              AND f.establishment_id = public.get_current_user_establishment()
          )
        )
      );
  END IF;
END $$;

-- ─── schedule_slots ───────────────────────────────────────────────────
-- Hérite via schedule_id → schedules.formation_id → formations.establishment_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'schedule_slots'
      AND policyname = 'schedule_slots_select_establishment_members'
  ) THEN
    CREATE POLICY "schedule_slots_select_establishment_members"
      ON public.schedule_slots FOR SELECT TO authenticated
      USING (
        public.is_super_admin()
        OR EXISTS (
          SELECT 1 FROM public.schedules s
          JOIN public.formations f ON f.id = s.formation_id
          WHERE s.id = schedule_slots.schedule_id
            AND f.establishment_id = public.get_current_user_establishment()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'schedule_slots'
      AND policyname = 'schedule_slots_admins_manage'
  ) THEN
    CREATE POLICY "schedule_slots_admins_manage"
      ON public.schedule_slots FOR ALL TO authenticated
      USING (
        public.is_super_admin()
        OR (
          public.is_current_user_admin()
          AND EXISTS (
            SELECT 1 FROM public.schedules s
            JOIN public.formations f ON f.id = s.formation_id
            WHERE s.id = schedule_slots.schedule_id
              AND f.establishment_id = public.get_current_user_establishment()
          )
        )
      )
      WITH CHECK (
        public.is_super_admin()
        OR (
          public.is_current_user_admin()
          AND EXISTS (
            SELECT 1 FROM public.schedules s
            JOIN public.formations f ON f.id = s.formation_id
            WHERE s.id = schedule_slots.schedule_id
              AND f.establishment_id = public.get_current_user_establishment()
          )
        )
      );
  END IF;
END $$;

-- =====================================================================
-- ÉTAPE 2 : SUPPRESSION des 30 politiques "Allow all for development"
-- =====================================================================
-- Toutes ces politiques sont des reliques du début du projet (août-sept
-- 2025) qui n'ont jamais été nettoyées. Elles donnent un accès total à
-- toutes les lignes de toutes les tables, contournant le multi-tenant.

DROP POLICY IF EXISTS "Allow all for development"                                   ON public.establishments;
DROP POLICY IF EXISTS "Allow all for development"                                   ON public.formations;
DROP POLICY IF EXISTS "Allow all for development"                                   ON public.student_formations;

DROP POLICY IF EXISTS "Allow all for development modules"                           ON public.formation_modules;
DROP POLICY IF EXISTS "Allow all for development module instructors"                ON public.module_instructors;

DROP POLICY IF EXISTS "Allow all for development assignments"                       ON public.module_assignments;
DROP POLICY IF EXISTS "Allow all for development contents"                          ON public.module_contents;
DROP POLICY IF EXISTS "Allow all for development documents"                         ON public.module_documents;
DROP POLICY IF EXISTS "Allow all for development assignment_files"                  ON public.assignment_files;
DROP POLICY IF EXISTS "Allow all for development submissions"                       ON public.assignment_submissions;
DROP POLICY IF EXISTS "Allow all for development submission_files"                  ON public.submission_files;
DROP POLICY IF EXISTS "Allow all for development corrections"                       ON public.assignment_corrections;

DROP POLICY IF EXISTS "Allow all for development attendance_sheets"                 ON public.attendance_sheets;
DROP POLICY IF EXISTS "Allow all for development attendance_signatures"             ON public.attendance_signatures;

DROP POLICY IF EXISTS "Allow all for development text_books"                        ON public.text_books;
DROP POLICY IF EXISTS "Allow all for development text_book_entries"                 ON public.text_book_entries;
DROP POLICY IF EXISTS "Allow all for development text_book_entry_files"             ON public.text_book_entry_files;

DROP POLICY IF EXISTS "Allow all for development schedules"                         ON public.schedules;
DROP POLICY IF EXISTS "Allow all for development schedule_slots"                    ON public.schedule_slots;

DROP POLICY IF EXISTS "Allow all for development assignments"                       ON public.user_formation_assignments;
DROP POLICY IF EXISTS "Allow all operations for development"                        ON public.user_signatures;

DROP POLICY IF EXISTS "Allow all for development virtual_classes (SELECT)"          ON public.virtual_classes;
DROP POLICY IF EXISTS "Allow all for development virtual_classes (INSERT)"          ON public.virtual_classes;
DROP POLICY IF EXISTS "Allow all for development virtual_classes (UPDATE)"          ON public.virtual_classes;
DROP POLICY IF EXISTS "Allow all for development virtual_classes (DELETE)"          ON public.virtual_classes;

-- =====================================================================
-- ÉTAPE 3 : Vérification post-migration
-- =====================================================================
-- Après application de cette migration, exécuter :
--
--   SELECT count(*) FROM pg_policies
--   WHERE schemaname = 'public'
--     AND (policyname ILIKE '%development%' OR policyname ILIKE '%allow all%');
--
-- Le résultat attendu est 0 (zéro) ou seulement des politiques explicitement
-- légitimes (ex: "Allow public establishment creation" pour le signup).
--
-- Tester ensuite les flux critiques :
--   ✓ Login admin → /dashboard charge les formations
--   ✓ Login étudiant → /formations charge sa formation
--   ✓ Création d'une feuille d'émargement
--   ✓ Signature étudiante via lien public
-- =====================================================================
