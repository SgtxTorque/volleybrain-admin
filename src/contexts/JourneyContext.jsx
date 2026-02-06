import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'

// ============================================
// JOURNEY CONFIGURATION
// ============================================

export const JOURNEY_BADGES = {
  // Organization badges
  founder: { id: 'founder', icon: '🌟', name: 'Founder', description: 'Created your organization' },
  season_pro: { id: 'season_pro', icon: 'calendar', name: 'Season Pro', description: 'Created your first season' },
  team_builder: { id: 'team_builder', icon: 'users', name: 'Team Builder', description: 'Added your first team' },
  roster_ready: { id: 'roster_ready', icon: 'clipboard', name: 'Roster Ready', description: 'Registered 5+ players' },
  full_roster: { id: 'full_roster', icon: 'volleyball', name: 'Full House', description: 'Registered 10+ players' },
  scheduler: { id: 'scheduler', icon: 'calendar', name: 'Scheduler', description: 'Created your first event' },
  game_day: { id: 'game_day', icon: 'trophy', name: 'Game Day', description: 'Completed your first game' },
  coach_connector: { id: 'coach_connector', icon: 'target', name: 'Coach Connector', description: 'Added a coach to your team' },
  payment_pro: { id: 'payment_pro', icon: 'credit-card', name: 'Payment Pro', description: 'Collected your first payment' },
  
  // Coach badges
  lineup_master: { id: 'lineup_master', icon: 'bar-chart', name: 'Lineup Master', description: 'Created your first lineup' },
  practice_planner: { id: 'practice_planner', icon: '📝', name: 'Practice Planner', description: 'Planned your first practice' },
  game_prepper: { id: 'game_prepper', icon: '🎮', name: 'Game Prepper', description: 'Completed game prep' },
  stat_tracker: { id: 'stat_tracker', icon: 'trending-up', name: 'Stat Tracker', description: 'Recorded player stats' },
  
  // Parent badges
  registered: { id: 'registered', icon: '✅', name: 'Registered', description: 'Completed player registration' },
  paperwork_done: { id: 'paperwork_done', icon: '📋', name: 'Paperwork Pro', description: 'Signed all waivers and forms' },
  paid_up: { id: 'paid_up', icon: '💳', name: 'Paid Up', description: 'Completed registration payment' },
  photo_ready: { id: 'photo_ready', icon: '📷', name: 'Photo Ready', description: 'Added player photo' },
  first_rsvp: { id: 'first_rsvp', icon: '👍', name: 'Engaged Parent', description: 'RSVP\'d to your first event' },
  team_player: { id: 'team_player', icon: '🤝', name: 'Team Player', description: 'Volunteered for an event' },
  social_butterfly: { id: 'social_butterfly', icon: '💬', name: 'Social Butterfly', description: 'Posted in team chat' },
  superfan: { id: 'superfan', icon: '🌟', name: 'Superfan', description: 'Viewed stats after 5 games' },
  perfect_attendance: { id: 'perfect_attendance', icon: '🏆', name: 'Perfect Attendance', description: 'RSVP\'d to 10+ events' },
  
  // Milestone badges
  week_one: { id: 'week_one', icon: 'calendar', name: 'Week One', description: 'Completed first week' },
  midseason: { id: 'midseason', icon: 'star', name: 'Midseason Star', description: 'Reached midseason' },
  season_complete: { id: 'season_complete', icon: '🏅', name: 'Season Complete', description: 'Finished the season' },
}

