-- ============================================
-- MULTI-SPORT LINEUP BUILDER MIGRATIONS
-- Run this in the Supabase SQL Editor
-- ============================================

-- Add columns for multi-sport support to game_lineups
ALTER TABLE game_lineups ADD COLUMN IF NOT EXISTS sport TEXT;
ALTER TABLE game_lineups ADD COLUMN IF NOT EXISTS unit TEXT;           -- 'offense', 'defense', 'special_teams' (football only)
ALTER TABLE game_lineups ADD COLUMN IF NOT EXISTS batting_order INTEGER; -- 1-9 (baseball/softball only)
ALTER TABLE game_lineups ADD COLUMN IF NOT EXISTS format_size TEXT;     -- '5v5', '7v7', '11v11' (soccer/flag only)

-- Add to lineup_metadata for sport-specific data
ALTER TABLE game_lineup_metadata ADD COLUMN IF NOT EXISTS sport TEXT;
ALTER TABLE game_lineup_metadata ADD COLUMN IF NOT EXISTS batting_order JSONB DEFAULT '[]';
ALTER TABLE game_lineup_metadata ADD COLUMN IF NOT EXISTS depth_chart JSONB DEFAULT '{}';
ALTER TABLE game_lineup_metadata ADD COLUMN IF NOT EXISTS format_size TEXT;
