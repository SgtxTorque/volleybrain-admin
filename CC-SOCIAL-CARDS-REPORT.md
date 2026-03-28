# Social Cards Implementation Report

## 1. Existing Game Day Card System

### File Map

| File | Path | Lines | Purpose |
|------|------|-------|---------|
| GameDayShareModal.jsx | `src/pages/schedule/GameDayShareModal.jsx` | 1–413 | Main modal: 4 card templates, share/copy/save, featured player |
| SchedulePosterModal.jsx | `src/pages/schedule/SchedulePosterModal.jsx` | 1–487 | Season schedule poster: 4 layouts, featured players, PNG export |
| SchedulePage.jsx | `src/pages/schedule/SchedulePage.jsx` | 1–511 | Hosts both modals, Share & Export menu (lines 327–359) |
| EventDetailModal.jsx | `src/pages/schedule/EventDetailModal.jsx` | 1–220+ | "Share" button for individual games (line 214) |
| scheduleHelpers.jsx | `src/pages/schedule/scheduleHelpers.jsx` | 1–70+ | `getEventColor`, `formatTime12`, `exportEventsToICal`, `VolleyballIcon` |
| CalendarViews.jsx | `src/pages/schedule/CalendarViews.jsx` | 1–570+ | MonthView, WeekView, DayView, ListView calendar components |
| GameDayCard.jsx | `src/components/v2/coach/GameDayCard.jsx` | 1–118 | Separate "Next Game" dashboard widget (not the sharing card) |

### Template Architecture

**Config-driven with 4 inline component functions.**

Templates are defined as a constant array (GameDayShareModal.jsx:29–34):
```javascript
const CARD_STYLES = [
  { id: 'bold', name: 'Bold', desc: 'Team colors' },
  { id: 'clean', name: 'Clean', desc: 'White minimal' },
  { id: 'dark', name: 'Dark', desc: 'Dark premium' },
  { id: 'hype', name: 'Hype', desc: 'Big & loud' },
]
```

Selection state (line 40):
```javascript
const [style, setStyle] = useState('bold')
```

Conditional rendering (lines 390–393):
```javascript
{style === 'bold' && <BoldCard />}
{style === 'clean' && <CleanCard />}
{style === 'dark' && <DarkCard />}
{style === 'hype' && <HypeCard />}
```

Each template is a separate function component defined inside the modal's closure (they share state via closures, not props). All templates use **inline styles only** (no Tailwind classes) for html2canvas compatibility. All cards are **540x540px** (1:1 square).

Style selector buttons (lines 342–349): horizontal toggle bar with accent highlight on active.

### Data Flow

```
SchedulePage.jsx
  ├─ state: showGameDayCard (line 65)
  ├─ loadEvents() → fetches from schedule_events (line 87)
  ├─ loadTeams() → fetches from teams (line 148)
  │
  ├─ EventDetailModal (per-event)
  │   └─ "🏟️ Share" button (line 214, games/tournaments only)
  │       └─ onShareGameDay(event) → setShowGameDayCard(event)
  │
  └─ Share & Export menu (line 329)
      └─ "🏟️ Game Day Card" → setShowGameDayCard(nextGame)
          │
          ▼
      GameDayShareModal (lines 497–499)
        Props received:
          event  = showGameDayCard          (schedule_events row)
          team   = teams.find(t => t.id === event.team_id) || teams[0]
          organization = organization       (from AuthContext)
          season = selectedSeason           (from SeasonContext)
          onClose, showToast
```

**Data extracted inside GameDayShareModal:**

| Data | Source | Line |
|------|--------|------|
| Team color | `team?.color \|\| '#6366F1'` | 46 |
| Sport icon | `season?.sports?.icon \|\| '🏐'` | 48 |
| Date parts | Parsed from `event?.event_date` | 50–56 |
| Home/Away | `event?.location_type === 'home'` | 57 |
| Opponent | `event?.opponent_name \|\| event?.opponent \|\| 'TBD'` | 58 |
| Roster | Supabase query on `team_players` → `players` | 60–72 |
| Team logo | `team?.logo_url` | Used in BoldCard:142, DarkCard:236, HypeCard:271 |
| Org name | `organization?.name` | Used in BoldCard:141, HypeCard:272 |

### Image Export

