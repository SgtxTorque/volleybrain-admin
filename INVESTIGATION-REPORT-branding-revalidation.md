# INVESTIGATION REPORT — Branding Overhaul Revalidation

**Date:** April 15, 2026
**Branch:** main (up to date)
**Original Report:** INVESTIGATION-REPORT-team-logos-branding.md (April 9, 2026)
**Commits Since Original:** ~50+ including parent auth, lifecycle tracker, baton pass, onboarding, email CTAs, reports fix, jersey preference

---

## 1. Executive Summary

The branding landscape is **largely unchanged** from the April 9 report. The 50+ commits since then focused on lifecycle/auth/onboarding concerns — not branding. Key findings:

- **Dead code (`{false &&` patterns):** Fully cleaned up. Zero instances remain.
- **TeamLogo component:** Still does not exist. No one created it during the sprint.
- **Logo display:** Still limited to 1 location (TeamsTableView admin table). Logo upload exists at creation time only — no editing.
- **Org branding context (`useOrgBranding`):** Defined but effectively unused. Dead code.
- **Chat avatars:** Changed from emoji to initials + HSL-generated colors. The original report's finding is stale.
- **Email branding:** Org logo and colors are supported. Team logos are not. CTA buttons were just added (this session).
- **Hardcoded colors:** 1,144 instances of 4 design system colors across 179 JSX files. Heavy.
- **Color contrast functions:** Exist in 3 copies (not centralized). `cardColorUtils.js` is the canonical one.
- **Schedule/Calendar:** Queries logo_url but never renders it. Gap confirmed.

