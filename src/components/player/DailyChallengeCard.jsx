// =============================================================================
// DailyChallengeCard — Active challenge with progress bar + XP reward
// Mobile parity: queries coach_challenges + challenge_participants
// Always dark theme — does NOT use isDark toggle
// =============================================================================

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function DailyChallengeCard({ viewingPlayer }) {
  const [challenge, setChallenge] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!viewingPlayer?.id) { setLoading(false); return }
    async function load() {
      setLoading(true)
      try {
        const { data } = await supabase
          .from('coach_challenges')
          .select('*, challenge_participants!inner(progress, player_id)')
          .eq('challenge_participants.player_id', viewingPlayer.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (data) {
          const participant = data.challenge_participants?.[0]
          setChallenge({ ...data, progress: participant?.progress || 0 })
        } else {
          setChallenge(null)
        }
      } catch { setChallenge(null) }
      setLoading(false)
    }
    load()
  }, [viewingPlayer?.id])

  // Empty state — no active challenge
  if (!loading && !challenge) {
    return (
      <div className="rounded-2xl p-4 h-full flex flex-col items-center justify-center"
        style={{ background: '#10284C', border: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-2xl mb-2">🏐</span>
        <p className="text-[11px] font-semibold text-center" style={{ color: 'rgba(255,255,255,0.30)' }}>
          No active challenges
        </p>
        <p className="text-[10px] text-center mt-0.5" style={{ color: 'rgba(255,255,255,0.15)' }}>
          Your coach will post new ones soon!
        </p>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="rounded-2xl p-4 h-full animate-pulse"
        style={{ background: '#10284C', border: '1px solid rgba(255,215,0,0.10)' }}>
        <div className="h-3 w-24 rounded bg-white/10 mb-3" />
        <div className="h-4 w-full rounded bg-white/10 mb-4" />
        <div className="h-1.5 rounded-full bg-white/5" />
      </div>
    )
  }

  const pct = challenge.target_value > 0
    ? Math.min(100, (challenge.progress / challenge.target_value) * 100)
    : 0

  return (
    <div className="rounded-2xl p-4 h-full flex flex-col"
      style={{ background: '#10284C', border: '1px solid rgba(255,215,0,0.20)' }}>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-sm">⚡</span>
        <span className="text-[10px] font-bold uppercase tracking-[1.2px]" style={{ color: '#FFD700' }}>
          Daily Challenge
        </span>
      </div>

      <p className="text-sm font-semibold truncate mb-3 text-white">{challenge.title}</p>

      <div className="flex-1" />

      <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: '#FFD700' }} />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.30)' }}>
          {challenge.progress}/{challenge.target_value}
        </span>
        <span className="text-[10px] font-bold" style={{ color: 'rgba(255,215,0,0.60)' }}>
          +{challenge.xp_reward || 25} XP
        </span>
      </div>
    </div>
  )
}
