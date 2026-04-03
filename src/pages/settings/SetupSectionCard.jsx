import { useState, useRef } from 'react'
import { SetupSectionContent } from './SetupSectionContent'

// ============================================
// SETUP SECTION CARD COMPONENT — V2 Styled
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
  accent,
  isDark
}) {
  const [sectionHasChanges, setSectionHasChanges] = useState(false)
  const [sectionSaving, setSectionSaving] = useState(false)
  const saveRef = useRef(null)
  const statusConfig = {
    complete: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', dot: 'bg-[#22C55E]', label: 'Complete' },
    partial: { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30', dot: 'bg-[#F59E0B]', label: 'In Progress' },
    not_started: { color: isDark ? 'text-slate-500' : 'text-slate-400', bg: isDark ? 'bg-white/[0.04]' : 'bg-[#F5F6F8]', border: isDark ? 'border-white/10' : 'border-slate-200', dot: 'bg-slate-400', label: 'Not Started' },
    loading: { color: isDark ? 'text-slate-500' : 'text-slate-400', bg: isDark ? 'bg-white/[0.04]' : 'bg-[#F5F6F8]', border: isDark ? 'border-white/10' : 'border-slate-200', dot: 'bg-slate-400', label: 'Loading' },
  }

  const config = statusConfig[status.status]

  return (
    <div className={`rounded-[14px] overflow-hidden transition-all ${
      isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'
    } ${expanded ? 'ring-2 ring-[#4BB9EC]/20 shadow-md' : 'shadow-sm'}`}>
      {/* Section Header */}
      <div
        className={`p-4 cursor-pointer transition-colors ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-[#F5F6F8]/60'}`}
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
            isDark ? 'bg-white/[0.06]' : 'bg-[#F5F6F8]'
          }`}>
            {section.icon}
          </div>

          {/* Title & Description */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-[#10284C]'}`} style={{ fontFamily: 'var(--v2-font)' }}>
                {section.title}
              </h3>
              {section.required && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 font-bold uppercase tracking-wide">
                  Required
                </span>
              )}
            </div>
            <p className={`text-sm truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{section.description}</p>
          </div>

          {/* Est Time */}
          <div className="text-right hidden sm:block">
            <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Est. time</p>
            <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{section.estTime}</p>
          </div>

          {/* Header Save Button */}
          {expanded && (
            <button
              onClick={(e) => { e.stopPropagation(); saveRef.current?.() }}
              disabled={!sectionHasChanges || sectionSaving}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold shrink-0 transition ${
                sectionHasChanges
                  ? 'bg-[#10284C] text-white hover:brightness-110'
                  : isDark ? 'bg-white/[0.06] text-slate-500 cursor-default' : 'bg-[#F5F6F8] text-slate-400 cursor-default'
              }`}
            >
              {sectionSaving ? 'Saving...' : sectionHasChanges ? 'Save' : '✓ Saved'}
            </button>
          )}

          {/* Status Badge - Pill */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${config.bg} ${config.border}`}>
            <span className={`w-2 h-2 rounded-full ${config.dot} inline-block`} />
            <span className={config.color}>{config.label}</span>
          </div>

          {/* Chevron */}
          <svg
            className={`w-5 h-5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''} ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className={`border-t ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'} p-6`}>
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
            onChangeStatus={(changes, isSaving) => { setSectionHasChanges(changes); setSectionSaving(isSaving) }}
            saveRef={saveRef}
          />
        </div>
      )}
    </div>
  )
}

export { SetupSectionCard }
