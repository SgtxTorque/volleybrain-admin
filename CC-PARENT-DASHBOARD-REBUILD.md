# CC-PARENT-DASHBOARD-REBUILD.md
## Parent Dashboard — Clean Rebuild

**IMPORTANT:** This is a REBUILD, not a patch. We are replacing ParentDashboard.jsx with a clean, well-structured version.

---

## STEP 0: SAFETY CHECKPOINT

Before making ANY changes, run:
```bash
git add -A && git commit -m "Pre-rebuild checkpoint - parent dashboard v1"
```
This creates a restore point. If anything breaks badly, we can revert with:
```bash
git checkout HEAD -- src/pages/roles/ParentDashboard.jsx src/components/parent/
```

---

## STEP 1: READ THE SCHEMA FIRST

**Before writing ANY Supabase query, read DATABASE_SCHEMA.md cover to cover.**

Then answer these questions by checking the actual schema (NOT guessing):

1. What is the `player_badges` table structure? What column is used for ordering? (It's NOT `earned_at` — check the actual column names)
2. What is the `waivers` table structure? What columns exist? (It's NOT `title` — check actual column names. Other files use `waiver.name`)
3. What is the `event_rsvps` table structure? What is the foreign key to the user? (It's NOT `user_id` — schema says `responded_by`)
4. Does a `user_dashboard_layouts` table exist? (NO — do not query it)
5. Does a `games` table exist? What is the actual table name for game/match data?
6. Does a `player_season_stats` table exist? What are its actual columns?
7. Does a `team_standings` table exist? What are its actual columns?

**Write down the answers. Use ONLY real column names in all queries.**

If a table does not exist, do NOT create a query for it. Use placeholder/mock data with a `// TODO: Wire to Supabase when table exists` comment.

---

## STEP 2: CREATE CHILD COMPONENT FILES

Create a folder: `src/components/parent/`

Create these files:
- `src/components/parent/ParentLeftSidebar.jsx`
- `src/components/parent/ParentHeroCard.jsx`
- `src/components/parent/ParentCenterDashboard.jsx`
- `src/components/parent/ParentRightPanel.jsx`
- `src/components/parent/ParentEventCard.jsx`

Each component is small, focused, and testable.

---

## STEP 3: REBUILD ParentDashboard.jsx AS A THIN SHELL

The main file should be ~150-200 lines MAX. It:
1. Declares ALL hooks at the top (no conditional hooks, no hooks after returns)
2. Fetches the core data (parent's children, teams)
3. Manages `selectedPlayerTeam` state
4. Passes data down to child components as props
5. Renders the 3-column layout

```jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
// ... other existing context imports that are currently used

import ParentLeftSidebar from '../../components/parent/ParentLeftSidebar';
import ParentHeroCard from '../../components/parent/ParentHeroCard';
import ParentCenterDashboard from '../../components/parent/ParentCenterDashboard';
import ParentRightPanel from '../../components/parent/ParentRightPanel';

const ParentDashboard = () => {
  // ============================================
  // ALL HOOKS MUST BE HERE — BEFORE ANY RETURNS
  // ============================================
  
  // Contexts (keep all existing useContext calls)
  const { user, profile } = useAuth();
  const { isDark } = useTheme();
  // ... keep other context hooks that exist in the current file
  
  // Core state
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);        // parent's registered children
  const [playerTeams, setPlayerTeams] = useState([]);   // child+team combos
  const [selectedPlayerTeam, setSelectedPlayerTeam] = useState(null);
  const [orgData, setOrgData] = useState(null);
  
  // ============================================
  // ALL useEffect hooks here
  // ============================================
  
  // Fetch parent's children and their team memberships
  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      if (!user?.id) return;
      try {
        // Query parent's children + team memberships
        // USE ACTUAL COLUMN NAMES FROM DATABASE_SCHEMA.md
        // Build playerTeams array: each entry = { playerId, playerName, playerPhoto, teamId, teamName, seasonId, sportName, ... }
        
        // ... actual queries here ...
        
        if (!cancelled) {
          setPlayerTeams(results);
          if (results.length > 0 && !selectedPlayerTeam) {
            setSelectedPlayerTeam(results[0]);
          }
          setLoading(false);
        }
      } catch (err) {
        console.warn('ParentDashboard data load error:', err);
        if (!cancelled) setLoading(false);
      }
    };
    loadData();
    return () => { cancelled = true; };
  }, [user?.id]); // MINIMAL dependencies — do NOT include selectedPlayerTeam
  
  // ============================================
  // Computed values (useMemo) — all here, never conditional
  // ============================================
  const parentName = useMemo(() => profile?.first_name || 'there', [profile]);
  const playerCount = useMemo(() => {
    const unique = new Set(playerTeams.map(pt => pt.playerId));
    return unique.size;
  }, [playerTeams]);
  
  // ============================================
  // Handlers
  // ============================================
  const handleSelectPlayerTeam = useCallback((pt) => {
    setSelectedPlayerTeam(pt);
  }, []);
  
  // ============================================
  // CONDITIONAL RETURNS — only AFTER all hooks
  // ============================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-slate-400">Loading dashboard...</div>
      </div>
    );
  }
  
  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="flex w-full min-h-[calc(100vh-4rem)] bg-slate-50">
      {/* Left Sidebar — 280px */}
      <aside className="w-[280px] shrink-0 border-r border-slate-100 bg-white overflow-y-auto h-[calc(100vh-4rem)] sticky top-16">
        <ParentLeftSidebar
          orgData={orgData}
          parentName={parentName}
          parentAvatar={profile?.avatar_url}
          playerCount={playerCount}
          playerTeams={playerTeams}
          userId={user?.id}
          orgId={profile?.organization_id}
        />
      </aside>
      
      {/* Center Dashboard — flex */}
      <main className="flex-1 overflow-y-auto p-6">
        <ParentCenterDashboard
          parentName={parentName}
          playerTeams={playerTeams}
          selectedPlayerTeam={selectedPlayerTeam}
          onSelectPlayerTeam={handleSelectPlayerTeam}
          playerCount={playerCount}
        />
      </main>
      
      {/* Right Panel — 300px */}
      <aside className="w-[300px] shrink-0 border-l border-slate-100 bg-white overflow-y-auto h-[calc(100vh-4rem)] sticky top-16">
        <ParentRightPanel
          selectedPlayerTeam={selectedPlayerTeam}
        />
      </aside>
    </div>
  );
};

export default ParentDashboard;
```

**KEY RULES:**
- ALL hooks at the top, ZERO hooks after any `if`/`return`
- Shell is thin — data fetching for sub-sections happens in child components
- Child components receive what they need via props
- Each child component handles its OWN Supabase queries with proper error handling

---

## STEP 4: BUILD ParentHeroCard.jsx

This is the component that keeps breaking. Build it clean.

```
src/components/parent/ParentHeroCard.jsx
```

**Props:** `{ selectedPlayerTeam, playerTeams, onSelectPlayerTeam }`

**Structure:**
- Outer card: `min-h-[420px]`, `bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden`
- Layout: `flex` — photo on left (280px), info on right (flex-1)
- Photo: `absolute inset-0 w-full h-full object-cover object-top` inside a `relative w-[280px] shrink-0` container
- Player name overlay at bottom of photo with gradient
- Right side stacks: team info, status badges, quick actions WITH labels, What's Next, Gallery placeholder, Showcased Badge placeholder

**Mini player carousel** (below hero card, only if playerTeams.length > 1):
- Horizontal flex row with `overflow-x-auto`
- Each mini card: player thumbnail (48px circle), name, team, notification dot if action needed
- Selected card has ring/highlight

**NO HOOKS inside this component that depend on changing data in a way that could loop.** If it needs data beyond what's passed as props, fetch it with a SINGLE useEffect with a cancelled flag and proper guards.

```jsx
const ParentHeroCard = ({ selectedPlayerTeam, playerTeams, onSelectPlayerTeam }) => {
  if (!selectedPlayerTeam) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm min-h-[420px] flex items-center justify-center text-slate-400">
        No players registered yet
      </div>
    );
  }
  
  const { playerName, playerPhoto, teamName, seasonName, jerseyNumber, sportName } = selectedPlayerTeam;
  
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex min-h-[420px]">
        {/* Player Photo — left side, full height */}
        <div className="w-[280px] shrink-0 relative bg-slate-200">
          {playerPhoto ? (
            <img 
              src={playerPhoto} 
              alt={playerName}
              className="absolute inset-0 w-full h-full object-cover object-top"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-6xl">
              👤
            </div>
          )}
          {/* Name overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <div className="text-white font-bold text-xl">{playerName}</div>
            {jerseyNumber && <div className="text-white/80 text-sm">#{jerseyNumber}</div>}
            <span className="inline-block mt-1 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
              ● Active
            </span>
          </div>
        </div>
        
        {/* Info — right side */}
        <div className="flex-1 p-6 flex flex-col gap-5">
          {/* Team info + badges */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-900">{teamName}</span>
              </div>
              <div className="text-sm text-slate-500">{seasonName} · {sportName}</div>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-200">● Active</span>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-200">Paid Up</span>
            </div>
          </div>
          
          {/* Quick action icons WITH labels */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: '🪪', label: 'Player Card' },
              { icon: '👥', label: 'Team Hub' },
              { icon: '👤', label: 'Profile' },
              { icon: '🏆', label: 'Achievements' },
            ].map(action => (
              <button key={action.label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <span className="text-xl">{action.icon}</span>
                <span className="text-[11px] font-medium text-slate-600">{action.label}</span>
              </button>
            ))}
          </div>
          
          {/* What's Next */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">What's Next</div>
            <div className="flex gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-700">
                🏐 Next event info here
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-700">
                📅 X upcoming events
              </div>
            </div>
          </div>
          
          {/* Gallery placeholder */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Gallery</div>
            <div className="flex gap-2">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-slate-300">
                  📷
                </div>
              ))}
            </div>
            {/* TODO: Wire to player photos/videos from Supabase */}
          </div>
          
          {/* Showcased Badge placeholder */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Featured Badge</div>
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
              <span className="text-3xl">🏅</span>
              <div>
                <div className="text-sm font-semibold text-slate-900">No badge showcased yet</div>
                <div className="text-xs text-slate-500">Earn badges through gameplay</div>
              </div>
            </div>
            {/* TODO: Wire to player's featured/showcased badge */}
          </div>
        </div>
      </div>
      
      {/* Mini player carousel — only if multiple player+team combos */}
      {playerTeams.length > 1 && (
        <div className="border-t border-slate-100 p-3">
          <div className="flex gap-3 overflow-x-auto">
            {playerTeams.map((pt) => (
              <button
                key={`${pt.playerId}-${pt.teamId}`}
                onClick={() => onSelectPlayerTeam(pt)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl shrink-0 transition-all ${
                  selectedPlayerTeam?.playerId === pt.playerId && selectedPlayerTeam?.teamId === pt.teamId
                    ? 'bg-brand/10 ring-2 ring-brand'
                    : 'bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <img src={pt.playerPhoto || '/default-avatar.png'} className="w-10 h-10 rounded-full object-cover" alt="" />
                <div className="text-left">
                  <div className="text-sm font-semibold text-slate-900">{pt.playerName}</div>
                  <div className="text-xs text-slate-500">{pt.teamName}</div>
                </div>
                {pt.hasNotification && (
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentHeroCard;
```

---

## STEP 5: BUILD ParentLeftSidebar.jsx

**Props:** `{ orgData, parentName, parentAvatar, playerCount, playerTeams, userId, orgId }`

This component handles its OWN data fetching for:
- Payment status (query with proper error handling)
- Needs attention items (query with proper error handling)  
- Badge progress (query with proper error handling)

**Stacks vertically:**
1. Org logo + name + tagline
2. Parent name + avatar
3. Stat badges row (Players, Seasons, Teams)
4. Payment Status card
5. Needs Attention card
6. Quick Actions 2×2 grid
7. Badge Progress

**Every query in this component:**
- Uses ONLY column names verified from DATABASE_SCHEMA.md
- Has a `cancelled` flag
- Has try/catch
- Falls back to empty/default state on error
- Does NOT retry on failure

---

## STEP 6: BUILD ParentRightPanel.jsx

**Props:** `{ selectedPlayerTeam }`

This component handles its OWN data fetching for the selected player/team:
- Upcoming events
- Season record
- Achievements
- Leaderboard
- Player stats

**All data re-fetches when `selectedPlayerTeam` changes:**

```jsx
useEffect(() => {
  let cancelled = false;
  if (!selectedPlayerTeam?.teamId) return;
  
  const loadContextData = async () => {
    // Fetch all right panel data for this team/player
    // USE ONLY REAL COLUMN NAMES
    // On any error: console.warn and set empty state
  };
  
  loadContextData();
  return () => { cancelled = true; };
}, [selectedPlayerTeam?.teamId, selectedPlayerTeam?.playerId]);
```

**Includes ParentEventCard components** for the upcoming events with background images:
- `/images/volleyball-game.jpg` for game events
- `/images/volleyball-practice.jpg` for practice events

---

## STEP 7: BUILD ParentCenterDashboard.jsx

**Props:** `{ parentName, playerTeams, selectedPlayerTeam, onSelectPlayerTeam, playerCount }`

**Contains:**
1. Welcome greeting: "Welcome back, {parentName} 👋"
2. `<ParentHeroCard />` 
3. Team Hub + Chat preview cards (side by side)
4. Upcoming Schedule
5. Team Standings + Player Stats (side by side)
6. Invite banner

This component can fetch Team Hub posts and Chat messages for the selected team.

---

## STEP 8: PRESERVE EXISTING FUNCTIONALITY

Before the rebuild, CC should scan the CURRENT ParentDashboard.jsx and note:
- All navigation handlers (what happens when you click Player Card, Team Hub, etc.)
- All modal/dialog triggers
- Any context values being consumed (tutorial, season, sport, org branding, etc.)
- The PriorityCardsEngine import and usage

These must all be preserved in the rebuild. The PriorityCardsEngine.jsx also has bad column names (waivers.title → waivers.name, event_rsvps.user_id → event_rsvps.responded_by) — fix those too.

---

## QUERY RULES (NON-NEGOTIABLE)

1. **READ DATABASE_SCHEMA.md FIRST** for every single table you query
2. **NEVER guess column names** — if unsure, check the schema or use `select('*')` temporarily
3. **EVERY query gets:**
   ```jsx
   let cancelled = false;
   try {
     const { data, error } = await supabase.from('table').select('...');
     if (cancelled) return;
     if (error) {
       console.warn('descriptive message:', error.message);
       setStateVar([]); // empty default
       return;
     }
     setStateVar(data || []);
   } catch (err) {
     if (!cancelled) setStateVar([]);
   }
   // cleanup: return () => { cancelled = true; };
   ```
4. **NEVER put result state in useEffect dependencies**
5. **If a table doesn't exist** — use mock data with a TODO comment, don't query it

---

## VERIFICATION CHECKLIST

After rebuild:
- [ ] `git diff --stat` shows the changes clearly
- [ ] `npm run build` passes with no errors
- [ ] Page loads without crash
- [ ] Console has ZERO "Rendered more hooks" errors
- [ ] Console has no rapidly repeating errors
- [ ] 3-column layout is edge-to-edge
- [ ] Left sidebar touches nav bar (no gap)
- [ ] Right sidebar touches nav bar (no gap)
- [ ] Column dividers are subtle 1px light lines
- [ ] Hero card is ~420px tall with full player photo
- [ ] Quick action icons have text labels
- [ ] Welcome message shows at top of center column
- [ ] Upcoming events have background images (game/practice)
- [ ] Resize browser — no crash, no disappearing content
- [ ] Move between monitors — stable
