# CC-PLAYER-DASHBOARD-REDESIGN.md
## Player Dashboard — Premium Dark Social Redesign (Audited v2)

**File:** `src/pages/roles/PlayerDashboard.jsx`
**Read CLAUDE.md and DATABASE_SCHEMA.md first.**

---

## STEP 0: SAFETY CHECKPOINT

```bash
git add -A && git commit -m "Pre-player-redesign checkpoint"
```

---

## THE VIBE

**Spotify profile meets Instagram meets a premium sports app.**
Premium dark, socially alive, dopamine-driven. NOT gamer/neon/hex.
Modern teens live on TikTok, IG, Snapchat — this should feel familiar.
Every visit = recognition, progress, connection, motivation.

---

## THEME SYSTEM — Player-Customizable Colors

Build using CSS custom properties so players can personalize later.
Define on the player dashboard wrapper div:

```jsx
const PLAYER_THEMES = {
  default: {
    '--player-bg': '#0f1117',
    '--player-card': '#1a1d27',
    '--player-card-hover': '#1f2331',
    '--player-accent': '#E8A838',
    '--player-accent-glow': 'rgba(232, 168, 56, 0.3)',
    '--player-border': 'rgba(255,255,255,0.06)',
    '--player-text': '#ffffff',
    '--player-text-secondary': 'rgba(255,255,255,0.60)',
    '--player-text-muted': 'rgba(255,255,255,0.30)',
  },
  pink: {
    '--player-bg': '#120b10',
    '--player-card': '#1f1520',
    '--player-accent': '#ec4899',
    '--player-accent-glow': 'rgba(236, 72, 153, 0.3)',
    '--player-border': 'rgba(255,255,255,0.06)',
    '--player-text': '#ffffff',
    '--player-text-secondary': 'rgba(255,255,255,0.60)',
    '--player-text-muted': 'rgba(255,255,255,0.30)',
  },
  ocean: {
    '--player-bg': '#0b1117',
    '--player-card': '#131d27',
    '--player-accent': '#06b6d4',
    '--player-accent-glow': 'rgba(6, 182, 212, 0.3)',
    '--player-border': 'rgba(255,255,255,0.06)',
    '--player-text': '#ffffff',
    '--player-text-secondary': 'rgba(255,255,255,0.60)',
    '--player-text-muted': 'rgba(255,255,255,0.30)',
  },
  emerald: {
    '--player-bg': '#0b1210',
    '--player-card': '#132720',
    '--player-accent': '#10b981',
    '--player-accent-glow': 'rgba(16, 185, 129, 0.3)',
    '--player-border': 'rgba(255,255,255,0.06)',
    '--player-text': '#ffffff',
    '--player-text-secondary': 'rgba(255,255,255,0.60)',
    '--player-text-muted': 'rgba(255,255,255,0.30)',
  },
};
```

**CRITICAL: Use CSS variables for ALL colors in the player dashboard.**
```jsx
// YES — themeable:
style={{ background: 'var(--player-card)', color: 'var(--player-accent)' }}

// NO — hardcoded, not themeable:
className="bg-[#1a1d27] text-amber-500"
```

For Tailwind classes that cannot take variables, use inline styles.

Theme state with localStorage:
```jsx
const [playerTheme, setPlayerTheme] = useState(() => {
  try { return localStorage.getItem('player-theme') || 'default'; }
  catch { return 'default'; }
});
const themeVars = PLAYER_THEMES[playerTheme] || PLAYER_THEMES.default;

// Wrapper:
<div style={{ ...themeVars }} className="flex w-full ...">
```

---

## PAGE LAYOUT — 3-Column Dark Edition

```
┌──────────────────────────────────────────────────────────────┐
│  NAV BAR                                                      │
├────────────┬──────────────────────────────┬──────────────────┤
│  LEFT      │  CENTER                      │  RIGHT           │
│  PROFILE & │  FEED & CONTENT              │  SOCIAL &        │
│  STATS     │                              │  TEAM            │
│  240px     │  flex-1                      │  300px           │
└────────────┴──────────────────────────────┴──────────────────┘
```

Edge-to-edge, dark background, columns touch nav bar.

