// =============================================================================
// TrophyCaseCard — Badge grid with tier colors and glow animations
// Always dark theme — does NOT use isDark toggle
// =============================================================================

import { Lock, ChevronRight } from 'lucide-react'

const RARITY = {
  legendary: { bg: 'linear-gradient(135deg, #F59E0B, #D97706)', label: 'Legendary', glow: 'animate-gold-glow' },
  epic: { bg: 'linear-gradient(135deg, #A855F7, #7C3AED)', label: 'Epic', glow: 'animate-glow-pulse' },
  rare: { bg: 'linear-gradient(135deg, #3B82F6, #2563EB)', label: 'Rare', glow: 'animate-glow-pulse' },
  uncommon: { bg: 'linear-gradient(135deg, #10B981, #059669)', label: 'Uncommon', glow: '' },
  common: { bg: 'linear-gradient(135deg, #6B7280, #4B5563)', label: 'Common', glow: '' },
}

export default function TrophyCaseCard({ badges, onNavigate }) {
  const earned = badges || []
  const total = Math.max(earned.length, 6)

  return (
    <div
      className="rounded-2xl p-4 h-full flex flex-col"
      style={{ background: '#10284C', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-bold uppercase tracking-[1.2px]" style={{ color: 'rgba(255,255,255,0.15)' }}>
          Trophy Case
        </h3>
        <button onClick={() => onNavigate?.('achievements')} className="text-[10px] font-bold flex items-center gap-0.5" style={{ color: '#4BB9EC' }}>
          {earned.length}/{total} <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="flex-1 grid grid-cols-3 gap-2 auto-rows-min">
        {earned.slice(0, 6).map((b, idx) => {
          const r = RARITY[b.achievement?.rarity || b.achievements?.rarity] || RARITY.common
          const icon = b.achievement?.icon || b.achievements?.icon || '🏆'
          const name = b.achievement?.name || b.achievements?.name || 'Badge'
          return (
            <div
              key={b.id || idx}
              className={`rounded-xl overflow-hidden relative ${r.glow}`}
              style={{ height: 80, background: r.bg, border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <div className="absolute top-1 right-1 px-1 py-0.5 rounded text-[7px] font-bold uppercase" style={{ background: 'rgba(0,0,0,0.35)', color: 'rgba(255,255,255,0.8)' }}>
                {r.label}
              </div>
              <div className="flex items-center justify-center h-[60%]">
                <span className="text-2xl drop-shadow-lg">{icon}</span>
              </div>
              <div className="absolute bottom-0 inset-x-0 px-1.5 pb-1" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.5))' }}>
                <p className="text-white font-bold text-[9px] leading-tight truncate">{name}</p>
              </div>
            </div>
          )
        })}
        {/* Locked slots */}
        {Array.from({ length: Math.max(0, 6 - earned.length) }).map((_, i) => (
          <div
            key={`locked-${i}`}
            className="rounded-xl flex flex-col items-center justify-center gap-1"
            style={{ height: 80, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <Lock className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.15)' }} />
            <span className="text-[8px] font-bold uppercase" style={{ color: 'rgba(255,255,255,0.15)' }}>Locked</span>
          </div>
        ))}
      </div>
    </div>
  )
}
