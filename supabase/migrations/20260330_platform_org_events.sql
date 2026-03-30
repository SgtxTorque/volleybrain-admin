CREATE TABLE IF NOT EXISTS platform_org_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  performed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE platform_org_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage org events"
  ON platform_org_events FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));

CREATE INDEX idx_org_events_org ON platform_org_events(organization_id);
CREATE INDEX idx_org_events_type ON platform_org_events(event_type);
CREATE INDEX idx_org_events_created ON platform_org_events(created_at DESC);
