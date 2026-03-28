# Parent Player Views — Investigation Report

## 1. Dashboard Button Routing

**File:** `src/pages/roles/ParentDashboard.jsx` (lines 523-524)
**Buttons rendered in:** `src/components/v2/parent/KidCards.jsx` (lines 232-259)

Each child card has two buttons:

```jsx
// KidCards.jsx — button handlers
<button onClick={(e) => { e.stopPropagation(); onViewProfile?.(child.id) }}>Profile</button>
<button onClick={(e) => { e.stopPropagation(); onViewPlayerCard?.(child.id) }}>Player Card</button>
```

```jsx
// ParentDashboard.jsx — callback wiring (lines 523-524)
onViewProfile={(playerId) => onNavigate?.(`player-${playerId}`)}
onViewPlayerCard={(playerId) => onNavigate?.(`player-card-${playerId}`)}
```

**Both pass only the player ID** (no team ID, no season ID).

- **"Profile" button** → page ID `player-{uuid}` → URL `/parent/player/{uuid}` → **ParentPlayerCardPage** (sport stats!)
- **"Player Card" button** → page ID `player-card-{uuid}` → URL `/parent/player/card-{uuid}` → **BROKEN**

---

## 2. Player Card "Not Found" Bug

### Root Cause: Corrupted Player ID in URL

**The routing function in `src/lib/routes.js` (lines 94-101) has no handler for `player-card-` prefix:**

```javascript
// routes.js — getPathForPage()
if (pageId.startsWith('player-profile-')) {
  const playerId = pageId.replace('player-profile-', '')   // ✅ handled
  return `/parent/player/${playerId}/profile`
}
if (pageId.startsWith('player-') && !pageId.startsWith('player-profile-')) {
  const playerId = pageId.replace('player-', '')            // ⚠️ catches player-card-{uuid}
  return `/parent/player/${playerId}`
}
```

**Bug trace for "Player Card" button click:**

1. Dashboard calls `onNavigate('player-card-3bcd1c4e-2d46-4cfc-97fc-723cd575f3a0')`
2. `getPathForPage()` matches second condition (`startsWith('player-')` = true)
3. `.replace('player-', '')` strips only the first `player-` prefix → `'card-3bcd1c4e-2d46-4cfc-97fc-723cd575f3a0'`
4. URL becomes `/parent/player/card-3bcd1c4e-2d46-4cfc-97fc-723cd575f3a0`
5. React Router matches route `/parent/player/:playerId` → `playerId = 'card-3bcd1c4e-...'`
6. `ParentPlayerCardPage` runs: `supabase.from('players').select('*').eq('id', 'card-3bcd1c4e-...')`
7. No player has ID starting with `card-` → returns null → **"Player Not Found"**

### Secondary Issue: Names Are Swapped

Even if the routing were fixed, the button labels are semantically backwards:

| Button Label | Currently Navigates To | Should Navigate To |
|---|---|---|
| "Profile" | ParentPlayerCardPage (sport stats) | PlayerProfilePage (registration/personal info) |
| "Player Card" | BROKEN (corrupted ID) | ParentPlayerCardPage (sport stats / trading card) |

---

## 3. Player Profile Page Content

**File:** `src/pages/parent/PlayerProfilePage.jsx`
**Route:** `/parent/player/:playerId/profile` (page ID: `player-profile-{uuid}`)

This page shows **registration/personal info** across 5 tabs:

| Tab | Content |
|---|---|
| 📋 Registration | First/last name, DOB, gender, grade, school, position, experience level, address, parent/guardian 1 & 2 contacts |
| 👕 Uniform | Jersey number preferences (3 choices), uniform sizes (jersey top, shorts, extras) |
| 🏥 Medical | Medical conditions, allergies, emergency contact (name, phone, relation) |
| 📄 Waivers | Waiver signatures and acceptance status |
| 📅 History | Season history (teams, dates, sport, jersey numbers) |

**Does NOT show:** Sport stats, kills, aces, power levels, badges, achievements, radar charts, or any gamification data.

**Supabase queries:** `players`, `team_players` → `teams` → `seasons` → `sports`, `registrations`

---

## 4. ParentPlayerCardPage Content

**File:** `src/pages/parent/ParentPlayerCardPage.jsx`
**Route:** `/parent/player/:playerId` (page ID: `player-{uuid}`)

This page shows **sport stats and gamification** with tabs:

| Tab | Content |
|---|---|
| Overview | Quick stats view, bar charts per game |
| Stats | Primary stats (kills, digs, aces, blocks, assists for volleyball) |
| Development | Skills with progress bars and trend charts |
| Badges | Achievement badges earned |
| Games | Per-game breakdown |

