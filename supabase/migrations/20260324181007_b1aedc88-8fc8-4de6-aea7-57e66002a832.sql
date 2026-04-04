-- competency_blocks table does not exist in any migration, skip this FK column
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'competency_blocks') THEN
    ALTER TABLE formation_modules ADD COLUMN IF NOT EXISTS competency_block_id uuid REFERENCES competency_blocks(id) ON DELETE SET NULL;
  END IF;
END $$;
