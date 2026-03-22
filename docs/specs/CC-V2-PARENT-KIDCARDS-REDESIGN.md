# CC-V2-PARENT-KIDCARDS-REDESIGN.md
## Lynx Web Admin — Parent Kid Cards Redesign
### 3-Column Layout: My Players + Team Actions + Trophy Case

**Branch:** `main`
**Rule:** Build-verify-commit after each fix. Do not touch admin or coach dashboards.

---

## SCOPE BOUNDARIES

### DO touch:
- `src/components/v2/parent/KidCards.jsx` (redesign)
- `src/pages/roles/ParentDashboard.jsx` (layout, data wiring)

### DO NOT touch:
- Any other dashboard page
- Any shared v2 component (TopBar, HeroCard, BodyTabs, etc.)
- Any context, hook, or service layer
- MainApp.jsx, routes.js

---

## THE LAYOUT

The area between the AttentionStrip and the BodyTabs becomes a 3-column row:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  MY PLAYERS  ◄ ►           TEAM CHAT            PARENT TROPHY CASE         │
│  ┌──────────────────┐      ┌──────────────┐     AND XP PREVIEW             │
│  │ [Photo]          │      │              │     ┌──────────────────┐       │
│  │                  │      │  Team Chat   │     │                  │       │
│  │  Player Name     │      │              │     │  🏆 Gold Tier    │       │
│  │  Team (link)     │      └──────────────┘     │  Level 6         │       │
│  │  Sport · Season  │      ┌──────────────┐     │                  │       │
│  │                  │      │              │     │  ████████░░ 60%  │       │
│  │  OVR  Record Next│      │  Team Hub    │     │  1,200 / 2,000   │       │
│  │                  │      │              │     │                  │       │
│  │  🏅 Badge chip   │      └──────────────┘     │  View Trophy     │       │
│  │                  │                           │  Case →          │       │
│  │ [Profile][Player]│                           │                  │       │
│  └──────────────────┘                           └──────────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Grid:**
```css
display: grid;
grid-template-columns: 1fr 160px 220px;
gap: 16px;
align-items: stretch;
```

- **Column 1 (My Players):** Takes remaining space. Kid cards in horizontal scroll. Fixed card size regardless of child count.
- **Column 2 (Team Actions):** Fixed 160px. Two stacked navy buttons filling the column height. Contextual to selected child.
- **Column 3 (Trophy Case):** Fixed 220px. Dark navy card with parent gamification preview.

All three columns match in height.

---

## Fix 1: KidCards Component Redesign

**File:** `src/components/v2/parent/KidCards.jsx`

### Props:

```jsx
KidCards.propTypes = {
  children: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
    photoUrl: PropTypes.string,
    teamName: PropTypes.string,
    teamId: PropTypes.string,
    sportName: PropTypes.string,
    seasonName: PropTypes.string,
    registrationStatus: PropTypes.string,
    avatarGradient: PropTypes.string,
    initials: PropTypes.string,
    overallRating: PropTypes.number,
    record: PropTypes.string,
    nextEvent: PropTypes.string,
    badgeOrStreak: PropTypes.node,
  })).isRequired,
  selectedChildId: PropTypes.string,
  onChildSelect: PropTypes.func,
  onViewProfile: PropTypes.func,
  onViewPlayerCard: PropTypes.func,
};
```

### Card structure (SAME size always, never stretches):

Each card: `min-width: 260px`, `max-width: 300px`, `flex-shrink: 0`

```
┌──────────────────────────────┐
│  [Photo 44px]        [Status]│
│                              │
│  Player Name                 │
│  Team Name                   │
│  Sport · Season              │
│                              │
│  ┌────────┬────────┬───────┐ │
│  │  OVR   │ Record │ Next  │ │
│  │  78    │  3-2   │  Sat  │ │
│  └────────┴────────┴───────┘ │
│                              │
│  🏅 Badge or 🔥 Streak      │
│                              │
│  [Profile]    [Player Card]  │
└──────────────────────────────┘
```

### Photo/Avatar:

If `photoUrl` exists:
```jsx
<img src={child.photoUrl} alt="" style={{
  width: 44, height: 44, borderRadius: 12, objectFit: 'cover'
}} />
```
Otherwise: gradient circle with initials.

### Status pill (top-right, absolute):
- active/rostered: green bg `#DCFCE7`, text `#166534`
- pending: amber bg `#FEF3C7`, text `#92400E`
- approved: blue bg `#DBEAFE`, text `#1E40AF`

