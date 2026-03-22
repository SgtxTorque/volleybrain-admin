import { useState, useEffect } from 'react'
import { MessageCircle } from '../../constants/icons'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function FloatingChatButton({ onNavigate }) {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user?.id) return
    loadUnread()
    const interval = setInterval(loadUnread, 30000)
    return () => clearInterval(interval)
  }, [user?.id])

  async function loadUnread() {
    try {
      const { data: memberships } = await supabase
        .from('channel_members')
        .select('channel_id, last_read_at')
        .eq('user_id', user.id)

      if (!memberships || memberships.length === 0) {
        setUnreadCount(0)
        return
      }

      let total = 0
      for (const membership of memberships) {
        const since = membership.last_read_at || new Date(Date.now() - 86400000).toISOString()
        const { count } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('channel_id', membership.channel_id)
          .neq('sender_id', user.id)
          .gt('created_at', since)
        total += (count || 0)
      }
      setUnreadCount(total)
    } catch { setUnreadCount(0) }
  }

  return (
    <button
      onClick={() => onNavigate?.('chats')}
      className="fixed bottom-6 right-24 z-40 w-14 h-14 rounded-full bg-lynx-sky text-white shadow-lg hover:brightness-110 transition-all hover:scale-105 flex items-center justify-center"
      title="Open Chat"
    >
      <MessageCircle className="w-6 h-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  )
}
