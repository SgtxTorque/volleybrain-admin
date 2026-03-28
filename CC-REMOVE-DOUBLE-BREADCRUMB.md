# CC-REMOVE-DOUBLE-BREADCRUMB.md
# Remove Duplicate Layout-Level Breadcrumb
## Repo: SgtxTorque/volleybrain-admin | Branch: main

---

## OBJECTIVE

Remove the layout-level `<Breadcrumb />` component rendered in MainApp.jsx that duplicates the PageShell breadcrumb on 31 pages. Keep PageShell's semantic breadcrumb as the single source of truth.

---

## GUARDRAILS

- **Read before modify.** Open MainApp.jsx and confirm the Breadcrumb rendering location before changing it.
- **Do not touch PageShell.** PageShell's breadcrumb prop stays exactly as-is.
- **Do not touch any individual page files.** No per-page changes needed.
- **Do not remove the Breadcrumb component file itself** (src/components/ui/Breadcrumb.jsx) — it may be useful later. Just remove its rendering from the layout.
- **Commit after the change.**

---

## THE FIX

### File: `src/MainApp.jsx`

**Step 1:** Open MainApp.jsx. Find the `<Breadcrumb />` component rendering (reported at line 1326, immediately below the TopBar rendering block). Read the surrounding context to confirm.

**Step 2:** Remove the `<Breadcrumb />` JSX line. If there is an import for Breadcrumb at the top of the file (reported at line 24), remove that import line as well — but ONLY if Breadcrumb is not used anywhere else in the file. Search the file for any other references before removing the import.

**Step 3:** Verify the build compiles without errors: `npm run build 2>&1 | tail -20`

**Step 4:** Visually confirm (if dev server is available) that:
- Pages with PageShell show ONE breadcrumb (the semantic one from PageShell)
- Dashboard pages show NO breadcrumb (correct — they never had PageShell breadcrumbs)
- ChatsPage and GamePrepPage show NO breadcrumb (correct — they don't use PageShell)

**Commit:** `fix: remove duplicate layout-level breadcrumb — PageShell breadcrumb is single source of truth`

---

## EXPECTED RESULT

Before: 31 pages showed two breadcrumb rows stacked (layout-level URL path + PageShell semantic path).
After: All pages show at most one breadcrumb (from PageShell), or none (dashboards, chats, game prep).

---

## FILES MODIFIED

| File | What Changes |
|------|-------------|
| `src/MainApp.jsx` | Remove `<Breadcrumb />` rendering (~line 1326) and its import (~line 24) |

That's it. One file, two lines.
