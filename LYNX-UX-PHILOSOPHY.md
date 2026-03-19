# LYNX UX PHILOSOPHY — Cross-Platform Experience Guide

**Purpose:** This document defines how the Lynx youth sports platform operates for users — the interaction model, the tiered content system, the emotional architecture, and the critical principle that web and mobile must feel like the same product despite serving different contexts.

---

## THE CORE BELIEF

Lynx is one product with two postures. A parent checking their phone on the bleachers and a coach building a season at their desk should both feel the same emotional throughline: alive, purposeful, never overwhelming, always rewarding. The brand doesn't change between platforms — the depth does.

---

## 1. PROGRESSIVE DISCLOSURE — "Content Earns Its Place"

Nothing appears on screen just because it exists in the database. Every section, card, and element renders only when it's relevant to the user right now.

**How this works in practice:**

- **Conditional sections appear and disappear.** The "You Got Stuff To Do" action button only renders when the parent has outstanding items (unpaid balances, un-RSVPed events, unsigned waivers, unread coach DMs, missing emergency contacts). Zero items = the section doesn't exist. No placeholder. No "All caught up!" message. The next section simply slides up into that space.
- **Balance cards vanish at zero.** If a parent owes nothing, the balance card isn't there — not greyed out, not showing "$0.00," just gone.
- **Multi-child UI only appears for multi-child families.** Child filter pills, horizontal card scrollers, and team-color-coded calendar dots only render when a parent has 2+ children registered. Single-child parents get a cleaner, simpler layout automatically.
- **Chat previews are conditional.** No chat history? No chat preview section. No empty state placeholder.
- **The screen reshapes itself based on state.** A parent who's fully caught up sees a shorter, calmer home screen. A parent with things to do sees urgency surfaced exactly where they need it. The UI is alive — it reflects YOUR reality, not a template.

**This principle applies identically on web and mobile.** The web dashboard's left sidebar, center panel, and right context panel all follow the same conditional rendering logic. Empty sections don't show placeholder cards — they collapse, and surrounding content fills the space.

---

## 2. THE SCROLL-DRIVEN ARCHITECTURE (Mobile)

Mobile is built around a single continuous scroll with elements that transform as you move:

- **Mascot welcome** greets you at the top, then collapses into a sticky header as you scroll down
- **Day-strip calendar** slides into view as the mascot compresses
- **Event hero cards** reveal with atmospheric sky gradients behind them
- **Cards expand progressively** — content unfolds as you scroll deeper
- **Bottom nav auto-hides** on scroll-down for maximum content space, then returns after ~850ms of idle (no scroll activity)
- The Lynx cub mascot has **context-sensitive animation states**: wiggle (attention needed), bounce (celebration), float (idle/calm)

