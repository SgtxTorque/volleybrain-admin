-- ============================================================================
-- PRACTICE PLANNING — RLS FIX + SEED FIX
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 0: Create is_platform_admin() function if it doesn't exist
-- This is referenced by multiple RLS policies across the app
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- Step 1: Enable RLS on all 10 practice tables (idempotent)
-- ============================================================================
ALTER TABLE IF EXISTS drills ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS drill_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS drill_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS practice_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS practice_plan_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS practice_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS event_practice_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS player_development_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reflection_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS practice_reflections ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Step 2: Drop existing policies (clean slate — avoids "already exists" errors)
-- ============================================================================

-- drills
DROP POLICY IF EXISTS "drills_select_org" ON drills;
DROP POLICY IF EXISTS "drills_insert_coach_admin" ON drills;
DROP POLICY IF EXISTS "drills_update_coach_admin" ON drills;
DROP POLICY IF EXISTS "drills_delete_coach_admin" ON drills;

-- drill_favorites
DROP POLICY IF EXISTS "drill_favorites_select_own" ON drill_favorites;
DROP POLICY IF EXISTS "drill_favorites_insert_own" ON drill_favorites;
DROP POLICY IF EXISTS "drill_favorites_delete_own" ON drill_favorites;

-- drill_categories
DROP POLICY IF EXISTS "drill_categories_select_all" ON drill_categories;
DROP POLICY IF EXISTS "drill_categories_insert_admin" ON drill_categories;
DROP POLICY IF EXISTS "drill_categories_update_admin" ON drill_categories;

-- practice_plans
DROP POLICY IF EXISTS "practice_plans_select_org" ON practice_plans;
DROP POLICY IF EXISTS "practice_plans_insert_coach_admin" ON practice_plans;
DROP POLICY IF EXISTS "practice_plans_update_coach_admin" ON practice_plans;
DROP POLICY IF EXISTS "practice_plans_delete_coach_admin" ON practice_plans;

-- practice_plan_favorites
DROP POLICY IF EXISTS "practice_plan_favorites_select_own" ON practice_plan_favorites;
DROP POLICY IF EXISTS "practice_plan_favorites_insert_own" ON practice_plan_favorites;
DROP POLICY IF EXISTS "practice_plan_favorites_delete_own" ON practice_plan_favorites;

-- practice_plan_items
DROP POLICY IF EXISTS "practice_plan_items_select_via_plan" ON practice_plan_items;
DROP POLICY IF EXISTS "practice_plan_items_insert_via_plan" ON practice_plan_items;
DROP POLICY IF EXISTS "practice_plan_items_update_via_plan" ON practice_plan_items;
DROP POLICY IF EXISTS "practice_plan_items_delete_via_plan" ON practice_plan_items;

-- event_practice_plans
DROP POLICY IF EXISTS "event_practice_plans_select_org" ON event_practice_plans;
DROP POLICY IF EXISTS "event_practice_plans_insert_coach_admin" ON event_practice_plans;
DROP POLICY IF EXISTS "event_practice_plans_update_coach_admin" ON event_practice_plans;

-- player_development_assignments
DROP POLICY IF EXISTS "player_development_assignments_select_org" ON player_development_assignments;
DROP POLICY IF EXISTS "player_development_assignments_insert_coach_admin" ON player_development_assignments;
DROP POLICY IF EXISTS "player_development_assignments_update_coach_or_player" ON player_development_assignments;

-- reflection_templates
DROP POLICY IF EXISTS "reflection_templates_select_org" ON reflection_templates;
DROP POLICY IF EXISTS "reflection_templates_insert_coach_admin" ON reflection_templates;
DROP POLICY IF EXISTS "reflection_templates_update_coach_admin" ON reflection_templates;

-- practice_reflections
DROP POLICY IF EXISTS "practice_reflections_select_org" ON practice_reflections;
DROP POLICY IF EXISTS "practice_reflections_insert_player" ON practice_reflections;
DROP POLICY IF EXISTS "practice_reflections_update_player" ON practice_reflections;

-- ============================================================================
-- Step 3: Create RLS policies for all 10 tables
-- ============================================================================

-- ---- DRILLS ----
CREATE POLICY "drills_select_org" ON drills FOR SELECT USING (
  org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
  OR org_id IS NULL
);
CREATE POLICY "drills_insert_coach_admin" ON drills FOR INSERT WITH CHECK (
  org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "drills_update_coach_admin" ON drills FOR UPDATE USING (
  created_by = auth.uid()
  OR public.is_platform_admin()
  OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND organization_id = drills.org_id)
);
CREATE POLICY "drills_delete_coach_admin" ON drills FOR DELETE USING (
  created_by = auth.uid()
  OR public.is_platform_admin()
  OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND organization_id = drills.org_id)
);

-- ---- DRILL_FAVORITES ----
CREATE POLICY "drill_favorites_select_own" ON drill_favorites FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "drill_favorites_insert_own" ON drill_favorites FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "drill_favorites_delete_own" ON drill_favorites FOR DELETE USING (user_id = auth.uid());

