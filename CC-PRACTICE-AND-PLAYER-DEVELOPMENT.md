# CC-PRACTICE-AND-PLAYER-DEVELOPMENT.md
# Practice Planning & Player Development System

## READ FIRST
1. CC-SPEC-GUARDRAILS.md
2. CLAUDE.md
3. SUPABASE_SCHEMA.md (for existing table context)
4. LYNX-UX-PHILOSOPHY.md (progressive disclosure, conditional rendering)
5. This spec

---

## OVERVIEW

This spec adds a **Practice Planning** and **Player Development** system to Lynx. It is inspired by tools like CoachPro but designed to fit Lynx's existing architecture, multi-sport DNA, role-based navigation, and UX philosophy.

**What this spec builds:**
- A Drill Library where coaches save drills (with YouTube video import, descriptions, coaching points)
- A Practice Plan Builder that assembles drills into timed, ordered practice sessions
- Practice Plans that attach to existing `schedule_events` where `event_type = 'practice'`
- A Player Development system where coaches assign drills/skills to individual players for at-home work
- Pre/Post-Practice Reflections that players complete through their own accounts
- A Development Dashboard tab on the player profile so coaches, parents, and players can track growth

**What this spec does NOT do:**
- Modify existing game-day, lineup, stats, or scoring features
- Change existing navigation structure (it extends it with new items)
- Alter existing database tables — all changes are NEW tables and NEW columns only
- Touch auth, theme, or payment systems

---

## CONTEXT: WHAT ALREADY EXISTS

Before building, understand what Lynx already has that this spec builds on:

| Existing Feature | Table / Component | How This Spec Uses It |
|---|---|---|
| Practice events | `schedule_events` (event_type = 'practice') | Practice plans attach to these events via `event_id` |
| Player profiles | `players`, `player_skill_ratings`, `player_evaluations` | Development assignments link to players |
| Player accounts | `profiles` (role = 'player') | Players access their development dashboard and reflections |
| Parent accounts | `profiles` (role = 'parent') | Parents view their child's development progress |
| Team structure | `teams`, `team_players`, `team_coaches` | Drills and plans are scoped to teams/orgs |
| XP & Engagement | `xp_ledger`, `achievements`, `player_achievement_progress` | Completing development work earns XP |
| Schedule page | `SchedulePage.jsx`, `CalendarViews.jsx` | Practice events already display here; plans link from event detail |
| Multi-sport | `sports` table, `SportContext` | Drills are tagged by sport_id |
| Org scoping | `organizations`, `current_organization_id` on profiles | All new tables include org_id for RLS |

---

## DATABASE SCHEMA — NEW TABLES

All tables use `IF NOT EXISTS`. All include `org_id` for RLS scoping. All use UUID primary keys matching existing Lynx conventions.

### Table 1: `drills`
The core drill library. Each drill is a reusable building block coaches can drop into any practice plan.

```sql
CREATE TABLE IF NOT EXISTS drills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  created_by UUID NOT NULL REFERENCES profiles(id),
  sport_id UUID REFERENCES sports(id),
  team_id UUID REFERENCES teams(id),          -- NULL = org-wide, set = team-specific

  -- Content
  title TEXT NOT NULL,
  description TEXT,                             -- Rich text: setup, execution, coaching points
  category TEXT NOT NULL DEFAULT 'general',     -- warmup, offense, defense, conditioning, scrimmage, cooldown, skill_work, game_like, other
  duration_minutes INTEGER NOT NULL DEFAULT 10,
  intensity TEXT DEFAULT 'medium',              -- low, medium, high
  min_players INTEGER,
  max_players INTEGER,
  equipment TEXT[],                             -- array: ['balls', 'cones', 'net', 'resistance_bands']
  tags TEXT[],                                  -- freeform tags for search/filter

  -- Media
  video_url TEXT,                               -- YouTube/Vimeo URL
  video_thumbnail_url TEXT,                     -- Auto-extracted or manually set
  video_source TEXT,                            -- 'youtube', 'vimeo', 'upload'
  diagram_url TEXT,                             -- Uploaded image of court/field diagram

  -- Metadata
  is_favorite BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,             -- Future: shared drill marketplace
  use_count INTEGER DEFAULT 0,                 -- How many times added to a practice

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_drills_org ON drills(org_id);
CREATE INDEX IF NOT EXISTS idx_drills_sport ON drills(sport_id);
CREATE INDEX IF NOT EXISTS idx_drills_category ON drills(category);
CREATE INDEX IF NOT EXISTS idx_drills_created_by ON drills(created_by);
```

