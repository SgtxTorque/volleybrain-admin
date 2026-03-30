CREATE TABLE IF NOT EXISTS platform_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  target_audience TEXT DEFAULT 'all',
  target_org_ids UUID[] DEFAULT '{}',
  is_banner BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE platform_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage announcements"
  ON platform_announcements FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));

CREATE POLICY "Users can read published announcements"
  ON platform_announcements FOR SELECT
  USING (is_published = true AND (expires_at IS NULL OR expires_at > now()));

CREATE INDEX idx_announcements_published ON platform_announcements(is_published, published_at DESC);

CREATE TABLE IF NOT EXISTS platform_announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES platform_announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(announcement_id, user_id)
);

ALTER TABLE platform_announcement_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can mark own reads"
  ON platform_announcement_reads FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Platform admins can view all reads"
  ON platform_announcement_reads FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));