**Library:** `html2canvas` — loaded from CDN, NOT in package.json.

Detection pattern (line 86):
```javascript
if (window.html2canvas) {
```

Export function (lines 82–104):
```javascript
async function exportCard() {
  setExporting(true)
  const el = cardRef.current
  if (window.html2canvas) {
    const canvas = await window.html2canvas(el, {
      scale: 2, useCORS: true, allowTaint: true
    })
    const link = document.createElement('a')
    link.download = `gameday-${team?.name || 'game'}-${event?.event_date || 'card'}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    showToast?.('Game day card saved!', 'success')
  } else {
    // Fallback: open in new window for screenshot/print
    const w = window.open('', '_blank')
    w.document.write(`<html>...${el.outerHTML}...</html>`)
    w.document.close()
    setTimeout(() => w.print(), 500)
  }
  setExporting(false)
}
```

**Same pattern used in SchedulePosterModal.jsx (lines 106–126).**

### Share/Copy/Save

| Button | Function | Mechanism | Lines |
|--------|----------|-----------|-------|
| **Share** | `shareCard()` | `navigator.share({ title, text: shareText })` — Web Share API. Falls back to `copyText()` if unavailable | 106–114, 352–354 |
| **Copy** | `copyText()` | `navigator.clipboard.writeText(shareText)` — copies pre-formatted text to clipboard | 116–121, 355–357 |
| **Save** | `exportCard()` | html2canvas → `canvas.toDataURL('image/png')` → link download. Falls back to print dialog | 82–104, 358–360 |

Share text template (line 80):
```
{sportIcon} GAME DAY!
{team?.name} vs {opponent}
📅 {dayName}, {monthDay}
⏰ {fmtTime12(event?.event_time)}
📍 {event?.venue_name || 'TBD'}

Come support us! 💪
```

### Player Photo Selector

State (lines 42–43):
```javascript
const [roster, setRoster] = useState([])
const [featuredPlayer, setFeaturedPlayer] = useState(null)
```

Roster loaded via (lines 60–72):
```javascript
const { data } = await supabase.from('team_players')
  .select('*, players(id, first_name, last_name, photo_url, jersey_number)')
  .eq('team_id', team.id)
```

Auto-selects first player with a photo. Selector UI shows up to 6 players with photos as thumbnail buttons (lines 368–385). A "None" button clears the selection.

Featured player appears in **Bold, Dark, and Hype** templates (not Clean). In each card, the player photo is absolutely positioned with gradient overlays.

### Team Colors & Logo

**Color source:** `team?.color || '#6366F1'` (line 46)

**Color utilities** (lines 12–27, defined at file top):
- `getContrastText(hex)` — returns `#1a1a2e` or `#ffffff` based on luminance
- `darken(hex, pct=0.3)` — darkens by percentage, returns `rgb()` string
- `hexToRgba(hex, a)` — converts hex to `rgba()` string

**Team logo:** `team?.logo_url` — displayed in card headers (48x48 rounded square in Bold, 56x56 in Dark, 36x36 in Hype).

**Where colors are stored:** `teams` table, `color` column (hex string). Loaded via SchedulePage `loadTeams()` query: `.select('id, name, color, logo_url')`.

### Current Template Code

All templates are in `src/pages/schedule/GameDayShareModal.jsx`. Each is a function component using only inline styles.

| Template | Lines | Dimensions | Key Visual |
|----------|-------|------------|------------|
| **BoldCard** | 126–172 | 540x540 | Team color gradient bg, player photo right side, left-aligned text |
| **CleanCard** | 177–221 | 540x540 | White bg, colored top bar, three info cards (Date/Time/Location) |
| **DarkCard** | 226–251 | 540x540 | `#0a0a14` bg, blurred team-color circle, centered layout |
| **HypeCard** | 256–329 | 540x540 | Dark gradient, diagonal team-color slash, big "GAME DAY" text |

All templates use `fontFamily: "'Segoe UI', system-ui, sans-serif"`. Duplicate `getContrastText`, `darken`, `hexToRgba` utilities also exist in SchedulePosterModal.jsx (should be extracted to shared util).

---

## 2. Schedule System

### File Map

