# CC-JERSEYS-REDESIGN.md
# Jerseys Page Redesign — Hybrid Command Table + Pipeline Workflow + Action Panel

## READ FIRST
1. `CC-SPEC-GUARDRAILS.md`
2. `CLAUDE.md`
3. `src/styles/v2-tokens.css`
4. `src/pages/jerseys/JerseysPage.jsx` (1426 lines — this is a large file, read it fully before starting)

## SCOPE
Redesign the Jerseys page into a team-accordion command table with inline pipeline workflow (per team) and a right-side action panel for resolving conflicts, sending size requests, and managing individual assignments. The design must handle 10 jerseys or 1500 jerseys — the admin should be able to get in, scan the status, resolve issues, and get out fast.

**Design fusion:**
- **From Hybrid Command Table:** Team-grouped accordion rows. Each team is a collapsible section showing team name, coach, player count, readiness progress bar (18/22 Ready), and a "Manage Team" button. Expanded: player table with columns for name, preferred numbers, assigned number, size, status, last action, and action buttons. Bulk selection per team with a sticky action bar (Bulk Assign Numbers, Bulk Remind Parents, Approve Selection).
- **From Team Pipeline Boards (Concept 2):** Inside each expanded team accordion, show the pipeline stages as a horizontal flow: Needs # → Needs Size → Ready → Ordered → Delivered. Players appear as cards/rows within their current stage. The admin can see at a glance how many players are in each stage per team.
- **Right Action Panel (~340px):** Shows when a player is selected OR when conflicts need resolution. Contains: conflict resolution UI (two players want same number — side-by-side comparison with "Assign to X" buttons), missing size request UI ("Send Reminder" / "Set Manually"), individual player assignment with number input and size dropdown. This panel is the workhorse for quick resolution.

**Key design decision — speed at scale:**
The page is organized by TEAM (accordion), not by pipeline stage globally. Why: an admin with 50 teams and 1500 players needs to work through jerseys team by team. Each team accordion shows the pipeline progress at a glance (progress bar), and when expanded, shows only that team's players grouped by stage. This keeps the list manageable. The admin opens one team, resolves all issues, closes it, opens the next.

For orgs with 10 players and 1-2 teams, the page collapses to just a few rows and the action panel handles everything inline.

**Global readiness bar** at the top shows org-wide completion (like "Club Readiness Status: 76% READY TO ORDER" from the mockup).

---

## ELEMENT PRESERVATION CONTRACT

**Every element below MUST survive. MOVED and RESTYLED = OK. REMOVED = NOT OK.**

### Action Buttons:
- **History** (`setShowOrderHistory`) — opens order history view
- **Full League Report** (`setShowFullReport`) — opens league report view
- **Auto-Assign (N)** (`handleAutoAssign`) — auto-assigns jersey numbers to all unassigned players
- Per-player: **Assign** (number input + save), **Size request**, **Mark as ordered**

### Filters:
- **Season/Sport filter bar** (SeasonFilterBar)
- **Team filter pills** (`selectedTeam` / `setSelectedTeam`) — "All Teams" + individual team buttons with color dots
- **Search** (if present — check file)

### Tabs (currently):
- Needs Jersey (count) / Ready to Order (count) / Ordered (count)
- These become the pipeline stages WITHIN each team accordion, not separate page-level tabs

### Per-Player Interactions:
- **Assign jersey number** — input field + save (with conflict checking)
- **Auto-assign** — system picks available number based on preferences
- **Edit assignment** — change number or size
- **Mark as ordered** / **Mark as delivered**
- **Send size reminder** to parent
- **Set size manually** — dropdown override

### Modals / Full-Screen Views:
- **Full League Report** view (`showFullReport`)
- **Order History** view (`showOrderHistory`)
- Any inline modals for conflict resolution

### Data Functions (DO NOT MODIFY):
- `loadData()` — loads teams, players, jersey assignments
- `handleAutoAssign()` — auto-assignment algorithm (complex, ~100 lines)
- `handleSingleAssign()` — assign one player's number
- All jersey preference checking, conflict detection, size validation
- All Supabase queries and mutations
- `exportToCSV()` if present

---

## PHASE 1: Global Readiness Header + Team Accordion Structure

**File:** `src/pages/jerseys/JerseysPage.jsx`
**Edit contract:** Restructure the top of the page and convert the team filter pills into expandable team accordion sections. Do not change data loading or assignment logic.

