# CC-V2-PARENT-KIDCARDS-FIX.md
## Lynx Web Admin — Parent Kid Cards Layout Correction
### The 3-column row goes INSIDE the main column

**Branch:** `main`
**Rule:** This is a layout correction. The kid cards, team buttons, and trophy case must all sit in ONE horizontal row INSIDE the main content column. Build-verify-commit.

---

## WHAT WENT WRONG

The 3-column grid (`grid-template-columns: 1fr 160px 220px`) was placed at the wrong level. It needs to be INSIDE the `mainContent` prop of `V2DashboardLayout`, not competing with the layout's own grid.

The current V2DashboardLayout already has a 2-column structure: main column (left, flexible) + side column (right, 340px). Everything inside `mainContent` renders in the left column. Everything inside `sideContent` renders in the right column.

The kid cards 3-column row must live entirely within `mainContent`. The Trophy Case should NOT be in `sideContent` — move it inline with the kid cards.

Also: the Team Chat and Team Hub buttons are completely missing. They were either not built or got lost. They must appear.

---

## SCOPE

### DO touch:
- `src/pages/roles/ParentDashboard.jsx` (move layout, wire buttons)

### DO NOT touch:
- `src/components/v2/parent/KidCards.jsx` (the card component itself is fine)
- `src/components/v2/V2DashboardLayout.jsx` (do NOT change the layout component)
- Any other dashboard page
- Any shared component, context, hook, or service layer

---

## THE FIX

