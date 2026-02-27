import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import CourtPlayerCard, { positionColors } from './CourtPlayerCard'
import Scoreboard from './Scoreboard'

// Tactical font import
const GD_FONT_LINK = document.querySelector('link[href*="Bebas+Neue"]')
if (!GD_FONT_LINK) {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap'
  document.head.appendChild(link)
}

// ============================================
// CONSTANTS & CONFIGURATION
// ============================================
const positionNames = {
  'OH': 'Outside Hitter', 'S': 'Setter', 'MB': 'Middle Blocker',
  'OPP': 'Opposite', 'L': 'Libero', 'DS': 'Defensive Specialist', 
  'RS': 'Right Side', 'H': 'Hitter',
}

const VOLLEYBALL_POSITIONS = [
  { id: 4, name: 'P4', label: 'Left Front', row: 'front', gridCol: 1 },
  { id: 3, name: 'P3', label: 'Middle Front', row: 'front', gridCol: 2 },
  { id: 2, name: 'P2', label: 'Right Front', row: 'front', gridCol: 3 },
  { id: 5, name: 'P5', label: 'Left Back', row: 'back', gridCol: 1 },
  { id: 6, name: 'P6', label: 'Middle Back', row: 'back', gridCol: 2 },
  { id: 1, name: 'P1', label: 'Right Back', row: 'back', gridCol: 3, isServe: true },
]

const STAT_ACTIONS = [
  { key: 'kill', label: 'Kill', icon: '⚡', color: '#EF4444', points: 1 },
  { key: 'ace', label: 'Ace', icon: '🎯', color: '#10B981', points: 1 },
  { key: 'block', label: 'Block', icon: '🛡️', color: '#6366F1', points: 1 },
  { key: 'dig', label: 'Dig', icon: '💪', color: '#F59E0B', points: 0 },
  { key: 'assist', label: 'Assist', icon: '🤝', color: '#8B5CF6', points: 0 },
  { key: 'error', label: 'Error', icon: '❌', color: '#64748b', points: -1, negative: true },
]

const GAME_MODES = {
  PRE_GAME: 'pre_game',
  LIVE: 'live',
  TIMEOUT: 'timeout',
  POST_GAME: 'post_game',
}

// ============================================
// THEME HELPER - Get colors based on light/dark mode
// ============================================
function useGameDayTheme() {
  // Force dark — game day is always dark tactical mode
  const isDark = true

  return {
    // Main backgrounds
    pageBg: '#0a0a0f',
    cardBg: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.9)',
    cardBgSolid: isDark ? '#1e293b' : '#ffffff',
    headerBg: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)',
    sidebarBg: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.9)',
    
    // Court
    courtBg: isDark ? 'rgba(30, 41, 59, 0.3)' : 'rgba(241, 245, 249, 0.8)',
    courtBorder: isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(203, 213, 225, 0.8)',
    netBg: isDark ? 'linear-gradient(90deg, #334155, #475569, #334155)' : 'linear-gradient(90deg, #cbd5e1, #94a3b8, #cbd5e1)',
    attackLine: isDark ? 'rgba(249, 115, 22, 0.4)' : 'rgba(249, 115, 22, 0.6)',
    
    // Text colors
    textPrimary: isDark ? '#ffffff' : '#1e293b',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    textMuted: isDark ? '#64748b' : '#94a3b8',
    textInverse: isDark ? '#1e293b' : '#ffffff',
    
    // Borders
    border: isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(203, 213, 225, 0.8)',
    borderLight: isDark ? 'rgba(51, 65, 85, 0.3)' : 'rgba(226, 232, 240, 0.8)',
    
    // Buttons
    buttonBg: isDark ? '#1e293b' : '#ffffff',
    buttonBgHover: isDark ? '#334155' : '#f1f5f9',
    buttonText: isDark ? '#e2e8f0' : '#475569',
    
    // Scoreboard
    scoreboardBg: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.95)',
    
    // Empty slot
    emptySlotBg: isDark ? 'rgba(30, 41, 59, 0.3)' : 'rgba(241, 245, 249, 0.5)',
    emptySlotBorder: isDark ? '#475569' : '#cbd5e1',
    
    // Player card overlays
    playerCardGradient: isDark 
      ? 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.7), transparent)'
      : 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.5), transparent)',
    
    // Stats panel
    statsBg: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(241, 245, 249, 0.8)',
    
    // Modal overlay
    modalOverlay: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.6)',
    modalBg: isDark ? '#0f172a' : '#ffffff',
    
    // Accent colors (same in both modes for brand consistency)
    accent: '#F59E0B',
    accentLight: isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.15)',
    
    isDark,
  }
}

// ============================================
// ICONS (Inline SVG)
// ============================================
const Icons = {
  X: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  RotateCw: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  ),
  Play: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  ),
  Pause: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
    </svg>
  ),
  Users: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  BarChart: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="16"/>
    </svg>
  ),
  Check: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  ChevronLeft: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  ChevronRight: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  Zap: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  Trophy: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>
  ),
  Clock: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Flame: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 22c-4.97 0-9-4.03-9-9 0-3.53 2.04-6.58 5-8.05C8 7.02 10 9 10 9s.96-2.2.96-4.5C10.96 2.24 12.97 0 12 0c1.5 0 3 1.5 3 3 0 2.5-1 4.5-1 4.5s2-2 2-4c3 1.5 5 4.5 5 8 0 4.97-4.03 9-9 9z"/>
    </svg>
  ),
  ArrowUp: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
    </svg>
  ),
  Minus: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Plus: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
}