**What this means for web:** The web doesn't replicate the scroll-collapse behavior — that's a mobile-native pattern. But the web DOES maintain the same principle of **progressive depth**. The 3-column layout achieves this spatially instead of vertically: the left sidebar is your status/identity (who you are, what role, quick actions), the center is your active workspace (the dashboard content that changes), and the right panel is contextual detail (upcoming events, player info, previews that shift based on what's selected in the center).

---

## 3. THE TIERED CONTENT SYSTEM

Each role's home experience follows a priority-ordered stack. Sections are arranged by urgency and relevance, not by feature category.

**Parent Home (mobile — vertical scroll):**
1. Event Carousel — next 3 upcoming events as hero cards with inline RSVP chips and countdown timers
2. "You Got Stuff To Do" — conditional action item button with badge count and pulse animation
3. Team Hub Preview — latest post from team wall
4. My Player Trading Card(s) — full-width for 1 child, horizontal scroll for multiple
5. Last Chat Preview — most recent conversation (conditional)
6. Bottom Content — game recap, season progress, parent badges

**Parent Home (web — 3-column spatial layout):**
- Left Sidebar: Org/team branding, payment summary, needs-attention alerts, quick action buttons, parent badge progress
- Center Dashboard: Player hero card carousel (switches context for everything else), team hub preview, chat preview, upcoming events
- Right Panel: Player-specific context — achievements, upcoming events with hero styling, stat highlights — all tied to whichever player is selected in the center hero card

**Admin Mobile Hub — Time-Horizon Thinking:**
- "Right Now" → "Today" → "This Week" → "This Month"
- The admin isn't browsing features — they're triaging urgency. The screen is organized by temporal priority, not by feature bucket.

**The tiered system carries across platforms.** On mobile it's a vertical priority stack. On web it's a spatial priority layout (left = identity/status, center = active work, right = contextual detail). The ORDER of importance is the same — only the arrangement changes.

---

## 4. PLATFORM PHILOSOPHY — Same Product, Different Posture

**Mobile = Always-in-Pocket Companion**
- Primary users: Coach (sideline), Parent (bleachers/home), Player (bedroom/car)
- Posture: Standing, one-handed, glanceable
- Navigation: Bottom tabs + drawer, 44px minimum touch targets
- Optimized for: Real-time execution — game day ops, attendance, score tracking, shoutouts, schedule checks, achievement collection
- Key metaphor: The thing you pull out of your pocket at the gym

**Web = Command Center**
- Primary users: Admin (desk), Coach (planning sessions)
- Posture: Seated, keyboard + mouse, focused work sessions
- Navigation: 3-column layout with sidebar, or full-width data grids
- Optimized for: Heavy operations — roster management, schedule building, season configuration, registration oversight, payment tracking, complex forms, reports, multi-column data grids
- Key metaphor: Mission control — everything visible, nothing requires leaving the screen

**How they feel like one product:**
- Same color system (Navy #10284C, Sky #4BB9EC/#5BCBFA, Gold #FFD700)
- Same typography family feel (Web: Inter Variable self-hosted from `public/fonts/Inter-Variable.ttf`; Mobile: Plus Jakarta Sans + Bebas Neue display)
- Same card design language (glassmorphism, rounded-2xl, consistent shadows)
- Same gradient system (navy → sky at 135°)
- Same conditional rendering logic (content earns its place)
- Same achievement/badge tier visuals (Common gray → Rare blue → Epic purple → Legendary gold pulse)
- Same mascot personality (appears in the same emotional contexts)
- Same voice and copy tone ("Welcome to the Den, Coach" — not "Hello, user")

**How they feel appropriately different:**
- Web uses the full 3-column spatial layout; mobile uses vertical scroll stacks
- Web shows data tables and multi-select operations; mobile shows cards and single-tap actions
- Web has hover states, tooltips, keyboard shortcuts; mobile has swipe gestures, haptic feedback, pull-to-refresh
- Web hero cards overlap dark navy header bands (floating card aesthetic); mobile hero cards are full-bleed with gradient backgrounds
- Web sidebar is persistent navigation; mobile uses auto-hiding bottom tabs

---

## 5. THE XP / POWER BAR VISUAL LANGUAGE

All player stats and skill levels across both platforms are displayed as **power bars styled as XP progress bars** — never plain numbers, never radar/spider charts. This is a hard design rule.

**Color tier system:**
- Excellent: Sky-blue-to-gold gradient
- Good: Solid sky blue
- Average: Teal/green
- Below average: Gray

**Achievement rarity tiers (same on both platforms):**
- Common: Gray
- Rare: Blue — cub is confident, thumbs up
- Epic: Purple — cub in full gear, confetti
- Legendary: Gold with slow 2-second pulse animation — cub radiating light, arms raised

These power bars and tier indicators must look identical whether you're viewing a player profile on your phone or on the web admin. The player's "card" is the same card everywhere.

---

## 6. THE EMOTIONAL LAYER

**The Lynx cub mascot appears in human moments:**
- Onboarding, empty states, achievement unlocks, streak milestones, shoutout notifications, loading screens, error recovery

**The cub never appears in functional moments:**
- Legal documents, billing pages, admin data tables, error logs, payment failure states

**Motion personality:**
- Springy, not mechanical — bounce physics with overshoot → settle
- High vertical energy — the cub bounces, never slides
- Celebratory at key moments — confetti on achievements, shimmer on XP bar fills, glow pulse on Legendary items
- Calm when idle — subtle float animation, breathing scale pulse
- Reduced motion alternatives exist for accessibility

**Voice and copy:**
- Encouraging, never patronizing: "Welcome to the Den, Coach" not "Hello! Let's get started!"
- Action-oriented empty states: "The court is quiet. Add your first practice to get things moving!" not "No data found."
- Celebratory achievements: "Absolute Legend! You just earned the 'Iron Lung' badge" not "Achievement unlocked."

**This emotional layer is platform-agnostic.** The same copy, the same mascot contexts, the same celebration moments happen on web and mobile. A coach unlocking an achievement on web gets the same energy as unlocking it on mobile. The animation timing may differ (web can be subtler, mobile can use haptics), but the emotional beat is identical.

---

## 7. ROLE-BASED EVERYTHING

Six user roles — Admin, Coach, Team Manager, Parent, Player (plus Platform Admin for super-admin access) — each see a fundamentally different experience. Different nav structures, different home screens, different content priorities. The role switcher lets multi-role users toggle instantly without logging out. Team Manager is auto-detected from the `team_staff` table. Player is auto-detected when a profile is linked to a player record.

**This is true on both platforms.** A coach logging into the web sees the coach command center. Switching to parent role completely transforms the layout, sidebar content, and center dashboard. Same on mobile — the bottom tabs, home screen sections, and available features all shift based on active role.

---

## 8. WHITE-LABEL + TEAM IDENTITY

Organizations inject up to 3 team colors via CSS custom properties. Team colors appear on hero cards, player profile banners, roster cards, schedule widgets, achievement badge rings, and nav headers. Team colors NEVER appear on system navigation, error states, global typography, or Lynx core branding.

The Lynx brand and the team/org brand coexist — team identity is prominent in the content layer, Lynx platform identity is subtle in the chrome layer. Both platforms follow the same rules.

---

## SUMMARY: THE FEELING

When someone picks up the Lynx mobile app, they should feel: "This knows what I need right now." When they sit down at the Lynx web portal, they should feel: "This gives me everything I need to run this." Different depths, same intelligence. The app feels like a companion. The web feels like a command center. Both feel like Lynx.
