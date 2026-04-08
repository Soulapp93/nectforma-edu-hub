-- ============================================================
-- Migration: Drop unused feature tables
-- 
-- Removes tables for features that have been deleted from the
-- application: Quiz, Virtual Classes, Zoom integration,
-- Finance/Accounting, HR/Payroll, and other unused tables.
--
-- These tables are no longer referenced by any application code.
-- ============================================================

-- ============================================
-- 1. QUIZ TABLES (8 tables)
-- ============================================
DROP TABLE IF EXISTS public.quiz_power_ups CASCADE;
DROP TABLE IF EXISTS public.quiz_leaderboard_history CASCADE;
DROP TABLE IF EXISTS public.quiz_answers CASCADE;
DROP TABLE IF EXISTS public.quiz_participants CASCADE;
DROP TABLE IF EXISTS public.quiz_teams CASCADE;
DROP TABLE IF EXISTS public.quiz_sessions CASCADE;
DROP TABLE IF EXISTS public.quiz_questions CASCADE;
DROP TABLE IF EXISTS public.quizzes CASCADE;

-- ============================================
-- 2. VIRTUAL CLASSES TABLES (5 tables)
-- ============================================
DROP TABLE IF EXISTS public.virtual_class_recordings CASCADE;
DROP TABLE IF EXISTS public.virtual_class_messages CASCADE;
DROP TABLE IF EXISTS public.virtual_class_materials CASCADE;
DROP TABLE IF EXISTS public.virtual_class_participants CASCADE;
DROP TABLE IF EXISTS public.virtual_classes CASCADE;

-- ============================================
-- 3. ZOOM INTEGRATION (1 table)
-- ============================================
DROP TABLE IF EXISTS public.zoom_connections CASCADE;

-- ============================================
-- 4. FINANCE / ACCOUNTING TABLES (12 tables)
-- ============================================
DROP TABLE IF EXISTS public.invoice_items CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.quote_items CASCADE;
DROP TABLE IF EXISTS public.quotes CASCADE;
DROP TABLE IF EXISTS public.accounting_entries CASCADE;
DROP TABLE IF EXISTS public.accounting_accounts CASCADE;
DROP TABLE IF EXISTS public.billing_clients CASCADE;
DROP TABLE IF EXISTS public.expense_reports CASCADE;
DROP TABLE IF EXISTS public.funding_sources CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.student_fees CASCADE;

-- ============================================
-- 5. HR / PAYROLL TABLES (4 tables)
-- ============================================
DROP TABLE IF EXISTS public.payslips CASCADE;
DROP TABLE IF EXISTS public.leave_requests CASCADE;
DROP TABLE IF EXISTS public.contracts CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;

-- ============================================
-- 6. OTHER UNUSED TABLES (10 tables)
-- ============================================
DROP TABLE IF EXISTS public.integration_logs CASCADE;
DROP TABLE IF EXISTS public.platform_user_roles CASCADE;
DROP TABLE IF EXISTS public.student_promotion_assignments CASCADE;
DROP TABLE IF EXISTS public.instructor_hours CASCADE;
DROP TABLE IF EXISTS public.grading_scales CASCADE;
DROP TABLE IF EXISTS public.meetings CASCADE;
DROP TABLE IF EXISTS public.meeting_participants CASCADE;
DROP TABLE IF EXISTS public.webrtc_signals CASCADE;
DROP TABLE IF EXISTS public.whiteboard_strokes CASCADE;
DROP TABLE IF EXISTS public.student_formations CASCADE;
DROP TABLE IF EXISTS public.attendance_audit_log CASCADE;
DROP TABLE IF EXISTS public.establishment_creation_attempts CASCADE;
DROP TABLE IF EXISTS public.digital_safe_file_permissions CASCADE;
DROP TABLE IF EXISTS public.digital_safe_files CASCADE;
DROP TABLE IF EXISTS public.digital_safe_folders CASCADE;

-- ============================================
-- 7. DROP UNUSED ENUM TYPES
-- ============================================
DROP TYPE IF EXISTS public.video_provider CASCADE;
DROP TYPE IF EXISTS public.virtual_class_status CASCADE;
DROP TYPE IF EXISTS public.zoom_connection_status CASCADE;

-- ============================================
-- 8. CLEAN UP: Remove virtual_class_id column
--    from any remaining tables that reference it
-- ============================================
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'virtual_class_id'
  ) THEN
    -- Drop FK constraints first
    EXECUTE (
      SELECT string_agg(
        'ALTER TABLE ' || tc.table_schema || '.' || tc.table_name || 
        ' DROP CONSTRAINT IF EXISTS ' || tc.constraint_name || ' CASCADE;',
        E'\n'
      )
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name IN ('virtual_classes', 'zoom_connections', 'quizzes', 'quiz_sessions')
    );
  END IF;
END $$;
