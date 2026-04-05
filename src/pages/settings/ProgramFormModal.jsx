import { useState, useEffect } from 'react'
import { X } from '../../constants/icons'

export default function ProgramFormModal({
  showModal, setShowModal, editingProgram, sports, tc, isDark, onSave
}) {
  const [form, setForm] = useState({ name: '', sport_id: null, icon: '', description: '', is_active: true, display_order: 0 })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (showModal && editingProgram) {
      setForm({
        name: editingProgram.name || '',
        sport_id: editingProgram.sport_id || null,
        icon: editingProgram.icon || '',
        description: editingProgram.description || '',
        is_active: editingProgram.is_active ?? true,
        display_order: editingProgram.display_order || 0,
      })
    } else if (showModal) {
      setForm({ name: '', sport_id: null, icon: '', description: '', is_active: true, display_order: 0 })
    }
  }, [showModal, editingProgram])

  // Auto-set icon from selected sport
  useEffect(() => {
    if (form.sport_id && !form.icon) {
      const sport = sports?.find(s => s.id === form.sport_id)
      if (sport?.icon) setForm(f => ({ ...f, icon: sport.icon }))
    }
  }, [form.sport_id])

  if (!showModal) return null

  const missingName = !form.name?.trim()

  async function handleSave() {
    if (missingName) return
    setSaving(true)
    await onSave(form, editingProgram)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className={`${tc.cardBg} border ${tc.border} rounded-[14px] shadow-2xl w-full max-w-lg`}>
        <div className={`p-6 border-b ${tc.border} flex items-center justify-between`}>
          <h2 className={`text-xl font-semibold ${tc.text}`}>
            {editingProgram ? 'Edit Program' : 'Create Program'}
          </h2>
          <button onClick={() => setShowModal(false)} className={`${tc.textMuted} ${isDark ? 'hover:text-white' : 'hover:text-slate-900'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className={`block text-sm ${tc.textMuted} mb-2`}>
              Program Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Club Volleyball, Summer Skills Clinic"
              className={`w-full ${tc.input} rounded-[14px] px-4 py-3`}
            />
          </div>

          {/* Sport (optional) */}
          {sports && sports.length > 0 && (
            <div>
              <label className={`block text-sm ${tc.textMuted} mb-2`}>
                Sport <span className={tc.textMuted}>(optional)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, sport_id: null, icon: '' })}
                  className={`p-3 rounded-[14px] border-2 text-left transition-all ${
                    !form.sport_id
                      ? 'border-lynx-sky bg-lynx-sky/10'
                      : `${tc.border} ${isDark ? 'hover:border-slate-600' : 'hover:border-slate-300'}`
                  }`}
                >
                  <span className="text-xl">📋</span>
                  <p className={`text-sm font-medium mt-1 ${!form.sport_id ? tc.text : tc.textMuted}`}>
                    No Sport
                  </p>
                </button>
                {sports.map(sport => (
                  <button
                    key={sport.id}
                    type="button"
                    onClick={() => setForm({ ...form, sport_id: sport.id, icon: sport.icon || '' })}
                    className={`p-3 rounded-[14px] border-2 text-left transition-all ${
                      form.sport_id === sport.id
                        ? 'border-lynx-sky bg-lynx-sky/10'
                        : `${tc.border} ${isDark ? 'hover:border-slate-600' : 'hover:border-slate-300'}`
                    }`}
                  >
                    <span className="text-xl">{sport.icon}</span>
                    <p className={`text-sm font-medium mt-1 ${form.sport_id === sport.id ? tc.text : tc.textMuted}`}>
                      {sport.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Icon override */}
          <div>
            <label className={`block text-sm ${tc.textMuted} mb-2`}>
              Icon <span className={tc.textMuted}>(emoji)</span>
            </label>
            <input
              type="text"
              value={form.icon}
              onChange={e => setForm({ ...form, icon: e.target.value })}
              placeholder="e.g., 🏐, 🏀, ⚽"
              className={`w-20 ${tc.input} rounded-[14px] px-4 py-3 text-center text-xl`}
            />
          </div>

          {/* Description */}
          <div>
            <label className={`block text-sm ${tc.textMuted} mb-2`}>Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description..."
              rows={2}
              className={`w-full ${tc.input} rounded-[14px] px-4 py-3 resize-none`}
            />
          </div>

          {/* Display Order + Active toggle */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className={`block text-sm ${tc.textMuted} mb-2`}>Display Order</label>
              <input
                type="number"
                value={form.display_order}
                onChange={e => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                className={`w-full ${tc.input} rounded-[14px] px-4 py-3`}
              />
            </div>
            <label className={`flex items-center gap-2 pb-3 cursor-pointer ${tc.text}`}>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={e => setForm({ ...form, is_active: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-medium">Active</span>
            </label>
          </div>
        </div>

        <div className={`p-6 border-t ${tc.border} flex justify-between`}>
          <button
            onClick={() => setShowModal(false)}
            className={`px-6 py-2 rounded-[14px] border ${tc.border} ${tc.text}`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={missingName || saving}
            className={`px-6 py-2 rounded-[14px] bg-lynx-navy text-white font-bold hover:brightness-110 ${
              missingName ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {saving ? 'Saving...' : editingProgram ? 'Save Changes' : 'Create Program'}
          </button>
        </div>
      </div>
    </div>
  )
}
