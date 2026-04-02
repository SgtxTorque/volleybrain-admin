# CC-PRACTICE-PLANNING-WEB.md
# Lynx Web Admin — Practice Planning & Drill Library
# PHASED EXECUTION SPEC

**Type:** Build  
**Branch:** Create new branch `feat/practice-planning` off latest `feat/v2-dashboard-redesign`  
**Run with:** `--dangerously-skip-permissions`  
**Prerequisite:** Lineup Builder V2 work must be merged/stable before starting  

---

## READ FIRST
1. CC-SPEC-GUARDRAILS.md
2. CLAUDE.md
3. SUPABASE_SCHEMA.md (for existing table context)
4. LYNX-UX-PHILOSOPHY.md (progressive disclosure, conditional rendering)
5. LINEUP-BUILDER-INVESTIGATION-REPORT.md (for understanding of existing theme system, nav patterns, Supabase patterns)
6. This spec

---

## OVERVIEW

This spec builds the **coach's practice planning toolkit** for Lynx web. It adds a Drill Library, a Practice Plan Builder, attaches plans to existing practice events on the schedule, and wires player-specific drill assignments into the **existing Development tab** on the player profile.

**This spec is WEB ONLY.** The following features are explicitly deferred to a separate mobile spec:
- Practice Mode (stepping through drills live in the gym)
- Player-facing reflection forms (pre/post practice check-ins)
- Player-facing drill assignment view ("My Development" shortcut)
- Quick drill lookup for in-gym use

**What this spec builds:**
- A Drill Library page where coaches create, import (YouTube), search, and manage reusable drills
- A Practice Plan Builder that assembles drills into timed, ordered practice sessions
- Practice plans that attach to existing `schedule_events` where `event_type = 'practice'`
- "Assign to Player" flow from drill cards, wired into the existing Development tab
- Reflection template editor for coaches (the player-facing form is mobile-first, deferred)
- A "Practice" nav group in the coach sidebar

**What this spec does NOT do:**
- Build Practice Mode (mobile spec)
- Build player-facing "My Development" page (mobile spec, web shortcut is just their profile Development tab)
- Modify existing game-day, lineup, stats, or scoring features
- Alter existing database tables — all changes are NEW tables and NEW columns only
- Touch auth, theme, or payment systems

---

## CONTEXT: WHAT ALREADY EXISTS

| Existing Feature | Table / Component | How This Spec Uses It |
|---|---|---|
| Practice events | `schedule_events` (event_type = 'practice') | Practice plans attach to these via `event_id` |
| Player profiles | `players`, `player_skill_ratings`, `player_evaluations` | Drill assignments link to players |
| Development tab | Player profile → Development tab | Drill assignments surface in "Coach Intelligence" and "Strategic Objectives" sections |
| Skill Progression | Radar chart on Development tab | Fed by evaluations; development work enriches this data over time |
| Team structure | `teams`, `team_players`, `team_coaches` | Drills and plans are scoped to teams/orgs |
| XP & Engagement | `xp_ledger`, `achievements`, `player_achievement_progress` | Completing assigned drills earns XP |
| Schedule page | `SchedulePage.jsx`, `CalendarViews.jsx` | Practice events already display here |
| Multi-sport | `sports` table, `SportContext` | Drills are tagged by sport_id |
| Org scoping | `organizations`, `current_organization_id` on profiles | All new tables include org_id for RLS |
| Theme system | `ThemeContext.jsx`, `useThemeClasses()` | All new components must support light/dark mode |
| Bulk practices | `BulkPracticeModal.jsx` | Already exists for creating recurring practices |

---

## DATABASE SCHEMA — NEW TABLES

All tables use `IF NOT EXISTS`. All include `org_id` for RLS scoping. All use UUID primary keys matching existing Lynx conventions.

### Table 1: `drills`

```sql
CREATE TABLE IF NOT EXISTS drills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  created_by UUID NOT NULL REFERENCES profiles(id),
  sport_id UUID REFERENCES sports(id),
  team_id UUID REFERENCES teams(id),            -- NULL = org-wide, set = team-specific

  -- Content
  title TEXT NOT NULL,
  description TEXT,                               -- Rich text: setup, execution, coaching points
  category TEXT NOT NULL DEFAULT 'general',
  duration_minutes INTEGER NOT NULL DEFAULT 10,
  intensity TEXT DEFAULT 'medium',                -- low, medium, high
  min_players INTEGER,
  max_players INTEGER,
  equipment TEXT[],                               -- array: ['balls', 'cones', 'net']
  tags TEXT[],                                    -- freeform tags for search/filter

  -- Media
  video_url TEXT,                                 -- YouTube/Vimeo URL
  video_thumbnail_url TEXT,                       -- Auto-extracted or manually set
  video_source TEXT,                              -- 'youtube', 'vimeo', 'upload'
  diagram_url TEXT,                               -- Uploaded court/field diagram image

  -- Metadata
  is_public BOOLEAN DEFAULT FALSE,               -- Future: shared drill marketplace

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drills_org ON drills(org_id);
CREATE INDEX IF NOT EXISTS idx_drills_sport ON drills(sport_id);
CREATE INDEX IF NOT EXISTS idx_drills_category ON drills(category);
CREATE INDEX IF NOT EXISTS idx_drills_created_by ON drills(created_by);
```

