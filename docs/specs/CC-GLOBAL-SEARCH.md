# CC-GLOBAL-SEARCH — Site-Wide Search Across All Entities

**Spec Author:** Claude Opus 4.6
**Date:** March 8, 2026
**Branch:** `main`
**Repo:** `SgtxTorque/volleybrain-admin`

---

## CONTEXT

Carlos needs a global search that works across the entire Lynx web admin — players, parents, teams, seasons, events, registrations, payments, everything. Right now the only search is tied to individual page filters, and you can't find a specific registration or player without navigating to the right page and selecting the right season first.

---

## RULES

1. Read every file before modifying
2. Find existing search patterns in the codebase before building new ones
3. Commit after each phase
4. TSC verify after each phase

---

## PHASE 1: Build the Search Service

### Step 1.1: Read what tables exist

```bash
grep -roh "\.from(['\"][a-z_]*['\"])" src/ --include="*.jsx" --include="*.js" | sort | uniq
```

### Step 1.2: Create a search service

Create: `src/lib/searchService.js`

This service queries multiple Supabase tables in parallel and returns combined results:

```js
import { supabase } from './supabase'; // match existing import pattern

export async function globalSearch(query) {
  if (!query || query.trim().length < 2) return [];

  const searchTerm = query.trim().toLowerCase();
  const ilikeTerm = `%${searchTerm}%`;

  // Run all searches in parallel
  const [
    players,
    parents,
    teams,
    seasons,
    events,
    registrations,
  ] = await Promise.all([
    // Players
    supabase
      .from('profiles')
      .select('id, full_name, first_name, last_name, avatar_url, role')
      .or(`full_name.ilike.${ilikeTerm},first_name.ilike.${ilikeTerm},last_name.ilike.${ilikeTerm}`)
      .in('role', ['player'])
      .limit(5),

    // Parents
    supabase
      .from('profiles')
      .select('id, full_name, first_name, last_name, avatar_url, email, role')
      .or(`full_name.ilike.${ilikeTerm},first_name.ilike.${ilikeTerm},last_name.ilike.${ilikeTerm},email.ilike.${ilikeTerm}`)
      .in('role', ['parent'])
      .limit(5),

    // Teams
    supabase
      .from('teams')
      .select('id, name, color, season_id, seasons(name)')
      .ilike('name', ilikeTerm)
      .limit(5),

    // Seasons
    supabase
      .from('seasons')
      .select('id, name, sport, start_date, end_date, status')
      .ilike('name', ilikeTerm)
      .limit(5),

    // Events
    supabase
      .from('events')
      .select('id, title, event_type, start_time, venue, team_id, teams(name)')
      .or(`title.ilike.${ilikeTerm},venue.ilike.${ilikeTerm}`)
      .limit(5),

    // Registrations
    supabase
      .from('registrations')
      .select('id, status, created_at, player_id, profiles!player_id(full_name), season_id, seasons(name)')
      .limit(5),
  ]);

  // NOTE: The registrations query may need adjustment based on actual schema.
  // Read the existing registrations queries first:
  // grep -r "from.*registrations" src/ --include="*.jsx" | grep "select" | head -10
  // Use whatever join pattern already works in the codebase.

  const results = [];

  // Format players
  if (players.data) {
    players.data.forEach(p => results.push({
      type: 'player',
      id: p.id,
      title: p.full_name || `${p.first_name} ${p.last_name}`,
      subtitle: 'Player',
      icon: '🏐',
      avatar: p.avatar_url,
      path: `/players/${p.id}`,
    }));
  }

  // Format parents
  if (parents.data) {
    parents.data.forEach(p => results.push({
      type: 'parent',
      id: p.id,
      title: p.full_name || `${p.first_name} ${p.last_name}`,
      subtitle: p.email || 'Parent',
      icon: '👤',
      avatar: p.avatar_url,
      path: `/profiles/${p.id}`,
    }));
  }

  // Format teams
  if (teams.data) {
    teams.data.forEach(t => results.push({
      type: 'team',
      id: t.id,
      title: t.name,
      subtitle: t.seasons?.name || 'Team',
      icon: '👥',
      color: t.color,
      path: `/teams/${t.id}`,
    }));
  }

  // Format seasons
  if (seasons.data) {
    seasons.data.forEach(s => results.push({
      type: 'season',
      id: s.id,
      title: s.name,
      subtitle: `${s.sport || ''} · ${s.status || ''}`.trim(),
      icon: '📅',
      path: `/admin/seasons/${s.id}`,
    }));
  }

  // Format events
  if (events.data) {
    events.data.forEach(e => results.push({
      type: 'event',
      id: e.id,
      title: e.title || e.event_type,
      subtitle: `${e.teams?.name || ''} · ${e.venue || ''}`.trim(),
      icon: e.event_type === 'practice' ? '⚡' : e.event_type === 'game' ? '🏐' : '🏆',
      path: `/schedule?event=${e.id}`,
    }));
  }

  // Format registrations — filter client-side by search term
  // since we can't easily ilike on a joined field
  if (registrations.data) {
    registrations.data
      .filter(r => {
        const playerName = r.profiles?.full_name?.toLowerCase() || '';
        const seasonName = r.seasons?.name?.toLowerCase() || '';
        return playerName.includes(searchTerm) || seasonName.includes(searchTerm);
      })
      .forEach(r => results.push({
        type: 'registration',
        id: r.id,
        title: r.profiles?.full_name || 'Unknown Player',
        subtitle: `Registration · ${r.seasons?.name || ''} · ${r.status}`,
        icon: '📋',
        path: `/registrations?id=${r.id}`,
      }));
  }

  return results;
}
```

