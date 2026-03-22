# CC_SESSION_1_PROMPT.md — Copy/paste this into Claude Code

---

## PROMPT TO PASTE INTO CLAUDE CODE:

```
Read CLAUDE.md, DATABASE_SCHEMA.md, MOBILE_PARITY.md, and WEB_BETA_GAMEPLAN.md in the project root before doing anything. These are your reference docs for the entire project.

This is the VolleyBrain web admin portal — a React/Vite app using Supabase as the backend. I cannot code. You must implement everything.

## SESSION GOAL: Phase 1, Sprint 1.1 — URL Routing

The app currently uses useState for ALL page navigation. Despite react-router-dom being installed in package.json, it is not used anywhere. The entire 64,000-line app navigates via:

```javascript
const [page, setPage] = useState('dashboard')  // in MainApp.jsx ~line 1776
```

Pages render conditionally like:
```javascript
{page === 'dashboard' && activeView === 'admin' && <DashboardPage onNavigate={setPage} />}
{page === 'registrations' && <RegistrationsPage showToast={showToast} />}
```

Your task:
1. Implement react-router-dom with proper URL paths for every page (see WEB_BETA_GAMEPLAN.md for the full route map)
2. Replace the useState page switching in MainApp.jsx with <Routes> and <Route> components
3. Update the HorizontalNavBar dropdowns to use useNavigate() instead of setPage()
4. Update all onNavigate={setPage} props throughout the app to use navigation
5. Keep the role switching system working (activeView state for admin/coach/parent/player)
6. Keep public routes working (/register/:orgId/:seasonId and /directory — currently handled in App.jsx)
7. Make sure browser back/forward works
8. Add document.title updates per page

IMPORTANT SAFEGUARDS:
- Do NOT delete any existing page components — only change how they're rendered/navigated to
- Do NOT change any Supabase queries or data logic
- Do NOT modify the theme/styling system
- Test that all 25+ pages are still accessible after the routing change
- If you're unsure about a page ID mapping, check the adminNavGroups, coachNavGroups, parentNavGroups, and playerNavGroups arrays in MainApp.jsx (~line 1438) for the complete list

Start by reading MainApp.jsx to understand the current navigation system, then implement the routing.
```

---

## FUTURE SESSION PROMPTS:

### Session 2 — Phase 1 remaining (Loading States + Nav Polish)
```
Read CLAUDE.md and WEB_BETA_GAMEPLAN.md. Continue Phase 1.

Sprint 1.2: Build consistent skeleton/shimmer loading components. Add them to Dashboard, Teams, Registrations, Schedule, Payments pages. Upgrade the Toast system in src/components/ui/Toast.jsx (currently 28 lines) — add types (success/error/warning/info), slide-in animation, auto-dismiss with progress bar, stack multiple toasts. Add React Error Boundaries.

Sprint 1.3: Build a Breadcrumb component that shows the navigation path. Add a Cmd/Ctrl+K command palette for quick page jumping and searching players/teams by name.
```

### Session 3 — Phase 2 Start (Team Hub Comments + Reactions)
```
Read CLAUDE.md, DATABASE_SCHEMA.md, and MOBILE_PARITY.md. Starting Phase 2: Team Hub Parity.

First, verify these tables exist in Supabase by checking the codebase for any queries to them:
- team_post_comments
- team_post_reactions (or post_reactions — the web code references 'post_reactions' but the actual table might be 'team_post_reactions')

Sprint 2.1: Build a CommentSection component for the Team Hub feed (src/pages/teams/TeamWallPage.jsx). Features: inline text input below posts, comment list with expand/collapse at 2+ threshold, delete own comments (admin can delete any), real-time comment_count updates, threaded replies via parent_comment_id.

Sprint 2.2: Replace the simple like/unlike toggle in TeamWallPage with an emoji reaction picker. Options: 👍 ❤️ 🔥 🏐 ⭐ 👏. Show reaction summary bar under posts. Click own reaction to remove.
```

### Session 4 — Phase 2 Continued (Photo Gallery + Cover Photo)
```
Read CLAUDE.md and MOBILE_PARITY.md. Continuing Phase 2.

Sprint 2.3: Build a photo gallery for the Team Hub. Set up Supabase Storage bucket for team photos. Add image upload to the post composer in TeamWallPage (drag-and-drop + file picker). Build a photo gallery grid (4-5 columns on desktop). Build a lightbox viewer (full-screen, prev/next, close). Add download button.

Sprint 2.4: Add team cover photo upload (admin/coach, saves to teams.banner_url or cover_image_url). Add post pinning (is_pinned on team_posts). Add three-dot menu on posts with Edit/Delete/Pin options, role-gated.
```

### Session 5 — Phase 3 (Parent Dashboard + My Stuff)
```
Read CLAUDE.md, MOBILE_PARITY.md, and WEB_BETA_GAMEPLAN.md. Starting Phase 3: Parent & Player UX.

Sprint 3.1: Build a PriorityCardsEngine for the Parent Dashboard (src/pages/roles/ParentDashboard.jsx). Scan for: unpaid fees, unsigned waivers, events without RSVP, upcoming games in <48hrs. Render as urgency-sorted cards with one-click action buttons. Build an "Action Items" sidebar panel. Add badge count.

Sprint 3.2: Create a unified "My Stuff" page at /my-stuff with tabs: Profile | Payments | Waivers | Settings | Linked Players. Consolidate the scattered parent self-service pages.
```
