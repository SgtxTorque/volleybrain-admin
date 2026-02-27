import { useState, useEffect } from 'react'

// ============================================
// VOLLEYBALL SET SCORE INPUT
// ============================================
function SetScoreInput({ setNumber, ourScore, theirScore, targetScore, cap, winByTwo, onOurScoreChange, onTheirScoreChange, isDecidingSet, ourTeamName, theirTeamName }) {
  // Local state for controlled inputs
  const [ourInput, setOurInput] = useState(ourScore > 0 ? String(ourScore) : '')
  const [theirInput, setTheirInput] = useState(theirScore > 0 ? String(theirScore) : '')

  // Sync with props when they change externally (like +/- buttons)
  useEffect(() => {
    setOurInput(ourScore > 0 ? String(ourScore) : '')
  }, [ourScore])

  useEffect(() => {
    setTheirInput(theirScore > 0 ? String(theirScore) : '')
  }, [theirScore])

  // Check if set is complete
  function isSetComplete() {
    if (ourScore < targetScore && theirScore < targetScore) return false

    if (winByTwo) {
      const diff = Math.abs(ourScore - theirScore)
      if (cap && (ourScore >= cap || theirScore >= cap)) {
        return diff >= 1
      }
      return diff >= 2 && (ourScore >= targetScore || theirScore >= targetScore)
    }

    return ourScore >= targetScore || theirScore >= targetScore
  }

  const complete = isSetComplete()
  const ourWon = complete && ourScore > theirScore
  const theyWon = complete && theirScore > ourScore

  function handleOurInputChange(e) {
    const val = e.target.value.replace(/\D/g, '')
    setOurInput(val)
    onOurScoreChange(val === '' ? 0 : parseInt(val, 10))
  }

  function handleTheirInputChange(e) {
    const val = e.target.value.replace(/\D/g, '')
    setTheirInput(val)
    onTheirScoreChange(val === '' ? 0 : parseInt(val, 10))
  }

  return (
    <div className={`p-4 rounded-2xl border-2 transition ${
      ourWon ? 'bg-emerald-50 border-emerald-300' :
      theyWon ? 'bg-red-50 border-red-300' :
      'bg-white border-slate-200'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${isDecidingSet ? 'text-amber-600' : 'text-slate-700'}`}>
            Set {setNumber}
          </span>
          {isDecidingSet && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
              Deciding
            </span>
          )}
        </div>
        <span className="text-xs text-slate-500">
          First to {targetScore} {winByTwo ? '(win by 2)' : ''} {cap ? `• Cap: ${cap}` : ''}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Our score */}
        <div className="flex-1">
          <label className="text-xs text-slate-600 font-medium mb-1 block truncate">{ourTeamName || 'Us'}</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOurScoreChange(Math.max(0, ourScore - 1))}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition"
            >
              -
            </button>
            <input
              type="text"
              inputMode="numeric"
              value={ourInput}
              onChange={handleOurInputChange}
              onBlur={() => setOurInput(ourScore > 0 ? String(ourScore) : '')}
              placeholder="0"
              className={`w-16 h-12 text-center text-2xl font-bold rounded-xl border-2 focus:outline-none ${
                ourWon ? 'border-emerald-400 bg-emerald-100 text-emerald-700' : 'border-slate-200 focus:border-indigo-400'
              }`}
            />
            <button
              type="button"
              onClick={() => onOurScoreChange(ourScore + 1)}
              className="w-10 h-10 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold transition"
            >
              +
            </button>
          </div>
        </div>

        <div className="text-2xl text-slate-300 font-bold">-</div>

        {/* Their score */}
        <div className="flex-1">
          <label className="text-xs text-slate-600 font-medium mb-1 block text-right truncate">{theirTeamName || 'Opponent'}</label>
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => onTheirScoreChange(Math.max(0, theirScore - 1))}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition"
            >
              -
            </button>
            <input
              type="text"
              inputMode="numeric"
              value={theirInput}
              onChange={handleTheirInputChange}
              onBlur={() => setTheirInput(theirScore > 0 ? String(theirScore) : '')}
              placeholder="0"
              className={`w-16 h-12 text-center text-2xl font-bold rounded-xl border-2 focus:outline-none ${
                theyWon ? 'border-red-400 bg-red-100 text-red-700' : 'border-slate-200 focus:border-indigo-400'
              }`}
            />
            <button
              type="button"
              onClick={() => onTheirScoreChange(theirScore + 1)}
              className="w-10 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Set winner indicator */}
      {(ourWon || theyWon) && (
        <div className={`mt-3 text-center text-sm font-medium ${ourWon ? 'text-emerald-600' : 'text-red-600'}`}>
          ✓ {ourWon ? `${ourTeamName || 'We'} won this set!` : `${theirTeamName || 'They'} won this set`}
        </div>
      )}
    </div>
  )
}

export default SetScoreInput
