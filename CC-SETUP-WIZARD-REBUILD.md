# CC-SETUP-WIZARD-REBUILD.md
# Complete Rebuild of SetupWizard.jsx
# March 9, 2026

## ⚠️ MANDATORY RULES

1. **Read every file listed in "Files to Read" BEFORE writing any code.**
2. **This is a FULL REPLACEMENT** of `src/pages/auth/SetupWizard.jsx`. Delete ALL existing content and write fresh.
3. **Do NOT touch** AuthContext.jsx, JourneyContext.jsx, App.jsx, MainApp.jsx, or any other file unless explicitly listed.
4. **Use the existing JourneyContext** — it already has role-based steps, badges, and progress tracking. Wire into it, don't rebuild it.
5. **All mascot images have transparent backgrounds.** Never wrap them in dark containers or add bg- classes behind them.

## Files to Read First

- `src/pages/auth/SetupWizard.jsx` — current broken version (replace entirely)
- `src/contexts/JourneyContext.jsx` — existing journey steps, badges, and role definitions (USE THIS)
- `src/contexts/AuthContext.jsx` — auth state, user, profile, completeOnboarding, needsOnboarding
- `src/contexts/ThemeContext.jsx` — useTheme, useThemeClasses, accent
- `src/App.jsx` — how SetupWizard is rendered (`needsOnboarding ? <SetupWizard onComplete={completeOnboarding} />`)
- `src/lib/supabase.js` — supabase client

## What This Component Does

`SetupWizard` renders when a new user signs up and `needsOnboarding` is true. It:

1. Asks the user who they are (role selection)
2. Walks them through initial setup based on their role
3. Creates necessary database records (org, user_roles, etc.)
4. Sets `onboarding_completed: true` on their profile
5. Calls `onComplete()` to transition them into the main app

## Architecture: Card-Based Steps (Not Overlay)

The new wizard is a **full-page card-based flow** — clean white/navy background, centered content card, progress indicator, and mascot companion. NOT a modal overlay.

Each step is a card that slides in. The mascot reacts to progress. Celebrations fire on key milestones.

## Component Signature

```jsx
export function SetupWizard({ onComplete, onBack }) {
  // onComplete() → called when onboarding finishes, triggers AuthContext reload
  // onBack() → optional, returns to landing page
}
```

## Design Tokens

```
Navy: #0B1628
Sky Blue: #4BB9EC / #5BCBFA
Gold: #FFD700
Teal: #2DD4A8
Coral: #FF6B6B
Card BG: white (light mode)
Page BG: #F4F7FA
Font: 'Plus Jakarta Sans' (already loaded)
Card radius: 24px
Button radius: 14px
```

## Step Flow by Role

### Flow 1: Organization Director
```
Role Selection → Org Name → (Success + Confetti) → Journey Preview → Dashboard
```

### Flow 2: Team Manager / Coach
```
Role Selection → Choose Path:
  → "Create a new team" → Team Name → (Success) → Journey Preview → Dashboard
  → "Join with invite code" → Enter Code → (Success) → Dashboard
  → "I'll be assigned later" → (Pending) → Dashboard
```

### Flow 3: Parent / Guardian
```
Role Selection → Choose Path:
  → "I have an invite code" → Enter Code → (Success) → Dashboard
  → "I'll be assigned later" → (Pending) → Dashboard
```

### Flow 4: Player
```
Role Selection → "I'll be assigned later" → (Pending) → Dashboard
```

## Page Structure (Every Step)

```
┌──────────────────────────────────────────┐
│  ← Back                    [Lynx Logo]   │  ← Sticky top bar
│                                          │
│  ━━━━━━━━━━━━━━━░░░░░░  Step 2 of 4     │  ← Progress bar + label
│                                          │
│  ┌──────────────────────────────────┐    │
│  │                                  │    │
│  │     [Mascot Image]               │    │  ← Mascot changes per step
│  │                                  │    │
│  │     Step Title                   │    │
│  │     Step description text        │    │
│  │                                  │    │
│  │     [Form fields / Cards]        │    │  ← Role cards, text inputs, etc.
│  │                                  │    │
│  │     [ Primary CTA Button ]       │    │
│  │     skip for now                 │    │  ← Optional skip link
│  │                                  │    │
│  │     ⏱️ ~2 min                    │    │  ← Estimated time
│  └──────────────────────────────────┘    │
│                                          │
└──────────────────────────────────────────┘
```

## Detailed Step Implementations

### Step 1: Role Selection

**Mascot:** Meet Lynx (thumbs up) — `/images/Meet-Lynx.png`
**Title:** "Welcome, {firstName}! What brings you to Lynx?"
**Subtitle:** "Pick the role that fits you best. You can always add more later."
**Time estimate:** "⏱️ Takes about 2 minutes"

**Cards (2x2 grid on desktop, stack on mobile):**

