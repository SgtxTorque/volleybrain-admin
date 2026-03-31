-- Platform Support Inbox Upgrade: SLA timers, satisfaction ratings, escalation
-- ACTION REQUIRED: Carlos must run this in Supabase Dashboard

ALTER TABLE platform_support_tickets
  ADD COLUMN IF NOT EXISTS first_response_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolution_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS satisfaction_comment TEXT,
  ADD COLUMN IF NOT EXISTS escalation_count INTEGER DEFAULT 0;

-- Canned responses stored in platform_settings (no new table needed)
-- Key: 'support_canned_responses', Category: 'support'
-- Value: JSON array of { id, label, text, variables: [] }
