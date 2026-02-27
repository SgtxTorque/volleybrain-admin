import { useState } from 'react'
import { X } from '../../constants/icons'

function VenueManagerModal({ venues, onClose, onSave }) {
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Manage Venues</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-slate-400 text-sm">Save frequently used locations for quick selection</p>
          
          {/* Existing venues */}
          <div className="space-y-2">
            {localVenues.map((venue, i) => (
              <div key={i} className="bg-slate-900 rounded-xl p-4 flex items-start justify-between">
                <div>
                  <p className="font-medium text-white">{venue.name}</p>
                  {venue.address && <p className="text-sm text-slate-400">{venue.address}</p>}
                  {venue.notes && <p className="text-xs text-slate-500 mt-1">{venue.notes}</p>}
                </div>
                <button onClick={() => removeVenue(i)} className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>

          {/* Add new venue */}
          <div className="border-t border-slate-700 pt-4">
            <h4 className="text-sm font-medium text-white mb-3">Add New Venue</h4>
            <div className="space-y-3">
              <input type="text" value={newVenue.name} onChange={e => setNewVenue({...newVenue, name: e.target.value})}
                placeholder="Venue name (e.g., Main Gym)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
              <input type="text" value={newVenue.address} onChange={e => setNewVenue({...newVenue, address: e.target.value})}
                placeholder="Address"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
              <input type="text" value={newVenue.notes} onChange={e => setNewVenue({...newVenue, notes: e.target.value})}
                placeholder="Notes (e.g., Court 2, Park at back)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
              <button onClick={addVenue} disabled={!newVenue.name}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-xl hover:bg-slate-600 disabled:opacity-50">
                + Add Venue
              </button>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 rounded-xl border border-slate-700 text-white">Cancel</button>
          <button onClick={handleSave} className="px-6 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold">Save Venues</button>
        </div>
      </div>
    </div>
  )
}

export default VenueManagerModal