**Category values by sport context:**
- Volleyball: warmup, serving, passing, setting, attacking, blocking, defense, transition, game_like, conditioning, cooldown
- Basketball: warmup, shooting, ball_handling, passing, defense, rebounding, fast_break, game_like, conditioning, cooldown
- Baseball/Softball: warmup, batting, fielding, pitching, base_running, game_like, conditioning, cooldown
- General (any sport): warmup, offense, defense, skill_work, game_like, conditioning, scrimmage, cooldown

### Table 2: `practice_plans`
A reusable template of ordered drills. Think of it as a playlist of drills.

```sql
CREATE TABLE IF NOT EXISTS practice_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  created_by UUID NOT NULL REFERENCES profiles(id),
  sport_id UUID REFERENCES sports(id),
  team_id UUID REFERENCES teams(id),

  title TEXT NOT NULL,
  description TEXT,
  target_duration_minutes INTEGER,              -- Total planned duration
  focus_areas TEXT[],                            -- ['passing', 'serving', 'conditioning']
  is_favorite BOOLEAN DEFAULT FALSE,
  is_template BOOLEAN DEFAULT FALSE,            -- TRUE = reusable template, FALSE = one-off
  use_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_practice_plans_org ON practice_plans(org_id);
CREATE INDEX IF NOT EXISTS idx_practice_plans_sport ON practice_plans(sport_id);
```

### Table 3: `practice_plan_items`
The ordered drills within a practice plan. Each row is one drill in the sequence.

```sql
CREATE TABLE IF NOT EXISTS practice_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_plan_id UUID NOT NULL REFERENCES practice_plans(id) ON DELETE CASCADE,
  drill_id UUID REFERENCES drills(id),          -- NULL if it's a custom/ad-hoc block

  sort_order INTEGER NOT NULL DEFAULT 0,
  custom_title TEXT,                             -- Override drill title, or title for ad-hoc blocks
  custom_notes TEXT,                             -- Coach notes specific to this plan usage
  duration_minutes INTEGER NOT NULL DEFAULT 10,  -- Can differ from drill default

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_practice_plan_items_plan ON practice_plan_items(practice_plan_id);
```

### Table 4: `event_practice_plans`
Links a practice plan to a specific schedule_event. This is the bridge between the existing schedule system and the new practice planning system.

```sql
CREATE TABLE IF NOT EXISTS event_practice_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES schedule_events(id) ON DELETE CASCADE,
  practice_plan_id UUID NOT NULL REFERENCES practice_plans(id),
  status TEXT DEFAULT 'draft',                  -- draft, ready, in_progress, completed
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  coach_notes TEXT,                             -- Post-practice notes

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id)                              -- One plan per event
);

CREATE INDEX IF NOT EXISTS idx_event_practice_plans_event ON event_practice_plans(event_id);
```

### Table 5: `player_development_assignments`
Assigns drills or skills to individual players for at-home practice between team sessions.

```sql
CREATE TABLE IF NOT EXISTS player_development_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  player_id UUID NOT NULL REFERENCES players(id),
  assigned_by UUID NOT NULL REFERENCES profiles(id),  -- Coach who assigned
  team_id UUID REFERENCES teams(id),

  -- What's assigned
  drill_id UUID REFERENCES drills(id),                 -- A specific drill to practice
  assignment_type TEXT NOT NULL DEFAULT 'drill',        -- 'drill', 'custom', 'video_review'
  custom_title TEXT,                                    -- For custom assignments
  custom_description TEXT,
  custom_video_url TEXT,                                -- Coach can assign a specific YouTube video

  -- Goals
  player_goal TEXT,                                     -- "Work on your first touch and passing accuracy"
  target_completions INTEGER DEFAULT 1,                 -- How many times to practice
  current_completions INTEGER DEFAULT 0,

  -- Status
  status TEXT DEFAULT 'assigned',                       -- assigned, in_progress, completed, archived
  due_date DATE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Player response
  player_notes TEXT,                                    -- Player can leave notes about their practice
  player_video_url TEXT,                                -- Player can upload a video response
  player_rating INTEGER CHECK (player_rating BETWEEN 1 AND 5),  -- Self-assessment

  -- Coach feedback
  coach_feedback TEXT,
  coach_rating INTEGER CHECK (coach_rating BETWEEN 1 AND 5),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dev_assignments_player ON player_development_assignments(player_id);
CREATE INDEX IF NOT EXISTS idx_dev_assignments_org ON player_development_assignments(org_id);
CREATE INDEX IF NOT EXISTS idx_dev_assignments_team ON player_development_assignments(team_id);
CREATE INDEX IF NOT EXISTS idx_dev_assignments_status ON player_development_assignments(status);
```

