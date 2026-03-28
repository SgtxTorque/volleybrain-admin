# CC-COACH-CONTEXT-BLEEDING-INVESTIGATION.md
# Coach Role — Season Context Bleeding + Missing Data + Broken Challenges
## Repo: SgtxTorque/volleybrain-admin | Branch: main

---

## PURPOSE

This is an **investigation-only** spec. Do NOT modify any files. Three related issues discovered during QA. Write your report to: `CC-COACH-CONTEXT-BLEEDING-REPORT.md` in the project root.

---

## BUG DESCRIPTIONS

### Bug 1: Admin Season Selection Bleeds Into Coach Role
When logged in as an admin who is also a coach:
1. Admin selects "Soccer Spring 2026" on the admin dashboard
2. Admin switches to Coach role via role switcher
3. Coach dashboard correctly shows "Black Hornets Elite" (the team they coach) — this is correct
4. BUT every other coach page (Roster Manager, Game Prep, Standings, Leaderboards, Team Chat, Announcements) shows data from "Soccer Spring 2026" instead of the coach's actual team/season
5. The coach dashboard header even shows "Black Hornets Elite - Soccer Spring 2026" which is wrong — Black Hornets Elite is a volleyball team, not soccer

The season/sport selection from the admin role is persisting when switching to coach. The coach role should either reset to the coach's own team's season, or scope all data to the coach's assigned teams regardless of what was selected in admin.

### Bug 2: Coach Stats & Evals Tab Shows No Data
On the Coach dashboard "Stats & Evals" tab:
- "No player stats yet" is shown, but players on this team DO have stats
- "No evaluations yet" is shown, but evaluations DO exist for this team's players
- This may be caused by Bug 1 (querying the wrong season) or a separate data loading issue

### Bug 3: Create Challenge Button Does Nothing
Clicking "Create Challenge" (either from the Engagement tab or the Playbook card on the right sidebar) reloads back to the coach dashboard instead of opening the challenge creation modal.

---

## INVESTIGATION TASKS

### 1. Season Context Architecture

Open and read these files:
- `src/contexts/SeasonContext.jsx` — how is `selectedSeason` stored and shared?
- `src/contexts/SportContext.jsx` — how is `selectedSport` stored?

**Report:**
- Is `selectedSeason` global (shared across all roles) or role-scoped?
- When the user switches roles via the role switcher, does the season context reset?
- Is `selectedSeason` stored in localStorage? If so, does it persist across role switches?
- Where is `selectedSeason` set when the admin picks "Soccer Spring 2026"?
- Where should `selectedSeason` be reset or scoped when switching to coach?

### 2. Role Switching Flow

Open `src/MainApp.jsx`. Find the role switching handler.

**Report:**
- What function handles role switching? (e.g., `onSwitchRole`, `setActiveView`)
- When a role switch happens, does it reset `selectedSeason` or `selectedSport`?
- Does the coach dashboard set its own season context based on the coach's team assignments, or does it inherit whatever was globally selected?
- Find the exact code path: user clicks "Lynx Coach" in role switcher → what state changes → what context resets (or doesn't)

### 3. Coach Dashboard Season Scoping

Open `src/pages/roles/CoachDashboard.jsx`.

**Report:**
- How does the coach dashboard determine which team/season to show?
- Does it use `selectedSeason` from SeasonContext, or does it derive the season from `roleContext.coachInfo`?
- Why does the hero card show the correct team ("Black Hornets Elite") but the wrong season ("Soccer Spring 2026")?
- Is there a disconnect where the hero uses roleContext but the body tabs use selectedSeason?

### 4. Coach Pages — Season/Team Data Source

For each of these pages, find how they determine which data to load:

| Page | File | How does it get season/team? |
|------|------|------------------------------|

Pages to check:
- Roster Manager (`src/pages/roster/RosterManagerPage.jsx`)
- Game Prep (`src/pages/gameprep/GamePrepPage.jsx`)
- Standings (`src/pages/standings/TeamStandingsPage.jsx`)
- Leaderboards (`src/pages/leaderboards/SeasonLeaderboardsPage.jsx`)
- Team Chat (`src/pages/chats/ChatsPage.jsx`)
- Announcements/Blasts (`src/pages/blasts/BlastsPage.jsx`)

**Report for each:**
- Does it use `useSeason()` (global context) to get the season?
- Does it use `roleContext` to get the coach's team?
- Does it filter by `selectedSeason.id`?
- If it uses `selectedSeason` and that's set to Soccer Spring 2026, that explains why a volleyball coach sees soccer data

### 5. Coach Stats & Evals Tab

Open `src/pages/roles/CoachDashboard.jsx`. Find the "Stats & Evals" tab content.

**Report:**
- What query loads player stats for the stats tab?
- What season_id does it filter on? Is it using `selectedSeason.id` (which would be Soccer Spring 2026) instead of the coach's actual team's season?
- Same for evaluations — what query, what season filter?
- If we change the season filter to use the coach's team's season_id, would the data appear?

### 6. Create Challenge Flow

**Report:**
- Find where "Create Challenge" button is rendered in the coach dashboard
- What onClick handler does it have?
- Does it call `onNavigate` to a different page, or does it open a modal?
- Find `CreateChallengeModal` — is it imported and rendered in the coach dashboard?
- Is there a state variable (like `showCreateChallenge`) that controls the modal visibility?
- Trace the click: button click → handler → what happens? Why does it reload to dashboard instead of opening a modal?
- Check if there's a page ID for challenge creation that doesn't exist in the routing, causing a fallback to dashboard

### 7. The Real Fix Question

Based on findings, answer:
- Should `selectedSeason` reset to null (or the coach's default season) when switching to coach role?
- Or should coach pages ignore `selectedSeason` entirely and always use the coach's team assignments from roleContext?
- What's the cleanest fix that doesn't break admin's ability to filter by season?

---

## OUTPUT FORMAT

Write to: `CC-COACH-CONTEXT-BLEEDING-REPORT.md`

```markdown
# Coach Context Bleeding — Investigation Report

## 1. Season Context Architecture
[findings — is it global? does it persist? does it reset on role switch?]

## 2. Role Switching Flow
[exact code path and what resets or doesn't]

## 3. Coach Dashboard Season Scoping
[hero vs body tab disconnect]

## 4. Coach Pages — Data Source per Page
[table of every page and how it gets season/team]

## 5. Stats & Evals Missing Data
[root cause — wrong season filter?]

## 6. Create Challenge Flow
[trace the click path — why does it reload?]

## 7. Recommended Fix Approach
[scoped recommendation]
```

---

## REMINDER

**Do NOT modify any files.** Read only. Report to file.
