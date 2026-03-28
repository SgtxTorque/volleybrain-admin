# CC-PLAYER-PROFILE-REDESIGN.md
# Player Profile Page — Two-Column Redesign
## Repo: SgtxTorque/volleybrain-admin | Branch: main

---

## OBJECTIVE

Redesign the Player Profile page (`/parent/player/:playerId/profile`) from a vertical scrolling layout to a fixed two-column layout that requires zero scrolling. Left column is the player photo gallery. Right column is the name banner + tabbed info. Everything fits in one viewport.

---

## GUARDRAILS

- **Read before modify.** Open every file listed before changing it.
- **Do not change save handlers.** All Supabase save/update logic stays exactly as-is. We are only changing the visual layout and adding photo management UI.
- **Do not change tab component internals.** PlayerProfileInfoTab, PlayerProfileUniformTab, PlayerProfileMedicalTab, PlayerProfileHistoryTab, and PlayerProfileWaivers stay as separate files. We are changing how they render inside the page, not their internal markup. Exception: InfoRow spacing may need tightening.
- **Fit in one viewport.** The final layout must work without scrolling at 1080p (1920x1080). If content overflows on smaller tabs (like Registration with many fields), the right column gets a contained scroll — but the page frame itself stays fixed.
- **Write report to:** `CC-PLAYER-PROFILE-REDESIGN-REPORT.md` in the project root.
- **Commit after each phase.**

---

## DESIGN VISION

