# CC-FIX-PARENT-PLAYER-BUTTONS.md
# Fix Parent Player Card / Profile Button Routing
## Repo: SgtxTorque/volleybrain-admin | Branch: main

---

## OBJECTIVE

The "Profile" and "Player Card" buttons on the Parent Dashboard are swapped AND one has a broken route. Two-line fix.

---

## GUARDRAILS

- **Read before modify.** Open ParentDashboard.jsx and confirm the lines before changing them.
- **Do not touch any other files.** The routes, page components, and KidCards component are all correct. The bug is only in the navigation callbacks.
- **Write report to:** `CC-FIX-PARENT-PLAYER-BUTTONS-REPORT.md` in the project root.
- **Commit after the fix.**

---

## THE FIX

### File: `src/pages/roles/ParentDashboard.jsx`

**Step 1:** Open the file. Find lines 523-524 where `onViewProfile` and `onViewPlayerCard` callbacks are wired:

Current (broken):
```jsx
onViewProfile={(playerId) => onNavigate?.(`player-${playerId}`)}
onViewPlayerCard={(playerId) => onNavigate?.(`player-card-${playerId}`)}
```

**Step 2:** Swap the page IDs:

```jsx
onViewProfile={(playerId) => onNavigate?.(`player-profile-${playerId}`)}
onViewPlayerCard={(playerId) => onNavigate?.(`player-${playerId}`)}
```

This routes:
- "Profile" → `/parent/player/{uuid}/profile` → PlayerProfilePage (registration info, medical, emergency contacts, waivers)
- "Player Card" → `/parent/player/{uuid}` → ParentPlayerCardPage (sport stats, power levels, badges, trading card)

**Step 3:** Verify build: `npm run build 2>&1 | tail -20`

**Commit:** `fix: swap parent profile/player-card button routing — Profile shows registration info, Player Card shows sport stats`

---

## FILES MODIFIED

| File | What Changes |
|------|-------------|
| `src/pages/roles/ParentDashboard.jsx` | Lines 523-524 — swap navigation page IDs |

One file, two lines.
