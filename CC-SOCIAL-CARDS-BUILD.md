# CC-SOCIAL-CARDS-BUILD

## PURPOSE
Implement a complete social media card template system for Lynx web admin. This replaces the existing Game Day Card templates with a new, expanded system that covers Game Day cards, Season Schedule cards, and Final Score/Results cards. All 20 templates are provided as HTML/CSS in reference files.

## REPO & BRANCH
```bash
cd volleybrain-admin
git checkout feat/desktop-dashboard-redesign
git pull origin feat/desktop-dashboard-redesign
```

## REFERENCE FILES
The HTML template reference files are attached alongside this spec. They contain the exact visual designs to replicate:
- `lynx-gameday-templates-v2.html` — 6 game day template designs (Takeover, Split, Poster, Banner + wide variants)
- `lynx-schedule-templates.html` — 5 schedule template designs (Program, Column Card, Badge, Split Schedule, Minimal Clean)
- `lynx-score-templates-v2.html` — 7 score/results template designs (Scoreboard, Hero Score, Stat Line, Headline Score, Waves, Tri-Panel, Urban)

Open each in a browser to see the exact visual output. Each template uses inline styles and specific font families. Replicate the visual appearance exactly.

## GUARDRAILS
- Read CC-SOCIAL-CARDS-REPORT.md in the repo root for the full codebase analysis
- Read every file before modifying it
- TSC verify after each phase (if TypeScript is used)
- Commit after each phase
- Do NOT break existing functionality — the current Game Day Card and Schedule Poster modals must continue to work until they are replaced
- All templates MUST use inline styles only (not Tailwind) for html2canvas compatibility
- Test that html2canvas exports work after each template is added

---

## PHASE 1: SHARED INFRASTRUCTURE

### 1A: Install html2canvas
```bash
npm install html2canvas
```

### 1B: Create shared color utilities
**Create:** `src/components/social-cards/cardColorUtils.js`

Extract these functions from `GameDayShareModal.jsx` (lines 12-27):
```javascript
export function getContrastText(hex) {
  // Returns '#1a1a2e' for light backgrounds, '#ffffff' for dark
  // Use luminance calculation: (r*299 + g*587 + b*114) / 1000
  // Threshold: 128
}

export function darken(hex, pct = 0.3) {
  // Returns rgb() string darkened by percentage
}

export function hexToRgba(hex, alpha) {
  // Returns rgba() string
}

export function lighten(hex, pct = 0.3) {
  // Returns rgb() string lightened by percentage
}

export function isLightColor(hex) {
  // Returns true if luminance > 0.6
  // Used to determine if we need dark text on this background
}
```

### 1C: Create shared export utility
**Create:** `src/components/social-cards/CardExporter.js`

```javascript
import html2canvas from 'html2canvas'

export async function exportCardAsPng(element, filename) {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
  })
  const link = document.createElement('a')
  link.download = `${filename}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export async function shareCardText(title, text) {
  if (navigator.share) {
    await navigator.share({ title, text })
    return true
  }
  return copyCardText(text)
}

