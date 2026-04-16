import { useState } from 'react'
import { X, AlertCircle } from '../../constants/icons'
import { parseLocalDate } from '../../lib/date-helpers'

export function SeasonFormModal({
  showModal, setShowModal, editingSeason, form, setForm, handleSave,
  modalTab, setModalTab, sports, templates, tc, isDark, selectedProgram
}) {
  const [showErrors, setShowErrors] = useState(false)
  if (!showModal) return null

  const totalFee = (parseFloat(form.fee_registration) || 0) +
    (parseFloat(form.fee_uniform) || 0) +
    ((parseFloat(form.fee_monthly) || 0) * (parseInt(form.months_in_season) || 0))

  const hasSports = sports && sports.length > 0
  const missingName = !form.name?.trim()
  // Only require sport if no program is selected AND sports exist
  const missingSport = !selectedProgram && hasSports && !form.sport_id
  const hasErrors = missingName || missingSport

  function handleSaveClick() {
    if (hasErrors) {
      setShowErrors(true)
      setModalTab('basic')
      return
    }
    setShowErrors(false)
    handleSave()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className={`${tc.cardBg} border ${tc.border} rounded-[14px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col`}>
        <div className={`p-6 border-b ${tc.border} flex items-center justify-between`}>
          <h2 className={`text-xl font-semibold ${tc.text}`}>{editingSeason ? 'Edit Season' : 'Create Season'}</h2>
          <button onClick={() => { setShowModal(false); setModalTab('basic'); setShowErrors(false); }} className={`${tc.textMuted} ${isDark ? 'hover:text-white' : 'hover:text-slate-900'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs — Registration config moved to Lifecycle Tracker Step 2 */}
        <div className={`flex border-b ${tc.border}`}>
          {[
            { id: 'basic', label: 'Basic Info' },
            // { id: 'registration', label: 'Registration' }, // Moved to RegistrationSetupModal (Lifecycle Step 2)
            { id: 'fees', label: 'Fees & Pricing' },
            { id: 'approval', label: 'Approval' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setModalTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                modalTab === tab.id
                  ? `text-lynx-sky border-b-2 border-lynx-sky ${tc.cardBgAlt}`
                  : `${tc.textMuted} ${isDark ? 'hover:text-white' : 'hover:text-slate-900'}`
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Basic Info Tab */}
          {modalTab === 'basic' && (
            <BasicInfoTab form={form} setForm={setForm} sports={sports} tc={tc} isDark={isDark} showErrors={showErrors} selectedProgram={selectedProgram} />
          )}

          {/* Registration Tab — moved to Lifecycle Tracker Step 2 (RegistrationSetupModal) */}
          {/* {modalTab === 'registration' && (
            <RegistrationTab form={form} setForm={setForm} templates={templates} tc={tc} isDark={isDark} />
          )} */}

          {/* Fees Tab */}
          {modalTab === 'fees' && (
            <FeesTab form={form} setForm={setForm} totalFee={totalFee} tc={tc} isDark={isDark} />
          )}

          {/* Approval Tab */}
          {modalTab === 'approval' && (
            <ApprovalTab form={form} setForm={setForm} tc={tc} isDark={isDark} />
          )}
        </div>

        <div className={`p-6 border-t ${tc.border}`}>
          {showErrors && hasErrors && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <div className="text-sm text-red-400">
                {missingName && <p>Season name is required</p>}
                {missingSport && <p>Please select a sport</p>}
              </div>
            </div>
          )}
          <div className="flex justify-between">
            <button onClick={() => { setShowModal(false); setModalTab('basic'); setShowErrors(false); }} className={`px-6 py-2 rounded-[14px] border ${tc.border} ${tc.text}`}>
              Cancel
            </button>
            <div className="flex gap-3">
              {modalTab !== 'basic' && (
                <button
                  onClick={() => setModalTab(modalTab === 'approval' ? 'fees' : 'basic')}
                  className={`px-6 py-2 rounded-[14px] border ${tc.border} ${tc.text}`}
                >
                  Back
                </button>
              )}
              {modalTab !== 'approval' ? (
                <button
                  onClick={() => setModalTab(modalTab === 'basic' ? 'fees' : 'approval')}
                  className="px-6 py-2 rounded-[14px] bg-lynx-navy text-white font-bold hover:brightness-110"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSaveClick}
                  className={`px-6 py-2 rounded-[14px] bg-lynx-navy text-white font-bold hover:brightness-110 ${hasErrors ? 'opacity-80' : ''}`}
                >
                  {hasErrors ? 'Complete required fields' : (editingSeason ? 'Save Changes' : 'Create Season')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Basic Info Tab                                                      */
/* ------------------------------------------------------------------ */
function BasicInfoTab({ form, setForm, sports, tc, isDark, showErrors, selectedProgram }) {
  const missingName = showErrors && !form.name?.trim()
  // Only require sport when no program is selected
  const missingSport = showErrors && !selectedProgram && sports && sports.length > 0 && !form.sport_id

  return (
    <>
      {/* Program badge — shown when a program is selected */}
      {selectedProgram && (
        <div className={`flex items-center gap-2 p-3 rounded-[14px] border ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-[#E8ECF2] bg-slate-50'}`}>
          <span className="text-lg">{selectedProgram.icon || selectedProgram.sport?.icon || '📋'}</span>
          <div>
            <p className={`text-xs font-semibold ${tc.textMuted}`}>Program</p>
            <p className={`text-sm font-bold ${tc.text}`}>
              {selectedProgram.name}
              {selectedProgram.sport?.name && <span className={`ml-1 font-normal ${tc.textMuted}`}>({selectedProgram.sport.name})</span>}
            </p>
          </div>
        </div>
      )}

      {/* Sport Selection — hidden when program provides the sport */}
      {!selectedProgram && sports && sports.length > 0 && (
        <div>
          <label className={`block text-sm ${missingSport ? 'text-red-400' : tc.textMuted} mb-2`}>Sport <span className="text-red-400">*</span></label>
          <div className={`grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2 ${missingSport ? 'ring-2 ring-red-400/40 rounded-[14px] p-1' : ''}`}>
            {sports.map(sport => (
              <button
                key={sport.id}
                type="button"
                onClick={() => setForm({...form, sport_id: sport.id})}
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
          {missingSport && <p className="text-xs text-red-400 mt-1">Please select a sport</p>}
        </div>
      )}

      <div>
        <label className={`block text-sm ${missingName ? 'text-red-400' : tc.textMuted} mb-2`}>Season Name <span className="text-red-400">*</span></label>
        <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Spring 2026"
          className={`w-full ${tc.input} rounded-[14px] px-4 py-3 ${missingName ? 'border-red-400 ring-2 ring-red-400/30' : ''}`} />
        {missingName && <p className="text-xs text-red-400 mt-1">Season name is required</p>}
      </div>

      <div>
        <label className={`block text-sm ${tc.textMuted} mb-2`}>Description</label>
        <textarea
          value={form.description}
          onChange={e => setForm({...form, description: e.target.value})}
          placeholder="Brief description shown on registration page..."
          rows={2}
          className={`w-full ${tc.input} rounded-[14px] px-4 py-3 resize-none`}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm ${tc.textMuted} mb-2`}>Season Starts</label>
          <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})}
            className={`w-full ${tc.input} rounded-[14px] px-4 py-3`} />
        </div>
        <div>
          <label className={`block text-sm ${tc.textMuted} mb-2`}>Season Ends</label>
          <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})}
            className={`w-full ${tc.input} rounded-[14px] px-4 py-3`} />
        </div>
      </div>

      <div>
        <label className={`block text-sm ${tc.textMuted} mb-2`}>Status</label>
        <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
          className={`w-full ${tc.input} rounded-[14px] px-4 py-3`}>
          <option value="upcoming">Upcoming</option>
          <option value="active">Active (Registration Open)</option>
          <option value="completed">Completed</option>
        </select>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Registration Tab                                                    */
/* ------------------------------------------------------------------ */
function RegistrationTab({ form, setForm, templates, tc, isDark }) {
  return (
    <>
      {/* Registration Form Template */}
      <div className="mb-6">
        <label className={`block text-sm ${tc.textMuted} mb-2`}>Registration Form Template</label>
        <select
          value={form.registration_template_id || ''}
          onChange={e => {
            const templateId = e.target.value || null
            const template = templates.find(t => t.id === templateId)
            setForm({
              ...form,
              registration_template_id: templateId,
              registration_config: template ? {
                player_fields: template.player_fields || {},
                parent_fields: template.parent_fields || {},
                emergency_fields: template.emergency_fields || {},
                medical_fields: template.medical_fields || {},
                waivers: template.waivers || {},
                custom_questions: template.custom_questions || []
              } : null
            })
          }}
          className={`w-full ${tc.input} rounded-[14px] px-4 py-3`}
        >
          <option value="">Use default form</option>
          {templates.map(t => (
            <option key={t.id} value={t.id}>
              {t.sports?.icon || ''} {t.name} {t.is_default ? '(Default)' : ''}
            </option>
          ))}
        </select>
        <p className={`text-xs ${tc.textMuted} mt-1`}>
          Select which registration form to use for this season.
          <a href="#" onClick={(e) => { e.preventDefault(); window.open('/settings/templates', '_blank') }} className="text-lynx-sky hover:underline ml-1">
            Manage templates
          </a>
        </p>
        {!form.registration_template_id && (
          <div className={`mt-2 p-3 ${tc.cardBgAlt} rounded-[14px] text-xs ${tc.textMuted}`}>
            <p className={`font-medium ${tc.textSecondary} mb-1`}>Default form collects:</p>
            <p>Player info (name, DOB, gender, grade, jersey size), parent contact, emergency contact, and medical information.</p>
          </div>
        )}
      </div>

      <div className={`${tc.cardBgAlt} rounded-[14px] p-4 mb-4`}>
        <p className={`text-sm ${tc.textSecondary}`}>
          Set when families can register. Leave dates blank to use season status instead.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm ${tc.textMuted} mb-2`}>Registration Opens</label>
          <input
            type="date"
            value={form.registration_opens}
            onChange={e => setForm({...form, registration_opens: e.target.value})}
            className={`w-full ${tc.input} rounded-[14px] px-4 py-3`}
          />
        </div>
        <div>
          <label className={`block text-sm ${tc.textMuted} mb-2`}>Registration Closes</label>
          <input
            type="date"
            value={form.registration_closes}
            onChange={e => setForm({...form, registration_closes: e.target.value})}
            className={`w-full ${tc.input} rounded-[14px] px-4 py-3`}
          />
        </div>
      </div>

      <div className={`border-t ${tc.border} pt-4 mt-4`}>
        <h4 className={`${tc.text} font-medium mb-3`}>Early Bird & Late Registration</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm ${tc.textMuted} mb-2`}>Early Bird Deadline</label>
            <input
              type="date"
              value={form.early_bird_deadline}
              onChange={e => setForm({...form, early_bird_deadline: e.target.value})}
              className={`w-full ${tc.input} rounded-[14px] px-4 py-3`}
            />
          </div>
          <div>
            <label className={`block text-sm ${tc.textMuted} mb-2`}>Early Bird Discount ($)</label>
            <input
              type="number"
              value={form.early_bird_discount}
              onChange={e => setForm({...form, early_bird_discount: parseInt(e.target.value) || 0})}
              className={`w-full ${tc.input} rounded-[14px] px-4 py-3`}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <div>
            <label className={`block text-sm ${tc.textMuted} mb-2`}>Late Registration Starts</label>
            <input
              type="date"
              value={form.late_registration_deadline}
              onChange={e => setForm({...form, late_registration_deadline: e.target.value})}
              className={`w-full ${tc.input} rounded-[14px] px-4 py-3`}
            />
          </div>
          <div>
            <label className={`block text-sm ${tc.textMuted} mb-2`}>Late Fee ($)</label>
            <input
              type="number"
              value={form.late_registration_fee}
              onChange={e => setForm({...form, late_registration_fee: parseInt(e.target.value) || 0})}
              className={`w-full ${tc.input} rounded-[14px] px-4 py-3`}
            />
          </div>
        </div>
      </div>

      <div className={`border-t ${tc.border} pt-4 mt-4`}>
        <h4 className={`${tc.text} font-medium mb-3`}>Capacity</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm ${tc.textMuted} mb-2`}>Max Players</label>
            <input
              type="number"
              value={form.capacity || ''}
              onChange={e => setForm({...form, capacity: e.target.value ? parseInt(e.target.value) : null})}
              placeholder="Unlimited"
              className={`w-full ${tc.input} rounded-[14px] px-4 py-3`}
            />
            <p className={`text-xs ${tc.textMuted} mt-1`}>Leave blank for unlimited</p>
          </div>
          <div>
            <label className={`block text-sm ${tc.textMuted} mb-2`}>Waitlist Size</label>
            <input
              type="number"
              value={form.waitlist_capacity}
              onChange={e => setForm({...form, waitlist_capacity: parseInt(e.target.value) || 0})}
              className={`w-full ${tc.input} rounded-[14px] px-4 py-3`}
            />
          </div>
        </div>
        <label className="flex items-center gap-3 mt-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.waitlist_enabled}
            onChange={e => setForm({...form, waitlist_enabled: e.target.checked})}
            className={`w-5 h-5 rounded ${tc.border}`}
          />
          <span className={tc.textSecondary}>Enable waitlist when full</span>
        </label>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Fees Tab                                                            */
/* ------------------------------------------------------------------ */
function FeesTab({ form, setForm, totalFee, tc, isDark }) {
  return (
    <>
      <div className={`${tc.cardBgAlt} rounded-[14px] p-4 mb-4`}>
        <p className={`text-sm ${tc.textSecondary}`}>
          Set the fees for this season. Per-player fees are charged for each child. Per-family fees are charged once per family per season.
        </p>
      </div>

      {/* Per-Player Fees */}
      <h4 className={`text-sm font-semibold ${tc.textMuted} uppercase tracking-wide mb-3`}>Per-Player Fees</h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm ${tc.textMuted} mb-2`}>Registration Fee ($)</label>
          <input
            type="number"
            value={form.fee_registration}
            onChange={e => setForm({...form, fee_registration: e.target.value})}
            className={`w-full ${tc.input} rounded-[14px] px-4 py-3 text-lg`}
          />
        </div>
        <div>
          <label className={`block text-sm ${tc.textMuted} mb-2`}>Uniform Fee ($)</label>
          <input
            type="number"
            value={form.fee_uniform}
            onChange={e => setForm({...form, fee_uniform: e.target.value})}
            className={`w-full ${tc.input} rounded-[14px] px-4 py-3 text-lg`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm ${tc.textMuted} mb-2`}>Monthly Fee ($)</label>
          <input
            type="number"
            value={form.fee_monthly}
            onChange={e => setForm({...form, fee_monthly: e.target.value})}
            className={`w-full ${tc.input} rounded-[14px] px-4 py-3 text-lg`}
          />
        </div>
        <div>
          <label className={`block text-sm ${tc.textMuted} mb-2`}>Number of Months</label>
          <input
            type="number"
            value={form.months_in_season}
            onChange={e => setForm({...form, months_in_season: e.target.value})}
            className={`w-full ${tc.input} rounded-[14px] px-4 py-3 text-lg`}
          />
        </div>
      </div>

      {/* Per-Family Fee */}
      <div className={`border-t ${tc.border} pt-4 mt-4`} />
      <h4 className={`text-sm font-semibold ${tc.textMuted} uppercase tracking-wide mb-3`}>Per-Family Fee</h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm ${tc.textMuted} mb-2`}>Family Registration Fee ($)</label>
          <input
            type="number"
            value={form.fee_per_family}
            onChange={e => setForm({...form, fee_per_family: e.target.value})}
            placeholder="0"
            className={`w-full ${tc.input} rounded-[14px] px-4 py-3 text-lg`}
          />
          <p className={`text-xs ${tc.textMuted} mt-1`}>Charged once per family, regardless of # of kids</p>
        </div>
      </div>

      {/* Sibling Discount */}
      <div className={`border-t ${tc.border} pt-4 mt-4`} />
      <h4 className={`text-sm font-semibold ${tc.textMuted} uppercase tracking-wide mb-3`}>Sibling Discount</h4>
      <div className={`${tc.cardBgAlt} rounded-[14px] p-4 mb-4`}>
        <p className={`text-sm ${tc.textSecondary}`}>
          Family: Automatically discount fees when multiple kids from the same family register.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={`block text-sm ${tc.textMuted} mb-2`}>Discount Type</label>
          <select
            value={form.sibling_discount_type}
            onChange={e => setForm({...form, sibling_discount_type: e.target.value})}
            className={`w-full ${tc.input} rounded-[14px] px-4 py-3`}
          >
            <option value="none">No Discount</option>
            <option value="flat">Flat Amount ($)</option>
            <option value="percent">Percentage (%)</option>
          </select>
        </div>
        {form.sibling_discount_type !== 'none' && (
          <>
            <div>
              <label className={`block text-sm ${tc.textMuted} mb-2`}>
                {form.sibling_discount_type === 'flat' ? 'Discount Amount ($)' : 'Discount Percent (%)'}
              </label>
              <input
                type="number"
                value={form.sibling_discount_amount}
                onChange={e => setForm({...form, sibling_discount_amount: e.target.value})}
                placeholder={form.sibling_discount_type === 'flat' ? '25' : '10'}
                className={`w-full ${tc.input} rounded-[14px] px-4 py-3`}
              />
            </div>
            <div>
              <label className={`block text-sm ${tc.textMuted} mb-2`}>Apply To</label>
              <select
                value={form.sibling_discount_apply_to}
                onChange={e => setForm({...form, sibling_discount_apply_to: e.target.value})}
                className={`w-full ${tc.input} rounded-[14px] px-4 py-3`}
              >
                <option value="additional">2nd Child & Beyond</option>
                <option value="all">All Children</option>
              </select>
            </div>
          </>
        )}
      </div>
      {form.sibling_discount_type !== 'none' && parseFloat(form.sibling_discount_amount) > 0 && (
        <p className="text-xs text-emerald-400 mt-2">
          {form.sibling_discount_apply_to === 'additional' ? '2nd child and beyond' : 'All children'} will receive{' '}
          {form.sibling_discount_type === 'flat'
            ? `$${form.sibling_discount_amount} off`
            : `${form.sibling_discount_amount}% off`
          } registration and monthly fees
        </p>
      )}

      {/* Fee Summary */}
      <div className={`border-t ${tc.border} pt-4 mt-4`} />
      <div className={`${tc.cardBgAlt} rounded-[14px] p-5`}>
        <h4 className={`${tc.textMuted} text-sm mb-3`}>Fee Summary (Per Player)</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className={tc.textMuted}>Registration</span>
            <span className={tc.text}>${parseFloat(form.fee_registration) || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className={tc.textMuted}>Uniform</span>
            <span className={tc.text}>${parseFloat(form.fee_uniform) || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className={tc.textMuted}>Monthly x {form.months_in_season || 0}</span>
            <span className={tc.text}>${(parseFloat(form.fee_monthly) || 0) * (parseInt(form.months_in_season) || 0)}</span>
          </div>
          {parseFloat(form.fee_per_family) > 0 && (
            <div className="flex justify-between text-blue-400">
              <span>+ Family Fee (once per family)</span>
              <span>${parseFloat(form.fee_per_family) || 0}</span>
            </div>
          )}
          {form.early_bird_discount > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>Early Bird Discount</span>
              <span>-${form.early_bird_discount}</span>
            </div>
          )}
          <div className={`border-t ${tc.border} pt-2 mt-2 flex justify-between`}>
            <span className={`${tc.text} font-medium`}>Total Per Player (Regular)</span>
            <span className="text-2xl font-bold text-lynx-sky">${totalFee.toFixed(0)}</span>
          </div>
          {form.early_bird_discount > 0 && (
            <div className="flex justify-between">
              <span className="text-emerald-400 font-medium">Total Per Player (Early Bird)</span>
              <span className="text-xl font-bold text-emerald-400">${(totalFee - (form.early_bird_discount || 0)).toFixed(0)}</span>
            </div>
          )}
        </div>
        {/* Example calculation with sibling discount */}
        <div className={`mt-4 pt-4 border-t ${tc.border} space-y-2`}>
          <p className={`text-xs ${tc.textMuted}`}>
            <strong>Example - 1 Child:</strong>{' '}
            <span className={tc.text}>
              ${((totalFee - (form.early_bird_discount > 0 ? form.early_bird_discount : 0)) + (parseFloat(form.fee_per_family) || 0)).toFixed(0)}
            </span>
          </p>
          <p className={`text-xs ${tc.textMuted}`}>
            <strong>Example - 2 Children:</strong>{' '}
            {(() => {
              const basePerPlayer = totalFee - (form.early_bird_discount > 0 ? form.early_bird_discount : 0)
              const familyFee = parseFloat(form.fee_per_family) || 0
              let child1 = basePerPlayer
              let child2 = basePerPlayer

              if (form.sibling_discount_type !== 'none' && parseFloat(form.sibling_discount_amount) > 0) {
                const discountAmount = parseFloat(form.sibling_discount_amount)
                if (form.sibling_discount_apply_to === 'all') {
                  if (form.sibling_discount_type === 'flat') {
                    child1 = Math.max(0, child1 - discountAmount)
                    child2 = Math.max(0, child2 - discountAmount)
                  } else {
                    child1 = child1 * (1 - discountAmount / 100)
                    child2 = child2 * (1 - discountAmount / 100)
                  }
                } else {
                  if (form.sibling_discount_type === 'flat') {
                    child2 = Math.max(0, child2 - discountAmount)
                  } else {
                    child2 = child2 * (1 - discountAmount / 100)
                  }
                }
              }
              const total = child1 + child2 + familyFee
              const savings = (basePerPlayer * 2 + familyFee) - total
              return (
                <>
                  <span className={tc.text}>${total.toFixed(0)}</span>
                  {savings > 0 && (
                    <span className="text-emerald-400 ml-2">(saves ${savings.toFixed(0)})</span>
                  )}
                </>
              )
            })()}
          </p>
        </div>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Approval Tab                                                        */
/* ------------------------------------------------------------------ */
function getFeeTypesForSeason(formData) {
  const types = []
  if (parseFloat(formData.fee_registration) > 0) types.push({ value: 'registration', label: 'Registration fee' })
  if (parseFloat(formData.fee_uniform) > 0) types.push({ value: 'uniform', label: 'Uniform fee' })
  if (parseFloat(formData.fee_monthly) > 0) types.push({ value: 'monthly', label: 'Monthly fee' })
  if (parseFloat(formData.fee_per_family) > 0) types.push({ value: 'per_family', label: 'Per-family fee' })
  return types
}

function ApprovalTab({ form, setForm, tc, isDark }) {
  const modes = [
    { value: 'open', label: 'Open', description: 'Approve anytime, fees on approval', color: '#22C55E' },
    { value: 'pay_first', label: 'Pay first', description: 'Payment required before approval', color: '#F59E0B' },
    { value: 'tryout_first', label: 'Tryout first', description: 'Approve first, fees after rostered', color: '#EF4444' },
  ]
  const currentMode = form.approval_mode || 'open'
  const gateFees = form.approval_gate_fees || ['registration']
  const feeTypes = getFeeTypesForSeason(form)

  return (
    <>
      <div className={`${tc.cardBgAlt} rounded-[14px] p-4 mb-4`}>
        <p className={`text-sm ${tc.textSecondary}`}>
          Choose how registrations are approved and when fees are generated for this season.
        </p>
      </div>

      <h4 className={`text-sm font-semibold ${tc.textMuted} uppercase tracking-wide mb-3`}>Registration approval</h4>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {modes.map(mode => (
          <button
            key={mode.value}
            type="button"
            onClick={() => setForm({ ...form, approval_mode: mode.value })}
            className={`p-4 rounded-[14px] border-2 text-left transition ${
              currentMode === mode.value
                ? 'border-[#4BB9EC] bg-[#4BB9EC]/5'
                : `${isDark ? 'border-white/10 hover:border-white/20' : 'border-slate-200 hover:border-slate-300'}`
            }`}
          >
            <div className="font-bold text-sm" style={{ color: mode.color }}>{mode.label}</div>
            <div className={`text-xs mt-1 ${tc.textMuted}`}>{mode.description}</div>
          </button>
        ))}
      </div>

      {/* Fee gating — shown only in pay_first mode */}
      {currentMode === 'pay_first' && (
        <div className={`mt-4 p-4 rounded-[14px] border ${isDark ? 'bg-amber-500/5 border-amber-500/30' : 'bg-amber-50 border-amber-200'}`}>
          <div className={`text-sm font-bold mb-2 ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
            Which fees must be paid before approval?
          </div>
          {feeTypes.length === 0 ? (
            <p className={`text-xs ${tc.textMuted}`}>
              No fees configured on this season yet. Add fees on the Fees & Pricing tab to gate approval behind specific fee types.
            </p>
          ) : (
            feeTypes.map(feeType => (
              <label key={feeType.value} className="flex items-center gap-2 py-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gateFees.includes(feeType.value)}
                  onChange={(e) => {
                    const current = form.approval_gate_fees || []
                    const updated = e.target.checked
                      ? [...current, feeType.value]
                      : current.filter(f => f !== feeType.value)
                    setForm({ ...form, approval_gate_fees: updated })
                  }}
                  className="rounded"
                />
                <span className={`text-sm ${tc.textSecondary}`}>{feeType.label}</span>
              </label>
            ))
          )}
        </div>
      )}

      {/* Help text */}
      <p className={`text-xs ${tc.textMuted} mt-3`}>
        {currentMode === 'open' && 'Fees are generated when you approve a registration. No payment is required before approval.'}
        {currentMode === 'pay_first' && 'Fees are generated when a parent submits their registration. You can only approve after the selected fees are paid. You can always force-approve if needed.'}
        {currentMode === 'tryout_first' && 'No fees are generated until the player is assigned to a team. Use this for tryout-based programs where parents only pay after making the roster.'}
      </p>
    </>
  )
}