**NOTE:** No `is_favorite` boolean on the drill itself. Favorites are per-user via the join table below. No `use_count` column — compute on read.

### Table 2: `drill_favorites`

```sql
CREATE TABLE IF NOT EXISTS drill_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  drill_id UUID NOT NULL REFERENCES drills(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, drill_id)
);

CREATE INDEX IF NOT EXISTS idx_drill_favorites_user ON drill_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_drill_favorites_drill ON drill_favorites(drill_id);
```

### Table 3: `drill_categories`
Sport-specific categories so coaches can customize. Seeded with defaults, editable per org.

```sql
CREATE TABLE IF NOT EXISTS drill_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),       -- NULL = system default
  sport_id UUID REFERENCES sports(id),             -- NULL = all sports
  name TEXT NOT NULL,                               -- 'warmup', 'serving', 'passing', etc.
  display_name TEXT NOT NULL,                       -- 'Warm Up', 'Serving', 'Passing', etc.
  sort_order INTEGER DEFAULT 0,
  color TEXT,                                       -- Optional hex for UI badge
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, sport_id, name)
);

CREATE INDEX IF NOT EXISTS idx_drill_categories_org ON drill_categories(org_id);
CREATE INDEX IF NOT EXISTS idx_drill_categories_sport ON drill_categories(sport_id);
```

**Seed data (run after table creation):**
```sql
-- Volleyball defaults (org_id = NULL means system-wide)
INSERT INTO drill_categories (org_id, sport_id, name, display_name, sort_order) VALUES
  (NULL, NULL, 'warmup', 'Warm Up', 1),
  (NULL, NULL, 'conditioning', 'Conditioning', 2),
  (NULL, NULL, 'skill_work', 'Skill Work', 3),
  (NULL, NULL, 'game_like', 'Game-Like', 4),
  (NULL, NULL, 'scrimmage', 'Scrimmage', 5),
  (NULL, NULL, 'cooldown', 'Cool Down', 6)
ON CONFLICT DO NOTHING;

-- Volleyball-specific (requires volleyball sport_id — use subquery)
INSERT INTO drill_categories (org_id, sport_id, name, display_name, sort_order)
SELECT NULL, id, name, display_name, sort_order FROM (VALUES
  ('serving', 'Serving', 10),
  ('passing', 'Passing', 11),
  ('setting', 'Setting', 12),
  ('attacking', 'Attacking', 13),
  ('blocking', 'Blocking', 14),
  ('defense', 'Defense', 15),
  ('transition', 'Transition', 16),
  ('serve_receive', 'Serve Receive', 17)
) AS v(name, display_name, sort_order)
CROSS JOIN sports WHERE sports.name ILIKE '%volleyball%'
ON CONFLICT DO NOTHING;
```

### Table 4: `practice_plans`

```sql
CREATE TABLE IF NOT EXISTS practice_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  created_by UUID NOT NULL REFERENCES profiles(id),
  sport_id UUID REFERENCES sports(id),
  team_id UUID REFERENCES teams(id),

  title TEXT NOT NULL,
  description TEXT,
  target_duration_minutes INTEGER,
  focus_areas TEXT[],                              -- ['passing', 'serving']
  is_template BOOLEAN DEFAULT FALSE,              -- TRUE = reusable template

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_practice_plans_org ON practice_plans(org_id);
CREATE INDEX IF NOT EXISTS idx_practice_plans_sport ON practice_plans(sport_id);
CREATE INDEX IF NOT EXISTS idx_practice_plans_team ON practice_plans(team_id);
```

### Table 5: `practice_plan_favorites`

```sql
CREATE TABLE IF NOT EXISTS practice_plan_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  practice_plan_id UUID NOT NULL REFERENCES practice_plans(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, practice_plan_id)
);
```

### Table 6: `practice_plan_items`

```sql
CREATE TABLE IF NOT EXISTS practice_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_plan_id UUID NOT NULL REFERENCES practice_plans(id) ON DELETE CASCADE,
  drill_id UUID REFERENCES drills(id),            -- NULL if custom/ad-hoc block

  sort_order INTEGER NOT NULL DEFAULT 0,
  custom_title TEXT,                               -- Override drill title, or title for ad-hoc blocks
  custom_notes TEXT,                               -- Coach notes specific to this plan usage
  duration_minutes INTEGER NOT NULL DEFAULT 10,    -- Can differ from drill default
  item_type TEXT DEFAULT 'drill',                  -- 'drill', 'break', 'talk', 'custom'

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_practice_plan_items_plan ON practice_plan_items(practice_plan_id);
```

### Table 7: `event_practice_plans`

```sql
CREATE TABLE IF NOT EXISTS event_practice_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES schedule_events(id) ON DELETE CASCADE,
  practice_plan_id UUID NOT NULL REFERENCES practice_plans(id),
  status TEXT DEFAULT 'draft',                    -- draft, ready, in_progress, completed
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  coach_notes TEXT,                               -- Post-practice notes

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id)                                -- One plan per event
);

CREATE INDEX IF NOT EXISTS idx_event_practice_plans_event ON event_practice_plans(event_id);
```

### Table 8: `player_development_assignments`

