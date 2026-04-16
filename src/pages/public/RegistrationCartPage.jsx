// RegistrationCartPage — unified multi-program registration shopping cart
// 5-step flow: Programs → Children → Assign → Family Info → Review + Submit
// Reuses existing form components from RegistrationFormSteps.jsx and RegistrationScreens.jsx

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { calculateFeePerChild, DEFAULT_CONFIG } from './registrationConstants'
import { previewFeesForPlayer, getFeeSummary } from '../../lib/fee-calculator'
import { EmailService } from '../../lib/email-service'
import { createInvitation, checkExistingAccount } from '../../lib/invite-utils'
import {
  ChildrenListCard, PlayerInfoCard, AddChildButton,
  SharedInfoCard, CustomQuestionsCard,
} from './RegistrationFormSteps'
import OrgLogo from '../../components/OrgLogo'
import { getContrastText } from '../../components/social-cards/cardColorUtils'
import { Check, ChevronLeft, ChevronRight, ShoppingCart, Users, GitBranch, FileText, CreditCard, AlertCircle, Loader2, CheckCircle2, ExternalLink } from 'lucide-react'

const CARD = 'bg-white rounded-2xl border border-[#E8ECF2] shadow-[0_2px_12px_rgba(0,0,0,0.04)]'

// ─── Step Progress Indicator ──────────────────────────────────────────────
const STEPS = [
  { num: 1, label: 'Programs', icon: ShoppingCart },
  { num: 2, label: 'Children', icon: Users },
  { num: 3, label: 'Assign', icon: GitBranch },
  { num: 4, label: 'Family Info', icon: FileText },
  { num: 5, label: 'Review', icon: CreditCard },
]

function StepProgress({ currentStep }) {
  return (
    <div className="flex items-center justify-center gap-1 py-3">
      {STEPS.map((step, i) => {
        const isActive = step.num === currentStep
        const isComplete = step.num < currentStep
        const Icon = step.icon
        return (
          <div key={step.num} className="flex items-center">
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              isActive ? 'bg-white text-[#10284C] shadow-sm' :
              isComplete ? 'bg-white/20 text-white' :
              'text-white/40'
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                isActive ? 'bg-[#10284C] text-white' :
                isComplete ? 'bg-white/30 text-white' :
                'bg-white/10 text-white/40'
              }`}>
                {isComplete ? <Check className="w-3 h-3" /> : step.num}
              </div>
              <span className={i < STEPS.length - 1 ? '' : ''}>{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-4 h-px mx-0.5 ${step.num < currentStep ? 'bg-white/40' : 'bg-white/15'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Program Card (selectable) ────────────────────────────────────────────
function ProgramCard({ program, season, isSelected, onToggle, accentColor }) {
  const sportIcon = program.sport?.icon || program.icon || '🏆'
  const sportColor = program.sport?.color_primary || accentColor
  const fee = calculateFeePerChild(season)
  const isFull = season._isFull && !season.waitlist_enabled
  const isWaitlist = season._isFull && season.waitlist_enabled
  const spotsLeft = season._spotsRemaining
  const closesIn = season.registration_closes ? Math.ceil((new Date(season.registration_closes) - new Date()) / (1000 * 60 * 60 * 24)) : null

  return (
    <button
      type="button"
      disabled={isFull}
      onClick={onToggle}
      className={`${CARD} w-full text-left p-4 transition-all ${
        isFull ? 'opacity-50 cursor-not-allowed' :
        isSelected ? 'ring-2 ring-offset-1 bg-blue-50/50' :
        'hover:border-slate-300 hover:shadow-md cursor-pointer'
      }`}
      style={isSelected ? { ringColor: sportColor, borderColor: sportColor } : {}}
    >
      <div className="flex items-start gap-3">
        {/* Sport icon */}
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: `${sportColor}15` }}>
          {sportIcon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm truncate">{program.name}</h3>
            {isSelected && (
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: sportColor }}>
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{season.name}</p>
          {season.start_date && (
            <p className="text-[11px] text-slate-400 mt-0.5">
              {new Date(season.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {season.end_date && ` – ${new Date(season.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
            </p>
          )}
        </div>

        {/* Fee */}
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-slate-900">${fee.toFixed(0)}</p>
          <p className="text-[10px] text-slate-400">per player</p>
        </div>
      </div>

      {/* Status badges */}
      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
        {isFull && (
          <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wide">Full</span>
        )}
        {isWaitlist && (
          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wide">Waitlist Available</span>
        )}
        {!isFull && !isWaitlist && spotsLeft != null && spotsLeft <= 10 && (
          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wide">
            {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
          </span>
        )}
        {closesIn != null && closesIn <= 7 && closesIn > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 text-[10px] font-bold uppercase tracking-wide">
            Closes in {closesIn} day{closesIn !== 1 ? 's' : ''}!
          </span>
        )}
        {season.early_bird_deadline && new Date(season.early_bird_deadline) > new Date() && (
          <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-wide">
            Early Bird
          </span>
        )}
      </div>
    </button>
  )
}

// ─── Multi-Season Selector (for programs with multiple open seasons) ──────
function MultiSeasonProgramCard({ program, seasons, selectedSeasonId, onSelectSeason, onDeselect, accentColor }) {
  const sportIcon = program.sport?.icon || program.icon || '🏆'
  const sportColor = program.sport?.color_primary || accentColor
  const isSelected = !!selectedSeasonId

  return (
    <div className={`${CARD} w-full text-left p-4 transition-all ${
      isSelected ? 'ring-2 ring-offset-1 bg-blue-50/50' : ''
    }`}
    style={isSelected ? { borderColor: sportColor } : {}}>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: `${sportColor}15` }}>
          {sportIcon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm">{program.name}</h3>
            {isSelected && (
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: sportColor }}>
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Choose a season:</p>
        </div>
      </div>
      <div className="space-y-2">
        {seasons.map(season => {
          const fee = calculateFeePerChild(season)
          const isFull = season._isFull && !season.waitlist_enabled
          const isThisSelected = selectedSeasonId === season.id
          return (
            <button
              key={season.id}
              type="button"
              disabled={isFull}
              onClick={() => isThisSelected ? onDeselect() : onSelectSeason(season)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-all ${
                isFull ? 'opacity-50 cursor-not-allowed border-slate-200' :
                isThisSelected ? 'border-blue-300 bg-blue-50' :
                'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <p className="text-xs font-semibold text-slate-800">{season.name}</p>
                {season.start_date && (
                  <p className="text-[10px] text-slate-400">
                    {new Date(season.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {season.end_date && ` – ${new Date(season.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-700">${fee.toFixed(0)}</p>
                {isFull && <p className="text-[10px] text-red-500 font-bold">Full</p>}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Merge registration configs from multiple programs ────────────────────
function mergeRegistrationConfigs(selectedPrograms) {
  if (selectedPrograms.length === 0) return DEFAULT_CONFIG
  const merged = {
    player_fields: {},
    parent_fields: {},
    emergency_fields: {},
    medical_fields: {},
    waivers: {},
    custom_questions: [],
  }
  for (const { season } of selectedPrograms) {
    const config = season._resolvedConfig || DEFAULT_CONFIG
    for (const section of ['player_fields', 'parent_fields', 'emergency_fields', 'medical_fields']) {
      for (const [key, field] of Object.entries(config[section] || {})) {
        if (!merged[section][key]) {
          merged[section][key] = { ...field }
        } else {
          if (field.required) merged[section][key].required = true
          if (field.enabled) merged[section][key].enabled = true
        }
      }
    }
    // Merge waivers
    for (const [key, waiver] of Object.entries(config.waivers || {})) {
      if (!merged.waivers[key]) merged.waivers[key] = { ...waiver }
      else if (waiver.required) merged.waivers[key].required = true
    }
    // Merge custom questions (deduplicate by question text)
    const existingQs = new Set(merged.custom_questions.map(q => q.question?.toLowerCase().trim()))
    for (const q of (config.custom_questions || [])) {
      if (q.question && !existingQs.has(q.question.toLowerCase().trim())) {
        merged.custom_questions.push(q)
        existingQs.add(q.question.toLowerCase().trim())
      }
    }
  }
  // Fill gaps from DEFAULT_CONFIG
  const hasFields = (obj) => obj && typeof obj === 'object' && Object.keys(obj).length > 0
  return {
    player_fields: hasFields(merged.player_fields) ? merged.player_fields : DEFAULT_CONFIG.player_fields,
    parent_fields: hasFields(merged.parent_fields) ? merged.parent_fields : DEFAULT_CONFIG.parent_fields,
    emergency_fields: hasFields(merged.emergency_fields) ? merged.emergency_fields : DEFAULT_CONFIG.emergency_fields,
    medical_fields: hasFields(merged.medical_fields) ? merged.medical_fields : DEFAULT_CONFIG.medical_fields,
    waivers: hasFields(merged.waivers) ? merged.waivers : DEFAULT_CONFIG.waivers,
    custom_questions: merged.custom_questions.length > 0 ? merged.custom_questions : DEFAULT_CONFIG.custom_questions,
  }
}

// ─── Step 2: Add Children ─────────────────────────────────────────────────
function AddChildrenStep({ children, setChildren, currentChild, setCurrentChild, editingChildIndex, setEditingChildIndex, showAddChildForm, setShowAddChildForm, mergedConfig, selectedPrograms, accentColor, onContinue, onBack, error, setError }) {

  function validateCurrentChild() {
    const playerFields = mergedConfig.player_fields || {}
    for (const [key, field] of Object.entries(playerFields)) {
      if (field.enabled && field.required && !currentChild[key]) {
        return `${field.label} is required`
      }
    }
    return null
  }

  function addChild() {
    const validationError = validateCurrentChild()
    if (validationError) { setError(validationError); return }
    if (editingChildIndex !== null) {
      const updated = [...children]
      updated[editingChildIndex] = { ...currentChild }
      setChildren(updated)
      setEditingChildIndex(null)
    } else {
      setChildren([...children, { ...currentChild }])
    }
    setCurrentChild({})
    setShowAddChildForm(false)
    setError(null)
  }

  function editChild(index) {
    setCurrentChild({ ...children[index] })
    setEditingChildIndex(index)
    setShowAddChildForm(true)
  }

  function removeChild(index) {
    setChildren(children.filter((_, i) => i !== index))
    if (editingChildIndex === index) {
      setCurrentChild({})
      setEditingChildIndex(null)
    }
  }

  function cancelChildEdit() {
    setCurrentChild({})
    setEditingChildIndex(null)
    setShowAddChildForm(false)
    setError(null)
  }

  const programIcons = selectedPrograms.map(sp => {
    const icon = sp.program.sport?.icon || sp.program.icon || '🏆'
    return `${icon} ${sp.program.name}`
  })

  const savedCount = children.length
  const hasUnsaved = currentChild.first_name?.trim()

  return (
    <div>
      <div className="px-4 pt-6 pb-2 max-w-2xl mx-auto">
        <h2 className="text-lg font-bold text-[#10284C]">Add Your Children</h2>
        <p className="text-sm text-slate-500 mt-1">
          Each child can be assigned to: {programIcons.join(', ')}
        </p>
      </div>

      <div className="px-4 pb-36 max-w-2xl mx-auto">
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <ChildrenListCard children={children} onEdit={editChild} onRemove={removeChild} />

        <PlayerInfoCard
          config={mergedConfig}
          currentChild={currentChild}
          setCurrentChild={setCurrentChild}
          editingChildIndex={editingChildIndex}
          childrenCount={savedCount}
          showAddChildForm={showAddChildForm}
          onSaveChild={addChild}
          onCancel={cancelChildEdit}
          trackFormStart={() => {}}
        />

        <AddChildButton
          visible={savedCount > 0 && !showAddChildForm && editingChildIndex === null}
          onClick={() => { setShowAddChildForm(true); setCurrentChild({}) }}
        />
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button type="button" onClick={onBack}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-300 hover:bg-white flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Programs
          </button>
          <div className="text-right mr-3">
            <p className="text-xs text-slate-500">{savedCount} {savedCount === 1 ? 'child' : 'children'} added</p>
          </div>
          <button
            type="button"
            disabled={savedCount === 0}
            onClick={() => {
              if (hasUnsaved && savedCount === 0) { setError('Please save the child before continuing'); return }
              onContinue()
            }}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ backgroundColor: savedCount > 0 ? accentColor : '#94a3b8' }}
          >
            Continue — Assign Programs
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Cart Success Screen ──────────────────────────────────────────────────
function CartSuccessScreen({ children, childProgramMap, selectedPrograms, registrationIds, organization, totalFee, inviteUrl, existingAccountDetected }) {
  const [hasSession, setHasSession] = useState(false)
  const refId = registrationIds[0]?.slice(0, 8).toUpperCase()
  const totalRegs = registrationIds.length
  const hasPayFirst = selectedPrograms.some(sp => sp.season?.approval_mode === 'pay_first')

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()
      setHasSession(!!session)
    }
    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) setHasSession(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Build per-child program list
  const childSummaries = children.map((child, idx) => {
    const programIds = childProgramMap[idx] || []
    const programNames = programIds.map(pid => {
      const sp = selectedPrograms.find(p => p.programId === pid)
      return sp ? `${sp.program.sport?.icon || sp.program.icon || '🏆'} ${sp.program.name}` : ''
    }).filter(Boolean)
    return { child, programNames }
  })

  return (
    <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center p-6">
      <div className={`${CARD} p-10 max-w-md text-center animate-fade-in`}>
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-[#10284C] mb-2">
          Welcome to the {organization?.settings?.branding?.team_name || organization?.name || 'Team'}!
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          You registered {children.length} {children.length === 1 ? 'child' : 'children'} for {selectedPrograms.length} {selectedPrograms.length === 1 ? 'program' : 'programs'}.
        </p>

        {/* Per-child summary */}
        <div className="text-left space-y-3 mb-6">
          {childSummaries.map(({ child, programNames }, i) => (
            <div key={i} className="p-3 rounded-xl bg-[#F5F6F8] border border-slate-200">
              <p className="font-bold text-sm text-slate-900">{child.first_name} {child.last_name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{programNames.join(' · ')}</p>
            </div>
          ))}
        </div>

        {/* Fee note */}
        {totalFee > 0 && (
          <div className={`p-3 rounded-xl mb-6 text-left ${hasPayFirst ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'}`}>
            <p className={`text-sm font-medium ${hasPayFirst ? 'text-amber-900' : 'text-blue-800'}`}>
              {hasPayFirst ? 'Amount due: ' : 'Estimated total: '}<span className="font-bold">${totalFee.toFixed(2)}</span>
            </p>
            <p className={`text-xs mt-0.5 ${hasPayFirst ? 'text-amber-700' : 'text-blue-600'}`}>
              {hasPayFirst
                ? 'Payment is required before your registration will be approved. Sign in to pay now.'
                : 'Payment details will be sent after registration is approved.'}
            </p>
          </div>
        )}

        {/* Reference */}
        {refId && (
          <p className="text-xs text-slate-400 mb-6">
            Reference: <span className="font-mono font-bold">{refId}</span>
            {totalRegs > 1 && ` (+${totalRegs - 1} more)`}
          </p>
        )}

        {/* Account CTA */}
        {hasSession ? (
          <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-left mb-4">
            <p className="font-semibold text-green-800 text-sm mb-2">You're signed in!</p>
            <p className="text-green-700 text-xs mb-3">Head to your dashboard to track registration status and manage your team.</p>
            <a href="/" className="inline-flex items-center justify-center w-full px-5 py-2.5 rounded-[14px] bg-[#10284C] text-white font-semibold text-sm hover:brightness-110">Go to Your Dashboard →</a>
          </div>
        ) : existingAccountDetected ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-left mb-4">
            <p className="font-semibold text-amber-800 text-sm mb-2">You already have an account</p>
            <p className="text-amber-700 text-xs mb-3">Sign in with your existing email and password.</p>
            <a href="/login" className="inline-flex items-center justify-center w-full px-5 py-2.5 rounded-[14px] bg-[#10284C] text-white font-semibold text-sm hover:brightness-110">Sign In →</a>
            <a href="/login" className="inline-flex items-center justify-center w-full px-5 py-2 mt-2 rounded-[14px] border border-slate-300 text-slate-600 text-sm hover:bg-slate-50">Forgot Password?</a>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-[#10284C] text-white text-left mb-4">
            <p className="font-bold text-sm mb-1">Create Your Parent Account</p>
            <p className="text-xs text-white/70 mb-3">
              Track registrations, view schedules, and manage payments — all in one place.
            </p>
            <a
              href={inviteUrl || "/"}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-[#10284C] text-sm font-bold hover:bg-slate-100 transition-colors"
            >
              Create Account <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Org contact */}
        {organization?.contact_email && (
          <p className="text-xs text-slate-400">
            Questions? Contact {organization.name} at{' '}
            <a href={`mailto:${organization.contact_email}`} className="text-[#4BB9EC] underline">
              {organization.contact_email}
            </a>
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Step 5: Review + Submit ──────────────────────────────────────────────
function ReviewSubmitStep({ children, childProgramMap, selectedPrograms, sharedInfo, waiverState, customAnswers, signature, organization, accentColor, onBack, onSubmit, submitting, error }) {
  // Build cart items grouped by program
  const programGroups = {}
  let grandSubtotal = 0
  let grandTotal = 0
  let totalDiscountAmount = 0

  children.forEach((child, childIndex) => {
    const assignedIds = childProgramMap[childIndex] || []
    assignedIds.forEach(programId => {
      const sp = selectedPrograms.find(p => p.programId === programId)
      if (!sp) return
      const fees = previewFeesForPlayer(
        { ...child, parent_email: sharedInfo.parent1_email },
        sp.season,
        childIndex
      )
      const summary = getFeeSummary(fees)
      const baseFee = calculateFeePerChild(sp.season)

      if (!programGroups[programId]) {
        programGroups[programId] = {
          program: sp.program,
          season: sp.season,
          items: [],
        }
      }
      const discount = Math.max(0, baseFee - summary.total)
      programGroups[programId].items.push({
        child,
        childIndex,
        fees,
        summary,
        baseFee,
        discount,
      })
      grandSubtotal += baseFee
      grandTotal += summary.total
      totalDiscountAmount += discount
    })
  })

  const totalRegistrations = Object.values(programGroups).reduce((sum, g) => sum + g.items.length, 0)

  return (
    <div>
      <div className="px-4 pt-6 pb-2 max-w-2xl mx-auto">
        <h2 className="text-lg font-bold text-[#10284C]">Review Your Registration</h2>
        <p className="text-sm text-slate-500 mt-1">
          {totalRegistrations} registration{totalRegistrations !== 1 ? 's' : ''} for {children.length} {children.length === 1 ? 'child' : 'children'}
        </p>
      </div>

      <div className="px-4 pb-40 max-w-2xl mx-auto space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Program groups */}
        {Object.values(programGroups).map(group => {
          const sportIcon = group.program.sport?.icon || group.program.icon || '🏆'
          const sportColor = group.program.sport?.color_primary || accentColor
          return (
            <div key={group.program.id} className={`${CARD} overflow-hidden`}>
              <div className="px-4 py-3 flex items-center gap-2" style={{ backgroundColor: `${sportColor}10` }}>
                <span className="text-lg">{sportIcon}</span>
                <div>
                  <p className="font-bold text-sm text-slate-900">{group.program.name}</p>
                  <p className="text-[11px] text-slate-500">{group.season.name}</p>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {group.items.map(({ child, summary, discount, fees }, i) => (
                  <div key={i} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{child.first_name} {child.last_name}</p>
                        {discount > 0 && (
                          <p className="text-[10px] text-green-600 font-semibold mt-0.5">
                            {summary.hasEarlyBird && summary.hasSiblingDiscount ? 'Early Bird + Sibling' :
                             summary.hasEarlyBird ? 'Early Bird Discount' :
                             summary.hasSiblingDiscount ? 'Sibling Discount' : 'Discount'} (-${discount.toFixed(2)})
                          </p>
                        )}
                      </div>
                      <p className="font-bold text-sm text-slate-900">${summary.total.toFixed(2)}</p>
                    </div>
                    {fees && fees.length > 0 && (
                      <details className="mt-2">
                        <summary className="text-[11px] text-slate-500 cursor-pointer hover:text-slate-700">
                          View fee breakdown
                        </summary>
                        <div className="mt-1 pl-3 border-l-2 border-slate-200">
                          {fees.map((fee, fi) => {
                            const isDiscount = fee.amount < 0 || fee.fee_name?.includes('Sibling') || fee.fee_name?.includes('Early Bird')
                            return (
                              <div key={fi} className="flex justify-between py-0.5 text-[11px]">
                                <span className={isDiscount ? 'text-green-600' : 'text-slate-600'}>{fee.fee_name || fee.fee_type || 'Fee'}</span>
                                <span className={isDiscount ? 'text-green-600 font-medium' : 'text-slate-700'}>${(fee.amount || 0).toFixed(2)}</span>
                              </div>
                            )
                          })}
                        </div>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {/* Family info summary */}
        <div className={`${CARD} p-4`}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Parent / Guardian</p>
          <p className="text-sm font-medium text-slate-800">{sharedInfo.parent1_name}</p>
          <p className="text-xs text-slate-500">{sharedInfo.parent1_email} · {sharedInfo.parent1_phone}</p>
        </div>

        {/* Totals */}
        <div className={`${CARD} p-4`}>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal ({totalRegistrations} registrations)</span>
              <span className="text-slate-700">${grandSubtotal.toFixed(2)}</span>
            </div>
            {totalDiscountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Discounts</span>
                <span className="text-green-600 font-semibold">-${totalDiscountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-200">
              <span className="text-[#10284C]">Total</span>
              <span className="text-[#10284C]">${grandTotal.toFixed(2)}</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            Payment details will be sent after registration is approved.
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button type="button" onClick={onBack} disabled={submitting}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-300 hover:bg-white flex items-center gap-1 disabled:opacity-40">
            <ChevronLeft className="w-4 h-4" /> Family Info
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={onSubmit}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60 flex items-center gap-2"
            style={{ backgroundColor: accentColor }}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Registration
                <Check className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Group waivers: shared vs program-specific ───────────────────────────
function groupWaivers(selectedPrograms, childProgramMap, children) {
  const waiverMap = new Map()

  for (const sp of selectedPrograms) {
    const config = sp.season._resolvedConfig || DEFAULT_CONFIG
    const waivers = config.waivers || {}
    for (const [key, waiver] of Object.entries(waivers)) {
      if (!waiver?.enabled) continue
      const normalizedTitle = waiver.title?.toLowerCase().trim() || key
      if (waiverMap.has(normalizedTitle)) {
        const existing = waiverMap.get(normalizedTitle)
        existing.programs.push(sp.program.name)
        existing.programIds.push(sp.programId)
      } else {
        waiverMap.set(normalizedTitle, {
          key: `${sp.programId}_${key}`,
          title: waiver.title || key,
          text: waiver.text || '',
          required: waiver.required || false,
          programs: [sp.program.name],
          programIds: [sp.programId],
        })
      }
    }
  }

  const shared = []
  const programSpecific = {}

  for (const waiver of waiverMap.values()) {
    if (waiver.programs.length > 1 || selectedPrograms.length === 1) {
      shared.push({ ...waiver, category: 'organization' })
    } else {
      const programName = waiver.programs[0]
      if (!programSpecific[programName]) programSpecific[programName] = []
      programSpecific[programName].push(waiver)
    }
  }

  // Add applicable children to program-specific waivers
  for (const [programName, waivers] of Object.entries(programSpecific)) {
    const programId = waivers[0]?.programIds[0]
    const applicableChildren = children.filter((_, idx) =>
      (childProgramMap[idx] || []).includes(programId)
    ).map(c => c.first_name)
    waivers.forEach(w => w.applicableChildren = applicableChildren)
  }

  return { shared, programSpecific }
}

// ─── Step 4: Family Info + Waivers ────────────────────────────────────────
function FamilyInfoStep({ mergedConfig, sharedInfo, setSharedInfo, waiverState, setWaiverState, customAnswers, setCustomAnswers, signature, setSignature, selectedPrograms, childProgramMap, children, organization, accentColor, onContinue, onBack }) {
  const { shared: sharedWaivers, programSpecific: programWaivers } = groupWaivers(selectedPrograms, childProgramMap, children)
  const allWaivers = [...sharedWaivers, ...Object.values(programWaivers).flat()]

  // Pre-fill logic
  useEffect(() => {
    const email = sharedInfo.parent1_email?.trim()?.toLowerCase()
    if (!email || !email.includes('@') || !organization?.id) return
    const timer = setTimeout(async () => {
      try {
        const { data: existing } = await supabase
          .from('players')
          .select('parent_name, parent_phone, emergency_contact_name, emergency_contact_phone, medical_notes')
          .eq('parent_email', email)
          .order('created_at', { ascending: false })
          .limit(1)
        if (existing?.[0]) {
          const prev = existing[0]
          setSharedInfo(si => ({
            ...si,
            parent1_name: si.parent1_name || prev.parent_name || '',
            parent1_phone: si.parent1_phone || prev.parent_phone || '',
            emergency_name: si.emergency_name || prev.emergency_contact_name || '',
            emergency_phone: si.emergency_phone || prev.emergency_contact_phone || '',
            medical_conditions: si.medical_conditions || prev.medical_notes || '',
          }))
        }
      } catch (e) { /* silent prefill */ }
    }, 600)
    return () => clearTimeout(timer)
  }, [sharedInfo.parent1_email, organization?.id])

  // Validation
  const requiredWaiversMissing = allWaivers.filter(w => w.required && !waiverState[w.key])
  const signatureMissing = allWaivers.length > 0 && !signature.trim()
  const parentEmailMissing = !sharedInfo.parent1_email?.trim()
  const canContinue = requiredWaiversMissing.length === 0 && !signatureMissing && !parentEmailMissing

  const CARD_CLS = 'bg-white rounded-2xl border border-[#E8ECF2] shadow-[0_2px_12px_rgba(0,0,0,0.04)]'
  const INPUT_CLS = 'w-full px-4 py-3 rounded-xl border border-[#E8ECF2] text-sm font-medium bg-white text-slate-700 focus:outline-none focus:border-[#4BB9EC] focus:ring-2 focus:ring-[#4BB9EC]/10 transition-colors'
  const LABEL_CLS = 'block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5'

  return (
    <div>
      <div className="px-4 pt-6 pb-2 max-w-2xl mx-auto">
        <h2 className="text-lg font-bold text-[#10284C]">Family Information</h2>
        <p className="text-sm text-slate-500 mt-1">Enter your info once — it applies to all children and programs.</p>
      </div>

      <div className="px-4 pb-36 max-w-2xl mx-auto">
        {/* Parent/Emergency/Medical fields */}
        <SharedInfoCard
          config={mergedConfig}
          sharedInfo={sharedInfo}
          setSharedInfo={setSharedInfo}
          trackFormStart={() => {}}
        />

        {/* Custom questions */}
        <CustomQuestionsCard
          config={mergedConfig}
          customAnswers={customAnswers}
          setCustomAnswers={setCustomAnswers}
        />

        {/* Grouped Waivers */}
        {(sharedWaivers.length > 0 || Object.keys(programWaivers).length > 0) && (
          <div className={`${CARD_CLS} p-6 mb-4`}>
            <h2 className="text-r-lg font-bold text-slate-900 mb-1">Waivers & Agreements</h2>
            <p className="text-xs text-slate-400 mb-4">Review and accept each waiver to continue.</p>

            {/* Shared / Org-level waivers */}
            {sharedWaivers.length > 0 && (
              <div className="mb-4">
                {selectedPrograms.length > 1 && (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                    Organization Waivers — sign once for all programs
                  </p>
                )}
                <div className="space-y-3">
                  {sharedWaivers.map(waiver => (
                    <div key={waiver.key} className="p-4 rounded-lg bg-[#F5F6F8] border border-slate-200">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={waiverState[waiver.key] || false}
                          onChange={e => setWaiverState({ ...waiverState, [waiver.key]: e.target.checked })}
                          className="w-5 h-5 rounded mt-0.5 accent-[#4BB9EC]"
                        />
                        <div>
                          <p className="font-semibold text-sm text-slate-900">
                            {waiver.title} {waiver.required && <span className="text-red-500">*</span>}
                          </p>
                          {waiver.text && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{waiver.text}</p>}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Program-specific waivers */}
            {Object.entries(programWaivers).map(([programName, waivers]) => (
              <div key={programName} className="mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                  {programName}-Specific
                </p>
                {waivers[0]?.applicableChildren?.length > 0 && (
                  <p className="text-[10px] text-slate-400 mb-2">
                    Required for: {waivers[0].applicableChildren.join(', ')}
                  </p>
                )}
                <div className="space-y-3">
                  {waivers.map(waiver => (
                    <div key={waiver.key} className="p-4 rounded-lg bg-[#F5F6F8] border border-slate-200">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={waiverState[waiver.key] || false}
                          onChange={e => setWaiverState({ ...waiverState, [waiver.key]: e.target.checked })}
                          className="w-5 h-5 rounded mt-0.5 accent-[#4BB9EC]"
                        />
                        <div>
                          <p className="font-semibold text-sm text-slate-900">
                            {waiver.title} {waiver.required && <span className="text-red-500">*</span>}
                          </p>
                          {waiver.text && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{waiver.text}</p>}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Signature */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h3 className="font-bold text-sm text-slate-900 mb-3">
                Electronic Signature <span className="text-red-500">*</span>
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                By typing your name below, you acknowledge that you have read and agree to all waivers above.
              </p>
              <div className="mb-3">
                <label className={LABEL_CLS}>Type your full legal name</label>
                <input
                  type="text"
                  value={signature}
                  onChange={e => setSignature(e.target.value)}
                  placeholder="e.g., John Smith"
                  className={`${INPUT_CLS} text-lg font-[cursive,serif] ${signature.trim() ? 'border-[#4BB9EC] ring-2 ring-[#4BB9EC]/20' : ''}`}
                />
              </div>
              {signature.trim() && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-sm text-green-700">
                    <Check className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                    I, <strong className="font-[cursive,serif]">{signature}</strong>, agree to all waivers listed above.
                  </p>
                  <p className="text-xs text-slate-500 mt-1 ml-6">
                    Signed on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button type="button" onClick={onBack}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-300 hover:bg-white flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Assign
          </button>
          <button
            type="button"
            disabled={!canContinue}
            onClick={onContinue}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ backgroundColor: canContinue ? accentColor : '#94a3b8' }}
          >
            Review & Submit
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Step 3: Assign Programs Per Child ────────────────────────────────────
function AssignProgramsStep({ children, selectedPrograms, childProgramMap, setChildProgramMap, sharedInfo, accentColor, onContinue, onBack }) {
  // Default: all children get all selected programs
  useEffect(() => {
    if (children.length > 0 && Object.keys(childProgramMap).length === 0) {
      const defaultMap = {}
      children.forEach((_, index) => {
        defaultMap[index] = selectedPrograms.map(sp => sp.programId)
      })
      setChildProgramMap(defaultMap)
    }
  }, []) // Only on mount

  function toggleProgram(childIndex, programId) {
    setChildProgramMap(prev => {
      const current = prev[childIndex] || []
      const exists = current.includes(programId)
      return {
        ...prev,
        [childIndex]: exists ? current.filter(id => id !== programId) : [...current, programId]
      }
    })
  }

  // Compute fees per child
  const childSummaries = children.map((child, childIndex) => {
    const assignedIds = childProgramMap[childIndex] || []
    let childTotal = 0
    const items = assignedIds.map(programId => {
      const sp = selectedPrograms.find(p => p.programId === programId)
      if (!sp) return null
      const fees = previewFeesForPlayer(
        { ...child, parent_email: sharedInfo.parent1_email },
        sp.season,
        childIndex
      )
      const summary = getFeeSummary(fees)
      childTotal += summary.total
      return { sp, summary, fees }
    }).filter(Boolean)
    return { child, childIndex, items, total: childTotal, programCount: assignedIds.length }
  })

  const grandTotal = childSummaries.reduce((sum, cs) => sum + cs.total, 0)
  const totalRegistrations = childSummaries.reduce((sum, cs) => sum + cs.programCount, 0)

  // Validation: every child needs at least 1 program
  const childrenWithNoPrograms = childSummaries.filter(cs => cs.programCount === 0)
  const canContinue = childrenWithNoPrograms.length === 0 && totalRegistrations > 0

  // Initials color based on child index
  const INITIALS_COLORS = ['#4BB9EC', '#F59E0B', '#10B981', '#8B5CF6', '#EF4444', '#EC4899']

  return (
    <div>
      <div className="px-4 pt-6 pb-2 max-w-2xl mx-auto">
        <h2 className="text-lg font-bold text-[#10284C]">Assign Programs</h2>
        <p className="text-sm text-slate-500 mt-1">Choose which programs each child will join. All are pre-selected — deselect as needed.</p>
      </div>

      <div className="px-4 pb-40 max-w-2xl mx-auto space-y-4">
        {childSummaries.map(({ child, childIndex, items, total, programCount }) => {
          const initials = `${child.first_name?.[0] || ''}${child.last_name?.[0] || ''}`.toUpperCase()
          const color = INITIALS_COLORS[childIndex % INITIALS_COLORS.length]
          const assignedIds = childProgramMap[childIndex] || []
          const hasWarning = programCount === 0

          return (
            <div key={childIndex} className={`${CARD} p-4 ${hasWarning ? 'ring-2 ring-amber-400' : ''}`}>
              {/* Child header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: color }}>
                    {initials}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900">{child.first_name} {child.last_name}</p>
                    <p className="text-[11px] text-slate-400">
                      {child.grade && `Grade ${child.grade}`}
                      {child.grade && child.birth_date && ' · '}
                      {child.birth_date && `${new Date(child.birth_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-500">{programCount} selected</span>
              </div>

              {/* Program toggle chips */}
              <div className="flex flex-wrap gap-2">
                {selectedPrograms.map(sp => {
                  const isOn = assignedIds.includes(sp.programId)
                  const sportIcon = sp.program.sport?.icon || sp.program.icon || '🏆'
                  const sportColor = sp.program.sport?.color_primary || accentColor
                  const fee = calculateFeePerChild(sp.season)
                  return (
                    <button
                      key={sp.programId}
                      type="button"
                      onClick={() => toggleProgram(childIndex, sp.programId)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                        isOn
                          ? 'bg-white shadow-sm'
                          : 'border-slate-200 text-slate-400 bg-slate-50'
                      }`}
                      style={isOn ? { borderColor: sportColor, color: sportColor } : {}}
                    >
                      {isOn && <Check className="w-3.5 h-3.5" />}
                      <span>{sportIcon}</span>
                      <span>{sp.program.name}</span>
                      <span className="text-[10px] opacity-60">${fee.toFixed(0)}</span>
                    </button>
                  )
                })}
              </div>

              {/* Warning */}
              {hasWarning && (
                <div className="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <p className="text-xs text-amber-700">
                    {child.first_name} has no programs selected. Assign at least one or go back and remove this child.
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Bottom summary bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-50">
        <div className="max-w-2xl mx-auto px-4 py-3">
          {/* Per-child line items */}
          <div className="space-y-1 mb-2">
            {childSummaries.map(({ child, programCount, total }, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-slate-500">{child.first_name}: {programCount} program{programCount !== 1 ? 's' : ''}</span>
                <span className="font-semibold text-slate-700">${total.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-500">{totalRegistrations} registration{totalRegistrations !== 1 ? 's' : ''}</p>
              <p className="text-sm font-bold text-[#10284C]">Est. Total: ${grandTotal.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onBack}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-300 hover:bg-white flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" /> Children
              </button>
              <button
                type="button"
                disabled={!canContinue}
                onClick={onContinue}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                style={{ backgroundColor: canContinue ? accentColor : '#94a3b8' }}
              >
                Continue — Family Info
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Step 1: Program Catalog ──────────────────────────────────────────────
function ProgramCatalogStep({ availablePrograms, selectedPrograms, setSelectedPrograms, accentColor, onContinue }) {
  function toggleProgram(program, season) {
    setSelectedPrograms(prev => {
      const exists = prev.find(sp => sp.programId === program.id && sp.seasonId === season.id)
      if (exists) return prev.filter(sp => !(sp.programId === program.id && sp.seasonId === season.id))
      return [...prev, { programId: program.id, seasonId: season.id, program, season }]
    })
  }

  function handleMultiSeasonSelect(program, season) {
    setSelectedPrograms(prev => {
      // Remove any existing selection for this program
      const filtered = prev.filter(sp => sp.programId !== program.id)
      return [...filtered, { programId: program.id, seasonId: season.id, program, season }]
    })
  }

  function handleMultiSeasonDeselect(programId) {
    setSelectedPrograms(prev => prev.filter(sp => sp.programId !== programId))
  }

  const runningTotal = selectedPrograms.reduce((sum, sp) => sum + calculateFeePerChild(sp.season), 0)

  return (
    <div>
      <div className="px-4 pt-6 pb-2 max-w-2xl mx-auto">
        <h2 className="text-lg font-bold text-[#10284C]">Choose Programs</h2>
        <p className="text-sm text-slate-500 mt-1">Select the programs you'd like to register for. You can pick multiple!</p>
      </div>

      <div className="px-4 pb-36 max-w-2xl mx-auto space-y-3">
        {availablePrograms.length === 0 ? (
          <div className={`${CARD} p-8 text-center`}>
            <p className="text-slate-500 text-sm">No programs with open registration at this time.</p>
          </div>
        ) : (
          availablePrograms.map(program => (
            program.seasons.length === 1 ? (
              <ProgramCard
                key={program.id}
                program={program}
                season={program.seasons[0]}
                isSelected={selectedPrograms.some(sp => sp.programId === program.id)}
                onToggle={() => toggleProgram(program, program.seasons[0])}
                accentColor={accentColor}
              />
            ) : (
              <MultiSeasonProgramCard
                key={program.id}
                program={program}
                seasons={program.seasons}
                selectedSeasonId={selectedPrograms.find(sp => sp.programId === program.id)?.seasonId}
                onSelectSeason={(season) => handleMultiSeasonSelect(program, season)}
                onDeselect={() => handleMultiSeasonDeselect(program.id)}
                accentColor={accentColor}
              />
            )
          ))
        )}
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">
              {selectedPrograms.length === 0 ? 'No programs selected' :
               `${selectedPrograms.length} program${selectedPrograms.length > 1 ? 's' : ''} selected`}
            </p>
            {selectedPrograms.length > 0 && (
              <p className="text-sm font-bold text-[#10284C]">${runningTotal.toFixed(0)} per player</p>
            )}
          </div>
          <button
            type="button"
            disabled={selectedPrograms.length === 0}
            onClick={onContinue}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ backgroundColor: selectedPrograms.length > 0 ? accentColor : '#94a3b8' }}
          >
            Continue — Add Children
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Cart Page ───────────────────────────────────────────────────────
export function RegistrationCartPage() {
  const { orgIdOrSlug } = useParams()

  // ─── Query params: preview mode, template override, program pre-select ──
  const searchParams = new URLSearchParams(window.location.search)
  const isPreview = searchParams.get('preview') === 'true'
  const previewTemplateId = searchParams.get('template')
  const preSelectedProgramId = searchParams.get('program')

  // Step management
  const [currentStep, setCurrentStep] = useState(1)

  // Step 1: Program catalog
  const [availablePrograms, setAvailablePrograms] = useState([])
  const [selectedPrograms, setSelectedPrograms] = useState([])

  // Step 2: Children (populated in Phase 2)
  const [children, setChildren] = useState([])
  const [currentChild, setCurrentChild] = useState({})
  const [editingChildIndex, setEditingChildIndex] = useState(null)
  const [showAddChildForm, setShowAddChildForm] = useState(true)

  // Step 3: Per-child program assignments (populated in Phase 3)
  const [childProgramMap, setChildProgramMap] = useState({})

  // Step 4: Family info + waivers (populated in Phase 4)
  const [sharedInfo, setSharedInfo] = useState({})
  const [waiverState, setWaiverState] = useState({})
  const [customAnswers, setCustomAnswers] = useState({})
  const [signature, setSignature] = useState('')

  // Step 5: Review + submit (populated in Phase 5)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [registrationIds, setRegistrationIds] = useState([])
  const [savedInviteUrl, setSavedInviteUrl] = useState(null)
  const [existingAccountDetected, setExistingAccountDetected] = useState(false)

  // App state
  const [organization, setOrganization] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Merged registration config (built from selected programs' templates)
  const [mergedConfig, setMergedConfig] = useState(DEFAULT_CONFIG)

  // ─── Accent color ────────────────────────────────────────────────────
  const orgSettings = organization?.settings || {}
  const orgBranding = orgSettings.branding || {}
  const accentColor = orgBranding.primary_color || orgSettings.primary_color || '#4BB9EC'
  const orgLogo = organization?.logo_url || orgBranding.logo_url || orgSettings.logo_url || null
  const accentTextColor = getContrastText(accentColor)
  const bannerUrl = organization?.settings?.branding?.banner_url
    || organization?.settings?.banner_url
    || orgBranding.banner_url
    || organization?.banner_url
    || null
  const orgTagline = orgBranding.tagline || orgSettings.tagline || ''

  // ─── Load registration templates for selected programs ───────────────
  useEffect(() => {
    async function loadTemplates() {
      if (selectedPrograms.length === 0 || !organization) return
      const hasFields = (obj) => obj && typeof obj === 'object' && Object.keys(obj).length > 0

      for (const sp of selectedPrograms) {
        if (sp.season._resolvedConfig) continue // already loaded

        let raw = sp.season.registration_config
        let rawHasContent = raw && typeof raw === 'object' &&
          (hasFields(raw.player_fields) || hasFields(raw.parent_fields))

        // Tier 1: season's linked template
        if (!rawHasContent && sp.season.registration_template_id) {
          const { data: template } = await supabase
            .from('registration_templates')
            .select('player_fields, parent_fields, emergency_fields, medical_fields, waivers, custom_questions')
            .eq('id', sp.season.registration_template_id)
            .single()
          if (template) {
            raw = template
            rawHasContent = hasFields(raw.player_fields) || hasFields(raw.parent_fields)
          }
        }

        // Tier 2: org's default template
        if (!rawHasContent) {
          const { data: defaultTemplate } = await supabase
            .from('registration_templates')
            .select('player_fields, parent_fields, emergency_fields, medical_fields, waivers, custom_questions')
            .eq('organization_id', organization.id)
            .eq('is_default', true)
            .maybeSingle()
          if (defaultTemplate) {
            raw = defaultTemplate
            rawHasContent = hasFields(raw.player_fields) || hasFields(raw.parent_fields)
          }
        }

        // Tier 3: merge with DEFAULT_CONFIG
        sp.season._resolvedConfig = (raw && rawHasContent) ? {
          player_fields: hasFields(raw.player_fields) ? raw.player_fields : DEFAULT_CONFIG.player_fields,
          parent_fields: hasFields(raw.parent_fields) ? raw.parent_fields : DEFAULT_CONFIG.parent_fields,
          emergency_fields: hasFields(raw.emergency_fields) ? raw.emergency_fields : DEFAULT_CONFIG.emergency_fields,
          medical_fields: hasFields(raw.medical_fields) ? raw.medical_fields : DEFAULT_CONFIG.medical_fields,
          waivers: hasFields(raw.waivers) ? raw.waivers : DEFAULT_CONFIG.waivers,
          custom_questions: Array.isArray(raw.custom_questions) && raw.custom_questions.length > 0
            ? raw.custom_questions : DEFAULT_CONFIG.custom_questions,
        } : DEFAULT_CONFIG
      }

      setMergedConfig(mergeRegistrationConfigs(selectedPrograms))
    }
    loadTemplates()
  }, [selectedPrograms, organization])

  // ─── Compute cart total for success screen ────────────────────────────
  const cartTotal = (() => {
    let total = 0
    children.forEach((child, childIndex) => {
      const assignedIds = childProgramMap[childIndex] || []
      assignedIds.forEach(programId => {
        const sp = selectedPrograms.find(p => p.programId === programId)
        if (!sp) return
        const fees = previewFeesForPlayer({ ...child, parent_email: sharedInfo.parent1_email }, sp.season, childIndex)
        total += getFeeSummary(fees).total
      })
    })
    return total
  })()

  // ─── Submit — adapted from PublicRegistrationPage ────────────────────
  async function handleSubmit() {
    if (isPreview) {
      setSubmitted(true)
      return
    }
    setSubmitting(true)
    setError(null)

    const createdPlayerIds = []
    const createdRegistrationIds = []
    let familyId = null
    let familyIsNew = false

    try {
      // 1. Find or create family
      const parentEmail = sharedInfo.parent1_email?.trim().toLowerCase()
      if (parentEmail) {
        const { data: existingFamily } = await supabase
          .from('families').select('id').eq('primary_email', parentEmail).maybeSingle()

        if (existingFamily) {
          familyId = existingFamily.id
          await supabase.from('families').update({
            name: sharedInfo.parent1_name ? `${sharedInfo.parent1_name} Family` : null,
            primary_contact_name: sharedInfo.parent1_name || null,
            primary_contact_phone: sharedInfo.parent1_phone || null,
            primary_contact_email: parentEmail,
            secondary_contact_name: sharedInfo.parent2_name || null,
            secondary_contact_phone: sharedInfo.parent2_phone || null,
            secondary_contact_email: sharedInfo.parent2_email?.trim().toLowerCase() || null,
            address: sharedInfo.address || null,
            emergency_contact_name: sharedInfo.emergency_name || null,
            emergency_contact_phone: sharedInfo.emergency_phone || null,
            emergency_contact_relation: sharedInfo.emergency_relation || null,
            updated_at: new Date().toISOString(),
          }).eq('id', existingFamily.id)
        } else {
          const { data: newFamily, error: familyError } = await supabase
            .from('families').insert({
              name: sharedInfo.parent1_name ? `${sharedInfo.parent1_name} Family` : 'Family',
              primary_email: parentEmail,
              primary_phone: sharedInfo.parent1_phone || null,
              primary_contact_name: sharedInfo.parent1_name || null,
              primary_contact_phone: sharedInfo.parent1_phone || null,
              primary_contact_email: parentEmail,
              secondary_contact_name: sharedInfo.parent2_name || null,
              secondary_contact_phone: sharedInfo.parent2_phone || null,
              secondary_contact_email: sharedInfo.parent2_email?.trim().toLowerCase() || null,
              address: sharedInfo.address || null,
              emergency_contact_name: sharedInfo.emergency_name || null,
              emergency_contact_phone: sharedInfo.emergency_phone || null,
              emergency_contact_relation: sharedInfo.emergency_relation || null,
            }).select('id').single()
          if (!familyError && newFamily) { familyId = newFamily.id; familyIsNew = true }
        }
      }

      // 2a. Create parent invite for magic link (before the loop so invite_code is ready)
      let parentInviteUrl = null
      try {
        if (parentEmail && organization?.id) {
          const existingProfile = await checkExistingAccount(parentEmail)
          if (existingProfile) {
            setExistingAccountDetected(true)
          } else {
            // Will fill playerIds after they're created — metadata updated later
            const invite = await createInvitation({
              organizationId: organization.id,
              email: parentEmail,
              inviteType: 'parent',
              role: 'parent',
              invitedBy: null,
              metadata: { source: 'shopping_cart' },
              expiresInHours: 168, // 7 days for parent invites
            })
            parentInviteUrl = `${window.location.origin}/invite/parent/${invite.invite_code}`
            setSavedInviteUrl(parentInviteUrl)
          }
        }
      } catch (inviteErr) {
        console.error('Failed to create parent invite:', inviteErr)
      }

      // 2b. For each child × assigned program, create player + registration
      for (let childIndex = 0; childIndex < children.length; childIndex++) {
        const child = children[childIndex]
        const assignedProgramIds = childProgramMap[childIndex] || []

        for (const programId of assignedProgramIds) {
          const sp = selectedPrograms.find(p => p.programId === programId)
          if (!sp) continue

          // Check capacity
          let registrationStatus = 'new'
          if (sp.season.capacity) {
            const { count } = await supabase
              .from('registrations').select('id', { count: 'exact', head: true })
              .eq('season_id', sp.season.id).not('status', 'eq', 'denied')
            const spotsRemaining = sp.season.capacity - (count || 0)
            if (spotsRemaining <= 0) {
              if (!sp.season.waitlist_enabled) {
                throw new Error(`${sp.program.name} is full and not accepting waitlist entries.`)
              }
              registrationStatus = 'waitlisted'
            }
          }

          const gradeValue = child.grade ? (child.grade === 'K' ? 0 : parseInt(child.grade)) : null
          const medicalNotesParts = [
            sharedInfo.medical_conditions,
            sharedInfo.allergies ? `Allergies: ${sharedInfo.allergies}` : null,
            sharedInfo.medications ? `Medications: ${sharedInfo.medications}` : null,
          ].filter(Boolean)

          const waiverEntries = Object.entries(waiverState || {})
          const waiverLiability = waiverEntries.some(([k, v]) => v === true && (k.includes('liability') || k === 'waiver_liability'))
          const waiverPhoto = waiverEntries.some(([k, v]) => v === true && (k.includes('photo') || k === 'photo_release'))
          const waiverConduct = waiverEntries.some(([k, v]) => v === true && (k.includes('conduct') || k === 'code_of_conduct'))
          const waiverAnySigned = Object.values(waiverState || {}).some(v => v === true)

          const { data: player, error: playerError } = await supabase
            .from('players')
            .insert({
              first_name: child.first_name,
              last_name: child.last_name,
              birth_date: child.birth_date || null,
              grade: gradeValue,
              gender: child.gender || null,
              school: child.school || null,
              jersey_size: child.jersey_size || null,
              jersey_pref_1: child.preferred_number ? parseInt(child.preferred_number) : null,
              position: child.position_preference || null,
              experience_level: child.experience_level || null,
              experience_details: child.previous_teams || null,
              parent_name: sharedInfo.parent1_name || null,
              parent_email: parentEmail,
              parent_phone: sharedInfo.parent1_phone || null,
              parent_2_name: sharedInfo.parent2_name || null,
              parent_2_email: sharedInfo.parent2_email || null,
              parent_2_phone: sharedInfo.parent2_phone || null,
              parent2_name: sharedInfo.parent2_name || null,
              parent2_email: sharedInfo.parent2_email || null,
              parent2_phone: sharedInfo.parent2_phone || null,
              address: sharedInfo.address || null,
              city: sharedInfo.city || null,
              state: sharedInfo.state || null,
              zip: sharedInfo.zip || null,
              emergency_contact_name: sharedInfo.emergency_name || null,
              emergency_contact_phone: sharedInfo.emergency_phone || null,
              emergency_contact_relation: sharedInfo.emergency_relation || null,
              medical_conditions: sharedInfo.medical_conditions || null,
              allergies: sharedInfo.allergies || null,
              medications: sharedInfo.medications || null,
              medical_notes: medicalNotesParts.join('; ') || null,
              waiver_liability: waiverLiability,
              waiver_photo: waiverPhoto,
              waiver_conduct: waiverConduct,
              waiver_signed: waiverAnySigned,
              waiver_signed_by: signature?.trim() || null,
              waiver_signed_date: signature?.trim() ? new Date().toISOString() : null,
              family_id: familyId,
              status: registrationStatus,
              season_id: sp.season.id,
              registration_date: new Date().toISOString(),
              registration_source: 'shopping_cart',
              sport_id: sp.season.sport_id || null,
            })
            .select().single()

          if (playerError) {
            if (playerError.code === '23505') {
              throw new Error(`${child.first_name} ${child.last_name} may already be registered for ${sp.program.name}.`)
            }
            throw new Error(`Failed to register ${child.first_name} for ${sp.program.name}.`)
          }
          createdPlayerIds.push(player.id)

          // Upload player photo to Supabase Storage if one was selected during registration
          if (child._photoFile && player?.id) {
            try {
              const ext = child._photoFile.name?.split('.').pop() || 'jpg'
              const path = `player-photos/${player.id}_${Date.now()}.${ext}`
              const { error: uploadErr } = await supabase.storage.from('media').upload(path, child._photoFile)
              if (!uploadErr) {
                const { data: urlData } = supabase.storage.from('media').getPublicUrl(path)
                if (urlData?.publicUrl) {
                  await supabase.from('players').update({ photo_url: urlData.publicUrl }).eq('id', player.id)
                }
              } else {
                console.warn('Photo upload failed (non-blocking):', uploadErr.message)
              }
            } catch (photoErr) {
              console.warn('Photo upload error (non-blocking):', photoErr)
            }
          }

          // Check for existing registration before inserting
          const { data: existingReg } = await supabase
            .from('registrations')
            .select('id')
            .eq('player_id', player.id)
            .eq('season_id', sp.season.id)
            .maybeSingle()

          if (existingReg) {
            console.warn('Duplicate registration skipped for', child.first_name, 'in', sp.program.name)
            continue
          }

          const signatureDate = new Date().toISOString()
          const { data: registration, error: regError } = await supabase
            .from('registrations')
            .insert({
              player_id: player.id,
              season_id: sp.season.id,
              family_id: familyId,
              status: registrationStatus,
              submitted_at: signatureDate,
              waivers_accepted: waiverState,
              custom_answers: customAnswers,
              signature_name: signature.trim() || null,
              signature_date: signatureDate,
              registration_source: 'shopping_cart',
              registration_data: {
                player: child,
                shared: sharedInfo,
                waivers: waiverState,
                custom_questions: customAnswers,
                signature: { name: signature.trim(), date: signatureDate },
                program: { id: sp.programId, name: sp.program.name },
                cart_context: { totalChildren: children.length, totalPrograms: selectedPrograms.length },
              },
            })
            .select().single()

          if (regError) {
            if (regError.code === '23505') {
              console.warn('Duplicate registration skipped:', regError)
              continue
            }
            throw regError
          }
          createdRegistrationIds.push(registration.id)

          // PAY_FIRST: generate fees immediately so parent can pay before approval
          try {
            if (sp.season?.approval_mode === 'pay_first') {
              const { generateFeesForPlayer } = await import('../../lib/fee-calculator')
              const { data: freshPlayer } = await supabase
                .from('players')
                .select('*')
                .eq('id', player.id)
                .single()
              if (freshPlayer) {
                await generateFeesForPlayer(supabase, freshPlayer, sp.season, null)
              }
            }
          } catch (feeErr) {
            console.warn('Pay-first fee generation failed (non-blocking):', feeErr?.message)
          }

          // Confirmation email with optional magic link (fire and forget)
          try {
            await EmailService.sendRegistrationConfirmation({
              recipientEmail: parentEmail,
              recipientName: sharedInfo.parent1_name || parentEmail,
              playerName: `${child.first_name} ${child.last_name}`,
              seasonName: sp.season.name,
              organizationId: organization?.id,
              organizationName: organization?.name || '',
              inviteUrl: parentInviteUrl,
            })
          } catch (emailErr) {
            console.error('Email send failed:', emailErr)
          }

          // Funnel event (fire and forget)
          supabase.from('registration_funnel_events').insert({
            event_type: 'form_submitted',
            season_id: sp.season.id,
            organization_id: organization?.id,
            metadata: { source: 'shopping_cart', program: sp.program.name },
          }).catch(() => {})
        }
      }

      // BATON PASS: Notify admin that new registration(s) were submitted
      try {
        const playerNames = children.map(c => `${c.first_name} ${c.last_name}`).join(', ')
        const programNames = selectedPrograms.map(sp => sp.program?.name).filter(Boolean).join(', ')
        await supabase.from('admin_notifications').insert({
          organization_id: organization?.id,
          type: 'registration_new',
          title: 'New Registration',
          message: `${playerNames} registered for ${programNames || 'programs'} by ${sharedInfo.parent1_name || parentEmail}.`,
          is_read: false,
          metadata: {
            parent_email: parentEmail,
            parent_name: sharedInfo.parent1_name,
            player_names: children.map(c => `${c.first_name} ${c.last_name}`),
            program_names: selectedPrograms.map(sp => sp.program?.name).filter(Boolean),
            player_count: children.length,
            source: 'shopping_cart',
          }
        })
      } catch (err) {
        console.error('Baton pass failed (registration→admin):', err?.message, err?.details, err?.hint)
      }

      // BATON PASS: Email admin about new registration
      try {
        const playerNames = children.map(c => `${c.first_name} ${c.last_name}`).join(', ')
        const programNames = selectedPrograms.map(sp => sp.program?.name).filter(Boolean).join(', ')
        const adminEmail = organization?.contact_email || organization?.settings?.contact_email
        if (adminEmail) {
          await supabase.from('email_notifications').insert({
            organization_id: organization?.id,
            recipient_email: adminEmail,
            recipient_name: organization?.name || 'Admin',
            type: 'blast_announcement',
            template_type: 'blast_announcement',
            subject: `New Registration: ${playerNames} for ${programNames || 'programs'}`,
            data: {
              heading: 'New Registration Received',
              body: `<p><strong>${playerNames}</strong> has been registered for <strong>${programNames || 'programs'}</strong> by ${sharedInfo.parent1_name || parentEmail}.</p><p>Log in to review and approve the registration.</p>`,
              html_body: `<p><strong>${playerNames}</strong> has been registered for <strong>${programNames || 'programs'}</strong> by ${sharedInfo.parent1_name || parentEmail}.</p><p>Log in to review and approve the registration.</p>`,
              org_name: organization?.name,
              app_url: window.location.origin,
            },
            status: 'pending',
            category: 'transactional',
            created_at: new Date().toISOString(),
          })
        }
      } catch (err) {
        console.error('Baton pass failed (registration→admin email):', err?.message, err?.details, err?.hint)
      }

      setRegistrationIds(createdRegistrationIds)
      setSubmitted(true)
    } catch (err) {
      console.error('Cart submission error:', err)
      // Rollback
      if (createdRegistrationIds.length > 0) {
        await supabase.from('registrations').delete().in('id', createdRegistrationIds)
      }
      if (createdPlayerIds.length > 0) {
        await supabase.from('players').delete().in('id', createdPlayerIds)
      }
      if (familyId && familyIsNew) {
        await supabase.from('families').delete().eq('id', familyId)
      }
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Load org + programs with open registration ──────────────────────
  useEffect(() => {
    async function loadData() {
      try {
        // 1. Load organization
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgIdOrSlug)
        let orgQuery = supabase.from('organizations').select('*')
        orgQuery = isUUID ? orgQuery.eq('id', orgIdOrSlug) : orgQuery.eq('slug', orgIdOrSlug)
        const { data: orgData } = await orgQuery.single()

        if (!orgData) { setError('Organization not found'); setLoading(false); return }
        setOrganization(orgData)

        // 2. Load programs with sport info
        const { data: programs } = await supabase
          .from('programs')
          .select('*, sport:sports(id, name, icon, color_primary)')
          .eq('organization_id', orgData.id)
          .eq('is_active', true)
          .order('display_order', { ascending: true })

        // 3. Load seasons with open registration (include 'upcoming' so newly created seasons appear)
        const { data: seasons } = await supabase
          .from('seasons')
          .select('*, sports(name, icon), programs(id, name, icon)')
          .eq('organization_id', orgData.id)
          .in('status', ['active', 'upcoming'])
          .order('start_date', { ascending: false })

        // 4. Filter to seasons within registration window
        const today = new Date().toISOString().split('T')[0]
        const openSeasons = (seasons || []).filter(s => {
          if (s.registration_opens && today < s.registration_opens) return false
          if (s.registration_closes && today > s.registration_closes) return false
          return true
        })

        // 5. Group seasons by program
        const programsWithSeasons = (programs || []).map(program => {
          const programSeasons = openSeasons.filter(s => s.program_id === program.id)
          return { ...program, seasons: programSeasons }
        }).filter(p => p.seasons.length > 0)

        // 6. Also include orphan seasons (not linked to a program) as standalone entries
        const linkedSeasonIds = new Set(programsWithSeasons.flatMap(p => p.seasons.map(s => s.id)))
        const orphanSeasons = openSeasons.filter(s => !linkedSeasonIds.has(s.id))
        const orphanPrograms = orphanSeasons.map(s => ({
          id: `orphan_${s.id}`,
          name: s.name,
          icon: s.sports?.icon || s.programs?.icon || '🏆',
          sport: s.sports ? { id: null, name: s.sports.name, icon: s.sports.icon } : null,
          seasons: [s],
          _isOrphan: true,
        }))

        const allPrograms = [...programsWithSeasons, ...orphanPrograms]

        // 7. Load capacity info for each season
        for (const program of allPrograms) {
          for (const season of program.seasons) {
            if (season.capacity) {
              const { count } = await supabase
                .from('registrations')
                .select('id', { count: 'exact', head: true })
                .eq('season_id', season.id)
                .not('status', 'eq', 'denied')
              season._spotsRemaining = season.capacity - (count || 0)
              season._isFull = season._spotsRemaining <= 0
            }
          }
        }

        setAvailablePrograms(allPrograms)

        // ─── Template preview: create a synthetic "Preview" program ─────
        if (isPreview && previewTemplateId) {
          const { data: tmpl } = await supabase
            .from('registration_templates')
            .select('*, sports(id, name, icon)')
            .eq('id', previewTemplateId)
            .single()

          if (tmpl) {
            const mockSeason = {
              id: 'preview-template',
              name: `${tmpl.name} (Preview)`,
              organization_id: orgData.id,
              sport_id: tmpl.sport_id || null,
              sports: tmpl.sports || null,
              registration_config: null,
              registration_template_id: tmpl.id,
              registration_fee: 0,
              early_bird_fee: null,
              sibling_discount: null,
              capacity: null,
              start_date: null,
              end_date: null,
              registration_opens: null,
              registration_closes: null,
              status: 'active',
              _resolvedConfig: {
                player_fields: tmpl.player_fields || DEFAULT_CONFIG.player_fields,
                parent_fields: tmpl.parent_fields || DEFAULT_CONFIG.parent_fields,
                emergency_fields: tmpl.emergency_fields || DEFAULT_CONFIG.emergency_fields,
                medical_fields: tmpl.medical_fields || DEFAULT_CONFIG.medical_fields,
                waivers: tmpl.waivers || DEFAULT_CONFIG.waivers,
                custom_questions: tmpl.custom_questions || DEFAULT_CONFIG.custom_questions,
              },
            }
            const previewProgram = {
              id: `preview_${tmpl.id}`,
              name: tmpl.name,
              icon: tmpl.sports?.icon || '📋',
              sport: tmpl.sports ? { id: tmpl.sports.id, name: tmpl.sports.name, icon: tmpl.sports.icon } : null,
              seasons: [mockSeason],
            }
            // Replace the catalog with just this preview program and auto-select it
            setAvailablePrograms([previewProgram])
            setSelectedPrograms([{ programId: previewProgram.id, seasonId: mockSeason.id, program: previewProgram, season: mockSeason }])
            setMergedConfig(mockSeason._resolvedConfig)
          }
        }

        // ─── Pre-select program from ?program= query param ──────────────
        if (preSelectedProgramId && !isPreview) {
          const match = allPrograms.find(p => p.id === preSelectedProgramId)
          if (match && match.seasons.length > 0) {
            const season = match.seasons[0]
            setSelectedPrograms([{ programId: match.id, seasonId: season.id, program: match, season }])
          }
        }
      } catch (err) {
        console.error('Failed to load registration data:', err)
        setError('Failed to load registration data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    if (orgIdOrSlug) loadData()
  }, [orgIdOrSlug])

  // ─── Loading / Error screens ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto" />
          <p className="text-sm text-slate-500 mt-3">Loading registration...</p>
        </div>
      </div>
    )
  }

  if (error && !organization) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center p-6">
        <div className={`${CARD} p-8 max-w-md text-center`}>
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">Unable to Load</h2>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <>
        {isPreview && (
          <div className="bg-amber-500 text-white text-center py-2 font-bold text-sm">
            PREVIEW MODE — No data was submitted
          </div>
        )}
        <CartSuccessScreen
          children={children}
          childProgramMap={childProgramMap}
          selectedPrograms={selectedPrograms}
          registrationIds={registrationIds}
          organization={organization}
          totalFee={cartTotal}
          inviteUrl={savedInviteUrl}
          existingAccountDetected={existingAccountDetected}
        />
      </>
    )
  }

  // ─── Render ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      {/* Preview mode banner */}
      {isPreview && (
        <div className="bg-amber-500 text-white text-center py-2 font-bold text-sm sticky top-0 z-50">
          PREVIEW MODE — This form will NOT submit real data
        </div>
      )}

      {/* Branded hero header — banner + logo + org name */}
      <div className="relative overflow-hidden" style={{ backgroundColor: accentColor, color: accentTextColor }}>
        {bannerUrl && (
          <img
            src={bannerUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none' }}
          />
        )}
        {bannerUrl && (
          <div className="absolute inset-0" style={{ backgroundColor: accentColor + 'd9' }} />
        )}
        <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 md:py-12 text-center">
          <div className="flex justify-center mb-3">
            <div className="hidden md:block">
              <OrgLogo
                org={{ logo_url: orgLogo, name: organization?.name, primary_color: accentColor }}
                size={140}
                className="drop-shadow-lg"
              />
            </div>
            <div className="md:hidden">
              <OrgLogo
                org={{ logo_url: orgLogo, name: organization?.name, primary_color: accentColor }}
                size={110}
                className="drop-shadow-lg"
              />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight" style={{ color: accentTextColor, fontFamily: 'var(--v2-font)' }}>
            {organization?.name || 'Registration'}
          </h1>
          {orgTagline && (
            <p className="text-xs md:text-sm mt-1" style={{ color: `${accentTextColor}b3` }}>{orgTagline}</p>
          )}
        </div>
      </div>

      {/* Sticky step progress */}
      <div className={`sticky ${isPreview ? 'top-[36px]' : 'top-0'} z-40 border-b border-slate-200`} style={{ backgroundColor: accentColor }}>
        <div className="max-w-2xl mx-auto px-4 py-2">
          <StepProgress currentStep={currentStep} />
        </div>
      </div>

      {/* Step content */}
      {currentStep === 1 && (
        <ProgramCatalogStep
          availablePrograms={availablePrograms}
          selectedPrograms={selectedPrograms}
          setSelectedPrograms={setSelectedPrograms}
          accentColor={accentColor}
          onContinue={() => setCurrentStep(2)}
        />
      )}

      {currentStep === 2 && (
        <AddChildrenStep
          children={children}
          setChildren={setChildren}
          currentChild={currentChild}
          setCurrentChild={setCurrentChild}
          editingChildIndex={editingChildIndex}
          setEditingChildIndex={setEditingChildIndex}
          showAddChildForm={showAddChildForm}
          setShowAddChildForm={setShowAddChildForm}
          mergedConfig={mergedConfig}
          selectedPrograms={selectedPrograms}
          accentColor={accentColor}
          onContinue={() => setCurrentStep(3)}
          onBack={() => setCurrentStep(1)}
          error={error}
          setError={setError}
        />
      )}

      {currentStep === 3 && (
        <AssignProgramsStep
          children={children}
          selectedPrograms={selectedPrograms}
          childProgramMap={childProgramMap}
          setChildProgramMap={setChildProgramMap}
          sharedInfo={sharedInfo}
          accentColor={accentColor}
          onContinue={() => setCurrentStep(4)}
          onBack={() => setCurrentStep(2)}
        />
      )}

      {currentStep === 4 && (
        <FamilyInfoStep
          mergedConfig={mergedConfig}
          sharedInfo={sharedInfo}
          setSharedInfo={setSharedInfo}
          waiverState={waiverState}
          setWaiverState={setWaiverState}
          customAnswers={customAnswers}
          setCustomAnswers={setCustomAnswers}
          signature={signature}
          setSignature={setSignature}
          selectedPrograms={selectedPrograms}
          childProgramMap={childProgramMap}
          children={children}
          organization={organization}
          accentColor={accentColor}
          onContinue={() => setCurrentStep(5)}
          onBack={() => setCurrentStep(3)}
        />
      )}

      {currentStep === 5 && (
        <ReviewSubmitStep
          children={children}
          childProgramMap={childProgramMap}
          selectedPrograms={selectedPrograms}
          sharedInfo={sharedInfo}
          waiverState={waiverState}
          customAnswers={customAnswers}
          signature={signature}
          organization={organization}
          accentColor={accentColor}
          onBack={() => setCurrentStep(4)}
          onSubmit={handleSubmit}
          submitting={submitting}
          error={error}
        />
      )}
    </div>
  )
}

export default RegistrationCartPage
