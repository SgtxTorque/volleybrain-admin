import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  Search, X, Image, Smile, MoreVertical,
  Reply, ChevronLeft, Users, Gift, Download, Send
} from '../../constants/icons'
import MessageBubble from './MessageBubble'
import { EmojiPicker, GifPicker } from './ChatPickers'

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

export default ChatThread
