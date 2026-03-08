# CC-WIDGET-LIBRARY — Card Library Panel for Dashboard Editor

**Spec Author:** Claude Opus 4.6
**Date:** March 5, 2026
**Branch:** `feat/desktop-dashboard-redesign`
**Repo:** `SgtxTorque/volleybrain-admin`
**Predecessor:** CC-WIDGET-GRID-FIX-2 (completed or in flight)

---

## CONTEXT

Carlos wants to add cards to his dashboards that don't exist on them yet — like putting the Calendar Strip card on the admin dashboard, or adding a Team Health card to the parent view. He needs a widget library panel where he can browse ALL available card types, add them to the current grid, remove cards he doesn't want, and then arrange everything with the drag-and-drop editor.

---

## RULES

1. Read every file before modifying
2. Archive before replace
3. Commit after each phase
4. TSC verify after each phase
5. Test all three dashboards
6. No file over 500 lines

---

## PHASE 0: Archive

```bash
mkdir -p src/_archive/widget-library-$(date +%Y%m%d)
cp src/components/layout/DashboardGrid.jsx src/_archive/widget-library-$(date +%Y%m%d)/
# Archive all three dashboard orchestrator files
grep -r "adminWidgets\|coachWidgets\|parentWidgets\|DashboardGrid" src/ --include="*.jsx" -l
# Archive each found file
```

**Commit:** `git add -A && git commit -m "phase 0: archive for widget library"`

---

## PHASE 1: Build the Widget Registry

**Goal:** Create a central registry of ALL available card types across the entire app. Each entry defines what the card is, what roles it's available to, what category it belongs to, its default size, and how to render it.

### Step 1.1: Inventory every card component in the app

```bash
# Find all card/widget components
ls src/components/dashboard/
ls src/components/coach/
ls src/components/shared/
find src/components -name "*Card*" -o -name "*Hero*" -o -name "*Row*" -o -name "*List*" -o -name "*Tracker*" -o -name "*Panel*" -o -name "*Strip*" -o -name "*Actions*" -o -name "*Banner*" | sort
```

Read each file to understand what it displays and what props it needs.

### Step 1.2: Create the widget registry

Create: `src/components/layout/widgetRegistry.js`

This is a plain JavaScript file (not JSX) that exports the registry. Each widget entry has metadata but NOT the component itself (components are resolved at render time to avoid circular imports).

