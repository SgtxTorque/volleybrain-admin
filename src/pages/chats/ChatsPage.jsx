import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason, isAllSeasons } from '../../contexts/SeasonContext'
import { useSport } from '../../contexts/SportContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { Search, Plus } from '../../constants/icons'
import PageShell from '../../components/pages/PageShell'
import SeasonFilterBar from '../../components/pages/SeasonFilterBar'
import ChatThread from './ChatThread'
import NewChatModal from './NewChatModal'
import CoppaConsentModal from '../../components/compliance/CoppaConsentModal'

// ---------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------
function ChatsPage({ showToast, activeView, roleContext }) {
  const { organization, profile, user, isAdmin } = useAuth()
  const { selectedSeason, allSeasons } = useSeason()
  const { selectedSport } = useSport()
  const tc = useThemeClasses()
  const { isDark, accent } = useTheme()

  const [loading, setLoading] = useState(true)
  const [channels, setChannels] = useState([])
  const [selectedChannel, setSelectedChannel] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [showNewChat, setShowNewChat] = useState(false)
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768)
  const [coppaConsented, setCoppaConsented] = useState(null) // null = loading, true/false

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // COPPA consent check for parent role
  useEffect(() => {
    if (activeView !== 'parent') {
      setCoppaConsented(true)
      return
    }
    if (profile?.coppa_consent_given) {
      setCoppaConsented(true)
    } else {
      setCoppaConsented(false)
    }
  }, [activeView, profile])

  useEffect(() => {
    loadChats()
  }, [selectedSeason?.id, roleContext, selectedSport?.id])

  // ---------------------------------------------------------------
  // DATA LOADING -- Preserved exactly
  // ---------------------------------------------------------------

  async function loadChats() {
    setLoading(true)
    try {
      let userTeamIds = []

      if (roleContext?.children?.length > 0 && activeView === 'parent') {
        const playerIds = roleContext.children.map(c => c.id)
        const { data: teamPlayers } = await supabase
          .from('team_players')
          .select('team_id')
          .in('player_id', playerIds)
        userTeamIds = [...new Set((teamPlayers || []).map(tp => tp.team_id).filter(Boolean))]
      }

      if (roleContext?.coachInfo?.team_coaches?.length > 0 && activeView === 'coach') {
        userTeamIds = roleContext.coachInfo.team_coaches.map(tc => tc.team_id).filter(Boolean)
      }

      if (roleContext?.teamManagerInfo?.length > 0 && activeView === 'team_manager') {
        userTeamIds = roleContext.teamManagerInfo.map(ts => ts.team_id).filter(Boolean)
      }

      // Player: filter by player's team membership
      if (activeView === 'player' && roleContext?.playerInfo?.team_players?.length > 0) {
        userTeamIds = roleContext.playerInfo.team_players.map(tp => tp.team_id).filter(Boolean)
      }
      // Admin sees all channels (no team filtering) — intentional

      // Primary query with joins (same as working pattern)
      let channelsData = null

      const sportSeasonIds = (isAllSeasons(selectedSeason) && selectedSport?.id)
        ? (allSeasons || []).filter(s => s.sport_id === selectedSport.id).map(s => s.id)
        : null

      let q1 = supabase
        .from('chat_channels')
        .select(`
          *,
          teams (id, name, color, logo_url),
          channel_members (id, user_id, display_name, last_read_at)
        `)
      if (!isAllSeasons(selectedSeason) && selectedSeason?.id) {
        q1 = q1.eq('season_id', selectedSeason.id)
      } else if (sportSeasonIds && sportSeasonIds.length > 0) {
        q1 = q1.in('season_id', sportSeasonIds)
      }
      const { data: d1, error: e1 } = await q1
        .eq('is_archived', false)
        .order('updated_at', { ascending: false })

      if (!e1) {
        channelsData = d1
      } else {
        // Fallback: query without joins if relationship is missing
        console.warn('ChatsPage: joined query failed, trying without joins:', e1.message)
        let q2 = supabase
          .from('chat_channels')
          .select('*')
        if (!isAllSeasons(selectedSeason) && selectedSeason?.id) {
          q2 = q2.eq('season_id', selectedSeason.id)
        } else if (sportSeasonIds && sportSeasonIds.length > 0) {
          q2 = q2.in('season_id', sportSeasonIds)
        }
        const { data: d2, error: e2 } = await q2
          .eq('is_archived', false)
          .order('updated_at', { ascending: false })

        if (e2) throw e2
        // Load team data separately for each channel
        const teamIds = [...new Set((d2 || []).map(ch => ch.team_id).filter(Boolean))]
        let teamsMap = {}
        if (teamIds.length > 0) {
          const { data: teamsData } = await supabase
            .from('teams')
            .select('id, name, color, logo_url')
            .in('id', teamIds)
          ;(teamsData || []).forEach(t => { teamsMap[t.id] = t })
        }
        // Load channel_members separately
        const channelIds = (d2 || []).map(ch => ch.id)
        let membersMap = {}
        if (channelIds.length > 0) {
          const { data: membersData } = await supabase
            .from('channel_members')
            .select('id, user_id, display_name, last_read_at, channel_id')
            .in('channel_id', channelIds)
          ;(membersData || []).forEach(m => {
            if (!membersMap[m.channel_id]) membersMap[m.channel_id] = []
            membersMap[m.channel_id].push(m)
          })
        }
        channelsData = (d2 || []).map(ch => ({
          ...ch,
          teams: teamsMap[ch.team_id] || null,
          channel_members: membersMap[ch.id] || [],
        }))
      }

      const channelsWithMessages = await Promise.all((channelsData || []).map(async (ch) => {
        const { data: lastMsg } = await supabase
          .from('chat_messages')
          .select('id, content, message_type, created_at, sender_id, profiles:sender_id(full_name, avatar_url)')
          .eq('channel_id', ch.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        const myMembership = ch.channel_members?.find(m => m.user_id === user?.id)

        let unreadCount = 0
        if (myMembership?.last_read_at) {
          const { count } = await supabase
            .from('chat_messages')
            .select('id', { count: 'exact', head: true })
            .eq('channel_id', ch.id)
            .eq('is_deleted', false)
            .gt('created_at', myMembership.last_read_at)
          unreadCount = count || 0
        }

        return {
          ...ch,
          last_message: lastMsg,
          unread_count: unreadCount,
          my_membership: myMembership
        }
      }))

      let filtered = channelsWithMessages
      if (activeView === 'parent' || activeView === 'coach' || activeView === 'team_manager') {
        filtered = channelsWithMessages.filter(ch => {
          if (ch.my_membership) return true
          if (ch.channel_type === 'dm') return ch.channel_members?.some(m => m.user_id === user?.id)
          if ((ch.channel_type === 'team_chat' || ch.channel_type === 'player_chat') && ch.team_id) {
            return userTeamIds.includes(ch.team_id)
          }
          return false
        })
      }

      setChannels(filtered)
    } catch (err) {
      console.error('Error loading chats:', err)
      showToast?.('Error loading chats', 'error')
    }
    setLoading(false)
  }

  const filteredChannels = channels.filter(ch => {
    const matchesSearch = !searchQuery ||
      ch.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.teams?.name?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = filterType === 'all' ||
      (filterType === 'teams' && (ch.channel_type === 'team_chat' || ch.channel_type === 'player_chat')) ||
      (filterType === 'dms' && (ch.channel_type === 'dm' || ch.channel_type === 'group_dm'))

    return matchesSearch && matchesType
  })

  const formatLastMessageTime = (date) => {
    if (!date) return ''
    const d = new Date(date)
    const now = new Date()
    const diff = now - d

    if (diff < 60000) return 'now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
    if (diff < 86400000) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    if (diff < 604800000) return d.toLocaleDateString('en-US', { weekday: 'short' })
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // ---------------------------------------------------------------
  // COPPA GATE -- Show consent modal for parent role if not consented
  // ---------------------------------------------------------------

  if (coppaConsented === false) {
    return <CoppaConsentModal onConsented={() => setCoppaConsented(true)} />
  }

  // ---------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------

  return (
    <div
      className={`h-[calc(100vh-180px)] flex overflow-hidden rounded-[14px] border animate-fade-in ${
        isDark
          ? 'bg-lynx-charcoal border-white/[0.06]'
          : 'bg-white border-slate-200 shadow-soft-md'
      }`}
    >
      {/* === SIDEBAR -- Conversation List === */}
      {(!isMobileView || !selectedChannel) && (
        <div
          className={`${isMobileView ? 'w-full' : 'w-80'} flex flex-col border-r ${
            isDark ? 'border-white/[0.06]' : 'border-slate-200'
          }`}
        >
          {/* Header */}
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h1 className={`text-r-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Chats
              </h1>
              <button
                onClick={() => setShowNewChat(true)}
                className="w-10 h-10 rounded-lg flex items-center justify-center bg-lynx-navy text-white font-bold hover:brightness-110 transition-all active:scale-95 shadow-soft-sm"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div
              className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all focus-within:border-lynx-sky focus-within:ring-1 focus-within:ring-lynx-sky/20 ${
                isDark
                  ? 'bg-white/[0.04] border-white/[0.06]'
                  : 'bg-white border-slate-200'
              }`}
            >
              <Search className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-white/25' : 'text-slate-400'}`} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`flex-1 bg-transparent outline-none text-r-sm font-medium ${
                  isDark ? 'text-white placeholder:text-white/30' : 'text-slate-700 placeholder:text-slate-400'
                }`}
              />
            </div>

            {/* Filter Tabs */}
            <div className={`flex gap-1 p-1 rounded-lg ${isDark ? 'bg-white/[0.03]' : 'bg-slate-100'}`}>
              {['all', 'teams', 'dms'].map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`flex-1 px-3 py-1.5 rounded-md text-r-xs font-bold uppercase tracking-wider transition-all ${
                    filterType === type
                      ? 'bg-lynx-navy text-white shadow-soft-sm'
                      : isDark ? 'text-white/35 hover:text-white/60' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {type === 'all' ? 'All' : type === 'teams' ? 'Teams' : 'DMs'}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 rounded-full border-2 border-lynx-sky border-t-transparent animate-spin" />
              </div>
            ) : filteredChannels.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="text-5xl mb-3">💬</div>
                <p className={`text-r-sm font-semibold ${isDark ? 'text-white/30' : 'text-slate-400'}`}>
                  No conversations yet
                </p>
              </div>
            ) : (
              filteredChannels.map((channel, i) => (
                <ConversationItem
                  key={channel.id}
                  channel={channel}
                  isSelected={selectedChannel?.id === channel.id}
                  onClick={() => setSelectedChannel(channel)}
                  formatTime={formatLastMessageTime}
                  isDark={isDark}
                  index={i}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* === CHAT THREAD === */}
      {(!isMobileView || selectedChannel) && (
        <div className="flex-1 flex flex-col min-w-0">
          {selectedChannel ? (
            <ChatThread
              channel={selectedChannel}
              onBack={() => setSelectedChannel(null)}
              onRefresh={loadChats}
              showToast={showToast}
              isDark={isDark}
              accent={accent}
              activeView={activeView}
              isMobile={isMobileView}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center animate-fade-in">
              <div
                className={`w-24 h-24 rounded-[14px] flex items-center justify-center mb-5 border ${
                  isDark
                    ? 'bg-white/[0.04] border-white/[0.06]'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-5xl">💬</span>
              </div>
              <h2 className={`text-r-xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Select a Conversation
              </h2>
              <p className={`mt-2 text-r-sm ${isDark ? 'text-white/30' : 'text-slate-400'}`}>
                Choose a chat from the list to start messaging
              </p>
            </div>
          )}
        </div>
      )}

      {/* New Chat Modal */}
      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onCreated={(ch) => { setShowNewChat(false); setSelectedChannel(ch); loadChats() }}
          showToast={showToast}
          isDark={isDark}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------
// CONVERSATION ITEM
// ---------------------------------------------------------------
function ConversationItem({ channel, isSelected, onClick, formatTime, isDark, index }) {
  const getChannelIcon = () => {
    if (channel.channel_type === 'team_chat') return '👥'
    if (channel.channel_type === 'player_chat') return '🏐'
    if (channel.channel_type === 'dm') return '💬'
    return '📢'
  }

  const getLastMessagePreview = () => {
    if (!channel.last_message) return 'No messages yet'
    if (channel.last_message.message_type === 'image') return '📷 Photo'
    if (channel.last_message.message_type === 'gif') return '🎬 GIF'
    return channel.last_message.content?.slice(0, 40) + (channel.last_message.content?.length > 40 ? '...' : '')
  }

  const teamColor = channel.teams?.color

  return (
    <button
      onClick={onClick}
      className={`w-full p-3 flex items-center gap-3 transition-all rounded-lg mb-1 ${
        isSelected
          ? 'bg-lynx-sky/10 border-l-2 border-lynx-sky'
          : isDark
            ? 'border-l-2 border-transparent hover:bg-white/[0.04]'
            : 'border-l-2 border-transparent hover:bg-slate-100'
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div
          className={`w-12 h-12 rounded-[14px] flex items-center justify-center text-lg ${
            isDark ? 'bg-white/[0.06]' : 'bg-slate-100'
          }`}
          style={teamColor ? { backgroundColor: `${teamColor}15`, color: teamColor } : undefined}
        >
          {getChannelIcon()}
        </div>
        {/* Team color dot */}
        {teamColor && (
          <div
            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2"
            style={{
              backgroundColor: teamColor,
              borderColor: isDark ? '#1A2744' : '#ffffff',
            }}
          />
        )}
        {/* Unread badge */}
        {channel.unread_count > 0 && (
          <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-r-xs font-bold text-white bg-lynx-sky flex items-center justify-center shadow-soft-sm">
            {channel.unread_count > 9 ? '9+' : channel.unread_count}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between gap-2">
          <span className={`font-bold text-r-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {channel.name}
          </span>
          <span className={`text-r-xs flex-shrink-0 font-medium ${isDark ? 'text-white/20' : 'text-slate-400'}`}>
            {formatTime(channel.last_message?.created_at)}
          </span>
        </div>
        <p className={`text-r-xs truncate mt-0.5 ${isDark ? 'text-white/35' : 'text-slate-500'}`}>
          {getLastMessagePreview()}
        </p>
      </div>
    </button>
  )
}

export default ChatsPage
