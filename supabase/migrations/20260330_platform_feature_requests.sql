-- Platform Feature Requests + Votes
-- ACTION REQUIRED: Carlos must run this in Supabase Dashboard

CREATE TABLE IF NOT EXISTS platform_feature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  status TEXT DEFAULT 'under_review',
  priority TEXT DEFAULT 'medium',
  vote_count INTEGER DEFAULT 0,
  submitted_by UUID REFERENCES profiles(id),
  submitted_org_id UUID REFERENCES organizations(id),
  admin_notes TEXT,
  shipped_version TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE platform_feature_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins full access to feature requests"
  ON platform_feature_requests FOR ALL
  USING (public.is_platform_admin());

CREATE TABLE IF NOT EXISTS platform_feature_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_request_id UUID NOT NULL REFERENCES platform_feature_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(feature_request_id, user_id)
);

ALTER TABLE platform_feature_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage votes"
  ON platform_feature_votes FOR ALL
  USING (public.is_platform_admin());

CREATE INDEX IF NOT EXISTS idx_feature_requests_status ON platform_feature_requests(status);
CREATE INDEX IF NOT EXISTS idx_feature_requests_category ON platform_feature_requests(category);
CREATE INDEX IF NOT EXISTS idx_feature_votes_request ON platform_feature_votes(feature_request_id);
