// =============================================================================
// JerseyActionPanel — Right-side contextual panel for jersey management
// Shows: conflict resolution, size request, number assignment, resolution queue
// =============================================================================

import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import {
  X, AlertTriangle, Bell, Sparkles, Edit, Check, User
} from '../../constants/icons'

const JERSEY_SIZES = [
  { value: 'YXS', label: 'Youth XS' },
  { value: 'YS', label: 'Youth S' },
  { value: 'YM', label: 'Youth M' },
  { value: 'YL', label: 'Youth L' },
  { value: 'YXL', label: 'Youth XL' },
  { value: 'AS', label: 'Adult S' },
  { value: 'AM', label: 'Adult M' },
  { value: 'AL', label: 'Adult L' },
  { value: 'AXL', label: 'Adult XL' },
  { value: 'A2XL', label: 'Adult 2XL' },
  { value: 'A3XL', label: 'Adult 3XL' },
]

export default function JerseyActionPanel({
  selectedPlayer,
  allPlayers,
  conflicts,
  onAssign,
  onUpdateSize,
  onAutoAssign,
  onClose,
  showToast,
  autoAssigning,
}) {
  const { isDark } = useTheme()
  const tc = useThemeClasses()

  const cardBg = isDark
    ? 'bg-white/[0.03] border border-white/[0.06]'
    : 'bg-slate-50 border border-[#E8ECF2]'
  const divider = isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'

  // Compute global stats for resolution queue
  const needsNumberCount = allPlayers.filter(p => !p.jersey_number).length
  const needsSizeCount = allPlayers.filter(p => p.jersey_number && !p.player?.uniform_size_jersey).length

  // If a player is selected, determine what panel to show
  if (selectedPlayer) {
    const player = selectedPlayer.player
    if (!player) return null

    const hasNumber = !!selectedPlayer.jersey_number
    const hasSize = !!player.uniform_size_jersey
    const teamPlayers = allPlayers.filter(p => p.team_id === selectedPlayer.team_id)
    const teamTaken = new Set(
      teamPlayers.filter(p => p.jersey_number && p.id !== selectedPlayer.id).map(p => p.jersey_number)
    )
    const prefs = [player.jersey_pref_1, player.jersey_pref_2, player.jersey_pref_3].filter(Boolean)

    // Available numbers for quick picks
    const available = []
    for (let i = 1; i <= 99 && available.length < 20; i++) {
      if (!teamTaken.has(i)) available.push(i)
    }

    // CASE A: Needs number — show assignment panel
    if (!hasNumber) {
      return (
        <div className={`rounded-2xl flex flex-col sticky top-4 max-h-[calc(100vh-120px)] overflow-hidden ${
          isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-[#E8ECF2] shadow-sm'
        }`}>
          {/* Header */}
          <div className={`px-5 py-4 border-b ${divider} shrink-0`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
                style={{ fontFamily: 'var(--v2-font)' }}>
                Assign Number
              </span>
              <button onClick={onClose}
                className={`w-6 h-6 rounded-md flex items-center justify-center transition ${
                  isDark ? 'text-slate-500 hover:bg-white/[0.06] hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                }`}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Player info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: `${selectedPlayer.team?.color || '#888'}25`, color: selectedPlayer.team?.color || '#888' }}>
                {player.photo_url ? (
                  <img src={player.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  `${player.first_name?.[0] || ''}${player.last_name?.[0] || ''}`
                )}
              </div>
              <div>
                <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
                  {player.first_name} {player.last_name}
                </h2>
                <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {selectedPlayer.team?.name} {hasSize ? `· ${player.uniform_size_jersey}` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Preferences */}
            <div>
              <h3 className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
                style={{ fontFamily: 'var(--v2-font)' }}>
                Preferences
              </h3>
              {prefs.length > 0 ? (
                <div className="flex gap-2">
                  {prefs.map((n, i) => {
                    const taken = teamTaken.has(n)
                    return (
                      <button key={i}
                        onClick={() => !taken && onAssign(selectedPlayer.player.id, selectedPlayer.id, selectedPlayer.team_id, n, ['1st', '2nd', '3rd'][i])}
                        disabled={taken}
                        className={`flex-1 py-3 rounded-xl text-center transition ${
                          taken
                            ? `${cardBg} opacity-50 cursor-not-allowed`
                            : 'bg-[#22C55E]/10 border border-[#22C55E]/20 hover:bg-[#22C55E]/20 cursor-pointer'
                        }`}>
                        <div className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {['1st', '2nd', '3rd'][i]}
                        </div>
                        <div className={`text-lg font-black ${taken ? 'line-through text-red-500' : isDark ? 'text-white' : 'text-[#10284C]'}`}>
                          #{n}
                        </div>
                        {taken && <div className="text-[9px] text-red-500 font-bold">Taken</div>}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className={`text-xs italic ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                  No preferences set by parent
                </p>
              )}
            </div>

            {/* Quick picks */}
            <div>
              <h3 className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
                style={{ fontFamily: 'var(--v2-font)' }}>
                Quick Picks (Available)
              </h3>
              <div className="grid grid-cols-5 gap-1.5">
                {available.map(num => {
                  const isPref = prefs.includes(num)
                  return (
                    <button key={num}
                      onClick={() => onAssign(selectedPlayer.player.id, selectedPlayer.id, selectedPlayer.team_id, num, isPref ? (num === prefs[0] ? '1st' : num === prefs[1] ? '2nd' : '3rd') : 'manual')}
                      className={`h-9 rounded-lg text-sm font-bold transition ${
                        isPref
                          ? 'bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] hover:bg-[#22C55E]/25'
                          : isDark
                            ? 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] border border-white/[0.06]'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-[#E8ECF2]'
                      }`}>
                      {num}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )
    }

    // CASE B: Has number but needs size — show size request panel
    if (!hasSize) {
      return (
        <div className={`rounded-2xl flex flex-col sticky top-4 max-h-[calc(100vh-120px)] overflow-hidden ${
          isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-[#E8ECF2] shadow-sm'
        }`}>
          <div className={`px-5 py-4 border-b ${divider} shrink-0`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
                style={{ fontFamily: 'var(--v2-font)' }}>
                Size Request
              </span>
              <button onClick={onClose}
                className={`w-6 h-6 rounded-md flex items-center justify-center transition ${
                  isDark ? 'text-slate-500 hover:bg-white/[0.06] hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                }`}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: `${selectedPlayer.team?.color || '#888'}25`, color: selectedPlayer.team?.color || '#888' }}>
                {player.photo_url ? (
                  <img src={player.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  `${player.first_name?.[0] || ''}${player.last_name?.[0] || ''}`
                )}
              </div>
              <div>
                <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
                  {player.first_name} {player.last_name}
                </h2>
                <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {selectedPlayer.team?.name} · #{selectedPlayer.jersey_number}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Alert */}
            <div className={`rounded-xl p-4 ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className={`text-xs font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>Missing Jersey Size</span>
              </div>
              <p className={`text-xs ${isDark ? 'text-amber-400/70' : 'text-amber-600'}`}>
                This player's parent hasn't submitted a jersey size yet.
              </p>
            </div>

            {/* Send reminder */}
            <button
              onClick={() => {
                const msg = `Hi, we need ${player.first_name}'s jersey size to place the order. Please update it in the app.`
                navigator.clipboard?.writeText(msg)
                showToast?.(`Size request message copied for ${player.first_name}`, 'success')
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-[#4BB9EC] text-white hover:brightness-110 transition">
              <Bell className="w-3.5 h-3.5" /> Copy Size Reminder
            </button>

            {/* Manual override */}
            <div>
              <h3 className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
                style={{ fontFamily: 'var(--v2-font)' }}>
                Set Size Manually
              </h3>
              <div className="grid grid-cols-2 gap-1.5">
                {JERSEY_SIZES.map(s => (
                  <button key={s.value}
                    onClick={() => onUpdateSize(player.id, s.value)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${
                      isDark
                        ? 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] border border-white/[0.06]'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-[#E8ECF2]'
                    }`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    }

    // CASE C: Player is fully ready — show summary
    return (
      <div className={`rounded-2xl flex flex-col sticky top-4 max-h-[calc(100vh-120px)] overflow-hidden ${
        isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-[#E8ECF2] shadow-sm'
      }`}>
        <div className={`px-5 py-4 border-b ${divider} shrink-0`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
              style={{ fontFamily: 'var(--v2-font)' }}>
              Player Detail
            </span>
            <button onClick={onClose}
              className={`w-6 h-6 rounded-md flex items-center justify-center transition ${
                isDark ? 'text-slate-500 hover:bg-white/[0.06] hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
              }`}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white"
              style={{ backgroundColor: selectedPlayer.team?.color || '#10284C' }}>
              {selectedPlayer.jersey_number}
            </div>
            <div>
              <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
                {player.first_name} {player.last_name}
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {selectedPlayer.team?.name} · {player.uniform_size_jersey}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <div className={`${cardBg} rounded-xl p-4 text-center`}>
            <Check className="w-8 h-8 text-[#22C55E] mx-auto mb-2" />
            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>Ready to Order</p>
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Number #{selectedPlayer.jersey_number} · Size {player.uniform_size_jersey}
            </p>
          </div>
          {prefs.length > 0 && (
            <div>
              <h3 className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Original Preferences
              </h3>
              <div className="flex gap-2">
                {prefs.map((n, i) => (
                  <span key={i} className={`px-2 py-1 rounded-lg text-xs font-bold ${
                    n === selectedPlayer.jersey_number
                      ? 'bg-[#22C55E]/15 text-[#22C55E]'
                      : isDark ? 'bg-white/[0.04] text-slate-500' : 'bg-slate-100 text-slate-400'
                  }`}>#{n}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // DEFAULT: No player selected — show Resolution Queue
  return (
    <div className={`rounded-2xl flex flex-col sticky top-4 max-h-[calc(100vh-120px)] overflow-hidden ${
      isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-[#E8ECF2] shadow-sm'
    }`}>
      <div className={`px-5 py-4 border-b ${divider} shrink-0`}>
        <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
          style={{ fontFamily: 'var(--v2-font)' }}>
          Resolution Queue
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {/* Conflicts */}
        {conflicts > 0 && (
          <div className={`${isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'} rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className={`text-sm font-bold ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                {conflicts} Number Conflict{conflicts !== 1 ? 's' : ''}
              </span>
            </div>
            <p className={`text-xs ${isDark ? 'text-red-400/60' : 'text-red-600/70'}`}>
              Click a conflicted player to resolve
            </p>
          </div>
        )}

        {/* Missing sizes */}
        {needsSizeCount > 0 && (
          <div className={`${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'} rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className={`text-sm font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                {needsSizeCount} Missing Size{needsSizeCount !== 1 ? 's' : ''}
              </span>
            </div>
            <p className={`text-xs ${isDark ? 'text-amber-400/60' : 'text-amber-600/70'}`}>
              Click a player to send reminder or set manually
            </p>
          </div>
        )}

        {/* Unassigned numbers */}
        {needsNumberCount > 0 && (
          <div className={`${isDark ? 'bg-[#4BB9EC]/10 border border-[#4BB9EC]/20' : 'bg-sky-50 border border-sky-200'} rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4BB9EC]" />
              <span className={`text-sm font-bold ${isDark ? 'text-[#4BB9EC]' : 'text-sky-700'}`}>
                {needsNumberCount} Unassigned Number{needsNumberCount !== 1 ? 's' : ''}
              </span>
            </div>
            <button
              onClick={onAutoAssign}
              disabled={autoAssigning}
              className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#4BB9EC] text-white hover:brightness-110 transition disabled:opacity-50">
              {autoAssigning ? (
                <><div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" /> Assigning...</>
              ) : (
                <><Sparkles className="w-3.5 h-3.5" /> Auto-Assign Remaining</>
              )}
            </button>
          </div>
        )}

        {/* All clear */}
        {conflicts === 0 && needsSizeCount === 0 && needsNumberCount === 0 && (
          <div className="text-center py-8">
            <Check className={`w-12 h-12 mx-auto mb-3 text-[#22C55E]`} />
            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>All Clear</p>
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              No issues to resolve. All players are ready.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