```js
/**
 * Widget Registry — master list of all available dashboard cards.
 *
 * Each entry defines:
 * - id: unique identifier (kebab-case)
 * - label: human-readable name shown in the library panel and drag handle
 * - description: short description of what this card shows
 * - category: grouping for the library panel
 * - roles: which roles can use this widget ['admin', 'coach', 'parent']
 * - defaultSize: { w, h } in 24-col / 20px-row grid units
 * - minSize: { w, h } minimum dimensions
 * - componentKey: string key used to resolve the actual React component
 * - icon: emoji or icon identifier for the library panel
 * - requiresData: array of data dependencies (helps the dashboard know what to fetch)
 */

export const WIDGET_CATEGORIES = {
  OVERVIEW: 'Overview & Health',
  SCHEDULE: 'Schedule & Events',
  ROSTER: 'Roster & Players',
  FINANCIALS: 'Payments & Financials',
  COMMUNICATION: 'Communication & Social',
  ACTIONS: 'Actions & Tasks',
  PROGRESS: 'Progress & Journeys',
  ACHIEVEMENTS: 'Achievements & Stats',
};

export const widgetRegistry = [
  // ══════════════════════════════════════
  // OVERVIEW & HEALTH
  // ══════════════════════════════════════
  {
    id: 'welcome-banner',
    label: 'Welcome Banner',
    description: 'Personalized greeting with time-of-day awareness and motivational messages',
    category: WIDGET_CATEGORIES.OVERVIEW,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 24, h: 4 },
    minSize: { w: 8, h: 2 },
    componentKey: 'WelcomeBanner',
    icon: '👋',
  },
  {
    id: 'org-health-hero',
    label: 'Organization Health',
    description: 'Health score ring, KPI pills, and needs-attention items for the whole org',
    category: WIDGET_CATEGORIES.OVERVIEW,
    roles: ['admin'],
    defaultSize: { w: 14, h: 18 },
    minSize: { w: 8, h: 10 },
    componentKey: 'OrgHealthHero',
    icon: '🏥',
  },
  {
    id: 'setup-tracker',
    label: 'Setup Tracker',
    description: 'Admin onboarding progress bar — shows next setup step and time estimate',
    category: WIDGET_CATEGORIES.PROGRESS,
    roles: ['admin'],
    defaultSize: { w: 24, h: 4 },
    minSize: { w: 12, h: 3 },
    componentKey: 'AdminSetupTracker',
    icon: '🚀',
  },
  {
    id: 'team-health',
    label: 'Team Health',
    description: 'Attendance, avg rating, record, win rate — how is the team performing',
    category: WIDGET_CATEGORIES.OVERVIEW,
    roles: ['coach', 'admin'],
    defaultSize: { w: 24, h: 8 },
    minSize: { w: 8, h: 4 },
    componentKey: 'TeamHealthCard',
    icon: '📊',
  },

  // ══════════════════════════════════════
  // SCHEDULE & EVENTS
  // ══════════════════════════════════════
  {
    id: 'gameday-hero',
    label: 'Game Day Hero',
    description: 'Next match hero card — opponent, countdown, record, form badges',
    category: WIDGET_CATEGORIES.SCHEDULE,
    roles: ['coach'],
    defaultSize: { w: 14, h: 16 },
    minSize: { w: 8, h: 8 },
    componentKey: 'CoachGameDayHeroV2',
    icon: '🏐',
  },
  {
    id: 'calendar-strip',
    label: 'Calendar Strip',
    description: 'Week-view calendar — scroll through days, see events per day, link to full schedule',
    category: WIDGET_CATEGORIES.SCHEDULE,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 12, h: 12 },
    minSize: { w: 6, h: 6 },
    componentKey: 'CalendarStripCard',
    icon: '📅',
  },
  {
    id: 'upcoming-events',
    label: 'Upcoming Events',
    description: 'Next 3-5 upcoming events with RSVP status and type indicators',
    category: WIDGET_CATEGORIES.SCHEDULE,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 12, h: 10 },
    minSize: { w: 6, h: 4 },
    componentKey: 'UpcomingEventsCard',
    icon: '📋',
  },
  {
    id: 'also-this-week',
    label: 'Also This Week',
    description: 'Flat text card cycling through remaining events this week',
    category: WIDGET_CATEGORIES.SCHEDULE,
    roles: ['coach'],
    defaultSize: { w: 14, h: 4 },
    minSize: { w: 6, h: 2 },
    componentKey: 'AlsoThisWeekCard',
    icon: '📌',
  },

  // ══════════════════════════════════════
  // ROSTER & PLAYERS
  // ══════════════════════════════════════
  {
    id: 'squad',
    label: 'Squad',
    description: 'Player roster list with photos, positions, and status indicators',
    category: WIDGET_CATEGORIES.ROSTER,
    roles: ['coach'],
    defaultSize: { w: 10, h: 20 },
    minSize: { w: 4, h: 6 },
    componentKey: 'CoachRosterCard',
    icon: '👥',
  },
  {
    id: 'top-players',
    label: 'Top Players',
    description: 'Top performing players by various stats',
    category: WIDGET_CATEGORIES.ROSTER,
    roles: ['coach', 'admin'],
    defaultSize: { w: 12, h: 10 },
    minSize: { w: 4, h: 4 },
    componentKey: 'TopPlayersCard',
    icon: '⭐',
  },
  {
    id: 'child-cards',
    label: 'My Players',
    description: 'Child player cards — photo, team, jersey, position, eval score',
    category: WIDGET_CATEGORIES.ROSTER,
    roles: ['parent'],
    defaultSize: { w: 24, h: 8 },
    minSize: { w: 8, h: 4 },
    componentKey: 'ChildPlayerCards',
    icon: '🧒',
  },
  {
    id: 'player-achievements',
    label: 'Achievements',
    description: 'Player badges and achievements with rarity tiers',
    category: WIDGET_CATEGORIES.ACHIEVEMENTS,
    roles: ['parent', 'coach'],
    defaultSize: { w: 12, h: 6 },
    minSize: { w: 4, h: 3 },
    componentKey: 'AchievementsCard',
    icon: '🏆',
  },

  // ══════════════════════════════════════
  // PAYMENTS & FINANCIALS
  // ══════════════════════════════════════
  {
    id: 'financial-summary',
    label: 'Financial Summary',
    description: 'Collected vs outstanding amounts, collection progress bar',
    category: WIDGET_CATEGORIES.FINANCIALS,
    roles: ['admin'],
    defaultSize: { w: 12, h: 8 },
    minSize: { w: 6, h: 4 },
    componentKey: 'FinancialSummaryCard',
    icon: '💰',
  },
  {
    id: 'balance-due',
    label: 'Balance Due',
    description: 'Outstanding balance with pay button — only shows if money is owed',
    category: WIDGET_CATEGORIES.FINANCIALS,
    roles: ['parent'],
    defaultSize: { w: 12, h: 8 },
    minSize: { w: 4, h: 4 },
    componentKey: 'BalanceDueCard',
    icon: '💳',
  },

  // ══════════════════════════════════════
  // COMMUNICATION & SOCIAL
  // ══════════════════════════════════════
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Recent activity feed — achievements, stats, kudos, blasts',
    category: WIDGET_CATEGORIES.COMMUNICATION,
    roles: ['coach', 'admin'],
    defaultSize: { w: 10, h: 8 },
    minSize: { w: 4, h: 4 },
    componentKey: 'CoachNotificationsCard',
    icon: '🔔',
  },
  {
    id: 'team-wall-preview',
    label: 'Team Wall',
    description: 'Latest post from the team wall',
    category: WIDGET_CATEGORIES.COMMUNICATION,
    roles: ['admin', 'coach', 'parent'],
    defaultSize: { w: 12, h: 8 },
    minSize: { w: 4, h: 4 },
    componentKey: 'TeamWallPreviewCard',
    icon: '📱',
  },
  {
    id: 'team-hub',
    label: 'Team Hub Preview',
    description: 'Quick link to team wall, photos, and updates',
    category: WIDGET_CATEGORIES.COMMUNICATION,
    roles: ['parent'],
    defaultSize: { w: 12, h: 6 },
    minSize: { w: 4, h: 3 },
    componentKey: 'TeamHubPreview',
    icon: '🏠',
  },

  // ══════════════════════════════════════
  // ACTIONS & TASKS
  // ══════════════════════════════════════
  {
    id: 'action-checklist',
    label: 'Action Checklist',
    description: 'Detailed action items sorted by urgency with Handle buttons',
    category: WIDGET_CATEGORIES.ACTIONS,
    roles: ['admin'],
    defaultSize: { w: 24, h: 10 },
    minSize: { w: 6, h: 4 },
    componentKey: 'AdminActionChecklist',
    icon: '✅',
  },
  {
    id: 'action-items-coach',
    label: 'Action Items',
    description: 'Coach tasks with mobile app tone — stats to enter, RSVPs pending, evals due',
    category: WIDGET_CATEGORIES.ACTIONS,
    roles: ['coach'],
    defaultSize: { w: 12, h: 10 },
    minSize: { w: 4, h: 4 },
    componentKey: 'CoachActionItemsCard',
    icon: '📝',
  },
  {
    id: 'action-required-parent',
    label: 'Action Required',
    description: 'Parent tasks — payments, RSVPs, waivers, emergency contacts',
    category: WIDGET_CATEGORIES.ACTIONS,
    roles: ['parent'],
    defaultSize: { w: 24, h: 8 },
    minSize: { w: 6, h: 3 },
    componentKey: 'ActionRequiredCard',
    icon: '⚠️',
  },
  {
    id: 'quick-actions-admin',
    label: 'Quick Actions',
    description: 'Admin shortcut buttons with counter badges',
    category: WIDGET_CATEGORIES.ACTIONS,
    roles: ['admin'],
    defaultSize: { w: 24, h: 8 },
    minSize: { w: 6, h: 4 },
    componentKey: 'AdminQuickActions',
    icon: '⚡',
  },
  {
    id: 'quick-actions-coach',
    label: 'Quick Actions',
    description: 'Coach shortcut buttons — Send Blast, Build Lineup, Enter Stats, etc.',
    category: WIDGET_CATEGORIES.ACTIONS,
    roles: ['coach'],
    defaultSize: { w: 12, h: 10 },
    minSize: { w: 4, h: 4 },
    componentKey: 'CoachToolsCard',
    icon: '⚡',
  },

  // ══════════════════════════════════════
  // PROGRESS & JOURNEYS
  // ══════════════════════════════════════
  {
    id: 'season-journey',
    label: 'Season Journey',
    description: 'Vertical list of seasons with progress bars and blocker labels',
    category: WIDGET_CATEGORIES.PROGRESS,
    roles: ['admin'],
    defaultSize: { w: 10, h: 18 },
    minSize: { w: 4, h: 6 },
    componentKey: 'SeasonJourneyList',
    icon: '🗺️',
  },
  {
    id: 'gameday-journey',
    label: 'Game Day Journey',
    description: 'Step-by-step game day workflow tracker with clickable steps',
    category: WIDGET_CATEGORIES.PROGRESS,
    roles: ['coach'],
    defaultSize: { w: 14, h: 6 },
    minSize: { w: 6, h: 3 },
    componentKey: 'GameDayJourneyCard',
    icon: '🎯',
  },
  {
    id: 'team-readiness',
    label: 'Team Readiness',
    description: 'Checklist journey — roster verified, evaluations done, positions set, etc.',
    category: WIDGET_CATEGORIES.PROGRESS,
    roles: ['coach'],
    defaultSize: { w: 12, h: 10 },
    minSize: { w: 4, h: 4 },
    componentKey: 'TeamReadinessCard',
    icon: '🏁',
  },
  {
    id: 'challenges',
    label: 'Challenges',
    description: 'Active team challenges and create new challenge button',
    category: WIDGET_CATEGORIES.PROGRESS,
    roles: ['coach'],
    defaultSize: { w: 12, h: 8 },
    minSize: { w: 4, h: 4 },
    componentKey: 'ChallengesCard',
    icon: '🔥',
  },

  // ══════════════════════════════════════
  // STATS & DATA
  // ══════════════════════════════════════
  {
    id: 'kpi-row',
    label: 'KPI Stats Row',
    description: 'Key numbers — players, families, coaches, teams, events',
    category: WIDGET_CATEGORIES.OVERVIEW,
    roles: ['admin'],
    defaultSize: { w: 24, h: 6 },
    minSize: { w: 8, h: 4 },
    componentKey: 'KPIRow',
    icon: '📈',
  },
  {
    id: 'teams-table',
    label: 'All Teams',
    description: 'Teams table with record, players, health bars, status',
    category: WIDGET_CATEGORIES.OVERVIEW,
    roles: ['admin'],
    defaultSize: { w: 24, h: 12 },
    minSize: { w: 8, h: 6 },
    componentKey: 'TeamsTable',
    icon: '🏟️',
  },
  {
    id: 'compliance-cards',
    label: 'Compliance',
    description: 'Players, Parents, Coaches, Organization compliance status cards',
    category: WIDGET_CATEGORIES.OVERVIEW,
    roles: ['admin'],
    defaultSize: { w: 24, h: 8 },
    minSize: { w: 8, h: 4 },
    componentKey: 'ComplianceCards',
    icon: '🛡️',
  },
  {
    id: 'coach-stats',
    label: 'Coach Stats',
    description: 'Coaching performance stats and metrics',
    category: WIDGET_CATEGORIES.ACHIEVEMENTS,
    roles: ['coach'],
    defaultSize: { w: 12, h: 8 },
    minSize: { w: 4, h: 4 },
    componentKey: 'CoachStatsCard',
    icon: '📊',
  },
];

/**
 * Get widgets available for a specific role
 */
export function getWidgetsForRole(role) {
  return widgetRegistry.filter(w => w.roles.includes(role));
}

/**
 * Get widgets grouped by category for a specific role
 */
export function getWidgetsByCategory(role) {
  const available = getWidgetsForRole(role);
  const grouped = {};
  for (const widget of available) {
    if (!grouped[widget.category]) {
      grouped[widget.category] = [];
    }
    grouped[widget.category].push(widget);
  }
  return grouped;
}
```

