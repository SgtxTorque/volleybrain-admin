import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { MessageCircle } from '../../constants/icons'

function ParentMessagesPage({ roleContext, showToast }) {
  const { user } = useAuth()
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  
  const [teams, setTeams] = useState([])
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTeams()
  }, [roleContext])

  useEffect(() => {
    if (selectedTeam) loadAnnouncements()
  }, [selectedTeam])

  async function loadTeams() {
    const playerIds = roleContext?.children?.map(c => c.id) || []
    if (playerIds.length === 0) { setLoading(false); return }

    try {
      const { data: teamPlayers } = await supabase.from('team_players').select('team_id, teams(id, name, color)').in('player_id', playerIds)
      const uniqueTeams = [...new Map((teamPlayers || []).filter(tp => tp.teams).map(tp => [tp.teams.id, tp.teams])).values()]
      setTeams(uniqueTeams)
      if (uniqueTeams.length > 0) setSelectedTeam(uniqueTeams[0])
    } catch (err) { console.error('Error loading teams:', err) }
    setLoading(false)
  }

  async function loadAnnouncements() {
    if (!selectedTeam) return
    try {
      const { data: posts } = await supabase.from('team_posts').select('*, profiles(full_name)').eq('team_id', selectedTeam.id).order('created_at', { ascending: false }).limit(20)
      setAnnouncements(posts || [])
    } catch (err) { console.error('Error loading announcements:', err) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full" /></div>

  if (teams.length === 0) return <div className="text-center py-12"><MessageCircle className="w-16 h-16" /><h2 className={`text-xl font-bold ${tc.text} mt-4`}>No Teams</h2><p className={tc.textMuted}>Join a team to see messages</p></div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div><h1 className={`text-3xl font-bold ${tc.text}`}>Messages</h1><p className={tc.textSecondary}>Stay connected with your team</p></div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {teams.map(team => (
          <button key={team.id} onClick={() => setSelectedTeam(team)} className={`px-4 py-2 rounded-xl whitespace-nowrap flex items-center gap-2 transition font-medium ${selectedTeam?.id === team.id ? 'text-white shadow-lg' : `${tc.cardBg} border ${tc.border} ${tc.textSecondary} ${tc.hoverBg}`}`} style={selectedTeam?.id === team.id ? { backgroundColor: team.color } : {}}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: team.color }} />{team.name}
          </button>
        ))}
      </div>

      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-4 space-y-4 max-h-[500px] overflow-y-auto`}>
        <h3 className={`font-semibold ${tc.text}`}>Team Announcements</h3>
        {announcements.length > 0 ? announcements.map(post => (
          <div key={post.id} className={`${tc.cardBgAlt} rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs px-2 py-1 rounded-full ${post.post_type === 'announcement' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>{post.post_type || 'Update'}</span>
              <span className={`text-xs ${tc.textMuted}`}>{new Date(post.created_at).toLocaleDateString()}</span>
            </div>
            <h3 className={`font-semibold ${tc.text}`}>{post.title}</h3>
            <p className={`${tc.textSecondary} text-sm mt-1`}>{post.content}</p>
            {post.profiles && <p className={`text-xs ${tc.textMuted} mt-2`}>— {post.profiles.full_name}</p>}
          </div>
        )) : <div className="text-center py-8"><span className="text-4xl">📭</span><p className={tc.textSecondary}>No announcements yet</p></div>}
      </div>
    </div>
  )
}


export { ParentMessagesPage }
