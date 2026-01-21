import { useState, useEffect } from 'react'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { useSeason } from '../../contexts/SeasonContext'
import { supabase } from '../../lib/supabase'
import { Sun, Moon } from '../../constants/icons'

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
// JERSEY NAV BADGE
// ============================================
export function JerseyNavBadge({ collapsed }) {
  const { selectedSeason } = useSeason()
  const [count, setCount] = useState(0)

  useEffect(() => {
    async function loadCount() {
      if (!selectedSeason?.id) {
        setCount(0)
        return
      }
      try {
        // Count players needing jerseys
        const { count: needsJersey } = await supabase
          .from('team_players')
          .select('*, teams!inner(season_id)', { count: 'exact', head: true })
          .eq('teams.season_id', selectedSeason.id)
          .is('jersey_number', null)

        // Count jerseys needing to be ordered
        const { count: needsOrder } = await supabase
          .from('jersey_assignments')
          .select('*, teams!inner(season_id)', { count: 'exact', head: true })
          .eq('teams.season_id', selectedSeason.id)
          .eq('needs_jersey_order', true)

        setCount((needsJersey || 0) + (needsOrder || 0))
      } catch (err) {
        console.error('Error loading jersey badge count:', err)
      }
    }
    loadCount()
  }, [selectedSeason?.id])

  if (count === 0) return null

  if (collapsed) {
    return <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" />
  }

  return (
    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-500">
      {count > 99 ? '99+' : count}
    </span>
  )
}
