# CC-GAMEPREP-COMMANDCENTER-MODERNIZE.md
## Grouping 6: Modernize GamePrepPage + GameDayCommandCenter

**Date:** February 27, 2026
**Repo:** `volleybrain-admin` (GitHub: SgtxTorque/volleybrain-admin)

---

## ⛔ RULES

1. **Read CLAUDE.md and DATABASE_SCHEMA.md before doing anything.**
2. **ZERO functional changes.** Do NOT change game logic, scoring, lineup management, stat tracking, or Supabase queries.
3. **Git commit after each major change.** Test `npm run dev` after each.

---

## ⚠️ CRITICAL: THESE PAGES ARE INTENTIONALLY DARK

Unlike other pages in the app, **both GamePrepPage and GameDayCommandCenter use a forced dark "tactical" theme by design.** This is NOT a bug or oversight:

- **GamePrepPage** wraps in `.gp-wrap` class with `background:#0a0a0f`, blue grid overlay, custom `.gp-card` glass panels, and uses Bebas Neue + Rajdhani fonts for a military/tactical aesthetic.
- **GameDayCommandCenter** has `const isDark = true` hardcoded in its `useGameDayTheme()` hook — it's always in dark scoreboard mode.

**DO NOT convert these to the standard light/dark design system.** These are live-game coaching tools where the dark tactical interface is a UX decision.

---

## SITUATION ASSESSMENT

| File | Lines | Components | Theme Status |
|------|-------|-----------|-------------|
| `GamePrepPage.jsx` | 1,680 | GameCard, SetScoreInput, PeriodScoreInput, GameCompletionModal, GamePrepPage | Forced dark tactical. Modals pop up in light/white over dark bg. |
| `GameDayCommandCenter.jsx` | 1,826 | 10+ components (court, scoreboard, stat picker, etc.) | Custom theme hook, forced dark. |

---

## WHAT ACTUALLY NEEDS WORK

Since the tactical dark theme stays, the work is narrower:

### A. Font Alignment

Both files import Google Fonts (Bebas Neue, Rajdhani) via custom `<style>` blocks or `<link>` injection. These are the same non-standard fonts flagged in TeamWallPage and ChatsPage.

**Decision needed:** The tactical font (Bebas Neue for big headings, Rajdhani for labels) IS the identity of these pages. Converting to Tele-Grotesk would lose the tactical feel. 

**Recommendation: KEEP the tactical fonts for these two pages.** They are specialized tools, not standard admin pages. The font inconsistency is acceptable here because the entire page has a distinct visual context (dark background, blue grid, glass cards). The user already expects a different experience when entering Game Prep / Game Day mode.

**However**, clean up the font loading:
- GamePrepPage uses an `@import` inside a `<style>` tag — this is slow
- GameDayCommandCenter dynamically injects a `<link>` tag into `<head>` — this works but is messy

**Fix:** Move both font imports to a single shared `@import` or `<link>` in the GamePrep index or create a shared `gameprep-fonts.css`:

```javascript
// At top of GamePrepPage.jsx — replace the @import inside gpStyles
// Instead, add to the static HTML or use a shared approach:
const TACTICAL_FONTS = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap'
```

Remove the duplicate font injection from GameDayCommandCenter (lines 7-13) and rely on GamePrepPage having already loaded them (since you navigate to CommandCenter FROM GamePrep).

### B. Extract Large Components from GamePrepPage

GamePrepPage has 4 large components embedded that should be extracted for maintainability:

| Component | Lines | Size | Extract To |
|-----------|-------|------|-----------|
| `GameCard` | 76-268 | 193 lines | `src/pages/gameprep/GameCard.jsx` |
| `SetScoreInput` | 271-416 | 146 lines | `src/pages/gameprep/SetScoreInput.jsx` |
| `PeriodScoreInput` | 419-629 | 211 lines | `src/pages/gameprep/PeriodScoreInput.jsx` |
| `GameCompletionModal` | 632-1194 | 563 lines | `src/pages/gameprep/GameCompletionModal.jsx` |

After extraction, GamePrepPage.jsx shrinks from 1,680 → ~500 lines.

**Note:** There is ALSO a `GameCompletionModal` extracted from SchedulePage (in `src/pages/schedule/GameCompletionModal.jsx`). Check if these are the same or different. If different, name this one `GamePrepCompletionModal.jsx` to avoid confusion.

#### Extraction instructions:

**GameCard.jsx:**
```javascript
// Imports needed:
import { Calendar, MapPin, Clock, ChevronRight, ClipboardList, BarChart3, Trophy } from '../../constants/icons'

// No hooks needed — receives all data as props
// Export: export default GameCard
```

**SetScoreInput.jsx:**
```javascript
// No imports needed (pure component)
// Export: export default SetScoreInput
```

**PeriodScoreInput.jsx:**
```javascript
// No imports needed (pure component)
// Export: export default PeriodScoreInput
```

**GameCompletionModal.jsx (GamePrep version):**
```javascript
// Imports needed:
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { X, Check, Trophy, Star, Users } from '../../constants/icons'
import SetScoreInput from './SetScoreInput'
import PeriodScoreInput from './PeriodScoreInput'
import { getSportConfig } from '../../components/games/GameComponents'

// Export: export default GameCompletionModal
```

