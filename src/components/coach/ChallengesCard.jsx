// =============================================================================
// ChallengesCard — Active challenges or empty state with Create CTA
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { Flame, ChevronRight, Plus } from 'lucide-react'

export default function ChallengesCard({ challenges = [], onNavigate }) {
  const { isDark } = useTheme()

  const cardBg = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-brand-border'

  return (
    <div className={`${cardBg} rounded-2xl shadow-sm p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-orange-500" />
          <h3 className={`text-[10px] font-bold uppercase tracking-[1.2px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Challenges
          </h3>
        </div>
        {challenges.length > 0 && (
          <button onClick={() => onNavigate?.('achievements')} className="text-xs text-lynx-sky font-medium flex items-center gap-1">
            View All <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {challenges.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-2xl mb-2">🔥</p>
          <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>No active challenges</p>
          <p className={`text-xs mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Create one to motivate your squad</p>
          <button
            onClick={() => onNavigate?.('achievements')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-lynx-sky text-white text-xs font-semibold hover:brightness-110 transition"
          >
            <Plus className="w-3 h-3" />
            Create Challenge
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {challenges.slice(0, 3).map((ch, idx) => (
            <div key={ch.id || idx} className={`p-2.5 rounded-lg ${isDark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
              <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{ch.title || 'Challenge'}</p>
              <div className={`flex items-center justify-between mt-1 text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <span>{ch.participants_count || 0} participants</span>
                <span>{ch.progress || 0}% complete</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
