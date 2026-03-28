# CC-MEGA-PUBLIC-PAGES-REDESIGN.md
# Mega Spec: Public-Facing Pages Visual Redesign

## READ FIRST
1. `CC-SPEC-GUARDRAILS.md`
2. `CLAUDE.md`
3. `src/styles/v2-tokens.css`
4. `LYNX-UX-PHILOSOPHY.md`

## SCOPE
Visual redesign of all public-facing pages: Landing Page, Login/Signup, Public Registration, Org Directory, and Setup Wizard. These are the FIRST thing anyone sees before they have a Lynx account. They must sell the product, feel premium and trustworthy, and convert visitors into users. No new features. Every form field, auth flow, OAuth button, and registration step must survive.

## GLOBAL DESIGN DIRECTION FOR PUBLIC PAGES

Public pages are about **first impressions and trust**. A parent landing on the registration page needs to feel:
- This is a real, professional platform — not someone's side project
- My data is safe here
- This is easy and I know what to do next

Design language:
- **Hero sections with navy gradients** for impact. The Lynx brand is navy + sky blue.
- **Clean, generous whitespace.** No clutter. Each section earns its space.
- **Clear CTAs.** One primary action per screen. Sky blue or navy buttons, large and obvious.
- **Social proof / trust indicators** where they exist (badge counts, "Trusted by X clubs").
- **Mobile-responsive** from the start — parents register on their phones at the gym.
- **V2 token system** for consistency with the rest of the app.
- **Mascot presence** where appropriate (landing page, setup wizard completion).

## ELEMENT PRESERVATION CONTRACT (applies to ALL phases)

All auth flows (email/password, Google OAuth, Apple OAuth), form fields, registration steps, multi-child flow, waiver signatures, fee calculations, funnel tracking events, invite code entry, and org creation wizard must survive intact. Restyle and reposition only.

---

## PHASE 1: Landing Page
**File:** `src/pages/auth/LandingPage.jsx` (384 lines)

### Current State:
Public marketing page with hero, feature cards, role previews, CTA buttons. Uses inline styles with hardcoded color values.

### Redesign:

**A. Convert inline styles to V2 tokens + Tailwind.** The page currently uses raw `style={{}}` objects with hardcoded hex colors. Convert to Tailwind classes using the V2 token values. Replace `NAVY = '#0B1628'` references with `bg-[#0B1628]` or `var(--v2-midnight)`.

**B. Hero section — premium sports energy:**
- Full-width navy gradient background (`bg-gradient-to-br from-[#0B1628] to-[#10284C]`)
- Lynx logo prominent
- Bold headline: "Youth Sports. Simplified." or current headline — in white, text-5xl font-black italic
- Subtitle in white/60 opacity
- Two CTAs: "Get Started Free" (sky blue, large) + "See How It Works" (outline white)
- Mascot illustration if available (waving lynx)
- Subtle ambient glow effect (radial gradient sky-blue in corner)

**C. Feature cards section:**
- Clean grid (3 columns desktop, 1 mobile)
- Each card: rounded-[14px], white bg, subtle shadow, icon in sky-blue circle, feature title (bold), description
- Cards should feel substantial, not flat

**D. Role preview section** ("Built for Everyone"):
- Role cards (Admin, Coach, Parent, Player) with role icon, brief description
- Clean layout, V2 styling

**E. Footer CTA:**
- Navy background band
- "Ready to simplify your club?" + CTA button
- "No credit card required" trust line

**F. Sticky nav:** Glassmorphic background, Lynx logo, "Early Access" badge, Login / Get Started buttons. Already has scroll detection — keep it, just restyle.

### Commit:
```bash
git add src/pages/auth/LandingPage.jsx
git commit -m "Phase 1: Landing page — premium hero, V2 feature cards, trust indicators"
```

---

## PHASE 2: Login / Signup Page
**File:** `src/pages/auth/LoginPage.jsx` (296 lines)

### Current State:
Email/password login & signup, Google/Apple OAuth, password reset, mode toggle.

### Redesign:

**A. Split layout:**
- Left side (50%): Navy gradient background with Lynx branding, mascot, and a tagline. "Welcome back to Lynx" for login, "Join Lynx" for signup.
- Right side (50%): The form on a clean white/light background.
- Mobile: full-width form with navy header bar.

**B. Form styling:**
- All inputs: V2 input styling (`rounded-xl px-4 py-3 text-sm border border-[#E8ECF2] focus:border-[#4BB9EC] focus:ring-2 focus:ring-[#4BB9EC]/10`)
- Labels: above inputs, `text-xs font-bold uppercase tracking-wider text-slate-400`
- Password field: show/hide toggle
- Submit button: full-width, navy bg, `rounded-xl py-3 font-bold text-white`

**C. OAuth buttons:**
- Google: white bg with Google logo + "Continue with Google" — `rounded-xl border border-[#E8ECF2]`
- Apple: black bg with Apple logo + "Continue with Apple" — `rounded-xl`
- "or" divider between email form and OAuth

