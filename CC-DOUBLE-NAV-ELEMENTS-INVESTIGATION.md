# CC-DOUBLE-NAV-ELEMENTS-INVESTIGATION.md
# Double Breadcrumbs & Double Search Bars Audit
## Repo: SgtxTorque/volleybrain-admin | Branch: main

---

## PURPOSE

This is an **investigation-only** spec. Do NOT modify any files. After wiring the smart contextual top bar for all roles, several pages now show **duplicate breadcrumbs** and/or **duplicate search bars**. We need a complete inventory of every collision so a follow-up fix spec can resolve them cleanly.

---

## CONTEXT

The TopBar component (src/components/v2/TopBar.jsx) was previously admin-only. It has now been wired to render for all roles (Coach, Parent, Player, Team Manager). The TopBar likely includes its own breadcrumb trail and/or search input. Many pages also have their own breadcrumb and/or search via PageShell.jsx, inline JSX, or page-level header components. This creates duplicates.

---

## INVESTIGATION TASKS

### 1. TopBar Anatomy

Open and read `src/components/v2/TopBar.jsx` completely.

**Report:**
- Does TopBar render a breadcrumb? If so, what component or markup?
- Does TopBar render a search bar/input? If so, what component or markup?
- Does TopBar render any other navigation elements (role label, page title, etc.) that could collide with page-level headers?
- What props control whether breadcrumb and search are shown? Are there any conditional flags?

### 2. PageShell Anatomy

Open and read `src/components/pages/PageShell.jsx` completely.

**Report:**
- Does PageShell render a breadcrumb? If so, what component or markup?
- Does PageShell render a search bar/input?
- Does PageShell render a page title or header?
- What props does PageShell accept that control these elements?
- Which pages use PageShell vs rendering their own header?

### 3. Breadcrumb Component

Open and read `src/components/layout/Breadcrumb.jsx` (or wherever the breadcrumb component lives).

**Report:**
- What does it render?
- Where is it imported and used? (List every file that imports it)

### 4. Page-by-Page Collision Audit

For EVERY page component accessible by any role, check whether it renders its own breadcrumb and/or search bar at the page level. Cross-reference with what TopBar already provides.

Check these directories and every page component in them:
- `src/pages/` (all subdirectories)
- `src/pages/roles/` (dashboard pages per role)
- Any other page components referenced in MainApp.jsx routing

For each page, report:

| Page Component | File Path | Roles That See It | Has Own Breadcrumb? | Has Own Search? | Has Own Page Title/Header? | Collision With TopBar? |
|---|---|---|---|---|---|---|

"Collision" means the element appears twice — once from TopBar and once from the page itself.

Be thorough. Check every single page. Do not skip any.

### 5. Search Bar Variants

Some pages have contextual search bars that are NOT global search — they filter page-specific data (e.g., "Search by player or parent" on Payments, player search on Roster). These are different from a global "Search..." in the TopBar.

**Report:**
- Which pages have page-specific/contextual search inputs? List each one with its placeholder text.
- Is the TopBar search a global/command palette search, or does it do something page-specific?
- For pages with contextual search: is the TopBar's global search duplicating it visually, or are they clearly different functions?

### 6. Recommendation

Based on findings, provide a recommendation:

**For breadcrumbs:** Which one should we keep — TopBar's or per-page? Or should we keep both but with different purposes (TopBar = role/section path, page = page-specific context)?

**For search:** The TopBar global search and page-level contextual search serve different purposes. Recommend which to keep and where. Consider:
- If TopBar has a global search (command palette style), it should stay but page-level contextual search should also stay (they do different things)
- If TopBar search is redundant with page search, one should go
- If a page has NO contextual search, should TopBar search fill that gap?

---

## OUTPUT FORMAT

```
## INVESTIGATION REPORT — Double Nav Elements Audit

### 1. TopBar Anatomy
[findings]

### 2. PageShell Anatomy
[findings]

### 3. Breadcrumb Component
[findings]

### 4. Page-by-Page Collision Audit
[table of every page with collision flags]

### 5. Search Bar Variants
[findings]

### 6. Recommendation
[what to keep, what to remove, per element type]
```

Include exact file paths and line numbers. Copy short code snippets (under 15 lines) that show the duplicate elements.

---

## REMINDER

**Do NOT modify any files.** Read only. Report back.
