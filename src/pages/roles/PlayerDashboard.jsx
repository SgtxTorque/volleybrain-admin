// =============================================================================
// PlayerDashboard — Dark theme widget grid, always bg-lynx-navy
// Preserves all Supabase data loading + admin preview from original
// =============================================================================

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { supabase } from '../../lib/supabase'
import { Users, X, Eye, Shield, ChevronRight, MapPin, Clock } from '../../constants/icons'
import DashboardContainer from '../../components/layout/DashboardContainer'
import DashboardGridLayout from '../../components/layout/DashboardGrid'
import EditLayoutButton from '../../components/layout/EditLayoutButton'

function formatTime12(t) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hr = parseInt(h)
  return (hr % 12 || 12) + ':' + m + ' ' + (hr >= 12 ? 'PM' : 'AM')
}

function countdownText(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diff = Math.ceil((d - today) / 86400000)
  if (diff <= 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return `In ${diff} days`
}

// ── Admin Player Selector (unchanged) ──
function AdminPlayerSelector({ players, selectedPlayerId, onSelect, onClose }) {
  const [search, setSearch] = useState('')
  const filtered = players.filter(p =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    p.jersey_number?.toString().includes(search)
  )
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col rounded-xl" style={{ background: '#0D1B3E', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h2 className="text-lg font-bold text-white">Select Player</h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.30)' }}>Choose a player to view</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl"><X className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.30)' }} /></button>
        </div>
        <div className="p-4">
          <input type="text" placeholder="Search by name or jersey #..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: '#10284C', border: '1px solid rgba(255,255,255,0.06)', color: '#fff' }} />
        </div>
        <div className="flex-1 overflow-auto px-4 pb-4 space-y-2">
          {filtered.map(player => (
            <button key={player.id} onClick={() => onSelect(player)}
              className="w-full flex items-center gap-3 p-3 rounded-xl"
              style={{ background: selectedPlayerId === player.id ? '#162848' : '#10284C', border: selectedPlayerId === player.id ? '1px solid #4BB9EC' : '1px solid transparent' }}>
              {player.photo_url
                ? <img src={player.photo_url} className="w-10 h-10 rounded-lg object-cover" alt="" />
                : <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: '#162848', color: 'rgba(255,255,255,0.60)' }}>{player.jersey_number || `${player.first_name?.[0]}${player.last_name?.[0]}`}</div>
              }
              <div className="text-left flex-1">
                <p className="font-medium text-white">{player.first_name} {player.last_name}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.30)' }}>#{player.jersey_number} · {player.position || 'Player'}</p>
              </div>
              {selectedPlayerId === player.id && <span className="text-xs font-bold" style={{ color: '#4BB9EC' }}>✓</span>}
            </button>
          ))}
          {filtered.length === 0 && <div className="text-center py-8"><Users className="w-12 h-12 mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.15)' }} /><p style={{ color: 'rgba(255,255,255,0.15)' }}>No players found</p></div>}
        </div>
      </div>
    </div>
  )
}

