import { SetupSectionContent } from './SetupSectionContent'

// ============================================
// SETUP SECTION CARD COMPONENT
// ============================================

function SetupSectionCard({
  section,
  status,
  expanded,
  onToggle,
  setupData,
  setSetupData,
  onSave,
  saving,
  showToast,
  organization,
  waivers,
  setWaivers,
  venues,
  setVenues,
  adminUsers,
  tc,
  accent
}) {
  const statusConfig = {
    complete: { icon: 'check-square', color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Complete' },
    partial: { icon: '⚠️', color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'In Progress' },
    not_started: { icon: '⬜', color: tc.textMuted, bg: tc.cardBgAlt, label: 'Not Started' },
    loading: { icon: '⏳', color: tc.textMuted, bg: tc.cardBgAlt, label: 'Loading' },
  }

  const config = statusConfig[status.status]

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${tc.card} ${expanded ? 'ring-2' : ''}`} style={{ ringColor: expanded ? accent.primary : 'transparent' }}>
      {/* Section Header - Always visible */}
      <div
        className={`p-4 cursor-pointer transition-colors ${tc.hoverBg}`}
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${config.bg}`}>
            {section.icon}
          </div>

          {/* Title & Description */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={`font-semibold ${tc.text}`}>{section.title}</h3>
              {section.required && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">Required</span>
              )}
            </div>
            <p className={`text-sm ${tc.textMuted} truncate`}>{section.description}</p>
          </div>

          {/* Est Time */}
          <div className={`text-right hidden sm:block`}>
            <p className={`text-xs ${tc.textMuted}`}>Est. time</p>
            <p className={`text-sm font-medium ${tc.textSecondary}`}>{section.estTime}</p>
          </div>

          {/* Status Badge */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bg}`}>
            <span>{config.icon}</span>
            <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
          </div>

          {/* Expand Arrow */}
          <span className={`text-lg ${tc.textMuted} transition-transform ${expanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className={`border-t ${tc.border} p-6`}>
          <SetupSectionContent
            sectionKey={section.key}
            setupData={setupData}
            setSetupData={setSetupData}
            onSave={onSave}
            saving={saving}
            showToast={showToast}
            organization={organization}
            waivers={waivers}
            setWaivers={setWaivers}
            venues={venues}
            setVenues={setVenues}
            adminUsers={adminUsers}
            tc={tc}
            accent={accent}
          />
        </div>
      )}
    </div>
  )
}

export { SetupSectionCard }
