# CC-WEB-DASHBOARD-AUDIT.md
## Full Codebase Audit Before V2 Redesign

**Purpose:** Before we redesign the web portal dashboards, we need a complete inventory of what exists RIGHT NOW in the codebase. Every component, every hook, every Supabase query, every route, every import chain. No guessing, no memory. Read the files.

**Output:** A single markdown file called `DASHBOARD-AUDIT-RESULTS.md` saved to the repo root.

---

## RULES

1. READ every file referenced below. Do not guess or assume.
2. Do not modify any code. This is a read-only audit.
3. For each component, document: what it renders, what data it fetches, what props it receives, and what it links/navigates to.
4. For each hook, document: what Supabase table(s) it queries, what parameters it takes, what it returns.
5. Note any dead code, unused imports, or components that are imported but never rendered.
6. Note any TODO comments, placeholder text, or "coming soon" states.

---

## PHASE 1: Route Map

Read the main router file(s) and document every route in the app.

```bash
# Find the router
grep -r "Route\|createBrowserRouter\|RouterProvider" src/ --include="*.jsx" --include="*.tsx" -l
```

For each route, document:
- Path (e.g., `/admin`, `/coach`, `/parent/schedule`)
- Component rendered
- Auth/role guard (if any)
- Whether it's currently accessible or disabled

Output as a table in the audit doc.

---

## PHASE 2: Dashboard Pages

Read each role's dashboard page file. These are the main files:

```bash
# Find all dashboard-related pages
find src/pages -name "*Dashboard*" -o -name "*dashboard*" | head -20
find src/pages -name "*Home*" -o -name "*home*" | head -20
ls -la src/pages/roles/
ls -la src/pages/dashboard/
```

For EACH dashboard page (Admin, Coach, Parent, Player), document:

### 2a. Layout Structure
- What is the top-level layout? (grid columns, flex, etc.)
- How many columns? What are their widths?
- Is there a sidebar? What's in it?
- Is there a header/hero section? What's in it?

### 2b. Every Component Rendered
List every component imported and rendered on the page. For each one:
- Component name and file path
- What section of the page it appears in (hero, left column, center, right column, etc.)
- What props are passed to it
- Is it conditionally rendered? Under what conditions?

### 2c. Data Fetching
- What hooks are called at the page level?
- What Supabase queries run directly in the page component?
- What context providers wrap this page?
- What data is passed down to child components?

### 2d. Navigation
- What links/buttons navigate away from this page?
- What can the user click to go deeper?

---

## PHASE 3: Widget/Component Inventory

Read every widget and card component used by the dashboards.

```bash
# Find all widget components
find src/components/widgets -name "*.jsx" -o -name "*.tsx" | sort
find src/components/dashboard -name "*.jsx" -o -name "*.tsx" | sort
find src/components/coach -name "*.jsx" -o -name "*.tsx" | sort
find src/components/parent -name "*.jsx" -o -name "*.tsx" | sort
find src/components/player -name "*.jsx" -o -name "*.tsx" | sort
find src/components/admin -name "*.jsx" -o -name "*.tsx" | sort
```

For EACH component, document:
- **Name and path**
- **What it renders** (describe the UI in 1-2 sentences)
- **Data source** (what hook or prop provides its data?)
- **Supabase tables touched** (directly or via hooks)
- **Interactive elements** (buttons, links, forms — what do they do?)
- **Role(s) that use it** (admin, coach, parent, player, or multiple)
- **Current state** (fully functional, partially built, placeholder, broken)
- **Line count** (approximate complexity)

---

## PHASE 4: Hooks and Data Layer

Read every custom hook used by dashboards.

```bash
# Find all hooks
find src/hooks -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" | sort
# Also check for hooks defined inside component files
grep -rn "function use[A-Z]" src/hooks/ src/components/ src/pages/ --include="*.jsx" --include="*.tsx" --include="*.js" --include="*.ts" | head -50
```

