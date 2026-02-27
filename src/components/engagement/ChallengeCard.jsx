// =============================================================================
// ChallengeCard — Desktop challenge card for team feed
// =============================================================================

import React, { useMemo } from 'react'
import { Trophy, Users, User, Flag, Star, Clock, CheckCircle } from 'lucide-react'

// =============================================================================
// Parse helper
// =============================================================================

export function parseChallengeMetadata(json) {
  if (!json) return null
  try {
    const data = JSON.parse(json)
    if (!data.title || !data.targetValue) return null
    return data
  } catch {
    return null
  }
}

// =============================================================================
// Time remaining helper
// =============================================================================

function getTimeRemaining(endsAt) {
  const now = Date.now()
  const end = new Date(endsAt).getTime()
  const diff = end - now
  if (diff <= 0) return 'Ended'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 0) return `${days}d ${hours}h left`
  if (hours > 0) return `${hours}h left`
  const mins = Math.floor(diff / (1000 * 60))
  return `${mins}m left`
}

// =============================================================================
// Component
// =============================================================================

export default function ChallengeCard({
  metadataJson,
  coachName,
  createdAt,
  onOptIn,
  onViewDetails,
  participantCount = 0,
  isOptedIn = false,
  userProgress = 0,
  teamProgress = 0,
  isDark,
  accentColor,
}) {
  const data = useMemo(() => parseChallengeMetadata(metadataJson), [metadataJson])

  if (!data) return null

  const g = accentColor || 'var(--accent-primary)'
  const timeLeft = getTimeRemaining(data.endsAt)
  const isEnded = timeLeft === 'Ended'
  const progressPct = data.challengeType === 'team'
    ? Math.min((teamProgress / data.targetValue) * 100, 100)
    : Math.min((userProgress / data.targetValue) * 100, 100)

  return (
    <div
      className="rounded-xl overflow-hidden cursor-pointer transition hover:shadow-lg"
      style={{ border: `1.5px solid ${g}` }}
      onClick={onViewDetails}
    >
      {/* Banner */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ background: `${g}15` }}
      >
        <div className="flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5" style={{ color: g }} />
          <span className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: g }}>
            Coach Challenge
          </span>
        </div>
        <span
          className="text-xs font-bold"
          style={{ color: isEnded ? (isDark ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.35)') : '#F59E0B' }}
        >
          <Clock className="w-3 h-3 inline mr-1" />
          {timeLeft}
        </span>
      </div>

      <div className="p-4 space-y-2.5">
        {/* Title */}
        <h4 className="text-base font-bold" style={{ color: isDark ? 'white' : '#1a1a1a' }}>
          {data.title}
        </h4>

        {/* Description */}
        {data.description && (
          <p className="text-sm leading-relaxed line-clamp-2" style={{ color: isDark ? 'rgba(255,255,255,.55)' : 'rgba(0,0,0,.55)' }}>
            {data.description}
          </p>
        )}

        {/* Meta pills */}
        <div className="flex flex-wrap gap-1.5">
          <span
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold"
            style={{ background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)', color: isDark ? 'rgba(255,255,255,.45)' : 'rgba(0,0,0,.45)' }}
          >
            {data.challengeType === 'team' ? <Users className="w-3 h-3" /> : <User className="w-3 h-3" />}
            {data.challengeType === 'team' ? 'Team Goal' : 'Individual'}
          </span>
          <span
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold"
            style={{ background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)', color: isDark ? 'rgba(255,255,255,.45)' : 'rgba(0,0,0,.45)' }}
          >
            <Flag className="w-3 h-3" />
            Target: {data.targetValue}
          </span>
          <span
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold"
            style={{ background: '#FFD70020', color: '#FFD700' }}
          >
            <Star className="w-3 h-3" />
            +{data.xpReward} XP
          </span>
        </div>

        {/* Progress bar */}
        {(isOptedIn || data.challengeType === 'team') && (
          <div className="mt-1">
            <div className="flex justify-between mb-1">
              <span className="text-xs font-semibold" style={{ color: isDark ? 'rgba(255,255,255,.55)' : 'rgba(0,0,0,.55)' }}>
                {data.challengeType === 'team'
                  ? `Team: ${teamProgress} / ${data.targetValue}`
                  : `Your progress: ${userProgress} / ${data.targetValue}`}
              </span>
              <span className="text-xs font-bold" style={{ color: g }}>
                {Math.round(progressPct)}%
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPct}%`,
                  background: progressPct >= 100 ? '#10B981' : g,
                }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-medium" style={{ color: isDark ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.35)' }}>
            {participantCount} player{participantCount !== 1 ? 's' : ''} participating
          </span>

          {!isOptedIn && !isEnded && onOptIn && (
            <button
              onClick={e => { e.stopPropagation(); onOptIn() }}
              className="px-4 py-1.5 rounded-lg text-xs font-bold text-white transition hover:opacity-90"
              style={{ background: g }}
            >
              Join Challenge
            </button>
          )}

          {isOptedIn && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg" style={{ background: '#10B98120' }}>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs font-bold text-emerald-500">Joined</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
