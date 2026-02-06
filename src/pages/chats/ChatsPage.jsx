import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { 
  Search, X, Plus, Send, Image, Smile, MoreVertical, 
  Check, CheckCheck, Reply, Trash2, ChevronLeft, Users, Hash,
  Paperclip, Gift
} from '../../constants/icons'

// ============================================
// MODERN CHATS PAGE - 2026 Design
// GroupMe-inspired with emoji, GIF, reactions
// ============================================

// Common emoji categories for quick access
const EMOJI_CATEGORIES = {
  recent: ['👍', '❤️', '😂', '🔥', '👏', '🙌', '💪', '🎉'],
  smileys: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥'],
  gestures: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🙏', '💪'],
  sports: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🏋️', '🤺', '🤾', '🏌️', '🏇', '⛹️', '🏊', '🚴', '🧗', '🤸', '🤼', '🤽', '🤾', '🧘'],
  hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  celebration: ['🎉', '🎊', '🎈', '🎁', '🎀', '🎗️', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🌟', '⭐', '✨', '💫', '🔥', '💥', '💯'],
}

// Reaction emojis
const REACTION_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🔥', '👏', '🎉']

// Tenor GIF API - Use Tenor's free tier
// Get your own key at: https://developers.google.com/tenor/guides/quickstart
const TENOR_API_KEY = import.meta.env.VITE_TENOR_API_KEY || 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ'

function ChatsPage({ showToast, activeView, roleContext }) {
  const { organization, profile, user, isAdmin } = useAuth()
  const { selectedSeason } = useSeason()
  const tc = useThemeClasses()
  const { isDark, accent } = useTheme()
  
  const [loading, setLoading] = useState(true)
  const [channels, setChannels] = useState([])
  const [selectedChannel, setSelectedChannel] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [showNewChat, setShowNewChat] = useState(false)
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768)

  // Handle responsive
  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (selectedSeason?.id) loadChats()
  }, [selectedSeason?.id, roleContext])

  async function loadChats() {
    setLoading(true)
    try {
      // Get user's team IDs based on role
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
      
      // Load channels
      const { data: channelsData, error } = await supabase
        .from('chat_channels')
        .select(`
          *,
          teams (id, name, color),
          channel_members!inner (id, user_id, display_name, last_read_at)
        `)
        .eq('season_id', selectedSeason.id)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false })
      
      if (error) throw error

      // Get last message for each channel
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
        
        // Count unread
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
      
      // Filter based on role
      let filtered = channelsWithMessages
      if (activeView === 'parent' || activeView === 'coach') {
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

  // Filter channels
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

  return (
    <div 
      className="h-[calc(100vh-180px)] flex rounded-2xl overflow-hidden"
      style={{ 
        background: isDark 
          ? 'linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)' 
          : 'linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%)',
        boxShadow: isDark 
          ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' 
          : '0 25px 50px -12px rgba(0, 0, 0, 0.15)'
      }}
    >
      {/* Sidebar - Conversation List */}
      {(!isMobileView || !selectedChannel) && (
        <div 
          className={`${isMobileView ? 'w-full' : 'w-80'} flex flex-col border-r`}
          style={{ borderColor: isDark ? '#ffffff10' : '#00000010' }}
        >
          {/* Header */}
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Chats
              </h1>
              <button
                onClick={() => setShowNewChat(true)}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ background: accent.primary }}
              >
                <Plus className="w-5 h-5 text-white" />
              </button>
            </div>
            
            {/* Search */}
            <div 
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
              style={{ background: isDark ? '#ffffff08' : '#00000008' }}
            >
              <Search className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`flex-1 bg-transparent outline-none text-sm ${isDark ? 'text-white placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'}`}
              />
            </div>
            
            {/* Filter Tabs */}
            <div className="flex gap-2">
              {['all', 'teams', 'dms'].map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    filterType === type 
                      ? 'text-white' 
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  style={filterType === type ? { background: accent.primary } : {}}
                >
                  {type === 'all' ? 'All' : type === 'teams' ? 'Teams' : 'DMs'}
                </button>
              ))}
            </div>
          </div>
          
          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div 
                  className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: accent.primary, borderTopColor: 'transparent' }}
                />
              </div>
            ) : filteredChannels.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="text-4xl mb-3">💬</div>
                <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  No conversations yet
                </p>
              </div>
            ) : (
              filteredChannels.map(channel => (
                <ConversationItem
                  key={channel.id}
                  channel={channel}
                  isSelected={selectedChannel?.id === channel.id}
                  onClick={() => setSelectedChannel(channel)}
                  formatTime={formatLastMessageTime}
                  isDark={isDark}
                  accent={accent}
                />
              ))
            )}
          </div>
        </div>
      )}
      
      {/* Chat Thread */}
      {(!isMobileView || selectedChannel) && (
        <div className="flex-1 flex flex-col">
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
            <div className="flex-1 flex flex-col items-center justify-center">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                style={{ background: isDark ? '#ffffff10' : '#00000008' }}
              >
                <span className="text-4xl">💬</span>
              </div>
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Select a conversation
              </h2>
              <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
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
          accent={accent}
        />
      )}
    </div>
  )
}

