# CC-SIDEBAR-NAV-RESTRUCTURE

## Executive Summary

Full restructure of the desktop web admin sidebar navigation, page naming conventions, Teams page action expansion, Coaches page improvements, and introduction of Staff Management. This spec addresses navigation clarity, action density gaps on key management pages, and naming consistency between mobile and web.

**Branch:** `feat/desktop-dashboard-redesign`
**Repo:** `volleybrain-admin`

---

## IMPORTANT — READ BEFORE MODIFYING

Before changing ANY file, read the ENTIRE file first. This spec touches navigation architecture, page components, and route definitions — all interconnected. A change in one place ripples everywhere.

**Key files to read first:**
- `src/MainApp.jsx` (lines 968–1093 for nav groups, lines 1096–1113 for navigation handler)
- `src/components/layout/LynxSidebar.jsx` (sidebar renderer)
- `src/lib/routes.js` (route mapping)
- `src/pages/teams/TeamsPage.jsx` (teams orchestrator)
- `src/pages/teams/TeamsTableView.jsx` (teams table with action menu)
- `src/pages/coaches/CoachesPage.jsx` (coaches page)

---

## Phase 1: Sidebar Navigation Restructure

### Problem

The current desktop sidebar groups are flat and generic compared to the mobile app's intentional categorization. The mobile version groups by task intent (Quick Access, Game Day, Coaching Tools, League & Community) while the desktop uses vague labels (People, Operations, Insights, Setup). The desktop sidebar also has too many items in "Operations" (6 items) and "Setup" (8 items), making it feel like a dumping ground.

### 1A: Rename Admin Nav Groups and Items

**File:** `src/MainApp.jsx` — `adminNavGroups` array (line 968)

Replace the entire `adminNavGroups` definition with:

```javascript
const adminNavGroups = [
  { id: 'dashboard', label: 'Dashboard', type: 'single' },

  // --- CLUB MANAGEMENT (people + teams + staff) ---
  { id: 'club', label: 'Club Management', type: 'group', icon: 'shield', items: [
    { id: 'teams', label: 'Team Management', icon: 'shield' },
    { id: 'coaches', label: 'Coach Directory', icon: 'user-cog' },
    { id: 'staff', label: 'Staff & Volunteers', icon: 'users' },
  ]},

  // --- REGISTRATION & PAYMENTS (the money stuff) ---
  { id: 'registration', label: 'Registration & Payments', type: 'group', icon: 'clipboard', items: [
    { id: 'registrations', label: 'Registrations', icon: 'clipboard' },
    { id: 'payments', label: 'Payment Admin', icon: 'dollar' },
    { id: 'jerseys', label: 'Jersey Management', icon: 'shirt', hasBadge: true },
  ]},

  // --- SCHEDULING & ATTENDANCE ---
  { id: 'scheduling', label: 'Scheduling', type: 'group', icon: 'calendar', items: [
    { id: 'schedule', label: 'Schedule', icon: 'calendar' },
    { id: 'attendance', label: 'Attendance & RSVP', icon: 'check-square' },
    { id: 'coach-availability', label: 'Coach Availability', icon: 'calendar-check' },
  ]},

  // --- GAME DAY (unchanged, this group is solid) ---
  { id: 'game', label: 'Game Day', type: 'group', icon: 'gameprep', items: [
    { id: 'gameprep', label: 'Game Prep', icon: 'target' },
    { id: 'standings', label: 'Standings', icon: 'star' },
    { id: 'leaderboards', label: 'Leaderboards', icon: 'bar-chart' },
  ]},

  // --- COMMUNICATION (unchanged) ---
  { id: 'communication', label: 'Communication', type: 'group', icon: 'chats', items: [
    { id: 'chats', label: 'Chats', icon: 'message' },
    { id: 'blasts', label: 'Announcements', icon: 'megaphone' },
    { id: 'notifications', label: 'Push Notifications', icon: 'bell' },
  ]},

  // --- INSIGHTS & REPORTS ---
  { id: 'insights', label: 'Reports & Insights', type: 'group', icon: 'reports', items: [
    { id: 'reports', label: 'Reports & Analytics', icon: 'pie-chart' },
    { id: 'registration-funnel', label: 'Registration Funnel', icon: 'trending-up' },
    { id: 'season-archives', label: 'Season Archives', icon: 'trophy' },
    { id: 'org-directory', label: 'Org Directory', icon: 'building' },
  ]},

  // --- SETUP & SETTINGS ---
  { id: 'setup', label: 'Settings', type: 'group', icon: 'settings', items: [
    { id: 'seasons', label: 'Season Management', icon: 'calendar' },
    { id: 'templates', label: 'Registration Forms', icon: 'clipboard' },
    { id: 'waivers', label: 'Waivers', icon: 'file-text' },
    { id: 'paymentsetup', label: 'Payment Setup', icon: 'credit-card' },
    { id: 'venues', label: 'Venues', icon: 'map-pin' },
    { id: 'organization', label: 'Organization', icon: 'building' },
    { id: 'data-export', label: 'Data Export', icon: 'download' },
    { id: 'subscription', label: 'Subscription', icon: 'credit-card' },
  ]},
]
```