```
┌─────────────────────┐  ┌─────────────────────┐
│ 🏢                  │  │ 🏐                  │
│ Organization Director│  │ Coach / Team Manager│
│ I run a club with   │  │ I manage or coach   │
│ multiple teams      │  │ a team              │
│                     │  │                     │
└─────────────────────┘  └─────────────────────┘
┌─────────────────────┐  ┌─────────────────────┐
│ ❤️                  │  │ ⭐                  │
│ Parent / Guardian   │  │ Player              │
│ My child plays on   │  │ I'm an athlete      │
│ a team              │  │                     │
└─────────────────────┘  └─────────────────────┘
```

Cards have:
- Icon (large, top-left)
- Title (bold)
- Description (muted)
- Selected state: sky blue border + subtle sky blue background
- Hover: slight lift shadow

Single select — clicking one deselects the others.

**CTA:** "Let's Go →" (disabled until a role is selected)
**Skip link:** "Skip setup for now" → calls `skipOnboarding()` which sets `onboarding_completed: true` with `{ skipped: true }` and calls `onComplete()`

### Step 2a: Org Director → Create Organization

**Mascot:** Coach Lynx — `/images/coachlynxmale.png` (use at ~100px height)
**Title:** "Let's set up your organization"
**Subtitle:** "Just a name for now — you'll add all the details from your dashboard."

**Fields:**
- Organization Name (text input, large, auto-focus)
  - Placeholder: "e.g., Black Hornets Athletics"

**CTA:** "Create Organization →" (disabled until name is entered, shows spinner while saving)
**Back:** "← Back" returns to role selection

**On submit:** Run the existing `createOrganization` logic:
1. Create org in `organizations` table with name, slug, type='club'
2. Insert `user_roles` with `league_admin`
3. Update profile with `onboarding_completed: true` and `onboarding_data`
4. Call `journey?.completeStep('create_org')`
5. Advance to success step

### Step 2b: Coach → Choose Path

**Mascot:** Laptop Lynx — `/images/laptoplynx.png`
**Title:** "How's your team set up?"
**Subtitle:** "We'll get you connected to your team."

**Option cards (vertical stack):**
1. **"Start a new team"** — "I'm building something from scratch" → goes to Team Name step
2. **"I have an invite code"** — "My organization gave me a code" → goes to Invite Code step
3. **"I'll be added later"** — "Someone will assign me to a team" → goes to Pending step

### Step 2c: Parent → Choose Path

**Mascot:** Celebrate Lynx — `/images/celebrate.png`
**Title:** "Let's get your family connected!"
**Subtitle:** "Your club admin or coach may have given you a code."

**Option cards:**
1. **"I have an invite code"** → Invite Code step
2. **"I'll be added later"** → Pending step

### Step 3: Enter Invite Code

**Mascot:** Laptop Lynx
**Title:** "Enter your invite code"
**Subtitle:** "Check your email or text from the team admin."

**Fields:**
- Invite Code (text input, uppercase, large, centered, monospace font)
  - Placeholder: "XXXX-XXXX"

**CTA:** "Join Team →" (shows spinner, disabled until code entered)
**Error state:** Red text below input: "Invalid or expired invite code. Double-check with your admin."
**Back:** returns to path selection

**On submit:** Run the existing `useInviteCode` logic (checks `team_invite_codes` then `account_invites`)

### Step 4: Team Name (Coach creating new team)

**Mascot:** Coach Lynx
**Title:** "Name your team"
**Subtitle:** "You can add players and schedules from your dashboard."

**Fields:**
- Team Name (text input)
  - Placeholder: "e.g., 14U Lightning"

**On submit:** Run existing `createIndependentTeam` logic

### Success Step (after org/team creation)

