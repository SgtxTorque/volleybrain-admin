-- ═══════════════════════════════════════════════════════════
-- CASCADE DELETE FUNCTIONS FOR PLATFORM ADMIN
-- These handle the complex FK chains that prevent simple deletes
-- ═══════════════════════════════════════════════════════════

-- ─── DELETE ORGANIZATION CASCADE ───────────────────────────
CREATE OR REPLACE FUNCTION public.delete_organization_cascade(p_org_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  season_ids UUID[];
  team_ids UUID[];
BEGIN
  -- Verify caller is platform admin
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Only platform admins can delete organizations';
  END IF;

  -- Clear profile references
  UPDATE profiles SET current_organization_id = NULL
    WHERE current_organization_id = p_org_id;
  UPDATE user_active_contexts SET active_organization_id = NULL
    WHERE active_organization_id = p_org_id;

  -- Get season IDs
  SELECT COALESCE(array_agg(id), '{}') INTO season_ids
    FROM seasons WHERE organization_id = p_org_id;

  -- Get team IDs via seasons
  IF array_length(season_ids, 1) > 0 THEN
    SELECT COALESCE(array_agg(id), '{}') INTO team_ids
      FROM teams WHERE season_id = ANY(season_ids);
  ELSE
    team_ids := '{}';
  END IF;

  -- ── Team-level NO ACTION children ──
  IF array_length(team_ids, 1) > 0 THEN
    DELETE FROM chat_channels WHERE team_id = ANY(team_ids);
    UPDATE coach_challenges SET team_id = NULL WHERE team_id = ANY(team_ids);
    UPDATE drills SET team_id = NULL WHERE team_id = ANY(team_ids);
    DELETE FROM game_lineup_metadata WHERE team_id = ANY(team_ids);
    DELETE FROM invitations WHERE team_id = ANY(team_ids);
    DELETE FROM jersey_assignment_history WHERE team_id = ANY(team_ids);
    DELETE FROM jersey_assignments WHERE team_id = ANY(team_ids);
    DELETE FROM lineup_templates WHERE team_id = ANY(team_ids);
    UPDATE player_achievements SET team_id = NULL WHERE team_id = ANY(team_ids);
    UPDATE player_development_assignments SET team_id = NULL WHERE team_id = ANY(team_ids);
  END IF;

  -- ── Season-level NO ACTION children ──
  IF array_length(season_ids, 1) > 0 THEN
    DELETE FROM chat_channels WHERE season_id = ANY(season_ids);
    DELETE FROM email_logs WHERE season_id = ANY(season_ids);
    DELETE FROM game_day_templates WHERE season_id = ANY(season_ids);
    DELETE FROM jersey_assignment_history WHERE season_id = ANY(season_ids);
    UPDATE jersey_assignments SET first_assigned_season_id = NULL WHERE first_assigned_season_id = ANY(season_ids);
    UPDATE jersey_assignments SET last_active_season_id = NULL WHERE last_active_season_id = ANY(season_ids);
    UPDATE player_achievements SET season_id = NULL WHERE season_id = ANY(season_ids);
    UPDATE player_coach_notes SET season_id = NULL WHERE season_id = ANY(season_ids);
    UPDATE player_evaluations SET season_id = NULL WHERE season_id = ANY(season_ids);
    UPDATE player_goals SET season_id = NULL WHERE season_id = ANY(season_ids);
    UPDATE player_skills SET season_id = NULL WHERE season_id = ANY(season_ids);
    DELETE FROM schedule_events WHERE season_id = ANY(season_ids);
    DELETE FROM xp_ledger WHERE season_id = ANY(season_ids);
  END IF;

  -- ── Org-level NO ACTION children ──
  DELETE FROM drill_categories WHERE org_id = p_org_id;
  DELETE FROM drills WHERE org_id = p_org_id;
  DELETE FROM email_logs WHERE organization_id = p_org_id;
  DELETE FROM game_day_templates WHERE organization_id = p_org_id;
  DELETE FROM invitations WHERE organization_id = p_org_id;
  DELETE FROM jersey_assignments WHERE organization_id = p_org_id;
  DELETE FROM lineup_templates WHERE organization_id = p_org_id;
  DELETE FROM payment_sessions WHERE organization_id = p_org_id;
  DELETE FROM platform_promo_usage WHERE organization_id = p_org_id;
  DELETE FROM player_development_assignments WHERE org_id = p_org_id;
  DELETE FROM practice_plans WHERE org_id = p_org_id;
  DELETE FROM reflection_templates WHERE org_id = p_org_id;
  DELETE FROM season_rank_history WHERE organization_id = p_org_id;
  DELETE FROM season_ranks WHERE organization_id = p_org_id;
  DELETE FROM seasons WHERE organization_id = p_org_id;
  DELETE FROM shoutout_categories WHERE organization_id = p_org_id;
  DELETE FROM sports WHERE organization_id = p_org_id;
  DELETE FROM waiver_sends WHERE organization_id = p_org_id;
  DELETE FROM waiver_signatures WHERE organization_id = p_org_id;

  -- ── Delete the org (CASCADE handles the rest) ──
  DELETE FROM organizations WHERE id = p_org_id;
END;
$$;


-- ─── DELETE PROFILE CASCADE ────────────────────────────────
CREATE OR REPLACE FUNCTION public.delete_profile_cascade(p_profile_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is platform admin
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Only platform admins can delete profiles';
  END IF;

  -- Prevent deleting the protected admin
  IF p_profile_id = '8e9894f6-59d7-47a1-8dc4-c2271a5e9275' THEN
    RAISE EXCEPTION 'Cannot delete protected platform admin profile';
  END IF;

  -- ── NULL out all NO ACTION FK references ──
  UPDATE account_invites SET accepted_by = NULL WHERE accepted_by = p_profile_id;
  UPDATE admin_notifications SET read_by = NULL WHERE read_by = p_profile_id;
  UPDATE announcements SET created_by = NULL WHERE created_by = p_profile_id;
  UPDATE chat_channels SET created_by = NULL WHERE created_by = p_profile_id;
  UPDATE chat_messages SET sender_id = NULL WHERE sender_id = p_profile_id;
  UPDATE chat_messages SET deleted_by = NULL WHERE deleted_by = p_profile_id;
  UPDATE coach_challenges SET coach_id = NULL WHERE coach_id = p_profile_id;
  DELETE FROM coaches WHERE profile_id = p_profile_id;
  DELETE FROM drill_favorites WHERE user_id = p_profile_id;
  UPDATE drills SET created_by = NULL WHERE created_by = p_profile_id;
  UPDATE event_rsvps SET responded_by = NULL WHERE responded_by = p_profile_id;
  UPDATE game_day_templates SET created_by = NULL WHERE created_by = p_profile_id;
  UPDATE game_player_stats SET entered_by = NULL WHERE entered_by = p_profile_id;
  UPDATE game_results SET recorded_by = NULL WHERE recorded_by = p_profile_id;
  UPDATE invitations SET invited_by = NULL WHERE invited_by = p_profile_id;
  UPDATE invitations SET accepted_by = NULL WHERE accepted_by = p_profile_id;
  UPDATE jersey_assignment_history SET performed_by = NULL WHERE performed_by = p_profile_id;
  UPDATE jersey_assignments SET assigned_by = NULL WHERE assigned_by = p_profile_id;
  UPDATE lineup_templates SET created_by = NULL WHERE created_by = p_profile_id;
  DELETE FROM message_recipients WHERE profile_id = p_profile_id;
  UPDATE message_reports SET reviewed_by = NULL WHERE reviewed_by = p_profile_id;
  UPDATE message_reports SET reported_by = NULL WHERE reported_by = p_profile_id;
  UPDATE messages SET sender_id = NULL WHERE sender_id = p_profile_id;
  UPDATE payment_installments SET parent_id = NULL WHERE parent_id = p_profile_id;
  UPDATE platform_announcements SET created_by = NULL WHERE created_by = p_profile_id;
  UPDATE platform_data_requests SET requestor_id = NULL WHERE requestor_id = p_profile_id;
  UPDATE platform_data_requests SET target_user_id = NULL WHERE target_user_id = p_profile_id;
  UPDATE platform_data_requests SET completed_by = NULL WHERE completed_by = p_profile_id;
  UPDATE platform_email_campaigns SET created_by = NULL WHERE created_by = p_profile_id;
  UPDATE platform_error_log SET user_id = NULL WHERE user_id = p_profile_id;
  UPDATE platform_feature_requests SET submitted_by = NULL WHERE submitted_by = p_profile_id;
  DELETE FROM platform_feature_votes WHERE user_id = p_profile_id;
  UPDATE platform_org_events SET performed_by = NULL WHERE performed_by = p_profile_id;
  UPDATE platform_promo_codes SET created_by = NULL WHERE created_by = p_profile_id;
  UPDATE platform_promo_usage SET applied_by = NULL WHERE applied_by = p_profile_id;
  UPDATE platform_settings SET updated_by = NULL WHERE updated_by = p_profile_id;
  DELETE FROM platform_team_members WHERE profile_id = p_profile_id;
  UPDATE platform_team_members SET invited_by = NULL WHERE invited_by = p_profile_id;
  UPDATE platform_tos_versions SET created_by = NULL WHERE created_by = p_profile_id;
  UPDATE player_achievements SET verified_by = NULL WHERE verified_by = p_profile_id;
  UPDATE player_badges SET awarded_by = NULL WHERE awarded_by = p_profile_id;
  UPDATE player_coach_notes SET coach_id = NULL WHERE coach_id = p_profile_id;
  UPDATE player_development_assignments SET reviewed_by = NULL WHERE reviewed_by = p_profile_id;
  UPDATE player_development_assignments SET assigned_by = NULL WHERE assigned_by = p_profile_id;
  UPDATE player_evaluations SET evaluated_by = NULL WHERE evaluated_by = p_profile_id;
  UPDATE player_goals SET created_by = NULL WHERE created_by = p_profile_id;
  DELETE FROM practice_plan_favorites WHERE user_id = p_profile_id;
  UPDATE practice_plans SET created_by = NULL WHERE created_by = p_profile_id;
  UPDATE profiles SET parent_profile_id = NULL WHERE parent_profile_id = p_profile_id;
  UPDATE reflection_templates SET created_by = NULL WHERE created_by = p_profile_id;
  UPDATE registrations SET evaluated_by = NULL WHERE evaluated_by = p_profile_id;
  UPDATE registrations SET reviewed_by = NULL WHERE reviewed_by = p_profile_id;
  UPDATE role_assignments SET granted_by = NULL WHERE granted_by = p_profile_id;
  UPDATE schedule_events SET stats_entered_by = NULL WHERE stats_entered_by = p_profile_id;
  UPDATE shoutout_categories SET created_by = NULL WHERE created_by = p_profile_id;
  UPDATE shoutouts SET giver_id = NULL WHERE giver_id = p_profile_id;
  UPDATE team_invite_codes SET created_by = NULL WHERE created_by = p_profile_id;
  UPDATE team_post_comments SET deleted_by = NULL WHERE deleted_by = p_profile_id;
  UPDATE team_staff SET assigned_by = NULL WHERE assigned_by = p_profile_id;
  UPDATE user_roles SET revoked_by = NULL WHERE revoked_by = p_profile_id;
  UPDATE user_roles SET granted_by = NULL WHERE granted_by = p_profile_id;
  UPDATE volunteer_blasts SET sent_by = NULL WHERE sent_by = p_profile_id;

  -- ── Delete user_roles for this user ──
  DELETE FROM user_roles WHERE user_id = p_profile_id;

  -- ── Delete the profile ──
  DELETE FROM profiles WHERE id = p_profile_id;
END;
$$;
