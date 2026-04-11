import { useState, useEffect } from 'react'
import { X } from '../../constants/icons'
import SportGridSelector from '../../components/ui/SportGridSelector'
import CuratedIconPicker from '../../components/ui/CuratedIconPicker'

export default function ProgramFormModal({
  showModal, setShowModal, editingProgram, sports, tc, isDark, onSave, usedSportIds = new Set()
}) {
  const [form, setForm] = useState({ name: '', sport_id: null, icon: '', description: '', is_active: true })
  const [saving, setSaving] = useState(false)
  const [isCustomMode, setIsCustomMode] = useState(false)
  const [sportSelected, setSportSelected] = useState(false)

  useEffect(() => {
    if (showModal && editingProgram) {
      setForm({
        name: editingProgram.name || '',
        sport_id: editingProgram.sport_id || null,
        icon: editingProgram.icon || '',
        description: editingProgram.description || '',
        is_active: editingProgram.is_active ?? true,
      })
      setSportSelected(true)
      setIsCustomMode(!editingProgram.sport_id)
    } else if (showModal) {
      setForm({ name: '', sport_id: null, icon: '', description: '', is_active: true })
      setSportSelected(false)
      setIsCustomMode(false)
    }
  }, [showModal, editingProgram])

  if (!showModal) return null

  const handleSportSelect = (sportId, sportName, sportIcon) => {
    if (sportId === null) {
      // Custom mode
      setIsCustomMode(true)
      setForm(f => ({ ...f, sport_id: null, name: '', icon: '' }))
      setSportSelected(true)
    } else {
      setIsCustomMode(false)
      setForm(f => ({
        ...f,
        sport_id: sportId,
        name: sportName,
        icon: sportIcon || '',
      }))
      setSportSelected(true)
    }
  }

  const handleChangeSport = () => {
    setSportSelected(false)
    setIsCustomMode(false)
  }

  const missingName = !form.name?.trim()

  async function handleSave() {
    if (missingName) return
    setSaving(true)
    await onSave(form, editingProgram)
    setSaving(false)
  }

  const modalTitle = editingProgram
    ? 'Edit Program'
    : (!sportSelected ? 'New Program — Choose Sport' : 'New Program')

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className={`${tc.cardBg} border ${tc.border} rounded-[14px] shadow-2xl w-full max-w-lg`}>
        <div className={`p-6 border-b ${tc.border} flex items-center justify-between`}>
          <h2 className={`text-xl font-semibold ${tc.text}`}>
            {modalTitle}
          </h2>
          <button onClick={() => setShowModal(false)} className={`${tc.textMuted} ${isDark ? 'hover:text-white' : 'hover:text-slate-900'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {!sportSelected ? (
            /* STATE 1: Sport grid selection */
            <div>
              <p className={`text-sm ${tc.textMuted} mb-4`}>
                Select a sport for your program, or choose Custom.
              </p>
              <SportGridSelector
                selectedSportId={form.sport_id}
                onSelect={handleSportSelect}
                usedSportIds={usedSportIds}
                editingSportId={editingProgram?.sport_id}
              />
            </div>
          ) : (
            /* STATE 2: Program details */
            <div className="space-y-4">
              {/* Sport banner */}
              <div className={`flex items-center justify-between p-3 rounded-[14px] ${isDark ? 'bg-white/[0.05] border border-white/[0.08]' : 'bg-slate-50 border border-slate-200'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{form.icon || '✨'}</span>
                  <span className={`font-semibold ${tc.text}`}>
                    {isCustomMode ? 'Custom Program' : form.name || 'Program'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleChangeSport}
                  className="text-xs text-lynx-sky hover:underline"
                >
                  Change
                </button>
              </div>

              {/* Program name */}
              <div>
                <label className={`block text-sm ${tc.textMuted} mb-2`}>
                  Program Name {isCustomMode && <span className="text-red-400">*</span>}
                  {!isCustomMode && <span className="text-red-400">*</span>}
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder={isCustomMode ? 'e.g., Flag Football, Sand Volleyball' : 'e.g., Boys Volleyball'}
                  className={`w-full ${tc.input} rounded-[14px] px-4 py-3`}
                />
              </div>

              {/* Icon picker — only for custom mode */}
              {isCustomMode && (
                <CuratedIconPicker
                  selectedIcon={form.icon}
                  onSelect={icon => setForm(f => ({ ...f, icon }))}
                  tc={tc}
                  isDark={isDark}
                />
              )}

              {/* Description */}
              <div>
                <label className={`block text-sm ${tc.textMuted} mb-2`}>
                  Description <span className={tc.textMuted}>(optional)</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description..."
                  rows={2}
                  className={`w-full ${tc.input} rounded-[14px] px-4 py-3 resize-none`}
                />
              </div>

              {/* Active toggle */}
              <label className={`flex items-center gap-2 cursor-pointer ${tc.text}`}>
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm font-medium">Active</span>
              </label>
            </div>
          )}
        </div>

        {/* Footer — only show save button when sport is selected */}
        <div className={`p-6 border-t ${tc.border} flex justify-between`}>
          <button
            onClick={() => setShowModal(false)}
            className={`px-6 py-2 rounded-[14px] border ${tc.border} ${tc.text}`}
          >
            Cancel
          </button>
          {sportSelected && (
            <button
              onClick={handleSave}
              disabled={missingName || saving}
              className={`px-6 py-2 rounded-[14px] bg-lynx-navy text-white font-bold hover:brightness-110 ${
                missingName ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {saving ? 'Saving...' : editingProgram ? 'Save Changes' : 'Create Program'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