### Table 6: `practice_reflections`
Pre-practice and post-practice check-ins that players complete. Drives mindset, accountability, and coach insight.

```sql
CREATE TABLE IF NOT EXISTS practice_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES schedule_events(id),
  player_id UUID NOT NULL REFERENCES players(id),
  reflection_type TEXT NOT NULL,                -- 'pre_practice', 'post_practice'

  -- Structured responses (JSON for flexibility across sports)
  responses JSONB NOT NULL DEFAULT '{}',
  /*
    Pre-practice example:
    {
      "readiness": 4,           -- 1-5 scale
      "focus_area": "Serving",  -- Free text or from sport positions
      "mindset": "Confident",   -- Options: Confident, Nervous, Excited, Tired, Focused
      "support_needed": "Help with jump serve timing"
    }

    Post-practice example:
    {
      "effort_rating": 4,       -- 1-5 scale
      "energy_level": 3,        -- 1-5 scale
      "best_moment": "Hit 3 aces in serving drill",
      "struggle_area": "Still shanking passes to the left",
      "takeaway": "Need to work on platform angle"
    }
  */

  submitted_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(event_id, player_id, reflection_type)
);

CREATE INDEX IF NOT EXISTS idx_reflections_event ON practice_reflections(event_id);
CREATE INDEX IF NOT EXISTS idx_reflections_player ON practice_reflections(player_id);
```

### Table 7: `reflection_templates`
Coaches can customize what questions appear in reflections. Org-scoped, sport-aware.

```sql
CREATE TABLE IF NOT EXISTS reflection_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  created_by UUID NOT NULL REFERENCES profiles(id),
  sport_id UUID REFERENCES sports(id),

  title TEXT NOT NULL,                          -- "Volleyball Pre-Practice Check-In"
  reflection_type TEXT NOT NULL,                -- 'pre_practice', 'post_practice'
  is_default BOOLEAN DEFAULT FALSE,            -- One default per type per org/sport

  -- Questions as structured JSON array
  questions JSONB NOT NULL DEFAULT '[]',
  /*
    [
      {
        "key": "readiness",
        "prompt": "How ready do you feel for today's practice?",
        "answer_type": "rating_scale",    -- rating_scale, text, select, multi_select
        "min": 1,
        "max": 5,
        "required": true,
        "options": null
      },
      {
        "key": "focus_area",
        "prompt": "What's your focus for this practice?",
        "answer_type": "text",
        "required": false,
        "options": null
      },
      {
        "key": "mindset",
        "prompt": "How is your mindset right now?",
        "answer_type": "select",
        "required": true,
        "options": ["Confident", "Nervous", "Excited", "Tired", "Focused", "Frustrated"]
      }
    ]
  */

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reflection_templates_org ON reflection_templates(org_id);
```

---

## ROW LEVEL SECURITY (RLS)

Apply RLS policies matching existing Lynx patterns. Every new table needs:

```sql
-- Enable RLS on all new tables
ALTER TABLE drills ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_practice_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_development_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflection_templates ENABLE ROW LEVEL SECURITY;

-- Pattern: Users can read rows where org_id matches their current_organization_id
-- Pattern: Coaches/admins can insert/update, players can read + update their own reflections/assignments
-- Follow exact same RLS patterns used on existing tables like schedule_events, player_skill_ratings
```

---

## NAVIGATION ADDITIONS

Add new nav items to the existing sidebar structure in `LynxSidebar.jsx`. These fit under existing section groups.

