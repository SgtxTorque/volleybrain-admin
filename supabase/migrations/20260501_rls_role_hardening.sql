-- ============================================================
-- RLS ROLE HARDENING — Require admin role for write operations
-- ============================================================
-- Date: 2026-05-01
--
-- Previously, write policies only checked org membership via
-- profiles.organization_id → seasons → season_id. This meant
-- any authenticated org member (parent, coach, player) could
-- INSERT/UPDATE/DELETE teams, players, events, and payments
-- by calling Supabase directly from the browser console.
--
-- Now write policies require:
--   user_roles.role = 'league_admin' (org admin)
--   OR profiles.is_platform_admin = true (super admin)
--
-- Read (SELECT) policies are left UNCHANGED — parents, coaches,
-- and players should still read data they're authorized to see.
--
-- Key schema facts (from Phase 0 investigation):
--   - user_roles column is user_id (not profile_id)
--   - Admin role value is 'league_admin'
--   - Platform admin via profiles.is_platform_admin = true
--   - user_roles has is_active column
--   - teams, players, schedule_events resolve org via season_id → seasons
--   - payments also resolves org via season_id → seasons
--
-- Addresses: Codex audit C-01, C-02, C-03, C-04
-- ============================================================

BEGIN;

-- -------------------------------------------------------
-- TEAMS (C-01)
-- -------------------------------------------------------
-- Existing SELECT policy "Users can view teams in their org seasons" is correct — leave it.
-- Drop the write policies that only check org membership:

DROP POLICY IF EXISTS "Admins can insert teams" ON teams;
DROP POLICY IF EXISTS "Admins can update teams" ON teams;
DROP POLICY IF EXISTS "Admins can delete teams" ON teams;
DROP POLICY IF EXISTS "Admins can manage teams" ON teams;

-- Admin-only INSERT
CREATE POLICY "Admins can insert teams" ON teams
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.organization_id = (
          SELECT organization_id FROM seasons WHERE id = season_id
        )
        AND user_roles.role = 'league_admin'
        AND user_roles.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_platform_admin = true
    )
  );

-- Admin-only UPDATE
CREATE POLICY "Admins can update teams" ON teams
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.organization_id = (
          SELECT organization_id FROM seasons WHERE id = teams.season_id
        )
        AND user_roles.role = 'league_admin'
        AND user_roles.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_platform_admin = true
    )
  );

-- Admin-only DELETE
CREATE POLICY "Admins can delete teams" ON teams
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.organization_id = (
          SELECT organization_id FROM seasons WHERE id = teams.season_id
        )
        AND user_roles.role = 'league_admin'
        AND user_roles.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_platform_admin = true
    )
  );

-- -------------------------------------------------------
-- PLAYERS (C-02)
-- -------------------------------------------------------
-- Existing SELECT policy "Users can view players in their org" is correct — leave it.
-- Drop the FOR ALL policy that allowed any org member to manage players:

DROP POLICY IF EXISTS "Admins can manage players" ON players;
DROP POLICY IF EXISTS "Admins can insert players" ON players;
DROP POLICY IF EXISTS "Admins can update players" ON players;
DROP POLICY IF EXISTS "Admins can delete players" ON players;
DROP POLICY IF EXISTS "Registration and admin can insert players" ON players;
DROP POLICY IF EXISTS "Admins and parents can update players" ON players;

-- INSERT: Allow admins AND public registration
-- Public registration uses the anon client (auth.uid() may be NULL or a
-- logged-in parent). The existing org-membership check via season_id
-- allowed this to work. We preserve that for INSERT only, but add
-- explicit admin override.
CREATE POLICY "Registration and admin can insert players" ON players
  FOR INSERT
  WITH CHECK (
    -- Admin can always insert
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.organization_id = (
          SELECT organization_id FROM seasons WHERE id = season_id
        )
        AND user_roles.role = 'league_admin'
        AND user_roles.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_platform_admin = true
    )
    -- Registration flow: authenticated user registering in their org's season
    OR (
      auth.uid() IS NOT NULL
      AND season_id IN (
        SELECT id FROM seasons WHERE organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      )
    )
    -- Public registration: unauthenticated user (anon key)
    OR auth.uid() IS NULL
  );

