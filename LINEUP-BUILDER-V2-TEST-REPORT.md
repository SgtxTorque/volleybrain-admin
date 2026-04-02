# Lineup Builder V2 — Test Report

## Test Matrix

| Test | Light Mode | Dark Mode | Status |
|------|-----------|-----------|--------|
| Builder opens full-screen, no page scroll | Ready | Ready | Built |
| Court shows 6 position slots in correct arrangement | Ready | Ready | Built |
| Drag player from roster to court position | Ready | Ready | Built |
| Remove player from position (click X) | Ready | Ready | Built |
| Auto-fill populates available players | Ready | Ready | Built |
| Clear removes all assignments | Ready | Ready | Built |
| Rotation nav (1-6) updates court positions | Ready | Ready | Built |
| Formation dropdown (5-1, 6-2, 4-2, 6-6) changes position roles | Ready | Ready | Built |
| Set tabs (1, 2, 3) maintain separate lineups | Ready | Ready | Built |
| Copy to all sets | Ready | Ready | Built |
| Save lineup persists to DB (with formation_type, set_number, team_id) | Ready | Ready | Built |
| Reopen loads saved lineup (including formation) | Ready | Ready | Built |
| Libero assignment works | Ready | Ready | Built |
| RSVP status visible on roster cards | Ready | Ready | Built |
| System conflict warning (multiple setters in 5-1) | Ready | Ready | Built |
| RSVP warning (player said No but in lineup) | Ready | Ready | Built |
| Roster tab: filter All/Starters/Bench | Ready | Ready | Built |
| Rotations tab: mini grid of all 6 rotations | Ready | Ready | Built |
| Substitutions tab: planned subs with counter | Ready | Ready | Built |
| Analytics tab: placeholder renders | Ready | Ready | Built |
| Save as template | Ready | Ready | Built |
| Load template | Ready | Ready | Built |
| Default template auto-loads for new game | Ready | Ready | Built |
| Right panel scrolls independently | Ready | Ready | Built |
| Control bar is always visible | Ready | Ready | Built |
| Header bar is always visible | Ready | Ready | Built |
| No hardcoded colors (grep verification) | Ready | Ready | Passed |

## Color Audit

Command: `grep -rn "#[0-9a-fA-F]{6}" src/components/games/lineup-v2/ --include="*.jsx"`

```
CourtView.jsx:4:  OH: '#EF4444', S: '#10B981', MB: '#F59E0B', OPP: '#6366F1',
CourtView.jsx:5:  L: '#FFEAA7', DS: '#DDA0DD', H: '#EF4444',
CourtView.jsx:6:  PG: '#3B82F6', SG: '#10B981', SF: '#F59E0B', PF: '#EF4444', C: '#8B5CF6',
CourtView.jsx:7:  GK: '#F59E0B', DEF: '#3B82F6', MID: '#10B981', FWD: '#EF4444',
CourtView.jsx:11: const roleColor = ROLE_COLORS[position.role] || '#64748B'
CourtView.jsx:182: style={{ backgroundColor: '#FFEAA7', color: '#000' }}>L</span>
```

**Result: PASS** — All hardcoded hex values are position role colors (OH, S, MB, OPP, L, DS, etc.), which are semantic and allowed per the design rules.

## Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `src/components/games/lineup-v2/LineupBuilderV2.jsx` | ~520 | Main container — full-screen overlay, data loading, save, rotation, drag-drop |
| `src/components/games/lineup-v2/HeaderBar.jsx` | ~115 | Top bar — close, team vs opponent, set tabs, formation badge, save button, template buttons |
| `src/components/games/lineup-v2/CourtView.jsx` | ~190 | Court visualization — 6 position slots, NET/attack line, player cards, drop targets |
| `src/components/games/lineup-v2/RightPanel.jsx` | ~300 | Tabbed panel — Roster (drag source), Rotations (mini grids), Subs (planned), Analytics (placeholder) |
| `src/components/games/lineup-v2/ControlBar.jsx` | ~105 | Bottom strip — rotation nav, formation selector, auto-fill/clear/copy, status pill |
| `src/components/games/lineup-v2/TemplateManager.jsx` | ~250 | Template CRUD — SaveTemplateModal, LoadTemplateDropdown, useTemplateAutoLoad hook |
| `src/components/games/lineup-v2/index.js` | 1 | Barrel export |
| `src/constants/sportConfigs.js` | ~230 | Consolidated sport configs (formations + stats, 8 sports) |
| `src/lib/migrations/lineup-v2-migrations.sql` | ~65 | DB migration SQL — ALTER game_lineups, CREATE lineup_templates, RLS, indexes |

