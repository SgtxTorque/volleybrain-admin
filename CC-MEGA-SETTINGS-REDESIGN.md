# CC-MEGA-SETTINGS-REDESIGN.md
# Mega Spec: Settings Pages Visual Redesign

## READ FIRST
1. `CC-SPEC-GUARDRAILS.md`
2. `CLAUDE.md`
3. `src/styles/v2-tokens.css`
4. All files in `src/pages/settings/`

## SCOPE
Visual redesign of ALL settings pages to match the Lynx V2 premium feel. These are the admin's configuration pages — they should feel as polished as the operational pages. No new features. No data changes. Every form field, save button, modal, and toggle must survive.

## GLOBAL DESIGN DIRECTION FOR SETTINGS

Settings pages share a different energy than operational pages. They're not about scanning data — they're about configuring and completing setup tasks. The design language should feel:

- **Clean and focused.** One task at a time. Expandable sections keep the page from overwhelming.
- **Progress-oriented.** Show the admin how complete their setup is. Progress bars, completion badges, "X of Y done" indicators.
- **Grouped by purpose.** Foundation settings first, then operational, then advanced/config.
- **Forms should feel premium.** V2-styled inputs (rounded-xl, proper focus rings, labels above), not browser defaults. Save buttons in navy or sky, not gray.
- **Cards over dividers.** Each section is a card, not a horizontal rule between form groups.
- **Navy accent header** on pages that have an overall status (Organization Setup → overall completion %, Seasons → season health).

### Shared Settings Patterns:
- **Section cards:** rounded-[14px], white bg, subtle border, expandable with smooth transition. Status badge (Complete/In Progress/Not Started) with green/amber/gray coloring. Click-to-expand with chevron rotation.
- **Form inputs:** `rounded-xl px-4 py-2.5 text-sm font-medium border border-[#E8ECF2] focus:border-[#4BB9EC] focus:ring-2 focus:ring-[#4BB9EC]/10` — consistent across ALL settings forms.
- **Form labels:** `text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5` — above the input, not inline.
- **Save buttons:** `bg-[#10284C] text-white font-bold px-6 py-2.5 rounded-xl hover:brightness-110` — primary action. Secondary: `bg-[#F5F6F8] text-[#10284C] border border-[#E8ECF2]`.
- **Toggle switches:** Replace any checkbox toggles with proper switch UI (sky when on, gray when off).
- **Select dropdowns:** Same V2 styling as SeasonFilterBar selects.
- **Dark mode:** All elements must support isDark conditionals.

---

## ELEMENT PRESERVATION CONTRACT (applies to ALL phases)

**For every settings page:** Every form field, save/cancel button, modal, dropdown, toggle, checkbox, textarea, file upload, and action trigger must survive. They can be restyled and repositioned. They cannot be removed or disconnected. If a page has inline modals (like SeasonFormModal), do NOT touch the modal internals — only restyle the page that hosts them. All Supabase save/load functions are off-limits.

---

## PHASE 1: Organization Setup Page
**Files:** `src/pages/settings/OrganizationPage.jsx`, `src/pages/settings/SetupSectionCard.jsx`
**Lines:** 801 + 103

### Current State:
16 expandable sections grouped by Foundation/Operational/Configuration. Progress tracking with completion status per section. Uses SetupSectionCard component.

### Redesign:

**A. Navy progress header:**
```jsx
<div className="bg-[#10284C] rounded-2xl p-6 mb-6">
  <div className="flex items-center justify-between mb-4">
    <div>
      <h2 className="text-xl font-extrabold text-white">Organization Setup</h2>
      <p className="text-sm text-white/50">Configure your organization before creating seasons</p>
    </div>
    <div className="text-right">
      <span className={`text-4xl font-black italic ${overallPercent === 100 ? 'text-[#22C55E]' : 'text-[#4BB9EC]'}`}>
        {overallPercent}%
      </span>
      <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Complete</div>
    </div>
  </div>
  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
    <div className="h-full rounded-full bg-gradient-to-r from-[#4BB9EC] to-[#22C55E]" style={{ width: `${overallPercent}%` }} />
  </div>
  <div className="flex gap-6 mt-3 text-xs font-bold text-white/50">
    <span>● {completedCount} Complete</span>
    <span>● {inProgressCount} In Progress</span>
    <span>● {notStartedCount} Not Started</span>
  </div>
</div>
```

