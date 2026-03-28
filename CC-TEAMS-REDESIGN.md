# CC-TEAMS-REDESIGN.md
# Teams Page Redesign — Command Table + Data Matrix Fusion

## READ FIRST
1. `CC-SPEC-GUARDRAILS.md`
2. `CLAUDE.md`
3. `src/styles/v2-tokens.css`
4. `src/pages/teams/TeamsPage.jsx` (560 lines)
5. `src/pages/teams/TeamsTableView.jsx` (309 lines)
6. `src/pages/teams/TeamsStatRow.jsx` (102 lines)
7. `src/pages/teams/TeamDetailPanel.jsx` (353 lines)
8. All team modals in `src/pages/teams/`

## SCOPE
Redesign the Teams page from a flat table into a 2-column command layout with an inline detail panel, attention alert pills, sport-grouped rows, roster fill bars, health indices, and a bottom stats strip.

**Design fusion:**
- **From Concept 3 (Command Table):** 2-column layout with team table on the left and "Active Detail" panel on the right when a team is selected. Sport-grouped rows (section headers like "ELITE TRAVEL · VOLLEYBALL"). Selected row gets a blue highlight with checkbox. Alert pills across the top ("4 teams need coaches", "7 unrostered players"). Bulk action bar when teams selected.
- **From Concept 7 (Data Matrix):** Clean data-dense table with Roster Fill progress bars, Health Index scores with trend arrows, alert status badges (CLEAR / MISSING / CRITICAL), coach avatar stacks, filter pills with counts. Bottom footer with org-wide stats (Total Players, Registration Rate, Club Health). Unrostered Queue strip at the very bottom.

**What changes:** Layout structure, table styling, detail panel integration, stat presentation, filter treatment.
**What stays:** All data loading, all modals, all CRUD operations, team wall navigation, export, search, all existing functionality.

---

## ELEMENT PRESERVATION CONTRACT

**Every element below MUST survive. MOVED and RESTYLED is fine. REMOVED is not.**

### Action Buttons:
- **Export** (`exportToCSV`) — CSV export
- **+ New Team** (`setShowNewTeamModal`) — opens NewTeamModal

### Filters & Search:
- **Season/Sport filter bar** (SeasonFilterBar)
- **Search** (`search` / `setSearch`)
- **Age group filter** (`selectedAgeGroup` / `setSelectedAgeGroup`)

### Table Interactions Per Team Row:
- **Click row → view detail** (`onViewTeamDetail`) — opens TeamDetailPanel
- **View Wall link** (`onNavigateToWall`) — navigates to team wall
- **3-dot menu** with: View Wall, Edit Team, Manage Roster, Assign Coaches, Toggle Roster Open/Closed, Delete
- **Edit team** → EditTeamModal (`editingTeam`)
- **Manage roster** → ManageRosterModal (`rosterTeam`)
- **Assign coaches** → AssignCoachesModal (`assigningCoachesTeam`)
- **Delete team** (`deleteTeam`)
- **Toggle roster open/closed** (`toggleRosterOpen`)

### Table Columns (all must remain visible):
- Team name (with color dot + age/division), Coach assignment, Roster fill (X/Y + bar), Health %, Type (Recreational/Competitive), Status (Open/Full/Closed), Wall link

### Stat Cards:
- Total Teams, Rostered Players, Open Spots, Avg Team Health

### Alerts:
- **UnrosteredAlert** component — shows count of unrostered approved players

### Modals (DO NOT TOUCH render blocks):
1. `NewTeamModal` — create new team
2. `EditTeamModal` — edit team details
3. `ManageRosterModal` — add/remove players from roster
4. `AssignCoachesModal` — assign coaches to team
5. `TeamDetailPanel` — slideout detail panel (KEEP but restyle as inline right column)

### Data Functions (DO NOT MODIFY):
- `loadTeams()`, `loadPlayers()`, `loadRegistrations()` — Supabase reads
- `handleCreateTeam()` — insert
- `deleteTeam()` — delete
- `toggleRosterOpen()` — update
- `exportToCSV()` — CSV export
- All health calculation logic, roster counting, filter logic

---

## PHASE 1: Restructure TeamsPage Layout — 2-Column + Alert Pills + Footer Stats

**File:** `src/pages/teams/TeamsPage.jsx`
**Edit contract:** Restructure layout. Move elements around. Do not change data loading or function logic.

