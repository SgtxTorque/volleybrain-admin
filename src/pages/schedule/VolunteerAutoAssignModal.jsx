import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { X, Users, Shuffle, Check, AlertTriangle, Loader2 } from 'lucide-react'

// Default volunteer roles and slots per event
const DEFAULT_ROLES = [
  { role: 'line_judge', label: 'Line Judge', positions: ['primary', 'backup_1'] },
  { role: 'scorekeeper', label: 'Scorekeeper', positions: ['primary', 'backup_1'] },
]

export default function VolunteerAutoAssignModal({ teams, events, onClose, showToast, selectedSeason }) {
  const { organization } = useAuth()
  const { isDark } = useTheme()

  const [selectedTeamId, setSelectedTeamId] = useState('all')
  const [roles, setRoles] = useState(DEFAULT_ROLES)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null) // null = not generated, [] = generated
  const [assigning, setAssigning] = useState(false)
  const [result, setResult] = useState(null)

  // Filter to upcoming games/tournaments only
  const upcomingGames = events.filter(e => {
    const isGameType = e.event_type === 'game' || e.event_type === 'tournament'
    const isFuture = new Date(e.event_date + 'T23:59:59') >= new Date()
    const matchesTeam = selectedTeamId === 'all' || e.team_id === selectedTeamId
    return isGameType && isFuture && matchesTeam
  }).sort((a, b) => a.event_date.localeCompare(b.event_date))

  async function generatePreview() {
    setLoading(true)
    setPreview(null)
    setResult(null)

    try {
      // 1. Get all team IDs we're assigning for
      const teamIds = selectedTeamId === 'all'
        ? [...new Set(upcomingGames.map(e => e.team_id).filter(Boolean))]
        : [selectedTeamId]

      // 2. Load rosters to get families (grouped by parent_email)
      const families = {}
      for (const teamId of teamIds) {
        const { data: teamPlayers } = await supabase
          .from('team_players')
          .select('*, players(id, first_name, last_name, parent_name, parent_email)')
          .eq('team_id', teamId)

        ;(teamPlayers || []).forEach(tp => {
          const player = tp.players
          if (!player?.parent_email) return
          const email = player.parent_email.toLowerCase()
          if (!families[email]) {
            families[email] = {
              email,
              parentName: player.parent_name || 'Unknown',
              playerNames: [],
              teamIds: new Set(),
              assignmentCount: 0,
            }
          }
          families[email].playerNames.push(`${player.first_name} ${player.last_name}`)
          families[email].teamIds.add(teamId)
        })
      }

      const familyList = Object.values(families)
      if (familyList.length === 0) {
        setPreview([])
        setLoading(false)
        return
      }

      // 3. Load existing volunteer assignments to count per family
      const eventIds = upcomingGames.map(e => e.id)
      const { data: existingVols } = await supabase
        .from('event_volunteers')
        .select('*, profiles(id, full_name, email)')
        .in('event_id', eventIds)

      // Map profile emails to family emails (best effort match)
      const existingByEvent = {}
      ;(existingVols || []).forEach(v => {
        if (!existingByEvent[v.event_id]) existingByEvent[v.event_id] = []
        existingByEvent[v.event_id].push(v)

        // Count existing assignments per family
        const profEmail = v.profiles?.email?.toLowerCase()
        if (profEmail && families[profEmail]) {
          families[profEmail].assignmentCount++
        }
      })

      // 4. Find matching profile IDs for each family
      const familyEmails = familyList.map(f => f.email)
      const { data: profileMatches } = await supabase
        .from('profiles')
        .select('id, email')
        .in('email', familyEmails)

      const emailToProfileId = {}
      ;(profileMatches || []).forEach(p => {
        if (p.email) emailToProfileId[p.email.toLowerCase()] = p.id
      })

      // 5. Generate assignments
      const assignments = []

      for (const event of upcomingGames) {
        const eventExisting = existingByEvent[event.id] || []

        for (const roleDef of roles) {
          for (const position of roleDef.positions) {
            // Skip if already filled
            const alreadyFilled = eventExisting.find(v => v.role === roleDef.role && v.position === position)
            if (alreadyFilled) continue

            // Find eligible families (on this team's roster, not already volunteering at this event)
            const eventAssignedEmails = new Set([
              ...eventExisting.map(v => v.profiles?.email?.toLowerCase()).filter(Boolean),
              ...assignments.filter(a => a.event_id === event.id).map(a => a.familyEmail),
            ])

            const eligible = familyList
              .filter(f => {
                // Must have a profile to assign
                if (!emailToProfileId[f.email]) return false
                // Must be on this team (or assigning for all teams)
                if (event.team_id && !f.teamIds.has(event.team_id)) return false
                // Not already assigned to this event
                if (eventAssignedEmails.has(f.email)) return false
                return true
              })
              .sort((a, b) => {
                // Sort by fewest total assignments (existing + new in this run)
                const aCount = a.assignmentCount + assignments.filter(x => x.familyEmail === a.email).length
                const bCount = b.assignmentCount + assignments.filter(x => x.familyEmail === b.email).length
                if (aCount !== bCount) return aCount - bCount
                // Tiebreak: random
                return Math.random() - 0.5
              })

            if (eligible.length > 0) {
              const chosen = eligible[0]
              assignments.push({
                event_id: event.id,
                event_date: event.event_date,
                event_title: event.title || event.event_type,
                team_name: event.teams?.name || 'All Teams',
                role: roleDef.role,
                position,
                familyEmail: chosen.email,
                familyName: chosen.parentName,
                profile_id: emailToProfileId[chosen.email],
              })
            }
          }
        }
      }

      setPreview(assignments)

    } catch (err) {
      console.error('Auto-assign error:', err)
      showToast?.('Error generating assignments: ' + err.message, 'error')
    }

    setLoading(false)
  }

  async function confirmAssign() {
    if (!preview || preview.length === 0) return
    setAssigning(true)

    try {
      const inserts = preview.map(a => ({
        event_id: a.event_id,
        profile_id: a.profile_id,
        role: a.role,
        position: a.position,
      }))

      const { error } = await supabase.from('event_volunteers').insert(inserts)
      if (error) throw error

      setResult({ success: true, count: inserts.length })
      showToast?.(`${inserts.length} volunteer assignments created!`, 'success')
    } catch (err) {
      console.error('Assign error:', err)
      setResult({ success: false, message: err.message })
      showToast?.('Error: ' + err.message, 'error')
    }

    setAssigning(false)
  }

  // Group preview by family for summary
  const previewByFamily = {}
  ;(preview || []).forEach(a => {
    if (!previewByFamily[a.familyEmail]) previewByFamily[a.familyEmail] = { name: a.familyName, assignments: [] }
    previewByFamily[a.familyEmail].assignments.push(a)
  })

  const inputCls = `px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-white' : 'bg-white border-[#E8ECF2] text-[#10284C]'}`

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className={`w-full max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col ${
        isDark ? 'bg-[#0D1B2F] border border-white/[0.08]' : 'bg-white border border-[#E8ECF2] shadow-2xl'
      }`} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={`px-5 py-4 border-b shrink-0 ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-[#4BB9EC]/10' : 'bg-[#4BB9EC]/10'}`}>
                <Shuffle className="w-5 h-5 text-[#4BB9EC]" />
              </div>
              <div>
                <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>Auto-Assign Volunteers</h2>
                <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Fairly distribute volunteer roles across families
                </p>
              </div>
            </div>
            <button onClick={onClose} className={`p-1.5 rounded-lg transition ${isDark ? 'text-slate-500 hover:text-white hover:bg-white/[0.06]' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Config */}
          {!result && (
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Team</label>
                <select value={selectedTeamId} onChange={e => { setSelectedTeamId(e.target.value); setPreview(null) }} className={inputCls + ' w-full'}>
                  <option value="all">All Teams</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="text-right">
                <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {upcomingGames.length} upcoming game{upcomingGames.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )}

          {/* Roles being assigned */}
          {!result && (
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Roles to Fill</label>
              <div className={`rounded-xl border ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'}`}>
                <div className={`divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-[#E8ECF2]'}`}>
                  {roles.map((r, i) => (
                    <div key={i} className="px-4 py-2.5 flex items-center justify-between">
                      <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>{r.label}</span>
                      <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{r.positions.length} slot{r.positions.length !== 1 ? 's' : ''} per game</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                Total slots to fill: {roles.reduce((sum, r) => sum + r.positions.length, 0) * upcomingGames.length} across {upcomingGames.length} games
              </p>
            </div>
          )}

          {/* Generate Button */}
          {!preview && !result && (
            <button
              onClick={generatePreview}
              disabled={loading || upcomingGames.length === 0}
              className="w-full py-3 rounded-xl text-sm font-bold bg-[#10284C] text-white hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2 transition"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating assignments...</>
              ) : (
                <><Shuffle className="w-4 h-4" /> Generate Fair Assignments</>
              )}
            </button>
          )}

          {/* Preview */}
          {preview && !result && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Assignment Preview ({preview.length} total)
                </h3>
                <button onClick={() => setPreview(null)} className="text-xs font-bold text-[#4BB9EC] hover:underline">
                  Regenerate
                </button>
              </div>

              {preview.length === 0 ? (
                <div className={`p-6 rounded-xl text-center border ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'}`}>
                  <AlertTriangle className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>No assignments generated</p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Either all slots are already filled, or no families with matching profiles were found.
                  </p>
                </div>
              ) : (
                <>
                  {/* Family summary */}
                  <div className={`rounded-xl border overflow-hidden mb-4 ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'}`}>
                    <div className={`px-4 py-2 ${isDark ? 'bg-white/[0.02]' : 'bg-[#F5F6F8]'}`}>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Per Family</span>
                    </div>
                    <div className={`divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-[#E8ECF2]'}`}>
                      {Object.entries(previewByFamily).sort((a, b) => b[1].assignments.length - a[1].assignments.length).map(([email, data]) => (
                        <div key={email} className="px-4 py-2 flex items-center justify-between">
                          <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>{data.name} Family</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-[#4BB9EC]/10 text-[#4BB9EC]' : 'bg-[#4BB9EC]/10 text-[#4BB9EC]'}`}>
                            {data.assignments.length} assignment{data.assignments.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Confirm button */}
                  <button
                    onClick={confirmAssign}
                    disabled={assigning}
                    className="w-full py-3 rounded-xl text-sm font-bold bg-[#22C55E] text-white hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2 transition"
                  >
                    {assigning ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Assigning...</>
                    ) : (
                      <><Check className="w-4 h-4" /> Confirm {preview.length} Assignments</>
                    )}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`p-6 rounded-xl text-center ${result.success ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
              {result.success ? (
                <>
                  <Check className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>Assignments Complete</h3>
                  <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {result.count} volunteer slots filled across your upcoming games.
                  </p>
                  <p className={`text-xs mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    You can adjust individual assignments in each event's detail view.
                  </p>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>Assignment Failed</h3>
                  <p className={`text-sm mt-1 text-red-400`}>{result.message}</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-5 py-3 border-t shrink-0 flex justify-end ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'}`}>
          <button onClick={onClose}
            className={`px-4 py-2 rounded-lg text-xs font-bold border transition ${isDark ? 'border-white/[0.08] text-slate-300 hover:bg-white/[0.04]' : 'border-[#E8ECF2] text-slate-600 hover:bg-slate-50'}`}>
            {result ? 'Done' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}
