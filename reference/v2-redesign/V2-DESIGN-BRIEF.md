# Lynx V2 Dashboard Design Brief

## Layout Pattern (All Roles)
- Slim sidebar: 60px, light background (#FFFFFF), dark navy active state (#10284C)
- Top bar: sticky, 56px. Contains: brand label, typography nav links, search (⌘K), notification bell, theme toggle (moon/sun), settings gear, user avatar
- Main content: 2-column grid (1fr main + 340px sidebar)
- Main column: Hero Card → Attention Strip → Role-specific zone → Body Tabs → Mascot Nudge
- Side column: Financial card (dark navy) → Weekly Load → Org Health / Badges → The Playbook → Milestone

## Visual System
- Background: #F5F6F8 (light), #060E1A (player dark mode)
- Navy: #10284C (primary), #0B1628 (midnight/depth)
- Sky: #4BB9EC (accent, interactive)
- Gold: #FFD700 (achievement only, player accent)
- Green: #22C55E (success), Red: #EF4444 (critical), Amber: #F59E0B (warning)
- Card radius: 14px everywhere
- Typography: Plus Jakarta Sans (or Inter Variable)
- No 1px border dividers — use whitespace and background shifts
- Dark cards on light background = signature Lynx rhythm

## Per-Role Top Bar Nav
- Admin: Dashboard | Analytics | Schedule | Roster
- Coach: Dashboard | Game Day | Stats | Chat
- Parent: Dashboard | Schedule | Payments | Chat
- Player: Dashboard | Stats | Badges | Leaderboard
- Team Manager: Dashboard | Schedule | Payments | Roster

## Per-Role Body Tabs
- Admin: Teams & Health | Registrations | Payments | Schedules
- Coach: Roster | Attendance | Stats | Game Prep
- Parent: Schedule | Payments | Forms & Waivers | Report Card
- Player: Badges | Challenges | Season Stats | Skills
- Team Manager: Roster | Payments | Schedule | Attendance

## Key Decisions
- Grid system: ARCHIVED (fixed layout replaces drag-and-drop)
- SeasonContext: Will be reworked to be driven by carousel/team selection
- Notifications: Bell shows icon only for now, proper system deferred
- Theme toggle: Small moon/sun icon in top bar
- Voice: Coach voice everywhere. "Let's go" not "Please proceed"
- Mascot: Present on every role as contextual nudge with action buttons