```
┌──────────────────────────────────────────────────────────────────────┐
│ Two-column, full viewport height, no page scroll                     │
│                                                                      │
│  LEFT COLUMN (fixed ~360px)     RIGHT COLUMN (fills remaining)       │
│  ┌─────────────────────────┐    ┌──────────────────────────────────┐ │
│  │                         │    │  BLACK HORNETS ELITE             │ │
│  │    PRIMARY PHOTO        │    │  AVA                             │ │
│  │    (large, fills        │    │  TEST                            │ │
│  │     column width)       │    │  #1 · S · ASSIGNED               │ │
│  │                         │    ├──────────────────────────────────┤ │
│  │                         │    │  Registration │ Uniform │ Med... │ │
│  ├─────────────────────────┤    ├──────────────────────────────────┤ │
│  │  [+] [photo2] [photo3]  │    │                                  │ │
│  │  optional gallery slots  │    │   Tab content (scrolls within   │ │
│  └─────────────────────────┘    │   this container if needed)      │ │
│                                 │                                  │ │
│                                 └──────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

---

## PHASE 1: Two-Column Layout

### File: `src/pages/parent/PlayerProfilePage.jsx`

**Step 1.1:** Read the file completely. Understand the current structure:
- PageShell wrapper with breadcrumb
- Dark gradient hero banner (trading card style)
- Tab bar + tab content in a card below

**Step 1.2:** Replace the entire render section (from `return` to end) with a two-column layout. Remove PageShell — this page needs a custom layout that fills the viewport, not PageShell's padded wrapper.

**New layout structure:**

```jsx
return (
  <div className="flex h-[calc(100vh-var(--v2-topbar-height))] overflow-hidden" style={{ fontFamily: 'var(--v2-font)' }}>
    
    {/* LEFT COLUMN — Photo Gallery */}
    <div className="w-[360px] flex-shrink-0 flex flex-col p-5 gap-4">
      
      {/* Primary Photo */}
      <div className="flex-1 relative rounded-[14px] overflow-hidden bg-slate-100 group cursor-pointer"
        onClick={() => { /* trigger photo upload for primary */ }}>
        {player.photo_url ? (
          <img src={player.photo_url} alt={player.first_name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center">
              <Camera className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-400">Add a player photo</p>
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
          <span className="text-white font-semibold text-sm">Change Photo</span>
        </div>
      </div>
      
      {/* Optional Gallery Slots (3 slots) */}
      <div className="flex gap-3">
        {[0, 1, 2].map(idx => {
          const photoUrl = player.gallery_photos?.[idx] || null
          return (
            <div key={idx} className="flex-1 aspect-square rounded-[10px] overflow-hidden bg-slate-100 cursor-pointer group relative"
              onClick={() => { /* trigger photo upload for gallery slot idx */ }}>
              {photoUrl ? (
                <>
                  <img src={photoUrl} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">Change</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-slate-300 text-2xl">+</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {/* Set as Primary hint */}
      <p className="text-xs text-slate-400 text-center">Click any photo to set as primary</p>
    </div>
    
    {/* RIGHT COLUMN — Name Banner + Tabs */}
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      
      {/* Name Banner — large typography, navy gradient */}
      <div className="rounded-[14px] m-5 mb-0 p-6 overflow-hidden relative" style={{ background: 'linear-gradient(90deg, #0B1628, #162D50)' }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-wider text-[#4BB9EC]">{primaryTeam?.name || 'No Team'}</p>
          <h1 className="text-4xl font-extrabold text-white tracking-tight leading-none mt-1" style={{ letterSpacing: '-0.03em' }}>
            {player.first_name?.toUpperCase()}
          </h1>
          <h1 className="text-4xl font-extrabold text-white tracking-tight leading-none" style={{ letterSpacing: '-0.03em' }}>
            {player.last_name?.toUpperCase()}
          </h1>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {assignedJersey && <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/10 text-white/70">#{assignedJersey}</span>}
            {player.position && <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/10 text-white/70">{player.position}</span>}
            <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
              player.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
            }`}>{player.status === 'active' ? 'Active' : player.status || 'Pending'}</span>
          </div>
        </div>
      </div>
      
      {/* Tab Bar */}
      <div className={`mx-5 mt-4 flex border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
              activeTab === tab.id ? 'border-[#4BB9EC] text-[#4BB9EC]' : `border-transparent text-slate-400 hover:text-slate-600`
            }`}>
            <span>{tab.icon}</span><span>{tab.label}</span>
          </button>
        ))}
      </div>
      
      {/* Tab Content — scrollable within this container */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {activeTab === 'info' && (
          <PlayerProfileInfoTab ... /> 
        )}
        {/* ... other tabs same as before */}
      </div>
    </div>
  </div>
)
```

The above is the structural direction, NOT copy-paste code. Adapt it to work with the existing state, props, and tab components. Keep all the existing tab rendering logic — just move it into this two-column frame.

**Step 1.3:** Import Camera icon from the icons constants if not already imported.

**Step 1.4:** Verify build compiles.

**Commit:** `redesign: PlayerProfilePage two-column layout — photo gallery left, name banner + tabs right`

---

## PHASE 2: Photo Upload & Gallery Management

### File: `src/pages/parent/PlayerProfilePage.jsx`

**Step 2.1:** Add photo upload functionality. Create a hidden `<input type="file">` ref and trigger it on click.

**Step 2.2:** On file selection:
1. Upload the image to Supabase Storage (bucket: `player-photos` or whatever bucket is already configured — check if a bucket already exists by searching the codebase for `supabase.storage` references)
2. Get the public URL
3. Update the player record:
   - For primary photo: update `players.photo_url`
   - For gallery photos: update `players.gallery_photos` (JSON array of up to 3 URLs)

**Step 2.3:** Check if `gallery_photos` column exists on the `players` table. Search `SUPABASE_SCHEMA.md` or `SCHEMA_REFERENCE.csv`. If it does NOT exist, note this in the report and use a placeholder approach:
- Store gallery photos in `players.metadata` JSON field if it exists
- Or skip gallery upload for now and just wire the UI with empty slots + "coming soon" on click
- Do NOT create database migrations

**Step 2.4:** Add "Set as Primary" functionality. When a parent clicks a gallery photo:
- Swap that photo URL into `players.photo_url`
- Move the old primary into the gallery slot
- Save both changes to Supabase

**Step 2.5:** Verify build compiles.

**Commit:** `feat: player photo upload and gallery management`

---

## PHASE 3: Tighten Tab Content for No-Scroll

### Files: Tab components

The tab content needs to fit within the right column's scrollable area without feeling wasteful. The current tab components use generous spacing that was designed for a full-width vertical layout. Tighten them for the constrained right column.

**Step 3.1:** Read each tab component. For each one:

**PlayerProfileInfoTab.jsx:**
- Change section heading margins from `mb-4` to `mb-2`
- InfoRow already uses compact `py-3` — this is fine
- In edit mode, reduce grid gaps from `gap-4` to `gap-3`
- Consider: Can "Player Information" and "Address" be rendered side-by-side in 2 columns instead of stacked? If the right column is wide enough (~700px+), use a 2-column grid for the read-only info rows: player info on left, address + parent on right

**PlayerProfileMedicalTab.jsx:**
- Emergency Contact and Medical Info can fit side-by-side in the wider right column
- Use `grid grid-cols-2 gap-4` to place them next to each other instead of stacked

**PlayerProfileUniformTab.jsx:**
- Jersey preferences and uniform sizes can fit side-by-side

**PlayerProfileHistoryTab.jsx:**
- This tab is already compact. No changes likely needed.

**PlayerProfileWaivers.jsx (309 lines):**
- Read it and determine if it needs tightening. Waivers can be long. If it overflows, the right column scroll handles it — this is acceptable for waivers.

**Step 3.2:** For the Registration tab specifically, which has the most content: group the read-only view into a denser layout:

```
┌─────────────────────────────┬─────────────────────────────────┐
│ Player Information          │ Address                         │
│ Full Name: Ava Test         │ Street: 123 Space Rd            │
│ DOB: -                      │ City/State/Zip: Little Elm...   │
│ Gender: Female              ├─────────────────────────────────┤
│ Grade: 7                    │ Parent / Guardian               │
│ School: -                   │ Name: Carlos Test               │
│ Position: S                 │ Email: fuentez.carlos@...       │
│ Experience: Intermediate    │ Phone: 5047848458               │
└─────────────────────────────┴─────────────────────────────────┘
```

This eliminates scrolling for the most common tab.

**Step 3.3:** Verify build compiles.

**Commit:** `polish: tighten tab content for two-column no-scroll layout`

---

## PHASE 4: Visual Polish — V2 Treatment

### File: `src/pages/parent/PlayerProfilePage.jsx`

**Step 4.1:** Name banner uses the horizontal navy gradient (`linear-gradient(90deg, #0B1628, #162D50)`) — confirm it's applied per the design spec.

**Step 4.2:** Name typography should be bold and unapologetic:
- First name + last name on separate lines, all caps, `text-4xl` or `text-5xl` depending on viewport
- Team name above in sky blue, small caps tracking
- Pill badges for jersey number, position, status below

**Step 4.3:** Photo column should have:
- Primary photo with subtle rounded corners (14px)
- Hover state on photos showing "Change Photo" overlay
- Empty state with Camera icon + "Add a player photo" text
- Gallery slots with "+" placeholder when empty

**Step 4.4:** Tab bar should be tight — no excess padding. Active tab gets sky blue underline and text color.

**Step 4.5:** Remove any remaining PageShell usage — this page has its own layout now.

**Step 4.6:** Verify build compiles. Test at 1920x1080 — no page scroll should be needed for the Registration and Medical tabs.

**Commit:** `polish: V2 visual treatment for player profile page`

---

## PHASE 5: Verify & Report

**Step 5.1:** `npm run build 2>&1 | tail -20`

**Step 5.2:** Write `CC-PLAYER-PROFILE-REDESIGN-REPORT.md`:

```markdown
# Player Profile Redesign — Build Report

## Completed
- [list changes]

## Photo Upload Status
- Primary photo upload: [working / wired but no bucket / placeholder]
- Gallery photos: [working / column doesn't exist / placeholder]
- Set as primary: [working / placeholder]

## Layout Verification
- Two-column layout: [yes/no]
- No-scroll at 1080p: [yes/no, which tabs overflow if any]
- Name banner typography: [describe]

## Known Limitations
- [any issues]
```

**Commit:** `chore: player profile redesign report`

---

## FILES MODIFIED

| Phase | File | What Changes |
|-------|------|-------------|
| 1 | `src/pages/parent/PlayerProfilePage.jsx` | Complete layout rewrite — two-column, remove PageShell |
| 2 | `src/pages/parent/PlayerProfilePage.jsx` | Photo upload + gallery management |
| 3 | `src/pages/parent/PlayerProfileInfoTab.jsx` | Denser 2-column read-only layout |
| 3 | `src/pages/parent/PlayerProfileMedicalTab.jsx` | Side-by-side emergency + medical |
| 3 | `src/pages/parent/PlayerProfileUniformTab.jsx` | Side-by-side jersey + sizes |
| 4 | `src/pages/parent/PlayerProfilePage.jsx` | V2 visual polish |

---

## WHAT THIS SPEC DOES NOT DO

- Does not change any Supabase save/update logic
- Does not change tab component prop interfaces
- Does not create database migrations
- Does not change the ParentPlayerCardPage (sport stats page)
- Does not change how the page is routed
