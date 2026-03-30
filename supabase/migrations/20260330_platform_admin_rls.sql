-- ═══════════════════════════════════════════════════════════
-- RLS Policies for Platform Admin cross-org access
-- These allow users with is_platform_admin = true to read
-- across all organizations for the platform admin dashboard.
-- ═══════════════════════════════════════════════════════════

-- Helper: Check if a policy exists before creating (avoid errors on re-run)
-- We use IF NOT EXISTS pattern via DO blocks

-- organizations: PA can read all
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Platform admins can read all organizations' AND tablename = 'organizations') THEN
    CREATE POLICY "Platform admins can read all organizations"
      ON organizations FOR SELECT
      USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));
  END IF;
END $$;

-- organizations: PA can update all (for suspend/activate)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Platform admins can update all organizations' AND tablename = 'organizations') THEN
    CREATE POLICY "Platform admins can update all organizations"
      ON organizations FOR UPDATE
      USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));
  END IF;
END $$;

-- profiles: PA can read all
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Platform admins can read all profiles' AND tablename = 'profiles') THEN
    CREATE POLICY "Platform admins can read all profiles"
      ON profiles FOR SELECT
      USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));
  END IF;
END $$;

-- profiles: PA can update all (for suspend/unsuspend)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Platform admins can update all profiles' AND tablename = 'profiles') THEN
    CREATE POLICY "Platform admins can update all profiles"
      ON profiles FOR UPDATE
      USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));
  END IF;
END $$;

-- user_roles: PA can read all
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Platform admins can read all user_roles' AND tablename = 'user_roles') THEN
    CREATE POLICY "Platform admins can read all user_roles"
      ON user_roles FOR SELECT
      USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));
  END IF;
END $$;

-- seasons: PA can read all
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Platform admins can read all seasons' AND tablename = 'seasons') THEN
    CREATE POLICY "Platform admins can read all seasons"
      ON seasons FOR SELECT
      USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));
  END IF;
END $$;

-- teams: PA can read all
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Platform admins can read all teams' AND tablename = 'teams') THEN
    CREATE POLICY "Platform admins can read all teams"
      ON teams FOR SELECT
      USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));
  END IF;
END $$;

-- payments: PA can read all
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Platform admins can read all payments' AND tablename = 'payments') THEN
    CREATE POLICY "Platform admins can read all payments"
      ON payments FOR SELECT
      USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));
  END IF;
END $$;

-- schedule_events: PA can read all
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Platform admins can read all schedule_events' AND tablename = 'schedule_events') THEN
    CREATE POLICY "Platform admins can read all schedule_events"
      ON schedule_events FOR SELECT
      USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));
  END IF;
END $$;

-- registrations: PA can read all
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Platform admins can read all registrations' AND tablename = 'registrations') THEN
    CREATE POLICY "Platform admins can read all registrations"
      ON registrations FOR SELECT
      USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));
  END IF;
END $$;

-- registration_templates: PA can read all
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Platform admins can read all registration_templates' AND tablename = 'registration_templates') THEN
    CREATE POLICY "Platform admins can read all registration_templates"
      ON registration_templates FOR SELECT
      USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));
  END IF;
END $$;

-- team_coaches: PA can read all
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Platform admins can read all team_coaches' AND tablename = 'team_coaches') THEN
    CREATE POLICY "Platform admins can read all team_coaches"
      ON team_coaches FOR SELECT
      USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));
  END IF;
END $$;

-- platform_subscriptions: PA full access (table already exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Platform admins full access to subscriptions' AND tablename = 'platform_subscriptions') THEN
    CREATE POLICY "Platform admins full access to subscriptions"
      ON platform_subscriptions FOR ALL
      USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));
  END IF;
END $$;

-- platform_invoices: PA full access (table already exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Platform admins full access to invoices' AND tablename = 'platform_invoices') THEN
    CREATE POLICY "Platform admins full access to invoices"
      ON platform_invoices FOR ALL
      USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));
  END IF;
END $$;

-- platform_admin_actions: PA can insert and read (table already exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Platform admins full access to admin actions' AND tablename = 'platform_admin_actions') THEN
    CREATE POLICY "Platform admins full access to admin actions"
      ON platform_admin_actions FOR ALL
      USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));
  END IF;
END $$;
