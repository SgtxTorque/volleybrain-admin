// =============================================================================
// ParentJourneyCard — Season onboarding step tracker for parents
// Checks REAL database state for each step's completion
// =============================================================================

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { ChevronRight, Check, PartyPopper } from 'lucide-react'

const STEPS = [
  { id: 'register', label: 'Register', nav: 'registrations', num: 1 },
  { id: 'waivers', label: 'Sign Waivers', nav: 'waivers', num: 2 },
  { id: 'payment', label: 'Payment', nav: 'payments', num: 3 },
  { id: 'emergency', label: 'Emergency Info', nav: 'my-stuff', num: 4 },
  { id: 'rsvp', label: 'RSVP', nav: 'schedule', num: 5 },
  { id: 'chat', label: 'Join Chat', nav: 'chats', num: 6 },
  { id: 'schedule', label: 'Review Schedule', nav: 'schedule', num: 7 },
]

export default function ParentJourneyCard({ onNavigate, registrationData }) {
  const { user, profile } = useAuth()
  const { selectedSeason } = useSeason()
  const { isDark } = useTheme()
  const [stepStatus, setStepStatus] = useState({})
  const [loading, setLoading] = useState(true)

  const playerIds = useMemo(
    () => (registrationData || []).map(c => c.id).filter(Boolean),
    [registrationData]
  )

  const seasonId = selectedSeason?.id
  const organizationId = registrationData?.[0]?.season?.organizations?.id ||
    registrationData?.[0]?.season?.organization_id

  useEffect(() => {
    if (!user?.id || !playerIds.length) {
      setLoading(false)
      return
    }
    checkAllSteps()
  }, [user?.id, playerIds.join(','), seasonId, organizationId])

  async function checkAllSteps() {
    setLoading(true)
    const status = {}

    try {
      // Step 1: Registration — check if any child is registered for the season
      status.register = playerIds.length > 0

      // Step 2: Waivers — check waiver_signatures for all children
      if (organizationId) {
        try {
          const { data: waivers } = await supabase
            .from('waivers')
            .select('id')
            .eq('organization_id', organizationId)
            .eq('is_active', true)
            .eq('is_required', true)

          if (waivers?.length) {
            const waiverIds = waivers.map(w => w.id)
            const { data: sigs } = await supabase
              .from('waiver_signatures')
              .select('waiver_id, player_id')
              .in('waiver_id', waiverIds)
              .in('player_id', playerIds)

            const signedSet = new Set((sigs || []).map(s => `${s.waiver_id}:${s.player_id}`))
            const allSigned = waiverIds.every(wId =>
              playerIds.every(pId => signedSet.has(`${wId}:${pId}`))
            )
            status.waivers = allSigned
          } else {
            status.waivers = true // No required waivers
          }
        } catch (err) {
          console.warn('ParentJourney: waivers check failed:', err.message)
          status.waivers = false
        }
      } else {
        status.waivers = true
      }

      // Step 3: Payment — check if all invoices are paid
      try {
        const { data: unpaid } = await supabase
          .from('payments')
          .select('id')
          .in('player_id', playerIds)
          .eq('paid', false)
          .limit(1)

        status.payment = !unpaid?.length
      } catch (err) {
        console.warn('ParentJourney: payment check failed:', err.message)
        status.payment = false
      }

      // Step 4: Emergency contact info — check profiles table
      try {
        const { data: prof } = await supabase
          .from('profiles')
          .select('emergency_contact_name, emergency_contact_phone')
          .eq('id', user.id)
          .single()

        status.emergency = !!(prof?.emergency_contact_name && prof?.emergency_contact_phone)
      } catch (err) {
        console.warn('ParentJourney: emergency check failed:', err.message)
        status.emergency = false
      }

      // Step 5: RSVP — check if parent has RSVP'd to at least one event
      try {
        const { data: rsvps } = await supabase
          .from('event_rsvps')
          .select('id')
          .eq('responded_by', user.id)
          .limit(1)

        status.rsvp = (rsvps?.length || 0) > 0
      } catch (err) {
        console.warn('ParentJourney: rsvp check failed:', err.message)
        status.rsvp = false
      }

      // Step 6: Join Chat — check if parent sent at least one message
      try {
        const { data: msgs } = await supabase
          .from('chat_messages')
          .select('id')
          .eq('sender_id', user.id)
          .limit(1)

        status.chat = (msgs?.length || 0) > 0
      } catch (err) {
        console.warn('ParentJourney: chat check failed:', err.message)
        status.chat = false
      }

      // Step 7: Review Schedule — implied if other steps are done
      const othersDone = status.register && status.waivers && status.payment &&
        status.emergency && status.rsvp && status.chat
      status.schedule = othersDone
    } catch (err) {
      console.warn('ParentJourney: overall check failed:', err.message)
    }

    setStepStatus(status)
    setLoading(false)
  }

  const completedCount = STEPS.filter(s => stepStatus[s.id]).length
  const allDone = completedCount === STEPS.length

  // Find first incomplete step
  const nextStep = STEPS.find(s => !stepStatus[s.id])

  // Don't render if all done (progressive disclosure)
  if (allDone && !loading) return null
  if (loading) return null

  const cardBg = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-slate-200'

  return (
    <div className={`${cardBg} rounded-2xl shadow-sm p-5`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`text-r-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Season Onboarding
          </h3>
          <p className={`text-r-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {completedCount}/{STEPS.length} complete
          </p>
        </div>
        {nextStep && (
          <button
            onClick={() => onNavigate?.(nextStep.nav)}
            className="flex items-center gap-1 text-r-sm font-semibold text-lynx-sky hover:brightness-110 transition"
          >
            Next: {nextStep.label} <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Step tracker */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, idx) => {
          const isCompleted = stepStatus[step.id]
          const isCurrent = !isCompleted && step.id === nextStep?.id
          const isUpcoming = !isCompleted && !isCurrent

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => onNavigate?.(step.nav)}
                className="flex flex-col items-center gap-1.5 group/step"
                title={step.label}
              >
                <div className={`
                  w-8 h-8 rounded-full border-2 flex items-center justify-center text-r-xs font-bold
                  transition-all cursor-pointer
                  ${isCompleted
                    ? 'bg-green-500/15 border-green-500 text-green-500'
                    : isCurrent
                      ? 'bg-lynx-sky border-lynx-sky text-white animate-pulse'
                      : 'border-slate-300 text-slate-400'
                  }
                  ${isUpcoming ? '' : 'group-hover/step:brightness-110'}
                `}>
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.num}
                </div>
                <span className={`text-[10px] font-medium whitespace-nowrap ${
                  isCompleted || isCurrent
                    ? (isDark ? 'text-slate-300' : 'text-slate-600')
                    : (isDark ? 'text-slate-600' : 'text-slate-400')
                }`}>
                  {step.label}
                </span>
              </button>

              {/* Connecting line */}
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-[2px] mx-1 mt-[-18px] ${
                  isCompleted ? 'bg-green-500' : (isDark ? 'bg-white/[0.08]' : 'bg-slate-200')
                }`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
