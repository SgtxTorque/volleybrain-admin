-- Platform Email Campaigns
-- ACTION REQUIRED: Carlos must run this in Supabase Dashboard

CREATE TABLE IF NOT EXISTS platform_email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  target_audience TEXT DEFAULT 'all',
  target_org_ids UUID[] DEFAULT '{}',
  target_user_ids UUID[] DEFAULT '{}',
  status TEXT DEFAULT 'draft',
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  total_recipients INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE platform_email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage campaigns"
  ON platform_email_campaigns FOR ALL
  USING (public.is_platform_admin());

CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON platform_email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_created ON platform_email_campaigns(created_at DESC);
