import { useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { JourneyProvider } from './contexts/JourneyContext'
import { CoachMarkProvider } from './contexts/CoachMarkContext'

// Auth Pages
import { LoginPage, SetupWizard, LandingPage } from './pages/auth'

// Public Pages
import { PublicRegistrationPage, OrgDirectoryPage } from './pages/public'
import { RegistrationCartPage } from './pages/public/RegistrationCartPage'
import CoachInviteAcceptPage from './pages/public/CoachInviteAcceptPage'
import ParentInviteAcceptPage from './pages/public/ParentInviteAcceptPage'
import PlayerLoginPage from './pages/public/PlayerLoginPage'

// Main App
import { MainApp } from './MainApp'

// V2 Design Tokens (namespaced under --v2-*, no collision with existing theme)
import './styles/v2-tokens.css'

function PublicRegistrationRoute() {
  return <PublicRegistrationPage />
}

function RegistrationCartRoute() {
  return <RegistrationCartPage />
}

function PublicDirectoryRoute() {
  return <OrgDirectoryPage onNavigateToLogin={() => { window.location.href = '/' }} />
}

function AuthenticatedApp() {
  const { user, isAdmin, loading, needsOnboarding, completeOnboarding } = useAuth()
  const { colors } = useTheme()
  const navigate = useNavigate()
  const [authView, setAuthView] = useState('landing') // 'landing' | 'login' | 'signup'

  // After wizard completes, ensure new admins land on /dashboard
  const handleOnboardingComplete = async () => {
    await completeOnboarding()
    navigate('/dashboard', { replace: true })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: colors.bg }}>
        <div className="w-10 h-10 border-3 rounded-full animate-spin" style={{ borderColor: colors.border, borderTopColor: '#4BB9EC' }} />
        <p className="mt-4" style={{ color: colors.textSecondary }}>Loading...</p>
        <style>{`.animate-spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!user) {
    if (authView === 'login') return <LoginPage initialMode="login" onBack={() => setAuthView('landing')} />
    if (authView === 'signup') return <LoginPage initialMode="signup" onBack={() => setAuthView('landing')} />
    return <LandingPage onNavigate={setAuthView} />
  }

  return (
    <JourneyProvider>
      <CoachMarkProvider>
        {needsOnboarding ? (
          <SetupWizard onComplete={handleOnboardingComplete} />
        ) : (
          <MainApp />
        )}
      </CoachMarkProvider>
    </JourneyProvider>
  )
}

function AppContent() {
  return (
    <Routes>
      {/* Public routes — no auth required */}
      <Route path="/register/:orgIdOrSlug" element={<RegistrationCartRoute />} />
      <Route path="/register/:orgIdOrSlug/:seasonId" element={<PublicRegistrationRoute />} />
      <Route path="/invite/coach/:inviteCode" element={<CoachInviteAcceptPage />} />
      <Route path="/invite/parent/:inviteCode" element={<ParentInviteAcceptPage />} />
      <Route path="/player-login" element={<PlayerLoginPage />} />

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
