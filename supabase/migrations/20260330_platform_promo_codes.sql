CREATE TABLE IF NOT EXISTS platform_promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_percent INTEGER NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
  duration_months INTEGER,
  max_uses INTEGER,
  times_used INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE platform_promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage promo codes"
  ON platform_promo_codes FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));

CREATE TABLE IF NOT EXISTS platform_promo_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES platform_promo_codes(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  applied_by UUID REFERENCES profiles(id),
  applied_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE platform_promo_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage promo usage"
  ON platform_promo_usage FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));

CREATE INDEX idx_promo_codes_active ON platform_promo_codes(is_active);
CREATE INDEX idx_promo_usage_code ON platform_promo_usage(promo_code_id);
CREATE INDEX idx_promo_usage_org ON platform_promo_usage(organization_id);
