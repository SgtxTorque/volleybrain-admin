import { useState } from 'react'
import { useTheme, useThemeClasses } from '../../../contexts/ThemeContext'

const ROLE_COLORS = {
  OH: '#EF4444', S: '#10B981', MB: '#F59E0B', OPP: '#6366F1',
  L: '#FFEAA7', DS: '#DDA0DD', H: '#EF4444',
  PG: '#3B82F6', SG: '#10B981', SF: '#F59E0B', PF: '#EF4444', C: '#8B5CF6',
  GK: '#F59E0B', DEF: '#3B82F6', MID: '#10B981', FWD: '#EF4444',
}

const TABS = [
  { id: 'roster', label: 'Roster' },
  { id: 'rotations', label: 'Rotations' },
  { id: 'subs', label: 'Subs' },
  { id: 'analytics', label: 'Analytics' },
]

// ============================================
// ROSTER TAB
// ============================================
function RosterTab({ roster, lineup, rsvps, liberoId, formation, isDark, tc, onDragStart, onDragEnd, onSetLibero }) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const onCourtIds = new Set(Object.values(lineup))
  const showLibero = formation !== '6-6'

  const filtered = roster.filter(p => {
    if (search) {
      const q = search.toLowerCase()
      if (!p.first_name?.toLowerCase().includes(q) && !p.last_name?.toLowerCase().includes(q) && !String(p.jersey_number).includes(q)) return false
    }
    if (filter === 'starters') return onCourtIds.has(p.id)
    if (filter === 'bench') return !onCourtIds.has(p.id)
    return true
  })

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search players..."
          className={`w-full px-3 py-1.5 rounded-lg text-xs ${
            isDark ? 'bg-lynx-graphite border-lynx-border-dark text-white placeholder:text-slate-500' : 'bg-lynx-frost border-lynx-silver text-lynx-navy placeholder:text-lynx-slate'
          } border outline-none focus:ring-1 focus:ring-[var(--accent-primary)]`}
        />
      </div>

      {/* Filter pills */}
      <div className="flex gap-1 px-3 pb-2">
        {['all', 'starters', 'bench'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold capitalize transition-colors ${
              filter === f
                ? 'text-white'
                : `${tc.textMuted} ${isDark ? 'bg-lynx-graphite' : 'bg-lynx-frost'}`
            }`}
            style={filter === f ? { backgroundColor: 'var(--accent-primary)' } : {}}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Player list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
        {filtered.map(player => {
          const isOnCourt = onCourtIds.has(player.id)
          const rsvpStatus = rsvps[player.id]
          const isLibero = player.id === liberoId

          return (
            <div
              key={player.id}
              draggable
              onDragStart={(e) => onDragStart(e, player)}
              onDragEnd={onDragEnd}
              className={`flex items-center gap-2.5 p-2 rounded-xl cursor-grab active:cursor-grabbing transition-colors ${
                isOnCourt
                  ? isDark ? 'bg-lynx-graphite/50 opacity-60' : 'bg-lynx-frost/50 opacity-60'
                  : isDark ? 'bg-lynx-graphite hover:bg-lynx-graphite/80' : 'bg-lynx-frost hover:bg-white'
              } border ${isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'}`}
              style={{ borderRadius: 'var(--v2-radius)' }}
            >
              {/* Photo */}
              <div className="w-11 h-11 rounded-lg overflow-hidden bg-slate-600/30 flex-shrink-0">
                {player.photo_url ? (
                  <img src={player.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center text-xs font-bold ${tc.textMuted}`}>
                    {player.first_name?.[0]}{player.last_name?.[0]}
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-bold ${tc.text}`}>#{player.jersey_number}</span>
                  <span className={`text-xs ${tc.text} truncate`}>{player.first_name} {player.last_name?.[0]}.</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {player.team_position && (
                    <span className="flex items-center gap-1">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: ROLE_COLORS[player.team_position?.toUpperCase()] || '#64748B' }}
                      />
                      <span className={`text-[10px] font-semibold`} style={{ color: ROLE_COLORS[player.team_position?.toUpperCase()] || (isDark ? '#94a3b8' : '#64748b') }}>
                        {player.team_position}
                      </span>
                    </span>
                  )}
                  {isLibero && (
                    <span className="text-[9px] font-bold px-1 rounded bg-yellow-400/20 text-yellow-400">L</span>
                  )}
                </div>
              </div>
              {/* Status indicators */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {rsvpStatus && (
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    rsvpStatus === 'yes' || rsvpStatus === 'attending' ? 'bg-emerald-400' :
                    rsvpStatus === 'maybe' ? 'bg-amber-400' : 'bg-red-400'
                  }`} />
                )}
                {isOnCourt && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                    On Court
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Libero selector */}
      {showLibero && (
        <div className={`px-3 py-2 border-t ${isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'}`}>
          <div className={`text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${tc.textMuted}`}>Libero</div>
          <div className="flex flex-wrap gap-1">
            {roster.slice(0, 14).map(p => (
              <button
                key={p.id}
                onClick={() => onSetLibero(liberoId === p.id ? null : p.id)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                  p.id === liberoId
                    ? 'bg-yellow-400 text-black'
                    : `${tc.textMuted} ${isDark ? 'bg-lynx-graphite' : 'bg-lynx-frost'}`
                }`}
              >
                #{p.jersey_number}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// ROTATIONS TAB
// ============================================
function RotationsTab({ positions, lineup, roster, currentRotation, sportConfig, isDark, tc, onRotationClick }) {
  const rotationCount = sportConfig?.rotationCount || 6
  const rotationOrder = [1, 2, 3, 4, 5, 6]

  function getPlayerAtRotation(positionId, rotation) {
    const posIndex = rotationOrder.indexOf(positionId)
    const sourceIndex = (posIndex + rotation) % 6
    const sourcePosition = rotationOrder[sourceIndex]
    return lineup[sourcePosition]
  }

  return (
    <div className="p-3 space-y-3 overflow-y-auto">
      <div className={`text-xs font-semibold ${tc.textMuted} uppercase tracking-wider`}>All Rotations</div>
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: rotationCount }, (_, i) => i).map(rot => {
          const isActive = rot === currentRotation
          return (
            <button
              key={rot}
              onClick={() => onRotationClick(rot)}
              className={`p-2 rounded-xl border-2 transition-all ${
                isActive
                  ? 'border-[var(--accent-primary)] shadow-sm'
                  : isDark ? 'border-lynx-border-dark hover:border-slate-500' : 'border-lynx-silver hover:border-slate-300'
              } ${isDark ? 'bg-lynx-graphite' : 'bg-lynx-frost'}`}
              style={{ borderRadius: 'var(--v2-radius)' }}
            >
              <div className={`text-[10px] font-bold mb-1 ${isActive ? 'text-[var(--accent-primary)]' : tc.textMuted}`}>
                Rot {rot + 1}
              </div>
              {/* Mini 2x3 grid */}
              <div className="grid grid-cols-3 gap-0.5">
                {/* Front row: P4, P3, P2 */}
                {[4, 3, 2].map(posId => {
                  const playerId = getPlayerAtRotation(posId, rot)
                  const player = playerId ? roster.find(p => p.id === playerId) : null
                  return (
                    <div
                      key={posId}
                      className={`w-7 h-7 rounded text-[8px] font-bold flex items-center justify-center ${
                        player
                          ? isDark ? 'bg-lynx-charcoal text-white' : 'bg-white text-lynx-navy'
                          : isDark ? 'bg-lynx-charcoal/50 text-slate-600' : 'bg-white/50 text-slate-300'
                      }`}
                    >
                      {player ? `#${player.jersey_number}` : '—'}
                    </div>
                  )
                })}
                {/* Back row: P5, P6, P1 */}
                {[5, 6, 1].map(posId => {
                  const playerId = getPlayerAtRotation(posId, rot)
                  const player = playerId ? roster.find(p => p.id === playerId) : null
                  return (
                    <div
                      key={posId}
                      className={`w-7 h-7 rounded text-[8px] font-bold flex items-center justify-center ${
                        player
                          ? isDark ? 'bg-lynx-charcoal text-white' : 'bg-white text-lynx-navy'
                          : isDark ? 'bg-lynx-charcoal/50 text-slate-600' : 'bg-white/50 text-slate-300'
                      }`}
                    >
                      {player ? `#${player.jersey_number}` : '—'}
                    </div>
                  )
                })}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// SUBSTITUTIONS TAB (FUNCTIONAL)
// ============================================
function SubstitutionsTab({ plannedSubs, roster, lineup, currentRotation, sportConfig, formation, isDark, tc, onAddSub, onRemoveSub }) {
  const [showForm, setShowForm] = useState(false)
  const [subRotation, setSubRotation] = useState(1)
  const [outPlayerId, setOutPlayerId] = useState('')
  const [inPlayerId, setInPlayerId] = useState('')

  const subLimit = formation === '6-6' ? 999 : 12

  // Starters = players currently in lineup
  const starters = Object.entries(lineup).map(([posId, playerId]) => {
    const player = roster.find(p => p.id === playerId)
    return player ? { ...player, positionId: posId } : null
  }).filter(Boolean)

  // Bench = roster minus starters minus libero
  const starterIds = new Set(Object.values(lineup))
  const benchPlayers = roster.filter(p => !starterIds.has(p.id))

  function handleAddSub() {
    if (!outPlayerId || !inPlayerId) return
    onAddSub({
      id: `${Date.now()}`,
      rotation: subRotation,
      outPlayerId,
      inPlayerId,
    })
    setOutPlayerId('')
    setInPlayerId('')
    setShowForm(false)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 space-y-3 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className={`text-xs font-semibold ${tc.textMuted} uppercase tracking-wider`}>Substitution Plan</div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-lynx-graphite' : 'bg-lynx-frost'} ${tc.textMuted}`}>
            {plannedSubs.length}/{subLimit === 999 ? '∞' : subLimit} SUBS
          </span>
        </div>

        {/* Planned subs list */}
        {plannedSubs.length === 0 && !showForm ? (
          <div className={`text-center py-8 ${tc.textMuted}`}>
            <div className="text-2xl mb-2">🔄</div>
            <div className="text-xs">No substitutions planned</div>
            <div className="text-[10px] mt-1">Tap + to plan a substitution</div>
          </div>
        ) : (
          <div className="space-y-1.5">
            {plannedSubs.map((sub) => {
              const outPlayer = roster.find(p => p.id === sub.outPlayerId)
              const inPlayer = roster.find(p => p.id === sub.inPlayerId)
              return (
                <div
                  key={sub.id}
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-xs ${
                    isDark ? 'bg-lynx-graphite border-lynx-border-dark' : 'bg-lynx-frost border-lynx-silver'
                  } border`}
                >
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isDark ? 'bg-lynx-charcoal' : 'bg-white'
                  } ${tc.textMuted}`}>R{sub.rotation}</span>
                  <span className="text-red-400 font-semibold">#{outPlayer?.jersey_number} {outPlayer?.first_name}</span>
                  <span className={tc.textMuted}>→</span>
                  <span className="text-emerald-400 font-semibold">#{inPlayer?.jersey_number} {inPlayer?.first_name}</span>
                  <button onClick={() => onRemoveSub(sub.id)} className="ml-auto text-red-400 hover:text-red-300 text-base leading-none">×</button>
                </div>
              )
            })}
          </div>
        )}

        {/* Add sub form */}
        {showForm && (
          <div className={`p-3 rounded-xl border space-y-2.5 ${
            isDark ? 'bg-lynx-graphite border-lynx-border-dark' : 'bg-lynx-frost border-lynx-silver'
          }`}>
            <div className={`text-[10px] font-bold uppercase tracking-wider ${tc.textMuted}`}>New Substitution</div>

            {/* Rotation picker */}
            <div>
              <label className={`text-[10px] ${tc.textMuted} block mb-1`}>Rotation</label>
              <div className="flex gap-1">
                {Array.from({ length: sportConfig?.rotationCount || 6 }, (_, i) => i + 1).map(r => (
                  <button
                    key={r}
                    onClick={() => setSubRotation(r)}
                    className={`w-7 h-7 rounded-lg text-[10px] font-bold transition-colors ${
                      subRotation === r
                        ? 'text-white'
                        : `${tc.textMuted} ${isDark ? 'bg-lynx-charcoal' : 'bg-white'}`
                    }`}
                    style={subRotation === r ? { backgroundColor: 'var(--accent-primary)' } : {}}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Player OUT */}
            <div>
              <label className={`text-[10px] ${tc.textMuted} block mb-1`}>Player OUT</label>
              <select
                value={outPlayerId}
                onChange={e => setOutPlayerId(e.target.value)}
                className={`w-full px-2 py-1.5 rounded-lg text-xs border outline-none ${
                  isDark ? 'bg-lynx-charcoal border-lynx-border-dark text-white' : 'bg-white border-lynx-silver text-lynx-navy'
                }`}
              >
                <option value="">Select starter...</option>
                {starters.map(p => (
                  <option key={p.id} value={p.id}>#{p.jersey_number} {p.first_name} {p.last_name?.[0]}.</option>
                ))}
              </select>
            </div>

            {/* Player IN */}
            <div>
              <label className={`text-[10px] ${tc.textMuted} block mb-1`}>Player IN</label>
              <select
                value={inPlayerId}
                onChange={e => setInPlayerId(e.target.value)}
                className={`w-full px-2 py-1.5 rounded-lg text-xs border outline-none ${
                  isDark ? 'bg-lynx-charcoal border-lynx-border-dark text-white' : 'bg-white border-lynx-silver text-lynx-navy'
                }`}
              >
                <option value="">Select bench player...</option>
                {benchPlayers.map(p => (
                  <option key={p.id} value={p.id}>#{p.jersey_number} {p.first_name} {p.last_name?.[0]}.</option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowForm(false)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold ${tc.textMuted} border ${
                  isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleAddSub}
                disabled={!outPlayerId || !inPlayerId}
                className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold text-white disabled:opacity-40"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                Add Sub
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add button */}
      {!showForm && plannedSubs.length < subLimit && (
        <div className={`p-3 border-t ${isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'}`}>
          <button
            onClick={() => setShowForm(true)}
            className={`w-full py-2 rounded-xl text-xs font-semibold transition-colors ${tc.textSecondary} ${tc.hoverBg} border ${
              isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'
            }`}
          >
            + Plan Substitution
          </button>
        </div>
      )}
    </div>
  )
}

// ============================================
// ANALYTICS TAB (PLACEHOLDER)
// ============================================
function AnalyticsTab({ isDark, tc }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="text-3xl mb-3">📊</div>
      <div className={`text-sm font-semibold ${tc.text} mb-1`}>Analytics Coming Soon</div>
      <div className={`text-xs ${tc.textMuted} max-w-[240px]`}>
        Player performance data, matchup insights, and lineup efficiency will appear here once game data is available.
      </div>
    </div>
  )
}

// ============================================
// RIGHT PANEL (MAIN)
// ============================================
export default function RightPanel({
  roster, lineup, rsvps, liberoId, plannedSubs, formation,
  positions, currentRotation, sportConfig, formations,
  getPlayerAtPosition, onDragStart, onDragEnd,
  onSetLibero, onRotationClick, onAddSub, onRemoveSub
}) {
  const { isDark } = useTheme()
  const tc = useThemeClasses()
  const [activeTab, setActiveTab] = useState('roster')

  return (
    <div
      className={`flex flex-col h-full border-l ${
        isDark ? 'bg-lynx-charcoal border-lynx-border-dark' : 'bg-white border-lynx-silver'
      }`}
      style={{ width: 420, minWidth: 420, maxWidth: 480, flex: '0 0 420px' }}
    >
      {/* Tab bar */}
      <div className={`flex border-b flex-shrink-0 ${isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'}`}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 text-[11px] font-semibold transition-colors relative ${
              activeTab === tab.id ? tc.text : tc.textMuted
            }`}
          >
            {tab.label}
            {tab.id === 'subs' && plannedSubs?.length > 0 && (
              <span className="ml-1 text-[9px] font-bold px-1 py-0 rounded-full bg-amber-500/20 text-amber-400">
                {plannedSubs.length}
              </span>
            )}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full" style={{ backgroundColor: 'var(--accent-primary)' }} />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'roster' && (
          <RosterTab
            roster={roster} lineup={lineup} rsvps={rsvps} liberoId={liberoId}
            formation={formation}
            isDark={isDark} tc={tc}
            onDragStart={onDragStart} onDragEnd={onDragEnd} onSetLibero={onSetLibero}
          />
        )}
        {activeTab === 'rotations' && (
          <RotationsTab
            positions={positions} lineup={lineup} roster={roster}
            currentRotation={currentRotation} sportConfig={sportConfig}
            isDark={isDark} tc={tc} onRotationClick={onRotationClick}
          />
        )}
        {activeTab === 'subs' && (
          <SubstitutionsTab
            plannedSubs={plannedSubs || []}
            roster={roster} lineup={lineup}
            currentRotation={currentRotation} sportConfig={sportConfig}
            formation={formation}
            isDark={isDark} tc={tc}
            onAddSub={onAddSub} onRemoveSub={onRemoveSub}
          />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsTab isDark={isDark} tc={tc} />
        )}
      </div>
    </div>
  )
}
