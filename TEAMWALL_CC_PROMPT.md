# Claude Code Prompt — TeamWall Page Redesign

**Paste this prompt into Claude Code after uploading the plan document and your current `TeamWallPage.jsx` file.**

---

## PROMPT START

I'm redesigning the authenticated TeamWall page for my Lynx youth sports platform (React + Vite + Tailwind + Supabase). I've uploaded:

1. `TEAMWALL_REDESIGN_PLAN.md` — the full implementation spec
2. My current `src/pages/public/TeamWallPage.jsx` — the file to replace

## ⚠️ CRITICAL — Read These First

1. **Read `public/lynx-brandbook-v2.html` in the repo** — single source of truth for colors, spacing, border radius, surfaces, shadows, component patterns, and dark/light mode rules.
2. **Read the uploaded `TEAMWALL_REDESIGN_PLAN.md`** — full layout spec, post type treatments, engagement system, and responsive breakpoints.

## Font — Tele-Grotesk (LOCAL FILES, NOT Google Fonts)

The brand font is **Tele-Grotesk**, stored locally in the repo at `fonts/`. Do NOT import Google Fonts. Do NOT use Plus Jakarta Sans, Bebas Neue, Rajdhani, DM Sans, Space Grotesk, or any other font.

Load via `@font-face` in the component's embedded `<style>` block:

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

**Font stack for ALL text:** `'Tele-Grotesk', -apple-system, system-ui, sans-serif`

Weight mapping:
- **Nor (400):** Body text, captions, paragraphs
- **Hal (500):** Labels, buttons, nav items, interactive text
- **Fet (700):** Headings, card titles, bold emphasis, names
- **Ult (900):** Display numbers, stat values (36px W-L counts, big metrics), hero text

## What You're Building

A complete rewrite of `TeamWallPage.jsx` — an Instagram/Facebook-inspired 3-column social team wall. Single-file component at `src/pages/public/TeamWallPage.jsx` with all sub-components defined internally.

## Critical Requirements

### Props & Exports (DO NOT CHANGE)
```jsx
function TeamWallPage({ teamId, showToast, onBack, onNavigate, activeView })
export { TeamWallPage }
```

### Imports to Preserve
```jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useParentTutorial } from '../../contexts/ParentTutorialContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { PlayerCardExpanded } from '../../components/players'
```

Import Lucide icons from `'../../constants/icons'` — available: ArrowLeft, Calendar, MapPin, Clock, Users, MessageCircle, FileText, Plus, Send, X, ChevronRight, ChevronUp, ChevronLeft, Star, Check, BarChart3, Camera, Edit, Flag, Megaphone, Trash2, Trophy, UserCog, Heart, Share2, MoreVertical, Image, Bookmark, Award, Shield, Smile. Add others you need via the same import path.

### Theme System
```jsx
const { theme: currentTheme } = useTheme()
const tc = useThemeClasses()
const isDark = currentTheme === 'dark'
```

### Brand Color Constants (from `public/lynx-brandbook-v2.html`)
```jsx
const BRAND = {
  navy: '#10284C',
  sky: '#4BB9EC',
  deepSky: '#2A9BD4',
  ice: '#E8F4FD',
  slate: '#5A6B7F',
  silver: '#DFE4EA',
  cloud: '#F5F7FA',
  white: '#FFFFFF',
  frost: '#F0F3F7',
  midnight: '#0A1B33',
  charcoal: '#1A2332',
  graphite: '#232F3E',
  darkBorder: '#2A3545',
}

const pageBg = isDark ? BRAND.midnight : BRAND.cloud
const cardBg = isDark ? BRAND.charcoal : BRAND.white
const innerBg = isDark ? BRAND.graphite : BRAND.frost
const borderColor = isDark ? BRAND.darkBorder : BRAND.silver
const textPrimary = isDark ? '#FFFFFF' : BRAND.navy
const textSecondary = isDark ? '#B0BEC5' : BRAND.slate
const textMuted = isDark ? '#7B8FA0' : BRAND.slate
const success = isDark ? '#34D399' : '#10B981'
const error = isDark ? '#F87171' : '#EF4444'
const warning = isDark ? '#FBBF24' : '#F59E0B'
const shadow = isDark ? '0 1px 3px rgba(0,0,0,.3)' : '0 1px 3px rgba(0,0,0,.05)'
const shadowElevated = isDark ? '0 8px 24px rgba(0,0,0,.3)' : '0 8px 24px rgba(0,0,0,.08)'
```

