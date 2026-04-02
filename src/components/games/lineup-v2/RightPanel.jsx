import { useState } from 'react'
import { useTheme, useThemeClasses } from '../../../contexts/ThemeContext'

const TABS = [
  { id: 'roster', label: 'Roster' },
  { id: 'rotations', label: 'Rotations' },
  { id: 'subs', label: 'Subs' },
  { id: 'analytics', label: 'Analytics' },
]

// ============================================
// ROSTER TAB
// ============================================
function RosterTab({ roster, lineup, rsvps, liberoId, isDark, tc, onDragStart, onDragEnd, onSetLibero }) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const onCourtIds = new Set(Object.values(lineup))

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
              className={`flex items-center gap-2 p-2 rounded-xl cursor-grab active:cursor-grabbing transition-colors ${
                isOnCourt
                  ? isDark ? 'bg-lynx-graphite/50 opacity-60' : 'bg-lynx-frost/50 opacity-60'
                  : isDark ? 'bg-lynx-graphite hover:bg-lynx-graphite/80' : 'bg-lynx-frost hover:bg-white'
              } border ${isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'}`}
              style={{ borderRadius: 'var(--v2-radius)' }}
            >
              {/* Photo */}
              <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-600/30 flex-shrink-0">
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
                <div className="flex items-center gap-1 mt-0.5">
                  {player.team_position && (
                    <span className={`text-[10px] ${tc.textMuted}`}>{player.team_position}</span>
                  )}
                  {isLibero && (
                    <span className="text-[9px] font-bold px-1 rounded bg-yellow-400/20 text-yellow-400">L</span>
                  )}
                </div>
              </div>
              {/* Status indicators */}
              <div className="flex items-center gap-1">
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
      <div className={`px-3 py-2 border-t ${isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'}`}>
        <div className={`text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${tc.textMuted}`}>Libero</div>
        <div className="flex flex-wrap gap-1">
          {roster.slice(0, 12).map(p => (
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
// SUBSTITUTIONS TAB
// ============================================
function SubstitutionsTab({ subs, roster, lineup, isDark, tc, onAddSub, onRemoveSub }) {
  const subEntries = Object.entries(subs)

  return (
    <div className="p-3 space-y-3 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className={`text-xs font-semibold ${tc.textMuted} uppercase tracking-wider`}>Substitution Plan</div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-lynx-graphite' : 'bg-lynx-frost'} ${tc.textMuted}`}>
          {subEntries.length}/12 SUBS
        </span>
      </div>

      {subEntries.length === 0 ? (
        <div className={`text-center py-8 ${tc.textMuted}`}>
          <div className="text-2xl mb-2">🔄</div>
          <div className="text-xs">No substitutions planned</div>
          <div className="text-[10px] mt-1">Use the roster tab to set your lineup first</div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {subEntries.map(([posId, benchPlayerId]) => {
            const outPlayer = roster.find(p => p.id === lineup[posId])
            const inPlayer = roster.find(p => p.id === benchPlayerId)
            return (
              <div
                key={posId}
                className={`flex items-center gap-2 p-2 rounded-xl text-xs ${
                  isDark ? 'bg-lynx-graphite border-lynx-border-dark' : 'bg-lynx-frost border-lynx-silver'
                } border`}
              >
                <span className={tc.textMuted}>P{posId}:</span>
                <span className="text-red-400 font-semibold">#{outPlayer?.jersey_number} {outPlayer?.first_name}</span>
                <span className={tc.textMuted}>→</span>
                <span className="text-emerald-400 font-semibold">#{inPlayer?.jersey_number} {inPlayer?.first_name}</span>
                <button onClick={() => onRemoveSub(posId)} className="ml-auto text-red-400 hover:text-red-300">×</button>
              </div>
            )
          })}
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
  roster, lineup, rsvps, liberoId, subs,
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
      style={{ width: 380 }}
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
            subs={subs} roster={roster} lineup={lineup}
            isDark={isDark} tc={tc} onAddSub={onAddSub} onRemoveSub={onRemoveSub}
          />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsTab isDark={isDark} tc={tc} />
        )}
      </div>
    </div>
  )
}
