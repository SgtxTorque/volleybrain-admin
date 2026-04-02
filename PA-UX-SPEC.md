# PLATFORM ADMIN — ORG LIST VIEW + USER DELETE + CASCADE FUNCTIONS
# Standalone CC Spec

## Context

Carlos needs three things:
1. A list view / grid view toggle on the Organizations page (list view as default)
2. A "Delete User" action on the Users page
3. Database cascade delete functions so org delete and user delete work reliably from the UI

## Guardrails

1. **JSX project.** Validate with `npm run build`.
2. **Commit format:** `[PA-UX-1]`, `[PA-UX-2]`, `[PA-UX-3]`
3. **ALL RLS policies use `public.is_platform_admin()`.** NEVER the subquery pattern.
4. **Follow existing design patterns.** Check existing card styles, table styles, modal patterns in the file before adding new ones.
5. **Preserve existing functionality.** Do not break what works.

---

## Sub-Phase 1: Cascade Delete Database Functions

**Create migration file:** `supabase/migrations/20260402_cascade_delete_functions.sql`

These are `SECURITY DEFINER` functions that handle the full cascade delete for organizations and profiles. They bypass RLS because they need to clean up across all tables.

```sql
-- ═══════════════════════════════════════════════════════════
-- CASCADE DELETE FUNCTIONS FOR PLATFORM ADMIN
-- These handle the complex FK chains that prevent simple deletes
-- ═══════════════════════════════════════════════════════════

-- ─── DELETE ORGANIZATION CASCADE ───────────────────────────
CREATE OR REPLACE FUNCTION public.delete_organization_cascade(org_id UUID)
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
    WHERE current_organization_id = org_id;
  UPDATE user_active_contexts SET active_organization_id = NULL
    WHERE active_organization_id = org_id;

  -- Get season IDs
  SELECT COALESCE(array_agg(id), '{}') INTO season_ids
    FROM seasons WHERE organization_id = org_id;

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
  DELETE FROM drill_categories WHERE org_id = org_id;
  DELETE FROM drills WHERE org_id = org_id;
  DELETE FROM email_logs WHERE organization_id = org_id;
  DELETE FROM game_day_templates WHERE organization_id = org_id;
  DELETE FROM invitations WHERE organization_id = org_id;
  DELETE FROM jersey_assignments WHERE organization_id = org_id;
  DELETE FROM lineup_templates WHERE organization_id = org_id;
  DELETE FROM payment_sessions WHERE organization_id = org_id;
  DELETE FROM platform_promo_usage WHERE organization_id = org_id;
  DELETE FROM player_development_assignments WHERE org_id = org_id;
  DELETE FROM practice_plans WHERE org_id = org_id;
  DELETE FROM reflection_templates WHERE org_id = org_id;
  DELETE FROM season_rank_history WHERE organization_id = org_id;
  DELETE FROM season_ranks WHERE organization_id = org_id;
  DELETE FROM seasons WHERE organization_id = org_id;
  DELETE FROM shoutout_categories WHERE organization_id = org_id;
  DELETE FROM sports WHERE organization_id = org_id;
  DELETE FROM waiver_sends WHERE organization_id = org_id;
  DELETE FROM waiver_signatures WHERE organization_id = org_id;

  -- ── Delete the org (CASCADE handles the rest) ──
  DELETE FROM organizations WHERE id = org_id;
END;
$$;


-- ─── DELETE PROFILE CASCADE ────────────────────────────────
CREATE OR REPLACE FUNCTION public.delete_profile_cascade(profile_id UUID)
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
  IF profile_id = '8e9894f6-59d7-47a1-8dc4-c2271a5e9275' THEN
    RAISE EXCEPTION 'Cannot delete protected platform admin profile';
  END IF;

  -- ── NULL out all NO ACTION FK references ──
  UPDATE account_invites SET accepted_by = NULL WHERE accepted_by = profile_id;
  UPDATE admin_notifications SET read_by = NULL WHERE read_by = profile_id;
  UPDATE announcements SET created_by = NULL WHERE created_by = profile_id;
  UPDATE chat_channels SET created_by = NULL WHERE created_by = profile_id;
  UPDATE chat_messages SET sender_id = NULL WHERE sender_id = profile_id;
  UPDATE chat_messages SET deleted_by = NULL WHERE deleted_by = profile_id;
  UPDATE coach_challenges SET coach_id = NULL WHERE coach_id = profile_id;
  DELETE FROM coaches WHERE profile_id = profile_id;
  DELETE FROM drill_favorites WHERE user_id = profile_id;
  UPDATE drills SET created_by = NULL WHERE created_by = profile_id;
  UPDATE event_rsvps SET responded_by = NULL WHERE responded_by = profile_id;
  UPDATE game_day_templates SET created_by = NULL WHERE created_by = profile_id;
  UPDATE game_player_stats SET entered_by = NULL WHERE entered_by = profile_id;
  UPDATE game_results SET recorded_by = NULL WHERE recorded_by = profile_id;
  UPDATE invitations SET invited_by = NULL WHERE invited_by = profile_id;
  UPDATE invitations SET accepted_by = NULL WHERE accepted_by = profile_id;
  UPDATE jersey_assignment_history SET performed_by = NULL WHERE performed_by = profile_id;
  UPDATE jersey_assignments SET assigned_by = NULL WHERE assigned_by = profile_id;
  UPDATE lineup_templates SET created_by = NULL WHERE created_by = profile_id;
  DELETE FROM message_recipients WHERE profile_id = profile_id;
  UPDATE message_reports SET reviewed_by = NULL WHERE reviewed_by = profile_id;
  UPDATE message_reports SET reported_by = NULL WHERE reported_by = profile_id;
  UPDATE messages SET sender_id = NULL WHERE sender_id = profile_id;
  UPDATE payment_installments SET parent_id = NULL WHERE parent_id = profile_id;
  UPDATE platform_announcements SET created_by = NULL WHERE created_by = profile_id;
  UPDATE platform_data_requests SET requestor_id = NULL WHERE requestor_id = profile_id;
  UPDATE platform_data_requests SET target_user_id = NULL WHERE target_user_id = profile_id;
  UPDATE platform_data_requests SET completed_by = NULL WHERE completed_by = profile_id;
  UPDATE platform_email_campaigns SET created_by = NULL WHERE created_by = profile_id;
  UPDATE platform_error_log SET user_id = NULL WHERE user_id = profile_id;
  UPDATE platform_feature_requests SET submitted_by = NULL WHERE submitted_by = profile_id;
  DELETE FROM platform_feature_votes WHERE user_id = profile_id;
  UPDATE platform_org_events SET performed_by = NULL WHERE performed_by = profile_id;
  UPDATE platform_promo_codes SET created_by = NULL WHERE created_by = profile_id;
  UPDATE platform_promo_usage SET applied_by = NULL WHERE applied_by = profile_id;
  UPDATE platform_settings SET updated_by = NULL WHERE updated_by = profile_id;
  DELETE FROM platform_team_members WHERE profile_id = profile_id;
  UPDATE platform_team_members SET invited_by = NULL WHERE invited_by = profile_id;
  UPDATE platform_tos_versions SET created_by = NULL WHERE created_by = profile_id;
  UPDATE player_achievements SET verified_by = NULL WHERE verified_by = profile_id;
  UPDATE player_badges SET awarded_by = NULL WHERE awarded_by = profile_id;
  UPDATE player_coach_notes SET coach_id = NULL WHERE coach_id = profile_id;
  UPDATE player_development_assignments SET reviewed_by = NULL WHERE reviewed_by = profile_id;
  UPDATE player_development_assignments SET assigned_by = NULL WHERE assigned_by = profile_id;
  UPDATE player_evaluations SET evaluated_by = NULL WHERE evaluated_by = profile_id;
  UPDATE player_goals SET created_by = NULL WHERE created_by = profile_id;
  DELETE FROM practice_plan_favorites WHERE user_id = profile_id;
  UPDATE practice_plans SET created_by = NULL WHERE created_by = profile_id;
  UPDATE profiles SET parent_profile_id = NULL WHERE parent_profile_id = profile_id;
  UPDATE reflection_templates SET created_by = NULL WHERE created_by = profile_id;
  UPDATE registrations SET evaluated_by = NULL WHERE evaluated_by = profile_id;
  UPDATE registrations SET reviewed_by = NULL WHERE reviewed_by = profile_id;
  UPDATE role_assignments SET granted_by = NULL WHERE granted_by = profile_id;
  UPDATE schedule_events SET stats_entered_by = NULL WHERE stats_entered_by = profile_id;
  UPDATE shoutout_categories SET created_by = NULL WHERE created_by = profile_id;
  UPDATE shoutouts SET giver_id = NULL WHERE giver_id = profile_id;
  UPDATE team_invite_codes SET created_by = NULL WHERE created_by = profile_id;
  UPDATE team_post_comments SET deleted_by = NULL WHERE deleted_by = profile_id;
  UPDATE team_staff SET assigned_by = NULL WHERE assigned_by = profile_id;
  UPDATE user_roles SET revoked_by = NULL WHERE revoked_by = profile_id;
  UPDATE user_roles SET granted_by = NULL WHERE granted_by = profile_id;
  UPDATE volunteer_blasts SET sent_by = NULL WHERE sent_by = profile_id;

  -- ── Delete user_roles for this user ──
  DELETE FROM user_roles WHERE user_id = profile_id;

  -- ── Delete the profile ──
  DELETE FROM profiles WHERE id = profile_id;
END;
$$;
```

