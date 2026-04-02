-- ============================================
-- LINEUP BUILDER V2 — DATABASE MIGRATIONS
-- Run in Supabase SQL Editor
-- ============================================

-- 1. Add columns to game_lineups
ALTER TABLE game_lineups ADD COLUMN IF NOT EXISTS formation_type TEXT;
ALTER TABLE game_lineups ADD COLUMN IF NOT EXISTS set_number INTEGER DEFAULT 1;
ALTER TABLE game_lineups ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id);
ALTER TABLE game_lineups ADD COLUMN IF NOT EXISTS position_role TEXT;

-- 2. Backfill team_id from schedule_events
UPDATE game_lineups gl
SET team_id = se.team_id
FROM schedule_events se
WHERE gl.event_id = se.id
AND gl.team_id IS NULL;

-- 3. Default formation_type for existing records
UPDATE game_lineups SET formation_type = '5-1' WHERE formation_type IS NULL;

-- 4. Create lineup_templates table
CREATE TABLE IF NOT EXISTS lineup_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  team_id UUID NOT NULL REFERENCES teams(id),
  name TEXT NOT NULL,
  formation_type TEXT DEFAULT '5-1',
  sport TEXT DEFAULT 'volleyball',
  positions JSONB NOT NULL DEFAULT '[]',
  libero_id UUID,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. RLS for lineup_templates
ALTER TABLE lineup_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lineup templates for their org teams"
  ON lineup_templates FOR SELECT
  USING (
    team_id IN (
      SELECT t.id FROM teams t
      JOIN seasons s ON t.season_id = s.id
      WHERE s.organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Coaches and admins can manage lineup templates"
  ON lineup_templates FOR ALL
  USING (
    created_by = auth.uid()
    OR team_id IN (
      SELECT team_id FROM team_coaches WHERE coach_id = auth.uid()
    )
    OR public.is_platform_admin()
  );

-- 6. Index for performance
CREATE INDEX IF NOT EXISTS idx_game_lineups_event_set
  ON game_lineups(event_id, set_number);
CREATE INDEX IF NOT EXISTS idx_lineup_templates_team
  ON lineup_templates(team_id);
