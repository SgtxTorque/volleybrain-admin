// =============================================================================
// ChallengeDetailModal — Full leaderboard and challenge details (desktop)
// =============================================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { X, Clock, Users, User, Flag, Star, Gift, Trophy, PlusCircle, CheckCircle, AlertCircle } from 'lucide-react'
import { fetchChallengeDetail, optInToChallenge } from '../../lib/challenge-service'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'

// =============================================================================
// Helpers
// =============================================================================

function getTimeRemaining(endsAt) {
  const now = Date.now()
  const end = new Date(endsAt).getTime()
  const diff = end - now
  if (diff <= 0) return 'Challenge Ended'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 0) return `${days}d ${hours}h remaining`
  if (hours > 0) return `${hours}h remaining`
  const mins = Math.floor(diff / (1000 * 60))
  return `${mins}m remaining`
}

function getInitials(name) {
  const parts = name.split(' ')
  return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase()
}

// =============================================================================
// Component
// =============================================================================

export default function ChallengeDetailModal({ visible, challengeId, onClose, onOptInSuccess }) {
  const { isDark } = useTheme()
  const { user } = useAuth()

  const [challenge, setChallenge] = useState(null)
  const [loading, setLoading] = useState(true)
  const [optingIn, setOptingIn] = useState(false)

  const loadChallenge = useCallback(async () => {
    if (!challengeId) return
    setLoading(true)
    const data = await fetchChallengeDetail(challengeId)
    setChallenge(data)
    setLoading(false)
  }, [challengeId])

  useEffect(() => {
    if (visible && challengeId) loadChallenge()
  }, [visible, challengeId])

  const isOptedIn = useMemo(() => {
    if (!challenge || !user?.id) return false
    return challenge.participants.some(p => p.player_id === user.id)
  }, [challenge, user?.id])

  const handleOptIn = async () => {
    if (!challengeId || !user?.id) return
    setOptingIn(true)
    const result = await optInToChallenge(challengeId, user.id)
    if (result.success) {
      await loadChallenge()
      onOptInSuccess?.()
    }
    setOptingIn(false)
  }

  if (!visible) return null

  const bg = isDark ? 'rgba(15,23,42,.97)' : 'rgba(255,255,255,.98)'
  const border = isDark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)'
  const textColor = isDark ? 'white' : '#1a1a1a'
  const mutedColor = isDark ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.35)'
  const subtleColor = isDark ? 'rgba(255,255,255,.55)' : 'rgba(0,0,0,.55)'
  const g = 'var(--accent-primary)'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg max-h-[85vh] rounded-2xl overflow-hidden flex flex-col"
        style={{ background: bg, border: `1px solid ${border}`, backdropFilter: 'blur(24px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${border}` }}>
          <button onClick={onClose} className="p-1 rounded-lg transition hover:bg-white/10">
            <X className="w-5 h-5" style={{ color: textColor }} />
          </button>
          <h2 className="text-lg font-bold" style={{ color: textColor }}>Challenge Details</h2>
          <div className="w-7" />
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: g, borderTopColor: 'transparent' }} />
            </div>
          ) : !challenge ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <AlertCircle className="w-12 h-12" style={{ color: mutedColor }} />
              <span className="text-sm font-medium" style={{ color: mutedColor }}>Challenge not found</span>
            </div>
          ) : (
            <>
              {/* Challenge info */}
              <div className="px-5 pt-5 space-y-3">
                {/* Timer */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: '#F59E0B20' }}>
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-bold text-amber-500">{getTimeRemaining(challenge.ends_at)}</span>
                </div>

                <h3 className="text-xl font-extrabold" style={{ color: textColor }}>{challenge.title}</h3>

                {challenge.description && (
                  <p className="text-sm leading-relaxed" style={{ color: subtleColor }}>{challenge.description}</p>
                )}

                {/* Meta pills */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold" style={{ background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)', color: mutedColor }}>
                    {challenge.challenge_type === 'team' ? <Users className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    {challenge.challenge_type === 'team' ? 'Team Goal' : 'Individual'}
                  </span>
                  <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold" style={{ background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)', color: mutedColor }}>
                    <Flag className="w-3 h-3" />
                    Target: {challenge.target_value}
                  </span>
                  <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold" style={{ background: '#FFD70020', color: '#FFD700' }}>
                    <Star className="w-3 h-3" />
                    +{challenge.xp_reward} XP
                  </span>
                </div>

                {/* Custom reward */}
                {challenge.custom_reward_text && (
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)' }}>
                    <Gift className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-semibold flex-1" style={{ color: textColor }}>{challenge.custom_reward_text}</span>
                  </div>
                )}

                {/* Team progress bar */}
                {challenge.challenge_type === 'team' && (
                  <div>
                    <span className="text-xs font-semibold mb-1.5 block" style={{ color: subtleColor }}>
                      Team Progress: {challenge.totalProgress || 0} / {challenge.target_value}
                    </span>
                    <div className="h-2.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(((challenge.totalProgress || 0) / (challenge.target_value || 1)) * 100, 100)}%`,
                          background: (challenge.totalProgress || 0) >= (challenge.target_value || 1) ? '#10B981' : g,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Opt-in button */}
                {!isOptedIn && challenge.status === 'active' && (
                  <button
                    onClick={handleOptIn}
                    disabled={optingIn}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-50"
                    style={{ background: g }}
                  >
                    {optingIn ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <PlusCircle className="w-4 h-4" />
                        Join Challenge
                      </>
                    )}
                  </button>
                )}

                {/* Leaderboard header */}
                <div className="flex items-center gap-2 pt-3 pb-1" style={{ borderTop: `1px solid ${border}` }}>
                  <Trophy className="w-4 h-4" style={{ color: g }} />
                  <span className="text-sm font-bold flex-1" style={{ color: textColor }}>Leaderboard</span>
                  <span className="text-xs font-medium" style={{ color: mutedColor }}>
                    {challenge.participants.length} player{challenge.participants.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Leaderboard */}
              <div className="px-2 pb-5">
                {challenge.participants.length === 0 ? (
                  <p className="text-center py-8 text-sm" style={{ color: mutedColor }}>
                    No one has joined yet. Be the first!
                  </p>
                ) : (
                  challenge.participants.map((item, index) => {
                    const pct = Math.min(((item.current_value || 0) / (challenge.target_value || 1)) * 100, 100)
                    const isMe = item.player_id === user?.id
                    const name = item.profile?.full_name || 'Unknown'
                    const isCompleted = item.completed

                    const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32']
                    const rankColor = index < 3 ? rankColors[index] : null

                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-2.5 px-3 py-3 rounded-xl"
                        style={{ background: isMe ? `${g}08` : 'transparent' }}
                      >
                        {/* Rank */}
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-extrabold"
                          style={{
                            background: rankColor ? `${rankColor}30` : 'transparent',
                            color: rankColor || textColor,
                          }}
                        >
                          {index + 1}
                        </div>

                        {/* Avatar */}
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ background: `${g}25`, color: g }}
                        >
                          {item.profile?.avatar_url ? (
                            <img src={item.profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : getInitials(name)}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: textColor }}>
                            {name} {isMe ? '(You)' : ''}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)' }}>
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${pct}%`, background: isCompleted ? '#10B981' : g }}
                              />
                            </div>
                            <span className="text-[11px] font-semibold w-12 text-right" style={{ color: subtleColor }}>
                              {item.current_value || 0}/{challenge.target_value}
                            </span>
                          </div>
                        </div>

                        {isCompleted && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                      </div>
                    )
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
