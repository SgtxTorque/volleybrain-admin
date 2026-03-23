// =============================================================================
// TeamDetailPanel — Inline right column OR overlay slideout panel
// When `inline` prop is true: static card for 2-column layout
// When `inline` is false/absent: slides in from right edge with overlay
// =============================================================================

import { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { X, ExternalLink, Edit, Users, UserCog, Shield, Trash2, AlertTriangle } from 'lucide-react'

// ---------- Status chip ----------
function StatusChip({ roster_open, playerCount, maxRoster }) {
  if (playerCount >= maxRoster) {
    return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-500/12 text-red-500">Full</span>
  }
  if (roster_open) {
    return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/12 text-emerald-500">Open</span>
  }
  return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/12 text-amber-500">Closed</span>
}

// ---------- Type badge ----------
function TypeBadge({ teamType, isDark }) {
  const label = (teamType || 'rec').charAt(0).toUpperCase() + (teamType || 'rec').slice(1)
  const style = teamType === 'competitive'
    ? 'bg-lynx-sky/15 text-lynx-sky'
    : teamType === 'travel'
      ? 'bg-purple-500/12 text-purple-500'
      : isDark ? 'bg-white/[0.06] text-slate-400' : 'bg-emerald-50 text-emerald-600'

  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${style}`}>
      {label}
    </span>
  )
}

// ---------- Player row ----------
function PlayerRow({ player, isDark }) {
  const initials = `${(player.first_name || '?').charAt(0)}${(player.last_name || '').charAt(0)}`

  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
      isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-lynx-frost'
    }`}>
      {/* Avatar */}
      {player.photo_url ? (
        <img
          src={player.photo_url}
          alt=""
          className="w-9 h-9 rounded-lg object-cover shrink-0"
        />
      ) : (
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-r-xs font-bold shrink-0 ${
          isDark ? 'bg-white/[0.06] text-slate-300' : 'bg-slate-100 text-slate-600'
        }`}>
          {initials}
        </div>
      )}

      {/* Name + position */}
      <div className="min-w-0 flex-1">
        <p className={`text-r-sm font-semibold truncate ${isDark ? 'text-white' : 'text-lynx-navy'}`}>
          {player.first_name} {player.last_name}
        </p>
        {player.position && (
          <p className={`text-r-xs truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {player.position}
          </p>
        )}
      </div>

      {/* Jersey number */}
      {player.jersey_number != null && (
        <span className={`text-r-sm font-bold tabular-nums px-2.5 py-0.5 rounded-lg ${
          isDark ? 'bg-white/[0.06] text-slate-300' : 'bg-slate-100 text-slate-600'
        }`}>
          #{player.jersey_number}
        </span>
      )}
    </div>
  )
}