### Step 1.3: Verify registry is importable
```bash
npx tsc --noEmit
```

**Commit:** `git add -A && git commit -m "phase 1: widget registry — master catalog of all available card types"`

---

## PHASE 2: Component Resolver

**Goal:** Map `componentKey` strings from the registry to actual React components, so the grid can render any widget by its key.

### Step 2.1: Create the component resolver

Create: `src/components/layout/widgetComponents.jsx`

This file imports ALL card components and maps them by key:

```jsx
import React from 'react';

// Import all widget components
// Admin
import OrgHealthHero from '../dashboard/OrgHealthHero';
import AdminSetupTracker from '../dashboard/AdminSetupTracker';
import AdminActionChecklist from '../dashboard/AdminActionChecklist';
import AdminQuickActions from '../dashboard/AdminQuickActions';
import SeasonJourneyList from '../dashboard/SeasonJourneyList';
import KPIRow from '../dashboard/KPIRow';
import TeamsTable from '../dashboard/TeamsTable';
import FinancialSummaryCard from '../dashboard/FinancialSummaryCard';
import ComplianceCards from '../dashboard/ComplianceCards';
import UpcomingEventsCard from '../dashboard/UpcomingEventsCard';
import TeamWallPreviewCard from '../dashboard/TeamWallPreviewCard';

// Coach
import CoachGameDayHeroV2 from '../coach/CoachGameDayHeroV2';
import CoachNotificationsCard from '../coach/CoachNotificationsCard';
import CoachRosterCard from '../coach/CoachRosterCard';
import GameDayJourneyCard from '../coach/GameDayJourneyCard';
import CoachStatsCard from '../coach/CoachStatsCard';
import CoachToolsCard from '../coach/CoachToolsCard';
import ChallengesCard from '../coach/ChallengesCard';
import TopPlayersCard from '../coach/TopPlayersCard';
import TeamReadinessCard from '../coach/TeamReadinessCard';
import CoachWallPreviewCard from '../coach/CoachWallPreviewCard';

// Shared / Parent
import WelcomeBanner from '../shared/WelcomeBanner';

// ... import every component listed in the registry
// READ the registry file to get the full list of componentKeys
// Then find each component's actual file path:
// grep -r "export default" src/components/ --include="*.jsx" | grep -i [componentName]

/**
 * Maps componentKey → React component.
 * If a component doesn't exist yet, returns a placeholder.
 */
const componentMap = {
  WelcomeBanner,
  OrgHealthHero,
  AdminSetupTracker,
  AdminActionChecklist,
  AdminQuickActions,
  SeasonJourneyList,
  KPIRow,
  TeamsTable,
  FinancialSummaryCard,
  ComplianceCards,
  UpcomingEventsCard,
  TeamWallPreviewCard,
  CoachGameDayHeroV2,
  CoachNotificationsCard,
  CoachRosterCard,
  GameDayJourneyCard,
  CoachStatsCard,
  CoachToolsCard,
  ChallengesCard,
  TopPlayersCard,
  TeamReadinessCard,
  CoachWallPreviewCard,
  // ... all others
};

/**
 * Placeholder component for widgets whose component hasn't been built yet
 */
function WidgetPlaceholder({ label, id }) {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-4 text-center">
      <span className="text-2xl mb-2">🧩</span>
      <span className="text-r-sm font-bold text-slate-500">{label}</span>
      <span className="text-r-xs text-slate-400 mt-1">Component not built yet</span>
      <span className="text-r-xs text-slate-300 mt-1 font-mono">{id}</span>
    </div>
  );
}

/**
 * Resolve a componentKey to a React component.
 * Returns placeholder if not found.
 */
export function resolveWidget(componentKey, props = {}) {
  const Component = componentMap[componentKey];
  if (Component) {
    return <Component {...props} />;
  }
  return <WidgetPlaceholder label={componentKey} id={componentKey} />;
}

/**
 * Check if a component exists (is built and importable)
 */
export function widgetExists(componentKey) {
  return componentKey in componentMap;
}
```

