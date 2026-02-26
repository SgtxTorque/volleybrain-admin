// =============================================================================
// ChallengeDetailModal — Full leaderboard and challenge details (desktop)
// =============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react'
import { X, Clock, Users, User, Flag, Star, Gift, Award, CheckCircle, PlusCircle } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { fetchChallengeDetail, optInToChallenge } from '../../lib/challenge-service'

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
  const { isDark, accent } = useTheme()
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
    if (visible && challengeId) {
      loadChallenge()
    }
  }, [visible, challengeId])

  const isOptedIn = useMemo(() => {
    if (!challenge || !user?.id) return false
    return challenge.participants.some((p) => p.player_id === user.id)
  }, [challenge, user?.id])

  const handleOptIn = async () => {
    if (!challengeId || !user?.id) return
    setOptingIn(true)
    const result = await optInToChallenge(challengeId, user.id)
    if (result.success) {
      await loadChallenge()
      onOptInSuccess?.()
    } else {
      alert(result.error || 'Failed to join challenge.')
    }
    setOptingIn(false)
  }

  if (!visible) return null

  const cardBg = isDark ? 'bg-slate-800' : 'bg-white'
  const borderCls = isDark ? 'border-slate-700' : 'border-slate-200'
  const textCls = isDark ? 'text-white' : 'text-slate-900'
  const textSecCls = isDark ? 'text-slate-300' : 'text-slate-600'
  const textMutedCls = isDark ? 'text-slate-400' : 'text-slate-500'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className={`relative ${cardBg} rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-modal-in`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${borderCls}`}>
          <button onClick={onClose} className={`p-1 rounded-lg hover:bg-black/10 ${textCls}`}>
            <X size={20} />
          </button>
          <h2 className={`text-lg font-bold ${textCls}`}>Challenge Details</h2>
          <div className="w-7" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: accent.primary, borderTopColor: 'transparent' }} />
            </div>
          ) : !challenge ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <p className={textMutedCls}>Challenge not found</p>
            </div>
          ) : (
            <div>
              {/* Challenge Info */}
              <div className="p-5 space-y-3">
                {/* Timer */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-500 text-xs font-bold">
                  <Clock size={14} />
                  {getTimeRemaining(challenge.ends_at)}
                </span>

                <h3 className={`text-xl font-extrabold ${textCls}`}>{challenge.title}</h3>
                {challenge.description && (
                  <p className={`text-sm leading-5 ${textSecCls}`}>{challenge.description}</p>
                )}

                {/* Meta pills */}
                <div className="flex flex-wrap gap-1.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                    {challenge.challenge_type === 'team' ? <Users size={12} /> : <User size={12} />}
                    {challenge.challenge_type === 'team' ? 'Team Goal' : 'Individual'}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                    <Flag size={12} />
                    Target: {challenge.target_value}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-yellow-500/10 text-yellow-500">
                    <Star size={12} className="fill-yellow-400" />
                    +{challenge.xp_reward} XP
                  </span>
                </div>

                {/* Custom reward */}
                {challenge.custom_reward_text && (
                  <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                    <Gift size={16} className="text-purple-400" />
                    <span className={`text-sm font-semibold ${textCls}`}>{challenge.custom_reward_text}</span>
                  </div>
                )}

                {/* Team progress */}
                {challenge.challenge_type === 'team' && (
                  <div>
                    <p className={`text-xs font-semibold mb-1.5 ${textSecCls}`}>
                      Team Progress: {challenge.totalProgress || 0} / {challenge.target_value}
                    </p>
                    <div className={`h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(((challenge.totalProgress || 0) / (challenge.target_value || 1)) * 100, 100)}%`,
                          backgroundColor: (challenge.totalProgress || 0) >= (challenge.target_value || 1) ? '#10B981' : accent.primary,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Opt-in button */}
                {!isOptedIn && challenge.status === 'active' && (
                  <button
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: accent.primary }}
                    onClick={handleOptIn}
                    disabled={optingIn}
                  >
                    {optingIn ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <PlusCircle size={18} />
                        Join Challenge
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Leaderboard */}
              <div className={`border-t ${borderCls}`}>
                <div className="flex items-center gap-2 px-5 pt-4 pb-2">
                  <Award size={16} style={{ color: accent.primary }} />
                  <span className={`text-base font-bold flex-1 ${textCls}`}>Leaderboard</span>
                  <span className={`text-xs font-medium ${textMutedCls}`}>
                    {challenge.participants.length} player{challenge.participants.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {challenge.participants.length === 0 ? (
                  <p className={`text-center py-8 text-sm ${textMutedCls}`}>No one has joined yet. Be the first!</p>
                ) : (
                  <div className="pb-4">
                    {challenge.participants.map((item, index) => {
                      const pct = Math.min(((item.current_value || 0) / (challenge.target_value || 1)) * 100, 100)
                      const isMe = item.player_id === user?.id
                      const name = item.profile?.full_name || 'Unknown'

                      const rankColors = ['text-yellow-500 bg-yellow-500/20', 'text-slate-400 bg-slate-400/20', 'text-amber-700 bg-amber-700/20']

                      return (
                        <div
                          key={item.id}
                          className={`flex items-center gap-2.5 px-5 py-3 ${isMe ? (isDark ? 'bg-white/5' : 'bg-slate-50') : ''}`}
                        >
                          {/* Rank */}
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${rankColors[index] || (isDark ? 'text-slate-400 bg-slate-700' : 'text-slate-500 bg-slate-100')}`}>
                            {index + 1}
                          </div>

                          {/* Avatar */}
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ backgroundColor: accent.primary + '25', color: accent.primary }}
                          >
                            {getInitials(name)}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold truncate ${textCls}`}>
                              {name} {isMe ? '(You)' : ''}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${pct}%`,
                                    backgroundColor: item.completed ? '#10B981' : accent.primary,
                                  }}
                                />
                              </div>
                              <span className={`text-[11px] font-semibold w-12 text-right ${textSecCls}`}>
                                {item.current_value || 0}/{challenge.target_value}
                              </span>
                            </div>
                          </div>

                          {item.completed && <CheckCircle size={18} className="text-emerald-500" />}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
