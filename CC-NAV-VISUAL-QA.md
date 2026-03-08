# CC-NAV-VISUAL-QA — Navigation Completeness + Visual QA Audit

**Spec Author:** Claude Opus 4.6
**Date:** March 7, 2026
**Branch:** `feat/desktop-dashboard-redesign`
**Repo:** `SgtxTorque/volleybrain-admin`

---

## BEFORE STARTING

Read these files first:
```bash
cat CLAUDE.md 2>/dev/null
cat LYNX-UX-PHILOSOPHY.md
# Find the brand book
find . -name "LynxBrandBook*" -o -name "lynxbrandbook*" | head -5
# Read it if found
```

---

## CRITICAL RULE FOR NAVIGATION AUDIT

Do NOT just check "does this button link to a page." Check "does this button link to the CORRECT page for what it claims to do."

For every clickable element (button, card, link, nav item, sidebar item, table row):
1. Read the LABEL or CONTEXT of the element (what does it say? what section is it in?)
2. Find the `onClick`, `href`, `navigate`, or `Link` target
3. Open the TARGET file and read what it actually renders
4. Ask: "Does the target page match what the label/context promises?"

**Examples of WRONG:**
- Button says "View Registrations" but navigates to `/payments` — WRONG (label says registrations, goes to payments)
- Card says "Team Standings" but navigates to `/schedule` — WRONG
- "Player Evaluations" link goes to a page that renders a player list with no evaluation form — WRONG (page exists but doesn't match the promised feature)
- Sidebar item "Reports" navigates to `/reports` which renders an empty component or "Coming Soon" with no indication — WRONG (should at minimum show a clear "Coming Soon" state)

**Examples of RIGHT:**
- "View Registrations" → `/registrations` → renders the registration management table — CORRECT
- "Player Evaluations" → `/evaluations` → renders the evaluation form with skill ratings — CORRECT

---

## PHASE 1: Full Route Inventory

### Step 1.1: Find the router config

```bash
# Check common locations
find src -name "MainApp*" -o -name "App*" -o -name "router*" -o -name "routes*" | head -10
grep -rl "createBrowserRouter\|BrowserRouter\|Route \|Routes" src/ --include="*.jsx" --include="*.tsx" --include="*.js" | head -10
```

Read the router file(s).

### Step 1.2: Document every route

For EACH route defined in the app, document:

```
| Route Path | Component | Description | Roles |
|------------|-----------|-------------|-------|
| /          | Dashboard | Role-based dashboard | All |
| /teams     | TeamsPage | Team management | Admin |
| ...        | ...       | ...         | ...   |
```

Include:
- All top-level routes
- All nested routes
- Any dynamic routes (`:id` params)
- Any redirect routes
- Any catch-all / 404 routes

### Step 1.3: Flag any routes that render empty or placeholder components

```bash
# Check for empty/placeholder pages
grep -rn "Coming Soon\|TODO\|Placeholder\|Not Implemented" src/pages/ --include="*.jsx" --include="*.tsx" | head -20
```

**Commit:** `git add -A && git commit -m "phase 1: full route inventory — all routes documented"`

---

## PHASE 2: Sidebar / Nav Audit

### Step 2.1: Read the sidebar component

```bash
cat src/components/layout/LynxSidebar.jsx
```

### Step 2.2: For every nav item, trace the link

For EACH item in the sidebar:
1. Read the label text
2. Find where it navigates to (onClick, Link, navigate)
3. Open the target page component
4. Read what the target page actually renders
5. Mark as:
   - ✅ CORRECT — label matches destination content
   - ❌ WRONG TARGET — navigates to a page that doesn't match the label
   - ⚠️ GOES NOWHERE — onClick is undefined, path doesn't exist, or 404
   - 🔄 GOES TO GENERIC/UNRELATED — goes to a page but the content is unrelated

**Do this for ALL four roles** — the sidebar changes based on role. Check:
- Admin sidebar items
- Coach sidebar items
- Parent sidebar items
- Player sidebar items

### Step 2.3: Check role switcher

Verify the role switcher (pill buttons at top of sidebar):
- Clicking "Admin" switches to admin role and nav
- Clicking "Coach" switches to coach role and nav
- Clicking "Parent" switches to parent role and nav
- Clicking "Player" switches to player role and nav
- The dashboard reloads with the correct role's content

### Step 2.4: Log all findings in a table

```
=== SIDEBAR AUDIT — ADMIN ROLE ===
| Item Label | Nav Target | Target Component | Renders | Status |
|------------|-----------|-----------------|---------|--------|
| Dashboard  | /         | AdminDashboard  | Admin dashboard cards | ✅ |
| Teams      | /teams    | TeamsPage       | Team management table | ✅ |
| Reports    | /reports  | ReportsPage     | Empty page | ⚠️ NEEDS CONTENT |
| ...        | ...       | ...             | ...     | ...    |

=== SIDEBAR AUDIT — COACH ROLE ===
| Item Label | Nav Target | Target Component | Renders | Status |
...

=== SIDEBAR AUDIT — PARENT ROLE ===
...

=== SIDEBAR AUDIT — PLAYER ROLE ===
...
```

**Commit:** `git add -A && git commit -m "phase 2: sidebar nav audit — all roles, all items traced"`

---

## PHASE 3: In-Page Link Audit

### Step 3.1: Audit the 10 most important pages

For each of these pages, trace EVERY clickable element:

1. **Admin Dashboard** — every card button, "Handle >", "Continue >", quick actions, "View All" links
2. **Coach Dashboard** — "START GAME DAY MODE", "Full Roster >", quick actions, journey steps, calendar links
3. **Parent Dashboard** — "Pay Now", "RSVP", "Directions", "Open Chat", quick links, "VIEW HUB", journey steps
4. **Player Dashboard** — "I'M READY", "Team Chat", badge clicks, challenge links
5. **TeamsPage** — "New Team", team row clicks, "View →" wall links, filter buttons
6. **PaymentsPage** — "Record Payment", "Send Reminders", family detail clicks, "Blast All Overdue"
7. **RegistrationsPage** — "Approve", "Deny", "Export CSV", "+ Add Player", player row clicks
8. **SchedulePage** — "Open Game Day", "Manage", "Send RSVP", event clicks, view toggles
9. **RosterManagerPage** — "Evaluate All", "+ Add Player", inline edits, team selector
10. **GameDayCommandCenter** — lineup slot clicks, set tabs, score entry, attendance toggles, "Post-Game Summary"

### Step 3.2: For each clickable element

```
| Page | Element Label | Nav Target | Target Component | Match? |
|------|--------------|-----------|-----------------|--------|
| Admin Dash | "Handle >" (pending reg) | /registrations | RegistrationsPage | ✅ |
| Admin Dash | "Handle >" (overdue pay) | /payments | PaymentsPage | ✅ |
| Admin Dash | "Continue >" (Spring 2026) | /admin/seasons/xxx | SeasonManagement | ✅ |
| Coach Dash | "START GAME DAY MODE" | /gameday | GameDayCommandCenter | ✅ |
| Coach Dash | "Build Lineup" | /gameday | GameDayCommandCenter | ✅ or ❌? |
| Parent Dash | "Pay Now" | /payments | PaymentsPage (parent view) | ✅ |
| Parent Dash | "Directions" | Google Maps URL | External | ✅ |
| ...  | ...          | ...       | ...             | ...    |
```

### Step 3.3: Also check widget library navigation

For every widget that has internal buttons/links, verify:
- The button's `onClick` or navigation target exists
- The target page renders the correct content for what the button claims

### Step 3.4: Log ALL findings

Use the status markers:
- ✅ CORRECT
- ❌ WRONG TARGET (include what it SHOULD go to)
- ⚠️ GOES NOWHERE (onClick undefined, route 404, etc.)
- 🔄 GOES TO GENERIC/UNRELATED (page exists but wrong content)
- 🏗️ PLACEHOLDER (page exists but shows "Coming Soon" or is empty)

**Commit:** `git add -A && git commit -m "phase 3: in-page link audit — all 10 pages, every clickable element traced"`

---

## PHASE 4: Fix Everything Flagged

### Step 4.1: Fix ❌ WRONG TARGET items

For each wrong target, change the navigation to the correct destination. Read the label, determine the correct route, update the onClick/navigate/Link.

### Step 4.2: Fix ⚠️ GOES NOWHERE items

For each dead link:
- If the target page exists but the route isn't set up: add the route
- If the target page doesn't exist: either create a minimal page or change the link to a "Coming Soon" toast/message
- If onClick is undefined: wire it to the correct handler

### Step 4.3: Fix 🔄 GOES TO GENERIC items

For each generic redirect, either:
- Navigate to the correct specific page
- Or add a section anchor / query param that takes the user to the right section of a multi-purpose page

### Step 4.4: Fix 🏗️ PLACEHOLDER items

For pages that exist but are empty/placeholder:
- Add a clear "Coming Soon" message with the Lynx mascot and a friendly message
- Example: "This page is under construction! Check back soon."
- Style it consistently with the rest of the app

### Step 4.5: Verify all fixes

Re-trace every item that was flagged. Confirm all are now ✅.

**Commit:** `git add -A && git commit -m "phase 4: all navigation issues fixed — dead links, wrong targets, placeholders"`

---

## PHASE 5: Visual QA Pass

### Step 5.1: Read the brand reference

```bash
# Find brand book and UX philosophy
cat LYNX-UX-PHILOSOPHY.md
find . -name "LynxBrandBook*" -not -path "*/node_modules/*" -not -path "*/_archive/*" | head -5
# Read it if found, or check if it's an HTML file that needs to be viewed
```

### Step 5.2: Font verification

Check that Inter Variable is the active font everywhere:

```bash
# Verify font is installed
ls public/fonts/ | grep -i inter

# Verify @font-face declaration
grep -r "Inter" src/index.css | head -10

# Verify Tailwind config
grep -r "Inter\|fontFamily" tailwind.config.js | head -10

# Check for any remaining Tele-Grotesk references
grep -ri "tele.grotesk\|teleGrotesk\|tele_grotesk" src/ --include="*.jsx" --include="*.css" --include="*.js" -l
# If any found, flag them
```

### Step 5.3: Color token verification

```bash
# Read brand tokens from Tailwind config
grep -A 20 "colors:" tailwind.config.js | head -30
```

Verify these brand colors are used consistently:
- Navy: `lynx-navy` (#0B1628)
- Sky: `lynx-sky` (#4BB9EC)
- Gold: `lynx-gold` (#FFD700)
- Background: #F0F3F7 or `bg-slate-50`

Check for hardcoded hex colors that should be tokens:
```bash
grep -roh "#[0-9A-Fa-f]\{6\}" src/components/ src/pages/ --include="*.jsx" | sort | uniq -c | sort -rn | head -20
```

Flag any hardcoded colors that should be using Lynx tokens.

### Step 5.4: Card styling consistency

Check all card components for consistent styling:

```bash
# Find all card components
grep -rl "rounded-\[14px\]\|rounded-xl\|rounded-2xl" src/components/ --include="*.jsx" | head -30
```

Cards should consistently use:
- Border radius: `rounded-[14px]` or `rounded-xl`
- Border: `border border-slate-200`
- Background: `bg-white` (light mode cards)
- Shadow: consistent (or no shadow)

Flag any cards that deviate.

### Step 5.5: Section header consistency

```bash
# Find section headers
grep -rn "uppercase tracking" src/components/ --include="*.jsx" | head -20
```

All section headers should use:
- `text-r-xs font-bold uppercase tracking-wider text-slate-500`
- Or the responsive equivalent

Flag inconsistencies.

### Step 5.6: Broken layout check

Walk through every page and check for:
- Content overflowing card boundaries
- Misaligned grid items
- Buttons cut off or text truncated badly
- Empty white space that shouldn't be there
- Cards with no content (blank white rectangles)
- Components that look unstyled (default browser styling showing through)

### Step 5.7: VolleyBrain reference check

```bash
grep -ri "volleybrain\|volley.brain\|volley brain" src/ --include="*.jsx" --include="*.js" --include="*.css" --include="*.html" -l
```

Any remaining VolleyBrain references in user-facing text must be replaced with "Lynx".

### Step 5.8: Log all visual findings

```
=== VISUAL QA RESULTS ===
FONTS:
- Inter Variable loaded: ✅
- Tele-Grotesk references remaining: [list files if any]

COLORS:
- Hardcoded hex colors found: [list]
- Should be token: [which ones]

CARDS:
- Inconsistent border radius: [list components]
- Missing borders: [list]

HEADERS:
- Inconsistent section headers: [list]

LAYOUTS:
- Content overflow: [list pages/components]
- Broken alignment: [list]
- Unstyled components: [list]

BRANDING:
- VolleyBrain references: [list files]
```

### Step 5.9: Fix all visual issues found

Apply fixes for everything flagged. Replace hardcoded colors with tokens, fix card styling, fix headers, fix layouts.

**Commit:** `git add -A && git commit -m "phase 5: visual QA — fonts, colors, cards, headers, layouts verified and fixed"`

---

## FINAL SUMMARY

After all 5 phases, commit a summary file:

Create `QA-AUDIT-RESULTS.md` in the repo root with:
- Total routes found
- Total nav items audited
- Total in-page links audited
- Items fixed (broken links, wrong targets, dead links)
- Visual issues found and fixed
- Remaining known issues (if any) that need manual attention

**Commit:** `git add -A && git commit -m "QA audit complete — results documented in QA-AUDIT-RESULTS.md"`

---

## NOTES FOR CC

- **This is an AUDIT spec — read more than you write.** The majority of work is reading files, tracing links, and documenting findings. Fixes come after the audit.
- **Do not assume a link is correct because the route exists.** Read the TARGET page and verify it renders the content the label promises.
- **Check ALL four roles for the sidebar audit.** The sidebar has different items per role.
- **The visual QA pass should catch any remaining Tele-Grotesk references** — these should have been replaced by CC-FONT-SWAP but verify.
- **Log findings in the commit messages** so Carlos can review without opening files.
- **If you find more than 20 broken links**, prioritize fixing the dashboard and sidebar ones first. Inner page links can be a follow-up if needed.
