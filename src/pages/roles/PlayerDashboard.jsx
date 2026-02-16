import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  Calendar, Users, Trophy, Star, TrendingUp, Award, Target,
  ChevronRight, BarChart3, Zap, Shield, Clock, MapPin, Eye, X,
  Sparkles, Medal, ChevronLeft, Activity, Flag
} from '../../constants/icons'
import { VolleyballIcon } from '../../constants/icons'

// ============================================
// HELPERS
// ============================================
function formatTime12(t) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hr = parseInt(h)
  return (hr % 12 || 12) + ':' + m + ' ' + (hr >= 12 ? 'PM' : 'AM')
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const d = new Date(dateStr)
  const mins = Math.floor((now - d) / 60000)
  if (mins < 0) {
    const days = Math.ceil(Math.abs(mins) / 1440)
    return days === 1 ? 'Tomorrow' : `In ${days} days`
  }
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ============================================
// SCOPED STYLES
// ============================================
const STYLES = `
.pd { animation: pdFadeIn 0.5s ease-out; }
@keyframes pdFadeIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }

.pd-hero { position:relative; overflow:hidden; border-radius:1.5rem; }
.pd-hero::after { content:''; position:absolute; inset:0; background:linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.7) 100%); pointer-events:none; }

.pd-avatar-glow { animation: pdAvatarGlow 3s ease-in-out infinite alternate; }
@keyframes pdAvatarGlow { from { box-shadow: 0 0 20px var(--glow-color, rgba(99,102,241,0.4)); } to { box-shadow: 0 0 40px var(--glow-color, rgba(99,102,241,0.6)); } }

.pd-highlight-scroll { scroll-snap-type: x mandatory; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
.pd-highlight-scroll::-webkit-scrollbar { display: none; }
.pd-hl-card { scroll-snap-align: start; transition: transform 0.25s ease, box-shadow 0.25s ease; }
.pd-hl-card:hover { transform: translateY(-6px) scale(1.03); box-shadow: 0 16px 40px rgba(0,0,0,0.3); }

.pd-bar-fill { transform-origin: left; animation: pdBarGrow 0.8s ease-out backwards; }
@keyframes pdBarGrow { from { transform: scaleX(0); } to { transform: scaleX(1); } }

.pd-xp-fill { animation: pdXpFill 1.5s ease-out; }
@keyframes pdXpFill { from { width: 0%; } }

.pd-feed-item { animation: pdFeedIn 0.35s ease-out backwards; }
@keyframes pdFeedIn { from { opacity:0; transform:translateX(8px); } to { opacity:1; transform:translateX(0); } }

.pd-quest:hover { transform: translateY(-2px); border-color: var(--accent-primary) !important; }

.pd-pulse { animation: pdPulse 2s ease-in-out infinite; }
@keyframes pdPulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }

.pd-shimmer { position:relative; overflow:hidden; }
.pd-shimmer::before { content:''; position:absolute; inset:0; background:linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent); animation:pdShimmer 3s ease-in-out infinite; }
@keyframes pdShimmer { 0% { transform:translateX(-100%); } 100% { transform:translateX(100%); } }
`

// ============================================
// STAT CONFIGS
// ============================================
const STAT_DEFS = [
  { key: 'kills', label: 'Kills', field: 'total_kills', color: '#EF4444', icon: Zap },
  { key: 'aces', label: 'Aces', field: 'total_aces', color: '#8B5CF6', icon: Target },
  { key: 'digs', label: 'Digs', field: 'total_digs', color: '#3B82F6', icon: Shield },
  { key: 'blocks', label: 'Blocks', field: 'total_blocks', color: '#F59E0B', icon: Shield },
  { key: 'assists', label: 'Assists', field: 'total_assists', color: '#10B981', icon: Users },
  { key: 'points', label: 'Points', field: 'total_points', color: '#EC4899', icon: Trophy },
]

