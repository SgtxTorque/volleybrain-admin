import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'

// ============================================
// PARENT TUTORIAL CONFIGURATION
// ============================================

export const PARENT_TUTORIAL_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to VolleyBrain! 🎉',
    description: 'Let\'s get you set up so you can stay connected with your child\'s team. This quick tour will show you everything you need.',
    target: null, // No target, just a welcome modal
    page: null,
    action: 'next',
  },
  {
    id: 'view_dashboard',
    title: 'Your Dashboard',
    description: 'This is your home base! You\'ll see upcoming events, your child\'s info, and quick actions all in one place.',
    target: '[data-tutorial="dashboard-header"]',
    page: 'dashboard',
    position: 'bottom',
    action: 'next',
  },
  {
    id: 'find_player_card',
    title: 'Your Child\'s Player Card',
    description: 'Tap here to see your child\'s player card with their photo, stats, and achievements. You can also update their info here.',
    target: '[data-tutorial="player-card"]',
    page: 'dashboard',
    position: 'bottom',
    action: 'click',
    completeStep: 'view_player_card',
  },
  {
    id: 'check_payments',
    title: 'Payment Status',
    description: 'See what you owe and make payments here. We\'ll show you if anything is due or overdue.',
    target: '[data-tutorial="payments-section"]',
    page: 'dashboard',
    position: 'left',
    action: 'next',
  },
  {
    id: 'view_schedule',
    title: 'Team Schedule',
    description: 'Find all practices and games here. Tap any event to see details and RSVP.',
    target: '[data-tutorial="schedule-section"]',
    page: 'dashboard',
    position: 'right',
    action: 'next',
    completeStep: 'view_schedule',
  },
  {
    id: 'rsvp_event',
    title: 'RSVP to Events',
    description: 'Help your coach plan by RSVPing to events. Tap "Going" or "Not Going" on any upcoming event.',
    target: '[data-tutorial="rsvp-buttons"]',
    page: 'schedule',
    position: 'bottom',
    action: 'click',
    completeStep: 'first_rsvp',
  },
  {
    id: 'team_chat',
    title: 'Team Chat',
    description: 'Stay connected with coaches and other parents. Ask questions, share updates, and celebrate wins together!',
    target: '[data-tutorial="team-chat"]',
    page: 'dashboard',
    position: 'left',
    action: 'next',
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🏐',
    description: 'You now know the basics. Keep exploring to discover more features like stats, achievements, and volunteering!',
    target: null,
    page: null,
    action: 'finish',
  },
]

// Parent checklist items (shown on dashboard)
export const PARENT_CHECKLIST = [
  { 
    id: 'complete_registration', 
    title: 'Complete Registration', 
    description: 'Finish all required registration fields',
    icon: '📝',
    checkFn: (data) => data.registration?.status === 'approved' || data.registration?.status === 'rostered',
  },
  { 
    id: 'sign_waivers', 
    title: 'Sign Waivers', 
    description: 'Sign all required liability waivers',
    icon: '✍️',
    checkFn: (data) => data.waiversSigned >= data.waiversRequired,
    navTo: 'waivers',
  },
  { 
    id: 'make_payment', 
    title: 'Pay Registration Fee', 
    description: 'Complete your registration payment',
    icon: '💳',
    checkFn: (data) => data.paymentComplete || data.amountPaid >= data.amountDue,
    navTo: 'payments',
  },
  { 
    id: 'add_player_photo', 
    title: 'Add Player Photo', 
    description: 'Upload a photo for the player card',
    icon: '📷',
    checkFn: (data) => !!data.player?.photo_url,
    navTo: 'player-profile',
  },
  { 
    id: 'view_schedule', 
    title: 'Check Team Schedule', 
    description: 'View upcoming practices and games',
    icon: '📅',
    checkFn: (data) => data.hasViewedSchedule,
    navTo: 'schedule',
  },
  { 
    id: 'first_rsvp', 
    title: 'RSVP to an Event', 
    description: 'Let the coach know if you\'re attending',
    icon: '✅',
    checkFn: (data) => data.hasRsvpd,
    navTo: 'schedule',
  },
]

// ============================================
// CONTEXT
// ============================================

const ParentTutorialContext = createContext(null)

export function useParentTutorial() {
  return useContext(ParentTutorialContext)
}

