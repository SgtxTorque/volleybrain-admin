import { useState } from 'react'
import { X } from '../../constants/icons'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'

function VenueManagerModal({ venues, onClose, onSave }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const [localVenues, setLocalVenues] = useState([...venues])
  const [newVenue, setNewVenue] = useState({ name: '', address: '', notes: '' })

  function addVenue() {
    if (!newVenue.name) return
    setLocalVenues([...localVenues, { ...newVenue }])
    setNewVenue({ name: '', address: '', notes: '' })
  }

  function removeVenue(index) {
    setLocalVenues(localVenues.filter((_, i) => i !== index))
  }

  function handleSave() {
    onSave(localVenues)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`${tc.cardBg} border ${tc.border} rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto`}>
        <div className={`p-6 border-b ${tc.border} flex items-center justify-between`}>
          <h2 className={`text-xl font-bold ${tc.text}`}>Manage Venues</h2>
          <button onClick={onClose} className={`${tc.textMuted} hover:${isDark ? 'text-white' : 'text-slate-900'} text-2xl p-1`}>×</button>
        </div>
        <div className="p-6 space-y-4">
          <p className={`text-sm ${tc.textMuted}`}>Save frequently used locations for quick selection</p>

          {/* Existing venues */}
          <div className="space-y-2">
            {localVenues.map((venue, i) => (
              <div key={i} className={`${isDark ? 'bg-slate-900' : 'bg-slate-50'} rounded-xl p-4 flex items-start justify-between`}>
                <div>
                  <p className={`font-medium ${tc.text}`}>{venue.name}</p>
                  {venue.address && <p className={`text-sm ${tc.textMuted}`}>{venue.address}</p>}
                  {venue.notes && <p className={`text-xs ${tc.textMuted} mt-1`}>{venue.notes}</p>}
                </div>
                <button onClick={() => removeVenue(i)} className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>

          {/* Add new venue */}
          <div className={`border-t ${tc.border} pt-4`}>
            <h4 className={`text-sm font-medium ${tc.text} mb-3`}>Add New Venue</h4>
            <div className="space-y-3">
              <input type="text" value={newVenue.name} onChange={e => setNewVenue({...newVenue, name: e.target.value})}
                placeholder="Venue name (e.g., Main Gym)"
                className={`w-full ${tc.input} border rounded-xl px-4 py-3 text-sm`} />
              <input type="text" value={newVenue.address} onChange={e => setNewVenue({...newVenue, address: e.target.value})}
                placeholder="Address"
                className={`w-full ${tc.input} border rounded-xl px-4 py-3 text-sm`} />
              <input type="text" value={newVenue.notes} onChange={e => setNewVenue({...newVenue, notes: e.target.value})}
                placeholder="Notes (e.g., Court 2, Park at back)"
                className={`w-full ${tc.input} border rounded-xl px-4 py-3 text-sm`} />
              <button onClick={addVenue} disabled={!newVenue.name}
                className={`w-full px-4 py-2 rounded-xl transition disabled:opacity-50 ${isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                + Add Venue
              </button>
            </div>
          </div>
        </div>
        <div className={`p-6 border-t ${tc.border} flex justify-end gap-3`}>
          <button onClick={onClose} className={`px-6 py-2.5 rounded-xl border font-medium transition ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-700' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>Cancel</button>
          <button onClick={handleSave} className="px-6 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white font-semibold hover:brightness-110 transition">Save Venues</button>
        </div>
      </div>
    </div>
  )
}

export default VenueManagerModal
