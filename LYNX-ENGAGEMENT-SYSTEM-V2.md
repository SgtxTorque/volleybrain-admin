# LYNX ENGAGEMENT SYSTEM — Master Design Document V2
# Version 2.0 | March 2026 | All Roles, All Sports
# STATUS: SOURCE OF TRUTH — All CC specs reference this document.

---

## 1. CORE PHILOSOPHY

The Lynx engagement system exists to make every participant in a youth sports organization feel recognized, motivated, and progressing. It is not just for star athletes. The bench player who shows up to every practice, completes coach challenges, gives shoutouts, and trains on the journey path can reach Legend level without ever recording a game stat.

### Design Principles
- Effort determines XP value, not category. Harder actions earn more per action.
- No single category dominates. All five badge categories feed XP equally.
- A player CAN reach max level WITHOUT stat badges, purely through effort and engagement.
- The system rewards showing up, being a good teammate, and working hard — not just talent.
- Kids have a razor-sharp sense of fairness. The XP value must match what they feel in their gut.

### Platform Split
- **Mobile app:** Where the engagement system lives and breathes. Daily quests, streaks, badge unlocks, journey path, challenges, celebrations.
- **Web admin:** Browse, track, and reference. Badge library, engagement dashboards, coach challenge management, progress reports, analytics.

---

## 2. BADGE CATEGORIES

All badges belong to one of five categories. Categories determine HOW a badge is earned, not how much XP it is worth. XP is determined by effort level (Section 3).

### 2.1 Stat Badges
- **How earned:** Auto-triggered when a player crosses a stat threshold (kills, aces, digs, blocks, assists, hitting %)
- **Who earns them:** Players only (coaches have win-related equivalents)
- **Division scaling:** YES — thresholds adjust by age group (Section 5)
- **Season behavior:** Badges permanent once earned. Season stat progress resets. Re-earnable with stacking (x2, x3 counter + season tags).
- **Rarity cap:** 10U = max Rare. 12U = max Epic. 14U+ = full chain through Legendary.
- **Dependency:** Requires stat entry (manual post-game). LAST category to come fully online.

### 2.2 Milestone Badges
- **How earned:** Auto-triggered from participation/longevity — games played, practices attended, seasons completed, login streaks, years as member.
- **Who earns them:** All roles.
- **Division scaling:** NO — measures commitment, not performance.
- **Season behavior:** Same as stat badges.
- **Dependency:** Mostly works today.

### 2.3 Coach Badges
- **How earned:** Two paths merged: (1) Coach creates challenge, player completes it, system confirms. (2) Coach directly awards badge (MVP, most improved).
- **Who earns them:** Players from coaches. Coaches earn their own management/development badges.
- **Division scaling:** NO — coach sets appropriate challenges for their age group.
- **Challenge XP tiers:** Coach picks difficulty tier, sees XP value, adjusts within range.

| Tier | Description | XP Range | Example |
|------|-------------|----------|---------|
| Quick Win | 10 min or less | 15-35 XP | 10 wall passes before practice |
| Standard | Real effort, a day | 35-75 XP | 50 serves before Thursday |
| Grind | Multiple days/week | 75-150 XP | 200 reps of passing this week |
| Team Challenge | Whole team together | 50-100 XP/player | Team total 500 digs at tournament |
| Boss Challenge | Season-defining | 150-300 XP | Every player hits .250+ this month |

