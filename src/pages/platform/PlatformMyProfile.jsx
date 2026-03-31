import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { User, Key, Shield } from '../../constants/icons'

// Import the existing profile section components
import { ProfileInfoSection } from '../profile/ProfileInfoSection'
import { ChangePasswordSection, ChangeEmailSection } from '../profile/ProfileSecuritySection'

function PlatformMyProfile({ showToast }) {
  const { user, profile, setProfile } = useAuth()
  const { isDark } = useTheme()
  const tc = useThemeClasses()
  const [activeTab, setActiveTab] = useState('info')

  function handleProfileUpdate(updatedProfile) {
    setProfile(updatedProfile)
  }

  const tabs = [
    { id: 'info', label: 'Profile Info', icon: User },
    { id: 'security', label: 'Security', icon: Key },
  ]

  const cardClass = isDark
    ? 'bg-[#1E293B] border border-slate-700 shadow-sm rounded-[14px]'
    : 'bg-white border border-slate-200 shadow-sm rounded-[14px]'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold ${tc.text}`}>My Account</h1>
        <p className={`text-sm ${tc.textMuted} mt-1`}>
          Manage your profile, password, and account settings
        </p>
      </div>

      {/* Profile summary card */}
      <div className={`${cardClass} p-6 flex items-center gap-4`}>
        <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center">
          {profile?.avatar_url || profile?.photo_url ? (
            <img src={profile.avatar_url || profile.photo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className={`text-xl font-bold ${tc.textMuted}`}>
              {(profile?.full_name || 'A').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <p className={`text-lg font-bold ${tc.text}`}>{profile?.full_name || 'Admin'}</p>
          <p className={`text-sm ${tc.textMuted}`}>{profile?.email || user?.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500">Active</span>
            {profile?.is_platform_admin && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-500">
                <Shield className="w-3 h-3 inline mr-1" />Super Admin
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                isActive
                  ? (isDark ? 'bg-[#4BB9EC]/15 text-[#4BB9EC] border border-[#4BB9EC]/30' : 'bg-sky-50 text-sky-600 border border-sky-200')
                  : (isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50')
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'info' && (
        <ProfileInfoSection
          profile={profile}
          user={user}
          isDark={isDark}
          tc={tc}
          showToast={showToast}
          onProfileUpdate={handleProfileUpdate}
        />
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          <ChangePasswordSection isDark={isDark} tc={tc} showToast={showToast} />
          <ChangeEmailSection user={user} profile={profile} isDark={isDark} tc={tc} showToast={showToast} />
        </div>
      )}
    </div>
  )
}

export default PlatformMyProfile
