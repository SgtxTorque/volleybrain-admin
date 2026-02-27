import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { Users, X, Eye, Shield } from '../../constants/icons'
import { VolleyballIcon } from '../../constants/icons'

import PlayerProfileSidebar from '../../components/player/PlayerProfileSidebar'
import PlayerCenterFeed from '../../components/player/PlayerCenterFeed'
import PlayerSocialPanel from '../../components/player/PlayerSocialPanel'

// ============================================
// PLAYER THEMES — CSS custom properties
// ============================================
const PLAYER_THEMES = {
  default: {
    '--player-bg': '#0f1117',
    '--player-card': '#1a1d27',
    '--player-card-hover': '#1f2331',
    '--player-accent': '#E8A838',
    '--player-accent-glow': 'rgba(232, 168, 56, 0.3)',
    '--player-border': 'rgba(255,255,255,0.06)',
    '--player-text': '#ffffff',
    '--player-text-secondary': 'rgba(255,255,255,0.60)',
    '--player-text-muted': 'rgba(255,255,255,0.30)',
  },
  pink: {
    '--player-bg': '#120b10',
    '--player-card': '#1f1520',
    '--player-card-hover': '#2a1a2b',
    '--player-accent': '#ec4899',
    '--player-accent-glow': 'rgba(236, 72, 153, 0.3)',
    '--player-border': 'rgba(255,255,255,0.06)',
    '--player-text': '#ffffff',
    '--player-text-secondary': 'rgba(255,255,255,0.60)',
    '--player-text-muted': 'rgba(255,255,255,0.30)',
  },
  ocean: {
    '--player-bg': '#0b1117',
    '--player-card': '#131d27',
    '--player-card-hover': '#182432',
    '--player-accent': '#06b6d4',
    '--player-accent-glow': 'rgba(6, 182, 212, 0.3)',
    '--player-border': 'rgba(255,255,255,0.06)',
    '--player-text': '#ffffff',
    '--player-text-secondary': 'rgba(255,255,255,0.60)',
    '--player-text-muted': 'rgba(255,255,255,0.30)',
  },
  emerald: {
    '--player-bg': '#0b1210',
    '--player-card': '#132720',
    '--player-card-hover': '#183228',
    '--player-accent': '#10b981',
    '--player-accent-glow': 'rgba(16, 185, 129, 0.3)',
    '--player-border': 'rgba(255,255,255,0.06)',
    '--player-text': '#ffffff',
    '--player-text-secondary': 'rgba(255,255,255,0.60)',
    '--player-text-muted': 'rgba(255,255,255,0.30)',
  },
}

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div
        className="w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col rounded-xl"
        style={{ background: 'var(--player-bg)', border: '1px solid var(--player-border)' }}
      >
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--player-border)' }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--player-text)' }}>Select Player</h2>
            <p className="text-sm" style={{ color: 'var(--player-text-muted)' }}>Choose a player to view</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl">
            <X className="w-5 h-5" style={{ color: 'var(--player-text-muted)' }} />
          </button>
        </div>
        <div className="p-4">
          <input
            type="text"
            placeholder="Search by name or jersey #..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'var(--player-card)', border: '1px solid var(--player-border)', color: 'var(--player-text)' }}
          />
        </div>
        <div className="flex-1 overflow-auto px-4 pb-4 space-y-2">
          {filtered.map(player => (
            <button
              key={player.id}
              onClick={() => onSelect(player)}
              className="w-full flex items-center gap-3 p-3 rounded-xl"
              style={{
                background: selectedPlayerId === player.id ? 'var(--player-card-hover)' : 'var(--player-card)',
                border: selectedPlayerId === player.id ? '1px solid var(--player-accent)' : '1px solid transparent',
              }}
            >
              {player.photo_url ? (
                <img src={player.photo_url} className="w-10 h-10 rounded-lg object-cover" style={{ border: '1px solid var(--player-border)' }} alt="" />
              ) : (
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: 'var(--player-card-hover)', color: 'var(--player-text-secondary)' }}>
                  {player.jersey_number || `${player.first_name?.[0]}${player.last_name?.[0]}`}
                </div>
              )}
              <div className="text-left flex-1">
                <p className="font-medium" style={{ color: 'var(--player-text)' }}>{player.first_name} {player.last_name}</p>
                <p className="text-xs" style={{ color: 'var(--player-text-muted)' }}>#{player.jersey_number} · {player.position || 'Player'}</p>
              </div>
              {selectedPlayerId === player.id && (
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'var(--player-accent-glow)' }}>
                  <span className="font-bold text-xs" style={{ color: 'var(--player-accent)' }}>✓</span>
                </div>
              )}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-2" style={{ color: 'var(--player-text-muted)' }} />
              <p style={{ color: 'var(--player-text-muted)' }}>No players found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// MAIN PLAYER DASHBOARD — Thin Shell
