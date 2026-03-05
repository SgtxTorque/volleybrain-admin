// =============================================================================
// CoachTools — 2-column quick action grid
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { Megaphone, ClipboardList, Star, BarChart3, Users, Flame } from 'lucide-react'

const TOOLS = [
  { id: 'blast', icon: Megaphone, label: 'Send Blast', color: '#EF4444', page: 'blasts' },
  { id: 'lineup', icon: ClipboardList, label: 'Build Lineup', color: '#4BB9EC', page: 'gameprep' },
  { id: 'shoutout', icon: Star, label: 'Give Shoutout', color: '#F59E0B', action: 'shoutout' },
  { id: 'stats', icon: BarChart3, label: 'Enter Stats', color: '#8B5CF6', page: 'gameprep' },
  { id: 'roster', icon: Users, label: 'Manage Roster', color: '#22C55E', page: 'teams' },
  { id: 'challenge', icon: Flame, label: 'Challenge', color: '#EC4899', page: 'achievements' },
]

export default function CoachTools({ onNavigate, onShowShoutout }) {
  const { isDark } = useTheme()

  return (
    <div className={`rounded-2xl shadow-sm p-4 ${
      isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-brand-border'
    }`}>
      <h3 className={`text-[10px] font-bold uppercase tracking-[1.2px] mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {TOOLS.map(tool => (
          <button
            key={tool.id}
            onClick={() => {
              if (tool.action === 'shoutout') { onShowShoutout?.(); return }
              onNavigate?.(tool.page)
            }}
            className={`flex items-center gap-2.5 p-3 rounded-xl transition-colors ${
              isDark ? 'bg-white/[0.04] hover:bg-white/[0.08]' : 'bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <tool.icon className="w-4 h-4 shrink-0" style={{ color: tool.color }} />
            <span className={`text-r-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {tool.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