**Important:** Some components in the registry may not exist yet (like `CalendarStripCard`, `AlsoThisWeekCard`, `TeamHealthCard`, `CoachActionItemsCard`). Those will render as placeholders with a puzzle piece icon and "Component not built yet" message. This is fine — Carlos can still add them to the grid and position them where he wants. When the actual component gets built later, it'll automatically replace the placeholder.

### Step 2.2: Handle component props

Components need data props. The dashboard passes different props to different cards. Create a prop resolver:

```jsx
/**
 * Each dashboard calls this to get the props for a specific widget.
 * The dashboard passes its full data context, and this function
 * extracts the relevant props for each widget type.
 */
export function getWidgetProps(componentKey, dashboardData) {
  // dashboardData is an object with all the fetched data
  // from the dashboard's Supabase queries
  switch (componentKey) {
    case 'OrgHealthHero':
      return {
        healthScore: dashboardData.healthScore,
        kpis: dashboardData.kpis,
        needsAttention: dashboardData.needsAttention,
      };
    case 'WelcomeBanner':
      return {
        role: dashboardData.role,
        userName: dashboardData.userName,
        teamName: dashboardData.teamName,
        seasonName: dashboardData.seasonName,
      };
    // ... cases for each component
    default:
      return dashboardData; // pass everything as a fallback
  }
}
```