export async function copyCardText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
```

### 1D: Create template registry
**Create:** `src/components/social-cards/registry.js`

This file maps template IDs to their metadata. Components are lazy-imported.

```javascript
export const TEMPLATE_CATEGORIES = {
  gameday: {
    label: 'Game Day',
    templates: [
      { id: 'takeover', name: 'Takeover', desc: 'Full photo with gradient sweep' },
      { id: 'split', name: 'Split', desc: 'Diagonal photo/color divide' },
      { id: 'poster', name: 'Poster', desc: 'Vignette spotlight' },
      { id: 'banner', name: 'Banner', desc: 'Geometric accent shape' },
      { id: 'scoreboard-gd', name: 'Scoreboard', desc: 'Typography driven' },
      { id: 'headline-gd', name: 'Headline', desc: 'Color bar header' },
      { id: 'minimal-gd', name: 'Minimal', desc: 'Clean light background' },
      { id: 'badge-gd', name: 'Badge', desc: 'Logo centered' },
    ]
  },
  schedule: {
    label: 'Season Schedule',
    templates: [
      { id: 'program', name: 'Program', desc: 'Photo hero + game list' },
      { id: 'program-logo', name: 'Program (Logo)', desc: 'Logo hero + game list' },
      { id: 'program-light', name: 'Program (Print)', desc: 'Light printable version' },
      { id: 'column-card', name: 'Column Card', desc: 'Wide with monthly columns' },
      { id: 'badge-sched', name: 'Badge Schedule', desc: 'Logo center + grid' },
      { id: 'split-sched', name: 'Split Schedule', desc: 'Photo + schedule side by side' },
      { id: 'minimal-sched', name: 'Fridge Ready', desc: 'Clean, printable, ink-friendly' },
    ]
  },
  results: {
    label: 'Score / Results',
    templates: [
      { id: 'scoreboard-res', name: 'Scoreboard', desc: 'Classic centered matchup' },
      { id: 'hero-score', name: 'Hero Score', desc: 'Full photo with score overlay' },
      { id: 'stat-line', name: 'Stat Line', desc: 'Score + match stats' },
      { id: 'headline-score', name: 'Headline', desc: 'Color bar + team rows' },
      { id: 'waves', name: 'Waves', desc: 'Photo left, score cards right' },
      { id: 'tri-panel', name: 'Tri-Panel', desc: 'Multi-photo strip + score' },
      { id: 'urban', name: 'Urban', desc: 'Framed photo + score cards' },
    ]
  }
}
```

### COMMIT PHASE 1
```bash
git add -A && git commit -m "CC-SOCIAL-CARDS Phase 1: Shared infrastructure — color utils, exporter, registry" && git push
```

---

## PHASE 2: SHARED MODAL SHELL

### 2A: Create SocialCardModal
**Create:** `src/components/social-cards/SocialCardModal.jsx`

This is the shared modal wrapper used by all three card categories. It provides:
- Modal overlay (match existing pattern from GameDayShareModal)
- Template style selector (horizontal pill buttons)
- Featured player photo selector (reuse pattern from GameDayShareModal lines 368-385)
- Format toggle: Square (1080x1080) / Wide (1920x1080) — show as aspect ratio buttons
- Card preview area (centered, with the card rendered at display scale)
- Action buttons: Share, Copy, Save (reuse existing pattern)
- Close button

**Props:**
```javascript
{
  category: 'gameday' | 'schedule' | 'results',
  // Data props (passed through to templates)
  event: object,           // schedule_events row (for gameday + results)
  events: array,           // array of schedule_events (for schedule cards)
  team: object,            // teams row
  organization: object,    // from AuthContext
  season: object,          // from SeasonContext
  stats: array,            // game_player_stats rows (for results)
  // Modal props
  onClose: function,
  showToast: function,
}
```

**Template rendering pattern:**
The modal maintains state for `selectedTemplate` (string ID from registry) and `format` ('square' | 'wide'). It renders the selected template component inside a `ref`-captured div for html2canvas export.

Each template component receives a standardized props object:
```javascript
{
  event, events, team, organization, season, stats,
  teamColor: team?.color || '#0B1628',
  teamName: team?.name || 'Team',
  orgName: organization?.name || '',
  logoUrl: team?.logo_url,
  featuredPlayer: selectedPlayer, // from player selector
  format: 'square' | 'wide',
}
```

**Player selector:** Load roster from `team_players` joined with `players` (same query as GameDayShareModal lines 60-72). Show players with `photo_url` as selectable thumbnails. Include "None" option.

**Important:** The card preview div must have a fixed pixel size matching the export dimensions. Display it scaled down to fit the modal using CSS `transform: scale()`. The actual DOM element stays at full size for html2canvas.

### COMMIT PHASE 2
```bash
git add -A && git commit -m "CC-SOCIAL-CARDS Phase 2: Shared SocialCardModal shell" && git push
```

---

## PHASE 3: GAME DAY CARD TEMPLATES

### 3A: Create template component files
Create each template in `src/components/social-cards/templates/gameday/`:

**For each template:** Open `lynx-gameday-templates-v2.html` in a browser. Replicate the exact visual appearance as a React component using inline styles. Each component receives the standardized props object from Phase 2.

**Files to create:**
- `TakeoverCard.jsx` — Template 1 from reference. Full-bleed photo with 135deg gradient sweep in team color. Photo uses `object-fit: cover; object-position: top center`. Gradient: `linear-gradient(135deg, rgba(0,0,0,0.97) 0%, rgba(teamColor, 0.6) 50%, transparent 75%)`. Logo badge top-right. Text stack bottom-left: org name (tracked caps), "GAME DAY" (Bebas Neue 52px), team name (Oswald 18px in team color), "vs. Opponent", date/time/location.
- `SplitCard.jsx` — Template 2. Diagonal cut. Left 55% = team color panel with skewX(-8deg) edge. Right = photo with gradient bleed. NOTE: Give the photo MORE room than the v1 — reduce left panel to 48% width so photo gets 60% of the card. Text on left panel.
- `PosterCard.jsx` — Template 3. Photo fills frame. Radial vignette: `radial-gradient(ellipse at 50% 35%, transparent 20%, rgba(0,0,0,0.95) 85%)` with team color tint layer. "GAME DAY" watermark text at 15% opacity across top. Score bottom-center.
- `BannerCard.jsx` — Template 4. Dark gradient base. Geometric accent shape (skewY -12deg) with photo clipped inside. Logo top-left. "GAME DAY" stacked huge bottom-left.
- `ScoreboardGDCard.jsx` — Template 3 from v1 reference (no-photo scoreboard). Team color as bg. Giant team name centered. "VS. OPPONENT" below. Bottom bar with date/time/location.
- `HeadlineGDCard.jsx` — Template 7 from v1. Team color header bar with "GAME DAY". Photo in left 45% of body, text in right. Photo optional.
- `MinimalGDCard.jsx` — Template 6 from v1. Light background (#fafaf5). Team color as left edge stripe and accent only. Typography-driven. Logo subtle bottom-right.
- `BadgeGDCard.jsx` — Template 8 from v1. Radial glow bg. Logo centered large. Team name below. No photo.

**Each template MUST:**
- Use only inline styles (no Tailwind classes) — html2canvas requirement
- Handle `format === 'square'` (540x540) and `format === 'wide'` (960x540)
- Handle `featuredPlayer === null` gracefully (no-photo fallback state)
- Use team color from props for all color derivations
- Use the font families: `'Bebas Neue', sans-serif` for display, `'Oswald', sans-serif` for team names, `'Rajdhani', sans-serif` for labels, `'Inter', sans-serif` for body
- Include `<div style="...lynx watermark...">POWERED BY LYNX</div>` in bottom-right

**Font loading:** Add Google Fonts link to `index.html` (or public/index.html):
```html
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Oswald:wght@400;500;600;700&family=Rajdhani:wght@500;600;700&family=Teko:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### 3B: Register templates
Update `registry.js` to import all gameday template components.