// ============================================
// ADMIN PLAYER SELECTOR
// ============================================
function AdminPlayerSelector({ players, selectedPlayerId, onSelect, onClose, isDark, tc }) {
  const [search, setSearch] = useState('')
  const filtered = players.filter(p =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    p.jersey_number?.toString().includes(search)
  )

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col rounded-2xl ${
        isDark ? 'bg-slate-800 border border-white/[0.08]' : 'bg-white/95 backdrop-blur-xl border border-slate-200/60'
      }`}>
        <div className={`p-5 border-b ${tc.border} flex items-center justify-between`}>
          <div>
            <h2 className={`text-lg font-bold ${tc.text}`}>View as Player</h2>
            <p className={`text-sm ${tc.textMuted}`}>Select a player to preview their dashboard</p>
          </div>
          <button onClick={onClose} className={`p-2 ${tc.hoverBg} rounded-xl`}>
            <X className={`w-5 h-5 ${tc.textMuted}`} />
          </button>
        </div>
        <div className="p-4">
          <input
            type="text"
            placeholder="Search by name or jersey #..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`w-full px-4 py-2.5 rounded-xl text-sm ${
              isDark ? 'bg-white/[0.06] border border-white/[0.08] text-white placeholder-slate-500' : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400'
            } outline-none transition focus:border-[var(--accent-primary)]`}
          />
        </div>
        <div className="flex-1 overflow-auto px-4 pb-4 space-y-2">
          {filtered.map(player => (
            <button
              key={player.id}
              onClick={() => onSelect(player)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition ${
                selectedPlayerId === player.id
                  ? 'bg-[var(--accent-primary)]/20 ring-2 ring-[var(--accent-primary)]'
                  : `${isDark ? 'bg-white/[0.04] hover:bg-white/[0.08]' : 'bg-slate-50 hover:bg-slate-100'}`
              }`}
            >
              {player.photo_url ? (
                <img src={player.photo_url} className="w-10 h-10 rounded-full object-cover" alt="" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center text-sm font-bold text-[var(--accent-primary)]">
                  {player.jersey_number || `${player.first_name?.[0]}${player.last_name?.[0]}`}
                </div>
              )}
              <div className="text-left flex-1">
                <p className={`font-medium ${tc.text}`}>{player.first_name} {player.last_name}</p>
                <p className={`text-xs ${tc.textMuted}`}>#{player.jersey_number} · {player.position || 'Player'}</p>
              </div>
              {selectedPlayerId === player.id && (
                <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)] flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              )}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-8">
              <Users className={`w-12 h-12 mx-auto ${tc.textMuted} mb-2`} />
              <p className={tc.textMuted}>No players found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// MAIN PLAYER DASHBOARD
