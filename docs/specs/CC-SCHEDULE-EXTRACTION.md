# CC-SCHEDULE-EXTRACTION.md
## Phase 1: Extract SchedulePage.jsx Modals into Separate Files

**Date:** February 27, 2026
**Repo:** `volleybrain-admin` (GitHub: SgtxTorque/volleybrain-admin)
**Goal:** Extract 9 components out of `SchedulePage.jsx` (3,822 lines) into individual files. **ZERO visual changes.** Just reorganization.

---

## ⛔ RULES

1. **Read CLAUDE.md and DATABASE_SCHEMA.md before doing anything.**
2. **ZERO visual/functional changes.** Every modal, button, form, query must work identically after extraction.
3. **Do NOT change any Tailwind classes, any Supabase queries, any state logic.** Copy code verbatim.
4. **Git commit after each file extraction** so we can revert safely if needed.
5. **Test `npm run dev` after every extraction** — no console errors.
6. **Each new file needs its own imports** — trace what each component uses and add only the needed imports.

---

## CURRENT STATE

`src/pages/schedule/SchedulePage.jsx` — 3,822 lines, contains these components:

| Component | Lines | Size | New File |
|-----------|-------|------|----------|
| `LineupBuilder` | 25–316 | 292 lines | `LineupBuilder.jsx` |
| `SetScoreInput` | 323–441 | 119 lines | `GameCompletionModal.jsx` (keep with GameCompletion) |
| `SCORING_CONFIGS` | 444–490 | 47 lines | `GameCompletionModal.jsx` (keep with GameCompletion) |
| `GameCompletionModal` | 492–958 | 467 lines | `GameCompletionModal.jsx` |
| `SchedulePage` | 963–1666 | 704 lines | **STAYS in SchedulePage.jsx** |
| `AddEventModal` | 1673–1849 | 177 lines | `AddEventModal.jsx` |
| `BulkPracticeModal` | 1854–2194 | 341 lines | `BulkPracticeModal.jsx` |
| `BulkGamesModal` | 2199–2355 | 157 lines | `BulkGamesModal.jsx` |
| `VenueManagerModal` | 2360–2430 | 71 lines | `VenueManagerModal.jsx` |
| `AvailabilitySurveyModal` | 2435–2699 | 265 lines | `AvailabilitySurveyModal.jsx` |
| `EventDetailModal` | 2704–3788 | 1,085 lines | `EventDetailModal.jsx` |
| `DetailItem` | 3791–3798 | 8 lines | `EventDetailModal.jsx` (keep together) |
| `VolunteerSlot` | 3800–3819 | 20 lines | `EventDetailModal.jsx` (keep together) |

**After extraction, SchedulePage.jsx should be ~704 lines** (just the main component + imports).

---

## EXTRACTION INSTRUCTIONS (Do these in order)

### Step 0: Commit current state
```bash
cd /path/to/volleybrain-admin
git add -A && git commit -m "Pre-extraction: SchedulePage.jsx at 3822 lines"
```

---

### Step 1: Create `src/pages/schedule/LineupBuilder.jsx`

**Extract lines 25–316 from SchedulePage.jsx.**

This component needs these imports (trace from usage):
```javascript
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { X } from '../../constants/icons'
import { getSportConfig } from '../../components/games/GameComponents'
```

Export:
```javascript
export default LineupBuilder
```

**Commit:**
```bash
git add -A && git commit -m "Extract LineupBuilder from SchedulePage into own file"
```

---

### Step 2: Create `src/pages/schedule/GameCompletionModal.jsx`

**Extract lines 322–958 from SchedulePage.jsx.** This includes:
- `SetScoreInput` function (lines 323–441) — internal component, NOT exported
- `SCORING_CONFIGS` object (lines 444–490) — internal constant, NOT exported
- `GameCompletionModal` function (lines 492–958) — the main export

This component needs these imports:
```javascript
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { X, Check, Award } from '../../constants/icons'
```

Note: `SetScoreInput` and `SCORING_CONFIGS` are only used inside `GameCompletionModal`, so they stay in the same file as unexported helpers.