### Supabase Tables (Already Exist)
- `teams` — id, name, team_color, logo_url, banner_url, motto, season_id
- `team_posts` — id, team_id, author_id, post_type ('announcement'|'photo'|'milestone'|'game_recap'|'shoutout'), title, content, media_urls (text[]), is_pinned, is_published, reaction_count, comment_count, created_at
- `team_post_reactions` — id, post_id, user_id, reaction_type, created_at
- `team_post_comments` — id, post_id, author_id, content, parent_comment_id, created_at
- `players` — id, team_id, first_name, last_name, jersey_number, position, status, avatar_url, parent_account_id
- `events` — id, team_id, event_type, title, start_date, start_time, end_time, location, opponent, season_id
- `profiles` — id, full_name, avatar_url, role
- `team_milestones` — id, team_id, title, description

### Parent Tutorial Integration
```jsx
const { completeStep } = useParentTutorial?.() || {}
// In useEffect after data loads:
completeStep?.('join_team_hub')
```

## Layout Specification

**Read the full layout spec in `TEAMWALL_REDESIGN_PLAN.md`.** Summary:

### 3-Column Grid
- Left: ~280px, position sticky, no scroll
- Center: flex-1, overflow-y auto (scrollable feed)
- Right: ~300px, overflow-y auto (scrollable)

### Left Column (Static):
1. Team Hero Header — logo (80px), name (18px/Fet), Season Record (36px/Ult stat numbers, gradient progress bar, recent form dots)
2. Next Event Hero Card — type badge, opponent, date/time/location, Get Directions secondary btn
3. Upcoming Events — 3 compact cards with 28px/Ult date numbers
4. Quick Actions — ghost button rows with Hal weight labels

### Center Column (Scrollable):
1. Create Post Bar — avatar + "Share a Moment" input + camera icons → modal
2. Post Feed:
   - **Photo posts:** No border at rest, hover shadow+rise. Author row + edge-to-edge photos (IG ratios, letterbox others). Emoji picker (❤️🔥👏🎉💪), comment slide panel, share, bookmark. Caption.
   - **Announcements:** Card + Frost/Graphite inner panel, Fet bold heading
   - **Shoutouts:** Elevated shadow, hover translateY(-4px), star accent, recipient Sky Blue
   - **Text-only:** Card + inner panel, Nor weight
3. Back-to-top FAB after 8 posts (Sky Blue circle, white ↑)

### Right Column (Scrollable):
1. Gallery — 3×2 grid → fullscreen lightbox (dark overlay, ← → arrows, comment panel, keyboard nav)
2. Challenges / Achievements / Leaderboard — link buttons
3. Head Coach Profile Card — clickable → profile
4. Team Roster — hover popup: Shoutout + View Profile

### Create Post Modal (Facebook-style):
- 500px modal, post type pills, textarea auto-expand, media grid, toolbar, primary Post button
- Shoutout variant: player picker + chip

### Comment Slide Panel:
- Right-to-left over right column, ~350px, comments with like/reply/nesting, input + Send

### Emoji Reaction Picker:
- 5 emojis in popup card, bounce animation, top 3 mini icons

## Brand Book Compliance Checklist

Before finalizing, verify:
- [ ] Only Tele-Grotesk font via local @font-face (no Google Fonts imports)
- [ ] Font stack: `'Tele-Grotesk', -apple-system, system-ui, sans-serif` on all text
- [ ] Correct weight mapping: Nor=400, Hal=500, Fet=700, Ult=900
- [ ] Sky Blue `#4BB9EC` is the ONLY accent color
- [ ] Surfaces: Cloud→White→Frost (light) / Midnight→Charcoal→Graphite (dark)
- [ ] No pure black (#000) in dark mode
- [ ] No glass/blur effects
- [ ] No all-caps headings > 13px (uppercase labels are 11px only)
- [ ] Border radius: 12px cards, 10px buttons, 6px badges, 999px pills
- [ ] Shadows match brand book values exactly
- [ ] Borders: Silver `#DFE4EA` light / `#2A3545` dark
- [ ] Labels: 11px / Hal 500 / 0.1em tracking / uppercase / Slate
- [ ] Stat numbers: 36px / Ult 900 / Sky Blue
- [ ] Primary buttons: Sky Blue bg, white text, `translateY(-1px)` hover
- [ ] All transitions: 250ms
- [ ] Nav bar stays Navy in both modes (don't touch it)

## Responsive Breakpoints
- ≥1280px: Full 3-column
- 1024-1279px: 3-column, narrower sidebars
- 768-1023px: 2-column (left collapses)
- <768px: Single column stack

## Output
Replace `src/pages/public/TeamWallPage.jsx` entirely. Single file, all sub-components internal. Same export and props interface. If >2000 lines, split into numbered parts for concatenation.

## END OF PROMPT
