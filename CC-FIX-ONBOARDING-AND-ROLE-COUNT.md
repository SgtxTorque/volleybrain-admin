# CC-FIX-ONBOARDING-AND-ROLE-COUNT.md

## Overview
Two fixes:
1. **SetupWizard doesn't set `current_organization_id`** for new org directors — they get stuck after onboarding
2. **Platform Admin org detail counts `admin` but real role is `league_admin`** — Role Breakdown shows 0 Admins, health score is lower than it should be

---

## FIX 1: SetupWizard Missing current_organization_id

**File:** `src/pages/auth/SetupWizard.jsx`

**Root Cause:** The `createOrganization()` function creates the org and the `user_roles` entry but never sets `profiles.current_organization_id`. The `createMicroOrgForTM()` function right below it does this correctly — the org director path just skips it.

**Also fixed:** Removed `type: 'club'` and `settings: {}` from the org insert (potential enum constraint issue).

### Replace the `createOrganization` function (around line 186) with:

```javascript
  const createOrganization = async () => {
    setSaving(true)
    setError(null)
    try {
      const slug = orgName.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50) + '-' + Date.now().toString(36)

      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({ name: orgName, slug, is_active: true })
        .select()
        .single()

      if (orgError) throw orgError

      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: user.id, organization_id: org.id,
        role: 'league_admin', is_active: true,
      })
      if (roleError) throw roleError

      // Set current_organization_id so AuthContext knows which org to load
      const { error: profileOrgError } = await supabase
        .from('profiles')
        .update({ current_organization_id: org.id })
        .eq('id', user.id)
      if (profileOrgError) throw profileOrgError

      await supabase.from('profiles').update({
        onboarding_completed: true,
        onboarding_data: {
          role: 'org_director', organization_id: org.id,
          completed_at: new Date().toISOString(),
          completed_steps: ['create_org'],
          earned_badges: ['founder', 'beta_tester'],
        },
      }).eq('id', user.id)

      if (journey?.completeStep) journey.completeStep('create_org')

      setSaving(false)
      setSuccessContext({ type: 'org', name: orgName, role: 'Organization Director', badge: 'Founder' })
      goTo(STEPS.SUCCESS)
    } catch (err) {
      console.error('Error creating organization:', err)
      setSaving(false)
      setError(err.message)
    }
  }
```

---

## FIX 2: Platform Admin Role Counting

**File:** `src/pages/platform/PlatformOrgDetail.jsx`

**Root Cause:** The Role Breakdown widget and health score check for `role === 'admin'` but the app stores org admins as `league_admin`. The onboarding checklist in the same file already checks both — this is an inconsistency.

### Change 1 — Role Breakdown counts (around line 226):

**Find:**
```javascript
  const adminCount = members.filter(m => m.role === 'admin').length
  const coachCount = members.filter(m => m.role === 'coach').length
  const parentCount = members.filter(m => m.role === 'parent').length
```

**Replace with:**
```javascript
  const adminCount = members.filter(m => m.role === 'admin' || m.role === 'league_admin').length
  const coachCount = members.filter(m => m.role === 'coach').length
  const parentCount = members.filter(m => m.role === 'parent').length
```

### Change 2 — Health score admin check (around line 1335):

**Find:**
```javascript
    if (members.some(m => m.role === 'admin')) score += 10
```

**Replace with:**
```javascript
    if (members.some(m => m.role === 'admin' || m.role === 'league_admin')) score += 10
```

---

## Verification
1. Run `npm run build` — confirm zero errors
2. Go to Platform Admin → Orgs → Black Hornets Youth Sports → Role Breakdown should show 1 Admin
3. Health Score should increase (the +10 for having an admin was being missed)
4. Create a NEW test account → go through SetupWizard as "Organization Director" → should land on dashboard with org context loaded, not stuck

## Commit
```
git add src/pages/auth/SetupWizard.jsx src/pages/platform/PlatformOrgDetail.jsx
git commit -m "[fix] SetupWizard: set current_organization_id for new org directors; PlatformOrgDetail: count league_admin in role breakdown and health score"
```