### 1B: Update Route Mapping for Renamed/New Pages

**File:** `src/lib/routes.js`

Add these entries to the `ROUTES` object:

```javascript
'staff': '/staff',
```

Add to `PAGE_TITLES`:

```javascript
'/staff': 'Staff & Volunteers',
```

### 1C: Update Page Titles to Match New Nav Labels

**File:** `src/lib/routes.js` — `PAGE_TITLES` object

Change these existing entries:

```javascript
// OLD:
'/teams': 'Teams & Rosters',
'/coaches': 'Coaches',
'/payments': 'Payments',
'/settings/seasons': 'Season Settings',

// NEW:
'/teams': 'Team Management',
'/coaches': 'Coach Directory',
'/payments': 'Payment Admin',
'/settings/seasons': 'Season Management',
```

### 1D: Update Page Headers to Match

These pages use `PageShell` with `title` and `breadcrumb` props. Update each:

**File:** `src/pages/teams/TeamsPage.jsx`
- Change all instances of `breadcrumb="Teams & Roster"` → `breadcrumb="Club Management"`
- Change all instances of `title="Teams & Roster"` → `title="Team Management"`
- Change subtitle template from `Teams & Roster` references to `Team Management`

**File:** `src/pages/coaches/CoachesPage.jsx`
- Change `breadcrumb="People"` → `breadcrumb="Club Management"`
- Change `title="Coach Management"` → `title="Coach Directory"`
- Change subtitle accordingly

**File:** `src/pages/payments/` (find the payments page)
- Change title to `"Payment Admin"` if not already

---

## Phase 2: Team Management Page — Action Expansion

### Problem

The Teams table (`TeamsTableView.jsx`) has a kebab menu with exactly ONE action: Delete Team. That is a critical gap. An admin managing teams needs to be able to edit team settings, manage the roster inline, assign/reassign coaches, view team details, and more — not just delete.

### 2A: Expand Team Table Kebab Menu

**File:** `src/pages/teams/TeamsTableView.jsx`

Replace the current kebab menu dropdown (the `{menuOpen === team.id && ...}` block, approximately lines 211-225) with an expanded action menu:

