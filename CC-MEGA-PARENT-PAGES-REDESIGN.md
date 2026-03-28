# CC-MEGA-PARENT-PAGES-REDESIGN.md
# Mega Spec: Parent-Facing Pages Visual Redesign

## READ FIRST
1. `CC-SPEC-GUARDRAILS.md`
2. `CLAUDE.md`
3. `src/styles/v2-tokens.css`
4. `LYNX-UX-PHILOSOPHY.md` (especially the Parent Home sections)

## SCOPE
Visual redesign of all parent-facing pages. These are what parents see when they log in — their primary experience of Lynx. The design must feel warm, clear, and action-oriented. Parents aren't managing an org — they're checking on their kid, paying fees, signing waivers, and staying in the loop. Every page should answer: "What do I need to do right now?"

## GLOBAL DESIGN DIRECTION FOR PARENT PAGES

Parents are the most important user to get right. They're on their phone at the gym, checking between sets. They need:
- **Clarity over density.** Fewer elements, bigger touch targets, obvious next actions
- **Kid-centric.** Everything organized around their child(ren), not around admin concepts
- **Warm and engaging.** This isn't a spreadsheet — it's their kid's sports journey. Use the gamification elements (badges, XP, achievements) to make it feel rewarding.
- **Status indicators everywhere.** Green = done, amber = needs attention, red = overdue. Parents should never have to read a paragraph to know their status.
- **V2 tokens** but with a warmer tone. The parent experience can lean slightly more into sky blue and green accents rather than heavy navy.
- **Mobile-first thinking** even on web — generous padding, tap-friendly elements.

## ELEMENT PRESERVATION CONTRACT (applies to ALL phases)

All payment flows (Stripe checkout, manual payment methods), waiver signing, registration submission, child management, message reading, referral sharing, profile editing, and linked player management must survive. Every form field, modal, and API call stays intact.

---

## PHASE 1: Parent Player Card Page (the showpiece)
**File:** `src/pages/parent/ParentPlayerCardPage.jsx` (443 lines) + `ParentPlayerHero.jsx` (161 lines) + `ParentPlayerTabs.jsx` (380 lines)

### Current State:
Multi-sport player card with OVR rating, per-game stats, trends, badges, coach feedback. 5 tabs: Overview, Stats, Development, Badges, Games.

### Redesign:

**A. Player hero — premium sports card treatment:**
The hero section should feel like a digital trading card:
- Navy gradient background with subtle radial glow
- Player photo (large, cropped portrait) on the left
- Season/team badge pill at top ("SPRING 2026 BLACK HORNETS ELITE")
- Player name: BIG bold uppercase + last name even bigger (like a jersey back)
- Position + jersey number
- OVR rating in a prominent circle (color-coded: green 80+, amber 50-80, red <50)
- Per-game stat bar below: KILLS/G | DIGS/G | ACES/G | BLOCKS/G | ASSISTS/G — each with value, label, and subtle divider between

**B. Tab bar:** V2 pill tabs for Overview / Stats / Development / Badges / Games.

**C. Overview tab:**
- Power levels radar chart in a V2 card
- Skill bars (Serve, Pass, Attack, Block, Dig, Set) — sky blue bars on slate background, score number on right
- Recent Games section
- Badges section with earned badges in a mini grid
- Season Progress card

**D. Badges tab — collectible feel:**
- Earned badges: full color with celebration glow
- In-progress: partially filled with progress bar below
- Locked: grayed out with lock overlay
- Click a badge → existing AchievementDetailModal

**E. All stat data loading and tab switching logic stays untouched.**

### Commit:
```bash
git add src/pages/parent/ParentPlayerCardPage.jsx src/pages/parent/ParentPlayerHero.jsx src/pages/parent/ParentPlayerTabs.jsx
git commit -m "Phase 1: Player Card — premium trading card hero, V2 tabs, collectible badges"
```

---

## PHASE 2: Parent Payments Page
**File:** `src/pages/parent/ParentPaymentsPage.jsx` (554 lines)