| File | Path | Lines | Purpose |
|------|------|-------|---------|
| SchedulePage.jsx | `src/pages/schedule/SchedulePage.jsx` | 1–511 | Main orchestrator: filters, views, modal management |
| CalendarViews.jsx | `src/pages/schedule/CalendarViews.jsx` | 1–570+ | 4 view modes: MonthView, WeekView, DayView, ListView |
| scheduleHelpers.jsx | `src/pages/schedule/scheduleHelpers.jsx` | 1–70+ | Shared utilities, iCal export |
| EventDetailModal.jsx | `src/pages/schedule/EventDetailModal.jsx` | 1–220+ | Event details/edit with tabs |
| AddEventModal.jsx | `src/pages/schedule/AddEventModal.jsx` | 1–180+ | Single event creation form |
| BulkPracticeModal.jsx | `src/pages/schedule/BulkPracticeModal.jsx` | — | Bulk practice creation |
| BulkGamesModal.jsx | `src/pages/schedule/BulkGamesModal.jsx` | — | Bulk game creation |
| BulkEventWizard.jsx | `src/pages/schedule/BulkEventWizard.jsx` | — | Multi-step event series |
| SchedulePosterModal.jsx | `src/pages/schedule/SchedulePosterModal.jsx` | 1–487 | Season poster generator |
| GameDayShareModal.jsx | `src/pages/schedule/GameDayShareModal.jsx` | 1–413 | Game day card generator |
| CoachAvailabilityPage.jsx | `src/pages/schedule/CoachAvailabilityPage.jsx` | 1–420+ | Coach availability management |
| GameCompletionModal.jsx | `src/pages/schedule/GameCompletionModal.jsx` | 1–317+ | Post-game score entry |

### Existing Share Features

**YES — multiple share features already exist:**

1. **📋 Season Poster** (SchedulePage line 339–342) — Opens SchedulePosterModal with 4 layouts
2. **🏟️ Game Day Card** (line 343–347) — Opens GameDayShareModal for next upcoming game
3. **📅 Export to Calendar** (line 350–353) — `exportEventsToICal()` generates .ics file
4. **🖨️ Print Schedule** (line 354–357) — `window.print()` native browser print

All accessed via a **"Share & Export"** dropdown in the schedule action bar (lines 327–359).

### Event Data Model (table + columns)

**Table: `schedule_events`**

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `organization_id` | uuid | FK → organizations |
| `season_id` | uuid | FK → seasons |
| `team_id` | uuid/null | FK → teams, null = org-wide |
| `event_type` | text | 'practice', 'game', 'tournament', 'team_event', 'other' |
| `title` | text | Optional, defaults to event_type |
| `description` / `notes` | text | Event details |
| `event_date` | date | YYYY-MM-DD |
| `event_time` | time | HH:MM |
| `end_time` | time | HH:MM |
| `venue_name` | text | Location name |
| `venue_address` | text | Full address |
| `court_number` | text | Court/field identifier |
| `location_type` | text | 'home', 'away', 'neutral' |
| `opponent_name` | text | For games |
| `arrival_time` | timestamp | Pre-event arrival |
| `series_id` | uuid/null | Links recurring events |
| `our_score` | integer | Team score (post-game) |
| `opponent_score` | integer | Opponent score (post-game) |
| `set_scores` | jsonb | `[{our: 25, their: 23}, ...]` |
| `our_sets_won` | integer | Sets won |
| `opponent_sets_won` | integer | Sets lost |
| `period_scores` | jsonb | Basketball/soccer periods |
| `scoring_format` | text | 'best_of_3', 'best_of_5', 'four_quarters', etc. |
| `game_status` | text | 'scheduled', 'completed', etc. |
| `game_result` | text | 'win', 'loss', 'tie' |
| `point_differential` | integer | Calculated |
| `completed_at` | timestamp | When game was completed |
| `completed_by` | uuid | Who recorded result |
| `stats_entered` | boolean | Whether player stats recorded |
| `created_at` | timestamp | — |
| `updated_at` | timestamp | — |

### Query Patterns

**Main events query** (SchedulePage.jsx:87–115):
```javascript
let query = supabase
  .from('schedule_events')
  .select('*, teams!schedule_events_team_id_fkey(id, name, color, logo_url)')

// Season filtering (lines 90–110):
if (!isAllSeasons(selectedSeason) && selectedSeason?.id) {
  query = query.eq('season_id', selectedSeason.id)
} else {
  // Sport or all-seasons filtering via .in('season_id', [...])
}

const { data, error } = await query
  .gte('event_date', startDate)
  .lte('event_date', endDate)
  .order('event_date', { ascending: true })
  .order('event_time', { ascending: true })
```

