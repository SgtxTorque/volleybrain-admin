// =============================================================================
// DailyChallengeCard — Active challenge with progress bar + XP reward
// Always dark theme — does NOT use isDark toggle
// =============================================================================

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function DailyChallengeCard({ viewingPlayer }) {
  const [challenge, setChallenge] = useState(null)

  useEffect(() => {
    if (!viewingPlayer?.id) return
    async function load() {
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
        }
      } catch { /* no active challenge */ }
    }
    load()
  }, [viewingPlayer?.id])

  // Fallback if no real challenge
  const display = challenge || {
    title: 'Complete 20 serves at practice',
    target_value: 20,
    progress: 0,
    xp_reward: 25,
  }

  const pct = display.target_value > 0
    ? Math.min(100, (display.progress / display.target_value) * 100)
    : 0

  return (
    <div
      className="rounded-2xl p-4 h-full flex flex-col"
      style={{ background: '#10284C', border: '1px solid rgba(255,215,0,0.20)' }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-sm">⚡</span>
        <span className="text-[10px] font-bold uppercase tracking-[1.2px]" style={{ color: '#FFD700' }}>
          Daily Challenge
        </span>
      </div>

      <p className="text-sm font-semibold truncate mb-3 text-white">{display.title}</p>

      <div className="flex-1" />

      <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: '#FFD700' }} />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.30)' }}>
          {display.progress}/{display.target_value}
        </span>
        <span className="text-[10px] font-bold animate-shimmer" style={{ color: 'rgba(255,215,0,0.60)' }}>
          +{display.xp_reward || 25} XP
        </span>
      </div>
    </div>
  )
}