### Coach Navigation
Under the existing **"My Teams"** or **"Schedule"** section, add:
```
Practice Planning (sub-section header)
  - Drill Library        → /drills
  - Practice Plans       → /practice-plans
```

Under existing **"Schedule"** section (no change needed — practice events already show on `/schedule`):
- When a coach clicks on a practice event, the event detail now shows a "Practice Plan" tab

### Admin Navigation
Under **"Operations"** section, add:
```
  - Drill Library        → /drills
```

### Player Navigation
Under existing **"My Team"** or **"Achievements"** section, add:
```
  - My Development       → /my-development
```

### Parent Navigation
No new nav items. Development info appears as a new tab on the existing player profile page (`/parent/player/:playerId`).

---

## PHASE PLAN

This spec is broken into 6 phases. Each phase is independently deployable and testable. Complete them in order.

---

## PHASE 1: Database Schema
**Goal:** Create all 7 new tables in Supabase with RLS policies.

**Files to create:**
- `supabase/migrations/YYYYMMDD_practice_and_development.sql`

**Actions:**
1. Create all 7 tables listed above using exact SQL provided
2. Add all indexes listed above
3. Enable RLS on all tables
4. Add RLS policies following existing patterns in the codebase
5. Seed default reflection templates for volleyball (pre-practice and post-practice)

**Verification:**
- All 7 tables appear in Supabase dashboard
- Can insert a test drill row and query it back
- RLS blocks unauthenticated access
- Build passes: `npm run build`

**Commit:**
```bash
git add supabase/migrations/
git commit -m "Phase 1: Add practice planning and player development database tables"
```

---

## PHASE 2: Drill Library Page & Components
**Goal:** Build the Drill Library page where coaches create, browse, search, and manage drills with YouTube video import.

**Files to create:**
- `src/pages/drills/DrillLibraryPage.jsx` — Main drill library page
- `src/pages/drills/DrillDetailModal.jsx` — Drill detail view/edit modal
- `src/pages/drills/CreateDrillModal.jsx` — Create/import drill modal
- `src/lib/youtube-helpers.js` — YouTube URL parsing and thumbnail extraction
- `src/lib/drill-service.js` — Supabase CRUD for drills

**Files to modify:**
- `src/lib/routes.js` — Add `/drills` route
- `src/App.jsx` — Add DrillLibraryPage route
- `src/components/layout/LynxSidebar.jsx` — Add "Drill Library" nav item for coach + admin roles

### Drill Library Page Layout
Follow existing Lynx page patterns (PageShell, SeasonFilterBar, etc.):

```
┌─────────────────────────────────────────────────────┐
│  DRILL LIBRARY                    [+ Add Drill ▼]   │
│  [Sport Filter] [Category Filter] [Search...]       │
│                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ thumbnail│ │ thumbnail│ │ thumbnail│ │ thumb  │ │
│  │          │ │          │ │          │ │        │ │
│  │ Title    │ │ Title    │ │ Title    │ │ Title  │ │
│  │ 10 min   │ │ 15 min   │ │ 10 min   │ │ 5 min  │ │
│  │ category │ │ category │ │ category │ │ categ  │ │
│  │ [♡][+Pln]│ │ [♡][+Pln]│ │ [♡][+Pln]│ │[♡][+P] │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│                                                      │
│  ┌──────────┐ ┌──────────┐                          │
│  │ ...      │ │ ...      │                          │
│  └──────────┘ └──────────┘                          │
└─────────────────────────────────────────────────────┘
```

### [+ Add Drill] Dropdown Options:
1. **Create from scratch** — Opens CreateDrillModal with blank form
2. **Import from YouTube** — Opens CreateDrillModal with YouTube URL input first

### YouTube Import Flow:
1. Coach pastes a YouTube URL
2. `youtube-helpers.js` extracts the video ID from the URL (handle youtube.com/watch?v=, youtu.be/, youtube.com/shorts/ formats)
3. Build thumbnail URL: `https://img.youtube.com/vi/{VIDEO_ID}/hqdefault.jpg`
4. Build embed URL: `https://www.youtube.com/embed/{VIDEO_ID}`
5. Pre-fill the drill form with the video URL and thumbnail
6. Coach fills in title, description, category, duration, etc.
7. Save to `drills` table

