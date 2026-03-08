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
 * ParentRightPanel — right sidebar with season record, events, achievements
 * BRAND-styled: big display numbers for wins/losses (matches mobile SeasonSnapshot),
 * event cards, achievement pills, leaderboard preview
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

  useEffect(() => {
    let cancelled = false

    async function loadData() {
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
  const wins = teamRecord?.wins || 0
  const losses = teamRecord?.losses || 0
  const ties = teamRecord?.ties || 0
  const totalGames = wins + losses + ties
  const winPct = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0

  return (
    <aside className="hidden lg:flex w-[330px] shrink-0 flex-col bg-brand-off-white overflow-y-auto p-5 space-y-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>

      {/* ── Season Record (matches mobile SeasonSnapshot — big display numbers) ── */}
      <div className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-[1.2px] text-brand-text-faint mb-3">Season</p>
        {totalGames > 0 ? (
          <>
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <div className="text-[44px] font-black text-[#22C55E] leading-none tracking-wide">{wins}</div>
                <div className="text-[10px] uppercase font-bold text-brand-text-faint mt-1">Wins</div>
              </div>
              <div className="text-2xl font-bold text-brand-border">|</div>
              <div className="text-center">
                <div className="text-[44px] font-black text-[#EF4444] leading-none tracking-wide">{losses}</div>
                <div className="text-[10px] uppercase font-bold text-brand-text-faint mt-1">Losses</div>
              </div>
              {ties > 0 && (
                <>
                  <div className="text-2xl font-bold text-brand-border">|</div>
                  <div className="text-center">
                    <div className="text-[44px] font-black text-amber-500 leading-none tracking-wide">{ties}</div>
                    <div className="text-[10px] uppercase font-bold text-brand-text-faint mt-1">Ties</div>
                  </div>
                </>
              )}
            </div>
            {/* Win rate bar */}
            <div className="mt-4">
              <div className="w-full h-1.5 rounded-full bg-brand-warm-gray">
                <div
                  className="h-1.5 rounded-full bg-[#22C55E] transition-all duration-500"
                  style={{ width: `${winPct}%` }}
                />
              </div>
              <p className="text-[11px] text-brand-text-muted text-center mt-1.5 font-semibold">{winPct}% win rate</p>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <span className="text-2xl block mb-1">🏆</span>
            <p className="text-xs text-brand-text-muted">No games played yet</p>
          </div>
        )}
        <p className="text-[11px] text-brand-text-faint text-center mt-2">{activeTeam?.name}</p>
      </div>

      {/* ── Upcoming Events ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold uppercase tracking-[1.2px] text-brand-text-faint">Upcoming</p>
          <button onClick={() => onNavigate?.('schedule')} className="text-[10px] text-[#4BB9EC] font-bold hover:opacity-80 transition">
            Full Calendar →
          </button>
        </div>
        <div className="space-y-2.5">
          {activeChildEvents?.slice(0, 3).map(event => (
            <ParentEventCard key={event.id} event={event} onClick={onShowEventDetail} />
          ))}
          {(!activeChildEvents || activeChildEvents.length === 0) && (
            <div className="bg-white border border-brand-border rounded-2xl p-6 text-center shadow-sm">
              <Calendar className="w-8 h-8 mx-auto text-brand-text-faint mb-2" />
              <p className="text-xs text-brand-text-muted">No upcoming events</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Achievements Preview ── */}
      <div className="bg-white border border-brand-border rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-[1.2px] text-brand-text-faint">Achievements</p>
          <button onClick={() => onNavigate?.('achievements')} className="text-[10px] text-[#4BB9EC] font-bold hover:opacity-80 transition">
            View All →
          </button>
        </div>
        {playerBadges.length > 0 ? (
          <div className="flex flex-wrap gap-2.5">
            {playerBadges.slice(0, 4).map((b, i) => {
              const def = BADGE_DEFS[b.achievement_id] || {
                name: b.achievements?.name || 'Badge',
                icon: b.achievements?.icon || '🏅',
                color: b.achievements?.color_primary || '#6B7280',
                rarity: b.achievements?.rarity || 'Common',
              }
              const rarityColor = RARITY_COLORS[def.rarity] || RARITY_COLORS[b.achievements?.rarity] || '#6B7280'
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: `${def.color}15`, border: `2px solid ${rarityColor}` }}
                  >
                    {def.icon}
                  </div>
                  <span className="text-[10px] font-bold text-brand-text-muted text-center max-w-[55px] leading-tight">{def.name}</span>
                </div>
              )
            })}
          </div>
        ) : badgesInProgress.length > 0 ? (
          <div className="space-y-2.5">
            {badgesInProgress.slice(0, 3).map((b, i) => {
              const def = BADGE_DEFS[b.achievement_id] || {
                name: b.achievements?.name || 'Badge',
                icon: b.achievements?.icon || '🏅',
                color: b.achievements?.color_primary || '#6B7280',
              }
              const pct = b.target_value > 0 ? Math.min((b.current_value / b.target_value) * 100, 100) : 0
              return (
                <div key={i} className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: `${def.color}15`, border: `2px solid ${def.color}40` }}
                  >
                    {def.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] font-bold text-brand-navy truncate">{def.name}</span>
                      <span className="text-[10px] text-brand-text-muted ml-2 flex-shrink-0">{b.current_value}/{b.target_value}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-brand-warm-gray overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: def.color }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-4">
            <Award className="w-8 h-8 mx-auto text-brand-text-faint mb-1" />
            <p className="text-xs text-brand-text-muted">No badges earned yet</p>
            <p className="text-[10px] text-brand-text-faint mt-1">Keep playing to unlock badges!</p>
          </div>
        )}
      </div>

      {/* ── Leaderboard Preview ── */}
      <div className="bg-white border border-brand-border rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-[1.2px] text-brand-text-faint">Leaderboard</p>
          <button onClick={() => onNavigate?.('leaderboards')} className="text-[10px] text-[#4BB9EC] font-bold hover:opacity-80 transition">
            View All →
          </button>
        </div>
        <div className="space-y-1">
          {leaderboardCats.map(stat => (
            <div key={stat.cat} className="flex items-center justify-between py-2 border-b border-brand-border last:border-b-0">
              <span className="text-xs font-semibold text-brand-navy">{stat.cat}</span>
              <span className="text-xs font-bold px-3 py-1 rounded-lg bg-brand-warm-gray text-brand-text-faint">—</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Player Stats Preview ── */}
      <div className="bg-white border border-brand-border rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-[1.2px] text-brand-text-faint">Player Stats</p>
          <button onClick={() => onNavigate?.('leaderboards')} className="text-[10px] text-[#4BB9EC] font-bold hover:opacity-80 transition">
            Full Stats →
          </button>
        </div>
        <div className="text-center py-4">
          <BarChart3 className="w-8 h-8 mx-auto text-brand-text-faint mb-1" />
          <p className="text-xs text-brand-text-muted">Stats update after games</p>
          <p className="text-[10px] text-brand-text-faint mt-1">Check leaderboards for rankings</p>
        </div>
      </div>
    </aside>
  )
}
