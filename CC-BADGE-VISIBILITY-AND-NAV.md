# CC-BADGE-VISIBILITY-AND-NAV
## Fix Locked Badge Appearance + Add Achievements Navigation for All Roles

**Run with:** `--dangerously-skip-permissions`
**Repo:** `SgtxTorque/volleybrain-admin`

---

## CONTEXT

Two issues identified on the web admin:

1. **Locked/unearned badges are too dark.** Currently they render as nearly-black rectangles — users can't see the badge art and have no motivation to chase them. Fix: show the full badge art at ~70% opacity with a small lock icon overlay in the bottom-right corner.

2. **No way to access Achievements page for most roles.** Only Parent can reach it via a dashboard card. Player, Coach, Admin, and Team Manager have no sidebar link or dashboard card for Achievements. Fix: add sidebar nav link + dashboard card for ALL roles.

---

## PHASE 1: INVESTIGATION

### Step 1.1 — Find the locked badge rendering logic
Search the codebase for where badge/achievement images are rendered with the "locked" or "unearned" visual treatment. Look for:
- CSS filters like `brightness`, `saturate`, `grayscale`, `opacity` applied to badge images
- Class names like `locked`, `unearned`, `disabled`, `inactive` on badge/achievement components
- Conditional rendering based on `isUnlocked`, `isEarned`, `earned`, `unlocked`, `progress`, etc.
- Components in paths like `achievements/`, `badges/`, `trophy/`, `rewards/`

Key files to check:
- Any component rendering the achievement grid (the page shown in the screenshot)
- Achievement card/tile component
- Achievement detail modal (the "200 CLUB" popup shown in screenshot)
- Badge display components shared between pages

### Step 1.2 — Find the Achievements page and its route
- What route/path is the Achievements page on? (e.g., `/achievements`, `/badges`, `/trophy-case`)
- Which component renders it?
- Is it role-gated? Does it check the user's role before rendering?
- Is it registered in the router for all roles or only specific ones?

### Step 1.3 — Find sidebar navigation config
- Where is the sidebar navigation defined? (likely a config array or component)
- How are nav items structured? (label, icon, path, roles/permissions)
- Where is the Parent dashboard card that links to Achievements?
- Are there dashboard card components for other roles that could be extended?

### Step 1.4 — Find the dashboard card component
- Locate the dashboard/home page for each role
- Identify the card component used for the Parent's "Trophy Case" / Achievements link
- Check if other roles have dashboard pages that can accept a similar card

**Write findings to `CC-BADGE-VISIBILITY-AND-NAV-REPORT.md`. Include file paths, line numbers, and current logic for each finding.**

**STOP HERE — wait for Carlos to review before making changes.**

---

## PHASE 2: FIX LOCKED BADGE APPEARANCE

### The change
Replace the current dark/hidden treatment with Option C: Full color + lock overlay.

### Visual specification

**Unlocked badges:**
- Display at 100% opacity, no filters
- No overlay icon
- No changes needed (keep as-is)

**Locked/unearned badges:**
- Display at **70% opacity** (`opacity: 0.7`)
- Remove ALL existing filters (no `grayscale`, no `brightness(0.15)`, no `saturate(0)`)
- Add a **small lock icon** in the bottom-right corner of the badge image
- Lock icon specs:
  - Position: bottom-right corner of the badge container, offset ~4px from edges
  - Size: ~20px circle background
  - Background: `#1E293B` (Lynx midnight) with `#475569` border
  - Lock shape: simple padlock in `#94A3B8` (slate gray)
  - The lock should be a small SVG or CSS-drawn element overlaid on the badge
  - It should NOT be part of the badge image itself — it's a UI overlay

### Implementation approach

**Option A (preferred): CSS-only approach**
```css
/* Locked badge container */
.badge-locked {
  opacity: 0.7;
  position: relative;
}

/* Remove any existing dark filters */
.badge-locked img {
  filter: none;
}

/* Lock overlay */
.badge-locked::after {
  content: '';
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background-image: url("data:image/svg+xml,..."); /* inline SVG lock */
  background-size: contain;
}
```

**Option B: React component approach**
If the badge is rendered as a React component, wrap the image in a container that conditionally shows the lock:

```jsx
<div className={`badge-container ${!earned ? 'badge-locked' : ''}`}>
  <img src={badgeImageUrl} alt={badgeName} />
  {!earned && <LockOverlay />}
</div>
```

The `LockOverlay` is a small absolutely-positioned SVG:
```jsx
const LockOverlay = () => (
  <div style={{
    position: 'absolute', bottom: 4, right: 4,
    width: 20, height: 20, borderRadius: '50%',
    background: '#1E293B', border: '1px solid #475569',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  }}>
    <svg width="10" height="12" viewBox="0 0 10 12">
      <rect x="1" y="5" width="8" height="6" rx="1.5" fill="#94A3B8"/>
      <path d="M3 5 V3.5 a2 2 0 0 1 4 0 V5" fill="none" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  </div>
);
```

### Where to apply
Apply this treatment EVERYWHERE locked badges appear:
1. Achievement grid page (the main gallery of all badges)
2. Achievement detail modal (the popup when you click a badge)
3. Any badge display on dashboard cards
4. Any badge display in player profiles / trophy cases
5. Mobile components if shared (check if web components are shared with mobile)

