-- ============================================
-- LINEUP V2: Substitution Persistence Migration
-- Run this in Supabase SQL Editor BEFORE testing sub persistence
-- ============================================

-- Add planned_subs column to store substitution plans per event per set
CREATE TABLE IF NOT EXISTS game_lineup_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES schedule_events(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL DEFAULT 1,
  team_id UUID REFERENCES teams(id),
  planned_subs JSONB DEFAULT '[]',
  /*
    [
      {
        "id": "uuid",
        "rotation": 3,
        "outPlayerId": "uuid",
        "inPlayerId": "uuid"
      }
    ]
  */
  bench_order JSONB DEFAULT '[]',  -- For 6-6: ordered list of player IDs for bench queue
  notes TEXT,                       -- Coach notes for this set
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, set_number)
);

ALTER TABLE game_lineup_metadata ENABLE ROW LEVEL SECURITY;

-- Same RLS pattern as game_lineups
CREATE POLICY "Users can view lineup metadata for their org" ON game_lineup_metadata
  FOR SELECT USING (
    event_id IN (
      SELECT se.id FROM schedule_events se
      JOIN teams t ON se.team_id = t.id
      JOIN seasons s ON t.season_id = s.id
      WHERE s.organization_id IN (
        SELECT current_organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Coaches can manage lineup metadata" ON game_lineup_metadata
  FOR ALL USING (
    event_id IN (
      SELECT se.id FROM schedule_events se
      JOIN team_coaches tc ON se.team_id = tc.team_id
      WHERE tc.coach_id = auth.uid()
    )
    OR public.is_platform_admin()
  );

CREATE INDEX IF NOT EXISTS idx_lineup_metadata_event ON game_lineup_metadata(event_id, set_number);
