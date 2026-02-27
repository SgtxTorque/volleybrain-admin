import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { Search, X, Plus } from '../../constants/icons'
import ChatThread from './ChatThread'

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════
const CHAT_STYLES = `
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
    <div className={`${!isDark ? 'ch-light' : ''}`}>
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
                <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: isDark ? 'white' : '#1a1a1a' }}>
                  CHATS
                </h1>
                <button
                  onClick={() => setShowNewChat(true)}
                  className="w-11 h-11 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${accent.primary}, ${accent.primary}dd)`, boxShadow: `0 4px 16px ${accent.primary}40` }}
                >
                  <Plus className="w-5 h-5 text-white" />
                </button>
              </div>
              
              {/* Search */}
              <div 
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
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
                    className="flex-1 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all"
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
                  className="w-24 h-24 rounded-xl flex items-center justify-center mb-5"
                  style={{ 
                    background: isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)',
                    border: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.04)',
                  }}
                >
                  <span className="text-5xl">💬</span>
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: isDark ? 'white' : '#1a1a1a' }}>
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
      className="w-full p-3 flex items-center gap-3 transition-all rounded-xl mb-1 ch-sl"
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
        <div className="p-[2px] rounded-xl" style={{ background: isSelected ? `linear-gradient(135deg, ${teamColor}, ${teamColor}88)` : 'transparent' }}>
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
          <span className="text-[10px] flex-shrink-0 font-bold uppercase tracking-wider" style={{ color: isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.25)' }}>
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
          <h2 className="text-xl font-extrabold tracking-tight" style={{ color: isDark ? 'white' : '#1a1a1a' }}>NEW CHAT</h2>
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
              <p className="px-3 py-2 text-[9px] font-bold uppercase tracking-[.2em]" style={{ color: isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.25)' }}>
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