**ACTION REQUIRED:** Carlos must run this SQL in Supabase Dashboard.

**IMPORTANT NOTE about `delete_organization_cascade`:** There is a variable shadowing issue in the function — the parameter name `org_id` conflicts with column names like `drills.org_id`. CC should rename the parameter to `p_org_id` and update all references inside the function to use `p_org_id` instead. Same for `delete_profile_cascade` — rename parameter to `p_profile_id`.

**Commit message:** `[PA-UX-1] Add cascade delete database functions for organizations and profiles`

---

## Sub-Phase 2: Organizations List View + Grid View Toggle

**File to modify:** `src/pages/platform/PlatformOrganizations.jsx` (946 lines)

### Changes:

**1. Add view mode state:**
```javascript
const [viewMode, setViewMode] = useState('list') // 'list' or 'grid'
```

**2. Add view toggle buttons** next to the existing sort/filter controls:

Two small icon buttons (List icon and Grid icon). Use `LayoutList` and `LayoutGrid` from lucide-react (check `../../constants/icons` first — if not available, use `Menu` and `Grid` or similar). Style: active button gets the accent treatment (`bg-[#4BB9EC]/15 text-[#4BB9EC]`), inactive gets muted styling.

**3. Create a `OrgListRow` component** (new, inside the same file):

