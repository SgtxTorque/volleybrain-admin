-- Platform Error Log
-- PA Command Center Phase 4.1
-- ACTION REQUIRED: Carlos must run this SQL

CREATE TABLE IF NOT EXISTS platform_error_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type TEXT NOT NULL,
  message TEXT NOT NULL,
  stack_trace TEXT,
  component TEXT,
  user_id UUID REFERENCES profiles(id),
  organization_id UUID REFERENCES organizations(id),
  metadata JSONB DEFAULT '{}',
  severity TEXT DEFAULT 'error',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE platform_error_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can read errors"
  ON platform_error_log FOR SELECT
  USING (public.is_platform_admin());

CREATE POLICY "Authenticated users can log errors"
  ON platform_error_log FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX idx_error_log_severity ON platform_error_log(severity);
CREATE INDEX idx_error_log_created ON platform_error_log(created_at DESC);
CREATE INDEX idx_error_log_type ON platform_error_log(error_type);
