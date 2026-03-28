# CC-NAVY-GRADIENT-SWEEP-INVESTIGATION.md
# Navy Background Elements Audit — Find Every Flat Navy
## Repo: SgtxTorque/volleybrain-admin | Branch: main

---

## PURPOSE

This is an **investigation-only** spec. Do NOT modify any files. We want to replace every flat navy background in the app with the visible horizontal gradient (`--lynx-navy-gradient-h: linear-gradient(90deg, #0B1628, #162D50)`). Before doing that, we need a complete inventory of every element that currently uses navy as a background color — whether it's flat, barely-visible gradient, or already using the correct gradient.

---

## CONTEXT

The schedule page event cards use a horizontal navy gradient that is clearly visible — you can see the color shift from left to right. This is the target look: `linear-gradient(90deg, #0B1628, #162D50)` stored as `--lynx-navy-gradient-h` in v2-tokens.css.

Other elements across the app (hero cards, stat bars, buttons, banners, section headers) use various navy backgrounds — some are flat solid colors like `#10284C`, `#0B1628`, or `bg-lynx-navy`, and some use diagonal gradients that are so subtle they look flat. We want everything to match the event card gradient.

---

## INVESTIGATION TASKS

### 1. CSS Token Inventory

Open `src/styles/v2-tokens.css` and find every navy-related token.

**Report:**
- List every CSS variable that defines a navy color or navy gradient
- List every Tailwind custom class that maps to navy (e.g., `bg-lynx-navy`, `bg-lynx-navy-h`, `bg-lynx-midnight`)
- What is the exact value of `--lynx-navy-gradient-h`? Confirm it matches `linear-gradient(90deg, #0B1628, #162D50)`

### 2. Global Search — All Navy Backgrounds

Search the ENTIRE `src/` directory for every instance of a navy background. Cast a wide net. Search for ALL of the following patterns:

**Hex values (inline styles and Tailwind arbitrary values):**
- `#10284C`
- `#0B1628`
- `#0D1B3E`
- `#132244`
- `#162D50`
- `#153050`
- `#1B3A5C`
- `#112040`
- `#0F1E3C`
- `#0A1428`

**Tailwind classes:**
- `bg-lynx-navy`
- `bg-lynx-midnight`
- `bg-lynx-navy-h`
- `bg-[#10284C]`
- `bg-[#0B1628]`
- Any other `bg-[#1xxxxx]` or `bg-[#0xxxxx]` patterns that look navy

**CSS variables in inline styles:**
- `var(--v2-navy)`
- `var(--v2-midnight)`
- `var(--lynx-navy-gradient)`
- `var(--lynx-navy-gradient-h)`
- `var(--lynx-navy-gradient-subtle)`

**Gradient definitions in inline styles:**
- Any `linear-gradient` that uses navy hex values
- Any `background:` or `backgroundColor:` inline style containing navy values

For EACH match found, report:

| File | Line | Current Value | Element Type | What Is It? |
|------|------|--------------|-------------|-------------|

"Element Type" = one of: hero card, stat bar, button, banner, card background, section header, badge/pill, nav element, modal, other

"What Is It?" = brief description like "Admin hero card background", "Payments KPI stat bar", "Game event row in schedule list view", "Send Reminders button on dashboard"

### 3. Categorize Results

Group the findings into categories:

**A. Already using the correct gradient** (`--lynx-navy-gradient-h` or `linear-gradient(90deg, #0B1628, #162D50)`):
List these — no changes needed.

**B. Using a different gradient** (diagonal, subtle, wrong colors):
List these with the current gradient value.

**C. Using flat solid navy** (single hex color, no gradient):
List these with the current color.

**D. Should NOT be changed** — elements where a gradient would be inappropriate:
- Text colors (color: #10284C — these are text, not backgrounds)
- Border colors
- Shadow colors
- SVG fills that aren't backgrounds
- Tiny elements like dots, dividers, status indicators where a gradient wouldn't be visible
- The sidebar background (if navy)
- The TopBar/nav bar (already has its own treatment)

### 4. Component-Level Patterns

Some navy backgrounds may come from shared components rather than individual pages. Identify any reusable components that set navy backgrounds:

**Report:**
- `HeroCard.jsx` — what gradient does it use? What prop controls it?
- `InnerStatRow` or similar stat bar components — do they set their own navy background or does the page set it?
- Any button components that use navy backgrounds
- Any card wrapper components with navy variants
- Any other shared components with navy backgrounds

Changing these at the component level would fix multiple pages at once.

### 5. Button Audit

Specifically for buttons with navy backgrounds:

**Report:**
- Which buttons use navy/dark backgrounds?
- What classes or styles do they use?
- Are they using a shared button component or inline styles?
- Would applying a gradient to buttons look good at small sizes, or should buttons stay flat?

---

## OUTPUT FORMAT

```
## INVESTIGATION REPORT — Navy Background Elements Audit

### 1. CSS Token Inventory
[all navy tokens and their values]

### 2. Global Search Results
[comprehensive table of every navy background instance]

### 3. Categorized Results
A. Already correct gradient: [list]
B. Wrong gradient: [list]
C. Flat solid navy: [list]
D. Should not change: [list]

### 4. Component-Level Patterns
[shared components with navy backgrounds]

### 5. Button Audit
[findings]
```

Include exact file paths and line numbers for every finding.

---

## REMINDER

**Do NOT modify any files.** Read only. Report back.
