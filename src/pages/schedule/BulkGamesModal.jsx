import { useState } from 'react'
import { X } from '../../constants/icons'

function BulkGamesModal({ teams, venues, onClose, onCreate }) {
  const [games, setGames] = useState([
    { team_id: '', date: '', time: '10:00', opponent: '', venue_name: '', court_number: '', location_type: 'home' }
  ])
  const [notifyFamilies, setNotifyFamilies] = useState(true)

  function addRow() {
    setGames([...games, { team_id: '', date: '', time: '10:00', opponent: '', venue_name: '', court_number: '', location_type: 'home' }])
  }

  function removeRow(index) {
    setGames(games.filter((_, i) => i !== index))
  }

  function updateRow(index, field, value) {
    const updated = [...games]
    updated[index][field] = value
    setGames(updated)
  }

  async function handleSubmit() {
    const validGames = games.filter(g => g.date && g.time)
    if (validGames.length === 0) {
      alert('Please enter at least one game with date and time')
      return
    }

    const eventsData = validGames.map(g => {
      const venue = venues.find(v => v.name === g.venue_name)
      
      // Calculate end time (2 hours after start)
      const [hours, minutes] = g.time.split(':')
      const endHours = (parseInt(hours) + 2) % 24
      const endTime = `${endHours.toString().padStart(2, '0')}:${minutes}`

      return {
        team_id: g.team_id || null,
        event_type: 'game',
        title: g.opponent ? `vs ${g.opponent}` : 'Game',
        notes: '',
        event_date: g.date,  // DATE format: YYYY-MM-DD
        event_time: g.time,  // TIME format: HH:MM
        end_time: endTime,   // TIME format: HH:MM
        opponent_name: g.opponent,
        venue_name: g.venue_name,
        venue_address: venue?.address || '',
        court_number: g.court_number || null,
        location_type: g.location_type
      }
    })

    const success = await onCreate(eventsData, notifyFamilies)
    if (success) onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800">
          <div>
            <h2 className="text-xl font-semibold text-white">Bulk Add Games</h2>
            <p className="text-sm text-slate-400">Enter multiple games at once</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-slate-400">
                  <th className="pb-3 pr-2">Team</th>
                  <th className="pb-3 pr-2">Date</th>
                  <th className="pb-3 pr-2">Time</th>
                  <th className="pb-3 pr-2">Opponent</th>
                  <th className="pb-3 pr-2">Venue</th>
                  <th className="pb-3 pr-2">Ct #</th>
                  <th className="pb-3 pr-2">H/A</th>
                  <th className="pb-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {games.map((game, i) => (
                  <tr key={i}>
                    <td className="pb-2 pr-2">
                      <select value={game.team_id} onChange={e => updateRow(i, 'team_id', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-white text-sm">
                        <option value="">All</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </td>
                    <td className="pb-2 pr-2">
                      <input type="date" value={game.date} onChange={e => updateRow(i, 'date', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-white text-sm" />
                    </td>
                    <td className="pb-2 pr-2">
                      <input type="time" value={game.time} onChange={e => updateRow(i, 'time', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-white text-sm" />
                    </td>
                    <td className="pb-2 pr-2">
                      <input type="text" value={game.opponent} onChange={e => updateRow(i, 'opponent', e.target.value)}
                        placeholder="Opponent"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-white text-sm" />
                    </td>
                    <td className="pb-2 pr-2">
                      <select value={game.venue_name} onChange={e => updateRow(i, 'venue_name', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-white text-sm">
                        <option value="">Select venue</option>
                        {venues.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                      </select>
                    </td>
                    <td className="pb-2 pr-2">
                      <input type="text" value={game.court_number || ''} onChange={e => updateRow(i, 'court_number', e.target.value)}
                        placeholder="#"
                        className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-white text-sm text-center" />
                    </td>
                    <td className="pb-2 pr-2">
                      <select value={game.location_type} onChange={e => updateRow(i, 'location_type', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-white text-sm">
                        <option value="home">Home</option>
                        <option value="away">Away</option>
                        <option value="neutral">Neutral</option>
                      </select>
                    </td>
                    <td className="pb-2">
                      <button onClick={() => removeRow(i)} className="text-red-400 hover:text-red-300 p-2"><X className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <button onClick={addRow} className="mt-4 px-4 py-2 border border-dashed border-slate-700 rounded-xl text-slate-400 hover:text-white hover:border-[var(--accent-primary)]/30 w-full">
            + Add Another Game
          </button>

          <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-900 rounded-xl mt-4">
            <input type="checkbox" checked={notifyFamilies} onChange={e => setNotifyFamilies(e.target.checked)}
              className="w-5 h-5 rounded" />
            <span className="text-white">Notify all families after creating</span>
          </label>
        </div>
        <div className="p-6 border-t border-slate-700 flex justify-between items-center sticky bottom-0 bg-slate-800">
          <span className="text-slate-400">
            {games.filter(g => g.date && g.time).length} valid game{games.filter(g => g.date && g.time).length !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-2 rounded-xl border border-slate-700 text-white">Cancel</button>
            <button onClick={handleSubmit} className="px-6 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold">
              Create Games
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BulkGamesModal
