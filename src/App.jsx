import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { JourneyProvider } from './contexts/JourneyContext'

// Auth Pages
import { LoginPage, SetupWizard } from './pages/auth'

// Public Pages
import { PublicRegistrationPage, OrgDirectoryPage } from './pages/public'

// Main App
import { MainApp } from './MainApp'

function PublicRegistrationRoute() {
  return <PublicRegistrationPage />
}

function PublicDirectoryRoute() {
  return <OrgDirectoryPage onNavigateToLogin={() => { window.location.href = '/' }} />
}

function AuthenticatedApp() {
  const { user, isAdmin, loading, needsOnboarding, completeOnboarding } = useAuth()
  const { colors } = useTheme()

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

function AppContent() {
  return (
    <Routes>
      {/* Public routes — no auth required */}
      <Route path="/register/:orgIdOrSlug/:seasonId" element={<PublicRegistrationRoute />} />

      {/* All other routes go through the authenticated app */}
      <Route path="/*" element={<AuthenticatedApp />} />
    </Routes>
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