**Actually — this is too rigid.** A simpler approach: each dashboard already has all its data in state. Pass the entire data context to the DashboardGrid, and let each widget receive ALL available props. Components just use what they need and ignore the rest.

```jsx
// In the dashboard:
<DashboardGrid
  widgets={activeWidgets}
  editMode={editMode}
  sharedProps={dashboardData}  // pass everything
/>

// In DashboardGrid, when rendering each widget:
{resolveWidget(widget.componentKey, sharedProps)}
```

### Step 2.3: Verify
```bash
npx tsc --noEmit
```

**Commit:** `git add -A && git commit -m "phase 2: component resolver — maps registry keys to React components with placeholder fallback"`

---

## PHASE 3: Widget Library Panel

**Goal:** A slide-out panel that shows all available widgets, grouped by category, with Add/Remove buttons.

### Step 3.1: Create the library panel

Create: `src/components/layout/WidgetLibraryPanel.jsx`

**Visual:**
- Slides in from the right side of the screen when opened
- Width: `w-80` (320px)
- Dark navy background matching the sidebar: `bg-lynx-navy`
- White text
- Header: "Widget Library" with close X button
- Search input at top to filter widgets
- Widgets grouped by category (expandable sections)
- Each widget entry shows:
  - Icon + label (bold)
  - Short description (muted text, 1-2 lines)
  - "Add" button if not on the grid, or "Added ✓" indicator if already on the grid
  - If already on grid: "Remove" button (red, small)

