# CC-WEB-STUB-BUILDOUT.md
## Lynx Web Admin -- Build Out InviteFriends + ParentMessages
### For Claude Code Execution

**Repo:** volleybrain-admin
**Branch:** feat/desktop-dashboard-redesign
**Date:** March 7, 2026

---

## RULES

1. **Read CLAUDE.md** in the project root.
2. **Read each file FULLY before modifying.** Both pages have working logic -- do not break it.
3. **Archive originals** to `src/_archive/stub-buildout/`.
4. **Brand treatment:** Use PageShell, InnerStatRow, and the Lynx design system. Read `src/pages/schedule/SchedulePage.jsx` and `src/pages/teams/TeamsPage.jsx` as your visual reference. Match their card styles, button styles, and dark mode patterns exactly.
5. **Tailwind only.** Use `lynx-*` and `brand-*` tokens. No inline styles. No custom CSS.
6. **Dark mode required.** Use `isDark` ternaries matching the existing page patterns.
7. **Max 500 lines per file.**
8. **No em dashes** in user-facing text.
9. **Commit after each phase.**

---

## PHASE 1: InviteFriendsPage.jsx (85 lines --> full page)

**Current state:** Functional but minimal. Has copy-to-clipboard, social share buttons (Facebook, Twitter, WhatsApp, email, SMS), and a static referral rewards section. Uses old `DashboardContainer` wrapper and `tc.*` theme classes instead of PageShell and Lynx tokens.

**Mobile reference:** `volleybrain-mobile3/app/invite-friends.tsx` (434 lines) -- has native Share sheet, QR code concept, mascot image, and richer copy.

### What to build:

1. **Replace `DashboardContainer` with `PageShell`.**
   ```jsx
   import PageShell from '../../components/pages/PageShell'
   <PageShell title="Invite Friends" subtitle="Share the love -- grow the Lynx family">
   ```

2. **Stat row at top:**
   - Invites Sent (query `account_invites` table for count, or show 0 if table is empty)
   - Friends Joined (count of registrations where `registration_source = 'invite'`, or show "Coming Soon")
   - Your Referral Tier (Bronze/Silver/Gold based on count)

3. **Registration link card (keep existing logic, restyle):**
   - Card: `bg-white rounded-[14px] border border-slate-200` (light) / `bg-lynx-charcoal border-white/[0.06]` (dark)
   - Show org name and logo if available
   - Link input field + Copy button (keep existing `copyLink` function)
   - Add a "QR Code" section -- generate a simple QR code using an inline SVG or a lightweight approach. If too complex, just show the link prominently and skip QR.

4. **Share buttons (keep existing logic, restyle):**
   - Replace the bare emoji/letter buttons with proper branded cards
   - Each share option: icon + platform name + brief description
   - Layout: 2-column grid on desktop, stack on mobile
   - Platforms: Facebook, Twitter/X, WhatsApp, Email, Text/SMS
   - Keep the existing `shareVia()` function and URL templates

5. **Personalized message preview:**
   - Show a preview card of what the recipient will see: "Coach [Name] invited you to join [Org Name]! Register here: [link]"
   - Allow the parent to customize the message text before sharing
   - Store the custom message in local state, use it in the share URLs

6. **Referral rewards section (keep, enhance):**
   - Keep the Bronze/Silver/Gold tier cards
   - Add a progress bar showing current referral count toward next tier
   - Make the rewards feel more concrete: "Bronze: Lynx Badge", "Silver: Badge + Team Shoutout", "Gold: Badge + Free Practice Jersey"

7. **Replace all `tc.*` theme classes** with the Lynx design system equivalents:
   - `tc.text` --> `isDark ? 'text-white' : 'text-slate-900'`
   - `tc.cardBg` --> `isDark ? 'bg-lynx-charcoal' : 'bg-white'`
   - `tc.border` --> `isDark ? 'border-white/[0.06]' : 'border-slate-200'`
   - `tc.textSecondary` --> `isDark ? 'text-slate-400' : 'text-slate-500'`
   - `tc.textMuted` --> `isDark ? 'text-slate-500' : 'text-slate-400'`
   - `tc.hoverBg` --> `isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-100'`

**Commit:** `"Build out InviteFriendsPage -- PageShell, share cards, message preview, referral progress"`

---

## PHASE 2: ParentMessagesPage.jsx (82 lines --> full page)

**Current state:** Functional but thin. Loads team posts from `team_posts` table, shows them in a scrollable card. Has team selector pills. Uses `DashboardContainer` and `tc.*` classes.

**Context:** This page overlaps with BlastsPage (admin blast messages) and the team wall. It should focus on what a PARENT cares about: announcements directed at them, important updates from coaches, and action-required items.

### What to build:

1. **Replace `DashboardContainer` with `PageShell`.**
   ```jsx
   <PageShell title="Messages" subtitle="Announcements and updates from your teams">
   ```

2. **Stat row at top:**
   - Unread Messages (count of unread `messages` / `message_recipients` where `read_at IS NULL` for this user)
   - Teams (count of teams the parent's children are on)
   - Action Required (count of messages with `requires_acknowledgment = true` and not yet acknowledged)

3. **Team filter bar (keep existing team pills, restyle):**
   - Use the same pill/tab pattern from the redesigned pages
   - Add an "All Teams" option as default
   - Team pills: `rounded-xl` with team color dot, active state uses `bg-lynx-sky/20 text-lynx-sky`

4. **Message categories with tabs:**
   - **Announcements** -- blast messages from admin/coaches targeting parents (query `messages` table where `target_audience IN ('all', 'parents')` and join through `message_recipients` for this user)
   - **Team Updates** -- team_posts from coaches (existing query, keep it)
   - **Action Required** -- messages where `requires_acknowledgment = true` and this user hasn't acknowledged

5. **Message cards (restyle from existing):**
   - Card: `rounded-[14px] border` with Lynx colors
   - Show: type badge (Announcement/Schedule Change/Payment Reminder), priority indicator, sender name, date, content
   - Unread indicator: sky-blue left border or dot
   - Action required: amber highlight with "Acknowledge" button
   - Click to expand full message content

6. **Acknowledge functionality:**
   - When parent clicks "Acknowledge" on a required message, update `message_recipients.read_at` to `NOW()`
   - Show success toast
   - Move message from "Action Required" to "Read"

7. **Empty states:**
   - No messages: "All caught up! No new messages from your teams."
   - No teams: "Join a team to receive messages." (keep existing empty state, restyle)

8. **Real-time subscription (if feasible):**
   - Subscribe to `messages` and `team_posts` for real-time updates
   - If too complex, add a refresh button instead

9. **Replace all `tc.*` theme classes** with Lynx equivalents (same mapping as Phase 1).

**Commit:** `"Build out ParentMessagesPage -- PageShell, message categories, acknowledge flow, brand treatment"`

---

## PHASE 3: Verification

1. Log in and switch to parent view.
2. Navigate to Invite Friends page -- verify:
   - Page loads with PageShell layout
   - Copy link works
   - Share buttons open correct URLs
   - Dark mode works
3. Navigate to Messages page -- verify:
   - Page loads with PageShell layout
   - Team pills filter correctly
   - Messages display (even if empty state)
   - Dark mode works
4. Run `npm run build` -- zero errors.

**Commit:** `"Stub buildout verified -- InviteFriends and ParentMessages fully built"`

---

## DONE

Both pages are now full-featured, brand-matched, and consistent with the rest of the web admin.
