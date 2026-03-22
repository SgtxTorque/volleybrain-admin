# CC-SIDEBAR-POLISH-AND-TEAMHUB.md
# Sidebar Visual Polish + Admin Team Hub Access
# March 9, 2026

## ⚠️ MANDATORY RULES

1. **Read every file fully** before modifying.
2. **DO NOT touch any page content, dashboard logic, or auth flow.**
3. **Only modify the files listed below.** Nothing else.
4. **Match existing patterns** — same Tailwind classes, same component structure.

---

## PART A: Sidebar Visual Polish

### File: `src/components/layout/LynxSidebar.jsx`

Read the entire file before making any changes. All fixes below are in this one file.

### Fix 1: Replace paw logo with Lynx brand icon

**Current (line ~42-50):** The `LynxPaw` SVG component renders a generic paw icon.

**Fix:** Replace the paw SVG with the actual Lynx icon logo image. In the Logo Row section (line ~189):

Replace:
```jsx
<LynxPaw className="w-7 h-7 text-lynx-sky" />
```
With:
```jsx
<img src="/images/lynx-icon-logo.png" alt="Lynx" className="w-8 h-8" />
```

Also replace the "Lynx" text span to use the full logo image instead:
```jsx
<img 
  src="/images/lynx-logo.png" 
  alt="Lynx" 
  className="h-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
/>
```

Make sure `lynx-icon-logo.png` and `lynx-logo.png` exist in `public/images/`. If they're in a different location, check `public/` and `public/assets/` and use the correct path.

Delete the `LynxPaw` function component entirely — it's no longer needed.

### Fix 2: Sidebar text hierarchy — headers larger, menu items much lighter

**Current:** Menu items use `text-slate-400` and section headers use `text-slate-500`. Both are muddy blue-on-blue.

**Fix in NavItem (line ~62) — menu item labels need to be significantly lighter:**

Change:
```
text-slate-400 hover:text-slate-200
```
To:
```
text-slate-200 hover:text-white
```

**Fix in CollapsibleGroupHeader (line ~96) — section headers keep their color but bump up one text size:**

Keep the color classes the same:
```
text-slate-500 hover:text-slate-300
```

But change the header label `<span>` (inside CollapsibleGroupHeader) from:
```
text-r-xs font-bold uppercase tracking-wider
```
To:
```
text-r-sm font-bold uppercase tracking-wider
```

This makes section headers visually larger (`text-r-xs` → `text-r-sm`) while keeping their muted category-label color. Menu items below them are now `slate-200` — bright and clearly readable against navy.

### Fix 3: Show profile photo in sidebar

**Current (line ~208-215):** The avatar section already handles `profile?.photo_url` — it shows the image if available, falls back to initial. This is actually already implemented correctly.

**Verify:** Check that `profile.photo_url` or `profile.avatar_url` is being passed from `MainApp.jsx`. If the prop is `photo_url` but the profile object has `avatar_url`, fix the reference. Grep the profile object shape in AuthContext to confirm the correct field name.

### Fix 4: Widen sidebar by 10px on hover

**Current (line ~183):**
```
w-16 hover:w-56 xl:hover:w-60
```

**Change to:**
```
w-16 hover:w-60 xl:hover:w-64
```

This adds ~16px (4 Tailwind units = 1rem) to the expanded width.

### Fix 5: Move Dark Mode toggle under role pills

**Current:** Dark mode toggle is in the bottom utility section (line ~340+).

**Move it:** After the role pills section (line ~227, after the `availableViews` mapping closes), add the dark mode toggle:

```jsx
{/* Dark mode toggle — under role pills */}
<button
  onClick={() => onToggleTheme?.()}
  className="flex items-center gap-2 px-2 py-1.5 mt-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors opacity-0 group-hover:opacity-100 transition-opacity duration-200"
>
  {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
  <span className="text-r-xs font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
</button>
```

Then **remove** the dark mode toggle from the bottom utility section (the `onToggleTheme` button in both the expanded and collapsed footer sections). Keep the Sign Out button in the footer.

### Fix 6: Collapse all menu sections by default, auto-expand only active

