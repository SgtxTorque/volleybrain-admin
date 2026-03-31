import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield } from 'lucide-react'

const NAV_SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'organizations', label: 'Organizations' },
  { id: 'users', label: 'Users' },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'support', label: 'Support' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'email', label: 'Email' },
  { id: 'features', label: 'Features' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'audit', label: 'Audit Log' },
  { id: 'settings', label: 'Settings' },
]

export default function PlatformTopNav({
  activeSection = 'overview',
  profile = null,
  orgName = 'My Club',
  onExitPlatformMode,
}) {
  const navigate = useNavigate()
  const displayName = profile?.full_name || 'Admin'
  const avatarInitial = displayName.charAt(0).toUpperCase()

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-6"
      style={{
        background: 'linear-gradient(to right, #F8FAFC 0%, #E8F4FD 35%, #4BB9EC 70%, #0B1628 100%)',
      }}
    >
      {/* Left: Logo + Platform Admin label */}
      <div className="flex items-center gap-3">
        <img src="/lynx-logo.png" alt="Lynx" className="h-7" />
        <div className="flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-[#0B1628]" />
          <span className="text-lg font-bold text-[#0B1628]">Platform Admin</span>
        </div>
      </div>

      {/* Center: Nav items — positioned in the light zone */}
      <nav className="flex items-center gap-1">
        {NAV_SECTIONS.map(section => {
          const isActive = activeSection === section.id
          return (
            <button
              key={section.id}
              onClick={() => navigate(`/platform/${section.id}`)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                isActive
                  ? 'bg-[#4BB9EC]/15 text-[#0B1628] border border-[#4BB9EC]/30'
                  : 'text-[#0B1628]/70 hover:text-[#0B1628] hover:bg-[#0B1628]/5'
              }`}
            >
              {section.label}
            </button>
          )
        })}
      </nav>

      {/* Right: Profile avatar + Exit button (in darker zone) */}
      <div className="flex items-center gap-3">
        {/* Profile avatar */}
        <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold"
          style={{ background: profile?.photo_url ? 'transparent' : 'rgba(255,255,255,0.2)', color: '#fff' }}
        >
          {profile?.photo_url ? (
            <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
          ) : avatarInitial}
        </div>

        {/* Exit to Org button */}
        <button
          onClick={onExitPlatformMode}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white/90 hover:bg-white/20 hover:text-white transition-colors text-sm font-medium border border-white/10"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Exit to {orgName}</span>
          <span className="md:hidden">Exit</span>
        </button>
      </div>
    </header>
  )
}

export { NAV_SECTIONS }
