# CC-WEB-ENGAGEMENT-ALIGN-01-INVESTIGATE
# Lynx Web Admin — Investigation: XP Level Curve Alignment
# STATUS: INVESTIGATION ONLY — DO NOT CHANGE ANY CODE
# Reference: LYNX-ENGAGEMENT-SYSTEM-V2.md (Section 3.3)
# Reference: LYNX-ENGAGEMENT-GAP-CLOSURE-PLAN.md (Phase 0)
# Reference: INVESTIGATION-ALIGN-01.md (mobile investigation — completed)

---

## STANDING RULES

1. **Read LYNX-ENGAGEMENT-SYSTEM-V2.md in the repo root** (if present) or understand the V2 spec:
   - 30 levels, 83,000 max XP, 7 tiers (Rookie/Bronze/Silver/Gold/Platinum/Diamond/Legend)
   - getLevelFromXP returns: `{ level, currentXp, nextLevelXp, progress, tier, xpToNext }`
   - See the mobile investigation report (INVESTIGATION-ALIGN-01.md) for context on the dual-system problem
2. **THIS IS AN INVESTIGATION. DO NOT MODIFY ANY FILES.**
3. **DO NOT create any new files except the report.**
4. **Write findings to:** `INVESTIGATION-WEB-ALIGN-01.md` in repo root
5. **Commit with message:** `[investigation] WEB-ALIGN-01: XP level curve audit for web admin`

---

## CONTEXT

The Lynx web admin (React/Vite, JSX) shares the same Supabase backend as the mobile app. The mobile app is being migrated from a 20-level XP curve to a V2 30-level curve (83K XP, 7 tiers). The web admin has its own copy of `engagement-constants.js` that must stay in sync, plus its own copies of `achievement-engine.js`, `challenge-service.js`, `shoutout-service.js`, and `engagement-events.js`.

The web admin is primarily a "browse, track, and reference" platform for the engagement system — coaches and admins view badge libraries, engagement dashboards, player progress, and leaderboards. It may also WRITE XP (e.g., shoutouts, challenge completions from the web). We need to know exactly what the web reads and writes.

---

## INVESTIGATION TASKS

### Task 1: Audit `src/lib/engagement-constants.js`

Read the ENTIRE file. Report:
1. The exact `XP_LEVELS` array — all entries and their shape
2. `MAX_LEVEL` value
3. `LEVEL_TIERS` array — all entries
4. `XP_BY_SOURCE` — all keys and values
5. `XP_BY_RARITY` — all keys and values
6. `RARITY_CONFIG` — all keys and their shape
7. `getLevelFromXP()` — exact implementation and return shape
8. `getLevelTier()` — exact implementation
9. `checkLevelUp()` — exact implementation
10. `ACHIEVEMENT_CATEGORIES` — all entries
11. Every other export (DEFAULT_SHOUTOUT_CATEGORIES, STAT_OPTIONS, etc.)
12. Any differences from the mobile version (`lib/engagement-constants.ts` in Volleybrain-Mobile3)

### Task 2: Audit `src/lib/achievement-engine.js`

Read the ENTIRE file. Report:
1. All functions exported
2. Every call to `getLevelFromXP` or any level calculation function — line number, context, fields used
3. Every `supabase.from('profiles').update(...)` call — exact columns written
4. Every `supabase.from('achievements')` query — what columns are read?
5. Every `supabase.from('player_achievements')` query — what columns are read/written?
6. Is there a `calculateLevel` function or import from anywhere?
7. Does this file import from `engagement-constants.js`? What does it import?

### Task 3: Audit `src/lib/challenge-service.js`

Read the ENTIRE file. Report:
1. All functions exported
2. Every XP-related operation (awards, lookups, calculations)
3. Every `supabase.from('profiles').update(...)` — columns written
4. Every reference to `XP_BY_SOURCE` — which keys accessed
5. Does this file write XP to profiles? Or is it read-only on the web?
6. Imports from engagement-constants.js

### Task 4: Audit `src/lib/shoutout-service.js`

Read the ENTIRE file. Report:
1. All functions exported
2. Every XP-related operation
3. Every profile update — columns written
4. References to XP_BY_SOURCE
5. Does this file write XP?

### Task 5: Audit ALL pages and components that display engagement data

For each file in this list, report what engagement data it reads and how:

