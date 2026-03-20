# CC-HELPER-BETA-LIGHTMODE.md
# Setup Helper Button + Beta Tester Badge + Light Mode Default
# March 9, 2026

## ⚠️ MANDATORY RULES

1. Read every file fully before modifying.
2. Do NOT touch SetupWizard.jsx, LandingPage.jsx, or LoginPage.jsx.
3. Do NOT refactor or reorganize any existing code.
4. All mascot images have transparent backgrounds — NEVER add dark containers behind them.

---

## FEATURE 1: Default to Light Mode for New Users

### File: `src/contexts/ThemeContext.jsx`

**Current (line ~14):**
```js
const [theme, setTheme] = useState(() => localStorage.getItem('vb_theme') || 'dark')
```

**Change to:**
```js
const [theme, setTheme] = useState(() => localStorage.getItem('vb_theme') || 'light')
```

That's it. One word change. New users who have never toggled the theme will see light mode. Existing users who already have `vb_theme` in localStorage keep their preference.

---

## FEATURE 2: Setup Helper Button (Floating Onboarding Companion)

### What it is
A floating button (bottom-right, left of the existing chat bubble) showing the Lynx mascot. Clicking it opens a slide-out panel with the user's remaining setup steps — a live-updating checklist that persists after the wizard.

### File: Create `src/components/SetupHelper.jsx`

