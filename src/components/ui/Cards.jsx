import { useState } from 'react'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { Sun, Moon } from '../../constants/icons'

// ============================================
// ACCENT COLOR PICKER
// ============================================
export function AccentColorPicker({ compact = true }) {
  const { accentColor, changeAccent, isDark } = useTheme()
  const tc = useThemeClasses()
  const [isOpen, setIsOpen] = useState(false)
  
  const colors = [
    { id: 'orange', color: '#F97316', label: 'Orange' },
    { id: 'blue', color: '#0EA5E9', label: 'Blue' },
    { id: 'purple', color: '#8B5CF6', label: 'Purple' },
    { id: 'green', color: '#10B981', label: 'Green' },
    { id: 'rose', color: '#F43F5E', label: 'Rose' },
    { id: 'slate', color: '#64748B', label: 'Slate' },
  ]
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2.5 rounded-xl transition ${tc.hoverBg} ${tc.textMuted}`}
        title="Customize accent color"
      >
        🎨
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className={`absolute right-0 top-full mt-2 p-4 rounded-xl z-50 shadow-xl border ${tc.modal} ${tc.border}`}>
            <p className={`text-sm font-semibold mb-3 ${tc.text}`}>Accent Color</p>
            <div className="flex gap-2">
              {colors.map(c => (
                <button
                  key={c.id}
                  onClick={() => { changeAccent(c.id); setIsOpen(false) }}
                  className={`w-8 h-8 rounded-lg transition-transform hover:scale-110 ${
                    accentColor === c.id ? 'ring-2 ring-offset-2 ring-white/50' : ''
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={c.label}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================
// THEME TOGGLE BUTTON
// ============================================
export function ThemeToggleButton({ collapsed }) {
  const { isDark, toggleTheme } = useTheme()
  
  return (
    <button 
      onClick={toggleTheme}
      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition text-sm ${
        isDark 
          ? 'text-slate-400 hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10' 
          : 'text-slate-600 hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10'
      }`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      {!collapsed && <span>{isDark ? 'Light' : 'Dark'}</span>}
    </button>
  )
}

// ============================================
// QUICK ACTION CARD
// ============================================
export function QuickActionCard({ icon, title, description, onClick, variant = 'default' }) {
  const { isDark, accent } = useTheme()
  const tc = useThemeClasses()
  
  const variants = {
    default: { iconBg: isDark ? 'bg-slate-700' : 'bg-slate-100', iconColor: tc.textSecondary },
    accent: { iconBg: '', iconColor: '' },
    warning: { iconBg: isDark ? 'bg-amber-500/20' : 'bg-amber-50', iconColor: isDark ? 'text-amber-400' : 'text-amber-600' },
    success: { iconBg: isDark ? 'bg-emerald-500/20' : 'bg-emerald-50', iconColor: isDark ? 'text-emerald-400' : 'text-emerald-600' },
  }
  const v = variants[variant]

  return (
    <div onClick={onClick} className={`${tc.cardBg} border ${tc.border} rounded-xl p-5 cursor-pointer transition-all duration-200 min-h-[140px] hover:shadow-lg hover:-translate-y-0.5 hover:border-slate-600`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${v.iconBg}`} style={{ backgroundColor: variant === 'accent' ? `${accent?.primary}20` : undefined }}>
        <span className={`text-xl ${v.iconColor}`} style={{ color: variant === 'accent' ? accent?.primary : undefined }}>{icon}</span>
      </div>
      <p className={`font-semibold ${tc.text} mb-1`}>{title}</p>
      <p className={`text-sm ${tc.textMuted} leading-relaxed`}>{description}</p>
    </div>
  )
}

// ============================================
// ATTENTION ITEM
// ============================================
export function AttentionItem({ title, description, priority = 'medium', time, onClick }) {
  const tc = useThemeClasses()
  const priorityDot = { high: 'bg-amber-500', medium: 'bg-sky-500', low: 'bg-slate-400' }
  
  return (
    <div onClick={onClick} className={`flex items-center gap-4 py-4 cursor-pointer transition-colors border-b ${tc.border} last:border-0 ${tc.hoverBg} -mx-6 px-6`}>
      <div className={`w-2 h-2 rounded-full ${priorityDot[priority]} flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${tc.text}`}>{title}</p>
        <p className={`text-sm ${tc.textMuted} truncate`}>{description}</p>
      </div>
      {time && <div className={`flex items-center gap-1 text-xs ${tc.textMuted}`}><span>🕐</span><span>{time}</span></div>}
      <span className={`text-sm ${tc.textMuted}`}>→</span>
    </div>
  )
}

// ============================================
// SEASON PROGRESS CARD
// ============================================
export function SeasonProgressCard({ season, stats }) {
  const { isDark } = useTheme()
  const tc = useThemeClasses()
  
  if (!season) return null
  const progress = stats?.progress || 85
  
  return (
    <div className={`${tc.cardBg} border ${tc.border} rounded-xl p-6`}>
      <div className="flex items-center justify-between mb-5">
        <h3 className={`font-semibold ${tc.text}`}>Season Progress</h3>
        <Badge variant="success">Active</Badge>
      </div>
      <div className={`flex items-center gap-5 p-5 rounded-xl ${tc.cardBgAlt}`}>
        <ProgressRing progress={progress} />
        <div>
          <p className={`font-semibold ${tc.text}`}>{season.name}</p>
          <p className={`text-sm ${tc.textMuted}`}>Week {stats?.weeksElapsed || 11} of {stats?.totalWeeks || 14}</p>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        <div className={`flex justify-between py-2 border-b ${tc.border}`}>
          <span className={`text-sm ${tc.textMuted}`}>Registration Fee</span>
          <span className={`text-sm font-semibold ${tc.text}`}>${season.registration_fee || season.fee_registration || 150}</span>
        </div>
        <div className={`flex justify-between py-2`}>
          <span className={`text-sm ${tc.textMuted}`}>Status</span>
          <span className={`text-sm font-semibold ${tc.text}`}>{season.status === 'active' ? 'Active' : season.status}</span>
        </div>
      </div>
    </div>
  )
}

// ============================================
// PROGRESS RING
// ============================================
export function ProgressRing({ progress, size = 64, color }) {
  const { accent, isDark } = useTheme()
  const tc = useThemeClasses()
  const radius = (size - 6) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90">
        <circle 
          cx={size/2} 
          cy={size/2} 
          r={radius} 
          stroke={isDark ? '#334155' : '#E2E8F0'} 
          strokeWidth="6" 
          fill="none" 
        />
        <circle 
          cx={size/2} 
          cy={size/2} 
          r={radius} 
          stroke={color || accent?.primary} 
          strokeWidth="6" 
          fill="none" 
          strokeLinecap="round" 
          strokeDasharray={circumference} 
          strokeDashoffset={offset} 
          className="transition-all duration-500" 
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${tc.text}`}>{progress}%</span>
    </div>
  )
}

// ============================================
// BADGE COMPONENT
// ============================================
export function Badge({ children, variant = 'default' }) {
  const { isDark, accent } = useTheme()
  const variants = {
    default: isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600',
    accent: '',
    success: isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600',
    warning: isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-50 text-amber-600',
    error: isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600',
    info: isDark ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-50 text-sky-600',
  }
  
  return (
    <span 
      className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${variants[variant]}`}
      style={{ 
        backgroundColor: variant === 'accent' ? `${accent?.primary}20` : undefined, 
        color: variant === 'accent' ? accent?.primary : undefined 
      }}
    >
      {children}
    </span>
  )
}
