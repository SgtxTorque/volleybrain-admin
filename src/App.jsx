import { useState, useEffect } from 'react'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { JourneyProvider } from './contexts/JourneyContext'

// Auth Pages
import { LoginPage, SetupWizard } from './pages/auth'

// Public Pages
import { PublicRegistrationPage } from './pages/public'

// Main App
import { MainApp } from './MainApp'

function AppContent() {
  const { user, isAdmin, loading, needsOnboarding, completeOnboarding } = useAuth()
  const { isDark, colors } = useTheme()

  // Check for public registration route FIRST (before auth check)
  // This allows unauthenticated users to register
  const [isPublicRoute, setIsPublicRoute] = useState(false)
  const [publicRouteData, setPublicRouteData] = useState(null)

  useEffect(() => {
    const path = window.location.pathname
    // Match /register/{orgId}/{seasonId} or /register/{orgSlug}/{seasonId}
    const registerMatch = path.match(/^\/register\/([^\/]+)\/([^\/]+)\/?$/)
    if (registerMatch) {
      setIsPublicRoute(true)
      setPublicRouteData({
        type: 'registration',
        orgIdOrSlug: registerMatch[1],
        seasonId: registerMatch[2]
      })
    }
  }, [])

  // Show public registration form (no auth required)
  if (isPublicRoute && publicRouteData?.type === 'registration') {
    return (
      <ThemeProvider>
        <PublicRegistrationPage 
          orgIdOrSlug={publicRouteData.orgIdOrSlug}
          seasonId={publicRouteData.seasonId}
        />
      </ThemeProvider>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: colors.bg }}>
        <div className="w-10 h-10 border-3 rounded-full animate-spin" style={{ borderColor: colors.border, borderTopColor: '#EAB308' }} />
        <p className="mt-4" style={{ color: colors.textSecondary }}>Loading...</p>
        <style>{`.animate-spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!user) return <LoginPage />
  
  // JourneyProvider wraps everything after auth — SetupWizard needs it for completeStep('create_org')
  return (
    <JourneyProvider>
      {needsOnboarding ? (
        <SetupWizard onComplete={completeOnboarding} />
      ) : !isAdmin ? (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.bg }}>
          <div className="text-center">
            <span className="text-5xl">🔒</span>
            <h2 className="text-xl font-bold mt-4" style={{ color: colors.text }}>Access Denied</h2>
            <p className="mt-2" style={{ color: colors.textSecondary }}>Admin access required</p>
          </div>
        </div>
      ) : (
        <MainApp />
      )}
    </JourneyProvider>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
