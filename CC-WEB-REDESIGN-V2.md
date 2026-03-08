# CC-WEB-REDESIGN-V2.md
## Lynx Web Admin — Desktop Redesign (From Real Mobile Source)

### THE PROBLEM

The web admin needs to look and feel like the Lynx mobile app. The mobile app has been through a complete scroll-driven redesign with a three-tier visual system, BRAND color tokens, modular sub-components, and Plus Jakarta Sans + Bebas Neue typography. The web still looks like an old dashboard with a dark header band slapped on top.

---

## FIRST STEP — CLONE THE MOBILE REPO AS REFERENCE

Before doing ANY visual work, run:

```bash
mkdir -p reference
cd reference/
git clone https://github.com/SgtxTorque/Volleybrain-Mobile3.git mobile-app
cd mobile-app
git checkout feat/next-five-build
cd ../..
```

This gives read access to the ACTUAL current mobile app. All reference paths below are relative to `reference/mobile-app/`.

**KEY FILES TO READ (in order of importance):**

Brand system:
- `reference/mobile-app/theme/colors.ts` — BRAND color tokens
- `reference/mobile-app/theme/fonts.ts` — FONTS tokens (Bebas Neue display, Plus Jakarta Sans body)

Home scroll dashboards (the CURRENT architecture — NOT the old AdminDashboard.tsx):
- `reference/mobile-app/components/AdminHomeScroll.tsx` — admin home (472 lines)
- `reference/mobile-app/components/CoachHomeScroll.tsx` — coach home (739 lines)
- `reference/mobile-app/components/ParentHomeScroll.tsx` — parent home (761 lines)
- `reference/mobile-app/components/PlayerHomeScroll.tsx` — player home (428 lines)

Admin sub-components (8 files in `reference/mobile-app/components/admin-scroll/`):
- WelcomeBriefing.tsx, SmartQueueCard.tsx, TeamHealthTiles.tsx, PaymentSnapshot.tsx
- QuickActionsGrid.tsx, CoachSection.tsx, UpcomingEvents.tsx, ClosingMotivation.tsx

Coach sub-components (11 files in `reference/mobile-app/components/coach-scroll/`):
- GamePlanCard.tsx, TeamHealthCard.tsx, SeasonLeaderboardCard.tsx, PrepChecklist.tsx
- QuickActions.tsx, ActionItems.tsx, ActivityFeed.tsx, EngagementSection.tsx
- ScoutingContext.tsx, SeasonSetupCard.tsx, TeamHubPreviewCard.tsx

Parent sub-components (11 files in `reference/mobile-app/components/parent-scroll/`):
- AthleteCard.tsx, EventHeroCard.tsx, DayStripCalendar.tsx, MetricGrid.tsx
- FlatChatPreview.tsx, TeamHubPreview.tsx, RecentBadges.tsx, SeasonSnapshot.tsx
- AttentionBanner.tsx, SecondaryEvents.tsx, AmbientCelebration.tsx

Player sub-components (10 files in `reference/mobile-app/components/player-scroll/`):
- HeroIdentityCard.tsx, NextUpCard.tsx, LastGameStats.tsx, StreakBanner.tsx
- ActiveChallengeCard.tsx, TheDrop.tsx, ChatPeek.tsx, PhotoStrip.tsx
- QuickPropsRow.tsx, ClosingMascot.tsx

Data hooks:
- `reference/mobile-app/hooks/useAdminHomeData.ts`
- `reference/mobile-app/hooks/useCoachHomeData.ts`
- `reference/mobile-app/hooks/useParentHomeData.ts`
- `reference/mobile-app/hooks/usePlayerHomeData.ts`

**IMPORTANT:** The old files (`AdminDashboard.tsx`, `CoachDashboard.tsx`, `ParentDashboard.tsx`, `PlayerDashboard.tsx`) still exist in the repo but are LEGACY. Do NOT reference them. The current dashboards are the `*HomeScroll.tsx` files with their sub-component folders.

Also available as secondary layout inspiration for desktop-width grids:
- `reference/v0-desktop/components/desktop/d1-admin-command.tsx` through `d5-team-pulse.tsx`

---

