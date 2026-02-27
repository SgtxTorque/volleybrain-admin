// =============================================================================
// TeamSnapshot — 4-column grid of team cards matching v0 team-snapshot.tsx
// =============================================================================

import React from 'react'
import { ArrowRight } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

const TEAM_COLORS = ['#0d9488', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#ec4899']

export default function TeamSnapshot({ teams, teamStats, onNavigate }) {
  const { isDark } = useTheme()

  // Build team data with player counts and records
  const teamData = (teams || []).map((team, i) => ({
    id: team.id,
    name: team.name,
    players: teamStats?.[team.id]?.playerCount || 0,
    record: teamStats?.[team.id]?.record || '0W-0L',
    color: team.color || TEAM_COLORS[i % TEAM_COLORS.length],
  }))

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Team Snapshot
        </h3>
        <button
          onClick={() => onNavigate('teams')}
          className="flex items-center gap-1 text-sm font-medium transition-colors"
          style={{ color: isDark ? '#5eead4' : '#0d9488' }}
        >
          Manage
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className={`grid gap-4 ${teamData.length >= 4 ? 'grid-cols-4' : teamData.length >= 3 ? 'grid-cols-3' : teamData.length >= 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {teamData.map((team) => (
          <div
            key={team.id}
            className={`group relative overflow-hidden rounded-xl p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${
              isDark
                ? 'bg-slate-800 border border-white/[0.06]'
                : 'bg-white'
            }`}
          >
            <div
              className="absolute top-0 left-0 h-1 w-full rounded-t-2xl"
              style={{ backgroundColor: team.color }}
            />
            <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{team.name}</h4>
            <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{team.players} players</p>
            <p className="mt-2 text-sm font-semibold" style={{ color: isDark ? '#5eead4' : '#0d9488' }}>{team.record}</p>
          </div>
        ))}
        {teamData.length === 0 && (
          <div className={`col-span-4 rounded-xl p-8 text-center shadow-sm ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>No teams yet. Create your first team to get started.</p>
          </div>
        )}
      </div>
    </section>
  )
}
