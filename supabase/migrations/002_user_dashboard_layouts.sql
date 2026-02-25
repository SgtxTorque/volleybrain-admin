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

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_user_dashboard_layouts_user_id ON user_dashboard_layouts(user_id);