- **Dependency:** Needs challenge system wired (BUILD PRIORITY #1).

### 2.4 Journey Badges
- **How earned:** Completing skill modules, chapters, boss nodes on Duolingo-style Journey Path.
- **Who earns them:** Players primarily.
- **Division scaling:** NO — self-paced, difficulty adjusts by skill level.
- **Season behavior:** Journey progress does NOT reset between seasons. Lifetime progression.
- **Dependency:** Needs content built (BUILD PRIORITY #4).

### 2.5 Community & Discovery Badges
- **How earned:** Auto-triggered from social actions + hidden triggers. Shoutouts, team quests, team wall posts, plus Easter eggs (Night Owl, Dark Mode Gang).
- **Who earns them:** All roles.
- **Division scaling:** NO.
- **Dependency:** Mostly works today (BUILD PRIORITY #2).

---

## 3. XP ECONOMY

XP is the universal progression currency. Amount is determined by EFFORT LEVEL, not category.

### 3.1 Effort Tiers

| Effort Tier | XP Range | Description | Examples |
|-------------|----------|-------------|----------|
| Passive | 5-15 XP | Low effort, app engagement | Log in, check stats, toggle dark mode |
| Social | 10-25 XP | Community participation | Give shoutout, RSVP, react to post |
| Effort | 25-100 XP | Real work and commitment | Complete challenge, attend practice, journey module |
| Performance | 50-200 XP | Peak effort + results | Stat threshold, chapter boss node, win streak |
| Rare/Elite | 200-500 XP | Exceptional achievements | Season MVP, perfect attendance, full journey completion |

### 3.2 XP Action Table (Players)

| Action | XP | Category | Effort Tier | Notes |
|--------|-----|----------|-------------|-------|
| Log in (daily) | 5 | Community | Passive | Once per day max |
| Check stats/leaderboard | 5 | Community | Passive | Once per day max |
| Toggle dark mode (first) | 10 | Community | Passive | One-time only |
| Give a shoutout | 10 | Community | Social | Max 5/day (50 XP cap) |
| Receive a shoutout | 15 | Community | Social | No cap |
| RSVP to event | 10 | Community | Social | Per event |
| React to team wall post | 5 | Community | Social | Max 10/day |
| Post on team wall | 15 | Community | Social | Max 3/day |
| Complete daily quest | 20 | Journey | Social | 3 available/day |
| Complete weekly quest | 50 | Journey | Effort | Resets Monday |
| Attend practice | 30 | Milestone | Effort | Per practice |
| Attend game | 40 | Milestone | Effort | Per game |
| Complete Quick Win challenge | 25 | Coach | Effort | Coach sets 15-35 range |
| Complete Standard challenge | 50 | Coach | Effort | Coach sets 35-75 range |
| Complete Grind challenge | 100 | Coach | Effort | Coach sets 75-150 range |
| Complete Team challenge | 75 | Coach | Effort | Coach sets 50-100 range |
| Complete Boss challenge | 200 | Coach | Performance | Coach sets 150-300 range |
| Complete journey skill module | 40 | Journey | Effort | Self-paced |
| Complete journey chapter | 100 | Journey | Performance | Includes boss node |
| Beat a boss node | 75 | Journey | Performance | Gates next chapter |
| Earn Common badge | 25 | Any | Varies | Bonus on top of action XP |
| Earn Uncommon badge | 50 | Any | Varies | Bonus on top of action XP |
| Earn Rare badge | 100 | Any | Varies | Bonus on top of action XP |
| Earn Epic badge | 200 | Any | Varies | Bonus on top of action XP |
| Earn Legendary badge | 500 | Any | Varies | Bonus on top of action XP |
| Season MVP (coach-awarded) | 500 | Coach | Rare/Elite | Once per season |
| Perfect attendance | 200 | Milestone | Rare/Elite | Once per season |

### 3.3 Level Thresholds (Lifetime Level 1-30)

Exponential curve — fast early, slow later. Tier names give social identity.

| Level | XP Required | Cumulative | Tier | Unlocks |
|-------|-------------|------------|------|---------|
| 1 | 0 | 0 | Rookie | Basic app access |
| 2 | 100 | 100 | Rookie | Daily quests visible |
| 3 | 150 | 250 | Rookie | First badge slot |
| 4 | 200 | 450 | Rookie | Shoutout reactions |
| 5 | 250 | 700 | Bronze | Weekly quests, journey path entry |
| 6 | 300 | 1,000 | Bronze | Challenge opt-in |
| 7 | 400 | 1,400 | Bronze | Leaderboard visible |
| 8 | 500 | 1,900 | Bronze | Custom profile options |
| 9 | 600 | 2,500 | Silver | Intermediate skills |
| 10 | 700 | 3,200 | Silver | Team quest creation |
| 11 | 800 | 4,000 | Silver | Rare badges accessible |
| 12 | 900 | 4,900 | Silver | Extended trophy case |
| 13 | 1,100 | 6,000 | Gold | Advanced skills |
| 14 | 1,300 | 7,300 | Gold | Challenge suggestions |
| 15 | 1,500 | 8,800 | Gold | Custom card border |
| 16 | 1,700 | 10,500 | Gold | Gold profile frame |
| 17 | 2,000 | 12,500 | Platinum | Epic badges accessible |
| 18 | 2,300 | 14,800 | Platinum | Platinum effects |
| 19 | 2,700 | 17,500 | Platinum | Full trophy case |
| 20 | 3,000 | 20,500 | Platinum | Legendary accessible |
| 21 | 3,500 | 24,000 | Diamond | Diamond frame |
| 22 | 4,000 | 28,000 | Diamond | Custom card design |
| 23 | 4,500 | 32,500 | Diamond | Diamond leaderboard icon |
| 24 | 5,000 | 37,500 | Diamond | Exclusive cosmetics |
| 25 | 5,500 | 43,000 | Legend | Legend aura |
| 26 | 6,000 | 49,000 | Legend | Mascot variant |
| 27 | 7,000 | 56,000 | Legend | Legend crown |
| 28 | 8,000 | 64,000 | Legend | Legacy badge frame |
| 29 | 9,000 | 73,000 | Legend | Hall of Fame eligible |
| 30 | 10,000 | 83,000 | Legend | Max level — prestige |

~83,000 XP to Level 30. At ~200 XP/week = ~8 seasons (~4 years). At ~100 XP/week = ~16 seasons. Legend should be rare.

---

## 4. PROGRESSION SYSTEM

Three parallel tracks tell a player's complete story.

### 4.1 Lifetime Level (1-30)
- Never resets. Only goes up.
- Tiers: Rookie (1-4), Bronze (5-8), Silver (9-12), Gold (13-16), Platinum (17-20), Diamond (21-24), Legend (25-30).
- Visible on player card, roster, leaderboard, profile.

### 4.2 Season Rank
- Resets each season. Earned through weighted mix of Season XP, badges, activity.
- **Formula:** Season Score = (Season XP × 0.5) + (Badges Earned × 20) + (Activity Score × 0.3)
- Activity Score = attendance %, quest completion rate, challenge participation, login consistency.
- Attendance BOOSTS score but is NOT required.

| Season Rank | Score Required | XP Multiplier | Season Badge |
|-------------|---------------|---------------|--------------|
| Unranked | Start of season | 1.0x | No badge |
| Bronze | 300 points | 1.15x | Bronze season badge |
| Silver | 800 points | 1.3x | Silver season badge |
| Gold | 2,000 points | 1.5x | Gold season badge |
| Diamond | 4,000 points | 1.75x | Diamond season badge |

### 4.3 Prestige Number
- Counter: seasons completed on Lynx.
- Visible on player card alongside lifetime level.
- Visual: star/shield icon. P1 = 1 star. P5 = 5 stars. P10+ = special frame.

### 4.4 Season Badge Cadence Rules
- Badges are PERMANENT once earned.
- Season stat PROGRESS resets each season.
- Badges are RE-EARNABLE with stacking (x2, x3 + season tags).
- Lifetime-cadence badges earned once, never re-earned.

---

## 5. DIVISION SCALING

Only applies to STAT BADGES. Other categories don't need scaling.

### 5.1 Rarity Caps

| Division | Max Rarity | Typical Season | Rationale |
|----------|------------|----------------|-----------|
| 10U and under | Rare | 6-10 games, 15-20 practices | Developmental. Rare = real accomplishment. |
| 12U | Epic | 10-18 games, 20-30 practices | Competitive. Epic = stretch goal. |
| 14U+ | Legendary | 18-40+ games, 25-40 practices | Peak competitive. Full chain. |

### 5.2 Scaling Ratios
- 10U = ~0.25x of 14U thresholds
- 12U = ~0.5x of 14U thresholds
- Ratios should be reviewed per stat type (digs are more common than blocks at all ages)

### 5.3 Example: Kill Chain

| Badge | Rarity | 14U+ | 12U | 10U |
|-------|--------|------|-----|-----|
| First Blood | Common | 1 | 1 | 1 |
| Kill Streak I | Common | 10/season | 7/season | 4/season |
| Kill Streak II | Uncommon | 25/season | 15/season | 8/season |
| Kill Streak III | Rare | 50/season | 25/season | 12/season |
| Terminator | Epic | 100/season | 40/season | N/A |
| Kill Record | Legendary | 200/season | N/A | N/A |

---

## 6. BADGE INVENTORY MAPPING

548 badges (excluding Tier 0 headers) across 6 roles.

### Player (122 badges)
- Offensive (21) → **Stat Badges** — needs division scaling
- Defensive (15) → **Stat Badges** — needs division scaling
- Playmaker (9) → **Stat Badges** — needs division scaling
- Heart (14) → **Milestone Badges**
- Streaks (6) → **Milestone Badges**
- Career (14) → **Milestone Badges**
- Challenges (11) → **Coach Badges**
- Elite (7) → **Coach Badges**
- Community (9) → **Community & Discovery**
- Fun (8) → **Community & Discovery**
- Levels (5) → **Milestone Badges**
- Meta (3) → **Community & Discovery**

### Coach (100 badges)
- Coaching (6) → **Milestone Badges**
- Management (13) → **Milestone Badges**
- Development (17) → **Coach Badges**
- Winning (17) → **Stat Badges (coach equiv)**
- Engagement (16) → **Community & Discovery**
- Communication (4) → **Milestone Badges**
- Career (10) → **Milestone Badges**
- Fun (9) → **Community & Discovery**
- Levels (4) → **Milestone Badges**
- Meta (3) → **Community & Discovery**
- Elite (1) → **Coach Badges**

### Parent (114 badges)
- Onboarding (11) → **Milestone Badges**
- Reliability (20) → **Milestone Badges**
- Volunteer (17) → **Milestone Badges**
- Financial (12) → **Milestone Badges**
- Social (22) → **Community & Discovery**
- Referral (9) → **Community & Discovery**
- Loyalty (6) → **Milestone Badges**
- Fun (6) → **Community & Discovery**
- Levels (4) → **Milestone Badges**
- Meta (6) → **Community & Discovery**
- Elite (1) → **Coach Badges (admin-awarded)**

### Admin (102 badges)
- Setup (10) → **Milestone Badges**
- Growth (22) → **Stat Badges (admin equiv)**
- Operations (24) → **Milestone Badges**
- Financial (15) → **Stat Badges (admin equiv)**
- Communication (11) → **Community & Discovery**
- Career (5) → **Milestone Badges**
- Fun (4) → **Community & Discovery**
- Levels (4) → **Milestone Badges**
- Meta (3) → **Community & Discovery**
- Elite (4) → **Coach Badges (system-awarded)**

### Team Manager (100 badges)
- Management (3) → **Milestone Badges**
- Operations (15) → **Milestone Badges**
- Communication (15) → **Community & Discovery**
- Scheduling (15) → **Milestone Badges**
- Financial (10) → **Milestone Badges**
- Compliance (10) → **Milestone Badges**
- Career (9) → **Milestone Badges**
- Fun (9) → **Community & Discovery**
- Levels (4) → **Milestone Badges**
- Meta (9) → **Community & Discovery**
- Elite (1) → **Coach Badges (admin-awarded)**

### Universal (10 badges)
- Onboarding (2) → **Milestone Badges**
- Engagement (2) → **Milestone Badges**
- Fun (3) → **Community & Discovery**
- Social (1) → **Community & Discovery**
- Loyalty (2) → **Milestone Badges**

---

## 7. BUILD PRIORITY

| # | Category | Dependency | Effort | Impact |
|---|----------|-----------|--------|--------|
| 1 | Coach Badges | Challenge system wiring | Medium (3-5 specs) | Highest — immediate coach engagement |
| 2 | Community & Discovery | Shoutouts built, login exists | Low (1-2 specs) | High — daily social engagement |
| 3 | Milestones | Attendance/game data tracked | Low (1-2 specs) | Medium — recognition for showing up |
| 4 | Journey Badges | Content pipeline needed | High (content + code) | Highest long-term |
| 5 | Stat Badges | Stat entry needed | Medium (2-3 specs) | Medium — performance recognition |

---

## 8. OPEN ITEMS FOR REVIEW

- [ ] XP values per action (Section 3.2) — do specific numbers feel right?
- [ ] Level thresholds (Section 3.3) — is 83K XP for Level 30 the right ceiling?
- [ ] Season rank multipliers (Section 4.2) — are 1.15x-1.75x right?
- [ ] Season rank score formula weights
- [ ] Division scaling ratios per stat type
- [ ] Badge art quality audit (sample the 659 composites)
- [ ] Coach challenge XP ranges — enough flexibility?
- [ ] Journey Path first content modules
- [ ] Prestige visual treatment on player card
- [ ] Web admin engagement dashboard metrics
