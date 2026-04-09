// =============================================================================
// CoachMarkContext — Role-agnostic spotlight tooltip engine
// Modeled after ParentTutorialContext's state + persistence pattern.
//
// What it does:
// - Stores a set of "seen" coach-mark IDs
// - Shows a named group of tooltips sequentially for a given role/screen
// - Persists seen state to localStorage (primary) and to profile
//   onboarding_data.coach_marks_seen (best-effort cross-device sync)
// - Tooltips are dismissible, non-blocking, and remembered
// =============================================================================

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const CoachMarkContext = createContext(null)
export function useCoachMarks() { return useContext(CoachMarkContext) }

// ─── Coach-mark definitions (Lynx voice — warm, encouraging, playful) ───
//
// Each entry is a named group. Each group is a sequence of tooltips that
// highlight a target element by CSS selector. Tooltips are skipped silently
// if their target element is not on the page.
export const COACH_MARKS = {
  admin: {
    dashboard_first_load: [
      {
        id: 'admin_dashboard_setup_cta',
        target: '[data-coachmark="setup-cta"]',
        title: 'Start here',
        body: "Five quick steps to get your club ready for action. We save as you go.",
        position: 'top',
      },
      {
        id: 'admin_dashboard_roadmap',
        target: '[data-coachmark="setup-roadmap"]',
        title: 'Your setup roadmap',
        body: 'This tracks your progress. Each step lights up as you go. 🐾',
        position: 'bottom',
      },
      {
        id: 'admin_dashboard_sidebar',
        target: '[data-coachmark="sidebar-programs"]',
        title: 'Your programs live here',
        body: "As you add sports and seasons, they'll show up in this sidebar.",
        position: 'right',
      },
    ],
    setup_first_load: [
      {
        id: 'admin_setup_essentials',
        target: '[data-coachmark="setup-step"]',
        title: 'One thing at a time',
        body: "Fill in each section, or skip and come back — we save as you go.",
        position: 'top',
      },
    ],
    first_season: [
      {
        id: 'admin_first_season_form',
        target: '[data-coachmark="season-form"]',
        title: 'Your first season!',
        body: "This is where it gets real. Name it, set the dates, and let's roll.",
        position: 'top',
      },
    ],
    first_team: [
      {
        id: 'admin_first_team_form',
        target: '[data-coachmark="team-form"]',
        title: 'Time to build the squad',
        body: 'Give your team a name and a color. Players get added after.',
        position: 'top',
      },
    ],
    first_coach_invite: [
      {
        id: 'admin_first_coach_invite',
        target: '[data-coachmark="coach-invite"]',
        title: 'Bring in the crew',
        body: "Enter their email and we'll handle the rest — they get a magic link to join.",
        position: 'bottom',
      },
    ],
  },
  coach: {
    dashboard_first_load: [
      {
        id: 'coach_dashboard_home',
        target: '[data-coachmark="coach-home"]',
        title: 'Welcome, Coach!',
        body: 'This is your command center. Schedule, roster, and game day — all here.',
        position: 'bottom',
      },
    ],
  },
}

function lsKey(profileId) {
  return `lynx_coach_marks_${profileId || 'anon'}`
}

export function CoachMarkProvider({ children }) {
  const { profile } = useAuth()
  const [seenMarks, setSeenMarks] = useState(() => new Set())
  const [activeGroup, setActiveGroup] = useState(null)
  const [activeMarkIndex, setActiveMarkIndex] = useState(0)

  // Load seen state when profile becomes available
  useEffect(() => {
    if (!profile?.id) return
    try {
      // Prefer cross-device sync from profile.onboarding_data.coach_marks_seen
      const fromProfile = profile?.onboarding_data?.coach_marks_seen
      const fromLocal = JSON.parse(localStorage.getItem(lsKey(profile.id)) || '[]')
      const merged = new Set([
        ...(Array.isArray(fromProfile) ? fromProfile : []),
        ...(Array.isArray(fromLocal) ? fromLocal : []),
      ])
      setSeenMarks(merged)
    } catch (e) {
      // Non-critical — start fresh
      setSeenMarks(new Set())
    }
  }, [profile?.id])

  // Persist a single mark as seen (localStorage + profile best-effort)
  const saveSeen = useCallback(async (markId) => {
    if (!markId) return
    setSeenMarks(prev => {
      if (prev.has(markId)) return prev
      const next = new Set(prev)
      next.add(markId)

      // localStorage (primary, sync)
      try {
        localStorage.setItem(lsKey(profile?.id), JSON.stringify([...next]))
      } catch (_) {}

      // Profile onboarding_data.coach_marks_seen (best-effort, async)
      if (profile?.id) {
        const mergedOnboarding = {
          ...(profile?.onboarding_data || {}),
          coach_marks_seen: [...next],
          coach_marks_updated_at: new Date().toISOString(),
        }
        supabase
          .from('profiles')
          .update({ onboarding_data: mergedOnboarding })
          .eq('id', profile.id)
          .then(() => {}, () => {}) // swallow errors — localStorage is source of truth
      }

      return next
    })
  }, [profile?.id, profile?.onboarding_data])

  // Check if a group still has unseen marks
  const hasUnseenMarks = useCallback((role, screenKey) => {
    const marks = COACH_MARKS?.[role]?.[screenKey]
    if (!marks || marks.length === 0) return false
    return marks.some(m => !seenMarks.has(m.id))
  }, [seenMarks])

  // Show the next group of tooltips for a screen (only unseen ones)
  const showMarks = useCallback((role, screenKey) => {
    const marks = COACH_MARKS?.[role]?.[screenKey]
    if (!marks) return
    const unseen = marks.filter(m => !seenMarks.has(m.id))
    if (unseen.length === 0) return
    setActiveGroup(unseen)
    setActiveMarkIndex(0)
  }, [seenMarks])

  // Advance to next tooltip in the current group
  const nextMark = useCallback(() => {
    if (!activeGroup) return
    const current = activeGroup[activeMarkIndex]
    if (current?.id) saveSeen(current.id)

    if (activeMarkIndex < activeGroup.length - 1) {
      setActiveMarkIndex(activeMarkIndex + 1)
    } else {
      setActiveGroup(null)
      setActiveMarkIndex(0)
    }
  }, [activeGroup, activeMarkIndex, saveSeen])

  // Dismiss the entire group (mark all as seen)
  const dismissAll = useCallback(() => {
    if (!activeGroup) return
    activeGroup.forEach(m => m?.id && saveSeen(m.id))
    setActiveGroup(null)
    setActiveMarkIndex(0)
  }, [activeGroup, saveSeen])

  // Skip the current mark without marking as seen — useful when target missing
  const skipCurrent = useCallback(() => {
    if (!activeGroup) return
    // Mark as seen so we don't retry forever
    const current = activeGroup[activeMarkIndex]
    if (current?.id) saveSeen(current.id)
    if (activeMarkIndex < activeGroup.length - 1) {
      setActiveMarkIndex(activeMarkIndex + 1)
    } else {
      setActiveGroup(null)
      setActiveMarkIndex(0)
    }
  }, [activeGroup, activeMarkIndex, saveSeen])

  const currentMark = activeGroup?.[activeMarkIndex] || null
  const totalInGroup = activeGroup?.length || 0
  const currentIndex = activeMarkIndex

  return (
    <CoachMarkContext.Provider value={{
      showMarks,
      currentMark,
      totalInGroup,
      currentIndex,
      nextMark,
      dismissAll,
      skipCurrent,
      hasUnseenMarks,
    }}>
      {children}
    </CoachMarkContext.Provider>
  )
}