```jsx
{menuOpen === team.id && (
  <>
    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
    <div className={`absolute right-5 top-12 z-20 rounded-xl shadow-lg border py-1.5 min-w-[200px] ${
      isDark ? 'bg-lynx-charcoal border-white/[0.06]' : 'bg-white border-slate-200'
    }`}>
      {/* View & Edit */}
      <button
        onClick={() => { onNavigateToWall?.(team.id); setMenuOpen(null) }}
        className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 ${isDark ? 'text-slate-300 hover:bg-white/[0.04]' : 'text-slate-700 hover:bg-slate-50'}`}
      >
        <ExternalLink className="w-4 h-4 opacity-60" /> View Team Wall
      </button>
      <button
        onClick={() => { onEditTeam?.(team); setMenuOpen(null) }}
        className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 ${isDark ? 'text-slate-300 hover:bg-white/[0.04]' : 'text-slate-700 hover:bg-slate-50'}`}
      >
        <Edit className="w-4 h-4 opacity-60" /> Edit Team Settings
      </button>

      {/* Roster */}
      <div className={`my-1 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`} />
      <button
        onClick={() => { onManageRoster?.(team); setMenuOpen(null) }}
        className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 ${isDark ? 'text-slate-300 hover:bg-white/[0.04]' : 'text-slate-700 hover:bg-slate-50'}`}
      >
        <Users className="w-4 h-4 opacity-60" /> Manage Roster
      </button>
      <button
        onClick={() => { onAssignCoaches?.(team); setMenuOpen(null) }}
        className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 ${isDark ? 'text-slate-300 hover:bg-white/[0.04]' : 'text-slate-700 hover:bg-slate-50'}`}
      >
        <UserCog className="w-4 h-4 opacity-60" /> Assign Coaches
      </button>

      {/* Roster Status Toggle */}
      <div className={`my-1 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`} />
      <button
        onClick={() => { onToggleRosterOpen?.(team); setMenuOpen(null) }}
        className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 ${isDark ? 'text-slate-300 hover:bg-white/[0.04]' : 'text-slate-700 hover:bg-slate-50'}`}
      >
        <Shield className="w-4 h-4 opacity-60" /> {team.roster_open ? 'Close Roster' : 'Open Roster'}
      </button>

      {/* Danger zone */}
      <div className={`my-1 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`} />
      <button
        onClick={() => { onDeleteTeam(team.id); setMenuOpen(null) }}
        className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 text-red-500 ${isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}
      >
        <Trash2 className="w-4 h-4" /> Delete Team
      </button>
    </div>
  </>
)}
```

Update the component's imports to add: `Edit, Users, UserCog, Shield`

Update the component's props to accept: `onEditTeam, onManageRoster, onAssignCoaches, onToggleRosterOpen`

### 2B: Add Edit Team Modal

**File:** `src/pages/teams/EditTeamModal.jsx` — CREATE NEW FILE

Create a modal that allows editing all team fields that are collected in `NewTeamModal` (name, abbreviation, color, age_group, age_group_type, team_type, skill_level, gender, max_roster_size, min_roster_size, roster_open, description, internal_notes). Pre-populate all fields from the team object passed in.

The modal should use the Lynx design system:
- Overlay: `bg-black/70`
- Card (dark): `bg-lynx-charcoal border border-white/[0.06] rounded-xl`
- Card (light): `bg-white border border-lynx-silver rounded-xl`
- Use `useTheme()` for isDark
- `rounded-[14px]` for inner content cards
- All font sizes use `text-r-*` responsive tokens
- All light-mode borders use `border-lynx-silver`, not `border-slate-200`
- Save button: `bg-lynx-navy text-white font-bold`

Include a "Save Changes" button that calls `supabase.from('teams').update(...)`.

### 2C: Add Manage Roster Modal

**File:** `src/pages/teams/ManageRosterModal.jsx` — CREATE NEW FILE

A modal showing:
1. Current roster list with player name, jersey number, position, and a "Remove" button per player
2. An "Add Player" section showing unrostered players (same data the page already fetches) with an "Add" button per player
3. Drag-to-reorder would be ideal but not required for this phase — simple list is fine

### 2D: Add Assign Coaches to Team Modal

**File:** `src/pages/teams/AssignCoachesModal.jsx` — CREATE NEW FILE

Similar to the existing `AssignTeamsModal` in CoachesPage but inverted — this one starts from a team and lets you pick coaches to assign. Show all coaches for the season with checkboxes, and a role dropdown (Head Coach, Assistant, Manager, Volunteer) for each selected coach.

### 2E: Wire Up New Actions in TeamsPage

**File:** `src/pages/teams/TeamsPage.jsx`

Add state for the new modals:
```javascript
const [editingTeam, setEditingTeam] = useState(null)
const [rosterTeam, setRosterTeam] = useState(null)
const [coachAssignTeam, setCoachAssignTeam] = useState(null)
```

Add a `toggleRosterOpen` function:
```javascript
async function toggleRosterOpen(team) {
  await supabase.from('teams').update({ roster_open: !team.roster_open }).eq('id', team.id)
  showToast(`Roster ${team.roster_open ? 'closed' : 'opened'} for ${team.name}`, 'success')
  loadTeams()
}
```

Pass the new callbacks to `TeamsTableView`:
```jsx
<TeamsTableView
  teams={teams}
  search={search}
  onSearchChange={setSearch}
  onDeleteTeam={deleteTeam}
  onNavigateToWall={navigateToTeamWall}
  onEditTeam={(team) => setEditingTeam(team)}
  onManageRoster={(team) => setRosterTeam(team)}
  onAssignCoaches={(team) => setCoachAssignTeam(team)}
  onToggleRosterOpen={toggleRosterOpen}
  unrosteredPlayers={unrosteredPlayers}
  onAddPlayer={addPlayerToTeam}
/>
```

Load coaches for the assign modal:
```javascript
const [coaches, setCoaches] = useState([])

