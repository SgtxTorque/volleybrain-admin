// ============================================
// PERIOD SCORE INPUT (Basketball, Soccer, etc.)
// ============================================
function PeriodScoreInput({ periodNumber, periodAbbr, ourScore, theirScore, onOurScoreChange, onTheirScoreChange, isOvertime }) {
  return (
    <div className={`p-3 rounded-xl border-2 ${isOvertime ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
      <div className="text-center mb-2">
        <span className={`text-sm font-semibold ${isOvertime ? 'text-amber-700' : 'text-slate-600'}`}>
          {isOvertime ? 'OT' : `${periodAbbr}${periodNumber}`}
        </span>
      </div>

      <div className="space-y-2">
        <input
          type="number"
          value={ourScore || ''}
          onChange={(e) => onOurScoreChange(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-full h-10 text-center text-lg font-bold rounded-lg border-2 border-indigo-200 bg-indigo-50 text-indigo-700 focus:outline-none focus:border-indigo-400"
          min="0"
          placeholder="0"
        />
        <input
          type="number"
          value={theirScore || ''}
          onChange={(e) => onTheirScoreChange(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-full h-10 text-center text-lg font-bold rounded-lg border-2 border-red-200 bg-red-50 text-red-700 focus:outline-none focus:border-red-400"
          min="0"
          placeholder="0"
        />
      </div>
    </div>
  )
}

export default PeriodScoreInput
