# CC-SOCIAL-CARDS-INVESTIGATION

## PURPOSE
This is an INVESTIGATION ONLY spec. Do NOT implement anything. Clone the repo, analyze the codebase, and produce a detailed report (CC-SOCIAL-CARDS-REPORT.md) that will be used to plan implementation of a new social media card template system for Game Day, Season Schedules, and Score/Results sharing.

## REPO
```bash
gh repo clone SgtxTorque/volleybrain-admin
cd volleybrain-admin
git checkout feat/desktop-dashboard-redesign
```

## GUARDRAILS
- READ ONLY. Do not modify any files.
- Do not create branches.
- Do not run the dev server.
- Do not install dependencies.
- Output a single markdown report file: CC-SOCIAL-CARDS-REPORT.md

---

## WHAT TO INVESTIGATE

### 1. EXISTING GAME DAY CARD SYSTEM
The app already has a Game Day Card feature with templates (Bold, Clean, Dark, and at least one more). Find it and document:

- **File locations**: Every file involved in the Game Day Card modal/popup, including the component that renders the card, the template variants, the share/copy/save functionality, and the featured player selector
- **How templates work**: How are the current templates (Bold, Clean, Dark) structured? Are they separate components, conditional renders, or config-driven? Show the exact code pattern with line numbers
- **Data flow**: Where does the card pull its data from? (team name, opponent, date, time, location, team colors, player photos, team logo). Trace the full prop chain from the page that opens the modal down to the card renderer
- **Image export**: How does the current system export the card as an image? (html2canvas? dom-to-image? canvas API? other?) Which library, which file, which function
- **Share functionality**: How do Share, Copy, and Save buttons work? What does each one do technically?
- **Featured player selector**: How does the player photo picker work? Where does it pull player photos from? How does it pass the selected photo to the card template?
- **Team color system**: How does the card access the team's primary/secondary colors? Where are team colors stored in the database schema? How are they passed to the card?
- **Team logo**: How does the card access the team logo? Where are logos stored?
- **Current template CSS/styles**: Paste the full style definitions for each existing template variant (Bold, Clean, Dark, etc.) with file paths and line numbers

### 2. SCHEDULE PAGE
Find the schedule/events page and document:

- **File locations**: The main schedule page component, any sub-components, any modals
- **Does a "share schedule" feature already exist?** If so, document it fully. If not, note where a share button would logically live
- **Event data model**: What does an event/game object look like? List all fields (title, date, time, location, event_type, opponent, etc.) with their Supabase table and column names
- **How events are queried**: The exact Supabase query that fetches events for the schedule view. File, line number, full query
- **Season/team filtering**: How does the schedule page filter by team and season? What filter state exists?
- **The schedule list view**: How is the list of events rendered? (map over array? virtualized list? grouped by date/month?) File and line numbers

### 3. GAME RESULTS / SCORES
Find any existing game results, scoring, or post-game features and document:

- **Does a game results page or component exist?** If so, where?
- **Score data model**: What tables store game scores/results? (check for: game_results, match_scores, set_scores, or similar). List all relevant columns
- **Stats data model**: Are individual game stats stored? (kills, aces, digs, blocks, etc.) What table, what columns?
- **Where are scores entered?** Is there a UI for inputting final scores? Where does it live?
- **Where are scores displayed?** Any existing score display components? Team Wall posts with scores? Schedule page showing results?
- **Does a "share results" feature exist?** If so, document it. If not, where would it logically live?

### 4. COMPONENT ARCHITECTURE FOR NEW TEMPLATES
Analyze the codebase patterns and recommend:

- **Where should template components live?** Based on existing folder structure, what directory path makes sense? (e.g., src/components/social-cards/ or src/components/templates/ or similar)
- **How should templates be registered?** Should there be a template registry/config file? How do existing configurable components handle variant selection?
- **Shared vs separate modals**: Should Game Day cards, Schedule cards, and Score cards share one modal component with different content, or be three separate modals? What does the existing modal pattern look like?
- **Image rendering approach**: What's the best library for rendering HTML templates to exportable images in this codebase? Is html2canvas already installed? What about @vercel/og or satori? Check package.json

### 5. SUPABASE SCHEMA SCAN
Check SCHEMA_REFERENCE.csv and/or the actual Supabase queries in the code for:

