// =============================================================================
// ScorePanel — live score display wrapper with card chrome
// =============================================================================

import Scoreboard from './Scoreboard'
import { GAME_MODES } from './GameDayHelpers'

export default function ScorePanel({
  mode, ourScore, theirScore, setScores, currentSet,
  teamName, opponentName, onOurPoint, onTheirPoint, onUndoPoint, theme,
}) {
  if (mode !== GAME_MODES.LIVE) return null

  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }}>
      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${theme.border}` }}>
        <h3 className="font-bold text-lg" style={{ color: theme.textPrimary }}>Live Score</h3>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/40">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-300">In Progress</span>
        </span>
      </div>

      <div className="p-5">
        <Scoreboard
          ourScore={ourScore} theirScore={theirScore} setScores={setScores}
          currentSet={currentSet} teamName={teamName} opponentName={opponentName}
          isLive={true} onOurPoint={onOurPoint} onTheirPoint={onTheirPoint}
          onUndoPoint={onUndoPoint} theme={theme}
        />
      </div>
    </div>
  )
}
