-- ============================================
-- RLS POLICIES — Run in Supabase SQL Editor
-- ============================================
-- These policies enforce organization-level data isolation.
-- Run this migration AFTER verifying it works on a test/staging environment.
-- ============================================

-- 1. TEAMS — users can only see teams in their organization's seasons
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view teams in their org seasons" ON teams
  FOR SELECT USING (
    season_id IN (
      SELECT id FROM seasons WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can insert teams" ON teams
  FOR INSERT WITH CHECK (
    season_id IN (
      SELECT id FROM seasons WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can update teams" ON teams
  FOR UPDATE USING (
    season_id IN (
      SELECT id FROM seasons WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- 2. PLAYERS — scoped to org via season
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view players in their org" ON players
  FOR SELECT USING (
    season_id IN (
      SELECT id FROM seasons WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage players" ON players
  FOR ALL USING (
    season_id IN (
      SELECT id FROM seasons WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- 3. SCHEDULE_EVENTS — scoped to org via season
ALTER TABLE schedule_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view events in their org" ON schedule_events
  FOR SELECT USING (
    season_id IN (
      SELECT id FROM seasons WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage events" ON schedule_events
  FOR ALL USING (
    season_id IN (
      SELECT id FROM seasons WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- 4. PAYMENTS — scoped to org via season
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payments in their org" ON payments
  FOR SELECT USING (
    season_id IN (
      SELECT id FROM seasons WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage payments" ON payments
  FOR ALL USING (
    season_id IN (
      SELECT id FROM seasons WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- 5. MESSAGES (blasts) — scoped to org via season
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their org" ON messages
  FOR SELECT USING (
    season_id IN (
      SELECT id FROM seasons WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can send messages in their org" ON messages
  FOR INSERT WITH CHECK (
    season_id IN (
      SELECT id FROM seasons WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- 6. NOTIFICATIONS — scoped to org directly
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org notifications" ON notifications
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- 7. NOTIFICATION_TEMPLATES — scoped to org directly
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org templates" ON notification_templates
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- NOTE: These policies assume:
-- 1. profiles.organization_id links users to their org
-- 2. seasons.organization_id links seasons to their org
-- 3. Most tables cascade through season_id → seasons → organization_id
-- 4. auth.uid() returns the authenticated user's ID
--
-- IMPORTANT: Test on staging before applying to production.
-- If any queries break, you may need to add service_role bypass
-- or adjust the policy conditions.