For EACH hook used by any dashboard, document:
- **Hook name and file path**
- **What Supabase table(s) it queries**
- **Parameters** (what does it need? org_id, team_id, season_id, user_id?)
- **Return value** (what shape of data comes back?)
- **Which components consume it** (list the components that call this hook)
- **Real-time subscriptions?** (does it use `.subscribe()` or listen for changes?)
- **Error handling** (does it handle loading/error states?)

---

## PHASE 5: Widget Registry

If a widget registry/catalog exists:

```bash
find src -name "*registry*" -o -name "*catalog*" -o -name "*widgetList*" | head -10
grep -r "WIDGET_CATEGORIES\|widgetRegistry\|defaultWidgets" src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" -l
```

Document:
- Every widget in the registry
- Its ID, label, category, allowed roles, default size
- Whether the actual component exists or is a placeholder
- Whether it's currently rendered on any dashboard by default

---

## PHASE 6: Shared Components

Document shared UI components that dashboards depend on:

```bash
find src/components/shared -name "*.jsx" -o -name "*.tsx" | sort
find src/components/ui -name "*.jsx" -o -name "*.tsx" | sort
find src/components/layout -name "*.jsx" -o -name "*.tsx" | sort
```

Focus on:
- Navigation components (sidebar, top nav, breadcrumbs)
- Card/container components
- Chart/visualization components
- Button/action components
- Modal/dialog components
- Loading/empty state components

---

## PHASE 7: Supabase Table Usage Map

Create a table showing which Supabase tables are queried by which dashboard components:

```bash
grep -rn "from('\|\.from(" src/hooks/ src/components/ src/pages/ --include="*.jsx" --include="*.tsx" --include="*.js" --include="*.ts" | grep -v node_modules | sort
```

Output as:
| Table Name | Queried By (hook/component) | Used On (which dashboard) |
|---|---|---|

---

## PHASE 8: Current Sidebar Navigation

Document the current sidebar/navigation structure:

```bash
# Find sidebar component
find src -name "*Sidebar*" -o -name "*sidebar*" -o -name "*SideNav*" -o -name "*sidenav*" | head -10
find src -name "*AppDrawer*" -o -name "*NavMenu*" -o -name "*MainNav*" | head -10
```

For each role, list:
- Every nav item currently shown
- What route it links to
- Whether it has a badge/counter
- Whether the destination page is built or placeholder

---

## PHASE 9: Current Top Bar / Header

Document what's currently in the top bar:

```bash
find src -name "*TopBar*" -o -name "*Header*" -o -name "*AppBar*" | head -10
find src -name "*SeasonSelector*" -o -name "*RoleSelector*" -o -name "*FilterBar*" | head -10
```

Document:
- What filters/selectors exist
- How season context is managed (URL param, context, state?)
- How role switching works
- What the notification system looks like

---

## PHASE 10: Summary and Flags

At the end of the audit document, include:

### Components That Are Fully Functional
(Working data, renders correctly, no known bugs)

### Components That Are Partially Built
(Renders but missing data, or has TODO comments)

### Components That Are Dead Code
(Imported but never rendered, or files that exist but aren't used)

### Components That Are Broken
(Errors in console, missing dependencies, doesn't render)

### Data Hooks That Are Critical
(If these break, the dashboard breaks — DO NOT DELETE)

### Data Hooks That Are Unused
(Defined but not called anywhere)

---

## OUTPUT FORMAT

Save the complete audit as `DASHBOARD-AUDIT-RESULTS.md` in the repo root. Use tables wherever possible. Be exhaustive. This document will be used to write the CC specs for the v2 redesign, so accuracy matters more than brevity.

**Commit after completion:**
```
git add DASHBOARD-AUDIT-RESULTS.md && git commit -m "audit: complete dashboard component and data layer inventory for v2 redesign"
```

---

## CC PROMPT

```
Read CC-WEB-DASHBOARD-AUDIT.md in the repo root. This is a read-only audit — do NOT modify any code. 

Execute phases 1 through 10 and output everything into DASHBOARD-AUDIT-RESULTS.md. Read every file. Do not guess. If you can't find a file, note it as missing. 

This audit will be used to plan the v2 web redesign, so completeness and accuracy are critical.

Read CLAUDE.md before starting.
```