// ============================================
// ANIMATED COMPONENTS
// ============================================
function MomentumBar({ value, maxValue = 10, theme }) {
  const percentage = Math.min((value / maxValue) * 100, 100)
  const isHot = value >= 7
  
  return (
    <div 
      className="relative h-2 rounded-full overflow-hidden"
      style={{ backgroundColor: theme?.isDark ? '#334155' : '#e2e8f0' }}
    >
      <div 
        className={`h-full rounded-full transition-all duration-500 ${isHot ? 'animate-pulse' : ''}`}
        style={{ 
          width: `${percentage}%`,
          background: isHot 
            ? 'linear-gradient(90deg, #F59E0B, #EF4444)' 
            : 'linear-gradient(90deg, #3B82F6, #10B981)'
        }}
      />
      {isHot && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-1">
          <Icons.Flame className="w-4 h-4 text-orange-400 animate-pulse" />
        </div>
      )}
    </div>
  )
}

// ============================================
// BENCH PLAYER CARD (Compact)
// ============================================
function BenchPlayerCard({ player, rsvpStatus, onDragStart, onDragEnd, onClick, theme }) {
  const posColor = positionColors[player?.position || player?.team_position] || '#6366F1'
  
  const rsvpStyles = {
    yes: 'border-l-emerald-500',
    attending: 'border-l-emerald-500',
    maybe: 'border-l-amber-500',
    no: 'border-l-red-500',
  }
  
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('playerId', player.id)
        onDragStart?.(player)
      }}
      onDragEnd={onDragEnd}
      onClick={() => onClick?.(player)}
      className={`flex items-center gap-3 p-2 rounded-xl border-l-4 
                  ${rsvpStyles[rsvpStatus] || 'border-l-slate-600'}
                  cursor-grab active:cursor-grabbing transition-all`}
      style={{
        backgroundColor: theme?.cardBg || 'rgba(30, 41, 59, 0.5)',
      }}
    >
      {/* Photo */}
      {player.photo_url ? (
        <img src={player.photo_url} className="w-10 h-10 rounded-lg object-cover" />
      ) : (
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: posColor }}
        >
          {player.jersey_number || '?'}
        </div>
      )}
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p 
          className="font-semibold text-sm truncate"
          style={{ color: theme?.textPrimary || '#ffffff' }}
        >
          {player.first_name} {player.last_name?.[0]}.
        </p>
        <p 
          className="text-xs"
          style={{ color: theme?.textMuted || '#64748b' }}
        >
          #{player.jersey_number} • {player.position || player.team_position || '—'}
        </p>
      </div>
      
      {/* Position badge */}
      <div 
        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
        style={{ backgroundColor: `${posColor}80` }}
      >
        {player.position || player.team_position || '?'}
      </div>
    </div>
  )
}

