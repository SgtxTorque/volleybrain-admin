-- Platform Team Members
-- PA Command Center Phase 4.3
-- ACTION REQUIRED: Carlos must run this SQL

CREATE TABLE IF NOT EXISTS platform_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id),
  role TEXT NOT NULL DEFAULT 'support',
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  invited_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  last_active_at TIMESTAMPTZ,
  UNIQUE(profile_id)
);

ALTER TABLE platform_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage team members"
  ON platform_team_members FOR ALL
  USING (public.is_platform_admin());

CREATE POLICY "Team members can read own record"
  ON platform_team_members FOR SELECT
  USING (auth.uid() = profile_id);

CREATE INDEX idx_platform_team_role ON platform_team_members(role);
CREATE INDEX idx_platform_team_active ON platform_team_members(is_active);
