// =============================================================================
// ChatPreviewCard — Team chat preview widget for all dashboards
// Shows last 3-5 messages with sender name, preview, and time ago
// =============================================================================

import { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { MessageCircle, ChevronRight } from 'lucide-react'

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const then = new Date(dateStr)
  const diffMs = now - then
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

export default function ChatPreviewCard({ selectedTeam, onNavigate }) {
  const { isDark } = useTheme()
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selectedTeam?.id) { setMessages([]); setLoading(false); return }

    async function fetchMessages() {
      setLoading(true)
      try {
        // Find the team's chat channel
        const { data: channel } = await supabase
          .from('chat_channels')
          .select('id')
          .eq('team_id', selectedTeam.id)
          .limit(1)
          .maybeSingle()

        if (!channel) { setMessages([]); setLoading(false); return }

        // Fetch recent messages with sender profiles
        const { data: msgs } = await supabase
          .from('chat_messages')
          .select('id, content, created_at, sender_id, profiles:sender_id(full_name, avatar_url)')
          .eq('channel_id', channel.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(5)

        setMessages(msgs || [])
      } catch (err) {
        console.error('ChatPreviewCard error:', err)
        setMessages([])
      }
      setLoading(false)
    }

    fetchMessages()
  }, [selectedTeam?.id])

  const cardBg = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-brand-border'

  return (
    <div className={`${cardBg} rounded-2xl shadow-sm p-3 h-full flex flex-col overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-2">
        <MessageCircle className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
        <h3 className={`text-xs font-bold uppercase tracking-[1.2px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Team Chat
        </h3>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-5 h-5 border-2 border-lynx-sky border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <MessageCircle className={`w-8 h-8 mb-2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
            <p className={`text-r-sm font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              No messages yet
            </p>
            <p className={`text-r-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Break the ice, Coach!
            </p>
          </div>
        ) : (
          messages.map(msg => {
            const senderName = msg.profiles?.full_name || 'Unknown'
            const initials = senderName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

            return (
              <div key={msg.id} className={`flex items-start gap-2 px-1.5 py-1 rounded-lg ${
                isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50'
              }`}>
                {/* Avatar */}
                {msg.profiles?.avatar_url ? (
                  <img src={msg.profiles.avatar_url} alt="" className="w-6 h-6 rounded-full shrink-0 object-cover" />
                ) : (
                  <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold ${
                    isDark ? 'bg-lynx-sky/20 text-lynx-sky' : 'bg-lynx-ice text-lynx-sky'
                  }`}>
                    {initials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-r-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {senderName.split(' ')[0]}
                    </span>
                    <span className={`text-[10px] shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {timeAgo(msg.created_at)}
                    </span>
                  </div>
                  <p className={`text-r-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {msg.content}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Open Chat link */}
      <button
        onClick={() => onNavigate?.('chats')}
        className="mt-2 w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-lynx-navy text-white text-r-xs font-bold hover:brightness-125 transition"
      >
        Open Chat <ChevronRight className="w-3 h-3" />
      </button>
    </div>
  )
}
