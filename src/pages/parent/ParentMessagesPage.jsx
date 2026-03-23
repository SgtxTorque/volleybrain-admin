import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { MessageCircle, Bell, Users, CheckCircle2, AlertCircle, RefreshCw, Megaphone, Calendar, CreditCard } from '../../constants/icons'
import PageShell from '../../components/pages/PageShell'
import InnerStatRow from '../../components/pages/InnerStatRow'
import { MessageCard, TeamPostCard, ActionCard, EmptyState } from './MessageCards'

function ParentMessagesPage({ roleContext, showToast }) {
  const { user, profile } = useAuth()
  const { isDark } = useTheme()

  const [teams, setTeams] = useState([])
  const [selectedTeam, setSelectedTeam] = useState('all')
  const [activeTab, setActiveTab] = useState('announcements')
  const [announcements, setAnnouncements] = useState([])
  const [teamPosts, setTeamPosts] = useState([])
  const [actionItems, setActionItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [actionCount, setActionCount] = useState(0)

  const cardCls = isDark
    ? 'bg-white/[0.03] border border-white/[0.06]'
    : 'bg-white border border-slate-200'

  useEffect(() => {
    loadTeams()
  }, [roleContext])

  useEffect(() => {
    if (teams.length > 0) {
      loadAllData()
    }
  }, [teams, selectedTeam])

  async function loadTeams() {
    const playerIds = roleContext?.children?.map(c => c.id) || []
    if (playerIds.length === 0) { setLoading(false); return }

    try {
      const { data: teamPlayers } = await supabase
        .from('team_players')
        .select('team_id, teams(id, name, color)')
        .in('player_id', playerIds)
      const uniqueTeams = [...new Map(
        (teamPlayers || []).filter(tp => tp.teams).map(tp => [tp.teams.id, tp.teams])
      ).values()]
      setTeams(uniqueTeams)
    } catch (err) {
      console.error('Error loading teams:', err)
    }
    setLoading(false)
  }

  async function loadAllData() {
    await Promise.all([
      loadAnnouncements(),
      loadTeamPosts(),
      loadActionItems(),
    ])
  }

  async function loadAnnouncements() {
    try {
      // Load blast messages targeted at parents or all
      let query = supabase
        .from('messages')
        .select('*, profiles:sender_id(full_name), message_recipients!inner(read_at)')
        .or('target_audience.eq.all,target_audience.eq.parents')
        .eq('message_recipients.recipient_id', profile?.id)
        .order('created_at', { ascending: false })
        .limit(30)

      const { data, error } = await query
      if (error) throw error

      const msgs = (data || []).map(m => ({
        ...m,
        isRead: !!m.message_recipients?.[0]?.read_at,
        senderName: m.profiles?.full_name || 'Admin',
      }))

      setAnnouncements(msgs)
      setUnreadCount(msgs.filter(m => !m.isRead).length)
    } catch {
      // Table may not exist or no data
      setAnnouncements([])
      setUnreadCount(0)
    }
  }

  async function loadTeamPosts() {
    const teamIds = selectedTeam === 'all'
      ? teams.map(t => t.id)
      : [selectedTeam]

    if (teamIds.length === 0) { setTeamPosts([]); return }

    try {
      const { data: posts } = await supabase
        .from('team_posts')
        .select('*, profiles(full_name), teams(name, color)')
        .in('team_id', teamIds)
        .order('created_at', { ascending: false })
        .limit(30)
      setTeamPosts(posts || [])
    } catch (err) {
      console.error('Error loading team posts:', err)
      setTeamPosts([])
    }
  }

  async function loadActionItems() {
    try {
      const { data } = await supabase
        .from('message_recipients')
        .select('*, messages!inner(*, profiles:sender_id(full_name))')
        .eq('recipient_id', profile?.id)
        .is('read_at', null)
        .eq('messages.requires_acknowledgment', true)
        .order('created_at', { ascending: false })
        .limit(20)

      const items = (data || []).map(r => ({
        id: r.message_id,
        recipientId: r.id,
        ...r.messages,
        senderName: r.messages?.profiles?.full_name || 'Admin',
      }))
      setActionItems(items)
      setActionCount(items.length)
    } catch {
      setActionItems([])
      setActionCount(0)
    }
  }

  async function acknowledgeMessage(recipientId, messageId) {
    try {
      await supabase
        .from('message_recipients')
        .update({ read_at: new Date().toISOString() })
        .eq('id', recipientId)
      showToast('Message acknowledged', 'success')
      setActionItems(prev => prev.filter(m => m.recipientId !== recipientId))
      setActionCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
    }
  }

  async function markRead(messageId) {
    try {
      await supabase
        .from('message_recipients')
        .update({ read_at: new Date().toISOString() })
        .eq('message_id', messageId)
        .eq('recipient_id', profile?.id)
      setAnnouncements(prev => prev.map(m => m.id === messageId ? { ...m, isRead: true } : m))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {
      // Silently fail
    }
  }

  function timeAgo(dateStr) {
    const now = new Date()
    const date = new Date(dateStr)
    const mins = Math.floor((now - date) / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  function getTypeInfo(type) {
    switch (type) {
      case 'announcement': return { label: 'Announcement', icon: <Megaphone className="w-3.5 h-3.5" />, cls: 'bg-red-500/10 text-red-500' }
      case 'schedule_change': return { label: 'Schedule', icon: <Calendar className="w-3.5 h-3.5" />, cls: 'bg-amber-500/10 text-amber-500' }
      case 'payment_reminder': return { label: 'Payment', icon: <CreditCard className="w-3.5 h-3.5" />, cls: 'bg-violet-500/10 text-violet-500' }
      default: return { label: type || 'Update', icon: <Bell className="w-3.5 h-3.5" />, cls: 'bg-[#4BB9EC]/10 text-[#4BB9EC]' }
    }
  }

  const TABS = [
    { id: 'announcements', label: 'Announcements', count: announcements.length },
    { id: 'team-updates', label: 'Team Updates', count: teamPosts.length },
    { id: 'action-required', label: 'Action Required', count: actionCount },
  ]

  if (loading) {
    return (
      <PageShell breadcrumb="Messages" title="Messages" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-[#4BB9EC] border-t-transparent rounded-full animate-spin" />
        </div>
      </PageShell>
    )
  }

  if (teams.length === 0) {
    return (
      <PageShell
        breadcrumb="Messages"
        title={
          <span className="flex items-center gap-3">
            <MessageCircle className="w-7 h-7 text-[#4BB9EC]" />
            Messages
          </span>
        }
        subtitle="Announcements and updates from your teams"
      >
        <div className={`${cardCls} rounded-[14px] p-12 text-center max-w-md mx-auto`}>
          <MessageCircle className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
          <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>No Teams Yet</h2>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Join a team to receive messages and announcements from coaches.
          </p>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell
      breadcrumb="Messages"
      title={
        <span className="flex items-center gap-3">
          <MessageCircle className="w-7 h-7 text-[#4BB9EC]" />
          Messages
        </span>
      }
      subtitle="Announcements and updates from your teams"
      actions={
        <button
          onClick={loadAllData}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition ${
            isDark
              ? 'bg-white/[0.03] border-white/[0.06] text-slate-300 hover:bg-white/[0.04]'
              : 'bg-white border-slate-200 text-slate-500 hover:border-[#4BB9EC] hover:text-[#4BB9EC]'
          }`}
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      }
    >
      <div className="space-y-6">
        {/* Stat Row */}
        <InnerStatRow stats={[
          { icon: <Bell className="w-5 h-5 text-[#4BB9EC]" />, value: unreadCount, label: 'Unread', color: unreadCount > 0 ? 'text-[#4BB9EC]' : 'text-slate-400' },
          { icon: <Users className="w-5 h-5 text-emerald-500" />, value: teams.length, label: 'Teams', color: 'text-emerald-500' },
          { icon: <AlertCircle className="w-5 h-5 text-amber-500" />, value: actionCount, label: 'Action Required', color: actionCount > 0 ? 'text-amber-500' : 'text-slate-400' },
        ]} />

        {/* Team Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedTeam('all')}
            className={`px-4 py-2 rounded-xl whitespace-nowrap text-sm font-bold transition ${
              selectedTeam === 'all'
                ? 'bg-[#4BB9EC]/20 text-[#4BB9EC]'
                : isDark
                  ? 'bg-white/[0.04] text-slate-400 border border-white/[0.06] hover:bg-white/[0.08]'
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Teams
          </button>
          {teams.map(team => (
            <button
              key={team.id}
              onClick={() => setSelectedTeam(team.id)}
              className={`px-4 py-2 rounded-xl whitespace-nowrap flex items-center gap-2 text-sm font-bold transition ${
                selectedTeam === team.id
                  ? 'bg-[#4BB9EC]/20 text-[#4BB9EC]'
                  : isDark
                    ? 'bg-white/[0.04] text-slate-400 border border-white/[0.06] hover:bg-white/[0.08]'
                    : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: team.color || '#4BB9EC' }} />
              {team.name}
            </button>
          ))}
        </div>

        {/* Category Tabs */}
        <div className={`flex rounded-xl p-1 border ${isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-white border-slate-200'}`}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#4BB9EC]/15 text-[#4BB9EC]'
                  : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === tab.id ? 'bg-[#4BB9EC]/20 text-[#4BB9EC]' : isDark ? 'bg-white/[0.06] text-slate-500' : 'bg-slate-100 text-slate-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'announcements' && (
          <div className="space-y-3">
            {announcements.length > 0 ? announcements.map(msg => (
              <MessageCard
                key={msg.id}
                message={msg}
                isDark={isDark}
                cardCls={cardCls}
                expanded={expandedId === msg.id}
                onToggle={() => {
                  setExpandedId(expandedId === msg.id ? null : msg.id)
                  if (!msg.isRead) markRead(msg.id)
                }}
                timeAgo={timeAgo}
                getTypeInfo={getTypeInfo}
              />
            )) : (
              <EmptyState isDark={isDark} cardCls={cardCls} message="All caught up! No new announcements from your teams." />
            )}
          </div>
        )}

        {activeTab === 'team-updates' && (
          <div className="space-y-3">
            {teamPosts.length > 0 ? teamPosts.map(post => (
              <TeamPostCard
                key={post.id}
                post={post}
                isDark={isDark}
                cardCls={cardCls}
                expanded={expandedId === post.id}
                onToggle={() => setExpandedId(expandedId === post.id ? null : post.id)}
                timeAgo={timeAgo}
              />
            )) : (
              <EmptyState isDark={isDark} cardCls={cardCls} message="No team updates yet. Posts from coaches will appear here." />
            )}
          </div>
        )}

        {activeTab === 'action-required' && (
          <div className="space-y-3">
            {actionItems.length > 0 ? actionItems.map(item => (
              <ActionCard
                key={item.id}
                item={item}
                isDark={isDark}
                cardCls={cardCls}
                onAcknowledge={() => acknowledgeMessage(item.recipientId, item.id)}
                timeAgo={timeAgo}
                getTypeInfo={getTypeInfo}
              />
            )) : (
              <EmptyState isDark={isDark} cardCls={cardCls} message="Nothing requires your attention right now." icon={<CheckCircle2 className={`w-12 h-12 ${isDark ? 'text-emerald-500/40' : 'text-emerald-300'}`} />} />
            )}
          </div>
        )}
      </div>
    </PageShell>
  )
}

export { ParentMessagesPage }