Export:
```javascript
export default GameCompletionModal
```

**Commit:**
```bash
git add -A && git commit -m "Extract GameCompletionModal from SchedulePage into own file"
```

---

### Step 3: Create `src/pages/schedule/AddEventModal.jsx`

**Extract lines 1673–1849 from SchedulePage.jsx.**

Imports needed:
```javascript
import { useState } from 'react'
```

No context imports needed — this component only uses props (`teams`, `venues`, `onClose`, `onCreate`).

Export:
```javascript
export default AddEventModal
```

**Commit:**
```bash
git add -A && git commit -m "Extract AddEventModal from SchedulePage into own file"
```

---

### Step 4: Create `src/pages/schedule/BulkPracticeModal.jsx`

**Extract lines 1854–2194 from SchedulePage.jsx.**

Imports needed:
```javascript
import { useState, useEffect } from 'react'
import { X } from '../../constants/icons'
```

Export:
```javascript
export default BulkPracticeModal
```

**Commit:**
```bash
git add -A && git commit -m "Extract BulkPracticeModal from SchedulePage into own file"
```

---

### Step 5: Create `src/pages/schedule/BulkGamesModal.jsx`

**Extract lines 2199–2355 from SchedulePage.jsx.**

Imports needed:
```javascript
import { useState } from 'react'
import { X } from '../../constants/icons'
```

Export:
```javascript
export default BulkGamesModal
```

**Commit:**
```bash
git add -A && git commit -m "Extract BulkGamesModal from SchedulePage into own file"
```

---

### Step 6: Create `src/pages/schedule/VenueManagerModal.jsx`

**Extract lines 2360–2430 from SchedulePage.jsx.**

Imports needed:
```javascript
import { useState } from 'react'
import { X } from '../../constants/icons'
```

Export:
```javascript
export default VenueManagerModal
```

**Commit:**
```bash
git add -A && git commit -m "Extract VenueManagerModal from SchedulePage into own file"
```

---

### Step 7: Create `src/pages/schedule/AvailabilitySurveyModal.jsx`

**Extract lines 2435–2699 from SchedulePage.jsx.**

Imports needed:
```javascript
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { X } from '../../constants/icons'
```

Export:
```javascript
export default AvailabilitySurveyModal
```

**Commit:**
```bash
git add -A && git commit -m "Extract AvailabilitySurveyModal from SchedulePage into own file"
```

---

### Step 8: Create `src/pages/schedule/EventDetailModal.jsx`

**Extract lines 2704–3819 from SchedulePage.jsx.** This includes:
- `EventDetailModal` function (lines 2704–3788)
- `DetailItem` helper (lines 3791–3798) — keep in same file, unexported
- `VolunteerSlot` helper (lines 3800–3819) — keep in same file, unexported

This is the biggest component. It references several other components that need importing:

```javascript
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  Users, Edit, X, Check, CheckSquare, ClipboardList, User, Star, Share2
} from '../../constants/icons'
import { PlayerCard, PlayerCardExpanded } from '../../components/players'
import { ClickableCoachName, CoachDetailModal } from '../../pages/coaches/CoachesPage'
import { getEventColor, formatTime12 } from './scheduleHelpers'
import LineupBuilder from './LineupBuilder'
import GameCompletionModal from './GameCompletionModal'
```

**IMPORTANT:** `EventDetailModal` renders `<LineupBuilder>` and `<GameCompletionModal>` inside itself (lines 3753–3785). Since those are now separate files, they need to be imported into `EventDetailModal.jsx`.

Export:
```javascript
export default EventDetailModal
```

**Commit:**
```bash
git add -A && git commit -m "Extract EventDetailModal from SchedulePage into own file"
```

---

### Step 9: Rebuild `SchedulePage.jsx` as thin shell

Now **remove** all the extracted code from SchedulePage.jsx. The file should only contain:
1. Imports (including new imports for extracted components)
2. The `SchedulePage` function (lines 963–1666)
3. The export at the bottom

