// =============================================================================
// ChatContextPanel — Right-side context panel for chat conversations
// Shows: team info, next event, roster preview, quick templates (team channels)
//        or contact card (DM channels)
// =============================================================================

import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  Users, Clock, MapPin, Calendar, ChevronRight, Send
} from '../../constants/icons'

const QUICK_TEMPLATES = [
  { label: 'Practice Update', icon: '🏐', text: 'Hey team! Quick update about practice: ' },
  { label: 'Weather Delay', icon: '🌧️', text: 'Due to weather conditions, today\'s practice/game has been delayed. We\'ll update you with the new time shortly.' },
  { label: 'Fee Reminder', icon: '💰', text: 'Friendly reminder — please check your outstanding fees in the app. Let us know if you have any questions!' },
  { label: 'Game Day', icon: '🎯', text: 'Game day! Please arrive 30 minutes early for warmups. Don\'t forget your jersey and water bottle.' },
  { label: 'Schedule Change', icon: '📅', text: 'Heads up — there\'s been a schedule change. Please check the updated schedule in the app.' },
  { label: 'Great Job', icon: '⭐', text: 'Great effort today, team! Keep up the hard work. 💪' },
]

export default function ChatContextPanel({ channel, onTemplateInsert, showToast }) {
  const { isDark } = useTheme()
  const { organization } = useAuth()
  const [teamPlayers, setTeamPlayers] = useState([])
  const [nextEvent, setNextEvent] = useState(null)
  const [loadingRoster, setLoadingRoster] = useState(false)

  const isTeamChannel = channel?.channel_type === 'team_chat' || channel?.channel_type === 'player_chat'
  const isDM = channel?.channel_type === 'dm' || channel?.channel_type === 'group_dm'
  const teamId = channel?.team_id
  const teamColor = channel?.teams?.color || '#10284C'
  const teamName = channel?.teams?.name || channel?.name || 'Channel'

  useEffect(() => {
    if (isTeamChannel && teamId) {
      loadTeamData()
    }
  }, [teamId, channel?.id])

  async function loadTeamData() {
    setLoadingRoster(true)
    try {
      // Load roster
      const { data: tp } = await supabase
        .from('team_players')
        .select('id, jersey_number, player_id, players(id, first_name, last_name, photo_url, position)')
        .eq('team_id', teamId)
        .limit(6)

      setTeamPlayers(tp || [])

      // Load next event
      const now = new Date().toISOString()
      const { data: events } = await supabase
        .from('schedule_events')
        .select('id, title, event_type, start_time, end_time, location')
        .eq('team_id', teamId)
        .gte('start_time', now)
        .order('start_time', { ascending: true })
        .limit(1)

      setNextEvent(events?.[0] || null)
    } catch (err) {
      console.error('Error loading team data:', err)
    }
    setLoadingRoster(false)
  }

  const cardBg = isDark
    ? 'bg-white/[0.03] border border-white/[0.06]'
    : 'bg-white border border-[#E8ECF2]'
  const sectionLabel = `text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`

  // ── DM Channel — Contact Card ──
  if (isDM) {
    const members = channel?.channel_members || []
    const otherMember = members.find(m => m.display_name)

    return (
      <div className="p-4 space-y-4">
        <div className="text-center pt-4">
          <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-2xl mb-3 ${
            isDark ? 'bg-white/[0.06]' : 'bg-slate-100'
          }`}>
            💬
          </div>
          <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
            {channel.name || 'Direct Message'}
          </h3>
          {otherMember && (
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {otherMember.display_name}
            </p>
          )}
        </div>
        <div className={`${cardBg} rounded-xl p-4 text-center`}>
          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            This is a direct conversation. Messages are private between participants.
          </p>
        </div>
      </div>
    )
  }

  // ── Team Channel — Full Context Panel ──
  return (
    <div className="p-4 space-y-4">
      {/* Team Header */}
      <div className="text-center pt-2">
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-2xl mb-3"
          style={{ backgroundColor: `${teamColor}15`, color: teamColor }}>
          {channel.teams?.logo_url ? (
            <img src={channel.teams.logo_url} alt="" className="w-16 h-16 rounded-2xl object-cover" />
          ) : (
            teamName.charAt(0)
          )}
        </div>
        <h3 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-[#10284C]'}`}
          style={{ fontFamily: 'var(--v2-font)' }}>
          {teamName}
        </h3>
        <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {channel.channel_type === 'player_chat' ? 'Player Chat' : 'Team Chat'}
          {channel.channel_members?.length > 0 && ` · ${channel.channel_members.length} members`}
        </p>
      </div>

      {/* Next Event Card */}
      {nextEvent && (
        <div>
          <h4 className={`${sectionLabel} mb-2`} style={{ fontFamily: 'var(--v2-font)' }}>
            Next Event
          </h4>
          <div className={`${cardBg} rounded-xl p-3.5`}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg"
                style={{ backgroundColor: `${teamColor}15` }}>
                {nextEvent.event_type === 'game' || nextEvent.event_type === 'match' ? '🏐' :
                 nextEvent.event_type === 'practice' ? '🏋️' : '📅'}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
                  {nextEvent.title}
                </p>
                <div className={`flex items-center gap-1.5 mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(nextEvent.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                </div>
                <div className={`flex items-center gap-1.5 mt-0.5 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  <Clock className="w-3 h-3" />
                  <span>{new Date(nextEvent.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                </div>
                {nextEvent.location && (
                  <div className={`flex items-center gap-1.5 mt-0.5 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{nextEvent.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Roster Preview */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className={sectionLabel} style={{ fontFamily: 'var(--v2-font)' }}>
            Active Roster
          </h4>
          {teamPlayers.length > 0 && (
            <span className={`text-[10px] font-bold ${isDark ? 'text-[#4BB9EC]' : 'text-[#4BB9EC]'}`}>
              {teamPlayers.length} player{teamPlayers.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {loadingRoster ? (
          <div className="text-center py-4">
            <div className="w-5 h-5 border-2 border-[#4BB9EC] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : teamPlayers.length === 0 ? (
          <div className={`${cardBg} rounded-xl p-4 text-center`}>
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No players on roster</p>
          </div>
        ) : (
          <div className={`${cardBg} rounded-xl overflow-hidden`}>
            {teamPlayers.map((tp, idx) => {
              const p = tp.players
              if (!p) return null
              return (
                <div key={tp.id} className={`flex items-center gap-2.5 px-3 py-2 ${
                  idx > 0 ? (isDark ? 'border-t border-white/[0.04]' : 'border-t border-[#E8ECF2]/50') : ''
                }`}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                    style={{ backgroundColor: `${teamColor}20`, color: teamColor }}>
                    {p.photo_url ? (
                      <img src={p.photo_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      `${p.first_name?.[0] || ''}${p.last_name?.[0] || ''}`
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs font-semibold truncate block ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
                      {p.first_name} {p.last_name}
                    </span>
                  </div>
                  {tp.jersey_number && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: `${teamColor}15`, color: teamColor }}>
                      #{tp.jersey_number}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick Templates */}
      <div>
        <h4 className={`${sectionLabel} mb-2`} style={{ fontFamily: 'var(--v2-font)' }}>
          Quick Templates
        </h4>
        <div className="space-y-1.5">
          {QUICK_TEMPLATES.map(tmpl => (
            <button key={tmpl.label}
              onClick={() => onTemplateInsert?.(tmpl.text)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all active:scale-[0.98] ${
                isDark
                  ? 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]'
                  : 'bg-white border border-[#E8ECF2] hover:bg-[#F5F6F8]'
              }`}>
              <span className="text-base shrink-0">{tmpl.icon}</span>
              <span className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
                {tmpl.label}
              </span>
              <ChevronRight className={`w-3 h-3 ml-auto shrink-0 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
