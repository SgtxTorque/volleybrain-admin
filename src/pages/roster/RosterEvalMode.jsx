// =============================================================================
// RosterEvalMode — Evaluation setup form + rating card
// Extracted from RosterManagerPage.jsx — preserves ALL save logic interface
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { Check, ChevronLeft, ChevronRight, Save } from 'lucide-react'
import { ClipboardList } from 'lucide-react'

const ALL_EVAL_SKILLS = [
  { key: 'serving', label: 'Serving' },
  { key: 'passing', label: 'Passing' },
  { key: 'setting', label: 'Setting' },
  { key: 'attacking', label: 'Attacking' },
  { key: 'blocking', label: 'Blocking' },
  { key: 'defense', label: 'Defense' },
  { key: 'hustle', label: 'Hustle' },
  { key: 'coachability', label: 'Coachability' },
  { key: 'teamwork', label: 'Teamwork' },
]

const POSITION_NAMES = {
  'OH': 'Outside Hitter', 'S': 'Setter', 'MB': 'Middle Blocker',
  'OPP': 'Opposite', 'L': 'Libero', 'DS': 'Defensive Specialist', 'RS': 'Right Side',
}

export { ALL_EVAL_SKILLS }

export default function RosterEvalMode({
  evalStep, evalType, setEvalType,
  evalPlayerScope, setEvalPlayerScope,
  evalSkills, setEvalSkills,
  evalPlayers, evalCurrentIndex,
  evalRatings, setEvalRatings,
  evalNotes, setEvalNotes,
  evalPrevious, evalSaving,
  rosterLength, selectedIdsSize,
  onStartEvaluation, onSaveAndNext, onSkipPlayer, onBackToSetup,
}) {
  const { isDark } = useTheme()
  const cardBg = isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'
  const primaryText = isDark ? 'text-white' : 'text-slate-900'
  const secondaryText = isDark ? 'text-slate-400' : 'text-slate-500'

  const currentPlayer = evalPlayers[evalCurrentIndex] || null
  const evalPrevSkills = evalPrevious?.skills
    ? (typeof evalPrevious.skills === 'string' ? (() => { try { return JSON.parse(evalPrevious.skills) } catch { return null } })() : evalPrevious.skills)
    : null
  const evalRated = Object.values(evalRatings).filter(v => v > 0)
  const evalOverall = evalRated.length > 0 ? (evalRated.reduce((s, v) => s + v, 0) / evalRated.length).toFixed(1) : '—'

  // ═══ SETUP SCREEN ═══
  if (evalStep === 'setup') {
    return (
      <div className={`${cardBg} rounded-[14px] p-6`}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-lynx-sky/15 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-lynx-sky" />
          </div>
          <div>
            <h2 className={`text-lg font-extrabold ${primaryText}`}>Start Evaluation</h2>
            <p className={`text-xs ${secondaryText}`}>Evaluate your players' skills</p>
          </div>
        </div>

        {/* Eval Type */}
        <div className="mb-5">
          <label className={`text-[11px] font-bold uppercase tracking-wider ${secondaryText}`}>Evaluation Type</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {[
              { id: 'tryout', label: 'Tryout' },
              { id: 'pre_season', label: 'Pre-Season' },
              { id: 'mid_season', label: 'Mid-Season' },
              { id: 'end_season', label: 'End-Season' },
              { id: 'ad_hoc', label: 'Ad Hoc' },
            ].map(t => (
              <button key={t.id} onClick={() => setEvalType(t.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition ${evalType === t.id
                  ? 'bg-lynx-sky text-lynx-navy'
                  : isDark ? 'bg-white/[0.06] text-slate-300 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Player Scope */}
        <div className="mb-5">
          <label className={`text-[11px] font-bold uppercase tracking-wider ${secondaryText}`}>Players</label>
          <div className="flex gap-3 mt-2">
            {[
              { id: 'all', label: `All roster (${rosterLength})` },
              { id: 'selected', label: `Selected (${selectedIdsSize})`, disabled: selectedIdsSize === 0 },
            ].map(s => (
              <label key={s.id} className={`flex items-center gap-2 text-sm ${s.disabled ? 'opacity-40' : ''} ${primaryText}`}>
                <input type="radio" name="evalScope" value={s.id} checked={evalPlayerScope === s.id}
                  onChange={() => setEvalPlayerScope(s.id)} disabled={s.disabled}
                  className="text-lynx-sky focus:ring-lynx-sky" />
                {s.label}
              </label>
            ))}
          </div>
        </div>

        {/* Skills to Rate */}
        <div className="mb-6">
          <label className={`text-[11px] font-bold uppercase tracking-wider ${secondaryText}`}>Skills to Rate</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {ALL_EVAL_SKILLS.map(skill => (
              <label key={skill.key} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm cursor-pointer transition ${evalSkills.includes(skill.key)
                ? 'bg-lynx-sky/15 text-lynx-sky border border-lynx-sky/30'
                : isDark ? 'bg-white/[0.04] text-slate-400 border border-white/[0.06]' : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}>
                <input type="checkbox" checked={evalSkills.includes(skill.key)}
                  onChange={e => {
                    if (e.target.checked) setEvalSkills(prev => [...prev, skill.key])
                    else setEvalSkills(prev => prev.filter(s => s !== skill.key))
                  }}
                  className="hidden" />
                {evalSkills.includes(skill.key) ? <Check className="w-3.5 h-3.5" /> : null}
                {skill.label}
              </label>
            ))}
          </div>
        </div>

        <button onClick={onStartEvaluation} disabled={evalSkills.length === 0}
          className="px-6 py-2.5 rounded-xl bg-lynx-sky text-lynx-navy font-bold hover:bg-lynx-sky/80 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
          Start Evaluation <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    )
  }

  // ═══ RATING CARD ═══
  if (evalStep === 'rating' && currentPlayer) {
    return (
      <div className={`${cardBg} rounded-[14px] p-6`}>
        {/* Nav bar */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={onBackToSetup}
            className={`flex items-center gap-1 text-sm font-bold ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'} transition`}>
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <span className={`text-sm font-bold ${secondaryText}`}>
            Player {evalCurrentIndex + 1} of {evalPlayers.length}
          </span>
          <button onClick={onSkipPlayer}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${isDark ? 'text-slate-400 hover:bg-white/[0.06]' : 'text-slate-500 hover:bg-slate-100'} transition`}>
            Skip
          </button>
        </div>

        {/* Player Info */}
        <div className="flex items-center gap-4 mb-5">
          {currentPlayer.photo_url ? (
            <img src={currentPlayer.photo_url} alt="" className="w-16 h-16 rounded-xl object-cover" />
          ) : (
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-lg font-bold ${isDark ? 'bg-lynx-sky/15 text-lynx-sky' : 'bg-lynx-sky/10 text-lynx-sky'}`}>
              {currentPlayer.first_name?.[0]}{currentPlayer.last_name?.[0]}
            </div>
          )}
          <div>
            <h3 className={`text-lg font-extrabold ${primaryText}`}>{currentPlayer.first_name} {currentPlayer.last_name}</h3>
            <p className={`text-sm ${secondaryText}`}>
              {currentPlayer.jersey_number ? `#${currentPlayer.jersey_number}` : ''}
              {currentPlayer.jersey_number && currentPlayer.position ? ' · ' : ''}
              {currentPlayer.position ? POSITION_NAMES[currentPlayer.position] || currentPlayer.position : ''}
              {currentPlayer.grade ? ` · Grade ${currentPlayer.grade}` : ''}
            </p>
          </div>
        </div>

        {/* Previous Eval */}
        {evalPrevious && (
          <div className={`rounded-[14px] p-4 mb-5 ${isDark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-slate-50 border border-slate-200'}`}>
            <p className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${secondaryText}`}>
              Previous: {evalPrevious.evaluation_type?.replace(/_/g, ' ')} · {evalPrevious.evaluation_date} · Overall: {evalPrevious.overall_score}/10
            </p>
            {evalPrevSkills && (
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {Object.entries(evalPrevSkills).map(([k, v]) => (
                  <span key={k} className={`text-xs ${secondaryText}`}>
                    {k.charAt(0).toUpperCase() + k.slice(1)}: <strong className={primaryText}>{v}</strong>
                  </span>
                ))}
              </div>
            )}
            {evalPrevious.notes && <p className={`text-xs mt-2 italic ${secondaryText}`}>"{evalPrevious.notes}"</p>}
          </div>
        )}

        {/* Skill Ratings */}
        <div className="space-y-3 mb-5">
          <p className={`text-[11px] font-bold uppercase tracking-wider ${secondaryText}`}>Current Evaluation</p>
          {evalSkills.map(skillKey => {
            const skillLabel = ALL_EVAL_SKILLS.find(s => s.key === skillKey)?.label || skillKey
            const currentVal = evalRatings[skillKey] || 0
            const prevVal = evalPrevSkills?.[skillKey]

            return (
              <div key={skillKey} className="flex items-center gap-3">
                <span className={`w-28 text-sm font-medium ${primaryText}`}>{skillLabel}</span>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <button key={n} onClick={() => setEvalRatings(prev => ({ ...prev, [skillKey]: n }))}
                      className={`w-8 h-8 rounded-full text-xs font-bold transition ${n <= currentVal
                        ? 'bg-lynx-sky text-white'
                        : isDark ? 'bg-white/[0.06] text-slate-500 hover:bg-white/10' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}>
                      {n}
                    </button>
                  ))}
                </div>
                <span className={`text-sm font-bold w-8 text-center ${currentVal > 0 ? 'text-lynx-sky' : secondaryText}`}>
                  {currentVal > 0 ? currentVal : '—'}
                </span>
                {prevVal != null && currentVal > 0 && (
                  <span className={`text-xs ${currentVal > prevVal ? 'text-emerald-500' : currentVal < prevVal ? 'text-red-400' : secondaryText}`}>
                    {currentVal > prevVal ? '↑' : currentVal < prevVal ? '↓' : '→'} was {prevVal}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Overall Score */}
        <div className={`rounded-[14px] p-3 mb-5 ${isDark ? 'bg-white/[0.04]' : 'bg-slate-50'}`}>
          <p className={`text-sm ${secondaryText}`}>
            Overall: <span className={`text-lg font-extrabold ${primaryText}`}>{evalOverall}</span>{evalOverall !== '—' && ' / 10'}
          </p>
        </div>

        {/* Notes */}
        <div className="mb-5">
          <label className={`text-[11px] font-bold uppercase tracking-wider ${secondaryText}`}>Notes</label>
          <textarea
            value={evalNotes}
            onChange={e => setEvalNotes(e.target.value)}
            rows={3}
            placeholder="Add evaluation notes..."
            className={`w-full mt-2 px-3 py-2 rounded-xl border text-sm resize-none ${isDark ? 'bg-white/[0.06] border-white/[0.06] text-white placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'}`}
          />
        </div>

        {/* Save & Next */}
        <button onClick={onSaveAndNext} disabled={evalSaving || evalRated.length === 0}
          className="px-6 py-2.5 rounded-xl bg-lynx-sky text-lynx-navy font-bold hover:bg-lynx-sky/80 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
          {evalSaving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {evalCurrentIndex < evalPlayers.length - 1 ? 'Save & Next' : 'Save & Finish'}
        </button>
      </div>
    )
  }

  return null
}