export function ParentTutorialProvider({ children }) {
  const { user, profile } = useAuth()
  const [tutorialState, setTutorialState] = useState({
    isActive: false,
    currentStepIndex: 0,
    completedSteps: [],
    skipped: false,
    checklistData: {},
  })
  const [loading, setLoading] = useState(true)

  // Load tutorial state from profile
  useEffect(() => {
    if (profile?.id) {
      loadTutorialState()
    }
  }, [profile?.id])

  async function loadTutorialState() {
    try {
      const tutorialData = profile?.parent_tutorial_data || {}
      const completedSteps = tutorialData.completed_steps || []
      const skipped = tutorialData.skipped || false
      const hasSeenTutorial = tutorialData.has_seen_tutorial || false

      setTutorialState(prev => ({
        ...prev,
        completedSteps,
        skipped,
        // Auto-start tutorial for new parents who haven't seen it
        isActive: !hasSeenTutorial && !skipped && completedSteps.length === 0,
        currentStepIndex: 0,
      }))
    } catch (err) {
      console.error('Error loading tutorial state:', err)
    }
    setLoading(false)
  }

  // Load checklist data (registration status, payments, etc.)
  async function loadChecklistData(playerId) {
    if (!playerId) return

    try {
      // Get registration
      const { data: reg } = await supabase
        .from('registrations')
        .select('*, players(*)')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      // Get waiver signatures
      const { data: signatures } = await supabase
        .from('waiver_signatures')
        .select('id')
        .eq('player_id', playerId)

      // Get required waivers count
      const { count: requiredWaivers } = await supabase
        .from('waivers')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', profile?.organization_id)
        .eq('is_active', true)

      // Get payments
      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('player_id', playerId)
        .eq('status', 'completed')

      // Get RSVPs
      const { data: rsvps } = await supabase
        .from('event_rsvps')
        .select('id')
        .eq('player_id', playerId)
        .limit(1)

      const amountPaid = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
      const amountDue = reg?.amount_due || reg?.season?.registration_fee || 0

      setTutorialState(prev => ({
        ...prev,
        checklistData: {
          registration: reg,
          player: reg?.players,
          waiversSigned: signatures?.length || 0,
          waiversRequired: requiredWaivers || 0,
          amountPaid,
          amountDue,
          paymentComplete: amountPaid >= amountDue,
          hasRsvpd: (rsvps?.length || 0) > 0,
          hasViewedSchedule: prev.completedSteps?.includes('view_schedule'),
        },
      }))
    } catch (err) {
      console.error('Error loading checklist data:', err)
    }
  }

  // Start the tutorial
  function startTutorial() {
    setTutorialState(prev => ({
      ...prev,
      isActive: true,
      currentStepIndex: 0,
    }))
  }

  // Go to next step
  function nextStep() {
    setTutorialState(prev => {
      const nextIndex = prev.currentStepIndex + 1
      if (nextIndex >= PARENT_TUTORIAL_STEPS.length) {
        // Tutorial complete
        saveTutorialProgress([...prev.completedSteps], true)
        return { ...prev, isActive: false, currentStepIndex: 0 }
      }
      return { ...prev, currentStepIndex: nextIndex }
    })
  }

  // Go to previous step
  function prevStep() {
    setTutorialState(prev => ({
      ...prev,
      currentStepIndex: Math.max(0, prev.currentStepIndex - 1),
    }))
  }

  // Skip tutorial
  function skipTutorial() {
    setTutorialState(prev => ({
      ...prev,
      isActive: false,
      skipped: true,
    }))
    saveTutorialProgress([], false, true)
  }

  // Complete a step (can be called from actions)
  function completeStep(stepId) {
    setTutorialState(prev => {
      if (prev.completedSteps.includes(stepId)) return prev
      const newCompleted = [...prev.completedSteps, stepId]
      saveTutorialProgress(newCompleted, false)
      return { ...prev, completedSteps: newCompleted }
    })
  }

  // Save progress to database
  async function saveTutorialProgress(completedSteps, hasSeenTutorial = false, skipped = false) {
    if (!user?.id) return

    try {
      await supabase.from('profiles').update({
        parent_tutorial_data: {
          ...profile?.parent_tutorial_data,
          completed_steps: completedSteps,
          has_seen_tutorial: hasSeenTutorial || profile?.parent_tutorial_data?.has_seen_tutorial,
          skipped: skipped || profile?.parent_tutorial_data?.skipped,
          last_updated: new Date().toISOString(),
        }
      }).eq('id', user.id)
    } catch (err) {
      console.error('Error saving tutorial progress:', err)
    }
  }

  // Get current step
  const currentStep = PARENT_TUTORIAL_STEPS[tutorialState.currentStepIndex]
  const progress = (tutorialState.currentStepIndex / PARENT_TUTORIAL_STEPS.length) * 100

  // Calculate checklist completion
  const checklistItems = PARENT_CHECKLIST.map(item => ({
    ...item,
    completed: item.checkFn(tutorialState.checklistData),
  }))
  const checklistProgress = (checklistItems.filter(i => i.completed).length / checklistItems.length) * 100

  return (
    <ParentTutorialContext.Provider value={{
      // Tutorial state
      isActive: tutorialState.isActive,
      currentStep,
      currentStepIndex: tutorialState.currentStepIndex,
      totalSteps: PARENT_TUTORIAL_STEPS.length,
      progress,
      completedSteps: tutorialState.completedSteps,
      loading,

      // Tutorial actions
      startTutorial,
      nextStep,
      prevStep,
      skipTutorial,
      completeStep,

      // Checklist
      checklistItems,
      checklistProgress,
      checklistData: tutorialState.checklistData,
      loadChecklistData,
    }}>
      {children}
    </ParentTutorialContext.Provider>
  )
}