**New imports to add at top of SchedulePage.jsx:**
```javascript
import LineupBuilder from './LineupBuilder'
import GameCompletionModal from './GameCompletionModal'
import AddEventModal from './AddEventModal'
import BulkPracticeModal from './BulkPracticeModal'
import BulkGamesModal from './BulkGamesModal'
import VenueManagerModal from './VenueManagerModal'
import AvailabilitySurveyModal from './AvailabilitySurveyModal'
import EventDetailModal from './EventDetailModal'
```

**Imports to REMOVE** (no longer directly used in SchedulePage — they're used by extracted components):
- `PlayerCard`, `PlayerCardExpanded` — used by EventDetailModal, not SchedulePage
- `ClickableCoachName`, `CoachDetailModal` — used by EventDetailModal, not SchedulePage
- `getSportConfig`, `SPORT_CONFIGS` — used by LineupBuilder/GameCompletion

**Keep these imports** (still used by SchedulePage itself):
```javascript
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useJourney } from '../../contexts/JourneyContext'
import { useParentTutorial } from '../../contexts/ParentTutorialContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  ChevronLeft, ChevronRight, BarChart3, Share2
} from '../../constants/icons'
import { SkeletonSchedulePage } from '../../components/ui'
import SchedulePosterModal from './SchedulePosterModal'
import GameDayShareModal from './GameDayShareModal'
import { getEventColor, formatTime, formatTime12, VolleyballIcon } from './scheduleHelpers'
import { MonthView, WeekView, DayView, ListView } from './CalendarViews'
```

**The export line stays:**
```javascript
export { SchedulePage, getEventColor, formatTime, formatTime12 }
```

Note: `getEventColor`, `formatTime`, `formatTime12` are re-exported from `scheduleHelpers` — other parts of the app may import them from SchedulePage. Keep these re-exports to avoid breaking imports elsewhere.

**Commit:**
```bash
git add -A && git commit -m "Phase 1 complete: SchedulePage.jsx reduced from 3822 to ~720 lines"
```

---

## VERIFICATION CHECKLIST

After all extractions, verify:

- [ ] `npm run dev` starts without errors
- [ ] No red console errors in browser
- [ ] Navigate to Schedule page — calendar renders
- [ ] Change calendar view (month/week/day/list)
- [ ] Click an event — EventDetailModal opens with all tabs
- [ ] Click "Add Events" — all modals open (single, bulk practice, bulk games, venue manager, availability survey)
- [ ] If a game event exists — Lineup Builder opens from Game Prep tab
- [ ] Share & Export dropdown works
- [ ] All data still loads (events, teams, RSVPs, roster, volunteers)

---

## FILE STRUCTURE AFTER EXTRACTION

```
src/pages/schedule/
├── SchedulePage.jsx          (~720 lines — main page shell)
├── CalendarViews.jsx         (354 lines — unchanged)
├── scheduleHelpers.jsx       (unchanged)
├── LineupBuilder.jsx         (NEW — ~292 lines)
├── GameCompletionModal.jsx   (NEW — ~637 lines, includes SetScoreInput + SCORING_CONFIGS)
├── AddEventModal.jsx         (NEW — ~177 lines)
├── BulkPracticeModal.jsx     (NEW — ~341 lines)
├── BulkGamesModal.jsx        (NEW — ~157 lines)
├── VenueManagerModal.jsx     (NEW — ~71 lines)
├── AvailabilitySurveyModal.jsx (NEW — ~265 lines)
├── EventDetailModal.jsx      (NEW — ~1,105 lines, includes DetailItem + VolunteerSlot)
├── SchedulePosterModal.jsx   (unchanged)
├── GameDayShareModal.jsx     (unchanged)
├── CoachAvailabilityPage.jsx (unchanged)
└── index.js                  (unchanged)
```

---

## WHAT COMES NEXT (Phase 2 — separate session)

After this extraction is verified working, the next handoff doc will cover:
- Apply new design system to SchedulePage shell (bg-slate-50, white cards, rounded-2xl, shadow-sm)
- Apply new design system to each extracted modal
- Consistent form inputs, buttons, headers across all modals
- Mobile-web parity styling

**Do NOT do Phase 2 in this session.** Extract first, verify, then restyle.
