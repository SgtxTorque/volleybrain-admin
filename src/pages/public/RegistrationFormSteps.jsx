// Registration form field renderers, section renderers, and step components
// Extracted from PublicRegistrationPage for the file-split refactor

import { Check, Edit, Plus, Trash2, Users, CheckCircle2, AlertCircle, Camera } from '../../constants/icons'
import { sortFieldsByOrder } from './registrationConstants'

// ─── Tailwind class constants ─────────────────────────────────────────────
const INPUT_CLASSES = 'w-full px-4 py-3 rounded-xl border border-[#E8ECF2] text-sm font-medium bg-white text-slate-700 focus:outline-none focus:border-[#4BB9EC] focus:ring-2 focus:ring-[#4BB9EC]/10 transition-colors'
const SELECT_CLASSES = INPUT_CLASSES
const TEXTAREA_CLASSES = `${INPUT_CLASSES} resize-none`
const LABEL_CLASSES = 'block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5'
const CARD_CLASSES = 'bg-white rounded-2xl border border-[#E8ECF2] shadow-[0_2px_12px_rgba(0,0,0,0.04)]'

// ─── Individual field renderer ────────────────────────────────────────────
function renderField(key, fieldConfig, formState, setFormState, trackFormStart) {
  if (!fieldConfig?.enabled) return null

  const isRequired = fieldConfig.required
  const label = fieldConfig.label || key

  if (key === 'grade') {
    return (
      <div key={key}>
        <label className={LABEL_CLASSES}>
          {label} {isRequired && <span className="text-red-500">*</span>}
        </label>
        <select
          value={formState[key] || ''}
          onChange={e => setFormState({ ...formState, [key]: e.target.value })}
          onFocus={trackFormStart}
          required={isRequired}
          className={SELECT_CLASSES}
        >
          <option value="">Select grade</option>
          {['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(g => (
            <option key={g} value={g}>{g === 'K' ? 'Kindergarten' : `Grade ${g}`}</option>
          ))}
        </select>
      </div>
    )
  }

  if (key === 'gender') {
    return (
      <div key={key}>
        <label className={LABEL_CLASSES}>
          {label} {isRequired && <span className="text-red-500">*</span>}
        </label>
        <select
          value={formState[key] || ''}
          onChange={e => setFormState({ ...formState, [key]: e.target.value })}
          onFocus={trackFormStart}
          required={isRequired}
          className={SELECT_CLASSES}
        >
          <option value="">Select gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </div>
    )
  }

  if (key === 'birth_date') {
    return (
      <div key={key}>
        <label className={LABEL_CLASSES}>
          {label} {isRequired && <span className="text-red-500">*</span>}
        </label>
        <input
          type="date"
          value={formState[key] || ''}
          onChange={e => setFormState({ ...formState, [key]: e.target.value })}
          onFocus={trackFormStart}
          required={isRequired}
          className={INPUT_CLASSES}
        />
      </div>
    )
  }

  if (fieldConfig.type === 'select' && fieldConfig.options?.length > 0) {
    return (
      <div key={key}>
        <label className={LABEL_CLASSES}>
          {label} {isRequired && <span className="text-red-500">*</span>}
        </label>
        <select
          value={formState[key] || ''}
          onChange={e => setFormState({ ...formState, [key]: e.target.value })}
          required={isRequired}
          className={SELECT_CLASSES}
        >
          <option value="">Select...</option>
          {fieldConfig.options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    )
  }

  if (fieldConfig.type === 'textarea' || key.includes('medical') || key.includes('notes') || key.includes('conditions')) {
    return (
      <div key={key} className="col-span-2">
        <label className={LABEL_CLASSES}>
          {label} {isRequired && <span className="text-red-500">*</span>}
        </label>
        <textarea
          value={formState[key] || ''}
          onChange={e => setFormState({ ...formState, [key]: e.target.value })}
          required={isRequired}
          rows={3}
          className={TEXTAREA_CLASSES}
        />
      </div>
    )
  }

  const inputType = key.includes('email') ? 'email' : key.includes('phone') ? 'tel' : 'text'

  return (
    <div key={key}>
      <label className={LABEL_CLASSES}>
        {label} {isRequired && <span className="text-red-500">*</span>}
      </label>
      <input
        type={inputType}
        value={formState[key] || ''}
        onChange={e => setFormState({ ...formState, [key]: e.target.value })}
        onFocus={trackFormStart}
        required={isRequired}
        className={INPUT_CLASSES}
      />
    </div>
  )
}

