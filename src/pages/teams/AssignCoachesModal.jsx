// =============================================================================
// AssignCoachesModal — Assign coaches to a team with role selection
// Shows all season coaches with checkboxes, pre-selects existing assignments
// =============================================================================

import { useState, useMemo } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { X, Search, UserCog, Star } from 'lucide-react'

const ROLE_OPTIONS = [
  { value: 'head', label: 'Head Coach' },
  { value: 'assistant', label: 'Assistant' },
  { value: 'manager', label: 'Manager' },
  { value: 'volunteer', label: 'Volunteer' },
]

export default function AssignCoachesModal({ team, coaches, onClose, onSave, showToast }) {
  const { isDark } = useTheme()

  // Build initial selections from existing assignments
  const initialSelections = useMemo(() => {
    const map = {}
    coaches.forEach(coach => {
      const existing = (coach.assignments || []).find(a => a.team_id === team.id)
      if (existing) {
        map[coach.id] = existing.role || 'assistant'
      }
    })
    return map
  }, [coaches, team.id])

  const [selections, setSelections] = useState(initialSelections)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  // Filter coaches by search query
  const filteredCoaches = useMemo(() => {
    if (!search.trim()) return coaches
    const q = search.toLowerCase()
    return coaches.filter(c =>
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q))
    )
  }, [coaches, search])

  function toggleCoach(coachId) {
    setSelections(prev => {
      const next = { ...prev }
      if (next[coachId]) {
        delete next[coachId]
      } else {
        next[coachId] = 'assistant'
      }
      return next
    })
  }

  function setRole(coachId, role) {
    setSelections(prev => ({ ...prev, [coachId]: role }))
  }

  async function handleSave() {
    if (saving) return
    setSaving(true)
    try {
      const assignments = Object.entries(selections).map(([coach_id, role]) => ({
        coach_id,
        role,
      }))
      await onSave(team.id, assignments)
    } catch (err) {
      console.error('Error saving coach assignments:', err)
      if (showToast) showToast('Failed to save assignments', 'error')
    }
    setSaving(false)
  }

  const selectedCount = Object.keys(selections).length

  // Helper: get other team assignments for a coach (excluding this team)
  function getOtherAssignments(coach) {
    return (coach.assignments || [])
      .filter(a => a.team_id !== team.id && a.teams)
      .map(a => a.teams.name)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div
        className={`${
          isDark
            ? 'bg-lynx-charcoal border border-white/[0.06]'
            : 'bg-white border border-lynx-silver'
        } rounded-xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div
          className={`px-5 py-4 border-b ${
            isDark ? 'border-white/[0.06]' : 'border-lynx-silver'
          } flex items-center justify-between`}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: team.color || '#4BB9EC' }}
            >
              <UserCog className="w-4 h-4 text-white" />
            </div>
            <h2
              className={`text-r-lg font-bold ${
                isDark ? 'text-white' : 'text-lynx-navy'
              }`}
            >
              Assign Coaches &mdash; {team.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition ${
              isDark
                ? 'hover:bg-white/[0.04] text-slate-400'
                : 'hover:bg-lynx-frost text-slate-500'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className={`px-5 py-3 border-b ${isDark ? 'border-white/[0.06]' : 'border-lynx-silver'}`}>
          <div className="relative">
            <Search
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}
            />
            <input
              type="text"
              placeholder="Search coaches..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-[14px] text-r-sm transition ${
                isDark
                  ? 'bg-lynx-graphite border border-white/[0.06] text-white placeholder-slate-500'
                  : 'bg-white border border-lynx-silver text-lynx-navy placeholder-slate-400'
              } focus:outline-none focus:ring-2 focus:ring-lynx-sky/40`}
            />
          </div>
        </div>

        {/* Coach List */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {filteredCoaches.length === 0 && (
            <div className={`text-center py-8 text-r-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {search ? 'No coaches match your search' : 'No coaches available this season'}
            </div>
          )}

          {filteredCoaches.map(coach => {
            const isSelected = !!selections[coach.id]
            const otherTeams = getOtherAssignments(coach)

            return (
              <div
                key={coach.id}
                className={`rounded-[14px] p-3 transition cursor-pointer ${
                  isSelected
                    ? isDark
                      ? 'bg-lynx-sky/10 border border-lynx-sky/30'
                      : 'bg-blue-50 border border-blue-200'
                    : isDark
                      ? 'bg-lynx-graphite border border-white/[0.06] hover:border-white/[0.12]'
                      : 'bg-white border border-lynx-silver hover:bg-lynx-frost'
                }`}
                onClick={() => toggleCoach(coach.id)}
              >
                <div className="flex items-center gap-3">
                  {/* Checkbox */}
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition ${
                      isSelected
                        ? 'bg-lynx-sky border-lynx-sky'
                        : isDark
                          ? 'border-slate-600 bg-transparent'
                          : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>

                  {/* Avatar */}
                  {coach.photo_url ? (
                    <img
                      src={coach.photo_url}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-r-sm font-bold flex-shrink-0 ${
                        isDark ? 'bg-lynx-graphite text-slate-400' : 'bg-lynx-frost text-lynx-slate'
                      }`}
                    >
                      {(coach.first_name?.[0] || '').toUpperCase()}
                      {(coach.last_name?.[0] || '').toUpperCase()}
                    </div>
                  )}

                  {/* Name & Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-r-sm font-semibold truncate ${
                          isDark ? 'text-white' : 'text-lynx-navy'
                        }`}
                      >
                        {coach.first_name} {coach.last_name}
                      </span>
                      {/* Show star if already head coach on another team */}
                      {(coach.assignments || []).some(
                        a => a.role === 'head' && a.team_id !== team.id
                      ) && (
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
                      )}
                    </div>
                    <div
                      className={`text-r-xs truncate ${
                        isDark ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      {coach.email}
                    </div>
                    {otherTeams.length > 0 && (
                      <div
                        className={`text-r-xs mt-0.5 ${
                          isDark ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        Also on: {otherTeams.join(', ')}
                      </div>
                    )}
                  </div>

                  {/* Role Dropdown (only when selected) */}
                  {isSelected && (
                    <select
                      value={selections[coach.id]}
                      onChange={e => {
                        e.stopPropagation()
                        setRole(coach.id, e.target.value)
                      }}
                      onClick={e => e.stopPropagation()}
                      className={`text-r-xs font-medium rounded-lg px-2.5 py-1.5 border transition focus:outline-none focus:ring-2 focus:ring-lynx-sky/40 ${
                        isDark
                          ? 'bg-lynx-graphite border-white/[0.06] text-white'
                          : 'bg-white border-lynx-silver text-lynx-navy'
                      }`}
                    >
                      {ROLE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div
          className={`px-5 py-4 border-t ${
            isDark ? 'border-white/[0.06]' : 'border-lynx-silver'
          } flex items-center justify-between`}
        >
          <span
            className={`text-r-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}
          >
            {selectedCount} coach{selectedCount !== 1 ? 'es' : ''} selected
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className={`px-5 py-2.5 rounded-lg text-r-sm font-medium transition disabled:opacity-50 ${
                isDark
                  ? 'bg-white/[0.06] text-white hover:bg-white/[0.08]'
                  : 'bg-lynx-frost text-lynx-navy hover:bg-slate-200'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 rounded-lg text-r-sm bg-lynx-navy text-white font-bold transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Assignments'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
