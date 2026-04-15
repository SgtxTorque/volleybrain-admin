import { useState } from 'react'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { useProgram, isAllPrograms } from '../../contexts/ProgramContext'
import { useSeason, ALL_SEASONS, isAllSeasons } from '../../contexts/SeasonContext'
import { useAuth } from '../../contexts/AuthContext'
import {
  Globe, Calendar, Users, User, ChevronDown, Check, ArrowRight, Layers
} from '../../constants/icons'
import TeamLogo from '../TeamLogo'

// ============================================
// HEADER PROGRAM SELECTOR (replaces HeaderSportSelector)
// ============================================
export function HeaderProgramSelector() {
  const { programs, selectedProgram, selectProgram, loading } = useProgram()
  const { isDark, colors } = useTheme()
  const [open, setOpen] = useState(false)

  if (loading || programs.length === 0) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition hover:bg-black/10 dark:hover:bg-white/10"
        style={{ color: colors.textSecondary }}
      >
        <Layers className="w-4 h-4" />
        <span className="text-sm font-medium" style={{ color: colors.text }}>
          {selectedProgram?.name || 'All Programs'}
        </span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute top-full left-0 mt-1 w-52 rounded-lg shadow-xl border overflow-hidden z-50"
            style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
          >
            <button
              onClick={() => { selectProgram(null); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition ${
                !selectedProgram ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]' : ''
              }`}
              style={{ color: !selectedProgram ? undefined : colors.text }}
              onMouseEnter={e => !selectedProgram || (e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')}
              onMouseLeave={e => !selectedProgram || (e.currentTarget.style.backgroundColor = '')}
            >
              <Globe className="w-4 h-4" />
              <span>All Programs</span>
              {!selectedProgram && <Check className="w-4 h-4 ml-auto" />}
            </button>
            {programs.map(p => (
              <button
                key={p.id}
                onClick={() => { selectProgram(p); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition ${
                  selectedProgram?.id === p.id ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]' : ''
                }`}
                style={{ color: selectedProgram?.id === p.id ? undefined : colors.text }}
                onMouseEnter={e => selectedProgram?.id !== p.id && (e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')}
                onMouseLeave={e => selectedProgram?.id !== p.id && (e.currentTarget.style.backgroundColor = '')}
              >
                <span>{p.icon || p.sport?.icon || '📋'}</span>
                <span>{p.name}</span>
                {selectedProgram?.id === p.id && <Check className="w-4 h-4 ml-auto" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// Keep backward-compatible alias
export const HeaderSportSelector = HeaderProgramSelector

// ============================================
// HEADER SEASON SELECTOR
// ============================================
export function HeaderSeasonSelector() {
  const { seasons, selectedSeason, selectSeason, loading } = useSeason()
  const { selectedProgram } = useProgram()
  const { isDark, colors } = useTheme()
  const { isAdmin } = useAuth()
  const [open, setOpen] = useState(false)
  const isAll = isAllSeasons(selectedSeason)

  if (loading || seasons.length === 0) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition hover:bg-black/10 dark:hover:bg-white/10"
        style={{ color: colors.textSecondary }}
      >
        <Calendar className="w-4 h-4" />
        <span className="text-sm font-medium" style={{ color: colors.text }}>
          {isAll ? 'All Seasons' : (selectedSeason?.name || 'Select Season')}
        </span>
        {!isAll && selectedSeason?.status === 'active' && (
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
        )}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute top-full left-0 mt-1 w-56 rounded-lg shadow-xl border overflow-hidden z-50 max-h-80 overflow-y-auto"
            style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
          >
            {isAdmin && (
              <button
                onClick={() => { selectSeason(ALL_SEASONS); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition ${
                  isAll ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]' : ''
                }`}
                style={{ color: isAll ? undefined : colors.text }}
                onMouseEnter={e => !isAll && (e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')}
                onMouseLeave={e => !isAll && (e.currentTarget.style.backgroundColor = '')}
              >
                <Globe className="w-4 h-4" />
                <span className="flex-1 text-left">All Seasons</span>
                {isAll && <Check className="w-4 h-4" />}
              </button>
            )}
            {seasons.map(s => (
              <button
                key={s.id}
                onClick={() => { selectSeason(s); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition ${
                  !isAll && selectedSeason?.id === s.id ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]' : ''
                }`}
                style={{ color: !isAll && selectedSeason?.id === s.id ? undefined : colors.text }}
                onMouseEnter={e => (isAll || selectedSeason?.id !== s.id) && (e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')}
                onMouseLeave={e => (isAll || selectedSeason?.id !== s.id) && (e.currentTarget.style.backgroundColor = '')}
              >
                {!selectedProgram && s.programs?.icon && <span>{s.programs.icon}</span>}
                {!selectedProgram && !s.programs?.icon && s.sports?.icon && <span>{s.sports.icon}</span>}
                <span className="flex-1 text-left">{s.name}</span>
                {s.status === 'active' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active" />
                )}
                {!isAll && selectedSeason?.id === s.id && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ============================================
// HEADER COACH TEAM SELECTOR
// ============================================
export function HeaderCoachTeamSelector({ teams, onSelectTeam }) {
  const { isDark, colors } = useTheme()
  const [open, setOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState(teams?.[0] || null)

  if (!teams || teams.length === 0) return null

  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 transition hover:bg-[var(--accent-primary)]/20"
      >
        <Users className="w-4 h-4 text-[var(--accent-primary)]" />
        <span className="text-sm font-medium text-[var(--accent-primary)]">
          {selectedTeam?.teams?.name || 'Select Team'}
        </span>
        {selectedTeam?.role === 'head' && (
          <span className="text-xs bg-[var(--accent-primary)]/20 px-1.5 py-0.5 rounded text-[var(--accent-primary)]">HC</span>
        )}
        <ChevronDown className={`w-3 h-3 text-[var(--accent-primary)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div 
            className="absolute top-full left-0 mt-1 w-56 rounded-lg shadow-xl border overflow-hidden z-50"
            style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
          >
            <div className="p-2 border-b" style={{ borderColor: colors.border }}>
              <p className="text-xs px-2" style={{ color: colors.textMuted }}>My Teams</p>
            </div>
            {teams.map(tc => (
              <button
                key={tc.team_id}
                onClick={() => { 
                  setSelectedTeam(tc)
                  onSelectTeam(tc.team_id)
                  setOpen(false)
                }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition ${
                  selectedTeam?.team_id === tc.team_id ? 'bg-[var(--accent-primary)]/20' : ''
                }`}
                style={{ color: colors.text }}
                onMouseEnter={e => selectedTeam?.team_id !== tc.team_id && (e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')}
                onMouseLeave={e => selectedTeam?.team_id !== tc.team_id && (e.currentTarget.style.backgroundColor = '')}
              >
                <TeamLogo team={tc.teams || {}} size={20} className="flex-shrink-0" />
                <span className="flex-1 text-left">{tc.teams?.name}</span>
                {tc.role === 'head' && (
                  <span className="text-xs bg-yellow-500/20 text-yellow-600 px-1.5 py-0.5 rounded">Head</span>
                )}
                {selectedTeam?.team_id === tc.team_id && <Check className="w-4 h-4 text-[var(--accent-primary)]" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ============================================
// HEADER CHILD SELECTOR
// ============================================
export function HeaderChildSelector({ children, onSelectChild, navigateToTeamWall }) {
  const { isDark, colors } = useTheme()
  const tc = useThemeClasses()
  const [open, setOpen] = useState(false)
  const [selectedChild, setSelectedChild] = useState(children?.[0] || null)

  if (!children || children.length === 0) return null

  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 transition hover:bg-[var(--accent-primary)]/20"
      >
        {selectedChild?.photo_url ? (
          <img src={selectedChild.photo_url} alt="" className="w-5 h-5 rounded-full object-cover" />
        ) : (
          <User className="w-4 h-4 text-[var(--accent-primary)]" />
        )}
        <span className="text-sm font-medium text-[var(--accent-primary)]">
          {selectedChild?.first_name || 'Select Player'}
        </span>
        <ChevronDown className={`w-3 h-3 text-[var(--accent-primary)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div 
            className="absolute top-full left-0 mt-1 w-64 rounded-lg shadow-xl border overflow-hidden z-50"
            style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
          >
            <div className="p-2 border-b" style={{ borderColor: colors.border }}>
              <p className="text-xs px-2" style={{ color: colors.textMuted }}>My Players</p>
            </div>
            {children.map(child => (
              <div key={child.id}>
                <button
                  onClick={() => { 
                    setSelectedChild(child)
                    onSelectChild(child.id)
                    setOpen(false)
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition ${
                    selectedChild?.id === child.id ? 'bg-[var(--accent-primary)]/20' : ''
                  }`}
                  style={{ color: colors.text }}
                  onMouseEnter={e => selectedChild?.id !== child.id && (e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')}
                  onMouseLeave={e => selectedChild?.id !== child.id && (e.currentTarget.style.backgroundColor = '')}
                >
                  {child.photo_url ? (
                    <img src={child.photo_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)]/30 flex items-center justify-center text-xs font-bold text-[var(--accent-primary)]">
                      {child.first_name?.[0]}
                    </div>
                  )}
                  <span className="flex-1 text-left">{child.first_name} {child.last_name}</span>
                  {selectedChild?.id === child.id && <Check className="w-4 h-4 text-[var(--accent-primary)]" />}
                </button>
                {child.team_players?.map(tp => (
                  <button
                    key={tp.team_id}
                    onClick={() => {
                      navigateToTeamWall(tp.team_id)
                      setOpen(false)
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 ml-4 text-xs transition ${tc.hoverBg}`}
                    style={{ color: colors.textSecondary }}
                  >
                    <TeamLogo team={tp.teams || {}} size={16} className="flex-shrink-0" />
                    <span>{tp.teams?.name}</span>
                    <ArrowRight className="w-3 h-3 ml-auto opacity-50" />
                  </button>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