**Achievement/Badge pages:**
- `src/pages/achievements/AchievementsCatalogPage.jsx`
- `src/pages/achievements/AchievementCard.jsx`
- `src/pages/achievements/AchievementDetailModal.jsx`
- `src/components/BadgeImage.jsx`
- `src/components/v2/player/PlayerBadgesTab.jsx`
- `src/components/v2/parent/BadgeShowcase.jsx`

**Engagement/Challenge pages:**
- `src/components/engagement/CreateChallengeModal.jsx`
- `src/components/engagement/GiveShoutoutModal.jsx`
- `src/components/v2/player/PlayerChallengesTab.jsx`
- `src/components/v2/coach/CoachEngagementTab.jsx`
- `src/components/v2/player/ShoutoutFeed.jsx`
- `src/components/v2/player/LeaderboardCard.jsx`
- `src/components/v2/coach/ShoutoutCard.jsx`
- `src/components/shared/GiveShoutoutCard.jsx`

**Leaderboard:**
- `src/pages/leaderboards/SeasonLeaderboardsPage.jsx`

**Dashboard pages that show level/tier/XP:**
- `src/pages/roles/PlayerDashboard.jsx`
- `src/pages/roles/CoachDashboard.jsx`
- `src/pages/roles/ParentDashboard.jsx`
- `src/pages/roles/TeamManagerDashboard.jsx`
- `src/pages/dashboard/DashboardPage.jsx`
- `src/components/v2/HeroCard.jsx`
- `src/components/v2/MilestoneCard.jsx`

**Player-related:**
- `src/components/players/PlayerCardExpanded.jsx`
- `src/components/players/PlayerComponents.jsx`
- `src/pages/parent/ParentPlayerHero.jsx`
- `src/pages/parent/PlayerProfilePage.jsx`

**Journey:**
- `src/contexts/JourneyContext.jsx`

For each file, report:
1. Does it import from `engagement-constants.js`? What functions/constants?
2. Does it read `profiles.player_level`, `profiles.tier`, or `profiles.total_xp` from Supabase?
3. Does it call `getLevelFromXP()` or `getLevelTier()`?
4. Does it display tier names, tier colors, or XP bars?
5. Are there any hardcoded level values (max 20, tier names like "Diamond", specific XP numbers)?

### Task 6: Audit `src/lib/engagement-events.js`

Read the ENTIRE file. Report what it does and whether it references level/tier/XP constants.

### Task 7: Search for hardcoded engagement values

Search the ENTIRE `src/` directory for:
1. Hardcoded `20` that could be MAX_LEVEL
2. Hardcoded `33000` that could be max XP
3. Hardcoded tier names: `'Bronze'`, `'Silver'`, `'Gold'`, `'Diamond'` in string comparisons
4. Any `% 1000` or flat XP-per-level assumptions
5. Any file that reads `profiles.tier` from Supabase and compares it to a string

### Task 8: Check for web-specific engagement features

Does the web admin have any engagement features that DON'T exist on mobile? For example:
1. Engagement analytics dashboards
2. Badge management (admin creates/edits badges)
3. Challenge management from web
4. Leaderboard configuration
5. XP audit/history views
6. Any admin tools for managing the engagement system

### Task 9: Risk Assessment

Based on findings:
1. **Files at highest risk** if we change the level curve without updating web
2. **Web files that WRITE to profiles** (these need the same unified function)
3. **Web files that only READ** (these need updated constants but don't write XP)
4. **Hardcoded values that would break**
5. **Differences between web and mobile engagement-constants** that already exist today
6. **Can the web update be done independently from mobile, or do they need to deploy together?**

---

## REPORT FORMAT

Write to `INVESTIGATION-WEB-ALIGN-01.md`:

```markdown
# INVESTIGATION REPORT: WEB-ALIGN-01 — XP Level Curve Alignment (Web Admin)
# Generated by CC on [date]

## Summary
[2-3 sentence overview]

## Task 1: engagement-constants.js Audit
[findings]

## Task 2: achievement-engine.js Audit
[findings]

## Task 3: challenge-service.js Audit
[findings]

## Task 4: shoutout-service.js Audit
[findings]

## Task 5: Page/Component Engagement Data Usage
[findings per file]

## Task 6: engagement-events.js Audit
[findings]

## Task 7: Hardcoded Values
[findings]

## Task 8: Web-Specific Features
[findings]

## Task 9: Risk Assessment
[findings]

## Recommended Execution Approach
[Based on findings: what changes are needed for web, and can they run in parallel with mobile?]
```

**Commit:** `[investigation] WEB-ALIGN-01: XP level curve audit for web admin`