-- ---- DRILL_CATEGORIES ----
CREATE POLICY "drill_categories_select_all" ON drill_categories FOR SELECT USING (
  org_id IS NULL
  OR org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "drill_categories_insert_admin" ON drill_categories FOR INSERT WITH CHECK (
  public.is_platform_admin()
  OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND organization_id = drill_categories.org_id)
);
CREATE POLICY "drill_categories_update_admin" ON drill_categories FOR UPDATE USING (
  public.is_platform_admin()
  OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND organization_id = drill_categories.org_id)
);

-- ---- PRACTICE_PLANS ----
CREATE POLICY "practice_plans_select_org" ON practice_plans FOR SELECT USING (
  org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "practice_plans_insert_coach_admin" ON practice_plans FOR INSERT WITH CHECK (
  org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "practice_plans_update_coach_admin" ON practice_plans FOR UPDATE USING (
  created_by = auth.uid()
  OR public.is_platform_admin()
  OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND organization_id = practice_plans.org_id)
);
CREATE POLICY "practice_plans_delete_coach_admin" ON practice_plans FOR DELETE USING (
  created_by = auth.uid()
  OR public.is_platform_admin()
  OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND organization_id = practice_plans.org_id)
);

-- ---- PRACTICE_PLAN_FAVORITES ----
CREATE POLICY "practice_plan_favorites_select_own" ON practice_plan_favorites FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "practice_plan_favorites_insert_own" ON practice_plan_favorites FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "practice_plan_favorites_delete_own" ON practice_plan_favorites FOR DELETE USING (user_id = auth.uid());

-- ---- PRACTICE_PLAN_ITEMS ----
CREATE POLICY "practice_plan_items_select_via_plan" ON practice_plan_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM practice_plans
    WHERE practice_plans.id = practice_plan_items.practice_plan_id
    AND practice_plans.org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
  )
);
CREATE POLICY "practice_plan_items_insert_via_plan" ON practice_plan_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM practice_plans
    WHERE practice_plans.id = practice_plan_items.practice_plan_id
    AND practice_plans.org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
  )
);
CREATE POLICY "practice_plan_items_update_via_plan" ON practice_plan_items FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM practice_plans
    WHERE practice_plans.id = practice_plan_items.practice_plan_id
    AND practice_plans.org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
  )
);
CREATE POLICY "practice_plan_items_delete_via_plan" ON practice_plan_items FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM practice_plans
    WHERE practice_plans.id = practice_plan_items.practice_plan_id
    AND practice_plans.org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
  )
);

-- ---- EVENT_PRACTICE_PLANS ----
CREATE POLICY "event_practice_plans_select_org" ON event_practice_plans FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM schedule_events
    WHERE schedule_events.id = event_practice_plans.event_id
    AND schedule_events.organization_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
  )
);
CREATE POLICY "event_practice_plans_insert_coach_admin" ON event_practice_plans FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM schedule_events
    WHERE schedule_events.id = event_practice_plans.event_id
    AND schedule_events.organization_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
  )
);
CREATE POLICY "event_practice_plans_update_coach_admin" ON event_practice_plans FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM schedule_events
    WHERE schedule_events.id = event_practice_plans.event_id
    AND schedule_events.organization_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
  )
);

-- ---- PLAYER_DEVELOPMENT_ASSIGNMENTS ----
CREATE POLICY "player_development_assignments_select_org" ON player_development_assignments FOR SELECT USING (
  org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "player_development_assignments_insert_coach_admin" ON player_development_assignments FOR INSERT WITH CHECK (
  org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "player_development_assignments_update_coach_or_player" ON player_development_assignments FOR UPDATE USING (
  org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
);

-- ---- REFLECTION_TEMPLATES ----
CREATE POLICY "reflection_templates_select_org" ON reflection_templates FOR SELECT USING (
  org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
  OR org_id IS NULL
);
CREATE POLICY "reflection_templates_insert_coach_admin" ON reflection_templates FOR INSERT WITH CHECK (
  org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "reflection_templates_update_coach_admin" ON reflection_templates FOR UPDATE USING (
  org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
);

-- ---- PRACTICE_REFLECTIONS ----
CREATE POLICY "practice_reflections_select_org" ON practice_reflections FOR SELECT USING (
  org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "practice_reflections_insert_player" ON practice_reflections FOR INSERT WITH CHECK (
  player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  AND org_id = (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "practice_reflections_update_player" ON practice_reflections FOR UPDATE USING (
  player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
);

-- ============================================================================
-- Step 4: Fix drill_categories seed (disambiguate column names)
-- ============================================================================
INSERT INTO drill_categories (org_id, sport_id, name, display_name, sort_order)
SELECT NULL, s.id, v.cat_name, v.cat_display, v.cat_order FROM (VALUES
  ('serving', 'Serving', 10),
  ('passing', 'Passing', 11),
  ('setting', 'Setting', 12),
  ('attacking', 'Attacking', 13),
  ('blocking', 'Blocking', 14),
  ('defense', 'Defense', 15),
  ('transition', 'Transition', 16),
  ('serve_receive', 'Serve Receive', 17)
) AS v(cat_name, cat_display, cat_order)
CROSS JOIN sports s WHERE s.name ILIKE '%volleyball%'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Done! Verify with:
-- SELECT * FROM drill_categories;
-- SELECT * FROM drills LIMIT 1;  -- should not 403
-- ============================================================================