**Supabase queries (many to potentially non-existent tables):**
- `players` (exists ✅)
- `team_players` → `teams` → `seasons` → `sports` (exists ✅)
- `player_season_stats` (⚠️ may not exist)
- `player_badges` (⚠️ may not exist)
- `player_achievement_progress` (⚠️ may not exist)
- `game_player_stats` (⚠️ may not exist)
- `player_skills` (⚠️ may not exist)
- `player_evaluations` (⚠️ may not exist)
- `player_coach_notes` (⚠️ may not exist)
- `player_goals` (⚠️ may not exist)

**Note:** Even if the player IS found, many sections may show empty because they query tables not documented in DATABASE_SCHEMA.md. Silent failures from missing tables won't crash the page but will render empty widgets.

---

## 4. Mobile Reference

**Mobile reference exists** at `reference/mobile-app/` but contains only git metadata (`.git`, `.vscode`), not source code. However, `MOBILE-FEATURE-AUDIT.md` documents the intended design:

**Mobile Player Card** (`app/player-card.tsx`):
- FIFA-style trading card with XP/OVR rating
- Skill breakdown (passing, serving, hitting, blocking, setting, defense)
- Badges, rarity glow/colors, animated stat bars
- Photo with gradient background

**Mobile Player Dashboard** (player role home):
- Hero Identity Card (name, team, jersey, position, OVR, XP bar)
- Streak/level pills, recent badges, last game stats, shoutouts
- Next event with RSVP, chat peek, quick props

**Mobile "My Stuff"** tab:
- Profile editing, payment history, waiver status, settings, linked players

**Intended split:**
- **"Profile"** = personal/registration data (name, DOB, medical, emergency contacts, waivers)
- **"Player Card"** = FIFA-style trading card with sport stats, XP, badges, skills

---

## 5. Page Routing

**File:** `src/MainApp.jsx`

| Route | Component | Page ID | Allowed Roles |
|---|---|---|---|
| `/parent/player/:playerId/profile` | PlayerProfilePage | `player-profile-{uuid}` | parent, admin, coach |
| `/parent/player/:playerId` | ParentPlayerCardPage | `player-{uuid}` | parent, admin, coach |

**Route wrappers (MainApp.jsx lines 641-649):**
```jsx
function ParentPlayerCardRoute({ roleContext, showToast }) {
  const { playerId } = useParams()
  return <ParentPlayerCardPage playerId={playerId} ... />
}

const PlayerProfileRoute = ({ roleContext, showToast }) => {
  const { playerId } = useParams()
  return <PlayerProfilePage playerId={playerId} ... />
}
```

**Both pages extract `playerId` from URL params correctly.** The problem is upstream — the dashboard constructs the wrong page ID for "Player Card."

---

## 6. Data Flow Comparison

| Aspect | PlayerProfilePage | ParentPlayerCardPage |
|---|---|---|
| ID source | `useParams().playerId` | `useParams().playerId` |
| ID type expected | `players.id` (UUID) | `players.id` (UUID) |
| Primary query | `players.select('*').eq('id', playerId)` | `players.select('*').eq('id', playerId)` |
| Joins | `team_players` → `teams` → `seasons` → `sports` | `team_players` → `teams` → `seasons` → `sports` |
| Additional queries | `registrations` (1 table) | 8 additional tables (many undocumented) |
| "Not Found" trigger | `!player` after query | `!player` after query |

**No ID type mismatch** — both query `players.id` with the same UUID. The bug is purely in the page ID construction: `player-card-{uuid}` has no route handler, so the ID gets corrupted to `card-{uuid}`.

---

## Summary

- **Root cause of "Player Not Found":** The dashboard constructs page ID `player-card-{uuid}`, but `routes.js` has no handler for the `player-card-` prefix. It falls through to the `player-` handler, which strips only `player-` → leaving `card-{uuid}` as the player ID. Supabase finds no player with ID `card-{uuid}`.

- **Is Profile showing the right content?** NO — "Profile" button navigates to `player-{uuid}` which loads **ParentPlayerCardPage** (sport stats). It should load **PlayerProfilePage** (registration/personal info).

- **Is Player Card supposed to show what Profile currently shows?** YES, but reversed — "Player Card" should show the sport stats trading card (ParentPlayerCardPage), and "Profile" should show registration info (PlayerProfilePage).

- **Recommended fix (2 lines):**
  ```jsx
  // ParentDashboard.jsx lines 523-524 — SWAP the page IDs:
  onViewProfile={(playerId) => onNavigate?.(`player-profile-${playerId}`)}    // was: player-${playerId}
  onViewPlayerCard={(playerId) => onNavigate?.(`player-${playerId}`)}          // was: player-card-${playerId}
  ```
  This routes "Profile" → `/parent/player/{uuid}/profile` (PlayerProfilePage) and "Player Card" → `/parent/player/{uuid}` (ParentPlayerCardPage). No changes needed to routes.js or the page components themselves.
