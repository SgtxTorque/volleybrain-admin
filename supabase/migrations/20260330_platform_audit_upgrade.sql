-- Platform Audit Log Upgrade: diff tracking, IP, user agent
-- ACTION REQUIRED: Carlos must run this in Supabase Dashboard

ALTER TABLE platform_admin_actions
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS old_values JSONB,
  ADD COLUMN IF NOT EXISTS new_values JSONB;
