# CC-FIX-AUTH-SESSION-PERSISTENCE.md

## Overview
Hard refresh (Ctrl+Shift+R) logs users out. The auth session doesn't survive page reloads because of a race condition between `getSession()` and the Supabase client's internal localStorage read.

This affects ALL users on every page. Fix this first — it may also resolve the 401 errors on team creation for new orgs.

## Root Cause
In `src/contexts/AuthContext.jsx`, the `useEffect` calls `init()` which calls `supabase.auth.getSession()` immediately on mount. But in Supabase JS v2.90.1, the client reads localStorage **asynchronously**. If `getSession()` fires before that read completes, it returns `{ session: null }`. The app sees no session, sets `loading: false`, and renders the login page.

The `onAuthStateChange` listener only handles `'SIGNED_IN'` events — it ignores `'INITIAL_SESSION'` (fired when localStorage read completes) and `'TOKEN_REFRESHED'` (fired when tokens auto-refresh). So the valid session is available but never picked up.

## Fix — Two Files

### File 1: `src/lib/supabase.js`

Add explicit auth config. Find:

```javascript
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

Replace with:

```javascript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: globalThis.localStorage,
  }
})
```

### File 2: `src/contexts/AuthContext.jsx`

Find the `useEffect` that calls `init()` and sets up `onAuthStateChange`. It looks like this:

```javascript
useEffect(() => {
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        init()
      }
    })

    return () => subscription.unsubscribe()
}, [])
```

Replace it with:

```javascript
useEffect(() => {
    // Use onAuthStateChange as the single source of truth for session state.
    // Do NOT call getSession() directly — it races with the client's internal
    // localStorage read and can return null before the session is loaded.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            setUser(session.user)
            await loadProfile(session.user.id)
          } else {
            setUser(null)
            setProfile(null)
            setOrganization(null)
            setRoleContext(null)
            setLoading(false)
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setOrganization(null)
          setRoleContext(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
}, [])
```

**IMPORTANT:** This replaces the direct `init()` call. The `INITIAL_SESSION` event fires once the Supabase client has finished reading from localStorage, so we never race.

You will need to adapt this to the actual variable names and functions in AuthContext. The key changes are:

1. **Remove the direct `init()` call** at the top of the useEffect
2. **Handle `INITIAL_SESSION`** — this is the event that fires after localStorage is read
3. **Handle `TOKEN_REFRESHED`** — keeps the session alive when tokens auto-refresh
4. **Handle `SIGNED_OUT`** — properly clears state
5. **Do NOT call `getSession()` anywhere in this useEffect** — the listener is the source of truth

If `loadProfile` or whatever function loads the profile/roles/org data is currently inside `init()`, extract it into a standalone async function that takes a user ID, so it can be called from the listener.

**Do NOT remove the `init()` function entirely if other code calls it** (e.g., after signup). Just remove the direct call at the top of the useEffect. The listener will handle session restoration on page load.

## Verification

1. `npm run build` — zero errors
2. Log in to the app
3. Hard refresh (Ctrl+Shift+R) — should stay logged in, NOT redirect to login page
4. Normal refresh (F5) — should stay logged in
5. Close the tab, reopen the URL — should stay logged in
6. Wait 5 minutes, then refresh — should stay logged in (token auto-refresh)
7. Log out — should redirect to login page
8. After logout, refresh — should stay on login page (no ghost session)

## Commit
```
git add src/lib/supabase.js src/contexts/AuthContext.jsx
git commit -m "[fix] Auth session: use onAuthStateChange as source of truth, fix hard refresh logout"
```