### Drill Detail Modal:
When clicking a drill card, show a modal with:
- Embedded YouTube video player (iframe)
- Full description with sections (Setup, Execution, Coaching Points — stored as structured text in `description`)
- Category, duration, intensity, equipment tags
- Action buttons: [Add to Plan], [Assign to Player], [Edit], [Delete]
- "Used in X practices" count

### Drill Card Component:
Each drill renders as a card with:
- Video thumbnail (or placeholder if no video)
- Title, duration badge, category badge
- Favorite heart icon
- Quick-action: [+ Plan] to add to a practice plan

**Verification:**
- `/drills` page renders with empty state when no drills exist
- Can create a drill from scratch (form saves to Supabase)
- Can import a YouTube URL and see the thumbnail auto-populate
- Can search/filter drills by sport, category, and text
- Drill detail modal opens and shows video player
- Build passes: `npm run build`

**Commit:**
```bash
git add src/pages/drills/ src/lib/youtube-helpers.js src/lib/drill-service.js src/lib/routes.js src/App.jsx src/components/layout/LynxSidebar.jsx
git commit -m "Phase 2: Add Drill Library page with YouTube import and drill CRUD"
```

---

## PHASE 3: Practice Plan Builder
**Goal:** Build the Practice Plan page where coaches create ordered, timed practice plans from their drill library.

**Files to create:**
- `src/pages/practice-plans/PracticePlansPage.jsx` — List of saved practice plans
- `src/pages/practice-plans/PracticePlanBuilder.jsx` — The plan builder (drag-and-drop drill ordering)
- `src/lib/practice-plan-service.js` — Supabase CRUD for practice plans and items

**Files to modify:**
- `src/lib/routes.js` — Add `/practice-plans` and `/practice-plans/:planId` routes
- `src/App.jsx` — Add PracticePlansPage and PracticePlanBuilder routes
- `src/components/layout/LynxSidebar.jsx` — Add "Practice Plans" nav item for coach role

### Practice Plan Builder Layout:

```
┌─────────────────────────────────────────────────────┐
│  ← Back to Plans                                     │
│  PRACTICE PLAN: [Editable Title]     [Save] [Use ▼] │
│  Target: 90 min | Planned: 75 min | Sport: Volleyball│
│                                                      │
│  DRILL SEQUENCE                    DRILL LIBRARY     │
│  ┌─────────────────────┐          ┌───────────────┐ │
│  │ ≡ 1. Warm Up Drills │ 10 min   │ [Search...]   │ │
│  │      [edit] [x]     │          │               │ │
│  ├─────────────────────┤          │ Passing Drill │ │
│  │ ≡ 2. Passing Drill  │ 15 min   │ [+ Add]       │ │
│  │      [edit] [x]     │          │               │ │
│  ├─────────────────────┤          │ Serving Reps  │ │
│  │ ≡ 3. Serving Reps   │ 15 min   │ [+ Add]       │ │
│  │      [edit] [x]     │          │               │ │
│  ├─────────────────────┤          │ 3v3 Game      │ │
│  │ ≡ 4. 3v3 Scrimmage  │ 20 min   │ [+ Add]       │ │
│  │      [edit] [x]     │          │               │ │
│  ├─────────────────────┤          │ Cool Down     │ │
│  │ ≡ 5. Cool Down      │ 10 min   │ [+ Add]       │ │
│  │      [edit] [x]     │          └───────────────┘ │
│  ├─────────────────────┤                             │
│  │ [+ Add Drill]       │                             │
│  │ [+ Add Custom Block]│          PLAN SUMMARY      │
│  └─────────────────────┘          Total: 70 min     │
│                                    5 drills          │
│                                    Focus: Passing,   │
│                                           Serving    │
└─────────────────────────────────────────────────────┘
```

### Key Behaviors:
- **Drag to reorder** drills in the sequence (use HTML5 native drag-and-drop, matching existing Lynx pattern from AdvancedLineupBuilder)
- **Inline time editing** — click the duration to change it for this plan (doesn't change the drill's default)
- **Custom blocks** — coach can add non-drill items (e.g., "Water break", "Team talk") as ad-hoc items
- **Running total** — always shows total planned time vs. target duration
- **[Use ▼] dropdown:**
  - "Attach to a Practice" — opens a picker showing upcoming practice events from `schedule_events`
  - "Save as Template" — marks `is_template = TRUE` for reuse
  - "Duplicate" — copies the plan