**Update GamePrepPage.jsx imports:**
```javascript
import GameCard from './GameCard'
import GameCompletionModal from './GameCompletionModal' // or GamePrepCompletionModal
```

**Commit after each extraction:**
```bash
git add -A && git commit -m "Extract GameCard from GamePrepPage"
git add -A && git commit -m "Extract SetScoreInput from GamePrepPage"
git add -A && git commit -m "Extract PeriodScoreInput from GamePrepPage"
git add -A && git commit -m "Extract GameCompletionModal from GamePrepPage"
```

### C. Extract Large Components from GameDayCommandCenter

GameDayCommandCenter has 10+ components in 1,826 lines. Extract the largest ones:

| Component | Lines | Size | Extract To |
|-----------|-------|------|-----------|
| `CourtPlayerCard` | 270-425 | 156 lines | `src/pages/gameprep/CourtPlayerCard.jsx` |
| `BenchPlayerCard` | 428-493 | 66 lines | Keep (small) |
| `StatPickerModal` | 496-583 | 88 lines | Keep (small) |
| `Scoreboard` | 586-728 | 143 lines | `src/pages/gameprep/Scoreboard.jsx` |
| `QuickStatsPanel` | 731-841 | 111 lines | Keep (medium but tightly coupled) |
| `ActionBar` | 844-967 | 124 lines | Keep (medium) |
| `PostGameSummary` | 970-1170 | 201 lines | `src/pages/gameprep/PostGameSummary.jsx` |

Extract the 3 largest: CourtPlayerCard, Scoreboard, PostGameSummary.

All of these use the custom `theme` object from `useGameDayTheme()`. The theme object must be passed as a prop:

```javascript
// Each extracted component signature:
function CourtPlayerCard({ /* existing props */, theme }) { ... }
function Scoreboard({ /* existing props */, theme }) { ... }
function PostGameSummary({ /* existing props */, theme }) { ... }
```

**Commit after each:**
```bash
git add -A && git commit -m "Extract CourtPlayerCard from GameDayCommandCenter"
git add -A && git commit -m "Extract Scoreboard from GameDayCommandCenter"
git add -A && git commit -m "Extract PostGameSummary from GameDayCommandCenter"
```

### D. Minor Polish

After extraction, do a quick polish pass:

1. **GamePrepPage gpStyles block:** Remove the font `@import` line. Keep the CSS classes (`.gp-wrap`, `.gp-card`, `.gp-label`) — they define the tactical theme.

2. **GameDayCommandCenter font injection (lines 7-13):** Remove the `document.createElement('link')` block. Replace with a check or rely on GamePrepPage loading it:
```javascript
// Delete lines 7-13 entirely, or replace with:
// Fonts loaded by GamePrepPage (parent context)
```

3. **Verify the helper functions** (`formatTime12`, `formatDate`, `isToday`, `isTomorrow` in GamePrepPage) aren't duplicated from SchedulePage. If they are, consider importing from a shared `scheduleHelpers.jsx` instead. But do NOT make this change if it would require touching SchedulePage — leave as-is for now.

**Final commit:**
```bash
git add -A && git commit -m "Grouping 6 complete: GamePrep + CommandCenter extracted and cleaned"
git push
```

---

## FILE STRUCTURE AFTER

```
src/pages/gameprep/
├── GamePrepPage.jsx              (~500 lines — down from 1,680)
├── GameDayCommandCenter.jsx      (~1,200 lines — down from 1,826)
├── GameCard.jsx                  (NEW — 193 lines)
├── SetScoreInput.jsx             (NEW — 146 lines)
├── PeriodScoreInput.jsx          (NEW — 211 lines)
├── GameCompletionModal.jsx       (NEW — 563 lines, or GamePrepCompletionModal.jsx)
├── CourtPlayerCard.jsx           (NEW — 156 lines)
├── Scoreboard.jsx                (NEW — 143 lines)
└── PostGameSummary.jsx           (NEW — 201 lines)
```

---

## VERIFICATION CHECKLIST

### GamePrepPage
- [ ] Page loads with dark tactical background + blue grid
- [ ] Tactical fonts (Bebas Neue headings, Rajdhani labels) render
- [ ] Team selector works
- [ ] Upcoming tab shows game cards
- [ ] Results tab shows past games
- [ ] Click a game → detail panel works
- [ ] "Set Lineup" button → AdvancedLineupBuilder opens
- [ ] "Complete Game" button → GameCompletionModal opens
- [ ] Score entry works (both set-based and period-based)
- [ ] Game completion saves correctly
- [ ] "Enter Stats" button → GameStatsModal opens
- [ ] "Game Day" button → GameDayCommandCenter opens
- [ ] Stats pending banner shows and clicking enters stats

### GameDayCommandCenter
- [ ] Opens in full dark tactical mode
- [ ] Court visualization renders with player positions
- [ ] Drag players between court and bench
- [ ] Score updates work
- [ ] Stat picker modal opens when clicking a player
- [ ] Quick stats panel shows live tallies
- [ ] Action bar buttons work (timeout, substitution, etc.)
- [ ] Post-game summary renders when game completes
- [ ] Close button returns to GamePrep

---

## NOTE ON SESSION PLANNING

This grouping is **extraction-only, no restyling**. The dark tactical theme stays. The goal is purely maintainability — breaking 3,500 lines across 2 files into manageable pieces. This should be **one CC session, 30-45 minutes**.
