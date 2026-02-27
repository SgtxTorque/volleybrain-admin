import { useState, useEffect, useMemo } from 'react'
import { Calendar, ChevronRight, Users, MessageCircle, Send, User as UserCircle } from '../../constants/icons'
import { supabase } from '../../lib/supabase'
import ParentHeroCard from './ParentHeroCard'
import TeamStandingsWidget from '../widgets/parent/TeamStandingsWidget'
import ChildStatsWidget from '../widgets/parent/ChildStatsWidget'
import { ParentChecklistWidget } from './ParentOnboarding'

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
  // Team hub + chat fetched by this component
  const [latestPost, setLatestPost] = useState(null)
  const [chatMessages, setChatMessages] = useState([])

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
        const { data: messages, error: msgErr } = await supabase
          .from('chat_messages')
          .select('*, profiles:sender_id(full_name, avatar_url)')
          .eq('channel_id', channel.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(3)
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

  const visibleAlerts = alerts?.filter(a => !dismissedAlerts?.includes(a.id)) || []

  return (
    <main className="flex flex-1 flex-col gap-6 overflow-y-auto py-6 px-6 min-w-0">

      {/* Alerts */}
      {visibleAlerts.map(alert => (
        <div
          key={alert.id}
          className={`rounded-2xl px-5 py-4 flex items-center gap-4 ${
            alert.priority === 'urgent'
              ? 'bg-gradient-to-r from-red-600 to-red-500 shadow-lg shadow-red-500/20'
              : 'bg-white border border-slate-200 shadow-sm'
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${
            alert.priority === 'urgent' ? 'bg-white/20' : 'bg-amber-50'
          }`}>
            {alert.priority === 'urgent' ? '🚨' : '📣'}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold ${alert.priority === 'urgent' ? 'text-white' : 'text-slate-900'}`}>{alert.title}</p>
            <p className={`text-xs mt-0.5 ${alert.priority === 'urgent' ? 'text-red-100' : 'text-slate-500'}`}>{alert.content}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDismissAlert?.(alert.id) }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex-shrink-0 transition-all ${
              alert.priority === 'urgent'
                ? 'bg-white/25 text-white hover:bg-white/35'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
            }`}
          >
            {alert.priority === 'urgent' ? 'Got It' : 'Dismiss'}
          </button>
        </div>
      ))}

      {/* Welcome Message */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'Parent'} 👋
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
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
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-900">Team Hub</h3>
              {activeTeam && <span className="text-xs text-slate-400">· {activeTeam.name}</span>}
            </div>
            <button
              onClick={() => navigateToTeamWall?.(activeTeam?.id)}
              className="text-xs text-[var(--accent-primary)] font-semibold hover:opacity-80 transition flex items-center gap-1"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-5">
            {latestPost ? (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  {latestPost.profiles?.avatar_url ? (
                    <img src={latestPost.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                      <UserCircle className="w-5 h-5 text-slate-400" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{latestPost.profiles?.full_name || 'Team Member'}</p>
                    <p className="text-xs text-slate-400">{new Date(latestPost.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 line-clamp-3">{latestPost.content}</p>
                {latestPost.reaction_count > 0 && (
                  <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
                    <span>❤️ {latestPost.reaction_count}</span>
                    {latestPost.comment_count > 0 && <span>💬 {latestPost.comment_count}</span>}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-400">No recent posts</p>
                <button onClick={() => navigateToTeamWall?.(activeTeam?.id)} className="text-xs text-[var(--accent-primary)] font-semibold mt-2 hover:opacity-80 transition">
                  Visit Team Hub →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Chat Preview Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-900">Team Chat</h3>
              {activeTeam && <span className="text-xs text-slate-400">· {activeTeam.name}</span>}
            </div>
            <button
              onClick={() => onNavigate?.('chats')}
              className="text-xs text-[var(--accent-primary)] font-semibold hover:opacity-80 transition flex items-center gap-1"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-5">
            {chatMessages.length > 0 ? (
              <div className="space-y-3">
                {chatMessages.map((msg, i) => (
                  <div key={msg.id || i} className="flex items-start gap-2">
                    {msg.profiles?.avatar_url ? (
                      <img src={msg.profiles.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <UserCircle className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700">{msg.profiles?.full_name || 'Unknown'}</span>
                        <span className="text-[10px] text-slate-400">{new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <MessageCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-400">No recent messages</p>
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => onNavigate?.('chats')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 text-sm text-slate-400 hover:bg-slate-100 transition"
              >
                <Send className="w-4 h-4" />
                Reply in chat...
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Section */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-900">Upcoming Schedule</h3>
          </div>
          <button onClick={() => onNavigate?.('schedule')} className="text-xs text-[var(--accent-primary)] font-semibold hover:opacity-80 transition flex items-center gap-1">
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
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm"
                  >
                    <div className="text-center w-12 flex-shrink-0">
                      <div className="text-[9px] uppercase font-bold text-slate-400">{eventDate.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                      <div className="text-xl font-black text-slate-900 leading-tight">{eventDate.getDate()}</div>
                      <div className="text-[9px] uppercase font-bold text-slate-400">{eventDate.toLocaleDateString('en-US', { month: 'short' })}</div>
                    </div>
                    <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: isGame ? '#f59e0b' : '#3b82f6' }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md ${isGame ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                          {isGame ? 'GAME' : 'PRACTICE'}
                        </span>
                        {event.opponent && <span className="text-xs font-semibold text-slate-600">vs {event.opponent}</span>}
                        {daysUntil === 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-500">TODAY</span>}
                        {daysUntil === 1 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-600">TOMORROW</span>}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {event.event_time && formatTime12(event.event_time)}{event.venue_name && ` · ${event.venue_name}`}
                      </div>
                      <div className="text-[10px] font-bold mt-0.5" style={{ color: evtTeamColor }}>{event.teams?.name}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-500">No upcoming events</p>
              <p className="text-xs text-slate-400 mt-1">Check the schedule for past events</p>
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
          className="rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap shadow-sm"
          style={{
            background: `linear-gradient(135deg, ${activeTeamColor}12, ${activeTeamColor}06)`,
            border: `1px solid ${activeTeamColor}25`
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="text-sm font-bold text-slate-900">New Season Registration Open!</p>
              <p className="text-xs text-slate-500">{openSeasons[0].name} — {openSeasons[0].organizations?.name}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {registrationData?.map(player => (
              <button
                key={player.id}
                onClick={() => onShowReRegister?.({ player, season: openSeasons[0] })}
                className="px-5 py-2.5 bg-[var(--accent-primary)] text-white rounded-xl text-xs font-bold hover:brightness-110 transition shadow-sm"
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
        className="w-full rounded-2xl py-4 text-center text-sm font-medium bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 shadow-sm hover:shadow-md transition-all"
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
