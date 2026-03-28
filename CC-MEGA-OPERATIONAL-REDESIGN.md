# CC-MEGA-OPERATIONAL-REDESIGN.md
# Mega Spec: Attendance, Availability, Blasts & Notifications Redesign

## READ FIRST
1. `CC-SPEC-GUARDRAILS.md`
2. `CLAUDE.md`
3. `src/styles/v2-tokens.css`

## SCOPE
Visual redesign of the remaining operational pages: Attendance, Coach Availability, Blasts, and Notifications. These are daily-use admin/coach tools — they need to be fast, scannable, and action-oriented.

## GLOBAL DESIGN DIRECTION

These pages are about **taking action quickly**. The admin checks attendance, sends a blast, manages availability. They should:
- Surface what needs attention FIRST (who hasn't responded, which coaches are unavailable)
- Use color-coded status indicators for at-a-glance scanning
- Support quick inline actions (mark present, send reminder, approve)
- Follow the 2-column pattern where context panels make sense
- Use V2 tokens, navy headers for overview stats, rounded-[14px] cards

## ELEMENT PRESERVATION CONTRACT
All data loading, event selection, RSVP marking, blast sending, notification templating, calendar interactions, and export functions must survive. Restyle and reposition only.

---

## PHASE 1: Attendance Page
**File:** `src/pages/attendance/AttendancePage.jsx` (424 lines)

### Current State:
Event RSVP grid (going/no/maybe/pending), inline mark, volunteer assignment.

### Redesign:

**A. Navy overview header:**
```
Next Event: [event name] · [date] · [time]
RSVP Summary: [14 Going] [3 Maybe] [1 No] [4 Pending]
```
With a mini stacked bar showing the RSVP breakdown visually.

**B. Event selector:** V2 styled dropdown or horizontal event cards for upcoming events. Selected event gets sky-blue highlight.

**C. Attendance grid redesign:**
- Player rows with avatar + name + team
- RSVP status as clickable pill buttons per row: Going (green), Maybe (amber), No (red), Pending (gray)
- Clicking a status pill toggles the RSVP — instant inline action, no modal
- Volunteer role column: dropdown for role assignment (Line Judge, Scorekeeper, etc.)
- "No Response" rows highlighted with amber left border

**D. Bulk actions:** "Mark All Present" button, "Send Reminder to Pending" button.

**E. Team filter** if viewing across teams.

### Commit:
```bash
git add src/pages/attendance/AttendancePage.jsx
git commit -m "Phase 1: Attendance — navy RSVP header, clickable status pills, volunteer roles"
```

---

## PHASE 2: Coach Availability Page
**File:** `src/pages/schedule/CoachAvailabilityPage.jsx` (510 lines)

### Current State:
Calendar availability (available/unavailable/tentative), recurring patterns, conflict detection, admin can view any coach.

### Redesign:

**A. Navy overview header:**
```
Availability Overview: [8 Available] [2 Tentative] [1 Unavailable] this week
Conflicts: [X detected]
```

**B. Coach selector:** Horizontal coach pills/avatars at the top. Selected coach highlighted with navy border.

**C. Calendar grid:**
- Clean week/month view with V2 styling
- Availability cells color-coded: green = available, amber = tentative, red = unavailable, gray = not set
- Click a cell to toggle availability (quick action)
- Conflict indicators: red badge on cells where coach is scheduled but marked unavailable

**D. Recurring patterns section:**
Card showing the coach's recurring availability pattern with day-of-week toggles.

**E. If admin is viewing another coach's availability**, show a notice bar: "Viewing [Coach Name]'s availability — [Switch to Mine]"

### Commit:
```bash
git add src/pages/schedule/CoachAvailabilityPage.jsx
git commit -m "Phase 2: Coach Availability — overview header, coach selector, color-coded calendar"
```

---

## PHASE 3: Blasts (Announcements) Page
**File:** `src/pages/blasts/BlastsPage.jsx` (720 lines)

### Current State:
Announcement broadcast, multi-target (all/team/coaches), read receipt tracking, filter by type/priority.

### Redesign:

**A. 2-column layout:**
- **Left: Blast list** (sent announcements) with search + filters
- **Right: Compose panel OR blast detail** (contextual)

**B. Blast cards in the list:**
- Title (bold) + timestamp + priority badge (Normal/Urgent/Critical with color)
- Target audience pill (All, Team Name, Coaches Only)
- Read receipt bar: "28/42 read" with progress bar
- Click to view full blast in right panel

**C. Right panel — Compose mode:**
When "New Blast" is clicked, the right panel becomes the compose form:
- Title input, body textarea (V2 styled)
- Target selector (multi-select teams/roles)
- Priority selector (pill toggle: Normal / Urgent / Critical)
- Send button (navy primary)

**D. Right panel — Detail mode:**
When a blast is selected from the list:
- Full blast content
- Read receipt breakdown (who read, who hasn't)
- "Resend to Unread" button
- Timestamp and sender info

**E. Stat header:** Total Blasts Sent, Avg Read Rate, Unread This Week.

### Commit:
```bash
git add src/pages/blasts/BlastsPage.jsx
git commit -m "Phase 3: Blasts — 2-column with compose/detail panel, read receipt bars"
```

---

## PHASE 4: Notifications Page
**File:** `src/pages/notifications/NotificationsPage.jsx` (699 lines)

### Current State:
3 tabs (Dashboard/History/Templates), manual send, 10 notification types, status tracking.

### Redesign:

**A. V2 tab bar** for Dashboard / History / Templates (pill style).

**B. Dashboard tab:**
- Notification stats in a navy header: Sent Today, Delivery Rate, Pending Queue
- Recent notifications as a feed of cards with type icon, message preview, timestamp, delivery status badge

**C. History tab:**
- V2 table with: Type icon, Title, Recipients, Sent Date, Delivery Status, Open Rate
- Filter by type, date range
- Search

**D. Templates tab:**
- Template cards: Name (bold) + notification type badge + preview text
- Edit/Duplicate/Delete actions per template
- Toggle active/inactive per template

**E. Manual send section:**
- Type selector (V2 styled)
- Recipient selector
- Message input (V2 styled textarea)
- Send button

### Commit:
```bash
git add src/pages/notifications/NotificationsPage.jsx
git commit -m "Phase 4: Notifications — V2 tabs, stat dashboard, template cards, history table"
```

---

## FINAL PUSH

After ALL 4 phases pass:
```bash
git push origin main
```

## VERIFICATION PER PHASE
- [ ] `npm run build` passes
- [ ] Only targeted files in `git diff --name-only`
- [ ] Page renders correctly
- [ ] All interactive elements preserved (RSVP marking, blast sending, calendar toggling, notification sending)
- [ ] Dark mode works
- [ ] V2 font and tokens applied
- [ ] No console errors

## FINAL REPORT
```
## Operational Pages Mega Redesign Report
- Phases completed: X/4
- Files modified: [list]
- Total lines: +X / -Y
- Build status: PASS/FAIL
```
