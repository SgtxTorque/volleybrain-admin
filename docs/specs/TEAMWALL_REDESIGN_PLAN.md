# Lynx — Authenticated TeamWall Page Redesign
## Implementation Plan for Claude Code

**Date:** February 28, 2026  
**File Target:** `src/pages/public/TeamWallPage.jsx`  
**Design DNA:** Instagram feed × Facebook Groups × Lynx Brand System v2  

---

## ⚠️ BRAND SYSTEM — MANDATORY FIRST STEP

**Before writing ANY code, read `public/lynx-brandbook-v2.html` in the repo.** This is the single source of truth for ALL visual decisions: colors, typography scale, spacing, border radius, component patterns, surfaces, shadows, and dark/light mode rules.

If anything in this plan contradicts the brand book, the brand book wins — EXCEPT for the font, which is overridden below.

---

## TYPOGRAPHY — LOCAL FONT FILES

The brand book references Plus Jakarta Sans as a web fallback. The actual Lynx brand font is **Tele-Grotesk**, with font files stored locally in the repo at `fonts/`:

| File | Weight Name | CSS weight | Usage |
|------|------------|------------|-------|
| `fonts/Tele-GroteskNor-Regular.ttf` | Normal | `400` | Body text, captions, secondary text |
| `fonts/Tele-GroteskHal-Regular.ttf` | Half (Medium) | `500` | Labels, buttons, nav items |
| `fonts/Tele-GroteskFet-Regular.ttf` | Fet (Bold) | `600` / `700` | Headings, card titles, bold text |
| `fonts/Tele-GroteskUlt-Regular.ttf` | Ultra (Black) | `800` / `900` | Display/stat numbers, hero text |

Load these via `@font-face` in the component's embedded `<style>` block:

```css
@font-face {
  font-family: 'Tele-Grotesk';
  src: url('/fonts/Tele-GroteskNor-Regular.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Tele-Grotesk';
  src: url('/fonts/Tele-GroteskHal-Regular.ttf') format('truetype');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Tele-Grotesk';
  src: url('/fonts/Tele-GroteskFet-Regular.ttf') format('truetype');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Tele-Grotesk';
  src: url('/fonts/Tele-GroteskUlt-Regular.ttf') format('truetype');
  font-weight: 900;
  font-style: normal;
  font-display: swap;
}
```

**Font stack:** `'Tele-Grotesk', -apple-system, system-ui, sans-serif`

Apply to all text. Do NOT import Google Fonts. Do NOT use Plus Jakarta Sans, Bebas Neue, Rajdhani, DM Sans, Space Grotesk, or any other font.

### Type Scale (using Tele-Grotesk weights)
| Role | Size | Weight (file) | Usage |
|------|------|--------------|-------|
| Page Title | 28px | 700 (Fet) | Page-level headings |
| Section | 18px | 700 (Fet) | Section headings, team name |
| Card Title | 15px | 700 (Fet) | Card headings, bold items |
| Body | 14px | 400 (Nor) | Standard text, paragraphs |
| Button/Nav | 13px | 500 (Hal) | Buttons, interactive labels |
| Label | 11px | 500 (Hal) | 0.1em tracking, uppercase, Slate color |
| Caption | 12px | 400 (Nor) | Timestamps, secondary info |
| Stat Number | 36px | 900 (Ult) | Big W-L numbers, key metrics, Sky Blue |
| Display | 28px+ | 900 (Ult) | Hero/emphasis text |

---

## BRAND COLORS (from `public/lynx-brandbook-v2.html`)

### Core
| Token | Hex | Usage |
|-------|-----|-------|
| **Navy** | `#10284C` | Nav bar, headings, primary text (light) |
| **Sky Blue** | `#4BB9EC` | ALL interactive elements — buttons, links, active, accents |
| **Deep Sky** | `#2A9BD4` | Hover & pressed states |
| **Ice Blue** | `#E8F4FD` | Highlights, selected bg (light) |

### Neutrals
| Token | Hex | Usage |
|-------|-----|-------|
| **Slate** | `#5A6B7F` | Secondary text, labels |
| **Silver** | `#DFE4EA` | Borders, dividers (light) |

### Surfaces
| Mode | Page bg | Cards | Inner panels | Borders |
|------|---------|-------|-------------|---------|
| Light | Cloud `#F5F7FA` | White `#FFFFFF` | Frost `#F0F3F7` | Silver `#DFE4EA` |
| Dark | Midnight `#0A1B33` | Charcoal `#1A2332` | Graphite `#232F3E` | `#2A3545` |

### Semantic
| Color | Light | Dark | Usage |
|-------|-------|------|-------|
| Success | `#10B981` | `#34D399` | Wins, confirmed |
| Error | `#EF4444` | `#F87171` | Losses, failed |
| Warning | `#F59E0B` | `#FBBF24` | Pending, attention |

