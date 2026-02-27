// =============================================================================
// CreateChallengeModal — Coach creates a new challenge (desktop modal)
// =============================================================================

import React, { useState } from 'react'
import { X, Trophy, User, Users, BarChart3, ClipboardCheck, Hand, Star } from 'lucide-react'
import { createChallenge } from '../../lib/challenge-service'
import { STAT_OPTIONS } from '../../lib/engagement-constants'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'

export default function CreateChallengeModal({ visible, teamId, organizationId, onClose, onSuccess }) {
  const { isDark } = useTheme()
  const { user, profile } = useAuth()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [challengeType, setChallengeType] = useState('individual')
  const [metricType, setMetricType] = useState('coach_verified')
  const [statKey, setStatKey] = useState('')
  const [targetValue, setTargetValue] = useState('')
  const [xpReward, setXpReward] = useState('50')
  const [customReward, setCustomReward] = useState('')
  const [durationDays, setDurationDays] = useState('7')
  const [creating, setCreating] = useState(false)

  const resetForm = () => {
    setTitle(''); setDescription(''); setChallengeType('individual')
    setMetricType('coach_verified'); setStatKey(''); setTargetValue('')
    setXpReward('50'); setCustomReward(''); setDurationDays('7')
  }

  const handleCreate = async () => {
    if (!title.trim()) return
    if (!targetValue || Number(targetValue) <= 0) return
    if (metricType === 'stat_based' && !statKey) return
    if (!user?.id || !profile) return

    setCreating(true)
    try {
      const now = new Date()
      const end = new Date(now)
      end.setDate(end.getDate() + (Number(durationDays) || 7))

      const result = await createChallenge({
        coachId: user.id,
        coachName: profile.full_name || 'Coach',
        teamId,
        organizationId,
        title: title.trim(),
        description: description.trim() || undefined,
        challengeType,
        metricType,
        statKey: metricType === 'stat_based' ? statKey : undefined,
        targetValue: Number(targetValue),
        xpReward: Math.min(Math.max(Number(xpReward) || 50, 25), 500),
        customRewardText: customReward.trim() || undefined,
        startsAt: now.toISOString(),
        endsAt: end.toISOString(),
      })

      if (result.success) {
        resetForm()
        onSuccess?.()
        onClose()
      }
    } catch (err) {
      console.error('[CreateChallenge] error:', err)
    } finally {
      setCreating(false)
    }
  }

  if (!visible) return null

  const bg = isDark ? 'rgba(15,23,42,.97)' : 'rgba(255,255,255,.98)'
  const border = isDark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)'
  const textColor = isDark ? 'white' : '#1a1a1a'
  const mutedColor = isDark ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.35)'
  const inputBg = isDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.03)'

  const trackingOptions = [
    { key: 'stat_based', label: 'Auto (Stats)', Icon: BarChart3 },
    { key: 'coach_verified', label: 'Coach Updates', Icon: ClipboardCheck },
    { key: 'self_report', label: 'Player Reports', Icon: Hand },
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg max-h-[85vh] rounded-xl overflow-hidden flex flex-col"
        style={{ background: bg, border: `1px solid ${border}`, backdropFilter: 'blur(24px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${border}` }}>
          <button onClick={onClose} className="p-1 rounded-lg transition hover:bg-white/10">
            <X className="w-5 h-5" style={{ color: textColor }} />
          </button>
          <h2 className="text-lg font-bold" style={{ color: textColor }}>Create Challenge</h2>
          <div className="w-7" />
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="text-sm font-bold mb-1.5 block" style={{ color: textColor }}>Challenge Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="First to 50 Serves"
              maxLength={80}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: inputBg, border: `1px solid ${border}`, color: textColor }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-bold mb-1.5 block" style={{ color: textColor }}>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional — describe what players need to do"
              maxLength={200}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ background: inputBg, border: `1px solid ${border}`, color: textColor, minHeight: 70 }}
            />
          </div>

          {/* Challenge Type */}
          <div>
            <label className="text-sm font-bold mb-1.5 block" style={{ color: textColor }}>Challenge Type</label>
            <div className="flex gap-2.5">
              {[
                { key: 'individual', label: 'Individual', Icon: User },
                { key: 'team', label: 'Team Goal', Icon: Users },
              ].map(({ key, label, Icon }) => (
                <button
                  key={key}
                  onClick={() => setChallengeType(key)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition"
                  style={{
                    border: `1.5px solid ${challengeType === key ? 'var(--accent-primary)' : border}`,
                    background: challengeType === key ? 'var(--accent-primary)20' : 'transparent',
                    color: challengeType === key ? 'var(--accent-primary)' : textColor,
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Tracking Method */}
          <div>
            <label className="text-sm font-bold mb-1.5 block" style={{ color: textColor }}>How will progress be tracked?</label>
            <div className="flex flex-wrap gap-2">
              {trackingOptions.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  onClick={() => setMetricType(key)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition"
                  style={{
                    border: `1px solid ${metricType === key ? 'var(--accent-primary)' : border}`,
                    background: metricType === key ? 'var(--accent-primary)20' : 'transparent',
                    color: metricType === key ? 'var(--accent-primary)' : textColor,
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Stat selector */}
          {metricType === 'stat_based' && (
            <div>
              <label className="text-sm font-bold mb-1.5 block" style={{ color: textColor }}>Stat to Track *</label>
              <div className="flex flex-wrap gap-2">
                {STAT_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setStatKey(opt.key)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                    style={{
                      border: `1px solid ${statKey === opt.key ? 'var(--accent-primary)' : border}`,
                      background: statKey === opt.key ? 'var(--accent-primary)20' : 'transparent',
                      color: statKey === opt.key ? 'var(--accent-primary)' : textColor,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Target + Duration row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-bold mb-1.5 block" style={{ color: textColor }}>Target *</label>
              <input
                type="number"
                value={targetValue}
                onChange={e => setTargetValue(e.target.value)}
                placeholder="50"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: inputBg, border: `1px solid ${border}`, color: textColor }}
              />
            </div>
            <div>
              <label className="text-sm font-bold mb-1.5 block" style={{ color: textColor }}>Duration (days)</label>
              <input
                type="number"
                value={durationDays}
                onChange={e => setDurationDays(e.target.value)}
                placeholder="7"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: inputBg, border: `1px solid ${border}`, color: textColor }}
              />
            </div>
          </div>

          {/* XP Reward */}
          <div>
            <label className="text-sm font-bold mb-1.5 block" style={{ color: textColor }}>XP Reward (25–500)</label>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <input
                type="number"
                value={xpReward}
                onChange={e => setXpReward(e.target.value)}
                placeholder="50"
                className="w-28 px-3.5 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: inputBg, border: `1px solid ${border}`, color: textColor }}
              />
            </div>
          </div>

          {/* Custom Reward */}
          <div>
            <label className="text-sm font-bold mb-1.5 block" style={{ color: textColor }}>Custom Reward (optional)</label>
            <input
              type="text"
              value={customReward}
              onChange={e => setCustomReward(e.target.value)}
              placeholder="Winner picks warmup music for a week"
              maxLength={100}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: inputBg, border: `1px solid ${border}`, color: textColor }}
            />
          </div>

          {/* Create button */}
          <button
            onClick={handleCreate}
            disabled={creating || !title.trim() || !targetValue}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-40 mt-2"
            style={{ background: 'var(--accent-primary)' }}
          >
            {creating ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Trophy className="w-4 h-4" />
                Create Challenge
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
