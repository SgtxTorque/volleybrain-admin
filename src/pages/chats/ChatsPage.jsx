import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { 
  Search, MessageCircle, Users, Plus, ChevronRight, X, Megaphone
} from '../../constants/icons'

// Volleyball icon component
function VolleyballIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10" />
      <path d="M2 12a15.3 15.3 0 0 1 10-4 15.3 15.3 0 0 1 10 4" />
      <path d="M2 12a15.3 15.3 0 0 0 10 4 15.3 15.3 0 0 0 10-4" />
    </svg>
  )
}

function ChatsPage({ showToast, activeView, roleContext }) {
  const { organization, profile, user, isAdmin } = useAuth()
  const { selectedSeason } = useSeason()
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  
  const [loading, setLoading] = useState(true)
  const [channels, setChannels] = useState([])
  const [teams, setTeams] = useState([])
  const [selectedChannel, setSelectedChannel] = useState(null)
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all') // all, team, dm
  
  useEffect(() => {
    if (selectedSeason?.id) loadChats()
  }, [selectedSeason?.id, roleContext])
  
  async function loadChats() {
    setLoading(true)
    try {
      // Load teams for this season
      const { data: teamsData } = await supabase
        .from('teams')
        .select('*')
        .eq('season_id', selectedSeason.id)
        .order('name')
      setTeams(teamsData || [])
      
      // Get user's associated team IDs (for filtering)
      let userTeamIds = []
      
      // For parents: Get teams their players are on
      if (roleContext?.children?.length > 0 && activeView === 'parent') {
        const playerIds = roleContext.children.map(c => c.id)
        const { data: teamPlayers } = await supabase
          .from('team_players')
          .select('team_id')
          .in('player_id', playerIds)
        userTeamIds = [...new Set((teamPlayers || []).map(tp => tp.team_id).filter(Boolean))]
      }
      
      // For coaches: Get their teams
      if (roleContext?.coachInfo?.team_coaches?.length > 0 && activeView === 'coach') {
        userTeamIds = roleContext.coachInfo.team_coaches.map(tc => tc.team_id).filter(Boolean)
      }
      
      // Load chat channels - simplified query with error handling
      let channelsData = []
      try {
        const { data, error } = await supabase
          .from('chat_channels')
          .select(`
            *,
            teams (id, name, color)
          `)
          .eq('season_id', selectedSeason.id)
          .eq('is_archived', false)
          .order('updated_at', { ascending: false })
        
        if (error) throw error
        channelsData = data || []
        
        // Load members and messages separately for each channel
        for (const channel of channelsData) {
          try {
            const { data: members } = await supabase
              .from('channel_members')
              .select('id, user_id, display_name, member_role, last_read_at')
              .eq('channel_id', channel.id)
            channel.channel_members = members || []
          } catch (err) {
            console.log('Could not load members for channel:', channel.id)
            channel.channel_members = []
          }
          
          try {
            const { data: messages } = await supabase
              .from('chat_messages')
              .select('id, content, message_type, created_at, sender_id')
              .eq('channel_id', channel.id)
              .order('created_at', { ascending: false })
              .limit(50)
            channel.chat_messages = messages || []
          } catch (err) {
            console.log('Could not load messages for channel:', channel.id)
            channel.chat_messages = []
          }
        }
      } catch (err) {
        console.log('Could not load chat channels:', err)
        channelsData = []
      }
      
      // Process and filter channels based on user role
      let processedChannels = (channelsData || []).map(ch => {
        const lastMessage = ch.chat_messages?.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        )[0]
        
        const myMembership = ch.channel_members?.find(m => m.user_id === user?.id)
        const unreadCount = myMembership?.last_read_at 
          ? ch.chat_messages?.filter(m => new Date(m.created_at) > new Date(myMembership.last_read_at)).length || 0
          : ch.chat_messages?.length || 0
        
        return {
          ...ch,
          last_message: lastMessage,
          unread_count: unreadCount,
          my_membership: myMembership
        }
      })
      
      // Filter channels based on role
      // When viewing as admin - show all
      // When viewing as parent/coach - filter to their teams only
      const shouldFilter = activeView === 'parent' || activeView === 'coach'
      
      if (shouldFilter) {
        processedChannels = processedChannels.filter(ch => {
          // Always show channels user is a member of
          if (ch.my_membership) return true
          
          // Show DMs that involve the user
          if (ch.channel_type === 'dm') {
            return ch.channel_members?.some(m => m.user_id === user?.id)
          }
          
          // Show team chats and player chats for user's teams (even if not yet a member)
          if ((ch.channel_type === 'team_chat' || ch.channel_type === 'player_chat') && ch.team_id) {
            return userTeamIds.includes(ch.team_id)
          }
          
          return false
        })
        
        // Auto-add user to team chats they should be in
        for (const ch of processedChannels) {
          if (ch.channel_type === 'team_chat' && !ch.my_membership && userTeamIds.includes(ch.team_id)) {
            // Add user as member (fire and forget)
            supabase.from('channel_members').insert({
              channel_id: ch.id,
              user_id: user?.id,
              display_name: profile?.full_name || profile?.email,
              member_role: activeView === 'coach' ? 'coach' : 'parent',
              can_post: true
            }).then(() => {
              console.log('Auto-added to team chat:', ch.name)
            }).catch(err => console.log('Could not auto-add to chat:', err))
          }
        }
      }
      
      setChannels(processedChannels)
    } catch (err) {
      console.error('Error loading chats:', err)
      showToast?.('Error loading chats', 'error')
    }
    setLoading(false)
  }
  
  async function createTeamChat(teamId) {
    const team = teams.find(t => t.id === teamId)
    if (!team) return
    
    // Check if chat already exists
    const existing = channels.find(c => c.team_id === teamId && c.channel_type === 'team_chat')
    if (existing) {
      setSelectedChannel(existing)
      return
    }
    
    // Create new team chat
    const { data: newChannel, error } = await supabase
      .from('chat_channels')
      .insert({
        season_id: selectedSeason.id,
        team_id: teamId,
        name: `${team.name} Chat`,
        channel_type: 'team_chat',
        created_by: user?.id
      })
      .select()
      .single()
    
    if (error) {
      showToast?.('Error creating chat', 'error')
      return
    }
    
    // Add creator as member
    await supabase.from('channel_members').insert({
      channel_id: newChannel.id,
      user_id: user?.id,
      display_name: profile?.full_name || 'Admin',
      member_role: 'admin',
      can_post: true,
      can_moderate: true
    })
    
    showToast?.('Team chat created!', 'success')
    loadChats()
    setSelectedChannel(newChannel)
  }
  
  // Filter channels
  const filteredChannels = channels.filter(ch => {
    const matchesSearch = !searchQuery || 
      ch.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.teams?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = filterType === 'all' || 
      (filterType === 'team' && ch.channel_type === 'team_chat') ||
      (filterType === 'dm' && (ch.channel_type === 'dm' || ch.channel_type === 'group_dm'))
    
    return matchesSearch && matchesType
  })
  
  // Group by type
  const teamChats = filteredChannels.filter(c => c.channel_type === 'team_chat' || c.channel_type === 'player_chat')
  const directMessages = filteredChannels.filter(c => c.channel_type === 'dm' || c.channel_type === 'group_dm')
  const announcements = filteredChannels.filter(c => c.channel_type === 'league_announcement')
  
  const getChannelIcon = (type) => {
    switch(type) {
      case 'team_chat': return <Users className="w-6 h-6" />
      case 'player_chat': return <VolleyballIcon className="w-6 h-6" />
      case 'dm': return <MessageCircle className="w-6 h-6" />
      case 'group_dm': return <Users className="w-6 h-6" />
      case 'league_announcement': return <Megaphone className="w-6 h-6" />
      default: return <MessageCircle className="w-6 h-6" />
    }
  }
  
  const formatLastMessageTime = (date) => {
    if (!date) return ''
    const d = new Date(date)
    const now = new Date()
    const diff = now - d
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
    if (diff < 604800000) return d.toLocaleDateString('en-US', { weekday: 'short' })
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${tc.text}`}>💬 Chats</h1>
          <p className={tc.textMuted}>Team conversations and direct messages</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowNewChatModal(true)}
            className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold hover:brightness-110 transition"
          >
            + New Chat
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-4`}>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full px-4 py-2 rounded-xl ${tc.input}`}
            />
          </div>
          <div className="flex gap-2">
            {['all', 'team', 'dm'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-xl font-medium transition ${
                  filterType === type
                    ? 'bg-[var(--accent-primary)] text-white'
                    : `${tc.cardBgAlt} ${tc.text} ${tc.hoverBg}`
                }`}
              >
                {type === 'all' ? 'All' : type === 'team' ? 'Teams' : 'DMs'}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full mx-auto" />
          <p className={`${tc.textMuted} mt-4`}>Loading chats...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat List */}
          <div className={`lg:col-span-1 ${tc.cardBg} border ${tc.border} rounded-2xl overflow-hidden`}>
            <div className={`p-4 border-b ${tc.border}`}>
              <h3 className={`font-semibold ${tc.text}`}>Conversations ({filteredChannels.length})</h3>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {/* Team Chats */}
              {teamChats.length > 0 && (
                <div>
                  <div className={`px-4 py-2 ${tc.cardBgAlt}`}>
                    <span className={`text-xs font-semibold uppercase ${tc.textMuted}`}>Team Chats</span>
                  </div>
                  {teamChats.map(channel => (
                    <div
                      key={channel.id}
                      onClick={() => setSelectedChannel(channel)}
                      className={`flex items-center gap-3 p-4 cursor-pointer transition ${
                        selectedChannel?.id === channel.id 
                          ? 'bg-[var(--accent-primary)]/10' 
                          : tc.hoverBg
                      } border-b ${tc.border}`}
                    >
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                        style={{ backgroundColor: (channel.teams?.color || '#6366F1') + '30' }}
                      >
                        {getChannelIcon(channel.channel_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`font-semibold ${tc.text} truncate`}>{channel.name}</span>
                          {channel.unread_count > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[var(--accent-primary)] text-white">
                              {channel.unread_count}
                            </span>
                          )}
                        </div>
                        <p className={`text-sm ${tc.textMuted} truncate`}>
                          {channel.last_message?.content || 'No messages yet'}
                        </p>
                        <span className={`text-xs ${tc.textMuted}`}>
                          {formatLastMessageTime(channel.last_message?.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Direct Messages */}
              {directMessages.length > 0 && (
                <div>
                  <div className={`px-4 py-2 ${tc.cardBgAlt}`}>
                    <span className={`text-xs font-semibold uppercase ${tc.textMuted}`}>Direct Messages</span>
                  </div>
                  {directMessages.map(channel => (
                    <div
                      key={channel.id}
                      onClick={() => setSelectedChannel(channel)}
                      className={`flex items-center gap-3 p-4 cursor-pointer transition ${
                        selectedChannel?.id === channel.id 
                          ? 'bg-[var(--accent-primary)]/10' 
                          : tc.hoverBg
                      } border-b ${tc.border}`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-slate-500/20 flex items-center justify-center text-xl">
                        💬
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`font-semibold ${tc.text} truncate`}>{channel.name}</span>
                          {channel.unread_count > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[var(--accent-primary)] text-white">
                              {channel.unread_count}
                            </span>
                          )}
                        </div>
                        <p className={`text-sm ${tc.textMuted} truncate`}>
                          {channel.last_message?.content || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {filteredChannels.length === 0 && (
                <div className="text-center py-12">
                  <span className="text-4xl">💬</span>
                  <p className={`${tc.textMuted} mt-4`}>No chats found</p>
                  <button
                    onClick={() => setShowNewChatModal(true)}
                    className="mt-4 px-4 py-2 rounded-xl bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] font-medium"
                  >
                    Start a conversation
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Chat Detail */}
          <div className={`lg:col-span-2 ${tc.cardBg} border ${tc.border} rounded-2xl overflow-hidden`}>
            {selectedChannel ? (
              <ChatDetailPanel 
                channel={selectedChannel} 
                onClose={() => setSelectedChannel(null)}
                onRefresh={loadChats}
                showToast={showToast}
                activeView={activeView}
                isAdmin={isAdmin}
              />
            ) : (
              <div className="h-[600px] flex flex-col items-center justify-center">
                <span className="text-6xl mb-4">💬</span>
                <p className={`text-xl font-semibold ${tc.text}`}>Select a conversation</p>
                <p className={tc.textMuted}>Choose a chat from the list or start a new one</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* New Chat Modal */}
      {showNewChatModal && (
        <NewChatModal
          teams={teams}
          onClose={() => setShowNewChatModal(false)}
          onCreateTeamChat={createTeamChat}
          showToast={showToast}
        />
      )}
    </div>
  )
}

// ============================================
// CHAT DETAIL PANEL
// ============================================
function ChatDetailPanel({ channel, onClose, onRefresh, showToast, activeView, isAdmin }) {
  const { profile, user } = useAuth()
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const messagesEndRef = useRef(null)
  
  // Determine if user can post in this channel
  // - Team Chat: Parents + Coaches + Admin can post
  // - Player Chat: Only Coaches + Admin can post (parents are view-only)
  // - DM: All participants can post
  const isParentView = activeView === 'parent'
  const isPlayerChat = channel?.channel_type === 'player_chat'
  const canPost = !isParentView || !isPlayerChat || (isAdmin && activeView === 'admin')
  
  useEffect(() => {
    if (channel?.id) {
      loadMessages()
      markAsRead()
      
      // Subscribe to real-time updates
      const subscription = supabase
        .channel(`chat:${channel.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${channel.id}`
        }, (payload) => {
          setMessages(prev => [...prev, payload.new])
          scrollToBottom()
        })
        .subscribe()
      
      return () => {
        subscription.unsubscribe()
      }
    }
  }, [channel?.id])
  
  async function loadMessages() {
    setLoading(true)
    const { data } = await supabase
      .from('chat_messages')
      .select(`
        *,
        profiles:sender_id (id, full_name, account_type)
      `)
      .eq('channel_id', channel.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .limit(100)
    
    setMessages(data || [])
    setLoading(false)
    scrollToBottom()
  }
  
  async function markAsRead() {
    await supabase
      .from('channel_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('channel_id', channel.id)
      .eq('user_id', user?.id)
  }
  
  function scrollToBottom() {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }
  
  async function sendMessage(e) {
    e.preventDefault()
    if (!newMessage.trim() || sending) return
    
    setSending(true)
    const { error } = await supabase.from('chat_messages').insert({
      channel_id: channel.id,
      sender_id: user?.id,
      content: newMessage.trim(),
      message_type: 'text'
    })
    
    if (error) {
      showToast?.('Error sending message', 'error')
    } else {
      setNewMessage('')
    }
    setSending(false)
  }
  
  async function deleteMessage(messageId) {
    if (!confirm('Delete this message?')) return
    
    await supabase
      .from('chat_messages')
      .update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: user?.id })
      .eq('id', messageId)
    
    setMessages(prev => prev.filter(m => m.id !== messageId))
    showToast?.('Message deleted', 'success')
  }
  
  const formatMessageTime = (date) => {
    const d = new Date(date)
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }
  
  const formatMessageDate = (date) => {
    const d = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  }
  
  // Group messages by date
  const messagesByDate = messages.reduce((groups, msg) => {
    const date = new Date(msg.created_at).toDateString()
    if (!groups[date]) groups[date] = []
    groups[date].push(msg)
    return groups
  }, {})

  return (
    <div className="flex flex-col h-[600px]">
      {/* Header */}
      <div className={`p-4 border-b ${tc.border} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            style={{ backgroundColor: (channel.teams?.color || '#6366F1') + '30' }}
          >
            {channel.channel_type === 'player_chat' ? '🏐' : channel.channel_type === 'team_chat' ? '👥' : '💬'}
          </div>
          <div>
            <h3 className={`font-semibold ${tc.text}`}>{channel.name}</h3>
            <p className={`text-xs ${tc.textMuted}`}>
              {channel.channel_type === 'player_chat' ? 'Player Chat (Coaches Only)' : 
               channel.channel_type === 'team_chat' ? 'Team Chat' : 'Direct Message'}
              {isParentView && isPlayerChat && <span className="ml-2 text-amber-400">• View Only</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Admin: Manage Members button */}
          {isAdmin && activeView === 'admin' && (
            <button 
              onClick={() => setShowMembersModal(true)}
              className={`px-3 py-1.5 rounded-lg text-sm ${tc.cardBgAlt} ${tc.text} hover:brightness-110 transition`}
            >
              👥 Members
            </button>
          )}
          <button onClick={onClose} className={`p-2 rounded-lg ${tc.hoverBg} ${tc.textMuted}`}>
            ✕
          </button>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full mx-auto" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-4xl">💬</span>
            <p className={`${tc.textMuted} mt-2`}>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          Object.entries(messagesByDate).map(([date, msgs]) => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex items-center gap-4 my-4">
                <div className={`flex-1 h-px ${tc.border}`} />
                <span className={`text-xs ${tc.textMuted} font-medium`}>{formatMessageDate(date)}</span>
                <div className={`flex-1 h-px ${tc.border}`} />
              </div>
              
              {/* Messages for this date */}
              {msgs.map((msg, idx) => {
                const isOwn = msg.sender_id === user?.id
                const showAvatar = idx === 0 || msgs[idx - 1]?.sender_id !== msg.sender_id
                
                return (
                  <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
                    <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                      {showAvatar && !isOwn && (
                        <span className={`text-xs ${tc.textMuted} ml-2 mb-1 block`}>
                          {msg.profiles?.full_name || 'Unknown'}
                        </span>
                      )}
                      <div 
                        className={`group relative px-4 py-2 rounded-2xl ${
                          isOwn 
                            ? 'bg-[var(--accent-primary)] text-white rounded-br-md' 
                            : `${tc.cardBgAlt} ${tc.text} rounded-bl-md`
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <span className={`text-[10px] ${isOwn ? 'text-white/70' : tc.textMuted} block mt-1`}>
                          {formatMessageTime(msg.created_at)}
                        </span>
                        
                        {/* Delete button */}
                        {isOwn && (
                          <button
                            onClick={() => deleteMessage(msg.id)}
                            className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-red-500 transition-opacity"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input - only show if user can post */}
      {canPost ? (
        <form onSubmit={sendMessage} className={`p-4 border-t ${tc.border}`}>
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className={`flex-1 px-4 py-3 rounded-xl ${tc.input}`}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="px-6 py-3 rounded-xl bg-[var(--accent-primary)] text-white font-semibold disabled:opacity-50 hover:brightness-110 transition"
            >
              {sending ? '...' : '→'}
            </button>
          </div>
        </form>
      ) : (
        <div className={`p-4 border-t ${tc.border} text-center`}>
          <p className={`${tc.textMuted} text-sm`}>
            🔒 This is a player chat. Parents can view messages but only coaches can post.
          </p>
        </div>
      )}
      
      {/* Manage Members Modal (Admin only) */}
      {showMembersModal && (
        <ManageMembersModal
          channel={channel}
          onClose={() => setShowMembersModal(false)}
          onRefresh={onRefresh}
          showToast={showToast}
        />
      )}
    </div>
  )
}

// ============================================
// MANAGE MEMBERS MODAL (Admin only)
// ============================================
function ManageMembersModal({ channel, onClose, onRefresh, showToast }) {
  const { user } = useAuth()
  const tc = useThemeClasses()
  const { selectedSeason } = useSeason()
  
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  
  useEffect(() => {
    loadMembers()
  }, [channel?.id])
  
  async function loadMembers() {
    setLoading(true)
    const { data } = await supabase
      .from('channel_members')
      .select('*, profiles:user_id(id, full_name, email, account_type)')
      .eq('channel_id', channel.id)
    setMembers(data || [])
    setLoading(false)
  }
  
  async function searchUsers(query) {
    if (query.length < 2) {
      setSearchResults([])
      return
    }
    
    setSearching(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, account_type')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(20)
    
    // Filter out users already in the channel
    const memberUserIds = members.map(m => m.user_id)
    const filtered = (data || []).filter(u => !memberUserIds.includes(u.id))
    
    setSearchResults(filtered)
    setSearching(false)
  }
  
  async function addMember(targetUser) {
    const { error } = await supabase.from('channel_members').insert({
      channel_id: channel.id,
      user_id: targetUser.id,
      display_name: targetUser.full_name || targetUser.email,
      member_role: targetUser.account_type || 'parent',
      can_post: channel.channel_type !== 'player_chat' || targetUser.account_type !== 'parent'
    })
    
    if (error) {
      showToast?.('Error adding member', 'error')
    } else {
      showToast?.('Member added!', 'success')
      loadMembers()
      setSearchQuery('')
      setSearchResults([])
    }
  }
  
  async function removeMember(memberId) {
    if (!confirm('Remove this member from the chat?')) return
    
    const { error } = await supabase
      .from('channel_members')
      .delete()
      .eq('id', memberId)
    
    if (error) {
      showToast?.('Error removing member', 'error')
    } else {
      showToast?.('Member removed', 'success')
      loadMembers()
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className={`${tc.cardBg} rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden`} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={`p-4 border-b ${tc.border} flex items-center justify-between`}>
          <h2 className={`text-lg font-bold ${tc.text}`}>Manage Members</h2>
          <button onClick={onClose} className={`p-2 rounded-lg ${tc.hoverBg}`}>
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Add Member Search */}
        <div className={`p-4 border-b ${tc.border}`}>
          <p className={`text-sm ${tc.textMuted} mb-2`}>Add someone to this chat:</p>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); searchUsers(e.target.value) }}
            className={`w-full px-4 py-2 rounded-xl ${tc.input}`}
          />
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
              {searchResults.map(u => (
                <button
                  key={u.id}
                  onClick={() => addMember(u)}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg ${tc.hoverBg} text-left text-sm`}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-500/20 flex items-center justify-center text-xs font-bold">
                    {u.full_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${tc.text} truncate`}>{u.full_name}</p>
                    <p className={`text-xs ${tc.textMuted} truncate`}>{u.account_type}</p>
                  </div>
                  <span className="text-[var(--accent-primary)] text-xs">+ Add</span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Current Members */}
        <div className="p-4 max-h-[300px] overflow-y-auto">
          <p className={`text-sm font-medium ${tc.text} mb-3`}>Current Members ({members.length})</p>
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin w-6 h-6 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full mx-auto" />
            </div>
          ) : (
            <div className="space-y-2">
              {members.map(member => (
                <div key={member.id} className={`flex items-center gap-3 p-2 rounded-xl ${tc.cardBgAlt}`}>
                  <div className="w-10 h-10 rounded-full bg-slate-500/20 flex items-center justify-center font-bold">
                    {member.profiles?.full_name?.charAt(0) || member.display_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${tc.text} truncate`}>
                      {member.profiles?.full_name || member.display_name}
                    </p>
                    <p className={`text-xs ${tc.textMuted}`}>
                      {member.member_role}
                      {member.can_post === false && <span className="ml-2 text-amber-400">• View only</span>}
                    </p>
                  </div>
                  {member.user_id !== user?.id && (
                    <button
                      onClick={() => removeMember(member.id)}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 text-sm"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// NEW CHAT MODAL
// ============================================
function NewChatModal({ teams, onClose, onCreateTeamChat, showToast }) {
  const { profile, user } = useAuth()
  const { selectedSeason } = useSeason()
  const tc = useThemeClasses()
  
  const [activeTab, setActiveTab] = useState('team') // team, dm
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  
  async function searchUsers(query) {
    if (query.length < 2) {
      setSearchResults([])
      return
    }
    
    setSearching(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, account_type')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .in('account_type', ['parent', 'coach', 'admin'])
      .neq('id', user?.id)
      .limit(20)
    
    setSearchResults(data || [])
    setSearching(false)
  }
  
  async function startDM(targetUser) {
    // Check if DM already exists between these users
    const { data: existing } = await supabase
      .from('chat_channels')
      .select(`
        id,
        channel_members!inner (user_id)
      `)
      .eq('channel_type', 'dm')
      .eq('season_id', selectedSeason?.id)
    
    // Look for a DM with both users
    const existingDM = existing?.find(ch => {
      const memberIds = ch.channel_members.map(m => m.user_id)
      return memberIds.includes(user?.id) && memberIds.includes(targetUser.id) && memberIds.length === 2
    })
    
    if (existingDM) {
      showToast?.('Chat already exists', 'info')
      onClose()
      return
    }
    
    // Create new DM
    const { data: newChannel, error } = await supabase
      .from('chat_channels')
      .insert({
        season_id: selectedSeason?.id,
        name: `${profile?.full_name} & ${targetUser.full_name}`,
        channel_type: 'dm',
        created_by: user?.id
      })
      .select()
      .single()
    
    if (error) {
      showToast?.('Error creating chat', 'error')
      return
    }
    
    // Add both users as members
    await supabase.from('channel_members').insert([
      {
        channel_id: newChannel.id,
        user_id: user?.id,
        display_name: profile?.full_name || 'User',
        member_role: profile?.account_type || 'parent',
        can_post: true
      },
      {
        channel_id: newChannel.id,
        user_id: targetUser.id,
        display_name: targetUser.full_name,
        member_role: targetUser.account_type || 'parent',
        can_post: true
      }
    ])
    
    showToast?.('Chat created!', 'success')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className={`${tc.cardBg} rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden`}>
        {/* Header */}
        <div className={`p-4 border-b ${tc.border} flex items-center justify-between`}>
          <h2 className={`text-xl font-bold ${tc.text}`}>New Conversation</h2>
          <button onClick={onClose} className={`p-2 rounded-lg ${tc.hoverBg}`}><X className="w-4 h-4" /></button>
        </div>
        
        {/* Tabs */}
        <div className={`flex border-b ${tc.border}`}>
          <button
            onClick={() => setActiveTab('team')}
            className={`flex-1 py-3 font-medium transition ${
              activeTab === 'team' 
                ? 'border-b-2 border-[var(--accent-primary)] text-[var(--accent-primary)]'
                : tc.textMuted
            }`}
          >
            👥 Team Chat
          </button>
          <button
            onClick={() => setActiveTab('dm')}
            className={`flex-1 py-3 font-medium transition ${
              activeTab === 'dm' 
                ? 'border-b-2 border-[var(--accent-primary)] text-[var(--accent-primary)]'
                : tc.textMuted
            }`}
          >
            💬 Direct Message
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 max-h-[400px] overflow-y-auto">
          {activeTab === 'team' ? (
            <div className="space-y-2">
              <p className={`text-sm ${tc.textMuted} mb-4`}>Select a team to create or open their chat:</p>
              {teams.map(team => (
                <button
                  key={team.id}
                  onClick={() => { onCreateTeamChat(team.id); onClose() }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl ${tc.cardBgAlt} ${tc.hoverBg} transition text-left`}
                >
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: team.color || '#6366F1' }}
                  >
                    {team.name?.charAt(0)}
                  </div>
                  <span className={`font-medium ${tc.text}`}>{team.name}</span>
                </button>
              ))}
              {teams.length === 0 && (
                <p className={`text-center py-8 ${tc.textMuted}`}>No teams in this season</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); searchUsers(e.target.value) }}
                className={`w-full px-4 py-3 rounded-xl ${tc.input}`}
              />
              
              {searching && (
                <p className={`text-center ${tc.textMuted}`}>Searching...</p>
              )}
              
              <div className="space-y-2">
                {searchResults.map(u => (
                  <button
                    key={u.id}
                    onClick={() => startDM(u)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl ${tc.cardBgAlt} ${tc.hoverBg} transition text-left`}
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-500/20 flex items-center justify-center font-bold">
                      {u.full_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className={`font-medium ${tc.text}`}>{u.full_name}</p>
                      <p className={`text-xs ${tc.textMuted}`}>{u.account_type}</p>
                    </div>
                  </button>
                ))}
                
                {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
                  <p className={`text-center py-4 ${tc.textMuted}`}>No users found</p>
                )}
                
                {searchQuery.length < 2 && (
                  <p className={`text-center py-4 ${tc.textMuted}`}>Type at least 2 characters to search</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


export { ChatsPage }
