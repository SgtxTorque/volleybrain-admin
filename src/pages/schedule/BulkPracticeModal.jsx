import { useState, useEffect } from 'react'
import { X } from '../../constants/icons'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'

function BulkPracticeModal({ teams, venues, onClose, onCreate }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const [form, setForm] = useState({
    team_id: '',
    start_time: '18:00',
    end_time: '19:30',
    start_date: '',
    end_date: '',
    notify_families: true
  })
  
  // Track day configurations with their own venues
  const [dayConfigs, setDayConfigs] = useState([])
  const [preview, setPreview] = useState([])
  const [showPreviewEdit, setShowPreviewEdit] = useState(false)

  const dayOptions = [
    { value: 0, label: 'Sunday', short: 'Sun' },
    { value: 1, label: 'Monday', short: 'Mon' },
    { value: 2, label: 'Tuesday', short: 'Tue' },
    { value: 3, label: 'Wednesday', short: 'Wed' },
    { value: 4, label: 'Thursday', short: 'Thu' },
    { value: 5, label: 'Friday', short: 'Fri' },
    { value: 6, label: 'Saturday', short: 'Sat' },
  ]

  function toggleDay(dayValue) {
    const existing = dayConfigs.find(d => d.day === dayValue)
    if (existing) {
      setDayConfigs(dayConfigs.filter(d => d.day !== dayValue))
    } else {
      setDayConfigs([...dayConfigs, { 
        day: dayValue, 
        venue_name: '', 
        venue_address: '',
        court_number: '',
        start_time: form.start_time,
        end_time: form.end_time
      }])
    }
  }

  function updateDayConfig(dayValue, field, value) {
    setDayConfigs(dayConfigs.map(d => 
      d.day === dayValue ? { ...d, [field]: value } : d
    ))
  }

  function handleVenueSelectForDay(dayValue, venueName) {
    const venue = venues.find(v => v.name === venueName)
    setDayConfigs(dayConfigs.map(d => 
      d.day === dayValue ? { 
        ...d, 
        venue_name: venue?.name || venueName, 
        venue_address: venue?.address || '' 
      } : d
    ))
  }

  function applyVenueToAllDays(venueName) {
    const venue = venues.find(v => v.name === venueName)
    setDayConfigs(dayConfigs.map(d => ({
      ...d,
      venue_name: venue?.name || venueName,
      venue_address: venue?.address || ''
    })))
  }

  function generatePreview() {
    if (!form.start_date || !form.end_date || dayConfigs.length === 0) {
      setPreview([])
      return
    }

    const events = []
    // Parse as LOCAL dates to avoid UTC timezone offset shifting days
    const [sy, sm, sd] = form.start_date.split('-').map(Number)
    const [ey, em, ed] = form.end_date.split('-').map(Number)
    const start = new Date(sy, sm - 1, sd)
    const end = new Date(ey, em - 1, ed)
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayConfig = dayConfigs.find(dc => dc.day === d.getDay())
      if (dayConfig) {
        events.push({
          id: `${d.getTime()}`,
          date: new Date(d),
          dayName: dayOptions.find(opt => opt.value === d.getDay())?.label,
          venue_name: dayConfig.venue_name,
          venue_address: dayConfig.venue_address,
          court_number: dayConfig.court_number || '',
          start_time: dayConfig.start_time || form.start_time,
          end_time: dayConfig.end_time || form.end_time
        })
      }
    }
    setPreview(events)
  }

  useEffect(() => {
    generatePreview()
  }, [form.start_date, form.end_date, dayConfigs])

  function updatePreviewItem(id, field, value) {
    setPreview(preview.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  function removePreviewItem(id) {
    setPreview(preview.filter(p => p.id !== id))
  }

  async function handleSubmit() {
    if (preview.length === 0) {
      alert('No practices to create. Please select days and date range.')
      return
    }

    const eventsData = preview.map(p => {
      // Format date as YYYY-MM-DD using LOCAL time (not UTC via toISOString)
      const y = p.date.getFullYear()
      const m = String(p.date.getMonth() + 1).padStart(2, '0')
      const dd = String(p.date.getDate()).padStart(2, '0')
      const eventDate = `${y}-${m}-${dd}`
      
      return {
        team_id: form.team_id || null,
        event_type: 'practice',
        title: 'Practice',
        notes: '',  // Your schema uses 'notes' not 'description'
        event_date: eventDate,  // DATE format: YYYY-MM-DD
        event_time: p.start_time || form.start_time,  // TIME format: HH:MM
        end_time: p.end_time || form.end_time,  // TIME format: HH:MM
        venue_name: p.venue_name || '',
        venue_address: p.venue_address || '',
        court_number: p.court_number || null,
        location_type: 'home'
      }
    })

    const success = await onCreate(eventsData, form.notify_families)
    if (success) onClose()
  }

  const selectedDays = dayConfigs.map(d => d.day)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto`}>
        <div className={`p-6 border-b ${tc.border} flex items-center justify-between sticky top-0 ${tc.cardBg} z-10`}>
          <div>
            <h2 className={`text-xl font-bold ${tc.text}`}>Create Recurring Practice</h2>
            <p className={`text-sm ${tc.textMuted}`}>Schedule practices with per-day venue control</p>
          </div>
          <button onClick={onClose} className={`${tc.textMuted} hover:${isDark ? 'text-white' : 'text-slate-900'} text-2xl p-1`}>×</button>
        </div>
        <div className="p-6 space-y-6">
          {/* Team Selection */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Team</label>
            <select value={form.team_id} onChange={e => setForm({...form, team_id: e.target.value})}
              className={`w-full ${tc.input} border rounded-xl px-4 py-3 text-sm`}>
              <option value="">All Teams / Org-wide</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>First Practice</label>
              <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})}
                className={`w-full ${tc.input} border rounded-xl px-4 py-3 text-sm`} />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Last Practice</label>
              <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})}
                className={`w-full ${tc.input} border rounded-xl px-4 py-3 text-sm`} />
            </div>
          </div>

          {/* Default Times */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Default Start Time</label>
              <input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})}
                className={`w-full ${tc.input} border rounded-xl px-4 py-3 text-sm`} />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Default End Time</label>
              <input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})}
                className={`w-full ${tc.input} border rounded-xl px-4 py-3 text-sm`} />
            </div>
          </div>

          {/* Day Selection */}
          <div>
            <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Practice Days</label>
            <div className="flex flex-wrap gap-2">
              {dayOptions.map(day => (
                <button
                  key={day.value}
                  onClick={() => toggleDay(day.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                    selectedDays.includes(day.value)
                      ? 'bg-[var(--accent-primary)] text-white'
                      : isDark ? 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-white' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Per-Day Venue Configuration */}
          {dayConfigs.length > 0 && (
            <div className={`${isDark ? 'bg-slate-900' : 'bg-slate-50'} rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-4">
                <h4 className={`text-sm font-medium ${tc.text}`}>Venue per Day</h4>
                {venues.length > 0 && (
                  <select
                    onChange={e => e.target.value && applyVenueToAllDays(e.target.value)}
                    className={`${tc.input} border rounded-lg px-3 py-1 text-sm`}
                  >
                    <option value="">Apply to all days...</option>
                    {venues.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                  </select>
                )}
              </div>
              <div className="space-y-3">
                {dayConfigs.sort((a, b) => a.day - b.day).map(dc => (
                  <div key={dc.day} className={`flex items-center gap-3 p-3 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white border border-slate-200'}`}>
                    <div className={`w-24 font-medium ${tc.text}`}>
                      {dayOptions.find(d => d.value === dc.day)?.label}
                    </div>
                    <select
                      value={dc.venue_name}
                      onChange={e => handleVenueSelectForDay(dc.day, e.target.value)}
                      className={`flex-1 ${tc.input} border rounded-lg px-3 py-2 text-sm`}
                    >
                      <option value="">Select venue...</option>
                      {venues.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                    </select>
                    <input
                      type="text"
                      placeholder="Ct #"
                      value={dc.court_number || ''}
                      onChange={e => updateDayConfig(dc.day, 'court_number', e.target.value)}
                      className={`w-16 ${tc.input} border rounded-lg px-2 py-2 text-sm text-center`}
                    />
                    <input
                      type="time"
                      value={dc.start_time || form.start_time}
                      onChange={e => updateDayConfig(dc.day, 'start_time', e.target.value)}
                      className={`w-28 ${tc.input} border rounded-lg px-2 py-2 text-sm`}
                    />
                    <span className={tc.textMuted}>-</span>
                    <input
                      type="time"
                      value={dc.end_time || form.end_time}
                      onChange={e => updateDayConfig(dc.day, 'end_time', e.target.value)}
                      className={`w-28 ${tc.input} border rounded-lg px-2 py-2 text-sm`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && (
            <div className={`${isDark ? 'bg-slate-900' : 'bg-slate-50'} rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className={`text-sm font-medium ${tc.text}`}>Preview: {preview.length} practices</h4>
                <button
                  onClick={() => setShowPreviewEdit(!showPreviewEdit)}
                  className="text-xs text-[var(--accent-primary)] hover:underline"
                >
                  {showPreviewEdit ? 'Hide Details' : 'Edit Individual Practices'}
                </button>
              </div>
              
              {showPreviewEdit ? (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {preview.map((p, i) => (
                    <div key={p.id} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${isDark ? 'bg-slate-800' : 'bg-white border border-slate-100'}`}>
                      <span className={`w-20 ${tc.textMuted}`}>{p.date.toLocaleDateString()}</span>
                      <span className={`w-16 ${tc.text}`}>{p.dayName?.slice(0, 3)}</span>
                      <select
                        value={p.venue_name}
                        onChange={e => {
                          const venue = venues.find(v => v.name === e.target.value)
                          updatePreviewItem(p.id, 'venue_name', venue?.name || '')
                          updatePreviewItem(p.id, 'venue_address', venue?.address || '')
                        }}
                        className={`flex-1 ${tc.input} border rounded px-2 py-1 text-xs`}
                      >
                        <option value="">No venue</option>
                        {venues.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                      </select>
                      <button onClick={() => removePreviewItem(p.id)} className="text-red-400 hover:text-red-300 px-2"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {preview.slice(0, 15).map((p, i) => (
                    <div key={p.id} className={`text-sm ${tc.textMuted} flex justify-between`}>
                      <span>{p.dayName} - {p.date.toLocaleDateString()}</span>
                      <span className={tc.textMuted}>{p.venue_name || 'No venue'}</span>
                    </div>
                  ))}
                  {preview.length > 15 && (
                    <div className={`text-sm ${tc.textMuted}`}>...and {preview.length - 15} more</div>
                  )}
                </div>
              )}
            </div>
          )}

          <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
            <input type="checkbox" checked={form.notify_families} onChange={e => setForm({...form, notify_families: e.target.checked})}
              className="w-5 h-5 rounded" />
            <span className={tc.text}>Notify all families after creating</span>
          </label>
        </div>
        <div className={`p-6 border-t ${tc.border} flex justify-between items-center sticky bottom-0 ${tc.cardBg} z-10`}>
          <span className={tc.textMuted}>
            {preview.length > 0 ? `${preview.length} practices will be created` : 'Select days and date range'}
          </span>
          <div className="flex gap-3">
            <button onClick={onClose} className={`px-6 py-2.5 rounded-xl border font-medium transition ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-700' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>Cancel</button>
            <button onClick={handleSubmit} disabled={preview.length === 0}
              className="px-6 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white font-semibold hover:brightness-110 transition disabled:opacity-50">
              Create {preview.length} Practices
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BulkPracticeModal