// ============================================
// CONVERSATION ITEM
// ============================================
function ConversationItem({ channel, isSelected, onClick, formatTime, isDark, accent }) {
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

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 flex items-center gap-3 transition-all hover:bg-white/5 ${
        isSelected ? 'bg-white/10' : ''
      }`}
      style={isSelected ? { borderLeft: `3px solid ${accent.primary}` } : { borderLeft: '3px solid transparent' }}
    >
      {/* Avatar */}
      <div 
        className="w-12 h-12 rounded-full flex items-center justify-center text-lg flex-shrink-0"
        style={{ 
          background: channel.teams?.color 
            ? `${channel.teams.color}30` 
            : isDark ? '#ffffff15' : '#00000010',
          color: channel.teams?.color || (isDark ? '#fff' : '#000')
        }}
      >
        {getChannelIcon()}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between gap-2">
          <span className={`font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {channel.name}
          </span>
          <span className={`text-xs flex-shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {formatTime(channel.last_message?.created_at)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className={`text-sm truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {getLastMessagePreview()}
          </span>
          {channel.unread_count > 0 && (
            <span 
              className="w-5 h-5 rounded-full text-xs font-bold text-white flex items-center justify-center flex-shrink-0"
              style={{ background: accent.primary }}
            >
              {channel.unread_count > 9 ? '9+' : channel.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

// ============================================
// CHAT THREAD
// ============================================
function ChatThread({ channel, onBack, onRefresh, showToast, isDark, accent, activeView, isMobile }) {
  const { user, profile } = useAuth()
  const messagesEndRef = useRef(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [replyingTo, setReplyingTo] = useState(null)
  const inputRef = useRef(null)

  // Determine if user can post
  const isPlayerChat = channel.channel_type === 'player_chat'
  const isParentView = activeView === 'parent'
  const canPost = !(isPlayerChat && isParentView)

  useEffect(() => {
    loadMessages()
    markAsRead()
    
    // Subscribe to new messages
    const subscription = supabase
      .channel(`chat-${channel.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `channel_id=eq.${channel.id}`
      }, (payload) => {
        handleNewMessage(payload.new)
      })
      .subscribe()
    
    return () => subscription.unsubscribe()
  }, [channel.id])

  async function loadMessages() {
    setLoading(true)
    const { data } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:sender_id (id, full_name, avatar_url),
        reply_to:reply_to_id (id, content, sender:sender_id(full_name))
      `)
      .eq('channel_id', channel.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .limit(100)
    
    setMessages(data || [])
    setLoading(false)
    scrollToBottom()
  }

  async function handleNewMessage(newMsg) {
    // Fetch full message with sender info
    const { data } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:sender_id (id, full_name, avatar_url),
        reply_to:reply_to_id (id, content, sender:sender_id(full_name))
      `)
      .eq('id', newMsg.id)
      .single()
    
    if (data) {
      setMessages(prev => [...prev, data])
      scrollToBottom()
      if (newMsg.sender_id !== user?.id) {
        markAsRead()
      }
    }
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
    e?.preventDefault()
    if (!newMessage.trim() || sending) return
    
    setSending(true)
    const { error } = await supabase.from('chat_messages').insert({
      channel_id: channel.id,
      sender_id: user?.id,
      content: newMessage.trim(),
      message_type: 'text',
      reply_to_id: replyingTo?.id || null
    })
    
    if (error) {
      showToast?.('Error sending message', 'error')
    } else {
      setNewMessage('')
      setReplyingTo(null)
      
      // Update channel updated_at
      await supabase
        .from('chat_channels')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', channel.id)
    }
    setSending(false)
    inputRef.current?.focus()
  }

  async function sendGif(gifUrl, gifPreview) {
    setSending(true)
    const { error } = await supabase.from('chat_messages').insert({
      channel_id: channel.id,
      sender_id: user?.id,
      content: gifUrl,
      message_type: 'gif',
      metadata: { preview: gifPreview }
    })
    
    if (!error) {
      setShowGifPicker(false)
      await supabase
        .from('chat_channels')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', channel.id)
    }
    setSending(false)
  }

  async function addReaction(messageId, emoji) {
    // Get current reactions
    const msg = messages.find(m => m.id === messageId)
    const reactions = msg?.reactions || {}
    const userReactions = reactions[emoji] || []
    
    let newReactions
    if (userReactions.includes(user?.id)) {
      // Remove reaction
      newReactions = {
        ...reactions,
        [emoji]: userReactions.filter(id => id !== user?.id)
      }
      if (newReactions[emoji].length === 0) delete newReactions[emoji]
    } else {
      // Add reaction
      newReactions = {
        ...reactions,
        [emoji]: [...userReactions, user?.id]
      }
    }
    
    await supabase
      .from('chat_messages')
      .update({ reactions: newReactions })
      .eq('id', messageId)
    
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, reactions: newReactions } : m
    ))
  }

  async function deleteMessage(messageId) {
    await supabase
      .from('chat_messages')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', messageId)
    
    setMessages(prev => prev.filter(m => m.id !== messageId))
    showToast?.('Message deleted', 'success')
  }

  const insertEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
    inputRef.current?.focus()
  }

  // Group messages by date
  const messageGroups = messages.reduce((groups, msg) => {
    const date = new Date(msg.created_at).toDateString()
    if (!groups[date]) groups[date] = []
    groups[date].push(msg)
    return groups
  }, {})

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div 
        className="px-4 py-3 flex items-center gap-3 border-b"
        style={{ 
          borderColor: isDark ? '#ffffff10' : '#00000010',
          background: isDark ? '#ffffff05' : '#ffffff80',
          backdropFilter: 'blur(10px)'
        }}
      >
        {isMobile && (
          <button onClick={onBack} className={`p-2 -ml-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}>
            <ChevronLeft className={`w-5 h-5 ${isDark ? 'text-white' : 'text-slate-900'}`} />
          </button>
        )}
        
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ 
            background: channel.teams?.color ? `${channel.teams.color}30` : isDark ? '#ffffff15' : '#00000010'
          }}
        >
          {channel.channel_type === 'team_chat' ? '👥' : channel.channel_type === 'player_chat' ? '🏐' : '💬'}
        </div>
        
        <div className="flex-1 min-w-0">
          <h2 className={`font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {channel.name}
          </h2>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {channel.channel_type === 'player_chat' ? 'Coaches only • Parents can view' : 
             channel.channel_type === 'team_chat' ? 'Team conversation' : 'Direct message'}
          </p>
        </div>
        
        <button className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}>
          <MoreVertical className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
        </button>
      </div>
      
      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-1"
        style={{ 
          background: isDark 
            ? 'radial-gradient(ellipse at top, #1e293b 0%, #0f172a 100%)' 
            : 'radial-gradient(ellipse at top, #ffffff 0%, #f1f5f9 100%)'
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div 
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: accent.primary, borderTopColor: 'transparent' }}
            />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">👋</div>
            <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Start the conversation!
            </p>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Send a message to get things going
            </p>
          </div>
        ) : (
          Object.entries(messageGroups).map(([date, msgs]) => (
            <div key={date}>
              {/* Date divider */}
              <div className="flex items-center gap-4 my-6">
                <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                <span 
                  className={`text-xs font-medium px-3 py-1 rounded-full ${
                    isDark ? 'bg-white/10 text-slate-300' : 'bg-black/5 text-slate-600'
                  }`}
                >
                  {formatDate(date)}
                </span>
                <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
              </div>
              
              {/* Messages */}
              {msgs.map((msg, idx) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={msg.sender_id === user?.id}
                  showAvatar={idx === 0 || msgs[idx - 1]?.sender_id !== msg.sender_id}
                  isDark={isDark}
                  accent={accent}
                  onReply={() => setReplyingTo(msg)}
                  onReact={(emoji) => addReaction(msg.id, emoji)}
                  onDelete={() => deleteMessage(msg.id)}
                  canDelete={msg.sender_id === user?.id}
                />
              ))}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Reply preview */}
      {replyingTo && (
        <div 
          className="px-4 py-2 flex items-center gap-3 border-t"
          style={{ 
            borderColor: isDark ? '#ffffff10' : '#00000010',
            background: isDark ? '#ffffff08' : '#00000005'
          }}
        >
          <Reply className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Replying to {replyingTo.sender?.full_name}
            </p>
            <p className={`text-xs truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {replyingTo.content}
            </p>
          </div>
          <button onClick={() => setReplyingTo(null)} className="p-1">
            <X className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          </button>
        </div>
      )}
      
      {/* Input */}
      {canPost ? (
        <div 
          className="p-4 border-t"
          style={{ borderColor: isDark ? '#ffffff10' : '#00000010' }}
        >
          <div 
            className="flex items-end gap-2 p-2 rounded-2xl"
            style={{ background: isDark ? '#ffffff08' : '#00000005' }}
          >
            {/* Attachment buttons */}
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setShowGifPicker(true)}
                className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-black/5 text-slate-500'}`}
                title="Send GIF"
              >
                <Gift className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-black/5 text-slate-500'}`}
                title="Add emoji"
              >
                <Smile className="w-5 h-5" />
              </button>
            </div>
            
            {/* Text input */}
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(e)}
              placeholder="Type a message..."
              className={`flex-1 bg-transparent outline-none py-2 px-2 text-sm ${
                isDark ? 'text-white placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'
              }`}
            />
            
            {/* Send button */}
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className={`p-2.5 rounded-xl transition-all disabled:opacity-30 ${
                newMessage.trim() ? 'hover:scale-110' : ''
              }`}
              style={{ 
                background: newMessage.trim() ? accent.primary : 'transparent',
                color: newMessage.trim() ? 'white' : isDark ? '#64748b' : '#94a3b8'
              }}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <EmojiPicker
              onSelect={insertEmoji}
              onClose={() => setShowEmojiPicker(false)}
              isDark={isDark}
            />
          )}
          
          {/* GIF Picker */}
          {showGifPicker && (
            <GifPicker
              onSelect={sendGif}
              onClose={() => setShowGifPicker(false)}
              isDark={isDark}
            />
          )}
        </div>
      ) : (
        <div 
          className="p-4 text-center border-t"
          style={{ borderColor: isDark ? '#ffffff10' : '#00000010' }}
        >
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            🔒 This is a player chat. Only coaches can send messages.
          </p>
        </div>
      )}
    </div>
  )
}

