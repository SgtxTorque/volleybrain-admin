import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  Calendar, Users, Trophy, Star, TrendingUp, Award, Target,
  ChevronRight, BarChart3, Zap, Shield, Clock, MapPin, Eye, X,
  Sparkles, Medal, ChevronLeft, Activity, Flag, Swords, Lock,
  Crosshair, Crown
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

function countdownText(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const d = new Date(dateStr + 'T00:00:00')
  const diffMs = d - now
  if (diffMs < 0) return 'Today'
  const days = Math.ceil(diffMs / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `In ${days} days`
}

// ============================================
// PLAYER THEME — extractable for future theme picker
// ============================================
const PLAYER_THEME = {
  bg: '#0f1219',
  bgCard: 'rgba(255,255,255,0.04)',
  bgCardHover: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.08)',
  borderHover: 'rgba(255,255,255,0.15)',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#475569',
}

// ============================================
// STAT CONFIGS
// ============================================
const STAT_DEFS = [
  { key: 'kills', label: 'Kills', field: 'total_kills', color: '#FF3B3B', icon: Zap },
  { key: 'aces', label: 'Aces', field: 'total_aces', color: '#A855F7', icon: Target },
  { key: 'digs', label: 'Digs', field: 'total_digs', color: '#3B82F6', icon: Shield },
  { key: 'blocks', label: 'Blocks', field: 'total_blocks', color: '#F59E0B', icon: Shield },
  { key: 'assists', label: 'Assists', field: 'total_assists', color: '#10B981', icon: Users },
  { key: 'points', label: 'Points', field: 'total_points', color: '#EC4899', icon: Trophy },
]

