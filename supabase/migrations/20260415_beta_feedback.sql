-- Beta Feedback System
-- Shared between web and mobile apps
-- All beta user roles can submit feedback
-- Platform Admin reads from PA dashboard

CREATE TABLE IF NOT EXISTS beta_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Who submitted
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  user_role TEXT, -- 'admin', 'coach', 'parent', 'player', 'team_manager'
  user_email TEXT,
  user_name TEXT,

  -- What type
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('reaction', 'comment', 'bug')),
  sentiment TEXT CHECK (sentiment IN ('love', 'like', 'confused', 'frustrated', 'broken')),
  message TEXT,

  -- Context (auto-captured)
  screen_url TEXT,
  screen_name TEXT, -- human-readable: 'Dashboard', 'Schedule', 'Registration'
  platform TEXT NOT NULL DEFAULT 'web' CHECK (platform IN ('web', 'mobile')),
  device_info JSONB DEFAULT '{}', -- browser/OS/viewport for web, device model/OS for mobile
  app_version TEXT,

  -- Admin workflow
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'resolved', 'dismissed')),
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for PA dashboard queries
CREATE INDEX IF NOT EXISTS idx_beta_feedback_created ON beta_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_beta_feedback_status ON beta_feedback(status);
CREATE INDEX IF NOT EXISTS idx_beta_feedback_org ON beta_feedback(organization_id);
CREATE INDEX IF NOT EXISTS idx_beta_feedback_type ON beta_feedback(feedback_type);

-- RLS: Users can insert their own feedback
ALTER TABLE beta_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback"
  ON beta_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS: Users can read their own feedback
CREATE POLICY "Users can read own feedback"
  ON beta_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS: Platform admins can read all feedback
CREATE POLICY "Platform admins read all feedback"
  ON beta_feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_platform_admin = true
    )
  );

-- RLS: Platform admins can update feedback (status, notes)
CREATE POLICY "Platform admins update feedback"
  ON beta_feedback FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_platform_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_platform_admin = true
    )
  );