```jsx
<div style={{ ...themeVars }} className="flex w-full min-h-[calc(100vh-4rem)]">
  <aside className="w-[240px] shrink-0 overflow-y-auto h-[calc(100vh-4rem)] sticky top-16"
    style={{ background: 'var(--player-card)', borderRight: '1px solid var(--player-border)' }}>
  </aside>
  <main className="flex-1 overflow-y-auto p-6 space-y-5"
    style={{ background: 'var(--player-bg)' }}>
  </main>
  <aside className="w-[300px] shrink-0 overflow-y-auto h-[calc(100vh-4rem)] sticky top-16"
    style={{ background: 'var(--player-card)', borderLeft: '1px solid var(--player-border)' }}>
  </aside>
</div>
```

---

## ARCHITECTURE

Create: `src/components/player/`
- `PlayerProfileSidebar.jsx`
- `PlayerCenterFeed.jsx`
- `PlayerSocialPanel.jsx`

Thin shell PlayerDashboard.jsx (~150-200 lines max).
ALL hooks at top before any returns.

---

## LEFT SIDEBAR (240px) — Player Identity & Stats

### 1. Player Profile Hero (EXISTING — restyle)
- Photo: ~140px, rounded-xl, accent-colored border glow
  `box-shadow: 0 0 20px var(--player-accent-glow)`
- Level badge top-left of photo (keep current gold circle)
- Name: text-xl font-black, var(--player-text)
- Team name pill: var(--player-accent) background
- Position + Jersey #: var(--player-text-secondary)

### 2. Level / XP Bar (EXISTING — restyle)
- Level number: large, var(--player-accent) color, font-black
- XP bar fill: gradient using var(--player-accent), shimmer animation
- Progress text: "750 XP to Level 2" in var(--player-text-muted)
- Games/Trophies/Points counters below (keep existing 3-stat row)

### 3. Streak Counter (NEW)
- 🔥 + streak count + "Day Streak"
- var(--player-accent) colored, prominent when active
- Dimmed "Start a streak!" when no streak

