import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'

// ============================================
// PARENT TUTORIAL CONFIGURATION
// ============================================

export const PARENT_TUTORIAL_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Lynx! 🎉',
    description: 'Let\'s get you set up so you can stay connected with your child\'s team. This quick tour will show you everything you need.',
    icon: null,
  },
  {
    id: 'view_dashboard',
    title: 'Your Dashboard',
    description: 'This is your home base! You\'ll see upcoming events, your child\'s info, and quick actions all in one place.',
    icon: '🏠',
  },
  {
    id: 'find_player_card',
    title: 'Your Child\'s Player Card',
    description: 'Find your child\'s player card showing their photo, jersey number, team info, and achievements. Tap it to see more details or update their info.',
    icon: '🪪',
  },
  {
    id: 'check_payments',
    title: 'Payment Status',
    description: 'Check the top bar to see your balance due. Tap it to make payments or view payment history.',
    icon: '💳',
  },
  {
    id: 'view_schedule',
    title: 'Team Schedule',
    description: 'Find all practices and games on the Schedule page. Tap any event to see details and RSVP to let the coach know you\'re attending.',
    icon: '📅',
  },
  {
    id: 'team_hub',
    title: 'Team Hub & Chat',
    description: 'Stay connected with coaches and other parents through the Team Hub. Get updates, chat with the team, and never miss important announcements.',
    icon: '💬',
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🏐',
    description: 'You now know the basics. Keep exploring to discover more features like stats, achievements, and volunteering!',
    icon: null,
  },
]

// Parent checklist items (shown on dashboard)
// navTo values must match page IDs in MainApp.jsx routing
export const PARENT_CHECKLIST = [
  { 
    id: 'complete_registration', 
    title: 'Complete Registration', 
    description: 'Your player is registered and on a team',
    icon: '📝',
    checkFn: (data) => data.isRegistered,
    navTo: null, // Already on dashboard, no navigation needed
  },
  { 
    id: 'add_player_photo', 
    title: 'Add Player Photo', 
    description: 'Upload a photo for the player card',
    icon: '📷',
    checkFn: (data) => data.hasPhoto,
    navTo: null, // Photo upload is on dashboard hero card
  },
  { 
    id: 'make_payment', 
    title: 'Pay Registration Fee', 
    description: 'Complete your registration payment',
    icon: '💳',
    checkFn: (data) => data.paymentComplete,
    navTo: 'payments',
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
  { 
    id: 'join_team_hub', 
    title: 'Visit Team Hub', 
    description: 'Check out your team\'s page',
    icon: '👥',
    checkFn: (data) => data.hasVisitedTeamHub,
    navTo: null, // Team hub opens via navigateToTeamWall, not page nav
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

  // Load checklist data - can be called with player data from ParentDashboard
  // or will auto-detect from profile
  async function loadChecklistData(playerData = null) {
    try {
      let checklistData = {
        isRegistered: false,
        hasPhoto: false,
        paymentComplete: false,
        hasViewedSchedule: tutorialState.completedSteps?.includes('view_schedule'),
        hasRsvpd: false,
        hasVisitedTeamHub: tutorialState.completedSteps?.includes('join_team_hub'),
      }

      // If player data is passed directly (from ParentDashboard)
      if (playerData) {
        const player = Array.isArray(playerData) ? playerData[0] : playerData
        
        checklistData = {
          ...checklistData,
          isRegistered: !!(player?.team || player?.team_players?.length > 0),
          hasPhoto: !!player?.photo_url,
        }

        // Check payments for this player
        if (player?.id) {
          const { data: payments } = await supabase
            .from('payments')
            .select('amount, paid')
            .eq('player_id', player.id)

          const totalPaid = (payments || []).filter(p => p.paid).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
          const totalDue = (payments || []).filter(p => !p.paid).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
          checklistData.paymentComplete = totalDue <= 0 || totalPaid > 0

          // Check RSVPs
          const { data: rsvps } = await supabase
            .from('event_rsvps')
            .select('id')
            .eq('player_id', player.id)
            .limit(1)

          checklistData.hasRsvpd = (rsvps?.length || 0) > 0
        }
      } 
      // Otherwise try to load from profile's children
      else if (profile?.id) {
        const { data: players } = await supabase
          .from('players')
          .select('*, team_players(team_id)')
          .eq('parent_account_id', profile.id)
          .limit(1)

        if (players?.length > 0) {
          const player = players[0]
          checklistData.isRegistered = !!(player.team_players?.length > 0)
          checklistData.hasPhoto = !!player.photo_url

          // Check RSVPs
          const { data: rsvps } = await supabase
            .from('event_rsvps')
            .select('id')
            .eq('player_id', player.id)
            .limit(1)

          checklistData.hasRsvpd = (rsvps?.length || 0) > 0
        }
      }

      setTutorialState(prev => ({
        ...prev,
        checklistData,
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