## WORKING RULES

1. **The mobile app source is the design source of truth.** Read the actual component files before changing anything.
2. **Do NOT touch `MainApp.jsx` routing or `HorizontalNavBar`.** Navigation is out of scope.
3. **Do NOT break any Supabase queries, auth, role-gating, or functionality.** Visual reskin only.
4. **Commit after each phase.** One phase = one commit. Build check first.
5. **Do NOT add new npm dependencies** unless absolutely necessary.
6. **Preserve all existing data fetching and business logic.** Only change visual presentation.

---

## MOBILE APP DESIGN SYSTEM (CURRENT)

### Brand Colors (from `theme/colors.ts`)
```
BRAND = {
  navyDeep: '#0D1B3E',
  navy: '#10284C',
  skyBlue: '#4BB9EC',
  skyLight: '#6AC4EE',
  gold: '#FFD700',
  goldWarm: '#D9994A',
  white: '#FFFFFF',
  offWhite: '#F6F8FB',         // PAGE BACKGROUND (light dashboards)
  warmGray: '#F0F2F5',         // Search bars, secondary surfaces
  border: '#E8ECF2',           // Card borders

  textPrimary: '#10284C',
  textMuted: 'rgba(16,40,76,0.4)',
  textFaint: 'rgba(16,40,76,0.25)',

  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',

  surfaceDark: '#0A1628',      // Dark screens
  surfaceCard: '#1A2744',      // Dark cards
  attentionBannerBg: '#FFF8E1', // Warning/attention bg
}
```

### Fonts (from `theme/fonts.ts`)
```
Display: Bebas Neue (scores, event names, hero text)
Body/UI: Plus Jakarta Sans (400-800 weights)
```
**Web mapping:** Use Tele-Grotesk (already installed) for body/UI. For display treatments, use Tele-Grotesk Bold/Black uppercase with letter-spacing to match the Bebas Neue energy.

### Visual Patterns

**Page bg:** `#F6F8FB` (offWhite) for admin, coach, parent. Dark for player.

**Cards:** `bg-white`, `border: #E8ECF2`, `borderRadius: 16px`, subtle shadow, `padding: 16px`.

**Section headers:** 10px, uppercase, bold, letter-spacing 1.2px, color `rgba(16,40,76,0.25)`. Optional status pill on the right.

**Search bar:** `bg: #F0F2F5`, `borderRadius: 16px`, `height: 44px`.

**Three-tier visual system:**
- Tier 1: Actionable cards (smart queue, attention items)
- Tier 2: Flat content (team tiles, payments, events)
- Tier 3: Ambient/personality moments (closing motivation, celebrations)

---

## PHASE PLAN

### PHASE 1: Design Token Foundation

**Read:** `reference/mobile-app/theme/colors.ts`, `reference/mobile-app/theme/fonts.ts`

**What to do:**
1. Update `tailwind.config.js` with BRAND colors as custom theme tokens
2. Set default page background to `#F6F8FB`
3. Establish shared card CSS: `bg-white border border-[#E8ECF2] rounded-2xl shadow-sm` (16px radius)
4. Section header style: `text-[10px] font-bold uppercase tracking-wider` with `color: rgba(16,40,76,0.25)`
5. Verify Tele-Grotesk loads for body text

**Commit:** `"Web Redesign Phase 1: BRAND token foundation from mobile source"`

---

### PHASE 2: Admin Dashboard

**Read:** `reference/mobile-app/components/AdminHomeScroll.tsx` + ALL 8 files in `reference/mobile-app/components/admin-scroll/`

**Rebuild the admin dashboard center content to match the AdminHomeScroll flow:**

1. **Welcome Briefing** — large greeting with admin name, org name, player/team counts, urgency counter (from WelcomeBriefing.tsx)
2. **Search Bar** — rounded, warmGray bg, 16px radius (from AdminHomeScroll.tsx styles)
3. **Smart Queue** — priority action cards for pending items (from SmartQueueCard.tsx). Wire to existing web alert/attention data.
4. **Team Health Tiles** — team cards in a multi-column grid (from TeamHealthTiles.tsx). Web uses CSS grid instead of horizontal scroll.
5. **Payment Snapshot** — collected/expected/overdue with progress bar (from PaymentSnapshot.tsx)
6. **Quick Actions Grid** — icon + label action buttons (from QuickActionsGrid.tsx)
7. **Coach Section** — coach list cards (from CoachSection.tsx)
8. **Upcoming Events** — event cards with date/time/location (from UpcomingEvents.tsx)
9. **Closing Motivation** — personality moment (from ClosingMotivation.tsx)