Open `src/pages/roles/ParentDashboard.jsx`. Find where the mainContent is assembled (everything passed to `V2DashboardLayout`'s `mainContent` prop).

### Step 1: Remove Trophy Case / Milestone from sideContent

Find the `sideContent` prop of V2DashboardLayout. The trophy case / milestone card / "Sister's Progress" card is currently in there. REMOVE it from sideContent. It will move to the 3-column row inside mainContent.

### Step 2: Build the 3-column row inside mainContent

Inside the `mainContent` prop, AFTER the HeroCard and BEFORE the AttentionStrip, add this block:

```jsx
{/* MY PLAYERS ROW — 3 columns: cards | team buttons | trophy case */}
<div style={{
  display: 'grid',
  gridTemplateColumns: '1fr 150px 200px',
  gap: 14,
  alignItems: 'stretch',
  minHeight: 220,
}}>

  {/* Column 1: Kid Cards horizontal scroll */}
  <div style={{ minWidth: 0, overflow: 'hidden' }}>
    <KidCards
      children={mappedChildren}
      selectedChildId={selectedChildId}
      onChildSelect={setSelectedChildId}
      onViewProfile={(playerId) => appNavigate('player-profile', { playerId })}
      onViewPlayerCard={(playerId) => appNavigate('player', { playerId })}
    />
  </div>

  {/* Column 2: Team Action Buttons — stacked, fill height */}
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
    <button
      onClick={() => {
        const child = mappedChildren.find(c => c.id === selectedChildId) || mappedChildren[0];
        if (child?.teamId) appNavigate('chats');
      }}
      style={{
        flex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 6,
        padding: '16px 12px',
        borderRadius: 14,
        border: 'none',
        background: 'var(--v2-navy)',
        color: 'white',
        fontSize: 13,
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily: 'var(--v2-font)',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--v2-midnight)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--v2-navy)'}
    >
      <span style={{ fontSize: 22 }}>💬</span>
      Team Chat
    </button>

    <button
      onClick={() => {
        const child = mappedChildren.find(c => c.id === selectedChildId) || mappedChildren[0];
        if (child?.teamId) appNavigate('teamwall', { teamId: child.teamId });
      }}
      style={{
        flex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 6,
        padding: '16px 12px',
        borderRadius: 14,
        border: 'none',
        background: 'var(--v2-navy)',
        color: 'white',
        fontSize: 13,
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily: 'var(--v2-font)',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--v2-midnight)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--v2-navy)'}
    >
      <span style={{ fontSize: 22 }}>🏟️</span>
      Team Hub
    </button>
  </div>

  {/* Column 3: Trophy Case & XP Preview */}
  <div
    onClick={() => appNavigate('achievements')}
    style={{
      background: 'linear-gradient(145deg, var(--v2-navy) 0%, var(--v2-midnight) 100%)',
      borderRadius: 14,
      padding: 18,
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden',
      cursor: 'pointer',
    }}
  >
    {/* Ambient glow */}
    <div style={{
      position: 'absolute', top: -30, right: -30,
      width: 120, height: 120,
      background: 'radial-gradient(circle, rgba(255,215,0,0.08) 0%, transparent 70%)',
      pointerEvents: 'none',
    }} />

    <div>
      <div style={{ fontSize: 24, marginBottom: 6 }}>🏆</div>
      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 2 }}>
        {xpData?.tierName || 'Bronze'} Tier
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
        Level {xpData?.level || 1}
      </div>
    </div>

    {/* Badge preview */}
    <div style={{ display: 'flex', gap: 5, margin: '10px 0' }}>
      {(childAchievements || []).slice(0, 3).map((badge, i) => (
        <div key={i} style={{
          width: 30, height: 30, borderRadius: 8,
          background: 'rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {badge.emoji || '🏅'}
        </div>
      ))}
    </div>

    {/* XP bar */}
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3 }}>
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>XP</span>
        <span style={{ color: 'var(--v2-gold)', fontWeight: 700 }}>
          {(xpData?.currentXp || 0).toLocaleString()} / {(xpData?.xpToNext || 1000).toLocaleString()}
        </span>
      </div>
      <div style={{ width: '100%', height: 5, background: 'rgba(255,215,0,0.15)', borderRadius: 3 }}>
        <div style={{
          height: '100%',
          width: `${Math.min(((xpData?.currentXp || 0) / (xpData?.xpToNext || 1000)) * 100, 100)}%`,
          background: 'linear-gradient(90deg, var(--v2-gold), #FFA500)',
          borderRadius: 3,
        }} />
      </div>
    </div>

    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--v2-gold)', marginTop: 8, letterSpacing: '0.02em' }}>
      TROPHY CASE →
    </div>
  </div>
</div>
```

### Step 3: Make sure sideContent does NOT have the milestone/trophy card

The sideContent should contain:
- Family Balance (FinancialSnapshot)
- Badge Showcase
- The Playbook

That's it. The milestone/trophy card has moved to the 3-column row. If there's a MilestoneCard or "Sister's Progress" card in sideContent, remove it.

### Step 4: Verify the order in mainContent

The mainContent order should be:
1. HeroCard
2. **3-column row (kid cards + team buttons + trophy case)** ← this is new
3. AttentionStrip (if items exist)
4. BodyTabs
5. MascotNudge

### Responsive

Below 900px viewport, the 3-column grid collapses:
```jsx
// Add to the grid container:
// On smaller screens, stack vertically
@media (max-width: 900px) {
  grid-template-columns: 1fr;
}
```

Since this is inline styles, handle it with a container query or a simple width check, or add a CSS class with the media query in v2-tokens.css:

```css
.v2-parent-players-row {
  display: grid;
  grid-template-columns: 1fr 150px 200px;
  gap: 14px;
  align-items: stretch;
  min-height: 220px;
}

@media (max-width: 900px) {
  .v2-parent-players-row {
    grid-template-columns: 1fr;
  }
}
```

Use this class instead of inline grid styles if easier.

---

## Build, verify, commit: `fix(v2): parent kid cards 3-column layout inside main content`

## Push.

---

## VERIFICATION

1. Load `/dashboard` as Parent
2. Below the hero card, you see ONE horizontal row with 3 sections:
   - Left: kid cards scrolling horizontally
   - Middle: Team Chat button (top) + Team Hub button (bottom), both navy, stacked, matching card height
   - Right: Trophy Case dark navy card with tier, badges, XP bar
3. The kid cards do NOT span the full width — they stop to leave room for the buttons and trophy case
4. Team Chat and Team Hub buttons are visible and clickable
5. Trophy Case is clickable and navigates to achievements
6. The right sidebar (340px) shows Family Balance, Badge Showcase, Playbook — NOT the trophy case
7. Switch to Admin/Coach — no regressions
8. No console errors
