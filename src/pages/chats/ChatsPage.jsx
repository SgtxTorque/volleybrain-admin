import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason, isAllSeasons } from '../../contexts/SeasonContext'
import { useSport } from '../../contexts/SportContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { Search, Plus, ChevronLeft } from '../../constants/icons'
import ChatThread from './ChatThread'
import ChatContextPanel from './ChatContextPanel'
import NewChatModal from './NewChatModal'
import CoppaConsentModal from '../../components/compliance/CoppaConsentModal'
import SeasonFilterBar from '../../components/pages/SeasonFilterBar'

// ---------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------
function ChatsPage({ showToast, activeView, roleContext }) {
  const { organization, profile, user, isAdmin } = useAuth()
  const { selectedSeason, allSeasons } = useSeason()
  const { selectedSport } = useSport()
  const tc = useThemeClasses()
  const { isDark, accent } = useTheme()
  const { channelId: urlChannelId } = useParams()
  const autoSelectedRef = useRef(false)

  const [loading, setLoading] = useState(true)
  const [channels, setChannels] = useState([])
  const [selectedChannel, setSelectedChannel] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState(urlChannelId ? 'all' : 'all')
  const [showNewChat, setShowNewChat] = useState(false)
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768)
  const [showRightPanel, setShowRightPanel] = useState(window.innerWidth >= 1100)
  const [coppaConsented, setCoppaConsented] = useState(null) // null = loading, true/false
  const templateInputRef = useRef(null)

  // Callback for quick template insertion from context panel
  function handleTemplateInsert(text) {
    if (templateInputRef.current) {
      templateInputRef.current(text)
    }
  }

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768)
      setShowRightPanel(window.innerWidth >= 1100)
    }
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

      // Compute target season IDs respecting both season and sport filters (all roles)
      let targetSeasonIds = null
      if (!isAllSeasons(selectedSeason) && selectedSeason?.id) {
        targetSeasonIds = [selectedSeason.id]
      } else {
        targetSeasonIds = (allSeasons || []).map(s => s.id)
      }
      // Narrow by sport if one is selected
      if (selectedSport?.id && targetSeasonIds) {
        targetSeasonIds = targetSeasonIds.filter(sid => {
          const season = (allSeasons || []).find(s => s.id === sid)
          return season?.sport_id === selectedSport.id
        })
      }
      if (!targetSeasonIds || targetSeasonIds.length === 0) {
        setChannels([])
        setLoading(false)
        return
      }

      let q1 = supabase
        .from('chat_channels')
        .select(`
          *,
          teams (id, name, color, logo_url),
          channel_members (id, user_id, display_name, last_read_at)
        `)
      q1 = q1.in('season_id', targetSeasonIds)
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
        q2 = q2.in('season_id', targetSeasonIds)
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

      // Auto-add parent to team channels they should belong to (self-healing)
      if (activeView === 'parent' && user?.id) {
        try {
          const { data: existingMemberships } = await supabase
            .from('channel_members')
            .select('channel_id')
            .eq('user_id', user.id)

          const existingChannelIds = new Set((existingMemberships || []).map(m => m.channel_id))

          // Find team channels for parent's teams that they're NOT yet a member of
          const missingChannels = (channelsWithMessages || []).filter(ch =>
            (ch.channel_type === 'team_chat' || ch.channel_type === 'player_chat') &&
            ch.team_id &&
            userTeamIds.includes(ch.team_id) &&
            !existingChannelIds.has(ch.id)
          )

          if (missingChannels.length > 0) {
            const inserts = missingChannels.map(ch => ({
              channel_id: ch.id,
              user_id: user.id,
              member_role: 'parent',
              display_name: profile?.full_name || profile?.email || 'Parent',
              can_post: ch.channel_type === 'team_chat',
              can_moderate: false,
            }))
            await supabase.from('channel_members').insert(inserts)
            // Reload to get updated membership data
            return loadChats()
          }
        } catch (autoJoinErr) {
          console.error('Auto-join channel_members error:', autoJoinErr)
        }
      }

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

      // Auto-select channel from URL param (e.g. /chats/{channelId})
      if (urlChannelId && !autoSelectedRef.current) {
        const target = filtered.find(ch => ch.id === urlChannelId)
        if (target) {
          setSelectedChannel(target)
          // Switch to DMs filter if it's a DM channel
          if (target.channel_type === 'dm' || target.channel_type === 'group_dm') {
            setFilterType('dms')
          }
          autoSelectedRef.current = true
        } else {
          // Channel not in loaded list — fetch it directly (DM may not be in season-scoped results)
          const { data: directChannel } = await supabase
            .from('chat_channels')
            .select('*, teams(id, name, color, logo_url), channel_members(id, user_id, display_name, last_read_at)')
            .eq('id', urlChannelId)
            .maybeSingle()
          if (directChannel) {
            setChannels(prev => [directChannel, ...prev.filter(c => c.id !== directChannel.id)])
            setSelectedChannel(directChannel)
            if (directChannel.channel_type === 'dm' || directChannel.channel_type === 'group_dm') {
              setFilterType('dms')
            }
          }
          autoSelectedRef.current = true
        }
      }
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
      (filterType === 'unread' && ch.unread_count > 0) ||
      (filterType === 'teams' && (ch.channel_type === 'team_chat' || ch.channel_type === 'player_chat')) ||
      (filterType === 'dms' && (ch.channel_type === 'dm' || ch.channel_type === 'group_dm'))

    return matchesSearch && matchesType
  })

  const unreadCount = channels.reduce((sum, ch) => sum + (ch.unread_count || 0), 0)

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
    <>
    <SeasonFilterBar role={activeView} />
    <div
      className={`h-[calc(100vh-130px)] flex overflow-hidden animate-fade-in ${
        isDark
          ? 'bg-lynx-navy'
          : 'bg-white'
      }`}
      style={{ fontFamily: 'var(--v2-font)' }}
    >
      {/* === LEFT COLUMN — Channel List (Broadcast Desk style) === */}
      {(!isMobileView || !selectedChannel) && (
        <div
          className={`${isMobileView ? 'w-full' : 'w-[340px]'} shrink-0 flex flex-col border-r ${
            isDark ? 'border-white/[0.06] bg-lynx-navy' : 'border-[#E8ECF2] bg-[#F8F9FB]'
          }`}
        >
          {/* Header */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className={`text-base font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-[#10284C]'}`} style={{ fontFamily: 'var(--v2-font)', letterSpacing: '-0.02em' }}>
                  Messages
                </h1>
                <p className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {channels.length} conversation{channels.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => setShowNewChat(true)}
                className="w-8 h-8 rounded-xl flex items-center justify-center bg-lynx-navy-subtle text-white hover:brightness-125 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className={`relative`}>
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-white/25' : 'text-slate-400'}`} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 rounded-xl text-sm font-medium ${
                  isDark
                    ? 'bg-white/[0.06] text-white placeholder:text-white/30 border border-white/[0.06] focus:border-[#4BB9EC]'
                    : 'bg-[#F5F6F8] text-[#10284C] placeholder:text-slate-400 focus:ring-2 focus:ring-[#4BB9EC]/20'
                } outline-none transition`}
              />
            </div>

            {/* Filter Tabs */}
            <div className={`flex gap-0.5 p-1 rounded-lg ${isDark ? 'bg-white/[0.03]' : 'bg-white'}`}>
              {[
                { key: 'all', label: 'All' },
                { key: 'unread', label: 'Unread' },
                { key: 'teams', label: 'Teams' },
                { key: 'dms', label: 'DMs' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilterType(key)}
                  className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all relative ${
                    filterType === key
                      ? 'bg-lynx-navy-subtle text-white shadow-sm'
                      : isDark ? 'text-white/35 hover:text-white/60' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {label}
                  {key === 'unread' && unreadCount > 0 && filterType !== 'unread' && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#4BB9EC] text-white text-[8px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 rounded-full border-2 border-[#4BB9EC] border-t-transparent animate-spin" />
              </div>
            ) : filteredChannels.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="text-5xl mb-3">💬</div>
                <p className={`text-sm font-semibold ${isDark ? 'text-white/30' : 'text-slate-400'}`}>
                  {filterType === 'unread' ? 'All caught up!' : 'No conversations yet'}
                </p>
                {filterType !== 'unread' && (
                  <p className={`text-xs mt-2 max-w-[220px] mx-auto ${isDark ? 'text-white/20' : 'text-slate-400'}`}>
                    {activeView === 'parent'
                      ? 'Chat channels will be available once your players are assigned to a team.'
                      : 'Create a channel or join an existing conversation to get started.'}
                  </p>
                )}
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

      {/* === CENTER COLUMN — Chat Thread === */}
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
              onRegisterTemplateInput={(setter) => { templateInputRef.current = setter }}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center animate-fade-in">
              <span className="text-5xl mb-4">💬</span>
              <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
                Select a Conversation
              </h2>
              <p className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Choose a chat from the list to start messaging
              </p>
            </div>
          )}
        </div>
      )}

      {/* === RIGHT COLUMN — Context Panel (team channels only) === */}
      {showRightPanel && selectedChannel && !isMobileView && (
        <div className={`w-[300px] shrink-0 flex flex-col border-l overflow-y-auto ${
          isDark ? 'border-white/[0.06] bg-lynx-navy' : 'border-[#E8ECF2] bg-[#F8F9FB]'
        }`}>
          <ChatContextPanel
            channel={selectedChannel}
            onTemplateInsert={handleTemplateInsert}
            showToast={showToast}
          />
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
    </>
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
    return channel.last_message.content?.slice(0, 60) + (channel.last_message.content?.length > 60 ? '...' : '')
  }

  const teamColor = channel.teams?.color

  return (
    <button
      onClick={onClick}
      className={`w-full px-3 py-2.5 flex items-center gap-3 transition-all duration-150 ${
        isSelected
          ? (isDark ? 'bg-[#4BB9EC]/10 border-l-3 border-[#4BB9EC]' : 'bg-[#10284C]/[0.05] border-l-3 border-[#10284C]')
          : isDark
            ? 'border-l-3 border-transparent hover:bg-white/[0.03]'
            : 'border-l-3 border-transparent hover:bg-slate-50'
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
            isDark ? 'bg-white/[0.06] text-slate-300' : 'bg-slate-100 text-slate-500'
          }`}
          style={teamColor ? { backgroundColor: `${teamColor}15`, color: teamColor } : undefined}
        >
          {getChannelIcon()}
        </div>
        {channel.unread_count > 0 && (
          <div className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-0.5 rounded-full text-[9px] font-bold text-white bg-[#4BB9EC] flex items-center justify-center">
            {channel.unread_count > 9 ? '9+' : channel.unread_count}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between gap-2">
          <span className={`font-bold text-sm truncate ${
            channel.unread_count > 0
              ? (isDark ? 'text-white' : 'text-[#10284C]')
              : (isDark ? 'text-slate-300' : 'text-slate-700')
          }`}>
            {channel.name}
          </span>
          <span className={`text-[10px] flex-shrink-0 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
            {formatTime(channel.last_message?.created_at)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {channel.channel_type === 'team_chat' && (
            <span className="px-1 py-0 rounded text-[8px] font-black uppercase bg-lynx-navy-subtle text-white leading-tight">Team</span>
          )}
          {channel.channel_type === 'player_chat' && (
            <span className="px-1 py-0 rounded text-[8px] font-black uppercase bg-[#4BB9EC]/20 text-[#4BB9EC] leading-tight">Player</span>
          )}
          <p className={`text-[11px] truncate ${
            channel.unread_count > 0
              ? (isDark ? 'text-slate-300 font-medium' : 'text-slate-600 font-medium')
              : (isDark ? 'text-slate-500' : 'text-slate-400')
          }`}>
            {getLastMessagePreview()}
          </p>
        </div>
      </div>
    </button>
  )
}

export default ChatsPage