// Journey steps by role
export const JOURNEY_STEPS = {
  org_director: [
    { id: 'create_org', title: 'Create Organization', description: 'Set up your club', icon: 'building', badge: 'founder' },
    { id: 'create_season', title: 'Create Season', description: 'Define your season dates and fees', icon: 'calendar', badge: 'season_pro' },
    { id: 'add_teams', title: 'Add Teams', description: 'Create teams for your organization', icon: 'users', badge: 'team_builder' },
    { id: 'add_coaches', title: 'Add Coaches', description: 'Assign coaches to teams', icon: 'target', badge: 'coach_connector' },
    { id: 'register_players', title: 'Register Players', description: 'Add players to your roster', icon: 'volleyball', badge: 'roster_ready' },
    { id: 'create_schedule', title: 'Create Schedule', description: 'Add practices and games', icon: 'calendar', badge: 'scheduler' },
    { id: 'first_game', title: 'First Game', description: 'Complete your first game', icon: 'trophy', badge: 'game_day' },
  ],
  team_manager: [
    { id: 'join_create_team', title: 'Set Up Team', description: 'Create or join a team', icon: 'users', badge: 'team_builder' },
    { id: 'add_roster', title: 'Build Roster', description: 'Add players to your team', icon: 'clipboard', badge: 'roster_ready' },
    { id: 'assign_coach', title: 'Add Coach', description: 'Assign a coach (or yourself)', icon: 'target', badge: 'coach_connector' },
    { id: 'create_schedule', title: 'Create Schedule', description: 'Add practices and games', icon: 'calendar', badge: 'scheduler' },
    { id: 'first_practice', title: 'First Practice', description: 'Complete your first practice', icon: 'volleyball', badge: 'practice_planner' },
    { id: 'first_game', title: 'First Game', description: 'Complete your first game', icon: 'trophy', badge: 'game_day' },
  ],
  coach: [
    { id: 'complete_profile', title: 'Complete Profile', description: 'Add your coaching info', icon: 'user', badge: null },
    { id: 'view_roster', title: 'Meet Your Team', description: 'Review your player roster', icon: 'clipboard', badge: null },
    { id: 'create_lineup', title: 'Create Lineup', description: 'Set up your game lineup', icon: 'bar-chart', badge: 'lineup_master' },
    { id: 'plan_practice', title: 'Plan Practice', description: 'Create a practice plan', icon: '📝', badge: 'practice_planner' },
    { id: 'game_prep', title: 'Game Prep', description: 'Prepare for your first game', icon: '🎮', badge: 'game_prepper' },
    { id: 'track_stats', title: 'Track Stats', description: 'Record player statistics', icon: 'trending-up', badge: 'stat_tracker' },
  ],
  parent: [
    { id: 'complete_registration', title: 'Complete Registration', description: 'Finish all registration details', icon: '📝', badge: 'registered' },
    { id: 'sign_waivers', title: 'Sign Waivers', description: 'Sign all required liability waivers', icon: '✍️', badge: 'paperwork_done' },
    { id: 'make_payment', title: 'Pay Registration Fee', description: 'Complete your payment', icon: '💳', badge: 'paid_up' },
    { id: 'view_player_card', title: 'View Player Card', description: 'Check out your child\'s player card', icon: '🎴', badge: null },
    { id: 'add_player_photo', title: 'Add Player Photo', description: 'Upload a photo for the player card', icon: '📷', badge: 'photo_ready' },
    { id: 'view_schedule', title: 'View Schedule', description: 'Check the team calendar', icon: '📅', badge: null },
    { id: 'first_rsvp', title: 'RSVP to Event', description: 'Let the coach know you\'re coming', icon: '✅', badge: 'first_rsvp' },
    { id: 'join_team_chat', title: 'Join Team Chat', description: 'Connect with coaches and parents', icon: '💬', badge: 'social_butterfly' },
    { id: 'volunteer', title: 'Volunteer', description: 'Sign up to help the team', icon: '🤝', badge: 'team_player' },
  ],
  player: [
    { id: 'complete_profile', title: 'Complete Profile', description: 'Add your player info', icon: 'user', badge: null },
    { id: 'view_team', title: 'Meet Your Team', description: 'See your teammates', icon: 'users', badge: null },
    { id: 'view_schedule', title: 'View Schedule', description: 'Check upcoming events', icon: 'calendar', badge: null },
    { id: 'first_practice', title: 'First Practice', description: 'Attend your first practice', icon: 'volleyball', badge: null },
    { id: 'first_game', title: 'First Game', description: 'Play your first game', icon: 'trophy', badge: 'game_day' },
  ],
}