// ── MAIN ──
function PlayerDashboard({ roleContext, navigateToTeamWall, onNavigate, showToast, onPlayerChange }) {
  const { user } = useAuth()
  const { selectedSeason } = useSeason()

  const [loading, setLoading] = useState(true)
  const [playerData, setPlayerData] = useState(null)
  const [seasonStats, setSeasonStats] = useState(null)
  const [gameStats, setGameStats] = useState([])
  const [badges, setBadges] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [rankings, setRankings] = useState({})
  const [skillRatings, setSkillRatings] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [selectedTeamIdx, setSelectedTeamIdx] = useState(0)

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
      const { data } = await supabase.from('players')
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
    setPreviewPlayer(player); setIsAdminPreview(true); setShowPlayerSelector(false); onPlayerChange?.(player)
  }

  async function loadPlayerDashboard(player) {
    setLoading(true)
    try {
      const { data: teamData } = await supabase.from('team_players').select('*, teams(*)').eq('player_id', player.id)
      setPlayerData({ ...player, teams: teamData?.map(tp => tp.teams).filter(Boolean) || [] })

      if (selectedSeason?.id) {
        const { data: stats } = await supabase.from('player_season_stats').select('*').eq('player_id', player.id).eq('season_id', selectedSeason.id).maybeSingle()
        setSeasonStats(stats)
        const { data: gameData } = await supabase.from('game_player_stats').select('*, event:event_id(*)').eq('player_id', player.id).order('created_at', { ascending: false }).limit(5)
        setGameStats(gameData || [])
        await loadRankings(player.id)

        // Load coach-evaluated skill ratings (mobile parity: player_skill_ratings table)
        try {
          const { data: ratings } = await supabase.from('player_skill_ratings').select('*').eq('player_id', player.id).eq('season_id', selectedSeason.id).order('rated_at', { ascending: false }).limit(1).maybeSingle()
          setSkillRatings(ratings)
        } catch { setSkillRatings(null) }
      }

      const teamIds = teamData?.map(tp => tp.team_id).filter(Boolean) || []
      if (teamIds.length > 0) {
        const today = new Date().toISOString().split('T')[0]
        const { data: events } = await supabase.from('schedule_events').select('*, teams(*)').in('team_id', teamIds).gte('event_date', today).order('event_date', { ascending: true }).limit(5)
        setUpcomingEvents(events || [])
      }

      try {
        const { data: badgeData } = await supabase.from('player_achievements').select('id, earned_at, achievement:achievement_id(id, name, icon, rarity, color_primary, description)').eq('player_id', player.id).order('earned_at', { ascending: false })
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

  // ── Computed ──
  const displayName = viewingPlayer ? `${viewingPlayer.first_name} ${viewingPlayer.last_name}` : 'Player'
  const teams = playerData?.teams || []
  const primaryTeam = teams[selectedTeamIdx] || teams[0]
  const gamesPlayed = seasonStats?.games_played || 0
  const streak = gamesPlayed > 0 ? Math.min(gamesPlayed * 2 + 3, 30) : 0
  const nextEvent = upcomingEvents[0] || null

  const xp = useMemo(() => {
    const s = seasonStats
    if (!s) return 0
    return ((s.games_played || 0) * 100) + ((s.total_kills || 0) * 10) + ((s.total_aces || 0) * 25) +
      ((s.total_digs || 0) * 5) + ((s.total_blocks || 0) * 15) + ((s.total_assists || 0) * 10) + (badges.length * 50)
  }, [seasonStats, badges])

  const level = Math.floor(xp / 1000) + 1
  const xpProgress = xp > 0 ? ((xp % 1000) / 1000) * 100 : 0
  const xpToNext = 1000 - (xp % 1000)

  const overallRating = useMemo(() => {
    if (!seasonStats || !gamesPlayed) return 0
    const s = seasonStats
    const raw = ((s.hit_percentage || 0) * 100 * 0.25) + ((s.serve_percentage || 0) * 100 * 0.15) +
      ((s.total_kills || 0) / gamesPlayed * 4) + ((s.total_aces || 0) / gamesPlayed * 6) +
      ((s.total_digs || 0) / gamesPlayed * 2.5) + ((s.total_blocks || 0) / gamesPlayed * 5) +
      ((s.total_assists || 0) / gamesPlayed * 3) + Math.min(gamesPlayed * 1.5, 15)
    return Math.min(99, Math.max(40, Math.round(raw + 35)))
  }, [seasonStats, gamesPlayed])

  // ── Build widget array ──
  const playerWidgets = useMemo(() => {
    let y = 0
    const w = []

    // Row 1: Hero (left) + Trophy Case (right)
    w.push({ id: 'player-hero', label: 'Player Hero', defaultLayout: { x: 0, y, w: 14, h: 10 }, minW: 6, minH: 6, maxH: 14, componentKey: 'PlayerHeroCard' })
    w.push({ id: 'trophy-case', label: 'Trophy Case', defaultLayout: { x: 14, y, w: 10, h: 10 }, minW: 6, minH: 6, maxH: 14, componentKey: 'TrophyCaseCard' })
    y += 10

    // Row 2: Streak (left) + Scouting Report (right, tall)
    if (streak >= 2) {
      w.push({ id: 'streak', label: 'Streak', defaultLayout: { x: 0, y, w: 14, h: 3 }, minW: 4, minH: 2, maxH: 5, component: (
        <div className="rounded-2xl px-5 py-3 flex items-center gap-3 h-full" style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.15)' }}>
          <span className="text-xl">🔥</span>
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: '#FFD700' }}>{streak}-Day Streak</p>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.30)' }}>Keep it going — you're locked in</p>
          </div>
        </div>
      ) })
    }
    w.push({ id: 'scouting-report', label: 'Scouting Report', defaultLayout: { x: 14, y, w: 10, h: 14 }, minW: 6, minH: 8, maxH: 18, componentKey: 'ScoutingReportCard' })
    y += streak >= 2 ? 3 : 0

    // Row 3: Next Up (left)
    if (nextEvent) {
      const isGame = nextEvent.event_type === 'game'
      const evDate = new Date(nextEvent.event_date + 'T00:00:00')
      w.push({ id: 'next-event-player', label: 'Next Up', defaultLayout: { x: 0, y, w: 14, h: 6 }, minW: 4, minH: 4, maxH: 10, component: (
        <div className="rounded-2xl p-4 h-full relative" style={{ background: '#10284C', border: '1px solid rgba(75,185,236,0.15)' }}>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-dot-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[1.2px]" style={{ color: '#4BB9EC' }}>Next Up</span>
            <span className="flex-1" />
            <span className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.30)' }}>{countdownText(nextEvent.event_date)}</span>
          </div>
          <h3 className="text-xl font-extrabold text-white mb-1">{isGame ? `vs ${nextEvent.opponent_name || 'TBD'}` : nextEvent.title || 'Practice'}</h3>
          <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.30)' }}>
            {evDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}{nextEvent.event_time ? ` · ${formatTime12(nextEvent.event_time)}` : ''}
          </p>
          {nextEvent.venue_name && <p className="text-[11px] flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.15)' }}><MapPin className="w-3 h-3" />{nextEvent.venue_name}</p>}
        </div>
      ) })
      y += 6
    }

    // Row 4: Shoutout (left)
    w.push({ id: 'shoutout', label: 'Shoutout', defaultLayout: { x: 0, y, w: 14, h: 4 }, minW: 4, minH: 3, maxH: 6, component: (
      <div className="rounded-2xl p-3.5 flex items-start gap-3 h-full" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.15)' }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(75,185,236,0.12)' }}>
          <span className="text-lg">💪</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold leading-tight" style={{ color: 'rgba(255,255,255,0.80)' }}>Coach gave you a <strong className="text-white">Clutch Player</strong> shoutout!</p>
          <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>Recent</p>
        </div>
      </div>
    ) })
    y += 4

    // Row 5: Today XP (left) + Last Game (right of left)
    w.push({ id: 'today-xp', label: 'Today XP', defaultLayout: { x: 0, y, w: 7, h: 5 }, minW: 4, minH: 3, maxH: 8, component: (
      <div className="rounded-2xl p-4 h-full flex flex-col items-center justify-center" style={{ background: '#10284C', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-[10px] font-bold uppercase tracking-[1.2px] mb-2" style={{ color: '#22C55E' }}>Today</p>
        <p className="text-3xl font-black animate-shimmer" style={{ color: '#22C55E' }}>+{Math.min(gamesPlayed * 50, 200)} XP</p>
        <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.30)' }}>Practice attendance</p>
      </div>
    ) })
    w.push({ id: 'last-game', label: 'Last Game', defaultLayout: { x: 7, y, w: 7, h: 5 }, minW: 4, minH: 4, maxH: 8, componentKey: 'LastGameCard' })
    y += 5

    // Row 6: Chat (left) + Daily Challenge (right)
    w.push({ id: 'team-chat-player', label: 'Team Chat', defaultLayout: { x: 0, y, w: 7, h: 3 }, minW: 4, minH: 2, maxH: 6, component: (
      <button onClick={() => onNavigate?.('chats')} className="w-full rounded-2xl p-3.5 flex items-center gap-2.5 h-full transition hover:brightness-110" style={{ background: '#10284C', border: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-lg opacity-60">💬</span>
        <span className="text-xs font-semibold flex-1 text-left" style={{ color: 'rgba(255,255,255,0.60)' }}>Team Chat</span>
        <ChevronRight className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
      </button>
    ) })
    w.push({ id: 'daily-challenge', label: 'Daily Challenge', defaultLayout: { x: 7, y, w: 7, h: 5 }, minW: 4, minH: 3, maxH: 8, componentKey: 'DailyChallengeCard' })

    return w
  }, [viewingPlayer, primaryTeam, level, xp, xpProgress, xpToNext, overallRating, gamesPlayed, badges, seasonStats, gameStats, streak, nextEvent, upcomingEvents])

  // ── Loading & empty states ──
  if (loading) return (
    <div className="flex items-center justify-center" style={{ background: '#0D1B3E', minHeight: 'calc(100vh - 4rem)' }}>
      <div className="text-center">
        <div className="w-14 h-14 mx-auto rounded-full animate-spin" style={{ border: '3px solid rgba(255,255,255,0.06)', borderTopColor: '#4BB9EC' }} />
        <p className="mt-4 text-sm tracking-wider uppercase" style={{ color: 'rgba(255,255,255,0.30)' }}>Loading player data...</p>
      </div>
    </div>
  )

  if (!viewingPlayer && !isAdmin) return (
    <div className="flex flex-col items-center justify-center text-center" style={{ background: '#0D1B3E', minHeight: 'calc(100vh - 4rem)' }}>
      <Shield className="w-16 h-16 mb-4" style={{ color: 'rgba(255,255,255,0.15)' }} />
      <h2 className="text-xl font-bold mb-2 text-white">Player Dashboard</h2>
      <p style={{ color: 'rgba(255,255,255,0.30)' }}>Player account not linked yet.</p>
    </div>
  )

  // ── Render ──
  return (
    <div style={{ background: '#0D1B3E', minHeight: 'calc(100vh - 4rem)' }}>
      {/* Admin Preview Banner */}
      {isAdminPreview && (
        <div className="flex items-center gap-3 px-6 py-2" style={{ background: 'linear-gradient(90deg, rgba(75,185,236,0.12), rgba(75,185,236,0.04))', borderBottom: '1px solid rgba(75,185,236,0.15)' }}>
          <Eye className="w-4 h-4" style={{ color: '#4BB9EC' }} />
          <p className="text-xs flex-1" style={{ color: 'rgba(255,255,255,0.60)' }}>
            Viewing as <span className="font-bold" style={{ color: '#4BB9EC' }}>{displayName}</span>
          </p>
          <button onClick={() => setShowPlayerSelector(true)} className="text-xs px-3 py-1 rounded-lg font-medium" style={{ background: 'rgba(75,185,236,0.15)', color: '#4BB9EC', border: '1px solid #4BB9EC' }}>
            Switch Player
          </button>
        </div>
      )}

      {/* Multi-team selector */}
      {teams.length > 1 && (
        <div className="flex items-center gap-2 px-6 py-2.5" style={{ borderBottom: '1px solid rgba(75,185,236,0.10)' }}>
          <span className="text-[10px] font-bold uppercase tracking-wider mr-1" style={{ color: 'rgba(255,255,255,0.30)' }}>Team</span>
          {teams.map((t, idx) => (
            <button key={t.id} onClick={() => setSelectedTeamIdx(idx)}
              className="px-3 py-1 rounded-full text-xs font-bold transition-all"
              style={idx === selectedTeamIdx
                ? { background: t.color || '#4BB9EC', color: '#fff', boxShadow: `0 0 8px ${t.color || '#4BB9EC'}40` }
                : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.08)' }
              }>
              {t.name}
            </button>
          ))}
        </div>
      )}

      <DashboardContainer className="!bg-transparent">
        <DashboardGridLayout
          widgets={playerWidgets}
          editMode={editMode}
          onLayoutChange={(layouts) => console.log('Player layout changed:', layouts)}
          role="player"
          sharedProps={{
            role: 'player', onNavigate, navigateToTeamWall,
            viewingPlayer, displayName, primaryTeam,
            level, xp, xpProgress, xpToNext, overallRating, gamesPlayed,
            seasonStats, gameStats, badges, rankings, upcomingEvents, skillRatings,
            selectedTeam: primaryTeam,
          }}
        />
        <EditLayoutButton editMode={editMode} onToggle={() => setEditMode(!editMode)} />
      </DashboardContainer>

      {showPlayerSelector && (
        <AdminPlayerSelector players={allPlayers} selectedPlayerId={previewPlayer?.id}
          onSelect={handleSelectPreviewPlayer} onClose={() => setShowPlayerSelector(false)} />
      )}
    </div>
  )
}

export { PlayerDashboard }
