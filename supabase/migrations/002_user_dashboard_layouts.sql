-- User Dashboard Layouts
-- Stores per-user, per-role dashboard widget layout configuration
CREATE TABLE IF NOT EXISTS user_dashboard_layouts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin',
  layout jsonb DEFAULT '[]'::jsonb,
  widgets jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Index for fast lookup by user+role
CREATE INDEX IF NOT EXISTS idx_user_dashboard_layouts_user_role
  ON user_dashboard_layouts(user_id, role);

-- ── RLS ──────────────────────────────────────────────────────────────
-- Users can only read/write their own layouts
ALTER TABLE user_dashboard_layouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own layouts"
  ON user_dashboard_layouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own layouts"
  ON user_dashboard_layouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own layouts"
  ON user_dashboard_layouts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own layouts"
  ON user_dashboard_layouts FOR DELETE
  USING (auth.uid() = user_id);

-- NOTE: Run the RLS section manually in Supabase Dashboard SQL Editor
-- if the table already exists. The CREATE TABLE is idempotent (IF NOT EXISTS)
-- but ALTER TABLE and CREATE POLICY are not — they will error if already applied.
