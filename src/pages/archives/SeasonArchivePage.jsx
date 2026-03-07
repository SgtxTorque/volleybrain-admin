import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import PageShell from '../../components/pages/PageShell'
import SeasonDetailPanel from './SeasonDetailPanel'
import {
  Trophy, Building2, Users, ChevronRight, Target
} from '../../constants/icons'

// ============================================================
// SEASON ARCHIVE PAGE - Historical Season Browser
// ============================================================

const SA_STYLES = `
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes scaleIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
  .sa-au{animation:fadeUp .4s ease-out both}
  .sa-ai{animation:fadeIn .3s ease-out both}
  .sa-as{animation:scaleIn .25s ease-out both}
`

// ======= SEASON CARD =======
function SeasonCard({ season, onClick, isDark, delay }) {
  const cardCls = `${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'} rounded-[14px]`
  const textPrimary = isDark ? 'text-white' : 'text-slate-900'
  const textMuted = 'text-slate-400'

  const completedGames = (season._games || []).filter(g => g.game_result === 'win' || g.game_result === 'loss' || g.game_result === 'tie')
  const wins = (season._games || []).filter(g => g.game_result === 'win').length

  return (
    <button
      onClick={onClick}
      className={`${cardCls} p-5 text-left w-full transition-all hover:shadow-md hover:scale-[1.01] sa-au group`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-r-2xl shrink-0 bg-lynx-navy/10">
          {season.sports?.icon || '🏆'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-bold text-r-sm ${textPrimary} truncate`}>{season.name}</h3>
            <span className={`px-2 py-0.5 text-r-xs rounded-full shrink-0 ${
              season.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400' :
              season.status === 'archived' ? 'bg-purple-500/15 text-purple-400' :
              'bg-slate-500/15 text-slate-400'
            }`}>
              {season.status}
            </span>
          </div>
          <p className={`text-r-sm ${textMuted} mb-2`}>{formatDateRange(season.start_date, season.end_date)}</p>
          <div className="flex items-center gap-4 flex-wrap">
            <span className={`text-r-xs ${textMuted} flex items-center gap-1`}>
              <Users className="w-3 h-3" /> {season._teamCount || 0} teams
            </span>
            <span className={`text-r-xs ${textMuted} flex items-center gap-1`}>
              <Target className="w-3 h-3" /> {season._playerCount || 0} players
            </span>
            {completedGames.length > 0 && (
              <span className={`text-r-xs ${textMuted} flex items-center gap-1`}>
                <Trophy className="w-3 h-3" /> {wins}W-{completedGames.length - wins}L
              </span>
            )}
          </div>
        </div>
        <ChevronRight className={`w-5 h-5 ${textMuted} group-hover:translate-x-1 transition-transform shrink-0 mt-1`} />
      </div>
    </button>
  )
}

function formatDateRange(start, end) {
  const fmt = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''
  if (start && end) return `${fmt(start)} - ${fmt(end)}`
  if (start) return `Started ${fmt(start)}`
  return 'No dates'
}

// ======= MAIN PAGE =======
function SeasonArchivePage({ showToast, onNavigate }) {
  const { user, profile, organization } = useAuth()
  const { isDark } = useTheme()

  const [orgs, setOrgs] = useState([])
  const [selectedOrgId, setSelectedOrgId] = useState(null)
  const [seasons, setSeasons] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSeason, setSelectedSeason] = useState(null)

  const cardCls = `${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'} rounded-[14px]`
  const textPrimary = isDark ? 'text-white' : 'text-slate-900'
  const textMuted = 'text-slate-400'

  useEffect(() => { loadUserOrgs() }, [profile?.id])

  async function loadUserOrgs() {
    if (!profile?.id) return
    setLoading(true)
    try {
      // Get all orgs this user has ever been part of
      const { data: roles } = await supabase
        .from('user_roles')
        .select('organization_id, role, organizations(id, name, slug)')
        .eq('user_id', profile.id)

      // Dedupe orgs
      const orgMap = {}
      ;(roles || []).forEach(r => {
        if (r.organizations?.id && !orgMap[r.organizations.id]) {
          orgMap[r.organizations.id] = { ...r.organizations, roles: [] }
        }
        if (r.organizations?.id) {
          orgMap[r.organizations.id].roles.push(r.role)
        }
      })

      const orgList = Object.values(orgMap)
      setOrgs(orgList)

      // Default to current org or first
      const defaultOrg = organization?.id && orgMap[organization.id] ? organization.id : orgList[0]?.id
      if (defaultOrg) {
        setSelectedOrgId(defaultOrg)
        await loadSeasons(defaultOrg)
      }
    } catch (err) { console.error('Error loading orgs:', err) }
    setLoading(false)
  }

  async function loadSeasons(orgId) {
    try {
      // Fetch past seasons (not active/upcoming)
      const { data: seasonsData } = await supabase
        .from('seasons')
        .select('*, sports(id, name, icon)')
        .eq('organization_id', orgId)
        .not('status', 'in', '("active","upcoming")')
        .order('end_date', { ascending: false })

      // For each season, get counts
      const enriched = await Promise.all((seasonsData || []).map(async (s) => {
        const [teamsRes, gamesRes] = await Promise.all([
          supabase.from('teams').select('id, team_players(id)').eq('season_id', s.id),
          supabase.from('schedule_events').select('id, game_result').eq('season_id', s.id).eq('event_type', 'game'),
        ])
        const teamData = teamsRes.data || []
        return {
          ...s,
          _teamCount: teamData.length,
          _playerCount: teamData.reduce((sum, t) => sum + (t.team_players?.length || 0), 0),
          _games: gamesRes.data || [],
        }
      }))

      setSeasons(enriched)
    } catch (err) { console.error('Error loading seasons:', err) }
  }

  async function handleOrgChange(orgId) {
    setSelectedOrgId(orgId)
    setSeasons([])
    setLoading(true)
    await loadSeasons(orgId)
    setLoading(false)
  }

  const selectedOrg = orgs.find(o => o.id === selectedOrgId)

  return (
    <PageShell
      title="Season Archives"
      breadcrumb="Insights"
      subtitle="Browse past seasons, rosters, and results"
    >
      <style>{SA_STYLES}</style>

      {/* Org Tabs (only if user has multiple orgs) */}
      {orgs.length > 1 && (
        <div className={`${cardCls} p-1.5 mb-6 inline-flex gap-1 sa-au`} style={{ animationDelay: '60ms' }}>
          {orgs.map(org => (
            <button
              key={org.id}
              onClick={() => handleOrgChange(org.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-r-sm font-medium transition-all ${
                selectedOrgId === org.id
                  ? 'bg-lynx-navy text-white font-bold shadow-lg'
                  : `${textMuted} ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-50'}`
              }`}
            >
              <Building2 className="w-4 h-4" />
              {org.name}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-lynx-sky border-t-transparent rounded-full animate-spin" />
        </div>
      ) : seasons.length === 0 ? (
        <div className={`${cardCls} p-12 text-center sa-au`}>
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className={`text-r-2xl font-extrabold ${textPrimary} mb-2`}>No Archived Seasons</h2>
          <p className={`text-r-sm ${textMuted} max-w-sm mx-auto`}>
            {selectedOrg?.name ? `${selectedOrg.name} doesn't have any completed seasons yet.` : 'No past seasons found.'} Completed seasons will appear here as a historical record.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {seasons.map((season, i) => (
            <SeasonCard
              key={season.id}
              season={season}
              onClick={() => setSelectedSeason(season)}
              isDark={isDark}
              delay={i * 50}
            />
          ))}
        </div>
      )}

      {/* Detail Panel */}
      <SeasonDetailPanel
        season={selectedSeason}
        isOpen={!!selectedSeason}
        onClose={() => setSelectedSeason(null)}
        isDark={isDark}
      />
    </PageShell>
  )
}

export { SeasonArchivePage }
