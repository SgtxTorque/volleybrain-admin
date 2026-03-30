-- Platform Support Tickets
CREATE TABLE IF NOT EXISTS platform_support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  subject TEXT,
  description TEXT,
  category TEXT DEFAULT 'general',
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE platform_support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins full access to support tickets"
  ON platform_support_tickets FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));

CREATE INDEX idx_support_tickets_status ON platform_support_tickets(status);
CREATE INDEX idx_support_tickets_org ON platform_support_tickets(organization_id);

-- Platform Support Messages
CREATE TABLE IF NOT EXISTS platform_support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES platform_support_tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  message TEXT,
  is_internal_note BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE platform_support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins full access to support messages"
  ON platform_support_messages FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));

CREATE INDEX idx_support_messages_ticket ON platform_support_messages(ticket_id);