### Stats row — OVR replaces Attendance:
```jsx
{ value: child.overallRating || '—', label: 'OVR' },
{ value: child.record || '—', label: 'RECORD' },
{ value: child.nextEvent || '—', label: 'NEXT' },
```

### Action buttons — BOTH navy Lynx branded:
```jsx
<div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
  <button onClick={(e) => { e.stopPropagation(); onViewProfile?.(child.id); }}
    style={{
      flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none',
      background: 'var(--v2-navy)', color: 'white',
      fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--v2-font)',
    }}>
    Profile
  </button>
  <button onClick={(e) => { e.stopPropagation(); onViewPlayerCard?.(child.id); }}
    style={{
      flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none',
      background: 'var(--v2-navy)', color: 'white',
      fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--v2-font)',
    }}>
    Player Card
  </button>
</div>
```

Hover: `background: var(--v2-midnight)`

### Horizontal scroll (always, even for 1 card):

Section header: "MY PLAYERS" (11px uppercase muted weight 700) + arrow buttons (28px navy circles, white chevrons, only if scrollable).

```jsx
const scrollRef = useRef(null);
const [canScrollLeft, setCanScrollLeft] = useState(false);
const [canScrollRight, setCanScrollRight] = useState(false);

useEffect(() => {
  handleScroll();
  window.addEventListener('resize', handleScroll);
  return () => window.removeEventListener('resize', handleScroll);
}, [children]);

const handleScroll = () => {
  const el = scrollRef.current;
  if (!el) return;
  setCanScrollLeft(el.scrollLeft > 0);
  setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
};

const scrollBy = (direction) => {
  scrollRef.current?.scrollBy({ left: direction * 300, behavior: 'smooth' });
};
```

### Selected card highlight:

When `selectedChildId === child.id`:
```css
border: 2px solid var(--v2-sky);
background: rgba(75, 185, 236, 0.03);
```

Clicking card body calls `onChildSelect(child.id)`.

**Commit:** `feat(v2): kid cards redesign — fixed size, scroll, navy buttons, OVR`

---

## Fix 2: Parent Dashboard 3-Column Layout

**File:** `src/pages/roles/ParentDashboard.jsx`

### Replace the current KidCards section with the 3-column row:

```jsx
{/* MY PLAYERS + TEAM ACTIONS + TROPHY CASE */}
<div style={{
  display: 'grid',
  gridTemplateColumns: '1fr 160px 220px',
  gap: 16,
  alignItems: 'stretch',
}}>

  {/* Column 1: Kid Cards */}
  <KidCards
    children={mappedChildren}
    selectedChildId={selectedChildId}
    onChildSelect={setSelectedChildId}
    onViewProfile={(playerId) => appNavigate('player-profile', { playerId })}
    onViewPlayerCard={(playerId) => appNavigate('player', { playerId })}
  />

  {/* Column 2: Team Action Buttons — contextual to selected child */}
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
    <button
      onClick={() => {
        const child = mappedChildren.find(c => c.id === selectedChildId) || mappedChildren[0];
        if (child?.teamId) appNavigate('chats');
      }}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 10, padding: '16px 20px', borderRadius: 'var(--v2-radius)', border: 'none',
        background: 'var(--v2-navy)', color: 'white',
        fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--v2-font)',
        letterSpacing: '-0.01em', transition: 'all 0.15s ease',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--v2-midnight)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--v2-navy)'}
    >
      💬 Team Chat
    </button>

    <button
      onClick={() => {
        const child = mappedChildren.find(c => c.id === selectedChildId) || mappedChildren[0];
        if (child?.teamId) appNavigate('teamwall', { teamId: child.teamId });
      }}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 10, padding: '16px 20px', borderRadius: 'var(--v2-radius)', border: 'none',
        background: 'var(--v2-navy)', color: 'white',
        fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--v2-font)',
        letterSpacing: '-0.01em', transition: 'all 0.15s ease',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--v2-midnight)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--v2-navy)'}
    >
      🏟️ Team Hub
    </button>
  </div>

  {/* Column 3: Parent Trophy Case & XP Preview */}
  <div
    onClick={() => appNavigate('achievements')}
    style={{
      background: 'linear-gradient(145deg, var(--v2-navy) 0%, var(--v2-midnight) 100%)',
      borderRadius: 'var(--v2-radius)', padding: 20, color: 'white',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      position: 'relative', overflow: 'hidden', cursor: 'pointer',
    }}
  >
    {/* Ambient glow */}
    <div style={{
      position: 'absolute', top: -40, right: -40, width: 160, height: 160,
      background: 'radial-gradient(circle, rgba(255,215,0,0.08) 0%, transparent 70%)',
      pointerEvents: 'none',
    }} />

    {/* Title */}
    <div>
      <div style={{ fontSize: 28, marginBottom: 8 }}>🏆</div>
      <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.01em', marginBottom: 2 }}>
        {xpData?.tierName || 'Bronze'} Tier
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
        Level {xpData?.level || 1} · Family Progress
      </div>
    </div>

    {/* Badge preview (up to 3) */}
    <div style={{ display: 'flex', gap: 6, margin: '12px 0' }}>
      {(childAchievements || []).slice(0, 3).map((badge, i) => (
        <div key={i} style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {badge.emoji || '🏅'}
        </div>
      ))}
      {(childAchievements?.length || 0) > 3 && (
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)',
        }}>
          +{childAchievements.length - 3}
        </div>
      )}
    </div>

    {/* XP bar */}
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>XP Progress</span>
        <span style={{ color: 'var(--v2-gold)', fontWeight: 700 }}>
          {(xpData?.currentXp || 0).toLocaleString()} / {(xpData?.xpToNext || 1000).toLocaleString()}
        </span>
      </div>
      <div style={{ width: '100%', height: 6, background: 'rgba(255,215,0,0.15)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${Math.min(((xpData?.currentXp || 0) / (xpData?.xpToNext || 1000)) * 100, 100)}%`,
          background: 'linear-gradient(90deg, var(--v2-gold), #FFA500)',
          borderRadius: 3, transition: 'width 0.8s ease',
        }} />
      </div>
    </div>

    {/* CTA */}
    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--v2-gold)', marginTop: 12, letterSpacing: '0.02em' }}>
      VIEW TROPHY CASE →
    </div>
  </div>
