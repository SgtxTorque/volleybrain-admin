# CC-TEAMWALL-CHATS-MODERNIZE.md
## Grouping 2: Modernize TeamWallPage + ChatsPage to Design System

**Date:** February 27, 2026
**Repo:** `volleybrain-admin` (GitHub: SgtxTorque/volleybrain-admin)
**Prereq:** SchedulePage extraction + restyle (Grouping 1) should be complete.

---

## ⛔ RULES

1. **Read CLAUDE.md and DATABASE_SCHEMA.md before doing anything.**
2. **ZERO functional changes.** Do NOT change Supabase queries, state logic, props, event handlers, or business logic.
3. **Preserve all existing functionality.** Posts, reactions, comments, photo gallery, challenges, chat messages, emoji/GIF pickers — everything must still work.
4. **Git commit after each major milestone.** Test `npm run dev` after each.
5. **Do NOT delete the custom CSS blocks** (HUB_STYLES, CHAT_STYLES) until ALL styles have been migrated off them. If you replace a custom class, make sure nothing else still uses it.

---

## SITUATION ASSESSMENT

Both pages have a **custom glassmorphism design language** that is different from the new dashboard design system:

| Issue | TeamWallPage (1,802 lines) | ChatsPage (1,562 lines) |
|-------|---------------------------|------------------------|
| Font override | DM Sans, Bebas Neue, Rajdhani (via @import) | DM Sans, Bebas Neue, Rajdhani (via @import) |
| Card system | Custom `.tw-glass` CSS class | Custom `.ch-glass` CSS class |
| Animations | Custom keyframes (fadeUp, scaleIn, etc.) | Custom keyframes (fadeUp, msgIn, etc.) |
| Theme handling | `isDark` conditionals + inline styles | `isDark` conditionals + inline styles |
| Hardcoded dark instances | ~25 | ~6 |
| Already uses `tc.*` | Yes, 155 references | Yes, 138 references |

**Key insight:** These pages are NOT in the same broken state as SchedulePage was. They already handle dark/light mode. The problem is they use **different fonts**, **different card styles**, and **different visual language** than the dashboards.

---

## WHAT NEEDS TO CHANGE

### 1. Font Alignment
**Remove** the custom @import Google Fonts lines from HUB_STYLES and CHAT_STYLES. The app already loads Tele-Grotesk in `tailwind.config.js` as `font-sans`. The custom font families (Bebas Neue, Rajdhani, DM Sans) create visual inconsistency with the rest of the app.

**Replace:**
- `.tw-display` / `.ch-display` (Bebas Neue) → `font-extrabold tracking-tight` (Tele-Grotesk via font-sans)
- `.tw-heading` / `.ch-heading` (Rajdhani) → `text-xs font-bold uppercase tracking-wider` (for section labels) or `font-semibold` (for other headings)
- `.tw-mono` / `ch-mono` → `font-mono` (already configured as JetBrains Mono in tailwind config)
- `style={{ fontFamily: "'DM Sans', system-ui" }}` on root divs → **remove entirely** (let Tele-Grotesk inherit)

### 2. Card System Alignment
**Replace** `.tw-glass` / `.ch-glass` custom CSS with the dashboard card pattern:

```
Old: className="tw-glass overflow-hidden"
New: className={`${tc.cardBg} border ${tc.border} rounded-2xl shadow-sm overflow-hidden`}
```

For the main chat container:
```
Old: className="ch-glass ch-au"
New: className={`${tc.cardBg} border ${tc.border} rounded-2xl shadow-sm overflow-hidden`}
```

### 3. Section Headers
Replace custom tracking/sizing with the established pattern:
```
Old: className="text-[8px] tw-heading tracking-[.2em]" style={{ color: `${g}88` }}
New: className={`text-xs font-bold uppercase tracking-wider ${tc.textMuted}`}
```

### 4. Remove Inline Style Overrides
Many elements use `style={{ color: isDark ? 'rgba(255,255,255,.6)' : 'rgba(0,0,0,.5)' }}`. These should be replaced with Tailwind `tc.*` classes where possible.