```sql
CREATE TABLE IF NOT EXISTS player_development_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  player_id UUID NOT NULL REFERENCES players(id),
  assigned_by UUID NOT NULL REFERENCES profiles(id),
  team_id UUID REFERENCES teams(id),

  -- What's assigned
  drill_id UUID REFERENCES drills(id),
  assignment_type TEXT NOT NULL DEFAULT 'drill',  -- 'drill', 'custom', 'video_review'
  custom_title TEXT,
  custom_description TEXT,
  custom_video_url TEXT,

  -- Goals
  player_goal TEXT,                                -- "Work on your first touch accuracy"
  target_completions INTEGER DEFAULT 1,
  current_completions INTEGER DEFAULT 0,

  -- Status
  status TEXT DEFAULT 'assigned',                  -- assigned, in_progress, completed, archived
  due_date DATE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Player response (filled on mobile, visible on web)
  player_notes TEXT,
  player_video_url TEXT,
  player_rating INTEGER CHECK (player_rating BETWEEN 1 AND 5),

  -- Coach feedback (filled on web)
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

### Table 9: `reflection_templates`

```sql
CREATE TABLE IF NOT EXISTS reflection_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  created_by UUID NOT NULL REFERENCES profiles(id),
  sport_id UUID REFERENCES sports(id),

  title TEXT NOT NULL,
  reflection_type TEXT NOT NULL,                  -- 'pre_practice', 'post_practice'
  is_default BOOLEAN DEFAULT FALSE,

  questions JSONB NOT NULL DEFAULT '[]',
  /*
    [
      { "key": "readiness", "prompt": "How ready do you feel?", "answer_type": "rating_scale", "min": 1, "max": 5, "required": true },
      { "key": "focus_area", "prompt": "What's your focus?", "answer_type": "text", "required": false },
      { "key": "mindset", "prompt": "How is your mindset?", "answer_type": "select", "required": true, "options": ["Confident", "Nervous", "Excited", "Tired", "Focused"] }
    ]
  */

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reflection_templates_org ON reflection_templates(org_id);
```

### Table 10: `practice_reflections`

```sql
CREATE TABLE IF NOT EXISTS practice_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES schedule_events(id),
  player_id UUID NOT NULL REFERENCES players(id),
  reflection_type TEXT NOT NULL,                  -- 'pre_practice', 'post_practice'
  template_id UUID REFERENCES reflection_templates(id),

  responses JSONB NOT NULL DEFAULT '{}',

  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, player_id, reflection_type)
);

CREATE INDEX IF NOT EXISTS idx_reflections_event ON practice_reflections(event_id);
CREATE INDEX IF NOT EXISTS idx_reflections_player ON practice_reflections(player_id);
```

---

## ROW LEVEL SECURITY

```sql
ALTER TABLE drills ENABLE ROW LEVEL SECURITY;
ALTER TABLE drill_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE drill_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_plan_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_practice_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_development_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflection_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_reflections ENABLE ROW LEVEL SECURITY;

-- Follow existing Lynx RLS patterns:
-- SELECT: org_id matches user's current_organization_id (via profiles table)
-- INSERT/UPDATE: coaches and admins (check team_coaches or is_platform_admin())
-- player_development_assignments: players can UPDATE their own rows (player_notes, player_rating, current_completions, status)
-- practice_reflections: players can INSERT/UPDATE their own rows
-- drill_categories: system defaults (org_id IS NULL) readable by all, org-specific editable by admins
```

CC should write full RLS policies following the exact same patterns used on `schedule_events`, `player_skill_ratings`, and `game_lineups` in the existing codebase. Use `public.is_platform_admin()` where recursive profile queries would otherwise be needed.

---

## NAVIGATION

### Coach Sidebar — Add new "Practice" group

**File: `src/MainApp.jsx`** — In the `coachNavGroups` array, add a new group AFTER "Schedule" and BEFORE "Compete":

```javascript
{ id: 'practice', label: 'Practice', type: 'group', icon: 'clipboard-list', items: [
  { id: 'drills', label: 'Drill Library', icon: 'play-circle' },
  { id: 'practice-plans', label: 'Practice Plans', icon: 'list-ordered' },
]},
```

### Admin Sidebar — Add under existing "Scheduling" group or new "Practice" group

```javascript
// Add to admin nav groups, same structure
{ id: 'practice', label: 'Practice', type: 'group', icon: 'clipboard-list', items: [
  { id: 'drills', label: 'Drill Library', icon: 'play-circle' },
  { id: 'practice-plans', label: 'Practice Plans', icon: 'list-ordered' },
]},
```

### Player Sidebar — No changes

Players access development through their existing profile Development tab. No new nav items needed on web. (Mobile spec will add a "My Development" shortcut on the player home screen.)

### Parent Sidebar — No changes

Parents access development through the existing player profile Development tab when viewing their child.

### Icon Mapping

**File: `src/components/layout/LynxSidebar.jsx`** — Add to the icon lookup object:
```javascript
'clipboard-list': ClipboardList,  // from lucide-react
'play-circle': PlayCircle,        // from lucide-react
'list-ordered': ListOrdered,       // from lucide-react
```

Verify these icons are available in the existing lucide-react import. If not, add them to the import statement in `src/constants/icons.js` or wherever lucide icons are centrally imported.

---

## PHASE PLAN

4 phases. Each independently deployable and testable. Complete in order.

---

## PHASE 1: Database Schema + Service Layer
**Commit message prefix:** `feat(practice): phase 1 —`

### 1A. Create Migration File

**Create file: `src/lib/migrations/practice-planning-migrations.sql`**

Include ALL table creation SQL from the schema section above (10 tables), all indexes, RLS enable statements, full RLS policies, and seed data for drill_categories and default reflection templates.

This file is a reference — the developer will run it manually in Supabase SQL Editor.

### 1B. Create Service Files

**Create file: `src/lib/drill-service.js`**

```javascript
import { supabase } from './supabase'