**Teams query** (SchedulePage.jsx:148–172):
```javascript
supabase.from('teams').select('id, name, color, logo_url')
  // + same season filtering logic
  .order('name')
```

### Rendering Pattern

**4 Calendar Views** in CalendarViews.jsx:

| View | Rendering Pattern |
|------|-------------------|
| **ListView** (default) | Group events by date → render day headers + event cards |
| **MonthView** | 7-column grid (Sun–Sat), max 3 events/day, "+N more" overflow |
| **WeekView** | 7-day horizontal timeline, events stacked per day |
| **DayView** | Single-day full-height cards, sorted by time |

**Client-side filtering** (SchedulePage.jsx:271–279): filters by `selectedTeam` and `selectedEventType` after fetch.

---

## 3. Game Results System

### File Map

| File | Path | Lines | Purpose |
|------|------|-------|---------|
| GamePrepPage.jsx | `src/pages/gameprep/GamePrepPage.jsx` | 1–300+ | Main orchestrator for upcoming/past games |
| GameCard.jsx | `src/pages/gameprep/GameCard.jsx` | 1–250+ | Individual game card with score display |
| QuickScoreModal.jsx | `src/pages/gameprep/QuickScoreModal.jsx` | 1–445 | Multi-sport score input modal |
| GameDayCommandCenter.jsx | `src/pages/gameprep/GameDayCommandCenter.jsx` | 1–302 | Full-screen live scoring overlay |
| Scoreboard.jsx | `src/pages/gameprep/Scoreboard.jsx` | 1–164 | Live score display with touch targets |
| SetScoreInput.jsx | `src/pages/gameprep/SetScoreInput.jsx` | 1–152 | Volleyball set-specific input |
| PeriodScoreInput.jsx | `src/pages/gameprep/PeriodScoreInput.jsx` | 1–36 | Basketball/soccer period input |
| PostGameSummary.jsx | `src/pages/gameprep/PostGameSummary.jsx` | 1–215 | Post-game celebration modal |
| GameDayStats.jsx | `src/pages/gameprep/GameDayStats.jsx` | 1–100+ | QuickStatsPanel + StatPickerModal |
| GameDayHero.jsx | `src/pages/gameprep/GameDayHero.jsx` | 1–92 | Matchup hero card |
| GameDayHelpers.jsx | `src/pages/gameprep/GameDayHelpers.jsx` | 1–180 | Constants, theme, icons, action bar |
| GameDetailModal.jsx | `src/components/games/GameDetailModal.jsx` | 1–528 | Comprehensive game review (4 tabs) |
| GameComponents.jsx | `src/components/games/GameComponents.jsx` | 1–200+ | Sport definitions + stat categories |
| GamePrepCompletionModal.jsx | `src/pages/gameprep/GamePrepCompletionModal.jsx` | — | Multi-sport completion workflow |

### Score Data Model (tables + columns)

Scores are stored directly in the **`schedule_events`** table (not a separate game_results table):

- `our_score` (integer) — total team points
- `opponent_score` (integer) — total opponent points
- `game_status` ('completed', etc.)
- `game_result` ('win', 'loss', 'tie')
- `point_differential` (integer)
- `set_scores` (jsonb) — volleyball: `[{our: 25, their: 23}, ...]`
- `our_sets_won` (integer)
- `opponent_sets_won` (integer)
- `period_scores` (jsonb) — basketball/soccer: `[{our: 15, their: 12}, ...]`
- `scoring_format` ('best_of_3', 'best_of_5', 'four_quarters', 'two_halves')
- `completed_at` (timestamp)
- `completed_by` (uuid)
- `stats_entered` (boolean)

### Stats Data Model (tables + columns)

**Table: `game_player_stats`**

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `event_id` | uuid | FK → schedule_events |
| `player_id` | uuid | FK → players |
| `team_id` | uuid | FK → teams |
| `kills` | integer | — |
| `aces` | integer | — |
| `assists` | integer | — |
| `digs` | integer | — |
| `blocks` | integer | — |
| `service_errors` | integer | — |
| `points` | integer | Calculated: kills + aces + blocks |
| `attacks` | integer | Optional |
| `attack_errors` | integer | Optional |
| `serves` | integer | Optional |
| `reception_errors` | integer | Optional |
| `created_by` | uuid | — |