// ============================================
// STAT PICKER MODAL
// ============================================
function StatPickerModal({ player, onSelect, onClose, theme }) {
  if (!player) return null
  
  const posColor = positionColors[player?.position || player?.team_position] || '#6366F1'
  
  return (
    <div 
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: theme?.modalOverlay || 'rgba(0, 0, 0, 0.8)' }}
      onClick={onClose}
    >
      <div 
        className="rounded-3xl p-6 max-w-sm w-full shadow-2xl"
        style={{ 
          backgroundColor: theme?.modalBg || '#0f172a',
          border: `1px solid ${theme?.border || 'rgba(51, 65, 85, 0.5)'}`,
          boxShadow: `0 0 60px ${posColor}30` 
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Player header */}
        <div className="flex items-center gap-4 mb-6">
          {player.photo_url ? (
            <img src={player.photo_url} className="w-16 h-16 rounded-xl object-cover" />
          ) : (
            <div 
              className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl"
              style={{ backgroundColor: posColor }}
            >
              #{player.jersey_number}
            </div>
          )}
          <div>
            <p className="text-amber-400 font-bold">{player.first_name}</p>
            <p 
              className="font-black text-xl"
              style={{ color: theme?.textPrimary || '#ffffff' }}
            >
              {player.last_name?.toUpperCase()}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="ml-auto p-2 rounded-xl transition"
            style={{ backgroundColor: theme?.buttonBg || '#1e293b' }}
          >
            <Icons.X className="w-5 h-5" style={{ color: theme?.textMuted || '#64748b' }} />
          </button>
        </div>
        
        {/* Stat buttons — large tap targets */}
        <div className="grid grid-cols-3 gap-3">
          {STAT_ACTIONS.map(stat => (
            <button
              key={stat.key}
              onClick={() => onSelect(player.id, stat.key)}
              className="flex flex-col items-center gap-2 p-5 rounded-2xl transition-all min-h-[80px]
                         hover:scale-105 active:scale-95"
              style={{
                backgroundColor: `${stat.color}15`,
                border: `2px solid ${stat.color}30`,
                boxShadow: `0 0 20px ${stat.color}10`,
              }}
            >
              <span className="text-4xl">{stat.icon}</span>
              <span className="text-sm font-bold" style={{ color: stat.color }}>{stat.label}</span>
              {stat.points !== 0 && (
                <span className={`text-xs ${stat.points > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {stat.points > 0 ? '+' : ''}{stat.points} pt
                </span>
              )}
            </button>
          ))}
        </div>
        
        {/* Quick undo hint */}
        <p 
          className="text-center text-xs mt-4"
          style={{ color: theme?.textMuted || '#64748b' }}
        >
          Tap a stat to record • Long press to undo last
        </p>
      </div>
    </div>
  )
}

// ============================================
// QUICK STATS PANEL
// ============================================
function QuickStatsPanel({ stats, roster, theme }) {
  // Calculate team totals
  const teamTotals = Object.values(stats).reduce((acc, playerStats) => {
    Object.entries(playerStats || {}).forEach(([key, val]) => {
      acc[key] = (acc[key] || 0) + (val || 0)
    })
    return acc
  }, {})
  
  // Find stat leaders
  const getLeader = (statKey) => {
    let leader = null
    let maxVal = 0
    Object.entries(stats).forEach(([playerId, playerStats]) => {
      if ((playerStats?.[statKey] || 0) > maxVal) {
        maxVal = playerStats[statKey]
        leader = roster.find(p => p.id === playerId)
      }
    })
    return leader ? { player: leader, value: maxVal } : null
  }
  
  const killLeader = getLeader('kills')
  const digLeader = getLeader('digs')
  
  return (
    <div 
      className="rounded-2xl p-4 space-y-4"
      style={{
        backgroundColor: theme?.cardBg || 'rgba(30, 41, 59, 0.5)',
        border: `1px solid ${theme?.border || 'rgba(51, 65, 85, 0.5)'}`,
      }}
    >
      <h3 
        className="text-xs font-bold uppercase tracking-wider flex items-center gap-2"
        style={{ color: theme?.textMuted || '#64748b' }}
      >
        <Icons.BarChart className="w-4 h-4" />
        Live Stats
      </h3>
      
      {/* Team totals */}
      <div className="grid grid-cols-2 gap-3">
        <div 
          className="text-center p-3 rounded-xl"
          style={{ backgroundColor: theme?.statsBg || 'rgba(15, 23, 42, 0.5)' }}
        >
          <p className="text-2xl font-black text-red-400">{teamTotals.kills || 0}</p>
          <p className="text-[10px] uppercase" style={{ color: theme?.textMuted || '#64748b' }}>Kills</p>
        </div>
        <div 
          className="text-center p-3 rounded-xl"
          style={{ backgroundColor: theme?.statsBg || 'rgba(15, 23, 42, 0.5)' }}
        >
          <p className="text-2xl font-black text-emerald-400">{teamTotals.aces || 0}</p>
          <p className="text-[10px] uppercase" style={{ color: theme?.textMuted || '#64748b' }}>Aces</p>
        </div>
        <div 
          className="text-center p-3 rounded-xl"
          style={{ backgroundColor: theme?.statsBg || 'rgba(15, 23, 42, 0.5)' }}
        >
          <p className="text-2xl font-black text-indigo-400">{teamTotals.blocks || 0}</p>
          <p className="text-[10px] uppercase" style={{ color: theme?.textMuted || '#64748b' }}>Blocks</p>
        </div>
        <div 
          className="text-center p-3 rounded-xl"
          style={{ backgroundColor: theme?.statsBg || 'rgba(15, 23, 42, 0.5)' }}
        >
          <p className="text-2xl font-black text-amber-400">{teamTotals.digs || 0}</p>
          <p className="text-[10px] uppercase" style={{ color: theme?.textMuted || '#64748b' }}>Digs</p>
        </div>
      </div>
      
      {/* Leaders */}
      {(killLeader || digLeader) && (
        <div 
          className="space-y-2 pt-2"
          style={{ borderTop: `1px solid ${theme?.border || 'rgba(51, 65, 85, 0.5)'}` }}
        >
          <p className="text-[10px] uppercase" style={{ color: theme?.textMuted || '#64748b' }}>Hot Players</p>
          {killLeader && killLeader.value > 0 && (
            <div className="flex items-center gap-2 p-2 bg-red-500/10 rounded-lg">
              <Icons.Flame className="w-4 h-4 text-red-400" />
              <span 
                className="text-sm font-medium"
                style={{ color: theme?.textPrimary || '#ffffff' }}
              >
                {killLeader.player.first_name} {killLeader.player.last_name?.[0]}.
              </span>
              <span className="text-red-400 font-bold ml-auto">{killLeader.value} K</span>
            </div>
          )}
          {digLeader && digLeader.value > 0 && (
            <div className="flex items-center gap-2 p-2 bg-amber-500/10 rounded-lg">
              <Icons.Zap className="w-4 h-4 text-amber-400" />
              <span 
                className="text-sm font-medium"
                style={{ color: theme?.textPrimary || '#ffffff' }}
              >
                {digLeader.player.first_name} {digLeader.player.last_name?.[0]}.
              </span>
              <span className="text-amber-400 font-bold ml-auto">{digLeader.value} D</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================
// ACTION BAR
// ============================================
function ActionBar({ 
  mode, 
  onRotate, 
  onTimeout, 
  onSubstitute,
  onStartGame,
  onEndSet,
  onEndGame,
  rotation,
  canStartGame,
  theme,
}) {
  if (mode === GAME_MODES.PRE_GAME) {
    return (
      <div 
        className="backdrop-blur-xl p-4"
        style={{
          backgroundColor: theme?.headerBg || 'rgba(15, 23, 42, 0.9)',
          borderTop: `1px solid ${theme?.border || 'rgba(51, 65, 85, 0.5)'}`,
        }}
      >
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={onStartGame}
            disabled={!canStartGame}
            className="flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-emerald-500 to-emerald-600
                       hover:from-emerald-600 hover:to-emerald-700 text-white font-black rounded-2xl
                       transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100
                       shadow-lg shadow-emerald-500/30"
            style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.08em' }}
          >
            <Icons.Play className="w-7 h-7" />
            <span className="text-2xl">START MATCH</span>
          </button>
        </div>
        {!canStartGame && (
          <p className="text-center text-amber-400 text-sm mt-3">
            Complete your lineup to start the match
          </p>
        )}
      </div>
    )
  }
  
  if (mode === GAME_MODES.LIVE) {
    return (
      <div 
        className="backdrop-blur-xl p-4"
        style={{
          backgroundColor: theme?.headerBg || 'rgba(15, 23, 42, 0.9)',
          borderTop: `1px solid ${theme?.border || 'rgba(51, 65, 85, 0.5)'}`,
        }}
      >
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {/* Rotation */}
          <button
            onClick={onRotate}
            className="flex items-center gap-2 px-5 py-3 font-semibold rounded-xl transition-all"
            style={{
              backgroundColor: theme?.buttonBg || '#1e293b',
              color: theme?.textPrimary || '#ffffff',
            }}
          >
            <Icons.RotateCw className="w-5 h-5" />
            <span>Rotate</span>
            <span 
              className="ml-1 px-2 py-0.5 rounded text-xs"
              style={{ backgroundColor: theme?.isDark ? '#334155' : '#e2e8f0' }}
            >
              R{rotation + 1}
            </span>
          </button>
          
          {/* Timeout */}
          <button
            onClick={onTimeout}
            className="flex items-center gap-2 px-5 py-3 bg-amber-500/20 hover:bg-amber-500/30 
                       text-amber-400 font-semibold rounded-xl transition-all border border-amber-500/30"
          >
            <Icons.Pause className="w-5 h-5" />
            <span>Timeout</span>
          </button>
          
          {/* Substitution */}
          <button
            onClick={onSubstitute}
            className="flex items-center gap-2 px-5 py-3 bg-blue-500/20 hover:bg-blue-500/30 
                       text-blue-400 font-semibold rounded-xl transition-all border border-blue-500/30"
          >
            <Icons.Users className="w-5 h-5" />
            <span>Sub</span>
          </button>
          
          {/* End Set */}
          <button
            onClick={onEndSet}
            className="flex items-center gap-2 px-5 py-3 font-semibold rounded-xl transition-all"
            style={{
              backgroundColor: theme?.buttonBg || '#1e293b',
              color: theme?.textPrimary || '#ffffff',
            }}
          >
            <Icons.Check className="w-5 h-5" />
            <span>End Set</span>
          </button>
          
          {/* End Game */}
          <button
            onClick={onEndGame}
            className="flex items-center gap-2 px-5 py-3 bg-red-500/20 hover:bg-red-500/30 
                       text-red-400 font-semibold rounded-xl transition-all border border-red-500/30"
          >
            <Icons.X className="w-5 h-5" />
            <span>End Game</span>
          </button>
        </div>
      </div>
    )
  }
  
  return null
}

// ============================================
// POST GAME SUMMARY
// ============================================
function PostGameSummary({ 
  setScores, 
  stats, 
  roster, 
  teamName, 
  opponentName,
  onClose,
  onSaveStats,
  theme,
}) {
  // Calculate winner
  const ourSetsWon = setScores.filter(s => s.our > s.their).length
  const theirSetsWon = setScores.filter(s => s.their > s.our).length
  const isWin = ourSetsWon > theirSetsWon
  
  // Calculate totals
  const teamTotals = Object.values(stats).reduce((acc, playerStats) => {
    Object.entries(playerStats || {}).forEach(([key, val]) => {
      acc[key] = (acc[key] || 0) + (val || 0)
    })
    return acc
  }, {})
  
  // Get top performers
  const getTopPerformers = () => {
    return Object.entries(stats)
      .map(([playerId, playerStats]) => {
        const player = roster.find(p => p.id === playerId)
        const points = (playerStats?.kills || 0) + (playerStats?.aces || 0) + (playerStats?.blocks || 0)
        return { player, stats: playerStats, points }
      })
      .filter(p => p.player && p.points > 0)
      .sort((a, b) => b.points - a.points)
      .slice(0, 3)
  }
  
  const topPerformers = getTopPerformers()
  
  return (
    <div 
      className="fixed inset-0 backdrop-blur-xl flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: theme?.modalOverlay || 'rgba(0, 0, 0, 0.9)' }}
    >
      <div 
        className="rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: theme?.modalBg || '#0f172a',
          border: `1px solid ${theme?.border || 'rgba(51, 65, 85, 0.5)'}`,
        }}
      >
        {/* Header */}
        <div className={`p-8 text-center ${isWin ? 'bg-gradient-to-b from-emerald-900/50' : 'bg-gradient-to-b from-red-900/50'}`}>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Icons.Trophy className={`w-12 h-12 ${isWin ? 'text-amber-400' : 'text-slate-500'}`} />
          </div>
          <h2 className={`text-4xl font-black ${isWin ? 'text-emerald-400' : 'text-red-400'}`}>
            {isWin ? 'VICTORY!' : 'DEFEAT'}
          </h2>
          <p style={{ color: theme?.textMuted || '#64748b' }} className="mt-2">{teamName} vs {opponentName}</p>
          
          {/* Final score */}
          <div className="flex items-center justify-center gap-6 mt-6">
            <span className="text-6xl font-black" style={{ color: theme?.textPrimary || '#ffffff' }}>{ourSetsWon}</span>
            <span className="text-3xl" style={{ color: theme?.textMuted || '#64748b' }}>—</span>
            <span className="text-6xl font-black" style={{ color: theme?.textMuted || '#64748b' }}>{theirSetsWon}</span>
          </div>
        </div>
        
        {/* Set breakdown */}
        <div 
          className="px-8 py-6"
          style={{ borderBottom: `1px solid ${theme?.border || 'rgba(51, 65, 85, 0.5)'}` }}
        >
          <h3 
            className="text-sm font-bold uppercase mb-4"
            style={{ color: theme?.textMuted || '#64748b' }}
          >
            Set Scores
          </h3>
          <div className="flex justify-center gap-4">
            {setScores.map((set, i) => (
              <div 
                key={i}
                className={`px-6 py-3 rounded-xl ${
                  set.our > set.their ? 'bg-emerald-500/20' : 'bg-red-500/20'
                }`}
              >
                <p className="text-xs text-center mb-1" style={{ color: theme?.textMuted || '#64748b' }}>Set {i + 1}</p>
                <p className="text-xl font-bold text-center">
                  <span className={set.our > set.their ? 'text-emerald-400' : ''} style={{ color: set.our > set.their ? undefined : theme?.textPrimary }}>{set.our}</span>
                  <span className="mx-2" style={{ color: theme?.textMuted || '#64748b' }}>-</span>
                  <span className={set.their > set.our ? 'text-red-400' : ''} style={{ color: set.their > set.our ? undefined : theme?.textPrimary }}>{set.their}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Team stats */}
        <div 
          className="px-8 py-6"
          style={{ borderBottom: `1px solid ${theme?.border || 'rgba(51, 65, 85, 0.5)'}` }}
        >
          <h3 
            className="text-sm font-bold uppercase mb-4"
            style={{ color: theme?.textMuted || '#64748b' }}
          >
            Team Stats
          </h3>
          <div className="grid grid-cols-5 gap-4">
            {[
              { key: 'kills', label: 'Kills', color: 'text-red-400' },
              { key: 'aces', label: 'Aces', color: 'text-emerald-400' },
              { key: 'blocks', label: 'Blocks', color: 'text-indigo-400' },
              { key: 'digs', label: 'Digs', color: 'text-amber-400' },
              { key: 'assists', label: 'Assists', color: 'text-purple-400' },
            ].map(stat => (
              <div key={stat.key} className="text-center">
                <p className={`text-3xl font-black ${stat.color}`}>{teamTotals[stat.key] || 0}</p>
                <p className="text-xs uppercase mt-1" style={{ color: theme?.textMuted || '#64748b' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Top performers */}
        {topPerformers.length > 0 && (
          <div 
            className="px-8 py-6"
            style={{ borderBottom: `1px solid ${theme?.border || 'rgba(51, 65, 85, 0.5)'}` }}
          >
            <h3 
              className="text-sm font-bold uppercase mb-4"
              style={{ color: theme?.textMuted || '#64748b' }}
            >
              Top Performers
            </h3>
            <div className="space-y-3">
              {topPerformers.map(({ player, stats: pStats, points }, i) => (
                <div 
                  key={player.id}
                  className="flex items-center gap-4 p-3 rounded-xl"
                  style={{ backgroundColor: theme?.cardBg || 'rgba(30, 41, 59, 0.5)' }}
                >
                  <span className={`text-2xl font-black ${
                    i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-300' : 'text-amber-700'
                  }`}>
                    #{i + 1}
                  </span>
                  {player.photo_url ? (
                    <img src={player.photo_url} className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-bold"
                      style={{ backgroundColor: theme?.buttonBg || '#334155', color: theme?.textPrimary || '#ffffff' }}
                    >
                      {player.jersey_number}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-bold" style={{ color: theme?.textPrimary || '#ffffff' }}>{player.first_name} {player.last_name}</p>
                    <p style={{ color: theme?.textMuted || '#64748b' }} className="text-sm">
                      {pStats?.kills || 0}K • {pStats?.aces || 0}A • {pStats?.digs || 0}D • {pStats?.blocks || 0}B
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-amber-400">{points}</p>
                    <p className="text-xs" style={{ color: theme?.textMuted || '#64748b' }}>points</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="p-6 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-4 font-semibold rounded-xl transition"
            style={{
              backgroundColor: theme?.buttonBg || '#1e293b',
              color: theme?.textPrimary || '#ffffff',
            }}
          >
            Close
          </button>
          <button
            onClick={onSaveStats}
            className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 
                       text-white font-bold rounded-xl transition shadow-lg shadow-emerald-500/30"
          >
            Save & Finish
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================
function GameDayCommandCenter({ event, team, onClose, onSave, showToast }) {
  const { user } = useAuth()
  const theme = useGameDayTheme()
  
  // Core state
  const [mode, setMode] = useState(GAME_MODES.PRE_GAME)
  const [roster, setRoster] = useState([])
  const [rsvps, setRsvps] = useState({})
  const [loading, setLoading] = useState(true)
  
  // Lineup state
  const [lineup, setLineup] = useState({}) // { positionId: playerId }
  const [liberoId, setLiberoId] = useState(null)
  const [rotation, setRotation] = useState(0)
  
  // Scoring state
  const [currentSet, setCurrentSet] = useState(1)
  const [setScores, setSetScores] = useState([]) // [{ our: 0, their: 0 }]
  const [ourScore, setOurScore] = useState(0)
  const [theirScore, setTheirScore] = useState(0)
  const [pointHistory, setPointHistory] = useState([])
  
  // Stats state
  const [stats, setStats] = useState({}) // { playerId: { kills: 0, aces: 0, ... } }
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  
  // Drag state
  const [draggedPlayer, setDraggedPlayer] = useState(null)
  
  // Load data
  useEffect(() => {
    loadData()
  }, [event?.id, team?.id])
  
  async function loadData() {
    setLoading(true)
    try {
      // Load roster
      const { data: players } = await supabase
        .from('team_players')
        .select('*, players(*)')
        .eq('team_id', team.id)
      
      const rosterData = (players || [])
        .map(tp => ({ 
          ...tp.players, 
          team_jersey: tp.jersey_number, 
          team_position: tp.position,
          jersey_number: tp.jersey_number || tp.players?.jersey_number
        }))
        .filter(Boolean)
        .sort((a, b) => (a.jersey_number || 99) - (b.jersey_number || 99))
      
      setRoster(rosterData)
      
      // Initialize stats for all players
      const initialStats = {}
      rosterData.forEach(p => {
        initialStats[p.id] = { kills: 0, aces: 0, blocks: 0, digs: 0, assists: 0, errors: 0 }
      })
      setStats(initialStats)
      
      // Load RSVPs
      const { data: rsvpData } = await supabase
        .from('event_rsvps')
        .select('player_id, status')
        .eq('event_id', event.id)
      
      const rsvpMap = {}
      rsvpData?.forEach(r => { rsvpMap[r.player_id] = r.status })
      setRsvps(rsvpMap)
      
      // Load existing lineup
      const { data: existingLineup } = await supabase
        .from('game_lineups')
        .select('*')
        .eq('event_id', event.id)
      
      if (existingLineup?.length > 0) {
        const lineupMap = {}
        existingLineup.forEach(l => {
          if (l.rotation_order) lineupMap[l.rotation_order] = l.player_id
          if (l.is_libero) setLiberoId(l.player_id)
        })
        setLineup(lineupMap)
      }
      
    } catch (err) {
      console.error('Error loading data:', err)
    }
    setLoading(false)
  }
  
  // Lineup functions
  function getPlayerAtPosition(positionId) {
    const rotationOrder = [1, 2, 3, 4, 5, 6]
    const posIndex = rotationOrder.indexOf(positionId)
    const sourceIndex = (posIndex + rotation) % 6
    const sourcePosition = rotationOrder[sourceIndex]
    return lineup[sourcePosition]
  }
  
  function handleDrop(positionId) {
    return (e) => {
      e.preventDefault()
      const playerId = e.dataTransfer.getData('playerId')
      if (!playerId) return
      
      // Remove player from any existing position
      const newLineup = { ...lineup }
      Object.keys(newLineup).forEach(key => {
        if (newLineup[key] === playerId) delete newLineup[key]
      })
      
      // Map visual position to original position accounting for rotation
      const rotationOrder = [1, 2, 3, 4, 5, 6]
      const posIndex = rotationOrder.indexOf(positionId)
      const originalIndex = (posIndex + rotation) % 6
      const originalPosition = rotationOrder[originalIndex]
      
      newLineup[originalPosition] = playerId
      setLineup(newLineup)
      setDraggedPlayer(null)
    }
  }
  
  function handleRotate() {
    setRotation(prev => (prev + 1) % 6)
  }
  
  function autoFillLineup() {
    const available = roster.filter(p => {
      const status = rsvps[p.id]
      return status === 'yes' || status === 'attending' || !status
    })
    
    const newLineup = {}
    VOLLEYBALL_POSITIONS.slice(0, 6).forEach((pos, i) => {
      if (available[i]) {
        newLineup[pos.id] = available[i].id
      }
    })
    
    setLineup(newLineup)
    showToast?.('Lineup auto-filled!', 'success')
  }
  
  function clearLineup() {
    setLineup({})
    setLiberoId(null)
  }
  
  // Game functions
  function startGame() {
    setMode(GAME_MODES.LIVE)
    setCurrentSet(1)
    setSetScores([])
    setOurScore(0)
    setTheirScore(0)
    showToast?.('Match started! Good luck! 🏐', 'success')
  }
  
  function handleOurPoint() {
    setOurScore(prev => prev + 1)
    setPointHistory(prev => [...prev, { type: 'us', set: currentSet }])
  }
  
  function handleTheirPoint() {
    setTheirScore(prev => prev + 1)
    setPointHistory(prev => [...prev, { type: 'them', set: currentSet }])
  }
  
  function handleUndoPoint() {
    if (pointHistory.length === 0) return
    const lastPoint = pointHistory[pointHistory.length - 1]
    if (lastPoint.set !== currentSet) return
    
    if (lastPoint.type === 'us' && ourScore > 0) {
      setOurScore(prev => prev - 1)
    } else if (lastPoint.type === 'them' && theirScore > 0) {
      setTheirScore(prev => prev - 1)
    }
    setPointHistory(prev => prev.slice(0, -1))
  }
  
  function handleStatSelect(playerId, statKey) {
    setStats(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [statKey]: (prev[playerId]?.[statKey] || 0) + 1
      }
    }))
    
    // Auto-add point for scoring stats
    const statAction = STAT_ACTIONS.find(s => s.key === statKey)
    if (statAction?.points === 1) {
      handleOurPoint()
    } else if (statAction?.points === -1) {
      handleTheirPoint()
    }
    
    setSelectedPlayer(null)
    showToast?.(`${statKey.charAt(0).toUpperCase() + statKey.slice(1)} recorded!`, 'success')
  }
  
  function endSet() {
    // Save current set score
    setSetScores(prev => [...prev, { our: ourScore, their: theirScore }])
    
    // Check if match is over (best of 3 or 5)
    const updatedSets = [...setScores, { our: ourScore, their: theirScore }]
    const ourSetsWon = updatedSets.filter(s => s.our > s.their).length
    const theirSetsWon = updatedSets.filter(s => s.their > s.our).length
    
    if (ourSetsWon >= 2 || theirSetsWon >= 2) {
      setMode(GAME_MODES.POST_GAME)
    } else {
      // Start new set
      setCurrentSet(prev => prev + 1)
      setOurScore(0)
      setTheirScore(0)
      setRotation(0)
      showToast?.(`Set ${currentSet} complete! Starting Set ${currentSet + 1}`, 'info')
    }
  }
  
  function endGame() {
    if (ourScore > 0 || theirScore > 0) {
      setSetScores(prev => [...prev, { our: ourScore, their: theirScore }])
    }
    setMode(GAME_MODES.POST_GAME)
  }
  
  async function saveStats() {
    try {
      // Save to game_player_stats
      const records = Object.entries(stats)
        .filter(([_, playerStats]) => Object.values(playerStats || {}).some(v => v > 0))
        .map(([playerId, playerStats]) => ({
          event_id: event.id,
          player_id: playerId,
          team_id: team.id,
          kills: playerStats.kills || 0,
          aces: playerStats.aces || 0,
          blocks: playerStats.blocks || 0,
          digs: playerStats.digs || 0,
          assists: playerStats.assists || 0,
          service_errors: playerStats.errors || 0,
          points: (playerStats.kills || 0) + (playerStats.aces || 0) + (playerStats.blocks || 0),
          created_by: user?.id,
        }))
      
      if (records.length > 0) {
        // Delete existing
        await supabase.from('game_player_stats').delete().eq('event_id', event.id)
        // Insert new
        const { error } = await supabase.from('game_player_stats').insert(records)
        if (error) throw error
      }
      
      // Update schedule event with scores
      const ourSetsWon = setScores.filter(s => s.our > s.their).length
      const theirSetsWon = setScores.filter(s => s.their > s.our).length
      
      await supabase
        .from('schedule_events')
        .update({
          our_score: ourSetsWon,
          their_score: theirSetsWon,
          status: 'completed'
        })
        .eq('id', event.id)
      
      showToast?.('Game stats saved successfully!', 'success')
      onSave?.()
      onClose?.()
      
    } catch (err) {
      console.error('Error saving stats:', err)
      showToast?.('Error saving stats', 'error')
    }
  }
  
  // Derived values
  const startersCount = Object.keys(lineup).length
  const canStartGame = startersCount >= 6
  const benchPlayers = roster.filter(p => !Object.values(lineup).includes(p.id) && p.id !== liberoId)
  
  if (loading) {
    return (
      <div 
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{ backgroundColor: theme.pageBg }}
      >
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 font-medium" style={{ color: theme.textPrimary }}>Loading Game Day...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div
      className="fixed inset-0 flex flex-col z-50 overflow-hidden"
      style={{
        backgroundColor: theme.pageBg,
        backgroundImage: 'linear-gradient(rgba(59,130,246,0.03) 1px,transparent 1px), linear-gradient(90deg,rgba(59,130,246,0.03) 1px,transparent 1px)',
        backgroundSize: '40px 40px',
      }}
    >
      {/* Header */}
      <header 
        className="backdrop-blur-xl px-4 py-3 flex items-center justify-between"
        style={{ 
          backgroundColor: theme.headerBg,
          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 rounded-xl transition"
            style={{ backgroundColor: theme.buttonBg }}
          >
            <Icons.X className="w-5 h-5" style={{ color: theme.textMuted }} />
          </button>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏐</span>
            <div>
              <h1 className="text-xl font-black tracking-wider text-white" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>MISSION CONTROL</h1>
              <p className="text-amber-400 text-[10px] font-bold tracking-widest" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                {mode === GAME_MODES.PRE_GAME ? 'PRE-GAME SETUP' : mode === GAME_MODES.LIVE ? '● LIVE OPERATIONS' : 'POST-GAME DEBRIEF'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {mode === GAME_MODES.PRE_GAME && (
            <>
              <button
                onClick={autoFillLineup}
                className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 
                           rounded-xl text-sm font-semibold transition border border-indigo-500/30"
              >
                Auto-Fill
              </button>
              <button
                onClick={clearLineup}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition"
                style={{ 
                  backgroundColor: theme.buttonBg,
                  color: theme.textSecondary,
                }}
              >
                Clear
              </button>
            </>
          )}
          
          {/* Starters count */}
          <div 
            className="px-4 py-2 rounded-xl text-center"
            style={{ backgroundColor: theme.buttonBg }}
          >
            <p className="text-xs" style={{ color: theme.textMuted }}>Starters</p>
            <p className={`text-lg font-bold ${startersCount >= 6 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {startersCount}/6
            </p>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Court Area */}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-4">
            
            {/* Scoreboard (Live mode only) */}
            {mode === GAME_MODES.LIVE && (
              <Scoreboard
                ourScore={ourScore}
                theirScore={theirScore}
                setScores={setScores}
                currentSet={currentSet}
                teamName={team?.name}
                opponentName={event?.opponent_name}
                isLive={true}
                onOurPoint={handleOurPoint}
                onTheirPoint={handleTheirPoint}
                onUndoPoint={handleUndoPoint}
                theme={theme}
              />
            )}
            
            {/* Match info (Pre-game) */}
            {mode === GAME_MODES.PRE_GAME && (
              <div 
                className="rounded-2xl p-4"
                style={{ 
                  backgroundColor: theme.cardBg,
                  border: `1px solid ${theme.border}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-400 font-bold">{team?.name}</p>
                    <p className="text-sm" style={{ color: theme.textMuted }}>vs {event?.opponent_name || 'TBD'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium" style={{ color: theme.textPrimary }}>
                      {event?.event_date ? new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-US', { 
                        weekday: 'short', month: 'short', day: 'numeric' 
                      }) : '—'}
                    </p>
                    <p className="text-sm" style={{ color: theme.textMuted }}>{event?.event_time || '—'} • {event?.venue_name || '—'}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Rotation indicator */}
            {(mode === GAME_MODES.PRE_GAME || mode === GAME_MODES.LIVE) && (
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setRotation(prev => (prev - 1 + 6) % 6)}
                  className="p-2 rounded-xl transition"
                  style={{ backgroundColor: theme.buttonBg }}
                >
                  <Icons.ChevronLeft className="w-5 h-5" style={{ color: theme.textMuted }} />
                </button>
                <div 
                  className="px-6 py-2 rounded-xl"
                  style={{ backgroundColor: theme.buttonBg }}
                >
                  <span className="text-amber-400 font-bold">Rotation {rotation + 1}</span>
                  <span className="ml-2" style={{ color: theme.textMuted }}>/ 6</span>
                </div>
                <button
                  onClick={() => setRotation(prev => (prev + 1) % 6)}
                  className="p-2 rounded-xl transition"
                  style={{ backgroundColor: theme.buttonBg }}
                >
                  <Icons.ChevronRight className="w-5 h-5" style={{ color: theme.textMuted }} />
                </button>
              </div>
            )}
            
            {/* Court */}
            <div 
              className="rounded-3xl p-4 lg:p-6"
              style={{ 
                backgroundColor: theme.courtBg,
                border: `1px solid ${theme.courtBorder}`,
              }}
            >
              {/* Net */}
              <div className="text-center mb-4">
                <div 
                  className="inline-flex items-center gap-2 px-6 py-2 rounded-lg"
                  style={{ background: theme.netBg }}
                >
                  <div className="w-8 h-0.5" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }} />
                  <span 
                    className="text-xs font-bold tracking-widest"
                    style={{ color: theme.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' }}
                  >
                    NET
                  </span>
                  <div className="w-8 h-0.5" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }} />
                </div>
              </div>
              
              {/* Front Row */}
              <div className="grid grid-cols-3 gap-3 lg:gap-4 mb-3">
                {[4, 3, 2].map(posId => {
                  const pos = VOLLEYBALL_POSITIONS.find(p => p.id === posId)
                  const playerId = getPlayerAtPosition(posId)
                  const player = roster.find(p => p.id === playerId)
                  
                  return (
                    <CourtPlayerCard
                      key={posId}
                      player={player}
                      position={pos}
                      isServing={false}
                      isLibero={player?.id === liberoId}
                      stats={stats[player?.id]}
                      onTap={mode === GAME_MODES.LIVE ? setSelectedPlayer : undefined}
                      onDrop={handleDrop(posId)}
                      isDragging={draggedPlayer?.id === player?.id}
                      showStats={mode === GAME_MODES.LIVE}
                      theme={theme}
                    />
                  )
                })}
              </div>
              
              {/* Attack Line */}
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 border-t-2 border-dashed" style={{ borderColor: theme.attackLine }} />
                <span className="text-[10px] text-orange-400 font-bold tracking-wider">ATTACK LINE</span>
                <div className="flex-1 border-t-2 border-dashed" style={{ borderColor: theme.attackLine }} />
              </div>
              
              {/* Back Row */}
              <div className="grid grid-cols-3 gap-3 lg:gap-4">
                {[5, 6, 1].map(posId => {
                  const pos = VOLLEYBALL_POSITIONS.find(p => p.id === posId)
                  const playerId = getPlayerAtPosition(posId)
                  const player = roster.find(p => p.id === playerId)
                  const isServing = posId === 1
                  
                  return (
                    <CourtPlayerCard
                      key={posId}
                      player={player}
                      position={pos}
                      isServing={isServing}
                      isLibero={player?.id === liberoId}
                      stats={stats[player?.id]}
                      onTap={mode === GAME_MODES.LIVE ? setSelectedPlayer : undefined}
                      onDrop={handleDrop(posId)}
                      isDragging={draggedPlayer?.id === player?.id}
                      showStats={mode === GAME_MODES.LIVE}
                      theme={theme}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div 
          className="w-72 lg:w-80 flex flex-col"
          style={{
            backgroundColor: theme.sidebarBg,
            borderLeft: `1px solid ${theme.border}`,
          }}
        >
          {/* Sidebar header */}
          <div 
            className="p-4"
            style={{ borderBottom: `1px solid ${theme.border}` }}
          >
            <h3 className="font-bold flex items-center gap-2" style={{ color: theme.textPrimary }}>
              <Icons.Users className="w-4 h-4" style={{ color: theme.textMuted }} />
              {mode === GAME_MODES.LIVE ? 'Bench' : 'Available Players'}
            </h3>
            <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
              {mode === GAME_MODES.PRE_GAME ? 'Drag players to court positions' : `${benchPlayers.length} on bench`}
            </p>
          </div>
          
          {/* Stats panel (Live mode) */}
          {mode === GAME_MODES.LIVE && (
            <div className="p-4" style={{ borderBottom: `1px solid ${theme.border}` }}>
              <QuickStatsPanel stats={stats} roster={roster} theme={theme} />
            </div>
          )}
          
          {/* Bench players */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {benchPlayers.length === 0 ? (
              <div className="text-center py-8">
                <Icons.Check className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <p className="font-medium" style={{ color: theme.textMuted }}>All players assigned!</p>
              </div>
            ) : (
              benchPlayers.map(player => (
                <BenchPlayerCard
                  key={player.id}
                  player={player}
                  rsvpStatus={rsvps[player.id]}
                  onDragStart={setDraggedPlayer}
                  onDragEnd={() => setDraggedPlayer(null)}
                  onClick={mode === GAME_MODES.LIVE ? setSelectedPlayer : undefined}
                  theme={theme}
                />
              ))
            )}
          </div>
          
          {/* Libero selector (Pre-game) */}
          {mode === GAME_MODES.PRE_GAME && roster.some(p => p.position === 'L' || p.team_position === 'L') && (
            <div className="p-4" style={{ borderTop: `1px solid ${theme.border}` }}>
              <label className="text-xs font-medium mb-2 block" style={{ color: theme.textMuted }}>Libero</label>
              <select
                value={liberoId || ''}
                onChange={(e) => setLiberoId(e.target.value || null)}
                className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                style={{
                  backgroundColor: theme.buttonBg,
                  border: `1px solid ${theme.border}`,
                  color: theme.textPrimary,
                }}
              >
                <option value="">Select Libero</option>
                {roster.filter(p => p.position === 'L' || p.team_position === 'L').map(p => (
                  <option key={p.id} value={p.id}>#{p.jersey_number} {p.first_name} {p.last_name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
      
      {/* Action Bar */}
      <ActionBar
        mode={mode}
        onRotate={handleRotate}
        onTimeout={() => setMode(GAME_MODES.TIMEOUT)}
        onSubstitute={() => {/* TODO: Sub modal */}}
        onStartGame={startGame}
        onEndSet={endSet}
        onEndGame={endGame}
        rotation={rotation}
        canStartGame={canStartGame}
        theme={theme}
      />
      
      {/* Stat Picker Modal */}
      {selectedPlayer && mode === GAME_MODES.LIVE && (
        <StatPickerModal
          player={selectedPlayer}
          onSelect={handleStatSelect}
          onClose={() => setSelectedPlayer(null)}
          theme={theme}
        />
      )}
      
      {/* Post Game Summary */}
      {mode === GAME_MODES.POST_GAME && (
        <PostGameSummary
          setScores={setScores}
          stats={stats}
          roster={roster}
          teamName={team?.name}
          opponentName={event?.opponent_name}
          onClose={onClose}
          onSaveStats={saveStats}
          theme={theme}
        />
      )}
    </div>
  )
}

export { GameDayCommandCenter, GAME_MODES }
