// =============================================================================
// PlayerDashboard — v2 dark theme layout, gold accent system
// Preserves all Supabase data loading + admin preview from original
// =============================================================================

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason, isAllSeasons } from '../../contexts/SeasonContext'
import { supabase } from '../../lib/supabase'
import { Users, X, Eye, Shield } from '../../constants/icons'
// V2 shared components
import { useTheme } from '../../contexts/ThemeContext'
import {
  TopBar, HeroCard, BodyTabs, WeeklyLoad, ThePlaybook,
  MascotNudge, MilestoneCard, V2DashboardLayout,
} from '../../components/v2'
// V2 player-specific components
import PlayerBadgesTab from '../../components/v2/player/PlayerBadgesTab'
import PlayerChallengesTab from '../../components/v2/player/PlayerChallengesTab'
import PlayerStatsTab from '../../components/v2/player/PlayerStatsTab'
import PlayerSkillsTab from '../../components/v2/player/PlayerSkillsTab'
import LeaderboardCard from '../../components/v2/player/LeaderboardCard'
import ChallengesSidebar from '../../components/v2/player/ChallengesSidebar'
import ShoutoutFeed from '../../components/v2/player/ShoutoutFeed'

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
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--lynx-navy-gradient-subtle)', border: '1px solid rgba(255,255,255,0.06)', color: '#fff' }} />
        </div>
        <div className="flex-1 overflow-auto px-4 pb-4 space-y-2">
          {filtered.map(player => (
            <button key={player.id} onClick={() => onSelect(player)}
              className="w-full flex items-center gap-3 p-3 rounded-xl"
              style={{ background: selectedPlayerId === player.id ? 'linear-gradient(135deg, #0B1628 0%, #1a3a6b 100%)' : 'var(--lynx-navy-gradient-subtle)', border: selectedPlayerId === player.id ? '1px solid #4BB9EC' : '1px solid transparent' }}>
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
function PlayerDashboard({ roleContext, navigateToTeamWall, onNavigate, showToast, onPlayerChange, activeView, availableViews = [], onSwitchRole }) {
  const { user } = useAuth()
  const { selectedSeason } = useSeason()
  const { isDark, toggleTheme } = useTheme()

  const [loading, setLoading] = useState(true)
  const [playerData, setPlayerData] = useState(null)
  const [seasonStats, setSeasonStats] = useState(null)
  const [gameStats, setGameStats] = useState([])
  const [badges, setBadges] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [rankings, setRankings] = useState({})
  const [skillRatings, setSkillRatings] = useState(null)
  const [activeTab, setActiveTab] = useState('badges')
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
    try {
      let query = supabase.from('players')
        .select('id, first_name, last_name, jersey_number, photo_url, position, team_players(team_id, teams(id, name, season_id, color))')
      if (!isAllSeasons(selectedSeason) && selectedSeason?.id) {
        query = query.eq('team_players.teams.season_id', selectedSeason.id)
      }
      const { data } = await query
      if (data) {
        const seasonPlayers = !isAllSeasons(selectedSeason) ? data.filter(p => p.team_players?.length > 0) : data
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
    try {
      let query = supabase.from('player_season_stats').select('player_id, total_kills, total_aces, total_digs, total_blocks, total_assists, total_points')
      if (!isAllSeasons(selectedSeason) && selectedSeason?.id) {
        query = query.eq('season_id', selectedSeason.id)
      }
      const { data: allStats } = await query
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

  // ── Derived values for v2 ──
  const tierLabel = level >= 10 ? 'Diamond' : level >= 7 ? 'Platinum' : level >= 4 ? 'Gold' : 'Silver'

  const getPlayerGreeting = () => {
    const firstName = viewingPlayer?.first_name || 'Player'
    if (streak >= 5) return `What's up, ${firstName}. You're on fire.`
    if (gamesPlayed > 0) return `What's up, ${firstName}. Let's get after it.`
    return `What's up, ${firstName}.`
  }

  const heroSubLine = [
    seasonStats?.total_kills ? `${seasonStats.total_kills} kills` : null,
    seasonStats?.total_assists ? `${seasonStats.total_assists} assists` : null,
    seasonStats?.total_aces ? `${seasonStats.total_aces} aces` : null,
  ].filter(Boolean).join(' · ') || 'No stats yet this season'

  // Map badges for tab
  const badgesForTab = badges.map(b => ({
    id: b.id,
    name: b.achievement?.name || 'Badge',
    icon: b.achievement?.icon || '🏅',
    rarity: b.achievement?.rarity || 'common',
  }))

  // Player tabs
  const playerTabs = [
    { key: 'badges', label: 'Badges' },
    { key: 'challenges', label: 'Challenges' },
    { key: 'stats', label: 'Season Stats' },
    { key: 'skills', label: 'Skills' },
  ]

  // Playbook actions
  const playbookItems = [
    { icon: '📅', label: 'RSVP', onClick: () => onNavigate?.('schedule') },
    { icon: '🏋️', label: 'Start Drill', onClick: () => {} },
    { icon: '📊', label: 'My Stats', onClick: () => setActiveTab('stats') },
    { icon: '🏆', label: 'Leaderboard', onClick: () => onNavigate?.('leaderboards') },
  ]

  // ── Loading & empty states ──
  if (loading) return (
    <div className="v2-player-dark" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#060E1A', minHeight: 'calc(100vh - 4rem)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, margin: '0 auto', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.06)', borderTopColor: '#FFD700', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: 16, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.30)' }}>Loading player data...</p>
      </div>
    </div>
  )

  if (!viewingPlayer && !isAdmin) return (
    <div className="v2-player-dark" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: '#060E1A', minHeight: 'calc(100vh - 4rem)' }}>
      <Shield className="w-16 h-16 mb-4" style={{ color: 'rgba(255,255,255,0.15)' }} />
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>Player Dashboard</h2>
      <p style={{ color: 'rgba(255,255,255,0.30)' }}>Player account not linked yet.</p>
    </div>
  )

  // ── Render ──
  return (
    <div className="v2-player-dark" style={{ background: '#060E1A', minHeight: 'calc(100vh - 4rem)' }}>
      <TopBar
        roleLabel="Lynx Player"
        navLinks={[
          { label: 'Home', pageId: 'dashboard', isActive: true, onClick: () => onNavigate?.('dashboard') },
          { label: 'Schedule', pageId: 'schedule', onClick: () => onNavigate?.('schedule') },
          { label: 'Leaderboards', pageId: 'leaderboards', onClick: () => onNavigate?.('leaderboards') },
        ]}
        searchPlaceholder="Search..."
        onSearchClick={() => document.dispatchEvent(new CustomEvent('command-palette-open'))}
        avatarInitials={displayName?.[0] || ''}
        onSettingsClick={() => onNavigate?.('organization')}
        onNotificationClick={() => onNavigate?.('notifications')}
        onThemeToggle={toggleTheme}
        isDark={true}
        availableRoles={availableViews.map(v => ({ id: v.id, label: `Lynx ${v.label}`, subtitle: v.description }))}
        activeRoleId={activeView}
        onRoleSwitch={onSwitchRole}
      />
      {/* Admin Preview Banner */}
      {isAdminPreview && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 24px', background: 'linear-gradient(90deg, rgba(75,185,236,0.12), rgba(75,185,236,0.04))', borderBottom: '1px solid rgba(75,185,236,0.15)' }}>
          <Eye className="w-4 h-4" style={{ color: '#4BB9EC' }} />
          <p style={{ fontSize: 12, flex: 1, color: 'rgba(255,255,255,0.60)' }}>
            Viewing as <span style={{ fontWeight: 700, color: '#4BB9EC' }}>{displayName}</span>
          </p>
          <button onClick={() => setShowPlayerSelector(true)} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 8, fontWeight: 500, background: 'rgba(75,185,236,0.15)', color: '#4BB9EC', border: '1px solid #4BB9EC', cursor: 'pointer' }}>
            Switch Player
          </button>
        </div>
      )}

      {/* Multi-team selector */}
      {teams.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderBottom: '1px solid rgba(75,185,236,0.10)' }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.30)', marginRight: 4 }}>Team</span>
          {teams.map((t, idx) => (
            <button key={t.id} onClick={() => setSelectedTeamIdx(idx)}
              style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', border: 'none', transition: 'all 0.15s ease',
                ...(idx === selectedTeamIdx
                  ? { background: t.color || '#4BB9EC', color: '#fff', boxShadow: `0 0 8px ${t.color || '#4BB9EC'}40` }
                  : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.50)' }
                ),
              }}>
              {t.name}
            </button>
          ))}
        </div>
      )}

      <V2DashboardLayout
        variant="dark"
        mainContent={
          <>
            {/* Hero Card — player variant */}
            <HeroCard
              variant="player"
              orgLine={`${primaryTeam?.name || 'Team'} · ${tierLabel} Tier`}
              greeting={getPlayerGreeting()}
              subLine={heroSubLine}
              levelBadge={
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.25)',
                  borderRadius: 8, padding: '4px 10px',
                  fontSize: 12, fontWeight: 800, color: '#FFD700',
                }}>
                  LVL {level}
                </span>
              }
              xpBar={
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.40)', marginBottom: 4 }}>
                    <span>{xp.toLocaleString()} XP</span>
                    <span>{xpToNext} to next level</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, background: '#FFD700', width: `${xpProgress}%`, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              }
              streakBadge={streak >= 2 ? (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.15)',
                  borderRadius: 8, padding: '4px 10px',
                  fontSize: 12, fontWeight: 700, color: '#FFD700',
                }}>
                  🔥 {streak}-Day Streak
                </span>
              ) : null}
            />

            {/* Body Tabs */}
            <BodyTabs
              tabs={playerTabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              variant="dark"
            >
              {activeTab === 'badges' && (
                <PlayerBadgesTab badges={badgesForTab} />
              )}
              {activeTab === 'challenges' && (
                <PlayerChallengesTab challenges={[]} />
              )}
              {activeTab === 'stats' && (
                <PlayerStatsTab
                  seasonStats={seasonStats || {}}
                  gameStats={gameStats}
                  rankings={rankings}
                />
              )}
              {activeTab === 'skills' && (
                <PlayerSkillsTab
                  skillRatings={skillRatings}
                  overallRating={overallRating}
                />
              )}
            </BodyTabs>

            {/* Mascot Nudge */}
            <MascotNudge
              variant="dark"
              message={
                badges.length > 0
                  ? `You've earned ${badges.length} badge${badges.length > 1 ? 's' : ''}! Keep grinding for more.`
                  : 'Keep putting in the work — your first badge is within reach!'
              }
            />
          </>
        }
        sideContent={
          <>
            {/* Leaderboard */}
            <LeaderboardCard
              teamName={primaryTeam?.name}
              entries={[]}
            />

            {/* Active Challenges */}
            <ChallengesSidebar challenges={[]} />

            {/* Upcoming Events */}
            <WeeklyLoad
              variant="dark"
              title="Upcoming"
              events={upcomingEvents.slice(0, 5).map(e => ({
                label: e.title || e.event_type,
                date: e.event_date,
                time: e.event_time,
                type: e.event_type,
              }))}
            />

            {/* Shoutout Feed */}
            <ShoutoutFeed shoutouts={[]} />

            {/* The Playbook */}
            <ThePlaybook
              variant="dark"
              columns={2}
              actions={playbookItems}
            />
          </>
        }
      />

      {showPlayerSelector && (
        <AdminPlayerSelector players={allPlayers} selectedPlayerId={previewPlayer?.id}
          onSelect={handleSelectPreviewPlayer} onClose={() => setShowPlayerSelector(false)} />
      )}
    </div>
  )
}

export { PlayerDashboard }