### Practice Plans List Page:
- Grid of plan cards showing title, duration, drill count, last used date
- Filter by sport, team
- [+ Create Practice Plan] button
- Favorites filter

**Verification:**
- `/practice-plans` page renders with list of saved plans
- Can create a new plan and add drills from the library
- Can reorder drills via drag-and-drop
- Can edit duration per drill within the plan
- Running total updates correctly
- Can save and re-open a plan
- Can attach a plan to an upcoming practice event
- Build passes: `npm run build`

**Commit:**
```bash
git add src/pages/practice-plans/ src/lib/practice-plan-service.js src/lib/routes.js src/App.jsx src/components/layout/LynxSidebar.jsx
git commit -m "Phase 3: Add Practice Plan Builder with drag-and-drop drill sequencing"
```

---

## PHASE 4: Practice Event Integration
**Goal:** Connect practice plans to existing schedule_events so coaches see their plan when viewing a practice on the schedule.

**Files to create:**
- `src/components/practice/PracticePlanTab.jsx` — Practice plan tab for event detail
- `src/components/practice/PracticeMode.jsx` — Live practice mode (step through drills)
- `src/lib/event-practice-service.js` — Supabase CRUD for event_practice_plans

**Files to modify:**
- The existing event detail modal/page (wherever practice events are currently displayed — likely in `SchedulePage.jsx` or a related component)
- Add a "Practice Plan" tab alongside existing event info

### What Changes on the Schedule:
When a coach views a practice event (event_type = 'practice'), the event detail now shows tabs:
- **Details** (existing — date, time, location, RSVP)
- **Practice Plan** (NEW — shows the attached plan with drills in order)
- **Reflections** (NEW — shows pre/post reflection responses from players)
- **Attendance** (existing)

### Practice Plan Tab Content:
- If no plan attached: empty state with [Attach a Plan] and [Create New Plan] buttons
- If plan attached: shows ordered drill list with thumbnails, durations, and a [Start Practice Mode] button

### Practice Mode:
A focused, full-width view that steps through each drill:

```
┌─────────────────────────────────────────────────────┐
│  PRACTICE MODE — Volleyball Practice          [Exit] │
│  Drill 3 of 5 | 45 min elapsed | 25 min remaining  │
│                                                      │
│  ┌───────────────────────────────────────────────┐  │
│  │                                               │  │
│  │         [YouTube Video Embed]                 │  │
│  │                                               │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  SERVING REPS                              15 min    │
│  Setup: Line up behind the end line...               │
│  Coaching Points: Watch the toss height...           │
│                                                      │
│  [← Previous Drill]              [Next Drill →]     │
│                                                      │
│  DRILL TIMELINE:                                     │
│  [✓ Warmup] [✓ Passing] [● Serving] [○ Scrimmage]  │
└─────────────────────────────────────────────────────┘
```

This gives the coach a "TV mode" they can display on a tablet or screen during practice.

**Verification:**
- Practice event detail shows "Practice Plan" tab
- Can attach an existing plan to a practice event
- Practice plan tab shows ordered drills with thumbnails
- Practice Mode launches and steps through drills
- Can exit Practice Mode and return to event detail
- Build passes: `npm run build`

**Commit:**
```bash
git add src/components/practice/ src/lib/event-practice-service.js
git commit -m "Phase 4: Integrate practice plans into schedule events with Practice Mode"
```

---

## PHASE 5: Player Development System
**Goal:** Build the player development assignment and tracking system. Coaches assign drills to players, players track completion, coaches review.

**Files to create:**
- `src/pages/development/PlayerDevelopmentPage.jsx` — Player's "My Development" page
- `src/components/development/AssignDrillModal.jsx` — Coach assigns a drill to a player
- `src/components/development/DevelopmentCard.jsx` — Assignment card component
- `src/components/development/DevelopmentTab.jsx` — Tab for player profile (coach/parent view)
- `src/lib/development-service.js` — Supabase CRUD for player_development_assignments

**Files to modify:**
- `src/lib/routes.js` — Add `/my-development` route
- `src/App.jsx` — Add PlayerDevelopmentPage route
- `src/components/layout/LynxSidebar.jsx` — Add "My Development" nav item for player role
- `src/pages/drills/DrillDetailModal.jsx` — Add [Assign to Player] action that opens AssignDrillModal
- Player profile page (parent view) — Add "Development" tab