### 3C: Wire up Game Day cards in SchedulePage
**Modify:** `src/pages/schedule/SchedulePage.jsx`

Replace the `GameDayShareModal` usage (lines 497-499) with the new `SocialCardModal`:
```jsx
{showGameDayCard && (
  <SocialCardModal
    category="gameday"
    event={showGameDayCard}
    team={teams.find(t => t.id === showGameDayCard.team_id) || teams[0]}
    organization={organization}
    season={selectedSeason}
    onClose={() => setShowGameDayCard(null)}
    showToast={showToast}
  />
)}
```

Also update the trigger in EventDetailModal.jsx (line 214) to use the same pattern.

**Do NOT delete GameDayShareModal.jsx yet.** Keep it as a backup until the new system is verified working.

### COMMIT PHASE 3
```bash
git add -A && git commit -m "CC-SOCIAL-CARDS Phase 3: 8 game day card templates + wired to schedule page" && git push
```

---

## PHASE 4: SCHEDULE CARD TEMPLATES

### 4A: Create template component files
Create each template in `src/components/social-cards/templates/schedule/`:

**For each template:** Open `lynx-schedule-templates.html` in a browser. Replicate the exact visual appearance.

Schedule templates receive `events` (array of schedule_events for the season/team) in addition to the standard props. They must:
- Group events by month
- Show opponent name, date, time for each game
- Distinguish between home ("vs.") and away ("@") games using `location_type`
- Mark tournaments with a star or asterisk
- Handle 8-30 games by adjusting row density

**Files to create:**
- `ProgramCard.jsx` — Template 1 photo variant. Photo hero top 40%, schedule list below on dark bg. Grouped by month.
- `ProgramLogoCard.jsx` — Template 1 logo variant. Team color hero top with centered logo, schedule on dark bg below.
- `ProgramLightCard.jsx` — Template 1 light variant. White/cream bg. Logo + team name header. Team color accents. Printable.
- `ColumnCard.jsx` — Template 2. Wide landscape. Team identity left panel (logo, year, team name). 3-column schedule grid right, one column per month. Compact font sizes.
- `BadgeScheduleCard.jsx` — Template 3. Logo centered. 2-column schedule grid wrapping below logo. Can include optional photo strip at top (3 photos tiled).
- `SplitScheduleCard.jsx` — Template 4. Wide landscape. Photo left ~42%, schedule right. Photo with gradient fade into schedule side.
- `MinimalScheduleCard.jsx` — Template 5. White bg, minimal ink. Team color stripe and date accents only. Clean rows with bottom borders. Fridge-optimized.

