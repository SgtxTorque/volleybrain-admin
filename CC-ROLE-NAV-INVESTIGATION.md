# CC-ROLE-NAV-INVESTIGATION.md
# Role-Based Navigation Audit — Coach, Parent, Player, Team Manager
## Repo: SgtxTorque/volleybrain-admin | Branch: main

---

## PURPOSE

This is an **investigation-only** spec. Do NOT modify any files. The goal is to produce a detailed report of how the current sidebar and top bar navigation work for Coach, Parent, Player, and Team Manager roles so that a follow-up build spec can be written with full knowledge of the codebase.

---

## CONTEXT

We are applying the same accordion sidebar + smart contextual top bar treatment from CC-SMART-NAV-REDESIGN.md (admin nav) to the Coach, Parent, Player, and Team Manager roles. Before building anything, we need to understand exactly how the current nav is structured, where role routing happens, and what patterns already exist.

Team Manager is the planned 5th role (single-team operations). It may or may not be implemented yet. If it exists in any form -- routes, sidebar config, role constants -- document it fully. If it doesn't exist yet, note that explicitly so the build spec can plan for it.

The admin nav spec (CC-SMART-NAV-REDESIGN.md) may already be executed or in progress. Note any changes it made that affect shared components.

---

## INVESTIGATION TASKS

### 1. Sidebar Architecture

Open and read these files (and any others they import):

- `src/components/layout/LynxSidebar.jsx`
- Any role-specific sidebar components or config files it references
- Any nav config objects, arrays, or constants that define menu items per role

**Report:**
- How does the sidebar determine which role is active?
- Is there one sidebar component with conditional rendering per role, or separate components?
- How are nav items defined? (Hardcoded JSX? Config array? Map over data?)
- How are section groups (e.g., "MY TEAMS", "GAME DAY") defined and rendered?
- What is the current group structure for each role? List every group header and every nav item under it, exactly as they appear in code.
- Are there any dynamic items (e.g., team names listed under "My Teams" for Coach, child names under "My Players" for Parent)?
- How are dynamic items fetched and rendered?

### 2. Top Bar Architecture

Open and read:

- `src/MainApp.jsx`
- Any TopBar, Header, or NavBar component referenced in MainApp or layout components
- `src/components/layout/` — list all files and read any that relate to headers or top navigation

**Report:**
- Where does the top bar currently live? (MainApp? A layout wrapper? Per-page?)
- How does the current top bar determine which links to show?
- Is the top bar role-aware? Does it show different links for Coach vs Parent vs Player?
- What is the current top bar content for each role? (List the exact links shown)
- If CC-SMART-NAV-REDESIGN.md has already been executed, describe the new admin top bar pattern and whether it's been built as a reusable component or admin-only.

### 3. Role Detection & Routing

Open and read:

- Any auth context, role context, or user context providers
- The main router/switch that determines which pages load per role
- Any role constants or enums

**Report:**
- What are the exact role string values used in the codebase? (e.g., "admin", "coach", "parent", "player", "team_manager")
- Where is the current role stored? (Context? Zustand? Redux? Local state?)
- How does the app decide which sidebar config to show for a given role?
- Is there a Team Manager role implemented yet, or just planned?

### 4. Page Inventory Per Role

**Report a complete list of every page/route accessible per role:**

For each of Coach, Parent, Player, and Team Manager:
- Route path (e.g., `/schedule`, `/game-prep`)
- Page component file path
- Whether the page is shared across roles or role-specific
- Current sidebar group it belongs to

### 5. Team Manager Status

**Report:**
- Does a Team Manager role exist in the role constants/enums?
- Are there any Team Manager-specific routes, pages, or sidebar configs?
- If it exists, what pages/nav items does it currently have?
- If it doesn't exist, which role's config is closest to what TM would need? (Likely a scoped-down Coach or scoped-down Admin for a single team)
- Are there any comments, TODOs, or placeholder code referencing Team Manager?

### 6. Accordion Patterns (If Any Exist)

If CC-SMART-NAV-REDESIGN.md has been executed:

**Report:**
- What accordion component or pattern was used for admin?
- Is it a reusable component that can be applied to other roles?
- What state management drives the expand/collapse? (Local state? URL-based?)
- What animation/transition is used?

If it has NOT been executed yet:

**Report:**
- Note that it hasn't been executed
- Note any existing expand/collapse or collapsible patterns anywhere in the codebase that could be reused

### 7. Shared vs Role-Specific Components

**Report:**
- Which sidebar/nav components are shared across all roles?
- Which are role-specific?
- Are there any wrapper components (like PageShell, DashboardLayout) that affect nav rendering?
- How does `PageShell.jsx` interact with the sidebar and top bar?

### 8. CSS & Styling

Open and read:
- `src/styles/v2-tokens.css` (sidebar-related variables)
- Any CSS modules or styled components used by the sidebar

**Report:**
- What CSS variables control sidebar width, colors, spacing?
- Are there role-specific theme differences (e.g., Player has a dark theme vs Coach light)?
- What is the current sidebar width per role?

---

## OUTPUT FORMAT

After completing all investigation tasks, produce a single report structured exactly like this:

```
## INVESTIGATION REPORT — Role Nav Audit

### 1. Sidebar Architecture
[findings]

### 2. Top Bar Architecture
[findings]

### 3. Role Detection & Routing
[findings]

### 4. Page Inventory Per Role
[findings — use tables]

### 5. Team Manager Status
[findings]

### 6. Accordion Patterns
[findings]

### 7. Shared vs Role-Specific Components
[findings]

### 8. CSS & Styling
[findings]
```

Include exact file paths, line numbers where relevant, and copy short code snippets (under 20 lines) that illustrate key patterns. Do NOT include full file contents.

---

## REMINDER

**Do NOT modify any files.** Read only. Report back.