// ============================================
// JOURNEY CONTEXT - For app-wide state
// ============================================

const JourneyContext = createContext(null)

export function useJourney() { 
  return useContext(JourneyContext) 
}

export function JourneyProvider({ children }) {
  const { user, profile, organization } = useAuth()
  const [journeyData, setJourneyData] = useState({
    completedSteps: [],
    earnedBadges: [],
    currentRole: 'org_director',
    dismissedUntil: null,
    celebrationQueue: [],
  })
  const [loading, setLoading] = useState(true)

  // Load journey data from profile
  useEffect(() => {
    if (profile?.id) {
      loadJourneyData()
    }
  }, [profile?.id])

  async function loadJourneyData() {
    try {
      const data = profile?.onboarding_data || {}
      setJourneyData({
        completedSteps: data.completed_steps || [],
        earnedBadges: data.earned_badges || [],
        currentRole: data.role || 'org_director',
        dismissedUntil: data.journey_dismissed_until || null,
        celebrationQueue: [],
      })
    } catch (err) {
      console.error('Error loading journey:', err)
    }
    setLoading(false)
  }

  async function completeStep(stepId) {
    const steps = JOURNEY_STEPS[journeyData.currentRole] || []
    const step = steps.find(s => s.id === stepId)
    
    if (!step || journeyData.completedSteps.includes(stepId)) return

    const newCompletedSteps = [...journeyData.completedSteps, stepId]
    const newBadges = [...journeyData.earnedBadges]
    const celebrations = []

    // Award badge if step has one
    if (step.badge && !newBadges.includes(step.badge)) {
      newBadges.push(step.badge)
      celebrations.push({ type: 'badge', badge: JOURNEY_BADGES[step.badge] })
    }

    // Check for milestone badges
    const completionPercent = (newCompletedSteps.length / steps.length) * 100
    if (completionPercent >= 100 && !newBadges.includes('season_complete')) {
      newBadges.push('season_complete')
      celebrations.push({ type: 'badge', badge: JOURNEY_BADGES.season_complete })
    }

    const newData = {
      ...journeyData,
      completedSteps: newCompletedSteps,
      earnedBadges: newBadges,
      celebrationQueue: celebrations,
    }

    setJourneyData(newData)

    // Persist to database
    try {
      await supabase.from('profiles').update({
        onboarding_data: {
          ...profile?.onboarding_data,
          completed_steps: newCompletedSteps,
          earned_badges: newBadges,
          role: journeyData.currentRole,
        }
      }).eq('id', user.id)
    } catch (err) {
      console.error('Error saving journey progress:', err)
    }
  }

  function dismissJourney(duration = 'session') {
    const dismissedUntil = duration === 'forever' 
      ? 'forever' 
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    
    setJourneyData(prev => ({ ...prev, dismissedUntil }))
  }

  function clearCelebration() {
    setJourneyData(prev => ({
      ...prev,
      celebrationQueue: prev.celebrationQueue.slice(1)
    }))
  }

  const steps = JOURNEY_STEPS[journeyData.currentRole] || []
  const completedCount = journeyData.completedSteps.length
  const totalSteps = steps.length
  const progressPercent = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0
  const currentStepIndex = journeyData.completedSteps.length
  const currentStep = steps[currentStepIndex]
  const isComplete = completedCount >= totalSteps
  const isDismissed = journeyData.dismissedUntil === 'forever' || 
    (journeyData.dismissedUntil && new Date(journeyData.dismissedUntil) > new Date())

  return (
    <JourneyContext.Provider value={{
      journeyData,
      steps,
      completedSteps: journeyData.completedSteps,
      earnedBadges: journeyData.earnedBadges,
      completedCount,
      totalSteps,
      progressPercent,
      currentStep,
      currentStepIndex,
      isComplete,
      isDismissed,
      loading,
      completeStep,
      dismissJourney,
      clearCelebration,
      JOURNEY_BADGES,
    }}>
      {children}
    </JourneyContext.Provider>
  )
}
