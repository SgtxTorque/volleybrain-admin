import { useState } from 'react'
import { useThemeClasses } from '../../../contexts/ThemeContext'
import { Star } from '../../../constants/icons'
import TeamLogo from '../../../components/TeamLogo'

export default function AssignTeamsModal({ coach, teams, onSave, onClose }) {
  const tc = useThemeClasses()
  const [assignments, setAssignments] = useState(
    coach.assignments?.map(a => ({ team_id: a.team_id, role: a.role })) || []
  )

  function toggleTeam(teamId) {
    const existing = assignments.find(a => a.team_id === teamId)
    if (existing) setAssignments(assignments.filter(a => a.team_id !== teamId))
    else setAssignments([...assignments, { team_id: teamId, role: 'assistant' }])
  }

  function updateRole(teamId, role) {
    setAssignments(assignments.map(a => a.team_id === teamId ? { ...a, role } : a))
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className={`${tc.cardBg} border ${tc.border} rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto`}>
        <div className={`p-6 border-b ${tc.border} flex items-center justify-between sticky top-0 ${tc.cardBg}`}>
          <div>
            <h2 className={`text-xl font-semibold ${tc.text}`}>Assign Teams</h2>
            <p className={`text-sm ${tc.textMuted}`}>{coach.first_name} {coach.last_name}</p>
          </div>
          <button onClick={onClose} className={`${tc.textMuted} text-2xl`}>×</button>
        </div>
        <div className="p-6">
          {teams.length === 0 ? (
            <div className={`text-center py-8 ${tc.textMuted}`}>
              <p>No teams in current season</p>
              <p className="text-sm mt-1">Create teams first to assign coaches</p>
            </div>
          ) : (
            <div className="space-y-3">
              {teams.map(team => {
                const assignment = assignments.find(a => a.team_id === team.id)
                const isAssigned = !!assignment
                return (
                  <div key={team.id} className={`p-4 rounded-xl border transition ${isAssigned ? 'border-[var(--accent-primary)]/50 bg-[var(--accent-primary)]/5' : `${tc.border}`}`}>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={isAssigned} onChange={() => toggleTeam(team.id)} className="w-5 h-5 rounded" />
                      <TeamLogo team={team} size={18} className="flex-shrink-0" />
                      <span className={`${tc.text} font-medium`}>{team.name}</span>
                    </label>
                    {isAssigned && (
                      <div className="mt-3 ml-8">
                        <select value={assignment.role} onChange={e => updateRole(team.id, e.target.value)}
                          className={`w-full rounded-lg px-3 py-2 text-sm ${tc.cardBg} border ${tc.border} ${tc.text}`}>
                          <option value="head">Head Coach</option>
                          <option value="assistant">Assistant Coach</option>
                          <option value="manager">Team Manager</option>
                          <option value="volunteer">Volunteer</option>
                        </select>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <div className={`p-6 border-t ${tc.border} flex justify-between items-center sticky bottom-0 ${tc.cardBg}`}>
          <span className={`text-sm ${tc.textMuted}`}>{assignments.length} team{assignments.length !== 1 ? 's' : ''} selected</span>
          <div className="flex gap-3">
            <button onClick={onClose} className={`px-6 py-2 rounded-xl border ${tc.border} ${tc.text}`}>Cancel</button>
            <button onClick={() => onSave(assignments)} className="px-6 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold">Save</button>
          </div>
        </div>
      </div>
    </div>
  )
}
