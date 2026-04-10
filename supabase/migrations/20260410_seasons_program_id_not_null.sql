-- Migration: Enforce NOT NULL on seasons.program_id
-- Date: 2026-04-10
-- Prerequisite: All orphaned seasons must be backfilled with valid program_id values
--              and all code paths must be guarded before running this migration.

-- Safety check: verify no orphans remain
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM seasons WHERE program_id IS NULL) THEN
    RAISE EXCEPTION 'Cannot add NOT NULL constraint: orphaned seasons still exist. Run backfill first.';
  END IF;
END $$;

-- Add NOT NULL constraint
ALTER TABLE seasons
  ALTER COLUMN program_id SET NOT NULL;

-- Change ON DELETE behavior from SET NULL to RESTRICT
-- This prevents deleting a program that still has seasons
ALTER TABLE seasons
  DROP CONSTRAINT IF EXISTS seasons_program_id_fkey,
  ADD CONSTRAINT seasons_program_id_fkey
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE RESTRICT;