### New Layout:
```
┌───────────────────────────────────────────────────────────────────┐
│  Header: "Team Management" + subtitle + [Export] [+ New Team]     │
│  SeasonFilterBar                                                  │
├───────────────────────────────────────────────────────────────────┤
│  Alert Pills Row (conditional):                                   │
│  [🔴 4 teams need coaches] [👥 7 unrostered players] [⚠ 2 over cap] │
├───────────────────────────────────────────────────────────────────┤
│  Quick Filters: [All Teams ●] [Volleyball] [Basketball] [Soccer]  │
│  + Search + Age Group filter + [Bulk actions when selected]       │
├────────────────────────────────────────────┬──────────────────────┤
│  TEAM TABLE (flex-1)                       │ TEAM DETAIL (~360px) │
│                                            │ (shows when team     │
│  Sport section headers                     │  row is selected)    │
│  Team rows with fill bars + health         │                      │
│  Selected row = sky-blue highlight         │ Team name + division │
│                                            │ Alert card if needed │
│                                            │ Health + Missing stats│
│                                            │ Full Roster list     │
│                                            │ Recent Activity      │
│                                            │ Action buttons       │
├────────────────────────────────────────────┴──────────────────────┤
│  FOOTER STATS BAR:                                                │
│  Total Players: X | Registration Rate: X% | Club Health: [score]  │
│  [Unrostered Queue: X athletes pending] [player avatars] [Manage] │
└───────────────────────────────────────────────────────────────────┘
```

### A. Alert pills row (from Command Table):
Conditional colored pills that surface urgent issues:
```jsx
const alerts = [
  teamsNeedingCoaches > 0 && { label: `${teamsNeedingCoaches} teams need coaches`, color: 'red', icon: '🔴' },
  unrosteredCount > 0 && { label: `${unrosteredCount} unrostered players`, color: 'amber', icon: '👥' },
  teamsOverCap > 0 && { label: `${teamsOverCap} teams over cap`, color: 'amber', icon: '⚠' },
].filter(Boolean)
```
Render as horizontal pill badges. These REPLACE the current UnrosteredAlert banner (same data, better presentation).

### B. Sport quick filter pills (from Data Matrix):
Replace or enhance the age group dropdown with sport/program pills that let admins quickly filter:
```jsx
<div className="flex items-center gap-2">
  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Quick Filter:</span>
  {sportFilters.map(sf => (
    <button key={sf.key} className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
      activeSportFilter === sf.key ? 'bg-[#10284C] text-white' : 'bg-white border border-[#E8ECF2] text-slate-500'
    }`}>{sf.label} {sf.count && <span className="ml-1 opacity-60">{sf.count}</span>}</button>
  ))}
</div>
```
Keep the existing age group dropdown alongside these pills.

### C. 2-column layout:
```jsx
<div className="flex gap-6">
  <div className="flex-1 min-w-0">
    {/* Team table */}
  </div>
  {selectedTeamForDetail && (
    <div className="w-[360px] shrink-0">
      {/* Inline team detail panel */}
    </div>
  )}
</div>
```

### D. Footer stats strip (from Data Matrix):
At the bottom of the page, a horizontal bar with org-wide stats:
```jsx
<div className={`mt-6 flex items-center gap-6 p-5 rounded-2xl ${isDark ? 'bg-[#132240]' : 'bg-white border border-[#E8ECF2]'}`}>
  <div><span className="text-xs font-black uppercase tracking-widest text-slate-400">Total Players</span><div className="text-2xl font-black">{totalPlayers}</div></div>
  <div><span className="text-xs font-black uppercase tracking-widest text-slate-400">Registration Rate</span><div className="text-2xl font-black">{regRate}%</div></div>
  <div><span className="text-xs font-black uppercase tracking-widest text-slate-400">Club Health</span><div className="text-2xl font-black">{avgHealth}%</div></div>
</div>
```

Plus the unrostered queue strip if there are unrostered players (replaces current UnrosteredAlert):
```jsx
{unrosteredPlayers.length > 0 && (
  <div className="mt-3 flex items-center gap-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
    <span className="font-bold text-sm">Unrostered Queue: {unrosteredPlayers.length} athletes pending</span>
    {/* Player avatar stack */}
    <button onClick={() => onNavigate?.('registrations')} className="ml-auto text-xs font-bold text-[#4BB9EC]">Manage All →</button>
  </div>
)}
```

### Commit:
```bash
git add src/pages/teams/TeamsPage.jsx
git commit -m "Phase 1: Teams 2-column layout with alert pills, sport filters, footer stats"
```

---

## PHASE 2: Redesign TeamsTableView — Sport Groups + Fill Bars + Health Index

**File:** `src/pages/teams/TeamsTableView.jsx`
**Edit contract:** Restyle table rows. Add sport section grouping. Improve fill bars and health display. Keep all click handlers and menu logic.

### Changes:

**A. Sport-grouped sections:**
Group teams by sport/program. Render section headers:
```jsx
<tr>
  <td colSpan={7}>
    <div className="flex items-center gap-2 px-4 py-2 mt-4 first:mt-0">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {sportName} · {programName}
      </span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  </td>