### 5. Keep Team Color Accents
The team-color-based gradients, accent bars, and colored borders are GOOD — they give each team wall personality. **Keep all team-color-driven styling.** Only change the structural/layout patterns.

### 6. Keep Animations (but simplify)
The custom keyframe animations (fadeUp, scaleIn, cardIn) add polish. **Keep the animation keyframes** in the style block but remove the custom font imports and custom glass classes. The style block can shrink but doesn't need to disappear.

---

## EXECUTION PLAN

### Phase A: TeamWallPage Extraction (if needed)

**Components in TeamWallPage.jsx (1,802 lines):**

| Component | Lines | Size | Action |
|-----------|-------|------|--------|
| Helpers (VolleyballIcon, formatTime12, useCountdown) | 25–66 | 42 lines | Leave in place |
| HUB_STYLES constant | 69–140 | 72 lines | Edit in place |
| `TeamWallPage` (main) | 145–1165 | 1,021 lines | Leave — over 500 lines but tightly coupled |
| `adjustBrightness` helper | 1167–1181 | 15 lines | Leave in place |
| `PhotoBanner` | 1183–1247 | 65 lines | Leave in place |
| `NextGameBanner` | 1249–1315 | 67 lines | Leave in place |
| `SeasonPulseBanner` | 1316–1347 | 32 lines | Leave in place |
| `SectionHeader` | 1348–1363 | 16 lines | Leave in place |
| `FeedPost` | 1364–1616 | 253 lines | **Extract to `FeedPost.jsx`** |
| `NewPostModal` | 1618–1802 | 185 lines | **Extract to `NewPostModal.jsx`** |

**Extract FeedPost and NewPostModal** into `src/pages/teams/FeedPost.jsx` and `src/pages/teams/NewPostModal.jsx`.

FeedPost imports needed:
```javascript
import { useState, useEffect, useRef } from 'react'
import { MoreVertical, Trash2, Edit, Flag, X, Check } from '../../constants/icons'
import { CommentSection } from '../../components/teams/CommentSection'
import { ReactionBar } from '../../components/teams/ReactionBar'
import { Lightbox } from '../../components/teams/PhotoGallery'
```

NewPostModal imports needed:
```javascript
import { useState, useRef } from 'react'
import { X, Camera, Send } from '../../constants/icons'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
```

**Note:** Both components receive `g` (team color), `isDark`, and other props from the parent. Verify all props are passed correctly after extraction.

**Commit:**
```bash
git add -A && git commit -m "Extract FeedPost and NewPostModal from TeamWallPage"
```

---

### Phase B: TeamWallPage Visual Restyle

**Step B1: Remove custom font imports from HUB_STYLES**

In the `HUB_STYLES` constant, **delete this line:**
```
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:...');
```

**Remove the root div font override:**
```
Old: <div className={`min-h-screen pb-24 ${!isDark ? 'tw-light' : ''}`} style={{ fontFamily: "'DM Sans', system-ui" }}>
New: <div className={`min-h-screen pb-24 ${!isDark ? 'tw-light' : ''}`}>
```

**Step B2: Replace `.tw-display` class usages**

Search for all `tw-display` in the file. Replace with Tailwind equivalents:
- Large stat numbers: `tw-display text-2xl md:text-3xl font-bold` → `text-2xl md:text-3xl font-extrabold tracking-tight`
- Team name display: `tw-display text-3xl font-bold` → `text-3xl font-extrabold tracking-tight`
- Section stat values: keep `font-bold` sizing, just drop `tw-display`

**Step B3: Replace `.tw-heading` class usages**

Search for all `tw-heading` in the file. Replace based on context:
- Section labels like "PLAYERS", "COACHES": `tw-heading tracking-[.2em]` → `font-bold uppercase tracking-wider`
- Button labels: `tw-heading tracking-wider` → `font-bold uppercase tracking-wider`
- Small labels: `tw-heading tracking-[.12em]` → `font-semibold uppercase tracking-wide`

**Step B4: Replace `.tw-glass` card classes**

