import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { X } from '../../constants/icons'

function AvailabilitySurveyModal({ teams, organization, onClose, showToast }) {
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800">
          <div>
            <h2 className="text-xl font-semibold text-white">Availability Survey</h2>
            <p className="text-sm text-slate-400">Collect availability from families</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
        </div>

        {step === 'create' ? (
          <div className="p-6 space-y-6">
            {/* Existing surveys */}
            {surveys.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-3">Existing Surveys</h3>
                <div className="space-y-2">
                  {surveys.map(survey => (
                    <div key={survey.id} className="bg-slate-900 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{survey.title}</p>
                        <p className="text-sm text-slate-400">{survey.responses?.length || 0} responses</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedSurvey(survey); setStep('view') }}
                          className="px-3 py-1 bg-slate-700 rounded-lg text-xs text-white hover:bg-slate-600">
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
            <div className="border-t border-slate-700 pt-6">
              <h3 className="text-sm font-medium text-white mb-4">Create New Survey</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Survey Title</label>
                  <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Team (optional)</label>
                  <select value={form.team_id} onChange={e => setForm({...form, team_id: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white">
                    <option value="">All Teams</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Time Slot Options</label>
                  <div className="space-y-2">
                    {form.slots.map((slot, i) => (
                      <div key={i} className="flex gap-2">
                        <select value={slot.day} onChange={e => updateSlot(i, 'day', e.target.value)}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm">
                          <option value="">Select day</option>
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                        <input type="text" value={slot.time} onChange={e => updateSlot(i, 'time', e.target.value)}
                          placeholder="e.g., 5:00 PM - 7:00 PM"
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" />
                        <button onClick={() => removeSlot(i)} className="text-red-400 hover:text-red-300 px-2"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                    <button onClick={addSlot}
                      className="w-full px-4 py-2 border border-dashed border-slate-700 rounded-xl text-slate-400 hover:text-white hover:border-[var(--accent-primary)]/30">
                      + Add Time Slot
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Response Deadline (optional)</label>
                  <input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          // View survey results
          <div className="p-6">
            <button onClick={() => setStep('create')} className="text-slate-400 hover:text-white mb-4 flex items-center gap-2">
              ← Back to surveys
            </button>
            
            {selectedSurvey && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedSurvey.title}</h3>
                  <p className="text-sm text-slate-400">{selectedSurvey.responses?.length || 0} responses received</p>
                </div>

                {/* Results heatmap */}
                <div className="bg-slate-900 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-white mb-4">Availability Summary</h4>
                  <div className="space-y-3">
                    {selectedSurvey.slots.map((slot, i) => {
                      const available = selectedSurvey.responses?.filter(r => r.available?.includes(i)).length || 0
                      const notAvailable = selectedSurvey.responses?.filter(r => r.notAvailable?.includes(i)).length || 0
                      const total = selectedSurvey.responses?.length || 1
                      const percentage = Math.round((available / total) * 100)
                      
                      return (
                        <div key={i} className="flex items-center gap-4">
                          <div className="w-40 text-sm text-white">
                            {slot.day} {slot.time}
                          </div>
                          <div className="flex-1 bg-slate-700 rounded-full h-6 overflow-hidden">
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
                            <span className="text-slate-500 mx-1">/</span>
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
                    <h4 className="text-sm font-medium text-white mb-3">Individual Responses</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedSurvey.responses.map((response, i) => (
                        <div key={i} className="bg-slate-900 rounded-lg p-3 text-sm">
                          <p className="text-white font-medium">{response.name}</p>
                          <p className="text-slate-400 text-xs">
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
                    📋 Copy Share Link
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="p-6 border-t border-slate-700 flex justify-end gap-3 sticky bottom-0 bg-slate-800">
          <button onClick={onClose} className="px-6 py-2 rounded-xl border border-slate-700 text-white">Close</button>
          {step === 'create' && (
            <button onClick={createSurvey} disabled={form.slots.length === 0}
              className="px-6 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold disabled:opacity-50">
              Create Survey
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default AvailabilitySurveyModal