### Current State:
Stripe checkout, manual payment (Venmo/Zelle/CashApp), processing fees, payment history.

### Redesign:

**A. Payment summary hero card:**
Navy gradient card at the top showing:
- Total Balance Due (big bold number, red if overdue, green if $0)
- Due date (if applicable)
- Payment progress bar (collected/total)
- Status badge: "ALL PAID" (green) or "BALANCE DUE" (amber/red)

**B. Unpaid fees section:**
Each unpaid fee as a selectable card:
- Fee name + amount
- Due date
- Player name + team
- Checkbox to select for payment
- Selected state: sky-blue border

**C. Payment method section** (appears when fees selected):
- Stripe card: "Pay with Card" — branded Stripe button with card icon
- Manual methods: Venmo/Zelle/CashApp cards with handle info, "I Paid Via [Method]" confirmation button
- Processing fee disclosure (if org passes fees to parents)

**D. Payment history:**
Collapsible section below:
- Paid items with green checkmark, amount, date, method
- Clean timeline format

**E. Keep ALL Stripe checkout flow, manual payment confirmation, and return URL handling intact.**

### Commit:
```bash
git add src/pages/parent/ParentPaymentsPage.jsx
git commit -m "Phase 2: Parent Payments — balance hero card, selectable fees, method cards"
```

---

## PHASE 3: Parent Messages Page
**File:** `src/pages/parent/ParentMessagesPage.jsx` (382 lines) + `MessageCards.jsx` (135 lines)

### Current State:
3 tabs (Announcements, Team Updates, Action Required), team filter, read tracking, 3 card types.

### Redesign:

**A. V2 tab bar** for Announcements / Team Updates / Action Required.
- "Action Required" tab gets a red count badge when items exist.

**B. Message cards — premium notification feed:**
Each message as a V2 card:
- Priority indicator: left border color (red = urgent, amber = action needed, sky = info)
- Sender name + role badge + timestamp
- Message title (bold) + preview text
- Read/unread indicator (dot)
- Action button if action required (RSVP, Sign Waiver, Make Payment)
- Team filter pills above the feed

**C. Empty state:** Friendly mascot illustration with "You're all caught up!" message.

### Commit:
```bash
git add src/pages/parent/ParentMessagesPage.jsx src/pages/parent/MessageCards.jsx
git commit -m "Phase 3: Parent Messages — priority-coded notification feed, action buttons"
```

---

## PHASE 4: My Stuff Page
**File:** `src/pages/parent/MyStuffPage.jsx` (665 lines)

### Current State:
5 tabs: Profile (avatar upload), Payments, Waivers, Settings (notifications), Linked Players.

### Redesign:

**A. V2 tab bar** for Profile / Payments / Waivers / Settings / Linked Players.

**B. Profile tab:**
- Avatar upload area: large circular upload zone with camera icon overlay
- Form fields: V2 input styling throughout
- Emergency contact section in a separate V2 card

**C. Payments tab:**
- Payment history cards with status badges
- Balance summary at top

**D. Waivers tab:**
- Waiver cards: signed (green check + date) / unsigned (amber "Sign Now" button)
- Clear visual distinction between complete and pending

**E. Settings tab:**
- Notification preference toggles (V2 switch toggles, not checkboxes)
- Clean grouped settings cards

**F. Linked Players tab:**
- Player cards showing each linked child with avatar, name, team, season
- "Link Another Player" button

### Commit:
```bash
git add src/pages/parent/MyStuffPage.jsx
git commit -m "Phase 4: My Stuff — V2 tabs, premium profile, waiver cards, notification toggles"
```

---

## PHASE 5: Invite Friends Page
**File:** `src/pages/parent/InviteFriendsPage.jsx` (304 lines)

### Current State:
Referral link copy, social share (5 platforms), tier tracking (Bronze/Silver/Gold), progress bars.

### Redesign:

