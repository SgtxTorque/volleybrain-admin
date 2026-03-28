# CC-FEATURE-INVENTORY-AUDIT.md
# Full Feature Inventory Audit — What Actually Exists in the Codebase

## READ FIRST
1. `CC-SPEC-GUARDRAILS.md`
2. `CLAUDE.md`

## SCOPE
This is a READ-ONLY audit. Do NOT change any code. Do NOT fix anything. Do NOT refactor. Only read, catalog, and report.

The goal is to produce a complete, honest inventory of what features, pages, components, and capabilities actually exist in this codebase RIGHT NOW on the main branch. Carlos suspects some features we think are "not built yet" may already exist, and some things we think are "done" may be stubs.

## WHAT TO AUDIT

### 1. Page-Level Feature Inventory

For EVERY page file in `src/pages/`, open it and determine:

```
| Page | File | Lines | Feature Status | What it actually does |
```

Feature Status categories:
- **LIVE** — Fully functional, loads real data, all CRUD operations work
- **PARTIAL** — Page renders but some features are stubs, buttons are no-ops, or sections say "Coming Soon"
- **STUB** — Page exists but is mostly placeholder UI with no real functionality
- **BROKEN** — Page exists but crashes, shows errors, or has known blockers
- **DEAD** — Page exists but is orphaned (no route, no nav item points to it)

For LIVE and PARTIAL pages, list what the page CAN do:
- View data? Create? Edit? Delete? Export? Filter? Search? Bulk actions?
- What modals/drawers does it open?
- What actions do its buttons actually trigger?

For PARTIAL pages, list what's MISSING or stubbed:
- Buttons that are no-ops
- Sections that say "Coming Soon" or are empty
- Features referenced in the UI but not wired

### 2. Component-Level Feature Inventory

For the key shared components and widgets, catalog what they actually do:

**Dashboard widgets** (`src/components/dashboard/`, `src/components/widgets/`):
- Which ones render real data?
- Which ones are placeholder?

**Game Day** (`src/pages/gameprep/`, `src/components/games/`):
- What game day features actually work? Scoring? Lineup? Stats entry? Command center?

**Engagement** (`src/components/engagement/`):
- Shoutouts — working?
- Challenges — working?
- Achievements/badges — working?
- XP system — working?

**Chat** (`src/pages/chats/`):
- Real-time messaging?
- Channel creation?
- Unread tracking?
- Message reactions?

**Registration** (`src/pages/registrations/`, `src/pages/public/`):
- Public registration flow — working?
- Approval/deny — working?
- Bulk actions — working?
- Waitlist — working?

**Payments** (`src/pages/payments/`):
- Payment tracking — working?
- Stripe integration — working?
- Payment plans — working?
- Overdue management — working?

**Schedule** (`src/pages/schedule/`):
- Calendar views — working?
- Event creation — working?
- RSVP tracking — working?
- Bulk event creation — working?
- Venue management — working?

**Reports** (`src/pages/reports/`):
- What reports actually render data?
- Registration funnel — working?
- Export — working?

**Player Features**:
- Player stats page — working?
- Player evaluations — exist?
- Player card / player profile — working?
- Achievements catalog — working?

**Parent Features**:
- Parent dashboard — working?
- Payment view — working?
- Registration hub — working?
- Messages — working or stub?
- Invite friends — working or stub?
- Child management — working?

**Coach Features**:
- Coach dashboard — working?
- Roster management — working?
- Game prep — working?
- Attendance — working?
- Availability — working?

**Team Manager Features**:
- Team manager dashboard — working?
- Setup wizard — working?
- What can TM actually do vs admin vs coach?

**Platform Admin**:
- Which platform pages have real functionality?
- Which are stubs?

### 3. Database Feature Check

Look at the Supabase queries in the codebase. Which tables are actually being queried with real CRUD operations vs just SELECT?

```bash
# Find all INSERT operations
grep -rn "\.insert(" src/ --include="*.jsx" --include="*.js" | grep -v _archive | grep -v node_modules | grep -v docs/

# Find all UPDATE operations  
grep -rn "\.update(" src/ --include="*.jsx" --include="*.js" | grep -v _archive | grep -v node_modules | grep -v docs/

# Find all DELETE operations
grep -rn "\.delete(" src/ --include="*.jsx" --include="*.js" | grep -v _archive | grep -v node_modules | grep -v docs/
```

Group by table. Report which tables have full CRUD vs read-only.

### 4. Roadmap Cross-Reference

Check if these specific features exist in the code (from the H1/H2 roadmap):

- [ ] Game Day Command Center — does `GameDayCommandCenter.jsx` exist and work?
- [ ] Challenge System — can challenges be created, joined, verified, completed?
- [ ] Player Evaluations — does an eval form exist on mobile or web?
- [ ] Bulk Events — does `BulkEventWizard.jsx` work?
- [ ] Season Setup Wizard — does it exist and guide through setup?
- [ ] Native Registration — is the public reg flow complete?
- [ ] Tryouts — any tryout management UI?
- [ ] Volunteer Management — any volunteer tracking beyond event_volunteers table?
- [ ] Practice Plans — any practice plan builder?
- [ ] Tournaments — any tournament bracket/management?
- [ ] Voice stat entry — any Whisper API integration?
- [ ] Video — any video upload/playback?
- [ ] AI Insights — any AI-powered analytics?
- [ ] College Recruiting — any recruiting features?
- [ ] Marketplace — any marketplace/store features?

### 5. Settings & Configuration Check

What settings pages actually let you configure things?
- Organization settings — what can you change?
- Season management — what can you do?
- Registration templates — working?
- Waiver management — working?
- Payment setup (Stripe) — working?
- Venue management — working?
- Data export — working? What formats?
- Subscription management — working?

### 6. Branch Check

```bash
git branch -a
```

For each remote branch that's NOT main, check if it has work that hasn't been merged:
```bash
git log main..<branch> --oneline | head -10
```

List any branches with unmerged work and what that work appears to be.

---

## DELIVERABLE

Produce ONE file: `WEB-FEATURE-INVENTORY.md`

Structure:
```markdown
# Lynx Web Admin — Feature Inventory
## Date: [date]
## Branch: main (commit [hash])

## Executive Summary
- Total pages: X
- Live (fully functional): X
- Partial (some features stubbed): X  
- Stub (placeholder only): X
- Broken: X
- Dead (orphaned): X

## Page-by-Page Inventory
[Full table]

## Feature Status by Category
### Game Day: [status summary]
### Engagement: [status summary]
### Chat: [status summary]
...etc

## Database CRUD Matrix
[Table showing which tables have Insert/Update/Delete vs read-only]

## Roadmap Cross-Reference
[Checklist of H1/H2 items with exists/doesn't exist/partial]

## Unmerged Branch Work
[List of branches with unmerged commits]

## Surprises
[Anything that exists but we might not know about, or anything marked as "done" that's actually a stub]
```

## COMMIT
```bash
git add WEB-FEATURE-INVENTORY.md
git commit -m "docs: complete feature inventory audit of web admin"
git push origin main
```