### New Layout:
```
┌───────────────────────────────────────────────────────────────────┐
│  PageShell Header: "Jersey Management" + subtitle                 │
│  SeasonFilterBar + [History] [Full League Report] [Auto-Assign]   │
├───────────────────────────────────────────────────────────────────┤
│  CLUB READINESS STATUS (full width card)                          │
│  ┌────────────────────────────────────────── 76% ──────────────┐  │
│  │  ████████████████████████████░░░░░░░░░░  READY TO ORDER     │  │
│  └─────────────────────────────────────────────────────────────┘  │
│  ● 420 Validated  ● 12 Conflicts  ● 54 Pending Sizes             │
├────────────────────────────────────────────┬──────────────────────┤
│  TEAM ACCORDIONS (flex-1)                  │ ACTION PANEL (~340px)│
│                                            │ (contextual)        │
│  ┌─ Thunderbolts 14U ── 18/22 Ready ────┐ │                     │
│  │  ▸ Pipeline: [Needs#: 2][NeedSize: 1]│ │ Shows one of:       │
│  │    [Ready: 4][Ordered: 5][Done: 8]   │ │ - Conflict resolver  │
│  │  ▸ Expanded player table             │ │ - Size request form  │
│  └──────────────────────────────────────┘ │ - Number assignment  │
│                                            │ - Bulk action panel  │
│  ┌─ Lightning 16U ✅ ── 100% Ready ─────┐ │                     │
│  │  (collapsed — all done)              │ │                     │
│  └──────────────────────────────────────┘ │                     │
│                                            │                     │
│  ┌─ Hurricanes 12U ── 12/24 Ready ──────┐ │                     │
│  └──────────────────────────────────────┘ │                     │
├────────────────────────────────────────────┴──────────────────────┤
│  Bulk Action Bar (when players selected):                         │
│  [2 Players Selected] [Bulk Assign Numbers] [Bulk Remind] [Approve]│
└───────────────────────────────────────────────────────────────────┘
```

### A. Club Readiness Status bar:
```jsx
<div className={`rounded-2xl p-6 mb-6 ${isDark ? 'bg-[#132240]' : 'bg-white border border-[#E8ECF2]'}`}>
  <div className="flex items-center justify-between mb-3">
    <div>
      <h2 className="text-lg font-extrabold">Club Readiness Status</h2>
      <p className="text-xs text-slate-400">{orgName} · {seasonName}</p>
    </div>
    <div className="text-right">
      <span className={`text-4xl font-black italic ${readyPercent > 90 ? 'text-[#22C55E]' : readyPercent > 60 ? 'text-[#4BB9EC]' : 'text-amber-500'}`}>
        {readyPercent}%
      </span>
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ready to Order</div>
    </div>
  </div>
  {/* Full-width progress bar */}
  <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
    <div className="h-full rounded-full bg-gradient-to-r from-[#4BB9EC] to-[#22C55E]" style={{ width: `${readyPercent}%` }} />
  </div>
  {/* Summary dots */}
  <div className="flex items-center gap-6 mt-3 text-xs font-bold">
    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#22C55E]" /> {validatedCount} Players Validated</span>
    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> {conflictCount} Conflicts Found</span>
    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> {pendingSizeCount} Pending Sizes</span>
  </div>
</div>
```

### B. Team accordion headers (collapsed):
Each team is a card that expands/collapses:
```jsx
<div className={`rounded-[14px] overflow-hidden mb-3 ${isDark ? 'bg-[#132240] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'}`}>
  <button onClick={() => toggleTeam(team.id)} className="w-full px-5 py-4 flex items-center gap-4">
    <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
    <span className={`w-3 h-3 rounded-full`} style={{ backgroundColor: team.color }} />
    <div className="text-left flex-1">
      <div className="font-extrabold">{team.name}</div>
      <div className="text-xs text-slate-400 uppercase">Coach: {coachName} · {playerCount} Players</div>
    </div>
    {/* Readiness badge */}
    <span className={`text-sm font-black ${teamReady === teamTotal ? 'text-[#22C55E]' : 'text-slate-500'}`}>
      {teamReady === teamTotal ? '100% READY' : `${teamReady} / ${teamTotal} Ready`}
    </span>
    {/* Mini progress bar */}
    <div className="w-24 h-1.5 rounded-full bg-slate-200 overflow-hidden">
      <div className={`h-full rounded-full ${teamReady === teamTotal ? 'bg-[#22C55E]' : 'bg-[#4BB9EC]'}`} 
        style={{ width: `${(teamReady/teamTotal)*100}%` }} />
    </div>
    <button className="text-xs font-bold text-[#4BB9EC]">Manage Team</button>
  </button>
  
  {isExpanded && (
    <div className="border-t border-[#E8ECF2]">
      {/* Pipeline stages + player rows — see Phase 2 */}
    </div>
  )}
</div>
```

