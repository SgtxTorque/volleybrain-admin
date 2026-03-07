// Registration screen-level components: Fee preview, Waivers, Success, Loading, Error
// Extracted from RegistrationFormSteps for the 500-line file limit

import { Edit, ChevronDown, ChevronUp, CheckCircle2, AlertCircle } from '../../constants/icons'

const CARD_CLASSES = 'bg-white rounded-[14px] border border-slate-200 shadow-soft-sm'
const INPUT_CLASSES = 'w-full px-4 py-3 rounded-lg border border-slate-200 text-r-sm font-medium bg-white text-slate-700 focus:outline-none focus:border-lynx-sky focus:ring-2 focus:ring-lynx-sky/20 transition-colors'
const LABEL_CLASSES = 'block text-r-sm font-semibold text-slate-700 mb-1.5'

// ─── Waivers and signature card ───────────────────────────────────────────
function WaiversCard({ config, waiverState, setWaiverState, signature, setSignature }) {
  const waivers = config.waivers
  if (!waivers || !Object.entries(waivers).some(([_, w]) => w?.enabled)) return null

  return (
    <div className={`${CARD_CLASSES} p-6 mb-6`}>
      <h2 className="text-r-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-lynx-sky/10 flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4 text-lynx-sky" />
        </div>
        Waivers and Agreements
      </h2>
      <div className="space-y-4">
        {Object.entries(waivers).map(([key, waiver]) => {
          if (!waiver?.enabled) return null
          return (
            <div
              key={key}
              className="p-4 rounded-lg bg-lynx-cloud border border-slate-200"
            >
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={waiverState[key] || false}
                  onChange={e => setWaiverState({ ...waiverState, [key]: e.target.checked })}
                  className="w-5 h-5 rounded mt-0.5 accent-lynx-sky"
                />
                <div>
                  <p className="font-semibold text-r-sm text-slate-900">
                    {waiver.title} {waiver.required && <span className="text-red-500">*</span>}
                  </p>
                  <p className="text-r-xs text-slate-500 mt-1 leading-relaxed">
                    {waiver.text}
                  </p>
                </div>
              </label>
            </div>
          )
        })}
      </div>

      {/* Electronic Signature */}
      <div className="mt-6 pt-6 border-t border-slate-200">
        <h3 className="font-bold text-r-sm text-slate-900 mb-3 flex items-center gap-2">
          <Edit className="w-4 h-4 text-lynx-sky" />
          Electronic Signature <span className="text-red-500">*</span>
        </h3>
        <p className="text-r-xs text-slate-500 mb-4 leading-relaxed">
          By typing your name below, you acknowledge that you have read and agree to all waivers and agreements above.
          This constitutes a legally binding electronic signature.
        </p>
        <div className="mb-3">
          <label className={LABEL_CLASSES}>
            Type your full legal name
          </label>
          <input
            type="text"
            value={signature}
            onChange={e => setSignature(e.target.value)}
            placeholder="e.g., John Smith"
            className={`${INPUT_CLASSES} text-lg font-[cursive,serif] ${signature.trim() ? 'border-lynx-sky ring-2 ring-lynx-sky/20' : ''}`}
          />
        </div>
        {signature.trim() && (
          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
            <p className="text-r-sm text-green-700">
              <CheckCircle2 className="w-4 h-4 inline mr-1.5 -mt-0.5" />
              I, <strong className="font-[cursive,serif]">{signature}</strong>, agree to all waivers and agreements listed above.
            </p>
            <p className="text-r-xs text-slate-500 mt-1 ml-6">
              Signed on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Fee preview card (collapsible) ───────────────────────────────────────
function FeePreviewCard({ season, feePerChild, childrenCount, showBreakdown, onToggleBreakdown }) {
  if (feePerChild <= 0) return null

  const displayTotal = feePerChild * Math.max(childrenCount, 1)

  return (
    <div className={`${CARD_CLASSES} mb-6 overflow-hidden`}>
      <button
        type="button"
        className="w-full p-5 flex items-center justify-between text-left"
        onClick={onToggleBreakdown}
      >
        <div>
          <p className="text-r-xs font-medium text-slate-500">
            {childrenCount > 0 ? `Total for ${childrenCount} ${childrenCount === 1 ? 'child' : 'children'}` : 'Fee per child'}
          </p>
          <p className="text-r-3xl font-bold text-lynx-navy mt-0.5">
            ${displayTotal.toFixed(2)}
          </p>
        </div>
        <div className="p-2 rounded-lg bg-lynx-cloud border border-slate-200">
          {showBreakdown
            ? <ChevronUp className="w-5 h-5 text-slate-500" />
            : <ChevronDown className="w-5 h-5 text-slate-500" />
          }
        </div>
      </button>

      {showBreakdown && (
        <div className="px-5 pb-5 space-y-2 border-t border-slate-200">
          <div className="pt-3">
            <p className="text-r-sm font-semibold text-slate-900 mb-2">Per child:</p>
            {season?.fee_registration > 0 && (
              <div className="flex justify-between py-1.5 text-r-sm">
                <span className="text-slate-500">Registration Fee</span>
                <span className="font-medium text-slate-700">${season.fee_registration}</span>
              </div>
            )}
            {season?.fee_uniform > 0 && (
              <div className="flex justify-between py-1.5 text-r-sm">
                <span className="text-slate-500">Uniform Fee</span>
                <span className="font-medium text-slate-700">${season.fee_uniform}</span>
              </div>
            )}
            {season?.fee_monthly > 0 && (
              <div className="flex justify-between py-1.5 text-r-sm">
                <span className="text-slate-500">Monthly Dues ({season.months_in_season || 1} months)</span>
                <span className="font-medium text-slate-700">${season.fee_monthly * (season.months_in_season || 1)}</span>
              </div>
            )}
          </div>
          <p className="text-r-xs text-slate-400 pt-2">
            Payment due after registration is approved
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Success / confirmation screen ────────────────────────────────────────
function SuccessScreen({ childrenCount, seasonName, totalFee, currentChildName }) {
  const count = childrenCount + (currentChildName ? 1 : 0)

  return (
    <div className="min-h-screen bg-lynx-cloud flex items-center justify-center p-6">
      <div className={`${CARD_CLASSES} p-10 max-w-md text-center animate-fade-in`}>
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-r-2xl font-bold text-slate-900">Registration Submitted!</h1>
        <p className="mt-3 text-r-sm text-slate-600 leading-relaxed">
          Thank you for registering {count} {count === 1 ? 'child' : 'children'} for {seasonName}!
        </p>
        <p className="text-r-xs text-slate-400 mt-4">
          You will receive a confirmation email once your registration is reviewed.
        </p>
        {totalFee > 0 && (
          <div className="mt-6 p-5 rounded-[14px] bg-lynx-cloud border border-slate-200">
            <p className="text-r-xs text-slate-500">Estimated total fees</p>
            <p className="text-r-2xl font-bold text-lynx-navy mt-1">${totalFee.toFixed(2)}</p>
            <p className="text-r-xs text-slate-400 mt-1">Payment details will be sent after approval</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Loading spinner ──────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-lynx-cloud flex items-center justify-center">
      <div className="w-10 h-10 border-3 border-lynx-sky border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// ─── Error screen (no season / org found) ─────────────────────────────────
function ErrorScreen({ message }) {
  return (
    <div className="min-h-screen bg-lynx-cloud flex items-center justify-center p-6">
      <div className={`${CARD_CLASSES} p-10 max-w-md text-center`}>
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-r-2xl font-bold text-slate-900">Registration Not Found</h1>
        <p className="mt-3 text-r-sm text-slate-600">{message}</p>
      </div>
    </div>
  )
}

export {
  WaiversCard,
  FeePreviewCard,
  SuccessScreen,
  LoadingScreen,
  ErrorScreen
}
