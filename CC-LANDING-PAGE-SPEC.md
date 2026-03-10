# CC-LANDING-PAGE: Replace Login Screen with Lynx Beta Landing Page

## Context

The Lynx web admin (`volleybrain-admin`) currently shows a basic login form when a user is not authenticated. The flow lives in `src/App.jsx` inside the `AppContent` component:

```
if (!user) return <LoginPage />
```

`LoginPage` is defined in `src/pages/auth/LoginPage.jsx` — it's a simple email/password form on a dark background with the old VolleyBrain branding (volleyball emoji, yellow/gold button).

We need to replace this with a full Lynx-branded beta landing page that includes marketing copy, mascot imagery, feature highlights, and then routes to login/signup.

## What To Do

### 1. Create `src/pages/auth/LandingPage.jsx`

Build a new React component that serves as the public-facing landing page when no user is authenticated. This is a **single-file React component** — all styles inline or in a `<style>` tag within the component.

**Page structure (top to bottom, in this exact order):**

1. **Sticky Nav Bar**
   - Left: Lynx logo (`lynx-logo.png` from `public/` assets) + "Early Access" pill badge (sky blue gradient)
   - Right: "Log In" text link + "Secure Your Spot" solid button (navy bg)
   - White background with blur backdrop, thin bottom border

2. **Big Logo Section**
   - Centered Lynx logo, large (height ~100px), with drop shadow
   - Serves as a brand statement piece

3. **Get Started Card** (white card, full width within max-width container)
   - Left side: "Beta Now Live" eyebrow pill → "Your club. Powered up." headline → description paragraph → two CTAs: "Secure Your Spot on the Roster →" (sky blue) and "Log In" (outline)
   - Right side: Dark navy card (gradient: `#0B1628` → `#10284C` → `#163A6A`) containing the celebrating mascot image with floating badge elements around it (Game Day Ready, Beta Tester, Rosters Live, Player Stats)

4. **Feature Card** (white card)
   - Header: "Built for every role on the team."
   - 2×2 grid of feature sub-cards on light gray backgrounds:
     - **Admin Command Center** — "Run the show. See everything." + tags: Registration, Payments, Season Setup, Org Dashboard
     - **Coach's Toolkit** — "Your assistant coach — in your pocket." + tags: Lineup Builder, Player Evals, Game Day, Attendance
     - **Parent Hub** — "Two taps. Done." + tags: Schedule, RSVP, Payments, Shoutouts
     - **Player Experience** — "Every athlete deserves to be seen." + tags: XP & Badges, Challenges, Streaks, Leaderboard

5. **One Platform Card** (dark navy card)
   - Left: Celebrating mascot image
   - Right: "One platform. Every whistle to every trophy." + feature list copy + "Get In Early →" button

6. **Starting Lineup Card** (dark navy card)
   - Left: Laptop mascot image
   - Right: "You're in the starting lineup. ⭐" + beta tester messaging + perk pills (Early Access, Direct Feedback Line, Shape the Roadmap, Founding Tester Badge)

7. **Family Card** (light gray card)
   - Left: Lynx family image (cropped from family sprite sheet) + fist bump image
   - Right: "Built for clubs. Powered by families." + community copy

8. **Footer**
   - Centered logo (small, 50% opacity) + "© 2026 Lynx · thelynxapp.com · Powered by data. Driven by heart."

**Design tokens (use throughout):**
```
Navy: #0B1628
Navy Mid: #10284C
Sky Blue: #5BCBFA
Gold: #FFD700
Gold Dark: #D4A800
Off White: #F4F7FA
Font: 'Plus Jakarta Sans' (import from Google Fonts)
Border radius: 28px for cards, 100px for pills/buttons, 18px for sub-cards
```

**CTA behavior:**
- "Secure Your Spot on the Roster →", "Get In Early →", "Secure Your Spot" nav button → all call `onNavigate('signup')`
- "Log In" buttons/links → all call `onNavigate('login')`

**Component signature:**
```jsx
export function LandingPage({ onNavigate }) {
  // onNavigate('login') → show login form
  // onNavigate('signup') → show signup form
  return ( ... )
}
```

