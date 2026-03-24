
-- Add formation_type to formations table
ALTER TABLE public.formations ADD COLUMN IF NOT EXISTS formation_type text DEFAULT 'ecole_sup';

-- Add show_on_transcript to evaluations table
ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS show_on_transcript boolean DEFAULT true;
