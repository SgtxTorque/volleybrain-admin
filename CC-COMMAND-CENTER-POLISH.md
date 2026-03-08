# CC-COMMAND-CENTER-POLISH.md
## Command Center — Font Size Increase, Color Shift, Nav Overlap Fix, Font Swap

**Read `CLAUDE.md` before writing ANY code.**
**Read ALL files referenced BEFORE modifying them.**

---

## OVERVIEW

Three changes to the full-screen Game Day Command Center and its sub-components:

1. **Increase all font sizes by 2 Tailwind steps** (e.g., `text-xs` → `text-base`, `text-sm` → `text-lg`)
2. **Shift accent color palette** from light sky blue to darker navy/lynx tones — navy (#10284C / lynx-navy) as the interactive color, lynx-sky (#4BB9EC) as the hover state. Keeps emerald/red/amber for semantic stat colors.
3. **Fix nav overlap** — full-screen panels render behind the sticky nav. Add proper z-index and top padding.
4. **Swap Bebas Neue / Rajdhani → Tele-Grotesk** — remove all non-brand font references.

---

## FILES TO MODIFY

- `src/pages/gameprep/GameDayCommandCenter.jsx` (1,283 lines)
- `src/pages/gameprep/Scoreboard.jsx`
- `src/pages/gameprep/PostGameSummary.jsx`
- `src/pages/gameprep/CourtPlayerCard.jsx`
- `src/components/games/AdvancedLineupBuilder.jsx`

---

## CHANGE 1: Font Size Scale-Up (+2 steps)

Apply this mapping to ALL text size classes in the 5 files above:

```
text-[9px]  → text-xs       (9px → 12px)
text-[10px] → text-sm       (10px → 14px)
text-xs     → text-base     (12px → 16px)
text-sm     → text-lg       (14px → 18px)
text-base   → text-xl       (16px → 20px)
text-lg     → text-2xl      (18px → 24px)
text-xl     → text-3xl      (20px → 30px)
text-2xl    → text-4xl      (24px → 36px)
text-3xl    → text-5xl      (30px → 48px)
text-4xl    → text-6xl      (36px → 60px)
text-5xl    → text-7xl      (48px → 72px)
text-6xl    → text-7xl      (60px → 72px) — cap at 7xl
```

**EXCEPTIONS — Do NOT scale these:**
- Emoji text (just the emoji character, not its container)
- Icon sizes (`w-4 h-4`, `w-5 h-5` etc) — leave as-is
- `font-size` in inline styles — convert to the Tailwind equivalent at the scaled size
- Already large headings (text-4xl+) in PostGameSummary — cap at text-7xl

**Also increase these related sizes:**
- Avatar/photo containers: `w-8 h-8` → `w-10 h-10`, `w-10 h-10` → `w-12 h-12`, `w-16 h-16` → `w-20 h-20`
- Padding on stat cards and player cards: increase by 1 step (e.g., `p-2` → `p-3`, `p-4` → `p-5`)
- Button padding: `px-4 py-2` → `px-5 py-3`, `px-2 py-0.5` → `px-3 py-1`
- `gap-2` → `gap-3`, `gap-3` → `gap-4` on major layout containers (not every single one)

---

## CHANGE 2: Color Palette Shift — Navy Interactive, Sky Hover

The Command Center should feel darker, more intense, "battle ready." Replace the current light blue/indigo interactive colors with navy as the primary interactive and lynx-sky as hover.

### Button Color Mapping

**Primary action buttons (Start Match, Save Stats, End Game):**
```
OLD: bg-gradient-to-r from-emerald-500 to-emerald-600
NEW: bg-[#10284C] hover:bg-lynx-sky text-white
     (navy base, sky hover — the "get ready" feel)
```

**Secondary action buttons (End Set, Timeouts, mode toggles):**
```
OLD: bg-indigo-500/20 text-indigo-400 border-indigo-500/30
NEW: bg-[#10284C]/30 text-[#4BB9EC] border-[#10284C]/50 hover:bg-[#10284C]/50
```

**Amber/stat action buttons (keep for stat-related):**
```
Keep amber-500 for stat highlights and hot player indicators — these are semantic
```

### Header/UI Chrome

```
OLD: border-indigo-500/30, bg-indigo-500/20
NEW: border-[#10284C]/40, bg-[#10284C]/20

OLD: text-indigo-400
NEW: text-[#4BB9EC]

OLD: text-blue-400, border-blue-500/10, rgba(59,130,246,...)
NEW: text-[#4BB9EC], border-[#10284C]/30, rgba(16,40,76,...)
```

### Background Grid Lines

```
OLD: rgba(59,130,246,0.03)  (blue grid)
NEW: rgba(16,40,76,0.06)   (navy grid — slightly more visible but still subtle)
```

### Status Colors (DO NOT CHANGE)
Keep these exactly as-is — they're semantic:
- `text-emerald-400/500` — positive (wins, aces, successful actions)
- `text-red-400/500` — negative (losses, errors)
- `text-amber-400/500` — warnings, hot streaks, important callouts
- `text-orange-400` — attack line label

### Stat Category Colors (DO NOT CHANGE)
Keep stat-specific colors (kills=red, aces=emerald, blocks=indigo, digs=amber) — these help coaches quickly identify stat types at a glance.

---

## CHANGE 3: Fix Nav Overlap

The nav bar is `sticky top-0 z-50 h-16`. Full-screen panels use `fixed inset-0 z-50` which puts them at the same z-level, causing content to be hidden behind the nav.

### Fix in GameDayCommandCenter.jsx

```jsx
// FIND (around line 935):
className="fixed inset-0 flex flex-col z-50 overflow-hidden"

// REPLACE:
className="fixed inset-0 flex flex-col z-[60] overflow-hidden"
```

This puts the Command Center ABOVE the nav when it's open. The Command Center has its own close button so the nav isn't needed.

### Fix in AdvancedLineupBuilder.jsx

```jsx
// FIND (around line 728):
className="fixed inset-0 flex flex-col z-50"

// REPLACE:
className="fixed inset-0 flex flex-col z-[60] overflow-hidden"
```

### Also fix the stat picker modal inside GDCC

```jsx
// FIND (around line 308):
className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4"

// REPLACE:
className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70] p-4"
```

(z-[70] so it renders above the Command Center itself)

---

## CHANGE 4: Font Family Swap

Remove ALL Bebas Neue and Rajdhani font references. Replace with Tele-Grotesk (the app's brand font, already loaded globally).

### In GameDayCommandCenter.jsx

```
FIND: style={{ fontFamily: "'Bebas Neue', sans-serif", ... }}
REPLACE: Remove the fontFamily entirely — Tele-Grotesk is the default body font.
         Keep any letterSpacing if present.

FIND: style={{ fontFamily: "'Rajdhani', sans-serif" }}
REPLACE: Remove the fontFamily entirely.
```

Specific instances:
- Line ~533: Pre-game team name — remove fontFamily
- Line ~961: "MISSION CONTROL" heading — remove fontFamily, keep tracking-wider
- Line ~962: Subtitle — remove fontFamily

### In Scoreboard.jsx

- Line ~68: Team name label — remove `style={{ fontFamily: "'Rajdhani', sans-serif" }}`
- Line ~106: Opponent name label — remove `style={{ fontFamily: "'Rajdhani', sans-serif" }}`

### In PostGameSummary.jsx

Search for any fontFamily references and remove them.

### Remove font loading

In `GamePrepPage.jsx`, check if the Bebas Neue / Rajdhani font loading code was already removed in the previous build. If it's still there:

```
FIND: the block that creates a <link> for 'Bebas+Neue' and 'Rajdhani'
REMOVE: the entire font loading block (the GP_FONT_LINK check + link creation)
```

---

## VERIFICATION

After all changes:

```bash
# No Bebas or Rajdhani references in game files
grep -rn "Bebas\|Rajdhani" src/pages/gameprep/ src/components/games/
# Should return ZERO results

# No backdrop-blur in these files (brand rule)
grep -rn "backdrop-blur" src/pages/gameprep/GameDayCommandCenter.jsx src/pages/gameprep/Scoreboard.jsx src/pages/gameprep/PostGameSummary.jsx src/pages/gameprep/CourtPlayerCard.jsx src/components/games/AdvancedLineupBuilder.jsx
# Should return ZERO results

# Verify z-index fixes
grep "z-\[60\]\|z-\[70\]" src/pages/gameprep/GameDayCommandCenter.jsx src/components/games/AdvancedLineupBuilder.jsx
# Should find the z-index overrides
```

Visual verification:
1. Open Game Prep → click a game → Game Day → Command Center opens ABOVE the nav bar
2. All text is noticeably larger and more legible
3. Buttons feel darker/navy — "battle ready" not "friendly sky blue"
4. Stat colors (kills red, aces green, blocks indigo, digs amber) unchanged
5. No Bebas Neue or Rajdhani fonts visible — everything is Tele-Grotesk
6. Scoreboard team names are larger and use Tele-Grotesk
7. Post-game summary is legible with larger fonts

```bash
git add -A && git commit -m "Command Center polish: +2 font sizes, navy accent palette, nav z-index fix, Tele-Grotesk font swap" && git push
```