// ============================================
// MESSAGE BUBBLE
// ============================================
function MessageBubble({ message, isOwn, showAvatar, isDark, accent, onReply, onReact, onDelete, canDelete }) {
  const [showActions, setShowActions] = useState(false)
  const [showReactions, setShowReactions] = useState(false)

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const renderContent = () => {
    if (message.message_type === 'gif') {
      return (
        <img 
          src={message.content} 
          alt="GIF" 
          className="max-w-[240px] rounded-xl"
          loading="lazy"
        />
      )
    }
    if (message.message_type === 'image') {
      return (
        <img 
          src={message.content} 
          alt="Image" 
          className="max-w-[280px] rounded-xl"
          loading="lazy"
        />
      )
    }
    return (
      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
    )
  }

  const reactions = message.reactions || {}
  const hasReactions = Object.keys(reactions).length > 0

  return (
    <div 
      className={`flex gap-2 mb-2 group ${isOwn ? 'flex-row-reverse' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowReactions(false) }}
    >
      {/* Avatar */}
      {!isOwn && (
        <div className="w-8 flex-shrink-0">
          {showAvatar && (
            message.sender?.avatar_url ? (
              <img 
                src={message.sender.avatar_url} 
                alt="" 
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: isDark ? '#ffffff20' : '#00000010' }}
              >
                {message.sender?.full_name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )
          )}
        </div>
      )}
      
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Sender name */}
        {showAvatar && !isOwn && (
          <span className={`text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {message.sender?.full_name || 'Unknown'}
          </span>
        )}
        
        {/* Reply preview */}
        {message.reply_to && (
          <div 
            className={`text-xs px-3 py-1.5 rounded-t-xl mb-0.5 ${
              isOwn 
                ? 'bg-white/10 text-white/70 rounded-l-xl' 
                : isDark ? 'bg-white/5 text-slate-400 rounded-r-xl' : 'bg-black/5 text-slate-500 rounded-r-xl'
            }`}
          >
            <span className="font-medium">{message.reply_to.sender?.full_name}</span>
            <p className="truncate">{message.reply_to.content}</p>
          </div>
        )}
        
        {/* Message bubble */}
        <div className="relative">
          <div 
            className={`px-4 py-2.5 rounded-2xl ${
              isOwn 
                ? 'rounded-br-md' 
                : 'rounded-bl-md'
            }`}
            style={{
              background: isOwn 
                ? accent.primary 
                : isDark ? '#ffffff15' : '#00000008',
              color: isOwn ? 'white' : isDark ? '#f1f5f9' : '#0f172a'
            }}
          >
            {renderContent()}
            
            {/* Time */}
            <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
              <span className={`text-[10px] ${isOwn ? 'text-white/60' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {formatTime(message.created_at)}
              </span>
              {isOwn && (
                <CheckCheck className={`w-3 h-3 ${message.read_at ? 'text-blue-300' : 'text-white/40'}`} />
              )}
            </div>
          </div>
          
          {/* Action buttons */}
          {showActions && (
            <div 
              className={`absolute top-0 flex items-center gap-1 ${
                isOwn ? 'right-full mr-2' : 'left-full ml-2'
              }`}
            >
              <button 
                onClick={() => setShowReactions(!showReactions)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-white shadow hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Smile className="w-4 h-4" />
              </button>
              <button 
                onClick={onReply}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-white shadow hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Reply className="w-4 h-4" />
              </button>
              {canDelete && (
                <button 
                  onClick={onDelete}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isDark ? 'bg-slate-700 hover:bg-red-600 text-slate-300' : 'bg-white shadow hover:bg-red-50 text-slate-600 hover:text-red-500'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
          
          {/* Reaction picker */}
          {showReactions && (
            <div 
              className={`absolute top-8 flex items-center gap-1 p-2 rounded-xl shadow-lg z-10 ${
                isOwn ? 'right-0' : 'left-0'
              }`}
              style={{ background: isDark ? '#1e293b' : '#ffffff' }}
            >
              {REACTION_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => { onReact(emoji); setShowReactions(false) }}
                  className="w-8 h-8 rounded-lg hover:bg-black/10 transition-all hover:scale-125"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Reactions display */}
        {hasReactions && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
            {Object.entries(reactions).map(([emoji, users]) => (
              users.length > 0 && (
                <button
                  key={emoji}
                  onClick={() => onReact(emoji)}
                  className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 transition-all hover:scale-110 ${
                    isDark ? 'bg-white/10' : 'bg-black/5'
                  }`}
                >
                  <span>{emoji}</span>
                  <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{users.length}</span>
                </button>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// EMOJI PICKER
// ============================================
function EmojiPicker({ onSelect, onClose, isDark }) {
  const [activeCategory, setActiveCategory] = useState('recent')
  
  return (
    <div 
      className="absolute bottom-full mb-2 left-0 w-80 rounded-2xl shadow-2xl overflow-hidden"
      style={{ background: isDark ? '#1e293b' : '#ffffff' }}
    >
      {/* Categories */}
      <div className="flex border-b" style={{ borderColor: isDark ? '#ffffff10' : '#00000010' }}>
        {Object.keys(EMOJI_CATEGORIES).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              activeCategory === cat 
                ? isDark ? 'text-white bg-white/10' : 'text-slate-900 bg-black/5'
                : isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {cat === 'recent' ? '🕐' : 
             cat === 'smileys' ? '😀' : 
             cat === 'gestures' ? '👋' : 
             cat === 'sports' ? '🏐' : 
             cat === 'hearts' ? '❤️' : '🎉'}
          </button>
        ))}
      </div>
      
      {/* Emojis */}
      <div className="p-2 grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
        {EMOJI_CATEGORIES[activeCategory].map((emoji, i) => (
          <button
            key={i}
            onClick={() => onSelect(emoji)}
            className="w-8 h-8 rounded-lg hover:bg-black/10 transition-all hover:scale-125 text-xl"
          >
            {emoji}
          </button>
        ))}
      </div>
      
      {/* Close */}
      <button 
        onClick={onClose}
        className={`w-full py-2 text-sm font-medium border-t ${
          isDark ? 'border-white/10 text-slate-400 hover:text-white' : 'border-black/10 text-slate-500 hover:text-slate-900'
        }`}
      >
        Close
      </button>
    </div>
  )
}

