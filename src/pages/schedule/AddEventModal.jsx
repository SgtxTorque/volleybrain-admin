import { useState } from 'react'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'

function AddEventModal({ teams, venues, onClose, onCreate }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const [form, setForm] = useState({
    team_id: '',
    event_type: 'practice',
    title: '',
    description: '',
    start_date: '',
    start_time: '18:00',
    end_time: '19:00',
    venue_name: '',
    venue_address: '',
    court_number: '',
    location_type: 'home',
    opponent_name: '',
    arrival_time: '',
    notify_families: false
  })

  function handleVenueSelect(venueName) {
    const venue = venues.find(v => v.name === venueName)
    setForm({ ...form, venue_name: venue?.name || venueName, venue_address: venue?.address || '' })
  }

  async function handleSubmit() {
    if (!form.start_date || !form.start_time) {
      alert('Please enter date and time')
      return
    }
    
    // Build arrival_time as full timestamp if provided
    let arrivalTimestamp = null
    if (form.arrival_time) {
      arrivalTimestamp = `${form.start_date}T${form.arrival_time}:00`
    }
    
    // Use your schema: event_date (date) + event_time (time) + end_time (time)
    const eventData = {
      team_id: form.team_id || null,
      event_type: form.event_type,
      title: form.title || form.event_type.charAt(0).toUpperCase() + form.event_type.slice(1),
      notes: form.description,  // Your schema uses 'notes' not 'description'
      event_date: form.start_date,  // DATE format: YYYY-MM-DD
      event_time: form.start_time,  // TIME format: HH:MM
      end_time: form.end_time || null,  // TIME format: HH:MM
      venue_name: form.venue_name,
      venue_address: form.venue_address,
      court_number: form.court_number || null,
      location_type: form.location_type,
      opponent_name: form.opponent_name,
      arrival_time: arrivalTimestamp  // TIMESTAMP format: YYYY-MM-DDTHH:MM:SS
    }
    
    const success = await onCreate(eventData)
    if (success) onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`${tc.cardBg} border ${tc.border} rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto`}>
        <div className={`p-6 border-b ${tc.border} flex items-center justify-between sticky top-0 ${tc.cardBg} z-10`}>
          <h2 className={`text-xl font-bold ${tc.text}`}>Add Event</h2>
          <button onClick={onClose} className={`${tc.textMuted} hover:${isDark ? 'text-white' : 'text-slate-900'} text-2xl p-1`}>×</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Event Type</label>
              <select value={form.event_type} onChange={e => setForm({...form, event_type: e.target.value})}
                className={`w-full ${tc.input} border rounded-xl px-4 py-3 text-sm`}>
                <option value="practice">Practice</option>
                <option value="game">Game</option>
                <option value="tournament">Tournament</option>
                <option value="team_event">Team Event</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Team (optional)</label>
              <select value={form.team_id} onChange={e => setForm({...form, team_id: e.target.value})}
                className={`w-full ${tc.input} border rounded-xl px-4 py-3 text-sm`}>
                <option value="">All Teams / Org-wide</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Title</label>
            <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
              placeholder={form.event_type.charAt(0).toUpperCase() + form.event_type.slice(1)}
              className={`w-full ${tc.input} border rounded-xl px-4 py-3 text-sm`} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Date</label>
              <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})}
                className={`w-full ${tc.input} border rounded-xl px-4 py-3 text-sm`} />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Start Time</label>
              <input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})}
                className={`w-full ${tc.input} border rounded-xl px-4 py-3 text-sm`} />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>End Time</label>
              <input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})}
                className={`w-full ${tc.input} border rounded-xl px-4 py-3 text-sm`} />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Venue</label>
            <select value={form.venue_name} onChange={e => handleVenueSelect(e.target.value)}
              className={`w-full ${tc.input} border rounded-xl px-4 py-3 text-sm mb-2`}>
              <option value="">Select saved venue or enter below</option>
              {venues.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
            </select>
            <input type="text" value={form.venue_name} onChange={e => setForm({...form, venue_name: e.target.value})}
              placeholder="Venue name"
              className={`w-full ${tc.input} border rounded-xl px-4 py-3 text-sm mb-2`} />
            <input type="text" value={form.venue_address} onChange={e => setForm({...form, venue_address: e.target.value})}
              placeholder="Address"
              className={`w-full ${tc.input} border rounded-xl px-4 py-3 text-sm`} />
            <input type="text" value={form.court_number} onChange={e => setForm({...form, court_number: e.target.value})}
              placeholder="Court / Field # (optional)"
              className={`w-full ${tc.input} border rounded-xl px-4 py-3 text-sm mt-2`} />
          </div>

          {form.event_type === 'game' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Location Type</label>
                  <select value={form.location_type} onChange={e => setForm({...form, location_type: e.target.value})}
                    className={`w-full ${tc.input} border rounded-xl px-4 py-3 text-sm`}>
                    <option value="home">Home</option>
                    <option value="away">Away</option>
                    <option value="neutral">Neutral</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Opponent</label>
                  <input type="text" value={form.opponent_name} onChange={e => setForm({...form, opponent_name: e.target.value})}
                    placeholder="Opponent team name"
                    className={`w-full ${tc.input} border rounded-xl px-4 py-3 text-sm`} />
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Arrival Time (optional)</label>
                <input type="time" value={form.arrival_time} onChange={e => setForm({...form, arrival_time: e.target.value})}
                  className={`w-full ${tc.input} border rounded-xl px-4 py-3 text-sm`} />
              </div>
            </>
          )}

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Description (optional)</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              placeholder="Additional details..."
              className={`w-full ${tc.input} border rounded-xl px-4 py-3 text-sm min-h-[80px]`} />
          </div>

          <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
            <input type="checkbox" checked={form.notify_families} onChange={e => setForm({...form, notify_families: e.target.checked})}
              className="w-5 h-5 rounded" />
            <span className={tc.text}>Notify all families after creating</span>
          </label>
        </div>
        <div className={`p-6 border-t ${tc.border} flex justify-end gap-3 sticky bottom-0 ${tc.cardBg}`}>
          <button onClick={onClose} className={`px-6 py-2.5 rounded-xl border font-medium transition ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-700' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>Cancel</button>
          <button onClick={handleSubmit} className="px-6 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white font-semibold hover:brightness-110 transition">Create Event</button>
        </div>
      </div>
    </div>
  )
}

export default AddEventModal
