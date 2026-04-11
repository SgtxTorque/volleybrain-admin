-- ============================================
-- PROGRAM LAYER — PHASE 1.1: Database Migration
-- Run this in Supabase Dashboard > SQL Editor
-- Idempotent: safe to re-run (all statements use IF NOT EXISTS guards)
-- ============================================

-- 1. Create programs table
CREATE TABLE IF NOT EXISTS programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sport_id uuid REFERENCES sports(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  icon text,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Add program_id to seasons (NULLABLE — existing seasons stay valid)
ALTER TABLE seasons
  ADD COLUMN IF NOT EXISTS program_id uuid REFERENCES programs(id) ON DELETE SET NULL;

-- 3. Index for performance
CREATE INDEX IF NOT EXISTS idx_programs_organization_id ON programs(organization_id);
CREATE INDEX IF NOT EXISTS idx_programs_sport_id ON programs(sport_id);
CREATE INDEX IF NOT EXISTS idx_seasons_program_id ON seasons(program_id);

-- 4. RLS on programs table
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view programs in their organization' AND tablename = 'programs') THEN
    CREATE POLICY "Users can view programs in their organization"
      ON programs FOR SELECT
      USING (
        organization_id IN (
          SELECT organization_id FROM user_roles WHERE user_id = auth.uid() AND is_active = true
        )
        OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_admin = true)
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can create programs' AND tablename = 'programs') THEN
    CREATE POLICY "Admins can create programs"
      ON programs FOR INSERT
      WITH CHECK (
        organization_id IN (
          SELECT organization_id FROM user_roles
          WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
        )
        OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_admin = true)
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update programs' AND tablename = 'programs') THEN
    CREATE POLICY "Admins can update programs"
      ON programs FOR UPDATE
      USING (
        organization_id IN (
          SELECT organization_id FROM user_roles
          WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
        )
        OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_admin = true)
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete programs' AND tablename = 'programs') THEN
    CREATE POLICY "Admins can delete programs"
      ON programs FOR DELETE
      USING (
        organization_id IN (
          SELECT organization_id FROM user_roles
          WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
        )
        OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_admin = true)
      );
  END IF;
END $$;

-- 5. Backfill: Create one program per unique sport_id in existing seasons
INSERT INTO programs (organization_id, sport_id, name, icon, display_order, created_at)
SELECT DISTINCT
  s.organization_id,
  s.sport_id,
  COALESCE(sp.name, 'General'),
  sp.icon,
  COALESCE(sp.sort_order, 0),
  now()
FROM seasons s
LEFT JOIN sports sp ON s.sport_id = sp.id
WHERE s.sport_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM programs p
    WHERE p.organization_id = s.organization_id
      AND p.sport_id = s.sport_id
  );

-- 6. Backfill: Link existing seasons to their auto-created programs
UPDATE seasons s
SET program_id = p.id
FROM programs p
WHERE s.organization_id = p.organization_id
  AND s.sport_id = p.sport_id
  AND s.program_id IS NULL;

-- 7. Create programs for seasons that have NO sport_id (orphaned seasons)
INSERT INTO programs (organization_id, sport_id, name, icon, display_order, created_at)
SELECT DISTINCT
  s.organization_id,
  NULL::uuid,
  'General',
  NULL,
  999,
  now()
FROM seasons s
WHERE s.sport_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM programs p
    WHERE p.organization_id = s.organization_id
      AND p.sport_id IS NULL
      AND p.name = 'General'
  );

-- 8. Link orphaned seasons to the General program
UPDATE seasons s
SET program_id = p.id
FROM programs p
WHERE s.organization_id = p.organization_id
  AND s.sport_id IS NULL
  AND s.program_id IS NULL
  AND p.sport_id IS NULL
  AND p.name = 'General';
