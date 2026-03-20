import { useLocation } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import PlatformTopNav from './PlatformTopNav'
import PlatformSidebar from './PlatformSidebar'

export default function PlatformShell({
  children,
  profile,
  orgName,
  orgInitials,
  platformStats,
  onExitPlatformMode,
  onSignOut,
}) {
  const { isDark, toggleTheme } = useTheme()
  const location = useLocation()

  // Derive active section from URL
  const pathParts = location.pathname.split('/')
  const activeSection = pathParts[2] || 'overview'

  const contentBg = isDark ? 'bg-[#0F172A]' : 'bg-[#F8FAFC]'

  return (
    <div className={`min-h-screen ${contentBg}`}>
      <PlatformTopNav
        activeSection={activeSection}
        profile={profile}
        orgName={orgName}
        onExitPlatformMode={onExitPlatformMode}
      />
      <div className="flex pt-14">
        <PlatformSidebar
          activeSection={activeSection}
          platformStats={platformStats}
          onExitPlatformMode={onExitPlatformMode}
          orgName={orgName}
          orgInitials={orgInitials}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          onSignOut={onSignOut}
        />
        <main className="flex-1 pl-16 p-6 min-h-[calc(100vh-56px)]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
