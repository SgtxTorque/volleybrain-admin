# PLATFORM ADMIN — SELF-SERVICE PROFILE ACCESS
# Standalone CC Spec (run before Phase 4 migrations + lockdown)

## Context

Carlos needs to edit his own profile (name, password, photo, email, phone) from within Platform Admin mode without exiting to org mode. The existing profile components already exist and work — they just aren't accessible from platform mode.

## Guardrails

1. **JSX project.** Validate with `npm run build`.
2. **Commit format:** `[PA-PROFILE]`
3. **DO NOT modify any existing profile components.** Reuse them as-is.
4. **DO NOT create new database tables.** This is purely a UI/routing addition.
5. **Follow existing platform page patterns.** Use `useTheme()`, `useThemeClasses()`, `useAuth()`.
6. **Lazy load the new page.**

---

## Implementation

### Step 1: Create `src/pages/platform/PlatformMyProfile.jsx`

This page wraps the existing profile section components in the platform layout. It does NOT duplicate them — it imports and renders them.

```jsx
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { User, Key, Mail, Shield } from '../../constants/icons'

// Import the existing profile section components
import { ProfileInfoSection } from '../profile/ProfileInfoSection'
import { ChangePasswordSection, ChangeEmailSection } from '../profile/ProfileSecuritySection'

function PlatformMyProfile({ showToast }) {
  const { user, profile, setProfile } = useAuth()
  const { isDark } = useTheme()
  const tc = useThemeClasses()
  const [activeTab, setActiveTab] = useState('info')

  function handleProfileUpdate(updatedProfile) {
    setProfile(updatedProfile)
  }

  // Tab definitions
  const tabs = [
    { id: 'info', label: 'Profile Info', icon: User },
    { id: 'security', label: 'Security', icon: Key },
  ]

  // Card styling (match platform pages)
  const cardClass = isDark
    ? 'bg-[#1E293B] border border-slate-700 shadow-sm rounded-[14px]'
    : 'bg-white border border-slate-200 shadow-sm rounded-[14px]'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold ${tc.text}`}>My Account</h1>
        <p className={`text-sm ${tc.textMuted} mt-1`}>
          Manage your profile, password, and account settings
        </p>
      </div>

      {/* Profile summary card */}
      <div className={`${cardClass} p-6 flex items-center gap-4`}>
        <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center">
          {profile?.avatar_url || profile?.photo_url ? (
            <img src={profile.avatar_url || profile.photo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className={`text-xl font-bold ${tc.textMuted}`}>
              {(profile?.full_name || 'A').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <p className={`text-lg font-bold ${tc.text}`}>{profile?.full_name || 'Admin'}</p>
          <p className={`text-sm ${tc.textMuted}`}>{profile?.email || user?.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500">Active</span>
            {profile?.is_platform_admin && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-500">
                <Shield className="w-3 h-3 inline mr-1" />Super Admin
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                isActive
                  ? (isDark ? 'bg-[#4BB9EC]/15 text-[#4BB9EC] border border-[#4BB9EC]/30' : 'bg-sky-50 text-sky-600 border border-sky-200')
                  : (isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50')
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'info' && (
        <ProfileInfoSection
          profile={profile}
          user={user}
          isDark={isDark}
          tc={tc}
          showToast={showToast}
          onProfileUpdate={handleProfileUpdate}
        />
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          <ChangePasswordSection isDark={isDark} tc={tc} showToast={showToast} />
          <ChangeEmailSection isDark={isDark} tc={tc} showToast={showToast} profile={profile} />
        </div>
      )}
    </div>
  )
}

export default PlatformMyProfile
```

**IMPORTANT:** The exact props that `ProfileInfoSection`, `ChangePasswordSection`, and `ChangeEmailSection` accept must match what they expect. CC should READ the actual component files before writing the page to confirm the exact prop names. The code above is the general pattern — CC should adjust prop names to match reality.

If `PageShell` is required by the profile components (check if they render standalone or need a wrapper), don't use it — platform pages don't use `PageShell`. The components should render fine without it since they're just card-based sections.

### Step 2: Add avatar dropdown to PlatformTopNav.jsx

**File to modify:** `src/components/platform/PlatformTopNav.jsx` (90 lines)

Currently the top nav has a profile avatar and an "Exit to Org" button on the right side. Add a click handler on the avatar that navigates to `/platform/profile`:

Find the avatar div (around line 65-72) and wrap it in a clickable button:

```jsx
{/* Profile avatar — clickable, goes to profile page */}
<button
  onClick={() => navigate('/platform/profile')}
  className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold hover:ring-2 hover:ring-white/30 transition-all"
  style={{ background: profile?.photo_url ? 'transparent' : 'rgba(255,255,255,0.2)', color: '#fff' }}
  title="My Account"
>
  {profile?.photo_url ? (
    <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
  ) : avatarInitial}
</button>
```

The existing avatar div should be replaced with this button version. The key change is adding `onClick={() => navigate('/platform/profile')}` and `cursor-pointer` styling.

### Step 3: Add route to MainApp.jsx

**File to modify:** `src/MainApp.jsx`

Add lazy import:
```javascript
const PlatformMyProfile = lazy(() => import('./pages/platform/PlatformMyProfile'))
```

Add route (inside the platform routes block, before the catch-all):
```jsx
<Route path="/platform/profile" element={<PlatformMyProfile showToast={showToast} />} />
```

### Step 4: Do NOT add to TopNav NAV_SECTIONS or Sidebar

The profile page is accessed via the avatar click, not the nav bar. It should NOT appear as a nav section — it's a personal utility page, not a platform management page.

---

## What this gives you:

- Click your avatar in platform mode → goes to `/platform/profile`
- **Profile Info tab**: Edit name, phone, upload photo — same components you already use in org mode
- **Security tab**: Change password, change email — same components
- All changes save to the same `profiles` table via the same Supabase calls
- No new database tables, no new RLS policies needed

## Commit message: `[PA-PROFILE] Add self-service profile page accessible from platform admin avatar`

## Test checklist:
- [ ] Avatar in top nav is clickable and navigates to `/platform/profile`
- [ ] Profile Info section loads with current name/email/phone/photo
- [ ] Name edit saves correctly
- [ ] Photo upload works
- [ ] Password change works
- [ ] Page uses platform styling (not org-mode PageShell)
- [ ] Back navigation works (browser back button)
- [ ] Build passes
