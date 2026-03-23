import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { Search, Users, MessageCircle, Star, ChevronRight } from '../../constants/icons'
import PageShell from '../../components/pages/PageShell'

export default function TeamHubSelectorPage({ showToast, navigateToTeamWall }) {
  const { organization } = useAuth()
  const { workingSeason } = useSeason()
  const tc = useThemeClasses()
  const { isDark } = useTheme()

  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadTeams()
  }, [organization?.id, workingSeason?.id])

  async function loadTeams() {
    if (!organization?.id) return
    setLoading(true)
    try {
      // Get teams with player counts
      let query = supabase
        .from('teams')
        .select(`
          id, name, color, logo_url, season_id,
          team_players(count),
          team_coaches(count)
        `)
        .order('name')

      if (workingSeason?.id && workingSeason.id !== 'all') {
        query = query.eq('season_id', workingSeason.id)
      }

      const { data, error } = await query
      if (error) throw error

      // Get post counts and shoutout counts per team
      const teamIds = (data || []).map(t => t.id)
      let postCounts = {}
      let shoutoutCounts = {}

      if (teamIds.length > 0) {
        const { data: posts } = await supabase
          .from('team_posts')
          .select('team_id')
          .in('team_id', teamIds)
          .eq('is_published', true)

        ;(posts || []).forEach(p => {
          postCounts[p.team_id] = (postCounts[p.team_id] || 0) + 1
        })

        const { data: shoutouts } = await supabase
          .from('shoutouts')
          .select('team_id')
          .in('team_id', teamIds)

        ;(shoutouts || []).forEach(s => {
          shoutoutCounts[s.team_id] = (shoutoutCounts[s.team_id] || 0) + 1
        })
      }

      const enriched = (data || []).map(team => ({
        ...team,
        playerCount: team.team_players?.[0]?.count || 0,
        coachCount: team.team_coaches?.[0]?.count || 0,
        postCount: postCounts[team.id] || 0,
        shoutoutCount: shoutoutCounts[team.id] || 0,
      }))

      setTeams(enriched)
    } catch (err) {
      console.error('Load teams error:', err)
    }
    setLoading(false)
  }

  const filtered = teams.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  // Org-wide totals
  const totals = {
    players: teams.reduce((s, t) => s + t.playerCount, 0),
    posts: teams.reduce((s, t) => s + t.postCount, 0),
    shoutouts: teams.reduce((s, t) => s + t.shoutoutCount, 0),
  }

  return (
    <PageShell
      title="Team Hubs"
      subtitle="Jump into any team's hub — posts, photos, shoutouts, and more"
      breadcrumb="People › Team Hubs"
    >
      {/* Org-wide metrics strip */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Players', value: totals.players, icon: Users, color: 'text-lynx-sky' },
          { label: 'Wall Posts', value: totals.posts, icon: MessageCircle, color: 'text-emerald-400' },
          { label: 'Shoutouts', value: totals.shoutouts, icon: Star, color: 'text-amber-400' },
        ].map(stat => (
          <div key={stat.label} className={`${tc.cardBg} ${tc.border} border rounded-[14px] p-4 flex items-center gap-3`}>
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
            <div>
              <p className={`text-xl font-bold ${tc.text}`}>{stat.value}</p>
              <p className={`text-r-xs ${tc.textMuted}`}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${tc.textMuted}`} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search teams..."
          className={`w-full ${tc.input} rounded-[14px] pl-11 pr-4 py-3 text-sm`}
        />
      </div>

      {/* Team Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-lynx-sky border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className={`${tc.textMuted} text-lg`}>{search ? 'No teams match your search' : 'No teams yet'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(team => (
            <button
              key={team.id}
              onClick={() => navigateToTeamWall?.(team.id)}
              className={`${tc.cardBg} ${tc.border} border rounded-[14px] p-5 text-left hover:shadow-lg transition-all group/card`}
            >
              <div className="flex items-center gap-3 mb-3">
                {/* Team color dot or logo */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: team.color || '#4BB9EC' }}
                >
                  {team.logo_url ? (
                    <img src={team.logo_url} alt="" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    team.name.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold ${tc.text} truncate`}>{team.name}</h3>
                  <p className={`text-r-xs ${tc.textMuted}`}>
                    {team.playerCount} player{team.playerCount !== 1 ? 's' : ''} · {team.coachCount} coach{team.coachCount !== 1 ? 'es' : ''}
                  </p>
                </div>
                <ChevronRight className={`w-4 h-4 ${tc.textMuted} group-hover/card:text-lynx-sky transition-colors`} />
              </div>

              {/* Mini metrics row */}
              <div className="flex items-center gap-4 text-r-xs">
                <span className={`flex items-center gap-1 ${tc.textMuted}`}>
                  <MessageCircle className="w-3 h-3" /> {team.postCount} posts
                </span>
                <span className={`flex items-center gap-1 ${tc.textMuted}`}>
                  <Star className="w-3 h-3" /> {team.shoutoutCount} shoutouts
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </PageShell>
  )
}