```jsx
import { useState, useEffect } from 'react'
import { useJourney, JOURNEY_STEPS } from '../contexts/JourneyContext'
import { useAuth } from '../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../contexts/ThemeContext'
import { X, ChevronRight, CheckCircle2, Circle } from '../constants/icons'

const STEP_ROUTES = {
  create_org: 'organization',
  create_season: 'seasons',
  add_teams: 'teams',
  add_coaches: 'coaches',
  register_players: 'registrations',
  create_schedule: 'schedule',
  first_game: 'gameprep',
  join_create_team: 'teams',
  add_roster: 'roster',
  assign_coach: 'coaches',
  first_practice: 'schedule',
  complete_profile: 'profile',
  view_roster: 'roster',
  create_lineup: 'gameprep',
  plan_practice: 'schedule',
  game_prep: 'gameprep',
  track_stats: 'gameprep',
  complete_registration: 'parent-register',
  sign_waivers: 'parent-register',
  make_payment: 'payments',
  view_player_card: 'dashboard',
  add_player_photo: 'dashboard',
  view_schedule: 'schedule',
  first_rsvp: 'schedule',
  join_team_chat: 'chats',
  volunteer: 'dashboard',
}

const TIME_ESTIMATES = {
  create_org: '~1 min',
  create_season: '~3 min',
  add_teams: '~2 min',
  add_coaches: '~2 min',
  register_players: '~5 min',
  create_schedule: '~5 min',
  first_game: '~10 min',
}

export default function SetupHelper({ onNavigate }) {
  const [isOpen, setIsOpen] = useState(false)
  const journey = useJourney()
  const { profile } = useAuth()
  const { isDark } = useTheme()
  const tc = useThemeClasses()

  if (!journey || !profile) return null

  const role = journey.journeyData?.currentRole || profile?.onboarding_data?.role || 'org_director'
  const steps = JOURNEY_STEPS[role] || []
  const completedSteps = journey.journeyData?.completedSteps || profile?.onboarding_data?.completed_steps || []
  const remaining = steps.filter(s => !completedSteps.includes(s.id))

  // Hide when all done
  if (remaining.length === 0) return null

  const totalSteps = steps.length
  const doneCount = completedSteps.length
  const pct = Math.round((doneCount / totalSteps) * 100)

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed z-30 flex items-center justify-center group"
        style={{ bottom: 24, right: 80, width: 52, height: 52 }}
        title="Setup Guide"
      >
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-white shadow-lg border-2 border-sky-300 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-110">
            <img src="/images/Meet-Lynx.png" alt="" className="w-10 h-10 object-contain" />
          </div>
          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-full border-2 border-sky-400 animate-ping opacity-30" />
          {/* Badge count */}
          {remaining.length > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
              {remaining.length}
            </div>
          )}
        </div>
      </button>

      {/* Slide-out Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          {/* Panel */}
          <div
            className={`fixed top-0 right-0 z-50 h-full w-[360px] max-w-[90vw] shadow-2xl flex flex-col ${
              isDark ? 'bg-[#0B1628]' : 'bg-white'
            }`}
            style={{ animation: 'slideInRight 0.3s ease-out' }}
          >
            {/* Header */}
            <div className="bg-[#0B1628] px-5 py-4 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-white font-bold text-base">Your Setup Checklist</h3>
                <p className="text-slate-400 text-xs mt-0.5">{doneCount} of {totalSteps} complete</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="px-5 pt-3 pb-2 shrink-0">
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-400 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* Steps list */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
              {steps.map((step) => {
                const isDone = completedSteps.includes(step.id)
                const route = STEP_ROUTES[step.id]
                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition ${
                      isDone
                        ? isDark ? 'bg-teal-500/10' : 'bg-emerald-50'
                        : isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${isDone ? 'line-through opacity-50' : ''} ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        {step.title}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {step.description}
                      </p>
                    </div>
                    {!isDone && route && (
                      <button
                        onClick={() => {
                          setIsOpen(false)
                          onNavigate?.(STEP_ROUTES[step.id])
                        }}
                        className="text-xs font-bold text-sky-500 hover:text-sky-400 whitespace-nowrap flex items-center gap-1"
                      >
                        Go <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                    {!isDone && TIME_ESTIMATES[step.id] && (
                      <span className={`text-xs ${isDark ? 'text-slate-600' : 'text-slate-300'} whitespace-nowrap`}>
                        {TIME_ESTIMATES[step.id]}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Footer mascot */}
            <div className="px-5 py-4 text-center border-t border-slate-200 dark:border-white/10 shrink-0">
              <img src="/images/Meet-Lynx.png" alt="" className="w-16 h-16 mx-auto mb-2 object-contain" />
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {remaining.length === 1 ? 'Almost there! One more step.' : `${remaining.length} steps to go — you've got this!`}
              </p>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  )
}
```

### File: `src/MainApp.jsx`

Add import at the top:
```jsx
import SetupHelper from './components/SetupHelper'
```

Add to the render, right before the closing `</div>` of the main layout (near where the chat bubble lives):
```jsx
<SetupHelper onNavigate={(pageId) => navigate(getPathForPage(pageId))} />
```

---

## FEATURE 3: Beta Tester Badge

### Step 1: Add badge to JourneyContext

**File:** `src/contexts/JourneyContext.jsx`

In the `JOURNEY_BADGES` object, add after the last entry:
```js
beta_tester: {
  id: 'beta_tester',
  icon: '🔍',
  name: 'Beta Tester',
  description: 'Joined Lynx during the beta — thank you for helping us build!',
  rarity: 'legendary',
},
```

### Step 2: Award badge during onboarding

**File:** `src/pages/auth/SetupWizard.jsx`

Find every place where `earned_badges` is set in the `onboarding_data` during profile updates. Add `'beta_tester'` to each array.

For Organization Director path (createOrganization function):
```js
earned_badges: ['founder', 'beta_tester'],
```

For Team Manager path (createIndependentTeam function):
```js
earned_badges: ['team_builder', 'beta_tester'],
```

For invite code / parent / player paths:
```js
earned_badges: ['beta_tester'],
```

For skipOnboarding:
```js
onboarding_data: { skipped: true, completed_at: new Date().toISOString(), earned_badges: ['beta_tester'] },
```

**Search for every `.update({` call in SetupWizard.jsx** that sets `onboarding_data` and make sure `beta_tester` is in the `earned_badges` array. Do NOT miss any path.

### Step 3: Badge display

The existing badge celebration modal and trophy case already read from `earned_badges`. The Beta Tester badge will appear automatically. If the celebration modal only shows one badge, it should queue them and show each one sequentially after the user dismisses.

---

## FILES CREATED/MODIFIED

| File | Action |
|------|--------|
| `src/contexts/ThemeContext.jsx` | MODIFY — change default from 'dark' to 'light' (line 14, one word) |
| `src/components/SetupHelper.jsx` | CREATE — floating helper button + slide-out panel |
| `src/MainApp.jsx` | MODIFY — import and render SetupHelper |
| `src/contexts/JourneyContext.jsx` | MODIFY — add beta_tester badge definition |
| `src/pages/auth/SetupWizard.jsx` | MODIFY — add 'beta_tester' to earned_badges in every onboarding path |

## DO NOT CHANGE

- LandingPage.jsx, LoginPage.jsx
- AuthContext.jsx
- LynxSidebar.jsx (already updated)
- DashboardPage.jsx
- Any other files

## VERIFICATION

| # | Check | Status |
|---|-------|--------|
| 1 | New user sees light mode by default | |
| 2 | Existing users keep their theme preference | |
| 3 | Helper button visible bottom-right (left of chat bubble) | |
| 4 | Helper shows remaining step count badge | |
| 5 | Clicking helper opens slide-out checklist panel | |
| 6 | Completed steps show green checkmark + strikethrough | |
| 7 | "Go →" navigates to the correct page | |
| 8 | Helper disappears when all steps complete | |
| 9 | Beta Tester badge awarded on every signup path | |
| 10 | Badge celebration shows during onboarding | |
| 11 | No console errors | |
