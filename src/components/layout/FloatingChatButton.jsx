import { useState, useEffect } from 'react'
import { MessageCircle } from '../../constants/icons'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'

export default function FloatingChatButton({ onNavigate }) {
  const { user, organization } = useAuth()
  const { allSeasons } = useSeason()
  const [unreadCount, setUnreadCount] = useState(0)
  const [hasChannels, setHasChannels] = useState(false)

  useEffect(() => {
    if (!user?.id || !organization?.id) {
      setUnreadCount(0)
      setHasChannels(false)
      return
    }
    loadUnread()
    const interval = setInterval(loadUnread, 30000)
    return () => clearInterval(interval)
  }, [user?.id, organization?.id, allSeasons])

  async function loadUnread() {
    try {
      if (!organization?.id) {
        setUnreadCount(0)
        setHasChannels(false)
        return
      }

      // Step 1: Get channels scoped to the current org's seasons.
      // chat_channels has no organization_id column — scope via season_id
      // using the same pattern as ChatsPage.jsx.
      const seasonIds = (allSeasons || []).map(s => s.id)
      if (seasonIds.length === 0) {
        setHasChannels(false)
        setUnreadCount(0)
        return
      }

      const { data: orgChannels } = await supabase
        .from('chat_channels')
        .select('id')
        .in('season_id', seasonIds)

      if (!orgChannels || orgChannels.length === 0) {
        // No channels in this org → hide the widget entirely. No bubble, no
        // badge, no mystery "6" count on day zero. The bubble reappears the
        // moment the first channel is created (team with chat enabled, admin
        // creates a channel manually, etc.).
        setHasChannels(false)
        setUnreadCount(0)
        return
      }
      setHasChannels(true)
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
    } catch {
      setUnreadCount(0)
      setHasChannels(false)
    }
  }

  // Day-zero orgs have no channels → render nothing at all. The bubble
  // reappears once the first chat_channels row exists for this org.
  if (!hasChannels) return null

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
