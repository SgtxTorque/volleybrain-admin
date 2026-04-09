import { useState, useEffect } from 'react'
import { MessageCircle } from '../../constants/icons'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function FloatingChatButton({ onNavigate }) {
  const { user, organization } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user?.id || !organization?.id) {
      setUnreadCount(0)
      return
    }
    loadUnread()
    const interval = setInterval(loadUnread, 30000)
    return () => clearInterval(interval)
  }, [user?.id, organization?.id])

  async function loadUnread() {
    try {
      if (!organization?.id) { setUnreadCount(0); return }

      // Step 1: Get channels that belong to the CURRENT organization only.
      // Without this filter, the badge counted unread messages across every
      // org the user belongs to — a brand-new org would show phantom counts.
      const { data: orgChannels } = await supabase
        .from('chat_channels')
        .select('id')
        .eq('organization_id', organization.id)

      if (!orgChannels || orgChannels.length === 0) {
        setUnreadCount(0)
        return
      }
      const orgChannelIds = orgChannels.map(c => c.id)

      // Step 2: Get this user's memberships scoped to the current org's channels.
      const { data: memberships } = await supabase
        .from('channel_members')
        .select('channel_id, last_read_at')
        .eq('user_id', user.id)
        .in('channel_id', orgChannelIds)

      if (!memberships || memberships.length === 0) {
        setUnreadCount(0)
        return
      }

      let total = 0
      for (const membership of memberships) {
        // If the user has never opened this channel, initialize last_read_at
        // to "now" so existing history doesn't inflate the badge. The old
        // behavior was to count the last 24 hours — which picked up any
        // auto-generated welcome/system messages.
        if (!membership.last_read_at) {
          await supabase
            .from('channel_members')
            .update({ last_read_at: new Date().toISOString() })
            .eq('channel_id', membership.channel_id)
            .eq('user_id', user.id)
          continue
        }

        const { count } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('channel_id', membership.channel_id)
          .neq('sender_id', user.id)
          .gt('created_at', membership.last_read_at)
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