**IMPORTANT:** Before writing this service, read the actual table schemas. The column names above are guesses. Check:
```bash
# How does the app currently query profiles?
grep -r "\.from.*profiles" src/ --include="*.jsx" | grep "select" | head -10
# How does the app query teams?
grep -r "\.from.*teams" src/ --include="*.jsx" | grep "select" | head -10
# How does the app query events?
grep -r "\.from.*events" src/ --include="*.jsx" | grep "select" | head -10
# How does the app query registrations?
grep -r "\.from.*registrations" src/ --include="*.jsx" | grep "select" | head -10
```

Use the exact column names from the existing queries. Adjust the joins to match what already works.

**Commit:** `git add -A && git commit -m "phase 1: global search service — queries players, parents, teams, seasons, events, registrations"`

---

## PHASE 2: Build the Search UI — Command Palette

### Step 2.1: Create the search component

Create: `src/components/layout/GlobalSearch.jsx`

This is a command palette / spotlight search — like Cmd+K on Mac or Ctrl+K on Windows. It opens as a modal overlay.

```jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { globalSearch } from '../../lib/searchService';

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Keyboard shortcut: Cmd/Ctrl + K to open
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await globalSearch(query);
      setResults(res);
      setSelectedIndex(0);
      setLoading(false);
    }, 250); // 250ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      navigate(results[selectedIndex].path);
      setIsOpen(false);
    }
  };

  const handleSelect = (result) => {
    navigate(result.path);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
        onClick={() => setIsOpen(false)}
      />

      {/* Search Modal */}
      <div className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-[640px] z-[201]">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">

          {/* Search Input */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
            <span className="text-slate-400 text-lg">🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search players, teams, seasons, events..."
              className="flex-1 bg-transparent outline-none text-base font-medium text-slate-800 placeholder:text-slate-400"
            />
            {loading && <span className="text-slate-400 text-sm animate-pulse">Searching...</span>}
            <kbd className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-bold text-slate-400 bg-slate-100 rounded-md border border-slate-200">ESC</kbd>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto">
            {query.length < 2 && (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">
                Type at least 2 characters to search...
              </div>
            )}

            {query.length >= 2 && results.length === 0 && !loading && (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">
                No results found for "{query}"
              </div>
            )}

            {results.length > 0 && (
              <div className="py-2">
                {/* Group results by type */}
                {['player', 'parent', 'team', 'season', 'event', 'registration'].map(type => {
                  const typeResults = results.filter(r => r.type === type);
                  if (typeResults.length === 0) return null;

                  const typeLabels = {
                    player: 'Players',
                    parent: 'Parents',
                    team: 'Teams',
                    season: 'Seasons',
                    event: 'Events',
                    registration: 'Registrations',
                  };

                  return (
                    <div key={type}>
                      <div className="px-5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {typeLabels[type]}
                      </div>
                      {typeResults.map((result) => {
                        const globalIndex = results.indexOf(result);
                        return (
                          <div
                            key={`${result.type}-${result.id}`}
                            onClick={() => handleSelect(result)}
                            className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors ${
                              globalIndex === selectedIndex
                                ? 'bg-lynx-sky/10 text-lynx-sky'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <span className="text-lg w-8 text-center">{result.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm truncate">
                                {result.title}
                              </div>
                              <div className="text-xs text-slate-400 truncate">
                                {result.subtitle}
                              </div>
                            </div>
                            <span className="text-slate-300 text-xs">→</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-2.5 border-t border-slate-100 flex items-center gap-4 text-[10px] text-slate-400 font-medium">
            <span>↑↓ Navigate</span>
            <span>↵ Open</span>
            <span>ESC Close</span>
            <span className="ml-auto">⌘K to search anytime</span>
          </div>
        </div>
      </div>
    </>
  );
}
```

