// =============================================================================
// WelcomeBanner — Shared greeting banner for all dashboards
// Time-of-day aware, role-specific motivational copy, mobile app tone
// Flat rendering: no card background, no shadow, no border — text only
// =============================================================================

import { useState, useEffect, useMemo } from 'react'

// ── Motivational messages per role (rotated per session) ──
const COACH_MESSAGES = [
  "Ready to dominate today, Coach?",
  "Let's build some champions today",
  "The court is calling, Coach",
  "Today feels like a W",
  "Let's make today count, Coach",
  "Time to put in the work",
  "Go make them better today",
  "Trust the preparation — your team is ready",
]

const ADMIN_MESSAGES = [
  "Welcome to the command center",
  "Let's see how the org is running",
  "Time to check on the troops",
  "Let's keep the machine running smooth",
  "Your club is counting on you — let's go",
  "Time to see the big picture",
]

const PARENT_MESSAGES = [
  "Welcome to the Den",
  "Let's see what's happening",
  "Here's what's going on today",
  "Ready to cheer them on?",
  "Your athlete is putting in the work",
  "Big things are happening",
]

function getTimeOfDayGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

// Pick a random message per session (stable across re-renders)
function useSessionMessage(messages) {
  return useMemo(() => {
    const idx = Math.floor(Math.random() * messages.length)
    return messages[idx]
  }, []) // intentionally empty — one pick per mount
}

export default function WelcomeBanner({
  role = 'admin',
  userName = '',
  teamName = '',
  seasonName = '',
  childName = '',
  isDark = false,
  onNavigate,
  unreadChats = 0,
}) {
  const [useMotivational, setUseMotivational] = useState(false)

  // Alternate between time-of-day and motivational every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setUseMotivational(prev => !prev)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  const messagePool = role === 'coach' ? COACH_MESSAGES
    : role === 'parent' ? PARENT_MESSAGES
    : ADMIN_MESSAGES

  const motivationalMsg = useSessionMessage(messagePool)

  const firstName = userName?.split(' ')[0] || ''
  const roleLabel = role === 'coach' ? 'Coach' : role === 'parent' ? '' : ''
  const displayName = firstName
    ? (roleLabel ? `${roleLabel} ${firstName}` : firstName)
    : (roleLabel || 'there')

  const timeGreeting = `${getTimeOfDayGreeting()}, ${displayName}`

  // For parent role, personalize with child name
  const parentMotivational = childName
    ? `Let's see what ${childName} has been up to`
    : motivationalMsg

  const greeting = useMotivational
    ? (role === 'parent' && childName ? parentMotivational : motivationalMsg)
    : timeGreeting

  // Sub-line context
  const subParts = []
  if (seasonName) subParts.push(seasonName)
  if (teamName) subParts.push(teamName)
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  subParts.push(today)
  const subLine = subParts.join(' · ')

  return (
    <div className="overflow-hidden h-full flex flex-col justify-center">
      <div className="flex items-center gap-3">
        <h1
          className={`text-r-2xl font-extrabold tracking-tight transition-opacity duration-500 truncate flex-1 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
        >
          {greeting}
        </h1>
        {onNavigate && (
          <button
            onClick={() => onNavigate('chats')}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-r-xs font-bold transition-colors flex-shrink-0 ${
              isDark
                ? 'bg-white/[0.08] hover:bg-white/[0.12] text-white/70 hover:text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800'
            }`}
            title="Open Chats"
          >
            💬 Chats
            {unreadChats > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                {unreadChats > 99 ? '99+' : unreadChats}
              </span>
            )}
          </button>
        )}
      </div>
      <p className={`text-r-base mt-1 truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        {subLine}
      </p>
    </div>
  )
}
