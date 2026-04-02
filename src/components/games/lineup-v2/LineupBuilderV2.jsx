import { useState, useEffect } from 'react'
import { useTheme, useThemeClasses } from '../../../contexts/ThemeContext'
import { useAuth } from '../../../contexts/AuthContext'
import { supabase } from '../../../lib/supabase'
import { SPORT_CONFIGS } from '../../../constants/sportConfigs'
import { PHASE_CONFIG } from '../../../constants/formationPhases'
import HeaderBar from './HeaderBar'
import SportFieldView from './SportFieldView'
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
  const [playerRoles, setPlayerRoles] = useState({})   // { playerId: 'S' } — assigned role follows player through rotations

  const [currentSet, setCurrentSet] = useState(1)
  const [setLineups, setSetLineups] = useState({})
  const [totalSets, setTotalSets] = useState(1)

  const [currentRotation, setCurrentRotation] = useState(0)
  const [courtPhase, setCourtPhase] = useState(null) // null | 'serve_receive' | 'offense' | 'defense'
  const [courtPhaseRotation, setCourtPhaseRotation] = useState(null) // 1-6 rotation number for phase view
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

      // Load skill ratings for overall rating display
      try {
        const playerIds = rosterData.map(p => p.id).filter(Boolean)
        if (playerIds.length > 0) {
          const { data: ratings } = await supabase
            .from('player_skill_ratings')
            .select('player_id, overall_rating')
            .in('player_id', playerIds)
            .order('created_at', { ascending: false })

          // Keep most recent rating per player, merge into roster
          const ratingMap = {}
          ;(ratings || []).forEach(r => {
            if (!ratingMap[r.player_id] && r.overall_rating != null) {
              ratingMap[r.player_id] = r.overall_rating
            }
          })
          // Enrich roster with ratings
          rosterData.forEach(p => { p.overall_rating = ratingMap[p.id] || null })
          setRoster([...rosterData]) // re-set to trigger re-render with ratings
        }
      } catch (e) {
        console.warn('Skill ratings fetch error (non-critical):', e)
      }

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
          if (l.rotation_order != null) grouped[setNum][l.rotation_order] = l.player_id
          if (l.is_libero) setLiberoId(l.player_id)
        })
        setSetLineups(grouped)
        setLineup(grouped[1] || {})
        if (maxSet > 1) setTotalSets(maxSet)
      }

      // Load planned subs & bench order metadata
      try {
        const { data: metadata } = await supabase
          .from('game_lineup_metadata')
          .select('*')
          .eq('event_id', event.id)

        if (metadata?.length > 0) {
          const metaForSet1 = metadata.find(m => m.set_number === 1) || metadata[0]
          if (metaForSet1?.planned_subs) {
            const subs = typeof metaForSet1.planned_subs === 'string'
              ? JSON.parse(metaForSet1.planned_subs)
              : metaForSet1.planned_subs
            setPlannedSubs(subs)
          }
          if (metaForSet1?.bench_order) {
            const bench = typeof metaForSet1.bench_order === 'string'
              ? JSON.parse(metaForSet1.bench_order)
              : metaForSet1.bench_order
            setBenchQueue(bench)
          }
        }
      } catch (e) {
        console.warn('Lineup metadata fetch error (non-critical):', e)
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

  // Get the effective player at a position considering planned substitutions
  function getEffectivePlayerAtPosition(positionId) {
    const basePlayerId = getPlayerAtPosition(positionId)
    if (!basePlayerId || plannedSubs.length === 0) return basePlayerId

    // Current rotation number is 1-indexed for subs, currentRotation is 0-indexed
    const rotNum = currentRotation + 1

    // Check if any sub replaces this player at this rotation
    for (const sub of plannedSubs) {
      if (sub.outPlayerId === basePlayerId && rotNum >= sub.rotation) {
        return sub.inPlayerId
      }
    }
    return basePlayerId
  }

  // Check if a position has a substituted player (for SUB badge display)
  function isPositionSubbed(positionId) {
    const basePlayerId = getPlayerAtPosition(positionId)
    const effectivePlayerId = getEffectivePlayerAtPosition(positionId)
    return basePlayerId !== effectivePlayerId
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

    // For sports with rotations (volleyball), map visual position to original
    let targetOriginalPosition = positionId
    if (sportConfig.hasRotations && currentRotation > 0) {
      const rotationOrder = [1, 2, 3, 4, 5, 6]
      const targetPosIndex = rotationOrder.indexOf(positionId)
      const targetOriginalIndex = (targetPosIndex + currentRotation) % 6
      targetOriginalPosition = rotationOrder[targetOriginalIndex]
    }

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

    // Capture the role from the target visual position for the player
    // Only set role if player doesn't already have one (first placement)
    const targetVisualPos = positions.find(p => p.id === positionId)
    if (targetVisualPos?.role && !playerRoles[playerId]) {
      setPlayerRoles(prev => ({ ...prev, [playerId]: targetVisualPos.role }))
    }

    setLineup(newLineup)
    setSetLineups(prev => ({ ...prev, [currentSet]: newLineup }))
  }

  function handleRemovePlayer(positionId) {
    // For sports with rotations, map visual position to original
    let originalPosition = positionId
    if (sportConfig.hasRotations && currentRotation > 0) {
      const rotationOrder = [1, 2, 3, 4, 5, 6]
      const posIndex = rotationOrder.indexOf(positionId)
      const originalIndex = (posIndex + currentRotation) % 6
      originalPosition = rotationOrder[originalIndex]
    }

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
    const newRoles = { ...playerRoles }
    positions.slice(0, sportConfig.starterCount).forEach((pos, i) => {
      if (available[i]) {
        newLineup[pos.id] = available[i].id
        if (pos.role) newRoles[available[i].id] = pos.role
      }
    })

    setLineup(newLineup)
    setSetLineups(prev => ({ ...prev, [currentSet]: newLineup }))
    setPlayerRoles(newRoles)
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
    if (totalSets < (sportConfig.timePeriod?.max || sportConfig.maxSets || 5)) {
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
        const posIdParsed = isNaN(parseInt(positionId)) ? positionId : parseInt(positionId)
        const pos = positionList.find(p => p.id === posIdParsed)
        records.push({
          event_id: event.id,
          player_id: playerId,
          rotation_order: typeof posIdParsed === 'number' ? posIdParsed : null,
          is_starter: true,
          is_libero: playerId === liberoId,
          position: pos?.name || positionId,
          formation_type: formation,
          set_number: currentSet,
          team_id: team.id,
          position_role: pos?.role || pos?.name,
          sport: sportKey,
        })
      })

      // Add libero if not on court (volleyball only)
      if (liberoId && sportConfig.hasLibero !== false && !Object.values(lineup).includes(liberoId)) {
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
          sport: sportKey,
        })
      }

      if (records.length > 0) {
        const { error } = await supabase.from('game_lineups').insert(records)
        if (error) throw error
      }

      // Save planned subs & bench order as metadata
      if (plannedSubs.length > 0 || benchQueue.length > 0) {
        await supabase.from('game_lineup_metadata').upsert({
          event_id: event.id,
          set_number: currentSet,
          team_id: team.id,
          planned_subs: plannedSubs,
          bench_order: benchQueue,
          sport: sportKey,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'event_id,set_number' })
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
  // FORMATION PHASE HANDLERS
  // ============================================
  function handlePhaseClick(phaseKey, rotationNum) {
    if (courtPhase === phaseKey && courtPhaseRotation === rotationNum) {
      // Toggle off if clicking the same phase+rotation
      setCourtPhase(null)
      setCourtPhaseRotation(null)
    } else {
      setCourtPhase(phaseKey)
      setCourtPhaseRotation(rotationNum)
      // Also jump to the corresponding rotation (0-indexed)
      setCurrentRotation(rotationNum - 1)
    }
  }

  function clearCourtPhase() {
    setCourtPhase(null)
    setCourtPhaseRotation(null)
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
      <div className={`fixed z-[50] flex items-center justify-center ${isDark ? 'bg-lynx-midnight' : 'bg-lynx-cloud'}`}
        style={{ top: 'var(--v2-topbar-height, 56px)', left: 'var(--v2-sidebar-width, 230px)', right: 0, bottom: 0 }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
          <span className={`text-sm ${tc.textMuted}`}>Loading lineup...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`fixed z-[50] flex flex-col ${isDark ? 'bg-lynx-midnight' : 'bg-lynx-cloud'}`}
      style={{ top: 'var(--v2-topbar-height, 56px)', left: 'var(--v2-sidebar-width, 230px)', right: 0, bottom: 0 }}>
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

      {/* Phase Banner — shown when viewing a formation phase */}
      {courtPhase && PHASE_CONFIG[courtPhase] && (
        <div
          className={`mx-4 mt-2 px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-medium border`}
          style={{
            backgroundColor: PHASE_CONFIG[courtPhase].color + '15',
            borderColor: PHASE_CONFIG[courtPhase].color + '30',
            color: PHASE_CONFIG[courtPhase].color,
          }}
        >
          <span>{PHASE_CONFIG[courtPhase].icon}</span>
          <span className="font-bold">
            Viewing: {PHASE_CONFIG[courtPhase].label} — Rotation {courtPhaseRotation}
          </span>
          <button
            onClick={clearCourtPhase}
            className="ml-auto px-2 py-0.5 rounded-lg text-[10px] font-semibold hover:opacity-80 transition-opacity"
            style={{ backgroundColor: PHASE_CONFIG[courtPhase].color + '20' }}
          >
            Back to Base
          </button>
        </div>
      )}

      {/* Main Content: Court + Right Panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sport Field View */}
        <SportFieldView
          sport={sport}
          positions={positions}
          lineup={lineup}
          roster={roster}
          currentRotation={currentRotation}
          liberoId={liberoId}
          sportConfig={sportConfig}
          playerRoles={playerRoles}
          courtPhase={courtPhase}
          courtPhaseRotation={courtPhaseRotation}
          formation={formation}
          getPlayerAtPosition={getEffectivePlayerAtPosition}
          isPositionSubbed={isPositionSubbed}
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
          courtPhase={courtPhase}
          getPlayerAtPosition={getPlayerAtPosition}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onSetLibero={setLiberoId}
          onRotationClick={goToRotation}
          onAddSub={handleAddSub}
          onRemoveSub={handleRemoveSub}
          onPhaseClick={handlePhaseClick}
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

      {/* Expansion Area — reserved for bench strip, substitution timeline, court rating */}
      <div
        className={`flex-shrink-0 border-t ${
          isDark ? 'bg-lynx-graphite/50 border-lynx-border-dark' : 'bg-lynx-frost/50 border-lynx-silver'
        }`}
        style={{ height: 120 }}
      >
        <div className={`flex items-center justify-center h-full ${tc.textMuted}`}>
          <span className="text-[11px] font-medium tracking-wide opacity-40">Bench &middot; Substitution Timeline &middot; Court Rating</span>
        </div>
      </div>

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
