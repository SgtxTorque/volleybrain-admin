// =============================================================================
// GameDayHelpers — constants, theme, icons, action bar for Game Day
// =============================================================================

// ═══ CONSTANTS ═══
export const positionNames = {
  'OH': 'Outside Hitter', 'S': 'Setter', 'MB': 'Middle Blocker',
  'OPP': 'Opposite', 'L': 'Libero', 'DS': 'Defensive Specialist',
  'RS': 'Right Side', 'H': 'Hitter',
}

export const VOLLEYBALL_POSITIONS = [
  { id: 4, name: 'P4', label: 'Left Front', row: 'front', gridCol: 1 },
  { id: 3, name: 'P3', label: 'Middle Front', row: 'front', gridCol: 2 },
  { id: 2, name: 'P2', label: 'Right Front', row: 'front', gridCol: 3 },
  { id: 5, name: 'P5', label: 'Left Back', row: 'back', gridCol: 1 },
  { id: 6, name: 'P6', label: 'Middle Back', row: 'back', gridCol: 2 },
  { id: 1, name: 'P1', label: 'Right Back', row: 'back', gridCol: 3, isServe: true },
]

export const STAT_ACTIONS = [
  { key: 'kill', label: 'Kill', icon: '⚡', color: '#EF4444', points: 1 },
  { key: 'ace', label: 'Ace', icon: '🎯', color: '#10B981', points: 1 },
  { key: 'block', label: 'Block', icon: '🛡️', color: '#6366F1', points: 1 },
  { key: 'dig', label: 'Dig', icon: '💪', color: '#F59E0B', points: 0 },
  { key: 'assist', label: 'Assist', icon: '🤝', color: '#8B5CF6', points: 0 },
  { key: 'error', label: 'Error', icon: '❌', color: '#64748b', points: -1, negative: true },
]

export const GAME_MODES = {
  PRE_GAME: 'pre_game',
  LIVE: 'live',
  TIMEOUT: 'timeout',
  POST_GAME: 'post_game',
}

// ═══ THEME ═══
// Delegates to the real theme system while maintaining the same API shape
// so callers (GameDayCommandCenter, LineupPanel, etc.) don't need to change.
import { useTheme } from '../../contexts/ThemeContext'

export function useGameDayTheme() {
  const { isDark } = useTheme()
  return isDark ? {
    pageBg: '#0a0a0f',
    cardBg: 'rgba(30, 41, 59, 0.5)',
    cardBgSolid: '#1e293b',
    headerBg: 'rgba(15, 23, 42, 0.9)',
    sidebarBg: 'rgba(30, 41, 59, 0.5)',
    courtBg: 'rgba(30, 41, 59, 0.3)',
    courtBorder: 'rgba(51, 65, 85, 0.5)',
    netBg: 'linear-gradient(90deg, #334155, #475569, #334155)',
    attackLine: 'rgba(249, 115, 22, 0.4)',
    textPrimary: '#ffffff',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    textInverse: '#1e293b',
    border: 'rgba(51, 65, 85, 0.5)',
    borderLight: 'rgba(51, 65, 85, 0.3)',
    buttonBg: '#1e293b',
    buttonBgHover: '#334155',
    buttonText: '#e2e8f0',
    scoreboardBg: 'rgba(15, 23, 42, 0.8)',
    emptySlotBg: 'rgba(30, 41, 59, 0.3)',
    emptySlotBorder: '#475569',
    playerCardGradient: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.7), transparent)',
    statsBg: 'rgba(15, 23, 42, 0.5)',
    modalOverlay: 'rgba(0, 0, 0, 0.8)',
    modalBg: '#0f172a',
    accent: '#F59E0B',
    accentLight: 'rgba(245, 158, 11, 0.1)',
    isDark: true,
  } : {
    pageBg: '#F5F7FA',
    cardBg: 'rgba(255, 255, 255, 0.9)',
    cardBgSolid: '#FFFFFF',
    headerBg: 'rgba(255, 255, 255, 0.95)',
    sidebarBg: 'rgba(245, 247, 250, 0.9)',
    courtBg: 'rgba(240, 243, 247, 0.5)',
    courtBorder: 'rgba(223, 228, 234, 0.8)',
    netBg: 'linear-gradient(90deg, #DFE4EA, #CBD5E1, #DFE4EA)',
    attackLine: 'rgba(249, 115, 22, 0.25)',
    textPrimary: '#10284C',
    textSecondary: '#5A6B7F',
    textMuted: '#94A3B8',
    textInverse: '#FFFFFF',
    border: 'rgba(223, 228, 234, 0.8)',
    borderLight: 'rgba(223, 228, 234, 0.5)',
    buttonBg: '#F0F3F7',
    buttonBgHover: '#E2E8F0',
    buttonText: '#10284C',
    scoreboardBg: 'rgba(255, 255, 255, 0.95)',
    emptySlotBg: 'rgba(240, 243, 247, 0.5)',
    emptySlotBorder: '#DFE4EA',
    playerCardGradient: 'linear-gradient(to top, rgba(255,255,255,0.95), rgba(255,255,255,0.7), transparent)',
    statsBg: 'rgba(245, 247, 250, 0.8)',
    modalOverlay: 'rgba(0, 0, 0, 0.3)',
    modalBg: '#FFFFFF',
    accent: '#F59E0B',
    accentLight: 'rgba(245, 158, 11, 0.08)',
    isDark: false,
  }
}

