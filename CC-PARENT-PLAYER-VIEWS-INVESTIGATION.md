# CC-PARENT-PLAYER-VIEWS-INVESTIGATION.md
# Parent Player Card vs Profile — Investigation
## Repo: SgtxTorque/volleybrain-admin | Branch: main

---

## PURPOSE

This is an **investigation-only** spec. Do NOT modify any files. A parent clicking "Player Card" from the dashboard gets "Player Not Found." We need to understand what's broken and also clarify what "Profile" vs "Player Card" are supposed to show. Write your report to a file: `CC-PARENT-PLAYER-VIEWS-REPORT.md` in the project root.

---

## CONTEXT

From the Parent Dashboard, each child has two buttons: "Profile" and "Player Card."

- **Profile** currently loads a page with the player's sport stats, power levels, radar chart, badges, recent games, kills trend, etc. (volleyball-heavy content)
- **Player Card** shows "Player Not Found" error

The question is: are these two pages showing the right content? On mobile, the "Profile" equivalent shows registration/personal info (name, DOB, medical, emergency contacts, etc.) while the sport stats/card view is separate. The web may have these swapped or misconfigured.

---

## INVESTIGATION TASKS

### 1. Parent Dashboard — Button Routing

Open and read `src/pages/roles/ParentDashboard.jsx`.

**Report:**
- Find where the "Profile" and "Player Card" buttons are rendered for each child
- What page/route does "Profile" navigate to? (e.g., `player-{id}`, `player-profile-{id}`, etc.)
- What page/route does "Player Card" navigate to? (e.g., `player-card-{id}`, etc.)
- What data is passed in the navigation? (player ID, team ID, season ID?)
- Copy the exact navigation/onClick code for both buttons

### 2. Player Card Page — "Player Not Found" Bug

Open and read `src/pages/parent/ParentPlayerCardPage.jsx` completely.

**Report:**
- What is the page ID / route that triggers this page?
- How does it extract the player ID from the route/navigation? (URL param? State? Props?)
- What Supabase query does it run to load the player?
- What condition triggers "Player Not Found"? Copy the exact conditional
- Trace the bug: Is the player ID being passed correctly from the dashboard? Is the query correct? Is there a mismatch between the ID format the dashboard passes and what the page expects?
- What does the URL look like when this page loads? (from the screenshot: `player-card-3bcd1c4e-2d46-4cfc-97fc-723cd575f3a0`)

### 3. Player Profile Page — What Does It Show?

Open and read `src/pages/parent/PlayerProfilePage.jsx` completely.

**Report:**
- What is the page ID / route that triggers this page?
- What content sections does it render? List every section/tab:
  - Does it show registration info (name, DOB, grade, medical, emergency contacts)?
  - Does it show sport stats (kills, aces, power levels)?
  - Does it show badges/achievements?
  - Does it show jersey/uniform info?
  - What tabs exist?
- Is this page showing sport stats that should actually be on the Player Card page?

### 4. Mobile App Reference — What Does Mobile Show?

Check if there are mobile reference files in the repo. Look for:
- `reference/mobile-source/` or `reference/mobile-app/` directory
- Any mobile player profile or player card components

**Report:**
- Does a mobile reference exist in this repo?
- If yes, what does the mobile player profile show? (registration/personal info vs sport stats?)
- If yes, what does the mobile player card show? (the trading-card style stat view?)
- What is the intended split between "Profile" (personal/registration data) and "Player Card" (sport stats/achievements)?

### 5. Page Routing in MainApp.jsx

Open `src/MainApp.jsx`. Find how parent player pages are routed.

**Report:**
- What page IDs map to ParentPlayerCardPage vs PlayerProfilePage?
- How does the route extract the player ID? (e.g., `activePage.startsWith('player-card-')` → extract ID)
- Is there a mismatch between how the dashboard constructs the page ID and how MainApp parses it?
- Are both pages registered in the routing for the parent role?

### 6. Data Flow Comparison

Compare the data loading between both pages:

**Report:**
- ParentPlayerCardPage: What query loads player data? What table, what joins, what ID does it filter on?
- PlayerProfilePage: Same questions
- Is one querying by `player_id` and the other by `team_player_id` or some other ID? A mismatch here would explain "Player Not Found"
- What ID does the parent dashboard pass — the player's `players.id` or the `team_players.id` or something else?

---

## OUTPUT FORMAT

Write your report to: `CC-PARENT-PLAYER-VIEWS-REPORT.md` in the project root.

```markdown
# Parent Player Views — Investigation Report

## 1. Dashboard Button Routing
[findings with exact code snippets]

## 2. Player Card "Not Found" Bug
[root cause analysis]

## 3. Player Profile Page Content
[what it shows, section by section]

## 4. Mobile Reference
[what mobile does, if reference exists]

## 5. Page Routing
[findings from MainApp.jsx]

## 6. Data Flow Comparison
[query comparison, ID mismatch analysis]

## Summary
- Root cause of "Player Not Found": [answer]
- Is Profile showing the right content? [answer]
- Is Player Card supposed to show what Profile currently shows? [answer]
- Recommended fix: [brief recommendation]
```

---

## REMINDER

**Do NOT modify any files.** Read only. Report to file.
