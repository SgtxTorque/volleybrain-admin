# CC-REGISTRATION-FLOW — Fix & Complete the Parent Registration Experience

**Spec Author:** Claude Opus 4.6
**Date:** March 8, 2026
**Branch:** `main`
**Repo:** `SgtxTorque/volleybrain-admin`
**Mobile Reference:** `SgtxTorque/volleybrain-mobile3` (clone to `/tmp/mobile-ref`)

---

## CONTEXT

Registration is broken. The form preview/link loads to the bottom (confirmation area) instead of showing the actual form fields. Parents literally cannot register. This is the #1 blocker — nothing else matters if parents can't sign up.

The goal: a parent gets a registration link, lands on a beautiful branded form, fills in their child's info, signs waivers, pays, and is done. The admin can also manually add players. The experience must work cross-platform (start on mobile, finish on web, or vice versa).

---

## CRITICAL RULES

1. **Read every file before modifying** — the registration system has existing components. Don't rebuild what works.
2. **Read the mobile app's registration flow** for reference — it works on mobile. Use the same data structures.
3. **Preserve all Supabase data** — registrations, payments, waivers are real data. Don't break existing records.
4. **Commit after each phase**
5. **TSC verify after each phase**

---

## PHASE 0: Audit the Current Registration System

**Do NOT make changes yet. Read and document everything first.**

### Step 0.1: Find all registration-related files

```bash
find src -name "*[Rr]egist*" -type f | sort
find src -name "*[Ww]aiver*" -type f | sort
find src -name "*[Pp]ublic*" -type f | sort
find src -path "*signup*" -type f | sort
```

### Step 0.2: Read the public registration page (the broken one)

```bash
# Find the page that renders when a parent opens a registration link
grep -r "PublicRegistration\|public.*registration\|register/" src/ --include="*.jsx" -l | head -10
cat [found file]
```

Document:
- What URL does it live at? (`/register/:orgSlug/:seasonSlug`? `/public/registration/:id`?)
- What components does it render?
- Where does it scroll to on load?
- What's at the top vs bottom of the page?
- Why is the confirmation section showing instead of the form?

### Step 0.3: Read the form builder / template system

```bash
# The admin creates registration templates (Image 5 from earlier showed this)
find src -path "*template*" -name "*.jsx" | head -10
grep -r "RegistrationTemplate\|FormBuilder\|registration.*form" src/ --include="*.jsx" -l | head -10
```

Document: how does the admin create a registration form? What fields are configurable? How are waivers connected?

### Step 0.4: Read the mobile registration flow

```bash
if [ ! -d /tmp/mobile-ref ]; then
  git clone https://github.com/SgtxTorque/volleybrain-mobile3.git /tmp/mobile-ref
fi

find /tmp/mobile-ref/src -name "*[Rr]egist*" -type f | sort
# Read each file
find /tmp/mobile-ref/src -name "*[Rr]egist*" -type f -exec echo "=== {} ===" \; -exec head -50 {} \;
```

Document: how does the mobile flow work? What steps? What Supabase tables does it write to?

### Step 0.5: Read the Supabase schema for registration

```bash
grep -r "registration\|waiver\|signup" supabase/ --include="*.sql" | head -30
# Also check what tables the existing code queries
grep -roh "\.from(['\"][a-z_]*['\"])" src/ --include="*.jsx" | sort | uniq | grep -i "reg\|waiver\|sign\|form"
```

### Step 0.6: Report findings

Before making ANY changes, report:
1. The URL path for the public registration page
2. Why it's loading at the bottom instead of the top
3. What components exist and what state they're in
4. What the mobile flow does differently
5. What Supabase tables are involved

**Commit:** `git add -A && git commit -m "phase 0: registration audit — documented current state and mobile comparison"`

---

## PHASE 1: Fix the Broken Form — Scroll + Rendering

### Step 1.1: Fix scroll-to-top

The registration page loads scrolled to the bottom. Add scroll-to-top on mount:

```jsx
useEffect(() => {
  window.scrollTo({ top: 0, behavior: 'instant' });
}, []);
```

Add this to the OUTERMOST component of the public registration page. If there are nested route transitions, add it to the route-level component.

### Step 1.2: Fix form fields not rendering

The form shows the confirmation section but not the actual form fields. This is likely one of:

a) **The form state thinks registration is already submitted** — check if there's a `submitted` or `currentStep` state that's defaulting to the last step. Read the component and find the step/state logic.

b) **The form fields component is conditionally rendered based on a query that fails** — check if the form loads field definitions from Supabase (from the registration template) and the query is failing silently. Check console for 400/500 errors.