// ============================================
function PlayerDashboard({ roleContext, navigateToTeamWall, onNavigate, showToast, onPlayerChange }) {
  const { accent } = useTheme()
  const { user } = useAuth()
  const { selectedSeason } = useSeason()

  // Theme state (persisted in localStorage)
  const [playerTheme, setPlayerTheme] = useState(() => {
    try { return localStorage.getItem('player-theme') || 'default' }
    catch { return 'default' }
  })
  const themeVars = PLAYER_THEMES[playerTheme] || PLAYER_THEMES.default

  // Data state
  const [loading, setLoading] = useState(true)
  const [playerData, setPlayerData] = useState(null)
  const [seasonStats, setSeasonStats] = useState(null)
  const [gameStats, setGameStats] = useState([])
  const [badges, setBadges] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [rankings, setRankings] = useState({})

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
        .select('id, first_name, last_name, jersey_number, photo_url, position, team_players(team_id, teams(id, name, season_id, color))')
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
        const { data: stats } = await supabase.from('player_season_stats').select('*').eq('player_id', player.id).eq('season_id', selectedSeason.id).maybeSingle()
        setSeasonStats(stats)

        const { data: gameData } = await supabase.from('game_player_stats').select('*, event:event_id(*)').eq('player_id', player.id).order('created_at', { ascending: false }).limit(5)
        setGameStats(gameData || [])

        await loadRankings(player.id)
      }

      const teamIds = teamData?.map(tp => tp.team_id).filter(Boolean) || []
      if (teamIds.length > 0) {
        const today = new Date().toISOString().split('T')[0]
        const { data: events } = await supabase.from('schedule_events').select('*, teams(*)').in('team_id', teamIds).gte('event_date', today).order('event_date', { ascending: true }).limit(5)
        setUpcomingEvents(events || [])
      }

      try {
        const { data: badgeData } = await supabase.from('player_achievements').select('*, achievement:achievement_id(id, name, icon, rarity, color_primary)').eq('player_id', player.id).order('earned_at', { ascending: false })
        setBadges(badgeData || [])
      } catch { setBadges([]) }

    } catch (err) { console.error('Error loading player dashboard:', err) }
    setLoading(false)
  }

  async function loadRankings(playerId) {
    if (!selectedSeason?.id) return
    try {
      const { data: allStats } = await supabase.from('player_season_stats').select('player_id, total_kills, total_aces, total_digs, total_blocks, total_assists, total_points').eq('season_id', selectedSeason.id)
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

  function openTeamChat(teamId) { sessionStorage.setItem('openTeamChat', teamId); onNavigate?.('chats') }

  // ── Computed values ──
  const displayName = viewingPlayer ? `${viewingPlayer.first_name} ${viewingPlayer.last_name}` : 'Player'
  const teams = playerData?.teams || []
  const primaryTeam = teams[0]
  const gamesPlayed = seasonStats?.games_played || 0

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

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ ...themeVars, background: 'var(--player-bg)', minHeight: 'calc(100vh - 4rem)' }}>
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-full animate-spin" style={{ border: '3px solid var(--player-border)', borderTopColor: 'var(--player-accent)' }} />
          <p className="mt-4 text-sm tracking-wider uppercase" style={{ color: 'var(--player-text-muted)' }}>Loading player data...</p>
        </div>
      </div>
    )
  }

  if (!viewingPlayer && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center text-center" style={{ ...themeVars, background: 'var(--player-bg)', minHeight: 'calc(100vh - 4rem)' }}>
        <Shield className="w-16 h-16 mb-4" style={{ color: 'var(--player-text-muted)' }} />
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--player-text)' }}>Player Dashboard</h2>
        <p style={{ color: 'var(--player-text-muted)' }}>Player account not linked yet.</p>
        <p className="text-sm mt-1" style={{ color: 'var(--player-text-muted)' }}>Contact your league admin to set up your player profile.</p>
      </div>
    )
  }

  // ── Main Render: 3-Column Dark Layout ──
  return (
    <div style={{ ...themeVars }} className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Admin Preview Banner */}
      {isAdminPreview && (
        <div
          className="fixed top-16 left-0 right-0 z-40 flex items-center gap-3 px-6 py-2"
          style={{ background: 'linear-gradient(90deg, rgba(232,168,56,0.12), rgba(232,168,56,0.04))', borderBottom: '1px solid rgba(232,168,56,0.15)' }}
        >
          <Eye className="w-4 h-4" style={{ color: 'var(--player-accent)' }} />
          <p className="text-xs flex-1" style={{ color: 'var(--player-text-secondary)' }}>
            Viewing as <span className="font-bold" style={{ color: 'var(--player-accent)' }}>{displayName}</span>
          </p>
          <button
            onClick={() => setShowPlayerSelector(true)}
            className="text-xs px-3 py-1 rounded-lg font-medium"
            style={{ background: 'var(--player-accent-glow)', color: 'var(--player-accent)', border: '1px solid var(--player-accent)' }}
          >
            Switch Player
          </button>
        </div>
      )}

      <PlayerProfileSidebar
        viewingPlayer={viewingPlayer}
        displayName={displayName}
        primaryTeam={primaryTeam}
        level={level}
        xp={xp}
        xpProgress={xpProgress}
        xpToNext={xpToNext}
        overallRating={overallRating}
        seasonStats={seasonStats}
        rankings={rankings}
        gamesPlayed={gamesPlayed}
        badges={badges}
        onNavigate={onNavigate}
        navigateToTeamWall={navigateToTeamWall}
      />

      <PlayerCenterFeed
        viewingPlayer={viewingPlayer}
        displayName={displayName}
        primaryTeam={primaryTeam}
        level={level}
        xp={xp}
        xpToNext={xpToNext}
        gamesPlayed={gamesPlayed}
        seasonStats={seasonStats}
        gameStats={gameStats}
        badges={badges}
        upcomingEvents={upcomingEvents}
        overallRating={overallRating}
        onNavigate={onNavigate}
        navigateToTeamWall={navigateToTeamWall}
        userId={user?.id}
        showToast={showToast}
      />

      <PlayerSocialPanel
        viewingPlayer={viewingPlayer}
        primaryTeam={primaryTeam}
        upcomingEvents={upcomingEvents}
        onNavigate={onNavigate}
        navigateToTeamWall={navigateToTeamWall}
        openTeamChat={openTeamChat}
      />

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
