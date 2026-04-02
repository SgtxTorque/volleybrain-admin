-- ============================================
-- PRACTICE PLANNING — Database Migration
-- Run in Supabase SQL Editor
-- All tables use IF NOT EXISTS, safe to re-run
-- ============================================

-- ── Table 1: drills ──
CREATE TABLE IF NOT EXISTS drills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  created_by UUID NOT NULL REFERENCES profiles(id),
  sport_id UUID REFERENCES sports(id),
  team_id UUID REFERENCES teams(id),

  -- Content
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  duration_minutes INTEGER NOT NULL DEFAULT 10,
  intensity TEXT DEFAULT 'medium',
  min_players INTEGER,
  max_players INTEGER,
  equipment TEXT[],
  tags TEXT[],

  -- Media
  video_url TEXT,
  video_thumbnail_url TEXT,
  video_source TEXT,
  diagram_url TEXT,

  -- Metadata
  is_public BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drills_org ON drills(org_id);
CREATE INDEX IF NOT EXISTS idx_drills_sport ON drills(sport_id);
CREATE INDEX IF NOT EXISTS idx_drills_category ON drills(category);
CREATE INDEX IF NOT EXISTS idx_drills_created_by ON drills(created_by);

-- ── Table 2: drill_favorites ──
CREATE TABLE IF NOT EXISTS drill_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  drill_id UUID NOT NULL REFERENCES drills(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, drill_id)
);

CREATE INDEX IF NOT EXISTS idx_drill_favorites_user ON drill_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_drill_favorites_drill ON drill_favorites(drill_id);

-- ── Table 3: drill_categories ──
CREATE TABLE IF NOT EXISTS drill_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  sport_id UUID REFERENCES sports(id),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, sport_id, name)
);

CREATE INDEX IF NOT EXISTS idx_drill_categories_org ON drill_categories(org_id);
CREATE INDEX IF NOT EXISTS idx_drill_categories_sport ON drill_categories(sport_id);

-- ── Table 4: practice_plans ──
CREATE TABLE IF NOT EXISTS practice_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  created_by UUID NOT NULL REFERENCES profiles(id),
  sport_id UUID REFERENCES sports(id),
  team_id UUID REFERENCES teams(id),

  title TEXT NOT NULL,
  description TEXT,
  target_duration_minutes INTEGER,
  focus_areas TEXT[],
  is_template BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_practice_plans_org ON practice_plans(org_id);
CREATE INDEX IF NOT EXISTS idx_practice_plans_sport ON practice_plans(sport_id);
CREATE INDEX IF NOT EXISTS idx_practice_plans_team ON practice_plans(team_id);

-- ── Table 5: practice_plan_favorites ──
CREATE TABLE IF NOT EXISTS practice_plan_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  practice_plan_id UUID NOT NULL REFERENCES practice_plans(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, practice_plan_id)
);

-- ── Table 6: practice_plan_items ──
CREATE TABLE IF NOT EXISTS practice_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_plan_id UUID NOT NULL REFERENCES practice_plans(id) ON DELETE CASCADE,
  drill_id UUID REFERENCES drills(id),

  sort_order INTEGER NOT NULL DEFAULT 0,
  custom_title TEXT,
  custom_notes TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 10,
  item_type TEXT DEFAULT 'drill',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_practice_plan_items_plan ON practice_plan_items(practice_plan_id);

-- ── Table 7: event_practice_plans ──
CREATE TABLE IF NOT EXISTS event_practice_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES schedule_events(id) ON DELETE CASCADE,
  practice_plan_id UUID NOT NULL REFERENCES practice_plans(id),
  status TEXT DEFAULT 'draft',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  coach_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id)
);

CREATE INDEX IF NOT EXISTS idx_event_practice_plans_event ON event_practice_plans(event_id);

-- ── Table 8: player_development_assignments ──
CREATE TABLE IF NOT EXISTS player_development_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  player_id UUID NOT NULL REFERENCES players(id),
  assigned_by UUID NOT NULL REFERENCES profiles(id),
  team_id UUID REFERENCES teams(id),

  -- What's assigned
  drill_id UUID REFERENCES drills(id),
  assignment_type TEXT NOT NULL DEFAULT 'drill',
  custom_title TEXT,
  custom_description TEXT,
  custom_video_url TEXT,

  -- Goals
  player_goal TEXT,
  target_completions INTEGER DEFAULT 1,
  current_completions INTEGER DEFAULT 0,

  -- Status
  status TEXT DEFAULT 'assigned',
  due_date DATE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Player response (filled on mobile, visible on web)
  player_notes TEXT,
  player_video_url TEXT,
  player_rating INTEGER CHECK (player_rating BETWEEN 1 AND 5),

  -- Coach feedback (filled on web)
  coach_feedback TEXT,
  coach_rating INTEGER CHECK (coach_rating BETWEEN 1 AND 5),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dev_assignments_player ON player_development_assignments(player_id);
CREATE INDEX IF NOT EXISTS idx_dev_assignments_org ON player_development_assignments(org_id);
CREATE INDEX IF NOT EXISTS idx_dev_assignments_team ON player_development_assignments(team_id);
CREATE INDEX IF NOT EXISTS idx_dev_assignments_status ON player_development_assignments(status);