c) **The form is rendering but below the fold** — the confirmation section takes up the full viewport and the form is below. In this case, the layout needs restructuring.

Read the component carefully, trace the rendering logic from mount through to what actually appears on screen. Fix whatever is causing the form fields to not show.

### Step 1.3: Verify

Open the registration link. The page should:
1. Start at the top
2. Show the registration form fields (not confirmation)
3. Be fillable

**Commit:** `git add -A && git commit -m "phase 1: fix registration form — scroll to top, form fields visible"`

---

## PHASE 2: Complete Registration Form — Full Flow

### Step 2.1: Define the registration flow steps

The complete parent registration flow should be:

**Step 1: Select Season & Program**
- If the link is season-specific (e.g. `/register/blackhornets/spring-2026`), this step is pre-filled
- If it's a general org link, show available seasons/programs to register for
- Show: season name, sport, dates, age groups, fee summary

**Step 2: Player Information**
- Child's first name, last name
- Date of birth
- Gender
- Grade / school (optional based on template)
- Position preference (optional)
- Jersey size preference (optional)
- Player photo upload (optional, encouraged)
- Medical info (allergies, conditions — if template includes it)
- **"Add Another Player" button** for multi-child registration

**Step 3: Parent/Guardian Information**
- Parent name, email, phone
- Address
- Emergency contact (name, phone, relationship)
- If the parent is already logged in: pre-fill from their profile
- If new parent: this becomes their account creation step

**Step 4: Waivers & Agreements**
- Show each required waiver (Liability, Photo/Video Release, Code of Conduct, Medical Release — from the template)
- Each waiver: title + full text (expandable) + checkbox "I agree"
- Digital signature field (if enabled) — simple type-your-name or draw signature
- ALL required waivers must be checked to proceed

**Step 5: Payment**
- Show fee breakdown: registration fee + uniform fee + tournament fee = total
- Payment options based on admin config:
  - Pay in full now (Stripe)
  - Monthly installments (show schedule)
  - Pay later (if admin allows)
- Stripe payment form integration (if Stripe is set up)
- If no payment required: skip this step

**Step 6: Review & Submit**
- Summary of everything entered
- Edit links to jump back to any step
- "Submit Registration" button
- On submit: create the registration record, payment record, waiver signatures in Supabase
- **Success state:** "Welcome to the Den! 🎉" with Lynx branding
  - "Your registration for [Child] in [Season] has been submitted!"
  - If admin approval required: "Your registration is pending approval. We'll notify you when it's confirmed."
  - If auto-approved: "You're all set! Download the Lynx app to stay connected."
  - Links: "Register Another Child" / "Go to Dashboard" (if logged in) / "Download the App"

### Step 2.2: Build the multi-step form

Check if a multi-step form component already exists:
```bash
grep -r "Stepper\|MultiStep\|FormWizard\|step.*form" src/ --include="*.jsx" -l | head -10
```

If it exists, use it. If not, build a simple step container:

```jsx
function RegistrationWizard({ steps, currentStep, onNext, onBack }) {
  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              i < currentStep ? 'bg-emerald-500 text-white' :
              i === currentStep ? 'bg-lynx-sky text-white' :
              'bg-slate-200 text-slate-400'
            }`}>
              {i < currentStep ? '✓' : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 h-0.5 ${i < currentStep ? 'bg-emerald-500' : 'bg-slate-200'}`} />
            )}
          </div>
        ))}
      </div>
      
      {/* Current step content */}
      <div className="max-w-2xl mx-auto">
        {steps[currentStep].content}
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between max-w-2xl mx-auto mt-8">
        {currentStep > 0 && (
          <button onClick={onBack} className="btn btn-ghost">← Back</button>
        )}
        <button onClick={onNext} className="btn btn-navy ml-auto">
          {currentStep === steps.length - 1 ? 'Submit Registration' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
```

### Step 2.3: Build each step component

Read the existing registration form code. Parts of these steps may already be built. Reuse what exists, fix what's broken, build what's missing.

For each step, validate required fields before allowing "Next":
- Step 2 (Player Info): name and DOB required
- Step 4 (Waivers): all required waivers must be checked
- Step 5 (Payment): payment must be completed or "pay later" selected

### Step 2.4: Multi-child registration

After Step 2 (Player Information), offer "Add Another Player" which duplicates the player info section. The parent fills out info for each child, then continues through Steps 3-6 once (parent info, waivers, payment are shared across children).

Store as an array: `players: [{ name, dob, ... }, { name, dob, ... }]`

### Step 2.5: Verify the form renders, all steps work, data submits

**Commit:** `git add -A && git commit -m "phase 2: complete registration wizard — 6 steps, multi-child, waivers, payment"`

---

## PHASE 3: Waiver Integration

### Step 3.1: Read existing waiver system

```bash
find src -name "*[Ww]aiver*" -type f | sort
grep -r "waiver" src/ --include="*.jsx" | grep "from\|select\|supabase" | head -20
```

### Step 3.2: Connect waivers to registration templates

When an admin creates a registration template, they should be able to:
- Select which waivers are required for this template
- Waivers should come from the org's waiver library (the existing waiver management)
- Check if this connection already exists in the template builder

If waivers aren't linkable to templates yet:
- Add a "Required Waivers" section to the template builder
- Show checkboxes for each waiver in the org's library
- Save the waiver IDs as part of the template configuration

### Step 3.3: Render waivers in the registration form

In Step 4 of the registration wizard, query the waivers linked to this registration's template:
```bash
# Find how waivers are stored/linked
grep -r "waiver" supabase/ --include="*.sql" | head -20
```

For each waiver:
- Show the title
- "Read Full Text" expandable section
- Checkbox: "I have read and agree to the [Waiver Name]"
- Digital signature (if applicable): text input for typed name

### Step 3.4: Save waiver signatures on submission

When the registration is submitted, create records in the waiver_signatures table (or equivalent):
```bash
grep -r "waiver_signature\|signature" src/ --include="*.jsx" | grep "from\|insert\|upsert" | head -10
```

**Commit:** `git add -A && git commit -m "phase 3: waivers integrated into registration form and templates"`

---

## PHASE 4: Payment Integration

### Step 4.1: Check existing Stripe integration

```bash
grep -r "stripe\|Stripe\|STRIPE" src/ --include="*.jsx" --include="*.js" --include="*.env*" | head -20
find src -name "*[Pp]ayment*" -o -name "*[Ss]tripe*" | head -10
```

### Step 4.2: Build the payment step

If Stripe is already integrated:
- Reuse the existing payment component in the registration wizard Step 5
- Show the fee breakdown from the season's fee structure
- After successful payment, mark the registration's payment status as "paid"

If Stripe is NOT integrated:
- Show the fee breakdown with "Payment Due: $X"
- Options: "Pay Now" (placeholder for future Stripe) or "Pay Later" (if admin allows)
- "Pay Later" creates the registration with payment status "pending"
- Add a TODO comment noting Stripe needs to be connected

### Step 4.3: Fee breakdown

Query the season's fee structure:
```bash
grep -r "fee\|payment_plan\|registration_fee" src/ --include="*.jsx" | grep "from\|select" | head -20
```

Display:
- Registration fee: $X
- Uniform fee: $X (if applicable)
- Tournament fee: $X (if applicable)
- **Total: $X per player**
- If multi-child: show total for all children

**Commit:** `git add -A && git commit -m "phase 4: payment integration in registration flow"`

---

## PHASE 5: Admin Manual Add + Approval Workflow

### Step 5.1: Admin "Add Player" flow

Admins need to be able to manually register a player (e.g., walk-in at a practice):

```bash
grep -r "Add Player\|add.*player\|manual.*register" src/ --include="*.jsx" -l | head -10
```

Check if this exists. If so, verify it works. If not, create a simplified version:
- Admin clicks "Add Player" on the Registrations page
- Mini-form: player name, DOB, parent email (to link), team assignment
- Skips waivers and payment (admin handles those separately)
- Creates registration record with status "admin_added"

### Step 5.2: Approval workflow

When admin approval is required for registrations:
```bash
grep -r "approv\|pending.*registration\|registration.*status" src/ --include="*.jsx" | head -20
```

Verify:
- Pending registrations show on the admin Registrations page with "Pending" status
- Admin can click "Approve" or "Deny" 
- Approving moves the player to "approved" status and creates roster assignment
- Denying sends a notification to the parent (if notification system exists)

### Step 5.3: Auto-approval option

If the season is configured for auto-approval:
- Registration is immediately approved on submission
- Player is added to the roster automatically (if team is specified)
- Parent gets a confirmation, not a "pending" message

Check if this toggle exists in the season settings. If not, note as follow-up.

**Commit:** `git add -A && git commit -m "phase 5: admin manual add + approval workflow verified"`

---

## PHASE 6: Lynx Branding + Polish

### Step 6.1: Brand the registration page

The registration page is public-facing — it's the FIRST thing a new parent sees. It must look premium.

- **Header:** Lynx logo + org name (e.g. "Black Hornets Athletics")
- **Page title:** "Join the Den!" or "Register for [Season Name]" in large branded text
- **Background:** light Lynx pattern or clean white with navy accents
- **Form cards:** clean white cards with `rounded-[14px]` and `border-slate-200` — match the rest of the app
- **Buttons:** navy for primary ("Next", "Submit"), ghost for secondary ("Back")
- **Step indicator:** Lynx sky blue for active step, emerald for completed
- **Success state:** Lynx mascot celebrating, confetti colors, "Welcome to the Den!" headline
- **Font:** Inter (not a separate font for the public page)
- **No generic "Registration Form" header** — use warm, inviting Lynx copy throughout

### Step 6.2: Mobile-responsive

The registration form MUST work on mobile browsers (parents might get a link on their phone):
- Single-column form layout
- Large touch targets (44px minimum)
- Inputs should be full-width
- Step indicator should be compact on mobile

### Step 6.3: Registration link format

Verify the URL format:
```bash
grep -r "register\|registration" src/ --include="*.jsx" | grep "Route\|path" | head -10
```

The link should be clean and shareable:
- `https://thelynxapp.com/register/[org-slug]/[season-slug]`
- Or: `https://login.thelynxapp.com/register/[registration-id]`

Whatever the current format is, make sure it works when shared via text/email.

**Commit:** `git add -A && git commit -m "phase 6: registration page — Lynx branded, mobile responsive, clean URL"`

---

## PHASE 7: Cross-Platform Data Compatibility

### Step 7.1: Verify web and mobile write to the same tables

```bash
# Compare web registration writes
grep -r "insert\|upsert" src/pages/registrations/ --include="*.jsx" | head -20
grep -r "insert\|upsert" src/ --include="*.jsx" | grep -i "registr" | head -20

# Compare mobile registration writes
grep -r "insert\|upsert" /tmp/mobile-ref/src/ --include="*.jsx" --include="*.tsx" | grep -i "registr" | head -20
```

Both platforms must write to the SAME tables with the SAME column structure. A registration started on mobile should be visible on web and vice versa.

### Step 7.2: Verify registration shows up everywhere

After a test registration:
- Admin Registrations page shows the new registration
- Parent dashboard shows the child's team info
- Coach roster shows the new player
- Season Journey tracker updates registration count

**Commit:** `git add -A && git commit -m "phase 7: cross-platform registration data compatibility verified"`

---

## PHASE 8: Full End-to-End Test

Walk through the COMPLETE flow:

### Test 1: Parent registers via web link
1. Open registration link (not logged in)
2. Form loads at the TOP with actual fields
3. Fill in player info for one child
4. Fill in parent info
5. Sign all waivers
6. Complete payment (or select pay later)
7. Submit → success screen with "Welcome to the Den!"
8. Check admin Registrations page → new registration visible
9. Admin approves → player shows on roster

### Test 2: Multi-child registration
1. Start registration, add first child
2. Click "Add Another Player"
3. Fill in second child
4. Complete parent info, waivers, payment (for both children)
5. Submit → both registrations created
6. Both appear on admin page

### Test 3: Admin manual add
1. Admin clicks "Add Player" on Registrations page
2. Fills in player name + parent email
3. Submits → player added with "admin_added" status
4. Player appears on roster

### Test 4: Cross-platform
1. Start registration on mobile (if possible) — verify it saves
2. Check web admin — registration should be visible
3. Or: register on web, check mobile app — child should appear

Report results for each test. Fix any failures.

```bash
npx tsc --noEmit
npm run build
```

**Commit:** `git add -A && git commit -m "phase 8: registration end-to-end tests passed"`

---

## NOTES FOR CC

- **Phase 0 (audit) is mandatory.** Do NOT skip it. The registration system has existing components — you need to understand what exists before fixing it. Report your findings before making changes.
- **The form loading at the bottom is the #1 fix.** This might be a simple `scrollTo(0,0)` or it might be a component rendering issue where the form section is hidden/collapsed.
- **Waivers and payments may not be fully built yet.** That's OK — build what you can, stub what you can't. At minimum, the form must render, accept player info, and submit a registration record.
- **The registration page is PUBLIC.** It doesn't require login (new parents don't have accounts yet). Authentication should happen AFTER submission (create account) or be optional (register without account, link later).
- **Read the mobile app's registration flow.** It works. The web flow should produce the same data in the same tables.
- **Lynx branding on the registration page is critical.** This is the first impression for new families. It must look premium, not like a generic Google Form.
