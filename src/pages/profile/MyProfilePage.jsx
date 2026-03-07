import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { User } from '../../constants/icons'
import PageShell from '../../components/pages/PageShell'
import { ProfileInfoSection } from './ProfileInfoSection'
import { ChangePasswordSection, ChangeEmailSection, DeleteAccountSection } from './ProfileSecuritySection'
import { EmergencyContactSection, CoachSection, ParentSection } from './ProfileDetailsSection'
import { OrgMembershipsSection, MyHistorySection } from './ProfileHistorySection'

// ============================================
// MY PROFILE PAGE - Self-Service Profile Portal
// Lynx Brand Treatment
// ============================================
function MyProfilePage({ showToast }) {
  const navigate = useNavigate()
  const { user, profile, setProfile } = useAuth()
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const [roleContext, setRoleContext] = useState({ isCoach: false, isParent: false })

  useEffect(() => { detectRoles() }, [profile?.id])

  async function detectRoles() {
    if (!profile?.id) return
    try {
      // Check if user is a coach
      const { data: coach } = await supabase
        .from('coaches')
        .select('id')
        .eq('profile_id', profile.id)
        .maybeSingle()

      // Check if user is a parent (has children)
      const { data: children } = await supabase
        .from('players')
        .select('id')
        .eq('parent_account_id', profile.id)
        .limit(1)

      setRoleContext({
        isCoach: !!coach,
        isParent: (children?.length || 0) > 0,
      })
    } catch (err) { console.error('Error detecting roles:', err) }
  }

  function handleProfileUpdate(updatedProfile) {
    setProfile(updatedProfile)
  }

  return (
    <PageShell
      breadcrumb="My Profile"
      title={
        <span className="flex items-center gap-3">
          <User className="w-7 h-7 text-lynx-sky" />
          My Profile
        </span>
      }
      subtitle="Manage your personal information"
    >
      <div className="space-y-6 max-w-3xl">
        <ProfileInfoSection
          profile={profile}
          user={user}
          isDark={isDark}
          tc={tc}
          showToast={showToast}
          onProfileUpdate={handleProfileUpdate}
        />

        <EmergencyContactSection
          profile={profile}
          isDark={isDark}
          tc={tc}
          showToast={showToast}
          onProfileUpdate={handleProfileUpdate}
        />

        {roleContext.isCoach && (
          <CoachSection
            profile={profile}
            isDark={isDark}
            tc={tc}
            showToast={showToast}
          />
        )}

        {roleContext.isParent && (
          <ParentSection
            profile={profile}
            isDark={isDark}
            tc={tc}
          />
        )}

        {/* Account Settings */}
        <ChangePasswordSection
          isDark={isDark}
          tc={tc}
          showToast={showToast}
        />

        <ChangeEmailSection
          user={user}
          profile={profile}
          isDark={isDark}
          tc={tc}
          showToast={showToast}
        />

        <OrgMembershipsSection
          profile={profile}
          isDark={isDark}
          tc={tc}
        />

        {/* My History (always last before danger zone) */}
        <MyHistorySection
          profile={profile}
          isDark={isDark}
          tc={tc}
          onNavigateToArchive={() => navigate('/archives')}
        />

        {/* Danger Zone (always very last) */}
        <DeleteAccountSection
          profile={profile}
          isDark={isDark}
          tc={tc}
          showToast={showToast}
        />
      </div>
    </PageShell>
  )
}

export { MyProfilePage }