**B. Category headers:**
Instead of plain text, use styled section dividers:
```jsx
<div className="flex items-center gap-3 mt-8 mb-4">
  <span className="text-xs font-black uppercase tracking-widest text-[#4BB9EC]">{categoryName}</span>
  <div className="flex-1 h-px bg-[#E8ECF2]" />
  <span className="text-xs font-bold text-slate-400">{completedInCategory}/{totalInCategory}</span>
</div>
```

**C. SetupSectionCard restyle:**
Update the card to use V2 tokens:
- Card: `rounded-[14px] bg-white border border-[#E8ECF2] shadow-sm overflow-hidden`
- Status badges: green pill for Complete, amber for In Progress, gray for Not Started
- Icon container: `w-12 h-12 rounded-xl bg-[#F5F6F8]` with V2 styling
- Expanded ring: `ring-2 ring-[#4BB9EC]/20` when open
- Chevron: smooth 180° rotation with `transition-transform duration-200`

**D. DO NOT touch SetupSectionContent.jsx** (1525 lines). Only restyle the wrapper card and the page layout. The form contents inside each section stay as-is for this phase.

### Commit:
```bash
git add src/pages/settings/OrganizationPage.jsx src/pages/settings/SetupSectionCard.jsx
git commit -m "Phase 1: Organization Setup — navy progress header, V2 section cards"
```

---

## PHASE 2: Seasons Management Page
**File:** `src/pages/settings/SeasonsPage.jsx` (311 lines)

### Redesign:

**A. Navy header with season overview:**
Show total seasons, active count, and upcoming registration windows.

**B. Season cards:** Each season becomes a rich card:
- Season name (bold) + sport icon + status badge (Active/Draft/Archived)
- Date range, fee summary, registration window
- Player count, team count, collection stats
- Action buttons: Edit, Duplicate, Share Hub, Archive
- Color-coded left border by sport

**C. + Create Season button:** V2 primary button style.

**D. Keep SeasonFormModal untouched** — only restyle the page that hosts the season cards.

### Commit:
```bash
git add src/pages/settings/SeasonsPage.jsx
git commit -m "Phase 2: Seasons — navy header, rich season cards with sport colors"
```

---

## PHASE 3: Waivers Management Page
**File:** `src/pages/settings/WaiversPage.jsx` (307 lines)

### Redesign:

**A. Stat header:** Total waivers, signed %, outstanding count.

**B. Waiver cards:** Each waiver template as a card:
- Waiver name (bold) + version badge
- Signature tracking: "21/38 signed" with progress bar
- Status indicators: green for complete, amber for pending, red for urgent
- Action buttons: Edit, Preview, Send, Track
- Last modified timestamp

**C. + Create Waiver button:** V2 style.

**D. Keep WaiverEditor, WaiverModals, WaiverPreviewModal untouched.**

### Commit:
```bash
git add src/pages/settings/WaiversPage.jsx
git commit -m "Phase 3: Waivers — stat header, waiver template cards with tracking"
```

---

## PHASE 4: Payment Setup Page
**File:** `src/pages/settings/PaymentSetupPage.jsx` (540 lines)

### Redesign:

**A. Tab bar:** Manual Methods | Stripe — V2 pill style tabs.

**B. Manual methods section:** Each payment method (Venmo, Zelle, CashApp) as a clean card with:
- Method icon/logo
- Handle/email input (V2 styled)
- Enable/disable toggle switch
- Test connection button

**C. Stripe section:** Configuration card with:
- Mode toggle (Test/Live) as pill switch
- API key inputs (V2 styled, masked)
- Processing fee display
- Connection status indicator (green dot = connected, red = disconnected)
- Test Connection button