-- ── Table 9: reflection_templates ──
CREATE TABLE IF NOT EXISTS reflection_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  created_by UUID NOT NULL REFERENCES profiles(id),
  sport_id UUID REFERENCES sports(id),

  title TEXT NOT NULL,
  reflection_type TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,

  questions JSONB NOT NULL DEFAULT '[]',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reflection_templates_org ON reflection_templates(org_id);

-- ── Table 10: practice_reflections ──
CREATE TABLE IF NOT EXISTS practice_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES schedule_events(id),
  player_id UUID NOT NULL REFERENCES players(id),
  reflection_type TEXT NOT NULL,
  template_id UUID REFERENCES reflection_templates(id),

  responses JSONB NOT NULL DEFAULT '{}',

  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, player_id, reflection_type)
);

CREATE INDEX IF NOT EXISTS idx_reflections_event ON practice_reflections(event_id);
CREATE INDEX IF NOT EXISTS idx_reflections_player ON practice_reflections(player_id);


-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE drills ENABLE ROW LEVEL SECURITY;
ALTER TABLE drill_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE drill_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_plan_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_practice_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_development_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflection_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_reflections ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies: drills ──
CREATE POLICY IF NOT EXISTS "drills_select_org" ON drills FOR SELECT USING (
  org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY IF NOT EXISTS "drills_insert_coach_admin" ON drills FOR INSERT WITH CHECK (
  org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
  AND (
    public.is_platform_admin()
    OR EXISTS (SELECT 1 FROM team_coaches WHERE user_id = auth.uid() AND team_id IS NOT DISTINCT FROM drills.team_id)
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND organization_id = drills.org_id)
  )
);
CREATE POLICY IF NOT EXISTS "drills_update_coach_admin" ON drills FOR UPDATE USING (
  org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
  AND (
    created_by = auth.uid()
    OR public.is_platform_admin()
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND organization_id = drills.org_id)
  )
);
CREATE POLICY IF NOT EXISTS "drills_delete_coach_admin" ON drills FOR DELETE USING (
  org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
  AND (
    created_by = auth.uid()
    OR public.is_platform_admin()
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND organization_id = drills.org_id)
  )
);

-- ── RLS Policies: drill_favorites ──
CREATE POLICY IF NOT EXISTS "drill_favorites_select_own" ON drill_favorites FOR SELECT USING (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "drill_favorites_insert_own" ON drill_favorites FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "drill_favorites_delete_own" ON drill_favorites FOR DELETE USING (user_id = auth.uid());

-- ── RLS Policies: drill_categories ──
CREATE POLICY IF NOT EXISTS "drill_categories_select_all" ON drill_categories FOR SELECT USING (
  org_id IS NULL OR org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY IF NOT EXISTS "drill_categories_insert_admin" ON drill_categories FOR INSERT WITH CHECK (
  org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
  AND (
    public.is_platform_admin()
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND organization_id = drill_categories.org_id)
  )
);
CREATE POLICY IF NOT EXISTS "drill_categories_update_admin" ON drill_categories FOR UPDATE USING (
  org_id IS NOT NULL
  AND org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
  AND (
    public.is_platform_admin()
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND organization_id = drill_categories.org_id)
  )
);

-- ── RLS Policies: practice_plans ──
CREATE POLICY IF NOT EXISTS "practice_plans_select_org" ON practice_plans FOR SELECT USING (
  org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY IF NOT EXISTS "practice_plans_insert_coach_admin" ON practice_plans FOR INSERT WITH CHECK (
  org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY IF NOT EXISTS "practice_plans_update_coach_admin" ON practice_plans FOR UPDATE USING (
  org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
  AND (
    created_by = auth.uid()
    OR public.is_platform_admin()
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND organization_id = practice_plans.org_id)
  )
);
CREATE POLICY IF NOT EXISTS "practice_plans_delete_coach_admin" ON practice_plans FOR DELETE USING (
  org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
  AND (
    created_by = auth.uid()
    OR public.is_platform_admin()
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND organization_id = practice_plans.org_id)
  )
);

-- ── RLS Policies: practice_plan_favorites ──
CREATE POLICY IF NOT EXISTS "plan_favorites_select_own" ON practice_plan_favorites FOR SELECT USING (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "plan_favorites_insert_own" ON practice_plan_favorites FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "plan_favorites_delete_own" ON practice_plan_favorites FOR DELETE USING (user_id = auth.uid());

-- ── RLS Policies: practice_plan_items ──
CREATE POLICY IF NOT EXISTS "plan_items_select_via_plan" ON practice_plan_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM practice_plans
    WHERE practice_plans.id = practice_plan_items.practice_plan_id
    AND practice_plans.org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
  )
);
CREATE POLICY IF NOT EXISTS "plan_items_insert_via_plan" ON practice_plan_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM practice_plans
    WHERE practice_plans.id = practice_plan_items.practice_plan_id
    AND practice_plans.org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
  )
);
CREATE POLICY IF NOT EXISTS "plan_items_update_via_plan" ON practice_plan_items FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM practice_plans
    WHERE practice_plans.id = practice_plan_items.practice_plan_id
    AND practice_plans.org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
  )
);
CREATE POLICY IF NOT EXISTS "plan_items_delete_via_plan" ON practice_plan_items FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM practice_plans
    WHERE practice_plans.id = practice_plan_items.practice_plan_id
    AND practice_plans.org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
  )
);