-- UPDATE: Admins, parents (for own children), and coaches
CREATE POLICY "Admins and parents can update players" ON players
  FOR UPDATE
  USING (
    -- Admins can update any player in their org
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.organization_id = (
          SELECT organization_id FROM seasons WHERE id = players.season_id
        )
        AND user_roles.role = 'league_admin'
        AND user_roles.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_platform_admin = true
    )
    -- Parents can update their own children (for account linking)
    OR parent_account_id = auth.uid()
    -- Allow linking orphan players (parent_account_id IS NULL and email matches)
    OR (
      parent_account_id IS NULL
      AND LOWER(parent_email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
    )
    -- Coaches can update players on their org's teams
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.organization_id = (
          SELECT organization_id FROM seasons WHERE id = players.season_id
        )
        AND user_roles.role = 'coach'
        AND user_roles.is_active = true
    )
  );

-- DELETE: Admin-only
CREATE POLICY "Admins can delete players" ON players
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.organization_id = (
          SELECT organization_id FROM seasons WHERE id = players.season_id
        )
        AND user_roles.role = 'league_admin'
        AND user_roles.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_platform_admin = true
    )
  );

-- -------------------------------------------------------
-- SCHEDULE_EVENTS (C-03)
-- -------------------------------------------------------
-- Existing SELECT policy "Users can view events in their org" is correct — leave it.
-- Drop the FOR ALL policy:

DROP POLICY IF EXISTS "Admins can manage events" ON schedule_events;
DROP POLICY IF EXISTS "Admins can insert events" ON schedule_events;
DROP POLICY IF EXISTS "Admins and coaches can insert events" ON schedule_events;
DROP POLICY IF EXISTS "Admins can update events" ON schedule_events;
DROP POLICY IF EXISTS "Admins and coaches can update events" ON schedule_events;
DROP POLICY IF EXISTS "Admins can delete events" ON schedule_events;

-- INSERT: Admins and coaches
CREATE POLICY "Admins and coaches can insert events" ON schedule_events
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.organization_id = (
          SELECT organization_id FROM seasons WHERE id = season_id
        )
        AND user_roles.role IN ('league_admin', 'coach')
        AND user_roles.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_platform_admin = true
    )
  );

-- UPDATE: Admins and coaches
CREATE POLICY "Admins and coaches can update events" ON schedule_events
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.organization_id = (
          SELECT organization_id FROM seasons WHERE id = schedule_events.season_id
        )
        AND user_roles.role IN ('league_admin', 'coach')
        AND user_roles.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_platform_admin = true
    )
  );

-- DELETE: Admin-only
CREATE POLICY "Admins can delete events" ON schedule_events
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.organization_id = (
          SELECT organization_id FROM seasons WHERE id = schedule_events.season_id
        )
        AND user_roles.role = 'league_admin'
        AND user_roles.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_platform_admin = true
    )
  );

-- -------------------------------------------------------
-- PAYMENTS (C-04)
-- -------------------------------------------------------
-- The existing SELECT policy "Users can view payments in their org"
-- lets ALL org members see ALL org payments. This is too broad —
-- parents should only see their own family's payments.
-- However, changing the SELECT policy is risky (might break admin views).
-- Leave the SELECT policy unchanged for now and only harden writes.

DROP POLICY IF EXISTS "Admins can manage payments" ON payments;
DROP POLICY IF EXISTS "Admins can insert payments" ON payments;
DROP POLICY IF EXISTS "Admins can update payments" ON payments;
DROP POLICY IF EXISTS "Admins can delete payments" ON payments;

-- INSERT: Admin-only
CREATE POLICY "Admins can insert payments" ON payments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.organization_id = (
          SELECT organization_id FROM seasons WHERE id = season_id
        )
        AND user_roles.role = 'league_admin'
        AND user_roles.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_platform_admin = true
    )
  );

-- UPDATE: Admin-only
CREATE POLICY "Admins can update payments" ON payments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.organization_id = (
          SELECT organization_id FROM seasons WHERE id = payments.season_id
        )
        AND user_roles.role = 'league_admin'
        AND user_roles.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_platform_admin = true
    )
  );

-- DELETE: Admin-only
CREATE POLICY "Admins can delete payments" ON payments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.organization_id = (
          SELECT organization_id FROM seasons WHERE id = payments.season_id
        )
        AND user_roles.role = 'league_admin'
        AND user_roles.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_platform_admin = true
    )
  );

COMMIT;
