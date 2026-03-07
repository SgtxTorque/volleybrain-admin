// =============================================================================
// GameDayCommandCenter — orchestrator for Game Day full-screen overlay
// Preserves ALL Supabase queries, game logic, and state management
// =============================================================================

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import PostGameSummary from './PostGameSummary'
import { GAME_MODES, STAT_ACTIONS, VOLLEYBALL_POSITIONS, useGameDayTheme, Icons, ActionBar } from './GameDayHelpers'
import GameDayHero from './GameDayHero'
import LineupPanel from './LineupPanel'
import ScorePanel from './ScorePanel'
import AttendancePanel from './AttendancePanel'
import { QuickStatsPanel, StatPickerModal } from './GameDayStats'

function GameDayCommandCenter({ event, team, onClose, onSave, showToast }) {
  const { user } = useAuth()
  const theme = useGameDayTheme()

  // Core state
  const [mode, setMode] = useState(GAME_MODES.PRE_GAME)
  const [roster, setRoster] = useState([])
  const [rsvps, setRsvps] = useState({})
  const [attendance, setAttendance] = useState({})
  const [loading, setLoading] = useState(true)
  const [seasonRecord, setSeasonRecord] = useState({ wins: 0, losses: 0, recentForm: [] })

  // Lineup state
  const [lineup, setLineup] = useState({})
  const [liberoId, setLiberoId] = useState(null)
  const [rotation, setRotation] = useState(0)

  // Scoring state
  const [currentSet, setCurrentSet] = useState(1)
  const [setScores, setSetScores] = useState([])
  const [ourScore, setOurScore] = useState(0)
  const [theirScore, setTheirScore] = useState(0)
  const [pointHistory, setPointHistory] = useState([])

  // Stats state
  const [stats, setStats] = useState({})
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [draggedPlayer, setDraggedPlayer] = useState(null)

  // ═══ DATA LOADING ═══
  useEffect(() => { loadData() }, [event?.id, team?.id])

  async function loadData() {
    setLoading(true)
    try {
      // Load roster
      const { data: players } = await supabase.from('team_players').select('*, players(*)').eq('team_id', team.id)
      const rosterData = (players || [])
        .map(tp => ({ ...tp.players, team_jersey: tp.jersey_number, team_position: tp.position, jersey_number: tp.jersey_number || tp.players?.jersey_number }))
        .filter(Boolean).sort((a, b) => (a.jersey_number || 99) - (b.jersey_number || 99))
      setRoster(rosterData)

      // Initialize stats for all players
      const initialStats = {}
      rosterData.forEach(p => { initialStats[p.id] = { kills: 0, aces: 0, blocks: 0, digs: 0, assists: 0, errors: 0 } })
      setStats(initialStats)

      // Load RSVPs
      const { data: rsvpData } = await supabase.from('event_rsvps').select('player_id, status').eq('event_id', event.id)
      const rsvpMap = {}
      rsvpData?.forEach(r => { rsvpMap[r.player_id] = r.status })
      setRsvps(rsvpMap)

      // Load existing lineup
      const { data: existingLineup } = await supabase.from('game_lineups').select('*').eq('event_id', event.id)
      if (existingLineup?.length > 0) {
        const lineupMap = {}
        existingLineup.forEach(l => {
          if (l.rotation_order) lineupMap[l.rotation_order] = l.player_id
          if (l.is_libero) setLiberoId(l.player_id)
        })
        setLineup(lineupMap)
      }

      // Load season record for hero
      if (event?.season_id) {
        const { data: games } = await supabase.from('schedule_events')
          .select('our_score, their_score, event_date')
          .eq('season_id', event.season_id).eq('event_type', 'game').eq('status', 'completed')
          .order('event_date', { ascending: false }).limit(10)
        if (games?.length) {
          const w = games.filter(g => g.our_score > g.their_score).length
          const l = games.filter(g => g.their_score > g.our_score).length
          const form = games.slice(0, 5).reverse().map(g => g.our_score > g.their_score ? 'W' : 'L')
          setSeasonRecord({ wins: w, losses: l, recentForm: form })
        }
      }
    } catch (err) { console.error('Error loading data:', err) }
    setLoading(false)
  }

  // ═══ LINEUP FUNCTIONS ═══
  function getPlayerAtPosition(positionId) {
    const order = [1, 2, 3, 4, 5, 6]
    const posIdx = order.indexOf(positionId)
    const srcIdx = (posIdx + rotation) % 6
    return lineup[order[srcIdx]]
  }

  function handleDrop(positionId) {
    return (e) => {
      e.preventDefault()
      const playerId = e.dataTransfer.getData('playerId')
      if (!playerId) return
      const newLineup = { ...lineup }
      Object.keys(newLineup).forEach(key => { if (newLineup[key] === playerId) delete newLineup[key] })
      const order = [1, 2, 3, 4, 5, 6]
      const posIdx = order.indexOf(positionId)
      const origIdx = (posIdx + rotation) % 6
      newLineup[order[origIdx]] = playerId
      setLineup(newLineup)
      setDraggedPlayer(null)
    }
  }

  function autoFillLineup() {
    const available = roster.filter(p => { const s = rsvps[p.id]; return s === 'yes' || s === 'attending' || !s })
    const newLineup = {}
    VOLLEYBALL_POSITIONS.slice(0, 6).forEach((pos, i) => { if (available[i]) newLineup[pos.id] = available[i].id })
    setLineup(newLineup)
    showToast?.('Lineup auto-filled!', 'success')
  }

  function clearLineup() { setLineup({}); setLiberoId(null) }

  // ═══ GAME FUNCTIONS ═══
  function startGame() {
    setMode(GAME_MODES.LIVE); setCurrentSet(1); setSetScores([]); setOurScore(0); setTheirScore(0)
    showToast?.('Match started! Good luck! 🏐', 'success')
  }
  function handleOurPoint() { setOurScore(p => p + 1); setPointHistory(p => [...p, { type: 'us', set: currentSet }]) }
  function handleTheirPoint() { setTheirScore(p => p + 1); setPointHistory(p => [...p, { type: 'them', set: currentSet }]) }
  function handleUndoPoint() {
    if (!pointHistory.length) return
    const last = pointHistory[pointHistory.length - 1]
    if (last.set !== currentSet) return
    if (last.type === 'us' && ourScore > 0) setOurScore(p => p - 1)
    else if (last.type === 'them' && theirScore > 0) setTheirScore(p => p - 1)
    setPointHistory(p => p.slice(0, -1))
  }

  function handleStatSelect(playerId, statKey) {
    setStats(prev => ({ ...prev, [playerId]: { ...prev[playerId], [statKey]: (prev[playerId]?.[statKey] || 0) + 1 } }))
    const action = STAT_ACTIONS.find(s => s.key === statKey)
    if (action?.points === 1) handleOurPoint()
    else if (action?.points === -1) handleTheirPoint()
    setSelectedPlayer(null)
    showToast?.(`${statKey.charAt(0).toUpperCase() + statKey.slice(1)} recorded!`, 'success')
  }

  function endSet() {
    setSetScores(prev => [...prev, { our: ourScore, their: theirScore }])
    const updated = [...setScores, { our: ourScore, their: theirScore }]
    const ourW = updated.filter(s => s.our > s.their).length
    const theirW = updated.filter(s => s.their > s.our).length
    if (ourW >= 2 || theirW >= 2) { setMode(GAME_MODES.POST_GAME) }
    else { setCurrentSet(p => p + 1); setOurScore(0); setTheirScore(0); setRotation(0); showToast?.(`Set ${currentSet} complete!`, 'info') }
  }

  function endGame() {
    if (ourScore > 0 || theirScore > 0) setSetScores(prev => [...prev, { our: ourScore, their: theirScore }])
    setMode(GAME_MODES.POST_GAME)
  }

  async function saveStats() {
    try {
      const records = Object.entries(stats)
        .filter(([_, ps]) => Object.values(ps || {}).some(v => v > 0))
        .map(([playerId, ps]) => ({
          event_id: event.id, player_id: playerId, team_id: team.id,
          kills: ps.kills || 0, aces: ps.aces || 0, blocks: ps.blocks || 0,
          digs: ps.digs || 0, assists: ps.assists || 0, service_errors: ps.errors || 0,
          points: (ps.kills || 0) + (ps.aces || 0) + (ps.blocks || 0), created_by: user?.id,
        }))
      if (records.length > 0) {
        await supabase.from('game_player_stats').delete().eq('event_id', event.id)
        const { error } = await supabase.from('game_player_stats').insert(records)
        if (error) throw error
      }
      const ourSW = setScores.filter(s => s.our > s.their).length
      const theirSW = setScores.filter(s => s.their > s.our).length
      await supabase.from('schedule_events').update({ our_score: ourSW, their_score: theirSW, status: 'completed' }).eq('id', event.id)
      showToast?.('Game stats saved successfully!', 'success')
      onSave?.(); onClose?.()
    } catch (err) { console.error('Error saving stats:', err); showToast?.('Error saving stats', 'error') }
  }

  // ═══ DERIVED ═══
  const startersCount = Object.keys(lineup).length
  const canStartGame = startersCount >= 6

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-[60]" style={{ backgroundColor: theme.pageBg }}>
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 font-medium text-2xl text-white">Loading Game Day...</p>
        </div>
      </div>
    )
  }

  // ═══ RENDER ═══
  return (
    <div className="fixed inset-0 flex flex-col z-[60] overflow-hidden"
      style={{ backgroundColor: theme.pageBg, backgroundImage: 'linear-gradient(rgba(16,40,76,0.06) 1px,transparent 1px), linear-gradient(90deg,rgba(16,40,76,0.06) 1px,transparent 1px)', backgroundSize: '40px 40px' }}>

      {/* Header */}
      <header className="px-5 py-4 flex items-center justify-between" style={{ backgroundColor: theme.headerBg, borderBottom: `1px solid ${theme.border}` }}>
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-3 rounded-xl transition" style={{ backgroundColor: theme.buttonBg }}>
            <Icons.X className="w-5 h-5" style={{ color: theme.textMuted }} />
          </button>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏐</span>
            <div>
              <h1 className="text-4xl font-black tracking-wider text-white">MISSION CONTROL</h1>
              <p className="text-amber-400 text-base font-bold tracking-widest">
                {mode === GAME_MODES.PRE_GAME ? 'PRE-GAME SETUP' : mode === GAME_MODES.LIVE ? '● LIVE OPERATIONS' : 'POST-GAME DEBRIEF'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {mode === GAME_MODES.PRE_GAME && (
            <>
              <button onClick={autoFillLineup} className="px-5 py-3 bg-[#10284C]/30 hover:bg-[#10284C]/50 text-[#4BB9EC] rounded-xl text-xl font-semibold transition border border-[#10284C]/50">Auto-Fill</button>
              <button onClick={clearLineup} className="px-5 py-3 rounded-xl text-xl font-semibold transition" style={{ backgroundColor: theme.buttonBg, color: theme.textSecondary }}>Clear</button>
            </>
          )}
          <div className="px-5 py-3 rounded-xl text-center" style={{ backgroundColor: theme.buttonBg }}>
            <p className="text-lg" style={{ color: theme.textMuted }}>Starters</p>
            <p className={`text-3xl font-bold ${startersCount >= 6 ? 'text-emerald-400' : 'text-amber-400'}`}>{startersCount}/6</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Hero */}
        <GameDayHero event={event} team={team} mode={mode} seasonRecord={seasonRecord} />

        {/* Two-column grid: Lineup | Score + Attendance + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <LineupPanel roster={roster} lineup={lineup} liberoId={liberoId} rotation={rotation}
              rsvps={rsvps} mode={mode} draggedPlayer={draggedPlayer} stats={stats} theme={theme}
              getPlayerAtPosition={getPlayerAtPosition} handleDrop={handleDrop}
              setDraggedPlayer={setDraggedPlayer} setSelectedPlayer={setSelectedPlayer} setLiberoId={setLiberoId} />
          </div>
          <div className="space-y-5">
            <ScorePanel mode={mode} ourScore={ourScore} theirScore={theirScore} setScores={setScores}
              currentSet={currentSet} teamName={team?.name} opponentName={event?.opponent_name}
              onOurPoint={handleOurPoint} onTheirPoint={handleTheirPoint} onUndoPoint={handleUndoPoint} theme={theme} />
            <AttendancePanel roster={roster} rsvps={rsvps} attendance={attendance}
              onToggle={(id, status) => setAttendance(p => ({ ...p, [id]: status }))} theme={theme} />
            {mode === GAME_MODES.LIVE && <QuickStatsPanel stats={stats} roster={roster} theme={theme} />}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <ActionBar mode={mode} onRotate={() => setRotation(p => (p + 1) % 6)}
        onTimeout={() => setMode(GAME_MODES.TIMEOUT)} onSubstitute={() => {}}
        onStartGame={startGame} onEndSet={endSet} onEndGame={endGame}
        rotation={rotation} canStartGame={canStartGame} theme={theme} />

      {/* Modals */}
      {selectedPlayer && mode === GAME_MODES.LIVE && (
        <StatPickerModal player={selectedPlayer} onSelect={handleStatSelect} onClose={() => setSelectedPlayer(null)} theme={theme} />
      )}
      {mode === GAME_MODES.POST_GAME && (
        <PostGameSummary setScores={setScores} stats={stats} roster={roster} teamName={team?.name}
          opponentName={event?.opponent_name} onClose={onClose} onSaveStats={saveStats} theme={theme} />
      )}
    </div>
  )
}

export { GameDayCommandCenter, GAME_MODES }
