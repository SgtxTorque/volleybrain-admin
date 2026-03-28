# CC-MEGA-REPORTS-ANALYTICS-REDESIGN.md
# Mega Spec: Reports, Analytics & Engagement Pages Visual Redesign

## READ FIRST
1. `CC-SPEC-GUARDRAILS.md`
2. `CLAUDE.md`
3. `src/styles/v2-tokens.css`

## SCOPE
Visual redesign of all data/analytics/engagement pages: Reports, Registration Funnel, Achievements Catalog, Season Leaderboards, Team Standings, and Player Stats. These pages display data, charts, and metrics — they should feel like a premium sports analytics dashboard, not a generic data table.

## GLOBAL DESIGN DIRECTION FOR ANALYTICS PAGES

These pages are about **insight and motivation**. The admin or coach opens them to understand performance, track progress, and celebrate achievement. The design should feel:

- **Data-forward with editorial typography.** Big bold numbers, trend indicators, clean charts.
- **Navy stat headers** with org/season-level KPIs at the top.
- **Card-based sections** rather than raw tables. Each data group is a card.
- **Color-coded status indicators** everywhere — green for good, amber for attention, red for critical.
- **Gamification elements** on achievements and leaderboards — badges, rank medals (gold/silver/bronze), progress bars, XP indicators.
- **V2 token system** throughout: rounded-[14px], Inter font, proper shadows.

## ELEMENT PRESERVATION CONTRACT (applies to ALL phases)

For every page: all data loading, filtering, sorting, export functions, modal triggers, chart rendering, tab switching, and navigation must survive. Restyle and reposition. Never remove.

---

## PHASE 1: Reports Page
**File:** `src/pages/reports/ReportsPage.jsx` (579 lines) + `src/pages/reports/ReportCards.jsx` (592 lines)

### Current State:
11 report types across 3 categories (People, Financial, Operations). Column picker, multi-filter, sort. CSV/PDF/email export. Saved presets.

### Redesign:

**A. Navy overview header:**
```
Total Reports Available: 11 | Last Generated: [date] | Exports This Month: [count]
```

**B. Report category sections** with category headers (People / Financial / Operations):
```jsx
<div className="flex items-center gap-3 mt-6 mb-4">
  <span className="text-xs font-black uppercase tracking-widest text-[#4BB9EC]">{category}</span>
  <div className="flex-1 h-px bg-[#E8ECF2]" />
</div>
```

**C. Report cards:** Each report type as a rich card:
- Report name (bold) + description
- Icon in subtle bg container
- Row count badge ("142 records")
- Quick action buttons: Generate, Export CSV, Export PDF, Email
- Column picker as a popover/dropdown (V2 styled)
- Filter controls (V2 styled selects and inputs)
- Last generated timestamp

**D. Report data table** (when a report is generated):
- V2 table styling: clean headers (uppercase tracking), row hover, alternating subtle stripes
- Sortable column headers with arrow indicators
- Pagination

**E. Saved presets** as small pill buttons above the table.

### Commit:
```bash
git add src/pages/reports/ReportsPage.jsx src/pages/reports/ReportCards.jsx
git commit -m "Phase 1: Reports — navy header, report category cards, V2 table styling"
```

---

## PHASE 2: Registration Funnel Page
**File:** `src/pages/reports/RegistrationFunnelPage.jsx` (399 lines) + tab files (FunnelOverviewTab, PipelineTab, TrendsTab)

### Current State:
Funnel analytics with views → starts → submitted → approved → paid stages. Pipeline table. Trends tab.

### Redesign:

**A. Funnel visualization:** The funnel stages should be visually represented as a horizontal pipeline:
```
[Page Views] → [Form Started] → [Submitted] → [Approved] → [Paid]
    2,450          1,890            1,245          1,100        980
                    77%              66%            88%         89%
```
Each stage is a card with a big number, conversion rate between stages shown as a connecting arrow with percentage. Color gradient from light (top of funnel) to sky blue (bottom).

**B. V2 tab bar** for Overview / Pipeline / Trends (pill style).

**C. Pipeline table** (PipelineTab): V2 table styling with status badges per registration.

**D. Trends charts** (TrendsTab): If using chart library, ensure chart containers are V2 cards with proper padding. If custom, style with Lynx colors.

### Commit:
```bash
git add src/pages/reports/RegistrationFunnelPage.jsx src/pages/reports/FunnelOverviewTab.jsx src/pages/reports/PipelineTab.jsx src/pages/reports/TrendsTab.jsx
git commit -m "Phase 2: Registration Funnel — visual pipeline, V2 tabs, styled charts"
```

---

## PHASE 3: Achievements Catalog Page
**File:** `src/pages/achievements/AchievementsCatalogPage.jsx` (484 lines) + `AchievementCard.jsx` (462 lines) + `AchievementDetailModal.jsx` (429 lines)

### Current State:
5 categories, 3 types (badges/emblems/calling cards), track/untrack, progress bars, admin preview mode.