// ============================================
// DRILL SERVICE — Supabase CRUD for drills
// ============================================

export async function fetchDrills({ orgId, sportId, category, search, teamId, limit = 50, offset = 0 }) {
  let query = supabase
    .from('drills')
    .select('*, drill_favorites!left(id)', { count: 'exact' })
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (sportId) query = query.eq('sport_id', sportId)
  if (category) query = query.eq('category', category)
  if (teamId) query = query.eq('team_id', teamId)
  if (search) query = query.ilike('title', `%${search}%`)

  const { data, error, count } = await query
  return { data, error, count }
}

export async function fetchDrill(drillId) {
  const { data, error } = await supabase
    .from('drills')
    .select('*, drill_favorites!left(id)')
    .eq('id', drillId)
    .single()
  return { data, error }
}

export async function createDrill(drill) {
  const { data, error } = await supabase.from('drills').insert(drill).select().single()
  return { data, error }
}

export async function updateDrill(drillId, updates) {
  const { data, error } = await supabase
    .from('drills')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', drillId)
    .select()
    .single()
  return { data, error }
}

export async function deleteDrill(drillId) {
  const { error } = await supabase.from('drills').delete().eq('id', drillId)
  return { error }
}

export async function toggleDrillFavorite(userId, drillId) {
  // Check if already favorited
  const { data: existing } = await supabase
    .from('drill_favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('drill_id', drillId)
    .single()

  if (existing) {
    await supabase.from('drill_favorites').delete().eq('id', existing.id)
    return { favorited: false }
  } else {
    await supabase.from('drill_favorites').insert({ user_id: userId, drill_id: drillId })
    return { favorited: true }
  }
}

export async function fetchDrillCategories({ orgId, sportId }) {
  let query = supabase
    .from('drill_categories')
    .select('*')
    .order('sort_order')

  // Get system defaults (org_id IS NULL) AND org-specific
  query = query.or(`org_id.is.null,org_id.eq.${orgId}`)
  if (sportId) query = query.or(`sport_id.is.null,sport_id.eq.${sportId}`)

  const { data, error } = await query
  return { data, error }
}

export function getDrillUseCount(drillId) {
  // Computed on read, not stored
  return supabase
    .from('practice_plan_items')
    .select('id', { count: 'exact', head: true })
    .eq('drill_id', drillId)
}
```

**Create file: `src/lib/practice-plan-service.js`**

```javascript
import { supabase } from './supabase'

export async function fetchPracticePlans({ orgId, sportId, teamId, limit = 50 }) {
  let query = supabase
    .from('practice_plans')
    .select('*, practice_plan_items(count), practice_plan_favorites!left(id)')
    .eq('org_id', orgId)
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (sportId) query = query.eq('sport_id', sportId)
  if (teamId) query = query.eq('team_id', teamId)

  const { data, error } = await query
  return { data, error }
}

export async function fetchPracticePlan(planId) {
  const { data, error } = await supabase
    .from('practice_plans')
    .select(`
      *,
      practice_plan_items(
        *,
        drills(id, title, video_thumbnail_url, category, duration_minutes, intensity)
      )
    `)
    .eq('id', planId)
    .single()

  // Sort items by sort_order
  if (data?.practice_plan_items) {
    data.practice_plan_items.sort((a, b) => a.sort_order - b.sort_order)
  }

  return { data, error }
}

export async function createPracticePlan(plan) {
  const { data, error } = await supabase.from('practice_plans').insert(plan).select().single()
  return { data, error }
}

export async function updatePracticePlan(planId, updates) {
  const { data, error } = await supabase
    .from('practice_plans')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', planId)
    .select()
    .single()
  return { data, error }
}

export async function deletePracticePlan(planId) {
  // CASCADE deletes practice_plan_items
  const { error } = await supabase.from('practice_plans').delete().eq('id', planId)
  return { error }
}

export async function savePlanItems(planId, items) {
  // Delete existing items and re-insert (same pattern as game_lineups)
  await supabase.from('practice_plan_items').delete().eq('practice_plan_id', planId)

  if (items.length === 0) return { error: null }

  const records = items.map((item, index) => ({
    practice_plan_id: planId,
    drill_id: item.drill_id || null,
    sort_order: index,
    custom_title: item.custom_title || null,
    custom_notes: item.custom_notes || null,
    duration_minutes: item.duration_minutes || 10,
    item_type: item.item_type || 'drill',
  }))

  const { error } = await supabase.from('practice_plan_items').insert(records)
  return { error }
}

export async function attachPlanToEvent(eventId, planId) {
  const { data, error } = await supabase
    .from('event_practice_plans')
    .upsert({ event_id: eventId, practice_plan_id: planId, status: 'ready' }, { onConflict: 'event_id' })
    .select()
    .single()
  return { data, error }
}

export async function getEventPracticePlan(eventId) {
  const { data, error } = await supabase
    .from('event_practice_plans')
    .select(`
      *,
      practice_plans(
        *,
        practice_plan_items(
          *,
          drills(id, title, description, video_url, video_thumbnail_url, category, duration_minutes, intensity, equipment)
        )
      )
    `)
    .eq('event_id', eventId)
    .single()

  return { data, error }
}
```

**Create file: `src/lib/youtube-helpers.js`**

```javascript
// ============================================
// YOUTUBE HELPERS — URL parsing and thumbnail extraction
// ============================================

/**
 * Extract YouTube video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
export function extractYouTubeId(url) {
  if (!url) return null

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

/**
 * Get thumbnail URL for a YouTube video
 */
export function getYouTubeThumbnail(videoId, quality = 'hqdefault') {
  if (!videoId) return null
  // quality options: default, mqdefault, hqdefault, sddefault, maxresdefault
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`
}

/**
 * Get embed URL for a YouTube video
 */
export function getYouTubeEmbedUrl(videoId) {
  if (!videoId) return null
  return `https://www.youtube.com/embed/${videoId}`
}

/**
 * Check if a URL is a YouTube URL
 */
export function isYouTubeUrl(url) {
  return extractYouTubeId(url) !== null
}

/**
 * Process a pasted URL: extract ID, build thumbnail and embed URLs
 */
export function processVideoUrl(url) {
  const videoId = extractYouTubeId(url)
  if (!videoId) return { isValid: false, videoId: null, thumbnailUrl: null, embedUrl: null }

  return {
    isValid: true,
    videoId,
    thumbnailUrl: getYouTubeThumbnail(videoId),
    embedUrl: getYouTubeEmbedUrl(videoId),
    source: 'youtube',
  }
}
```

**Create file: `src/lib/development-service.js`**

```javascript
import { supabase } from './supabase'

// ============================================
// PLAYER DEVELOPMENT SERVICE
// ============================================

export async function fetchPlayerAssignments(playerId, { status } = {}) {
  let query = supabase
    .from('player_development_assignments')
    .select('*, drills(id, title, video_url, video_thumbnail_url, category, duration_minutes)')
    .eq('player_id', playerId)
    .order('assigned_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  return { data, error }
}

export async function assignDrillToPlayers({ orgId, drillId, playerIds, assignedBy, teamId, playerGoal, targetCompletions, dueDate }) {
  const records = playerIds.map(playerId => ({
    org_id: orgId,
    player_id: playerId,
    assigned_by: assignedBy,
    team_id: teamId,
    drill_id: drillId,
    assignment_type: 'drill',
    player_goal: playerGoal || null,
    target_completions: targetCompletions || 1,
    due_date: dueDate || null,
  }))

  const { data, error } = await supabase
    .from('player_development_assignments')
    .insert(records)
    .select()

  return { data, error }
}

export async function updateAssignment(assignmentId, updates) {
  const { data, error } = await supabase
    .from('player_development_assignments')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', assignmentId)
    .select()
    .single()
  return { data, error }
}

export async function addCoachFeedback(assignmentId, { coachFeedback, coachRating, reviewedBy }) {
  return updateAssignment(assignmentId, {
    coach_feedback: coachFeedback,
    coach_rating: coachRating,
    reviewed_by: reviewedBy,
    reviewed_at: new Date().toISOString(),
  })
}
```

### Phase 1 Verification

1. Run migration SQL in Supabase — all 10 tables created
2. Verify drill_categories seed data exists
3. Service files import cleanly: `grep -rn "from.*drill-service\|from.*practice-plan-service\|from.*youtube-helpers\|from.*development-service" src/` should return no errors at build time
4. `npm run build` passes

**Commit:** `feat(practice): phase 1 — database schema, service layer, YouTube helpers`

---

## PHASE 2: Drill Library Page
**Commit message prefix:** `feat(practice): phase 2 —`

### 2A. Create Drill Library Page

**Create file: `src/pages/drills/DrillLibraryPage.jsx`**

A standard Lynx page following existing patterns (use `DashboardContainer` or `PageShell` wrapper). Must use `useThemeClasses()` for all styling.

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  DRILL LIBRARY                         [+ Add Drill]│
│  [All Categories ▼] [Search drills...]  [♡ Favorites]│
│                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ thumbnail│ │ thumbnail│ │ thumbnail│ │ thumb  │ │
│  │          │ │          │ │          │ │        │ │
│  │ Title    │ │ Title    │ │ Title    │ │ Title  │ │
│  │ 10m  Cat │ │ 15m  Cat │ │ 10m  Cat │ │ 5m Cat │ │
│  │ [♡]      │ │ [♡]      │ │ [♡]      │ │ [♡]    │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│                                                      │
│  Empty state: "Build your drill library. Add your    │
│  favorite drills with YouTube videos, coaching        │
│  points, and diagrams."  [+ Create First Drill]      │
└─────────────────────────────────────────────────────┘
```

**Key behaviors:**
- 4-column responsive grid (4 on desktop, 3 on medium, 2 on small)
- Category filter dropdown populated from `drill_categories` for the current sport
- Text search with debounce (300ms)
- Favorites toggle filter
- Cards show: video thumbnail (or gradient placeholder with sport emoji), title, duration badge, category badge, favorite heart
- Clicking a card opens `DrillDetailModal`
- [+ Add Drill] button with dropdown: "Create from scratch" | "Import from YouTube"

### 2B. Create Drill Card Component

**Create file: `src/pages/drills/DrillCard.jsx`**

Compact card component. Shows thumbnail (with play icon overlay if video exists), title, duration, category pill, intensity indicator, favorite toggle. Theme-aware.

### 2C. Create Drill Modal

**Create file: `src/pages/drills/CreateDrillModal.jsx`**

Modal form for creating/editing a drill. Fields:
- Title (required)
- YouTube URL input — on paste/blur, call `processVideoUrl()` and show thumbnail preview
- Description (textarea — sections: Setup, Execution, Coaching Points as prompted placeholders)
- Category (dropdown from `drill_categories`)
- Duration (number input, minutes)
- Intensity (low/medium/high toggle pills)
- Equipment (multi-select tags)
- Custom tags (freeform input)
- Diagram upload (image upload to Supabase Storage, same pattern as player photo uploads)

When "Import from YouTube" is selected, the modal opens with the URL field focused and expanded.

### 2D. Create Drill Detail Modal

**Create file: `src/pages/drills/DrillDetailModal.jsx`**

Full detail view when clicking a drill card. Shows:
- Embedded YouTube player (responsive iframe, 16:9 ratio)
- Full description
- Category, duration, intensity, equipment tags
- "Used in X practices" count (computed from `practice_plan_items`)
- Action buttons: [Add to Plan], [Assign to Player], [Edit], [Delete]
- [Assign to Player] opens the assign modal (Phase 3)
- [Add to Plan] opens a picker of existing practice plans (or "Create new plan")

### 2E. Wire Routes and Nav

**Modify: `src/lib/routes.js`** — Add `/drills` route
**Modify: `src/MainApp.jsx`** — Add Route component, add "Practice" nav group to coach and admin
**Modify: `src/components/layout/LynxSidebar.jsx`** — Add icon mappings

**Create file: `src/pages/drills/index.js`** — Barrel export

### Phase 2 Verification

1. Navigate to `/drills` as coach — page renders with empty state
2. Create a drill from scratch — fills form, saves, card appears in grid
3. Import from YouTube — paste URL, thumbnail auto-populates, save
4. Search drills by title — results filter in real-time
5. Filter by category — grid updates
6. Toggle favorite on a drill — heart fills/unfills
7. Click a drill card — detail modal opens with video player
8. Light mode and dark mode both render correctly
9. `npm run build` passes

**Commit:** `feat(practice): phase 2 — drill library page with YouTube import and CRUD`

---

## PHASE 3: Practice Plan Builder
**Commit message prefix:** `feat(practice): phase 3 —`

### 3A. Create Practice Plans List Page

**Create file: `src/pages/practice-plans/PracticePlansPage.jsx`**

Grid of saved practice plans. Each card shows: title, total duration, drill count, focus areas, last updated, favorite toggle. [+ Create Practice Plan] button. Filter by sport, team, favorites.

### 3B. Create Practice Plan Builder

**Create file: `src/pages/practice-plans/PracticePlanBuilder.jsx`**

Split-view layout (similar to Lineup Builder V2 philosophy):

```
┌──────────────────────────────────────────────────────┐
│  ← Back to Plans                                      │
│  [Editable Title]              [Save] [Attach ▼]     │
│  Target: 90 min | Current: 75 min | 5 drills         │
│                                                       │
│  DRILL SEQUENCE (left ~60%)     DRILL PICKER (right)  │
│  ┌──────────────────────────┐  ┌────────────────────┐│
│  │ ≡ 1. Warm Up       10m  │  │ [Search drills...] ││
│  │      Coach notes... [x]  │  │ [Category ▼]       ││
│  ├──────────────────────────┤  │                    ││
│  │ ≡ 2. Passing Drill  15m │  │ Drill Card  [+ Add]││
│  │      Coach notes... [x]  │  │ Drill Card  [+ Add]││
│  ├──────────────────────────┤  │ Drill Card  [+ Add]││
│  │ ≡ 3. Water Break    5m  │  │ Drill Card  [+ Add]││
│  │      (break) ·····  [x]  │  │ ...                ││
│  ├──────────────────────────┤  │                    ││
│  │ ≡ 4. Serving Reps   15m │  │ PLAN SUMMARY       ││
│  │      Coach notes... [x]  │  │ Total: 70 min      ││
│  ├──────────────────────────┤  │ 5 items            ││
│  │ [+ Add Drill]            │  │ Focus: Passing,    ││
│  │ [+ Add Break/Talk]       │  │        Serving     ││
│  └──────────────────────────┘  └────────────────────┘│
└──────────────────────────────────────────────────────┘
```

**Key behaviors:**
- Left panel: ordered list of plan items, drag-to-reorder (HTML5 native drag, same pattern as lineup builder)
- Each item shows: drag handle, index number, title (from drill or custom), duration (editable inline — click to change), coach notes (expandable), remove button
- [+ Add Drill] inserts from the drill picker on the right
- [+ Add Break/Talk] inserts an ad-hoc block (water break, team talk, etc.) with `item_type: 'break'` or `'talk'`
- Right panel: searchable/filterable drill picker showing drill cards from the library. Click [+ Add] on a drill card to append it to the sequence
- Running total always visible: current total duration vs target duration. If over target, show amber warning
- [Attach ▼] dropdown: "Attach to upcoming practice" (shows practice events from schedule), "Save as template" (sets `is_template = true`), "Duplicate plan"
- [Save] persists the plan and all items

### 3C. Wire Routes

**Modify: `src/lib/routes.js`** — Add `/practice-plans` and `/practice-plans/:planId`
**Modify: `src/MainApp.jsx`** — Add Route components

**Create file: `src/pages/practice-plans/index.js`** — Barrel export

### Phase 3 Verification

1. Navigate to `/practice-plans` — page renders with empty state
2. Create a new plan — title field, save works
3. Open plan builder — split view renders
4. Add drills from picker to sequence — they appear in the left panel
5. Drag to reorder — items reorder correctly
6. Edit duration on a plan item — total updates
7. Add a custom break/talk block — renders with different styling
8. Running total shows correct math, amber warning when over target
9. Save and reopen — all items persist in correct order
10. Attach plan to an upcoming practice event — `event_practice_plans` row created
11. Light and dark mode both render correctly
12. `npm run build` passes

**Commit:** `feat(practice): phase 3 — practice plan builder with drag-and-drop sequencing`

---

## PHASE 4: Event Integration + Player Development Wiring
**Commit message prefix:** `feat(practice): phase 4 —`

### 4A. Practice Plan Tab on Event Detail

**Create file: `src/components/practice/PracticePlanTab.jsx`**

When a coach views a practice event (from SchedulePage or EventDetailModal), add a "Practice Plan" tab. This component:

- If no plan attached: empty state with [Attach a Plan] (picker from saved plans) and [Create New Plan] (navigates to builder)
- If plan attached: shows ordered drill list with thumbnails, durations, category badges, coach notes
- Status indicator: Draft → Ready → Completed
- Post-practice notes field (saves to `event_practice_plans.coach_notes`)

**Modify:** The existing event detail modal or page where practice events are displayed. Find the component that renders when clicking a practice event on the schedule. Add "Practice Plan" as a new tab alongside existing tabs (Details, Attendance, etc.).

Search for the component by looking at:
- `src/pages/schedule/EventDetailModal.jsx` — this is likely the main one
- Any component that checks `event_type === 'practice'`

Add the tab conditionally: only show "Practice Plan" tab when `event.event_type === 'practice'`.

### 4B. Assign Drill to Player Modal

**Create file: `src/components/practice/AssignDrillModal.jsx`**

Opened from [Assign to Player] button on `DrillDetailModal.jsx`. This modal:

1. Shows the drill being assigned (thumbnail, title, video link)
2. Searchable multi-select roster list (from current team's `team_players`)
3. Player goal text field ("Work on your first touch accuracy")
4. Target completions (number input, default 1)
5. Due date (date picker, optional)
6. [Assign] button — creates rows in `player_development_assignments`
7. Success toast: "Drill assigned to X players"

### 4C. Wire Assignments into Existing Development Tab

**This is the key integration point.** Find the existing Development tab component on the player profile. Based on the screenshot, it already has sections for:
- Skill Progression (radar chart)
- Evaluation History
- Last Game Performance
- Coach Intelligence (currently "No coach feedback shared yet")
- Strategic Objectives (currently "No goals set yet")

**Modify the Development tab component** to:

**"Coach Intelligence" section** — Replace the empty state with a feed of active development assignments:
```
COACH INTELLIGENCE
┌─────────────────────────────────────────────┐
│ 🎥 4-Step Approach Drill                     │
│ Assigned by Coach Carlos | Due: Apr 10       │
│ "Work on timing on the last two steps"       │
│ Progress: ██████░░░░ 1/3                     │
│ [View Drill] [Add Feedback]                  │
├─────────────────────────────────────────────┤
│ 🎥 Wall Passing Reps                         │
│ Assigned by Coach Carlos | Due: Apr 12       │
│ Progress: ░░░░░░░░░░ 0/5                     │
│ [View Drill] [Add Feedback]                  │
└─────────────────────────────────────────────┘
│ + Assign a Drill  (coach only)              │
```

- Coach view: sees all assignments, can add feedback, can assign new drills via [+ Assign a Drill] which opens a drill picker → AssignDrillModal
- Parent view: sees all assignments and progress (read-only)
- Player view: sees assignments, progress, and can view drill details. (Marking completions is mobile — on web the player can see but not easily "do" the drill)

**"Strategic Objectives" section** — Allow coaches to set text-based goals for this player:
- This can be a simple editable text area (coach only) that saves to a new column or a lightweight objectives model
- For V1: use the existing `player_notes` or add a simple `player_objectives` JSONB column on `player_development_assignments` or the player profile
- OR: keep it simple — the `player_goal` field on each assignment IS the strategic objective. Group assignments by their goal text to create an objectives view.

**Finding the Development tab file:** Search for:
```bash
grep -rn "Development\|SKILL PROGRESSION\|Coach Intelligence\|Strategic Objectives" src/ --include="*.jsx" | grep -v _archive | grep -v node_modules
```

CC should find the component, understand its structure, and add the data fetching + rendering for assignments.

### 4D. Reflection Template Editor (Coach Web Tool)

**Create file: `src/components/practice/ReflectionTemplateEditor.jsx`**

A settings-style page or modal where coaches manage their reflection templates. Accessible from the Practice nav group or from Settings.

- Lists existing templates (pre-practice, post-practice)
- Each template shows its questions in order
- Coach can add/edit/remove/reorder questions
- Question types: rating_scale (1-5), text, select (with options), multi_select
- Seed default volleyball templates on first use
- Save to `reflection_templates` table

This is the setup tool. The player-facing reflection FORM is deferred to mobile spec. On web, coaches can also see reflection responses on the practice event detail (Phase 4A's PracticePlanTab can include a "Reflections" sub-section showing submitted responses).

### 4E. Reflection Responses View (Coach Web)

**Add to `src/components/practice/PracticePlanTab.jsx`** or as a sub-component:

After a practice event, show a summary of player reflections:
- How many players responded (X/Y)
- Average readiness score (pre-practice)
- Average effort score (post-practice)
- Expandable list of individual player responses
- "No reflections yet" empty state with note: "Players submit reflections from the Lynx mobile app"

This is read-only on web. The data comes from `practice_reflections` where `event_id` matches.

### Phase 4 Verification

1. Open a practice event on the schedule → "Practice Plan" tab appears
2. Attach an existing plan to the event → plan details show in the tab
3. Create a new plan from the event detail → navigates to builder, plan auto-attaches on save
4. Open a drill detail → click [Assign to Player] → modal shows roster → assign → success toast
5. Navigate to the assigned player's profile → Development tab → "Coach Intelligence" section shows the assignment
6. As parent, view the same player profile → Development tab shows assignment (read-only)
7. Open reflection template editor → default templates load → can edit questions → save
8. On a practice event detail → reflections section shows "No reflections yet" (until mobile app submits data)
9. Light and dark mode render correctly on all new components
10. `npm run build` passes

**Commit:** `feat(practice): phase 4 — event integration, player development wiring, reflection templates`

---

## FILES SUMMARY

### New Files (Phase → File)

| Phase | File | Purpose |
|-------|------|---------|
| 1 | `src/lib/migrations/practice-planning-migrations.sql` | All table DDL + seeds |
| 1 | `src/lib/drill-service.js` | Drill CRUD |
| 1 | `src/lib/practice-plan-service.js` | Plan CRUD |
| 1 | `src/lib/youtube-helpers.js` | YouTube URL parsing |
| 1 | `src/lib/development-service.js` | Assignment CRUD |
| 2 | `src/pages/drills/DrillLibraryPage.jsx` | Main drill library page |
| 2 | `src/pages/drills/DrillCard.jsx` | Drill card component |
| 2 | `src/pages/drills/CreateDrillModal.jsx` | Create/edit drill modal |
| 2 | `src/pages/drills/DrillDetailModal.jsx` | Drill detail with video |
| 2 | `src/pages/drills/index.js` | Barrel export |
| 3 | `src/pages/practice-plans/PracticePlansPage.jsx` | Plans list page |
| 3 | `src/pages/practice-plans/PracticePlanBuilder.jsx` | Plan builder |
| 3 | `src/pages/practice-plans/index.js` | Barrel export |
| 4 | `src/components/practice/PracticePlanTab.jsx` | Event detail tab |
| 4 | `src/components/practice/AssignDrillModal.jsx` | Assign drill to players |
| 4 | `src/components/practice/ReflectionTemplateEditor.jsx` | Template editor |

### Modified Files

| Phase | File | Changes |
|-------|------|---------|
| 2 | `src/MainApp.jsx` | Add "Practice" nav group, add routes |
| 2 | `src/lib/routes.js` | Add /drills, /practice-plans routes |
| 2 | `src/components/layout/LynxSidebar.jsx` | Add icon mappings |
| 3 | `src/MainApp.jsx` | Add practice plan routes |
| 4 | Event detail component (find via investigation) | Add "Practice Plan" tab |
| 4 | Development tab component (find via investigation) | Wire in assignments to Coach Intelligence + Strategic Objectives |

---

## IMPORTANT RULES FOR CC

1. **Every phase gets its own commit** with the specified prefix
2. **All new components MUST use `useThemeClasses()`** — zero hardcoded colors for backgrounds, borders, or text
3. **HTML5 native drag-and-drop only** in the plan builder — no new libraries
4. **No new npm dependencies** unless absolutely unavoidable
5. **Follow existing page patterns** — look at how DrillLibraryPage should mirror RosterManagerPage or SeasonLeaderboardsPage in structure (PageShell, filters, grid)
6. **Use Inter Variable font** — already loaded globally
7. **14px border radius** for cards and panels
8. **Use `DashboardContainer` or `PageShell`** as page wrapper — match existing pattern
9. **Supabase patterns** — match existing `.select()`, `.eq()`, `.order()` patterns from other services
10. **Player photos** — use the existing `player.photo_url` pattern with fallback to jersey number/initials gradient
11. **DO NOT create a "My Development" page** — development lives on the existing player profile Development tab
12. **DO NOT build Practice Mode** — deferred to mobile spec
13. **The `drill_categories` table uses seeded defaults** — CC should query and display these, not hardcode category lists in JSX
14. **YouTube embeds** use `<iframe>` with `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"` and `allowFullScreen`
15. **Favorites are per-user** — always filter `drill_favorites` by current user ID, never set a boolean on the drill row
