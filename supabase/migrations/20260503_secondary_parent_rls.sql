-- ============================================================
-- Secondary Parent Access: Update RLS policies to recognize
-- player_parents junction table for secondary parents.
--
-- Pattern: For each policy checking parent_account_id,
-- add an OR EXISTS check against player_parents.
-- ============================================================

-- 1. jersey_assignments (SELECT)
DROP POLICY IF EXISTS "Parents can view child jerseys" ON jersey_assignments;
CREATE POLICY "Parents can view child jerseys" ON jersey_assignments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = jersey_assignments.player_id
        AND p.parent_account_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM player_parents pp
      WHERE pp.player_id = jersey_assignments.player_id
        AND pp.parent_id = auth.uid()
    )
  );

-- 2. league_standings (SELECT)
DROP POLICY IF EXISTS "league_standings_player_select" ON league_standings;
CREATE POLICY "league_standings_player_select" ON league_standings FOR SELECT TO authenticated
  USING (
    player_id = auth.uid()
    OR team_id IN (
      SELECT tp.team_id FROM team_players tp
      JOIN players p ON p.id = tp.player_id
      WHERE p.parent_account_id = auth.uid()
    )
    OR team_id IN (
      SELECT tp.team_id FROM team_players tp
      JOIN player_parents pp ON pp.player_id = tp.player_id
      WHERE pp.parent_id = auth.uid()
    )
  );

-- 3. payments (SELECT)
DROP POLICY IF EXISTS "Role-scoped payment read" ON payments;
CREATE POLICY "Role-scoped payment read" ON payments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN seasons s ON s.organization_id = ur.organization_id
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'league_admin'
        AND ur.is_active = true
        AND s.id = payments.season_id
    )
    OR EXISTS (
      SELECT 1 FROM team_players tp
      JOIN team_coaches tc ON tc.team_id = tp.team_id
      JOIN coaches c ON c.id = tc.coach_id
      WHERE tp.player_id = payments.player_id
        AND c.profile_id = auth.uid()
    )
    OR player_id IN (
      SELECT players.id FROM players
      WHERE players.parent_account_id = auth.uid()
    )
    OR player_id IN (
      SELECT pp.player_id FROM player_parents pp
      WHERE pp.parent_id = auth.uid()
    )
  );

-- 4. player_achievements (SELECT)
DROP POLICY IF EXISTS "Player achievements are viewable by stakeholders" ON player_achievements;
CREATE POLICY "Player achievements are viewable by stakeholders" ON player_achievements FOR SELECT TO authenticated
  USING (
    player_id IN (
      SELECT players.id FROM players
      WHERE players.parent_account_id = auth.uid()
    )
    OR player_id IN (
      SELECT pp.player_id FROM player_parents pp
      WHERE pp.parent_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM team_players tp
      JOIN team_coaches tc ON tp.team_id = tc.team_id
      JOIN coaches c ON tc.coach_id = c.id
      WHERE tp.player_id = player_achievements.player_id
        AND c.profile_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = ANY(ARRAY['admin', 'league_admin'])
        AND user_roles.is_active = true
    )
  );

-- 5. player_tracked_achievements (ALL — full access for secondary parents)
DROP POLICY IF EXISTS "Players/parents can manage tracked achievements" ON player_tracked_achievements;
CREATE POLICY "Players/parents can manage tracked achievements" ON player_tracked_achievements FOR ALL TO authenticated
  USING (
    player_id IN (
      SELECT players.id FROM players
      WHERE players.parent_account_id = auth.uid()
    )
    OR player_id IN (
      SELECT pp.player_id FROM player_parents pp
      WHERE pp.parent_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = ANY(ARRAY['admin', 'league_admin'])
        AND user_roles.is_active = true
    )
  );

-- 6. players (SELECT — "Role-scoped player read")
DROP POLICY IF EXISTS "Role-scoped player read" ON players;
CREATE POLICY "Role-scoped player read" ON players FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN seasons s ON s.organization_id = ur.organization_id
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'league_admin'
        AND ur.is_active = true
        AND s.id = players.season_id
    )
    OR EXISTS (
      SELECT 1 FROM team_players tp
      JOIN team_coaches tc ON tc.team_id = tp.team_id
      JOIN coaches c ON c.id = tc.coach_id
      WHERE tp.player_id = players.id
        AND c.profile_id = auth.uid()
    )
    OR parent_account_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM player_parents pp
      WHERE pp.player_id = players.id
        AND pp.parent_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.id = players.parent_account_id
    )
  );