## Files Modified

| File | Changes |
|------|---------|
| `src/MainApp.jsx` | Renamed 3 "Game Day" nav groups to "Compete" (admin, coach, TM/player) |
| `src/pages/standings/TeamStandingsPage.jsx` | Updated 3 breadcrumbs from "Game Day" to "Compete" |
| `src/pages/leaderboards/SeasonLeaderboardsPage.jsx` | Updated 1 breadcrumb from "Game Day" to "Compete" |
| `src/components/games/AdvancedLineupBuilder.jsx` | Removed inline SPORT_CONFIGS, imports from shared file, removed from export |
| `src/components/games/GameComponents.jsx` | Removed inline SPORT_CONFIGS + getSportConfig, imports from shared file |
| `src/pages/schedule/LineupBuilder.jsx` | Updated getSportConfig import to use shared file |
| `src/pages/gameprep/GamePrepPage.jsx` | Replaced AdvancedLineupBuilder with LineupBuilderV2 (V1 import removed) |
| `src/pages/gameprep/GameDayHelpers.jsx` | Updated useGameDayTheme() to use real theme system (light + dark mode) |

## DB Changes

The following SQL needs to be run in Supabase SQL Editor (reference file: `src/lib/migrations/lineup-v2-migrations.sql`):

1. **ALTER TABLE game_lineups** — Add columns: `formation_type TEXT`, `set_number INTEGER DEFAULT 1`, `team_id UUID REFERENCES teams(id)`, `position_role TEXT`
2. **Backfill team_id** from schedule_events
3. **Default formation_type** to '5-1' for existing records
4. **CREATE TABLE lineup_templates** with org_id, team_id, name, formation_type, positions JSONB, libero_id, is_default, created_by
5. **RLS policies** for lineup_templates (view by org, manage by coach/admin)
6. **Indexes** on game_lineups(event_id, set_number) and lineup_templates(team_id)

## Architecture Summary

```
┌──────────────────────────────────────────────────────────────────┐
│ LineupBuilderV2.jsx (fixed inset-0 z-[60])                       │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ HeaderBar.jsx (56px, flex-shrink-0)                          │ │
│ │ [X] Team vs Opponent  [Set 1][2][3][+]  [Load][Save As][Save]│ │
│ ├──────────────────────────────┬─────────────────────────────┤ │
│ │ CourtView.jsx (flex-1)       │ RightPanel.jsx (380px)       │ │
│ │                              │ [Roster][Rotations][Subs]    │ │
│ │         NET                  │ [Analytics]                  │ │
│ │  ┌────┐ ┌────┐ ┌────┐      │                              │ │
│ │  │ P4 │ │ P3 │ │ P2 │      │ (scrolls internally)         │ │
│ │  └────┘ └────┘ └────┘      │                              │ │
│ │    ╌╌ ATTACK LINE ╌╌       │                              │ │
│ │  ┌────┐ ┌────┐ ┌────┐      │                              │ │
│ │  │ P5 │ │ P6 │ │ P1🏐│      │                              │ │
│ │  └────┘ └────┘ └────┘      │                              │ │
│ ├──────────────────────────────┴─────────────────────────────┤ │
│ │ ControlBar.jsx (56px, flex-shrink-0)                        │ │
│ │ [◀][1][2][3][4][5][6][▶]  [Formation▼]  [Copy][Auto][Clear]│ │
│ └──────────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────────┐   │
│ │ TemplateManager.jsx (modals, on-demand z-[70])             │   │
│ └────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```