### Redesign:

**A. Hero section:** Editorial header with achievement stats:
```
ACHIEVEMENTS (big italic bold) + "X total badges across 5 categories"
Stat pills: [42 Earned] [18 In Progress] [12 Locked]
```

**B. Category filter bar:** V2 pill tabs for the 5 categories + All.

**C. Achievement cards (the showpiece):**
This is where gamification design matters. Each card should feel collectible:
- Card: rounded-[14px] with subtle shadow. On hover: slight scale(1.02) + shadow increase
- Badge image centered and prominent
- Achievement name (bold) + rarity label (Common/Rare/Epic/Legendary with color coding)
- Progress bar if in progress (sky blue fill)
- "X/Y" progress count
- Lock icon overlay if locked, checkmark badge if earned
- Track/Untrack toggle as a small bookmark icon

**D. Rarity color coding:**
```
Common: text-slate-400, bg-slate-100 border
Rare: text-[#4BB9EC], bg-[#4BB9EC]/10 border
Epic: text-[#8B5CF6], bg-[#8B5CF6]/10 border  
Legendary: text-[#FFD700], bg-[#FFD700]/10 border, subtle gold shimmer on hover
```

**E. Grid layout:** Responsive grid (4 cols desktop, 3 tablet, 2 mobile).

**F. Keep AchievementDetailModal untouched** — only restyle the catalog page and cards.

### Commit:
```bash
git add src/pages/achievements/AchievementsCatalogPage.jsx src/pages/achievements/AchievementCard.jsx
git commit -m "Phase 3: Achievements — collectible card design, rarity colors, gamification feel"
```

---

## PHASE 4: Season Leaderboards Page
**File:** `src/pages/leaderboards/SeasonLeaderboardsPage.jsx` (671 lines)

### Current State:
8 stat categories, grid + list views, rank badges (gold/silver/bronze), team filter, season MVPs.

### Redesign:

**A. Navy header with MVP showcase:**
If there's an overall season MVP, feature them in the navy header with a gold accent.

**B. Stat category tabs:** V2 pill tabs for the 8 categories (Kills, Aces, Blocks, etc.).

**C. Leaderboard rows — podium treatment:**
- **#1:** Gold accent, larger text, trophy icon, gold left border
- **#2:** Silver accent
- **#3:** Bronze accent
- **#4+:** Standard rows with rank number

Each row: Rank number (big bold) | Player avatar + name + team | Stat value (big bold) | Per-game average | Trend arrow

**D. Grid view** (if toggled): Player cards with stat focus, rank badge overlay.

### Commit:
```bash
git add src/pages/leaderboards/SeasonLeaderboardsPage.jsx
git commit -m "Phase 4: Leaderboards — podium treatment, rank medals, MVP showcase"
```

---

## PHASE 5: Team Standings Page
**File:** `src/pages/standings/TeamStandingsPage.jsx` (556 lines)

### Current State:
W-L-T record, win %, points for/against, recent form guide, team selector.

### Redesign:

**A. Standings table — sports broadcast feel:**
- Team rows with team color dot, name bold, record prominent
- Win % as a mini horizontal bar
- Points For / Against columns
- Recent form: last 5 results as colored dots (green W, red L, gray T)
- Rank column with medal icons for top 3

**B. Team selector:** V2 pill filter.

**C. Season selector** if applicable.

### Commit:
```bash
git add src/pages/standings/TeamStandingsPage.jsx
git commit -m "Phase 5: Standings — broadcast-style table, form guide, rank medals"
```

---

## PHASE 6: Player Stats Page
**File:** `src/pages/stats/PlayerStatsPage.jsx` (739 lines)

### Current State:
3 tabs (Overview/Game Log/Skills), season totals, per-game averages, trend charts, hitting/serve %, coach skill ratings.

### Redesign:

**A. Player hero header:** If viewing a specific player — navy bar with player name, position, team, OVR rating circle (color-coded: green 80+, amber 50-80, red <50).

**B. V2 tab bar** for Overview / Game Log / Skills.

**C. Overview tab:**
- Stat cards in a grid: each major stat (Kills, Aces, Blocks, Digs, Assists) as a card with big number + per-game average + trend arrow
- Radar/spider chart in a V2 card wrapper
- Season progress section

**D. Game Log tab:**
- V2 table with game-by-game stats
- Color-coded performance (green for above-average games, red for below)

**E. Skills tab:**
- Skill bars using sky blue fill on slate background
- Coach rating display with score labels
- Development timeline if available

### Commit:
```bash
git add src/pages/stats/PlayerStatsPage.jsx
git commit -m "Phase 6: Player Stats — hero header, stat cards, V2 skill bars"
```

---

## FINAL PUSH

After ALL 6 phases pass:
```bash
git push origin main
```

## FINAL REPORT
```
## Reports & Analytics Mega Redesign Report
- Phases completed: X/6
- Files modified: [list]
- Total lines: +X / -Y
- Build status: PASS/FAIL
```
