import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { X } from '../../constants/icons'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'

function AvailabilitySurveyModal({ teams, organization, onClose, showToast }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const [step, setStep] = useState('create') // create, view
  const [surveys, setSurveys] = useState([])
  const [selectedSurvey, setSelectedSurvey] = useState(null)

  // Create form
  const [form, setForm] = useState({
    title: 'Practice Availability',
    team_id: '',
    slots: [
      { day: 'Monday', time: '5:00 PM - 7:00 PM' },
      { day: 'Tuesday', time: '6:00 PM - 8:00 PM' },
      { day: 'Wednesday', time: '5:00 PM - 7:00 PM' },
    ],
    deadline: ''
  })

  useEffect(() => {
    loadSurveys()
  }, [])

  async function loadSurveys() {
    // Load from organization settings
    const existingSurveys = organization.settings?.availability_surveys || []
    setSurveys(existingSurveys)
  }

  function addSlot() {
    setForm({ ...form, slots: [...form.slots, { day: '', time: '' }] })
  }

  function removeSlot(index) {
    setForm({ ...form, slots: form.slots.filter((_, i) => i !== index) })
  }

  function updateSlot(index, field, value) {
    const updated = [...form.slots]
    updated[index][field] = value
    setForm({ ...form, slots: updated })
  }

  async function createSurvey() {
    const newSurvey = {
      id: Date.now().toString(),
      ...form,
      created_at: new Date().toISOString(),
      responses: [],
      status: 'active'
    }

    const updatedSurveys = [...surveys, newSurvey]
    const newSettings = { ...organization.settings, availability_surveys: updatedSurveys }

    await supabase.from('organizations').update({ settings: newSettings }).eq('id', organization.id)

    setSurveys(updatedSurveys)
    showToast('Survey created! Share the link with families.', 'success')
    setSelectedSurvey(newSurvey)
    setStep('view')
  }

  async function deleteSurvey(surveyId) {
    if (!confirm('Delete this survey and all responses?')) return
    const updatedSurveys = surveys.filter(s => s.id !== surveyId)
    const newSettings = { ...organization.settings, availability_surveys: updatedSurveys }
    await supabase.from('organizations').update({ settings: newSettings }).eq('id', organization.id)
    setSurveys(updatedSurveys)
    setSelectedSurvey(null)
    showToast('Survey deleted', 'success')
  }

  function copyShareLink(surveyId) {
    // In production, this would be a real shareable URL
    const link = `${window.location.origin}/availability/${organization.id}/${surveyId}`
    navigator.clipboard.writeText(link)
    showToast('Link copied to clipboard!', 'success')
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`${tc.cardBg} border ${tc.border} rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto`}>
        <div className={`p-6 border-b ${tc.border} flex items-center justify-between sticky top-0 ${tc.cardBg} z-10`}>
          <div>
            <h2 className={`text-xl font-bold ${tc.text}`}>Availability Survey</h2>
            <p className={`text-sm ${tc.textMuted}`}>Collect availability from families</p>
          </div>
          <button onClick={onClose} className={`${tc.textMuted} hover:${isDark ? 'text-white' : 'text-slate-900'} text-2xl p-1`}>×</button>
        </div>

        {step === 'create' ? (
          <div className="p-6 space-y-6">
            {/* Existing surveys */}
            {surveys.length > 0 && (
              <div>
                <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${tc.textMuted}`}>Existing Surveys</h3>
                <div className="space-y-2">
                  {surveys.map(survey => (
                    <div key={survey.id} className={`${isDark ? 'bg-lynx-midnight' : 'bg-lynx-cloud'} rounded-xl p-4 flex items-center justify-between`}>
                      <div>
                        <p className={`font-medium ${tc.text}`}>{survey.title}</p>
                        <p className={`text-sm ${tc.textMuted}`}>{survey.responses?.length || 0} responses</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedSurvey(survey); setStep('view') }}
                          className={`px-3 py-1 rounded-lg text-xs transition ${isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                          View Results
                        </button>
                        <button onClick={() => copyShareLink(survey.id)}
                          className="px-3 py-1 bg-blue-500/20 rounded-lg text-xs text-blue-400 hover:bg-blue-500/30">
                          Copy Link
                        </button>
                        <button onClick={() => deleteSurvey(survey.id)}
                          className="px-3 py-1 bg-red-500/20 rounded-lg text-xs text-red-400 hover:bg-red-500/30">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Create new survey */}
            <div className={`border-t ${tc.border} pt-6`}>
              <h3 className={`text-sm font-semibold ${tc.text} mb-4`}>Create New Survey</h3>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Survey Title</label>
                  <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                    className={`w-full ${tc.input} border rounded-xl px-4 py-3 text-sm`} />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Team (optional)</label>
                  <select value={form.team_id} onChange={e => setForm({...form, team_id: e.target.value})}
                    className={`w-full ${tc.input} border rounded-xl px-4 py-3 text-sm`}>
                    <option value="">All Teams</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Time Slot Options</label>
                  <div className="space-y-2">
                    {form.slots.map((slot, i) => (
                      <div key={i} className="flex gap-2">
                        <select value={slot.day} onChange={e => updateSlot(i, 'day', e.target.value)}
                          className={`flex-1 ${tc.input} border rounded-lg px-3 py-2 text-sm`}>
                          <option value="">Select day</option>
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                        <input type="text" value={slot.time} onChange={e => updateSlot(i, 'time', e.target.value)}
                          placeholder="e.g., 5:00 PM - 7:00 PM"
                          className={`flex-1 ${tc.input} border rounded-lg px-3 py-2 text-sm`} />
                        <button onClick={() => removeSlot(i)} className="text-red-400 hover:text-red-300 px-2"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                    <button onClick={addSlot}
                      className={`w-full px-4 py-2 border border-dashed rounded-xl transition ${isDark ? 'border-lynx-border-dark text-slate-400 hover:text-white' : 'border-slate-300 text-slate-400 hover:text-slate-700'} hover:border-[var(--accent-primary)]/30`}>
                      + Add Time Slot
                    </button>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Response Deadline (optional)</label>
                  <input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})}
                    className={`w-full ${tc.input} border rounded-xl px-4 py-3 text-sm`} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          // View survey results
          <div className="p-6">
            <button onClick={() => setStep('create')} className={`${tc.textMuted} hover:${isDark ? 'text-white' : 'text-slate-900'} mb-4 flex items-center gap-2`}>
              ← Back to surveys
            </button>

            {selectedSurvey && (
              <div className="space-y-6">
                <div>
                  <h3 className={`text-lg font-semibold ${tc.text}`}>{selectedSurvey.title}</h3>
                  <p className={`text-sm ${tc.textMuted}`}>{selectedSurvey.responses?.length || 0} responses received</p>
                </div>

                {/* Results heatmap */}
                <div className={`${isDark ? 'bg-lynx-midnight' : 'bg-lynx-cloud'} rounded-xl p-4`}>
                  <h4 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${tc.textMuted}`}>Availability Summary</h4>
                  <div className="space-y-3">
                    {selectedSurvey.slots.map((slot, i) => {
                      const available = selectedSurvey.responses?.filter(r => r.available?.includes(i)).length || 0
                      const notAvailable = selectedSurvey.responses?.filter(r => r.notAvailable?.includes(i)).length || 0
                      const total = selectedSurvey.responses?.length || 1
                      const percentage = Math.round((available / total) * 100)

                      return (
                        <div key={i} className="flex items-center gap-4">
                          <div className={`w-40 text-sm ${tc.text}`}>
                            {slot.day} {slot.time}
                          </div>
                          <div className={`flex-1 ${isDark ? 'bg-slate-700' : 'bg-slate-200'} rounded-full h-6 overflow-hidden`}>
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: percentage >= 70 ? '#10B981' : percentage >= 40 ? '#F59E0B' : '#EF4444'
                              }}
                            />
                          </div>
                          <div className="w-24 text-right text-sm">
                            <span className="text-emerald-400">{available}✓</span>
                            <span className={`mx-1 ${tc.textMuted}`}>/</span>
                            <span className="text-red-400">{notAvailable}✗</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Individual responses */}
                {selectedSurvey.responses?.length > 0 && (
                  <div>
                    <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${tc.textMuted}`}>Individual Responses</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedSurvey.responses.map((response, i) => (
                        <div key={i} className={`${isDark ? 'bg-lynx-midnight' : 'bg-lynx-cloud'} rounded-lg p-3 text-sm`}>
                          <p className={`${tc.text} font-medium`}>{response.name}</p>
                          <p className={`text-xs ${tc.textMuted}`}>
                            Available: {response.available?.map(idx => selectedSurvey.slots[idx]?.day).join(', ') || 'None'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => copyShareLink(selectedSurvey.id)}
                    className="flex-1 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30">
                    Copy Share Link
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className={`p-6 border-t ${tc.border} flex justify-end gap-3 sticky bottom-0 ${tc.cardBg} z-10`}>
          <button onClick={onClose} className={`px-6 py-2.5 rounded-xl border font-medium transition ${isDark ? 'border-lynx-border-dark text-slate-300 hover:bg-slate-700' : 'border-lynx-silver text-slate-700 hover:bg-lynx-cloud'}`}>Close</button>
          {step === 'create' && (
            <button onClick={createSurvey} disabled={form.slots.length === 0}
              className="px-6 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white font-semibold hover:brightness-110 transition disabled:opacity-50">
              Create Survey
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default AvailabilitySurveyModal