### What to remove
- Remove `grayscale(100%)` or `grayscale(1)`
- Remove `brightness(0.1)` or `brightness(0.15)` or any extreme darkening
- Remove `saturate(0)` 
- Remove any `filter` property on locked badges entirely
- Remove any `background: black` or very dark overlays on locked badge containers

### Hover behavior (nice to have)
When hovering a locked badge:
- Bump opacity to 0.85 (subtle brighten on hover)
- Show tooltip: "Complete {threshold} {stat_key} to unlock" or similar
- This gives users a preview of what they're chasing

---

## PHASE 3: ADD ACHIEVEMENTS TO SIDEBAR NAVIGATION

### Step 3.1 — Add sidebar link
Add an "Achievements" link to the sidebar navigation for ALL roles:
- **Label:** "Achievements"  
- **Icon:** Trophy icon (use whatever icon library the project uses — likely Lucide or Heroicons. Use `Trophy` or `Award` icon)
- **Path:** Whatever the existing Achievements page route is (found in Phase 1)
- **Roles:** ALL roles — player, coach, parent, admin, team_manager
- **Position:** Place it in a logical spot:
  - For Player/Coach: near other engagement items (if any) or after the main section
  - For Admin/TM: in a secondary section, after operational items
  - For Parent: keep existing placement, ensure it's consistent with other roles

### Step 3.2 — Ensure the Achievements page works for all roles
- If the page is currently role-gated (only rendering for parent), remove the gate or expand it to all roles
- The page should show achievements filtered to the viewing user's role automatically
- If `target_role` filtering is already in place, verify it works for each role
- Universal achievements (`target_role = 'all'`) should appear for every role

---

## PHASE 4: ADD ACHIEVEMENTS DASHBOARD CARD FOR ALL ROLES

### Step 4.1 — Identify or create the dashboard card
Find the existing "Trophy Case" or Achievements card on the Parent dashboard. Replicate it (or a similar version) for every role's dashboard/home page.

### Card specification
The card should show:
- **Title:** "Trophy Case" or "Achievements"
- **Badge preview:** Show 3 most recently earned badges (the small circular thumbnails visible in the screenshot). If none earned, show 3 locked badges as preview.
- **Progress bar or count:** "X / Y achievements earned" or "X badges collected"
- **XP display:** Current XP and level (from the engagement system)
- **CTA:** "TROPHY CASE →" link that navigates to the Achievements page

### Step 4.2 — Add card to each role's dashboard
- **Player Home:** Add the card (check if Player has a dashboard/home page on web)
- **Coach Dashboard:** Add the card in an appropriate grid position
- **Admin Dashboard:** Add the card (lower priority position — admin dashboards are ops-focused)
- **Team Manager Dashboard:** Add the card
- **Parent Dashboard:** Already has it — verify it's working correctly with V3 badges

### Card data query
The card needs:
```sql
-- Count earned vs total for the user's role
SELECT 
  COUNT(*) as total_achievements,
  COUNT(CASE WHEN pa.earned_at IS NOT NULL THEN 1 END) as earned_count
FROM achievements a
LEFT JOIN player_achievements pa ON pa.achievement_id = a.id AND pa.player_id = '{user_id}'
WHERE a.target_role = '{user_role}' OR a.target_role = 'all';

-- 3 most recent earned badges for preview
SELECT a.name, a.badge_image_url, pa.earned_at
FROM player_achievements pa
JOIN achievements a ON a.id = pa.achievement_id
WHERE pa.player_id = '{user_id}'
ORDER BY pa.earned_at DESC
LIMIT 3;
```

Adapt to whatever data fetching pattern the project uses (likely Supabase client queries in React hooks).

---

## PHASE 5: VERIFICATION

### Step 5.1 — Visual check
After changes, verify:
1. Navigate to Achievements page as each role (admin, coach, player, parent, team_manager)
2. Confirm locked badges show full color art at reduced opacity with lock icon
3. Confirm unlocked badges show at full opacity with no lock
4. Click a locked badge — modal should also show the badge at reduced opacity with lock
5. Check the sidebar — "Achievements" link appears for all roles
6. Check each role's dashboard — Trophy Case card appears and links correctly

### Step 5.2 — TypeScript check
```bash
npx tsc --noEmit
```

### Step 5.3 — No regressions
- Verify the achievement detail modal still works (progress bar, track button, close button)
- Verify badge images load correctly (V3 URLs from the deploy we just did)
- Verify earned badges show correctly (no lock, full opacity)

---

## CRITICAL RULES

1. **Do NOT change badge image URLs** — we just deployed those, they're correct
2. **Do NOT modify the achievements table** — only UI changes in this spec
3. **The lock overlay is a UI element, NOT baked into the image** — it's CSS/React, not image processing
4. **Test all 5 roles** — don't assume one role's fix works for all
5. **Commit after Phase 2** (badge visibility), then again after **Phase 3+4** (navigation)
6. **Write report to `CC-BADGE-VISIBILITY-AND-NAV-REPORT.md`**
