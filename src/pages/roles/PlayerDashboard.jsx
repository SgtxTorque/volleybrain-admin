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
// SCOPED STYLES — VIDEO GAME AESTHETIC
// ============================================
const STYLES = `
/* Force dark cinematic background on entire dashboard */
.vg-dashboard { animation: vgFadeIn 0.6s ease-out; }
@keyframes vgFadeIn { from { opacity:0; } to { opacity:1; } }

/* Hero cinematic area */
.vg-hero {
  position: relative; overflow: hidden;
  background: linear-gradient(180deg, #0a0a0f 0%, #0f1023 50%, #0a0a0f 100%);
}
.vg-hero::before {
  content: '';
  position: absolute; inset: 0;
  background: repeating-linear-gradient(
    0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px
  );
  pointer-events: none;
}

/* Diagonal scan lines overlay */
.vg-scanlines::after {
  content: '';
  position: absolute; inset: 0;
  background: repeating-linear-gradient(
    -45deg, transparent, transparent 3px, rgba(255,255,255,0.008) 3px, rgba(255,255,255,0.008) 6px
  );
  pointer-events: none;
}

/* Player photo dramatic entrance */
.vg-player-photo {
  animation: vgPhotoIn 0.8s ease-out;
}
@keyframes vgPhotoIn {
  from { opacity: 0; transform: scale(0.85) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

/* Neon glow pulse on photo border */
.vg-neon-border {
  animation: vgNeonPulse 3s ease-in-out infinite alternate;
}
@keyframes vgNeonPulse {
  0% { box-shadow: 0 0 15px var(--neon-color), 0 0 30px var(--neon-color), inset 0 0 15px rgba(0,0,0,0.5); }
  100% { box-shadow: 0 0 25px var(--neon-color), 0 0 50px var(--neon-color), 0 0 80px var(--neon-color), inset 0 0 15px rgba(0,0,0,0.5); }
}

/* Level badge glow */
.vg-level-badge {
  animation: vgLevelPulse 2.5s ease-in-out infinite;
}
@keyframes vgLevelPulse {
  0%, 100% { box-shadow: 0 0 15px var(--neon-color), 0 0 30px var(--neon-color); transform: scale(1); }
  50% { box-shadow: 0 0 25px var(--neon-color), 0 0 45px var(--neon-color); transform: scale(1.05); }
}

/* XP bar shimmer */
.vg-xp-bar { position: relative; overflow: hidden; }
.vg-xp-fill { animation: vgXpGrow 1.5s ease-out; }
@keyframes vgXpGrow { from { width: 0%; } }
.vg-xp-bar::after {
  content: '';
  position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%);
  animation: vgXpShimmer 3s ease-in-out infinite 1.5s;
}
@keyframes vgXpShimmer { 0% { left: -100%; } 100% { left: 200%; } }

/* Power bar fill */
.vg-power-fill {
  transform-origin: left;
  animation: vgPowerGrow 1s cubic-bezier(0.23, 1, 0.32, 1) backwards;
}
@keyframes vgPowerGrow { from { transform: scaleX(0); } to { transform: scaleX(1); } }

/* Power bar ambient glow */
.vg-power-glow {
  animation: vgPowerPulse 3s ease-in-out infinite alternate;
}
@keyframes vgPowerPulse {
  from { opacity: 0.5; } to { opacity: 1; }
}

/* Rating diamond shape */
.vg-rating {
  clip-path: polygon(50% 0%, 95% 50%, 50% 100%, 5% 50%);
  animation: vgRatingIn 0.6s ease-out 0.3s backwards;
}
@keyframes vgRatingIn { from { opacity:0; transform: scale(0.5) rotate(-10deg); } to { opacity:1; transform: scale(1) rotate(0); } }

/* Trophy card hover */
.vg-trophy-scroll { scroll-snap-type: x mandatory; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
.vg-trophy-scroll::-webkit-scrollbar { display: none; }
.vg-trophy-card {
  scroll-snap-align: start;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.vg-trophy-card:hover {
  transform: translateY(-8px) scale(1.04);
  z-index: 10;
}

/* Locked trophy */
.vg-locked { filter: grayscale(1) brightness(0.3); }
.vg-locked:hover { filter: grayscale(0.8) brightness(0.4); }

/* Battle card */
.vg-battle {
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}
.vg-battle:hover { transform: translateX(4px); }

/* Live pulse */
.vg-live { animation: vgLive 1.5s ease-in-out infinite; }
@keyframes vgLive { 0%,100% { opacity:1; box-shadow: 0 0 6px currentColor; } 50% { opacity:0.3; box-shadow: 0 0 2px currentColor; } }

/* Feed item slide in */
.vg-feed-item { animation: vgFeedIn 0.4s ease-out backwards; }
@keyframes vgFeedIn { from { opacity:0; transform: translateX(12px); } to { opacity:1; transform: translateX(0); } }

/* Section reveal */
.vg-section { animation: vgSectionIn 0.5s ease-out backwards; }
@keyframes vgSectionIn { from { opacity:0; transform: translateY(20px); } to { opacity:1; transform: translateY(0); } }

/* Hexagonal games badge */
.vg-hex {
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
}
`

