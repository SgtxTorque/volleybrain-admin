-- ============================================================================
-- MISSING_TABLES.sql — VolleyBrain Web Admin
--
-- Creates missing tables and adds missing columns that the web codebase expects.
-- Run this in the Supabase SQL Editor.
--
-- Tables created:
--   1. post_reactions — emoji reactions on team_posts
--   2. games — game records with scores and results
--
-- Columns added:
--   3. player_achievements.created_at — missing timestamp column
--
-- ⚠️  REVIEW BEFORE RUNNING — especially foreign key references
-- ============================================================================


-- ============================================================================
-- 1. POST_REACTIONS TABLE
-- ============================================================================
-- Referenced by:
--   src/components/teams/ReactionBar.jsx
--   src/pages/public/TeamWallPage.jsx
--
-- Note: DATABASE_SCHEMA.md mentions this might be "team_post_reactions" but
-- the web code queries "post_reactions". Creating as "post_reactions".
-- ============================================================================

CREATE TABLE IF NOT EXISTS post_reactions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       uuid NOT NULL REFERENCES team_posts(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type text NOT NULL DEFAULT 'like',
  created_at    timestamptz NOT NULL DEFAULT now(),

  -- One reaction per user per post (app deletes old before inserting new type)
  CONSTRAINT post_reactions_user_post_unique UNIQUE (post_id, user_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id
  ON post_reactions (post_id);

CREATE INDEX IF NOT EXISTS idx_post_reactions_user_id
  ON post_reactions (user_id);

-- RLS policies
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read reactions
CREATE POLICY "post_reactions_select"
  ON post_reactions FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert their own reactions
CREATE POLICY "post_reactions_insert"
  ON post_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reactions
CREATE POLICY "post_reactions_delete"
  ON post_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ============================================================================
-- 2. GAMES TABLE
-- ============================================================================
-- Referenced by:
--   src/pages/dashboard/CoachDashboard.jsx  (team_id, team_score, opponent_score, status, date)
--   src/pages/dashboard/DashboardPage.jsx   (home_team_id, away_team_id, home_score, away_score, status)
--   src/pages/public/TeamWallPage.jsx       (home_team_id, away_team_id, home_score, away_score, status)
--   src/pages/teams/TeamWallPage.jsx        (referenced in DATABASE_SCHEMA.md)
--
-- The code uses TWO query patterns:
--   Pattern A: home_team_id / away_team_id / home_score / away_score
--   Pattern B: team_id / team_score / opponent_score
-- Both patterns are included as columns.
-- ============================================================================

CREATE TABLE IF NOT EXISTS games (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to schedule event (optional — game may exist without a schedule entry)
  schedule_event_id  uuid REFERENCES schedule_events(id) ON DELETE SET NULL,

  -- Team & season context
  team_id            uuid REFERENCES teams(id) ON DELETE CASCADE,
  season_id          uuid REFERENCES seasons(id) ON DELETE SET NULL,

  -- Pattern A columns: home/away (used by DashboardPage, public TeamWallPage)
  home_team_id       uuid REFERENCES teams(id) ON DELETE SET NULL,
  away_team_id       uuid REFERENCES teams(id) ON DELETE SET NULL,
  home_score         integer DEFAULT 0,
  away_score         integer DEFAULT 0,

  -- Pattern B columns: team vs opponent (used by CoachDashboard)
  team_score         integer DEFAULT 0,
  opponent_score     integer DEFAULT 0,
  opponent_name      text,

  -- Game metadata
  date               date,
  status             text NOT NULL DEFAULT 'scheduled'
                     CHECK (status IN ('scheduled', 'in_progress', 'completed')),
  result             text CHECK (result IS NULL OR result IN ('win', 'loss', 'tie')),
  notes              text,

  -- Timestamps
  completed_at       timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_games_team_id
  ON games (team_id);

CREATE INDEX IF NOT EXISTS idx_games_home_team_id
  ON games (home_team_id);

CREATE INDEX IF NOT EXISTS idx_games_away_team_id
  ON games (away_team_id);

CREATE INDEX IF NOT EXISTS idx_games_status
  ON games (status);

CREATE INDEX IF NOT EXISTS idx_games_date
  ON games (date);

CREATE INDEX IF NOT EXISTS idx_games_season_id
  ON games (season_id);

-- Composite index for the most common query pattern (completed games for a team)
CREATE INDEX IF NOT EXISTS idx_games_team_status_date
  ON games (team_id, status, date DESC);

-- RLS policies
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read games
CREATE POLICY "games_select"
  ON games FOR SELECT
  TO authenticated
  USING (true);

-- Admins and coaches can insert games
CREATE POLICY "games_insert"
  ON games FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admins and coaches can update games
CREATE POLICY "games_update"
  ON games FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Admins can delete games
CREATE POLICY "games_delete"
  ON games FOR DELETE
  TO authenticated
  USING (true);


-- ============================================================================
-- 3. PLAYER_ACHIEVEMENTS — ADD MISSING created_at COLUMN
-- ============================================================================
-- The table EXISTS but is missing the created_at column.
-- Code references .order('created_at', ...) in:
--   src/components/parent/ParentLeftSidebar.jsx
--   src/components/parent/ParentRightPanel.jsx
--   src/components/parent/ParentHeroCard.jsx
--
-- Also adds UNIQUE constraint for upsert operations used in:
--   src/lib/achievement-engine.js  (.upsert with onConflict: 'player_id,achievement_id')
--   src/lib/shoutout-service.js    (.upsert with onConflict: 'player_id,achievement_id')
-- ============================================================================

-- Add the missing created_at column
ALTER TABLE player_achievements
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Backfill existing rows: set created_at = earned_at for rows where it's null
UPDATE player_achievements
  SET created_at = COALESCE(earned_at, now())
  WHERE created_at IS NULL;

-- Add unique constraint for upsert operations (if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'player_achievements_player_achievement_unique'
  ) THEN
    ALTER TABLE player_achievements
      ADD CONSTRAINT player_achievements_player_achievement_unique
      UNIQUE (player_id, achievement_id);
  END IF;
END $$;

-- Index on created_at for ordering queries
CREATE INDEX IF NOT EXISTS idx_player_achievements_created_at
  ON player_achievements (created_at DESC);


-- ============================================================================
-- DONE — Verify with:
--
--   SELECT table_name, column_name, data_type
--   FROM information_schema.columns
--   WHERE table_name IN ('post_reactions', 'games', 'player_achievements')
--   ORDER BY table_name, ordinal_position;
-- ============================================================================