// ============================================
// ADMIN PLAYER SELECTOR
// ============================================
function AdminPlayerSelector({ players, selectedPlayerId, onSelect, onClose }) {
  const [search, setSearch] = useState('')
  const pt = PLAYER_THEME
  const filtered = players.filter(p =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    p.jersey_number?.toString().includes(search)
  )

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div
        className="w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col rounded-2xl"
        style={{ background: pt.bg, border: `1px solid ${pt.border}` }}
      >
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${pt.border}` }}>
          <div>
            <h2 className="text-lg font-bold text-white">Select Player</h2>
            <p className="text-sm" style={{ color: pt.textMuted }}>Choose a player to view</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition">
            <X className="w-5 h-5" style={{ color: pt.textMuted }} />
          </button>
        </div>
        <div className="p-4">
          <input
            type="text"
            placeholder="Search by name or jersey #..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none transition focus:ring-2 focus:ring-white/20"
            style={{ background: pt.bgCard, border: `1px solid ${pt.border}` }}
          />
        </div>
        <div className="flex-1 overflow-auto px-4 pb-4 space-y-2">
          {filtered.map(player => (
            <button
              key={player.id}
              onClick={() => onSelect(player)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition ${
                selectedPlayerId === player.id
                  ? 'ring-2 ring-white/20 bg-white/10'
                  : 'hover:bg-white/[0.06]'
              }`}
              style={{ background: selectedPlayerId === player.id ? 'rgba(255,255,255,0.08)' : pt.bgCard, border: `1px solid ${selectedPlayerId === player.id ? pt.borderHover : 'transparent'}` }}
            >
              {player.photo_url ? (
                <img src={player.photo_url} className="w-10 h-10 rounded-lg object-cover" style={{ border: `1px solid ${pt.border}` }} alt="" />
              ) : (
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: `${PLAYER_THEME.bgCardHover}`, color: pt.textSecondary }}>
                  {player.jersey_number || `${player.first_name?.[0]}${player.last_name?.[0]}`}
                </div>
              )}
              <div className="text-left flex-1">
                <p className="font-medium text-white">{player.first_name} {player.last_name}</p>
                <p className="text-xs" style={{ color: pt.textMuted }}>#{player.jersey_number} · {player.position || 'Player'}</p>
              </div>
              {selectedPlayerId === player.id && (
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              )}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-2" style={{ color: pt.textMuted }} />
              <p style={{ color: pt.textMuted }}>No players found</p>
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

  const pt = PLAYER_THEME

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

  // XP bar animation trigger
  const [xpAnimated, setXpAnimated] = useState(false)
  useEffect(() => { const t = setTimeout(() => setXpAnimated(true), 300); return () => clearTimeout(t) }, [])

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
      const { data: teamData } = await supabase
        .from('team_players')
        .select('*, teams(*)')
        .eq('player_id', player.id)

      setPlayerData({ ...player, teams: teamData?.map(tp => tp.teams).filter(Boolean) || [] })

      if (selectedSeason?.id) {
        const { data: stats } = await supabase
          .from('player_season_stats')
          .select('*')
          .eq('player_id', player.id)
          .eq('season_id', selectedSeason.id)
          .maybeSingle()
        setSeasonStats(stats)

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
    const d = seasonStats?.total_digs || 0
    const bl = seasonStats?.total_blocks || 0
    const as = seasonStats?.total_assists || 0
    const b = badges.length
    return (gp * 100) + (k * 10) + (a * 25) + (d * 5) + (bl * 15) + (as * 10) + (b * 50)
  }, [seasonStats, badges])

  const level = Math.floor(xp / 1000) + 1
  const xpProgress = xp > 0 ? ((xp % 1000) / 1000) * 100 : 0
  const xpToNext = 1000 - (xp % 1000)

  // Overall Rating (FIFA-style, 1-99 scale)
  const overallRating = useMemo(() => {
    if (!seasonStats) return 0
    const gp = seasonStats.games_played || 0
    if (gp === 0) return 0
    const hitPct = seasonStats.hit_percentage || 0
    const servePct = seasonStats.serve_percentage || 0
    const killsPg = (seasonStats.total_kills || 0) / gp
    const acesPg = (seasonStats.total_aces || 0) / gp
    const digsPg = (seasonStats.total_digs || 0) / gp
    const blocksPg = (seasonStats.total_blocks || 0) / gp
    const assistsPg = (seasonStats.total_assists || 0) / gp
    const raw = (hitPct * 100 * 0.25) + (servePct * 100 * 0.15) +
      (killsPg * 4) + (acesPg * 6) + (digsPg * 2.5) + (blocksPg * 5) + (assistsPg * 3) +
      Math.min(gp * 1.5, 15)
    return Math.min(99, Math.max(40, Math.round(raw + 35)))
  }, [seasonStats])

  // Feed items
  const feedItems = useMemo(() => {
    const items = []
    badges.slice(0, 3).forEach(b => {
      items.push({
        type: 'achievement', icon: '🏆',
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

  const gamesPlayed = seasonStats?.games_played || 0

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" style={{ background: pt.bg }}>
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-full animate-spin" style={{ border: `3px solid ${teamColor}22`, borderTopColor: teamColor }} />
          <p className="mt-4 text-sm tracking-wider uppercase" style={{ color: pt.textMuted }}>Loading player data...</p>
        </div>
      </div>
    )
  }

  if (!viewingPlayer && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center" style={{ background: pt.bg }}>
        <VolleyballIcon className="w-16 h-16 mb-4" style={{ color: pt.textMuted }} />
        <h2 className="text-xl font-bold text-white mb-2">Player Dashboard</h2>
        <p style={{ color: pt.textMuted }}>Player account not linked yet.</p>
        <p className="text-sm mt-1" style={{ color: pt.textMuted }}>Contact your league admin to set up your player profile.</p>
      </div>
    )
  }

  // Section entrance animation helper
  const sectionAnim = (delay = 0) => ({
    animation: `fadeUp 0.5s ease-out ${delay}s both`,
  })

  // Card style helper
  const cardBg = {
    background: pt.bgCard,
    border: `1px solid ${pt.border}`,
  }

  // Rarity config for trophy cards
  const rarityConfig = {
    legendary: { bg: 'linear-gradient(135deg, #F59E0B, #D97706)', label: 'Legendary' },
    epic: { bg: 'linear-gradient(135deg, #A855F7, #7C3AED)', label: 'Epic' },
    rare: { bg: 'linear-gradient(135deg, #3B82F6, #2563EB)', label: 'Rare' },
    common: { bg: 'linear-gradient(135deg, #6B7280, #4B5563)', label: 'Common' },
  }

  // ════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════
  return (
    <div style={{ background: pt.bg, minHeight: '100vh', margin: '-1.5rem', padding: 0 }}>
      {/* Admin Preview Banner */}
      {isAdminPreview && (
        <div
          className="flex items-center gap-3 px-6 py-3"
          style={{ background: 'linear-gradient(90deg, rgba(245,158,11,0.08), rgba(245,158,11,0.03))', borderBottom: '1px solid rgba(245,158,11,0.15)' }}
        >
          <Eye className="w-5 h-5 text-amber-500" />
          <p className="text-sm flex-1" style={{ color: 'rgba(245,158,11,0.7)' }}>
            Viewing as <span className="font-bold text-amber-400">{displayName}</span> (Admin Preview)
          </p>
          <button
            onClick={() => setShowPlayerSelector(true)}
            className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition font-medium border border-amber-500/20"
          >
            Switch Player
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════
          SECTION 1: HERO AREA
          ══════════════════════════════════════ */}
      <div
        className="relative overflow-hidden"
        style={{
          padding: '2rem 1.5rem 2.5rem',
          background: `linear-gradient(180deg, ${pt.bg} 0%, #0c101a 50%, ${pt.bg} 100%)`,
        }}
      >
        {/* Admin switch button */}
        {isAdmin && (
          <button
            onClick={() => setShowPlayerSelector(true)}
            className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-xl text-xs hover:bg-white/10 transition flex items-center gap-1.5"
            style={{ background: pt.bgCard, border: `1px solid ${pt.border}`, color: pt.textSecondary }}
          >
            <Eye className="w-3.5 h-3.5" /> Switch
          </button>
        )}

        {/* Main hero layout */}
        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-6 lg:gap-10 max-w-5xl mx-auto" style={sectionAnim(0)}>

          {/* LEFT: Player Photo */}
          <div className="relative shrink-0">
            <div
              className="relative overflow-hidden rounded-2xl"
              style={{
                width: 260, height: 300,
                border: `2px solid ${teamColor}`,
              }}
            >
              {viewingPlayer?.photo_url ? (
                <>
                  <img
                    src={viewingPlayer.photo_url}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.7) 100%)' }} />
                </>
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: `linear-gradient(180deg, ${teamColor}22 0%, ${pt.bg} 100%)` }}
                >
                  <span className="text-[7rem] font-black text-white/15 select-none">
                    {viewingPlayer?.first_name?.[0]}{viewingPlayer?.last_name?.[0]}
                  </span>
                </div>
              )}

              {/* Jersey number overlay */}
              {viewingPlayer?.jersey_number && (
                <div className="absolute bottom-3 left-3">
                  <span className="text-5xl font-black text-white/25">
                    #{viewingPlayer.jersey_number}
                  </span>
                </div>
              )}
            </div>

            {/* Overall Rating — clean rounded square */}
            {overallRating > 0 && (
              <div className="absolute -bottom-4 -right-4 z-20">
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center"
                  style={{ background: teamColor }}
                >
                  <span className="text-white font-black text-2xl">{overallRating}</span>
                </div>
              </div>
            )}

            {/* Level Badge — clean circle */}
            <div
              className="absolute -top-3 -left-3 z-20 w-14 h-14 rounded-full flex flex-col items-center justify-center"
              style={{
                background: pt.bg,
                border: `2px solid ${teamColor}`,
              }}
            >
              <span className="text-[10px] font-bold uppercase leading-none" style={{ color: pt.textMuted }}>LVL</span>
              <span className="text-lg font-black text-white leading-none">{level}</span>
            </div>
          </div>

          {/* RIGHT: Player Info & XP */}
          <div className="flex-1 text-center lg:text-left min-w-0 space-y-4">
            {/* Player Name */}
            <div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black uppercase leading-none tracking-tight" style={{ color: pt.text }}>
                {displayName}
              </h1>

              {/* Badges row */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mt-3">
                {primaryTeam && (
                  <span
                    className="px-3 py-1 rounded-lg text-xs font-bold text-white uppercase tracking-wider"
                    style={{ background: teamColor }}
                  >
                    {primaryTeam.name}
                  </span>
                )}
                {viewingPlayer?.position && (
                  <span
                    className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider"
                    style={{ background: pt.bgCard, border: `1px solid ${pt.border}`, color: pt.textSecondary }}
                  >
                    {viewingPlayer.position}
                  </span>
                )}
                {viewingPlayer?.jersey_number && (
                  <span
                    className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider"
                    style={{ background: pt.bgCard, border: `1px solid ${pt.border}`, color: pt.textSecondary }}
                  >
                    #{viewingPlayer.jersey_number}
                  </span>
                )}
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className="max-w-lg mx-auto lg:mx-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: pt.textSecondary }}>
                  <Sparkles className="w-3.5 h-3.5 inline mr-1" style={{ color: teamColor }} />
                  Level {level} · {xp.toLocaleString()} XP
                </span>
                <span className="text-xs" style={{ color: pt.textMuted }}>{xpToNext} XP to Level {level + 1}</span>
              </div>
              <div className="h-3.5 rounded-full overflow-hidden" style={{ background: pt.bgCard, border: `1px solid ${pt.border}` }}>
                <div
                  className="h-full rounded-full relative"
                  style={{
                    width: xpAnimated ? `${Math.max(xpProgress, 3)}%` : '0%',
                    background: `linear-gradient(90deg, ${teamColor}, ${teamColor}CC)`,
                    transition: 'width 1s ease-out',
                  }}
                >
                  {/* Subtle shine on fill */}
                  <div className="absolute inset-0 rounded-full" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 60%)' }} />
                </div>
              </div>
            </div>

            {/* Quick stat badges — clean rounded squares */}
            <div className="flex items-center justify-center lg:justify-start gap-4 mt-2">
              {[
                { value: gamesPlayed, label: 'Games', bg: `${teamColor}15`, border: `${teamColor}33` },
                { value: badges.length, label: 'Trophies', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
                { value: seasonStats?.total_points || 0, label: 'Points', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto"
                    style={{ background: s.bg, border: `1px solid ${s.border}` }}
                  >
                    <span className="text-white font-black text-xl">{s.value}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider mt-1.5 block" style={{ color: pt.textMuted }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content area below hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ══════════════════════════════════════
            SECTION 2: SEASON STATS
            ══════════════════════════════════════ */}
        <div style={sectionAnim(0.1)}>
          <div className="rounded-2xl overflow-hidden" style={cardBg}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${pt.border}` }}>
              <h2 className="text-lg font-bold text-white tracking-tight">
                <Activity className="w-5 h-5 inline mr-2" style={{ color: teamColor }} />
                Season Stats
              </h2>
              {selectedSeason && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: pt.bgCard, border: `1px solid ${pt.border}`, color: pt.textMuted }}>
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
                  const perGame = gamesPlayed > 0 ? (value / gamesPlayed).toFixed(1) : '0.0'
                  const StatIcon = stat.icon

                  return (
                    <div key={stat.key}>
                      <div className="flex items-center gap-3 sm:gap-4">
                        {/* Icon */}
                        <div
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `${stat.color}12` }}
                        >
                          <StatIcon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: stat.color }} />
                        </div>

                        {/* Label + per-game */}
                        <div className="w-16 sm:w-20 shrink-0">
                          <span className="text-xs font-semibold uppercase tracking-wider block" style={{ color: pt.textSecondary }}>
                            {stat.label}
                          </span>
                          <span className="text-[10px]" style={{ color: pt.textMuted }}>{perGame}/game</span>
                        </div>

                        {/* Large number */}
                        <div className="w-12 sm:w-14 shrink-0 text-right">
                          <span className="text-xl sm:text-2xl font-black text-white">
                            {value}
                          </span>
                        </div>

                        {/* Stat bar */}
                        <div className="flex-1 min-w-0">
                          <div className="h-6 sm:h-7 rounded-lg overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                            <div
                              className="h-full rounded-lg"
                              style={{
                                width: `${Math.max(pct, 4)}%`,
                                background: `${stat.color}99`,
                                transition: 'width 0.8s ease-out',
                              }}
                            />
                          </div>
                        </div>

                        {/* Rank badge */}
                        <div className="w-10 shrink-0 text-center">
                          {rank && rank <= 10 ? (
                            <span
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black"
                              style={{
                                background: rank <= 3 ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)',
                                color: rank <= 3 ? '#F59E0B' : pt.textMuted,
                                border: rank <= 3 ? '1px solid rgba(245,158,11,0.25)' : `1px solid ${pt.border}`,
                              }}
                            >
                              #{rank}
                            </span>
                          ) : (
                            <span className="text-xs" style={{ color: pt.textMuted }}>—</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Hit % / Serve % / Games row */}
                <div className="grid grid-cols-3 gap-3 mt-5 pt-5" style={{ borderTop: `1px solid ${pt.border}` }}>
                  {[
                    { label: 'Hit %', value: seasonStats.hit_percentage != null ? `${(seasonStats.hit_percentage * 100).toFixed(1)}%` : '—', color: seasonStats.hit_percentage >= 0.3 ? '#10B981' : seasonStats.hit_percentage >= 0.2 ? '#F59E0B' : '#EF4444' },
                    { label: 'Serve %', value: seasonStats.serve_percentage != null ? `${(seasonStats.serve_percentage * 100).toFixed(1)}%` : '—', color: seasonStats.serve_percentage >= 0.9 ? '#10B981' : seasonStats.serve_percentage >= 0.8 ? '#F59E0B' : '#EF4444' },
                    { label: 'Games', value: gamesPlayed, color: teamColor },
                  ].map(s => (
                    <div key={s.label} className="text-center p-3 rounded-xl" style={cardBg}>
                      <p className="text-xl sm:text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: pt.textMuted }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center">
                <BarChart3 className="w-14 h-14 mx-auto mb-3" style={{ color: pt.textMuted }} />
                <p className="font-bold text-lg" style={{ color: pt.textSecondary }}>Play games to build your stats</p>
                <p className="text-sm mt-1" style={{ color: pt.textMuted }}>Stats will appear after games are played and scored</p>
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════
            SECTION 3: TROPHY CASE
            ══════════════════════════════════════ */}
        <div style={sectionAnim(0.2)}>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-lg font-bold text-white tracking-tight">
              <Trophy className="w-5 h-5 inline mr-2" style={{ color: '#F59E0B' }} />
              Trophy Case
            </h2>
            {badges.length > 0 && (
              <button onClick={() => onNavigate?.('achievements')} className="text-xs font-bold uppercase tracking-wider hover:opacity-80 transition flex items-center gap-1" style={{ color: teamColor }}>
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {badges.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1" style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}>
              {badges.map((b, idx) => {
                const r = rarityConfig[b.achievement?.rarity] || rarityConfig.common

                return (
                  <div
                    key={b.id || idx}
                    className="w-[140px] sm:w-[150px] shrink-0 rounded-2xl overflow-hidden relative cursor-default transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg"
                    style={{
                      height: 200,
                      background: r.bg,
                      border: `1px solid rgba(255,255,255,0.15)`,
                      scrollSnapAlign: 'start',
                    }}
                  >
                    {/* Rarity label */}
                    <div
                      className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider"
                      style={{ background: 'rgba(0,0,0,0.35)', color: 'rgba(255,255,255,0.8)' }}
                    >
                      {r.label}
                    </div>

                    {/* Center icon */}
                    <div className="flex items-center justify-center h-[55%]">
                      <span className="text-5xl drop-shadow-lg">{b.achievement?.icon || '🏆'}</span>
                    </div>

                    {/* Bottom info */}
                    <div className="absolute bottom-0 inset-x-0 p-3" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.6))' }}>
                      <p className="text-white font-bold text-sm tracking-wide leading-tight">
                        {b.achievement?.name || 'Achievement'}
                      </p>
                      {b.earned_at && (
                        <p className="text-white/40 text-[10px] mt-0.5">{new Date(b.earned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Locked placeholder cards */}
              {badges.length < 4 && [1, 2, 3].slice(0, 4 - badges.length).map(i => (
                <div
                  key={`locked-${i}`}
                  className="w-[140px] sm:w-[150px] shrink-0 rounded-2xl overflow-hidden relative cursor-default"
                  style={{
                    height: 200,
                    background: pt.bgCard,
                    border: `1px solid ${pt.border}`,
                  }}
                >
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <Lock className="w-8 h-8" style={{ color: pt.textMuted }} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: pt.textMuted }}>Locked</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl p-10 text-center" style={cardBg}>
              <Trophy className="w-14 h-14 mx-auto mb-3" style={{ color: pt.textMuted }} />
              <p className="font-bold text-lg" style={{ color: pt.textSecondary }}>Start earning trophies</p>
              <p className="text-sm mt-1" style={{ color: pt.textMuted }}>Play games and hit milestones to unlock your trophy case</p>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════
            CONTENT GRID
            ══════════════════════════════════════ */}
        <div className="grid grid-cols-12 gap-6">

          {/* ─── LEFT COLUMN ─── */}
          <div className="col-span-12 lg:col-span-7 space-y-6">

            {/* Upcoming Events */}
            <div style={sectionAnim(0.3)}>
              <div className="rounded-2xl overflow-hidden" style={cardBg}>
                <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${pt.border}` }}>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    <Calendar className="w-5 h-5 inline mr-2" style={{ color: teamColor }} />
                    Upcoming Events
                  </h2>
                  <button onClick={() => onNavigate?.('schedule')} className="text-xs font-bold uppercase tracking-wider hover:opacity-80 transition" style={{ color: teamColor }}>
                    View All
                  </button>
                </div>

                <div className="p-4">
                  {upcomingEvents.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingEvents.slice(0, 4).map(event => {
                        const eventDate = new Date(event.event_date + 'T00:00:00')
                        const isToday = eventDate.toDateString() === new Date().toDateString()
                        const isGame = event.event_type === 'game'
                        const evtColor = event.teams?.color || teamColor
                        const countdown = countdownText(event.event_date)

                        return (
                          <div
                            key={event.id}
                            className="rounded-xl p-4 cursor-pointer transition-all duration-200 hover:bg-white/[0.03]"
                            style={{
                              background: pt.bgCard,
                              border: `1px solid ${isToday ? evtColor + '33' : pt.border}`,
                            }}
                            onClick={() => onNavigate?.('schedule')}
                          >
                            <div className="flex items-center gap-4">
                              {/* Date badge */}
                              <div
                                className="w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0"
                                style={{ background: `${evtColor}15`, border: `1px solid ${evtColor}22` }}
                              >
                                <span className="text-[10px] font-bold uppercase leading-none" style={{ color: pt.textMuted }}>
                                  {eventDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                                </span>
                                <span className="text-xl font-black text-white leading-none">
                                  {eventDate.getDate()}
                                </span>
                              </div>

                              {/* Event info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {isGame ? (
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded text-red-400 bg-red-500/10 border border-red-500/20">
                                      Game
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                                      Practice
                                    </span>
                                  )}
                                  {isToday && (
                                    <span className="flex items-center gap-1">
                                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Today</span>
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm font-bold text-white truncate">
                                  {isGame ? `vs ${event.opponent_name || 'TBD'}` : event.title || 'Team Practice'}
                                </p>
                                <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: pt.textMuted }}>
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

                              {/* Countdown */}
                              <div className="shrink-0 text-right">
                                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: isToday ? '#10B981' : pt.textMuted }}>
                                  {countdown}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="py-10 text-center">
                      <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: pt.textMuted }} />
                      <p className="font-bold text-lg" style={{ color: pt.textSecondary }}>No events scheduled</p>
                      <p className="text-sm mt-1" style={{ color: pt.textMuted }}>Check back soon for upcoming games and practices</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Games */}
            {gameStats.length > 0 && (
              <div style={sectionAnim(0.35)}>
                <div className="rounded-2xl overflow-hidden" style={cardBg}>
                  <div className="px-6 py-4" style={{ borderBottom: `1px solid ${pt.border}` }}>
                    <h2 className="text-lg font-bold text-white tracking-tight">
                      <Clock className="w-5 h-5 inline mr-2" style={{ color: teamColor }} />
                      Recent Games
                    </h2>
                  </div>
                  <div className="p-4 space-y-2">
                    {gameStats.map(gs => {
                      const isWin = gs.event?.game_result === 'win'
                      const isLoss = gs.event?.game_result === 'loss'
                      const gameDate = gs.event?.event_date ? new Date(gs.event.event_date + 'T00:00:00') : new Date(gs.created_at)
                      const resultColor = isWin ? '#10B981' : isLoss ? '#EF4444' : '#6B7280'

                      return (
                        <div
                          key={gs.id}
                          className="flex items-center gap-4 p-3 rounded-xl transition-all duration-200 hover:bg-white/[0.03]"
                          style={cardBg}
                        >
                          <div className="text-center w-11">
                            <p className="text-[10px] font-semibold uppercase" style={{ color: pt.textMuted }}>{gameDate.toLocaleDateString('en-US', { month: 'short' })}</p>
                            <p className="text-lg font-black text-white">{gameDate.getDate()}</p>
                          </div>
                          <div
                            className="w-11 h-11 rounded-lg flex items-center justify-center font-black text-sm"
                            style={{
                              background: `${resultColor}12`,
                              border: `1px solid ${resultColor}25`,
                              color: resultColor,
                            }}
                          >
                            {isWin ? 'W' : isLoss ? 'L' : '—'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-white truncate">
                              {gs.event?.opponent_name ? `vs ${gs.event.opponent_name}` : 'Game'}
                            </p>
                            <p className="text-xs" style={{ color: pt.textMuted }}>
                              {gs.event?.our_score != null ? `${gs.event.our_score}-${gs.event.opponent_score}` : 'Score N/A'}
                            </p>
                          </div>
                          <div className="flex gap-3 text-center">
                            {[
                              { l: 'K', v: gs.kills, c: '#FF3B3B' },
                              { l: 'A', v: gs.aces, c: '#A855F7' },
                              { l: 'D', v: gs.digs, c: '#3B82F6' },
                              { l: 'B', v: gs.blocks, c: '#F59E0B' },
                            ].map(s => (
                              <div key={s.l}>
                                <p className="text-[10px]" style={{ color: pt.textMuted }}>{s.l}</p>
                                <p className="font-bold text-sm" style={{ color: (s.v || 0) > 0 ? s.c : pt.textMuted }}>{s.v || 0}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ─── RIGHT COLUMN ─── */}
          <div className="col-span-12 lg:col-span-5 space-y-6">

            {/* Team Activity */}
            <div style={sectionAnim(0.4)}>
              <div className="rounded-2xl overflow-hidden" style={cardBg}>
                <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: `1px solid ${pt.border}` }}>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    <Activity className="w-4 h-4 inline mr-1.5" style={{ color: teamColor }} />
                    Team Activity
                  </h3>
                </div>

                <div className="p-3">
                  {feedItems.length > 0 ? (
                    <div className="space-y-1">
                      {feedItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-white/[0.03]"
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                            style={{ background: `${item.color}12` }}
                          >
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm leading-tight" style={{ color: 'rgba(255,255,255,0.8)' }}>{item.text}</p>
                            <p className="text-[10px] mt-0.5" style={{ color: pt.textMuted }}>
                              {item.isFuture ? '🔜 ' : ''}{timeAgo(item.time)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center">
                      <Activity className="w-8 h-8 mx-auto mb-2" style={{ color: pt.textMuted }} />
                      <p className="text-sm" style={{ color: pt.textMuted }}>No activity yet</p>
                    </div>
                  )}

                  {primaryTeam && (
                    <button
                      onClick={() => navigateToTeamWall?.(primaryTeam.id)}
                      className="w-full mt-3 py-3 rounded-xl text-sm font-bold text-center transition-all duration-200 uppercase tracking-wider hover:brightness-110"
                      style={{
                        background: `${teamColor}15`,
                        border: `1px solid ${teamColor}25`,
                        color: teamColor,
                      }}
                    >
                      Enter Team Wall <ChevronRight className="w-4 h-4 inline ml-1" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={sectionAnim(0.5)}>
              <div className="grid grid-cols-2 gap-3">
                {[
                  primaryTeam && { icon: Users, label: 'Team Hub', color: teamColor, action: () => navigateToTeamWall?.(primaryTeam.id) },
                  { icon: Trophy, label: 'Leaderboards', color: '#F59E0B', action: () => onNavigate?.('leaderboards') },
                  { icon: Award, label: 'Trophies', color: '#A855F7', action: () => onNavigate?.('achievements') },
                  { icon: BarChart3, label: 'Standings', color: '#3B82F6', action: () => onNavigate?.('standings') },
                ].filter(Boolean).map(btn => (
                  <button
                    key={btn.label}
                    onClick={btn.action}
                    className="rounded-xl p-4 text-center transition-all duration-200 group"
                    style={cardBg}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = `${btn.color}33`
                      e.currentTarget.style.background = `${btn.color}08`
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = pt.border
                      e.currentTarget.style.background = pt.bgCard
                    }}
                  >
                    <btn.icon className="w-6 h-6 mx-auto mb-2 transition-colors" style={{ color: btn.color }} />
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: pt.textSecondary }}>{btn.label}</p>
                  </button>
                ))}
              </div>
            </div>
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
        />
      )}
    </div>
  )
}

export { PlayerDashboard }