// ============================================
// STAT CONFIGS (with neon colors)
// ============================================
const STAT_DEFS = [
  { key: 'kills', label: 'KILLS', field: 'total_kills', color: '#FF3B3B', glowColor: 'rgba(255,59,59,0.5)', icon: Zap },
  { key: 'aces', label: 'ACES', field: 'total_aces', color: '#A855F7', glowColor: 'rgba(168,85,247,0.5)', icon: Target },
  { key: 'digs', label: 'DIGS', field: 'total_digs', color: '#3B82F6', glowColor: 'rgba(59,130,246,0.5)', icon: Shield },
  { key: 'blocks', label: 'BLOCKS', field: 'total_blocks', color: '#F59E0B', glowColor: 'rgba(245,158,11,0.5)', icon: Shield },
  { key: 'assists', label: 'ASSISTS', field: 'total_assists', color: '#10B981', glowColor: 'rgba(16,185,129,0.5)', icon: Users },
  { key: 'points', label: 'POINTS', field: 'total_points', color: '#EC4899', glowColor: 'rgba(236,72,153,0.5)', icon: Trophy },
]

// ============================================
// ADMIN PLAYER SELECTOR
// ============================================
function AdminPlayerSelector({ players, selectedPlayerId, onSelect, onClose }) {
  const [search, setSearch] = useState('')
  const filtered = players.filter(p =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    p.jersey_number?.toString().includes(search)
  )

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col rounded-2xl bg-[#0f1023] border border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.8)]">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">SELECT OPERATOR</h2>
            <p className="text-sm text-white/40">Choose a player to view</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition">
            <X className="w-5 h-5 text-white/50" />
          </button>
        </div>
        <div className="p-4">
          <input
            type="text"
            placeholder="Search by name or jersey #..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none transition focus:border-[var(--accent-primary)] focus:shadow-[0_0_15px_rgba(99,102,241,0.2)]"
          />
        </div>
        <div className="flex-1 overflow-auto px-4 pb-4 space-y-2">
          {filtered.map(player => (
            <button
              key={player.id}
              onClick={() => onSelect(player)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition ${
                selectedPlayerId === player.id
                  ? 'bg-[var(--accent-primary)]/20 ring-2 ring-[var(--accent-primary)] shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                  : 'bg-white/[0.03] hover:bg-white/[0.08] border border-transparent hover:border-white/10'
              }`}
            >
              {player.photo_url ? (
                <img src={player.photo_url} className="w-10 h-10 rounded-lg object-cover border border-white/10" alt="" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)]/20 flex items-center justify-center text-sm font-bold text-[var(--accent-primary)]">
                  {player.jersey_number || `${player.first_name?.[0]}${player.last_name?.[0]}`}
                </div>
              )}
              <div className="text-left flex-1">
                <p className="font-medium text-white">{player.first_name} {player.last_name}</p>
                <p className="text-xs text-white/40">#{player.jersey_number} · {player.position || 'Player'}</p>
              </div>
              {selectedPlayerId === player.id && (
                <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)] flex items-center justify-center shadow-[0_0_10px_var(--accent-primary)]">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              )}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-white/20 mb-2" />
              <p className="text-white/40">No players found</p>
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

  // Animation trigger
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMounted(true), 100); return () => clearTimeout(t) }, [])

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

  // XP & Level (updated formula)
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
    // Weighted formula normalized to ~40-99
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

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" style={{ background: '#0a0a0f' }}>
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-full animate-spin" style={{ border: `3px solid ${teamColor}22`, borderTopColor: teamColor, boxShadow: `0 0 20px ${teamColor}44` }} />
          <p className="mt-4 text-white/40 text-sm tracking-wider uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Loading operator data...</p>
        </div>
      </div>
    )
  }

  if (!viewingPlayer && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center" style={{ background: '#0a0a0f' }}>
        <VolleyballIcon className="w-16 h-16 text-white/20 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Player Dashboard</h2>
        <p className="text-white/40">Player account not linked yet.</p>
        <p className="text-sm text-white/30 mt-1">Contact your league admin to set up your player profile.</p>
      </div>
    )
  }

  const gamesPlayed = seasonStats?.games_played || 0

  // ════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════
  return (
    <div className="vg-dashboard" style={{ background: '#0a0a0f', minHeight: '100vh', margin: '-1.5rem', padding: '0' }}>
      <style>{STYLES}</style>

      {/* Admin Preview Banner */}
      {isAdminPreview && (
        <div style={{ padding: '12px 24px', background: 'linear-gradient(90deg, rgba(245,158,11,0.1), rgba(245,158,11,0.05))', borderBottom: '1px solid rgba(245,158,11,0.2)' }}
          className="flex items-center gap-3">
          <Eye className="w-5 h-5 text-amber-500" />
          <p className="text-sm flex-1 text-amber-400/80">
            Viewing as <span className="font-bold text-amber-400">{displayName}</span> (Admin Preview)
          </p>
          <button
            onClick={() => setShowPlayerSelector(true)}
            className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition font-medium border border-amber-500/20"
          >
            Switch Player
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════
          SECTION 1: CINEMATIC HERO AREA
          ══════════════════════════════════════ */}
      <div className="vg-hero vg-scanlines" style={{ padding: '2rem 1.5rem 2.5rem', position: 'relative' }}>
        {/* Ambient color glow in corners */}
        <div className="absolute top-0 left-0 w-72 h-72 rounded-full opacity-20 blur-[100px] pointer-events-none" style={{ background: teamColor }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-10 blur-[120px] pointer-events-none" style={{ background: teamColor }} />

        {/* Admin switch button */}
        {isAdmin && (
          <button
            onClick={() => setShowPlayerSelector(true)}
            className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-xl bg-white/5 backdrop-blur-md text-white/60 text-xs hover:bg-white/10 hover:text-white/80 transition flex items-center gap-1.5 border border-white/10"
          >
            <Eye className="w-3.5 h-3.5" /> Switch
          </button>
        )}

        {/* Main hero layout */}
        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-6 lg:gap-10 max-w-5xl mx-auto">

          {/* LEFT: Player Photo — DRAMATIC & LARGE */}
          <div className="relative shrink-0">
            {/* Photo container */}
            <div
              className="vg-player-photo vg-neon-border relative overflow-hidden"
              style={{
                '--neon-color': `${teamColor}88`,
                width: 260, height: 300,
                borderRadius: '1.25rem',
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
                  {/* Dramatic gradient overlay on photo */}
                  <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.8) 100%)` }} />
                </>
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: `linear-gradient(180deg, ${teamColor}33 0%, #0a0a0f 100%)` }}
                >
                  <span className="text-[7rem] font-black text-white/20 select-none" style={{ fontFamily: 'Bebas Neue, sans-serif', textShadow: `0 0 40px ${teamColor}44` }}>
                    {viewingPlayer?.first_name?.[0]}{viewingPlayer?.last_name?.[0]}
                  </span>
                </div>
              )}

              {/* Jersey number overlay */}
              {viewingPlayer?.jersey_number && (
                <div className="absolute bottom-3 left-3">
                  <span className="text-5xl font-black text-white/30" style={{ fontFamily: 'Bebas Neue, sans-serif', textShadow: `0 0 20px ${teamColor}44` }}>
                    #{viewingPlayer.jersey_number}
                  </span>
                </div>
              )}
            </div>

            {/* Overall Rating Diamond — positioned overlapping photo */}
            {overallRating > 0 && (
              <div className="absolute -bottom-5 -right-5 z-20">
                <div
                  className="vg-rating flex items-center justify-center"
                  style={{
                    width: 72, height: 72,
                    background: `linear-gradient(135deg, ${teamColor}, ${teamColor}CC)`,
                    boxShadow: `0 0 25px ${teamColor}66`,
                  }}
                >
                  <span className="text-white font-black text-2xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                    {overallRating}
                  </span>
                </div>
              </div>
            )}

            {/* Level Badge — top-left corner */}
            <div
              className="vg-level-badge absolute -top-3 -left-3 z-20 w-14 h-14 rounded-full flex flex-col items-center justify-center"
              style={{
                '--neon-color': `${teamColor}66`,
                background: `linear-gradient(135deg, #1a1a2e, #0f0f1a)`,
                border: `2px solid ${teamColor}`,
              }}
            >
              <span className="text-[10px] text-white/50 font-bold uppercase leading-none" style={{ fontFamily: 'Rajdhani, sans-serif' }}>LVL</span>
              <span className="text-lg font-black text-white leading-none" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>{level}</span>
            </div>
          </div>

          {/* RIGHT: Player Info & XP */}
          <div className="flex-1 text-center lg:text-left min-w-0 space-y-4">
            {/* Player Name — MASSIVE */}
            <div>
              <h1
                className="text-5xl sm:text-6xl lg:text-7xl font-black uppercase text-white leading-none tracking-tight"
                style={{
                  fontFamily: 'Bebas Neue, sans-serif',
                  textShadow: `0 0 40px ${teamColor}33, 0 2px 10px rgba(0,0,0,0.5)`,
                  letterSpacing: '0.02em',
                }}
              >
                {displayName}
              </h1>

              {/* Badges row */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mt-3">
                {primaryTeam && (
                  <span
                    className="px-3 py-1 rounded-lg text-xs font-bold text-white uppercase tracking-wider"
                    style={{
                      background: `linear-gradient(135deg, ${teamColor}, ${teamColor}88)`,
                      boxShadow: `0 0 15px ${teamColor}44`,
                      fontFamily: 'Rajdhani, sans-serif',
                    }}
                  >
                    {primaryTeam.name}
                  </span>
                )}
                {viewingPlayer?.position && (
                  <span
                    className="px-3 py-1 rounded-lg text-xs font-bold text-white/70 uppercase tracking-wider border border-white/10"
                    style={{ background: 'rgba(255,255,255,0.05)', fontFamily: 'Rajdhani, sans-serif' }}
                  >
                    {viewingPlayer.position}
                  </span>
                )}
                {viewingPlayer?.jersey_number && (
                  <span
                    className="px-3 py-1 rounded-lg text-xs font-bold text-white/70 uppercase tracking-wider border border-white/10"
                    style={{ background: 'rgba(255,255,255,0.05)', fontFamily: 'Rajdhani, sans-serif' }}
                  >
                    #{viewingPlayer.jersey_number}
                  </span>
                )}
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className="max-w-lg mx-auto lg:mx-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white/50 uppercase tracking-widest" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  <Sparkles className="w-3.5 h-3.5 inline mr-1" style={{ color: teamColor }} />
                  LEVEL {level} · {xp.toLocaleString()} XP
                </span>
                <span className="text-xs text-white/30">{xpToNext} XP to Level {level + 1}</span>
              </div>
              <div className="vg-xp-bar h-4 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div
                  className="vg-xp-fill h-full rounded-full relative"
                  style={{
                    width: `${Math.max(xpProgress, 3)}%`,
                    background: `linear-gradient(90deg, ${teamColor}, ${teamColor}CC, #fff3)`,
                    boxShadow: `0 0 15px ${teamColor}88, 0 0 30px ${teamColor}44`,
                  }}
                />
              </div>
            </div>

            {/* Quick stat badges row */}
            <div className="flex items-center justify-center lg:justify-start gap-4 mt-2">
              {/* Games Played hex */}
              <div className="text-center">
                <div
                  className="vg-hex w-16 h-16 flex items-center justify-center mx-auto"
                  style={{ background: `linear-gradient(180deg, ${teamColor}44, ${teamColor}11)`, border: `1px solid ${teamColor}33` }}
                >
                  <span className="text-white font-black text-xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>{gamesPlayed}</span>
                </div>
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-1 block" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Games</span>
              </div>
              {/* Achievements count */}
              <div className="text-center">
                <div
                  className="vg-hex w-16 h-16 flex items-center justify-center mx-auto"
                  style={{ background: 'linear-gradient(180deg, rgba(245,158,11,0.25), rgba(245,158,11,0.05))', border: '1px solid rgba(245,158,11,0.2)' }}
                >
                  <span className="text-white font-black text-xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>{badges.length}</span>
                </div>
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-1 block" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Trophies</span>
              </div>
              {/* Win streak or total points */}
              <div className="text-center">
                <div
                  className="vg-hex w-16 h-16 flex items-center justify-center mx-auto"
                  style={{ background: 'linear-gradient(180deg, rgba(16,185,129,0.25), rgba(16,185,129,0.05))', border: '1px solid rgba(16,185,129,0.2)' }}
                >
                  <span className="text-white font-black text-xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>{seasonStats?.total_points || 0}</span>
                </div>
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-1 block" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Points</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content area below hero */}
      <div style={{ padding: '1.5rem' }}>

        {/* ══════════════════════════════════════
            SECTION 2: STAT HUD — POWER BARS
            ══════════════════════════════════════ */}
        <div className="vg-section" style={{ animationDelay: '0.1s' }}>
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(15,16,35,0.95), rgba(10,10,15,0.98))',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: `0 0 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)`,
            }}
          >
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 className="text-xl font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                <Activity className="w-5 h-5 inline mr-2" style={{ color: teamColor, filter: `drop-shadow(0 0 6px ${teamColor})` }} />
                Stat HUD
              </h2>
              {selectedSeason && (
                <span className="text-[10px] text-white/30 font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border border-white/5 bg-white/[0.03]" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
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
                    <div key={stat.key} className="group">
                      <div className="flex items-center gap-3 sm:gap-4">
                        {/* Icon */}
                        <div
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `${stat.color}15`, boxShadow: `0 0 10px ${stat.color}11` }}
                        >
                          <StatIcon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: stat.color, filter: `drop-shadow(0 0 4px ${stat.color})` }} />
                        </div>

                        {/* Label + per-game */}
                        <div className="w-16 sm:w-20 shrink-0">
                          <span className="text-[10px] sm:text-xs font-bold text-white/50 uppercase tracking-widest block" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                            {stat.label}
                          </span>
                          <span className="text-[9px] text-white/25">{perGame}/game</span>
                        </div>

                        {/* Large number */}
                        <div className="w-12 sm:w-14 shrink-0 text-right">
                          <span className="text-xl sm:text-2xl font-black text-white" style={{ fontFamily: 'Bebas Neue, sans-serif', textShadow: `0 0 10px ${stat.color}44` }}>
                            {value}
                          </span>
                        </div>

                        {/* Power bar */}
                        <div className="flex-1 min-w-0 relative">
                          <div className="h-6 sm:h-7 rounded-lg overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.04)' }}>
                            <div
                              className="vg-power-fill h-full rounded-lg vg-power-glow"
                              style={{
                                width: `${Math.max(pct, 4)}%`,
                                background: `linear-gradient(90deg, ${stat.color}CC, ${stat.color})`,
                                animationDelay: `${idx * 0.12}s`,
                                boxShadow: `0 0 12px ${stat.glowColor}, inset 0 1px 0 rgba(255,255,255,0.15)`,
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
                                background: rank <= 3 ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                                color: rank <= 3 ? '#F59E0B' : 'rgba(255,255,255,0.3)',
                                border: rank <= 3 ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.05)',
                                boxShadow: rank <= 3 ? '0 0 10px rgba(245,158,11,0.15)' : 'none',
                              }}
                            >
                              #{rank}
                            </span>
                          ) : (
                            <span className="text-xs text-white/15">—</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Hit % / Serve % / Games row */}
                <div className="grid grid-cols-3 gap-3 mt-5 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  {[
                    { label: 'HIT %', value: seasonStats.hit_percentage != null ? `${(seasonStats.hit_percentage * 100).toFixed(1)}%` : '—', color: seasonStats.hit_percentage >= 0.3 ? '#10B981' : seasonStats.hit_percentage >= 0.2 ? '#F59E0B' : '#EF4444' },
                    { label: 'SERVE %', value: seasonStats.serve_percentage != null ? `${(seasonStats.serve_percentage * 100).toFixed(1)}%` : '—', color: seasonStats.serve_percentage >= 0.9 ? '#10B981' : seasonStats.serve_percentage >= 0.8 ? '#F59E0B' : '#EF4444' },
                    { label: 'GAMES', value: gamesPlayed, color: teamColor },
                  ].map(s => (
                    <div
                      key={s.label}
                      className="text-center p-3 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <p className="text-xl sm:text-2xl font-black" style={{ color: s.color, fontFamily: 'Bebas Neue, sans-serif', textShadow: `0 0 10px ${s.color}33` }}>{s.value}</p>
                      <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center">
                <BarChart3 className="w-14 h-14 mx-auto text-white/10 mb-3" />
                <p className="font-bold text-white/40 text-lg" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>PLAY GAMES TO POWER UP YOUR STATS</p>
                <p className="text-sm text-white/20 mt-1">Stats will appear after games are played and scored</p>
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════
            SECTION 3: TROPHY CASE
            ══════════════════════════════════════ */}
        <div className="vg-section mt-6" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-xl font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              <Trophy className="w-5 h-5 inline mr-2" style={{ color: '#F59E0B', filter: 'drop-shadow(0 0 8px rgba(245,158,11,0.5))' }} />
              Trophy Case
            </h2>
            {badges.length > 0 && (
              <button onClick={() => onNavigate?.('achievements')} className="text-xs font-bold uppercase tracking-wider hover:opacity-80 transition flex items-center gap-1" style={{ color: teamColor }}>
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {badges.length > 0 ? (
            <div className="vg-trophy-scroll flex gap-3 overflow-x-auto pb-3 -mx-1 px-1">
              {badges.map((b, idx) => {
                const rarityColors = {
                  legendary: { bg: 'linear-gradient(135deg, #F59E0B, #D97706, #92400E)', glow: 'rgba(245,158,11,0.4)', label: 'LEGENDARY' },
                  epic: { bg: 'linear-gradient(135deg, #A855F7, #7C3AED, #5B21B6)', glow: 'rgba(168,85,247,0.4)', label: 'EPIC' },
                  rare: { bg: 'linear-gradient(135deg, #3B82F6, #2563EB, #1D4ED8)', glow: 'rgba(59,130,246,0.4)', label: 'RARE' },
                  common: { bg: 'linear-gradient(135deg, #6B7280, #4B5563, #374151)', glow: 'rgba(107,114,128,0.3)', label: 'COMMON' },
                }
                const r = rarityColors[b.achievement?.rarity] || rarityColors.common
                const cardColor = b.achievement?.color_primary || '#6B7280'

                return (
                  <div
                    key={b.id || idx}
                    className="vg-trophy-card w-[140px] sm:w-[150px] shrink-0 rounded-2xl overflow-hidden relative cursor-default"
                    style={{
                      height: 200,
                      background: r.bg,
                      border: `1px solid ${cardColor}44`,
                      boxShadow: `0 0 20px ${r.glow}`,
                    }}
                  >
                    {/* Rarity label */}
                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest"
                      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', color: 'rgba(255,255,255,0.8)' }}>
                      {r.label}
                    </div>

                    {/* Center icon */}
                    <div className="flex items-center justify-center h-[55%]">
                      <span className="text-5xl drop-shadow-lg" style={{ filter: `drop-shadow(0 0 12px ${r.glow})` }}>{b.achievement?.icon || '🏆'}</span>
                    </div>

                    {/* Bottom info */}
                    <div className="absolute bottom-0 inset-x-0 p-3" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}>
                      <p className="text-white font-black text-sm tracking-wide uppercase leading-tight" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
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
                  className="vg-trophy-card vg-locked w-[140px] sm:w-[150px] shrink-0 rounded-2xl overflow-hidden relative cursor-default"
                  style={{
                    height: 200,
                    background: 'linear-gradient(135deg, #1a1a2e, #0f0f1a)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <Lock className="w-8 h-8 text-white/10" />
                    <span className="text-[10px] text-white/15 font-bold uppercase tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Locked</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="rounded-2xl p-10 text-center"
              style={{ background: 'linear-gradient(180deg, rgba(15,16,35,0.8), rgba(10,10,15,0.9))', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <Trophy className="w-14 h-14 mx-auto text-white/10 mb-3" />
              <p className="font-bold text-white/40 text-lg" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>START EARNING TROPHIES</p>
              <p className="text-sm text-white/20 mt-1">Play games and hit milestones to unlock your trophy case</p>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════
            GRID: BATTLES + SQUAD COMMS
            ══════════════════════════════════════ */}
        <div className="grid grid-cols-12 gap-6 mt-6">

          {/* ─── LEFT: UPCOMING BATTLES ─── */}
          <div className="col-span-12 lg:col-span-7 space-y-6">

            {/* Section 4: Upcoming Battles */}
            <div className="vg-section" style={{ animationDelay: '0.3s' }}>
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: 'linear-gradient(180deg, rgba(15,16,35,0.95), rgba(10,10,15,0.98))',
                  border: `1px solid ${teamColor}22`,
                  boxShadow: `0 0 30px rgba(0,0,0,0.4), 0 0 60px ${teamColor}08`,
                }}
              >
                <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${teamColor}15` }}>
                  <h2 className="text-xl font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                    <Swords className="w-5 h-5 inline mr-2" style={{ color: teamColor, filter: `drop-shadow(0 0 6px ${teamColor})` }} />
                    Upcoming Battles
                  </h2>
                  <button onClick={() => onNavigate?.('schedule')} className="text-[10px] font-bold uppercase tracking-wider hover:opacity-80 transition" style={{ color: teamColor, fontFamily: 'Rajdhani, sans-serif' }}>
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
                            className="vg-battle rounded-xl p-4 cursor-pointer"
                            style={{
                              background: 'rgba(255,255,255,0.02)',
                              border: `1px solid ${isToday ? evtColor + '44' : 'rgba(255,255,255,0.05)'}`,
                              boxShadow: isToday ? `0 0 20px ${evtColor}15, inset 0 0 20px ${evtColor}05` : 'none',
                            }}
                            onClick={() => onNavigate?.('schedule')}
                          >
                            <div className="flex items-center gap-4">
                              {/* Date badge */}
                              <div
                                className="w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0"
                                style={{
                                  background: `linear-gradient(180deg, ${evtColor}33, ${evtColor}11)`,
                                  border: `1px solid ${evtColor}33`,
                                  boxShadow: isToday ? `0 0 15px ${evtColor}33` : 'none',
                                }}
                              >
                                <span className="text-[10px] font-bold text-white/50 uppercase leading-none" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                                  {eventDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                                </span>
                                <span className="text-xl font-black text-white leading-none" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                                  {eventDate.getDate()}
                                </span>
                              </div>

                              {/* Event info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {isGame ? (
                                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded text-red-400 bg-red-500/10 border border-red-500/20" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                                      VS GAME
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded text-blue-400 bg-blue-500/10 border border-blue-500/20" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                                      PRACTICE
                                    </span>
                                  )}
                                  {isToday && (
                                    <span className="flex items-center gap-1">
                                      <span className="vg-live w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">TODAY</span>
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm font-bold text-white truncate">
                                  {isGame ? `vs ${event.opponent_name || 'TBD'}` : event.title || 'Team Practice'}
                                </p>
                                <div className="flex items-center gap-3 mt-1 text-xs text-white/30">
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
                                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: isToday ? '#10B981' : 'rgba(255,255,255,0.25)', fontFamily: 'Rajdhani, sans-serif' }}>
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
                      <Swords className="w-12 h-12 mx-auto text-white/10 mb-3" />
                      <p className="font-bold text-white/30 text-lg" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>NO BATTLES SCHEDULED</p>
                      <p className="text-sm text-white/15 mt-1">Check back soon for upcoming games and practices</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Game Results */}
            {gameStats.length > 0 && (
              <div className="vg-section" style={{ animationDelay: '0.35s' }}>
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: 'linear-gradient(180deg, rgba(15,16,35,0.95), rgba(10,10,15,0.98))',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <h2 className="text-xl font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                      <Clock className="w-5 h-5 inline mr-2" style={{ color: teamColor, filter: `drop-shadow(0 0 6px ${teamColor})` }} />
                      Battle Log
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
                          className="flex items-center gap-4 p-3 rounded-xl transition hover:bg-white/[0.03]"
                          style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.03)' }}
                        >
                          <div className="text-center w-11">
                            <p className="text-[10px] font-semibold text-white/30 uppercase">{gameDate.toLocaleDateString('en-US', { month: 'short' })}</p>
                            <p className="text-lg font-black text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>{gameDate.getDate()}</p>
                          </div>
                          <div
                            className="w-11 h-11 rounded-lg flex items-center justify-center font-black text-sm"
                            style={{
                              background: `${resultColor}15`,
                              border: `1px solid ${resultColor}33`,
                              color: resultColor,
                              boxShadow: `0 0 10px ${resultColor}22`,
                            }}
                          >
                            {isWin ? 'W' : isLoss ? 'L' : '—'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-white truncate">
                              {gs.event?.opponent_name ? `vs ${gs.event.opponent_name}` : 'Game'}
                            </p>
                            <p className="text-xs text-white/30">
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
                                <p className="text-[10px] text-white/20">{s.l}</p>
                                <p className="font-bold text-sm" style={{ color: (s.v || 0) > 0 ? s.c : 'rgba(255,255,255,0.15)' }}>{s.v || 0}</p>
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

          {/* ─── RIGHT SIDEBAR ─── */}
          <div className="col-span-12 lg:col-span-5 space-y-6">

            {/* Section 5: SQUAD COMMS */}
            <div className="vg-section" style={{ animationDelay: '0.4s' }}>
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: 'linear-gradient(180deg, rgba(15,16,35,0.95), rgba(10,10,15,0.98))',
                  border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: `0 0 40px ${teamColor}05`,
                }}
              >
                <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    <Zap className="w-4 h-4 inline mr-1.5" style={{ color: teamColor, filter: `drop-shadow(0 0 4px ${teamColor})` }} />
                    Squad Comms
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="vg-live w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Live</span>
                  </div>
                </div>

                <div className="p-3">
                  {feedItems.length > 0 ? (
                    <div className="space-y-1">
                      {feedItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="vg-feed-item flex items-start gap-3 px-3 py-2.5 rounded-xl transition hover:bg-white/[0.03]"
                          style={{ animationDelay: `${idx * 0.06}s` }}
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                            style={{ background: `${item.color}15`, boxShadow: `0 0 8px ${item.color}11` }}
                          >
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white/80 leading-tight">{item.text}</p>
                            <p className="text-[10px] text-white/25 mt-0.5">
                              {item.isFuture ? '🔜 ' : ''}{timeAgo(item.time)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center">
                      <Activity className="w-8 h-8 mx-auto text-white/10 mb-2" />
                      <p className="text-sm text-white/25">No comms yet</p>
                    </div>
                  )}

                  {primaryTeam && (
                    <button
                      onClick={() => navigateToTeamWall?.(primaryTeam.id)}
                      className="w-full mt-3 py-3 rounded-xl text-sm font-bold text-center transition uppercase tracking-wider"
                      style={{
                        background: `linear-gradient(135deg, ${teamColor}22, ${teamColor}11)`,
                        border: `1px solid ${teamColor}33`,
                        color: teamColor,
                        fontFamily: 'Rajdhani, sans-serif',
                        boxShadow: `0 0 15px ${teamColor}11`,
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.boxShadow = `0 0 25px ${teamColor}33`
                        e.currentTarget.style.background = `linear-gradient(135deg, ${teamColor}33, ${teamColor}22)`
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.boxShadow = `0 0 15px ${teamColor}11`
                        e.currentTarget.style.background = `linear-gradient(135deg, ${teamColor}22, ${teamColor}11)`
                      }}
                    >
                      Enter Team Wall <ChevronRight className="w-4 h-4 inline ml-1" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions — Game-style buttons */}
            <div className="vg-section" style={{ animationDelay: '0.5s' }}>
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
                    className="rounded-xl p-4 text-center transition group"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = `${btn.color}11`
                      e.currentTarget.style.borderColor = `${btn.color}33`
                      e.currentTarget.style.boxShadow = `0 0 20px ${btn.color}15`
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <btn.icon className="w-6 h-6 mx-auto mb-2 transition" style={{ color: btn.color, filter: `drop-shadow(0 0 4px ${btn.color}44)` }} />
                    <p className="text-xs font-bold text-white/50 uppercase tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{btn.label}</p>
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