### 4. Season Stats Preview (EXISTING — compact version)
Currently full-width bars. Move to sidebar as compact list:
- Top 4 stats: Kills, Aces, Digs, Assists
- Each row: colored icon + name + number + rank badge (#4)
- Small accent-colored dot instead of full bar
- "View All Stats →" link
- Hit%/Serve%/Games row → move to stats detail page or keep as small row

### 5. Quick Links (EXISTING — restyle as 2x2 dark grid)
```
[ 👥 Team Hub  ] [ 🏆 Leaderboards ]
[ 🎖️ Trophies ] [ 📊 Standings    ]
```
- Dark cards, icon + label, hover glow var(--player-accent-glow)

---

## CENTER COLUMN (flex-1) — The Feed

### Row 1: Motivational Welcome (NEW)
Context-driven rotating messages:
- "You're on fire, Emma! 🔥 12-day streak"
- "Level 1 — 750 XP to Level 2! Keep grinding 💪"
- "Game day tomorrow — time to lock in 🏐"

Style: text-2xl font-bold var(--player-text), subtitle var(--player-text-muted)

### Row 2: Stories/Highlights Bar (NEW)
Instagram-style horizontal scroll:
```
[ +Add ] [ 🔥Game ] [ 📸Photo ] [ 🏆Badge ] [ 📢Shout ] ...
```
- 64px circles, rounded-full
- Unseen: gradient ring var(--player-accent)
- Seen: dimmed ring
- Placeholder circles with icons for now
- `// TODO: Wire to highlights data`

### Row 3: Activity Feed (NEW + EXISTING restyled)
Mixed social cards, newest first:

**Shoutout Card (NEW):**
- Accent border left (pink/magenta)
- "💪 Coach Carlos gave you a shoutout! — Coachable"
- Reactions: ❤️ 💬 🔥
- Timestamp

**Game Recap Card (EXISTING Recent Games — restyled):**
- Green border=W, Red=L
- "🏐 vs Banks — W 50-12"
- YOUR STATS: 0K · 0A · 0D · 0B
- "+85 XP earned" green text

**Badge Earned Card (NEW):**
- Gold glow var(--player-accent-glow)
- Large badge icon, name, rarity label
- Reactions: ❤️, Share

**Team Hub Post Card (NEW in feed):**
- Author avatar + name + post content
- Reactions: ❤️ 💬

**Event Card with RSVP (EXISTING Upcoming Events — restyled + NEW RSVP):**
- Background image with dark overlay
- Event details
- RSVP buttons: [Going ✓] [Maybe] [Can't] — interactive inline
- "8/12 going" count

### Row 4: Trophy Case (EXISTING — restyle)
- Horizontal scroll of badge slots
- Earned: full color with accent glow
- Unearned: dim silhouette/outline
- "X/20 Badges Earned" progress
- Collection feel — motivates completion

---

## RIGHT SIDEBAR (300px) — Social & Team

### 1. Teammates (NEW)
- Small avatar circles (36px) + name + online dot
- Green dot = recently active, dim = inactive
- 6-8 teammates shown
- Clickable to teammate profile
- Use last_seen from profiles if available, else mock

### 2. Team Chat Preview (NEW)
- "TEAM CHAT" + "Open Chat →"
- Last 3-4 messages, dark chat bubbles
- Quick reply input + send button at bottom
- Mini messenger feel

### 3. Shoutout Wall Preview (NEW)
- "SHOUTOUTS" + "View All →"
- Last 3 shoutouts received:
  - "💪 Coachable — from Coach Carlos"
  - "⭐ Team Player — from Sarah J."
- Accent-colored icons

### 4. Team Activity (EXISTING — restyle + expand)
Currently: "Won vs Banks — 0K 0A"
**Expand to include:**
- Game results (keep)
- "Sarah earned Kill Leader badge"
- "Maya reached Level 5"
- "Coach posted in Team Hub"
- Mix of game + social activity
- "Enter Team Wall →" button

### 5. Upcoming Events Mini (EXISTING — restyle)
- Next 2 events as compact dark cards
- Background images with overlay
- Accent-colored type badges

---

## NAV BAR — Player Role

```
Home | My Team | Schedule | Achievements | My Stuff ▾
```

My Stuff dropdown: Profile/Stats, Leaderboards, Standings, 
Theme Picker (nav item now, build UI later), Settings

---

## CSS ANIMATIONS (add to src/index.css)

```css
/* XP bar shimmer */
@keyframes playerShimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
/* Feed cards entrance */
@keyframes playerFadeUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
/* Pulse for new items */
@keyframes playerPulse {
  0%, 100% { box-shadow: 0 0 0 0 var(--player-accent-glow, rgba(232,168,56,0.3)); }
  50% { box-shadow: 0 0 12px 2px var(--player-accent-glow, rgba(232,168,56,0.3)); }
}
.player-shimmer {
  background-size: 200% 100%;
  animation: playerShimmer 3s ease-in-out infinite;
}
.player-fade-up {
  animation: playerFadeUp 0.3s ease-out forwards;
}
.player-pulse-new {
  animation: playerPulse 2s ease-in-out infinite;
}
```

---

## CRITICAL RULES

- ALL hooks at top, before any returns
- Child components — no massive single file
- Check DATABASE_SCHEMA.md before every query
- Every query: cancelled flag + try/catch + graceful fallback
- **ALL colors via CSS variables** — no hardcoded hex in components
- Edge-to-edge, columns touch nav bar
- Mock data for new features — page NEVER looks empty
- No re-render loops (learned from parent dashboard)
- Inline style={{ minHeight }} for critical heights
- Keep ALL existing functionality

---

## IMPLEMENTATION ORDER

1. Create child component files + thin shell
2. Set up PLAYER_THEMES and CSS variables on wrapper
3. Add CSS animations to index.css
4. Left sidebar: profile hero, XP, streak, compact stats, quick links
5. Center: welcome, stories bar, activity feed cards, trophy case
6. Right: teammates, chat preview, shoutouts, team activity, events
7. Nav bar for player role
8. Polish: glows, mock data, fade-up on feed cards

---

## VERIFICATION CHECKLIST

- [ ] Dark premium theme via CSS variables (no hardcoded colors)
- [ ] Edge-to-edge, columns touch nav bar
- [ ] ALL existing features preserved (profile, XP, stats, trophies, games, events, activity, quick links)
- [ ] XP bar shimmer animation working
- [ ] Stories bar renders with placeholder circles
- [ ] Activity feed has mixed card types
- [ ] RSVP buttons on event cards
- [ ] Right sidebar: teammates, chat, shoutouts, activity
- [ ] Trophy case shows collection (earned + silhouettes)
- [ ] Streak counter visible
- [ ] Motivational welcome message
- [ ] Feed cards have fade-up animation
- [ ] localStorage saves theme selection
- [ ] Console has no errors or loops
- [ ] Page feels ALIVE and social
