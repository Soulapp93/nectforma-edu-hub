-- =====================================================
-- Extend schedule_slots to support events + cancellation
-- Adds columns for:
--  - slot_kind: 'course' (default) | 'event'
--  - event_type: 'holiday' | 'closed' | 'public_holiday' | 'open_day'
--                | 'autonomy' | 'mock_exam' | 'final_exam' | 'midterm'
--                | 'makeup' | 'custom'
--  - event_label: free text for custom events ("Autre")
--  - event_scope: 'formation' | 'establishment' (where an event applies)
--  - is_cancelled: boolean - a course can be cancelled without being deleted
--  - cancellation_reason: free text explaining why
--  - cancelled_at, cancelled_by: audit
--  - all_day: boolean - true when the event occupies the full day (no hours)
-- Executed: 2026-04-20
-- =====================================================

ALTER TABLE public.schedule_slots
  ADD COLUMN IF NOT EXISTS slot_kind text NOT NULL DEFAULT 'course',
  ADD COLUMN IF NOT EXISTS event_type text,
  ADD COLUMN IF NOT EXISTS event_label text,
  ADD COLUMN IF NOT EXISTS event_scope text DEFAULT 'formation',
  ADD COLUMN IF NOT EXISTS is_cancelled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS all_day boolean NOT NULL DEFAULT false;

-- Check constraints (permissive, safe with existing rows)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'schedule_slots_slot_kind_chk'
  ) THEN
    ALTER TABLE public.schedule_slots
      ADD CONSTRAINT schedule_slots_slot_kind_chk
      CHECK (slot_kind IN ('course', 'event'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'schedule_slots_event_scope_chk'
  ) THEN
    ALTER TABLE public.schedule_slots
      ADD CONSTRAINT schedule_slots_event_scope_chk
      CHECK (event_scope IN ('formation', 'establishment'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'schedule_slots_event_type_chk'
  ) THEN
    ALTER TABLE public.schedule_slots
      ADD CONSTRAINT schedule_slots_event_type_chk
      CHECK (
        event_type IS NULL OR event_type IN (
          'holiday','closed','public_holiday','open_day',
          'autonomy','mock_exam','final_exam','midterm',
          'makeup','custom'
        )
      );
  END IF;
END$$;

-- Index for establishment-scope events lookups across formations
CREATE INDEX IF NOT EXISTS idx_schedule_slots_event_scope_date
  ON public.schedule_slots(event_scope, date)
  WHERE slot_kind = 'event';

-- Make module/instructor nullable for events (already nullable, safety check)
ALTER TABLE public.schedule_slots ALTER COLUMN module_id DROP NOT NULL;
ALTER TABLE public.schedule_slots ALTER COLUMN instructor_id DROP NOT NULL;

COMMENT ON COLUMN public.schedule_slots.slot_kind IS 'course = training slot, event = holiday/closed/exam/etc.';
COMMENT ON COLUMN public.schedule_slots.event_scope IS 'formation = visible in this formation only, establishment = visible in every formation of the establishment';
COMMENT ON COLUMN public.schedule_slots.is_cancelled IS 'true = course was cancelled (kept for history, displayed struck-through)';
