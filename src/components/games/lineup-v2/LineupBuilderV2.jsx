import { useState, useEffect } from 'react'
import { useTheme, useThemeClasses } from '../../../contexts/ThemeContext'
import { useAuth } from '../../../contexts/AuthContext'
import { supabase } from '../../../lib/supabase'
import { SPORT_CONFIGS } from '../../../constants/sportConfigs'
import HeaderBar from './HeaderBar'
import CourtView from './CourtView'
import RightPanel from './RightPanel'
import ControlBar from './ControlBar'
import { SaveTemplateModal, LoadTemplateDropdown, useTemplateAutoLoad } from './TemplateManager'

export default function LineupBuilderV2({ event, team, sport = 'volleyball', onClose, onSave, showToast }) {
  const { isDark } = useTheme()
  const tc = useThemeClasses()
  const { user } = useAuth()

  // ============================================
  // STATE — same as V1 AdvancedLineupBuilder
  // ============================================
  const [roster, setRoster] = useState([])
  const [rsvps, setRsvps] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const sportKey = sport?.toLowerCase()?.replace(/\s+/g, '') || 'volleyball'
  const sportConfig = SPORT_CONFIGS[sportKey] || SPORT_CONFIGS.volleyball
  const formations = sportConfig.formations || {}
  const defaultFormation = Object.keys(formations)[0] || '5-1'

  const [formation, setFormation] = useState(defaultFormation)
  const [lineup, setLineup] = useState({})        // { positionId: playerId }
  const [liberoId, setLiberoId] = useState(null)
  const [plannedSubs, setPlannedSubs] = useState([])  // [{ id, rotation, outPlayerId, inPlayerId }]
  const [benchQueue, setBenchQueue] = useState([])     // Ordered bench for 6-6 rotation

  const [currentSet, setCurrentSet] = useState(1)
  const [setLineups, setSetLineups] = useState({})
  const [totalSets, setTotalSets] = useState(1)

  const [currentRotation, setCurrentRotation] = useState(0)
  const [draggedPlayer, setDraggedPlayer] = useState(null)
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [showLoadTemplate, setShowLoadTemplate] = useState(false)

  const positions = formations[formation]?.positions || []

  // ============================================
  // DATA LOADING — ported from V1
  // ============================================
  useEffect(() => {
    if (event?.id && team?.id) loadData()
  }, [event?.id, team?.id])

  async function loadData() {
    setLoading(true)
    try {
      // Load roster
      const { data: players } = await supabase
        .from('team_players')
        .select('*, players(*)')
        .eq('team_id', team.id)

      const rosterData = (players || [])
        .map(tp => ({
          ...tp.players,
          team_jersey: tp.jersey_number,
          team_position: tp.position,
          jersey_number: tp.jersey_number || tp.players?.jersey_number
        }))
        .filter(Boolean)
        .sort((a, b) => (a.jersey_number || 99) - (b.jersey_number || 99))

      setRoster(rosterData)

      // Load RSVPs
      const { data: rsvpData } = await supabase
        .from('event_rsvps')
        .select('player_id, status')
        .eq('event_id', event.id)

      const rsvpMap = {}
      rsvpData?.forEach(r => { rsvpMap[r.player_id] = r.status })
      setRsvps(rsvpMap)

      // Load existing lineup
      const { data: existingLineup } = await supabase
        .from('game_lineups')
        .select('*')
        .eq('event_id', event.id)

      if (existingLineup?.length > 0) {
        // Restore formation from saved data
        const savedFormation = existingLineup[0]?.formation_type
        if (savedFormation && formations[savedFormation]) {
          setFormation(savedFormation)
        }

        // Group by set_number for per-set lineups
        const grouped = {}
        let maxSet = 1
        existingLineup.forEach(l => {
          const setNum = l.set_number || 1
          if (setNum > maxSet) maxSet = setNum
          if (!grouped[setNum]) grouped[setNum] = {}
          if (l.rotation_order) grouped[setNum][l.rotation_order] = l.player_id
          if (l.is_libero) setLiberoId(l.player_id)
        })
        setSetLineups(grouped)
        setLineup(grouped[1] || {})
        if (maxSet > 1) setTotalSets(maxSet)
      }
    } catch (err) {
      console.error('Error loading lineup data:', err)
    }
    setLoading(false)
  }

  // ============================================
  // TEMPLATE AUTO-LOAD
  // ============================================
  useTemplateAutoLoad({
    team, roster, formations, lineup,
    setLineup, setFormation, setLiberoId, setSetLineups, showToast,
  })

  function handleApplyTemplate({ lineup: newLineup, formation: newFormation, liberoId: newLibero }) {
    if (newFormation && formations[newFormation]) setFormation(newFormation)
    setLineup(newLineup)
    setSetLineups(prev => ({ ...prev, [currentSet]: newLineup }))
    if (newLibero) setLiberoId(newLibero)
  }

  // ============================================
  // ROTATION LOGIC — ported from V1
  // ============================================
  function getPlayerAtPosition(positionId) {
    if (!sportConfig.hasRotations || currentRotation === 0) {
      return lineup[positionId]
    }
    const rotationOrder = [1, 2, 3, 4, 5, 6]
    const posIndex = rotationOrder.indexOf(positionId)
    const sourceIndex = (posIndex + currentRotation) % 6
    const sourcePosition = rotationOrder[sourceIndex]
    return lineup[sourcePosition]
  }

  function nextRotation() {
    if (!sportConfig.hasRotations) return
    if (formation === '6-6') {
      rotateRecreational()
      return
    }
    setCurrentRotation(prev => (prev + 1) % sportConfig.rotationCount)
  }

  function prevRotation() {
    if (!sportConfig.hasRotations) return
    if (formation === '6-6') return // 6-6 doesn't support reverse rotation
    setCurrentRotation(prev => (prev - 1 + sportConfig.rotationCount) % sportConfig.rotationCount)
  }

  function goToRotation(rot) {
    setCurrentRotation(rot)
  }

  // ============================================
  // DRAG-AND-DROP — ported from V1
  // ============================================
  function handleDragStart(e, player) {
    e.dataTransfer.setData('playerId', player.id)
    setDraggedPlayer(player)
  }

  function handleDragEnd() {
    setDraggedPlayer(null)
  }

  function handleDrop(positionId, playerId) {
    const newLineup = { ...lineup }
    const rotationOrder = [1, 2, 3, 4, 5, 6]

    // Map visual target position to original position
    const targetPosIndex = rotationOrder.indexOf(positionId)
    const targetOriginalIndex = (targetPosIndex + currentRotation) % 6
    const targetOriginalPosition = rotationOrder[targetOriginalIndex]

    // Find if incoming player is already on court (swap scenario)
    const sourceOriginalPosition = Object.keys(newLineup).find(
      key => newLineup[key] === playerId
    )

    // Who is currently at the target original position?
    const targetPlayerId = newLineup[targetOriginalPosition]

    if (sourceOriginalPosition) {
      // Player is already on court — swap or move
      if (targetPlayerId) {
        // SWAP: put target player at source position
        newLineup[sourceOriginalPosition] = targetPlayerId
      } else {
        // MOVE: just remove from source
        delete newLineup[sourceOriginalPosition]
      }
    }

    // Place incoming player at target
    newLineup[targetOriginalPosition] = playerId

    setLineup(newLineup)
    setSetLineups(prev => ({ ...prev, [currentSet]: newLineup }))
  }

  function handleRemovePlayer(positionId) {
    const rotationOrder = [1, 2, 3, 4, 5, 6]
    const posIndex = rotationOrder.indexOf(positionId)
    const originalIndex = (posIndex + currentRotation) % 6
    const originalPosition = rotationOrder[originalIndex]

    const newLineup = { ...lineup }
    delete newLineup[originalPosition]
    setLineup(newLineup)
    setSetLineups(prev => ({ ...prev, [currentSet]: newLineup }))
  }

  // ============================================
  // AUTO-FILL — ported from V1
  // ============================================
  function autoFillLineup() {
    const available = roster.filter(p => {
      const status = rsvps[p.id]
      return status === 'yes' || status === 'attending' || !status
    })

    const newLineup = {}
    positions.slice(0, sportConfig.starterCount).forEach((pos, i) => {
      if (available[i]) {
        newLineup[pos.id] = available[i].id
      }
    })

    setLineup(newLineup)
    setSetLineups(prev => ({ ...prev, [currentSet]: newLineup }))
    showToast?.('Lineup auto-filled!', 'success')
  }

  function clearLineup() {
    setLineup({})
    setSetLineups(prev => ({ ...prev, [currentSet]: {} }))
    setCurrentRotation(0)
  }

  // ============================================
  // SET MANAGEMENT
  // ============================================
  function switchSet(setNum) {
    setSetLineups(prev => ({ ...prev, [currentSet]: lineup }))
    setCurrentSet(setNum)
    setLineup(setLineups[setNum] || {})
    setCurrentRotation(0)
  }

  function addSet() {
    if (totalSets < (sportConfig.maxSets || 5)) {
      setTotalSets(prev => prev + 1)
    }
  }

  function copyToAllSets() {
    const newSetLineups = {}
    for (let i = 1; i <= totalSets; i++) {
      newSetLineups[i] = { ...lineup }
    }
    setSetLineups(newSetLineups)
    showToast?.('Lineup copied to all sets!', 'success')
  }

  // ============================================
  // SAVE LINEUP — ported from V1
  // ============================================
  async function saveLineup() {
    setSaving(true)
    try {
      // Delete only records for the current set (per-set save)
      const deleteQuery = supabase.from('game_lineups').delete().eq('event_id', event.id)
      // If set_number column exists, scope delete to current set
      await deleteQuery.eq('set_number', currentSet)

      const records = []
      const positionList = formations[formation]?.positions || []

      Object.entries(lineup).forEach(([positionId, playerId]) => {
        const pos = positionList.find(p => p.id === parseInt(positionId))
        records.push({
          event_id: event.id,
          player_id: playerId,
          rotation_order: parseInt(positionId),
          is_starter: true,
          is_libero: playerId === liberoId,
          position: pos?.name,
          formation_type: formation,
          set_number: currentSet,
          team_id: team.id,
          position_role: pos?.role,
        })
      })

      // Add libero if not on court
      if (liberoId && !Object.values(lineup).includes(liberoId)) {
        records.push({
          event_id: event.id,
          player_id: liberoId,
          rotation_order: null,
          is_starter: false,
          is_libero: true,
          position: 'L',
          formation_type: formation,
          set_number: currentSet,
          team_id: team.id,
          position_role: 'L',
        })
      }

      if (records.length > 0) {
        const { error } = await supabase.from('game_lineups').insert(records)
        if (error) throw error
      }

      showToast?.('Lineup saved!', 'success')
      onSave?.()
      onClose()
    } catch (err) {
      console.error('Error saving lineup:', err)
      showToast?.('Error saving lineup', 'error')
    }
    setSaving(false)
  }

  // ============================================
  // SUBSTITUTION HANDLERS
  // ============================================
  function handleAddSub(sub) {
    setPlannedSubs(prev => [...prev, sub])
  }

  function handleRemoveSub(subId) {
    setPlannedSubs(prev => prev.filter(s => s.id !== subId))
  }

  // ============================================
  // FORMATION CHANGE
  // ============================================
  function handleFormationChange(newFormation) {
    setFormation(newFormation)
    // Clear libero when switching to 6-6 (no libero in rec)
    if (newFormation === '6-6') {
      setLiberoId(null)
    }
    // Reset rotation when changing formations
    setCurrentRotation(0)
  }

  // ============================================
  // 6-6 RECREATIONAL ROTATION
  // ============================================
  function rotateRecreational() {
    const newLineup = { ...lineup }
    const exitingPlayerId = newLineup[1]  // Player leaving P1

    // Shift everyone clockwise: P2→P1, P3→P2, P4→P3, P5→P4, P6→P5
    newLineup[1] = newLineup[2]
    newLineup[2] = newLineup[3]
    newLineup[3] = newLineup[4]
    newLineup[4] = newLineup[5]
    newLineup[5] = newLineup[6]

    // Next bench player enters at P6
    const onCourtIds = new Set(Object.values(newLineup).filter(Boolean))
    // Use benchQueue if set, otherwise use roster order
    const availableBench = benchQueue.length > 0
      ? benchQueue.filter(id => !onCourtIds.has(id))
      : roster.filter(p => !onCourtIds.has(p.id) && p.id !== exitingPlayerId).map(p => p.id)

    const nextPlayerId = availableBench[0]
    if (nextPlayerId) {
      newLineup[6] = nextPlayerId
      // Rotate bench queue: move used player to end
      if (benchQueue.length > 0) {
        setBenchQueue(prev => {
          const next = prev.filter(id => id !== nextPlayerId)
          if (exitingPlayerId) next.push(exitingPlayerId)
          return next
        })
      }
    } else {
      delete newLineup[6]
    }

    setLineup(newLineup)
    setSetLineups(prev => ({ ...prev, [currentSet]: newLineup }))
    setCurrentRotation(prev => prev + 1) // 6-6 can go beyond 6
  }

  // ============================================
  // VALIDATION
  // ============================================
  function validateLineup() {
    const errors = []
    const warnings = []

    // Check: correct number of starters
    const starterCount = Object.keys(lineup).length
    if (starterCount > 0 && starterCount < (sportConfig?.starterCount || 6)) {
      warnings.push(`Lineup incomplete: ${starterCount}/${sportConfig?.starterCount || 6} starters assigned`)
    }

    // Check: duplicate players
    const playerIds = Object.values(lineup)
    const dupes = playerIds.filter((id, i) => playerIds.indexOf(id) !== i)
    if (dupes.length > 0) {
      errors.push('Duplicate player detected in lineup')
    }

    // Check: multiple setters in 5-1 system
    if (formation === '5-1') {
      const setterPositions = Object.entries(lineup).filter(([posId]) => {
        const player = roster.find(p => p.id === lineup[posId])
        return player?.team_position?.toUpperCase() === 'S' || player?.team_position?.toUpperCase() === 'SETTER'
      })
      if (setterPositions.length > 1) {
        errors.push('Multiple Setters active in a 5-1 system')
      }
    }

    // Check: RSVP status
    Object.values(lineup).forEach(playerId => {
      const rsvp = rsvps[playerId]
      if (rsvp === 'no' || rsvp === 'not_attending') {
        const player = roster.find(p => p.id === playerId)
        warnings.push(`${player?.first_name || 'Player'} RSVP'd "No" but is in the lineup`)
      }
    })

    return { errors, warnings, isValid: errors.length === 0 }
  }

  const validation = validateLineup()

  // ============================================
  // RENDER
  // ============================================
  if (loading) {
    return (
      <div className={`fixed inset-0 z-[300] flex items-center justify-center ${isDark ? 'bg-lynx-midnight' : 'bg-lynx-cloud'}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
          <span className={`text-sm ${tc.textMuted}`}>Loading lineup...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`fixed inset-0 z-[300] flex flex-col ${isDark ? 'bg-lynx-midnight' : 'bg-lynx-cloud'}`}>
      {/* Header Bar */}
      <HeaderBar
        team={team}
        event={event}
        formation={formation}
        formations={formations}
        currentSet={currentSet}
        totalSets={totalSets}
        lineup={lineup}
        sportConfig={sportConfig}
        liberoId={liberoId}
        saving={saving}
        onSetChange={switchSet}
        onAddSet={addSet}
        onSave={saveLineup}
        onClose={onClose}
        onSaveTemplate={() => setShowSaveTemplate(true)}
        onLoadTemplate={() => setShowLoadTemplate(true)}
        onFormationChange={handleFormationChange}
      />

      {/* Validation Banners */}
      {validation.errors.map((err, i) => (
        <div key={`err-${i}`} className={`mx-4 mt-2 px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-medium ${
          isDark ? 'bg-red-500/15 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <span className="flex-shrink-0">⚠</span>
          {err}
        </div>
      ))}
      {validation.warnings.map((warn, i) => (
        <div key={`warn-${i}`} className={`mx-4 mt-2 px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-medium ${
          isDark ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}>
          <span className="flex-shrink-0">⚡</span>
          {warn}
        </div>
      ))}

      {/* Main Content: Court + Right Panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Court View */}
        <CourtView
          positions={positions}
          lineup={lineup}
          roster={roster}
          currentRotation={currentRotation}
          liberoId={liberoId}
          sportConfig={sportConfig}
          getPlayerAtPosition={getPlayerAtPosition}
          onDrop={handleDrop}
          onRemovePlayer={handleRemovePlayer}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onAutoFill={autoFillLineup}
          onClearLineup={clearLineup}
          onCopyToAllSets={copyToAllSets}
          isComplete={Object.keys(lineup).length >= (sportConfig?.starterCount || 6)}
          starterCount={Object.keys(lineup).length}
          maxStarters={sportConfig?.starterCount || 6}
        />

        {/* Right Panel */}
        <RightPanel
          roster={roster}
          lineup={lineup}
          rsvps={rsvps}
          liberoId={liberoId}
          plannedSubs={plannedSubs}
          formation={formation}
          positions={positions}
          currentRotation={currentRotation}
          sportConfig={sportConfig}
          formations={formations}
          getPlayerAtPosition={getPlayerAtPosition}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onSetLibero={setLiberoId}
          onRotationClick={goToRotation}
          onAddSub={handleAddSub}
          onRemoveSub={handleRemoveSub}
        />
      </div>

      {/* Control Bar */}
      <ControlBar
        currentRotation={currentRotation}
        sportConfig={sportConfig}
        lineup={lineup}
        roster={roster}
        getPlayerAtPosition={getPlayerAtPosition}
        onNextRotation={nextRotation}
        onPrevRotation={prevRotation}
        onResetRotation={goToRotation}
      />

      {/* Template Modals */}
      {showSaveTemplate && (
        <SaveTemplateModal
          team={team}
          formation={formation}
          lineup={lineup}
          liberoId={liberoId}
          formations={formations}
          sport={sport}
          userId={user?.id}
          isDark={isDark}
          tc={tc}
          showToast={showToast}
          onClose={() => setShowSaveTemplate(false)}
        />
      )}
      {showLoadTemplate && (
        <LoadTemplateDropdown
          team={team}
          roster={roster}
          formations={formations}
          isDark={isDark}
          tc={tc}
          showToast={showToast}
          onApply={handleApplyTemplate}
          onClose={() => setShowLoadTemplate(false)}
        />
      )}
    </div>
  )
}