### Commit:
```bash
git add src/pages/jerseys/JerseysPage.jsx
git commit -m "Phase 1: Jerseys readiness header + team accordion structure"
```

---

## PHASE 2: Pipeline Stages Inside Team Accordions

**File:** `src/pages/jerseys/JerseysPage.jsx`
**Edit contract:** Inside each expanded team accordion, render the pipeline stages with player counts and player rows. Convert the existing tab system (Needs Jersey / Ready to Order / Ordered) into an inline pipeline within each team.

### Pipeline stage bar (inside each expanded team):
```jsx
<div className="flex items-center gap-1 px-5 py-3 bg-[#F5F6F8]">
  {PIPELINE_STAGES.map(stage => (
    <button key={stage.key} onClick={() => setTeamStageFilter(team.id, stage.key)}
      className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
        activeStage === stage.key ? 'bg-[#10284C] text-white' : 'text-slate-400 hover:text-slate-600'
      }`}>
      {stage.label} ({stage.count})
    </button>
  ))}
</div>
```

Pipeline stages:
- **Needs #** — players without assigned jersey number (red count if > 0)
- **Needs Size** — players without uniform size (amber count)
- **Ready** — number + size assigned, not yet ordered (sky count)
- **Ordered** — order placed (green count)
- **Delivered** — jersey received (check mark)

The admin can click a stage to filter the player rows below to only that stage, or click "All" to see everyone.

### Player rows within the expanded team:
```jsx
<table className="w-full">
  <thead>
    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
      <th className="w-10 px-3"><input type="checkbox" /></th>
      <th className="text-left px-3 py-2">Player Name</th>
      <th className="text-left px-3 py-2">Preferred Numbers</th>
      <th className="text-left px-3 py-2">Assigned</th>
      <th className="text-left px-3 py-2">Size</th>
      <th className="text-left px-3 py-2">Status</th>
      <th className="text-left px-3 py-2">Last Action</th>
      <th className="text-left px-3 py-2">Actions</th>
    </tr>
  </thead>
  <tbody>
    {teamPlayers.map(player => (
      <PlayerRow key={player.id} player={player} 
        isSelected={selectedPlayer?.id === player.id}
        onSelect={() => setSelectedPlayer(player)}
        onAssign={...} />
    ))}
  </tbody>