// ============================================
function PlayerDashboard({ roleContext, navigateToTeamWall, onNavigate, showToast, onPlayerChange }) {
  const tc = useThemeClasses()
  const { isDark, accent } = useTheme()
  const { user } = useAuth()
  const { selectedSeason } = useSeason()

  // Data state
  const [loading, setLoading] = useState(true)
  const [playerData, setPlayerData] = useState(null)
  const [seasonStats, setSeasonStats] = useState(null)
  const [gameStats, setGameStats] = useState([])
  const [badges, setBadges] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [rankings, setRankings] = useState({})
  const [maxStats, setMaxStats] = useState({})

  // Admin preview
  const [isAdminPreview, setIsAdminPreview] = useState(false)
  const [showPlayerSelector, setShowPlayerSelector] = useState(false)
  const [allPlayers, setAllPlayers] = useState([])
  const [previewPlayer, setPreviewPlayer] = useState(null)

  const isAdmin = roleContext?.role === 'admin' || roleContext?.role === 'head_coach'
  const viewingPlayer = previewPlayer || roleContext?.playerInfo

  // ── Load admin players ──
  useEffect(() => {
    if (isAdmin && selectedSeason?.id) loadAllPlayers()
  }, [isAdmin, selectedSeason?.id])

  useEffect(() => {
    if (viewingPlayer?.id) loadPlayerDashboard(viewingPlayer)
    else setLoading(false)
  }, [viewingPlayer?.id, selectedSeason?.id])

  async function loadAllPlayers() {
    if (!selectedSeason?.id) return
    try {
      const { data } = await supabase
        .from('players')
        .select('id, first_name, last_name, jersey_number, photo_url, position, team_players(team_id, teams(id, name, season_id))')
        .eq('team_players.teams.season_id', selectedSeason.id)
      if (data) {
        const seasonPlayers = data.filter(p => p.team_players?.length > 0)
        setAllPlayers(seasonPlayers)
        if (!previewPlayer && seasonPlayers.length > 0) {
          setPreviewPlayer(seasonPlayers[0])
          setIsAdminPreview(true)
          onPlayerChange?.(seasonPlayers[0])
        }
      }
    } catch (err) { console.error('Error loading players:', err) }
  }

  function handleSelectPreviewPlayer(player) {
    setPreviewPlayer(player)
    setIsAdminPreview(true)
    setShowPlayerSelector(false)
    onPlayerChange?.(player)
  }

  async function loadPlayerDashboard(player) {
    setLoading(true)
    try {
      // Team memberships
      const { data: teamData } = await supabase
        .from('team_players')
        .select('*, teams(*)')
        .eq('player_id', player.id)

      setPlayerData({ ...player, teams: teamData?.map(tp => tp.teams).filter(Boolean) || [] })

      // Season stats
      if (selectedSeason?.id) {
        const { data: stats } = await supabase
          .from('player_season_stats')
          .select('*')
          .eq('player_id', player.id)
          .eq('season_id', selectedSeason.id)
          .maybeSingle()
        setSeasonStats(stats)

        // Recent game stats with event join
        const { data: gameData } = await supabase
          .from('game_player_stats')
          .select('*, event:event_id(*)')
          .eq('player_id', player.id)
          .order('created_at', { ascending: false })
          .limit(5)
        setGameStats(gameData || [])

        await loadRankings(player.id)
        await loadMaxStats()
      }

      // Upcoming events
      const teamIds = teamData?.map(tp => tp.team_id).filter(Boolean) || []
      if (teamIds.length > 0) {
        const today = new Date().toISOString().split('T')[0]
        const { data: events } = await supabase
          .from('schedule_events')
          .select('*, teams(*)')
          .in('team_id', teamIds)
          .gte('event_date', today)
          .order('event_date', { ascending: true })
          .limit(5)
        setUpcomingEvents(events || [])
      }

      // Achievements with detail join
      try {
        const { data: badgeData } = await supabase
          .from('player_achievements')
          .select('*, achievement:achievement_id(id, name, icon, rarity, color_primary)')
          .eq('player_id', player.id)
          .order('earned_at', { ascending: false })
        setBadges(badgeData || [])
      } catch { setBadges([]) }

    } catch (err) { console.error('Error loading player dashboard:', err) }
    setLoading(false)
  }

  async function loadRankings(playerId) {
    if (!selectedSeason?.id) return
    try {
      const { data: allStats } = await supabase
        .from('player_season_stats')
        .select('player_id, total_kills, total_aces, total_digs, total_blocks, total_assists, total_points')
        .eq('season_id', selectedSeason.id)
      if (!allStats) return
      const nr = {}
      ;['kills', 'aces', 'digs', 'blocks', 'assists', 'points'].forEach(stat => {
        const sorted = [...allStats].sort((a, b) => (b[`total_${stat}`] || 0) - (a[`total_${stat}`] || 0))
        const rank = sorted.findIndex(s => s.player_id === playerId) + 1
        if (rank > 0) nr[stat] = rank
      })
      setRankings(nr)
    } catch (err) { console.error('Error loading rankings:', err) }
  }

  async function loadMaxStats() {
    if (!selectedSeason?.id) return
    try {
      const { data } = await supabase
        .from('player_season_stats')
        .select('total_kills, total_aces, total_digs, total_blocks, total_assists, total_points')
        .eq('season_id', selectedSeason.id)
      if (data?.length > 0) {
        setMaxStats({
          kills: Math.max(...data.map(d => d.total_kills || 0), 1),
          aces: Math.max(...data.map(d => d.total_aces || 0), 1),
          digs: Math.max(...data.map(d => d.total_digs || 0), 1),
          blocks: Math.max(...data.map(d => d.total_blocks || 0), 1),
          assists: Math.max(...data.map(d => d.total_assists || 0), 1),
          points: Math.max(...data.map(d => d.total_points || 0), 1),
        })
      }
    } catch (err) { console.error('Error loading max stats:', err) }
  }

  // ── Computed values ──
  const displayName = viewingPlayer ? `${viewingPlayer.first_name} ${viewingPlayer.last_name}` : 'Player'
  const teams = playerData?.teams || []
  const primaryTeam = teams[0]
  const teamColor = primaryTeam?.color || accent.primary || '#6366F1'

  // XP & Level
  const xp = useMemo(() => {
    const gp = seasonStats?.games_played || 0
    const k = seasonStats?.total_kills || 0
    const a = seasonStats?.total_aces || 0
    const p = seasonStats?.total_points || 0
    const b = badges.length
    return (gp * 100) + (k * 10) + (a * 20) + (p * 5) + (b * 50)
  }, [seasonStats, badges])

  const level = Math.floor(xp / 1000) + 1
  const xpProgress = xp > 0 ? ((xp % 1000) / 1000) * 100 : 0
  const xpToNext = 1000 - (xp % 1000)

  // Highlight reel cards
  const highlightCards = useMemo(() => {
    const cards = []

    // Achievement cards
    badges.forEach(b => {
      cards.push({
        type: 'achievement',
        title: b.achievement?.name || 'Achievement',
        subtitle: 'Badge Earned',
        icon: b.achievement?.icon || '🏆',
        gradient: `linear-gradient(135deg, ${b.achievement?.color_primary || '#8B5CF6'}, ${b.achievement?.color_primary || '#8B5CF6'}88)`,
        date: b.earned_at,
        rarity: b.achievement?.rarity,
      })
    })

    // Game result cards
    gameStats.forEach(gs => {
      const isWin = gs.event?.game_result === 'win'
      const result = gs.event?.game_result
      cards.push({
        type: 'game',
        title: isWin ? 'VICTORY' : result === 'loss' ? 'DEFEAT' : 'GAME',
        subtitle: gs.event?.opponent_name ? `vs ${gs.event.opponent_name}` : 'Match',
        icon: isWin ? '🏆' : '🏐',
        gradient: isWin
          ? 'linear-gradient(135deg, #10B981, #065F46)'
          : result === 'loss'
            ? 'linear-gradient(135deg, #EF4444, #7F1D1D)'
            : 'linear-gradient(135deg, #6B7280, #374151)',
        stat: `${gs.kills || 0}K  ${gs.aces || 0}A  ${gs.digs || 0}D`,
        date: gs.event?.event_date || gs.created_at,
      })
    })

    // Stat milestone cards
    const milestones = [
      { field: 'total_kills', threshold: 25, label: 'KILLS', icon: '⚡', color: '#EF4444' },
      { field: 'total_aces', threshold: 10, label: 'ACES', icon: '🎯', color: '#8B5CF6' },
      { field: 'total_points', threshold: 50, label: 'POINTS', icon: '🔥', color: '#EC4899' },
      { field: 'total_digs', threshold: 25, label: 'DIGS', icon: '🛡️', color: '#3B82F6' },
    ]
    milestones.forEach(m => {
      const val = seasonStats?.[m.field] || 0
      if (val >= m.threshold) {
        cards.push({
          type: 'milestone',
          title: `${val} ${m.label}`,
          subtitle: 'Season Milestone',
          icon: m.icon,
          gradient: `linear-gradient(135deg, ${m.color}, ${m.color}66)`,
          date: null,
        })
      }
    })

    cards.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    return cards.slice(0, 12)
  }, [badges, gameStats, seasonStats])

  // Hype feed items
  const feedItems = useMemo(() => {
    const items = []

    badges.slice(0, 3).forEach(b => {
      items.push({
        type: 'achievement', icon: b.achievement?.icon || '🏆',
        text: `Earned "${b.achievement?.name || 'Badge'}"`,
        time: b.earned_at, color: b.achievement?.color_primary || '#F59E0B',
      })
    })

    gameStats.slice(0, 3).forEach(gs => {
      const w = gs.event?.game_result === 'win'
      items.push({
        type: 'game', icon: w ? '🏆' : '🏐',
        text: `${w ? 'Won' : 'Played'} vs ${gs.event?.opponent_name || 'Opponent'} — ${gs.kills || 0}K ${gs.aces || 0}A`,
        time: gs.event?.event_date || gs.created_at, color: w ? '#10B981' : '#6B7280',
      })
    })

    upcomingEvents.slice(0, 2).forEach(e => {
      items.push({
        type: 'event', icon: e.event_type === 'game' ? '⚔️' : '🏋️',
        text: `${e.event_type === 'game' ? 'Game' : 'Practice'}${e.opponent_name ? ` vs ${e.opponent_name}` : ''}`,
        time: e.event_date, color: e.teams?.color || '#3B82F6', isFuture: true,
      })
    })

    items.sort((a, b) => {
      if (a.isFuture && !b.isFuture) return -1
      if (!a.isFuture && b.isFuture) return 1
      return new Date(b.time || 0) - new Date(a.time || 0)
    })
    return items.slice(0, 8)
  }, [badges, gameStats, upcomingEvents])

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full animate-spin" style={{ border: `3px solid ${teamColor}33`, borderTopColor: teamColor }} />
          <p className={`mt-4 ${tc.textMuted} text-sm`}>Loading your trophy room...</p>
        </div>
      </div>
    )
  }

  if (!viewingPlayer && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <VolleyballIcon className={`w-16 h-16 ${tc.textMuted} mb-4`} />
        <h2 className={`text-xl font-bold ${tc.text} mb-2`}>Player Dashboard</h2>
        <p className={tc.textMuted}>Player account not linked yet.</p>
        <p className={`text-sm ${tc.textMuted} mt-1`}>Contact your league admin to set up your player profile.</p>
      </div>
    )
  }

  // ════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════
  return (
    <div className="pd space-y-6">
      <style>{STYLES}</style>

      {/* Admin Preview Banner */}
      {isAdminPreview && (
        <div className={`flex items-center gap-3 p-3 rounded-2xl ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
          <Eye className="w-5 h-5 text-amber-500" />
          <p className={`text-sm flex-1 ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
            Viewing as <span className="font-bold">{displayName}</span> (Admin Preview)
          </p>
          <button
            onClick={() => setShowPlayerSelector(true)}
            className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 transition font-medium"
          >
            Switch Player
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════
          SECTION 1: HERO IDENTITY BANNER
          ══════════════════════════════════════ */}
      <div className="pd-hero" style={{ minHeight: 260 }}>
        {/* Gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${teamColor}DD 0%, ${teamColor}66 40%, ${isDark ? '#0F172A' : '#64748B'}44 100%)`,
          }}
        />
        {/* Animated shimmer overlay */}
        <div className="pd-shimmer absolute inset-0" />
        {/* Decorative circle */}
        <div
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: teamColor }}
        />

        {/* Content - sits above ::after gradient */}
        <div className="relative z-10 px-6 sm:px-10 pt-8 pb-24">
          <div className="flex items-start gap-4 sm:gap-6">
            {/* Admin switch button */}
            {isAdmin && (
              <button
                onClick={() => setShowPlayerSelector(true)}
                className="absolute top-4 right-4 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md text-white/80 text-xs hover:bg-white/20 transition flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" /> Switch
              </button>
            )}
          </div>
        </div>

        {/* Glass identity card floating over bottom */}
        <div className="relative z-10 -mt-16 mx-4 sm:mx-8">
          <div className={`rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5 ${
            isDark
              ? 'bg-slate-800/80 backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_40px_rgba(0,0,0,0.5)]'
              : 'bg-white/90 backdrop-blur-2xl border border-slate-200/60 shadow-[0_8px_40px_rgba(0,0,0,0.12)]'
          }`}>
            {/* Avatar */}
            <div className="pd-avatar-glow rounded-2xl shrink-0" style={{ '--glow-color': `${teamColor}66` }}>
              {viewingPlayer?.photo_url ? (
                <img
                  src={viewingPlayer.photo_url}
                  alt={displayName}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover"
                  style={{ border: `3px solid ${teamColor}` }}
                />
              ) : (
                <div
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center text-white text-4xl font-black"
                  style={{ background: `linear-gradient(135deg, ${teamColor}, ${teamColor}99)`, border: `3px solid ${teamColor}` }}
                >
                  {viewingPlayer?.jersey_number || viewingPlayer?.first_name?.[0]}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <h1
                className={`text-3xl sm:text-4xl font-black tracking-tight uppercase ${tc.text}`}
                style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.02em' }}
              >
                {displayName}
              </h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1.5">
                {primaryTeam && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: teamColor }}>
                    {primaryTeam.name}
                  </span>
                )}
                {viewingPlayer?.jersey_number && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700'}`}>
                    #{viewingPlayer.jersey_number}
                  </span>
                )}
                {viewingPlayer?.position && (
                  <span className={`text-sm ${tc.textMuted}`}>{viewingPlayer.position}</span>
                )}
              </div>

              {/* XP Bar */}
              <div className="mt-4 max-w-md">
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-bold uppercase tracking-wider ${tc.textMuted}`} style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    <Sparkles className="w-3.5 h-3.5 inline mr-1" style={{ color: teamColor }} />
                    Level {level}
                  </span>
                  <span className={`text-xs ${tc.textMuted}`}>
                    {xp.toLocaleString()} XP · {xpToNext} to next
                  </span>
                </div>
                <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
                  <div
                    className="pd-xp-fill h-full rounded-full"
                    style={{
                      width: `${xpProgress}%`,
                      background: `linear-gradient(90deg, ${teamColor}, ${teamColor}CC)`,
                      boxShadow: `0 0 12px ${teamColor}66`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Season badge (right side, desktop) */}
            <div className="hidden sm:flex flex-col items-center gap-1 shrink-0">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black"
                style={{ background: `linear-gradient(135deg, ${teamColor}, ${teamColor}88)` }}
              >
                {seasonStats?.games_played || 0}
              </div>
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${tc.textMuted}`} style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                Games
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          SECTION 2: HIGHLIGHT REEL
          ══════════════════════════════════════ */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2
            className={`text-xl font-bold tracking-tight ${tc.text}`}
            style={{ fontFamily: 'Bebas Neue, sans-serif' }}
          >
            <Star className="w-5 h-5 inline mr-2" style={{ color: teamColor }} />
            My Highlights
          </h2>
          {badges.length > 0 && (
            <button onClick={() => onNavigate?.('achievements')} className="text-xs text-[var(--accent-primary)] hover:underline font-medium flex items-center gap-1">
              All Achievements <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {highlightCards.length > 0 ? (
          <div className="pd-highlight-scroll flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
            {highlightCards.map((card, idx) => (
              <div
                key={idx}
                className="pd-hl-card w-[150px] sm:w-[160px] shrink-0 rounded-2xl overflow-hidden relative cursor-default"
                style={{ height: 220, background: card.gradient }}
              >
                {/* Top rarity indicator */}
                {card.rarity && (
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-black/30 backdrop-blur-sm text-white/90">
                    {card.rarity}
                  </div>
                )}

                {/* Center icon */}
                <div className="flex items-center justify-center h-[55%]">
                  <span className="text-5xl drop-shadow-lg">{card.icon}</span>
                </div>

                {/* Bottom info */}
                <div className="absolute bottom-0 inset-x-0 p-3" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.6))' }}>
                  <p className="text-white font-black text-sm tracking-wide uppercase leading-tight" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                    {card.title}
                  </p>
                  <p className="text-white/70 text-[10px] mt-0.5">{card.subtitle}</p>
                  {card.stat && <p className="text-white/90 text-xs font-bold mt-1">{card.stat}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`rounded-2xl p-8 text-center ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white/60 border border-slate-200/50'}`}>
            <Trophy className={`w-12 h-12 mx-auto mb-3 ${tc.textMuted}`} />
            <p className={`font-medium ${tc.text}`}>No highlights yet</p>
            <p className={`text-sm ${tc.textMuted} mt-1`}>Earn achievements and play games to fill your trophy room!</p>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
          MAIN GRID: DNA STATS + SIDEBAR
          ══════════════════════════════════════ */}
      <div className="grid grid-cols-12 gap-6">

        {/* ─── LEFT: PLAYER DNA STATS ─── */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className={`rounded-2xl overflow-hidden ${
            isDark ? 'bg-white/[0.03] backdrop-blur-xl border border-white/[0.06]' : 'bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-sm'
          }`}>
            <div className={`px-6 py-4 border-b ${tc.border} flex items-center justify-between`}>
              <h2
                className={`text-xl font-bold tracking-tight ${tc.text}`}
                style={{ fontFamily: 'Bebas Neue, sans-serif' }}
              >
                <Activity className="w-5 h-5 inline mr-2" style={{ color: teamColor }} />
                Player DNA
              </h2>
              {selectedSeason && (
                <span className={`text-xs ${tc.textMuted} px-2.5 py-1 rounded-full ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
                  {selectedSeason.name}
                </span>
              )}
            </div>

            {seasonStats ? (
              <div className="p-5 sm:p-6 space-y-4">
                {STAT_DEFS.map((stat, idx) => {
                  const value = seasonStats?.[stat.field] || 0
                  const max = maxStats[stat.key] || 1
                  const pct = Math.min((value / max) * 100, 100)
                  const rank = rankings[stat.key]
                  const StatIcon = stat.icon

                  return (
                    <div key={stat.key} className="flex items-center gap-3 sm:gap-4">
                      {/* Icon */}
                      <div
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${stat.color}20` }}
                      >
                        <StatIcon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: stat.color }} />
                      </div>

                      {/* Label */}
                      <div className="w-14 sm:w-16 shrink-0">
                        <span
                          className={`text-xs font-bold uppercase tracking-wider ${tc.textMuted}`}
                          style={{ fontFamily: 'Rajdhani, sans-serif' }}
                        >
                          {stat.label}
                        </span>
                      </div>

                      {/* Bar */}
                      <div className="flex-1 min-w-0">
                        <div className={`h-7 sm:h-8 rounded-xl overflow-hidden relative ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
                          <div
                            className="pd-bar-fill h-full rounded-xl flex items-center justify-end pr-3"
                            style={{
                              width: `${Math.max(pct, 8)}%`,
                              backgroundColor: stat.color,
                              animationDelay: `${idx * 0.1}s`,
                              boxShadow: `0 0 16px ${stat.color}44`,
                            }}
                          >
                            <span className="text-white text-sm font-black">{value}</span>
                          </div>
                        </div>
                      </div>

                      {/* Rank badge */}
                      <div className="w-10 shrink-0 text-center">
                        {rank && rank <= 10 ? (
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black ${
                              rank <= 3
                                ? 'bg-amber-500/20 text-amber-400'
                                : `${isDark ? 'bg-white/[0.06] text-slate-400' : 'bg-slate-100 text-slate-500'}`
                            }`}
                          >
                            #{rank}
                          </span>
                        ) : (
                          <span className={`text-xs ${tc.textMuted}`}>—</span>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Extra stats row */}
                <div className={`mt-4 pt-4 border-t ${tc.border} grid grid-cols-3 gap-3`}>
                  {[
                    { label: 'Hit %', value: seasonStats.hit_percentage != null ? `${(seasonStats.hit_percentage * 100).toFixed(1)}%` : '—', color: seasonStats.hit_percentage >= 0.3 ? '#10B981' : seasonStats.hit_percentage >= 0.2 ? '#F59E0B' : '#EF4444' },
                    { label: 'Serve %', value: seasonStats.serve_percentage != null ? `${(seasonStats.serve_percentage * 100).toFixed(1)}%` : '—', color: seasonStats.serve_percentage >= 0.9 ? '#10B981' : seasonStats.serve_percentage >= 0.8 ? '#F59E0B' : '#EF4444' },
                    { label: 'Games', value: seasonStats.games_played || 0, color: teamColor },
                  ].map(s => (
                    <div key={s.label} className={`text-center p-3 rounded-xl ${isDark ? 'bg-white/[0.04]' : 'bg-slate-50'}`}>
                      <p className="text-lg sm:text-xl font-black" style={{ color: s.color }}>{s.value}</p>
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${tc.textMuted}`} style={{ fontFamily: 'Rajdhani, sans-serif' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-10 text-center">
                <BarChart3 className={`w-14 h-14 mx-auto ${tc.textMuted} mb-3`} />
                <p className={`font-medium ${tc.text}`}>No stats recorded yet</p>
                <p className={`text-sm ${tc.textMuted} mt-1`}>Stats will appear after games are played and scored</p>
              </div>
            )}
          </div>

          {/* Recent Game Results */}
          {gameStats.length > 0 && (
            <div className={`rounded-2xl overflow-hidden ${
              isDark ? 'bg-white/[0.03] backdrop-blur-xl border border-white/[0.06]' : 'bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-sm'
            }`}>
              <div className={`px-6 py-4 border-b ${tc.border}`}>
                <h2 className={`text-xl font-bold tracking-tight ${tc.text}`} style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  <Clock className="w-5 h-5 inline mr-2" style={{ color: teamColor }} />
                  Recent Games
                </h2>
              </div>
              <div className="p-4 space-y-2">
                {gameStats.map(gs => {
                  const isWin = gs.event?.game_result === 'win'
                  const isLoss = gs.event?.game_result === 'loss'
                  const gameDate = gs.event?.event_date ? new Date(gs.event.event_date + 'T00:00:00') : new Date(gs.created_at)

                  return (
                    <div key={gs.id} className={`flex items-center gap-4 p-3 rounded-xl ${isDark ? 'bg-white/[0.04] hover:bg-white/[0.06]' : 'bg-slate-50 hover:bg-slate-100'} transition`}>
                      <div className="text-center w-11">
                        <p className={`text-[10px] font-semibold uppercase ${tc.textMuted}`}>{gameDate.toLocaleDateString('en-US', { month: 'short' })}</p>
                        <p className={`text-lg font-black ${tc.text}`}>{gameDate.getDate()}</p>
                      </div>
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-sm ${
                        isWin ? 'bg-emerald-500' : isLoss ? 'bg-red-500' : 'bg-slate-500'
                      }`}>
                        {isWin ? 'W' : isLoss ? 'L' : '—'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm ${tc.text} truncate`}>
                          {gs.event?.opponent_name ? `vs ${gs.event.opponent_name}` : 'Game'}
                        </p>
                        <p className={`text-xs ${tc.textMuted}`}>
                          {gs.event?.our_score != null ? `${gs.event.our_score}-${gs.event.opponent_score}` : 'Score N/A'}
                        </p>
                      </div>
                      <div className="flex gap-3 text-center">
                        {[
                          { l: 'K', v: gs.kills, c: '#EF4444' },
                          { l: 'A', v: gs.aces, c: '#8B5CF6' },
                          { l: 'D', v: gs.digs, c: '#3B82F6' },
                          { l: 'B', v: gs.blocks, c: '#F59E0B' },
                        ].map(s => (
                          <div key={s.l}>
                            <p className={`text-[10px] ${tc.textMuted}`}>{s.l}</p>
                            <p className="font-bold text-sm" style={{ color: (s.v || 0) > 0 ? s.c : undefined }}>{s.v || 0}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* ─── RIGHT SIDEBAR ─── */}
        <div className="col-span-12 lg:col-span-4 space-y-5">

          {/* SECTION 4: HYPE FEED */}
          <div
            className={`rounded-2xl overflow-hidden ${
              isDark ? 'bg-white/[0.03] backdrop-blur-xl border border-white/[0.06]' : 'bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-sm'
            }`}
            style={{ boxShadow: isDark ? `0 0 40px ${teamColor}08` : undefined }}
          >
            <div className={`px-5 py-3.5 border-b ${tc.border} flex items-center justify-between`}>
              <h3
                className={`text-sm font-bold uppercase tracking-wider ${tc.text}`}
                style={{ fontFamily: 'Rajdhani, sans-serif' }}
              >
                <Zap className="w-4 h-4 inline mr-1.5" style={{ color: teamColor }} />
                Activity Feed
              </h3>
              <div className="flex items-center gap-1.5">
                <div className="pd-pulse w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-semibold text-emerald-500 uppercase">Live</span>
              </div>
            </div>

            <div className="p-3">
              {feedItems.length > 0 ? (
                <div className="space-y-1">
                  {feedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className={`pd-feed-item flex items-start gap-3 px-3 py-2.5 rounded-xl transition ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'}`}
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ backgroundColor: `${item.color}20` }}>
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${tc.text} leading-tight`}>{item.text}</p>
                        <p className={`text-[10px] ${tc.textMuted} mt-0.5`}>
                          {item.isFuture ? '🔜 ' : ''}{timeAgo(item.time)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center">
                  <Activity className={`w-8 h-8 mx-auto ${tc.textMuted} mb-2`} />
                  <p className={`text-sm ${tc.textMuted}`}>No activity yet</p>
                </div>
              )}

              {primaryTeam && (
                <button
                  onClick={() => navigateToTeamWall?.(primaryTeam.id)}
                  className="w-full mt-3 py-2.5 rounded-xl text-sm font-semibold text-center transition"
                  style={{ backgroundColor: `${teamColor}15`, color: teamColor }}
                >
                  View Team Wall <ChevronRight className="w-4 h-4 inline" />
                </button>
              )}
            </div>
          </div>

          {/* SECTION 5: UPCOMING QUESTS */}
          <div className={`rounded-2xl overflow-hidden ${
            isDark ? 'bg-white/[0.03] backdrop-blur-xl border border-white/[0.06]' : 'bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-sm'
          }`}>
            <div className={`px-5 py-3.5 border-b ${tc.border} flex items-center justify-between`}>
              <h3
                className={`text-sm font-bold uppercase tracking-wider ${tc.text}`}
                style={{ fontFamily: 'Rajdhani, sans-serif' }}
              >
                <Flag className="w-4 h-4 inline mr-1.5" style={{ color: teamColor }} />
                Upcoming Missions
              </h3>
              <button onClick={() => onNavigate?.('schedule')} className="text-[10px] text-[var(--accent-primary)] hover:underline font-semibold uppercase">
                View All
              </button>
            </div>

            <div className="p-3">
              {upcomingEvents.length > 0 ? (
                <div className="space-y-2">
                  {upcomingEvents.slice(0, 3).map(event => {
                    const eventDate = new Date(event.event_date + 'T00:00:00')
                    const isToday = eventDate.toDateString() === new Date().toDateString()
                    const isGame = event.event_type === 'game'
                    const evtColor = event.teams?.color || teamColor

                    return (
                      <div
                        key={event.id}
                        className={`pd-quest rounded-xl p-3.5 transition cursor-pointer ${
                          isDark ? 'bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06]' : 'bg-slate-50 border border-slate-200/50 hover:bg-slate-100'
                        }`}
                        onClick={() => onNavigate?.('schedule')}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white font-black shrink-0"
                            style={{ background: `linear-gradient(135deg, ${evtColor}, ${evtColor}88)` }}
                          >
                            <span className="text-[10px] leading-none">{eventDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}</span>
                            <span className="text-lg leading-none">{eventDate.getDate()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                                style={{ backgroundColor: `${evtColor}20`, color: evtColor, fontFamily: 'Rajdhani, sans-serif' }}
                              >
                                {isGame ? '⚔️ Game' : '🏋️ Practice'}
                              </span>
                              {isToday && (
                                <span className="pd-pulse text-[10px] font-bold text-emerald-500 uppercase">Today</span>
                              )}
                            </div>
                            <p className={`text-sm font-semibold ${tc.text} mt-1 truncate`}>
                              {isGame ? `vs ${event.opponent_name || 'TBD'}` : event.title || 'Team Practice'}
                            </p>
                            <div className={`flex items-center gap-3 mt-1 text-xs ${tc.textMuted}`}>
                              {event.event_time && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {formatTime12(event.event_time)}
                                </span>
                              )}
                              {(event.venue_name || event.location) && (
                                <span className="flex items-center gap-1 truncate">
                                  <MapPin className="w-3 h-3" /> {event.venue_name || event.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-6 text-center">
                  <Calendar className={`w-10 h-10 mx-auto ${tc.textMuted} mb-2`} />
                  <p className={`text-sm font-medium ${tc.text}`}>No missions scheduled</p>
                  <p className={`text-xs ${tc.textMuted} mt-1`}>Check back later for upcoming games and practices</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            {primaryTeam && (
              <button
                onClick={() => navigateToTeamWall?.(primaryTeam.id)}
                className={`rounded-2xl p-4 text-center transition ${
                  isDark ? 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]' : 'bg-white/80 border border-slate-200/50 hover:bg-white shadow-sm'
                }`}
              >
                <Users className="w-6 h-6 mx-auto mb-2" style={{ color: teamColor }} />
                <p className={`text-xs font-bold ${tc.text}`}>Team Hub</p>
              </button>
            )}
            <button
              onClick={() => onNavigate?.('leaderboards')}
              className={`rounded-2xl p-4 text-center transition ${
                isDark ? 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]' : 'bg-white/80 border border-slate-200/50 hover:bg-white shadow-sm'
              }`}
            >
              <Trophy className="w-6 h-6 mx-auto mb-2" style={{ color: teamColor }} />
              <p className={`text-xs font-bold ${tc.text}`}>Leaderboards</p>
            </button>
            <button
              onClick={() => onNavigate?.('achievements')}
              className={`rounded-2xl p-4 text-center transition ${
                isDark ? 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]' : 'bg-white/80 border border-slate-200/50 hover:bg-white shadow-sm'
              }`}
            >
              <Award className="w-6 h-6 mx-auto mb-2" style={{ color: teamColor }} />
              <p className={`text-xs font-bold ${tc.text}`}>Trophies</p>
            </button>
            <button
              onClick={() => onNavigate?.('standings')}
              className={`rounded-2xl p-4 text-center transition ${
                isDark ? 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]' : 'bg-white/80 border border-slate-200/50 hover:bg-white shadow-sm'
              }`}
            >
              <BarChart3 className="w-6 h-6 mx-auto mb-2" style={{ color: teamColor }} />
              <p className={`text-xs font-bold ${tc.text}`}>Standings</p>
            </button>
          </div>
        </div>
      </div>

      {/* Player Selector Modal */}
      {showPlayerSelector && (
        <AdminPlayerSelector
          players={allPlayers}
          selectedPlayerId={previewPlayer?.id}
          onSelect={handleSelectPreviewPlayer}
          onClose={() => setShowPlayerSelector(false)}
          isDark={isDark}
          tc={tc}
        />
      )}
    </div>
  )
}

export { PlayerDashboard }
