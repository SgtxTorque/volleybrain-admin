import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { fetchPlayerAssignments, addCoachFeedback } from '../../lib/development-service'
import { Clock, Play, ExternalLink, MessageSquare, Star, Check, ChevronDown, ChevronUp, Plus } from 'lucide-react'

const STATUS_CONFIG = {
  assigned: { label: 'Assigned', color: '#4BB9EC', bg: 'rgba(75,185,236,0.12)' },
  in_progress: { label: 'In Progress', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  completed: { label: 'Completed', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  archived: { label: 'Archived', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
}

export default function PlayerProfileDevelopmentTab({ player, isDark, showToast, activeView }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isCoachOrAdmin = activeView === 'admin' || activeView === 'coach'

  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  // Feedback form
  const [feedbackId, setFeedbackId] = useState(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackRating, setFeedbackRating] = useState(0)
  const [savingFeedback, setSavingFeedback] = useState(false)

  useEffect(() => {
    if (player?.id) loadAssignments()
  }, [player?.id])

  async function loadAssignments() {
    setLoading(true)
    const { data } = await fetchPlayerAssignments(player.id)
    if (data) setAssignments(data)
    setLoading(false)
  }

  async function handleSaveFeedback(assignmentId) {
    setSavingFeedback(true)
    const { error } = await addCoachFeedback(assignmentId, {
      coachFeedback: feedbackText.trim(),
      coachRating: feedbackRating || null,
      reviewedBy: user.id,
    })
    if (error) showToast?.('Failed to save feedback', 'error')
    else {
      showToast?.('Feedback saved', 'success')
      setFeedbackId(null)
      setFeedbackText('')
      setFeedbackRating(0)
      loadAssignments()
    }
    setSavingFeedback(false)
  }

  const border = isDark ? 'rgba(255,255,255,0.06)' : '#E8ECF2'
  const textColor = isDark ? 'white' : '#10284C'
  const mutedColor = isDark ? '#64748B' : '#94A3B8'
  const inputBg = isDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.03)'

  const activeAssignments = assignments.filter(a => a.status !== 'archived')
  const completedAssignments = assignments.filter(a => a.status === 'completed')

  // Group by player_goal for strategic objectives
  const goalGroups = new Map()
  activeAssignments.forEach(a => {
    const goal = a.player_goal || 'General Development'
    if (!goalGroups.has(goal)) goalGroups.set(goal, [])
    goalGroups.get(goal).push(a)
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#4BB9EC] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-5 space-y-6">
      {/* COACH INTELLIGENCE — Active Assignments */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Coach Intelligence
          </h3>
          {isCoachOrAdmin && (
            <button onClick={() => navigate('/drills')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition hover:opacity-90"
              style={{ background: 'var(--accent-primary)', color: 'white' }}>
              <Plus className="w-3 h-3" /> Assign a Drill
            </button>
          )}
        </div>

        {activeAssignments.length === 0 ? (
          <div className={`text-center py-8 rounded-[14px] border-2 border-dashed ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'}`}>
            <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              No active assignments
            </p>
            <p className={`text-xs ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
              {isCoachOrAdmin ? 'Assign drills from the Drill Library to track player development.' : 'No drills have been assigned yet.'}
            </p>
          </div>
        ) : (
          <div className={`rounded-[14px] border overflow-hidden ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'}`}>
            <div className={`divide-y ${isDark ? 'divide-white/[0.04]' : 'divide-[#E8ECF2]'}`}>
              {activeAssignments.map(assignment => {
                const drill = assignment.drills
                const status = STATUS_CONFIG[assignment.status] || STATUS_CONFIG.assigned
                const isExpanded = expandedId === assignment.id
                const progress = assignment.target_completions > 0
                  ? Math.min((assignment.current_completions / assignment.target_completions) * 100, 100)
                  : 0

                return (
                  <div key={assignment.id} className={`${isDark ? 'hover:bg-white/[0.01]' : 'hover:bg-slate-50/50'} transition`}>
                    <div className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : assignment.id)}>
                      {/* Thumbnail */}
                      {drill?.video_thumbnail_url ? (
                        <img src={drill.video_thumbnail_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isDark ? 'bg-white/[0.04]' : 'bg-slate-100'}`}>
                          🏐
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
                          {drill?.title || assignment.custom_title || 'Custom Assignment'}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {assignment.assigner?.full_name ? `Assigned by ${assignment.assigner.full_name}` : 'Assigned'}
                          </span>
                          {assignment.due_date && (
                            <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                              · Due {new Date(assignment.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: status.bg, color: status.color }}>
                        {status.label}
                      </span>

                      {isExpanded ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: mutedColor }} /> : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: mutedColor }} />}
                    </div>

                    {/* Progress bar */}
                    <div className="px-4 pb-2">
                      <div className="flex items-center gap-2">
                        <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: 'var(--accent-primary)' }} />
                        </div>
                        <span className={`text-[10px] font-bold shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {assignment.current_completions}/{assignment.target_completions}
                        </span>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${border}` }}>
                        {assignment.player_goal && (
                          <div className="pt-3">
                            <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Goal: </span>
                            <span className={`text-xs italic ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>"{assignment.player_goal}"</span>
                          </div>
                        )}

                        {assignment.player_notes && (
                          <div>
                            <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Player Notes: </span>
                            <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{assignment.player_notes}</span>
                          </div>
                        )}

                        {assignment.coach_feedback && (
                          <div>
                            <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Coach Feedback: </span>
                            <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{assignment.coach_feedback}</span>
                            {assignment.coach_rating && (
                              <span className="ml-2 text-xs text-amber-500">{'★'.repeat(assignment.coach_rating)}{'☆'.repeat(5 - assignment.coach_rating)}</span>
                            )}
                          </div>
                        )}

                        {/* Coach feedback form */}
                        {isCoachOrAdmin && feedbackId !== assignment.id && !assignment.coach_feedback && (
                          <button onClick={() => { setFeedbackId(assignment.id); setFeedbackText(''); setFeedbackRating(0) }}
                            className={`inline-flex items-center gap-1 text-xs font-semibold transition ${isDark ? 'text-[#4BB9EC]' : 'text-[#4BB9EC]'}`}>
                            <MessageSquare className="w-3 h-3" /> Add Feedback
                          </button>
                        )}

                        {feedbackId === assignment.id && (
                          <div className="space-y-2 pt-1">
                            <textarea
                              value={feedbackText} onChange={e => setFeedbackText(e.target.value)}
                              placeholder="Great improvement on..."
                              rows={2}
                              className="w-full px-3 py-2 rounded-lg text-xs outline-none resize-none"
                              style={{ background: inputBg, border: `1px solid ${border}`, color: textColor }}
                            />
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Rating:</span>
                              {[1, 2, 3, 4, 5].map(n => (
                                <button key={n} onClick={() => setFeedbackRating(n)}
                                  className={`text-sm transition ${n <= feedbackRating ? 'text-amber-500' : isDark ? 'text-slate-600' : 'text-slate-300'}`}>
                                  ★
                                </button>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => setFeedbackId(null)}
                                className={`px-2.5 py-1 rounded-md text-[10px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                Cancel
                              </button>
                              <button onClick={() => handleSaveFeedback(assignment.id)} disabled={savingFeedback}
                                className="px-2.5 py-1 rounded-md text-[10px] font-bold text-white disabled:opacity-50"
                                style={{ background: 'var(--accent-primary)' }}>
                                {savingFeedback ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* View drill link */}
                        {drill?.video_url && (
                          <a href={drill.video_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold transition"
                            style={{ color: 'var(--accent-primary)' }}>
                            <Play className="w-3 h-3" /> Watch Drill Video
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* STRATEGIC OBJECTIVES — Grouped by goal */}
      {goalGroups.size > 0 && (
        <div>
          <h3 className={`text-[10px] font-black uppercase tracking-widest mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Strategic Objectives
          </h3>
          <div className="space-y-3">
            {Array.from(goalGroups.entries()).map(([goal, items]) => {
              const completedCount = items.filter(a => a.status === 'completed').length
              const totalCount = items.length
              return (
                <div key={goal} className={`rounded-[14px] border p-4 ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white border-[#E8ECF2]'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>{goal}</h4>
                    <span className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {completedCount}/{totalCount} done
                    </span>
                  </div>
                  <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`, background: '#10B981' }} />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {items.map(a => (
                      <span key={a.id} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        a.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : isDark ? 'bg-white/[0.04] text-slate-400' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {a.drills?.title || a.custom_title || 'Task'}
                        {a.status === 'completed' && ' ✓'}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
