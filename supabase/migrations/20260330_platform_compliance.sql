-- Platform Compliance: Data requests + ToS versions
-- ACTION REQUIRED: Carlos must run this in Supabase Dashboard

CREATE TABLE IF NOT EXISTS platform_data_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type TEXT NOT NULL,
  requestor_id UUID REFERENCES profiles(id),
  requestor_email TEXT,
  target_user_id UUID REFERENCES profiles(id),
  target_org_id UUID REFERENCES organizations(id),
  status TEXT DEFAULT 'pending',
  reason TEXT,
  admin_notes TEXT,
  completed_by UUID REFERENCES profiles(id),
  completed_at TIMESTAMPTZ,
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE platform_data_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage data requests"
  ON platform_data_requests FOR ALL
  USING (public.is_platform_admin());

CREATE INDEX IF NOT EXISTS idx_data_requests_status ON platform_data_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_requests_type ON platform_data_requests(request_type);

CREATE TABLE IF NOT EXISTS platform_tos_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_current BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE platform_tos_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage ToS"
  ON platform_tos_versions FOR ALL
  USING (public.is_platform_admin());

CREATE POLICY "All users can read current ToS"
  ON platform_tos_versions FOR SELECT
  USING (is_current = true);