**D. Mode toggle:**
- "Don't have an account? Sign up" / "Already have an account? Log in" — subtle text link at bottom
- Password reset link: "Forgot password?" in sky blue

**E. Invite code field** if present: V2 styled input.

### Commit:
```bash
git add src/pages/auth/LoginPage.jsx
git commit -m "Phase 2: Login — split layout with navy branding panel, V2 form inputs"
```

---

## PHASE 3: Public Registration Page
**File:** `src/pages/public/PublicRegistrationPage.jsx` (489 lines) + `RegistrationFormSteps.jsx` (487 lines) + `RegistrationScreens.jsx` (247 lines)

### Current State:
Multi-child registration with shared parent info, custom fields, waivers, fee preview, funnel tracking.

### Redesign:

**A. Registration wrapper:**
- Clean centered layout (max-w-2xl) with generous padding
- Lynx branding at top (logo + org name + season name)
- Progress stepper showing which step the parent is on (Step 1 of 4, etc.)
- Navy top bar with org identity

**B. Progress stepper:**
```jsx
<div className="flex items-center gap-2 mb-8">
  {steps.map((step, i) => (
    <div key={i} className="flex items-center gap-2">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
        i < currentStep ? 'bg-[#22C55E] text-white' :
        i === currentStep ? 'bg-[#10284C] text-white' :
        'bg-[#E8ECF2] text-slate-400'
      }`}>{i < currentStep ? '✓' : i + 1}</div>
      <span className={`text-xs font-bold ${i <= currentStep ? 'text-[#10284C]' : 'text-slate-400'}`}>{step.label}</span>
      {i < steps.length - 1 && <div className={`w-8 h-px ${i < currentStep ? 'bg-[#22C55E]' : 'bg-[#E8ECF2]'}`} />}
    </div>
  ))}
</div>
```

**C. Form steps:** V2 input styling on every field. Section cards with titles. Clear "Next" and "Back" buttons.

**D. Fee breakdown:** Card with line items, totals, discount indicators. Clean typography.

**E. Waiver section:** Waiver text in a scrollable card, signature checkbox styled as a V2 toggle or checkbox.

**F. Confirmation/Success screen:** Celebratory treatment with checkmark animation (or mascot), "You're registered!" message, next steps.

**G. Keep ALL funnel tracking calls** (`trackFunnelEvent`) untouched.

### Commit:
```bash
git add src/pages/public/PublicRegistrationPage.jsx src/pages/public/RegistrationFormSteps.jsx src/pages/public/RegistrationScreens.jsx
git commit -m "Phase 3: Public Registration — progress stepper, V2 forms, premium confirmation"
```

---

## PHASE 4: Org Directory Page
**File:** `src/pages/public/OrgDirectoryPage.jsx` (915 lines)

### Current State:
Organization discovery with search, filter by state/sport, sort, detail slide-over with seasons/contact.

### Redesign:

**A. Hero header:**
- Navy gradient header with "Find Your Club" headline
- Search bar prominent and centered (large, rounded-xl, with search icon)
- Filter pills below: State selector, Sport selector, Sort dropdown

**B. Org cards:** Grid layout (3 cols desktop):
- Org logo/avatar + name (bold) + city/state
- Sport icons
- "X active seasons" badge
- "X registered players" count
- Click to expand/slide-over

**C. Detail slide-over** (when org is selected):
- V2 card styling
- Org name, contact info, sports offered
- Active seasons with registration links
- CTA: "Register Now" button

### Commit:
```bash
git add src/pages/public/OrgDirectoryPage.jsx
git commit -m "Phase 4: Org Directory — hero search, org cards grid, V2 detail panel"
```

---

## PHASE 5: Setup Wizard
**File:** `src/pages/auth/SetupWizard.jsx` (747 lines)

### Current State:
7-step onboarding: role selection, org creation, invite code, confetti celebration.

### Redesign:

**A. Wizard wrapper:**
- Centered card layout (max-w-lg) with navy sidebar or top bar showing progress
- Step indicator: dots or numbered circles showing 1-7 progress
- Lynx mascot peeking in from the side or corner (if mascot assets available)

**B. Step cards:**
- Each step in a clean V2 card with title, description, form fields
- V2 input styling on all fields
- Clear primary action button per step ("Next", "Create Organization", "Get Started")

**C. Role selection step:**
- Role cards (Admin, Coach, Parent, Player) as selectable cards with icon, title, description
- Selected card: sky-blue border + checkmark

**D. Completion/Confetti step:**
- Celebratory screen with mascot, "You're all set!" message
- Quick actions: "Go to Dashboard", "Create First Season", "Invite Coaches"

**E. Keep all org creation, invite code validation, and role assignment logic untouched.**

### Commit:
```bash
git add src/pages/auth/SetupWizard.jsx
git commit -m "Phase 5: Setup Wizard — progress indicator, V2 step cards, celebration screen"
```

---

## FINAL PUSH
```bash
git push origin main
```

## FINAL REPORT
```
## Public Pages Mega Redesign Report
- Phases completed: X/5
- Files modified: [list]
- Total lines: +X / -Y
- Build status: PASS/FAIL
```
