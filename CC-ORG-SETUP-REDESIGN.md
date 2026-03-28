# CC-ORG-SETUP-REDESIGN.md
# Organization Setup Page Redesign — 2-Column Layout + Waiver Flow Fix

## READ FIRST
1. `CC-SPEC-GUARDRAILS.md`
2. `CLAUDE.md`
3. `src/styles/v2-tokens.css`
4. `src/pages/settings/OrganizationPage.jsx` (801 lines)
5. `src/pages/settings/SetupSectionCard.jsx` (103 lines)
6. `src/pages/settings/SetupSectionContent.jsx` (1525 lines)

## SCOPE
Redesign the Organization Setup page from a vertical accordion list into a 2-column layout: fixed left navigation panel with all 16 section cards, scrollable right form panel showing the active section's content. Also fix the waiver selection dead-end and add return-to-setup navigation.

**What changes:** Page layout (vertical → 2-column), section navigation (accordion → left panel click), waiver section UX.
**What stays:** All 16 sections and their form content (SetupSectionContent.jsx internals are NOT modified), all save logic, all data loading, all completion tracking.

---

## ELEMENT PRESERVATION CONTRACT

### All 16 Sections (must all remain accessible):
**Foundation:** Identity & Branding, Contact Information, Sports & Programs, Online Presence, Legal & Waivers
**Operational:** Payment Methods, Fee Structure, Registration Fields, Communication
**Configuration:** Facility & Venues, Staff Roles, Compliance, Notifications, Integrations, Advanced, Data Management

### Per-Section Elements:
- Section icon, title, description, required badge, est. time, completion status (Complete/In Progress/Not Started)
- All form fields inside each section (SetupSectionContent.jsx renders these — DO NOT MODIFY that file's internals)
- Save Changes button per section
- All save/load Supabase functions in OrganizationPage.jsx

### Page-Level Elements:
- Overall progress percentage + progress bar
- Category grouping (Foundation/Operational/Configuration)
- "All changes saved" indicator
- Season filter bar if present

### Modals:
- Any modals triggered from within sections (waiver preview, venue manager, etc.)

---

## PHASE 1: Convert to 2-Column Layout

**File:** `src/pages/settings/OrganizationPage.jsx`
**Edit contract:** Restructure the page layout. Replace the vertical accordion with a 2-column split. Keep all data loading, save logic, and section definitions. SetupSectionCard.jsx will be modified to work as a left-panel nav item. SetupSectionContent.jsx is NOT modified.

### New Layout:
```
┌───────────────────────────────────────────────────────────────────┐
│  Navy Progress Header (keep from previous spec)                   │
│  Organization Setup · X% Complete · progress bar                  │
├───────────────────────────┬───────────────────────────────────────┤
│  LEFT NAV PANEL           │  RIGHT FORM PANEL                     │
│  ~280px, FIXED height     │  flex-1, SCROLLABLE                   │
│  NO scrolling             │                                       │
│                           │  Section Title + Required badge       │
│  ── FOUNDATION ──         │  Section description                  │
│  [■ Identity    ✅]       │                                       │
│  [■ Contact     ✅]       │  ┌─────────────────────────────────┐  │
│  [■ Sports      ⚠️]       │  │  Form fields rendered by        │  │
│  [■ Online      ○ ]       │  │  SetupSectionContent.jsx        │  │
│  [■ Legal       ○ ]       │  │  (scrollable within this panel) │  │
│                           │  │                                 │  │
│  ── OPERATIONAL ──        │  │                                 │  │
│  [■ Payments    ○ ]       │  │                                 │  │
│  [■ Fees        ○ ]       │  │                                 │  │
│  [■ Reg Fields  ○ ]       │  └─────────────────────────────────┘  │
│  [■ Comms       ○ ]       │                                       │
│                           │  [Save Changes]                       │
│  ── CONFIGURATION ──      │                                       │
│  [■ Venues      ○ ]       │                                       │
│  [■ Staff Roles ○ ]       │                                       │
│  [■ Compliance  ○ ]       │                                       │
│  [■ Notifs      ○ ]       │                                       │
│  [■ Integrations○ ]       │                                       │
│  [■ Advanced    ○ ]       │                                       │
│  [■ Data Mgmt   ○ ]       │                                       │
└───────────────────────────┴───────────────────────────────────────┘
```

### A. Left panel — section navigation:

The left panel is a FIXED-HEIGHT column (fits the viewport without scrolling). All 16 sections must fit. This means compact cards:

```jsx
<div className="w-[280px] shrink-0 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
  {/* Category groups */}
  {categories.map(category => (
    <div key={category.name}>
      {/* Category header */}
      <div className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 px-4 pt-4 pb-1">
        {category.name}
      </div>
      
      {/* Section cards */}
      {category.sections.map(section => {
        const status = getSectionStatus(section.key)
        const isActive = expandedSection === section.key
        return (
          <button
            key={section.key}
            onClick={() => setExpandedSection(section.key)}
            className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-all rounded-lg mx-1 ${
              isActive
                ? 'bg-[#4BB9EC]/[0.08] border-l-3 border-l-[#10284C]'
                : 'hover:bg-[#F5F6F8]'
            }`}
          >
            {/* Status indicator */}
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
              status.status === 'complete' ? 'bg-[#22C55E] text-white' :
              status.status === 'partial' ? 'bg-amber-500 text-white' :
              'bg-slate-200 text-slate-400'
            }`}>
              {status.status === 'complete' ? '✓' : status.status === 'partial' ? '!' : ''}
            </span>
            
            <div className="flex-1 min-w-0">
              <div className={`text-xs font-bold truncate ${isActive ? 'text-[#10284C]' : 'text-slate-600'}`}>
                {section.title}
              </div>
            </div>
            
            {/* Required badge */}
            {section.required && (
              <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-red-500/15 text-red-500 shrink-0">
                Req
              </span>
            )}
          </button>
        )
      })}
    </div>
  ))}
</div>
```