### Player View — "My Development" Page:

```
┌─────────────────────────────────────────────────────┐
│  MY DEVELOPMENT                                      │
│  "Keep grinding, Carlos! 3 assignments this week."   │
│                                                      │
│  ACTIVE ASSIGNMENTS (2)                              │
│  ┌─────────────────────────────────────────────┐    │
│  │ 🎥 4-Step Approach Drill                     │    │
│  │ Assigned by Coach Mike | Due: Apr 10         │    │
│  │ "Work on your timing on the last two steps"  │    │
│  │ Progress: ██████░░░░ 1/3 completions         │    │
│  │ [Mark Complete] [Watch Video] [Add Notes]    │    │
│  └─────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────┐    │
│  │ 🎥 Wall Passing Reps                         │    │
│  │ Assigned by Coach Mike | Due: Apr 12         │    │
│  │ "100 passes against the wall, focus on       │    │
│  │  platform angle"                              │    │
│  │ Progress: ░░░░░░░░░░ 0/5 completions         │    │
│  │ [Mark Complete] [Watch Video] [Add Notes]    │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  COMPLETED (5)                              [View →] │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐               │
│  │ ✓  │ │ ✓  │ │ ✓  │ │ ✓  │ │ ✓  │               │
│  └────┘ └────┘ └────┘ └────┘ └────┘               │
└─────────────────────────────────────────────────────┘
```

### Coach View — Assign Drill Modal:
When a coach clicks [Assign to Player] from a drill:
1. Select player(s) from a searchable roster list (multi-select)
2. Set a due date (optional)
3. Set target completions (default 1)
4. Add a personal message/goal for the player
5. Save — creates rows in `player_development_assignments`

### Coach View — Development Tab on Player Profile:
When a coach views a player profile, a new "Development" tab shows:
- Active assignments with status
- Completion history and streaks
- Player's self-ratings and notes
- Coach can leave feedback on completed assignments

### Parent View — Development Tab:
Parents see a read-only version of their child's development assignments:
- What's been assigned and by whom
- Completion progress
- Coach feedback when available

### XP Integration:
When a player marks an assignment complete:
- Award XP via existing `xp_ledger` (source_type = 'development_assignment', xp_amount = 25)
- If all target completions met, award bonus XP (50)
- This integrates with existing achievement/level system automatically

**Verification:**
- Coach can assign a drill to a player from the drill detail modal
- Player sees assignments on `/my-development` page
- Player can mark completions and add notes
- Coach sees development tab on player profile
- Parent sees development tab (read-only)
- XP is awarded on completion
- Build passes: `npm run build`

**Commit:**
```bash
git add src/pages/development/ src/components/development/ src/lib/development-service.js src/lib/routes.js src/App.jsx src/components/layout/LynxSidebar.jsx
git commit -m "Phase 5: Add Player Development system with assignments, tracking, and XP"
```

---

## PHASE 6: Practice Reflections
**Goal:** Build pre-practice and post-practice reflection system for players.

**Files to create:**
- `src/components/practice/ReflectionPrompt.jsx` — Reflection form component (renders questions from template)
- `src/components/practice/ReflectionSummary.jsx` — Coach view of player responses
- `src/components/practice/ReflectionTemplateEditor.jsx` — Coach manages reflection templates
- `src/lib/reflection-service.js` — Supabase CRUD for reflections and templates

**Files to modify:**
- `src/components/practice/PracticePlanTab.jsx` (from Phase 4) — Add "Reflections" sub-section
- Player dashboard or event detail — Show reflection prompt when a practice is upcoming/recent

### How Reflections Work:

**For Players:**
1. When a player has an upcoming practice event (within 2 hours), their dashboard shows a "Pre-Practice Check-In" card
2. Player taps it, fills out the reflection questions (rating scales, text, selects)
3. After practice, a "Post-Practice Reflection" card appears (available for 24 hours after event)
4. Completing reflections earns XP (15 XP each)

**For Coaches:**
1. On the practice event detail → Reflections tab, coaches see all player responses
2. Summary view: average readiness scores, common focus areas, who hasn't responded
3. Individual view: each player's full responses
4. Coach can manage templates: add/edit/reorder questions, set required/optional, choose answer types