// ============================================
// GIF PICKER (Tenor API)
// ============================================
function GifPicker({ onSelect, onClose, isDark }) {
  const [query, setQuery] = useState('')
  const [gifs, setGifs] = useState([])
  const [loading, setLoading] = useState(false)
  const [trending, setTrending] = useState([])
  
  useEffect(() => {
    loadTrending()
  }, [])
  
  async function loadTrending() {
    setLoading(true)
    try {
      const res = await fetch(
        `https://tenor.googleapis.com/v2/featured?key=${TENOR_API_KEY}&limit=20&media_filter=gif`
      )
      const data = await res.json()
      setTrending(data.results || [])
    } catch (err) {
      console.error('Error loading trending GIFs:', err)
    }
    setLoading(false)
  }
  
  async function searchGifs(q) {
    if (!q.trim()) {
      setGifs([])
      return
    }
    
    setLoading(true)
    try {
      const res = await fetch(
        `https://tenor.googleapis.com/v2/search?key=${TENOR_API_KEY}&q=${encodeURIComponent(q)}&limit=20&media_filter=gif`
      )
      const data = await res.json()
      setGifs(data.results || [])
    } catch (err) {
      console.error('Error searching GIFs:', err)
    }
    setLoading(false)
  }
  
  const displayGifs = query ? gifs : trending
  
  return (
    <div 
      className="absolute bottom-full mb-2 left-0 w-80 rounded-2xl shadow-2xl overflow-hidden"
      style={{ background: isDark ? '#1e293b' : '#ffffff' }}
    >
      {/* Search */}
      <div className="p-3 border-b" style={{ borderColor: isDark ? '#ffffff10' : '#00000010' }}>
        <div 
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: isDark ? '#ffffff10' : '#00000005' }}
        >
          <Search className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <input
            type="text"
            placeholder="Search GIFs..."
            value={query}
            onChange={e => { setQuery(e.target.value); searchGifs(e.target.value) }}
            className={`flex-1 bg-transparent outline-none text-sm ${
              isDark ? 'text-white placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'
            }`}
          />
        </div>
      </div>
      
      {/* GIFs Grid */}
      <div className="p-2 grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
        {loading ? (
          <div className="col-span-2 text-center py-8">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto" 
                 style={{ borderColor: '#6366f1', borderTopColor: 'transparent' }} />
          </div>
        ) : displayGifs.length === 0 ? (
          <div className={`col-span-2 text-center py-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {query ? 'No GIFs found' : 'Loading...'}
          </div>
        ) : (
          displayGifs.map(gif => (
            <button
              key={gif.id}
              onClick={() => onSelect(
                gif.media_formats?.gif?.url || gif.media_formats?.tinygif?.url,
                gif.media_formats?.tinygif?.url || gif.media_formats?.nanogif?.url
              )}
              className="aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
            >
              <img 
                src={gif.media_formats?.tinygif?.url || gif.media_formats?.nanogif?.url}
                alt={gif.content_description || 'GIF'}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))
        )}
      </div>
      
      {/* Powered by Tenor */}
      <div className="px-3 py-2 border-t flex items-center justify-between" 
           style={{ borderColor: isDark ? '#ffffff10' : '#00000010' }}>
        <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Powered by Tenor
        </span>
        <button 
          onClick={onClose}
          className={`text-sm font-medium ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
        >
          Close
        </button>
      </div>
    </div>
  )
}

// ============================================
// NEW CHAT MODAL
// ============================================
function NewChatModal({ onClose, onCreated, showToast, isDark, accent }) {
  const { user, profile } = useAuth()
  const { selectedSeason } = useSeason()
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadTeams()
  }, [])
  
  async function loadTeams() {
    const { data } = await supabase
      .from('teams')
      .select('*')
      .eq('season_id', selectedSeason?.id)
      .order('name')
    setTeams(data || [])
    setLoading(false)
  }
  
  async function createTeamChat(team, type = 'team_chat') {
    // Check if exists
    const { data: existing } = await supabase
      .from('chat_channels')
      .select('*')
      .eq('team_id', team.id)
      .eq('channel_type', type)
      .maybeSingle()
    
    if (existing) {
      onCreated(existing)
      return
    }
    
    const name = type === 'player_chat' 
      ? `${team.name} - Player Chat`
      : `${team.name} - Team Chat`
    
    const { data: newChannel, error } = await supabase
      .from('chat_channels')
      .insert({
        season_id: selectedSeason.id,
        team_id: team.id,
        name,
        channel_type: type,
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
    
    showToast?.('Chat created!', 'success')
    onCreated(newChannel)
  }
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: isDark ? '#1e293b' : '#ffffff' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="p-4 flex items-center justify-between border-b"
          style={{ borderColor: isDark ? '#ffffff10' : '#00000010' }}
        >
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            New Chat
          </h2>
          <button onClick={onClose} className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Teams list */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto"
                   style={{ borderColor: accent.primary, borderTopColor: 'transparent' }} />
            </div>
          ) : teams.length === 0 ? (
            <div className={`p-8 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              No teams found
            </div>
          ) : (
            <div className="p-2">
              <p className={`px-3 py-2 text-xs font-medium uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Create Team Chat
              </p>
              {teams.map(team => (
                <div key={team.id} className="mb-1">
                  <button
                    onClick={() => createTeamChat(team, 'team_chat')}
                    className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${
                      isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
                    }`}
                  >
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                      style={{ background: team.color ? `${team.color}30` : '#6366f130' }}
                    >
                      👥
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {team.name} - Team Chat
                      </p>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Parents, coaches, and players
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => createTeamChat(team, 'player_chat')}
                    className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${
                      isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
                    }`}
                  >
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                      style={{ background: team.color ? `${team.color}30` : '#6366f130' }}
                    >
                      🏐
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {team.name} - Player Chat
                      </p>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Coaches only • Parents view-only
                      </p>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatsPage
