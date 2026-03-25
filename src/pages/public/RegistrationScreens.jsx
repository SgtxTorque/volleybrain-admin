// Registration screen-level components: Fee preview, Waivers, Success, Loading, Error
// Extracted from RegistrationFormSteps for the 500-line file limit

import { Edit, ChevronDown, ChevronUp, CheckCircle2, AlertCircle } from '../../constants/icons'

const CARD_CLASSES = 'bg-white rounded-2xl border border-[#E8ECF2] shadow-[0_2px_12px_rgba(0,0,0,0.04)]'
const INPUT_CLASSES = 'w-full px-4 py-3 rounded-xl border border-[#E8ECF2] text-sm font-medium bg-white text-slate-700 focus:outline-none focus:border-[#4BB9EC] focus:ring-2 focus:ring-[#4BB9EC]/10 transition-colors'
const LABEL_CLASSES = 'block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5'

// ─── Waivers and signature card ───────────────────────────────────────────
function WaiversCard({ config, waiverState, setWaiverState, signature, setSignature }) {
  const waivers = config.waivers
  if (!waivers || !Object.entries(waivers).some(([_, w]) => w?.enabled)) return null

  return (
    <div className={`${CARD_CLASSES} p-6 mb-6`}>
      <h2 className="text-r-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-[#4BB9EC]/10 flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4 text-[#4BB9EC]" />
        </div>
        Almost there — review and sign
      </h2>
      <div className="space-y-4">
        {Object.entries(waivers).map(([key, waiver]) => {
          if (!waiver?.enabled) return null
          return (
            <div
              key={key}
              className="p-4 rounded-lg bg-[#F5F6F8] border border-slate-200"
            >
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={waiverState[key] || false}
                  onChange={e => setWaiverState({ ...waiverState, [key]: e.target.checked })}
                  className="w-5 h-5 rounded mt-0.5 accent-[#4BB9EC]"
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
          <Edit className="w-4 h-4 text-[#4BB9EC]" />
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
            className={`${INPUT_CLASSES} text-lg font-[cursive,serif] ${signature.trim() ? 'border-[#4BB9EC] ring-2 ring-[#4BB9EC]/20' : ''}`}
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
          <p className="text-r-3xl font-bold text-[#10284C] mt-0.5">
            ${displayTotal.toFixed(2)}
          </p>
        </div>
        <div className="p-2 rounded-lg bg-[#F5F6F8] border border-slate-200">
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
function SuccessScreen({ childrenCount, seasonName, totalFee, currentChildName, organization }) {
  const count = childrenCount + (currentChildName ? 1 : 0)

  return (
    <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center p-6">
      <div className={`${CARD_CLASSES} p-10 max-w-md text-center animate-fade-in`}>
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-black text-[#10284C]" style={{ fontFamily: 'var(--v2-font)' }}>Welcome to the Den!</h1>
        <p className="mt-3 text-r-sm text-slate-600 leading-relaxed">
          {count} {count === 1 ? 'player' : 'players'} signed up for {seasonName} — you're all set!
        </p>
        <p className="text-r-xs text-slate-400 mt-4">
          We'll send a confirmation email once your registration is reviewed. Hang tight!
        </p>
        {totalFee > 0 && (
          <div className="mt-6 p-5 rounded-[14px] bg-[#F5F6F8] border border-slate-200">
            <p className="text-r-xs text-slate-500">Estimated total fees</p>
            <p className="text-r-2xl font-bold text-[#10284C] mt-1">${totalFee.toFixed(2)}</p>
            <p className="text-r-xs text-slate-400 mt-1">Payment details will be sent after approval</p>
          </div>
        )}

        {/* Section A: Create Your Account CTA */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <h2 className="text-r-lg font-bold text-slate-900">What's next?</h2>
          <p className="text-r-sm text-slate-600 mt-2 leading-relaxed">
            Create a Lynx account to track your registration status, manage payments, and stay connected with your team.
          </p>
          <a
            href="/"
            className="inline-block mt-4 bg-lynx-navy-subtle text-white font-bold py-3 px-8 rounded-xl hover:brightness-110 transition"
            style={{ fontFamily: 'var(--v2-font)' }}
          >
            Create Account
          </a>
          <p className="text-r-xs text-slate-400 mt-2">Use the same email you registered with</p>
        </div>

        {/* Section B: Download the App */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <h3 className="text-r-sm font-bold text-slate-700">Get the Lynx App</h3>
          <p className="text-r-xs text-slate-400 mt-1">
            Download the mobile app for game day updates, real-time notifications, and more.
          </p>
          <p className="text-r-xs text-slate-400 mt-1">Coming soon to App Store and Google Play</p>
        </div>

        {/* Section C: Organization contact info */}
        {organization?.name && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-r-xs text-slate-400">
              Questions? Contact {organization.name}
              {organization.email && (
                <> at <a href={`mailto:${organization.email}`} className="text-[#4BB9EC] hover:underline">{organization.email}</a></>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Loading spinner ──────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center">
      <div className="w-10 h-10 border-3 border-[#4BB9EC] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// ─── Error screen (no season / org found) ─────────────────────────────────
function ErrorScreen({ message }) {
  return (
    <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center p-6">
      <div className={`${CARD_CLASSES} p-10 max-w-md text-center`}>
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-r-2xl font-bold text-slate-900">Hmm, we can't find that</h1>
        <p className="mt-3 text-r-sm text-slate-600">{message}</p>
        <p className="text-r-xs text-slate-400 mt-3">Double-check the link and try again, or reach out to your league admin.</p>
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
