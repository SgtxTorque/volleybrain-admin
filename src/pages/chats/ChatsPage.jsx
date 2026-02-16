import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { 
  Search, X, Plus, Send, Image, Smile, MoreVertical, 
  Check, CheckCheck, Reply, Trash2, ChevronLeft, Users, Hash,
  Paperclip, Gift, Download
} from '../../constants/icons'

// ═══════════════════════════════════════════════════════════
// CHATS PAGE — 2026 Glassmorphism Redesign
// GroupMe-inspired with emoji, GIF, reactions
// ═══════════════════════════════════════════════════════════

const EMOJI_CATEGORIES = {
  recent: ['👍', '❤️', '😂', '🔥', '👏', '🙌', '💪', '🎉'],
  smileys: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥'],
  gestures: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🙏', '💪'],
  sports: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🏋️', '🤺', '🤾', '🏌️', '🏇', '⛹️', '🏊', '🚴', '🧗', '🤸', '🤼', '🤽', '🤾', '🧘'],
  hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  celebration: ['🎉', '🎊', '🎈', '🎁', '🎀', '🎗️', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🌟', '⭐', '✨', '💫', '🔥', '💥', '💯'],
}

const REACTION_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🔥', '👏', '🎉']

const TENOR_API_KEY = import.meta.env.VITE_TENOR_API_KEY || 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ'

// ═══════════════════════════════════════════════════════════
// SOUND EFFECTS (preserved exactly)
// ═══════════════════════════════════════════════════════════
const SOUNDS = {
  send: 'data:audio/wav;base64,UklGRl4BAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YToBAAB4eHh3d3Z1dHNycXBvbm1sa2ppZ2ZlZGNiYWBfXl1cW1pZWFdWVVRTUlFQT05NTExLS0tMTE1OT1BRUlNUVVZXWFlaW1xdXl9gYWJjZGVmZ2hpamtsbnBxc3R2d3l7fX+BgoWGiYqNjpGSlZaZmp2eoaKlpqmqra6xsrW2ubq9vsDDxMfIy8zP0NLV1tjb3N7h4uXm6ert7vDz9Pb5+vz/',
  receive: 'data:audio/wav;base64,UklGRn4BAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YVoBAABAPz49PDo5NzY0MzEwLi0rKigmJSMhIB4dGxoYFxUUEhEPDgwLCQgGBQMCAQAAAQIDBAUHCAoLDQ4QERMUFhcZGhwdHyAiIyUmKCkrLC4vMTI0NTc4Oj08Pj9BQkRFR0hKS01OUFFTVFVXWFpbXV5gYWNkZmdpamxsb3Bxc3R2d3l6fH1/gIKDhYaIiYuMjo+RkpSVl5iampydnqCio6WmqKmrrK6vsLKztLa3ubq7vb6/'
}

const playSound = (type) => {
  try {
    const audio = new Audio(SOUNDS[type])
    audio.volume = 0.3
    audio.play().catch(() => {})
  } catch (e) {}
}

const TYPING_TIMEOUT = 3000

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════
const CHAT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Rajdhani:wght@400;500;600;700&display=swap');

  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes scaleIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
  @keyframes slideIn{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}
  @keyframes msgIn{from{opacity:0;transform:translateY(6px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
  @keyframes typingDot{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-4px)}}

  .ch-au{animation:fadeUp .4s ease-out both}
  .ch-ai{animation:fadeIn .3s ease-out both}
  .ch-as{animation:scaleIn .25s ease-out both}
  .ch-sl{animation:slideIn .3s ease-out both}
  .ch-msg{animation:msgIn .3s ease-out both}

  .ch-display{font-family:'Bebas Neue',sans-serif;letter-spacing:.05em}
  .ch-heading{font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:.04em}

  .ch-glass{
    background:rgba(255,255,255,.03);
    backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
    border:1px solid rgba(255,255,255,.08);
    transition:all .25s cubic-bezier(.4,0,.2,1)
  }
  .ch-glass-solid{
    background:rgba(255,255,255,.04);
    backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
    border:1px solid rgba(255,255,255,.08)
  }

  .ch-nos::-webkit-scrollbar{display:none}.ch-nos{-ms-overflow-style:none;scrollbar-width:none}

  /* Light mode */
  .ch-light .ch-glass{
    background:rgba(255,255,255,.65);
    border-color:rgba(0,0,0,.06);
    box-shadow:0 4px 24px rgba(0,0,0,.06)
  }
  .ch-light .ch-glass-solid{
    background:rgba(255,255,255,.72);
    border-color:rgba(0,0,0,.06)
  }

  .typing-dot{animation:typingDot 1.4s ease-in-out infinite}
  .typing-dot:nth-child(2){animation-delay:.15s}
  .typing-dot:nth-child(3){animation-delay:.3s}
`

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
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

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (selectedSeason?.id) loadChats()
  }, [selectedSeason?.id, roleContext])

  // ═══════════════════════════════════════════════════════════
  // DATA LOADING — Preserved exactly
  // ═══════════════════════════════════════════════════════════

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
      
      let channelsQuery = supabase
        .from('chat_channels')
        .select(`
          *,
          teams (id, name, color, logo_url),
          channel_members (id, user_id, display_name, last_read_at)
        `)
        .eq('season_id', selectedSeason.id)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false })
      
      const { data: channelsData, error } = await channelsQuery
      
      if (error) throw error

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

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <div className={`${!isDark ? 'ch-light' : ''}`} style={{ fontFamily: "'DM Sans', system-ui" }}>
      <style>{CHAT_STYLES}</style>

      <div 
        className="h-[calc(100vh-180px)] flex overflow-hidden ch-glass ch-au"
        style={{ borderRadius: 28 }}
      >
        {/* ═══ SIDEBAR — Conversation List ═══ */}
        {(!isMobileView || !selectedChannel) && (
          <div 
            className={`${isMobileView ? 'w-full' : 'w-80'} flex flex-col`}
            style={{ borderRight: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.06)' }}
          >
            {/* Header */}
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="ch-display text-3xl font-bold" style={{ color: isDark ? 'white' : '#1a1a1a' }}>
                  CHATS
                </h1>
                <button
                  onClick={() => setShowNewChat(true)}
                  className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${accent.primary}, ${accent.primary}dd)`, boxShadow: `0 4px 16px ${accent.primary}40` }}
                >
                  <Plus className="w-5 h-5 text-white" />
                </button>
              </div>
              
              {/* Search */}
              <div 
                className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
                style={{ 
                  background: isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)',
                  border: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.04)',
                }}
              >
                <Search className="w-4 h-4 flex-shrink-0" style={{ color: isDark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.3)' }} />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: isDark ? 'white' : '#1a1a1a' }}
                />
              </div>
              
              {/* Filter Tabs — Pill style */}
              <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.02)' }}>
                {['all', 'teams', 'dms'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className="flex-1 px-3 py-1.5 rounded-lg text-[11px] font-bold ch-heading tracking-wider transition-all"
                    style={filterType === type ? { 
                      background: accent.primary, color: 'white',
                      boxShadow: `0 2px 8px ${accent.primary}40`
                    } : { 
                      color: isDark ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.4)' 
                    }}
                  >
                    {type === 'all' ? 'ALL' : type === 'teams' ? 'TEAMS' : 'DMs'}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto ch-nos px-2 pb-2">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div 
                    className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: accent.primary, borderTopColor: 'transparent' }}
                  />
                </div>
              ) : filteredChannels.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="text-5xl mb-3">💬</div>
                  <p className="text-sm font-semibold" style={{ color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)' }}>
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
                    accent={accent}
                    index={i}
                  />
                ))
              )}
            </div>
          </div>
        )}
        
        {/* ═══ CHAT THREAD ═══ */}
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
              <div className="flex-1 flex flex-col items-center justify-center ch-ai">
                <div 
                  className="w-24 h-24 rounded-3xl flex items-center justify-center mb-5"
                  style={{ 
                    background: isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)',
                    border: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.04)',
                  }}
                >
                  <span className="text-5xl">💬</span>
                </div>
                <h2 className="ch-display text-2xl font-bold" style={{ color: isDark ? 'white' : '#1a1a1a' }}>
                  SELECT A CONVERSATION
                </h2>
                <p className="mt-2 text-sm" style={{ color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)' }}>
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
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// CONVERSATION ITEM
// ═══════════════════════════════════════════════════════════
function ConversationItem({ channel, isSelected, onClick, formatTime, isDark, accent, index }) {
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

  const teamColor = channel.teams?.color || accent.primary

  return (
    <button
      onClick={onClick}
      className="w-full p-3 flex items-center gap-3 transition-all rounded-2xl mb-1 ch-sl"
      style={{ 
        animationDelay: `${index * .03}s`,
        background: isSelected 
          ? (isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)')
          : 'transparent',
        borderLeft: isSelected ? `3px solid ${accent.primary}` : '3px solid transparent',
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.02)' }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
    >
      {/* Avatar with gradient ring */}
      <div className="relative flex-shrink-0">
        <div className="p-[2px] rounded-2xl" style={{ background: isSelected ? `linear-gradient(135deg, ${teamColor}, ${teamColor}88)` : 'transparent' }}>
          <div 
            className="w-12 h-12 rounded-[14px] flex items-center justify-center text-lg"
            style={{ 
              background: `${teamColor}15`,
              color: teamColor,
              border: isSelected ? `2px solid ${isDark ? 'rgb(15,23,42)' : '#fff'}` : 'none',
            }}
          >
            {getChannelIcon()}
          </div>
        </div>
        {channel.unread_count > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center shadow-lg"
            style={{ background: accent.primary, boxShadow: `0 2px 8px ${accent.primary}50` }}>
            {channel.unread_count > 9 ? '9+' : channel.unread_count}
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-[14px] truncate" style={{ color: isDark ? 'white' : '#1a1a1a' }}>
            {channel.name}
          </span>
          <span className="text-[10px] flex-shrink-0 ch-heading tracking-wider" style={{ color: isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.25)' }}>
            {formatTime(channel.last_message?.created_at)}
          </span>
        </div>
        <p className="text-[12px] truncate mt-0.5" style={{ color: isDark ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.4)' }}>
          {getLastMessagePreview()}
        </p>
      </div>
    </button>
  )
}

// ═══════════════════════════════════════════════════════════
// CHAT THREAD — All logic preserved, visual upgrade
// ═══════════════════════════════════════════════════════════
function ChatThread({ channel, onBack, onRefresh, showToast, isDark, accent, activeView, isMobile }) {
  const { user, profile } = useAuth()
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [replyingTo, setReplyingTo] = useState(null)
  const [showMenu, setShowMenu] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [lightboxImage, setLightboxImage] = useState(null)
  const [showMediaGallery, setShowMediaGallery] = useState(false)
  const [mediaItems, setMediaItems] = useState([])
  const [loadingMedia, setLoadingMedia] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 })
  const [typingUsers, setTypingUsers] = useState([])
  const typingTimeoutRef = useRef(null)
  const presenceChannelRef = useRef(null)
  const menuButtonRef = useRef(null)
  const inputRef = useRef(null)

  const isPlayerChat = channel.channel_type === 'player_chat'
  const isParentView = activeView === 'parent'
  const canPost = !(isPlayerChat && isParentView)

  // ═══════════════════════════════════════════════════════════
  // ALL CHAT LOGIC — Preserved exactly
  // ═══════════════════════════════════════════════════════════

  useEffect(() => {
    loadMessages()
    markAsRead()
    
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
    
    const presenceChannel = supabase.channel(`typing-${channel.id}`, {
      config: { presence: { key: user?.id } }
    })
    
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        const typing = Object.values(state)
          .flat()
          .filter(p => p.typing && p.user_id !== user?.id)
          .map(p => p.user_name)
        setTypingUsers(typing)
      })
      .subscribe()
    
    presenceChannelRef.current = presenceChannel
    
    return () => {
      subscription.unsubscribe()
      presenceChannel.unsubscribe()
    }
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
        playSound('receive')
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

  function broadcastTyping() {
    if (!presenceChannelRef.current) return
    presenceChannelRef.current.track({
      user_id: user?.id,
      user_name: profile?.full_name || 'Someone',
      typing: true
    })
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => stopTyping(), TYPING_TIMEOUT)
  }

  function stopTyping() {
    if (!presenceChannelRef.current) return
    presenceChannelRef.current.track({
      user_id: user?.id,
      user_name: profile?.full_name || 'Someone',
      typing: false
    })
    if (typingTimeoutRef.current) { clearTimeout(typingTimeoutRef.current); typingTimeoutRef.current = null }
  }

  function handleInputChange(e) {
    setNewMessage(e.target.value)
    if (e.target.value.trim()) broadcastTyping()
    else stopTyping()
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
      playSound('send')
      stopTyping()
      setNewMessage('')
      setReplyingTo(null)
      await supabase
        .from('chat_channels')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', channel.id)
    }
    setSending(false)
    inputRef.current?.focus()
  }

  async function sendGif(gifUrl) {
    setSending(true)
    const { error } = await supabase.from('chat_messages').insert({
      channel_id: channel.id,
      sender_id: user?.id,
      content: gifUrl,
      message_type: 'gif'
    })
    if (!error) {
      playSound('send')
      setShowGifPicker(false)
      await supabase
        .from('chat_channels')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', channel.id)
    }
    setSending(false)
  }

  async function uploadPhoto(file) {
    if (!file) return
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      showToast?.('Please select an image file (JPEG, PNG, GIF, WebP)', 'error')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast?.('Image must be less than 5MB', 'error')
      return
    }
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `chat_${channel.id}_${Date.now()}.${fileExt}`
      const filePath = `chat-images/${fileName}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(filePath)
      const { error: msgError } = await supabase.from('chat_messages').insert({
        channel_id: channel.id,
        sender_id: user?.id,
        content: publicUrl,
        message_type: 'image'
      })
      if (msgError) throw msgError
      playSound('send')
      await supabase.from('chat_channels').update({ updated_at: new Date().toISOString() }).eq('id', channel.id)
    } catch (err) {
      console.error('Upload error:', err)
      showToast?.('Error uploading image', 'error')
    }
    setUploading(false)
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (file) { uploadPhoto(file); e.target.value = '' }
  }

  async function addReaction(messageId, emoji) {
    const msg = messages.find(m => m.id === messageId)
    const reactions = msg?.reactions || {}
    const userReactions = reactions[emoji] || []
    let newReactions
    if (userReactions.includes(user?.id)) {
      newReactions = { ...reactions, [emoji]: userReactions.filter(id => id !== user?.id) }
      if (newReactions[emoji].length === 0) delete newReactions[emoji]
    } else {
      newReactions = { ...reactions, [emoji]: [...userReactions, user?.id] }
    }
    await supabase.from('chat_messages').update({ reactions: newReactions }).eq('id', messageId)
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: newReactions } : m))
  }

  async function deleteMessage(messageId) {
    await supabase.from('chat_messages').update({ is_deleted: true, deleted_at: new Date().toISOString() }).eq('id', messageId)
    setMessages(prev => prev.filter(m => m.id !== messageId))
    showToast?.('Message deleted', 'success')
  }

  const insertEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
    inputRef.current?.focus()
  }

  async function loadMediaGallery() {
    setLoadingMedia(true)
    setShowMediaGallery(true)
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`id, content, message_type, created_at, sender:sender_id (id, full_name, avatar_url)`)
      .eq('channel_id', channel.id)
      .in('message_type', ['image', 'gif'])
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
    if (!error && data) setMediaItems(data)
    setLoadingMedia(false)
  }

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

  const teamColor = channel.teams?.color || accent.primary

  // ═══════════════════════════════════════════════════════════
  // CHAT THREAD RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="flex flex-col h-full">
      {/* ═══ Thread Header — Glass ═══ */}
      <div 
        className="px-5 py-3.5 flex items-center gap-4 ch-glass-solid"
        style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.06)', borderRadius: 0 }}
      >
        {isMobile && (
          <button onClick={onBack} className="p-2 -ml-2 rounded-xl transition" 
            style={{ color: isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)' }}
            onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        
        {/* Channel avatar with gradient ring */}
        <div className="p-[2px] rounded-2xl" style={{ background: `linear-gradient(135deg, ${teamColor}, ${teamColor}88)` }}>
          <div className="w-10 h-10 rounded-[12px] flex items-center justify-center text-lg"
            style={{ background: isDark ? 'rgb(15,23,42)' : '#fff', color: teamColor }}>
            {channel.channel_type === 'team_chat' ? '👥' : channel.channel_type === 'player_chat' ? '🏐' : '💬'}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-[15px] truncate" style={{ color: isDark ? 'white' : '#1a1a1a' }}>
            {channel.name}
          </h2>
          <p className="text-[11px]" style={{ color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)' }}>
            {channel.channel_type === 'player_chat' ? 'Coaches only • Parents can view' : 
             channel.channel_type === 'team_chat' ? 'Team conversation' : 'Direct message'}
          </p>
        </div>
        
        <div className="relative">
          <button 
            ref={menuButtonRef}
            onClick={() => {
              if (menuButtonRef.current) {
                const rect = menuButtonRef.current.getBoundingClientRect()
                setMenuPosition({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
              }
              setShowMenu(!showMenu)
            }}
            className="p-2 rounded-xl transition"
            style={{ color: isDark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.3)' }}
            onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Dropdown Menu */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setShowMenu(false)} />
          <div 
            className="fixed w-52 shadow-2xl z-[101] py-1.5 overflow-hidden ch-as"
            style={{ 
              top: menuPosition.top, right: menuPosition.right, borderRadius: 16,
              background: isDark ? 'rgba(15,23,42,.95)' : 'rgba(255,255,255,.95)',
              backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
              border: isDark ? '1px solid rgba(255,255,255,.1)' : '1px solid rgba(0,0,0,.08)',
            }}
          >
            {[
              { icon: <Image className="w-4 h-4" />, label: 'View Media', action: () => { setShowMenu(false); loadMediaGallery() } },
              { icon: <Users className="w-4 h-4" />, label: 'View Members', action: () => { setShowMenu(false); showToast?.('Members feature coming soon', 'info') } },
              { icon: '🔔', label: 'Mute Notifications', action: () => { setShowMenu(false); showToast?.('Notifications feature coming soon', 'info') } },
              { icon: <Search className="w-4 h-4" />, label: 'Search Messages', action: () => { setShowMenu(false); showToast?.('Search feature coming soon', 'info') } },
            ].map((item, i) => (
              <button key={i} onClick={item.action}
                className="w-full px-4 py-2.5 text-left text-[13px] flex items-center gap-3 transition"
                style={{ color: isDark ? 'rgba(255,255,255,.7)' : 'rgba(0,0,0,.6)' }}
                onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                {typeof item.icon === 'string' ? <span>{item.icon}</span> : item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
      
      {/* ═══ Messages Area ═══ */}
      <div 
        className="flex-1 overflow-y-auto p-5 space-y-1 relative ch-nos"
        style={{ 
          background: isDark 
            ? 'radial-gradient(ellipse at top, rgba(30,41,59,.5) 0%, rgba(15,23,42,.3) 100%)' 
            : 'radial-gradient(ellipse at top, rgba(255,255,255,.3) 0%, rgba(241,245,249,.2) 100%)'
        }}
      >
        {/* Team watermark */}
        {channel.teams?.logo_url && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: isDark ? 0.03 : 0.04 }}>
            <img src={channel.teams.logo_url} alt="" className="w-64 h-64 object-contain" />
          </div>
        )}
        {!channel.teams?.logo_url && channel.teams?.color && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: isDark ? 0.03 : 0.04 }}>
            <div className="w-48 h-48 rounded-full flex items-center justify-center text-8xl font-bold"
              style={{ backgroundColor: channel.teams.color, color: 'white' }}>
              {channel.teams.name?.charAt(0) || '🏐'}
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: accent.primary, borderTopColor: 'transparent' }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16 ch-au">
            <div className="text-6xl mb-4">👋</div>
            <p className="font-bold text-lg" style={{ color: isDark ? 'white' : '#1a1a1a' }}>Start the conversation!</p>
            <p className="text-sm mt-1.5" style={{ color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)' }}>
              Send a message to get things going
            </p>
          </div>
        ) : (
          Object.entries(messageGroups).map(([date, msgs]) => (
            <div key={date}>
              {/* Date divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px" style={{ background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)' }} />
                <span className="text-[10px] font-bold ch-heading tracking-wider px-3 py-1.5 rounded-full"
                  style={{ background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)', color: isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)' }}>
                  {formatDate(date)}
                </span>
                <div className="flex-1 h-px" style={{ background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)' }} />
              </div>
              
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
                  onImageClick={(url) => setLightboxImage(url)}
                  teamColor={teamColor}
                />
              ))}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Reply preview */}
      {replyingTo && (
        <div className="px-5 py-3 flex items-center gap-3"
          style={{ 
            borderTop: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.06)',
            background: isDark ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.02)',
          }}>
          <Reply className="w-4 h-4" style={{ color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)' }} />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold" style={{ color: isDark ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.5)' }}>
              Replying to {replyingTo.sender?.full_name}
            </p>
            <p className="text-[11px] truncate" style={{ color: isDark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.3)' }}>
              {replyingTo.content}
            </p>
          </div>
          <button onClick={() => setReplyingTo(null)} className="p-1.5 rounded-lg transition"
            style={{ color: isDark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.3)' }}
            onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* ═══ Input Bar ═══ */}
      {canPost ? (
        <div className="p-4 relative" style={{ borderTop: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.06)' }}>
          {showEmojiPicker && <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmojiPicker(false)} isDark={isDark} />}
          {showGifPicker && <GifPicker onSelect={sendGif} onClose={() => setShowGifPicker(false)} isDark={isDark} />}
          
          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <div className="mb-2.5 flex items-center gap-2 text-[12px]" style={{ color: isDark ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.4)' }}>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-current typing-dot" />
                <span className="w-1.5 h-1.5 rounded-full bg-current typing-dot" />
                <span className="w-1.5 h-1.5 rounded-full bg-current typing-dot" />
              </div>
              <span>
                {typingUsers.length === 1 
                  ? `${typingUsers[0]} is typing...`
                  : typingUsers.length === 2
                    ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
                    : `${typingUsers[0]} and ${typingUsers.length - 1} others are typing...`
                }
              </span>
            </div>
          )}
          
          <div className="flex items-end gap-2 p-2 rounded-2xl"
            style={{ 
              background: isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)',
              border: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.05)',
            }}>
            <div className="flex items-center gap-0.5">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              {[
                { icon: uploading ? null : <Image className="w-5 h-5" />, spinner: uploading, action: () => fileInputRef.current?.click(), title: 'Upload photo', disabled: uploading },
                { icon: <Gift className="w-5 h-5" />, action: () => { setShowGifPicker(!showGifPicker); setShowEmojiPicker(false) }, title: 'Send GIF', active: showGifPicker },
                { icon: <Smile className="w-5 h-5" />, action: () => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false) }, title: 'Add emoji', active: showEmojiPicker },
              ].map((btn, i) => (
                <button key={i} onClick={btn.action} disabled={btn.disabled} title={btn.title}
                  className={`p-2 rounded-xl transition ${btn.disabled ? 'opacity-40' : ''}`}
                  style={{ 
                    color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)',
                    background: btn.active ? (isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)') : 'transparent',
                  }}
                  onMouseEnter={e => { if (!btn.disabled) e.currentTarget.style.color = isDark ? 'rgba(255,255,255,.6)' : 'rgba(0,0,0,.6)' }}
                  onMouseLeave={e => e.currentTarget.style.color = isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)'}>
                  {btn.spinner ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : btn.icon}
                </button>
              ))}
            </div>
            
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(e)}
              placeholder="Type a message..."
              className="flex-1 bg-transparent outline-none py-2 px-2 text-sm"
              style={{ color: isDark ? 'white' : '#1a1a1a' }}
            />
            
            <button onClick={sendMessage} disabled={!newMessage.trim() || sending}
              className="p-2.5 rounded-xl transition-all disabled:opacity-20"
              style={{ 
                background: newMessage.trim() ? `linear-gradient(135deg, ${accent.primary}, ${accent.primary}dd)` : 'transparent',
                color: newMessage.trim() ? 'white' : (isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.2)'),
                boxShadow: newMessage.trim() ? `0 2px 12px ${accent.primary}40` : 'none',
              }}>
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 text-center" style={{ borderTop: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.06)' }}>
          <p className="text-sm" style={{ color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)' }}>
            🔒 This is a player chat. Only coaches can send messages.
          </p>
        </div>
      )}
      
      {/* Image Lightbox */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 ch-ai"
          style={{ background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(12px)' }}
          onClick={() => setLightboxImage(null)}>
          <button onClick={() => setLightboxImage(null)}
            className="absolute top-5 right-5 p-2.5 rounded-2xl transition"
            style={{ background: 'rgba(255,255,255,.1)', color: 'white' }}>
            <X className="w-6 h-6" />
          </button>
          <img src={lightboxImage} alt="Full size" 
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()} />
          <a href={lightboxImage} download target="_blank" rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-5 right-5 px-5 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-2 transition"
            style={{ background: 'rgba(255,255,255,.1)', backdropFilter: 'blur(8px)' }}>
            <Download className="w-4 h-4" /> Download
          </a>
        </div>
      )}
      
      {/* Media Gallery Modal */}
      {showMediaGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 ch-ai"
          style={{ background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowMediaGallery(false)}>
          <div className="w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col ch-as"
            style={{ 
              background: isDark ? 'rgba(15,23,42,.95)' : 'rgba(255,255,255,.95)',
              backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
              border: isDark ? '1px solid rgba(255,255,255,.1)' : '1px solid rgba(0,0,0,.08)',
              borderRadius: 24,
            }}
            onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.06)' }}>
              <div>
                <h2 className="font-bold text-lg" style={{ color: isDark ? 'white' : '#1a1a1a' }}>Media Gallery</h2>
                <p className="text-[12px]" style={{ color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)' }}>
                  {mediaItems.length} {mediaItems.length === 1 ? 'item' : 'items'} in {channel.name}
                </p>
              </div>
              <button onClick={() => setShowMediaGallery(false)} className="p-2 rounded-xl transition"
                style={{ color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)' }}
                onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 ch-nos">
              {loadingMedia ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: accent.primary, borderTopColor: 'transparent' }} />
                </div>
              ) : mediaItems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">📷</div>
                  <p className="font-bold" style={{ color: isDark ? 'white' : '#1a1a1a' }}>No media yet</p>
                  <p className="text-sm mt-1" style={{ color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)' }}>
                    Photos and GIFs shared in this chat will appear here
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {mediaItems.map((item) => (
                    <button key={item.id}
                      onClick={() => { setShowMediaGallery(false); setLightboxImage(item.content) }}
                      className="aspect-square rounded-2xl overflow-hidden group relative"
                      style={{ background: isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)' }}>
                      <img src={item.content} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5">
                        <p className="text-white text-xs font-bold truncate">{item.sender?.full_name || 'Unknown'}</p>
                        <p className="text-white/60 text-[10px]">{new Date(item.created_at).toLocaleDateString()}</p>
                      </div>
                      {item.message_type === 'gif' && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[9px] font-bold" style={{ background: 'rgba(0,0,0,.5)', color: 'white' }}>GIF</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// MESSAGE BUBBLE — Glass + gradient accents
// ═══════════════════════════════════════════════════════════
function MessageBubble({ message, isOwn, showAvatar, isDark, accent, onReply, onReact, onDelete, canDelete, onImageClick, teamColor }) {
  const [showActions, setShowActions] = useState(false)
  const [showReactions, setShowReactions] = useState(false)

  const formatTime = (date) => new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  const emojiRegex = /^(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F){1,5}$/u
  const isEmojiOnly = message.message_type === 'text' && emojiRegex.test(message.content?.trim() || '')

  const renderContent = () => {
    if (message.message_type === 'gif') {
      return <img src={message.content} alt="GIF" className="max-w-[240px] rounded-xl" loading="lazy" onError={(e) => { e.target.style.display = 'none' }} />
    }
    if (message.message_type === 'image') {
      return <img src={message.content} alt="Image" className="max-w-[280px] rounded-xl cursor-pointer hover:opacity-90 transition shadow-md" loading="lazy" onClick={() => onImageClick?.(message.content)} />
    }
    if (message.message_type === 'system') {
      return <p className="text-xs italic opacity-80">{message.content}</p>
    }
    if (isEmojiOnly) {
      return <span className="text-4xl leading-tight">{message.content}</span>
    }
    return <p className="text-[14px] whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
  }

  const reactions = message.reactions || {}
  const hasReactions = Object.keys(reactions).length > 0

  const getBubbleStyle = () => {
    if (message.message_type === 'system') {
      return { background: isDark ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.02)', color: isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)', boxShadow: 'none', border: 'none' }
    }
    if (isEmojiOnly) {
      return { background: 'transparent', color: isDark ? '#ffffff' : '#000000', boxShadow: 'none', border: 'none' }
    }
    if (isOwn) {
      return {
        background: isDark ? `linear-gradient(135deg, ${accent.primary}, ${accent.primary}cc)` : `linear-gradient(135deg, ${accent.primary}18, ${accent.primary}0a)`,
        color: isDark ? '#ffffff' : '#1a1a1a',
        border: isDark ? 'none' : `1px solid ${accent.primary}20`,
        boxShadow: isDark ? `0 4px 16px ${accent.primary}25` : `0 2px 12px ${accent.primary}10`
      }
    }
    return {
      background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.8)',
      color: isDark ? '#ffffff' : '#1a1a1a',
      border: isDark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(0,0,0,.06)',
      boxShadow: isDark ? '0 2px 8px rgba(0,0,0,.15)' : '0 2px 8px rgba(0,0,0,.05)'
    }
  }

  const bubbleStyle = getBubbleStyle()

  return (
    <div className="flex gap-2.5 mb-2 group ch-msg"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowReactions(false) }}>
      <div className="w-8 flex-shrink-0">
        {showAvatar && (
          message.sender?.avatar_url ? (
            <img src={message.sender.avatar_url} alt="" className="w-8 h-8 rounded-xl object-cover" style={{ boxShadow: '0 2px 8px rgba(0,0,0,.15)' }} />
          ) : (
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-bold text-white"
              style={{ background: `hsl(${(message.sender?.full_name?.charCodeAt(0) || 0) * 10 % 360}, 55%, 50%)` }}>
              {message.sender?.full_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )
        )}
      </div>
      
      <div className="max-w-[70%] flex flex-col">
        {showAvatar && (
          <span className="text-[11px] mb-1 font-bold" style={{ color: isDark ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.4)' }}>
            {message.sender?.full_name || 'Unknown'} {isOwn && <span style={{ opacity: .4 }}>(you)</span>}
          </span>
        )}
        
        {message.reply_to && (
          <div className="text-[11px] px-3 py-1.5 rounded-t-xl mb-0.5 border-l-2"
            style={{ 
              background: isDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.03)',
              borderColor: isOwn ? accent.primary : (isDark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.1)'),
              color: isDark ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.5)',
            }}>
            <span className="font-bold">{message.reply_to.sender?.full_name}</span>
            <p className="truncate opacity-70">{message.reply_to.content}</p>
          </div>
        )}
        
        <div className="relative">
          <div className={`${isEmojiOnly ? 'px-1 py-1' : 'px-4 py-2.5'} ${isEmojiOnly ? '' : 'rounded-2xl'} ${isOwn && !isEmojiOnly ? 'rounded-br-md' : !isOwn && !isEmojiOnly ? 'rounded-bl-md' : ''}`}
            style={bubbleStyle}>
            {renderContent()}
            {!isEmojiOnly && (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[10px]" style={{ color: isDark ? (isOwn ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.25)') : 'rgba(0,0,0,.3)' }}>
                  {formatTime(message.created_at)}
                </span>
                {isOwn && <CheckCheck className="w-3 h-3" style={{ color: isDark ? (message.read_at ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.3)') : (message.read_at ? 'rgba(0,0,0,.5)' : 'rgba(0,0,0,.2)') }} />}
              </div>
            )}
          </div>
          
          {isEmojiOnly && (
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px]" style={{ color: isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.25)' }}>{formatTime(message.created_at)}</span>
            </div>
          )}
          
          {showActions && message.message_type !== 'system' && (
            <div className="absolute top-0 flex items-center gap-1 left-full ml-2">
              {[
                { icon: <Smile className="w-4 h-4" />, action: () => setShowReactions(!showReactions) },
                { icon: <Reply className="w-4 h-4" />, action: onReply },
                canDelete && { icon: <Trash2 className="w-4 h-4" />, action: onDelete, danger: true },
              ].filter(Boolean).map((btn, i) => (
                <button key={i} onClick={btn.action}
                  className="p-1.5 rounded-lg transition"
                  style={{ 
                    background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.9)',
                    color: isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)',
                    boxShadow: isDark ? 'none' : '0 2px 6px rgba(0,0,0,.08)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = btn.danger ? (isDark ? 'rgba(239,68,68,.3)' : 'rgba(239,68,68,.1)') : (isDark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.06)'); if (btn.danger) e.currentTarget.style.color = '#EF4444' }}
                  onMouseLeave={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.9)'; e.currentTarget.style.color = isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)' }}>
                  {btn.icon}
                </button>
              ))}
            </div>
          )}
          
          {showReactions && (
            <div className="absolute top-8 flex items-center gap-1 p-2 rounded-2xl shadow-xl z-10 left-0"
              style={{ background: isDark ? 'rgba(15,23,42,.95)' : 'rgba(255,255,255,.95)', backdropFilter: 'blur(16px)', border: isDark ? '1px solid rgba(255,255,255,.1)' : '1px solid rgba(0,0,0,.08)' }}>
              {REACTION_EMOJIS.map(emoji => (
                <button key={emoji} onClick={() => { onReact(emoji); setShowReactions(false) }}
                  className="w-8 h-8 rounded-lg transition-all hover:scale-125 text-lg"
                  onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {hasReactions && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(reactions).map(([emoji, users]) => (
              users.length > 0 && (
                <button key={emoji} onClick={() => onReact(emoji)}
                  className="px-2 py-0.5 rounded-full text-xs flex items-center gap-1 transition-all hover:scale-110"
                  style={{ background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)', border: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.04)' }}>
                  <span>{emoji}</span>
                  <span style={{ color: isDark ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.5)' }}>{users.length}</span>
                </button>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// EMOJI PICKER — Glass treatment
// ═══════════════════════════════════════════════════════════
function EmojiPicker({ onSelect, onClose, isDark }) {
  const [activeCategory, setActiveCategory] = useState('recent')
  
  return (
    <div className="absolute bottom-full mb-2 left-0 w-80 overflow-hidden shadow-2xl ch-as"
      style={{ 
        background: isDark ? 'rgba(15,23,42,.95)' : 'rgba(255,255,255,.95)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        border: isDark ? '1px solid rgba(255,255,255,.1)' : '1px solid rgba(0,0,0,.08)',
        borderRadius: 20,
      }}>
      <div className="flex" style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.06)' }}>
        {Object.keys(EMOJI_CATEGORIES).map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className="flex-1 py-2.5 text-xs font-medium transition-all"
            style={{ 
              color: activeCategory === cat ? (isDark ? 'white' : '#1a1a1a') : (isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)'),
              background: activeCategory === cat ? (isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)') : 'transparent',
            }}>
            {cat === 'recent' ? '🕐' : cat === 'smileys' ? '😀' : cat === 'gestures' ? '👋' : cat === 'sports' ? '🏐' : cat === 'hearts' ? '❤️' : '🎉'}
          </button>
        ))}
      </div>
      <div className="p-2 grid grid-cols-8 gap-1 max-h-48 overflow-y-auto ch-nos">
        {EMOJI_CATEGORIES[activeCategory].map((emoji, i) => (
          <button key={i} onClick={() => onSelect(emoji)}
            className="w-8 h-8 rounded-lg transition-all hover:scale-125 text-xl"
            onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            {emoji}
          </button>
        ))}
      </div>
      <button onClick={onClose}
        className="w-full py-2.5 text-sm font-bold transition"
        style={{ borderTop: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.06)', color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)' }}>
        Close
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// GIF PICKER — Tenor API, glass treatment
// ═══════════════════════════════════════════════════════════
function GifPicker({ onSelect, onClose, isDark }) {
  const [query, setQuery] = useState('')
  const [gifs, setGifs] = useState([])
  const [loading, setLoading] = useState(false)
  const [trending, setTrending] = useState([])
  const [error, setError] = useState(null)
  
  useEffect(() => { loadTrending() }, [])
  
  async function loadTrending() {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`https://tenor.googleapis.com/v2/featured?key=${TENOR_API_KEY}&limit=20&media_filter=tinygif,gif&contentfilter=medium`)
      const data = await res.json()
      if (data.results) setTrending(data.results)
      else if (data.error) setError(data.error.message)
    } catch (err) { console.error('Error loading trending GIFs:', err); setError('Failed to load GIFs') }
    setLoading(false)
  }
  
  async function searchGifs(q) {
    if (!q.trim()) { setGifs([]); return }
    setLoading(true)
    try {
      const res = await fetch(`https://tenor.googleapis.com/v2/search?key=${TENOR_API_KEY}&q=${encodeURIComponent(q)}&limit=20&media_filter=tinygif,gif&contentfilter=medium`)
      const data = await res.json()
      setGifs(data.results || [])
    } catch (err) { console.error('Error searching GIFs:', err) }
    setLoading(false)
  }
  
  const getGifUrl = (gif, type = 'preview') => {
    if (type === 'preview') return gif.media_formats?.tinygif?.url || gif.media_formats?.nanogif?.url || gif.media_formats?.gif?.url || gif.url
    return gif.media_formats?.gif?.url || gif.media_formats?.mediumgif?.url || gif.media_formats?.tinygif?.url || gif.url
  }
  
  const displayGifs = query ? gifs : trending
  
  return (
    <div className="absolute bottom-full mb-2 left-0 w-80 overflow-hidden shadow-2xl ch-as"
      style={{ 
        background: isDark ? 'rgba(15,23,42,.95)' : 'rgba(255,255,255,.95)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        border: isDark ? '1px solid rgba(255,255,255,.1)' : '1px solid rgba(0,0,0,.08)',
        borderRadius: 20,
      }}>
      <div className="p-3" style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.06)' }}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.03)', border: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.04)' }}>
          <Search className="w-4 h-4" style={{ color: isDark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.3)' }} />
          <input type="text" placeholder="Search GIFs..." value={query}
            onChange={e => { setQuery(e.target.value); searchGifs(e.target.value) }}
            className="flex-1 bg-transparent outline-none text-sm" style={{ color: isDark ? 'white' : '#1a1a1a' }} />
        </div>
      </div>
      <div className="p-2 grid grid-cols-2 gap-2 max-h-64 overflow-y-auto ch-nos">
        {loading ? (
          <div className="col-span-2 text-center py-8">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: '#6366f1', borderTopColor: 'transparent' }} />
          </div>
        ) : displayGifs.length === 0 ? (
          <div className="col-span-2 text-center py-8" style={{ color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)' }}>
            {error ? error : query ? 'No GIFs found' : 'Loading...'}
          </div>
        ) : (
          displayGifs.map(gif => (
            <button key={gif.id} onClick={() => onSelect(getGifUrl(gif, 'full'))}
              className="aspect-square rounded-xl overflow-hidden transition-all hover:ring-2"
              style={{ background: isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)' }}>
              <img src={getGifUrl(gif, 'preview')} alt={gif.content_description || 'GIF'}
                className="w-full h-full object-cover" loading="lazy"
                onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="50" x="25" font-size="40">🎬</text></svg>' }} />
            </button>
          ))
        )}
      </div>
      <div className="px-3 py-2 flex items-center justify-between" style={{ borderTop: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.06)' }}>
        <span className="text-[10px]" style={{ color: isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.25)' }}>Powered by Tenor</span>
        <button onClick={onClose} className="text-sm font-bold transition" style={{ color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)' }}>Close</button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// NEW CHAT MODAL — Glass treatment
// ═══════════════════════════════════════════════════════════
function NewChatModal({ onClose, onCreated, showToast, isDark, accent }) {
  const { user, profile } = useAuth()
  const { selectedSeason } = useSeason()
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(null)
  
  useEffect(() => { loadTeams() }, [])
  
  async function loadTeams() {
    const { data } = await supabase.from('teams').select('*').eq('season_id', selectedSeason?.id).order('name')
    setTeams(data || [])
    setLoading(false)
  }
  
  async function createTeamChat(team, type = 'team_chat') {
    setCreating(`${team.id}-${type}`)
    try {
      const { data: existing } = await supabase
        .from('chat_channels').select('*').eq('team_id', team.id).eq('channel_type', type).maybeSingle()
      
      if (existing) {
        const { data: membership } = await supabase
          .from('channel_members').select('id').eq('channel_id', existing.id).eq('user_id', user?.id).maybeSingle()
        if (!membership) {
          await supabase.from('channel_members').insert({
            channel_id: existing.id, user_id: user?.id,
            display_name: profile?.full_name || profile?.email || 'User',
            member_role: 'member', can_post: type !== 'player_chat'
          })
        }
        onCreated(existing)
        return
      }
      
      const name = type === 'player_chat' ? `${team.name} - Player Chat` : `${team.name} - Team Chat`
      const { data: newChannel, error } = await supabase
        .from('chat_channels').insert({ season_id: selectedSeason.id, team_id: team.id, name, channel_type: type, created_by: user?.id })
        .select().single()
      
      if (error) { console.error('Error creating chat:', error); showToast?.('Error creating chat: ' + error.message, 'error'); setCreating(null); return }
      
      await supabase.from('channel_members').insert({
        channel_id: newChannel.id, user_id: user?.id,
        display_name: profile?.full_name || 'Admin',
        member_role: 'admin', can_post: true, can_moderate: true
      })
      
      showToast?.('Chat created!', 'success')
      onCreated(newChannel)
    } catch (err) {
      console.error('Error:', err)
      showToast?.('Error creating chat', 'error')
      setCreating(null)
    }
  }
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 ch-ai"
      style={{ background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden ch-as"
        style={{ 
          background: isDark ? 'rgba(15,23,42,.95)' : 'rgba(255,255,255,.95)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          border: isDark ? '1px solid rgba(255,255,255,.1)' : '1px solid rgba(0,0,0,.08)',
          borderRadius: 24,
        }}
        onClick={e => e.stopPropagation()}>
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.06)' }}>
          <h2 className="ch-display text-xl font-bold" style={{ color: isDark ? 'white' : '#1a1a1a' }}>NEW CHAT</h2>
          <button onClick={onClose} className="p-2 rounded-xl transition"
            style={{ color: isDark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.3)' }}
            onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="max-h-96 overflow-y-auto ch-nos">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto"
                style={{ borderColor: accent.primary, borderTopColor: 'transparent' }} />
            </div>
          ) : teams.length === 0 ? (
            <div className="p-8 text-center" style={{ color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)' }}>No teams found</div>
          ) : (
            <div className="p-3">
              <p className="px-3 py-2 text-[9px] font-bold ch-heading tracking-[.2em]" style={{ color: isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.25)' }}>
                CREATE TEAM CHAT
              </p>
              {teams.map(team => (
                <div key={team.id} className="mb-1">
                  {[
                    { type: 'team_chat', icon: '👥', label: 'Team Chat', desc: 'Parents, coaches, and players' },
                    { type: 'player_chat', icon: '🏐', label: 'Player Chat', desc: 'Coaches only • Parents view-only' },
                  ].map(opt => (
                    <button key={opt.type} onClick={() => createTeamChat(team, opt.type)} disabled={creating !== null}
                      className="w-full p-3.5 rounded-xl flex items-center gap-3.5 transition-all disabled:opacity-40"
                      onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg"
                        style={{ background: team.color ? `${team.color}15` : `${accent.primary}15` }}>
                        {creating === `${team.id}-${opt.type}` ? (
                          <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                            style={{ borderColor: team.color || accent.primary, borderTopColor: 'transparent' }} />
                        ) : opt.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-bold text-[14px]" style={{ color: isDark ? 'white' : '#1a1a1a' }}>
                          {team.name} - {opt.label}
                        </p>
                        <p className="text-[11px]" style={{ color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)' }}>{opt.desc}</p>
                      </div>
                    </button>
                  ))}
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