### Default Volleyball Pre-Practice Template:
```json
[
  {"key": "readiness", "prompt": "How ready do you feel for today's practice?", "answer_type": "rating_scale", "min": 1, "max": 5, "required": true},
  {"key": "focus_area", "prompt": "What's your focus for this practice?", "answer_type": "text", "required": false},
  {"key": "mindset", "prompt": "How is your mindset right now?", "answer_type": "select", "required": true, "options": ["Confident", "Nervous", "Excited", "Tired", "Focused", "Frustrated"]},
  {"key": "support_needed", "prompt": "Where do you need support from your coach today?", "answer_type": "text", "required": false}
]
```

### Default Volleyball Post-Practice Template:
```json
[
  {"key": "effort_rating", "prompt": "How hard did you work today?", "answer_type": "rating_scale", "min": 1, "max": 5, "required": true},
  {"key": "energy_level", "prompt": "How's your energy level now?", "answer_type": "rating_scale", "min": 1, "max": 5, "required": true},
  {"key": "best_moment", "prompt": "What was the best moment of practice?", "answer_type": "text", "required": false},
  {"key": "struggle_area", "prompt": "What did you struggle with?", "answer_type": "text", "required": false},
  {"key": "takeaway", "prompt": "What's one thing you'll work on before next practice?", "answer_type": "text", "required": false}
]
```

**Verification:**
- Player sees pre-practice reflection card before upcoming practice
- Player can complete reflection form
- Post-practice reflection appears after event time
- Coach sees reflection responses on practice event detail
- Coach can edit reflection templates
- XP is awarded for completing reflections
- Build passes: `npm run build`

**Commit:**
```bash
git add src/components/practice/ReflectionPrompt.jsx src/components/practice/ReflectionSummary.jsx src/components/practice/ReflectionTemplateEditor.jsx src/lib/reflection-service.js
git commit -m "Phase 6: Add Practice Reflections with customizable templates and XP rewards"
```

---

## FINAL VERIFICATION CHECKLIST

After all 6 phases:

- [ ] All 7 new Supabase tables exist with RLS enabled
- [ ] Drill Library page loads at `/drills` with create, import, search, filter
- [ ] YouTube URL import works (thumbnail auto-populates, video embeds)
- [ ] Practice Plans page loads at `/practice-plans` with create and builder
- [ ] Practice Plan Builder supports drag-and-drop drill reordering
- [ ] Practice events on the schedule show "Practice Plan" tab
- [ ] Practice Mode steps through drills with video embeds
- [ ] Coaches can assign drills to players
- [ ] Players see `/my-development` with active assignments
- [ ] Players can mark completions and earn XP
- [ ] Parents see Development tab on player profile (read-only)
- [ ] Pre/Post practice reflections work for players
- [ ] Coaches see reflection responses on practice event detail
- [ ] All existing features still work (schedule, games, chat, achievements, etc.)
- [ ] Build passes: `npm run build`
- [ ] No console errors on any new or existing page

---

## FINAL REPORT TEMPLATE

```
## Spec Execution Report
- Spec: CC-PRACTICE-AND-PLAYER-DEVELOPMENT.md
- Phases completed: X/6
- Phases skipped: X (with reasons)
- New tables created: [list]
- New files created: [list]
- Existing files modified: [list]
- Total lines changed: +X / -Y
- Build status: PASS / FAIL
- Unintended changes: NONE / [list]
- New routes working: [list with pass/fail]
- XP integration verified: YES / NO
- Issues discovered during execution: [list or "none"]
```

---

## FUTURE CONSIDERATIONS (Not in this spec)

These are ideas for future specs, not for this implementation:

1. **Drill sharing marketplace** — Coaches share drills publicly across orgs (uses `is_public` flag)
2. **AI practice plan generation** — "Build me a 90-minute volleyball practice focused on passing" using drill library
3. **Video feedback on assignments** — Players upload video of themselves doing the drill, coach annotates
4. **Practice attendance analytics** — Correlation between practice attendance and game performance
5. **Season development plans** — Multi-week structured development programs per player
6. **Drill effectiveness tracking** — Which drills correlate with stat improvements
7. **Parent practice notifications** — "Your child has 2 development assignments due this week"
