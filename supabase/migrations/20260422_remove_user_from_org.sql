-- Function to cleanly remove a user from an organization
-- Handles: user_roles, coaches, team_coaches, staff_members, team_staff,
-- role_assignments, and nulls current_organization_id

CREATE OR REPLACE FUNCTION remove_user_from_org(p_user_id UUID, p_org_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_coach_ids UUID[];
  v_is_admin BOOLEAN;
BEGIN
  -- Verify caller is platform admin
  SELECT public.is_platform_admin() INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only platform admins can remove users from organizations';
  END IF;

  -- 1. Find all coach records for this user in this org's seasons
  SELECT ARRAY_AGG(c.id) INTO v_coach_ids
  FROM coaches c
  JOIN seasons s ON c.season_id = s.id
  JOIN programs p ON s.program_id = p.id
  WHERE c.profile_id = p_user_id
  AND p.organization_id = p_org_id;

  -- 2. Delete team_coaches for those coach records
  IF v_coach_ids IS NOT NULL AND array_length(v_coach_ids, 1) > 0 THEN
    DELETE FROM team_coaches WHERE coach_id = ANY(v_coach_ids);
    DELETE FROM coaches WHERE id = ANY(v_coach_ids);
  END IF;

  -- 3. Delete staff_members for this org
  DELETE FROM staff_members
  WHERE user_account_id = p_user_id
  AND organization_id = p_org_id;

  -- 4. Delete team_staff for teams in this org
  DELETE FROM team_staff
  WHERE user_id = p_user_id
  AND team_id IN (
    SELECT t.id FROM teams t
    JOIN seasons s ON t.season_id = s.id
    JOIN programs p ON s.program_id = p.id
    WHERE p.organization_id = p_org_id
  );

  -- 5. Delete user_roles for this org
  DELETE FROM user_roles
  WHERE user_id = p_user_id
  AND organization_id = p_org_id;

  -- 6. Delete role_assignments for this org
  DELETE FROM role_assignments
  WHERE user_id = p_user_id
  AND organization_id = p_org_id;

  -- 7. Null out current_organization_id if it matches
  UPDATE profiles
  SET current_organization_id = NULL
  WHERE id = p_user_id
  AND current_organization_id = p_org_id;

END;
$$;
