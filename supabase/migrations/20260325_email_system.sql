-- =============================================================================
-- EMAIL SYSTEM V3: Database Migrations
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- All statements use IF NOT EXISTS — safe to re-run
-- =============================================================================

-- ─── 1. Extend email_notifications table ────────────────────────────────────
ALTER TABLE email_notifications
  ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'transactional',
  ADD COLUMN IF NOT EXISTS sent_by UUID DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sent_by_role TEXT DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS recipient_user_id UUID DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS template_type TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS broadcast_batch_id UUID DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS blast_message_id UUID DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS audience_type TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS audience_target_id UUID DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS bounced_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS has_attachments BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_email_notif_external_id
  ON email_notifications(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_notif_batch
  ON email_notifications(broadcast_batch_id) WHERE broadcast_batch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_notif_org_date
  ON email_notifications(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_notif_status
  ON email_notifications(status) WHERE status = 'pending';

-- ─── 2. Extend notification_templates table ─────────────────────────────────
ALTER TABLE notification_templates
  ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'push',
  ADD COLUMN IF NOT EXISTS email_subject_template TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email_heading TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email_body_template TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email_cta_text TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email_cta_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email_category TEXT DEFAULT 'transactional',
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS variable_reference JSONB DEFAULT NULL;

-- ─── 3. Extend organizations table ─────────────────────────────────────────
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS email_sender_name TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email_reply_to TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email_footer_text TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email_social_facebook TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email_social_instagram TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email_social_twitter TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email_include_unsubscribe BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_header_image TEXT DEFAULT NULL;

-- ─── 4. Create email_unsubscribes table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_unsubscribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID DEFAULT NULL,
  email TEXT NOT NULL,
  unsubscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, email)
);

ALTER TABLE email_unsubscribes ENABLE ROW LEVEL SECURITY;

-- RLS: Users manage own unsubscribe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'email_unsubscribes' AND policyname = 'Users manage own unsubscribe') THEN
    CREATE POLICY "Users manage own unsubscribe" ON email_unsubscribes
      FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

-- RLS: Admins view org unsubscribes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'email_unsubscribes' AND policyname = 'Admins view org unsubscribes') THEN
    CREATE POLICY "Admins view org unsubscribes" ON email_unsubscribes
      FOR SELECT USING (
        organization_id IN (
          SELECT organization_id FROM user_roles
          WHERE user_id = auth.uid() AND role = 'league_admin' AND is_active = TRUE
        )
      );
  END IF;
END $$;

-- ─── 5. Create email_attachments table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_notification_id UUID REFERENCES email_notifications(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER DEFAULT NULL,
  mime_type TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_attach_notif
  ON email_attachments(email_notification_id);

-- ─── 6. Seed default email templates ────────────────────────────────────────
-- Registration Confirmation template
INSERT INTO notification_templates (
  organization_id, type, title, template,
  channel, email_subject_template, email_heading, email_body_template,
  email_cta_text, email_cta_url, email_category, description,
  is_default, variable_reference, is_active
)
SELECT
  o.id,
  'registration_confirmation',
  'Registration Confirmation',
  'Your registration for {{season_name}} has been confirmed!',
  'email',
  '{{player_name}} is on the roster. Let''s go.',
  'Roster Locked In',
  '<p>Hey {{parent_name}},</p><p>It''s official. {{player_name}} is registered for {{season_name}} and the season is about to get real.</p><p>Here''s what you need to know:</p><ul><li>Team: {{team_name}}</li><li>Season: {{season_name}}</li><li>First day: {{start_date}}</li></ul><p>You''ll get practice schedules, game details, and updates right in the app. If anything comes up, just reply to this email.</p><p>Welcome to the team.</p>',
  'Open Lynx',
  '{{app_url}}',
  'transactional',
  'Sent when a player registration is approved',
  TRUE,
  '["player_name", "parent_name", "season_name", "team_name", "start_date", "org_name", "app_url"]'::jsonb,
  TRUE
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM notification_templates nt
  WHERE nt.organization_id = o.id
    AND nt.type = 'registration_confirmation'
    AND nt.channel = 'email'
);

-- Payment Receipt template
INSERT INTO notification_templates (
  organization_id, type, title, template,
  channel, email_subject_template, email_heading, email_body_template,
  email_cta_text, email_cta_url, email_category, description,
  is_default, variable_reference, is_active
)
SELECT
  o.id,
  'payment_receipt',
  'Payment Receipt',
  'Payment of {{amount}} received.',
  'email',
  'Payment received. You''re all set.',
  'Payment Confirmed',
  '<p>Hi {{payer_name}},</p><p>We got it. Here''s your receipt:</p><ul><li>Amount: {{amount}}</li><li>For: {{description}}</li><li>Date: {{payment_date}}</li><li>Method: {{payment_method}}</li><li>Reference: {{transaction_id}}</li></ul><p>No action needed. This is your confirmation. If anything looks off, reply to this email and we''ll sort it out.</p>',
  'View Payment History',
  '{{app_url}}/payments',
  'transactional',
  'Sent when a payment is marked as paid',
  TRUE,
  '["payer_name", "parent_name", "amount", "description", "payment_date", "payment_method", "transaction_id", "org_name", "app_url"]'::jsonb,
  TRUE
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM notification_templates nt
  WHERE nt.organization_id = o.id
    AND nt.type = 'payment_receipt'
    AND nt.channel = 'email'
);

-- Broadcast Announcement template
INSERT INTO notification_templates (
  organization_id, type, title, template,
  channel, email_subject_template, email_heading, email_body_template,
  email_category, description,
  is_default, variable_reference, is_active
)
SELECT
  o.id,
  'blast_announcement',
  'Announcement Email',
  '{{subject}}',
  'email',
  '{{subject}}',
  '{{heading}}',
  '{{body}}',
  'broadcast',
  'Wrapper template for announcements sent as email',
  TRUE,
  '["subject", "heading", "body", "coach_name", "org_name", "app_url"]'::jsonb,
  TRUE
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM notification_templates nt
  WHERE nt.organization_id = o.id
    AND nt.type = 'blast_announcement'
    AND nt.channel = 'email'
);

-- ─── Done ───────────────────────────────────────────────────────────────────
-- Verify: SELECT count(*) FROM notification_templates WHERE channel = 'email';
