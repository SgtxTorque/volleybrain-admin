import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  Check, AlertTriangle, ChevronLeft, ChevronRight, Mail,
  Users, Shield, ClipboardList, Award, CheckCircle2
} from 'lucide-react'

const POSITIONS = ['OH', 'S', 'MB', 'OPP', 'L', 'DS', 'RS']
const POSITION_NAMES = {
  'OH': 'Outside Hitter', 'S': 'Setter', 'MB': 'Middle Blocker',
  'OPP': 'Opposite', 'L': 'Libero', 'DS': 'Defensive Specialist', 'RS': 'Right Side',
}

const STEPS = [
  { label: 'Review Roster', icon: Users },
  { label: 'Positions', icon: Shield },
  { label: 'Jerseys', icon: Award },
  { label: 'Waivers', icon: ClipboardList },
  { label: 'Evaluation', icon: ClipboardList },
  { label: 'Confirmation', icon: CheckCircle2 },
]

export default function SeasonSetupWizard({
  roster,
  teamId,
  seasonId,
  onComplete,
  onStartEvaluation,
  onReloadRoster,
  showToast,
}) {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const [step, setStep] = useState(0)

  // Step 1: Review — confirmed players
  const [confirmedPlayers, setConfirmedPlayers] = useState(new Set())

  // Step 2: Positions
  const [positionEdits, setPositionEdits] = useState({}) // player_id -> position

  // Step 3: Jerseys
  const [jerseyEdits, setJerseyEdits] = useState({}) // player_id -> jersey number string

  // Step 4: Waivers
  const [skippedWaivers, setSkippedWaivers] = useState(new Set())
  const [sendingReminder, setSendingReminder] = useState(null)

  // Step 5: Evaluation choice
  const [evalChoice, setEvalChoice] = useState(null) // 'yes' | 'no'

  // Saving
  const [saving, setSaving] = useState(false)

  const primaryText = isDark ? 'text-white' : 'text-lynx-navy'
  const secondaryText = isDark ? 'text-slate-400' : 'text-slate-500'
  const cardBg = isDark
    ? 'bg-[#141E2E] border-white/[0.06]'
    : 'bg-white border-slate-200'

  // Initialize edits from roster data
  useEffect(() => {
    if (!roster?.length) return
    const posEdits = {}
    const jersEdits = {}
    roster.forEach(p => {
      const pos = p.player?.position || p.positions?.primary_position || ''
      posEdits[p.player_id] = pos
      const jersey = p.jersey_number ?? p.player?.jersey_number ?? ''
      jersEdits[p.player_id] = jersey !== null && jersey !== undefined ? String(jersey) : ''
    })
    setPositionEdits(posEdits)
    setJerseyEdits(jersEdits)
    // Auto-confirm all players initially
    setConfirmedPlayers(new Set(roster.map(p => p.player_id)))
  }, [roster])

  function playerName(p) {
    return `${p.player?.first_name || ''} ${p.player?.last_name || ''}`.trim() || 'Unknown'
  }

  // Jersey conflict detection
  const jerseyConflicts = useMemo(() => {
    const counts = {}
    Object.entries(jerseyEdits).forEach(([pid, num]) => {
      if (num && num.trim()) {
        const key = num.trim()
        if (!counts[key]) counts[key] = []
        counts[key].push(pid)
      }
    })
    const conflicts = new Set()
    Object.values(counts).forEach(pids => {
      if (pids.length > 1) pids.forEach(pid => conflicts.add(pid))
    })
    return conflicts
  }, [jerseyEdits])

  // Taken jersey numbers (for the grid)
  const takenJerseys = useMemo(() => {
    const taken = {}
    Object.entries(jerseyEdits).forEach(([pid, num]) => {
      if (num && num.trim()) taken[num.trim()] = pid
    })
    return taken
  }, [jerseyEdits])

  // Save positions (Step 2)
  async function savePositions() {
    setSaving(true)
    try {
      for (const [playerId, pos] of Object.entries(positionEdits)) {
        if (!pos) continue
        await supabase.from('players').update({ position: pos }).eq('id', playerId)
        await supabase.from('player_positions').upsert({
          player_id: playerId,
          primary_position: pos,
        }, { onConflict: 'player_id' })
      }
      showToast?.('Positions saved', 'success')
    } catch (err) {
      console.error('savePositions error:', err)
      showToast?.('Failed to save positions', 'error')
    }
    setSaving(false)
  }

  // Save jerseys (Step 3)
  async function saveJerseys() {
    setSaving(true)
    try {
      for (const [playerId, num] of Object.entries(jerseyEdits)) {
        const jerseyVal = num && num.trim() ? parseInt(num.trim(), 10) : null
        await supabase.from('team_players')
          .update({ jersey_number: jerseyVal })
          .eq('team_id', teamId)
          .eq('player_id', playerId)
      }
      showToast?.('Jersey numbers saved', 'success')
    } catch (err) {
      console.error('saveJerseys error:', err)
      showToast?.('Failed to save jerseys', 'error')
    }
    setSaving(false)
  }

  // Send waiver reminder (Step 4)
  async function sendWaiverReminder(playerId) {
    setSendingReminder(playerId)
    try {
      // For now, show the parent email and mark as "reminder sent"
      showToast?.('Waiver reminder action noted', 'success')
    } catch (err) {
      console.error('sendWaiverReminder error:', err)
    }
    setSendingReminder(null)
  }

  // Advance step with auto-save
  async function handleNext() {
    if (step === 1) await savePositions()
    if (step === 2) await saveJerseys()
    if (step === 4 && evalChoice === 'yes') {
      // Launch evaluation mode
      onStartEvaluation?.()
      return
    }
    if (step === 5) {
      // Complete
      localStorage.setItem(`seasonSetupComplete_${teamId}_${seasonId}`, 'true')
      onReloadRoster?.()
      onComplete?.()
      return
    }
    setStep(s => Math.min(s + 1, 5))
  }

  function handleBack() {
    setStep(s => Math.max(s - 1, 0))
  }

  // Stats for summary
  const stats = useMemo(() => {
    const total = roster?.length || 0
    const withJersey = Object.values(jerseyEdits).filter(v => v && v.trim()).length
    const withPosition = Object.values(positionEdits).filter(v => v).length
    const waiversSigned = roster?.filter(p => p.waiverSigned).length || 0
    return { total, withJersey, withPosition, waiversSigned }
  }, [roster, jerseyEdits, positionEdits])

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className={`${cardBg} border rounded-xl p-4`}>
        <div className="flex items-center justify-between mb-3">
          {STEPS.map((s, i) => {
            const StepIcon = s.icon
            const isActive = i === step
            const isComplete = i < step
            return (
              <button
                key={i}
                onClick={() => i < step && setStep(i)}
                className={`flex flex-col items-center gap-1 flex-1 transition-all ${
                  i < step ? 'cursor-pointer' : i === step ? '' : 'opacity-40 cursor-default'
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  isComplete
                    ? 'bg-emerald-500 text-white'
                    : isActive
                    ? 'bg-lynx-sky text-white'
                    : isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-400'
                }`}>
                  {isComplete ? <Check className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                </div>
                <span className={`text-[10px] font-medium ${
                  isActive ? 'text-lynx-sky' : isComplete ? 'text-emerald-500' : secondaryText
                }`}>{s.label}</span>
              </button>
            )
          })}
        </div>
        {/* Progress line */}
        <div className={`h-1 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
          <div
            className="h-full rounded-full bg-lynx-sky transition-all duration-300"
            style={{ width: `${((step) / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className={`${cardBg} border rounded-xl p-6`}>
        {/* ═══ STEP 1: Review Roster ═══ */}
        {step === 0 && (
          <div>
            <h3 className={`text-lg font-bold mb-1 ${primaryText}`}>Review Your Roster</h3>
            <p className={`text-sm mb-4 ${secondaryText}`}>Confirm that all players assigned to this team are correct.</p>

            {roster?.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-10 h-10 text-lynx-sky mx-auto mb-2" />
                <p className={`text-sm font-semibold ${primaryText}`}>No players on this team</p>
                <p className={`text-xs mt-1 ${secondaryText}`}>Ask your admin to assign players first.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {roster?.map(p => (
                  <div
                    key={p.player_id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition ${
                      confirmedPlayers.has(p.player_id)
                        ? isDark ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-emerald-200 bg-emerald-50/50'
                        : isDark ? 'border-white/[0.06]' : 'border-slate-200'
                    }`}
                  >
                    {/* Photo */}
                    <div className="w-10 h-10 rounded-full bg-lynx-sky/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {p.player?.photo_url ? (
                        <img src={p.player.photo_url} alt="" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <span className="text-sm font-bold text-lynx-sky">
                          {(p.player?.first_name?.[0] || '')}{(p.player?.last_name?.[0] || '')}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${primaryText}`}>{playerName(p)}</span>
                        {p.isNew && <span className="text-[10px] bg-lynx-sky/10 text-lynx-sky px-1.5 py-0.5 rounded-full font-bold">NEW</span>}
                        {p.player?.position && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                            {p.player.position}
                          </span>
                        )}
                      </div>
                      <span className={`text-xs ${secondaryText}`}>
                        {p.player?.grade ? `Grade ${p.player.grade}` : ''}
                        {p.jersey_number || p.player?.jersey_number ? ` · #${p.jersey_number || p.player?.jersey_number}` : ''}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        const next = new Set(confirmedPlayers)
                        if (next.has(p.player_id)) next.delete(p.player_id)
                        else next.add(p.player_id)
                        setConfirmedPlayers(next)
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition flex-shrink-0 ${
                        confirmedPlayers.has(p.player_id)
                          ? 'bg-emerald-500 text-white'
                          : isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <p className={`text-xs mt-2 ${secondaryText}`}>
                  {confirmedPlayers.size}/{roster?.length} confirmed
                </p>
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 2: Assign Positions ═══ */}
        {step === 1 && (
          <div>
            <h3 className={`text-lg font-bold mb-1 ${primaryText}`}>Assign Positions</h3>
            <p className={`text-sm mb-4 ${secondaryText}`}>Set each player's primary position. Pre-filled from existing data.</p>

            <div className="space-y-2">
              {roster?.map(p => (
                <div key={p.player_id} className={`flex items-center gap-3 p-3 rounded-lg border ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
                  <div className="w-8 h-8 rounded-full bg-lynx-sky/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {p.player?.photo_url ? (
                      <img src={p.player.photo_url} alt="" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span className="text-xs font-bold text-lynx-sky">
                        {(p.player?.first_name?.[0] || '')}{(p.player?.last_name?.[0] || '')}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-semibold ${primaryText}`}>{playerName(p)}</span>
                  </div>
                  <select
                    value={positionEdits[p.player_id] || ''}
                    onChange={e => setPositionEdits(prev => ({ ...prev, [p.player_id]: e.target.value }))}
                    className={`text-sm rounded-lg px-3 py-1.5 border font-mono ${
                      isDark
                        ? 'bg-slate-800 border-white/[0.06] text-white'
                        : 'bg-white border-slate-200 text-lynx-navy'
                    }`}
                  >
                    <option value="">—</option>
                    {POSITIONS.map(pos => (
                      <option key={pos} value={pos}>{pos} — {POSITION_NAMES[pos]}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ STEP 3: Assign Jerseys ═══ */}
        {step === 2 && (
          <div>
            <h3 className={`text-lg font-bold mb-1 ${primaryText}`}>Assign Jersey Numbers</h3>
            <p className={`text-sm mb-4 ${secondaryText}`}>Assign jersey numbers. Conflicts are highlighted in red.</p>

            {/* Jersey number availability grid */}
            <div className={`mb-4 p-3 rounded-lg border ${isDark ? 'border-white/[0.06] bg-slate-800/50' : 'border-slate-200 bg-slate-50'}`}>
              <p className={`text-xs font-semibold mb-2 ${secondaryText}`}>Number Availability (1-30)</p>
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: 30 }, (_, i) => i + 1).map(num => {
                  const taken = takenJerseys[String(num)]
                  return (
                    <div
                      key={num}
                      className={`w-8 h-8 rounded flex items-center justify-center text-xs font-mono ${
                        taken
                          ? 'bg-lynx-sky/20 text-lynx-sky font-bold'
                          : isDark ? 'bg-slate-700 text-slate-500' : 'bg-slate-100 text-slate-400'
                      }`}
                      title={taken ? `Assigned to ${roster?.find(r => r.player_id === taken)?.player?.first_name || '?'}` : 'Available'}
                    >
                      {num}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              {roster?.map(p => {
                const hasConflict = jerseyConflicts.has(p.player_id)
                const prefs = [p.player?.jersey_pref_1, p.player?.jersey_pref_2, p.player?.jersey_pref_3].filter(Boolean)
                return (
                  <div key={p.player_id} className={`flex items-center gap-3 p-3 rounded-lg border ${
                    hasConflict
                      ? 'border-red-400 bg-red-500/5'
                      : isDark ? 'border-white/[0.06]' : 'border-slate-200'
                  }`}>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-semibold ${primaryText}`}>{playerName(p)}</span>
                      {prefs.length > 0 && (
                        <div className={`text-[10px] mt-0.5 ${secondaryText}`}>
                          Preferences: {prefs.join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={jerseyEdits[p.player_id] || ''}
                        onChange={e => setJerseyEdits(prev => ({ ...prev, [p.player_id]: e.target.value }))}
                        className={`w-16 text-center text-sm rounded-lg px-2 py-1.5 border font-mono ${
                          hasConflict
                            ? 'border-red-400 text-red-500 bg-red-500/5'
                            : isDark
                            ? 'bg-slate-800 border-white/[0.06] text-white'
                            : 'bg-white border-slate-200 text-lynx-navy'
                        }`}
                        placeholder="#"
                      />
                      {hasConflict && <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ═══ STEP 4: Verify Waivers ═══ */}
        {step === 3 && (
          <div>
            <h3 className={`text-lg font-bold mb-1 ${primaryText}`}>Verify Waivers</h3>
            <p className={`text-sm mb-4 ${secondaryText}`}>Review which players have signed waivers.</p>

            <div className="space-y-2">
              {roster?.map(p => {
                const signed = p.waiverSigned
                const isSkipped = skippedWaivers.has(p.player_id)
                return (
                  <div key={p.player_id} className={`flex items-center gap-3 p-3 rounded-lg border ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      signed
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : isSkipped
                        ? isDark ? 'bg-slate-700 text-slate-500' : 'bg-slate-100 text-slate-400'
                        : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {signed ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-semibold ${primaryText}`}>{playerName(p)}</span>
                      <div className={`text-xs ${secondaryText}`}>
                        {signed ? 'Waiver signed' : isSkipped ? 'Skipped' : 'Unsigned'}
                        {!signed && p.player?.parent_email && ` · ${p.player.parent_email}`}
                      </div>
                    </div>
                    {!signed && !isSkipped && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => sendWaiverReminder(p.player_id)}
                          disabled={sendingReminder === p.player_id}
                          className="flex items-center gap-1 text-xs font-semibold text-lynx-sky hover:text-lynx-deep transition px-2 py-1 rounded-lg bg-lynx-sky/10"
                        >
                          <Mail className="w-3 h-3" />
                          Remind
                        </button>
                        <button
                          onClick={() => setSkippedWaivers(prev => new Set(prev).add(p.player_id))}
                          className={`text-xs font-semibold px-2 py-1 rounded-lg ${isDark ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                          Skip
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
              <p className={`text-xs ${secondaryText}`}>
                {roster?.filter(p => p.waiverSigned).length}/{roster?.length} waivers signed
                {skippedWaivers.size > 0 && ` · ${skippedWaivers.size} skipped`}
              </p>
            </div>
          </div>
        )}

        {/* ═══ STEP 5: Initial Evaluation ═══ */}
        {step === 4 && (
          <div className="text-center py-6">
            <div className={`w-16 h-16 rounded-xl mx-auto flex items-center justify-center mb-4 ${isDark ? 'bg-lynx-sky/10' : 'bg-lynx-ice'}`}>
              <ClipboardList className="w-8 h-8 text-lynx-sky" />
            </div>
            <h3 className={`text-lg font-bold mb-2 ${primaryText}`}>Initial Skill Evaluation</h3>
            <p className={`text-sm mb-6 ${secondaryText}`}>
              Would you like to do an initial pre-season evaluation of your players?
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
              <button
                onClick={() => setEvalChoice('yes')}
                className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition ${
                  evalChoice === 'yes'
                    ? 'bg-lynx-sky text-white'
                    : isDark
                    ? 'bg-slate-700 text-white hover:bg-slate-600'
                    : 'bg-slate-100 text-lynx-navy hover:bg-slate-200'
                }`}
              >
                Yes, evaluate now
              </button>
              <button
                onClick={() => setEvalChoice('no')}
                className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition ${
                  evalChoice === 'no'
                    ? 'bg-lynx-sky text-white'
                    : isDark
                    ? 'bg-slate-700 text-white hover:bg-slate-600'
                    : 'bg-slate-100 text-lynx-navy hover:bg-slate-200'
                }`}
              >
                Skip for now
              </button>
            </div>
            {evalChoice === 'no' && (
              <p className={`text-xs mt-4 ${secondaryText}`}>
                You can evaluate your players anytime from the Roster Manager.
              </p>
            )}
          </div>
        )}

        {/* ═══ STEP 6: Confirmation ═══ */}
        {step === 5 && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-xl mx-auto flex items-center justify-center mb-4 bg-emerald-500/10">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className={`text-lg font-bold mb-2 ${primaryText}`}>Your Roster is Ready!</h3>
            <p className={`text-sm mb-6 ${secondaryText}`}>
              Season setup complete. Here's a summary of your team.
            </p>

            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto mb-6">
              <div className={`p-3 rounded-lg border ${isDark ? 'border-white/[0.06] bg-slate-800/50' : 'border-slate-200 bg-slate-50'}`}>
                <p className="text-2xl font-bold text-lynx-sky">{stats.total}</p>
                <p className={`text-xs ${secondaryText}`}>Players</p>
              </div>
              <div className={`p-3 rounded-lg border ${isDark ? 'border-white/[0.06] bg-slate-800/50' : 'border-slate-200 bg-slate-50'}`}>
                <p className="text-2xl font-bold text-lynx-sky">{stats.withJersey}</p>
                <p className={`text-xs ${secondaryText}`}>Jerseys Assigned</p>
              </div>
              <div className={`p-3 rounded-lg border ${isDark ? 'border-white/[0.06] bg-slate-800/50' : 'border-slate-200 bg-slate-50'}`}>
                <p className="text-2xl font-bold text-lynx-sky">{stats.withPosition}</p>
                <p className={`text-xs ${secondaryText}`}>Positions Set</p>
              </div>
              <div className={`p-3 rounded-lg border ${isDark ? 'border-white/[0.06] bg-slate-800/50' : 'border-slate-200 bg-slate-50'}`}>
                <p className="text-2xl font-bold text-emerald-500">{stats.waiversSigned}/{stats.total}</p>
                <p className={`text-xs ${secondaryText}`}>Waivers Signed</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          disabled={step === 0}
          className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold transition ${
            step === 0
              ? 'opacity-30 cursor-not-allowed'
              : isDark ? 'text-white hover:bg-slate-700' : 'text-lynx-navy hover:bg-slate-100'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        <span className={`text-xs ${secondaryText}`}>Step {step + 1} of 6</span>

        <button
          onClick={handleNext}
          disabled={saving || (step === 4 && !evalChoice)}
          className={`flex items-center gap-1 px-5 py-2 rounded-lg text-sm font-bold text-white transition ${
            saving || (step === 4 && !evalChoice)
              ? 'bg-slate-400 cursor-not-allowed'
              : 'bg-lynx-sky hover:bg-lynx-deep'
          }`}
        >
          {saving ? 'Saving...' : step === 5 ? 'Go to Dashboard' : step === 4 && evalChoice === 'yes' ? 'Start Evaluation' : 'Next'}
          {step < 5 && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}