-- ── RLS Policies: event_practice_plans ──
CREATE POLICY IF NOT EXISTS "event_plans_select_org" ON event_practice_plans FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM practice_plans
    WHERE practice_plans.id = event_practice_plans.practice_plan_id
    AND practice_plans.org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
  )
);
CREATE POLICY IF NOT EXISTS "event_plans_insert_coach_admin" ON event_practice_plans FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM practice_plans
    WHERE practice_plans.id = event_practice_plans.practice_plan_id
    AND practice_plans.org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
  )
);
CREATE POLICY IF NOT EXISTS "event_plans_update_coach_admin" ON event_practice_plans FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM practice_plans
    WHERE practice_plans.id = event_practice_plans.practice_plan_id
    AND practice_plans.org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
  )
);

-- ── RLS Policies: player_development_assignments ──
CREATE POLICY IF NOT EXISTS "dev_assign_select_org" ON player_development_assignments FOR SELECT USING (
  org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY IF NOT EXISTS "dev_assign_insert_coach_admin" ON player_development_assignments FOR INSERT WITH CHECK (
  org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
  AND (
    public.is_platform_admin()
    OR EXISTS (SELECT 1 FROM team_coaches WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND organization_id = player_development_assignments.org_id)
  )
);
CREATE POLICY IF NOT EXISTS "dev_assign_update_coach_or_player" ON player_development_assignments FOR UPDATE USING (
  org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
  AND (
    assigned_by = auth.uid()
    OR reviewed_by = auth.uid()
    OR public.is_platform_admin()
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND organization_id = player_development_assignments.org_id)
    -- Players can update their own rows (player_notes, player_rating, current_completions, status)
    OR EXISTS (SELECT 1 FROM players WHERE players.id = player_development_assignments.player_id AND players.profile_id = auth.uid())
  )
);

-- ── RLS Policies: reflection_templates ──
CREATE POLICY IF NOT EXISTS "reflection_templates_select_org" ON reflection_templates FOR SELECT USING (
  org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY IF NOT EXISTS "reflection_templates_insert_coach_admin" ON reflection_templates FOR INSERT WITH CHECK (
  org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY IF NOT EXISTS "reflection_templates_update_coach_admin" ON reflection_templates FOR UPDATE USING (
  org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
  AND (
    created_by = auth.uid()
    OR public.is_platform_admin()
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND organization_id = reflection_templates.org_id)
  )
);

-- ── RLS Policies: practice_reflections ──
CREATE POLICY IF NOT EXISTS "reflections_select_org" ON practice_reflections FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM schedule_events se
    JOIN teams t ON t.id = se.team_id
    WHERE se.id = practice_reflections.event_id
    AND t.organization_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
  )
);
CREATE POLICY IF NOT EXISTS "reflections_insert_player" ON practice_reflections FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM players WHERE players.id = practice_reflections.player_id AND players.profile_id = auth.uid())
);
CREATE POLICY IF NOT EXISTS "reflections_update_player" ON practice_reflections FOR UPDATE USING (
  EXISTS (SELECT 1 FROM players WHERE players.id = practice_reflections.player_id AND players.profile_id = auth.uid())
);


-- ============================================
-- SEED DATA
-- ============================================

-- Universal drill categories (org_id = NULL = system-wide)
INSERT INTO drill_categories (org_id, sport_id, name, display_name, sort_order) VALUES
  (NULL, NULL, 'warmup', 'Warm Up', 1),
  (NULL, NULL, 'conditioning', 'Conditioning', 2),
  (NULL, NULL, 'skill_work', 'Skill Work', 3),
  (NULL, NULL, 'game_like', 'Game-Like', 4),
  (NULL, NULL, 'scrimmage', 'Scrimmage', 5),
  (NULL, NULL, 'cooldown', 'Cool Down', 6)
ON CONFLICT DO NOTHING;

-- Volleyball-specific categories (use subquery for sport_id)
INSERT INTO drill_categories (org_id, sport_id, name, display_name, sort_order)
SELECT NULL, id, name, display_name, sort_order FROM (VALUES
  ('serving', 'Serving', 10),
  ('passing', 'Passing', 11),
  ('setting', 'Setting', 12),
  ('attacking', 'Attacking', 13),
  ('blocking', 'Blocking', 14),
  ('defense', 'Defense', 15),
  ('transition', 'Transition', 16),
  ('serve_receive', 'Serve Receive', 17)
) AS v(name, display_name, sort_order)
CROSS JOIN sports WHERE sports.name ILIKE '%volleyball%'
ON CONFLICT DO NOTHING;