-- 7. players (SELECT — "Players can read own record")
DROP POLICY IF EXISTS "Players can read own record" ON players;
CREATE POLICY "Players can read own record" ON players FOR SELECT TO authenticated
  USING (
    profile_id = auth.uid()
    OR parent_account_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM player_parents pp
      WHERE pp.player_id = players.id
        AND pp.parent_id = auth.uid()
    )
    OR season_id IN (
      SELECT seasons.id FROM seasons
      WHERE seasons.organization_id IN (
        SELECT user_roles.organization_id FROM user_roles
        WHERE user_roles.user_id = auth.uid()
          AND user_roles.is_active = true
      )
    )
  );

-- 8. team_players (SELECT)
DROP POLICY IF EXISTS "Allow parents to read team_players" ON team_players;
CREATE POLICY "Allow parents to read team_players" ON team_players FOR SELECT TO authenticated
  USING (
    player_id IN (
      SELECT players.id FROM players
      WHERE players.parent_account_id = auth.uid()
    )
    OR player_id IN (
      SELECT pp.player_id FROM player_parents pp
      WHERE pp.parent_id = auth.uid()
    )
  );

-- 9. team_posts (SELECT)
DROP POLICY IF EXISTS "Team members can view posts" ON team_posts;
CREATE POLICY "Team members can view posts" ON team_posts FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_players tp
      JOIN players p ON tp.player_id = p.id
      WHERE tp.team_id = team_posts.team_id
        AND p.parent_account_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM team_players tp
      JOIN player_parents pp ON pp.player_id = tp.player_id
      WHERE tp.team_id = team_posts.team_id
        AND pp.parent_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM team_coaches tc
      JOIN coaches c ON tc.coach_id = c.id
      JOIN profiles pr ON pr.id = auth.uid()
      WHERE tc.team_id = team_posts.team_id
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = ANY(ARRAY['admin', 'owner'])
    )
  );

-- 10. team_quest_contributions (SELECT)
DROP POLICY IF EXISTS "tq_contributions_select" ON team_quest_contributions;
CREATE POLICY "tq_contributions_select" ON team_quest_contributions FOR SELECT TO authenticated
  USING (
    team_quest_id IN (
      SELECT tq.id FROM team_quests tq
      WHERE tq.team_id IN (
        SELECT tp.team_id FROM team_players tp
        JOIN players p ON p.id = tp.player_id
        WHERE p.parent_account_id = auth.uid()
      )
    )
    OR team_quest_id IN (
      SELECT tq.id FROM team_quests tq
      WHERE tq.team_id IN (
        SELECT tp.team_id FROM team_players tp
        JOIN player_parents pp ON pp.player_id = tp.player_id
        WHERE pp.parent_id = auth.uid()
      )
    )
    OR team_quest_id IN (
      SELECT tq.id FROM team_quests tq
      WHERE tq.team_id IN (
        SELECT ts.team_id FROM team_staff ts
        WHERE ts.user_id = auth.uid() AND ts.is_active = true
      )
    )
  );

-- 11. team_quests (SELECT)
DROP POLICY IF EXISTS "team_quests_member_select" ON team_quests;
CREATE POLICY "team_quests_member_select" ON team_quests FOR SELECT TO authenticated
  USING (
    team_id IN (
      SELECT tp.team_id FROM team_players tp
      JOIN players p ON p.id = tp.player_id
      WHERE p.parent_account_id = auth.uid()
    )
    OR team_id IN (
      SELECT tp.team_id FROM team_players tp
      JOIN player_parents pp ON pp.player_id = tp.player_id
      WHERE pp.parent_id = auth.uid()
    )
    OR team_id IN (
      SELECT ts.team_id FROM team_staff ts
      WHERE ts.user_id = auth.uid() AND ts.is_active = true
    )
  );

-- 12. waiver_signatures (SELECT)
DROP POLICY IF EXISTS "Role-scoped waiver signature read" ON waiver_signatures;
CREATE POLICY "Role-scoped waiver signature read" ON waiver_signatures FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'league_admin'
        AND ur.is_active = true
        AND ur.organization_id = waiver_signatures.organization_id
    )
    OR signed_by_user_id = auth.uid()
    OR player_id IN (
      SELECT players.id FROM players
      WHERE players.parent_account_id = auth.uid()
    )
    OR player_id IN (
      SELECT pp.player_id FROM player_parents pp
      WHERE pp.parent_id = auth.uid()
    )
  );