The cards must be COMPACT enough that all 16 fit without scrolling. Use:
- `py-2.5` padding (not py-4)
- `text-xs` for section titles (not text-sm)
- No description text in the left panel (descriptions show in the right panel header)
- No est. time in the left panel
- Small status circles (w-5 h-5), not large icon containers

### B. Right panel — active section form:

```jsx
<div className="flex-1 min-w-0 overflow-y-auto px-8 py-6" style={{ maxHeight: 'calc(100vh - 200px)' }}>
  {expandedSection ? (
    <>
      {/* Section header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{activeSection.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-[#10284C]">{activeSection.title}</h2>
              {activeSection.required && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-500/15 text-red-500">Required</span>
              )}
            </div>
            <p className="text-sm text-slate-400">{activeSection.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span>Est. time: {activeSection.estTime}</span>
          <span className={`font-bold ${
            sectionStatus === 'complete' ? 'text-[#22C55E]' : 
            sectionStatus === 'partial' ? 'text-amber-500' : 'text-slate-400'
          }`}>
            {sectionStatus === 'complete' ? '✅ Complete' : sectionStatus === 'partial' ? '⚠️ In Progress' : '○ Not Started'}
          </span>
        </div>
      </div>
      
      {/* Section form content — rendered by SetupSectionContent */}
      <SetupSectionContent
        sectionKey={expandedSection}
        setupData={setupData}
        setSetupData={setSetupData}
        onSave={saveSection}
        saving={saving}
        showToast={showToast}
        organization={organization}
        waivers={waivers}
        setWaivers={setWaivers}
        venues={venues}
        setVenues={setVenues}
        adminUsers={adminUsers}
        tc={tc}
        accent={accent}
      />
    </>
  ) : (
    /* No section selected — show welcome/overview */
    <div className="text-center py-16">
      <div className="text-4xl mb-4">🏢</div>
      <h2 className="text-xl font-extrabold text-[#10284C] mb-2">Select a Section to Configure</h2>
      <p className="text-sm text-slate-400">Start with the Foundation sections — they're required before you can create seasons</p>
    </div>
  )}
</div>
```

### C. Auto-select first incomplete section:

On page load, if no section is selected, auto-select the first section that is NOT complete:
```javascript
useEffect(() => {
  if (!expandedSection) {
    const firstIncomplete = sections.find(s => getSectionStatus(s.key).status !== 'complete')
    if (firstIncomplete) setExpandedSection(firstIncomplete.key)
    else setExpandedSection(sections[0]?.key) // all complete, select first
  }
}, [sections])
```

### D. Remove the old SetupSectionCard accordion rendering:

The old rendering mapped sections into expandable SetupSectionCard components. Replace this with the 2-column layout above. SetupSectionCard.jsx can be left in the codebase but will no longer be imported by OrganizationPage.

### Commit:
```bash
git add src/pages/settings/OrganizationPage.jsx
git commit -m "Phase 1: Org Setup 2-column layout — fixed nav panel + scrollable form"
```

---

## PHASE 2: Fix Waiver Selection Flow

**File:** `src/pages/settings/SetupSectionContent.jsx` (ONLY the Legal & Waivers section rendering, around line 700-800)
**Edit contract:** Fix the waiver section so that existing waivers appear as selectable options AND the "Manage Waivers" navigation preserves the user's place. MINIMAL changes to this file — only touch the waiver rendering block.