### Shadows
- Standard: `0 1px 3px rgba(0,0,0,.05)` light / `0 1px 3px rgba(0,0,0,.3)` dark
- Elevated: `0 8px 24px rgba(0,0,0,.08)` light / `0 8px 24px rgba(0,0,0,.3)` dark

### Border Radius
- Cards/Modals: `12px`
- Buttons/Inputs: `10px`
- Badges/Tags: `6px`
- Pills/Avatars: `999px`

### Spacing (4px base grid)
4, 8, 12, 16, 20, 24, 32, 48

### Do's & Don'ts (see brand book for full list)
- ✅ Sky Blue for ALL interactive elements, ONE accent
- ✅ Uppercase tracked labels (11px/500/0.1em) for section headers
- ✅ Navy headings (light) / white headings (dark)
- ✅ Stat numbers in Sky Blue using Ult weight (900)
- ✅ Nav bar ALWAYS Navy, both modes
- ❌ No pure black (#000)
- ❌ No gray-tinted surfaces (bg-slate-800)
- ❌ No glass/blur effects on standard pages
- ❌ No multiple accent colors
- ❌ No all-caps headings > 13px
- ❌ No Google Font imports — use local Tele-Grotesk only

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    NAV BAR (existing, always Navy #10284C)           │
├──────────────┬────────────────────────────┬─────────────────────────┤
│  LEFT COL    │     CENTER COL             │    RIGHT COL            │
│  (STATIC)    │     (SCROLLABLE)           │    (SCROLLABLE)         │
│  ~280px      │     flex-1                 │    ~300px               │
│              │                            │                         │
│ ┌──────────┐ │ ┌────────────────────────┐ │ ┌─────────────────────┐ │
│ │ Team     │ │ │ Create Post Bar        │ │ │ GALLERY             │ │
│ │ Hero     │ │ │ (Facebook-style)       │ │ │ (Photo grid 3x2)   │ │
│ │ Header   │ │ └────────────────────────┘ │ │ Click → fullscreen  │ │
│ │          │ │                            │ │ lightbox w/ arrows   │ │
│ │ • Logo   │ │ ┌────────────────────────┐ │ └─────────────────────┘ │
│ │ • Name   │ │ │ POST CARD (photo)      │ │                         │
│ │ • Record │ │ │ • Edge-to-edge photo   │ │ ┌─────────────────────┐ │
│ │ • Form   │ │ │ • Author info top      │ │ │ Challenges          │ │
│ └──────────┘ │ │ • 3-dot menu           │ │ │ Achievements        │ │
│              │ │ • Engagement bar        │ │ │ Leaderboard         │ │
│ ┌──────────┐ │ │ • Caption              │ │ │ (link buttons)      │ │
│ │ NEXT     │ │ └────────────────────────┘ │ └─────────────────────┘ │
│ │ EVENT    │ │                            │                         │
│ │ Hero     │ │ ┌────────────────────────┐ │ ┌─────────────────────┐ │
│ │ Card     │ │ │ POST CARD (announce)   │ │ │ HEAD COACH          │ │
│ └──────────┘ │ │ • Bordered card        │ │ │ Profile Card        │ │
│              │ │ • Bold text            │ │ │ (click → profile)   │ │
│ ┌──────────┐ │ │ • Comment-bubble style │ │ └─────────────────────┘ │
│ │ Event 1  │ │ └────────────────────────┘ │                         │
│ ├──────────┤ │                            │ ┌─────────────────────┐ │
│ │ Event 2  │ │ ┌────────────────────────┐ │ │ TEAM ROSTER         │ │
│ ├──────────┤ │ │ POST CARD (shoutout)   │ │ │ Player cards        │ │
│ │ Event 3  │ │ │ • Bordered + shadow    │ │ │ Hover → popup:      │ │
│ └──────────┘ │ │ • Rise on hover        │ │ │   • Shoutout menu   │ │
│              │ │ • Elevated treatment    │ │ │   • View profile    │ │
│ ┌──────────┐ │ └────────────────────────┘ │ └─────────────────────┘ │
│ │ QUICK    │ │                            │                         │
│ │ ACTIONS  │ │  ... more posts ...        │                         │
│ │ • Attend │ │                            │                         │
│ │ • Msg    │ │ [↑ Back to Top FAB         │                         │
│ │ • Warmup │ │  after 8+ posts]           │                         │
│ │ • Hub    │ │                            │                         │
│ │ • Chat   │ │                            │                         │
│ └──────────┘ │                            │                         │
└──────────────┴────────────────────────────┴─────────────────────────┘
```

---

## 1. LEFT COLUMN — Team Identity (Static, No Scroll)

All cards: brand book card pattern (card bg, 1px border, 12px radius, standard shadow).

### 1A. Team Hero Header Card
- Team logo: centered, 80px, 999px radius
- Team name: 18px / Fet 700, Navy/white
- Season Record: "SEASON RECORD" label (11px/Hal 500/0.1em/uppercase/Slate), W-L in 36px/Ult 900 (Success green wins, Error red losses), win % Navy/white, progress bar (5px, gradient fill `#10B981` → `#4BB9EC`), "RECENT FORM" + colored dots (last 5 results)

### 1B. Next Event Hero Card
- Event type badges (brand book badge atoms), "TOMORROW"/"TODAY" warning badge
- "GAME DAY" heading (15px/Fet 700), opponent (18px/Fet 700)
- Date/time/location (12px/Nor 400/Slate) with icons
- "Get Directions" secondary button (Sky Blue border + text)
- Decorative volleyball SVG corner, low opacity

### 1C. Upcoming Events (3 compact)
- "UPCOMING" label + "Full Calendar >" Sky Blue link
- Date block (label month + 28px/Ult 900 day) + title (14px/Hal 500) + time (12px/Nor 400/Slate)
- 1px dividers

### 1D. Quick Actions
- "QUICK ACTIONS" label
- Full-width ghost button rows: icon (18px Slate) + label (14px/Hal 500) + ChevronRight
- Hover: Frost/Graphite bg

---

## 2. CENTER COLUMN — Social Feed (Scrollable)

### 2A. Create Post Bar
- Standard card, avatar (36px, 999px) + input pill (brand book input style) "Share a Moment" + camera/media icons (Sky Blue)

### 2B. Post Types

**Photo:** No border at rest, hover shadow + `translateY(-2px)`. Author row: avatar (32px), name (14px/Fet 700), timestamp (12px/Nor 400/Slate), "Follow" (Sky Blue 12px/Hal 500), MoreVertical (Slate). Photo edge-to-edge (IG ratios 1:1, 4:5, 1.91:1 — letterbox others). Engagement: emoji picker (❤️🔥👏🎉💪), comment count → slide panel, share, bookmark. Caption: name (Fet) + text (Nor) + hashtags (Sky Blue).

**Announcement:** Card + inner panel (Frost/Graphite), bold heading (15px/Fet 700).

**Shoutout:** Elevated shadow, hover `translateY(-4px)`, star/trophy Warning accent, recipient Sky Blue.

**Text-only:** Card + inner panel, regular weight (Nor 400).

### 2C. Back-to-top FAB after 8 posts (40px Sky Blue circle, white ChevronUp, fade in/out)

### 2D. Comment Slide Panel
- Right-to-left over right column, ~350px, card bg, border, elevated shadow
- Comments: avatar (28px), name (13px/Hal 500), timestamp (11px/Nor 400/Slate), text (13px/Nor 400), Heart like, "Reply" (Sky Blue), nested 24px indent
- Input bar + Send primary button. No glass effects.

---

## 3. RIGHT COLUMN — Discovery & Community (Scrollable)

### 3A. Gallery — "GALLERY" label, 3×2 grid, hover scale 1.03. Click → fullscreen lightbox (dark overlay, photo centered, ← → arrows, comment panel right, engagement, keyboard nav, Close X)

### 3B. Challenges / Achievements / Leaderboard — link buttons, ghost hover, → `onNavigate`

### 3C. Head Coach Profile Card — avatar (64px), "HEAD COACH" label, name (15px/Fet), bio (12px/Slate), clickable → profile

### 3D. Team Roster — "ROSTER" label. Player rows: avatar (32px, Sky Blue bg + white initials fallback), name (13px/Hal 500), "#Jersey · Position" (11px/Slate). Hover popup: "⭐ Give Shoutout" primary btn + "👤 View Profile" ghost btn

---

## 4. CREATE POST MODAL (Facebook Clone)

Overlay → modal (500px, card bg, 12px radius, elevated shadow). Header: "Create Post" (18px/Fet) + Close X. Author row + audience dropdown. Post type pills (999px, Ice Blue/rgba active): 📝 Post | 📢 Announcement | ⭐ Shoutout | 📸 Photo. Borderless textarea (14px/Nor, "What's on your mind?"). Media preview grid. Bottom toolbar: photo, pin (coach), schedule (coach), tag. Full-width primary Post button. Shoutout variant: player picker + chip (Ice Blue bg + Deep Sky text).

---

## 5. ENGAGEMENT — Emoji picker (card popup, 5 emojis, bounce anim). Share menu (card popover, list items).

## 6. THEME — Use `useTheme()` + `useThemeClasses()`. BRAND constants + isDark helpers.

## 7. RESPONSIVE — ≥1280 full 3-col, 1024-1279 narrower, 768-1023 2-col, <768 single stack

## 8. DATABASE — team_posts, team_post_reactions, team_post_comments, teams, players, events, profiles (all exist)

## 9. PRESERVE — imports, props signature `{ teamId, showToast, onBack, onNavigate, activeView }`, export, `completeStep?.('join_team_hub')`

## 10. ANIMATIONS — All 250ms. translateY hovers, scale transitions, slide panels, fade FAB. Primary buttons: `translateY(-1px)` hover.

## 11. Single file: `src/pages/public/TeamWallPage.jsx`. All sub-components internal. Split if >2000 lines.