async function loadCoaches() {
  if (!selectedSeason?.id) return
  const { data } = await supabase
    .from('coaches')
    .select('*, team_coaches(*, teams(id, name))')
    .eq('season_id', selectedSeason.id)
    .eq('status', 'active')
  setCoaches(data || [])
}
```

Call `loadCoaches()` alongside `loadTeams()` in the useEffect.

Render the new modals at the bottom of the component alongside existing modals:
```jsx
{editingTeam && (
  <EditTeamModal
    team={editingTeam}
    onClose={() => setEditingTeam(null)}
    onSave={() => { setEditingTeam(null); loadTeams() }}
    showToast={showToast}
  />
)}
{rosterTeam && (
  <ManageRosterModal
    team={rosterTeam}
    unrosteredPlayers={unrosteredPlayers}
    onClose={() => setRosterTeam(null)}
    onAddPlayer={addPlayerToTeam}
    onRemovePlayer={async (teamId, playerId) => {
      await supabase.from('team_players').delete().eq('team_id', teamId).eq('player_id', playerId)
      showToast('Player removed from team', 'success')
      loadTeams()
      loadUnrosteredPlayers()
    }}
    showToast={showToast}
  />
)}
{coachAssignTeam && (
  <AssignCoachesModal
    team={coachAssignTeam}
    coaches={coaches}
    onClose={() => setCoachAssignTeam(null)}
    onSave={async (teamId, assignments) => {
      const { data: existing } = await supabase
        .from('team_coaches').select('id, coach_id').eq('team_id', teamId)
      for (const ex of (existing || [])) {
        if (!assignments.find(a => a.coach_id === ex.coach_id)) {
          await supabase.from('team_coaches').delete().eq('id', ex.id)
        }
      }
      for (const a of assignments) {
        const ex = (existing || []).find(e => e.coach_id === a.coach_id)
        if (ex) await supabase.from('team_coaches').update({ role: a.role }).eq('id', ex.id)
        else await supabase.from('team_coaches').insert({ team_id: teamId, coach_id: a.coach_id, role: a.role })
      }
      showToast('Coach assignments saved', 'success')
      setCoachAssignTeam(null)
      loadTeams()
      loadCoaches()
    }}
    showToast={showToast}
  />
)}
```

---

## Phase 3: Coach Directory Page — Full Redesign

### Problem

The coach cards are ugly and functionally broken:

1. **The purple/blue gradient banner** is generic AI-slop. It adds no information, wastes vertical space, and clashes with the Lynx brand system (navy/sky/gold).
2. **Action buttons are invisible in light mode.** The code has View, Assign Teams, and Edit buttons at lines 274-276, but they render with `opacity-60` icons and `tc.hoverBg` hover states on white cards — meaning they're near-invisible. Only the amber X and red Trash show because they have explicit color. This is why only two actions appear usable.
3. **No page-level bulk actions.** No export, no email blast, no invite/recruit link.
4. **Too much empty space.** Cards vary wildly in height depending on whether a coach has assignments, bio, experience, etc. Some cards are 60% whitespace.

### 3A: Complete CoachCard Redesign

**File:** `src/pages/coaches/CoachesPage.jsx` — Replace the entire `CoachCard` function (lines ~227-286)

**Design direction:** Clean, compact, information-dense cards that match the Lynx brand system. No decorative gradient banners. Avatar + info in a horizontal layout. Actions in a proper kebab menu (like the Teams table), not invisible icon buttons.

Replace with:

```jsx
function CoachCard({ coach, tc, isDark, onDetail, onEdit, onAssign, onToggleStatus, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const bgCheck = bgCheckLabels[coach.background_check_status] || bgCheckLabels.not_started

  return (
    <div
      className={`${tc.cardBg} border ${tc.border} rounded-[14px] overflow-hidden transition hover:shadow-lg ${
        coach.status !== 'active' ? 'opacity-60' : ''
      }`}
    >
      <div className="p-5">
        {/* Top row: avatar + name + kebab */}
        <div className="flex items-start gap-3.5">
          {/* Avatar */}
          {coach.photo_url ? (
            <img
              src={coach.photo_url}
              alt=""
              className="w-12 h-12 rounded-xl object-cover shrink-0"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-r-sm font-bold text-white shrink-0 bg-lynx-navy"
            >
              {coach.first_name?.[0]}{coach.last_name?.[0]}
            </div>
          )}

          {/* Name + role */}
          <div className="flex-1 min-w-0">
            <button
              onClick={onDetail}
              className={`text-base font-bold ${
                isDark ? 'text-white hover:text-lynx-sky' : 'text-slate-900 hover:text-lynx-sky'
              } transition text-left truncate block w-full`}
            >
              {coach.first_name} {coach.last_name}
            </button>
            {coach.coaching_level && (
              <p className={`text-xs font-medium mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {coach.coaching_level}
              </p>
            )}
          </div>

          {/* Kebab menu */}
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                isDark
                  ? 'hover:bg-white/[0.06] text-slate-400'
                  : 'hover:bg-slate-100 text-slate-400'
              }`}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className={`absolute right-0 top-9 z-20 rounded-xl shadow-lg border py-1.5 min-w-[180px] ${
                  isDark ? 'bg-lynx-charcoal border-white/[0.06]' : 'bg-white border-slate-200'
                }`}>
                  <button onClick={() => { onDetail?.(); setMenuOpen(false) }}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2.5 ${isDark ? 'text-slate-300 hover:bg-white/[0.04]' : 'text-slate-700 hover:bg-slate-50'}`}>
                    <Eye className="w-4 h-4 opacity-60" /> View Profile
                  </button>
                  <button onClick={() => { onEdit?.(); setMenuOpen(false) }}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2.5 ${isDark ? 'text-slate-300 hover:bg-white/[0.04]' : 'text-slate-700 hover:bg-slate-50'}`}>
                    <Edit className="w-4 h-4 opacity-60" /> Edit Coach
                  </button>
                  <button onClick={() => { onAssign?.(); setMenuOpen(false) }}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2.5 ${isDark ? 'text-slate-300 hover:bg-white/[0.04]' : 'text-slate-700 hover:bg-slate-50'}`}>
                    <Shield className="w-4 h-4 opacity-60" /> Assign Teams
                  </button>
                  {coach.email && (
                    <a href={`mailto:${coach.email}`}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2.5 ${isDark ? 'text-slate-300 hover:bg-white/[0.04]' : 'text-slate-700 hover:bg-slate-50'}`}>
                      <Mail className="w-4 h-4 opacity-60" /> Send Email
                    </a>
                  )}
                  <div className={`my-1 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`} />
                  <button onClick={() => { onToggleStatus?.(); setMenuOpen(false) }}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2.5 ${isDark ? 'text-amber-400 hover:bg-white/[0.04]' : 'text-amber-600 hover:bg-amber-50'}`}>
                    {coach.status === 'active' ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    {coach.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => { onDelete?.(); setMenuOpen(false) }}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2.5 text-red-500 ${isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}>
                    <Trash2 className="w-4 h-4" /> Remove Coach
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Contact info */}
        <div className={`flex flex-col gap-1 mt-3 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {coach.email && (
            <a href={`mailto:${coach.email}`} className="hover:text-lynx-sky flex items-center gap-1.5 truncate transition">
              <Mail className="w-3.5 h-3.5 shrink-0" /> {coach.email}
            </a>
          )}
          {coach.phone && (
            <a href={`tel:${coach.phone}`} className="hover:text-lynx-sky flex items-center gap-1.5 transition">
              <Phone className="w-3.5 h-3.5 shrink-0" /> {coach.phone}
            </a>
          )}
        </div>

        {/* Badges row: experience + bg check + waiver */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          {coach.experience_years && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
            }`}>
              {coach.experience_years} yrs
            </span>
          )}
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${bgCheck.bg} ${bgCheck.color}`}>
            {bgCheck.icon} BG: {bgCheck.label}
          </span>
          {coach.waiver_signed && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              isDark ? 'bg-lynx-sky/15 text-lynx-sky' : 'bg-sky-50 text-sky-600'
            }`}>
              Waiver ✓
            </span>
          )}
          {coach.code_of_conduct_signed && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              isDark ? 'bg-purple-500/15 text-purple-400' : 'bg-purple-50 text-purple-600'
            }`}>
              Conduct ✓
            </span>
          )}
        </div>

        {/* Team assignments */}
        {coach.assignments?.length > 0 && (
          <div className={`flex flex-wrap gap-1.5 mt-3 pt-3 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
            {coach.assignments.map(a => (
              <span
                key={a.id}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1"
                style={{
                  backgroundColor: isDark ? `${a.teams?.color || '#888'}20` : `${a.teams?.color || '#888'}15`,
                  color: a.teams?.color || '#888'
                }}
              >
                {a.role === 'head' && <Star className="w-3 h-3" />} {a.teams?.name}
              </span>
            ))}
          </div>
        )}
        {(!coach.assignments || coach.assignments.length === 0) && (
          <div className={`mt-3 pt-3 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
            <button
              onClick={onAssign}
              className={`text-xs font-medium flex items-center gap-1.5 transition ${
                isDark ? 'text-slate-500 hover:text-lynx-sky' : 'text-slate-400 hover:text-lynx-sky'
              }`}
            >
              <Plus className="w-3 h-3" /> Assign to team
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
```

**Key changes from old card:**
- No more purple gradient banner — saves ~96px of wasted height per card
- Avatar is a `rounded-xl` square (12x12), `bg-lynx-navy` for initials — on-brand, uses token not hex
- All actions moved to a proper kebab menu (MoreVertical) with labeled text items
- Actions include: View Profile, Edit Coach, Assign Teams, Send Email, Deactivate, Remove
- BG check status is always visible as a badge (not just when cleared)
- Waiver and conduct status shown as badges too
- Unassigned coaches get an "Assign to team" prompt instead of empty space (progressive disclosure)
- Consistent card height because the layout doesn't depend on a decorative banner
- `rounded-[14px]` matching the Lynx card standard

**IMPORTANT BRAND TOKEN NOTE FOR CC:** The code samples throughout this spec use some raw Tailwind classes for readability (`text-sm`, `text-xs`, `text-base`, `border-slate-200`). When CC executes, it MUST replace these with Lynx brand tokens:
- `text-xs` → `text-r-xs`
- `text-sm` → `text-r-sm`
- `text-base` → `text-r-base`
- `text-lg` → `text-r-lg`
- `text-xl` → `text-r-xl`
- `border-slate-200` (light mode borders) → `border-lynx-silver`
- `bg-slate-50` (light mode hover/alt) → `bg-lynx-frost` or `bg-lynx-cloud`
- `text-slate-900` (light mode primary text) → `text-lynx-navy`
- `hover:bg-slate-50` (light mode hover) → `hover:bg-lynx-frost`

CC should scan the final output of every file touched and ensure no raw `border-slate-200`, `text-slate-900`, or non-responsive `text-sm`/`text-xs` classes remain in new code. The existing codebase already uses these tokens — match the pattern.

**IMPORTANT:** Also update the CoachCard rendering call (around line 206) to pass `isDark`:

```jsx
<CoachCard key={coach.id} coach={coach} tc={tc} isDark={isDark}
  onDetail={() => setSelectedCoachForDetail(coach)}
  onEdit={() => { setEditingCoach(coach); setShowAddModal(true) }}
  onAssign={() => setAssigningCoach(coach)}
  onToggleStatus={() => toggleCoachStatus(coach)}
  onDelete={() => deleteCoach(coach)} />
```

You'll need to add `isDark` from `useTheme()` at the top of CoachesPage. Currently the page uses `useThemeClasses()` which returns `tc` but not `isDark` directly. Add:

```javascript
const { isDark } = useTheme()
```

And import `useTheme` alongside the existing `useThemeClasses` import.

Also add `MoreVertical` and `Shield` to the import from icons at the top of the file.

### 3B: Add Page-Level Action Buttons

**File:** `src/pages/coaches/CoachesPage.jsx`

Update the `actions` prop on PageShell (line ~156) to include more options. Replace the current single "Add Coach" button with:

```jsx
actions={
  <div className="flex items-center gap-2">
    <button
      onClick={() => exportCoachesCSV()}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition ${
        isDark
          ? 'bg-white/[0.04] border-white/[0.06] text-slate-300 hover:border-lynx-sky hover:text-lynx-sky'
          : 'bg-white border-slate-200 text-slate-500 hover:border-lynx-sky hover:text-lynx-sky'
      }`}
    >
      <Download className="w-4 h-4" /> Export
    </button>
    <button
      onClick={() => setShowEmailBlast(true)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition ${
        isDark
          ? 'bg-white/[0.04] border-white/[0.06] text-slate-300 hover:border-lynx-sky hover:text-lynx-sky'
          : 'bg-white border-slate-200 text-slate-500 hover:border-lynx-sky hover:text-lynx-sky'
      }`}
    >
      <Mail className="w-4 h-4" /> Email All
    </button>
    <button
      onClick={() => setShowInviteCoach(true)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition ${
        isDark
          ? 'bg-white/[0.04] border-white/[0.06] text-slate-300 hover:border-lynx-sky hover:text-lynx-sky'
          : 'bg-white border-slate-200 text-slate-500 hover:border-lynx-sky hover:text-lynx-sky'
      }`}
    >
      <UserPlus className="w-4 h-4" /> Invite
    </button>
    <button onClick={() => { setEditingCoach(null); setShowAddModal(true) }}
      className="flex items-center gap-2 px-5 py-2.5 bg-lynx-navy text-white font-bold rounded-lg hover:brightness-110 transition text-r-sm">
      <Plus className="w-4 h-4" /> Add Coach
    </button>
  </div>
}
```

Add new state variables:
```javascript
const [showEmailBlast, setShowEmailBlast] = useState(false)
const [showInviteCoach, setShowInviteCoach] = useState(false)
```

Import `Download, UserPlus` from icons.

### 3C: Add CSV Export Function

Add to CoachesPage:
```javascript
function exportCoachesCSV() {
  const csvColumns = [
    { label: 'First Name', accessor: c => c.first_name },
    { label: 'Last Name', accessor: c => c.last_name },
    { label: 'Email', accessor: c => c.email },
    { label: 'Phone', accessor: c => c.phone },
    { label: 'Status', accessor: c => c.status },
    { label: 'Role', accessor: c => c.assignments?.map(a => `${a.teams?.name} (${a.role})`).join(', ') || 'Unassigned' },
    { label: 'BG Check', accessor: c => c.background_check_status },
    { label: 'Waiver', accessor: c => c.waiver_signed ? 'Yes' : 'No' },
  ]
  exportToCSV(filteredCoaches, 'coaches', csvColumns)
}
```

Import `exportToCSV` from `../../lib/csv-export`.

### 3D: Email All Coaches Modal

**File:** `src/pages/coaches/EmailCoachesModal.jsx` — CREATE NEW FILE

A simple modal that:
1. Shows a list of all coaches with email addresses (with checkboxes, all selected by default)
2. Has a subject line input and message textarea
3. A "Copy Emails" button that copies all selected email addresses to clipboard (since we don't have a mail server)
4. A "Open in Email Client" button that creates a `mailto:` link with all selected emails

### 3E: Invite Coach Modal

**File:** `src/pages/coaches/InviteCoachModal.jsx` — CREATE NEW FILE

A modal with:
1. An email input field to send a direct invite (for future use — just collect the email for now)
2. A shareable invite link (generate a URL like `thelynxapp.com/join/coach/{org_id}` — placeholder for now)
3. A "Copy Link" button
4. Social share buttons (copy a pre-written recruitment message)

The pre-written message template:
```
🏐 We're looking for coaches! Join {orgName} on Lynx — the app that makes running youth sports clubs easy. Apply here: {inviteLink}
```

### 3F: Wire the new modals in CoachesPage

Add at the bottom of CoachesPage, alongside existing modals:

```jsx
{showEmailBlast && (
  <EmailCoachesModal
    coaches={filteredCoaches.filter(c => c.email)}
    onClose={() => setShowEmailBlast(false)}
    showToast={showToast}
  />
)}
{showInviteCoach && (
  <InviteCoachModal
    orgName={organization?.name || 'My Club'}
    orgId={organization?.id}
    onClose={() => setShowInviteCoach(false)}
    showToast={showToast}
  />
)}

---

## Phase 4: Staff & Volunteers Page (New)

### Problem

There is no concept of "staff" in the web admin. Many youth sports orgs have board members, team parents, scorekeepers, line judges, athletic trainers, photographers, etc. The mobile app has a Volunteer Management spec but the web has nothing.

### 4A: Create Staff Page

**File:** `src/pages/staff/StaffPage.jsx` — CREATE NEW FILE

Create a new page for managing staff and volunteers. This is a simpler version of CoachesPage with different fields.

**Staff roles** (config-driven, not hardcoded):
- Board Member
- Team Parent
- Scorekeeper
- Line Judge
- Athletic Trainer
- Photographer/Videographer
- Event Coordinator
- Other (custom)

**Staff record fields:**
- first_name, last_name, email, phone
- role (from list above or custom)
- status (active/inactive)
- team_id (optional — which team they're assigned to, null = org-level)
- season_id
- background_check_status
- notes
- created_at

**Page layout:**
- Same PageShell pattern as coaches page
- InnerStatRow showing: Total Staff, Active, BG Check completion
- Filter by role, search by name
- Card grid showing staff members with role badge, contact info, team assignment
- Add Staff modal (simpler than coach modal — just name, email, phone, role, team, BG check status)

### 4B: Create Supabase Table

This spec requires a new database table. Create a migration or add via Supabase dashboard:

```sql
CREATE TABLE IF NOT EXISTS staff_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'volunteer',
  custom_role TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  background_check_status TEXT DEFAULT 'not_started',
  background_check_date DATE,
  notes TEXT,
  photo_url TEXT,
  user_account_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can manage staff"
  ON staff_members FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );
```

### 4C: Add Route

**File:** `src/MainApp.jsx`

Add the staff route in the routes section (find where other page routes are defined, likely in a `<Routes>` or page-rendering switch):

```jsx
// In the route/page rendering logic, add:
case 'staff':
  return <StaffPage showToast={showToast} onNavigate={...} />
```

Import `StaffPage` from `../../pages/staff/StaffPage`.

---

## Phase 5: Make Team Name Clickable → Team Detail View

### Problem

When you click "Teams" in the nav, you land on a table. But you can't click a team name to drill into a team detail view. You can only view the Team Wall or delete. This is a major navigation gap.

### 5A: Make Team Name a Link

**File:** `src/pages/teams/TeamsTableView.jsx`

Wrap the team name in the table with a clickable button:

```jsx
<button
  onClick={() => onViewTeamDetail?.(team)}
  className={`text-base font-semibold truncate ${isDark ? 'text-white hover:text-lynx-sky' : 'text-slate-900 hover:text-lynx-sky'} transition cursor-pointer`}
>
  {team.name}
</button>
```

Add `onViewTeamDetail` to the component props.

### 5B: Create Team Detail Slideout or Modal

**File:** `src/pages/teams/TeamDetailPanel.jsx` — CREATE NEW FILE

A right-side slideout panel (or large modal) showing:
1. **Header:** Team name, color swatch, type badge, roster status chip
2. **Quick Stats:** Player count / max, coach count, record (if available)
3. **Roster Section:** Player list with name, jersey #, position. Click player → player card expand
4. **Coaches Section:** Assigned coaches with roles. "Assign Coach" button
5. **Team Settings:** Editable inline or link to EditTeamModal
6. **Actions:** View Wall, Edit Team, Toggle Roster, Delete Team

This becomes the "home base" for a team — everything you'd want to do with a team is accessible from here.

Wire this up in TeamsPage with state:
```javascript
const [detailTeam, setDetailTeam] = useState(null)
```

---

## Design System Reminders — FROM BRAND BOOK AND UX PHILOSOPHY

**CC must follow all of these. These are not suggestions — they are the law of the land.**

All new components must follow these rules sourced from `LYNX-UX-PHILOSOPHY.md`, `lynx-brandbook-v2.html`, and `tailwind.config.js`:

### Color Palette (from tailwind `lynx.*` tokens)
- **Navy:** `#10284C` (`lynx-navy`) — primary brand, buttons, text on light
- **Sky Blue:** `#4BB9EC` (`lynx-sky`) — accents, active states, links
- **Deep Sky:** `#2A9BD4` (`lynx-deep`) — hover/pressed states for sky
- **Gold:** `#FFD700` — achievement tier only. **NEVER as text on light backgrounds.**
- **Midnight:** `#0A1628` (`lynx-midnight`) — page background (dark mode)
- **Charcoal:** `#1A2744` (`lynx-charcoal`) — card background (dark mode)
- **Graphite:** `#232F3E` (`lynx-graphite`) — input backgrounds, elevated surfaces (dark)
- **Cloud:** `#F6F8FB` (`lynx-cloud`) — page background (light mode)
- **Frost:** `#F0F2F5` (`lynx-frost`) — hover/alt backgrounds (light mode)
- **Silver:** `#E8ECF2` (`lynx-silver`) — borders (light mode)
- **Border Dark:** `#2A3545` (`lynx-border-dark`) — borders (dark mode)
- **Slate:** `#5A6B7F` (`lynx-slate`) — muted text (light mode)
- **Ice:** `#E8F4FD` (`lynx-ice`) — active/selected background tint (light mode)

### Typography (from `src/index.css` + `tailwind.config.js`)
- **Web Font:** Inter Variable — self-hosted from `public/fonts/Inter-Variable.ttf` and `Inter-Variable-Italic.ttf`, registered as `font-family: 'Inter'` via `@font-face` in `src/index.css`, variable weight range 100–900
- **Tailwind token:** `fontFamily.sans` = `['Inter', 'system-ui', ...]` — all components inherit this automatically, no need to set font-family manually
- **Responsive sizes:** Use the `text-r-*` tokens: `text-r-xs` (11-12px), `text-r-sm` (12-13px), `text-r-base` (13-15px), `text-r-lg` (15-17px), `text-r-xl` (17-20px), `text-r-2xl` (20-24px), `text-r-3xl` (24-32px)
- **Never hardcode font sizes** — always use the responsive clamp tokens
- **Plus Jakarta Sans** is the mobile app font (and brandbook display font) — it is NOT used on web

### Card Design Language (from UX Philosophy + existing patterns)
- **Glassmorphism:** The UX Philosophy specifies "glassmorphism, rounded-2xl, consistent shadows" as the card design language
- **Cards (dark):** `bg-lynx-charcoal border border-white/[0.06]` with `shadow-glass-dark` for elevated cards
- **Cards (light):** `bg-white border border-lynx-silver` with `shadow-soft-sm` for subtle elevation
- **Card radius:** `rounded-[14px]` for primary content cards (this is the existing convention in the codebase)
- **Hover (dark):** `hover:bg-white/[0.04]`
- **Hover (light):** `hover:bg-lynx-frost`

### Button Hierarchy
- **Primary:** `bg-lynx-navy text-white font-bold` (main CTA)
- **Sky accent:** `bg-lynx-sky text-lynx-navy font-bold` (secondary CTA)
- **Ghost/outline:** `border border-lynx-silver text-slate-500 hover:border-lynx-sky hover:text-lynx-sky` (light mode) / `border-white/[0.06] text-slate-300 hover:border-lynx-sky hover:text-lynx-sky` (dark mode)
- **Danger:** `text-red-500 hover:bg-red-500/10` (destructive actions)
- **No button color monotony** — vary styles across the page. Don't make 4 identical ghost buttons in a row.

### Modals & Overlays
- **Overlay:** `bg-black/70`
- **Modal card:** Same card pattern + `max-w-lg` (simple), `max-w-2xl` (complex), `max-w-4xl` (data-heavy)
- **Modal radius:** `rounded-xl`

### UX Philosophy — Progressive Disclosure (CRITICAL)
From `LYNX-UX-PHILOSOPHY.md` Section 1:
- **"Nothing appears on screen just because it exists in the database."** Every section, card, and element renders only when relevant.
- **Empty states collapse, not placeholder.** No "All caught up!" messages. No greyed-out "$0.00" cards. The section doesn't exist.
- **Conditional UI adapts to data.** Multi-child UI only for multi-child families. Bio section only if bio exists. Experience badge only if experience_years is set.
- The unassigned coaches "Assign to team" prompt in the new card design follows this — it only shows when `assignments.length === 0`.

### UX Philosophy — Web is "Command Center"
From Section 4:
- Web is "Mission control — everything visible, nothing requires leaving the screen"
- Web uses data tables and multi-select operations; mobile uses cards and single-tap actions
- Web hero cards overlap dark navy header bands (floating card aesthetic)
- Hover states, tooltips, keyboard shortcuts are web patterns
- Admin desktop posture: seated, keyboard+mouse, focused work sessions

### Voice and Copy (from Section 6)
- **Encouraging, never patronizing.** "Welcome to the Den, Coach" not "Hello! Let's get started!"
- **Action-oriented empty states.** "The court is quiet. Add your first practice to get things moving!" not "No data found."
- **The cub mascot NEVER appears on:** billing pages, admin data tables, error logs, payment failure states
- **The cub mascot appears on:** onboarding, empty states, achievement unlocks, loading screens

### Team Colors / White-Label (from Section 8)
- Team colors appear on: hero cards, player profiles, roster cards, schedule widgets, achievement badge rings, nav headers
- Team colors NEVER appear on: system navigation, error states, global typography, Lynx core branding
- The coach card team assignment pills correctly use team color — this is fine and on-brand

### Read Every File Before Modifying It
This is non-negotiable. The codebase has specific patterns, existing theme utilities (`useTheme`, `useThemeClasses`), and token conventions. CC must read each target file fully before making changes to ensure consistency.

---

## Execution Order

1. **Phase 1A-1D** — Sidebar nav restructure + page renames (safest, no new features)
2. **Phase 2A-2E** — Team Management action expansion (high impact, straightforward)
3. **Phase 3A** — Coach card complete redesign (high visual impact, single component swap)
4. **Phase 3B-3F** — Coach page-level actions + modals (Export, Email All, Invite)
5. **Phase 5A-5B** — Team detail panel (completes the team management story)
6. **Phase 4A-4C** — Staff & Volunteers (new feature, requires DB migration)

---

## Testing Checklist

After each phase:
- [ ] All sidebar nav items navigate to the correct page
- [ ] Active page highlighting works for all items
- [ ] No console errors on any page
- [ ] All new modals open, close, and save correctly
- [ ] Toast notifications fire on success/error
- [ ] Dark mode and light mode both render correctly
- [ ] Page titles in browser tab match new names
- [ ] Breadcrumbs are correct on all renamed pages
- [ ] Season filter still works on Teams and Coaches pages
- [ ] Existing functionality (create team, add coach, delete, etc.) still works
