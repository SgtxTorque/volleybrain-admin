// =============================================================================
// ChallengeCard — Desktop card for coach challenges in Team Hub feed
// =============================================================================

import { Trophy, Users, User, Flag, Star, Clock, CheckCircle } from 'lucide-react'
import { useMemo } from 'react'
import { useTheme } from '../../contexts/ThemeContext'

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
// Helpers
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
}) {
  const { isDark, accent } = useTheme()
  const data = useMemo(() => parseChallengeMetadata(metadataJson), [metadataJson])

  if (!data) return null

  const timeLeft = getTimeRemaining(data.endsAt)
  const isEnded = timeLeft === 'Ended'
  const progressPct = data.challengeType === 'team'
    ? Math.min((teamProgress / data.targetValue) * 100, 100)
    : Math.min((userProgress / data.targetValue) * 100, 100)

  return (
    <div
      className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.01]"
      style={{ border: `1.5px solid ${accent.primary}` }}
      onClick={onViewDetails}
    >
      {/* Banner */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ backgroundColor: accent.primary + '15' }}
      >
        <div className="flex items-center gap-1.5">
          <Trophy size={14} style={{ color: accent.primary }} />
          <span className="text-[11px] font-extrabold uppercase tracking-wide" style={{ color: accent.primary }}>
            Coach Challenge
          </span>
        </div>
        <span className={`text-xs font-bold ${isEnded ? (isDark ? 'text-slate-400' : 'text-slate-500') : 'text-amber-500'}`}>
          {timeLeft}
        </span>
      </div>

      <div className="p-4 space-y-2">
        {/* Title */}
        <h3 className={`text-[17px] font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
          {data.title}
        </h3>

        {/* Description */}
        {data.description && (
          <p className={`text-sm leading-5 line-clamp-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {data.description}
          </p>
        )}

        {/* Meta pills */}
        <div className="flex flex-wrap gap-1.5">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
            {data.challengeType === 'team' ? <Users size={12} /> : <User size={12} />}
            {data.challengeType === 'team' ? 'Team Goal' : 'Individual'}
          </span>
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
            <Flag size={12} />
            Target: {data.targetValue}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-yellow-500/10 text-yellow-500">
            <Star size={12} className="fill-yellow-400" />
            +{data.xpReward} XP
          </span>
        </div>

        {/* Progress bar */}
        {(isOptedIn || data.challengeType === 'team') && (
          <div className="mt-1">
            <div className="flex justify-between mb-1">
              <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {data.challengeType === 'team'
                  ? `Team: ${teamProgress} / ${data.targetValue}`
                  : `Your progress: ${userProgress} / ${data.targetValue}`}
              </span>
              <span className="text-xs font-bold" style={{ color: accent.primary }}>
                {Math.round(progressPct)}%
              </span>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPct}%`,
                  backgroundColor: progressPct >= 100 ? '#10B981' : accent.primary,
                }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-1">
          <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {participantCount} player{participantCount !== 1 ? 's' : ''} participating
          </span>

          {!isOptedIn && !isEnded && onOptIn && (
            <button
              className="px-4 py-2 rounded-lg text-white text-xs font-bold transition-opacity hover:opacity-90"
              style={{ backgroundColor: accent.primary }}
              onClick={(e) => { e.stopPropagation(); onOptIn() }}
            >
              Join Challenge
            </button>
          )}

          {isOptedIn && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-500">
              <CheckCircle size={14} />
              Joined
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
