// =============================================================================
// IdleHeroCard — Relaxed mascot hero when nothing is pressing
// =============================================================================

import { useState, useMemo } from 'react'

const IDLE_MESSAGES = [
  "The court is quiet, Coach. Enjoy the downtime.",
  "No events on the horizon. Time to recharge.",
  "All caught up. Your team is in good shape.",
  "Nothing pressing right now. Take a breather.",
  "The calm before the storm. Enjoy it, Coach.",
]

export default function IdleHeroCard({ selectedTeam, teamRecord = { wins: 0, losses: 0 }, winRate = 0, daysUntilNext = null }) {
  const message = useMemo(() => IDLE_MESSAGES[Math.floor(Math.random() * IDLE_MESSAGES.length)], [])

  return (
    <div className="relative rounded-2xl overflow-hidden h-full">
      <img src="/images/SleepLynx.png" alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
      <div className="absolute inset-0 bg-gradient-to-r from-lynx-navy/95 via-lynx-navy/80 to-lynx-navy/60" />

      <div className="relative z-10 p-5 flex flex-col justify-between h-full">
        <div>
          <p className="text-r-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            {selectedTeam?.name}
          </p>
          <h2 className="text-xl font-black text-white mb-2 leading-tight">
            All Clear, Coach
          </h2>
          <p className="text-r-sm text-slate-400 mb-3 max-w-[280px]">
            {message}
          </p>
          {daysUntilNext && daysUntilNext > 0 && (
            <p className="text-r-sm text-lynx-sky font-semibold">
              Next event in {daysUntilNext} day{daysUntilNext !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Season stats summary */}
        <div className="pt-3 border-t border-white/[0.08]">
          <p className="text-r-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Season so far</p>
          <div className="flex items-center gap-4">
            <div>
              <span className="text-2xl font-black text-emerald-400 tabular-nums">{teamRecord.wins}</span>
              <span className="text-lg font-bold text-slate-600 mx-1">—</span>
              <span className="text-2xl font-black text-red-400 tabular-nums">{teamRecord.losses}</span>
            </div>
            <span className="text-r-sm text-slate-500">{winRate}% win rate</span>
          </div>
        </div>
      </div>
    </div>
  )
}
