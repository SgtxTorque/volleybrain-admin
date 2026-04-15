// Registration screen-level components: Fee preview, Waivers, Success, Loading, Error
// Extracted from RegistrationFormSteps for the 500-line file limit

import { useState, useEffect } from 'react'
import { Edit, ChevronDown, ChevronUp, CheckCircle2, AlertCircle } from '../../constants/icons'
import { supabase } from '../../lib/supabase'

const CARD_CLASSES = 'bg-white rounded-2xl border border-[#E8ECF2] shadow-[0_2px_12px_rgba(0,0,0,0.04)]'
const INPUT_CLASSES = 'w-full px-4 py-3 rounded-xl border border-[#E8ECF2] text-sm font-medium bg-white text-slate-700 focus:outline-none focus:border-[#4BB9EC] focus:ring-2 focus:ring-[#4BB9EC]/10 transition-colors'
const LABEL_CLASSES = 'block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5'

// ─── Waivers and signature card ───────────────────────────────────────────
function WaiversCard({ config, waiverState, setWaiverState, signature, setSignature }) {
  const waivers = config.waivers
  if (!waivers || !Object.entries(waivers).some(([_, w]) => w?.enabled)) return null

  return (
    <div className={`${CARD_CLASSES} p-6 mb-4`}>
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
function FeePreviewCard({ season, feePerChild, childrenCount, totalFee, hasDiscounts, totalDiscounts, feeBreakdowns, showBreakdown, onToggleBreakdown, accentColor }) {
  // Use enhanced fee data if available, fall back to simple calculation
  const displayTotal = totalFee != null ? totalFee : (feePerChild * Math.max(childrenCount, 1))
  if (displayTotal <= 0 && !hasDiscounts) return null

  const subtotalBeforeDiscounts = feeBreakdowns?.length > 0
    ? feeBreakdowns.reduce((sum, fb) => {
        // Sum base fees from the season for each child
        const baseFee = (parseFloat(season?.fee_registration) || 0)
          + (parseFloat(season?.fee_uniform) || 0)
          + ((parseFloat(season?.fee_monthly) || 0) * (season?.months_in_season || 1))
        return sum + baseFee
      }, 0)
    : displayTotal

  const accent = accentColor || '#4BB9EC'

  return (
    <div className={`${CARD_CLASSES} mb-4 overflow-hidden`}>
      <button
        type="button"
        className="w-full p-5 flex items-center justify-between text-left"
        onClick={onToggleBreakdown}
      >
        <div>
          <p className="text-r-xs font-medium text-slate-500">
            {childrenCount > 0 ? `Total for ${childrenCount} ${childrenCount === 1 ? 'child' : 'children'}` : 'Fee per child'}
          </p>
          <div className="flex items-baseline gap-2 mt-0.5">
            {hasDiscounts && totalDiscounts > 0 && (
              <p className="text-r-lg text-slate-400 line-through">
                ${subtotalBeforeDiscounts.toFixed(2)}
              </p>
            )}
            <p className="text-r-3xl font-bold text-[#10284C]">
              ${displayTotal.toFixed(2)}
            </p>
          </div>
          {hasDiscounts && totalDiscounts > 0 && (
            <p className="text-r-xs font-semibold text-green-600 mt-0.5">
              You save ${totalDiscounts.toFixed(2)}!
            </p>
          )}
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
          {/* Per-child breakdowns from fee engine */}
          {feeBreakdowns?.length > 0 ? (
            feeBreakdowns.map((fb, idx) => (
              <div key={idx} className="pt-3">
                {feeBreakdowns.length > 1 && (
                  <p className="text-r-sm font-semibold text-slate-900 mb-2">Child {idx + 1}:</p>
                )}
                {fb.fees.map((fee, fIdx) => {
                  const isDiscount = fee.amount < 0 || fee.fee_name?.includes('Sibling') || fee.fee_name?.includes('Early Bird')
                  return (
                    <div key={fIdx} className="flex justify-between py-1.5 text-r-sm">
                      <span className={isDiscount ? 'text-green-600' : 'text-slate-500'}>
                        {fee.fee_name || fee.fee_type || 'Fee'}
                      </span>
                      <span className={`font-medium ${isDiscount ? 'text-green-600' : 'text-slate-700'}`}>
                        ${fee.amount.toFixed(2)}
                      </span>
                    </div>
                  )
                })}
                {fb.summary.hasEarlyBird && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wide">
                      Early Bird
                    </span>
                  </div>
                )}
                {fb.summary.hasSiblingDiscount && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wide">
                      Sibling Discount
                    </span>
                  </div>
                )}
              </div>
            ))
          ) : (
            /* Fallback: simple per-child breakdown from season fields */
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
          )}

          {/* Total line when multiple children */}
          {feeBreakdowns?.length > 1 && (
            <div className="flex justify-between py-2 border-t border-slate-200 mt-2">
              <span className="text-r-sm font-bold text-slate-900">Total</span>
              <span className="text-r-sm font-bold text-slate-900">${displayTotal.toFixed(2)}</span>
            </div>
          )}

          <p className="text-r-xs text-slate-400 pt-2">
            Payment due after registration is approved
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Success / confirmation screen ────────────────────────────────────────
function SuccessScreen({ childrenCount, seasonName, totalFee, currentChildName, organization, registrationIds = [], inviteUrl, authCreated, existingAccountDetected, parentEmail }) {
  const count = childrenCount + (currentChildName ? 1 : 0)
  const refId = registrationIds[0]?.slice(0, 8).toUpperCase()
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setHasSession(!!session)
    }
    checkSession()
  }, [])

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
        {refId && (
          <p className="text-r-xs text-slate-400 mt-2">
            Reference: <span className="font-mono font-bold text-slate-500">#{refId}</span>
          </p>
        )}
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

        {/* Section A: Account status CTA */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <h2 className="text-r-lg font-bold text-slate-900">What's next?</h2>
          {hasSession ? (
            <>
              <p className="text-r-sm text-slate-600 mt-2 leading-relaxed">
                You're already logged in. Head to your dashboard to track registration status and manage your team.
              </p>
              <a
                href="/"
                className="inline-block mt-4 bg-lynx-navy-subtle text-white font-bold py-3 px-8 rounded-xl hover:brightness-110 transition"
                style={{ fontFamily: 'var(--v2-font)' }}
              >
                Go to Dashboard
              </a>
            </>
          ) : authCreated ? (
            <>
              <p className="text-r-sm text-slate-600 mt-2 leading-relaxed">
                Your account is ready! Sign in to track registration status, manage payments, and stay connected with your team.
              </p>
              <div className="mt-4 p-4 rounded-[14px] bg-sky-50 border border-sky-200">
                <p className="text-r-sm text-sky-800">
                  <strong>Your login:</strong> {parentEmail}<br />
                  Use the password you just created to sign in.
                </p>
              </div>
              <a
                href="/login"
                className="inline-block mt-4 bg-lynx-navy-subtle text-white font-bold py-3 px-8 rounded-xl hover:brightness-110 transition"
                style={{ fontFamily: 'var(--v2-font)' }}
              >
                Sign In to Your Dashboard
              </a>
            </>
          ) : existingAccountDetected ? (
            <div className="mt-4 p-5 bg-amber-50 border border-amber-200 rounded-[14px] text-left">
              <h3 className="font-semibold text-amber-800 text-sm mb-2">You already have an account</h3>
              <p className="text-amber-700 text-r-xs mb-4">
                It looks like you've registered before. Sign in with your existing email and password to view your dashboard.
              </p>
              <div className="flex flex-col gap-2">
                <a href="/login" className="inline-flex items-center justify-center px-5 py-2.5 rounded-[14px] bg-[#10284C] text-white font-semibold text-sm hover:brightness-110">
                  Sign In →
                </a>
                <a href="/login" className="inline-flex items-center justify-center px-5 py-2.5 rounded-[14px] border border-slate-300 text-slate-600 font-medium text-sm hover:bg-slate-50">
                  Forgot Password?
                </a>
              </div>
            </div>
          ) : (
            <>
              <p className="text-r-sm text-slate-600 mt-2 leading-relaxed">
                Create a Lynx account to track your registration status, manage payments, and stay connected with your team.
              </p>
              <a
                href={inviteUrl || "/"}
                className="inline-block mt-4 bg-lynx-navy-subtle text-white font-bold py-3 px-8 rounded-xl hover:brightness-110 transition"
                style={{ fontFamily: 'var(--v2-font)' }}
              >
                Create Account
              </a>
              <p className="text-r-xs text-slate-400 mt-2">Use the same email you registered with</p>
            </>
          )}
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