A compact table row showing:
- Org name (bold) + slug (muted, smaller)
- Status badge (Active/Suspended)
- Member count
- Team count
- Season count
- Health score badge (colored by score)
- Setup progress (X/7)
- Last active timestamp
- Actions: View Details button, Suspend/Activate button

The list row should be clickable (navigates to org detail, same as card click).

Pattern to follow: look at how `PlatformUsers.jsx` renders its user table — it already has a clean table layout with columns, sortable headers, and action buttons. Match that style.

**4. Conditionally render based on viewMode:**

```jsx
{viewMode === 'grid' ? (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
    {filtered.map(org => <OrgCard key={org.id} ... />)}
  </div>
) : (
  <div className={`rounded-[14px] overflow-hidden border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
    <table className="w-full">
      <thead>...</thead>
      <tbody>
        {filtered.map(org => <OrgListRow key={org.id} ... />)}
      </tbody>
    </table>
  </div>
)}
```

**5. Keep the existing `OrgCard` component unchanged** — it's used in grid view.

**6. Default to list view:** `useState('list')`

**Commit message:** `[PA-UX-2] Add list view / grid view toggle to Organizations page (list default)`

**Test checklist:**
- [ ] List view is the default when page loads
- [ ] Grid view shows the existing org cards
- [ ] List view shows a compact table with all key info
- [ ] Toggle switches between views
- [ ] Clicking an org row in list view navigates to detail
- [ ] Sort and filter work in both views
- [ ] Build passes

---

## Sub-Phase 3: Add Delete User to Platform Users

**File to modify:** `src/pages/platform/PlatformUsers.jsx` (1263 lines)

### Changes:

**1. Update the org delete handler in `PlatformOrgDetail.jsx`** to use the new cascade function:

Find the existing `handleDelete` function (around line 1313) and replace the delete call:

```javascript
// OLD:
await supabase.from('organizations').delete().eq('id', orgId)

