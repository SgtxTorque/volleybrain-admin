import { useState, useEffect, useMemo } from 'react'
import { Calendar, ChevronRight, Users, MessageCircle, Send, User as UserCircle } from '../../constants/icons'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../contexts/ThemeContext'
import ParentHeroCard from './ParentHeroCard'
import TeamStandingsWidget from '../widgets/parent/TeamStandingsWidget'
import ChildStatsWidget from '../widgets/parent/ChildStatsWidget'
import { ParentChecklistWidget } from './ParentOnboarding'
import FeedPost from '../../pages/teams/FeedPost'
import { HUB_STYLES, adjustBrightness } from '../../constants/hubStyles'

function formatTime12(timeStr) {
  if (!timeStr) return ''
  const [hours, minutes] = timeStr.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return hour12 + ':' + minutes + ' ' + ampm
}

/**
 * ParentCenterDashboard — center column content
 * Contains hero card, team hub preview, chat preview, schedule, widgets
 */
export default function ParentCenterDashboard({
  profile,
  activeChild,
  activeTeam,
  activeTeamColor,
  activeChildEvents,
  activeChildUnpaid,
  playerTeamCombos,
  activeChildIdx,
  activeChildForWidget,
  registrationData,
  upcomingEvents,
  openSeasons,
  teamIds,
  alerts,
  dismissedAlerts,
  onDismissAlert,
  onSelectChild,
  onShowAddChild,
  onShowPayment,
  onShowEventDetail,
  onShowReRegister,
  onNavigate,
  navigateToTeamWall,
  showToast,
  onPhotoUploaded,
  primarySport,
  primarySeason,
  carouselRef,
}) {
  const { isDark } = useTheme()
  const g = activeTeamColor || '#6366F1'
  const gb = adjustBrightness(g, 20)

  // Team hub + chat fetched by this component
  const [latestPost, setLatestPost] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [chatChannelId, setChatChannelId] = useState(null)
  const [chatInput, setChatInput] = useState('')
  const [sendingChat, setSendingChat] = useState(false)

  const teamId = activeTeam?.id

  useEffect(() => {
    let cancelled = false

    async function loadTeamContent() {
      if (!teamId) return

      // Fetch latest team post
      try {
        const { data, error } = await supabase
          .from('team_posts')
          .select('*, profiles:author_id(full_name, avatar_url)')
          .eq('team_id', teamId)
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(1)
        if (cancelled) return
        if (error) {
          console.warn('team_posts query failed:', error.message)
          setLatestPost(null)
        } else {
          setLatestPost(data?.[0] || null)
        }
      } catch {
        if (!cancelled) setLatestPost(null)
      }

      // Fetch recent chat messages
      try {
        const { data: channel, error: chErr } = await supabase
          .from('chat_channels')
          .select('id')
          .eq('team_id', teamId)
          .eq('channel_type', 'team_chat')
          .maybeSingle()
        if (cancelled) return
        if (chErr || !channel) {
          if (chErr) console.warn('chat_channels query failed:', chErr.message)
          setChatMessages([])
          return
        }
        setChatChannelId(channel.id)
        const { data: messages, error: msgErr } = await supabase
          .from('chat_messages')
          .select('*, profiles:sender_id(full_name, avatar_url)')
          .eq('channel_id', channel.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(5)
        if (cancelled) return
        if (msgErr) {
          console.warn('chat_messages query failed:', msgErr.message)
          setChatMessages([])
        } else {
          setChatMessages((messages || []).reverse())
        }
      } catch {
        if (!cancelled) setChatMessages([])
      }
    }

    loadTeamContent()
    return () => { cancelled = true }
  }, [teamId])

  async function handleSendChatMessage(e) {
    e?.preventDefault()
    if (!chatInput.trim() || sendingChat || !chatChannelId) return
    setSendingChat(true)
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          channel_id: chatChannelId,
          sender_id: profile?.id,
          content: chatInput.trim(),
          message_type: 'text',
        })
        .select('*, profiles:sender_id(full_name, avatar_url)')
        .single()
      if (error) throw error
      setChatMessages(prev => [...prev, data])
      setChatInput('')
    } catch (err) {
      console.error('Error sending message:', err)
    }
    setSendingChat(false)
  }

  const visibleAlerts = alerts?.filter(a => !dismissedAlerts?.includes(a.id)) || []

  return (
    <main className="flex flex-1 flex-col gap-6 overflow-y-auto py-6 px-6 min-w-0 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>

      {/* Alerts */}
      {visibleAlerts.map(alert => (
        <div
          key={alert.id}
          className={`rounded-xl px-5 py-4 flex items-center gap-4 transition-all hover:-translate-y-0.5 hover:shadow-xl ${
            alert.priority === 'urgent'
              ? 'bg-gradient-to-r from-red-600 to-red-500 shadow-lg shadow-red-500/20'
              : `${isDark ? 'bg-lynx-charcoal border border-white/[0.08] shadow-lg shadow-black/25' : 'bg-white border border-lynx-silver shadow-sm'}`
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${
            alert.priority === 'urgent' ? 'bg-white/20' : 'bg-amber-50'
          }`}>
            {alert.priority === 'urgent' ? '🚨' : '📣'}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-base font-bold ${alert.priority === 'urgent' ? 'text-white' : isDark ? 'text-white' : 'text-slate-900'}`}>{alert.title}</p>
            <p className={`text-base mt-0.5 ${alert.priority === 'urgent' ? 'text-red-100' : isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>{alert.content}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDismissAlert?.(alert.id) }}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex-shrink-0 transition-all ${
              alert.priority === 'urgent'
                ? 'bg-white/25 text-white hover:bg-white/35'
                : isDark ? 'bg-white/10 hover:bg-white/20 text-slate-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
            }`}
          >
            {alert.priority === 'urgent' ? 'Got It' : 'Dismiss'}
          </button>
        </div>
      ))}

      {/* Welcome Message */}
      <div>
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Welcome back, {profile?.full_name?.split(' ')[0] || 'Parent'} 👋
        </h1>
        <p className={`text-base mt-0.5 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
          {registrationData?.length || 0} {registrationData?.length === 1 ? 'player' : 'players'} registered
          {activeTeam ? ` · ${activeTeam.name}` : ''}
        </p>
      </div>

      {/* Hero Player Card */}
      <ParentHeroCard
        selectedPlayerTeam={activeChild ? {
          playerId: activeChild.id,
          firstName: activeChild.first_name,
          lastName: activeChild.last_name || '',
          playerPhoto: activeChild.photo_url || null,
          teamId: activeTeam?.id || null,
          teamName: activeTeam?.name || 'Unassigned',
          teamColor: activeTeamColor,
          seasonName: primarySeason?.name || '',
          sportIcon: primarySport?.icon || '🏐',
          jerseyNumber: activeChild.jersey_number || '',
          position: activeChild.position || 'Player',
          isActive: activeChild.registrationStatus === 'active',
          isPaidUp: !activeChildUnpaid?.length,
          unpaidAmount: activeChildUnpaid?.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0) || 0,
          nextEvent: activeChildEvents?.[0] || null,
          eventCount: activeChildEvents?.length || 0,
        } : null}
        playerTeams={playerTeamCombos?.map(c => ({
          playerId: c.playerId,
          firstName: c.firstName,
          playerPhoto: c.photo,
          teamId: c.teamId,
          teamName: c.teamName,
          teamColor: c.teamColor,
          jerseyNumber: c.jersey,
          hasPendingActions: c.hasPendingActions,
          idx: c.idx,
        })) || []}
        onSelectPlayerTeam={(pt) => onSelectChild?.(pt.idx)}
        onNavigate={onNavigate}
        navigateToTeamWall={navigateToTeamWall}
        onShowPayment={onShowPayment}
        onShowAddChild={onShowAddChild}
        onShowEventDetail={onShowEventDetail}
        onPhotoUploaded={onPhotoUploaded}
        showToast={showToast}
      />

      {/* Team Hub + Chat Preview Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Team Hub Preview Card */}
        <div className={` ${isDark ? 'bg-lynx-charcoal border border-white/[0.08] shadow-lg shadow-black/25' : 'bg-white border border-lynx-silver shadow-sm'} rounded-xl overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-xl`}>
          <div className={`flex items-center justify-between px-5 py-3 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2">
              <Users className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Team Hub</h3>
              {activeTeam && <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>· {activeTeam.name}</span>}
            </div>
            <button
              onClick={() => navigateToTeamWall?.(activeTeam?.id)}
              className="text-sm text-[var(--accent-primary)] font-semibold hover:opacity-80 transition flex items-center gap-1"
            >
              Go To Team Page <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className={!isDark ? 'tw-light' : ''}>
            <style>{HUB_STYLES}</style>
            {latestPost ? (
              <FeedPost
                post={latestPost}
                g={g}
                gb={gb}
                i={0}
                isDark={isDark}
                isAdminOrCoach={false}
                currentUserId={profile?.id}
                onDelete={() => {}}
                onTogglePin={() => {}}
                onEdit={() => {}}
                onCommentCountChange={(postId, count) => {
                  setLatestPost(prev => prev ? { ...prev, comment_count: count } : prev)
                }}
                onReactionCountChange={(postId, count) => {
                  setLatestPost(prev => prev ? { ...prev, reaction_count: count } : prev)
                }}
              />
            ) : (
              <div className="text-center py-6 px-5">
                <Users className={`w-8 h-8 mx-auto ${isDark ? 'text-slate-600' : 'text-slate-300'} mb-2`} />
                <p className={`text-base ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>No recent posts</p>
                <button onClick={() => navigateToTeamWall?.(activeTeam?.id)} className="text-sm text-[var(--accent-primary)] font-semibold mt-2 hover:opacity-80 transition">
                  Visit Team Hub →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Chat Preview Card */}
        <div className={` ${isDark ? 'bg-lynx-charcoal border border-white/[0.08] shadow-lg shadow-black/25' : 'bg-white border border-lynx-silver shadow-sm'} rounded-xl overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-xl`}>
          <div className={`flex items-center justify-between px-5 py-3 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2">
              <MessageCircle className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Team Chat</h3>
              {activeTeam && <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>· {activeTeam.name}</span>}
            </div>
            <button
              onClick={() => onNavigate?.('chats')}
              className="text-sm text-[var(--accent-primary)] font-semibold hover:opacity-80 transition flex items-center gap-1"
            >
              Go to Chat <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-4">
            {chatMessages.length > 0 ? (
              <div className="space-y-2.5">
                {chatMessages.map((msg) => {
                  const isOwn = msg.sender_id === profile?.id
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} gap-2`}>
                      {!isOwn && (
                        msg.profiles?.avatar_url ? (
                          <img src={msg.profiles.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5" />
                        ) : (
                          <div className={`w-7 h-7 rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-100'} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                            <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {msg.profiles?.full_name?.charAt(0) || '?'}
                            </span>
                          </div>
                        )
                      )}
                      <div className={`max-w-[75%]`}>
                        {!isOwn && (
                          <p className={`text-[10px] font-semibold mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {msg.profiles?.full_name?.split(' ')[0]}
                          </p>
                        )}
                        <div
                          className={`px-3 py-2 rounded-2xl ${isOwn ? 'rounded-br-md' : 'rounded-bl-md'}`}
                          style={isOwn ? {
                            background: isDark
                              ? `linear-gradient(135deg, ${g}, ${gb})`
                              : `${g}18`,
                            color: isDark ? 'white' : '#1a1a1a',
                            boxShadow: isDark ? `0 4px 16px ${g}25` : `0 2px 12px ${g}10`,
                          } : {
                            background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)',
                            color: isDark ? 'white' : '#1a1a1a',
                            border: isDark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(0,0,0,.06)',
                          }}
                        >
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                          <p className={`text-[10px] mt-0.5 ${isOwn ? 'opacity-60' : (isDark ? 'text-slate-500' : 'text-slate-400')}`}>
                            {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <MessageCircle className={`w-8 h-8 mx-auto ${isDark ? 'text-slate-600' : 'text-slate-300'} mb-2`} />
                <p className={`text-base ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>No recent messages</p>
              </div>
            )}

            {/* Inline Chat Input */}
            <form onSubmit={handleSendChatMessage} className={`mt-3 pt-3 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'} flex items-center gap-2`}>
              <div className="flex-1 flex items-center px-3 py-2 rounded-xl"
                style={{
                  background: isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)',
                  border: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.05)',
                }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: isDark ? 'white' : '#1a1a1a' }}
                />
              </div>
              <button
                type="submit"
                disabled={!chatInput.trim() || sendingChat}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-20"
                style={{
                  background: chatInput.trim() ? g : 'transparent',
                  color: chatInput.trim() ? 'white' : (isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.2)'),
                }}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Schedule Section */}
      <div className={`${isDark ? 'bg-lynx-charcoal border border-white/[0.08] shadow-lg shadow-black/25' : 'bg-white border border-lynx-silver shadow-sm'} rounded-xl overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-xl`}>
        <div className={`flex items-center justify-between px-5 py-3 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
          <div className="flex items-center gap-2">
            <Calendar className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Upcoming Schedule</h3>
          </div>
          <button onClick={() => onNavigate?.('schedule')} className="text-sm text-[var(--accent-primary)] font-semibold hover:opacity-80 transition flex items-center gap-1">
            Full Calendar <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="p-5">
          {upcomingEvents?.length > 0 ? (
            <div className="space-y-2">
              {upcomingEvents.slice(0, 4).map(event => {
                const eventDate = new Date(event.event_date)
                const isGame = event.event_type === 'game'
                const evtTeamColor = event.teams?.color || activeTeamColor
                const daysUntil = Math.ceil((eventDate - new Date()) / 86400000)
                return (
                  <button
                    key={event.id}
                    onClick={() => onShowEventDetail?.(event)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all hover:shadow-sm ${isDark ? 'bg-lynx-charcoal border border-white/[0.06] hover:border-white/[0.12]' : 'bg-white border border-lynx-silver hover:border-slate-300'}`}
                  >
                    <div className="text-center w-12 flex-shrink-0">
                      <div className={`text-[9px] uppercase font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{eventDate.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                      <div className={`text-2xl font-black leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{eventDate.getDate()}</div>
                      <div className={`text-[9px] uppercase font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{eventDate.toLocaleDateString('en-US', { month: 'short' })}</div>
                    </div>
                    <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: isGame ? '#f59e0b' : '#3b82f6' }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${isGame ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                          {isGame ? 'GAME' : 'PRACTICE'}
                        </span>
                        {event.opponent && <span className={`text-base font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>vs {event.opponent}</span>}
                        {daysUntil === 0 && <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-500">TODAY</span>}
                        {daysUntil === 1 && <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-600">TOMORROW</span>}
                      </div>
                      <div className={`text-base mt-0.5 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
                        {event.event_time && formatTime12(event.event_time)}{event.venue_name && ` · ${event.venue_name}`}
                      </div>
                      <div className="text-sm font-bold mt-0.5" style={{ color: evtTeamColor }}>{event.teams?.name}</div>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isDark ? 'text-slate-600' : 'text-slate-300'} flex-shrink-0`} />
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className={`w-10 h-10 mx-auto ${isDark ? 'text-slate-600' : 'text-slate-300'} mb-2`} />
              <p className={`text-base font-medium ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>No upcoming events</p>
              <p className={`text-base mt-1 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Check the schedule for past events</p>
            </div>
          )}
        </div>
      </div>

      {/* At a Glance Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teamIds?.length > 0 && (
          <TeamStandingsWidget
            teamId={activeTeam?.id || teamIds[0]}
            onViewStandings={() => onNavigate?.('standings')}
          />
        )}
        {registrationData?.length > 0 && (
          <ChildStatsWidget
            children={activeChildForWidget}
            onViewLeaderboards={() => onNavigate?.('leaderboards')}
          />
        )}
      </div>

      {/* Registration Banner */}
      {openSeasons?.length > 0 && (
        <div
          className="rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap shadow-sm"
          style={{
            background: `linear-gradient(135deg, ${activeTeamColor}12, ${activeTeamColor}06)`,
            border: `1px solid ${activeTeamColor}25`
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>New Season Registration Open!</p>
              <p className={`text-base ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>{openSeasons[0].name} — {openSeasons[0].organizations?.name}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {registrationData?.map(player => (
              <button
                key={player.id}
                onClick={() => onShowReRegister?.({ player, season: openSeasons[0] })}
                className="px-5 py-2.5 bg-[var(--accent-primary)] text-white rounded-xl text-sm font-bold hover:brightness-110 transition shadow-sm"
              >
                Register {player.first_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Invite */}
      <button
        onClick={() => onNavigate?.('invite')}
        className={`w-full rounded-xl py-4 text-center text-base font-medium shadow-sm hover:shadow-md transition-all ${isDark ? 'bg-lynx-charcoal border border-white/[0.06] text-slate-400 hover:border-white/[0.12] hover:text-slate-200' : 'bg-white border border-lynx-silver text-lynx-slate hover:border-slate-300 hover:text-slate-700'}`}
      >
        Know someone who'd love to play? <strong className="text-[var(--accent-primary)]">Invite them →</strong>
      </button>

      {/* Getting Started Checklist (visible on smaller screens) */}
      <div className="xl:hidden">
        <ParentChecklistWidget
          onNavigate={onNavigate}
          onTeamHub={() => navigateToTeamWall?.(activeTeam?.id)}
          activeTeam={activeTeam}
        />
      </div>
    </main>
  )
}
