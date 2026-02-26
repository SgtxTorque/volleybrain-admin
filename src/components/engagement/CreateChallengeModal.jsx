// =============================================================================
// CreateChallengeModal — Coach creates a new challenge (desktop modal)
// =============================================================================

import { useState, useMemo } from 'react'
import { X, Trophy, Users, User, BarChart3, ClipboardCheck, Hand, Star } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { createChallenge } from '../../lib/challenge-service'

const STAT_OPTIONS = [
  { key: 'total_kills', label: 'Kills' },
  { key: 'total_aces', label: 'Aces' },
  { key: 'total_digs', label: 'Digs' },
  { key: 'total_assists', label: 'Assists' },
  { key: 'total_blocks', label: 'Blocks' },
  { key: 'total_serves', label: 'Serves' },
  { key: 'total_service_points', label: 'Service Points' },
]

export default function CreateChallengeModal({ visible, teamId, organizationId, onClose, onSuccess }) {
  const { isDark, accent } = useTheme()
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
    if (!title.trim()) { alert('Please enter a challenge title.'); return }
    if (!targetValue || Number(targetValue) <= 0) { alert('Please enter a target value greater than 0.'); return }
    if (metricType === 'stat_based' && !statKey) { alert('Please select a stat to track.'); return }
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
      } else {
        alert(result.error || 'Failed to create challenge.')
      }
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  if (!visible) return null

  const cardBg = isDark ? 'bg-slate-800' : 'bg-white'
  const borderCls = isDark ? 'border-slate-700' : 'border-slate-200'
  const textCls = isDark ? 'text-white' : 'text-slate-900'
  const textMutedCls = isDark ? 'text-slate-400' : 'text-slate-500'
  const inputCls = `w-full border rounded-xl px-3.5 py-3 text-sm ${isDark ? 'bg-slate-900 border-slate-600 text-white placeholder:text-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'}`

  const OptionChip = ({ active, onClick, icon: Icon, label }) => (
    <button
      className="flex-1 flex items-center gap-2 py-3 px-4 rounded-xl border-[1.5px] transition-all"
      style={{
        borderColor: active ? accent.primary : (isDark ? '#334155' : '#e2e8f0'),
        backgroundColor: active ? accent.primary + '20' : 'transparent',
      }}
      onClick={onClick}
    >
      <Icon size={16} style={{ color: active ? accent.primary : (isDark ? '#94a3b8' : '#64748b') }} />
      <span className="text-sm font-semibold" style={{ color: active ? accent.primary : (isDark ? '#fff' : '#1e293b') }}>
        {label}
      </span>
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className={`relative ${cardBg} rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-modal-in`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${borderCls}`}>
          <button onClick={onClose} className={`p-1 rounded-lg hover:bg-black/10 ${textCls}`}>
            <X size={20} />
          </button>
          <h2 className={`text-lg font-bold ${textCls}`}>Create Challenge</h2>
          <div className="w-7" />
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Title */}
          <div>
            <label className={`block text-sm font-bold mb-1.5 ${textCls}`}>Challenge Title *</label>
            <input className={inputCls} placeholder="First to 50 Serves" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
          </div>

          {/* Description */}
          <div>
            <label className={`block text-sm font-bold mb-1.5 ${textCls}`}>Description</label>
            <textarea className={`${inputCls} min-h-[80px] resize-none`} placeholder="Optional — describe what players need to do" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} />
          </div>

          {/* Challenge Type */}
          <div>
            <label className={`block text-sm font-bold mb-1.5 ${textCls}`}>Challenge Type</label>
            <div className="flex gap-2.5">
              <OptionChip active={challengeType === 'individual'} onClick={() => setChallengeType('individual')} icon={User} label="Individual" />
              <OptionChip active={challengeType === 'team'} onClick={() => setChallengeType('team')} icon={Users} label="Team Goal" />
            </div>
          </div>

          {/* Tracking Method */}
          <div>
            <label className={`block text-sm font-bold mb-1.5 ${textCls}`}>How will progress be tracked?</label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'stat_based', label: 'Auto (Stats)', icon: BarChart3 },
                { key: 'coach_verified', label: 'Coach Updates', icon: ClipboardCheck },
                { key: 'self_report', label: 'Player Reports', icon: Hand },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg border transition-all"
                  style={{
                    borderColor: metricType === key ? accent.primary : (isDark ? '#334155' : '#e2e8f0'),
                    backgroundColor: metricType === key ? accent.primary + '20' : 'transparent',
                  }}
                  onClick={() => setMetricType(key)}
                >
                  <Icon size={14} style={{ color: metricType === key ? accent.primary : (isDark ? '#94a3b8' : '#64748b') }} />
                  <span className="text-xs font-semibold" style={{ color: metricType === key ? accent.primary : (isDark ? '#fff' : '#1e293b') }}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Stat selector */}
          {metricType === 'stat_based' && (
            <div>
              <label className={`block text-sm font-bold mb-1.5 ${textCls}`}>Stat to Track *</label>
              <div className="flex flex-wrap gap-2">
                {STAT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    className="px-3.5 py-2 rounded-lg border text-xs font-semibold transition-all"
                    style={{
                      borderColor: statKey === opt.key ? accent.primary : (isDark ? '#334155' : '#e2e8f0'),
                      backgroundColor: statKey === opt.key ? accent.primary + '20' : 'transparent',
                      color: statKey === opt.key ? accent.primary : (isDark ? '#fff' : '#1e293b'),
                    }}
                    onClick={() => setStatKey(opt.key)}
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
              <label className={`block text-sm font-bold mb-1.5 ${textCls}`}>Target *</label>
              <input className={inputCls} type="number" placeholder="50" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} />
            </div>
            <div>
              <label className={`block text-sm font-bold mb-1.5 ${textCls}`}>Duration (days)</label>
              <input className={inputCls} type="number" placeholder="7" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} />
            </div>
          </div>

          {/* XP Reward */}
          <div>
            <label className={`block text-sm font-bold mb-1.5 ${textCls}`}>XP Reward (25-500)</label>
            <div className="flex items-center gap-2">
              <Star size={16} className="text-yellow-400 fill-yellow-400" />
              <input className={`${inputCls} w-28`} type="number" placeholder="50" value={xpReward} onChange={(e) => setXpReward(e.target.value)} />
            </div>
          </div>

          {/* Custom Reward */}
          <div>
            <label className={`block text-sm font-bold mb-1.5 ${textCls}`}>Custom Reward (optional)</label>
            <input className={inputCls} placeholder="Winner picks warmup music for a week" value={customReward} onChange={(e) => setCustomReward(e.target.value)} maxLength={100} />
          </div>

          {/* Create button */}
          <button
            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl text-white font-bold text-base transition-opacity hover:opacity-90 disabled:opacity-50 mt-2"
            style={{ backgroundColor: accent.primary }}
            onClick={handleCreate}
            disabled={creating}
          >
            {creating ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Trophy size={18} />
                Create Challenge
              </>
            )}
          </button>

          <div className="h-4" />
        </div>
      </div>
    </div>
  )
}