// NEW:
const { error } = await supabase.rpc('delete_organization_cascade', { p_org_id: orgId })
if (error) throw error
```

**2. Add "Delete User" action to `PlatformUsers.jsx`:**

In the `UserDetailSlideOver` component, find the actions section (where Suspend/Activate and Grant/Revoke Super Admin buttons are). Add a "Delete User" button at the bottom in a "Danger Zone" section:

```jsx
{/* Danger Zone */}
<div className={`border-t ${tc.border} pt-4 mt-4`}>
  <p className={`text-xs font-bold uppercase tracking-wider text-red-500 mb-3`}>Danger Zone</p>
  <button
    onClick={() => handleDeleteUser(selectedUser)}
    disabled={selectedUser.is_platform_admin}
    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors w-full disabled:opacity-30 disabled:cursor-not-allowed"
  >
    <Trash2 className="w-4 h-4" />
    Permanently Delete User
  </button>
  {selectedUser.is_platform_admin && (
    <p className={`text-xs ${tc.textMuted} mt-1`}>Platform admins cannot be deleted</p>
  )}
</div>
```

**3. Add the `handleDeleteUser` function:**

```javascript
function handleDeleteUser(user) {
  setConfirmModal({
    open: true,
    title: 'Permanently Delete User',
    message: `This will permanently delete "${user.full_name || user.email}" and remove all their data, org memberships, and references. This action cannot be undone.`,
    destructive: true,
    requireTyping: true, // Must type DELETE to confirm
    onConfirm: async () => {
      try {
        // Audit log BEFORE delete (so we have the user info)
        await supabase.from('platform_admin_actions').insert({
          admin_id: adminUser?.id,
          action_type: 'delete_user',
          target_type: 'user',
          target_id: user.id,
          details: { user_name: user.full_name, email: user.email },
          user_agent: navigator.userAgent,
        })
        
        // Call the cascade delete function
        const { error } = await supabase.rpc('delete_profile_cascade', { p_profile_id: user.id })
        if (error) throw error
        
        showToast?.(`${user.full_name || user.email} deleted`, 'success')
        setSelectedUser(null)
        loadUsers() // refresh the list
      } catch (err) {
        console.error('Delete user error:', err)
        showToast?.(`Failed to delete user: ${err.message}`, 'error')
      }
    },
  })
}
```

**4. Add a confirm modal if one doesn't already exist in PlatformUsers:**

Check if the page already has a `ConfirmModal` component (it likely does based on the `confirmModal` state). If so, reuse it. If not, add one following the same pattern as `PlatformOrgDetail.jsx`'s confirm modal with the "type DELETE" requirement.

**5. Make sure `Trash2` is imported** from the icons file.

**6. The delete button must be DISABLED for platform admin users** — the `delete_profile_cascade` function already blocks this at the DB level, but the UI should prevent it too.

**Commit message:** `[PA-UX-3] Add delete user action with cascade function, update org delete to use cascade function`

**Test checklist:**
- [ ] Cascade functions created (Carlos runs migration)
- [ ] Org delete from OrgDetail page now uses `delete_organization_cascade` RPC
- [ ] Org delete actually removes the org and all children
- [ ] User delete button appears in user detail slide-over
- [ ] User delete is disabled for platform admin users
- [ ] User delete requires typing "DELETE" to confirm
- [ ] User delete calls `delete_profile_cascade` RPC
- [ ] User delete actually removes the profile and cleans up references
- [ ] Audit log entry created before deletion
- [ ] Build passes
