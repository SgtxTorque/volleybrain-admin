// =============================================================================
// PlayerProfileUniformTab - Uniform/jersey preferences tab for PlayerProfilePage
// =============================================================================

import { EditBtn, SaveCancelBtns } from './PlayerProfileUI'
import { getSizeOptionsForPiece, getUniformConfig } from './PlayerProfileConstants'

export default function PlayerProfileUniformTab({
  player, jerseyPrefs, setJerseyPrefs, editingJersey, setEditingJersey,
  saveJerseyPreferences, sportName, primaryTeam, assignedJersey, teamColor, isDark
}) {
  const textCls = isDark ? 'text-white' : 'text-slate-900'
  const mutedCls = 'text-slate-400'
  const altBg = isDark ? 'bg-white/[0.04]' : 'bg-slate-50'
  const inputCls = `w-full px-3 py-2 rounded-lg border text-r-sm font-medium focus:outline-none focus:border-lynx-sky focus:ring-1 focus:ring-lynx-sky/20 ${isDark ? 'bg-lynx-charcoal border-white/[0.06] text-white' : 'bg-white border-slate-200 text-slate-700'}`

  const uniformConfig = getUniformConfig(sportName)
  const topLabel = uniformConfig.top
  const bottomLabel = uniformConfig.bottom
  const extras = uniformConfig.extras || []
  const sizePieces = [{ label: topLabel, value: player.uniform_size_jersey }]
  if (bottomLabel) sizePieces.push({ label: bottomLabel, value: player.uniform_size_shorts })
  extras.forEach(extra => { const key = extra.toLowerCase().replace(/\s+/g, '_'); sizePieces.push({ label: extra, value: player.uniform_sizes_extra?.[key] }) })
  const gridCols = (3 + sizePieces.length) <= 4 ? 'grid-cols-4' : (3 + sizePieces.length) <= 5 ? 'grid-cols-5' : 'grid-cols-4'

  return (
    <div className="space-y-6">
      {/* Current Jersey */}
      <div>
        <h3 className={`text-r-lg font-bold ${textCls} mb-4`}>Current {topLabel}</h3>
        <div className="flex items-center gap-6">
          <div className="w-28 h-32 rounded-[14px] flex flex-col items-center justify-center text-white relative overflow-hidden shadow-lg" style={{ backgroundColor: teamColor }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-3 rounded-b-full" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }} />
            <span className="text-r-3xl font-black mt-2">{assignedJersey || '?'}</span>
            <span className="text-r-xs opacity-80 mt-1 font-medium">{primaryTeam?.name}</span>
          </div>
          <div className="space-y-1">
            <div className={`text-r-sm ${textCls}`}><span className="font-semibold">Number:</span> {assignedJersey ? `#${assignedJersey}` : 'Not assigned yet'}</div>
            {sizePieces.map(piece => (
              <div key={piece.label} className={`text-r-sm ${textCls}`}><span className="font-semibold">{piece.label} Size:</span> {piece.value || 'Not set'}</div>
            ))}
            <div className={`text-r-xs ${mutedCls}`}>{assignedJersey ? 'Assigned by admin' : 'Waiting for admin to assign'}</div>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-r-lg font-bold ${textCls}`}>Your Preferences</h3>
          {!editingJersey && <EditBtn onClick={() => setEditingJersey(true)} />}
        </div>
        {editingJersey ? (
          <div className={`${altBg} rounded-[14px] p-5 space-y-4`}>
            <p className={`text-r-sm ${mutedCls}`}>Set your preferred numbers and uniform sizes.</p>
            <div className="grid grid-cols-3 gap-4">
              {[{ key: 'pref1', label: '1st Choice' }, { key: 'pref2', label: '2nd Choice' }, { key: 'pref3', label: '3rd Choice' }].map(({ key, label }) => (
                <div key={key}>
                  <label className={`block text-r-xs font-bold uppercase tracking-wider ${mutedCls} mb-1.5`}>{label}</label>
                  <input type="number" min="0" max="99" value={jerseyPrefs[key]}
                    onChange={e => setJerseyPrefs({ ...jerseyPrefs, [key]: e.target.value })} placeholder="0-99"
                    className={`${inputCls} text-center text-r-3xl font-bold`} />
                </div>
              ))}
            </div>
            <div className={`grid ${bottomLabel ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
              <div>
                <label className={`block text-r-xs font-bold uppercase tracking-wider ${mutedCls} mb-1.5`}>{topLabel} Size</label>
                <select value={jerseyPrefs.size} onChange={e => setJerseyPrefs({ ...jerseyPrefs, size: e.target.value })} className={inputCls}>
                  <option value="">Select size...</option>
                  {getSizeOptionsForPiece(topLabel).map(group => (
                    <optgroup key={group.group} label={group.group}>{group.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</optgroup>
                  ))}
                </select>
              </div>
              {bottomLabel && (
                <div>
                  <label className={`block text-r-xs font-bold uppercase tracking-wider ${mutedCls} mb-1.5`}>{bottomLabel} Size</label>
                  <select value={jerseyPrefs.bottomSize} onChange={e => setJerseyPrefs({ ...jerseyPrefs, bottomSize: e.target.value })} className={inputCls}>
                    <option value="">Select size...</option>
                    {getSizeOptionsForPiece(bottomLabel).map(group => (
                      <optgroup key={group.group} label={group.group}>{group.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</optgroup>
                    ))}
                  </select>
                </div>
              )}
            </div>
            {extras.length > 0 && (
              <div className={`grid ${extras.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                {extras.map(extra => { const key = extra.toLowerCase().replace(/\s+/g, '_'); return (
                  <div key={key}>
                    <label className={`block text-r-xs font-bold uppercase tracking-wider ${mutedCls} mb-1.5`}>{extra} Size</label>
                    <select value={jerseyPrefs.extras?.[key] || ''} onChange={e => setJerseyPrefs({ ...jerseyPrefs, extras: { ...jerseyPrefs.extras, [key]: e.target.value } })} className={inputCls}>
                      <option value="">Select size...</option>
                      {getSizeOptionsForPiece(extra).map(group => (
                        <optgroup key={group.group} label={group.group}>{group.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</optgroup>
                      ))}
                    </select>
                  </div>
                )})}
              </div>
            )}
            <SaveCancelBtns isDark={isDark} onSave={saveJerseyPreferences} onCancel={() => setEditingJersey(false)} />
          </div>
        ) : (
          <div className={`${altBg} rounded-[14px] p-5`}>
            <div className={`grid ${gridCols} gap-4 text-center`}>
              {['1st Choice', '2nd Choice', '3rd Choice'].map((label, i) => (
                <div key={label}>
                  <p className={`text-r-xs font-bold uppercase tracking-wider ${mutedCls} mb-1`}>{label}</p>
                  <p className={`text-r-3xl font-black ${textCls}`}>{[player.jersey_pref_1, player.jersey_pref_2, player.jersey_pref_3][i] || '-'}</p>
                </div>
              ))}
              {sizePieces.map(piece => (
                <div key={piece.label}>
                  <p className={`text-r-xs font-bold uppercase tracking-wider ${mutedCls} mb-1`}>{piece.label}</p>
                  <p className={`text-r-2xl font-black ${textCls}`}>{piece.value || '-'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