Use existing web Supabase data. Only change the visual layout and styling.

**Commit:** `"Web Redesign Phase 2: Admin Dashboard — mobile scroll parity"`

---

### PHASE 3: Coach Dashboard

**Read:** `reference/mobile-app/components/CoachHomeScroll.tsx` + ALL 11 files in `reference/mobile-app/components/coach-scroll/`

**Translate to web:**
1. Game Plan Card with next match, countdown, venue (GamePlanCard.tsx)
2. Team Health Card with roster/attendance status (TeamHealthCard.tsx)
3. Season Leaderboard with top performers + stat bars (SeasonLeaderboardCard.tsx)
4. Prep Checklist for game prep items (PrepChecklist.tsx)
5. Quick Actions for coach-specific actions (QuickActions.tsx)
6. Action Items / Activity Feed (ActionItems.tsx, ActivityFeed.tsx)
7. Team Hub Preview Card (TeamHubPreviewCard.tsx)
8. Engagement + Scouting sections (EngagementSection.tsx, ScoutingContext.tsx)
9. Season Setup Card (SeasonSetupCard.tsx)

**Commit:** `"Web Redesign Phase 3: Coach Dashboard — mobile scroll parity"`

---

### PHASE 4: Parent Dashboard

**Read:** `reference/mobile-app/components/ParentHomeScroll.tsx` + ALL 11 files in `reference/mobile-app/components/parent-scroll/`

**Translate to web:**
1. Athlete Card — big child hero card (AthleteCard.tsx)
2. Event Hero Card with next event + countdown (EventHeroCard.tsx)
3. Day Strip Calendar (DayStripCalendar.tsx)
4. Metric Grid — stat tiles (MetricGrid.tsx)
5. Chat Preview (FlatChatPreview.tsx)
6. Team Hub Preview (TeamHubPreview.tsx)
7. Recent Badges (RecentBadges.tsx)
8. Season Snapshot (SeasonSnapshot.tsx)
9. Attention Banner for overdue items (AttentionBanner.tsx)

**Commit:** `"Web Redesign Phase 4: Parent Dashboard — mobile scroll parity"`

---

### PHASE 5: Player Dashboard

**Read:** `reference/mobile-app/components/PlayerHomeScroll.tsx` + ALL 10 files in `reference/mobile-app/components/player-scroll/`

**DARK THEMED — uses `BRAND.surfaceDark` and `BRAND.surfaceCard`:**
1. Hero Identity Card — avatar, jersey, position, overall (HeroIdentityCard.tsx)
2. Streak Banner (StreakBanner.tsx)
3. Next Up Card (NextUpCard.tsx)
4. Last Game Stats (LastGameStats.tsx)
5. Active Challenge Card (ActiveChallengeCard.tsx)
6. The Drop — achievements/unlocks (TheDrop.tsx)
7. Chat Peek (ChatPeek.tsx)
8. Photo Strip (PhotoStrip.tsx)
9. Quick Props Row (QuickPropsRow.tsx)
10. Closing Mascot (ClosingMascot.tsx)

**Commit:** `"Web Redesign Phase 5: Player Dashboard — dark theme"`

---

### PHASE 6: Polish

1. Visual consistency audit across all 4 dashboards
2. Card radius (16px), shadows, borders uniform
3. Section header style consistent
4. Page bg correct per role (#F6F8FB light, dark for player)
5. All existing functionality still works

**Commit:** `"Web Redesign Phase 6: Polish and consistency"`

---

## WHAT NOT TO CHANGE

- `MainApp.jsx` routing
- `HorizontalNavBar` navigation
- Any Supabase queries or hooks
- Auth flows or role-gating
- Modal components
- Public pages
- Any API calls