// ═══ ICONS ═══
export const Icons = {
  X: ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  RotateCw: ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  ),
  Play: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
  ),
  Pause: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
    </svg>
  ),
  Users: ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  BarChart: ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>
    </svg>
  ),
  Check: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
  ),
  ChevronLeft: ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
  ),
  ChevronRight: ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
  ),
  Zap: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
  ),
  Flame: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 22c-4.97 0-9-4.03-9-9 0-3.53 2.04-6.58 5-8.05C8 7.02 10 9 10 9s.96-2.2.96-4.5C10.96 2.24 12.97 0 12 0c1.5 0 3 1.5 3 3 0 2.5-1 4.5-1 4.5s2-2 2-4c3 1.5 5 4.5 5 8 0 4.97-4.03 9-9 9z"/>
    </svg>
  ),
  Trophy: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>
  ),
  Clock: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
}

// ═══ ACTION BAR ═══
export function ActionBar({ mode, onRotate, onTimeout, onSubstitute, onStartGame, onEndSet, onEndGame, rotation, canStartGame, theme }) {
  if (mode === GAME_MODES.PRE_GAME) {
    return (
      <div className="p-5" style={{ backgroundColor: theme.headerBg, borderTop: `1px solid ${theme.border}` }}>
        <div className="flex items-center justify-center gap-4">
          <button onClick={onStartGame} disabled={!canStartGame}
            className="flex items-center gap-3 px-10 py-5 bg-lynx-navy-subtle hover:bg-lynx-sky text-white font-black rounded-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            style={{ letterSpacing: '0.08em' }}>
            <Icons.Play className="w-7 h-7" /><span className="text-4xl">START MATCH</span>
          </button>
        </div>
        {!canStartGame && <p className="text-center text-amber-400 text-lg mt-3">Complete your lineup to start the match</p>}
      </div>
    )
  }

  if (mode === GAME_MODES.LIVE) {
    return (
      <div className="p-5" style={{ backgroundColor: theme.headerBg, borderTop: `1px solid ${theme.border}` }}>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button onClick={onRotate} className="flex items-center gap-2 px-5 py-3 font-semibold rounded-xl transition-all"
            style={{ backgroundColor: theme.buttonBg, color: theme.textPrimary }}>
            <Icons.RotateCw className="w-5 h-5" /><span>Rotate</span>
            <span className="ml-1 px-3 py-1 rounded text-base" style={{ backgroundColor: '#334155' }}>R{rotation + 1}</span>
          </button>
          <button onClick={onTimeout} className="flex items-center gap-2 px-5 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-semibold rounded-xl transition-all border border-amber-500/30">
            <Icons.Pause className="w-5 h-5" /><span>Timeout</span>
          </button>
          <button onClick={onSubstitute} className="flex items-center gap-2 px-5 py-3 bg-[#10284C]/30 hover:bg-[#10284C]/50 text-[#4BB9EC] font-semibold rounded-xl transition-all border border-[#10284C]/50">
            <Icons.Users className="w-5 h-5" /><span>Sub</span>
          </button>
          <button onClick={onEndSet} className="flex items-center gap-2 px-5 py-3 font-semibold rounded-xl transition-all"
            style={{ backgroundColor: theme.buttonBg, color: theme.textPrimary }}>
            <Icons.Check className="w-5 h-5" /><span>End Set</span>
          </button>
          <button onClick={onEndGame} className="flex items-center gap-2 px-5 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold rounded-xl transition-all border border-red-500/30">
            <Icons.X className="w-5 h-5" /><span>End Game</span>
          </button>
        </div>
      </div>
    )
  }

  return null
}