Referenced in:
- `GameDayCommandCenter.jsx:186–207` — `saveStats()` inserts player stats
- `GameDetailModal.jsx:54–63` — loads stats with player join, ordered by kills
- `PostGameSummary.jsx:31–49` — aggregates for top performers

### Score Entry UI

| Component | Location | Use Case |
|-----------|----------|----------|
| QuickScoreModal | `src/pages/gameprep/QuickScoreModal.jsx` | Post-game score entry (modal from GameCard) |
| GameDayCommandCenter | `src/pages/gameprep/GameDayCommandCenter.jsx` | Full-screen live scoring |
| SetScoreInput | `src/pages/gameprep/SetScoreInput.jsx` | Volleyball set-by-set input |
| PeriodScoreInput | `src/pages/gameprep/PeriodScoreInput.jsx` | Basketball/soccer period input |
| Scoreboard | `src/pages/gameprep/Scoreboard.jsx` | Touch-target live scoreboard |

### Score Display Components

1. **GameCard** (inline) — sets won/lost for volleyball, total score for other sports, WIN/LOSS badge
2. **GameDetailModal** (4-tab comprehensive view) — Summary, Attendance, Badges, Player Stats
3. **PostGameSummary** (celebration overlay) — Victory/Defeat banner, set scores, team totals, top 3 performers

### Existing Share Features

**NONE.** No "Share Results" button exists anywhere in the game results flow. This is a gap.

**Logical placement for a future share button:**
1. GameDetailModal footer (line 523)
2. PostGameSummary footer (lines 190–208)
3. GameCard actions (lines 185–248)

---

## 4. Recommended Architecture

### File Structure Recommendation

```
src/
├── components/
│   └── social-cards/
│       ├── SocialCardModal.jsx          # Shared modal shell (preview + controls)
│       ├── CardExporter.js              # html2canvas export, Web Share, clipboard
│       ├── cardColorUtils.js            # getContrastText, darken, hexToRgba (extracted)
│       ├── templates/
│       │   ├── gameday/
│       │   │   ├── BoldCard.jsx
│       │   │   ├── CleanCard.jsx
│       │   │   ├── DarkCard.jsx
│       │   │   └── HypeCard.jsx
│       │   ├── schedule/
│       │   │   ├── WoffordPoster.jsx
│       │   │   ├── EditorialPoster.jsx
│       │   │   ├── StoryPoster.jsx
│       │   │   └── CleanGridPoster.jsx
│       │   └── results/
│       │       ├── ScoreCard.jsx        # NEW — final score card
│       │       ├── RecapCard.jsx        # NEW — game recap with top performers
│       │       └── StatsCard.jsx        # NEW — stat leaders card
│       └── registry.js                  # Template registry: id, component, category, dimensions
```

### Template Registration Pattern

Create a registry file that maps template IDs to components and metadata:

```javascript
// registry.js
export const CARD_TEMPLATES = {
  gameday: [
    { id: 'bold', name: 'Bold', component: BoldCard, dimensions: [540, 540] },
    { id: 'clean', name: 'Clean', component: CleanCard, dimensions: [540, 540] },
    // ...
  ],
  schedule: [
    { id: 'wofford', name: 'Classic Wide', component: WoffordPoster, dimensions: [1200, 800] },
    // ...
  ],
  results: [
    { id: 'score', name: 'Score Card', component: ScoreCard, dimensions: [540, 540] },
    // ...
  ],
}
```

This follows the existing CARD_STYLES / POSTER_LAYOUTS pattern but unifies it.

### Modal Strategy

**Recommend: Shared modal shell with category-specific content panels.**

The existing GameDayShareModal and SchedulePosterModal share ~80% of their chrome (overlay, style selector, featured player picker, export buttons). Extract a single `SocialCardModal` that receives:
- `category` — 'gameday' | 'schedule' | 'results'
- `data` — event/team/organization/season
- Template list from registry

The card preview area and data-binding remain category-specific but slot into the shared shell.