// =============================================================================
// TeamDetailPanel
// =============================================================================
export default function TeamDetailPanel({
  team,
  onClose,
  onEditTeam,
  onManageRoster,
  onAssignCoaches,
  onToggleRosterOpen,
  onNavigateToWall,
  onDeleteTeam,
  inline = false,
}) {
  const { isDark } = useTheme()
  const [open, setOpen] = useState(inline ? true : false)

  // Animate in on mount (overlay mode only)
  useEffect(() => {
    if (inline) return
    const raf = requestAnimationFrame(() => setOpen(true))
    return () => cancelAnimationFrame(raf)
  }, [inline])

  // Animate out then call onClose (overlay mode)
  function handleClose() {
    if (inline) {
      onClose?.()
      return
    }
    setOpen(false)
    setTimeout(() => onClose?.(), 300)
  }

  // Derived data
  const players = (team.team_players || []).map(tp => tp.players).filter(Boolean)
  const playerCount = players.length
  const maxRoster = team.max_roster_size || 12
  const fillPercent = maxRoster > 0 ? Math.round((playerCount / maxRoster) * 100) : 0
  const health = Math.min(fillPercent, 100)

  // Alert conditions
  const alerts = []
  if (playerCount === 0) alerts.push('No players rostered')
  if (team.min_roster_size > 0 && playerCount < team.min_roster_size) alerts.push(`Need ${team.min_roster_size - playerCount} more players`)
  if (playerCount > maxRoster) alerts.push('Over roster capacity')

  const cardBg = isDark
    ? 'bg-white/[0.03] border border-white/[0.06]'
    : 'bg-slate-50 border border-[#E8ECF2]'

  const divider = isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'

  // ---------- CONTENT (shared between inline and overlay) ----------
  const panelContent = (
    <>
      {/* ---- Header ---- */}
      <div className={`px-5 py-4 border-b ${divider} shrink-0`}>
        {inline && (
          <div className="flex items-center justify-between mb-3">
            <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
              style={{ fontFamily: 'var(--v2-font)' }}>
              Active Detail
            </span>
            <button
              onClick={handleClose}
              className={`w-6 h-6 rounded-md flex items-center justify-center transition ${
                isDark ? 'text-slate-500 hover:bg-white/[0.06] hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-4 h-4 rounded-full shrink-0 ring-2 ring-offset-2"
              style={{
                backgroundColor: team.color || '#888',
                ringColor: team.color || '#888',
                '--tw-ring-offset-color': isDark ? '#0f172a' : '#ffffff',
              }}
            />
            <h2 className={`text-lg font-bold truncate ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
              {team.name}
            </h2>
          </div>

          {!inline && (
            <button
              onClick={handleClose}
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition ${
                isDark ? 'text-slate-400 hover:bg-white/[0.06] hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <TypeBadge teamType={team.team_type} isDark={isDark} />
          <StatusChip roster_open={team.roster_open} playerCount={playerCount} maxRoster={maxRoster} />
          {team.age_group && (
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
              isDark ? 'bg-white/[0.06] text-slate-400' : 'bg-slate-100 text-slate-500'
            }`}>
              {team.age_group}
            </span>
          )}
          {team.gender && team.gender !== 'coed' && (
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
              isDark ? 'bg-white/[0.06] text-slate-400' : 'bg-slate-100 text-slate-500'
            }`}>
              {team.gender.charAt(0).toUpperCase() + team.gender.slice(1)}
            </span>
          )}
        </div>
      </div>

      {/* ---- Scrollable content ---- */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {/* Alert card */}
        {alerts.length > 0 && (
          <div className={`rounded-xl p-3 flex items-start gap-2.5 ${
            isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'
          }`}>
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              {alerts.map((a, i) => (
                <p key={i} className={`text-xs font-semibold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>{a}</p>
              ))}
            </div>
          </div>
        )}

        {/* Health Index + Roster Stats — 2-col grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`${cardBg} rounded-xl p-3 text-center`}>
            <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
              style={{ fontFamily: 'var(--v2-font)' }}>
              Health Index
            </span>
            <span className={`text-2xl font-black tabular-nums ${
              health > 80 ? 'text-[#22C55E]' : health > 50 ? 'text-amber-500' : 'text-red-500'
            }`}>
              {health}
            </span>
          </div>
          <div className={`${cardBg} rounded-xl p-3 text-center`}>
            <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
              style={{ fontFamily: 'var(--v2-font)' }}>
              Roster Fill
            </span>
            <span className={`text-2xl font-black tabular-nums ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
              {playerCount}/{maxRoster}
            </span>
          </div>
        </div>

        {/* Roster fill bar */}
        <div className={`${cardBg} rounded-xl p-3`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Roster Progress</span>
            <span className={`text-xs font-bold tabular-nums ${
              fillPercent >= 100 ? 'text-[#22C55E]' : fillPercent < 50 ? 'text-red-500' : isDark ? 'text-white' : 'text-[#10284C]'
            }`}>{fillPercent}%</span>
          </div>
          <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.08]' : 'bg-slate-200'}`}>
            <div className={`h-full rounded-full transition-all ${
              fillPercent >= 100 ? 'bg-[#22C55E]' : fillPercent < 50 ? 'bg-red-500' : 'bg-[#4BB9EC]'
            }`} style={{ width: `${Math.min(fillPercent, 100)}%` }} />
          </div>
        </div>

        {/* Description */}
        {team.description && (
          <div className={`${cardBg} rounded-xl p-3`}>
            <h3 className={`text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Description</h3>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{team.description}</p>
          </div>
        )}

        {/* Internal Notes */}
        {team.internal_notes && (
          <div className={`${cardBg} rounded-xl p-3`}>
            <h3 className={`text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Internal Notes</h3>
            <p className={`text-xs leading-relaxed italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{team.internal_notes}</p>
          </div>
        )}

        {/* Roster Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
              style={{ fontFamily: 'var(--v2-font)' }}>
              Roster ({playerCount})
            </h3>
          </div>

          {playerCount > 0 ? (
            <div className={`${cardBg} rounded-xl divide-y ${isDark ? 'divide-white/[0.04]' : 'divide-slate-100'}`}>
              {players.map(player => (
                <PlayerRow key={player.id} player={player} isDark={isDark} />
              ))}
            </div>
          ) : (
            <div className={`${cardBg} rounded-xl p-5 text-center`}>
              <Users className={`w-7 h-7 mx-auto mb-2 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No players on this roster yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ---- Actions Section (pinned to bottom) ---- */}
      <div className={`px-5 py-3 border-t ${divider} shrink-0 space-y-2`}>
        <div className="flex gap-2">
          <button
            onClick={() => { onNavigateToWall?.(team.id); handleClose() }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#4BB9EC] hover:brightness-110 transition bg-[#4BB9EC]/10"
          >
            <ExternalLink className="w-3.5 h-3.5" /> View Wall
          </button>
          <button
            onClick={() => { onEditTeam?.(team); handleClose() }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
              isDark ? 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Edit className="w-3.5 h-3.5" /> Edit
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => { onManageRoster?.(team); handleClose() }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#10284C] text-white hover:brightness-110 transition"
          >
            <Users className="w-3.5 h-3.5" /> Roster
          </button>
          <button
            onClick={() => { onAssignCoaches?.(team); handleClose() }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
              isDark ? 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <UserCog className="w-3.5 h-3.5" /> Coaches
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => { onToggleRosterOpen?.(team); handleClose() }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
              isDark ? 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> {team.roster_open ? 'Close' : 'Open'}
          </button>
          <button
            onClick={() => { onDeleteTeam?.(team.id); handleClose() }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/10 transition"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>
    </>
  )

  // ---------- INLINE MODE — static card ----------
  if (inline) {
    return (
      <div className={`rounded-2xl flex flex-col sticky top-4 max-h-[calc(100vh-120px)] overflow-hidden ${
        isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-[#E8ECF2] shadow-sm'
      }`}>
        {panelContent}
      </div>
    )
  }

  // ---------- OVERLAY MODE — slideout ----------
  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />
      <div
        className={`fixed right-0 top-0 h-screen w-[420px] z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        } ${isDark ? 'bg-lynx-midnight border-l border-white/[0.06]' : 'bg-white border-l border-[#E8ECF2]'}`}
      >
        {panelContent}
      </div>
    </>
  )
}
