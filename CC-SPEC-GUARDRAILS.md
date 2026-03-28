# CC-SPEC-GUARDRAILS.md
# Claude Code Spec Guardrails — Read Before Every Spec

## PURPOSE
This file defines the rules that apply to EVERY CC spec executed against this codebase. Drop this in the repo root. Reference it at the top of every spec:
```
READ FIRST: CC-SPEC-GUARDRAILS.md, then CLAUDE.md, then this spec.
```

---

## HARD GUARDRAILS — Read Before Editing

You are performing **surgical, scoped work**, NOT a refactor. NOT a cleanup. NOT an improvement pass.

### Rules:
1. **Only modify the files explicitly listed in each phase.** If a file is not named, do not touch it.
2. **Only change the minimum number of lines required** to satisfy that phase. No bonus fixes.
3. **Do not rename** functions, variables, components, hooks, routes, or files.
4. **Do not move code** between files unless explicitly required by the spec.
5. **Do not refactor** for style, cleanup, consistency, or "while I'm here" improvements.
6. **Do not change UI layout, styling, copy, or component structure** unless the phase explicitly requires it.
7. **Do not add or update dependencies** (npm packages, imports from new libraries).
8. **Do not modify** package versions, Expo plugins, navigation structure, auth flow, or Supabase schema.
9. **Preserve all existing behavior** outside the exact lines being changed.
10. **If a fix appears to require changes beyond what the spec describes, STOP and report** instead of improvising. List what you think needs changing and why. Do not proceed without confirmation.

### Diff Budget:
- If any single phase requires more than **~50 changed lines in a single file**, stop and explain why before proceeding.
- If a phase touches more than **5 files**, stop and explain why before proceeding.
- These limits can be exceeded when the spec explicitly says so (e.g., "apply this pattern to all 16 pages").

---

## EDIT CONTRACT (apply to every phase)

### Allowed:
- Changes explicitly described in the spec
- Adding guard clauses, null checks, or conditional filters as described
- Adding imports required by the changes described
- Adding comments that explain non-obvious logic

### NOT Allowed:
- Refactoring surrounding logic
- Renaming variables, functions, or components
- Reordering JSX, imports, or function declarations
- Changing styles, spacing, or formatting in untouched code
- Altering unrelated query logic, hooks, or state management
- Removing "unused" imports or variables that the spec didn't mention
- "Cleaning up" anything the spec didn't ask you to clean up
- Adding features, improvements, or enhancements not in the spec

---

## REQUIRED VERIFICATION — After Every Phase

### Before editing (baseline):
```bash
git status                          # clean working tree
npm run build 2>&1 | tail -5       # baseline build status
git diff --stat                     # confirm no uncommitted changes
```

### After editing:
```bash
npm run build 2>&1 | tail -5       # must still pass
git diff --name-only                # ONLY the intended files should appear
git diff --stat                     # review total lines changed
```

### Verification gates (do NOT continue if any fail):
- [ ] Build passes with zero errors
- [ ] Only files listed in the spec were modified
- [ ] No unrelated files appear in `git diff --name-only`
- [ ] Line count changes are proportional to the fix (not a 500-line diff for a 10-line fix)
- [ ] If the spec includes specific test scenarios, verify each one

### Before commit:
- Summarize exactly which files changed and what was modified in each
- Confirm no unrelated files were touched
- If any formatting-only or import-cleanup diffs appear in files you didn't intend to change, revert those files

---

## COMMIT & PUSH RULES

### Commit after every phase:
```bash
git add <only the files listed in the spec>   # NOT git add -A
git commit -m "Phase X: <description>"
```

### Do NOT push to main until:
- ALL phases are complete
- ALL verifications pass
- A final summary report is produced
- The spec says to push (some specs may want review first)

### If working on main:
Push only after all phases complete and verify. No partial pushes.

### If working on a branch:
Commit per phase. Push the branch when all phases are done. Do not merge to main without verification.

---

## REPORTING — After All Phases

Produce a summary report:
```
## Spec Execution Report
- Spec: [spec filename]
- Phases completed: X/Y
- Phases skipped: X (with reasons)
- Files modified: [list]
- Total lines changed: +X / -Y
- Build status: PASS / FAIL
- Unintended changes: NONE / [list]
- Test scenarios verified: [list with pass/fail]
- Issues discovered during execution: [list or "none"]
```

---

## WHEN TO STOP AND REPORT

Stop execution and report to Carlos if:
- A fix requires changing a file not listed in the spec
- A fix requires more than ~50 lines of changes in one file
- A fix breaks an existing test or build
- You discover a bug unrelated to the current spec
- The data model doesn't match what the spec assumes
- A Supabase query returns unexpected results
- You're unsure whether a change preserves existing behavior

**It is always better to stop and ask than to guess and break something.**

---

## SPEC STRUCTURE TEMPLATE

Every spec should follow this structure:

```markdown
# CC-[NAME].md
# [Title]

## READ FIRST
1. CC-SPEC-GUARDRAILS.md (this file)
2. CLAUDE.md
3. [Any other context files]

## SCOPE
[One paragraph: what this spec does and does NOT do]

## PHASE 1: [Name]
**Finding/Reason:** [Why this change is needed]
**Files:** [Exact list of files to modify]
**Edit contract:** [What's allowed and not allowed for this phase]

### Changes:
[Exact before/after code with line numbers where possible]

### Verification:
[Specific test scenarios that must pass]

### Commit:
```bash
git add [specific files]
git commit -m "Phase 1: [description]"
```

## PHASE 2: [Name]
[Same structure]

## FINAL REPORT
[Template for the execution report]
```

---

## REMEMBER

The goal is **zero regressions**. Every change must leave the app in a better state than before, with nothing broken that was working. If you're not sure, stop and ask. Carlos cannot code. He relies on these specs being precise and safe. Treat every change like it's going to production immediately, because it is.
