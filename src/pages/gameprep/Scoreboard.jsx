import { useState } from 'react'

// ============================================
// ANIMATED SCORE COMPONENT
// ============================================
function ScoreAnimation({ show, type }) {
  if (!show) return null

  return (
    <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-50 animate-bounce`}>
      <div className={`text-6xl font-black ${type === 'us' ? 'text-amber-400' : 'text-red-400'}`}>
        +1
      </div>
    </div>
  )
}

// ============================================
// SCOREBOARD COMPONENT
// ============================================
function Scoreboard({
  ourScore,
  theirScore,
  setScores = [],
  currentSet,
  teamName,
  opponentName,
  isLive,
  onOurPoint,
  onTheirPoint,
  onUndoPoint,
  theme,
}) {
  const [showAnimation, setShowAnimation] = useState(null)

  const handlePoint = (team) => {
    setShowAnimation(team)
    setTimeout(() => setShowAnimation(null), 500)
    if (team === 'us') onOurPoint?.()
    else onTheirPoint?.()
  }

  return (
    <div
      className="backdrop-blur-xl rounded-3xl overflow-hidden"
      style={{
        backgroundColor: 'rgba(10, 10, 15, 0.9)',
        border: '1px solid rgba(59, 130, 246, 0.15)',
        boxShadow: '0 0 40px rgba(59, 130, 246, 0.08)',
      }}
    >
      {/* Live indicator */}
      {isLive && (
        <div className="bg-gradient-to-r from-red-600 to-red-500 px-4 py-2 flex items-center justify-center gap-2">
          <span className="w-3 h-3 bg-white rounded-full animate-pulse" />
          <span className="text-white text-sm font-black tracking-widest">LIVE &bull; SET {currentSet}</span>
        </div>
      )}

      {/* Main score — MASSIVE tap targets */}
      <div className="relative p-4 md:p-8">
        <ScoreAnimation show={showAnimation === 'us'} type="us" />
        <ScoreAnimation show={showAnimation === 'them'} type="them" />

        <div className="flex items-center justify-between gap-4">
          {/* Our team */}
          <div className="flex-1 text-center">
            <p className="text-amber-400 text-xs font-bold tracking-widest mb-2" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{teamName || 'US'}</p>
            <button
              onClick={() => handlePoint('us')}
              disabled={!isLive}
              className="w-full min-h-[80px] rounded-2xl transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100 flex items-center justify-center"
              style={{
                color: '#ffffff',
                fontSize: 'clamp(4rem, 12vw, 8rem)',
                fontWeight: 900,
                lineHeight: 1,
                background: isLive ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                border: isLive ? '1px solid rgba(59, 130, 246, 0.15)' : 'none',
              }}
            >
              {ourScore}
            </button>
          </div>

          {/* Divider */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-3xl font-bold text-slate-600">—</span>
            {isLive && (
              <button
                onClick={onUndoPoint}
                className="px-4 py-2 rounded-xl text-xs font-semibold transition"
                style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.8)',
                  color: '#94a3b8',
                  border: '1px solid rgba(51, 65, 85, 0.5)',
                }}
              >
                UNDO
              </button>
            )}
          </div>

          {/* Their team */}
          <div className="flex-1 text-center">
            <p className="text-red-400 text-xs font-bold tracking-widest mb-2" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{opponentName || 'THEM'}</p>
            <button
              onClick={() => handlePoint('them')}
              disabled={!isLive}
              className="w-full min-h-[80px] rounded-2xl transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100 flex items-center justify-center"
              style={{
                color: '#ffffff',
                fontSize: 'clamp(4rem, 12vw, 8rem)',
                fontWeight: 900,
                lineHeight: 1,
                background: isLive ? 'rgba(239, 68, 68, 0.08)' : 'transparent',
                border: isLive ? '1px solid rgba(239, 68, 68, 0.15)' : 'none',
              }}
            >
              {theirScore}
            </button>
          </div>
        </div>
      </div>

      {/* Set scores */}
      {setScores.length > 0 && (
        <div
          className="px-4 py-3"
          style={{ borderTop: `1px solid ${theme?.border || 'rgba(51, 65, 85, 0.5)'}` }}
        >
          <div className="flex items-center justify-center gap-4">
            {setScores.map((set, i) => (
              <div
                key={i}
                className="text-center px-3 py-1 rounded-lg"
                style={{
                  backgroundColor: i + 1 === currentSet
                    ? 'rgba(245, 158, 11, 0.2)'
                    : (theme?.buttonBg || '#1e293b')
                }}
              >
                <p
                  className="text-[10px] uppercase"
                  style={{ color: theme?.textMuted || '#64748b' }}
                >
                  Set {i + 1}
                </p>
                <p className="text-sm font-bold">
                  <span className={set.our > set.their ? 'text-emerald-400' : ''} style={{ color: set.our > set.their ? undefined : theme?.textPrimary }}>{set.our}</span>
                  <span className="mx-1" style={{ color: theme?.textMuted || '#64748b' }}>-</span>
                  <span className={set.their > set.our ? 'text-red-400' : ''} style={{ color: set.their > set.our ? undefined : theme?.textPrimary }}>{set.their}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Scoreboard