</div>
```

### Responsive (below 900px):
```css
@media (max-width: 900px) {
  grid-template-columns: 1fr;
}
```
Team buttons become a horizontal row, trophy case goes full width below.

**Commit:** `feat(v2): parent 3-column layout — kid cards, team actions, trophy case`

---

## Fix 3: Wire OVR Data

**File:** `src/pages/roles/ParentDashboard.jsx`

Add eval query for all children:

```javascript
let childEvals = {};
try {
  const childIds = registrationData.map(c => c.id || c.player_id).filter(Boolean);
  if (childIds.length > 0) {
    const { data: evals } = await supabase
      .from('player_skill_ratings')
      .select('player_id, overall_rating, created_at')
      .in('player_id', childIds)
      .order('created_at', { ascending: false });
    (evals || []).forEach(ev => {
      if (!childEvals[ev.player_id]) childEvals[ev.player_id] = ev.overall_rating;
    });
  }
} catch (err) {
  console.warn('Child eval query failed:', err);
}
```

Map into children:
```jsx
overallRating: childEvals[child.id] || null,
photoUrl: child.photo_url || null,
teamId: child.team_id || child.team_players?.[0]?.team_id || null,
sportName: child.sport_name || null,
seasonName: selectedSeason?.name || null,
```

If `photo_url` isn't in the current player select, expand it. Wrap in try/catch.

**Commit:** `feat(v2): parent kid cards OVR data + photo wiring`

---

## EXECUTION ORDER

1. Fix 1 — KidCards component redesign
2. Fix 2 — 3-column layout in ParentDashboard
3. Fix 3 — OVR data wiring

Build and verify after EACH. Push after all committed.

---

## POST-FIX VERIFICATION

1. Load `/dashboard` as Parent
2. 3-column layout visible: kid cards left, team buttons middle, trophy case right
3. Kid cards are fixed width, horizontal scroll when needed
4. Each card: photo, name, team, sport/season, status pill, OVR/Record/Next, badge, Profile + Player Card buttons (both navy)
5. Click "Profile" → registration profile page
6. Click "Player Card" → player showcase page
7. Select a different kid card → Team Chat and Team Hub buttons update to that child's team
8. Click "Team Chat" → navigates to chats
9. Click "Team Hub" → navigates to team wall
10. Click Trophy Case card → navigates to achievements
11. Single-child: same layout, 1 card, no arrows, buttons still contextual
12. Switch to Admin/Coach → no regressions
13. No console errors
