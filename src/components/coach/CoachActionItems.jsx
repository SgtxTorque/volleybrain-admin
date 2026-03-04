// =============================================================================
// CoachActionItems — 3 action items with colored dots
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { ChevronRight, Zap } from 'lucide-react'

export default function CoachActionItems({ items = [], onNavigate }) {
  const { isDark } = useTheme()

  if (items.length === 0) {
    return (
      <div className={`rounded-2xl shadow-sm p-4 ${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-brand-border'}`}>
        <div className="flex items-center gap-1.5 mb-3">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <h3 className={`text-[10px] font-bold uppercase tracking-[1.2px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Action Items</h3>
        </div>
        <div className="text-center py-3">
          <p className="text-emerald-500 text-sm font-semibold">All caught up!</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-2xl shadow-sm p-4 ${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-brand-border'}`}>
      <div className="flex items-center gap-1.5 mb-3">
        <Zap className="w-3.5 h-3.5 text-amber-500" />
        <h3 className={`text-[10px] font-bold uppercase tracking-[1.2px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Action Items</h3>
      </div>
      <div className="space-y-1">
        {items.slice(0, 4).map((item, idx) => (
          <button
            key={idx}
            onClick={item.action}
            className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-colors ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'}`}
          >
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color || '#F59E0B' }} />
            <span className={`text-sm flex-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{item.label}</span>
            <ChevronRight className={`w-3.5 h-3.5 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
          </button>
        ))}
      </div>
    </div>
  )
}