### Step 2.2: Export a trigger button component

Also export a small search trigger that can be placed in the sidebar or header:

```jsx
export function SearchTrigger({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-400 hover:border-lynx-sky hover:text-lynx-sky transition-all w-full"
    >
      <span>🔍</span>
      <span className="flex-1 text-left">Search...</span>
      <kbd className="text-[10px] font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">⌘K</kbd>
    </button>
  );
}
```

**Commit:** `git add -A && git commit -m "phase 2: global search UI — command palette with keyboard navigation"`

---

## PHASE 3: Integrate Into the App

### Step 3.1: Add GlobalSearch to the main app layout

```bash
# Find the main layout wrapper
grep -r "MainApp\|AppLayout\|LynxSidebar" src/ --include="*.jsx" -l | head -10
cat src/components/layout/LynxSidebar.jsx | head -30
```

Add the `GlobalSearch` component to the root layout so it's available on every page:

```jsx
import GlobalSearch from '../components/layout/GlobalSearch';

// In the main layout render:
<>
  <LynxSidebar />
  <div className="main-content">
    {/* pages */}
  </div>
  <GlobalSearch />
</>
```

### Step 3.2: Add search trigger to the sidebar

In the sidebar, add a search icon near the top (below the logo, above the nav icons):

```bash
cat src/components/layout/LynxSidebar.jsx
```

Add a search icon that opens the global search:

```jsx
<div
  className="sidebar-icon"
  onClick={() => document.dispatchEvent(new CustomEvent('open-global-search'))}
  title="Search (⌘K)"
>
  🔍
</div>
```

Then in GlobalSearch, also listen for this custom event:
```jsx
useEffect(() => {
  const handler = () => setIsOpen(true);
  document.addEventListener('open-global-search', handler);
  return () => document.removeEventListener('open-global-search', handler);
}, []);
```

### Step 3.3: Add search bar to the header area

On pages that have the filter bar (admin dashboard, inner pages), add a compact search trigger next to the filters:

```bash
grep -r "SeasonFilterBar\|GlobalFilter" src/components/ --include="*.jsx" -l | head -5
cat [found file]
```

Add the `SearchTrigger` button to the right side of the filter bar:

```jsx
<div className="flex items-center gap-3">
  {/* existing filter dropdowns */}
  <div className="ml-auto w-48">
    <SearchTrigger onClick={() => document.dispatchEvent(new CustomEvent('open-global-search'))} />
  </div>
</div>
```

**Commit:** `git add -A && git commit -m "phase 3: global search integrated — sidebar icon, header trigger, Cmd+K shortcut"`

---

## PHASE 4: Polish + Quick Navigation

### Step 4.1: Add quick navigation shortcuts

When the search is open with an empty query, show quick navigation links:

