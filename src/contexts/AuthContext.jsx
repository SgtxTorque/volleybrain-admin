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
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        init()
      }
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setOrganization(null)
        setIsAdmin(false)
        setIsPlatformAdmin(false)
        setNeedsOnboarding(false)
        setLoading(false)
      }
      if (event === 'PASSWORD_RECOVERY') {
        // Pass any hash params through to the reset page so it can detect errors
        const hash = window.location.hash
        window.location.href = '/reset-password' + hash
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Load profile, roles, and org for a given user object
  async function loadProfile(authUser) {
    try {
      let { data: prof } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle()

      // No profile row yet — check if user came from an invite flow (has roles already)
      if (!prof) {
        const { data: existingRoles } = await supabase
          .from('user_roles')
          .select('role, organization_id')
          .eq('user_id', authUser.id)
          .limit(1)

        if (existingRoles?.length > 0) {
          // User has roles — they came from an invite flow. Don't trigger onboarding.
          const meta = authUser.user_metadata
          await supabase.from('profiles').upsert({
            id: authUser.id,
            email: authUser.email,
            full_name: meta?.full_name || meta?.name || '',
            onboarding_completed: true,
            current_organization_id: existingRoles[0].organization_id,
          }, { onConflict: 'id' })
          // Re-fetch the profile
          const { data: freshProfile } = await supabase
            .from('profiles').select('*').eq('id', authUser.id).single()
          prof = freshProfile
        } else {
          // No roles — genuinely new user, create profile and trigger onboarding
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
      }

      setProfile(prof)
      setIsPlatformAdmin(!!prof?.is_platform_admin)

      // Check if user needs onboarding
      if (!prof?.onboarding_completed) {
        setNeedsOnboarding(true)
        setLoading(false)
        return
      }

      // Auto-link: if any players have this user's email as parent_email but no parent_account_id, link them
      try {
        const { data: unlinkedPlayers } = await supabase
          .from('players')
          .select('id, season_id')
          .eq('parent_email', prof.email || authUser.email)
          .is('parent_account_id', null)

        if (unlinkedPlayers?.length > 0) {
          const playerIds = unlinkedPlayers.map(p => p.id)
          await supabase
            .from('players')
            .update({ parent_account_id: authUser.id })
            .in('id', playerIds)

          // Get org IDs from seasons these players belong to
          const seasonIds = [...new Set(unlinkedPlayers.map(p => p.season_id).filter(Boolean))]
          if (seasonIds.length > 0) {
            const { data: seasons } = await supabase
              .from('seasons')
              .select('organization_id')
              .in('id', seasonIds)

            const orgIds = [...new Set(seasons?.map(s => s.organization_id).filter(Boolean))]

            // Ensure parent role exists for each org
            for (const orgId of orgIds) {
              await supabase.from('user_roles').upsert({
                user_id: authUser.id,
                organization_id: orgId,
                role: 'parent',
                is_active: true,
              }, { onConflict: 'user_id,organization_id,role' })
            }
          }
        }
      } catch (linkErr) {
        console.error('Auto-link children error:', linkErr)
      }

      const { data: roles } = await supabase.from('user_roles').select('role, organization_id').eq('user_id', authUser.id).eq('is_active', true).order('granted_at', { ascending: false })
      if (roles && roles.length > 0) {
        setIsAdmin(roles.some(r => r.role === 'league_admin'))
        // Prefer the profile's current_organization_id if it matches one of the user's roles
        const preferredOrgId = prof?.current_organization_id && roles.some(r => r.organization_id === prof.current_organization_id)
          ? prof.current_organization_id
          : roles[0].organization_id
        const { data: org } = await supabase.from('organizations').select('*').eq('id', preferredOrgId).maybeSingle()
        setOrganization(org)
        // Auto-set current_organization_id on profile if it's null
        if (!prof?.current_organization_id && preferredOrgId) {
          await supabase.from('profiles').update({ current_organization_id: preferredOrgId }).eq('id', authUser.id)
        }
      }
      setNeedsOnboarding(false)
    } catch (err) {
      console.error('Auth loadProfile error:', err)
    } finally {
      setLoading(false)
    }
  }

  // init() — called on mount + after signIn/signUp/completeOnboarding
  async function init() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        // Race loadProfile against a 10-second timeout to prevent infinite hang
        await Promise.race([
          loadProfile(session.user),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Profile load timeout')), 10000))
        ])
      }
    } catch (err) {
      console.error('Init error:', err)
    }
    setLoading(false)
  }

  async function signIn(email, password) {
    // Clear filter preferences so dashboard defaults to "all" on login
    localStorage.removeItem('vb_selected_season')
    localStorage.removeItem('vb_selected_sport')
    localStorage.removeItem('vb_selected_program')
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
    localStorage.removeItem('vb_selected_program')
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
