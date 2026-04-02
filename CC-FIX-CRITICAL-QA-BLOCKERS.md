# CC-FIX-CRITICAL-QA-BLOCKERS.md

## Overview
Three critical bugs from QA testing, all P1 — fix before beta:

1. **Team creation fails with HTTP 400** — Empty strings sent to nullable Postgres columns
2. **Win % shows "1.0%" instead of "100%"** — DB stores fraction, display expects percentage
3. **Team edit blocked by "Age group required"** — Existing teams without age group can't save ANY edits

---

## FIX 1: Team Creation HTTP 400

**File:** `src/pages/teams/TeamsPage.jsx`

**Root Cause:** Same bug as the season creation fix. The `createTeam()` function passes empty strings (`''`) for nullable fields like `age_group`, `skill_level`, `gender`, etc. PostgreSQL rejects empty strings on columns that expect specific types or have check constraints.

### Find the `createTeam` function (around line 162) and replace the opening through the `.single()` call:

**Find:**
```javascript
  async function createTeam(formData) {
    try {
      const { data: newTeam, error } = await supabase
        .from('teams')
        .insert({
          season_id: selectedSeason.id,
          name: formData.name,
          abbreviation: formData.abbreviation || null,
          color: formData.color,
          logo_url: formData.logo_url || null,
          age_group: formData.age_group,
          age_group_type: formData.age_group_type,
          team_type: formData.team_type,
          skill_level: formData.skill_level,
          gender: formData.gender,
          max_roster_size: formData.max_roster_size,
          min_roster_size: formData.min_roster_size,
          roster_open: formData.roster_open,
          description: formData.description || null,
          internal_notes: formData.internal_notes || null
        })
        .select()
        .single()
```

**Replace with:**
```javascript
  async function createTeam(formData) {
    try {
      // Clean empty strings to null for nullable Postgres columns
      const clean = (v) => (v === '' || v === undefined) ? null : v

      const { data: newTeam, error } = await supabase
        .from('teams')
        .insert({
          season_id: selectedSeason.id,
          name: formData.name,
          abbreviation: clean(formData.abbreviation),
          color: formData.color,
          logo_url: clean(formData.logo_url),
          age_group: clean(formData.age_group),
          age_group_type: clean(formData.age_group_type),
          team_type: clean(formData.team_type),
          skill_level: clean(formData.skill_level),
          gender: clean(formData.gender),
          max_roster_size: formData.max_roster_size,
          min_roster_size: formData.min_roster_size,
          roster_open: formData.roster_open,
          description: clean(formData.description),
          internal_notes: clean(formData.internal_notes)
        })
        .select()
        .single()
```

Leave everything after `.single()` unchanged — the error handling is already correct in this function.

---

## FIX 2: Win Percentage Display

**File:** `src/pages/standings/TeamStandingsPage.jsx`

**Root Cause:** Two data paths:
- Path A: `team_standings` DB table → stores `win_percentage` as a **fraction** (0.0 to 1.0)
- Path B: Calculated from games → stores as **percentage** (0 to 100)

The display code uses the value raw without normalizing. When Path A provides `1.0` (meaning 100%), it displays as "1.0%".

### Find (around line 265):
```javascript
  const winPct = standings?.win_percentage || 0
  const isWinning = winPct >= 50
```

### Replace with:
```javascript
  // Normalize win_percentage: team_standings table stores as fraction (0-1),
  // but calculated fallback stores as percentage (0-100). Normalize to 0-100.
  const rawWinPct = standings?.win_percentage || 0
  const winPct = rawWinPct > 0 && rawWinPct <= 1 ? rawWinPct * 100 : rawWinPct
  const isWinning = winPct >= 50
```

---

## FIX 3: Team Edit Age Group Blocker

**File:** `src/pages/teams/EditTeamModal.jsx`

**Root Cause:** `isValid` requires both `name` AND `age_group`. Teams created before the age group field was added have no age group set, so the Save button is permanently disabled — even for unrelated edits like changing the team name or color.

### Find (around line 89):
```javascript
  const isValid = form.name.trim() && form.age_group
```

### Replace with:
```javascript
  const isValid = form.name.trim()
```

The `⚠ Age group required` warning on line 350 stays as a visual nudge. It just no longer blocks saves.

---

## Verification

1. `npm run build` — zero errors
2. **Team creation:** Teams page → + New Team → fill name + pick color (skip age group) → Create → should succeed
3. **Team creation with all fields:** Fill every field including age group → Create → should also succeed
4. **Win percentage:** Standings → select a team with a 1-0 record → should show "100.0%" not "1.0%"
5. **Team edit:** Teams → select an existing team without age group → Edit → change the name → Save → should succeed without age group blocking

## Commit
```
git add src/pages/teams/TeamsPage.jsx src/pages/standings/TeamStandingsPage.jsx src/pages/teams/EditTeamModal.jsx
git commit -m "[fix] Team creation: clean empty strings to null; Win %: normalize fraction to percentage; Team edit: remove age_group save blocker"
```