### Image Export Strategy (with library recommendation)

**Keep html2canvas.** Reasons:
1. Already working in production for both GameDayShareModal and SchedulePosterModal
2. All templates use inline styles — html2canvas handles these well
3. No need for server-side rendering (@vercel/og requires Node/Edge runtime)
4. Adding html2canvas to package.json is the only needed change (instead of relying on CDN)

**Recommended package.json addition:**
```
"html2canvas": "^1.4.1"
```

Then import directly instead of checking `window.html2canvas`:
```javascript
import html2canvas from 'html2canvas'
```

**Extract shared export utility** (`CardExporter.js`):
```javascript
export async function exportCardAsPng(element, filename) { ... }
export async function shareCard(title, text) { ... }
export async function copyCardText(text) { ... }
```

---

## 5. Database Schema

### Teams Table (full column list)

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `organization_id` | uuid | FK |
| `season_id` | uuid | FK |
| `name` | text | Team name |
| `color` | text | Hex color (e.g. `#6366F1`) |
| `level` | text | Competitive level |
| `age_group` | text | — |
| `gender` | text | — |
| `logo_url` | text | Team logo image URL |
| `banner_url` | text | Banner image URL |
| `motto` | text | — |
| `max_players` | integer | — |
| `is_active` | boolean | — |
| `created_at` | timestamp | — |
| `updated_at` | timestamp | — |

### Events Table (full column list)

See Section 2 above — **`schedule_events`** with 30+ columns including game result fields.

### Players Table (full column list)

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `organization_id` | uuid | FK |
| `season_id` | uuid | FK |
| `first_name` | text | — |
| `last_name` | text | — |
| `email` | text | — |
| `phone` | text | — |
| `date_of_birth` | date | — |
| `gender` | text | — |
| `grade` | text | — |
| `parent_name` | text | — |
| `parent_email` | text | — |
| `parent_phone` | text | — |
| `parent_account_id` | uuid | FK → profiles |
| `emergency_contact_name` | text | — |
| `emergency_contact_phone` | text | — |
| `medical_notes` | text | — |
| `allergies` | text | — |
| `photo_url` | text | Player photo |
| `jersey_number` | integer | — |
| `position` | text | — |
| `status` | text | 'pending', 'approved', 'waitlisted', 'denied', 'inactive' |
| `registration_date` | date | — |
| `registration_notes` | text | — |
| `school` | text | — |
| `address`, `city`, `state`, `zip` | text | — |
| `created_at` | timestamp | — |
| `updated_at` | timestamp | — |

### Game Results Table

**Does not exist as a separate table.** Game results are stored as columns on the `schedule_events` table (see Section 2). Columns: `our_score`, `opponent_score`, `game_result`, `game_status`, `set_scores`, `our_sets_won`, `opponent_sets_won`, `period_scores`, `scoring_format`, `point_differential`, `completed_at`, `completed_by`, `stats_entered`.

### Player Stats Table (full column list)

**Table: `game_player_stats`** — see Section 3 Stats Data Model above for full column list.

### Organizations Table (full column list)

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `name` | text | Organization name |
| `slug` | text | URL slug |
| `description` | text | — |
| `logo_url` | text | Org logo |
| `banner_url` | text | Banner image |
| `primary_color` | text | Hex color |
| `secondary_color` | text | Hex color |
| `sport_type` | text | — |
| `website`, `email`, `phone` | text | — |
| `address`, `city`, `state`, `zip` | text | — |
| `contact_email` | text | — |
| `settings` | jsonb | Nested org config |
| `stripe_enabled` | boolean | — |
| `stripe_mode` | text | — |
| `stripe_publishable_key` | text | — |
| `payment_processing_fee_mode` | text | — |
| `allow_partial_payments` | boolean | — |
| `minimum_payment_amount` | decimal | — |
| `send_receipt_emails` | boolean | — |
| `venmo_handle`, `zelle_info`, `cashapp_handle` | text | — |
| `payment_instructions` | text | — |
| `email_sender_name` | text | — |
| `email_reply_to` | text | — |
| `email_footer_text` | text | — |
| `email_social_facebook` | text | — |
| `email_social_instagram` | text | — |
| `email_social_twitter` | text | — |
| `email_include_unsubscribe` | boolean | — |
| `email_header_image` | text | Full-width email banner |
| `is_active` | boolean | — |
| `created_at`, `updated_at` | timestamp | — |

