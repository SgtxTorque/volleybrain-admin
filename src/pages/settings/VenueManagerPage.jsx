import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  MapPin, Plus, Edit, Trash2, Check, X, Loader2, Save, Building2
} from '../../constants/icons'
import PageShell from '../../components/pages/PageShell'

// ============================================
// VENUE MANAGER PAGE
// Standalone page at /settings/venues for managing org venues
// ============================================

function VenueManagerPage({ showToast }) {
  const { organization } = useAuth()
  const tc = useThemeClasses()
  const { isDark } = useTheme()

  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const [form, setForm] = useState({
    name: '', address: '', city: '', state: '', zip: '',
    courts_count: '', notes: '',
  })

  useEffect(() => { loadVenues() }, [organization])

  async function loadVenues() {
    if (!organization?.id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('organization_id', organization.id)
        .order('name')
      if (error) throw error
      setVenues(data || [])
    } catch (err) {
      console.error('Load venues error:', err)
    }
    setLoading(false)
  }

  function openAdd() {
    setForm({ name: '', address: '', city: '', state: '', zip: '', courts_count: '', notes: '' })
    setEditingId(null)
    setShowForm(true)
  }

  function openEdit(venue) {
    setForm({
      name: venue.name || '',
      address: venue.address || '',
      city: venue.city || '',
      state: venue.state || '',
      zip: venue.zip || '',
      courts_count: venue.courts_count || '',
      notes: venue.notes || '',
    })
    setEditingId(venue.id)
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.name.trim()) {
      showToast?.('Venue name is required', 'error')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        zip: form.zip.trim() || null,
        courts_count: form.courts_count ? parseInt(form.courts_count) : null,
        notes: form.notes.trim() || null,
        organization_id: organization.id,
        is_active: true,
      }

      if (editingId) {
        const { error } = await supabase.from('venues').update(payload).eq('id', editingId)
        if (error) throw error
        showToast?.('Venue updated!', 'success')
      } else {
        const { error } = await supabase.from('venues').insert(payload)
        if (error) throw error
        showToast?.('Venue added!', 'success')
      }

      setShowForm(false)
      setEditingId(null)
      loadVenues()
    } catch (err) {
      showToast?.(`Save failed: ${err.message}`, 'error')
    }
    setSaving(false)
  }

  async function handleDelete(id) {
    try {
      const { error } = await supabase.from('venues').delete().eq('id', id)
      if (error) throw error
      showToast?.('Venue deleted', 'success')
      setDeleteConfirm(null)
      loadVenues()
    } catch (err) {
      showToast?.(`Delete failed: ${err.message}`, 'error')
    }
  }

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const v2Input = `w-full px-4 py-2.5 rounded-xl text-sm font-medium border focus:outline-none focus:border-[#4BB9EC] focus:ring-2 focus:ring-[#4BB9EC]/10 ${
    isDark ? 'bg-white/[0.04] border-white/[0.08] text-white placeholder-slate-600' : 'bg-white border-[#E8ECF2] text-[#10284C]'
  }`
  const v2Label = `block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`

  return (
    <PageShell
      breadcrumb="Setup"
      title="Venue Manager"
      subtitle="Manage locations for practices, games, and events"
      actions={
        <button onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#10284C] hover:brightness-110 text-white rounded-xl text-sm font-bold transition"
          style={{ fontFamily: 'var(--v2-font)' }}>
          <Plus className="w-4 h-4" /> Add Venue
        </button>
      }
    >
      {/* Navy Header */}
      <div className="bg-[#10284C] rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-white" style={{ fontFamily: 'var(--v2-font)' }}>
              Venue Manager
            </h2>
            <p className="text-sm text-white/50">Practice and game locations</p>
          </div>
          <div className="text-right">
            <span className="text-4xl font-black italic text-[#4BB9EC]">{venues.length}</span>
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Venues</div>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className={`rounded-[14px] p-6 mb-6 ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2] shadow-sm'}`}>
          <h3 className={`text-base font-bold mb-4 ${isDark ? 'text-white' : 'text-[#10284C]'}`} style={{ fontFamily: 'var(--v2-font)' }}>
            {editingId ? 'Edit Venue' : 'Add New Venue'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={v2Label}>Venue Name *</label>
              <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="e.g., Main Gymnasium" className={v2Input} />
            </div>
            <div className="sm:col-span-2">
              <label className={v2Label}>Address</label>
              <input type="text" value={form.address} onChange={e => set('address', e.target.value)}
                placeholder="Street address" className={v2Input} />
            </div>
            <div>
              <label className={v2Label}>City</label>
              <input type="text" value={form.city} onChange={e => set('city', e.target.value)} className={v2Input} />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className={v2Label}>State</label>
                <input type="text" value={form.state} onChange={e => set('state', e.target.value)} className={v2Input} />
              </div>
              <div className="flex-1">
                <label className={v2Label}>Zip</label>
                <input type="text" value={form.zip} onChange={e => set('zip', e.target.value)} className={v2Input} />
              </div>
            </div>
            <div>
              <label className={v2Label}>Courts / Fields</label>
              <input type="number" value={form.courts_count} onChange={e => set('courts_count', e.target.value)}
                placeholder="Number of courts" className={v2Input} />
            </div>
            <div>
              <label className={v2Label}>Notes</label>
              <input type="text" value={form.notes} onChange={e => set('notes', e.target.value)}
                placeholder="e.g., Park at back entrance" className={v2Input} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-5">
            <button onClick={() => { setShowForm(false); setEditingId(null) }}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition ${
                isDark ? 'bg-white/[0.06] text-white hover:bg-white/[0.1] border border-white/[0.1]' : 'bg-[#F5F6F8] text-[#10284C] hover:bg-[#E8ECF2] border border-[#E8ECF2]'
              }`}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#10284C] hover:brightness-110 text-white rounded-xl text-sm font-bold transition disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingId ? 'Update' : 'Add'} Venue
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#4BB9EC] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : venues.length === 0 ? (
        <div className={`rounded-[14px] p-12 text-center ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'}`}>
          <MapPin className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
          <p className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-[#10284C]'}`} style={{ fontFamily: 'var(--v2-font)' }}>No Venues Yet</p>
          <p className={`text-sm mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Add your practice and game locations to use them when scheduling events.
          </p>
          <button onClick={openAdd}
            className="px-5 py-2.5 bg-[#10284C] hover:brightness-110 text-white rounded-xl text-sm font-bold transition">
            Add First Venue
          </button>
        </div>
      ) : (
        /* Venue Cards */
        <div className="space-y-3">
          {venues.map(venue => (
            <div key={venue.id}
              className={`rounded-[14px] p-5 flex items-start justify-between transition hover:shadow-md ${
                isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'
              }`}>
              <div className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isDark ? 'bg-[#4BB9EC]/15' : 'bg-[#4BB9EC]/10'
                }`}>
                  <MapPin className="w-5 h-5 text-[#4BB9EC]" />
                </div>
                <div>
                  <h3 className={`font-bold ${isDark ? 'text-white' : 'text-[#10284C]'}`} style={{ fontFamily: 'var(--v2-font)' }}>{venue.name}</h3>
                  {venue.address && (
                    <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {venue.address}
                      {venue.city && `, ${venue.city}`}
                      {venue.state && `, ${venue.state}`}
                      {venue.zip && ` ${venue.zip}`}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    {venue.courts_count && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${isDark ? 'bg-white/[0.06] text-slate-400' : 'bg-[#F5F6F8] text-slate-500'}`}>
                        {venue.courts_count} court{venue.courts_count > 1 ? 's' : ''}
                      </span>
                    )}
                    {venue.notes && (
                      <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{venue.notes}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => openEdit(venue)}
                  className={`p-2 rounded-xl transition ${isDark ? 'hover:bg-white/[0.06] text-slate-400' : 'hover:bg-[#F5F6F8] text-slate-400'}`}>
                  <Edit className="w-4 h-4" />
                </button>
                {deleteConfirm === venue.id ? (
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleDelete(venue.id)}
                      className="p-2 rounded-xl bg-red-500/15 text-red-400 hover:bg-red-500/25 transition">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteConfirm(null)}
                      className={`p-2 rounded-xl transition ${isDark ? 'hover:bg-white/[0.06] text-slate-400' : 'hover:bg-[#F5F6F8] text-slate-400'}`}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteConfirm(venue.id)}
                    className={`p-2 rounded-xl transition ${isDark ? 'hover:bg-white/[0.06] text-slate-400' : 'hover:bg-[#F5F6F8] text-slate-400'}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  )
}

export { VenueManagerPage }
