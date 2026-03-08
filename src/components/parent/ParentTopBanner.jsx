// =============================================================================
// ParentTopBanner — dual-purpose top slot: alerts > open registrations > onboarding
// Returns null when nothing to show (progressive disclosure)
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { AlertTriangle, ChevronRight, Megaphone } from '../../constants/icons'
import ParentJourneyCard from './ParentJourneyCard'

export default function ParentTopBanner({ onNavigate, registrationData, openSeasons, alerts }) {
  const { isDark } = useTheme()
  const cardBg = isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'

  // Priority 1: Active org alerts/announcements
  if (alerts?.length > 0) {
    const alert = alerts[0]
    return (
      <div className={`${cardBg} rounded-2xl shadow-sm overflow-hidden h-full flex flex-col`}>
        <div className="px-4 py-2 flex items-center gap-2">
          <Megaphone className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
          <h3 className={`text-[10px] font-bold uppercase tracking-[1.2px] ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
            Announcement
          </h3>
        </div>
        <div className={`flex-1 px-4 pb-3 overflow-y-auto border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
          {alerts.slice(0, 3).map((a, idx) => (
            <div key={a.id || idx} className={`py-2 ${idx > 0 ? (isDark ? 'border-t border-white/[0.04]' : 'border-t border-slate-100') : ''}`}>
              <p className={`text-r-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {a.title || a.subject || 'Announcement'}
              </p>
              {a.body && (
                <p className={`text-r-xs mt-0.5 line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {a.body}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Priority 2: Open registration seasons the parent hasn't signed up for
  const registeredSeasonIds = new Set((registrationData || []).map(c => c.season_id).filter(Boolean))
  const unregisteredSeasons = (openSeasons || []).filter(s => !registeredSeasonIds.has(s.id))

  if (unregisteredSeasons.length > 0) {
    return (
      <div className={`${cardBg} rounded-2xl shadow-sm overflow-hidden h-full flex flex-col`}>
        <div className="px-4 py-2 flex items-center gap-2">
          <AlertTriangle className={`w-4 h-4 text-lynx-sky`} />
          <h3 className={`text-[10px] font-bold uppercase tracking-[1.2px] text-lynx-sky`}>
            Open Registration
          </h3>
        </div>
        <div className={`flex-1 px-4 pb-3 overflow-y-auto border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
          {unregisteredSeasons.slice(0, 3).map((season) => (
            <button
              key={season.id}
              onClick={() => onNavigate?.(`/register/${season.organizations?.slug || 'org'}/${season.id}`)}
              className={`w-full flex items-center gap-3 py-2.5 text-left group transition ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-lynx-cloud'}`}
            >
              <div className="w-8 h-8 rounded-lg bg-lynx-sky/15 flex items-center justify-center text-sm">
                {season.sports?.icon || '🏐'}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-r-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {season.name}
                </p>
                <p className={`text-r-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Registration is open — sign up now!
                </p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-lynx-sky flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Priority 3: Season onboarding tracker (returns null itself when all done)
  return <ParentJourneyCard onNavigate={onNavigate} registrationData={registrationData} />
}