**Note:** No `SCHEMA_REFERENCE.csv` file was found in the repo root.

---

## 6. Existing Share/Export Inventory

### All share-related code found

| Feature | File | Lines | Mechanism |
|---------|------|-------|-----------|
| Game Day Card share | `GameDayShareModal.jsx` | 106–114 | Web Share API → clipboard fallback |
| Game Day Card copy | `GameDayShareModal.jsx` | 116–121 | `navigator.clipboard.writeText()` |
| Game Day Card save | `GameDayShareModal.jsx` | 82–104 | html2canvas → PNG download |
| Season Poster save | `SchedulePosterModal.jsx` | 106–126 | html2canvas → PNG download |
| Season Poster print | `SchedulePosterModal.jsx` | 430–433 | `window.print()` |
| iCal export | `scheduleHelpers.jsx` | 51–68 | Blob → .ics file download |
| CSV export | `src/lib/csv-export.js` | 7–35 | Blob → .csv file download |
| Data export | `src/pages/settings/dataExportHelpers.jsx` | 32–41 | Blob → CSV/JSON download |

### Libraries in package.json

**No image generation libraries installed.** Relevant dependencies:
- `react: ^18.2.0`
- `react-dom: ^18.2.0`
- `@supabase/supabase-js: ^2.39.0`
- `lucide-react: ^0.294.0`
- `react-router-dom: ^6.21.0`
- `react-grid-layout: ^2.2.2`
- `@tiptap/*: ^3.20.5` (7 packages, email composer)
- `tailwindcss: ^3.4.0` (devDependency)

**html2canvas is NOT in package.json** — loaded via `window.html2canvas` (CDN or external injection). The code gracefully degrades to `window.print()` if unavailable.

### Web Share API usage

Only in `GameDayShareModal.jsx:106–114`:
```javascript
if (navigator.share) {
  await navigator.share({ title: `${team?.name} - Game Day`, text: shareText })
}
```
Text-only share (no image blob). Falls back to `navigator.clipboard.writeText()`.

---

## 7. Modal System

### Base modal component (file, pattern)

**No shared base modal component exists.** Every modal is a standalone implementation using the same hand-rolled pattern:

```jsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
  onClick={onClose}>
  <div className={`relative border rounded-xl ${isDark ? 'bg-lynx-midnight' : 'bg-white'}`}
    onClick={e => e.stopPropagation()}>
    {/* Close button */}
    <button onClick={onClose}>
      <X className="w-5 h-5" />
    </button>
    {/* Content */}
  </div>
</div>
```

**Invocation:** Via `useState` boolean/object at the page level. The modal component is conditionally rendered:
```jsx
{showModal && <SomeModal onClose={() => setShowModal(null)} ... />}
```

**No library used** (no headlessui, radix-ui, or shadcn).

### Game Day Card modal (file, trigger, props)

**File:** `src/pages/schedule/GameDayShareModal.jsx`

**Trigger 1 — From EventDetailModal** (line 214–220):
```jsx
{(event.event_type === 'game' || event.event_type === 'tournament') && onShareGameDay && (
  <button onClick={() => onShareGameDay(event)}>🏟️ Share</button>
)}
```

**Trigger 2 — From Share & Export menu** (SchedulePage.jsx:343–347):
```jsx
onClick={() => { setShowGameDayCard(nextGame); /* closes menu */ }}
```

**Mount** (SchedulePage.jsx:497–499):
```jsx
{showGameDayCard && (
  <GameDayShareModal
    event={showGameDayCard}
    team={teams.find(t => t.id === showGameDayCard.team_id) || teams[0]}
    organization={organization}
    season={selectedSeason}
    onClose={() => setShowGameDayCard(null)}
    showToast={showToast}
  />
)}
```

**Props:**

| Prop | Type | Source |
|------|------|--------|
| `event` | object | schedule_events row |
| `team` | object | Matched team from teams array |
| `organization` | object | From AuthContext |
| `season` | object | From SeasonContext |
| `onClose` | function | Clears showGameDayCard state |
| `showToast` | function | Toast notification helper |

---

## 8. Routing

### Router setup

**React Router v6** (`react-router-dom: ^6.21.0`). Route config in `src/lib/routes.js`.

