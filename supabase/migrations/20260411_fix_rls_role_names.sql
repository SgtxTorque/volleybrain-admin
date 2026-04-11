-- ============================================================================
-- FIX RLS ROLE NAMES
-- Date: 2026-04-11
--
-- The app uses 'league_admin' as the admin role value in user_roles.
-- Several RLS policies were written with role = 'admin' which never matches
-- any real user, effectively blocking all admins from those operations.
--
-- This migration drops and recreates the broken policies on:
--   1. programs            (create / update / delete)
--   2. email_unsubscribes  (select for admins)
--   3. drills              (update / delete by admin)
--   4. drill_categories    (insert / update by admin)
--   5. practice_plans      (update / delete by admin)
--
-- All replacements are idempotent (DROP IF EXISTS + CREATE).
-- ============================================================================


-- ============================================================================
-- 1. PROGRAMS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Admins can create programs" ON programs;
CREATE POLICY "Admins can create programs"
  ON programs FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_roles
      WHERE user_id = auth.uid() AND role = 'league_admin' AND is_active = true
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_admin = true)
  );

DROP POLICY IF EXISTS "Admins can update programs" ON programs;
CREATE POLICY "Admins can update programs"
  ON programs FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_roles
      WHERE user_id = auth.uid() AND role = 'league_admin' AND is_active = true
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_admin = true)
  );

DROP POLICY IF EXISTS "Admins can delete programs" ON programs;
CREATE POLICY "Admins can delete programs"
  ON programs FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_roles
      WHERE user_id = auth.uid() AND role = 'league_admin' AND is_active = true
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_admin = true)
  );


-- ============================================================================
-- 2. EMAIL_UNSUBSCRIBES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Admins view org unsubscribes" ON email_unsubscribes;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_unsubscribes') THEN
    CREATE POLICY "Admins view org unsubscribes" ON email_unsubscribes
      FOR SELECT USING (
        organization_id IN (
          SELECT organization_id FROM user_roles
          WHERE user_id = auth.uid() AND role = 'league_admin' AND is_active = TRUE
        )
      );
  END IF;
END $$;


-- ============================================================================
-- 3. DRILLS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "drills_update_coach_admin" ON drills;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'drills') THEN
    CREATE POLICY "drills_update_coach_admin" ON drills FOR UPDATE USING (
      created_by = auth.uid()
      OR public.is_platform_admin()
      OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'league_admin' AND organization_id = drills.org_id)
    );
  END IF;
END $$;

DROP POLICY IF EXISTS "drills_delete_coach_admin" ON drills;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'drills') THEN
    CREATE POLICY "drills_delete_coach_admin" ON drills FOR DELETE USING (
      created_by = auth.uid()
      OR public.is_platform_admin()
      OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'league_admin' AND organization_id = drills.org_id)
    );
  END IF;
END $$;


-- ============================================================================
-- 4. DRILL_CATEGORIES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "drill_categories_insert_admin" ON drill_categories;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'drill_categories') THEN
    CREATE POLICY "drill_categories_insert_admin" ON drill_categories FOR INSERT WITH CHECK (
      public.is_platform_admin()
      OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'league_admin' AND organization_id = drill_categories.org_id)
    );
  END IF;
END $$;

DROP POLICY IF EXISTS "drill_categories_update_admin" ON drill_categories;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'drill_categories') THEN
    CREATE POLICY "drill_categories_update_admin" ON drill_categories FOR UPDATE USING (
      public.is_platform_admin()
      OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'league_admin' AND organization_id = drill_categories.org_id)
    );
  END IF;
END $$;


-- ============================================================================
-- 5. PRACTICE_PLANS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "practice_plans_update_coach_admin" ON practice_plans;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'practice_plans') THEN
    CREATE POLICY "practice_plans_update_coach_admin" ON practice_plans FOR UPDATE USING (
      created_by = auth.uid()
      OR public.is_platform_admin()
      OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'league_admin' AND organization_id = practice_plans.org_id)
    );
  END IF;
END $$;

DROP POLICY IF EXISTS "practice_plans_delete_coach_admin" ON practice_plans;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'practice_plans') THEN
    CREATE POLICY "practice_plans_delete_coach_admin" ON practice_plans FOR DELETE USING (
      created_by = auth.uid()
      OR public.is_platform_admin()
      OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'league_admin' AND organization_id = practice_plans.org_id)
    );
  END IF;
END $$;