```jsx
import React, { useState } from 'react';
import { widgetRegistry, getWidgetsByCategory } from './widgetRegistry';
import { widgetExists } from './widgetComponents';

export default function WidgetLibraryPanel({
  isOpen,
  onClose,
  role,
  activeWidgetIds,    // Set of widget IDs currently on the grid
  onAddWidget,        // callback(widgetDef) — add widget to grid
  onRemoveWidget,     // callback(widgetId) — remove widget from grid
}) {
  const [search, setSearch] = useState('');
  const grouped = getWidgetsByCategory(role);

  const filteredGrouped = {};
  for (const [category, widgets] of Object.entries(grouped)) {
    const filtered = widgets.filter(w =>
      w.label.toLowerCase().includes(search.toLowerCase()) ||
      w.description.toLowerCase().includes(search.toLowerCase())
    );
    if (filtered.length > 0) {
      filteredGrouped[category] = filtered;
    }
  }

  return (
    <div className={`fixed right-0 top-0 h-full w-80 bg-lynx-navy z-50 shadow-2xl transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <h2 className="text-white font-extrabold text-r-lg">Widget Library</h2>
        <button onClick={onClose} className="text-white/50 hover:text-white text-xl">✕</button>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <input
          type="text"
          placeholder="Search widgets..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-white/10 text-white placeholder-white/30 text-r-sm border border-white/10 focus:border-lynx-sky outline-none"
        />
      </div>

      {/* Widget list */}
      <div className="overflow-y-auto h-[calc(100%-120px)] px-4 pb-4">
        {Object.entries(filteredGrouped).map(([category, widgets]) => (
          <div key={category} className="mb-4">
            <h3 className="text-r-xs font-bold uppercase tracking-wider text-white/40 mb-2">{category}</h3>
            {widgets.map(widget => {
              const isActive = activeWidgetIds.has(widget.id);
              const exists = widgetExists(widget.componentKey);
              return (
                <div key={widget.id} className="flex items-start gap-3 py-3 border-b border-white/5">
                  <span className="text-xl mt-0.5">{widget.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-r-sm">{widget.label}</span>
                      {!exists && <span className="text-r-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">Soon</span>}
                    </div>
                    <p className="text-white/40 text-r-xs mt-0.5 line-clamp-2">{widget.description}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {isActive ? (
                      <button
                        onClick={() => onRemoveWidget(widget.id)}
                        className="text-r-xs font-bold text-red-400 hover:text-red-300 px-2 py-1 rounded border border-red-400/30 hover:border-red-400/60"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        onClick={() => onAddWidget(widget)}
                        className="text-r-xs font-bold text-lynx-sky hover:text-white px-2 py-1 rounded border border-lynx-sky/30 hover:border-lynx-sky/60 hover:bg-lynx-sky/10"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Step 3.2: Integrate the library panel into DashboardGrid

Update `DashboardGrid.jsx`:

- Add a "📚 Widgets" button next to the "Edit Layout" button (only visible in edit mode)
- Clicking it opens the WidgetLibraryPanel
- When "Add" is clicked on a widget, it's added to the grid at position (0, bottom) with its defaultSize
- When "Remove" is clicked, it's removed from the grid
- The widget array is now dynamic (stored in state), not static

```jsx
const [activeWidgets, setActiveWidgets] = useState(initialWidgets);
const [libraryOpen, setLibraryOpen] = useState(false);

const handleAddWidget = (widgetDef) => {
  // Find the bottom-most Y position to place new widget below everything
  const maxY = layouts.lg?.reduce((max, item) => Math.max(max, item.y + item.h), 0) || 0;

  const newWidget = {
    id: widgetDef.id,
    label: widgetDef.label,
    componentKey: widgetDef.componentKey,
    defaultLayout: {
      x: 0,
      y: maxY + 1,
      w: widgetDef.defaultSize.w,
      h: widgetDef.defaultSize.h,
    },
    minW: widgetDef.minSize.w,
    minH: widgetDef.minSize.h,
  };

  setActiveWidgets(prev => [...prev, newWidget]);

  // Also add to layouts
  setLayouts(prev => ({
    ...prev,
    lg: [...(prev.lg || []), {
      i: widgetDef.id,
      x: 0,
      y: maxY + 1,
      w: widgetDef.defaultSize.w,
      h: widgetDef.defaultSize.h,
      minW: widgetDef.minSize.w,
      minH: widgetDef.minSize.h,
    }],
  }));
};

const handleRemoveWidget = (widgetId) => {
  setActiveWidgets(prev => prev.filter(w => w.id !== widgetId));
  setLayouts(prev => ({
    ...prev,
    lg: (prev.lg || []).filter(item => item.i !== widgetId),
  }));
};
```

### Step 3.3: Add "Widgets" button to edit mode UI

In the floating button area (bottom right), when in edit mode show two buttons:
- "📚 Widgets" — opens the library panel
- "✓ Done" — exits edit mode

### Step 3.4: Add remove button directly on cards in edit mode

Each card in edit mode should also have a small red X button in the top-right corner of the drag handle:

```jsx
{editMode && (
  <button
    onClick={() => handleRemoveWidget(widget.id)}
    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500/80 text-white text-xs flex items-center justify-center hover:bg-red-500 z-20"
    title="Remove widget"
  >
    ✕
  </button>
)}
```

### Step 3.5: Verify

```bash
npx tsc --noEmit
```

Test as Admin:
- Enter edit mode
- Click "📚 Widgets" — library panel slides in from right
- See all admin-available widgets grouped by category
- Widgets already on the grid show "Remove" button
- Widgets not on the grid show "+ Add" button
- Click "+ Add" on Calendar Strip → it appears at the bottom of the grid
- Drag it to where you want it
- Click "Remove" on a widget → it disappears from the grid
- Search works — type "calendar" to filter
- Widgets marked "Soon" have the amber badge (component not built yet)
- Close the panel, continue dragging

Test as Coach and Parent — library shows role-appropriate widgets only.

**Commit:** `git add -A && git commit -m "phase 3: widget library panel — browse, add, remove cards from any dashboard"`

---

## PHASE 4: Wire Data Props Through Component Resolver

**Goal:** Make sure all widgets receive the data they need, regardless of which dashboard they're on.

### Step 4.1: Update each dashboard to pass shared data context

Each dashboard file already fetches data from Supabase. Instead of passing specific props to specific components, pass ALL dashboard data through:

```jsx
// In admin dashboard
const dashboardData = {
  role: 'admin',
  userName: user.name,
  seasonName: currentSeason?.name,
  healthScore,
  kpis,
  needsAttention,
  seasons,
  teams,
  payments,
  registrations,
  // ... everything the dashboard already fetches
};

<DashboardGrid
  ...
  sharedProps={dashboardData}
/>
```

In `DashboardGrid.jsx`, pass sharedProps to each widget:
```jsx
{resolveWidget(widget.componentKey, sharedProps)}
```

### Step 4.2: Ensure components handle missing props gracefully

Some components might receive props they don't expect (from a different dashboard's context). They should use optional chaining and defaults:

```jsx
// Components should already handle undefined props, but verify:
// Check each component for prop destructuring and add defaults where needed
```

### Step 4.3: Verify — every widget renders with data, no console errors about missing props.

**Commit:** `git add -A && git commit -m "phase 4: shared data props — all widgets receive dashboard context"`

---

## PHASE 5: Parity Check

Test all three dashboards:
- Default layout loads (no edit mode) — looks same as before
- Edit mode: drag, resize, add, remove all work
- Library panel: shows correct widgets per role
- Placeholder widgets render for unbuilt components
- Remove X button works on each card
- Export Layout includes newly added widgets
- Reset returns to original layout (removes added widgets, restores removed ones)
- No console errors across all roles

```bash
npx tsc --noEmit
npm run build
```

**Commit:** `git add -A && git commit -m "phase 5: widget library parity check — all roles verified"`

---

## EXECUTION ORDER SUMMARY

| Phase | Scope | Key Changes |
|-------|-------|-------------|
| 0 | Archive | Backup current files |
| 1 | Widget Registry | Master catalog of ~30 widget types with metadata |
| 2 | Component Resolver | Maps registry keys → React components, placeholder fallback |
| 3 | Widget Library Panel | Slide-out panel to browse, add, remove widgets |
| 4 | Data Props | Shared data context passed to all widgets |
| 5 | Parity Check | All roles tested |

---

## NOTES FOR CC

- **The registry is the source of truth for ALL widget types.** If a component exists in the codebase but isn't in the registry, add it.
- **Components that don't exist yet render as placeholders.** This is intentional — Carlos can position them now and they'll be filled in when built.
- **The library panel filters by role.** Admin sees admin widgets. Coach sees coach widgets. Some widgets (like Calendar Strip, Upcoming Events) are available to multiple roles.
- **Adding a widget places it at the bottom.** Carlos then drags it where he wants it.
- **Removing a widget removes it from the current session only.** Refresh resets to defaults. No persistence yet.
- **The component resolver uses a `sharedProps` approach.** Each component receives ALL dashboard data and picks what it needs. This is simpler than maintaining a per-component prop map.
- **READ every file in src/components/dashboard/ and src/components/coach/ to build the complete import list** for widgetComponents.jsx. Don't guess what components exist — check.
