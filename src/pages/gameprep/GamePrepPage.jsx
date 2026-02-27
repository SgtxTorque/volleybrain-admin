import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  BarChart3, Swords, Crosshair
} from '../../constants/icons'
import { getSportConfig, GameStatsModal } from '../../components/games/GameComponents'
import { AdvancedLineupBuilder } from '../../components/games/AdvancedLineupBuilder'
import { GameDetailModal } from '../../components/games/GameDetailModal'
import { GameDayCommandCenter } from './GameDayCommandCenter'
import GameCard from './GameCard'
import GamePrepCompletionModal from './GamePrepCompletionModal'

// ============================================
// TACTICAL BLUEPRINT STYLES
// ============================================
const gpStyles = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');
.gp-wrap{
  min-height:100vh;background:#0a0a0f;color:#e2e8f0;position:relative;
}
.gp-wrap::before{
  content:'';position:absolute;inset:0;pointer-events:none;
  background-image:
    linear-gradient(rgba(59,130,246,0.03) 1px,transparent 1px),
    linear-gradient(90deg,rgba(59,130,246,0.03) 1px,transparent 1px);
  background-size:40px 40px;z-index:0;
}
.gp-wrap>*{position:relative;z-index:1;}
.gp-card{
  background:rgba(15,20,35,0.7);border:1px solid rgba(59,130,246,0.12);
  border-radius:1rem;backdrop-filter:blur(12px);transition:all .3s ease;
}
.gp-card:hover{border-color:rgba(59,130,246,0.25);box-shadow:0 0 30px rgba(59,130,246,0.08);}
.gp-label{
  font-family:'Rajdhani',sans-serif;font-weight:600;font-size:0.7rem;
  letter-spacing:0.12em;text-transform:uppercase;color:rgba(100,116,139,0.8);
}
`

// ============================================
// MAIN GAME PREP PAGE
// ============================================
function GamePrepPage({ showToast }) {
  const { selectedSeason } = useSeason()
  const tc = useThemeClasses()
  const { isDark } = useTheme()

  const [teams, setTeams] = useState([])
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [games, setGames] = useState([])
  const [pastGames, setPastGames] = useState([])
  const [lineupStatuses, setLineupStatuses] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedGame, setSelectedGame] = useState(null)
  const [showLineupBuilder, setShowLineupBuilder] = useState(false)
  const [showGameCompletion, setShowGameCompletion] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [showStatsPrompt, setShowStatsPrompt] = useState(false)
  const [showGameDetail, setShowGameDetail] = useState(false)
  const [showGameDayMode, setShowGameDayMode] = useState(false)
  const [roster, setRoster] = useState([])
  const [activeTab, setActiveTab] = useState('upcoming')

  const sport = selectedSeason?.sport || selectedSeason?.sports?.name || 'volleyball'
  const sportConfig = getSportConfig(sport)

  useEffect(() => {
    if (selectedSeason?.id) loadTeams()
  }, [selectedSeason])

  useEffect(() => {
    if (selectedTeam) {
      loadGames()
      loadRoster()
    }
  }, [selectedTeam])

  async function loadTeams() {
    try {
      const { data } = await supabase
        .from('teams')
        .select('id, name, color')
        .eq('season_id', selectedSeason.id)
        .order('name')

      setTeams(data || [])
      if (data?.length > 0) setSelectedTeam(data[0])
    } catch (err) {
      console.error('Error loading teams:', err)
    }
  }

  async function loadGames() {
    if (!selectedTeam?.id) return
    setLoading(true)

    try {
      const today = new Date().toISOString().split('T')[0]

      // Load upcoming games
      const { data: upcomingData } = await supabase
        .from('schedule_events')
        .select('*')
        .eq('team_id', selectedTeam.id)
        .eq('event_type', 'game')
        .gte('event_date', today)
        .neq('game_status', 'completed')
        .order('event_date')
        .order('event_time')
        .limit(20)

      setGames(upcomingData || [])

      // Load past/completed games
      const { data: pastData } = await supabase
        .from('schedule_events')
        .select('*')
        .eq('team_id', selectedTeam.id)
        .eq('event_type', 'game')
        .or(`game_status.eq.completed,event_date.lt.${today}`)
        .order('event_date', { ascending: false })
        .limit(10)

      setPastGames(pastData || [])

      // Load lineup statuses
      const allGames = [...(upcomingData || []), ...(pastData || [])]
      if (allGames.length > 0) {
        const eventIds = allGames.map(g => g.id)
        const { data: lineups } = await supabase
          .from('game_lineups')
          .select('event_id')
          .in('event_id', eventIds)
          .eq('is_starter', true)

        const statusMap = {}
        lineups?.forEach(l => {
          statusMap[l.event_id] = { hasLineup: true }
        })
        setLineupStatuses(statusMap)
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

  // Calculate record
  const record = pastGames.reduce((acc, g) => {
    if (g.game_result === 'win') acc.wins++
    else if (g.game_result === 'loss') acc.losses++
    return acc
  }, { wins: 0, losses: 0 })

  // Stats pending count
  const statsPendingCount = pastGames.filter(g => g.game_status === 'completed' && !g.stats_entered).length

  return (
    <>
    <style>{gpStyles}</style>
    <div className="gp-wrap">
    <div className="space-y-6 p-4 md:p-6">
      {/* Stats Pending Banner */}
      {statsPendingCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/30 flex items-center justify-center text-lg">📊</div>
            <div>
              <p className="font-bold text-amber-300">{statsPendingCount} Game{statsPendingCount > 1 ? 's' : ''} Need Stats</p>
              <p className="text-xs text-amber-400/70">Player stats power leaderboards, badges, and parent views</p>
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
            className="px-4 py-2 rounded-xl font-semibold text-sm bg-amber-500 text-black hover:bg-amber-400 transition"
          >
            Enter Stats →
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="gp-label text-blue-400/60 mb-1 flex items-center gap-2">
            <Crosshair className="w-3 h-3" /> TACTICAL BLUEPRINT
          </div>
          <h1 className="text-4xl font-bold text-white flex items-center gap-3" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.04em' }}>
            <Swords className="w-8 h-8 text-blue-400" />
            GAME PREP
          </h1>
          <p className="text-slate-500 text-sm mt-1" style={{ fontFamily: "'Rajdhani', sans-serif" }}>Build lineups &middot; Track results &middot; Dominate</p>
        </div>

        {/* Record */}
        {(record.wins > 0 || record.losses > 0) && (
          <div className="gp-card border border-blue-500/10 rounded-2xl px-6 py-3">
            <p className="gp-label text-blue-400/60 mb-1">SEASON RECORD</p>
            <p className="text-2xl font-bold">
              <span className="text-emerald-400">{record.wins}</span>
              <span className="text-slate-400"> - </span>
              <span className="text-red-400">{record.losses}</span>
            </p>
          </div>
        )}
      </div>

      {/* Team Selector */}
      <div className={`gp-card border border-blue-500/10 rounded-2xl p-2`}>
        <div className="flex items-center gap-2 overflow-x-auto">
          {teams.map(team => (
            <button
              key={team.id}
              onClick={() => setSelectedTeam(team)}
              className={`px-5 py-2.5 rounded-xl whitespace-nowrap flex items-center gap-2 transition font-semibold ${
                selectedTeam?.id === team.id
                  ? 'text-white shadow-lg'
                  : `text-white hover:bg-slate-700/50`
              }`}
              style={selectedTeam?.id === team.id ? {
                backgroundColor: team.color,
                boxShadow: `0 4px 20px ${team.color}40`
              } : {}}
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: team.color }}
              />
              {team.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-5 py-2.5 rounded-xl font-semibold transition ${
            activeTab === 'upcoming'
              ? 'bg-[var(--accent-primary)] text-white'
              : `gp-card text-white hover:brightness-110`
          }`}
        >
          📅 Upcoming ({games.length})
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`px-5 py-2.5 rounded-xl font-semibold transition ${
            activeTab === 'results'
              ? 'bg-[var(--accent-primary)] text-white'
              : `gp-card text-white hover:brightness-110`
          }`}
        >
          📊 Results ({pastGames.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-10 h-10 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {activeTab === 'upcoming' && (
            games.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {games.map(game => (
                  <GameCard
                    key={game.id}
                    game={game}
                    team={selectedTeam}
                    status={getLineupStatus(game)}
                    isSelected={selectedGame?.id === game.id}
                    onClick={() => setSelectedGame(game)}
                    onPrepClick={() => {
                      setSelectedGame(game)
                      setShowLineupBuilder(true)
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
                  />
                ))}
              </div>
            ) : (
              <div className={`gp-card border border-blue-500/10 rounded-2xl p-12 text-center`}>
                <span className="text-6xl">{sportConfig.icon}</span>
                <h2 className={`text-xl font-bold text-white mt-4`}>No Upcoming Games</h2>
                <p className="text-slate-400">Schedule games from the Schedule page to start prepping!</p>
              </div>
            )
          )}

          {activeTab === 'results' && (
            pastGames.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastGames.map(game => (
                  <GameCard
                    key={game.id}
                    game={game}
                    team={selectedTeam}
                    status={getLineupStatus(game)}
                    isSelected={selectedGame?.id === game.id}
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
                  />
                ))}
              </div>
            ) : (
              <div className={`gp-card border border-blue-500/10 rounded-2xl p-12 text-center`}>
                <span className="text-6xl">📊</span>
                <h2 className={`text-xl font-bold text-white mt-4`}>No Game Results Yet</h2>
                <p className="text-slate-400">Complete games to see results here</p>
              </div>
            )
          )}
        </>
      )}

      {/* Modals */}
      {showLineupBuilder && selectedGame && selectedTeam && (
        <AdvancedLineupBuilder
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
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => { setShowStatsPrompt(false) }}>
          <div className="bg-white rounded-3xl w-full max-w-md p-8 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-6xl mb-4">
              {selectedGame.game_result === 'win' ? '🏆' : selectedGame.game_result === 'loss' ? '📊' : '🤝'}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {selectedGame.game_result === 'win' ? 'Victory!' : selectedGame.game_result === 'loss' ? 'Tough Loss' : 'Game Complete!'}
            </h2>
            <p className="text-gray-500 mb-6">
              Want to enter player stats? Stats power leaderboards, badges, and the parent portal.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowStatsPrompt(false)
                  setShowStatsModal(true)
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-purple-500 text-white font-bold text-lg hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                <BarChart3 className="w-5 h-5" />
                Enter Stats Now
              </button>

              <button
                onClick={() => setShowStatsPrompt(false)}
                className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-500 font-medium hover:bg-gray-50 transition text-sm"
              >
                I'll Do It Later
              </button>
            </div>

            <p className="text-xs text-gray-400 mt-4">
              💡 Games needing stats will show an amber badge
            </p>
          </div>
        </div>
      )}

      {showGameDetail && selectedGame && selectedTeam && (
        <GameDetailModal
          game={selectedGame}
          team={selectedTeam}
          isAdmin={true}
          onClose={() => setShowGameDetail(false)}
          onEditStats={(game) => {
            setShowGameDetail(false)
            setShowStatsModal(true)
          }}
        />
      )}

      {showGameDayMode && selectedGame && selectedTeam && (
        <GameDayCommandCenter
          event={selectedGame}
          team={selectedTeam}
          onClose={() => {
            setShowGameDayMode(false)
            loadGames()
          }}
          onSave={() => loadGames()}
          showToast={showToast}
        />
      )}
    </div>
    </div>
    </>
  )
}

export { GamePrepPage }
