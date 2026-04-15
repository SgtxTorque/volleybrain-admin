import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason, isAllSeasons } from '../../contexts/SeasonContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { BarChart3 } from '../../constants/icons'
import { getSportConfig } from '../../constants/sportConfigs'
import { GameStatsModal } from '../../components/games/GameComponents'
import { LineupBuilderV2 } from '../../components/games/lineup-v2'
import { GameDetailModal } from '../../components/games/GameDetailModal'
import TeamLogo from '../../components/TeamLogo'
import { GameDayCommandCenter } from './GameDayCommandCenter'
import GameCard from './GameCard'
import GamePrepCompletionModal from './GamePrepCompletionModal'
import { computeCheckpoints, getCurrentCheckpoint } from '../../lib/gameCheckpoints'
import GameJourneyPanel from './GameJourneyPanel'
import QuickAttendanceModal from './QuickAttendanceModal'
import DashboardContainer from '../../components/layout/DashboardContainer'
import SeasonFilterBar from '../../components/pages/SeasonFilterBar'
import QuickScoreModal from './QuickScoreModal'
import SocialCardModal from '../../components/social-cards/SocialCardModal'

// ============================================
// MAIN GAME PREP PAGE
// ============================================
function GamePrepPage({ showToast }) {
  const { user, profile, organization } = useAuth()
  const { selectedSeason, allSeasons } = useSeason()
  const tc = useThemeClasses()
  const { isDark } = useTheme()

  const [teams, setTeams] = useState([])
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [games, setGames] = useState([])
  const [pastGames, setPastGames] = useState([])
  const [lineupStatuses, setLineupStatuses] = useState({})
  const [rsvpData, setRsvpData] = useState({})
  const [attendanceData, setAttendanceData] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedGame, setSelectedGame] = useState(null)
  const [showLineupBuilder, setShowLineupBuilder] = useState(false)
  const [showGameCompletion, setShowGameCompletion] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [showStatsPrompt, setShowStatsPrompt] = useState(false)
  const [showGameDetail, setShowGameDetail] = useState(false)
  const [showGameDayMode, setShowGameDayMode] = useState(false)
  const [showJourneyPanel, setShowJourneyPanel] = useState(false)
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [showQuickScore, setShowQuickScore] = useState(false)
  const [showResultsCard, setShowResultsCard] = useState(null)
  const [roster, setRoster] = useState([])
  const [activeTab, setActiveTab] = useState('upcoming')

  const sport = selectedTeam?.sport || selectedSeason?.sports?.name || 'volleyball'
  const sportConfig = getSportConfig(sport)

  useEffect(() => {
    if (user?.id) loadTeams()
  }, [user?.id])

  useEffect(() => {
    if (selectedTeam) {
      loadGames()
      loadRoster()
    }
  }, [selectedTeam])

  async function loadTeams() {
    try {
      // Try to find coach record for this user
      const { data: coachRecord } = await supabase
        .from('coaches')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle()

      if (!coachRecord) {
        // Admin fallback — load all teams in the org's seasons
        const orgId = profile?.current_organization_id || organization?.id
        if (!orgId) return
        const orgSeasonIds = (allSeasons || []).map(s => s.id)
        if (orgSeasonIds.length === 0) return
        const { data } = await supabase
          .from('teams')
          .select('id, name, color, logo_url, abbreviation, season_id, seasons(id, name, sport_id, sports(id, name))')
          .in('season_id', orgSeasonIds)
          .order('name')
        const enriched = (data || []).map(t => ({
          ...t,
          sport: t.seasons?.sports?.name?.toLowerCase() || 'volleyball',
          seasonName: t.seasons?.name,
        }))
        setTeams(enriched)
        if (enriched.length > 0 && !selectedTeam) setSelectedTeam(enriched[0])
        return
      }

      // Coach — load ALL teams across all seasons via team_coaches
      const { data: assignments } = await supabase
        .from('team_coaches')
        .select('team_id, role, teams(id, name, color, logo_url, abbreviation, season_id, seasons(id, name, sport_id, sports(id, name)))')
        .eq('coach_id', coachRecord.id)

      const teams = (assignments || [])
        .map(a => ({
          ...a.teams,
          coachRole: a.role,
          sport: a.teams?.seasons?.sports?.name?.toLowerCase() || 'volleyball',
          seasonName: a.teams?.seasons?.name,
        }))
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name))

      setTeams(teams)
      if (teams.length > 0 && !selectedTeam) setSelectedTeam(teams[0])
    } catch (err) {
      console.error('Error loading teams:', err)
    }
  }

  async function loadGames() {
    if (!selectedTeam?.id || !selectedSeason?.id) return
    // Safety: verify team belongs to current season (prevents cross-org leak)
    if (selectedTeam.season_id && selectedTeam.season_id !== selectedSeason.id && !isAllSeasons(selectedSeason)) {
      console.warn('[GamePrep] Team/season mismatch detected — clearing team selection')
      setSelectedTeam(null)
      return
    }
    setLoading(true)

    try {
      const today = new Date().toISOString().split('T')[0]

      // Load upcoming games
      let upcomingQuery = supabase
        .from('schedule_events')
        .select('*')
        .eq('team_id', selectedTeam.id)
        .eq('event_type', 'game')
        .gte('event_date', today)
        .neq('game_status', 'completed')
        .order('event_date')
        .order('event_time')
        .limit(20)
      if (!isAllSeasons(selectedSeason)) {
        upcomingQuery = upcomingQuery.eq('season_id', selectedSeason.id)
      }
      const { data: upcomingData } = await upcomingQuery

      setGames(upcomingData || [])

      // Load past/completed games
      let pastQuery = supabase
        .from('schedule_events')
        .select('*')
        .eq('team_id', selectedTeam.id)
        .eq('event_type', 'game')
        .or(`game_status.eq.completed,event_date.lt.${today}`)
        .order('event_date', { ascending: false })
        .limit(10)
      if (!isAllSeasons(selectedSeason)) {
        pastQuery = pastQuery.eq('season_id', selectedSeason.id)
      }
      const { data: pastData } = await pastQuery

      setPastGames(pastData || [])

      // Load lineup statuses, RSVPs, and attendance for all games
      const allGames = [...(upcomingData || []), ...(pastData || [])]
      const allGameIds = allGames.map(g => g.id)

      if (allGameIds.length > 0) {
        const { data: lineups } = await supabase
          .from('game_lineups')
          .select('event_id')
          .in('event_id', allGameIds)
          .eq('is_starter', true)

        const statusMap = {}
        lineups?.forEach(l => {
          statusMap[l.event_id] = { hasLineup: true }
        })
        setLineupStatuses(statusMap)

        // Load RSVPs
        const { data: rsvps } = await supabase
          .from('event_rsvps')
          .select('event_id, player_id, status')
          .in('event_id', allGameIds)

        const rMap = {}
        for (const r of (rsvps || [])) {
          if (!rMap[r.event_id]) rMap[r.event_id] = []
          rMap[r.event_id].push(r)
        }
        setRsvpData(rMap)

        // Load attendance
        const { data: attend } = await supabase
          .from('event_attendance')
          .select('event_id, player_id, status')
          .in('event_id', allGameIds)

        const aMap = {}
        for (const a of (attend || [])) {
          if (!aMap[a.event_id]) aMap[a.event_id] = []
          aMap[a.event_id].push(a)
        }
        setAttendanceData(aMap)
      }

    } catch (err) {
      console.error('Error loading games:', err)
    }
    setLoading(false)
  }

  async function loadRoster() {
    if (!selectedTeam?.id) return

    const { data } = await supabase
      .from('team_players')
      .select('*, players(*)')
      .eq('team_id', selectedTeam.id)

    const rosterData = (data || [])
      .map(tp => ({ ...tp.players, team_jersey: tp.jersey_number, team_position: tp.position }))
      .filter(Boolean)

    setRoster(rosterData)
  }

  function getLineupStatus(game) {
    const status = lineupStatuses[game.id]
    const isCompleted = game.game_status === 'completed'

    if (isCompleted) {
      return {
        label: game.game_result === 'win' ? 'Win' : game.game_result === 'loss' ? 'Loss' : 'Completed',
        text: game.game_result === 'win' ? 'text-emerald-400' : game.game_result === 'loss' ? 'text-red-400' : 'text-slate-400',
        bg: game.game_result === 'win' ? 'bg-emerald-500/20' : game.game_result === 'loss' ? 'bg-red-500/20' : 'bg-slate-500/20',
        icon: game.game_result === 'win' ? '🏆' : '📊',
        hasLineup: true
      }
    }

    if (!status?.hasLineup) {
      return { label: 'Not Started', text: 'text-slate-400', bg: 'bg-slate-500/20', icon: '📋', hasLineup: false }
    }

    return { label: 'Ready', text: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: '✓', hasLineup: true }
  }

  function getGameCheckpoints(game) {
    return computeCheckpoints(game, {
      rsvpData: rsvpData[game.id] || [],
      hasLineup: !!lineupStatuses[game.id]?.hasLineup,
      attendanceData: attendanceData[game.id] || [],
      rosterCount: roster.length,
    })
  }

  // Calculate record
  const record = pastGames.reduce((acc, g) => {
    if (g.game_result === 'win') acc.wins++
    else if (g.game_result === 'loss') acc.losses++
    return acc
  }, { wins: 0, losses: 0 })

  // Stats pending count
  const statsPendingCount = pastGames.filter(g => g.game_status === 'completed' && !g.stats_entered).length

  function renderGameCard(game) {
    const checkpoints = getGameCheckpoints(game)
    const current = getCurrentCheckpoint(checkpoints)
    return (
      <GameCard
        key={game.id}
        game={game}
        team={selectedTeam}
        isDark={isDark}
        status={getLineupStatus(game)}
        isSelected={selectedGame?.id === game.id}
        checkpoints={checkpoints}
        currentCheckpoint={current}
        onClick={() => {
          setSelectedGame(game)
          setShowJourneyPanel(true)
        }}
        onPrepClick={() => {
          setSelectedGame(game)
          setShowLineupBuilder(true)
        }}
        onCompleteClick={() => {
          setSelectedGame(game)
          setShowQuickScore(true)
        }}
        onGameDayClick={() => {
          setSelectedGame(game)
          setShowGameDayMode(true)
        }}
        onEnterStats={(g) => {
          setSelectedGame(g)
          setShowStatsModal(true)
        }}
      />
    )
  }

  const cardBg = isDark ? 'bg-lynx-charcoal border border-lynx-border-dark' : 'bg-white border border-lynx-silver'
  const labelCls = `text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`

  return (
    <div className={`min-h-screen ${isDark ? 'bg-lynx-midnight' : 'bg-lynx-cloud'}`}>
    <DashboardContainer className="space-y-6 animate-page-in px-6">
      {/* Stats Pending Banner */}
      {statsPendingCount > 0 && (
        <div className={`${isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-300'} border rounded-xl p-4 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'} flex items-center justify-center text-lg`}>📊</div>
            <div>
              <p className={`font-bold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>{statsPendingCount} Game{statsPendingCount > 1 ? 's' : ''} Need Stats</p>
              <p className={`text-xs ${isDark ? 'text-amber-400/70' : 'text-amber-600/70'}`}>Player stats power leaderboards, badges, and parent views</p>
            </div>
          </div>
          <button
            onClick={() => {
              setActiveTab('results')
              const firstPending = pastGames.find(g => g.game_status === 'completed' && !g.stats_entered)
              if (firstPending) {
                setSelectedGame(firstPending)
                setShowStatsModal(true)
              }
            }}
            className="px-4 py-2 rounded-[10px] font-semibold text-sm bg-amber-500 text-white hover:bg-amber-600 transition"
          >
            Enter Stats
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className={labelCls}>Game Prep</p>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-lynx-navy'}`}>
            Game Prep
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Build lineups · Track results · Dominate</p>
        </div>

        {/* Record */}
        {(record.wins > 0 || record.losses > 0) && (
          <div className={`${cardBg} rounded-xl px-6 py-3`}>
            <p className={`${labelCls} mb-1`}>Season Record</p>
            <p className="text-2xl font-bold">
              <span className="text-emerald-500">{record.wins}</span>
              <span className={isDark ? 'text-slate-400' : 'text-lynx-slate'}> - </span>
              <span className="text-red-500">{record.losses}</span>
            </p>
          </div>
        )}
      </div>

      {/* Team Selector */}
      {teams.length === 0 && !loading && (
        <div className={`${cardBg} rounded-xl p-12 text-center`}>
          <span className="text-5xl">🏐</span>
          <h2 className={`text-xl font-bold mt-4 ${isDark ? 'text-white' : 'text-lynx-navy'}`}>No Teams Yet</h2>
          <p className={`mt-1 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Create teams in the Teams page to start game prep</p>
        </div>
      )}
      {teams.length > 0 && (
      <div className={`${cardBg} rounded-xl p-2`}>
        <div className="flex items-center gap-2 overflow-x-auto">
          {teams.map(team => (
            <button
              key={team.id}
              onClick={() => setSelectedTeam(team)}
              className={`px-5 py-2.5 rounded-xl whitespace-nowrap flex items-center gap-2 transition font-semibold ${
                selectedTeam?.id === team.id
                  ? 'text-white shadow-lg'
                  : isDark ? 'text-slate-300 hover:bg-white/5' : 'text-lynx-slate hover:bg-lynx-frost'
              }`}
              style={selectedTeam?.id === team.id ? {
                backgroundColor: team.color,
                boxShadow: `0 4px 20px ${team.color}40`
              } : {}}
            >
              <TeamLogo team={team} size={20} className="flex-shrink-0" />
              {team.name}
              <span className="text-xs opacity-60 ml-1">
                {team.sport === 'basketball' ? '\u{1F3C0}' :
                 team.sport === 'baseball' ? '\u{26BE}' :
                 team.sport === 'softball' ? '\u{1F94E}' :
                 team.sport === 'soccer' ? '\u{26BD}' :
                 team.sport === 'football' ? '\u{1F3C8}' :
                 team.sport === 'flag_football' ? '\u{1F3F3}' :
                 team.sport === 'volleyball' ? '\u{1F3D0}' : ''}
              </span>
            </button>
          ))}
        </div>
      </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-5 py-2.5 rounded-[10px] font-semibold transition ${
            activeTab === 'upcoming'
              ? 'bg-lynx-sky text-white'
              : isDark ? 'bg-lynx-charcoal border border-lynx-border-dark text-slate-300 hover:bg-white/5' : 'bg-white border border-lynx-silver text-lynx-slate hover:bg-lynx-frost'
          }`}
        >
          Upcoming ({games.length})
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`px-5 py-2.5 rounded-[10px] font-semibold transition ${
            activeTab === 'results'
              ? 'bg-lynx-sky text-white'
              : isDark ? 'bg-lynx-charcoal border border-lynx-border-dark text-slate-300 hover:bg-white/5' : 'bg-white border border-lynx-silver text-lynx-slate hover:bg-lynx-frost'
          }`}
        >
          Results ({pastGames.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-10 h-10 border-4 border-lynx-sky border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {activeTab === 'upcoming' && (
            games.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {games.map(game => renderGameCard(game))}
              </div>
            ) : (
              <div className={`${cardBg} rounded-xl p-12 text-center`}>
                <span className="text-6xl">{sportConfig.icon}</span>
                <h2 className={`text-xl font-bold mt-4 ${isDark ? 'text-white' : 'text-lynx-navy'}`}>No Upcoming Games</h2>
                <p className={`mt-1 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Schedule games from the Schedule page to start prepping!</p>
              </div>
            )
          )}

          {activeTab === 'results' && (
            pastGames.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastGames.map(game => {
                  const checkpoints = getGameCheckpoints(game)
                  const current = getCurrentCheckpoint(checkpoints)
                  return (
                    <GameCard
                      key={game.id}
                      game={game}
                      team={selectedTeam}
                      isDark={isDark}
                      status={getLineupStatus(game)}
                      isSelected={selectedGame?.id === game.id}
                      checkpoints={checkpoints}
                      currentCheckpoint={current}
                      onClick={() => {
                        setSelectedGame(game)
                        if (game.game_status === 'completed') {
                          setShowGameDetail(true)
                        } else {
                          setShowGameCompletion(true)
                        }
                      }}
                      onPrepClick={() => {
                        setSelectedGame(game)
                        if (game.game_status === 'completed') {
                          setShowGameDetail(true)
                        } else {
                          setShowGameCompletion(true)
                        }
                      }}
                      onCompleteClick={() => {
                        setSelectedGame(game)
                        setShowGameCompletion(true)
                      }}
                      onGameDayClick={() => {
                        setSelectedGame(game)
                        setShowGameDayMode(true)
                      }}
                      onEnterStats={(g) => {
                        setSelectedGame(g)
                        setShowStatsModal(true)
                      }}
                      onShareResults={(g) => {
                        setSelectedGame(g)
                        setShowResultsCard(g)
                      }}
                    />
                  )
                })}
              </div>
            ) : (
              <div className={`${cardBg} rounded-xl p-12 text-center`}>
                <span className="text-6xl">📊</span>
                <h2 className={`text-xl font-bold mt-4 ${isDark ? 'text-white' : 'text-lynx-navy'}`}>No Game Results Yet</h2>
                <p className={`mt-1 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Complete games to see results here</p>
              </div>
            )
          )}
        </>
      )}

      {/* Modals */}
      {showLineupBuilder && selectedGame && selectedTeam && (
        <LineupBuilderV2
          event={selectedGame}
          team={selectedTeam}
          sport={sport}
          onClose={() => {
            setShowLineupBuilder(false)
            loadGames()
          }}
          onSave={() => loadGames()}
          showToast={showToast}
        />
      )}

      {showGameCompletion && selectedGame && selectedTeam && (
        <GamePrepCompletionModal
          event={selectedGame}
          team={selectedTeam}
          roster={roster}
          sport={sport}
          onClose={() => {
            setShowGameCompletion(false)
            loadGames()
          }}
          onComplete={() => {
            setShowGameCompletion(false)
            setShowStatsPrompt(true)
            loadGames()
          }}
          showToast={showToast}
        />
      )}

      {showStatsModal && selectedGame && selectedTeam && (
        <GameStatsModal
          event={selectedGame}
          team={selectedTeam}
          roster={roster}
          sport={sport}
          onClose={() => {
            setShowStatsModal(false)
            loadGames()
          }}
          onSave={() => {
            setShowStatsModal(false)
            loadGames()
            showToast('Stats saved! Leaderboards and player cards updated.', 'success')
          }}
          showToast={showToast}
        />
      )}

      {/* Stats Prompt - shown after game completion */}
      {showStatsPrompt && selectedGame && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => { setShowStatsPrompt(false) }}>
          <div className={`${isDark ? 'bg-lynx-charcoal' : 'bg-white'} rounded-xl w-full max-w-md p-8 text-center shadow-2xl`} onClick={e => e.stopPropagation()}>
            <div className="text-6xl mb-4">
              {selectedGame.game_result === 'win' ? '🏆' : selectedGame.game_result === 'loss' ? '📊' : '🤝'}
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-lynx-navy'}`}>
              {selectedGame.game_result === 'win' ? 'Victory!' : selectedGame.game_result === 'loss' ? 'Tough Loss' : 'Game Complete!'}
            </h2>
            <p className={`mb-6 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
              Want to enter player stats? Stats power leaderboards, badges, and the parent portal.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowStatsPrompt(false)
                  setShowStatsModal(true)
                }}
                className="w-full py-3 rounded-[10px] bg-lynx-sky hover:bg-lynx-deep text-white font-bold text-lg transition flex items-center justify-center gap-2"
              >
                <BarChart3 className="w-5 h-5" />
                Enter Stats Now
              </button>

              <button
                onClick={() => setShowStatsPrompt(false)}
                className={`w-full py-2.5 rounded-[10px] border font-medium transition text-sm ${
                  isDark ? 'border-lynx-border-dark text-slate-400 hover:bg-white/5' : 'border-lynx-silver text-lynx-slate hover:bg-lynx-frost'
                }`}
              >
                I'll Do It Later
              </button>
            </div>

            <p className={`text-xs mt-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Games needing stats will show an amber badge
            </p>
          </div>
        </div>
      )}

      {showGameDetail && selectedGame && selectedTeam && (
        <GameDetailModal
          game={selectedGame}
          team={selectedTeam}
          sport={sport}
          isAdmin={true}
          onClose={() => setShowGameDetail(false)}
          onEditStats={(game) => {
            setShowGameDetail(false)
            setShowStatsModal(true)
          }}
          onShareResults={(game) => {
            setShowGameDetail(false)
            setShowResultsCard(game)
          }}
        />
      )}

      {showGameDayMode && selectedGame && selectedTeam && (
        <GameDayCommandCenter
          event={selectedGame}
          team={selectedTeam}
          sport={sport}
          onClose={() => {
            setShowGameDayMode(false)
            loadGames()
          }}
          onSave={() => loadGames()}
          showToast={showToast}
        />
      )}

      {showQuickScore && selectedGame && selectedTeam && (
        <QuickScoreModal
          event={selectedGame}
          team={selectedTeam}
          roster={roster}
          sport={sport}
          onClose={() => { setShowQuickScore(false); loadGames() }}
          onComplete={() => {
            setShowQuickScore(false)
            setShowStatsPrompt(true)
            loadGames()
          }}
          showToast={showToast}
        />
      )}

      {showAttendanceModal && selectedGame && selectedTeam && (
        <QuickAttendanceModal
          event={selectedGame}
          roster={roster}
          onClose={() => { setShowAttendanceModal(false); loadGames() }}
          onSave={() => loadGames()}
          showToast={showToast}
        />
      )}

      {showJourneyPanel && selectedGame && selectedTeam && (() => {
        const cp = getGameCheckpoints(selectedGame)
        const cur = getCurrentCheckpoint(cp)
        return (
          <GameJourneyPanel
            game={selectedGame}
            team={selectedTeam}
            roster={roster}
            checkpoints={cp}
            currentCheckpoint={cur}
            onClose={() => { setShowJourneyPanel(false); loadGames() }}
            onOpenLineup={() => setShowLineupBuilder(true)}
            onOpenCompletion={() => setShowGameCompletion(true)}
            onOpenStats={() => setShowStatsModal(true)}
            onOpenGameDay={() => { setShowJourneyPanel(false); setShowGameDayMode(true) }}
            onOpenDetail={() => setShowGameDetail(true)}
            onOpenAttendance={() => setShowAttendanceModal(true)}
            onOpenQuickScore={() => setShowQuickScore(true)}
            showToast={showToast}
          />
        )
      })()}

      {showResultsCard && selectedTeam && (
        <SocialCardModal
          category="results"
          event={showResultsCard}
          team={selectedTeam}
          organization={organization}
          season={selectedSeason}
          onClose={() => setShowResultsCard(null)}
          showToast={showToast}
        />
      )}
    </DashboardContainer>
    </div>
  )
}

export { GamePrepPage }
