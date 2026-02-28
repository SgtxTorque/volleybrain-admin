import { useState, useEffect } from 'react'
import { Calendar, Award, BarChart3 } from '../../constants/icons'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../contexts/ThemeContext'
import ParentEventCard from './ParentEventCard'

const BADGE_DEFS = {
  'ace_sniper': { name: 'Ace Sniper', icon: '🏐', color: '#F59E0B', rarity: 'Rare' },
  'kill_shot': { name: 'Kill Shot', icon: '⚡', color: '#EF4444', rarity: 'Epic' },
  'heart_breaker': { name: 'Heart Breaker', icon: '💜', color: '#EC4899', rarity: 'Rare' },
  'ground_zero': { name: 'Ground Zero', icon: '💎', color: '#06B6D4', rarity: 'Uncommon' },
  'iron_fortress': { name: 'Iron Fortress', icon: '🛡️', color: '#6366F1', rarity: 'Legendary' },
  'puppet_master': { name: 'Puppet Master', icon: '🎭', color: '#F59E0B', rarity: 'Epic' },
  'ace_master': { name: 'Ace Master', icon: '🎯', color: '#10B981', rarity: 'Rare' },
  'dig_machine': { name: 'Dig Machine', icon: '💪', color: '#8B5CF6', rarity: 'Uncommon' },
  'mvp': { name: 'MVP', icon: '⭐', color: '#EF4444', rarity: 'Legendary' },
  'team_player': { name: 'Team Player', icon: '🤝', color: '#3B82F6', rarity: 'Common' },
  'first_practice': { name: 'First Practice', icon: '🌟', color: '#F59E0B', rarity: 'Common' },
  'perfect_attendance': { name: 'Perfect Attendance', icon: '⭐', color: '#10B981', rarity: 'Rare' },
  'attendance_streak_5': { name: '5 Game Streak', icon: '🔥', color: '#EF4444', rarity: 'Uncommon' },
  'first_game': { name: 'Game Day', icon: '🎮', color: '#3B82F6', rarity: 'Common' },
  'first_win': { name: 'Winner', icon: '🥇', color: '#F59E0B', rarity: 'Common' },
}

const RARITY_COLORS = { 'Common': '#6B7280', 'Uncommon': '#10B981', 'Rare': '#3B82F6', 'Epic': '#8B5CF6', 'Legendary': '#F59E0B' }

// Sport-aware leaderboard categories
const SPORT_LEADERBOARD = {
  volleyball: [
    { cat: 'Kills', color: '#f59e0b' }, { cat: 'Aces', color: '#3b82f6' },
    { cat: 'Digs', color: '#8b5cf6' }, { cat: 'Assists', color: '#10b981' },
  ],
  basketball: [
    { cat: 'Points', color: '#f59e0b' }, { cat: 'Rebounds', color: '#06b6d4' },
    { cat: 'Assists', color: '#10b981' }, { cat: 'Steals', color: '#8b5cf6' },
  ],
  soccer: [
    { cat: 'Goals', color: '#f59e0b' }, { cat: 'Assists', color: '#10b981' },
    { cat: 'Shots', color: '#06b6d4' }, { cat: 'Saves', color: '#8b5cf6' },
  ],
}

/**
 * ParentRightPanel — right sidebar with context-specific data for selected player/team
 * Handles its own data fetching
 */