</tr>
```

**B. Team row styling:**
- Team name: bold with color dot and age/division subtitle
- Coach column: avatar circle + name (or red "Unassigned" text)
- Roster fill: progress bar with count label (e.g., "12 / 12" with full green bar, or "3 / 12" with short red bar)
- Health index: large number with trend indicator (up arrow green, down arrow red, neutral dash)
- Status badge: READY (green), ALERT (amber/red), INCOMPLETE (gray), CLEAR (green)
- Selected row: sky-blue background + checked checkbox visual (from Command Table)

**C. Roster fill bars (from Data Matrix):**
```jsx
<div className="flex items-center gap-2">
  <span className={`text-sm font-bold ${fillPercent === 100 ? 'text-[#22C55E]' : fillPercent < 50 ? 'text-red-500' : 'text-[#10284C]'}`}>
    {playerCount}/{maxRoster}
  </span>
  <div className="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden">
    <div className={`h-full rounded-full ${fillPercent === 100 ? 'bg-[#22C55E]' : fillPercent < 50 ? 'bg-red-500' : 'bg-[#4BB9EC]'}`} 
      style={{ width: `${fillPercent}%` }} />
  </div>
  <span className="text-xs text-slate-400">{fillPercent}%</span>
</div>
```

**D. Health index (from Data Matrix):**
```jsx
<div className="flex items-center gap-1">
  <span className={`text-lg font-black ${health > 80 ? 'text-[#22C55E]' : health > 50 ? 'text-amber-500' : 'text-red-500'}`}>
    {health}
  </span>
  {trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-[#22C55E]" />}
  {trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
</div>
```

**E. Row hover + selected state:**
```jsx
className={`transition-all ${
  isSelected
    ? (isDark ? 'bg-[#4BB9EC]/10 border-l-3 border-l-[#10284C]' : 'bg-[#4BB9EC]/[0.06] border-l-3 border-l-[#10284C]')
    : (isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50')
}`}
```

### Commit:
```bash
git add src/pages/teams/TeamsTableView.jsx
git commit -m "Phase 2: Teams table with sport groups, fill bars, health index, selected state"
```

---

## PHASE 3: Convert TeamDetailPanel to Inline Right Column

**File:** `src/pages/teams/TeamDetailPanel.jsx`
**Edit contract:** Convert from slideout overlay to inline panel. Restyle to match War Room/Command Table right column. Keep all content and action buttons.

### Changes:
- Remove the overlay/backdrop/slide-in animation
- Render as a static right-column card
- Add "ACTIVE DETAIL" label header (from Command Table)
- Keep all existing sections: team name, division, roster list, coach assignment, settings
- Add alert card if team has issues (no head coach, over capacity, etc.)
- Add Health Index + Missing Waivers stat cards (2-col grid)
- Add full roster mini-list with player avatars, jersey numbers, positions
- Add Recent Activity feed (last 3-5 actions on this team)
- Add action buttons at bottom: Transfer Players, Add to Roster, Edit Team, View Wall

### Commit:
```bash
git add src/pages/teams/TeamDetailPanel.jsx
git commit -m "Phase 3: TeamDetailPanel converted to inline right column with enhanced content"
```

---

## PHASE 4: Final Wiring + Verification

**File:** `src/pages/teams/TeamsPage.jsx`
**Edit contract:** Wire the inline detail panel, verify all interactions.

### Changes:
- Add `selectedTeamForDetail` state
- Pass `onRowSelect={setSelectedTeamForDetail}` to TeamsTableView
- Render TeamDetailPanel inline in the right column
- Wire detail panel action buttons to existing modal openers
- Verify responsive behavior (hide detail panel below 1100px, show as overlay instead)

### Verification:
- [ ] Build passes
- [ ] Alert pills show correct counts for teams needing coaches, unrostered players
- [ ] Sport quick filter pills work
- [ ] Sport-grouped sections render in table
- [ ] Roster fill bars display correctly (color-coded by fill %)
- [ ] Health index shows with trend arrows
- [ ] Clicking a team row highlights it and shows detail panel
- [ ] Detail panel shows correct team info, roster, activity
- [ ] All 3-dot menu actions work (View Wall, Edit, Manage Roster, Assign Coaches, Toggle Open, Delete)
- [ ] Export CSV works
- [ ] + New Team opens NewTeamModal
- [ ] All modals function correctly
- [ ] Footer stats strip shows correct org-wide numbers
- [ ] Unrostered queue strip shows at bottom when applicable
- [ ] Search filters teams correctly
- [ ] Age group filter works
- [ ] Season/Sport filter works
- [ ] Dark mode works on all new elements
- [ ] Team wall navigation works

### Commit:
```bash
git add src/pages/teams/TeamsPage.jsx src/pages/teams/TeamsTableView.jsx src/pages/teams/TeamDetailPanel.jsx
git commit -m "Phase 4: Teams page final wiring — detail panel, interactions, verification"
```

---

## FINAL PUSH

After ALL phases pass:
```bash
git push origin main
```

## FINAL REPORT
```
## Teams Redesign Report
- Phases completed: X/4
- Files modified: TeamsPage.jsx, TeamsTableView.jsx, TeamDetailPanel.jsx
- Total lines: +X / -Y
- Build status: PASS/FAIL
- 2-column layout works: YES/NO
- Alert pills display: YES/NO
- Sport-grouped rows: YES/NO
- Fill bars + health index: YES/NO
- Inline detail panel: YES/NO
- All modals work: YES/NO
- Footer stats: YES/NO
- Dark mode: YES/NO
```
