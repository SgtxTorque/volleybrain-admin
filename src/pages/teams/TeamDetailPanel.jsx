// =============================================================================
// TeamDetailPanel — Right-side slideout panel showing comprehensive team details
// Slides in from the right edge, overlay behind, click overlay to close
// =============================================================================

import { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { X, ExternalLink, Edit, Users, UserCog, Shield, Trash2 } from 'lucide-react'

// ---------- Status chip (mirrors TeamsTableView logic) ----------
function StatusChip({ roster_open, playerCount, maxRoster }) {
  if (playerCount >= maxRoster) {
    return <span className="text-r-xs font-bold px-2.5 py-0.5 rounded-full bg-red-500/12 text-red-500">Full</span>
  }
  if (roster_open) {
    return <span className="text-r-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/12 text-emerald-500">Open</span>
  }
  return <span className="text-r-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/12 text-amber-500">Closed</span>
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
    <span className={`text-r-xs font-bold px-2.5 py-0.5 rounded-full ${style}`}>
      {label}
    </span>
  )
}

// ---------- Health bar (reused logic from TeamsTableView) ----------
function HealthBar({ current, max, isDark }) {
  const pct = max > 0 ? Math.round((current / max) * 100) : 0
  const barStyle = pct >= 75
    ? 'bg-gradient-to-r from-lynx-sky to-emerald-500'
    : pct >= 40
      ? 'bg-gradient-to-r from-amber-400 to-amber-500'
      : 'bg-gradient-to-r from-red-400 to-red-500'
  const textColor = pct >= 75 ? 'text-emerald-500' : pct >= 40 ? 'text-amber-500' : 'text-red-500'

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-[6px] rounded-full bg-slate-200 dark:bg-white/[0.08]">
        <div className={`h-full rounded-full ${barStyle} transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className={`text-r-sm font-bold tabular-nums ${textColor}`}>{pct}%</span>
    </div>
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
}) {
  const { isDark } = useTheme()
  const [open, setOpen] = useState(false)

  // Animate in on mount
  useEffect(() => {
    // Small delay so the initial translate-x-full renders first, then transitions to translate-x-0
    const raf = requestAnimationFrame(() => setOpen(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  // Animate out then call onClose
  function handleClose() {
    setOpen(false)
    setTimeout(() => onClose?.(), 300) // match transition duration
  }

  // Derived data
  const players = (team.team_players || []).map(tp => tp.players).filter(Boolean)
  const playerCount = players.length
  const maxRoster = team.max_roster_size || 12
  const pct = maxRoster > 0 ? Math.round((playerCount / maxRoster) * 100) : 0

  // Panel and overlay classes
  const panelBg = isDark
    ? 'bg-lynx-midnight border-l border-white/[0.06]'
    : 'bg-white border-l border-lynx-silver'

  const cardBg = isDark
    ? 'bg-white/[0.03] border border-white/[0.06]'
    : 'bg-slate-50 border border-lynx-silver'

  const divider = isDark ? 'border-white/[0.06]' : 'border-lynx-silver'

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-screen w-[420px] z-50 ${panelBg} shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* ---- Header ---- */}
        <div className={`px-6 py-5 border-b ${divider} shrink-0`}>
          <div className="flex items-start justify-between gap-3">
            {/* Team name + color swatch */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-4 h-4 rounded-full shrink-0 ring-2 ring-offset-2"
                style={{
                  backgroundColor: team.color || '#888',
                  ringColor: team.color || '#888',
                  '--tw-ring-offset-color': isDark ? '#0f172a' : '#ffffff',
                }}
              />
              <h2 className={`text-r-xl font-bold truncate ${isDark ? 'text-white' : 'text-lynx-navy'}`}>
                {team.name}
              </h2>
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition ${
                isDark
                  ? 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
                  : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Badges row */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <TypeBadge teamType={team.team_type} isDark={isDark} />
            <StatusChip roster_open={team.roster_open} playerCount={playerCount} maxRoster={maxRoster} />
            {team.age_group && (
              <span className={`text-r-xs font-medium px-2.5 py-0.5 rounded-full ${
                isDark ? 'bg-white/[0.06] text-slate-400' : 'bg-slate-100 text-slate-500'
              }`}>
                {team.age_group}
              </span>
            )}
            {team.gender && team.gender !== 'coed' && (
              <span className={`text-r-xs font-medium px-2.5 py-0.5 rounded-full ${
                isDark ? 'bg-white/[0.06] text-slate-400' : 'bg-slate-100 text-slate-500'
              }`}>
                {team.gender.charAt(0).toUpperCase() + team.gender.slice(1)}
              </span>
            )}
          </div>
        </div>

        {/* ---- Scrollable content ---- */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Quick Stats */}
          <div className={`${cardBg} rounded-[14px] p-4 space-y-3`}>
            <div className="flex items-center justify-between">
              <span className={`text-r-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Roster Size
              </span>
              <span className={`text-r-base font-bold tabular-nums ${isDark ? 'text-white' : 'text-lynx-navy'}`}>
                {playerCount} / {maxRoster}
              </span>
            </div>
            <HealthBar current={playerCount} max={maxRoster} isDark={isDark} />
            {team.min_roster_size > 0 && playerCount < team.min_roster_size && (
              <p className="text-r-xs text-amber-500 font-medium">
                Minimum roster size is {team.min_roster_size} — need {team.min_roster_size - playerCount} more
              </p>
            )}
          </div>

          {/* Description (if present) */}
          {team.description && (
            <div className={`${cardBg} rounded-[14px] p-4`}>
              <h3 className={`text-r-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Description
              </h3>
              <p className={`text-r-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {team.description}
              </p>
            </div>
          )}

          {/* Internal Notes (if present) */}
          {team.internal_notes && (
            <div className={`${cardBg} rounded-[14px] p-4`}>
              <h3 className={`text-r-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Internal Notes
              </h3>
              <p className={`text-r-sm leading-relaxed italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {team.internal_notes}
              </p>
            </div>
          )}

          {/* Roster Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-r-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Roster ({playerCount})
              </h3>
            </div>

            {playerCount > 0 ? (
              <div className={`${cardBg} rounded-[14px] divide-y ${isDark ? 'divide-white/[0.04]' : 'divide-slate-100'}`}>
                {players.map(player => (
                  <PlayerRow key={player.id} player={player} isDark={isDark} />
                ))}
              </div>
            ) : (
              <div className={`${cardBg} rounded-[14px] p-6 text-center`}>
                <Users className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                <p className={`text-r-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  No players on this roster yet
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ---- Actions Section (pinned to bottom) ---- */}
        <div className={`px-6 py-4 border-t ${divider} shrink-0 space-y-2`}>
          {/* Primary row */}
          <div className="flex gap-2">
            <button
              onClick={() => { onNavigateToWall?.(team.id); handleClose() }}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-r-sm font-semibold text-lynx-sky hover:brightness-110 transition bg-lynx-sky/10"
            >
              <ExternalLink className="w-4 h-4" /> View Wall
            </button>
            <button
              onClick={() => { onEditTeam?.(team); handleClose() }}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-r-sm font-semibold transition ${
                isDark
                  ? 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Edit className="w-4 h-4" /> Edit Team
            </button>
          </div>

          {/* Secondary row */}
          <div className="flex gap-2">
            <button
              onClick={() => { onManageRoster?.(team); handleClose() }}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-r-sm font-bold bg-lynx-navy text-white hover:brightness-110 transition"
            >
              <Users className="w-4 h-4" /> Manage Roster
            </button>
            <button
              onClick={() => { onAssignCoaches?.(team); handleClose() }}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-r-sm font-semibold transition ${
                isDark
                  ? 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <UserCog className="w-4 h-4" /> Assign Coaches
            </button>
          </div>

          {/* Utility row */}
          <div className="flex gap-2">
            <button
              onClick={() => { onToggleRosterOpen?.(team); handleClose() }}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-r-sm font-semibold transition ${
                isDark
                  ? 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Shield className="w-4 h-4" /> {team.roster_open ? 'Close Roster' : 'Open Roster'}
            </button>
            <button
              onClick={() => { onDeleteTeam?.(team.id); handleClose() }}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-r-sm font-semibold text-red-500 hover:bg-red-500/10 transition"
            >
              <Trash2 className="w-4 h-4" /> Delete Team
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
