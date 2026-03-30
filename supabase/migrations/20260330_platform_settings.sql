CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  category TEXT NOT NULL,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage settings"
  ON platform_settings FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));

CREATE POLICY "Authenticated users can read settings"
  ON platform_settings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE INDEX idx_platform_settings_key ON platform_settings(key);
CREATE INDEX idx_platform_settings_category ON platform_settings(category);
