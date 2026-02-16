import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// ============================================
// AUTH CONTEXT
// ============================================
const AuthContext = createContext(null)

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

    // Listen for auth changes (for sign up)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        init()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function init() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
        setProfile(prof)
        setIsPlatformAdmin(!!prof?.is_platform_admin)

        // Check if user needs onboarding
        if (!prof?.onboarding_completed) {
          setNeedsOnboarding(true)
          setLoading(false)
          return
        }

        const { data: roles } = await supabase.from('user_roles').select('role, organization_id').eq('user_id', session.user.id).eq('is_active', true)
        if (roles && roles.length > 0) {
          setIsAdmin(roles.some(r => r.role === 'league_admin'))
          const { data: org } = await supabase.from('organizations').select('*').eq('id', roles[0].organization_id).maybeSingle()
          setOrganization(org)
        }
        setNeedsOnboarding(false)
      }
    } catch (err) { console.error('Init error:', err) }
    setLoading(false)
  }

  async function signIn(email, password) {
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
        first_name: firstName,
        last_name: lastName,
        onboarding_completed: false,
      }, { onConflict: 'id' })
    }

    await init()
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setOrganization(null)
    setIsAdmin(false)
    setIsPlatformAdmin(false)
    setNeedsOnboarding(false)
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
