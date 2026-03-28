# CC-FIX-CHATS-ATTENDANCE-NOTIFICATIONS-LEAK.md
# Fix: ChatsPage + AttendancePage + NotificationsPage Remaining Leaks

## READ FIRST
1. `CC-SPEC-GUARDRAILS.md`
2. `CLAUDE.md`

## PRIORITY: CRITICAL

---

## FIX 1: ChatsPage.jsx — Add allSeasons Fallback

Lines 120-124 have only 2 filter branches. Add the third.

Same pattern as every other fix:

```javascript
// In the chat_channels query, find the if/else chain for season filtering.
// Add the else clause:
} else {
  const orgSeasonIds = (allSeasons || []).map(s => s.id)
  if (orgSeasonIds.length === 0) {
    setChannels([])
    setLoading(false)
    return
  }
  query = query.in('season_id', orgSeasonIds)
}
```

Ensure `allSeasons` is destructured from `useSeason()`. If not, add it.

### Commit:
```bash
git add src/pages/chats/ChatsPage.jsx
git commit -m "SECURITY: Fix ChatsPage All Seasons + no sport leak — add allSeasons fallback"
```

---

## FIX 2: AttendancePage.jsx Line ~157 — Scope Profiles Query

The `.from('profiles')` query with NO filters returns every user in the database. This is used for a volunteer dropdown.

Scope it to only profiles that belong to the current organization. The `profiles` table has `current_organization_id` (confirmed in SUPABASE_SCHEMA.md), OR filter through `user_roles`:

**Option A (if profiles has current_organization_id):**
```javascript
.from('profiles')
.select('id, full_name, email')
.eq('current_organization_id', organization.id)
```

**Option B (if profiles doesn't have that column, use user_roles):**
```javascript
// First get user_ids for this org
const { data: orgRoles } = await supabase
  .from('user_roles')
  .select('user_id')
  .eq('organization_id', organization.id)
  .eq('is_active', true)
const orgUserIds = (orgRoles || []).map(r => r.user_id)

// Then query profiles for those users only
.from('profiles')
.select('id, full_name, email')
.in('id', orgUserIds)
```

Check which approach works by verifying the `profiles` table schema. Use whichever column exists.

### Commit:
```bash
git add src/pages/attendance/AttendancePage.jsx
git commit -m "SECURITY: Scope AttendancePage profiles query to current organization"
```

---

## FIX 3: NotificationsPage.jsx Line ~50 — Scope Notifications Query

The `.from('notifications')` query has no org filter. Notifications should be scoped to the current user:

```javascript
.from('notifications')
.select('*')
.eq('user_id', user.id)  // Only show the current user's notifications
```

If the query is meant to show org-wide notifications (admin view), scope through the user's org:
```javascript
// Check if notifications table has organization_id — if yes:
.eq('organization_id', organization.id)

// If not, filter by user_id:
.eq('user_id', user.id)
```

Check the table schema and the intent of the query before choosing.

### Commit:
```bash
git add src/pages/notifications/NotificationsPage.jsx
git commit -m "SECURITY: Scope NotificationsPage query to current user/organization"
```

---

## FINAL:
```bash
npm run build  # MUST PASS
git push origin main
```

## REPORT
```
- ChatsPage fixed: YES/NO
- AttendancePage profiles scoped: YES/NO
- NotificationsPage scoped: YES/NO
- Build: PASS/FAIL
```
