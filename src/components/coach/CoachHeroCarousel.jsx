// =============================================================================
// CoachHeroCarousel — Rotates between hero card types based on context
// Auto-advances every 8 seconds, dot indicators for manual navigation
// =============================================================================

import { useState, useEffect, useMemo } from 'react'
import CoachGameDayHeroV2 from './CoachGameDayHeroV2'
import PracticeHeroCard from './PracticeHeroCard'
import SeasonSetupHeroCard from './SeasonSetupHeroCard'
import IdleHeroCard from './IdleHeroCard'

export default function CoachHeroCarousel({
  nextGame,
  nextEvent,
  selectedTeam,
  teamRecord = { wins: 0, losses: 0, recentForm: [] },
  winRate = 0,
  onNavigate,
  roster = [],
  rsvpCounts = {},
  lineupsSet = 0,
  upcomingEvents = [],
}) {
  const [activeIndex, setActiveIndex] = useState(0)

  // Find next practice (first non-game event)
  const nextPractice = useMemo(
    () => upcomingEvents.find(e => e.event_type === 'practice' || e.event_type === 'training'),
    [upcomingEvents]
  )

  // Setup data for SeasonSetupHeroCard
  const setupData = useMemo(() => ({
    rosterSize: roster.length,
    missingPositions: roster.filter(p => !p.position).length,
    missingJerseys: roster.filter(p => !p.jersey_number).length,
    lineupsSet,
    eventsCount: upcomingEvents.length,
  }), [roster, lineupsSet, upcomingEvents.length])

  const incompleteSetupCount = useMemo(() => {
    let count = 0
    if (roster.length === 0) count++
    if (setupData.missingPositions > 0) count++
    if (setupData.missingJerseys > 0) count++
    if (lineupsSet === 0) count++
    if (upcomingEvents.length === 0) count++
    return count
  }, [roster.length, setupData, lineupsSet, upcomingEvents.length])

  // Build array of available heroes
  const heroes = useMemo(() => {
    const list = []
    if (nextGame) list.push({ type: 'game' })
    if (nextPractice && nextPractice.id !== nextGame?.id) list.push({ type: 'practice' })
    if (incompleteSetupCount >= 2) list.push({ type: 'setup' })
    if (list.length === 0) list.push({ type: 'idle' })
    return list
  }, [nextGame, nextPractice, incompleteSetupCount])

  // Reset index when heroes change
  useEffect(() => {
    setActiveIndex(0)
  }, [heroes.length])

  // Auto-rotate every 8 seconds
  useEffect(() => {
    if (heroes.length <= 1) return
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % heroes.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [heroes.length])

  const safeIndex = activeIndex < heroes.length ? activeIndex : 0
  const activeHero = heroes[safeIndex]

  // Days until next event (for idle card)
  const daysUntilNext = useMemo(() => {
    if (upcomingEvents.length === 0) return null
    const nextDate = new Date(upcomingEvents[0].event_date + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return Math.round((nextDate - today) / (1000 * 60 * 60 * 24))
  }, [upcomingEvents])

  // RSVP count for next practice
  const practiceRsvpCount = nextPractice ? (rsvpCounts[nextPractice.id]?.going || rsvpCounts[nextPractice.id]?.total || 0) : 0

  function renderHero() {
    switch (activeHero?.type) {
      case 'game':
        return (
          <CoachGameDayHeroV2
            nextGame={nextGame}
            nextEvent={nextGame}
            selectedTeam={selectedTeam}
            teamRecord={teamRecord}
            winRate={winRate}
            onNavigate={onNavigate}
          />
        )
      case 'practice':
        return (
          <PracticeHeroCard
            event={nextPractice}
            selectedTeam={selectedTeam}
            rsvpCount={practiceRsvpCount}
            rosterSize={roster.length}
            onNavigate={onNavigate}
          />
        )
      case 'setup':
        return (
          <SeasonSetupHeroCard
            setupData={setupData}
            selectedTeam={selectedTeam}
            onNavigate={onNavigate}
          />
        )
      case 'idle':
      default:
        return (
          <IdleHeroCard
            selectedTeam={selectedTeam}
            teamRecord={teamRecord}
            winRate={winRate}
            daysUntilNext={daysUntilNext}
          />
        )
    }
  }

  return (
    <div className="relative h-full">
      {renderHero()}

      {/* Dot indicators — only when multiple heroes */}
      {heroes.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {heroes.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`rounded-full transition-all ${
                idx === safeIndex
                  ? 'bg-white w-2.5 h-2.5'
                  : 'bg-white/30 w-2 h-2 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