**D. All form inputs use the shared V2 input styling.**

### Commit:
```bash
git add src/pages/settings/PaymentSetupPage.jsx
git commit -m "Phase 4: Payment Setup — V2 tab bar, method cards, styled inputs"
```

---

## PHASE 5: Registration Templates Page
**File:** `src/pages/settings/RegistrationTemplatesPage.jsx` (415 lines)

### Redesign:

**A. Template cards:** Each registration template as a card:
- Template name (bold) + season association
- Field count, waiver attachment indicator
- Status badge (Active/Draft)
- Action buttons: Edit, Clone, Preview, Delete
- "Used by X seasons" count

**B. + Create Template button:** V2 style.

**C. Keep RegistrationTemplateModal untouched.**

### Commit:
```bash
git add src/pages/settings/RegistrationTemplatesPage.jsx
git commit -m "Phase 5: Registration Templates — template cards with field counts"
```

---

## PHASE 6: Data Export Page
**File:** `src/pages/settings/DataExportPage.jsx` (566 lines)

### Redesign:

**A. Export category cards:** Each export category (Players, Families, Payments, Teams, etc.) as a card:
- Category icon + name (bold)
- Row count ("142 records available")
- Format options (CSV/JSON) as toggle pills
- Season filter dropdown (V2 styled)
- Export button per category
- Last exported timestamp

**B. Progress indicator** when export is running (loading bar within the card).

**C. Bulk export section** if present.

### Commit:
```bash
git add src/pages/settings/DataExportPage.jsx
git commit -m "Phase 6: Data Export — category cards with row counts and format toggles"
```

---

## PHASE 7: Subscription Page
**File:** `src/pages/settings/SubscriptionPage.jsx` (621 lines)

### Redesign:

**A. Current plan hero card:** Navy background card showing current plan name, price, next billing date. Status badge (Active/Trial/Expired).

**B. Plan comparison grid:** Side-by-side plan cards (Free/Starter/Pro/Enterprise):
- Plan name + price
- Feature list with check/x indicators
- Current plan highlighted with navy border
- Upgrade/Downgrade buttons (V2 styled)
- "Most Popular" badge on recommended plan

**C. Feature comparison table** if present — V2 table styling.

### Commit:
```bash
git add src/pages/settings/SubscriptionPage.jsx
git commit -m "Phase 7: Subscription — plan hero card, comparison grid with feature lists"
```

---

## PHASE 8: Venue Manager Page
**File:** `src/pages/settings/VenueManagerPage.jsx` (298 lines)

### Redesign:

**A. Venue cards:** Each venue as a card:
- Venue name (bold) + address
- Court/field count
- Usage frequency indicator
- Action buttons: Edit, Delete

**B. + Add Venue button:** V2 style.

**C. Map preview** if venue has coordinates (optional enhancement — only if existing code supports it).

### Commit:
```bash
git add src/pages/settings/VenueManagerPage.jsx
git commit -m "Phase 8: Venue Manager — venue cards with V2 styling"
```

---

## FINAL PUSH

After ALL 8 phases pass:
```bash
git push origin main
```

## VERIFICATION PER PHASE
After each phase:
- [ ] `npm run build` passes
- [ ] Only the targeted file(s) appear in `git diff --name-only`
- [ ] Page renders correctly in light mode
- [ ] Dark mode works
- [ ] All form fields still save data
- [ ] All modals still open
- [ ] All action buttons still function
- [ ] V2 font applied throughout
- [ ] rounded-[14px] on all cards
- [ ] No console errors

## FINAL REPORT
```
## Settings Mega Redesign Report
- Phases completed: X/8
- Files modified: [list]
- Total lines: +X / -Y
- Build status: PASS/FAIL
- All 8 settings pages restyled: YES/NO
- All forms still save correctly: YES/NO
- All modals still function: YES/NO
- Dark mode across all pages: YES/NO
```