**Schedule data extraction pattern:**
```javascript
// Group events by month for template rendering
const gameEvents = events
  .filter(e => e.event_type === 'game' || e.event_type === 'tournament')
  .sort((a, b) => a.event_date.localeCompare(b.event_date))

const byMonth = {}
gameEvents.forEach(e => {
  const month = new Date(e.event_date + 'T00:00').toLocaleString('en', { month: 'long' }).toUpperCase()
  if (!byMonth[month]) byMonth[month] = []
  byMonth[month].push(e)
})
```

### 4B: Wire up Schedule cards
**Modify:** `src/pages/schedule/SchedulePage.jsx`

In the "Share & Export" dropdown menu (lines 327-359), add a new option:
```jsx
<button onClick={() => setShowScheduleCard(true)}>
  📅 Season Schedule Card
</button>
```

Add state: `const [showScheduleCard, setShowScheduleCard] = useState(false)`

Add modal render:
```jsx
{showScheduleCard && (
  <SocialCardModal
    category="schedule"
    events={filteredEvents}
    team={selectedTeam ? teams.find(t => t.id === selectedTeam) : teams[0]}
    organization={organization}
    season={selectedSeason}
    onClose={() => setShowScheduleCard(null)}
    showToast={showToast}
  />
)}
```

This replaces or supplements the existing SchedulePosterModal. Keep the old modal accessible for now.

### COMMIT PHASE 4
```bash
git add -A && git commit -m "CC-SOCIAL-CARDS Phase 4: 7 schedule card templates + wired to schedule page" && git push
```

---

## PHASE 5: SCORE / RESULTS CARD TEMPLATES

### 5A: Create template component files
Create each template in `src/components/social-cards/templates/results/`:

**For each template:** Open `lynx-score-templates-v2.html` in a browser. Replicate the exact visual appearance.

Results templates receive the `event` object which contains all score data:
- `event.our_score` / `event.opponent_score`
- `event.game_result` ('win', 'loss', 'tie')
- `event.set_scores` (jsonb array: `[{our: 25, their: 23}, ...]`)
- `event.our_sets_won` / `event.opponent_sets_won`

And optionally `stats` (array of `game_player_stats` rows) for stat-based templates.