```jsx
{query.length < 2 && (
  <div className="py-2">
    <div className="px-5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
      Quick Navigation
    </div>
    {[
      { icon: '📊', title: 'Dashboard', path: '/dashboard' },
      { icon: '👥', title: 'Teams', path: '/teams' },
      { icon: '📅', title: 'Schedule', path: '/schedule' },
      { icon: '💰', title: 'Payments', path: '/payments' },
      { icon: '📋', title: 'Registrations', path: '/registrations' },
      { icon: '👕', title: 'Jerseys', path: '/jerseys' },
      { icon: '💬', title: 'Chat', path: '/chat' },
      { icon: '⚙️', title: 'Settings', path: '/settings' },
    ].map(item => (
      <div
        key={item.path}
        onClick={() => { navigate(item.path); setIsOpen(false); }}
        className="flex items-center gap-3 px-5 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
      >
        <span className="text-lg w-8 text-center">{item.icon}</span>
        <span className="text-sm font-medium text-slate-600">{item.title}</span>
      </div>
    ))}
  </div>
)}
```

### Step 4.2: Add recent searches

Store the last 5 searches in localStorage:

```jsx
const [recentSearches, setRecentSearches] = useState(() => {
  try {
    return JSON.parse(localStorage.getItem('lynx-recent-searches') || '[]');
  } catch { return []; }
});

const saveRecentSearch = (result) => {
  const updated = [result, ...recentSearches.filter(r => r.id !== result.id)].slice(0, 5);
  setRecentSearches(updated);
  localStorage.setItem('lynx-recent-searches', JSON.stringify(updated));
};
```

Show recent searches when the modal opens with an empty query, below the quick navigation.

### Step 4.3: Result navigation paths

Verify every result type navigates to the correct page. Read the router to confirm paths exist:

```bash
grep -r "Route\|path" src/ --include="*.jsx" | grep -i "player\|team\|season\|schedule\|registration\|payment" | head -20
```

Adjust result paths to match actual routes. Common issues:
- Player profile might be `/roster/:id` not `/players/:id`
- Team detail might be `/teams/:id` or `/team-wall/:id`
- Event detail might need a query param or modal trigger

### Step 4.4: Role-based search results

Admin sees everything. Coach sees their teams + players. Parent sees their children + teams. Player sees their team + teammates.

```jsx
// In the search service, pass the current user's role
export async function globalSearch(query, role, userId) {
  // Admin: no filters
  // Coach: filter teams/players to coach's teams
  // Parent: filter to their children
  // Player: filter to their team
}
```

This is a nice-to-have for now. At minimum, make it work for admin (search everything). Role filtering can be a follow-up.

**Commit:** `git add -A && git commit -m "phase 4: search polish — quick nav, recent searches, verified navigation paths"`

---

## PHASE 5: Verify

```bash
npx tsc --noEmit
npm run build
```

Test:
- [ ] Cmd+K (or Ctrl+K) opens the search modal
- [ ] ESC closes it
- [ ] Clicking the sidebar search icon opens it
- [ ] Typing "Ava" returns player results
- [ ] Typing "Black Hornets" returns team results
- [ ] Typing "Spring" returns season results
- [ ] Arrow keys navigate results
- [ ] Enter opens the selected result
- [ ] Clicking a result navigates to the correct page
- [ ] Quick navigation links work when search is empty
- [ ] No console errors
- [ ] Search works on all dashboards and inner pages

**Commit:** `git add -A && git commit -m "phase 5: global search verified — all entity types, keyboard navigation, correct routing"`

---

## NOTES FOR CC

- **Read existing query patterns before writing the search service.** The column names in Phase 1 are approximate. Check how the app currently queries profiles, teams, events, etc. and use those exact patterns.
- **The search runs 6 queries in parallel with Promise.all.** This keeps it fast. Each query is limited to 5 results.
- **250ms debounce** prevents spamming Supabase on every keystroke.
- **The search modal is z-[200+]** so it appears above everything including the widget library panel and any other overlays.
- **Cmd+K is the standard keyboard shortcut** for command palettes (Slack, VS Code, Notion, Linear all use it). Users expect this.
- **The quick navigation section** (when search is empty) makes the search modal double as a quick page switcher — useful even without typing a search query.
- **Registration search** is tricky because the search term might match a player name in a joined table. The Phase 1 approach loads recent registrations and filters client-side. This works for small orgs. For large orgs with thousands of registrations, a server-side function would be better — note as follow-up if needed.