### Problem 1: Waivers show as labels but aren't selectable
The waiver section shows "Liability Waiver (Recommended)" etc. but the checkboxes don't toggle or save anything. These should be checkboxes that toggle which waivers are required for the organization.

### Fix:
Find the waiver checkboxes in the Legal & Waivers section. Ensure they are:
- Connected to the `setupData` state (reading from and writing to the correct field)
- Toggleable (clicking checks/unchecks them)
- Saved when "Save Changes" is clicked

If the waivers are loaded from the `waivers` array prop, the checkboxes should toggle a field like `setupData.required_waivers` or similar. Check what field the save function expects.

### Problem 2: "Manage Waivers" sends admin away with no return path

### Fix — Add return navigation:
When "Manage Waivers →" is clicked, instead of navigating away immediately, save the current section context so the admin can return:

**Option A (preferred):** Open the Waivers page in a slide-over panel or modal instead of navigating away. This keeps the admin on the Org Setup page.

**Option B (simpler):** When navigating to the Waivers page, add a URL parameter or localStorage flag so the Waivers page shows a "← Back to Organization Setup" link at the top:

```javascript
// In SetupSectionContent.jsx, when "Manage Waivers" is clicked:
localStorage.setItem('returnToOrgSetup', 'legal')
onNavigate?.('waivers')

// In WaiversPage.jsx, check for the return flag:
const returnSection = localStorage.getItem('returnToOrgSetup')
{returnSection && (
  <button onClick={() => { 
    localStorage.removeItem('returnToOrgSetup')
    onNavigate?.('organization') 
  }} className="flex items-center gap-2 text-sm font-bold text-[#4BB9EC] mb-4">
    ← Back to Organization Setup
  </button>
)}
```

And in OrganizationPage.jsx, on mount, check if there's a return section to auto-expand:
```javascript
useEffect(() => {
  const returnSection = localStorage.getItem('returnToOrgSetup')
  if (returnSection) {
    setExpandedSection(returnSection)
    localStorage.removeItem('returnToOrgSetup')
  }
}, [])
```

### Commit:
```bash
git add src/pages/settings/SetupSectionContent.jsx src/pages/settings/WaiversPage.jsx src/pages/settings/OrganizationPage.jsx
git commit -m "Phase 2: Fix waiver selection toggles + Manage Waivers return navigation"
```

---

## PHASE 3: Polish + Responsive + Verification

**File:** `src/pages/settings/OrganizationPage.jsx`
**Edit contract:** Final polish and responsive behavior.

### Changes:

**A. Responsive:** Below 900px, collapse to single column. Left nav becomes a horizontal scrollable strip at the top, right form takes full width below.

**B. Section transition:** When clicking a new section in the left nav, the right panel should scroll to top smoothly.

**C. Progress update:** When a section's save completes, the left panel status indicator should update immediately (green checkmark appears).

**D. Keyboard navigation:** Tab/arrow keys should move between sections in the left panel. Enter selects a section.

### Verification:
- [ ] Build passes
- [ ] 2-column layout renders: left nav fixed, right form scrollable
- [ ] All 16 sections fit in the left panel without scrolling
- [ ] Clicking a section in left panel shows its form on the right
- [ ] Active section highlighted with sky-blue indicator in left panel
- [ ] Status badges update when a section is saved (Not Started → In Progress → Complete)
- [ ] Required badge shows on mandatory sections
- [ ] First incomplete section auto-selected on page load
- [ ] Overall progress bar in navy header updates correctly
- [ ] All form fields in every section work (type text, select dropdowns, toggles)
- [ ] Save Changes works for every section
- [ ] Waiver checkboxes toggle and save
- [ ] "Manage Waivers" navigates to Waivers page with "Back to Org Setup" link
- [ ] Returning from Waivers page reopens the Legal section
- [ ] Responsive: single column below 900px
- [ ] Dark mode works
- [ ] No console errors on any section

### Commit:
```bash
git add src/pages/settings/OrganizationPage.jsx
git commit -m "Phase 3: Org Setup polish — responsive, section transitions, keyboard nav"
```

---

## FINAL PUSH
```bash
git push origin main
```

## FINAL REPORT
```
## Org Setup Redesign Report
- Phases completed: X/3
- Files modified: OrganizationPage.jsx, SetupSectionContent.jsx (waiver block only), WaiversPage.jsx
- Total lines: +X / -Y
- Build status: PASS/FAIL
- 2-column layout works: YES/NO
- All 16 sections fit without scrolling: YES/NO
- Waiver toggles work: YES/NO
- Return navigation from Waivers page: YES/NO
- All forms save correctly: YES/NO
- Dark mode: YES/NO
```