**Mascot:** Celebrate Lynx — `/images/celebrate.png` with bounce animation
**CONFETTI ANIMATION** — fire confetti particles (same pattern as Marisa's guide)

**Title (role-specific):**
- Org Director: "Your organization is live! 🎉"
- Coach: "Your team is ready! 🏐"
- Parent/Player (invite): "You're in! Welcome to the team! 🎉"

**Summary card** (rounded, light bg):
- Shows what was created (org name or team name)
- Shows assigned role
- Shows "Founder" or "Team Builder" badge if earned

**Journey Preview section:**
**Title:** "Here's what's ahead"
**Subtitle:** "Your setup checklist — tackle these whenever you're ready."

Show the first 4-5 journey steps for their role (from JOURNEY_STEPS in JourneyContext) as a mini checklist:
```
☐ Create Season          ~3 min
☐ Add Teams              ~2 min
☐ Add Coaches            ~2 min
☐ Open Registration      ~5 min
☐ Build Schedule         ~5 min
```

Each step shows:
- Unchecked circle
- Step title
- Estimated time (hardcode reasonable estimates)

**CTA:** "Go to Dashboard →" (calls `onComplete()`)
**Secondary:** "What should I do first?" → highlights the first unchecked step

### Pending Step (waiting to be assigned)

**Mascot:** Sleep Lynx — `/images/SleepLynx.png`
**Title:** "You're all set for now!"
**Subtitle:** "Your admin or coach will add you to a team. You'll get a notification when it happens."

**CTA:** "Go to Dashboard →"

## Celebration / Confetti

When reaching the Success step, fire a confetti animation:

```jsx
function fireConfetti() {
  const canvas = document.getElementById('wizard-confetti')
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  const colors = ['#4BB9EC','#FFD700','#2DD4A8','#FF6B6B','#ffffff']
  const pieces = []
  for (let i = 0; i < 100; i++) {
    pieces.push({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 200,
      w: 6 + Math.random() * 6,
      h: 4 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      vy: 2 + Math.random() * 4,
      vx: -1.5 + Math.random() * 3,
      rot: Math.random() * 360,
      vr: -3 + Math.random() * 6,
      opacity: 1,
    })
  }
  let frame = 0
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    pieces.forEach(p => {
      p.y += p.vy; p.x += p.vx; p.rot += p.vr; p.vy += 0.05
      if (frame > 60) p.opacity -= 0.01
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot * Math.PI / 180)
      ctx.globalAlpha = Math.max(0, p.opacity)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h)
      ctx.restore()
    })
    frame++
    if (frame < 150) requestAnimationFrame(draw)
    else ctx.clearRect(0, 0, canvas.width, canvas.height)
  }
  draw()
}
```

Add `<canvas id="wizard-confetti" className="fixed inset-0 z-50 pointer-events-none" />` at the component root.

## PRE-STEP: Crop Mascot Sprite Sheets

Before building the wizard, crop the Gemini character sheets in `public/images/` into individual poses. These are grid layouts on white/near-white backgrounds.

**Write a Node.js or Python script** that:
1. Reads each Gemini sheet PNG
2. Detects individual characters by finding bounding boxes of non-white content (threshold: pixel brightness < 240)
3. Crops each character with ~20px padding
4. Saves to `public/images/mascots/` with descriptive names

**Sheet layout guide (use these to name the cropped files):**

`Gemini_Generated_Image_3czl8z3czl8z3czl.png` — 4x3 grid (12 poses):
- Row 1: `sleeping.png`, `laptop.png`, `magnifying-glass.png`, `scientist.png`
- Row 2: `mechanic.png`, `butterfly-net.png`, `reading.png`, `confetti.png`
- Row 3: `lightbulb.png`, `thumbs-up.png`, `waving.png`, `clipboard-checklist.png`

`Gemini_Generated_Image_8y5n0k8y5n0k8y5n.png` — 4x3 grid (12 sport poses):
- Row 1: `sport-football.png`, `sport-soccer.png`, `sport-baseball.png`, `sport-tennis.png`
- Row 2: `sport-swimming.png`, `sport-volleyball.png`, `sport-lacrosse.png`, `sport-basketball.png`
- Row 3: `sport-hockey.png`, `sport-martial-arts.png`, `sport-cycling.png`, `sport-track.png`

`Gemini_Generated_Image_vfb387vfb387vfb3.png` — 3x4 grid (12 duo poses):
- Row 1: `duo-fist-bump.png`, `duo-high-five.png`, `duo-hug.png`
- Row 2: `duo-star-point.png`, `duo-medal.png`, `duo-holding-hands.png`
- Row 3: `duo-standing.png`, `duo-trophy.png`, `duo-crown.png`
- Row 4: `duo-wave.png`, `duo-piggyback.png`, `duo-pinky-promise.png`

`Gemini_Generated_Image_hbn7wlhbn7wlhbn7.png` — 4x4 grid (family groups by sport) — crop into:
- `family-football.png`, `family-volleyball.png`, `family-soccer.png`, `family-basketball.png` (top row)
- Continue for remaining rows with different art styles

`Gemini_Generated_Image_xytlb6xytlb6xytl.png` and `Gemini_Generated_Image_rto5h4rto5h4rto5.png` — crop similarly, naming by visible content.

**Cropping approach:** Since these are on white backgrounds with clear separation, use content detection:
```python
from PIL import Image
import numpy as np

def crop_grid(input_path, rows, cols, output_dir, names):
    img = Image.open(input_path)
    w, h = img.size
    cell_w, cell_h = w // cols, h // rows
    idx = 0
    for r in range(rows):
        for c in range(cols):
            if idx >= len(names):
                break
            box = (c * cell_w, r * cell_h, (c+1) * cell_w, (r+1) * cell_h)
            cell = img.crop(box)
            # Trim whitespace
            arr = np.array(cell)
            if arr.shape[2] == 4:
                mask = arr[:,:,3] > 10  # alpha channel
            else:
                mask = np.any(arr[:,:,:3] < 240, axis=2)
            if not mask.any():
                idx += 1
                continue
            rows_with_content = np.where(mask.any(axis=1))[0]
            cols_with_content = np.where(mask.any(axis=0))[0]
            pad = 20
            top = max(0, rows_with_content[0] - pad)
            bottom = min(cell.height, rows_with_content[-1] + pad)
            left = max(0, cols_with_content[0] - pad)
            right = min(cell.width, cols_with_content[-1] + pad)
            cropped = cell.crop((left, top, right, bottom))
            cropped.save(f"{output_dir}/{names[idx]}")
            idx += 1
```

Run this for each sheet, creating `public/images/mascots/` directory.

After cropping, verify the images look correct by opening a few.

## Mascot Image Assignments for Wizard Steps

Use the CROPPED images from `public/images/mascots/` plus existing images in `public/images/`:

| Step | Image | Why |
|------|-------|-----|
| Role Selection | `/images/mascots/waving.png` | Friendly greeting |
| Org Director: Create Org | `/images/coachlynxmale.png` | Coach with clipboard = leadership |
| Coach: Choose Path | `/images/mascots/lightbulb.png` | Decision/idea moment |
| Parent: Choose Path | `/images/mascots/duo-high-five.png` | Family connection |
| Enter Invite Code | `/images/mascots/laptop.png` | Technical input step |
| Team Name | `/images/mascots/clipboard-checklist.png` | Setting things up |
| Success / Celebration | `/images/mascots/confetti.png` | Celebration! |
| Journey Preview | `/images/mascots/thumbs-up.png` | Encouragement |
| Pending / Waiting | `/images/SleepLynx.png` | Patient waiting |

Fallback to existing images if cropping fails:
- `/images/Meet-Lynx.png` for role selection
- `/images/celebrate.png` for success
- `/images/laptoplynx.png` for technical steps

Render all images as:
```jsx
<img src="/images/mascots/waving.png" alt="" className="w-28 h-auto object-contain mx-auto mb-4" />
```

**CRITICAL: All images have white or transparent backgrounds. NEVER wrap them in dark containers or add bg- classes behind them.**

## Estimated Time Labels

Show on each step card, bottom-right:
- Role Selection: "⏱️ ~2 min total"
- Org Name: "⏱️ ~30 sec"
- Team Name: "⏱️ ~30 sec"
- Invite Code: "⏱️ ~1 min"

## Database Logic (Preserve Exactly)

The Supabase logic from the current broken file is CORRECT — the UI was broken, not the data operations. Preserve these functions exactly:

1. **createOrganization:** Insert org → insert user_role (league_admin) → update profile (onboarding_completed: true) → complete journey step
2. **createIndependentTeam:** Insert org (type: independent_team) → insert user_role (league_admin) → update profile → complete journey step
3. **useInviteCode:** Check team_invite_codes → fallback to account_invites → insert user_role → update profile
4. **skipOnboarding:** Update profile onboarding_completed: true with { skipped: true }

Copy these function bodies from the current file. They work — just the UI around them is broken.

## Responsive

- Desktop: centered card, max-width 520px
- Mobile: full-width with padding
- Role selection cards: 2x2 grid on desktop, 2 columns on tablet, stack on small mobile

## Animation

- Card transitions: fade + slide up (200ms ease-out)
- Mascot: subtle float animation (same as landing page)
- Progress bar: smooth width transition
- Confetti on success step

## Files Created/Modified

| File | Action |
|------|--------|
| `src/pages/auth/SetupWizard.jsx` | REPLACE ENTIRELY — new component |
| `public/images/` | VERIFY — ensure all mascot PNGs exist |

## Do NOT Change

- `AuthContext.jsx`
- `JourneyContext.jsx`
- `App.jsx`
- `MainApp.jsx`
- `LandingPage.jsx`
- `LoginPage.jsx`
- Any dashboard or inner pages

## Verification

| # | Check | Status |
|---|-------|--------|
| 1 | New user sees wizard after signup (not blank screen) | |
| 2 | Role selection shows 4 cards, single select works | |
| 3 | Org Director flow: name → success → dashboard | |
| 4 | Coach flow: create team / invite code / pending all work | |
| 5 | Parent flow: invite code / pending both work | |
| 6 | Player flow: goes to pending | |
| 7 | Confetti fires on success step | |
| 8 | Mascot images display with transparent backgrounds | |
| 9 | Progress bar updates per step | |
| 10 | Journey preview shows on success step | |
| 11 | Skip link works and sets onboarding_completed | |
| 12 | Back button works on every step | |
| 13 | Database records created correctly (org, user_roles, profile) | |
| 14 | `onComplete()` called → user sees dashboard | |
| 15 | No console errors | |