Replace `tw-glass` card wrappers with the design system card:
```
Old: className="tw-glass overflow-hidden"
New: className={`overflow-hidden rounded-2xl shadow-sm ${isDark ? 'bg-slate-800/90 backdrop-blur-xl border border-white/[0.06]' : 'bg-white border border-slate-200'}`}
```

**EXCEPTION:** The main "Hype Profile Header" card at the top (the one with the banner carousel) has a unique design that's intentionally different. **Keep its glass styling** — it's the team's hero card and should look premium. Only change the feed posts, sidebar cards, and structural elements.

**Step B5: Replace inline style colors with tc.* classes**

Throughout the file, find instances like:
```javascript
style={{ color: isDark ? 'rgba(255,255,255,.6)' : 'rgba(0,0,0,.5)' }}
```
Replace with:
```javascript
className={tc.textMuted}
```

And:
```javascript
style={{ color: isDark ? 'white' : '#1a1a1a' }}
```
Replace with:
```javascript
className={tc.text}
```

**Only replace where the color mapping is straightforward.** If the inline style uses team-color-based values (like `style={{ color: g }}`), **leave it alone**.

**Step B6: Clean up HUB_STYLES**

After all replacements, remove unused CSS classes from the HUB_STYLES constant:
- Remove `.tw-display`, `.tw-heading`, `.tw-mono` class definitions (if no longer used)
- Remove `.tw-glass` and `.tw-glass-glow` definitions (if no longer used)
- Remove `.tw-light .tw-glass` overrides (if no longer used)
- **Keep** animation keyframes (fadeUp, scaleIn, cardIn, marquee, etc.)
- **Keep** `.tw-nos` (scrollbar hiding), `.tw-clift` (hover lift), `.tw-au/.tw-ai/.tw-as/.tw-ac` (animation triggers)
- **Keep** `.tw-auto-accent`, `.tw-badge-accent`, `.tw-reminder-accent` (post type accents)

**Commit:**
```bash
git add -A && git commit -m "Restyle TeamWallPage to design system: fonts, cards, colors"
```

---

### Phase C: ChatsPage Extraction (if needed)

**Components in ChatsPage.jsx (1,562 lines):**

| Component | Lines | Size | Action |
|-----------|-------|------|--------|
| Constants (EMOJI_CATEGORIES, SOUNDS, etc.) | 17–98 | ~82 lines | Leave in place |
| `ChatsPage` (main) | 103–398 | 296 lines | Leave in place |
| `ConversationItem` | 400–472 | 73 lines | Leave in place (small) |
| `ChatThread` | 474–1134 | 661 lines | **Extract to `ChatThread.jsx`** |
| `MessageBubble` | 1136–1302 | 167 lines | **Extract to `MessageBubble.jsx`** |
| `EmojiPicker` | 1304–1348 | 45 lines | Leave in place (small) |
| `GifPicker` | 1349–1435 | 87 lines | Leave in place (small) |
| `NewChatModal` | 1436–1561 | 126 lines | Leave in place (small) |

**Extract ChatThread and MessageBubble** into `src/pages/chats/ChatThread.jsx` and `src/pages/chats/MessageBubble.jsx`.

ChatThread imports needed:
```javascript
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  X, Send, Image, Smile, MoreVertical, Reply, Trash2,
  ChevronLeft, Paperclip, Gift, Download
} from '../../constants/icons'
import MessageBubble from './MessageBubble'
```

Note: ChatThread also uses EmojiPicker and GifPicker. Since those stay in ChatsPage.jsx, they need to either:
- Be passed as props, OR
- Also be extracted, OR  
- Be moved to a shared location

**Simplest approach:** Extract EmojiPicker and GifPicker into `src/pages/chats/ChatPickers.jsx` so ChatThread can import them directly.

MessageBubble imports needed:
```javascript
import { useState, useRef } from 'react'
import { Reply, Trash2, Download, Maximize2 } from '../../constants/icons'
```

**Commit:**
```bash
git add -A && git commit -m "Extract ChatThread, MessageBubble, ChatPickers from ChatsPage"
```