/* ================================================================== */
/*  Share Hub Modal                                                     */
/* ================================================================== */
export function ShareHubModal({ showShareModal, setShowShareModal, shareSeason, organization, showToast, tc, isDark }) {
  if (!showShareModal || !shareSeason) return null

  const registrationBaseUrl = organization.settings?.registration_url || window.location.origin
  const shareLink = `${registrationBaseUrl}/register/${organization.slug}/${shareSeason.id}`
  const totalFee = (parseFloat(shareSeason.fee_registration) || 0) +
    (parseFloat(shareSeason.fee_uniform) || 0) +
    ((parseFloat(shareSeason.fee_monthly) || 0) * (parseInt(shareSeason.months_in_season) || 0))

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className={`${tc.cardBg} border ${tc.border} rounded-[14px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col`}>
        <div className={`p-6 border-b ${tc.border} flex items-center justify-between`}>
          <div>
            <h2 className={`text-xl font-semibold ${tc.text}`}>Share Registration</h2>
            <p className={`text-sm ${tc.textMuted} mt-1`}>{shareSeason.name}</p>
          </div>
          <button onClick={() => setShowShareModal(false)} className={`${tc.textMuted} ${isDark ? 'hover:text-white' : 'hover:text-slate-900'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Direct Link */}
          <div>
            <label className={`block text-sm font-medium ${tc.text} mb-2`}>Registration Link</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className={`flex-1 ${tc.input} rounded-[14px] px-4 py-3 text-sm`}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareLink)
                  showToast('Link copied!', 'success')
                }}
                className="px-4 py-2 rounded-[14px] bg-lynx-navy text-white font-bold hover:brightness-110"
              >
                Copy
              </button>
            </div>
          </div>

          {/* QR Code */}
          <div>
            <label className={`block text-sm font-medium ${tc.text} mb-2`}>QR Code</label>
            <div className="flex gap-4 items-start">
              <div className="bg-white p-4 rounded-[14px]">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareLink)}`}
                  alt="QR Code"
                  className="w-36 h-36"
                />
              </div>
              <div className="flex-1 space-y-2">
                <p className={`text-sm ${tc.textMuted}`}>Scan to register! Perfect for flyers, posters, and social media.</p>
                <button
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(shareLink)}`
                    link.download = `${organization.name}-${shareSeason.name}-QR.png`
                    link.click()
                  }}
                  className={`px-4 py-2 rounded-lg ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'} text-sm`}
                >
                  Download QR Code
                </button>
              </div>
            </div>
          </div>

          {/* Quick Share Buttons */}
          <div>
            <label className={`block text-sm font-medium ${tc.text} mb-2`}>Quick Share</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={() => {
                  const text = `Register for ${organization.name} ${shareSeason.name}! ${shareLink}`
                  navigator.clipboard.writeText(text)
                  showToast('Text copied!', 'success')
                }}
                className={`px-4 py-3 rounded-[14px] ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'} text-sm font-medium flex items-center justify-center gap-2`}
              >
                Text
              </button>
              <button
                onClick={() => {
                  const text = encodeURIComponent(`Register for ${organization.name} ${shareSeason.name}!`)
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}&quote=${text}`, '_blank', 'width=600,height=400')
                }}
                className="px-4 py-3 rounded-[14px] bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center justify-center gap-2"
              >
                Facebook
              </button>
              <button
                onClick={() => {
                  const subject = encodeURIComponent(`Registration Open: ${organization.name} ${shareSeason.name}`)
                  const body = encodeURIComponent(`Hi!\n\nRegistration is now open for ${shareSeason.name}.\n\nRegister here: ${shareLink}\n\nFee: $${totalFee}\n\nSee you on the court!`)
                  window.location.href = `mailto:?subject=${subject}&body=${body}`
                }}
                className={`px-4 py-3 rounded-[14px] ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'} text-sm font-medium flex items-center justify-center gap-2`}
              >
                Email
              </button>
              <button
                onClick={() => window.open(shareLink + (shareLink.includes('?') ? '&' : '?') + 'preview=true', '_blank')}
                className={`px-4 py-3 rounded-[14px] ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'} text-sm font-medium flex items-center justify-center gap-2`}
              >
                Preview
              </button>
            </div>
          </div>

          {/* Email Template */}
          <div>
            <label className={`block text-sm font-medium ${tc.text} mb-2`}>Email Template</label>
            <div className={`${tc.cardBgAlt} rounded-[14px] p-4 border ${tc.border}`}>
              <div className={`text-sm ${tc.textSecondary} whitespace-pre-wrap font-mono`}>
{`Subject: Registration Open - ${shareSeason.name}

Hi [Parent Name]!

Registration is now open for ${organization.name} ${shareSeason.name}!

Season: ${shareSeason.start_date ? parseLocalDate(shareSeason.start_date).toLocaleDateString() : 'TBD'} - ${shareSeason.end_date ? parseLocalDate(shareSeason.end_date).toLocaleDateString() : 'TBD'}
Fee: $${totalFee}
${shareSeason.early_bird_deadline ? `Early Bird Deadline: ${parseLocalDate(shareSeason.early_bird_deadline).toLocaleDateString()} (Save $${shareSeason.early_bird_discount || 0}!)` : ''}

Register now: ${shareLink}

Questions? Reply to this email.

See you on the court!
${organization.name}`}
              </div>
              <button
                onClick={() => {
                  const template = `Subject: Registration Open - ${shareSeason.name}\n\nHi [Parent Name]!\n\nRegistration is now open for ${organization.name} ${shareSeason.name}!\n\nSeason: ${shareSeason.start_date ? parseLocalDate(shareSeason.start_date).toLocaleDateString() : 'TBD'} - ${shareSeason.end_date ? parseLocalDate(shareSeason.end_date).toLocaleDateString() : 'TBD'}\nFee: $${totalFee}\n${shareSeason.early_bird_deadline ? `Early Bird Deadline: ${parseLocalDate(shareSeason.early_bird_deadline).toLocaleDateString()} (Save $${shareSeason.early_bird_discount || 0}!)` : ''}\n\nRegister now: ${shareLink}\n\nQuestions? Reply to this email.\n\nSee you on the court!\n${organization.name}`
                  navigator.clipboard.writeText(template)
                  showToast('Email template copied!', 'success')
                }}
                className={`mt-3 px-4 py-2 rounded-lg ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'} text-sm`}
              >
                Copy Email Template
              </button>
            </div>
          </div>

          {/* Social Media Post */}
          <div>
            <label className={`block text-sm font-medium ${tc.text} mb-2`}>Social Media Post</label>
            <div className={`${tc.cardBgAlt} rounded-[14px] p-4 border ${tc.border}`}>
              <div className={`text-sm ${tc.textSecondary}`}>
{`Registration is OPEN!

${shareSeason.name} is here! Join ${organization.name} for an amazing season.

All skill levels welcome
Expert coaching
Fun team environment

Register now:
${shareLink}

${shareSeason.early_bird_deadline ? `Early bird pricing ends ${parseLocalDate(shareSeason.early_bird_deadline).toLocaleDateString()}!` : ''}

#youth${shareSeason.sports?.name || 'sports'} #${organization.name.replace(/\s+/g, '')} #registration`}
              </div>
              <button
                onClick={() => {
                  const post = `Registration is OPEN!\n\n${shareSeason.name} is here! Join ${organization.name} for an amazing season.\n\nAll skill levels welcome\nExpert coaching\nFun team environment\n\nRegister now:\n${shareLink}\n\n${shareSeason.early_bird_deadline ? `Early bird pricing ends ${parseLocalDate(shareSeason.early_bird_deadline).toLocaleDateString()}!` : ''}\n\n#youth${shareSeason.sports?.name || 'sports'} #${organization.name.replace(/\s+/g, '')} #registration`
                  navigator.clipboard.writeText(post)
                  showToast('Social post copied!', 'success')
                }}
                className={`mt-3 px-4 py-2 rounded-lg ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'} text-sm`}
              >
                Copy Social Post
              </button>
            </div>
          </div>

          {/* Flyer Info */}
          <div className="bg-gradient-to-r from-lynx-sky/10 to-transparent rounded-[14px] p-4 border border-lynx-sky/30">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <p className={`font-medium ${tc.text}`}>Pro Tip: Print a Flyer!</p>
                <p className={`text-sm ${tc.textMuted} mt-1`}>Download the QR code and add it to a flyer. Parents can scan with their phone to register instantly!</p>
              </div>
            </div>
          </div>
        </div>

        <div className={`p-6 border-t ${tc.border} flex justify-end`}>
          <button
            onClick={() => setShowShareModal(false)}
            className="px-6 py-2 rounded-[14px] bg-lynx-navy text-white font-bold hover:brightness-110"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