export default function ParentRightPanel({
  activeChild,
  activeTeam,
  activeTeamColor,
  activeChildEvents,
  seasonId,
  onNavigate,
  onShowEventDetail,
  sportName,
}) {
  const [teamRecord, setTeamRecord] = useState(null)
  const [playerBadges, setPlayerBadges] = useState([])
  const [badgesInProgress, setBadgesInProgress] = useState([])
  const { isDark } = useTheme()

  const teamId = activeTeam?.id
  const playerId = activeChild?.id

  // Fetch right panel data when team/player changes
  useEffect(() => {
    let cancelled = false

    async function loadData() {
      // team_standings — EXISTS: id, team_id, season_id, wins, losses, ties, points_for, points_against, win_percentage, streak, last_10, updated_at
      if (teamId) {
        try {
          const { data, error } = await supabase
            .from('team_standings')
            .select('*')
            .eq('team_id', teamId)
            .maybeSingle()
          if (cancelled) return
          if (error) {
            console.warn('team_standings query failed:', error.message)
            setTeamRecord(null)
          } else {
            setTeamRecord(data)
          }
        } catch {
          if (!cancelled) setTeamRecord(null)
        }
      }

      // player_achievements — EXISTS: id, player_id, achievement_id, awarded_at, awarded_by, notes, created_at
      if (playerId) {
        try {
          const { data, error } = await supabase
            .from('player_achievements')
            .select('*, achievements(name, icon, rarity, color_primary)')
            .eq('player_id', playerId)
            .order('created_at', { ascending: false })
          if (cancelled) return
          if (error) {
            console.warn('player_achievements query failed:', error.message)
            setPlayerBadges([])
          } else {
            setPlayerBadges(data || [])
          }
        } catch {
          if (!cancelled) setPlayerBadges([])
        }

        try {
          const { data, error } = await supabase
            .from('player_achievement_progress')
            .select('*, achievements(name, icon, rarity, color_primary)')
            .eq('player_id', playerId)
          if (cancelled) return
          if (error) {
            console.warn('player_achievement_progress query failed:', error.message)
            setBadgesInProgress([])
          } else {
            setBadgesInProgress(data || [])
          }
        } catch {
          if (!cancelled) setBadgesInProgress([])
        }
      }
    }

    loadData()
    return () => { cancelled = true }
  }, [teamId, playerId])

  const leaderboardCats = SPORT_LEADERBOARD[sportName?.toLowerCase()] || SPORT_LEADERBOARD.volleyball

  return (
    <aside className={`hidden lg:flex w-[330px] shrink-0 flex-col ${isDark ? 'bg-lynx-midnight' : 'bg-white'} overflow-y-auto p-5 space-y-5 scrollbar-hide`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>

      {/* Upcoming Events */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Upcoming</h3>
          <button onClick={() => onNavigate?.('schedule')} className="text-sm text-[var(--accent-primary)] font-semibold hover:opacity-80 transition">
            Full Calendar →
          </button>
        </div>
        <div className="space-y-3">
          {activeChildEvents?.slice(0, 3).map(event => (
            <ParentEventCard key={event.id} event={event} onClick={onShowEventDetail} />
          ))}
          {(!activeChildEvents || activeChildEvents.length === 0) && (
            <div className={`${isDark ? 'bg-lynx-charcoal border border-white/[0.08] shadow-lg shadow-black/25' : 'bg-white border border-lynx-silver shadow-sm'} rounded-xl p-6 text-center transition-all hover:-translate-y-0.5 hover:shadow-xl`}>
              <Calendar className={`w-8 h-8 mx-auto ${isDark ? 'text-slate-600' : 'text-slate-300'} mb-2`} />
              <p className={`text-base ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No upcoming events</p>
            </div>
          )}
        </div>
      </div>

      {/* Season Record */}
      <div className={`${isDark ? 'bg-lynx-charcoal border border-white/[0.08] shadow-lg shadow-black/25' : 'bg-white border border-lynx-silver shadow-sm'} rounded-xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-xl`}>
        <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-3`}>Season Record</h3>
        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            <div className="text-4xl font-black text-emerald-500">{teamRecord?.wins || 0}</div>
            <div className={`text-sm uppercase font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Wins</div>
          </div>
          <div className={`text-3xl font-bold ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>-</div>
          <div className="text-center">
            <div className="text-4xl font-black text-red-500">{teamRecord?.losses || 0}</div>
            <div className={`text-sm uppercase font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Losses</div>
          </div>
          {(teamRecord?.ties || 0) > 0 && (
            <>
              <div className={`text-3xl font-bold ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>-</div>
              <div className="text-center">
                <div className="text-4xl font-black text-amber-500">{teamRecord.ties}</div>
                <div className={`text-sm uppercase font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Ties</div>
              </div>
            </>
          )}
        </div>
        <p className={`text-base text-center mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{activeTeam?.name}</p>
      </div>

      {/* Achievements Preview */}
      <div className={`${isDark ? 'bg-lynx-charcoal border border-white/[0.08] shadow-lg shadow-black/25' : 'bg-white border border-lynx-silver shadow-sm'} rounded-xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-xl`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Achievements</h3>
          <button onClick={() => onNavigate?.('achievements')} className="text-sm text-[var(--accent-primary)] font-semibold hover:opacity-80 transition">
            View All →
          </button>
        </div>
        {playerBadges.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {playerBadges.slice(0, 4).map((b, i) => {
              const def = BADGE_DEFS[b.achievement_id] || {
                name: b.achievements?.name || 'Badge',
                icon: b.achievements?.icon || '🏅',
                color: b.achievements?.color_primary || '#6B7280',
                rarity: b.achievements?.rarity || 'Common',
              }
              const rarityColor = RARITY_COLORS[def.rarity] || RARITY_COLORS[b.achievements?.rarity] || '#6B7280'
              return (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: `${def.color}15`, border: `2px solid ${rarityColor}` }}
                  >
                    {def.icon}
                  </div>
                  <span className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} text-center max-w-[60px] leading-tight`}>{def.name}</span>
                </div>
              )
            })}
          </div>
        ) : badgesInProgress.length > 0 ? (
          <div className="space-y-3">
            {badgesInProgress.slice(0, 3).map((b, i) => {
              const def = BADGE_DEFS[b.achievement_id] || {
                name: b.achievements?.name || 'Badge',
                icon: b.achievements?.icon || '🏅',
                color: b.achievements?.color_primary || '#6B7280',
              }
              const pct = b.target_value > 0 ? Math.min((b.current_value / b.target_value) * 100, 100) : 0
              return (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: `${def.color}15`, border: `2px solid ${def.color}40` }}
                  >
                    {def.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-base font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'} truncate`}>{def.name}</span>
                      <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'} ml-2 flex-shrink-0`}>{b.current_value}/{b.target_value}</span>
                    </div>
                    <div className={`h-1.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-100'} overflow-hidden`}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: def.color }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-4">
            <Award className={`w-8 h-8 mx-auto ${isDark ? 'text-slate-600' : 'text-slate-300'} mb-1`} />
            <p className={`text-base ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No badges earned yet</p>
            <p className={`text-base ${isDark ? 'text-slate-600' : 'text-slate-300'} mt-1`}>Keep playing to unlock badges!</p>
          </div>
        )}
      </div>

      {/* Leaderboard Preview */}
      <div className={`${isDark ? 'bg-lynx-charcoal border border-white/[0.08] shadow-lg shadow-black/25' : 'bg-white border border-lynx-silver shadow-sm'} rounded-xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-xl`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Leaderboard</h3>
          <button onClick={() => onNavigate?.('leaderboards')} className="text-sm text-[var(--accent-primary)] font-semibold hover:opacity-80 transition">
            View All →
          </button>
        </div>
        <div className="space-y-1">
          {leaderboardCats.map(stat => (
            <div key={stat.cat} className={`flex items-center justify-between py-2 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-100'} last:border-b-0`}>
              <span className={`text-base font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{stat.cat}</span>
              {/* TODO: Wire to actual game_stats rankings when data exists */}
              <span className={`text-base font-bold px-3 py-1 rounded-lg ${isDark ? 'bg-white/10 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>—</span>
            </div>
          ))}
        </div>
      </div>

      {/* Player Stats Preview */}
      <div className={`${isDark ? 'bg-lynx-charcoal border border-white/[0.08] shadow-lg shadow-black/25' : 'bg-white border border-lynx-silver shadow-sm'} rounded-xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-xl`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Player Stats</h3>
          <button onClick={() => onNavigate?.('leaderboards')} className="text-sm text-[var(--accent-primary)] font-semibold hover:opacity-80 transition">
            Full Stats →
          </button>
        </div>
        {/* TODO: Wire to Supabase game_stats for actual player stats */}
        <div className="text-center py-4">
          <BarChart3 className={`w-8 h-8 mx-auto ${isDark ? 'text-slate-600' : 'text-slate-300'} mb-1`} />
          <p className={`text-base ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Stats update after games</p>
          <p className={`text-base ${isDark ? 'text-slate-600' : 'text-slate-300'} mt-1`}>Check leaderboards for rankings</p>
        </div>
      </div>
    </aside>
  )
}