---

### Phase D: ChatsPage Visual Restyle

**Step D1: Remove custom font imports from CHAT_STYLES**

Delete the @import line. Remove `style={{ fontFamily: "'DM Sans', system-ui" }}` from root div.

**Step D2: Replace `.ch-display` and `.ch-heading`**

Same pattern as TeamWallPage:
- `ch-display text-3xl font-bold` → `text-3xl font-extrabold tracking-tight`
- `ch-heading` → `font-bold uppercase tracking-wider`

**Step D3: Replace `.ch-glass` with design system cards**

The main chat container:
```
Old: className="ch-glass ch-au" style={{ borderRadius: 28 }}
New: className={`${tc.cardBg} border ${tc.border} rounded-2xl shadow-sm overflow-hidden`}
```

The sidebar list items already use inline isDark styles — convert to tc.* where possible.

**Step D4: Replace inline colors with tc.* classes**

Same approach as TeamWallPage — straightforward color mappings get tc.* classes, team-color-based styles stay as inline.

**Step D5: Clean up CHAT_STYLES**

Remove unused class definitions, keep animations and scrollbar hiding.

**Step D6: Conversation list sidebar polish**

The conversation sidebar should match the dashboard sidebar pattern:
- List items: `rounded-xl` padding, hover state using `${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'}`
- Selected item: subtle accent highlight
- Search bar: use tc.input pattern

**Step D7: Message composer bar**

The message input area at the bottom of chat threads should use:
- Input: `tc.input` pattern with rounded-xl
- Send button: accent primary color
- Attachment/emoji buttons: `tc.textMuted` with hover

**Commit:**
```bash
git add -A && git commit -m "Restyle ChatsPage to design system: fonts, cards, colors"
```

---

### Phase E: Final Polish & Push

```bash
git add -A && git commit -m "Grouping 2 complete: TeamWallPage + ChatsPage modernized"
git push
```

---

## VERIFICATION CHECKLIST

### TeamWallPage
- [ ] Page uses Tele-Grotesk font (not DM Sans/Bebas Neue)
- [ ] Feed posts use white cards (light mode) / dark cards (dark mode) matching dashboard
- [ ] Team banner/hero section still looks premium (gradients, team colors)
- [ ] Quick action buttons still work
- [ ] Tab navigation works (Feed, Challenges, Gallery, Roster, Schedule, Documents)
- [ ] New Post modal opens and posts can be created
- [ ] Comments expand/collapse
- [ ] Emoji reactions work
- [ ] Photo gallery displays and lightbox opens
- [ ] Shoutout modal works
- [ ] Challenge cards display
- [ ] Ticker/marquee still scrolls
- [ ] Instagram-style highlight circles still render
- [ ] Banner carousel auto-rotates

### ChatsPage
- [ ] Page uses Tele-Grotesk font
- [ ] Chat container uses design system card style
- [ ] Conversation list is readable in both themes
- [ ] Search bar works
- [ ] Click a conversation → thread opens
- [ ] Messages display correctly (own vs. others)
- [ ] Send a message works
- [ ] Emoji picker opens and inserts emoji
- [ ] GIF picker opens (may need API key)
- [ ] Reply to message works
- [ ] Reactions on messages work
- [ ] New Chat modal opens
- [ ] Mobile responsive (sidebar hides when thread open)
- [ ] Sound effects still play (if enabled)

---

## IMPORTANT NOTE ON SCOPE

These pages are more complex than SchedulePage because they have **intentional design personality** (the glass effects, team-color gradients, animations). The goal is NOT to strip them down to plain white cards everywhere. The goal is:

1. **Font consistency** — Tele-Grotesk everywhere, not 4 different Google Fonts
2. **Card consistency** — structural cards (feed posts, sidebar items, modals) should match the dashboard pattern
3. **Color consistency** — use tc.* theme classes instead of inline rgba() values for standard text/bg
4. **Keep personality** — team color accents, hero banners, animations stay

If in doubt: **match the dashboards for structure, keep team colors for personality.**
