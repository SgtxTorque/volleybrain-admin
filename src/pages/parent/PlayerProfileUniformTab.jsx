// =============================================================================
// PlayerProfileUniformTab - Uniform/jersey preferences — side-by-side layout
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
  const inputCls = `w-full px-3 py-2 rounded-lg border text-r-sm font-medium focus:outline-none focus:border-[#4BB9EC] focus:ring-1 focus:ring-[#4BB9EC]/20 ${isDark ? 'bg-white/[0.03] border-white/[0.06] text-white' : 'bg-white border-slate-200 text-slate-700'}`

  const uniformConfig = getUniformConfig(sportName)
  const topLabel = uniformConfig.top
  const bottomLabel = uniformConfig.bottom
  const extras = uniformConfig.extras || []
  const sizePieces = [{ label: topLabel, value: player.uniform_size_jersey }]
  if (bottomLabel) sizePieces.push({ label: bottomLabel, value: player.uniform_size_shorts })
  extras.forEach(extra => { const key = extra.toLowerCase().replace(/\s+/g, '_'); sizePieces.push({ label: extra, value: player.uniform_sizes_extra?.[key] }) })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left: Current Jersey Visual */}
      <div>
        <h3 className={`text-sm font-bold ${textCls} mb-2`}>Current {topLabel}</h3>
        <div className={`${altBg} rounded-[14px] p-4`}>
          <div className="flex items-center gap-5">
            <div className="w-24 h-28 rounded-[14px] flex flex-col items-center justify-center text-white relative overflow-hidden shadow-lg flex-shrink-0" style={{ backgroundColor: teamColor }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-2.5 rounded-b-full" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }} />
              <span className="text-3xl font-black mt-1">{assignedJersey || '?'}</span>
              <span className="text-[10px] opacity-80 mt-0.5 font-medium">{primaryTeam?.name}</span>
            </div>
            <div className="space-y-1">
              <div className={`text-sm ${textCls}`}><span className="font-semibold">Number:</span> {assignedJersey ? `#${assignedJersey}` : 'Not assigned'}</div>
              {sizePieces.map(piece => (
                <div key={piece.label} className={`text-sm ${textCls}`}><span className="font-semibold">{piece.label}:</span> {piece.value || 'Not set'}</div>
              ))}
              <div className={`text-xs ${mutedCls}`}>{assignedJersey ? 'Assigned by admin' : 'Waiting for admin'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Preferences */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className={`text-sm font-bold ${textCls}`}>Your Preferences</h3>
          {!editingJersey && <EditBtn onClick={() => setEditingJersey(true)} />}
        </div>
        {editingJersey ? (
          <div className={`${altBg} rounded-[14px] p-4 space-y-3`}>
            <p className={`text-xs ${mutedCls}`}>Set your preferred numbers and sizes.</p>
            <div className="grid grid-cols-3 gap-3">
              {[{ key: 'pref1', label: '1st' }, { key: 'pref2', label: '2nd' }, { key: 'pref3', label: '3rd' }].map(({ key, label }) => (
                <div key={key}>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider ${mutedCls} mb-1`}>{label}</label>
                  <input type="number" min="0" max="99" value={jerseyPrefs[key]}
                    onChange={e => setJerseyPrefs({ ...jerseyPrefs, [key]: e.target.value })} placeholder="0-99"
                    className={`${inputCls} text-center text-2xl font-bold`} />
                </div>
              ))}
            </div>
            <div className={`grid ${bottomLabel ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider ${mutedCls} mb-1`}>{topLabel} Size</label>
                <select value={jerseyPrefs.size} onChange={e => setJerseyPrefs({ ...jerseyPrefs, size: e.target.value })} className={inputCls}>
                  <option value="">Select...</option>
                  {getSizeOptionsForPiece(topLabel).map(group => (
                    <optgroup key={group.group} label={group.group}>{group.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</optgroup>
                  ))}
                </select>
              </div>
              {bottomLabel && (
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider ${mutedCls} mb-1`}>{bottomLabel} Size</label>
                  <select value={jerseyPrefs.bottomSize} onChange={e => setJerseyPrefs({ ...jerseyPrefs, bottomSize: e.target.value })} className={inputCls}>
                    <option value="">Select...</option>
                    {getSizeOptionsForPiece(bottomLabel).map(group => (
                      <optgroup key={group.group} label={group.group}>{group.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</optgroup>
                    ))}
                  </select>
                </div>
              )}
            </div>
            {extras.length > 0 && (
              <div className={`grid ${extras.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
                {extras.map(extra => { const key = extra.toLowerCase().replace(/\s+/g, '_'); return (
                  <div key={key}>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider ${mutedCls} mb-1`}>{extra} Size</label>
                    <select value={jerseyPrefs.extras?.[key] || ''} onChange={e => setJerseyPrefs({ ...jerseyPrefs, extras: { ...jerseyPrefs.extras, [key]: e.target.value } })} className={inputCls}>
                      <option value="">Select...</option>
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
          <div className={`${altBg} rounded-[14px] p-4`}>
            <div className="grid grid-cols-3 gap-3 text-center">
              {['1st', '2nd', '3rd'].map((label, i) => (
                <div key={label}>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${mutedCls} mb-0.5`}>{label}</p>
                  <p className={`text-2xl font-black ${textCls}`}>{[player.jersey_pref_1, player.jersey_pref_2, player.jersey_pref_3][i] || '-'}</p>
                </div>
              ))}
            </div>
            {sizePieces.length > 0 && (
              <div className={`grid grid-cols-${Math.min(sizePieces.length, 3)} gap-3 text-center mt-3 pt-3 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
                {sizePieces.map(piece => (
                  <div key={piece.label}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${mutedCls} mb-0.5`}>{piece.label}</p>
                    <p className={`text-lg font-black ${textCls}`}>{piece.value || '-'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