**Current (line ~155-165):** `expandedGroups` initializes by scanning for the active page and pre-expanding its group. But groups that were previously manually expanded stay open.

**Change the initialization** to start with ALL groups collapsed, then only expand the one containing the active page:

Replace the `useState` initializer:
```jsx
const [expandedGroups, setExpandedGroups] = useState(() => {
  const initialSet = new Set()
  for (const group of navGroups) {
    if (group.type !== 'single' && group.items) {
      if (group.items.some(item => {
        if (item.teamId) return directTeamWallId === item.teamId
        if (item.playerId) return activePage === `player-${item.playerId}`
        return activePage === item.id
      })) initialSet.add(group.id)
    }
  }
  return initialSet
})
```

This is actually already correct — it only expands the group containing the active item. But the `useEffect` on line ~168 ADDS groups without removing old ones. Fix the `useEffect` to **replace** expanded groups instead of adding:

```jsx
useEffect(() => {
  const activeGroup = new Set()
  for (const group of navGroups) {
    if (group.type !== 'single' && group.items) {
      const hasActive = group.items.some(item => {
        if (item.teamId) return directTeamWallId === item.teamId
        if (item.playerId) return activePage === `player-${item.playerId}`
        return activePage === item.id
      })
      if (hasActive) activeGroup.add(group.id)
    }
  }
  setExpandedGroups(activeGroup)
}, [activePage, directTeamWallId])
```

This ensures only the section containing the current page is expanded. User can still manually toggle others, but navigating to a new page resets to just that section.

---

## PART B: Admin Team Hub Quick Access

### Problem
Admins currently reach Team Hub by: Sidebar → People → Teams & Rosters → click a team → View Team Hub. That's 3-4 clicks. Admins need a direct path.

### Solution
Add a "Team Hubs" item to the admin sidebar under the People section that navigates to a Team Hub selector page.

### Step 1: Add nav item in `src/MainApp.jsx`

In the `adminNavGroups` array (line ~970), in the `people` group items, add after `coaches`:

```js
{ id: 'team-hubs', label: 'Team Hubs', icon: 'teamwall' },
```

So the people section becomes:
```js
{ id: 'people', label: 'People', type: 'group', icon: 'users', items: [
  { id: 'teams', label: 'Teams & Rosters', icon: 'users' },
  { id: 'coaches', label: 'Coaches', icon: 'user-cog' },
  { id: 'team-hubs', label: 'Team Hubs', icon: 'teamwall' },
]},
```

### Step 2: Add route in `src/MainApp.jsx`

After the existing team wall route (line ~783), add:
```jsx
<Route path="/team-hubs" element={
  <RouteGuard allow={['admin']} activeView={activeView}>
    <TeamHubSelectorPage showToast={showToast} navigateToTeamWall={navigateToTeamWall} />
  </RouteGuard>
} />
```

Add to imports at the top:
```jsx
import TeamHubSelectorPage from './pages/teams/TeamHubSelectorPage'
```

Add path mapping in `getPathForPage`:
```js
case 'team-hubs': return '/team-hubs'
```

### Step 3: Create `src/pages/teams/TeamHubSelectorPage.jsx`

Build a page that shows all teams as cards with quick metrics. The admin can click any team to go directly to its Team Hub.

```jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { Search, Users, MessageCircle, Image, Trophy, Star, ChevronRight } from '../../constants/icons'
import PageShell from '../../components/pages/PageShell'

export default function TeamHubSelectorPage({ showToast, navigateToTeamWall }) {
  const { organization } = useAuth()
  const { workingSeason } = useSeason()
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadTeams()
  }, [organization?.id, workingSeason?.id])

  async function loadTeams() {
    if (!organization?.id) return
    setLoading(true)
    try {
      // Get teams with player counts
      const query = supabase
        .from('teams')
        .select(`
          id, name, color, logo_url, season_id,
          team_players(count),
          team_coaches:team_staff(count)
        `)
        .eq('organization_id', organization.id)
        .order('name')

      if (workingSeason?.id) {
        query.eq('season_id', workingSeason.id)
      }

      const { data, error } = await query
      if (error) throw error

      // Get post counts and recent activity per team
      const teamIds = (data || []).map(t => t.id)
      let postCounts = {}
      let shoutoutCounts = {}
      
      if (teamIds.length > 0) {
        const { data: posts } = await supabase
          .from('team_posts')
          .select('team_id')
          .in('team_id', teamIds)
          .eq('is_published', true)
        
        ;(posts || []).forEach(p => {
          postCounts[p.team_id] = (postCounts[p.team_id] || 0) + 1
        })

        const { data: shoutouts } = await supabase
          .from('shoutouts')
          .select('team_id')
          .in('team_id', teamIds)
        
        ;(shoutouts || []).forEach(s => {
          shoutoutCounts[s.team_id] = (shoutoutCounts[s.team_id] || 0) + 1
        })
      }

      const enriched = (data || []).map(team => ({
        ...team,
        playerCount: team.team_players?.[0]?.count || 0,
        coachCount: team.team_coaches?.[0]?.count || 0,
        postCount: postCounts[team.id] || 0,
        shoutoutCount: shoutoutCounts[team.id] || 0,
      }))

      setTeams(enriched)
    } catch (err) {
      console.error('Load teams error:', err)
    }
    setLoading(false)
  }

  const filtered = teams.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  // Org-wide totals
  const totals = {
    players: teams.reduce((s, t) => s + t.playerCount, 0),
    posts: teams.reduce((s, t) => s + t.postCount, 0),
    shoutouts: teams.reduce((s, t) => s + t.shoutoutCount, 0),
  }

  return (
    <PageShell
      title="Team Hubs"
      subtitle="Jump into any team's hub — posts, photos, shoutouts, and more"
      breadcrumb="People › Team Hubs"
    >
      {/* Org-wide metrics strip */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Players', value: totals.players, icon: Users, color: 'text-lynx-sky' },
          { label: 'Wall Posts', value: totals.posts, icon: MessageCircle, color: 'text-emerald-400' },
          { label: 'Shoutouts', value: totals.shoutouts, icon: Star, color: 'text-amber-400' },
        ].map(stat => (
          <div key={stat.label} className={`${tc.cardBg} ${tc.border} border rounded-[14px] p-4 flex items-center gap-3`}>
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
            <div>
              <p className={`text-xl font-bold ${tc.text}`}>{stat.value}</p>
              <p className={`text-r-xs ${tc.textMuted}`}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${tc.textMuted}`} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search teams..."
          className={`w-full ${tc.input} rounded-[14px] pl-11 pr-4 py-3 text-sm`}
        />
      </div>

      {/* Team Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-lynx-sky border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className={`${tc.textMuted} text-lg`}>{search ? 'No teams match your search' : 'No teams yet'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(team => (
            <button
              key={team.id}
              onClick={() => navigateToTeamWall?.(team.id)}
              className={`${tc.cardBg} ${tc.border} border rounded-[14px] p-5 text-left hover:shadow-lg transition-all group/card`}
            >
              <div className="flex items-center gap-3 mb-3">
                {/* Team color dot or logo */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: team.color || '#4BB9EC' }}
                >
                  {team.logo_url ? (
                    <img src={team.logo_url} alt="" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    team.name.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold ${tc.text} truncate`}>{team.name}</h3>
                  <p className={`text-r-xs ${tc.textMuted}`}>
                    {team.playerCount} player{team.playerCount !== 1 ? 's' : ''} · {team.coachCount} coach{team.coachCount !== 1 ? 'es' : ''}
                  </p>
                </div>
                <ChevronRight className={`w-4 h-4 ${tc.textMuted} group-hover/card:text-lynx-sky transition-colors`} />
              </div>
              
              {/* Mini metrics row */}
              <div className="flex items-center gap-4 text-r-xs">
                <span className={`flex items-center gap-1 ${tc.textMuted}`}>
                  <MessageCircle className="w-3 h-3" /> {team.postCount} posts
                </span>
                <span className={`flex items-center gap-1 ${tc.textMuted}`}>
                  <Star className="w-3 h-3" /> {team.shoutoutCount} shoutouts
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </PageShell>
  )
}
```

### Step 4: Add empty state mascot on dashboard

In `src/pages/dashboard/DashboardPage.jsx`, find the main render area where widgets display. If stats show zero teams/zero players/zero events (brand new org), show an empty state with the laptop mascot:

Find or add a condition near the top of the widget rendering:
```jsx
{stats.totalTeams === 0 && !loading && (
  <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
    <img src="/images/laptoplynx.png" alt="Lynx" className="w-32 h-32 mb-6 opacity-80" />
    <h3 className={`text-xl font-bold ${tc.text} mb-2`}>Your dashboard is waiting!</h3>
    <p className={`${tc.textMuted} max-w-md mb-6`}>
      Start by setting up your season, creating teams, and opening registration. Your dashboard will come alive as data flows in.
    </p>
    <button
      onClick={() => onNavigate?.('seasons')}
      className="bg-lynx-sky text-white font-bold px-6 py-3 rounded-xl hover:brightness-110 transition"
    >
      Set Up Your First Season →
    </button>
  </div>
)}
```

Make sure `laptoplynx.png` exists in `public/images/`.

---

## ASSET REQUIREMENTS

**CRITICAL — PNG TRANSPARENCY:** All mascot and logo PNG files have transparent backgrounds. Do NOT add any background color, background div, dark container, or backdrop behind them. No `bg-` class on image wrappers. No dark cards behind mascot images. The images are designed to sit directly on whatever surface they're placed on — light or dark. If you put a black or navy rectangle behind them, it will look broken.

Verify these files exist in `public/images/` (or create the directory):
- `lynx-icon-logo.png` — the navy/sky blue lynx head icon (transparent bg)
- `lynx-logo.png` — horizontal logo with "lynx" wordmark (transparent bg)
- `laptoplynx.png` — lynx cub sitting with laptop (transparent bg)

When using these in `<img>` tags, do NOT wrap them in colored containers:
```jsx
// ✅ CORRECT — image sits directly on page surface
<img src="/images/laptoplynx.png" alt="Lynx" className="w-32 h-32" />

// ❌ WRONG — adds a dark background behind the transparent PNG
<div className="bg-slate-900 rounded-xl p-4">
  <img src="/images/laptoplynx.png" alt="Lynx" className="w-32 h-32" />
</div>
```

If images are in a different directory (e.g., `public/assets/`), adjust paths accordingly. Check existing image paths in the codebase: `grep -rn "public/images\|/images/\|/assets/" src/ | head -10`

---

## FILES CREATED/MODIFIED

| File | Action |
|------|--------|
| `src/components/layout/LynxSidebar.jsx` | MODIFY — logo, text colors, width, dark mode position, collapse behavior |
| `src/MainApp.jsx` | MODIFY — add team-hubs nav item, route, and path mapping |
| `src/pages/teams/TeamHubSelectorPage.jsx` | CREATE — team hub selector with search and metrics |
| `src/pages/dashboard/DashboardPage.jsx` | MODIFY — add empty state with mascot for new orgs |
| `public/images/` | VERIFY — ensure mascot/logo assets exist |

## DO NOT CHANGE

- `AuthContext.jsx`
- `LoginPage.jsx` / `LandingPage.jsx`
- Any other page content or logic
- Dashboard widget rendering (only add the empty state guard)

---

## VERIFICATION CHECKLIST

| # | Check | Status |
|---|-------|--------|
| 1 | Sidebar shows Lynx icon logo (not paw) when collapsed | |
| 2 | Sidebar shows Lynx wordmark logo when expanded | |
| 3 | Menu text is lighter and readable on navy | |
| 4 | Profile photo shows if available | |
| 5 | Sidebar is slightly wider on hover | |
| 6 | Dark mode toggle is under role pills | |
| 7 | Dark mode toggle removed from footer | |
| 8 | Only active section is expanded, others collapsed | |
| 9 | "Team Hubs" appears in People section (admin only) | |
| 10 | Team Hubs page loads with team cards and search | |
| 11 | Clicking a team card goes to that team's wall | |
| 12 | Org metrics show at top of Team Hubs page | |
| 13 | Empty dashboard shows laptop mascot + CTA for new orgs | |
| 14 | No existing features broken | |
