-- ============================================================
-- CRITICAL: Secure player_parents table with RLS policies
--
-- Without these policies, any authenticated user could INSERT
-- themselves as a parent to any child, gaining unauthorized
-- access to that child's data across all tables.
--
-- Attack vector: browser console → supabase.from('player_parents')
--   .insert({ player_id: 'any-child', parent_id: auth.uid() })
-- ============================================================

-- 0. Drop overly-permissive legacy policies (qual = true on public role)
DROP POLICY IF EXISTS "Anyone can view player_parents" ON player_parents;
DROP POLICY IF EXISTS "System can manage player_parents" ON player_parents;

-- 1. Enable RLS (idempotent — already enabled is a no-op)
ALTER TABLE player_parents ENABLE ROW LEVEL SECURITY;

-- 2. SELECT: Own links, primary parent seeing their child's secondary links, admins
CREATE POLICY "player_parents_select" ON player_parents FOR SELECT TO authenticated
  USING (
    -- Secondary parent can see their own links
    parent_id = auth.uid()
    -- Primary parent can see secondary links to their children
    OR EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = player_parents.player_id
        AND p.parent_account_id = auth.uid()
    )
    -- League admin
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'league_admin'
        AND ur.is_active = true
    )
    -- Platform admin
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_platform_admin = true
    )
  );

-- 3. INSERT: Must set parent_id = self, AND must have valid invitation OR be admin
CREATE POLICY "player_parents_insert" ON player_parents FOR INSERT TO authenticated
  WITH CHECK (
    -- Must always be adding self as parent (cannot add someone else)
    parent_id = auth.uid()
    AND (
      -- League admin can insert
      EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role = 'league_admin'
          AND ur.is_active = true
      )
      -- Platform admin can insert
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
          AND profiles.is_platform_admin = true
      )
      -- Non-admin: must have a pending/accepted invitation with isSecondary=true
      -- containing this specific player_id in metadata.playerIds
      OR EXISTS (
        SELECT 1 FROM invitations i
        WHERE LOWER(i.email) = LOWER((SELECT email FROM profiles WHERE id = auth.uid()))
          AND i.status IN ('pending', 'accepted')
          AND (i.metadata->>'isSecondary')::boolean = true
          AND i.metadata->'playerIds' ? player_parents.player_id::text
      )
    )
  );

-- 4. UPDATE: Own record (for upsert idempotency) or admin, with escalation guard
CREATE POLICY "player_parents_update" ON player_parents FOR UPDATE TO authenticated
  USING (
    parent_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'league_admin'
        AND ur.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_platform_admin = true
    )
  )
  WITH CHECK (
    -- Non-admin cannot escalate is_primary or change parent_id
    (parent_id = auth.uid() AND is_primary = false)
    -- Admin can do anything
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'league_admin'
        AND ur.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_platform_admin = true
    )
  );

-- 5. DELETE: Primary parent of the child (revoke access) or admin
CREATE POLICY "player_parents_delete" ON player_parents FOR DELETE TO authenticated
  USING (
    -- Primary parent can revoke secondary parent access to their children
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = player_parents.player_id
        AND p.parent_account_id = auth.uid()
    )
    -- League admin
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'league_admin'
        AND ur.is_active = true
    )
    -- Platform admin
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_platform_admin = true
    )
  );
