-- Platform Org Health Scores
-- PA Command Center Phase 3.4
-- ACTION REQUIRED: Carlos must run this SQL

CREATE TABLE IF NOT EXISTS platform_org_health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  activity_score INTEGER CHECK (activity_score BETWEEN 0 AND 100),
  payment_score INTEGER CHECK (payment_score BETWEEN 0 AND 100),
  engagement_score INTEGER CHECK (engagement_score BETWEEN 0 AND 100),
  growth_score INTEGER CHECK (growth_score BETWEEN 0 AND 100),
  setup_score INTEGER CHECK (setup_score BETWEEN 0 AND 100),
  churn_risk TEXT,
  risk_factors JSONB DEFAULT '[]',
  computed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id)
);

ALTER TABLE platform_org_health_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage health scores"
  ON platform_org_health_scores FOR ALL
  USING (public.is_platform_admin());

CREATE INDEX IF NOT EXISTS idx_health_scores_org ON platform_org_health_scores(organization_id);
CREATE INDEX IF NOT EXISTS idx_health_scores_risk ON platform_org_health_scores(churn_risk);