**MainApp.jsx** wraps `<Routes>` in context providers (Auth, Theme, Season, Sport, OrgBranding, Journey).

Navigation via custom `useAppNavigate` hook that wraps `useNavigate`.

### Relevant existing routes

| Route | Page ID | File |
|-------|---------|------|
| `/schedule` | `schedule` | `src/pages/schedule/SchedulePage.jsx` |
| `/gameprep` | `gameprep` | `src/pages/gameprep/GamePrepPage.jsx` |
| `/teams` | `teams` | `src/pages/teams/TeamsPage.jsx` |
| `/teams/:id` | `teamwall-{id}` | Team Wall page |
| `/standings` | `standings` | `src/pages/standings/TeamStandingsPage.jsx` |
| `/leaderboards` | `leaderboards` | `src/pages/leaderboards/SeasonLeaderboardsPage.jsx` |

### Recommended new routes (if any)

**No new routes needed.** Social card generation should live inside existing modals (modal-based UX), not as separate pages. The existing Share & Export pattern in SchedulePage and the future addition of a share button in GameDetailModal/PostGameSummary is sufficient.

If a standalone card builder is desired later, it could live at `/share/gameday/:eventId` or `/share/results/:eventId`, but this would be a V2 consideration.

---

## 9. Key Risks & Blockers

### html2canvas not in package.json
The codebase checks `window.html2canvas` and falls back to print. This means the PNG export silently fails on first use if the CDN script hasn't loaded. **Fix: Add html2canvas to package.json and import directly.**

### Duplicate color utility functions
`getContrastText()`, `darken()`, and `hexToRgba()` are duplicated across GameDayShareModal.jsx and SchedulePosterModal.jsx. Adding a third consumer (results cards) would triple the duplication. **Fix: Extract to shared `cardColorUtils.js`.**

### No shared modal shell
Each card modal duplicates the overlay, style selector, export buttons. **Fix: Extract `SocialCardModal` shell.**

### Score data is on schedule_events, not a separate table
Game results are stored as columns on the `schedule_events` table. This works fine for social cards — all score data is available from the same event object. No extra queries needed.

### No "Share Results" feature exists
This is a pure green-field addition. The data exists (scores, stats, player info), but no UI for sharing results as a social card. The architecture recommended above accounts for this.

### Player photos are sparse
The featured player selector only shows players with `photo_url`. If a team has no player photos, the featured player picker is hidden. Results cards should gracefully handle missing photos.

### html2canvas CORS with Supabase Storage images
Player photos and team logos are stored in Supabase Storage. html2canvas needs `useCORS: true` and `allowTaint: true` (already set). If Supabase Storage buckets lack CORS headers, images may render blank in exported PNGs. **Test this early.**

### No SCHEMA_REFERENCE.csv
The investigation spec asked for this file — it does not exist in the repo root. All schema information was derived from code analysis.

---

## 10. Quick Reference: Files That Will Need Changes

### Game Day Cards (refactor existing)
- `src/pages/schedule/GameDayShareModal.jsx` — Extract templates to separate files, use shared modal
- `src/pages/schedule/SchedulePosterModal.jsx` — Extract templates, use shared modal + exporter

### New Shared Infrastructure
- `src/components/social-cards/SocialCardModal.jsx` — **NEW** shared modal shell
- `src/components/social-cards/CardExporter.js` — **NEW** shared export utility
- `src/components/social-cards/cardColorUtils.js` — **NEW** extracted color utilities
- `src/components/social-cards/registry.js` — **NEW** template registry

### New Results Card Templates
- `src/components/social-cards/templates/results/ScoreCard.jsx` — **NEW** final score card
- `src/components/social-cards/templates/results/RecapCard.jsx` — **NEW** game recap
- `src/components/social-cards/templates/results/StatsCard.jsx` — **NEW** stat leaders

### Integration Points (add share buttons)
- `src/components/games/GameDetailModal.jsx` — Add "Share Results" button (footer area, ~line 523)
- `src/pages/gameprep/PostGameSummary.jsx` — Add share option (footer, ~line 190)
- `src/pages/gameprep/GameCard.jsx` — Add share action for completed games (~line 185)

### Package Dependencies
- `package.json` — Add `html2canvas: ^1.4.1`