**Win/loss visual treatment:**
- WIN: Team's score in team color at full brightness, opponent's score in muted gray (#555). Team logo at full opacity, opponent logo dimmed.
- LOSS: Both scores in muted tones. No celebratory color. Dignified "FINAL" label.
- Detect via `event.game_result === 'win'`

**Files to create:**
- `ScoreboardResCard.jsx` — Template 1. Centered matchup. Both logos, big scores, set scores below. Green checkmark on FINAL for wins.
- `HeroScoreCard.jsx` — Template 2. Full-bleed photo, bottom gradient, scores overlaid at bottom. "FINAL" badge bar at top in team color.
- `StatLineCard.jsx` — Template 3. Wide format. Photo left (optional), score + 4-stat grid (kills/aces/digs/blocks) right. Also a no-photo variant with head-to-head stat comparison.
- `HeadlineScoreCard.jsx` — Template 4. Team color header bar with "FINAL". Two team rows below showing logo, name, record, and big score. Set scores at bottom.
- `WavesCard.jsx` — Template 5. Full-bleed photo left, score card stack on right with glassmorphic treatment. "FINAL" badge between team score cards.
- `TriPanelCard.jsx` — Template 6. 3 photo strips left in portrait frames. Score stack right. Scrolling team name ticker at low opacity.
- `UrbanCard.jsx` — Template 7. Score card stack left. Framed photo right with decorative border. Floating geometric accent shapes in background.

**Stats query (for stat-based templates):**
The modal should query `game_player_stats` when category is 'results':
```javascript
const { data: stats } = await supabase
  .from('game_player_stats')
  .select('*, players(first_name, last_name, photo_url, jersey_number)')
  .eq('event_id', event.id)
  .order('kills', { ascending: false })
```

Aggregate team totals:
```javascript
const teamTotals = stats?.reduce((acc, s) => ({
  kills: (acc.kills || 0) + (s.kills || 0),
  aces: (acc.aces || 0) + (s.aces || 0),
  digs: (acc.digs || 0) + (s.digs || 0),
  blocks: (acc.blocks || 0) + (s.blocks || 0),
}), {})
```

### 5B: Wire up Results cards

**Modify:** `src/components/games/GameDetailModal.jsx`
Add a "Share Results" button in the footer area (~line 523):
```jsx
{event.game_status === 'completed' && (
  <button onClick={() => setShowResultsCard(true)}>
    📊 Share Results
  </button>
)}
```

**Modify:** `src/pages/gameprep/PostGameSummary.jsx`
Add share button in the footer (~line 190):
```jsx
<button onClick={() => onShareResults?.(event)}>
  📊 Share Score Card
</button>
```

**Modify:** `src/pages/gameprep/GameCard.jsx`
For completed games (~line 185), add a share action in the action menu:
```jsx
{game.game_status === 'completed' && (
  <button onClick={() => onShareResults?.(game)}>
    Share Results
  </button>
)}
```

**Modify:** `src/pages/gameprep/GamePrepPage.jsx`
Add state and modal render for the results card:
```jsx
const [showResultsCard, setShowResultsCard] = useState(null)

{showResultsCard && (
  <SocialCardModal
    category="results"
    event={showResultsCard}
    team={teams.find(t => t.id === showResultsCard.team_id) || teams[0]}
    organization={organization}
    season={selectedSeason}
    onClose={() => setShowResultsCard(null)}
    showToast={showToast}
  />
)}
```

Also wire it from GameDetailModal and PostGameSummary via callback props.

### COMMIT PHASE 5
```bash
git add -A && git commit -m "CC-SOCIAL-CARDS Phase 5: 7 results card templates + wired to game detail, post-game, game prep" && git push
```

---

## PHASE 6: CLEANUP & POLISH

### 6A: Remove old modals (after verifying new system works)
- Delete or deprecate `src/pages/schedule/GameDayShareModal.jsx`
- Delete or deprecate `src/pages/schedule/SchedulePosterModal.jsx`
- Remove old imports and state variables from SchedulePage.jsx
- Update the "Share & Export" dropdown in SchedulePage to only use new modal

### 6B: Opponent logo support (future-ready)
The templates support opponent team logos. Currently the app doesn't store opponent logos. Add a placeholder pattern:
- If opponent has no logo, show a neutral dark circle with the first letter of the opponent name
- The VS template (Template 4 from game day) and Scoreboard result templates show both logos, so the fallback matters

### 6C: Verify html2canvas export for all templates
Test every template with the Save button:
- Square format exports correctly
- Wide format exports correctly
- Player photos render in export (CORS check with Supabase Storage)
- Team logos render in export
- Fonts render correctly (Google Fonts must be loaded before export)
- No blank areas or missing elements

### 6D: Update Share & Export menu
**Modify:** `src/pages/schedule/SchedulePage.jsx` Share & Export dropdown

Final menu structure:
```
Share & Export
├── 🏟️ Game Day Card        → opens SocialCardModal category="gameday" (for next game)
├── 📅 Season Schedule Card  → opens SocialCardModal category="schedule"
├── 📊 Share Results         → opens SocialCardModal category="results" (for last completed game)
├── ─────────────────
├── 📅 Export to Calendar    → existing iCal export
└── 🖨️ Print Schedule       → existing window.print()
```

### COMMIT PHASE 6
```bash
git add -A && git commit -m "CC-SOCIAL-CARDS Phase 6: Cleanup old modals, polish, verify exports" && git push
```

---

## KEY TECHNICAL NOTES

### Font loading for html2canvas
html2canvas needs fonts to be fully loaded before it captures. Add a delay or use `document.fonts.ready`:
```javascript
await document.fonts.ready
const canvas = await html2canvas(element, { ... })
```

### Card dimensions
- Square: 540x540px in DOM (exports at 1080x1080 via scale: 2)
- Wide: 960x540px in DOM (exports at 1920x1080 via scale: 2)
- Schedule tall: 540x756px in DOM (portrait poster ratio)
- Schedule wide: 960x640px in DOM

### Inline styles only
Every template must use the `style={{}}` prop, never `className`. html2canvas does not reliably capture Tailwind utility classes. This is a hard rule.

### No-photo fallback
Every template that supports photos MUST also look complete and premium without a photo. When `featuredPlayer === null`, templates should:
- Fill the photo area with team color gradient or pattern
- Show team logo in place of photo where appropriate
- Never show a broken image placeholder or empty space

### Team color adaptation
Use `isLightColor(teamColor)` from cardColorUtils to determine:
- Light team color → use dark text, dark overlays
- Dark team color → use white text, standard gradients
Every template must handle both cases.