</table>
```

Player row columns:
- **Checkbox** for bulk selection
- **Avatar + Name** (initials circle + full name)
- **Preferred Numbers** — shown as small pills (#10, #7, #11). Conflicted preferences get a red triangle warning icon
- **Assigned** — the assigned number in a bordered box, or "—" if unassigned
- **Size** — "Youth L", "Adult M", etc. or "No size" in red text
- **Status badge** — READY TO ORDER (green), NEEDS NUMBER (amber), NEEDS SIZE (amber), CONFLICT (red), ORDERED (blue)
- **Last Action** — "Auto-assigned 1d ago", "Conflict with Alvarez" (red text), "Verified by Parent 2h ago"
- **Actions** — small action button or icon

Clicking a player row selects it (sky-blue highlight) and populates the right Action Panel.

### Commit:
```bash
git add src/pages/jerseys/JerseysPage.jsx
git commit -m "Phase 2: Pipeline stages inside team accordions with player rows"
```

---

## PHASE 3: Right-Side Action Panel

**File:** `src/pages/jerseys/JerseyActionPanel.jsx` (NEW)
**Edit contract:** New file only.

### The Action Panel is contextual — it shows different content based on what's selected:

**A. When a player with a conflict is selected:**
```
┌─ NUMBER CONFLICT ─────────────────────┐
│  #7 — Primary Number Contention       │
│  Both players selected #7 as first    │
│  choice.                    Skip →    │
│  ┌────────────┐  ┌────────────┐       │
│  │ [Photo]    │  │ [Photo]    │       │
│  │ Maya R.    │  │ Emma D.    │       │
│  │ Senior     │  │ Freshman   │       │
│  │ Pref 2: #14│  │ Pref 2: #21│       │
│  │ 4 yrs club │  │ 1 yr club  │       │
│  │            │  │            │       │
│  │[Assign #7] │  │[Assign #7] │       │
│  └────────────┘  └────────────┘       │
└───────────────────────────────────────┘
```
Side-by-side player comparison with "Assign to X" buttons. Seniority/years context helps the admin decide. "Skip for Now" button to defer.

**B. When a player needing a size is selected:**
```
┌─ SIZE REQUEST ────────────────────────┐
│  Sophia Brown                         │
│  Home Jersey, Away Shorts             │
│                                       │
│  [Send Reminder]  [Set Manually ▼]    │
│                                       │
│  Manual override:                     │
│  Size: [Youth S ▼]                    │
│  [Save Size]                          │
└───────────────────────────────────────┘
```

**C. When a player needing a number is selected:**
```
┌─ ASSIGN NUMBER ───────────────────────┐
│  Julian Alvarez                       │
│  Thunderbolts 14U · Youth L           │
│                                       │
│  Preferences: #10  #7  #11           │
│  Available: ✅ #10  ❌ #7  ✅ #11    │
│                                       │
│  Assign: [___] [Save]                 │
│                                       │
│  Quick picks (available):             │
│  [1] [2] [3] [5] [8] [10] [11]...   │
└───────────────────────────────────────┘
```
Shows preferences with availability, lets admin type a number or click a quick-pick.

**D. When nothing is selected (default):**
Show a summary of all unresolved items across the org:
```
┌─ RESOLUTION QUEUE ────────────────────┐
│  🔴 3 Number Conflicts                │
│     → Click a conflicted player       │
│  🟡 8 Missing Sizes                   │
│     → [Send All Reminders]            │
│  🟡 12 Unassigned Numbers             │
│     → [Auto-Assign Remaining ✨]      │
└───────────────────────────────────────┘
```

### Commit:
```bash
git add src/pages/jerseys/JerseyActionPanel.jsx
git commit -m "Phase 3: JerseyActionPanel — conflict resolution, size request, number assignment"
```

---

## PHASE 4: Wire Action Panel + Bulk Selection + Final Integration

**File:** `src/pages/jerseys/JerseysPage.jsx`
**Edit contract:** Import JerseyActionPanel, wire player selection, integrate bulk actions.

### Changes:
- Add `selectedPlayer` state for the action panel context
- Import and render JerseyActionPanel in the right column
- Wire action panel callbacks to existing functions (assign number, send reminder, set size)
- Add per-row checkbox selection for bulk actions
- Sticky bulk action bar at bottom when players selected: "X Players Selected" + "Bulk Assign Numbers" + "Bulk Remind Parents" + "Approve Selection"
- Pagination per expanded team if > 20 players ("Showing 20 of 22 in Thunderbolts 14U" + Prev/Next)
- Verify all existing functionality preserved: auto-assign, manual assign, conflict detection, history view, league report

### Verification:
- [ ] Build passes
- [ ] Club Readiness Status bar shows correct org-wide percentage
- [ ] Summary dots (Validated, Conflicts, Pending Sizes) correct
- [ ] Team accordions expand/collapse
- [ ] Each team shows readiness progress bar and count
- [ ] 100% ready teams show green checkmark and stay collapsed by default
- [ ] Pipeline stages filter within each team
- [ ] Player rows show all columns (preferences, assigned, size, status, last action)
- [ ] Conflicted preferences show red warning
- [ ] Clicking a player highlights row and shows Action Panel
- [ ] Conflict resolution UI shows side-by-side comparison with Assign buttons
- [ ] Size request UI sends reminder or allows manual override
- [ ] Number assignment UI shows preference availability and quick picks
- [ ] Default Action Panel shows Resolution Queue summary
- [ ] Auto-Assign button works (assigns numbers to all unassigned)
- [ ] Bulk selection checkboxes work per team
- [ ] Bulk action bar appears with correct count
- [ ] History view opens
- [ ] Full League Report view opens
- [ ] Season/Sport filter works
- [ ] Search works (if applicable)
- [ ] Dark mode on all elements
- [ ] Performance: handles 50+ teams, 1500 players (accordion keeps DOM light)

### Commit:
```bash
git add src/pages/jerseys/JerseysPage.jsx src/pages/jerseys/JerseyActionPanel.jsx
git commit -m "Phase 4: Wire action panel, bulk selection, final integration"
```

---

## FINAL PUSH

After ALL phases pass:
```bash
git push origin main
```

## FINAL REPORT
```
## Jerseys Redesign Report
- Phases completed: X/4
- New files: JerseyActionPanel.jsx
- Files modified: JerseysPage.jsx
- Total lines: +X / -Y
- Build status: PASS/FAIL
- Readiness header: YES/NO
- Team accordions: YES/NO
- Pipeline stages per team: YES/NO
- Action panel (conflict/size/number): YES/NO
- Bulk selection: YES/NO
- Auto-assign preserved: YES/NO
- Dark mode: YES/NO
- Performance (50+ teams): YES/NO
```