- **teams table**: columns for team_name, team_color, secondary_color, logo_url, sport, age_group, season_id
- **events table**: columns for event_type, title, opponent, start_date, start_time, end_time, location, team_id, season_id
- **players table**: columns for first_name, last_name, jersey_number, position, photo_url, team_id
- **game_results or match_results**: any table storing W/L, set scores, final scores
- **player_game_stats**: any table storing per-game stats (kills, aces, digs, blocks, hitting_pct)
- **organizations table**: columns for org_name, logo_url, primary_color

List the exact table names and column names. If SCHEMA_REFERENCE.csv exists, reference it. If not, grep the codebase for table names in Supabase queries.

### 6. EXISTING SHARE/EXPORT PATTERNS
Look across the entire codebase for:

- Any existing "share" or "export" functionality (not just Game Day cards — could be on schedule, roster, etc.)
- Any use of html2canvas, dom-to-image, canvas, Blob, or similar image-generation libraries
- Any use of Web Share API (navigator.share)
- Any existing download-as-image functionality
- Package.json entries related to image generation or sharing

### 7. CURRENT MODAL/POPUP PATTERNS
Document the modal system:

- What modal/popup library or component is used? (headlessui, radix, custom?)
- File path for the base modal component
- How are modals triggered? (state, context, URL params?)
- The Game Day Card modal specifically: how is it opened, closed, and what props does it receive?

### 8. ROUTING AND NAVIGATION
- What router is used? (react-router-dom v6? other?)
- Where is the route config?
- Current routes for: schedule page, team page, game day page, any results page
- Where would new routes for share card creation logically sit?

---

## OUTPUT FORMAT

Create a single file: **CC-SOCIAL-CARDS-REPORT.md** with the following structure:

```markdown
# Social Cards Implementation Report

## 1. Existing Game Day Card System
### File Map
(list every file with full path)
### Template Architecture
(how templates work, with code snippets and line numbers)
### Data Flow
(full prop chain diagram)
### Image Export
(library, file, function, how it works)
### Share/Copy/Save
(how each button works)
### Player Photo Selector
(how it works, data source)
### Team Colors & Logo
(where they come from, how they're passed)
### Current Template Code
(full CSS/style code for each variant)

## 2. Schedule System
### File Map
### Existing Share Features (if any)
### Event Data Model (table + columns)
### Query Patterns
### Rendering Pattern

## 3. Game Results System
### File Map (if exists)
### Score Data Model (tables + columns)
### Stats Data Model (tables + columns)
### Score Entry UI (if exists)
### Score Display Components (if any)
### Existing Share Features (if any)

## 4. Recommended Architecture
### File Structure Recommendation
### Template Registration Pattern
### Modal Strategy
### Image Export Strategy (with library recommendation)

## 5. Database Schema
### Teams Table (full column list)
### Events Table (full column list)
### Players Table (full column list)
### Game Results Table (full column list, or "does not exist")
### Player Stats Table (full column list, or "does not exist")
### Organizations Table (full column list)

## 6. Existing Share/Export Inventory
### All share-related code found
### Libraries in package.json
### Web Share API usage

## 7. Modal System
### Base modal component (file, pattern)
### Game Day Card modal (file, trigger, props)

## 8. Routing
### Router setup
### Relevant existing routes
### Recommended new routes (if any)

## 9. Key Risks & Blockers
(anything that could complicate implementation: missing data, schema gaps, library conflicts, etc.)

## 10. Quick Reference: Files That Will Need Changes
(a flat list of every file path that will likely need modification during implementation, grouped by feature)
```

Put the report in the repo root: `volleybrain-admin/CC-SOCIAL-CARDS-REPORT.md`

---

## IMPORTANT
- Be thorough. Check actual files, not assumptions.
- Include line numbers for every code reference.
- If something doesn't exist (e.g., no game results table), say so explicitly rather than guessing.
- If you find inconsistencies (e.g., a table referenced in code but not in schema), flag them.
- Check the git log for recent changes to the Game Day Card system to understand its current state.
- Read SCHEMA_REFERENCE.csv if it exists in the repo root.
- Read any existing CC spec files in the repo for context on recent work.
