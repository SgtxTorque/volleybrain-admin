import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import {
  Clock, ChevronRight, Trophy, Building2
} from '../../constants/icons'

// ============================================
// ORG MEMBERSHIPS SECTION
// ============================================
export function OrgMembershipsSection({ profile, isDark, tc }) {
  const navigate = useNavigate()
  const [memberships, setMemberships] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadMemberships() }, [profile?.id])

  async function loadMemberships() {
    if (!profile?.id) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('id, role, is_active, created_at, organization_id')
        .eq('user_id', profile.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      // Fetch org details separately (user_roles lacks FK to organizations in PostgREST)
      if (data?.length) {
        const orgIds = [...new Set(data.map(d => d.organization_id).filter(Boolean))]
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id, name, slug, logo_url')
          .in('id', orgIds)
        const orgMap = {}
        for (const o of (orgs || [])) orgMap[o.id] = o
        for (const m of data) m.organizations = orgMap[m.organization_id] || null
      }

      setMemberships(data || [])
    } catch (err) {
      console.error('Error loading memberships:', err)
    }
    setLoading(false)
  }

  const roleLabels = {
    league_admin: 'League Admin',
    admin: 'Admin',
    assistant_admin: 'Assistant Admin',
    registrar: 'Registrar',
    treasurer: 'Treasurer',
    coach: 'Coach',
    parent: 'Parent',
    player: 'Player',
  }

  const roleColorMap = {
    league_admin: 'bg-violet-500/[0.15] text-violet-500',
    admin: 'bg-violet-500/[0.15] text-violet-500',
    assistant_admin: 'bg-indigo-500/[0.15] text-indigo-500',
    registrar: 'bg-blue-500/[0.15] text-blue-500',
    treasurer: 'bg-emerald-500/[0.15] text-emerald-500',
    coach: 'bg-blue-500/[0.15] text-blue-500',
    parent: 'bg-green-500/[0.15] text-green-500',
    player: 'bg-amber-500/[0.15] text-amber-500',
  }

  const cardCls = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-slate-200'
  const rowBg = isDark ? 'bg-white/[0.03]' : 'bg-lynx-cloud'

  if (loading) {
    return (
      <div className={`${cardCls} rounded-[14px] p-6 animate-fade-in`}>
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-lynx-sky border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className={`${cardCls} rounded-[14px] p-6 animate-fade-in`}>
      <h2 className={`text-r-xs font-bold uppercase tracking-wider ${tc.textMuted} mb-5 flex items-center gap-2`}>
        <Building2 className="w-4 h-4 text-lynx-sky" />
        Organization Memberships
      </h2>

      {memberships.length === 0 ? (
        <div className="text-center py-6">
          <Building2 className={`w-8 h-8 mx-auto mb-2 ${tc.textMuted}`} />
          <p className={`text-r-sm ${tc.textMuted} mb-3`}>You are not part of any organization yet</p>
          <button
            onClick={() => navigate('/directory')}
            className="px-4 py-2 rounded-lg text-r-sm font-bold text-white bg-lynx-navy hover:brightness-110 transition"
          >
            Browse Org Directory
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {memberships.map(m => (
            <div key={m.id} className={`flex items-center gap-3 p-3 rounded-lg ${rowBg}`}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-r-sm font-bold overflow-hidden bg-lynx-sky/[0.12]">
                {m.organizations?.logo_url ? (
                  <img src={m.organizations.logo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-5 h-5 text-lynx-sky" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-r-sm font-semibold ${tc.text} truncate`}>{m.organizations?.name || 'Unknown Org'}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${roleColorMap[m.role] || 'bg-slate-500/[0.15] text-slate-500'}`}>
                    {roleLabels[m.role] || m.role}
                  </span>
                  {m.created_at && (
                    <span className={`text-[10px] ${tc.textMuted} flex items-center gap-1`}>
                      <Clock className="w-3 h-3" />
                      Joined {new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// MY HISTORY SECTION
// ============================================
export function MyHistorySection({ profile, isDark, tc, onNavigateToArchive }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadHistory() }, [profile?.id])

  async function loadHistory() {
    if (!profile?.id) return
    setLoading(true)
    try {
      const entries = []

      // Get coach participation
      const { data: coachRecords } = await supabase
        .from('coaches')
        .select('id, first_name, last_name, season_id, seasons(id, name, sport, start_date, end_date, status, organization_id, organizations(id, name))')
        .eq('profile_id', profile.id)

      if (coachRecords) {
        for (const c of coachRecords) {
          if (!c.seasons) continue
          // Get team names via team_coaches
          const { data: tcData } = await supabase
            .from('team_coaches')
            .select('teams(name)')
            .eq('coach_id', c.id)
          const teamNames = tcData?.map(t => t.teams?.name).filter(Boolean) || []

          entries.push({
            id: `coach-${c.id}`,
            seasonId: c.seasons.id,
            orgName: c.seasons.organizations?.name || 'Unknown Org',
            seasonName: c.seasons.name,
            sport: c.seasons.sport,
            role: 'Coach',
            teamNames,
            startDate: c.seasons.start_date,
            endDate: c.seasons.end_date,
            status: c.seasons.status,
          })
        }
      }

      // Get player participation (for users who are also players)
      const { data: playerRecords } = await supabase
        .from('players')
        .select('id, first_name, last_name, team_players(team_id, teams(name, season_id, seasons(id, name, sport, start_date, end_date, status, organization_id, organizations(id, name))))')
        .eq('parent_account_id', profile.id)

      if (playerRecords) {
        for (const p of playerRecords) {
          const seenSeasons = new Set()
          for (const tp of (p.team_players || [])) {
            const s = tp.teams?.seasons
            if (!s || seenSeasons.has(s.id)) continue
            seenSeasons.add(s.id)
            // Collect all teams for this player in this season
            const teamNames = (p.team_players || [])
              .filter(tp2 => tp2.teams?.seasons?.id === s.id)
              .map(tp2 => tp2.teams?.name)
              .filter(Boolean)

            entries.push({
              id: `parent-${p.id}-${s.id}`,
              seasonId: s.id,
              orgName: s.organizations?.name || 'Unknown Org',
              seasonName: s.name,
              sport: s.sport,
              role: 'Parent',
              playerName: `${p.first_name} ${p.last_name}`,
              teamNames,
              startDate: s.start_date,
              endDate: s.end_date,
              status: s.status,
            })
          }
        }
      }

      // Get admin participation via user_roles
      const { data: roleRecords } = await supabase
        .from('user_roles')
        .select('role, organization_id')
        .eq('user_id', profile.id)
        .eq('is_active', true)

      // Fetch org names separately (user_roles lacks FK to organizations in PostgREST)
      if (roleRecords?.length) {
        const rOrgIds = [...new Set(roleRecords.map(r => r.organization_id).filter(Boolean))]
        const { data: rOrgs } = await supabase
          .from('organizations')
          .select('id, name')
          .in('id', rOrgIds)
        const rOrgMap = {}
        for (const o of (rOrgs || [])) rOrgMap[o.id] = o
        for (const r of roleRecords) r.organizations = rOrgMap[r.organization_id] || null
      }

      if (roleRecords) {
        for (const r of roleRecords) {
          if (r.role !== 'admin') continue
          // Get seasons for this org
          const { data: orgSeasons } = await supabase
            .from('seasons')
            .select('id, name, sport, start_date, end_date, status')
            .eq('organization_id', r.organization_id)
            .not('status', 'in', '("active","upcoming")')

          for (const s of (orgSeasons || [])) {
            // Avoid duplicates (admin may also be coach)
            if (entries.some(e => e.seasonId === s.id && e.role === 'Admin')) continue
            entries.push({
              id: `admin-${r.organization_id}-${s.id}`,
              seasonId: s.id,
              orgName: r.organizations?.name || 'Unknown Org',
              seasonName: s.name,
              sport: s.sport,
              role: 'Admin',
              teamNames: [],
              startDate: s.start_date,
              endDate: s.end_date,
              status: s.status,
            })
          }
        }
      }

      // Sort by start_date descending
      entries.sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''))
      setHistory(entries)
    } catch (err) {
      console.error('Error loading history:', err)
    }
    setLoading(false)
  }

  function formatRange(start, end) {
    const fmt = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''
    if (start && end) return `${fmt(start)} - ${fmt(end)}`
    if (start) return `Started ${fmt(start)}`
    return ''
  }

  const sportEmoji = (sport) => {
    const map = { volleyball: '🏐', basketball: '🏀', soccer: '⚽', baseball: '⚾', football: '🏈' }
    return map[sport?.toLowerCase()] || '🏆'
  }

  const cardCls = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-slate-200'
  const rowBg = isDark ? 'bg-white/[0.03] hover:bg-white/[0.06]' : 'bg-lynx-cloud hover:bg-slate-100'

  if (loading) {
    return (
      <div className={`${cardCls} rounded-[14px] p-6 animate-fade-in`}>
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-lynx-sky border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className={`${cardCls} rounded-[14px] p-6 animate-fade-in`}>
      <h2 className={`text-r-xs font-bold uppercase tracking-wider ${tc.textMuted} mb-5 flex items-center gap-2`}>
        <Trophy className="w-4 h-4 text-lynx-sky" />
        My History
      </h2>

      {history.length === 0 ? (
        <p className={`text-r-sm ${tc.textMuted}`}>No past season history found</p>
      ) : (
        <div className="space-y-3">
          {history.map(entry => (
            <button
              key={entry.id}
              onClick={() => onNavigateToArchive?.(entry.seasonId)}
              className={`w-full text-left flex items-center gap-4 p-4 rounded-lg transition-all hover:scale-[1.01] ${rowBg}`}
            >
              <div className="w-12 h-12 rounded-lg flex items-center justify-center text-lg shrink-0 bg-lynx-sky/[0.12]">
                {sportEmoji(entry.sport)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className={`text-r-sm font-semibold ${tc.text} truncate`}>{entry.seasonName}</p>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                      entry.role === 'Coach' ? 'bg-blue-500/[0.15] text-blue-500' :
                      entry.role === 'Admin' ? 'bg-violet-500/[0.15] text-violet-500' :
                      'bg-green-500/[0.15] text-green-500'
                    }`}
                  >
                    {entry.role}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className={`w-3 h-3 ${tc.textMuted} shrink-0`} />
                  <span className={`text-r-xs ${tc.textMuted} truncate`}>{entry.orgName}</span>
                </div>
                {entry.teamNames?.length > 0 && (
                  <p className={`text-r-xs ${tc.textMuted} mt-0.5 truncate`}>
                    {entry.teamNames.join(', ')}
                    {entry.playerName && ` (${entry.playerName})`}
                  </p>
                )}
                {entry.startDate && (
                  <p className={`text-r-xs ${tc.textMuted} mt-0.5`}>{formatRange(entry.startDate, entry.endDate)}</p>
                )}
              </div>

              <ChevronRight className={`w-4 h-4 ${tc.textMuted} shrink-0`} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