// ─── Section renderer (title + sorted grid of fields) ─────────────────────
function FormSection({ title, fields, sectionKey, formState, setFormState, trackFormStart, icon: IconComponent }) {
  if (!fields) return null
  const enabledFields = Object.entries(fields).filter(([_, f]) => f?.enabled)
  if (enabledFields.length === 0) return null

  const sortedFields = sortFieldsByOrder(enabledFields, sectionKey)

  return (
    <div>
      {title && (
        <h2 className="text-r-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          {IconComponent && <IconComponent className="w-5 h-5 text-[#4BB9EC]" />}
          {title}
        </h2>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sortedFields.map(([key, fieldConfig]) =>
          renderField(key, fieldConfig, formState, setFormState, trackFormStart)
        )}
      </div>
    </div>
  )
}

// ─── Children list card ───────────────────────────────────────────────────
function ChildrenListCard({ children, onEdit, onRemove }) {
  if (children.length === 0) return null

  return (
    <div className={`${CARD_CLASSES} p-6 mb-4`}>
      <h2 className="text-r-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-[#4BB9EC]" />
        Children to Register ({children.length})
      </h2>
      <div className="space-y-3">
        {children.map((child, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 rounded-lg bg-[#F5F6F8] border border-slate-100"
          >
            <div>
              <p className="font-semibold text-r-sm text-slate-900">
                {child.first_name} {child.last_name}
              </p>
              <p className="text-r-xs text-slate-500">
                {child.grade && `Grade ${child.grade}`}
                {child.grade && child.birth_date && ' \u00B7 '}
                {child.birth_date && new Date(child.birth_date + 'T00:00:00').toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => onEdit(index)}
                className="p-2 rounded-lg hover:bg-white transition-colors text-slate-500 hover:text-[#10284C]"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="p-2 rounded-lg hover:bg-red-50 transition-colors text-slate-400 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Player info form card (add / edit child) ─────────────────────────────
function PlayerInfoCard({
  config, currentChild, setCurrentChild, editingChildIndex,
  childrenCount, showAddChildForm, onSaveChild, onCancel, trackFormStart
}) {
  const isEditing = editingChildIndex !== null
  const showForm = childrenCount === 0 || isEditing || showAddChildForm
  if (!showForm) return null

  return (
    <div className={`${CARD_CLASSES} p-6 mb-4`}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-r-lg font-bold text-slate-900 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#4BB9EC]/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-[#4BB9EC]" />
          </div>
          {isEditing ? 'Edit Child' : childrenCount > 0 ? 'Add Another Child' : 'Child Information'}
        </h2>
        {(isEditing || (childrenCount > 0 && showAddChildForm)) && (
          <button
            type="button"
            onClick={onCancel}
            className="text-r-sm px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors font-medium"
          >
            Cancel
          </button>
        )}
      </div>

      <FormSection
        fields={config.player_fields}
        sectionKey="player_fields"
        formState={currentChild}
        setFormState={setCurrentChild}
        trackFormStart={trackFormStart}
      />

      {/* Optional player photo upload */}
      <div className="mt-4 mb-2">
        <label className={LABEL_CLASSES}>Player Photo <span className="text-slate-400 font-normal">(optional)</span></label>
        <label className="flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-slate-200 cursor-pointer hover:border-[#4BB9EC] hover:bg-[#F5F6F8]/50 transition-colors">
          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              const reader = new FileReader()
              reader.onload = (ev) => setCurrentChild({ ...currentChild, _photoFile: file, _photoPreview: ev.target.result })
              reader.readAsDataURL(file)
            }
          }} />
          {currentChild._photoPreview ? (
            <>
              <img src={currentChild._photoPreview} alt="" className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
              <div>
                <p className="text-r-sm font-semibold text-slate-700">Photo added</p>
                <p className="text-r-xs text-slate-400">Tap to change</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-lg bg-[#4BB9EC]/10 flex items-center justify-center">
                <Camera className="w-5 h-5 text-[#4BB9EC]" />
              </div>
              <div>
                <p className="text-r-sm font-semibold text-slate-700">Add a photo so coaches can identify your player!</p>
                <p className="text-r-xs text-slate-400">JPG, PNG — you can always add one later</p>
              </div>
            </>
          )}
        </label>
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={onSaveChild}
          className="w-full py-3 rounded-lg font-bold text-r-sm flex items-center justify-center gap-2 transition-all bg-[#10284C] text-white hover:brightness-110"
        >
          <Check className="w-5 h-5" />
          {isEditing ? 'Save Changes' : 'Save Child'}
        </button>
      </div>
      {childrenCount === 0 && (
        <p className="text-center text-r-xs text-slate-400 mt-2">
          You can add more children after saving
        </p>
      )}
    </div>
  )
}

// ─── "Add another child" dashed button ────────────────────────────────────
function AddChildButton({ visible, onClick }) {
  if (!visible) return null

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={onClick}
        className="w-full py-3 rounded-lg font-semibold text-r-sm flex items-center justify-center gap-2 transition-colors border-2 border-dashed border-slate-300 text-slate-600 bg-white hover:border-[#4BB9EC] hover:text-[#10284C] hover:bg-[#F5F6F8]"
      >
        <Plus className="w-5 h-5" /> Add Another Child
      </button>
    </div>
  )
}

// ─── Shared info card (parent, emergency, medical) ────────────────────────
function SharedInfoCard({ config, sharedInfo, setSharedInfo, trackFormStart }) {
  const hasParentFields = config.parent_fields && Object.entries(config.parent_fields).some(([_, f]) => f?.enabled)
  const hasEmergencyFields = config.emergency_fields && Object.entries(config.emergency_fields).some(([_, f]) => f?.enabled)
  const hasMedicalFields = config.medical_fields && Object.entries(config.medical_fields).some(([_, f]) => f?.enabled)

  if (!hasParentFields && !hasEmergencyFields && !hasMedicalFields) return null

  return (
    <div className={`${CARD_CLASSES} p-6 mb-4 space-y-6`}>
      {/* Parent/Guardian Section */}
      {hasParentFields && (
        <div>
          <h2 className="text-r-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#4BB9EC]/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-[#4BB9EC]" />
            </div>
            Parent/Guardian Information
          </h2>

          {/* Primary Parent/Guardian */}
          <div className="mb-6">
            <h3 className="text-r-sm font-semibold text-slate-500 mb-3 px-1">
              Primary Parent/Guardian
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['parent1_name', 'parent1_email', 'parent1_phone'].map(key => {
                const field = config.parent_fields[key]
                if (!field?.enabled) return null
                return renderField(key, field, sharedInfo, setSharedInfo, trackFormStart)
              })}
            </div>
          </div>

          {/* Second Parent/Guardian */}
          {['parent2_name', 'parent2_email', 'parent2_phone'].some(key => config.parent_fields[key]?.enabled) && (
            <div className="mb-6">
              <h3 className="text-r-sm font-semibold text-slate-500 mb-3 px-1">
                Second Parent/Guardian (Optional)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {['parent2_name', 'parent2_email', 'parent2_phone'].map(key => {
                  const field = config.parent_fields[key]
                  if (!field?.enabled) return null
                  return renderField(key, field, sharedInfo, setSharedInfo, trackFormStart)
                })}
              </div>
            </div>
          )}

          {/* Address */}
          {['address', 'city', 'state', 'zip'].some(key => config.parent_fields[key]?.enabled) && (
            <div>
              <h3 className="text-r-sm font-semibold text-slate-500 mb-3 px-1">
                Address
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {['address', 'city', 'state', 'zip'].map(key => {
                  const field = config.parent_fields[key]
                  if (!field?.enabled) return null
                  return renderField(key, field, sharedInfo, setSharedInfo, trackFormStart)
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Emergency Contact */}
      {hasEmergencyFields && (
        <FormSection
          title="Emergency Contact"
          icon={AlertCircle}
          fields={config.emergency_fields}
          sectionKey="emergency_fields"
          formState={sharedInfo}
          setFormState={setSharedInfo}
          trackFormStart={trackFormStart}
        />
      )}

      {/* Medical Information */}
      {hasMedicalFields && (
        <FormSection
          title="Medical Information"
          icon={CheckCircle2}
          fields={config.medical_fields}
          sectionKey="medical_fields"
          formState={sharedInfo}
          setFormState={setSharedInfo}
          trackFormStart={trackFormStart}
        />
      )}
    </div>
  )
}

// ─── Custom questions card ────────────────────────────────────────────────
function CustomQuestionsCard({ config, customAnswers, setCustomAnswers }) {
  if (!config.custom_questions?.length) return null

  return (
    <div className={`${CARD_CLASSES} p-6 mb-4`}>
      <h2 className="text-r-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-[#4BB9EC]/10 flex items-center justify-center">
          <AlertCircle className="w-4 h-4 text-[#4BB9EC]" />
        </div>
        Additional Questions
      </h2>
      <div className="space-y-4">
        {config.custom_questions.map(q => (
          <div key={q.id}>
            <label className={LABEL_CLASSES}>
              {q.question} {q.required && <span className="text-red-500">*</span>}
            </label>
            {q.type === 'textarea' ? (
              <textarea
                value={customAnswers[q.id] || ''}
                onChange={e => setCustomAnswers({ ...customAnswers, [q.id]: e.target.value })}
                required={q.required}
                rows={3}
                className={TEXTAREA_CLASSES}
              />
            ) : q.type === 'select' ? (
              <select
                value={customAnswers[q.id] || ''}
                onChange={e => setCustomAnswers({ ...customAnswers, [q.id]: e.target.value })}
                required={q.required}
                className={SELECT_CLASSES}
              >
                <option value="">Select...</option>
                {q.options?.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : q.type === 'checkbox' ? (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={customAnswers[q.id] || false}
                  onChange={e => setCustomAnswers({ ...customAnswers, [q.id]: e.target.checked })}
                  className="w-5 h-5 rounded accent-[#4BB9EC]"
                />
                <span className="text-r-sm text-slate-700">Yes</span>
              </label>
            ) : (
              <input
                type="text"
                value={customAnswers[q.id] || ''}
                onChange={e => setCustomAnswers({ ...customAnswers, [q.id]: e.target.value })}
                required={q.required}
                className={INPUT_CLASSES}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export {
  ChildrenListCard,
  PlayerInfoCard,
  AddChildButton,
  SharedInfoCard,
  CustomQuestionsCard
}