**Bottom line:** The original 6-phase plan is still valid. No phases need to be removed. One adjustment: chat avatars are no longer emoji-based (they're now initials), so that finding is stale.

---

## 2. Area-by-Area Findings

### Area 1: Dead Code Audit

| Item | Status | Details |
|------|--------|---------|
| `{false &&` patterns | **REMOVED** | Zero instances found in any .jsx file |
| Team Wall hero banner | **REMOVED** | No `{false && ...}` near wall/hero/banner |
| AppBackground dead code | **REMOVED** | No references to AppBackground in .jsx files |

**Conclusion:** All dead code flagged in the original report has been cleaned up during the 50-commit sprint. No dead rendering blocks remain.

### Area 2: TeamLogo Component Status

**Does a TeamLogo component exist?** NO.

**Distinct team identity rendering patterns:**

| Pattern | File | Line(s) | Approach |
|---------|------|---------|----------|
| Logo + fallback initials | `src/pages/teams/TeamsTableView.jsx` | 178-185 | `team.logo_url` → `<img>`, else colored square with abbreviation initials |
| Color dot + name | `src/components/layout/HeaderComponents.jsx` | 210-211 | 3px rounded dot with `team.color`, team name text |
| Color dot + name (small) | `src/components/layout/HeaderComponents.jsx` | 288-302 | 2px dot (parent child sub-menu) |
| Team logo watermark | `src/pages/chats/ChatThread.jsx` | 476-480 | 256x256 logo at 3-4% opacity |
| Team initial circle | `src/pages/chats/ChatThread.jsx` | 481-488 | 192px circle with team color + first letter |
| Team color in social cards | `src/components/social-cards/SocialCardModal.jsx` | 79-82 | Team color as primary card color |
| Team logo in social cards | `src/pages/schedule/GameDayShareModal.jsx` | 142, 184, 236, 271 | Logo in game day share templates |
| Team logo in posters | `src/pages/schedule/SchedulePosterModal.jsx` | Various | Logo in poster templates |

**Total: 8 distinct patterns across 6+ files. Not consolidated.**

### Area 3: Team Logo Data Flow

#### Files that SELECT logo_url (Supabase queries):

| File | Line | Query |
|------|------|-------|
| `src/pages/teams/TeamsPage.jsx` | ~74 | `select('*', ...)` on teams table |
| `src/pages/schedule/SchedulePage.jsx` | ~97 | `teams!schedule_events_team_id_fkey(id, name, color, logo_url)` |
| `src/pages/chats/ChatThread.jsx` | - | Channel query includes teams join |
| `src/pages/schedule/GameDayShareModal.jsx` | - | Team data from parent component |

#### Files that DISPLAY logo_url (JSX rendering):

| File | Line(s) | Context |
|------|---------|---------|
| `src/pages/teams/TeamsTableView.jsx` | 178-179 | Admin team table — ONLY admin-facing logo display |
| `src/pages/chats/ChatThread.jsx` | 477-479 | Watermark (3-4% opacity) |
| `src/pages/schedule/GameDayShareModal.jsx` | 142, 184, 236, 271 | Social card templates |
| `src/pages/schedule/SchedulePosterModal.jsx` | Various | Poster templates |
| `src/pages/teams/TeamWallPage.jsx` | 392-394, 451-452 | Team card + sidebar |

#### Logo Upload Capability:

| Capability | Status | File | Notes |
|-----------|--------|------|-------|
| Upload during team creation | **YES** | `src/pages/teams/NewTeamModal.jsx:54-82` | Uses `team-assets` storage bucket |
| Edit logo after creation | **NO** | `src/pages/teams/EditTeamModal.jsx` | Logo not included in edit form |

#### Supabase Storage Buckets Referenced:

| Bucket | File | Usage |
|--------|------|-------|
| `team-assets` | `src/pages/teams/NewTeamModal.jsx:64,74` | Team logo upload |
| `media` | `src/pages/public/PublicRegistrationPage.jsx` | Player photo upload |
| `media` | Various | General media uploads |

### Area 4: Org Logo & Branding Surfaces

#### Where Org Logo is DISPLAYED:

| File | Line(s) | Size | Context |
|------|---------|------|---------|
| `src/pages/public/PublicRegistrationPage.jsx` | 1050-1052 | 16x16px | Season selector screen |
| `src/pages/public/PublicRegistrationPage.jsx` | 1084-1089 | 20x20px | Main registration header |
| `src/pages/public/RegistrationCartPage.jsx` | 1856 | 8x8px | Cart footer badge |
| `src/pages/public/CoachJoinPage.jsx` | 96-97 | h-16 (64px) | Coach join org screen |
| `src/pages/public/CoachInviteAcceptPage.jsx` | 417-418 | h-14 (56px) | Coach invite onboarding |
| `src/pages/public/ParentInviteAcceptPage.jsx` | 307-308 | h-14 (56px) | Parent invite onboarding |
| `src/pages/public/OrgDirectoryPage.jsx` | 120-125, 258-263 | Full card | Org directory grid + list |

**Total: 7 surfaces across 6 files.**

#### Where Org Logo is FETCHED but NOT DISPLAYED:

| File | Line(s) | Notes |
|------|---------|-------|
| `src/contexts/OrgBrandingContext.jsx` | 34, 38, 42 | Provides `emailHeaderLogo` — `useOrgBranding()` hook defined but NOT imported/used by any component effectively |
| `src/pages/teams/TeamWallPage.jsx` | 50 | Fetches `orgLogo` via `useOrgBranding()` but never renders it |
| `src/pages/public/RegistrationCartPage.jsx` | 1237 | `accentColor` read but NEVER USED — dead variable |

#### Brand Colors — Hardcoded vs Dynamic:

| File | What | Status |
|------|------|--------|
| `PublicRegistrationPage.jsx:1075-1076` | Reads `orgBranding.primary_color` | **Read but header uses hardcoded `bg-lynx-navy`** |
| `RegistrationCartPage.jsx:1236-1237` | Reads `orgBranding.primary_color` | **Dead variable — never used** |
| `OrgBrandingContext.jsx:32-33` | Provides `orgColors: { primary, secondary }` | **Context never effectively consumed** |

**Registration Header Readability Issue:** STILL EXISTS. Header is always `bg-lynx-navy` (hardcoded dark navy) with `text-white` regardless of org brand color. The accent color is read but not applied to the header. If it were applied, light brand colors + white text = poor readability. The hardcoding actually *prevents* the readability issue from manifesting, but it also means orgs can't customize the header.

### Area 5: Chat Avatars & Watermarks

#### Chat Avatars:

**CHANGED from original report — No longer emoji.**

| Component | Approach | Details |
|-----------|----------|---------|
| `MessageBubble.jsx:69-75` | Photo URL or HSL initials | If `avatar_url` exists → `<img>`, else first-letter initial with `hsl((charCode*10)%360, 55%, 50%)` |
| `ChatPreviewCard.jsx:109-116` | Photo URL or theme initials | If `avatar_url` exists → `<img>`, else initials with theme-based colors |

**Delta from original:** The original report said chat used emoji for team identity. This is now **stale** — chat uses user photo/initials, not team emoji.

#### ChatThread Watermark:

**STILL EXISTS** — `src/pages/chats/ChatThread.jsx:475-488`

| Type | Lines | Opacity | Size |
|------|-------|---------|------|
| Team logo image | 476-480 | 3% dark / 4% light | 256x256px |
| Team initial circle (fallback) | 481-488 | 3% dark / 4% light | 192x192px |

#### Other Watermarks/Silhouettes:

| File | Line(s) | Type | Opacity |
|------|---------|------|---------|
| `TakeoverCard.jsx` | 53-56 | Diagonal stripe pattern | 6% |
| `SplitCard.jsx` | 62-65 | Diagonal stripe pattern | 8% |
| `TriPanelCard.jsx` | 92 | Team color text ticker | 7% |

### Area 6: Full Surface Inventory

**Total files with team identity rendering: 36 files reference `logo_url`; 102+ files reference team identity in some form.**

#### Files by Approach:

**Uses logo_url (renders or queries):**
- `src/pages/teams/TeamsTableView.jsx` — Renders logo or abbreviation fallback
- `src/pages/teams/TeamsPage.jsx` — Queries team data (wildcard)
- `src/pages/teams/NewTeamModal.jsx` — Logo upload
- `src/pages/teams/TeamWallPage.jsx` — Team logo display (card + sidebar)
- `src/pages/teams/TeamWallLeftSidebar.jsx` — Team sidebar display
- `src/pages/teams/TeamHubSelectorPage.jsx` — Team hub
- `src/pages/schedule/SchedulePage.jsx` — Queries `logo_url` in join
- `src/pages/schedule/GameDayShareModal.jsx` — Social card templates (4 refs)
- `src/pages/schedule/SchedulePosterModal.jsx` — Poster templates
- `src/pages/chats/ChatThread.jsx` — Watermark
- `src/components/social-cards/SocialCardModal.jsx` — Card color + logo
- Social card template files (ProgramLogoCard, etc.)

**Uses color only (dot/badge/background):**
- `src/components/layout/HeaderComponents.jsx` — Coach/parent team selectors (color dot)
- `src/pages/standings/TeamStandingsPage.jsx` — Team color in standings
- `src/pages/gameprep/GamePrepPage.jsx` — Team color
- `src/pages/schedule/CalendarViews.jsx` — Team name text only, **no logo despite data availability**
- `src/pages/reports/ReportsPage.jsx` — Team color in data tables
- `src/pages/attendance/AttendancePage.jsx` — Team color badges

**Uses name only:**
- `src/pages/schedule/CalendarViews.jsx` — Event pills show team name text
- `src/pages/schedule/scheduleHelpers.jsx` — Event formatting
- All report loaders — Team name in data columns
- Various dashboard widgets

**Schedule/Calendar logo status:** `SchedulePage.jsx` queries `logo_url` in the teams join but `CalendarViews.jsx` only renders `event.teams.name` as text. **Logo data is fetched but never rendered in calendar UI.** This is a confirmed gap.

### Area 7: Email Branding

**File: `src/lib/email-html-builder.js`**

| Feature | Supported? | Implementation |
|---------|-----------|----------------|
| Org logo | **YES** | `headerLogo` param — from `org.settings.branding.email_header_logo` or `org.logo_url` |
| Org primary color | **YES** | `accentColor` param — from `org.settings.branding.email_header_color` or `org.primary_color` |
| CTA button styling | **YES** | `ctaText` + `ctaUrl` → styled pill button with accent color |
| Social links | **YES** | Website, Instagram, Facebook, Twitter from org settings |
| Footer text | **YES** | Custom footer from org settings |
| Unsubscribe | **YES** | For broadcast emails |
| Team logo | **NO** | Not supported in email templates |
| Team colors | **NO** | Not supported — all emails use org branding only |

**`resolveOrgBranding()` function (lines 94-111):** Extracts org branding into standardized format. Used by `buildPreview()` and by the Edge Function.

### Area 8: Color Utility / Contrast Functions

#### Existing Functions:

| Function | File | Notes |
|----------|------|-------|
| `getContrastText(hex)` | `src/components/social-cards/cardColorUtils.js` | Canonical — exported |
| `darken(hex, pct)` | `src/components/social-cards/cardColorUtils.js` | Exported |
| `lighten(hex, pct)` | `src/components/social-cards/cardColorUtils.js` | Exported |
| `hexToRgba(hex, alpha)` | `src/components/social-cards/cardColorUtils.js` | Exported |
| `isLightColor(hex)` | `src/components/social-cards/cardColorUtils.js` | Exported |
| `getContrastText(hex)` | `src/pages/schedule/SchedulePosterModal.jsx:18` | **DUPLICATE** — inline |
| `getContrastText(hex)` | `src/pages/schedule/GameDayShareModal.jsx:12` | **DUPLICATE** — inline |

**Issue:** 3 copies of `getContrastText`. Should be consolidated to `cardColorUtils.js`.

#### Hardcoded Design System Colors:

| Color | Hex | Count |
|-------|-----|-------|
| Lynx Navy | `#10284C` | ~400+ |
| Lynx Midnight | `#0B1628` | ~100+ |
| Lynx Sky | `#4BB9EC` | ~500+ |
| Gold | `#FFD700` | ~50+ |
| **TOTAL** | | **~1,144 instances in 179 JSX files** |

#### Theme/Token Files:

| File | Type | Contents |
|------|------|----------|
| `src/constants/theme.js` (112 lines) | JS Constants | Accent colors, dark/light theme configs, status colors, priority dots |
| `src/styles/v2-tokens.css` (79 lines) | CSS Custom Properties | `--v2-navy`, `--v2-sky`, `--v2-gold`, gradients, surfaces, text, shadows |

### Area 9: Team Settings / Edit Capability

**Does a TeamSettingsPage exist?** NO.

**Where is team data edited?**

`src/pages/teams/EditTeamModal.jsx` (369 lines, 4-tab modal):

| Tab | Fields | Notes |
|-----|--------|-------|
| Basic Info | Name, Abbreviation, Color, Description | Color picker with presets |
| Classification | Age Group, Team Type, Gender, Skill Level | Division type dropdown |
| Roster | Max/Min roster size, Roster open/closed | Slider controls |
| Settings | Internal Notes | Admin-only |

**Missing from EditTeamModal:** `logo_url` — cannot change team logo after creation.

**Access:** Admin only. Coaches/TMs cannot edit team data. The edit modal is invoked from `TeamsPage.jsx` which is admin-gated.

### Area 10: Sidebar & Navigation Team Identity

**Teams do NOT appear in a sidebar.** They appear in **header dropdowns** only.

| Component | File | Lines | Rendering |
|-----------|------|-------|-----------|
| Coach team selector | `HeaderComponents.jsx` | 162-223 | 3px color dot + team name + role badge |
| Parent child selector | `HeaderComponents.jsx` | 228-310 | Player photo/initials → sub-menu with 2px color dot + team name |

**Default fallback color:** `#EAB308` (gold) when `team.color` is null.

**Not rendered:** Team logo, team emoji, team abbreviation — only color dot + name.

**Consistency:** Color dot pattern is consistent between coach and parent selectors but inconsistent with:
- TeamsTableView (uses logo + abbreviation fallback)
- ChatThread watermark (uses logo + initial circle)
- Social cards (uses logo + team color)

---

## 3. Updated Surface Count

**Current count of files needing branding work:**

| Category | File Count | Notes |
|----------|-----------|-------|
| Files rendering team identity (any form) | **102+** | Name, color, logo, emoji, initials |
| Files referencing `logo_url` | **36** | Queries or renders |
| Files actually DISPLAYING team logo | **5** | TeamsTableView, ChatThread, GameDayShareModal, SchedulePosterModal, TeamWallPage |
| Files with hardcoded design colors | **179** | 1,144 total instances |
| Files with duplicate color utils | **2** | SchedulePosterModal, GameDayShareModal (duplicate getContrastText) |

**Original report said 45+. Current count is higher (~102+ files touch team identity), but only 5 actually render logos.**

---

## 4. Dead Code Status

| Item | April 9 Status | Current Status |
|------|---------------|---------------|
| `{false &&` hero banner | Dead code | **REMOVED** — zero instances |
| `{false &&` app background | Dead code | **REMOVED** — zero instances |
| `useOrgBranding()` hook | Not flagged | **NEW — effectively dead**. Defined in OrgBrandingContext, imported by TeamWallPage but `orgLogo` value is never rendered |
| `accentColor` in RegistrationCartPage | Not flagged | **NEW — dead variable**. Read on line 1236 but never used |

---

## 5. Delta from Original Report (April 9 → April 15)

| Finding | April 9 | April 15 | Change |
|---------|---------|----------|--------|
| Dead code `{false &&` | Present | Removed | **Fixed** |
| TeamLogo component | Does not exist | Still does not exist | No change |
| Logo display locations | 1 (TeamsTableView) | 5 (added TeamWall, Chat, Social cards, Posters) | **Improved slightly** |
| Logo editing | Not possible | Still not possible | No change |
| Chat avatars | Emoji-based | HSL initials + photo fallback | **Changed — original finding stale** |
| ChatThread watermark | Present | Still present | No change |
| Email branding | Org only | Org only (CTAs added this session) | **CTAs improved** |
| Hardcoded colors | ~1000+ | ~1,144 in 179 files | Slightly increased |
| Color contrast utils | Not flagged | 3 duplicates found | **New finding** |
| OrgBrandingContext | Working | Effectively dead code | **Regression** |
| Schedule calendar logos | Not rendering | Still not rendering (data fetched) | No change |

---

## 6. Recommended Phase Adjustments

The original 6-phase plan from the April 9 report is still valid. Minor adjustments:

1. **Phase 1 (TeamLogo component):** Still needed. Now more urgent since logo rendering expanded to 5 locations with 5 different patterns.

2. **Phase 2 (Dead code cleanup):** **SCOPE REDUCED.** The `{false &&` patterns are gone. Redirect this phase to:
   - Remove dead `useOrgBranding()` imports (TeamWallPage)
   - Remove dead `accentColor` variable (RegistrationCartPage)
   - Consolidate 3 copies of `getContrastText` → import from `cardColorUtils.js`

3. **Phase 3 (Team logo display expansion):** Still needed. Calendar views, header team selectors, and parent-facing pages still lack logo rendering.

4. **Phase 4 (Org branding dynamic colors):** Still needed. `useOrgBranding()` context exists but is dead. Wire it up or remove it and implement a simpler approach.

5. **Phase 5 (Email team branding):** Still needed. No team logos in emails.

6. **Phase 6 (Design token migration):** Still needed. 1,144 hardcoded color instances is the heaviest tech debt.

**NEW recommendation:** Add a Phase 0 (quick wins):
- Add `logo_url` to `EditTeamModal.jsx` (logo editing gap)
- Consolidate `getContrastText` duplicates
- Clean up dead `useOrgBranding()` / `accentColor` code

---

## 7. Risk Flags

1. **OrgBrandingContext is dead code** — If the branding overhaul plan relies on this context, it needs to be either revived or replaced. Currently `useOrgBranding()` is imported in TeamWallPage but the returned values are not used.

2. **1,144 hardcoded colors in 179 files** — Token migration will be a massive find-and-replace. Risk of visual regressions. Need incremental approach (file-by-file) with visual QA.

3. **3 duplicate getContrastText implementations** — If any phase modifies the contrast logic, it must be updated in all 3 locations (or consolidated first).

4. **Logo upload exists only at creation** — Teams created without logos can never add them. This is a UX gap that may generate support requests.

5. **Chat avatars changed** — The original report's recommendation to "replace emoji with team logos in chat" is partially stale. Chat now uses user photo/initials, which is arguably better than emoji. The team watermark is still relevant.

6. **Schedule data already includes logo_url** — The Supabase query already fetches it. CalendarViews.jsx just doesn't render it. This is a low-risk, high-impact quick win.

7. **No TypeScript** — All .jsx files. Refactoring without type safety means manual verification of every prop change.

8. **Email builder is Edge Function territory** — Changes to email branding require both client-side (email-service.js) and Edge Function updates. Carlos deploys Edge Functions manually.
