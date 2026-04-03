import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// ============================================
// AUTH CONTEXT
// ============================================
const AuthContext = createContext({
  user: null,
  profile: null,
  organization: null,
  isAdmin: false,
  isPlatformAdmin: false,
  loading: true,
  needsOnboarding: false,
  signIn: async () => {},
  signUp: async () => {},
  signInWithGoogle: async () => {},
  signInWithApple: async () => {},
  signOut: async () => {},
  setOrganization: () => {},
  setProfile: () => {},
  completeOnboarding: async () => {},
  refreshAuth: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [organization, setOrganization] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  useEffect(() => {
    let resolved = false

    const resolveAuth = async (session) => {
      if (session?.user) {
        setUser(session.user)
        await loadProfile(session.user)
        // loadProfile sets loading: false in its finally block
      } else {
        setUser(null)
        setProfile(null)
        setOrganization(null)
        setIsAdmin(false)
        setIsPlatformAdmin(false)
        setNeedsOnboarding(false)
        setLoading(false)
      }
    }

    // PRIMARY: onAuthStateChange — fires when Supabase finishes reading localStorage
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'INITIAL_SESSION') {
          resolved = true
          await resolveAuth(session)
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          resolved = true
          await resolveAuth(session)
        } else if (event === 'SIGNED_OUT') {
          resolved = true
          await resolveAuth(null)
        }
      }
    )

    // BACKUP: If onAuthStateChange hasn't fired in 3 seconds, try getSession() directly.
    // This handles edge cases: corrupted localStorage, Supabase SDK hangs, network issues.
    const backupTimer = setTimeout(async () => {
      if (resolved) return  // Primary path already handled it
      console.warn('Auth: onAuthStateChange did not fire within 3s, falling back to getSession()')
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (resolved) return  // Primary path fired while we were waiting
        resolved = true
        await resolveAuth(session)
      } catch (err) {
        console.error('Auth: getSession() fallback failed', err)
        if (!resolved) {
          resolved = true
          setUser(null)
          setLoading(false)
        }
      }
    }, 3000)

    return () => {
      clearTimeout(backupTimer)
      subscription.unsubscribe()
    }
  }, [])

  // Load profile, roles, and org for a given user object
  async function loadProfile(authUser) {
    try {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle()

      // OAuth users may not have a profile row yet — create one
      if (!prof) {
        const meta = authUser.user_metadata
        const { data: newProf } = await supabase.from('profiles').upsert({
          id: authUser.id,
          email: authUser.email,
          full_name: meta?.full_name || meta?.name || '',
          onboarding_completed: false,
        }, { onConflict: 'id' }).select().single()
        setProfile(newProf)
        setIsPlatformAdmin(false)
        setNeedsOnboarding(true)
        setLoading(false)
        return
      }

      setProfile(prof)
      setIsPlatformAdmin(!!prof?.is_platform_admin)

      // Check if user needs onboarding
      if (!prof?.onboarding_completed) {
        setNeedsOnboarding(true)
        setLoading(false)
        return
      }

      const { data: roles } = await supabase.from('user_roles').select('role, organization_id').eq('user_id', authUser.id).eq('is_active', true)
      if (roles && roles.length > 0) {
        setIsAdmin(roles.some(r => r.role === 'league_admin'))
        const { data: org } = await supabase.from('organizations').select('*').eq('id', roles[0].organization_id).maybeSingle()
        setOrganization(org)
      }
      setNeedsOnboarding(false)
    } catch (err) {
      console.error('Auth loadProfile error:', err)
    } finally {
      setLoading(false)
    }
  }

  // init() — called explicitly after signIn/signUp/completeOnboarding
  async function init() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        await loadProfile(session.user)
      } else {
        setLoading(false)
      }
    } catch (err) {
      console.error('Init error:', err)
      setLoading(false)
    }
  }

  async function signIn(email, password) {
    // Clear filter preferences so dashboard defaults to "all" on login
    localStorage.removeItem('vb_selected_season')
    localStorage.removeItem('vb_selected_sport')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    await init()
  }

  async function signUp(email, password, firstName, lastName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName }
      }
    })
    if (error) throw error

    // Create profile if it doesn't exist
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: email,
        full_name: `${firstName} ${lastName}`.trim(),
        onboarding_completed: false,
      }, { onConflict: 'id' })
    }

    await init()
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    })
    if (error) throw error
  }

  async function signInWithApple() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: window.location.origin
      }
    })
    if (error) throw error
  }

  async function signOut() {
    // Clear persisted navigation/filter state to prevent session bleed
    localStorage.removeItem('vb_selected_season')
    localStorage.removeItem('vb_selected_sport')
    localStorage.removeItem('returnToOrgSetup')
    localStorage.removeItem('lynx-recent-searches')
    localStorage.removeItem('lynx_active_view')

    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setOrganization(null)
    setIsAdmin(false)
    setIsPlatformAdmin(false)
    setNeedsOnboarding(false)

    // Reset URL to root so next login lands on dashboard (not previous user's page)
    window.history.replaceState(null, '', '/')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  async function completeOnboarding() {
    setNeedsOnboarding(false)
    await init()
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      organization,
      isAdmin,
      isPlatformAdmin,
      loading,
      needsOnboarding,
      signIn,
      signUp,
      signInWithGoogle,
      signInWithApple,
      signOut,
      setOrganization,
      setProfile,
      completeOnboarding,
      refreshAuth: init
    }}>
      {children}
    </AuthContext.Provider>
  )
}