### 2. Add Mascot/Brand Assets to `public/`

Ensure these image files exist in `public/images/` (or `public/assets/`):
- `lynx-logo.png` — horizontal logo with wordmark
- `lynx-icon-logo.png` — icon only
- `celebrate-mascot.png` — celebrating lynx cub (#10 jersey) **with transparent background, no black**
- `laptop-mascot.png` — lynx cub sitting with laptop **with transparent background, no black**
- `lynx-family.png` — cropped family group from sprite sheet
- `fistbump.png` — two lynx cubs fist bumping

**CRITICAL:** All mascot PNGs must have transparent backgrounds. The originals have black backgrounds that need to be removed before placing in the repo. The landing page HTML file delivered separately (`lynx-landing-v3.html`) contains properly cleaned base64 versions of all images — extract them from there if needed by decoding the base64 `src` attributes.

### 3. Update `src/App.jsx` — Route Through Landing Page

Current flow in `AppContent`:
```jsx
if (!user) return <LoginPage />
```

New flow:
```jsx
const [authView, setAuthView] = useState('landing') // 'landing' | 'login' | 'signup'

if (!user) {
  if (authView === 'login') return <LoginPage onBack={() => setAuthView('landing')} />
  if (authView === 'signup') return <SignupPage onBack={() => setAuthView('landing')} />
  return <LandingPage onNavigate={setAuthView} />
}
```

### 4. Update `LoginPage.jsx` — Add Back Button + Rebrand

The existing `LoginPage` needs:
- A "← Back" link/button at the top that calls `onBack()` to return to the landing page
- Rebrand from VolleyBrain to Lynx: replace volleyball emoji with Lynx icon logo, update title text, use Lynx color palette (navy background, sky blue accents instead of yellow/gold)
- Keep all existing auth logic (`signIn`, error handling, etc.) unchanged

**Updated component signature:**
```jsx
export function LoginPage({ onBack }) { ... }
```

### 5. Update `SignupPage.jsx` — Add Back Button (if exists)

If `SignupPage` exists, add the same `onBack` prop and back navigation. If it doesn't exist yet, this is a future task — for now, the "signup" CTA can route to login with a note that signup is coming.

### 6. Update Auth Imports

In `src/pages/auth/index.js`, add:
```js
export { LandingPage } from './LandingPage'
```

In `App.jsx`, update imports:
```js
import { LoginPage, SignupPage, SetupWizard, LandingPage } from './pages/auth'
```

## Files to Read Before Starting

Read every file before modifying:
- `src/App.jsx` — understand current auth routing
- `src/pages/auth/LoginPage.jsx` — understand current login component
- `src/pages/auth/SignupPage.jsx` — if it exists
- `src/pages/auth/index.js` — auth exports
- `src/contexts/AuthContext.jsx` — understand auth state shape

## Files Created/Modified

| File | Action |
|------|--------|
| `src/pages/auth/LandingPage.jsx` | CREATE — new landing page component |
| `src/pages/auth/LoginPage.jsx` | MODIFY — add onBack prop, rebrand to Lynx |
| `src/pages/auth/index.js` | MODIFY — add LandingPage export |
| `src/App.jsx` | MODIFY — add authView state, route through landing page |
| `public/images/` | CREATE — add all mascot/brand image assets |

## Do NOT Change

- Any authenticated routes or pages
- `MainApp.jsx`
- `AuthContext.jsx` logic
- Supabase auth calls
- Any dashboard or inner page styling

## Voice & Copy Reference

All copy on the landing page uses the Lynx brand voice: direct, warm, specific, action-oriented. Sports language used naturally, not as gimmick. "Secure your spot on the roster" not "Please complete your registration." Reference the delivered HTML file (`lynx-landing-v3.html`) for exact copy.

## Testing

1. Load the app with no auth session → should see landing page
2. Click "Log In" → should see login form with back button
3. Click back → should return to landing page
4. Click "Secure Your Spot" → should route to signup (or login if signup not built)
5. Log in successfully → should see normal dashboard (no changes to authenticated experience)
6. All mascot images should display with transparent backgrounds on both light and dark cards
