# CC-NAVY-GRADIENT-HEADER-INVESTIGATION.md
# Navy Gradient Header Audit — All Pages
## Repo: SgtxTorque/volleybrain-admin | Branch: main

---

## PURPOSE

This is an **investigation-only** spec. Do NOT modify any files. We want to apply the navy gradient header treatment systematically across all pages on the web app. Before building, we need a complete inventory of what each page's header looks like today.

---

## CONTEXT

The Lynx brand uses a navy gradient header band (`linear-gradient(135deg, #10284C 0%, #153050 50%, #1B3A5C 100%)` or similar) as a signature design element. The four role dashboards (Admin, Coach, Parent, Player) already have gradient hero sections. The top nav bar (TopBar) also has the gradient. But most inner pages (Schedule, Payments, Teams, Registrations, etc.) still use plain white/light headers via PageShell.

The goal is to bring every page up to the same visual standard — a navy gradient header band at the top of each page containing the page title, subtitle, breadcrumb, and action buttons. This should feel like a cohesive product, not dashboards that look premium and inner pages that look like a different app.

---

## INVESTIGATION TASKS

### 1. PageShell Current Implementation

Open and read `src/components/pages/PageShell.jsx` completely.

**Report:**
- Full code of the component (it's small, ~41 lines per prior audit)
- What HTML structure wraps the title/subtitle/breadcrumb/actions?
- What CSS classes or inline styles are on the header area?
- What background does it use? (White? Transparent? Tailwind bg class?)
- What text colors does it use for title, subtitle, breadcrumb?
- How much vertical space does the header take up?

### 2. Dashboard Hero Patterns

Read the hero/header section of each dashboard page (just the top portion, not the full file):
- `src/pages/dashboard/DashboardPage.jsx` (Admin)
- `src/pages/roles/CoachDashboard.jsx`
- `src/pages/roles/ParentDashboard.jsx`
- `src/pages/roles/PlayerDashboard.jsx`
- `src/pages/roles/TeamManagerDashboard.jsx`

**Report for each:**
- How is the gradient hero implemented? (Inline style? Tailwind class? CSS variable?)
- What is the exact gradient value?
- What elements are inside the hero? (Title, subtitle, stats, mascot, etc.)
- How tall is the hero area?
- Does the hero use rounded corners, overlap effects, or other special treatments?

### 3. Page-by-Page Header Audit

For EVERY non-dashboard page, report what the header looks like:

| Page | File Path | Uses PageShell? | Header Background | Title Color | Has Breadcrumb? | Has Action Buttons? | Has Special Header Treatment? |
|------|-----------|----------------|-------------------|-------------|----------------|--------------------|-----------------------------|

Check every page in:
- `src/pages/teams/`
- `src/pages/coaches/`
- `src/pages/staff/`
- `src/pages/staff-portal/`
- `src/pages/registrations/`
- `src/pages/payments/`
- `src/pages/schedule/`
- `src/pages/attendance/`
- `src/pages/chats/`
- `src/pages/blasts/`
- `src/pages/notifications/`
- `src/pages/reports/`
- `src/pages/standings/`
- `src/pages/leaderboards/`
- `src/pages/stats/`
- `src/pages/achievements/`
- `src/pages/gameprep/`
- `src/pages/jerseys/`
- `src/pages/roster/`
- `src/pages/archives/`
- `src/pages/profile/`
- `src/pages/parent/`
- `src/pages/settings/` (all settings sub-pages)
- `src/pages/public/` (OrgDirectoryPage only — skip PublicRegistrationPage)
- Any other page directories

For pages that DON'T use PageShell, describe how their header is built (custom JSX, no header at all, etc.).

"Special header treatment" means anything beyond plain PageShell — gradient background, hero card, stat row in the header, custom layout, etc.

### 4. OrgBackgroundLayer

Read `src/components/layout/OrgBackgroundLayer.jsx` or wherever the page background layer is defined.

**Report:**
- What does this component do?
- Does it affect page header rendering?
- What background color/gradient does it set on the page body?

### 5. CSS Variables and Tokens

Read `src/styles/v2-tokens.css` — look for any header-related variables, gradient definitions, or hero-related tokens.

**Report:**
- Are there existing CSS variables for the navy gradient?
- Are there variables for header height, header padding, or header text colors on dark backgrounds?
- If not, note what would need to be added.

### 6. Feasibility Assessment

Based on the findings, answer:
- Can we modify PageShell alone to add the navy gradient header to all pages that use it? Or would that break pages with special layouts?
- Are there pages that need custom treatment (e.g., ChatsPage which is full-screen, settings pages which may want a lighter feel)?
- Should the gradient header be a PageShell variant (prop-driven) or a separate component?
- Are there any pages where a dark header would conflict with existing dark content directly below it?

---

## OUTPUT FORMAT

```
## INVESTIGATION REPORT — Navy Gradient Header Audit

### 1. PageShell Current Implementation
[full component code + analysis]

### 2. Dashboard Hero Patterns
[findings per dashboard]

### 3. Page-by-Page Header Audit
[comprehensive table]

### 4. OrgBackgroundLayer
[findings]

### 5. CSS Variables and Tokens
[findings]

### 6. Feasibility Assessment
[recommendation on approach]
```

Include exact file paths, line numbers, and short code snippets.

---

## REMINDER

**Do NOT modify any files.** Read only. Report back.