**A. Referral hero card:**
Navy gradient card with:
- Current tier badge (Bronze/Silver/Gold) with icon
- Invite count + progress to next tier
- Progress bar (sky blue fill)
- "Share Your Link" prominent CTA

**B. Referral link section:**
- Link display with one-click copy button (V2 styled)
- Copy confirmation animation

**C. Share buttons:**
- Social platform cards in a grid: Facebook, Twitter/X, WhatsApp, Email, SMS
- Each with platform icon and color
- V2 card styling with hover effect

**D. Tier progression:**
- Visual tier ladder: Bronze → Silver → Gold
- Each tier shows reward description
- Current tier highlighted, next tier shows requirements
- Gamification feel — make parents WANT to share

### Commit:
```bash
git add src/pages/parent/InviteFriendsPage.jsx
git commit -m "Phase 5: Invite Friends — referral hero, share cards, tier progression"
```

---

## PHASE 6: Player Profile Page
**File:** `src/pages/parent/PlayerProfilePage.jsx` (353 lines) + profile tab files (PlayerProfileInfoTab, PlayerProfileMedicalTab, PlayerProfileHistoryTab, PlayerProfileUniformTab, PlayerProfileWaivers, PlayerProfileUI)

### Current State:
Registration/uniform/medical/waivers/history tabs, edit/save all sections.

### Redesign:

**A. Player header:**
Player avatar + name + team + age/grade. Status badge showing registration status.

**B. V2 tab bar** for the profile sections.

**C. Each tab:**
- Form fields: V2 input styling
- Section cards grouping related fields
- Read-only fields shown as clean text, edit mode toggles to inputs
- Save/Cancel buttons V2 styled

**D. Waivers tab:**
- Each waiver as a card with signed/unsigned status
- Signature area for unsigned waivers
- Timestamp for signed waivers

### Commit:
```bash
git add src/pages/parent/PlayerProfilePage.jsx src/pages/parent/PlayerProfileInfoTab.jsx src/pages/parent/PlayerProfileMedicalTab.jsx src/pages/parent/PlayerProfileHistoryTab.jsx src/pages/parent/PlayerProfileUniformTab.jsx src/pages/parent/PlayerProfileWaivers.jsx src/pages/parent/PlayerProfileUI.jsx
git commit -m "Phase 6: Player Profile — V2 tabs, styled forms, waiver cards"
```

---

## PHASE 7: Parent Registration Hub + Claim Account
**Files:** `src/pages/parent/ParentRegistrationHub.jsx` (624 lines) + `src/pages/parent/ClaimAccountPage.jsx` (214 lines)

### Current State:
Registration hub: register children for seasons, prefill from existing players. Claim account: link invited account.

### Redesign:

**A. Registration Hub:**
- Season cards showing open seasons with sport icon, dates, fees
- "Register Now" CTA per season
- Already registered children shown with green checkmark
- Multi-child flow with V2 form styling
- Fee summary card before submission

**B. Claim Account:**
- Clean centered card layout
- Welcome message with org branding
- Verification form with V2 inputs
- Success confirmation with mascot

### Commit:
```bash
git add src/pages/parent/ParentRegistrationHub.jsx src/pages/parent/ClaimAccountPage.jsx
git commit -m "Phase 7: Registration Hub + Claim Account — season cards, V2 forms"
```

---

## FINAL PUSH
```bash
git push origin main
```

## VERIFICATION PER PHASE
- [ ] `npm run build` passes
- [ ] Only targeted files in `git diff --name-only`
- [ ] Page renders correctly for parent role
- [ ] All form fields save data
- [ ] All modals/flows work (Stripe checkout, waiver signing, registration submission)
- [ ] Dark mode works
- [ ] V2 font and tokens applied
- [ ] Mobile-responsive layout
- [ ] No console errors

## FINAL REPORT
```
## Parent Pages Mega Redesign Report
- Phases completed: X/7
- Files modified: [list]
- Total lines: +X / -Y
- Build status: PASS/FAIL
```
