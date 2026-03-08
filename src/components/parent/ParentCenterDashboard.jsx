import { useState, useEffect, useMemo } from 'react'
import { Calendar, ChevronRight, Users, MessageCircle, Send, User as UserCircle, MapPin, Clock } from '../../constants/icons'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../contexts/ThemeContext'
import { formatTime12, countdownText, timeAgo } from '../../lib/date-helpers'
import ParentHeroCard from './ParentHeroCard'
import TeamStandingsWidget from '../widgets/parent/TeamStandingsWidget'
import ChildStatsWidget from '../widgets/parent/ChildStatsWidget'
import { ParentChecklistWidget } from './ParentOnboarding'
import FeedPost from '../../pages/teams/FeedPost'
import { HUB_STYLES, adjustBrightness } from '../../constants/hubStyles'

// ── Helpers ────────────────────────────────────────────────────────

function getTimeGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function buildDayStrip() {
  const days = []
  const today = new Date()
  for (let i = -1; i <= 5; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    days.push({
      date: d,
      iso: d.toISOString().split('T')[0],
      day: d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3),
      num: d.getDate(),
      isToday: i === 0,
    })
  }
  return days
}

function getAttentionColor(count) {
  if (count >= 5) return 'text-red-500'
  if (count >= 3) return 'text-amber-500'
  return 'text-brand-text-muted'
}

/**
 * ParentCenterDashboard — mobile scroll parity
 * Matches ParentHomeScroll.tsx flow: hero header → athlete card → event hero →
 * day strip → metric grid → chat/hub previews → badges → season → attention
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
  const [recentBadges, setRecentBadges] = useState([])

  const teamId = activeTeam?.id
  const childId = activeChild?.id

  // ── Fetch team hub + chat ────────────────────────────────────────
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

  // ── Fetch recent badges for child ────────────────────────────────
  useEffect(() => {
    let cancelled = false
    if (!childId) return

    async function loadBadges() {
      try {
        const { data, error } = await supabase
          .from('player_achievements')
          .select('*, achievements(name, icon, rarity, color_primary)')
          .eq('player_id', childId)
          .order('created_at', { ascending: false })
          .limit(6)
        if (cancelled) return
        if (error) {
          console.warn('player_achievements query failed:', error.message)
          setRecentBadges([])
        } else {
          setRecentBadges(data || [])
        }
      } catch {
        if (!cancelled) setRecentBadges([])
      }
    }

    loadBadges()
    return () => { cancelled = true }
  }, [childId])

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

  // ── Derived data ─────────────────────────────────────────────────
  const heroEvent = activeChildEvents?.[0] || null
  const secondaryEvents = activeChildEvents?.slice(1, 4) || []
  const dayStrip = useMemo(() => buildDayStrip(), [])
  const eventDateSet = useMemo(() => {
    return new Set((upcomingEvents || []).map(e => e.event_date))
  }, [upcomingEvents])

  // Payment balance
  const balance = activeChildUnpaid?.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0) || 0

  // Attention count
  const attentionCount = visibleAlerts.length + (balance > 0 ? 1 : 0)

  return (
    <div className="flex flex-1 flex-col overflow-hidden min-w-0">
      {/* ═══════════════════════════════════════════════════════════
          DARK NAVY HERO HEADER (matches mobile welcome section)
          ═══════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-b from-[#0D1B3E] via-[#132B52] to-[#0D1B3E] px-8 pt-6 pb-28 shrink-0 relative overflow-hidden">
        {/* Subtle volleyball emoji decoration */}
        <div className="absolute top-4 right-8 text-[40px] opacity-[0.08] pointer-events-none select-none">🏐</div>

        {/* Greeting row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover border-2 border-[#4BB9EC]/20" />
            ) : (
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#4BB9EC]/20 to-[#10284C] border-2 border-[#4BB9EC]/20 flex items-center justify-center text-[13px] font-bold text-[#4BB9EC]">
                {profile?.full_name?.[0] || 'P'}
              </div>
            )}
            <div>
              <p className="text-[15px] font-bold text-white">
                {getTimeGreeting()}, {profile?.full_name?.split(' ')[0] || 'Parent'}
              </p>
              <p className="text-[12px] text-white/30 font-medium">
                {registrationData?.length || 0} {registrationData?.length === 1 ? 'player' : 'players'} registered
                {activeTeam ? ` · ${activeTeam.name}` : ''}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-white/20 bg-white/5 px-3 py-1 rounded-full border border-white/5 uppercase tracking-wider">Parent</span>
        </div>

        {/* Title */}
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#4BB9EC]/50 mb-1">Parent Hub</p>
        <h1 className="text-[28px] font-black leading-none tracking-wide text-white uppercase">MY FAMILY DASHBOARD</h1>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          SCROLLABLE CONTENT (floating cards over navy)
          ═══════════════════════════════════════════════════════════ */}
      <div className="flex-1 px-6 -mt-20 overflow-y-auto pb-8 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="flex flex-col gap-5">

          {/* ── Attention Banner ── */}
          {attentionCount > 0 && (
            <button
              onClick={() => balance > 0 ? onShowPayment?.() : null}
              className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#FFF8E1] border border-amber-200 hover:border-amber-300 transition-all"
            >
              <span className="text-lg">⚠️</span>
              <p className={`text-sm font-semibold flex-1 text-left ${getAttentionColor(attentionCount)}`}>
                {attentionCount} {attentionCount === 1 ? 'thing needs' : 'things need'} your attention
              </p>
              <ChevronRight className="w-4 h-4 text-amber-400" />
            </button>
          )}

          {/* ── Alert Cards ── */}
          {visibleAlerts.map(alert => (
            <div
              key={alert.id}
              className={`rounded-2xl px-5 py-4 flex items-center gap-4 transition-all ${
                alert.priority === 'urgent'
                  ? 'bg-gradient-to-r from-red-600 to-red-500 shadow-lg shadow-red-500/20'
                  : 'bg-white border border-brand-border shadow-sm'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${
                alert.priority === 'urgent' ? 'bg-white/20' : 'bg-amber-50'
              }`}>
                {alert.priority === 'urgent' ? '🚨' : '📣'}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${alert.priority === 'urgent' ? 'text-white' : 'text-brand-navy'}`}>{alert.title}</p>
                <p className={`text-xs mt-0.5 ${alert.priority === 'urgent' ? 'text-red-100' : 'text-brand-text-muted'}`}>{alert.content}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDismissAlert?.(alert.id) }}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex-shrink-0 transition-all ${
                  alert.priority === 'urgent'
                    ? 'bg-white/25 text-white hover:bg-white/35'
                    : 'bg-brand-warm-gray text-brand-text-muted hover:bg-slate-200'
                }`}
              >
                {alert.priority === 'urgent' ? 'Got It' : 'Dismiss'}
              </button>
            </div>
          ))}

          {/* ── Athlete Hero Card (mobile AthleteCard) ── */}
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
              unpaidAmount: balance,
              nextEvent: heroEvent,
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

          {/* ── Event Hero Card (dark navy gradient — matches mobile EventHeroCard) ── */}
          {heroEvent ? (
            <button
              onClick={() => onShowEventDetail?.(heroEvent)}
              className="relative rounded-2xl overflow-hidden text-left transition-all hover:shadow-xl group"
              style={{ minHeight: '180px' }}
            >
              {/* Dark navy gradient bg */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#0D1B3E] via-[#1A3560] to-[#0D1B3E]" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent" style={{ height: '20%' }} />
              <div className="absolute top-4 right-5 text-[40px] opacity-[0.15] pointer-events-none select-none">🏐</div>

              <div className="relative z-10 p-6 flex flex-col justify-between h-full" style={{ minHeight: '180px' }}>
                {/* Tag row */}
                <div className="flex items-center gap-3">
                  {countdownText(heroEvent.event_date) === 'TODAY' ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-white uppercase">
                      <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                      TODAY
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-white/60 uppercase">{countdownText(heroEvent.event_date)}</span>
                  )}
                  {heroEvent.event_time && (
                    <span className="text-xs font-medium text-white/50">{formatTime12(heroEvent.event_time)}</span>
                  )}
                </div>

                {/* Event title */}
                <div className="mt-3">
                  <h2 className="text-[28px] font-black text-white uppercase tracking-wide leading-tight">
                    {heroEvent.opponent_name ? `vs ${heroEvent.opponent_name}` : heroEvent.title || (heroEvent.event_type === 'game' ? 'Game Day' : 'Practice')}
                  </h2>
                  {heroEvent.venue_name && (
                    <p className="text-[13px] text-white/50 mt-1.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> {heroEvent.venue_name}
                    </p>
                  )}
                  {activeTeam?.name && (
                    <p className="text-[13px] text-white/30 mt-0.5">{activeTeam.name}</p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 mt-4">
                  <span className="px-5 py-2.5 bg-[#4BB9EC] rounded-xl text-sm font-bold text-white group-hover:brightness-110 transition">
                    View Details
                  </span>
                  {heroEvent.venue_address && (
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(heroEvent.venue_address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="px-5 py-2.5 rounded-xl text-sm font-bold text-white border border-white/20 hover:bg-white/10 transition flex items-center gap-1.5"
                    >
                      <MapPin className="w-3.5 h-3.5" /> Directions
                    </a>
                  )}
                </div>
              </div>
            </button>
          ) : (
            <div className="rounded-2xl bg-gradient-to-br from-[#0D1B3E] via-[#1A3560] to-[#0D1B3E] p-8 text-center">
              <span className="text-3xl block mb-2">🏐</span>
              <p className="text-white/60 text-sm font-medium">No upcoming events. Enjoy the break!</p>
            </div>
          )}

          {/* ── Day Strip Calendar (matches mobile DayStripCalendar) ── */}
          <div className="bg-white border border-brand-border rounded-2xl px-4 py-3">
            <div className="flex items-center justify-center gap-1">
              {dayStrip.map(d => (
                <button
                  key={d.iso}
                  onClick={() => onNavigate?.('schedule')}
                  className={`flex flex-col items-center px-3 py-2 rounded-xl transition-colors ${
                    d.isToday ? 'bg-[#4BB9EC]/10' : 'hover:bg-brand-warm-gray'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-faint">{d.day}</span>
                  <span className={`text-lg font-bold mt-0.5 ${
                    d.isToday ? 'text-[#4BB9EC]' : 'text-brand-navy'
                  }`}>
                    {d.num}
                  </span>
                  {/* Event dot */}
                  <span className={`w-[5px] h-[5px] rounded-full mt-1 ${
                    eventDateSet.has(d.iso)
                      ? (d.isToday ? 'bg-[#4BB9EC]' : 'bg-brand-navy')
                      : 'bg-transparent'
                  }`} />
                </button>
              ))}
            </div>
          </div>

          {/* ── Quick Glance / Metric Grid (2×2 — matches mobile MetricGrid) ── */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-brand-text-faint mb-2 px-1">Quick Glance</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Record */}
              <button
                onClick={() => onNavigate?.('standings')}
                className="bg-brand-off-white border border-brand-border rounded-[14px] p-4 text-left hover:shadow-sm transition-all"
                style={{ minHeight: '100px' }}
              >
                <span className="text-lg">🏆</span>
                <p className="text-xl font-black text-brand-navy mt-1">
                  {/* We'll use upcoming events to estimate — the real data is in the right panel */}
                  {activeChildEvents?.filter(e => e.event_type === 'game')?.length || 0} games
                </p>
                <p className="text-[11px] text-brand-text-muted font-medium mt-0.5">This season</p>
              </button>

              {/* Balance */}
              <button
                onClick={() => balance > 0 ? onShowPayment?.() : onNavigate?.('payments')}
                className="bg-brand-off-white border border-brand-border rounded-[14px] p-4 text-left hover:shadow-sm transition-all"
                style={{ minHeight: '100px' }}
              >
                <span className="text-lg">{balance > 0 ? '💳' : '✓'}</span>
                {balance > 0 ? (
                  <>
                    <p className="text-xl font-black text-red-500 mt-1">${balance.toFixed(0)}</p>
                    <p className="text-[11px] text-brand-text-muted font-medium mt-0.5">Balance due</p>
                  </>
                ) : (
                  <>
                    <p className="text-xl font-black text-[#22C55E] mt-1">Paid up</p>
                    <p className="text-[11px] text-brand-text-muted font-medium mt-0.5">All current</p>
                  </>
                )}
              </button>

              {/* Chat */}
              <button
                onClick={() => onNavigate?.('chats')}
                className="bg-brand-off-white border border-brand-border rounded-[14px] p-4 text-left hover:shadow-sm transition-all"
                style={{ minHeight: '100px' }}
              >
                <span className="text-lg">💬</span>
                <p className="text-xl font-black text-brand-navy mt-1">Team Chat</p>
                {chatMessages.length > 0 ? (
                  <p className="text-[11px] text-[#4BB9EC] font-semibold mt-0.5 truncate">
                    {chatMessages[chatMessages.length - 1]?.profiles?.full_name?.split(' ')[0]}: {chatMessages[chatMessages.length - 1]?.content?.slice(0, 30)}
                  </p>
                ) : (
                  <p className="text-[11px] text-brand-text-muted font-medium mt-0.5">All caught up</p>
                )}
              </button>

              {/* Achievements */}
              <button
                onClick={() => onNavigate?.('achievements')}
                className="bg-brand-off-white border border-brand-border rounded-[14px] p-4 text-left hover:shadow-sm transition-all"
                style={{ minHeight: '100px' }}
              >
                <span className="text-lg">⭐</span>
                <p className="text-xl font-black text-brand-navy mt-1">{recentBadges.length} Badges</p>
                <p className="text-[11px] text-brand-text-muted font-medium mt-0.5">Earned this season</p>
              </button>
            </div>
          </div>

          {/* ── Secondary Events hint (matches mobile SecondaryEvents) ── */}
          {secondaryEvents.length > 0 && (
            <button
              onClick={() => onNavigate?.('schedule')}
              className="text-sm font-semibold text-brand-text-muted hover:text-[#4BB9EC] transition text-left px-1"
            >
              {secondaryEvents.length === 1 ? (
                <>Also this week: {new Date(secondaryEvents[0].event_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })} · {secondaryEvents[0].event_type} →</>
              ) : (
                <>+{secondaryEvents.length} more events this week →</>
              )}
            </button>
          )}

          {/* ── Team Hub + Chat Preview Row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Team Hub Preview Card */}
            <div className="bg-white border border-brand-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand-text-faint" />
                  <h3 className="text-sm font-bold text-brand-navy">Team Hub</h3>
                  {activeTeam && <span className="text-xs text-brand-text-muted">· {activeTeam.name}</span>}
                </div>
                <button
                  onClick={() => navigateToTeamWall?.(activeTeam?.id)}
                  className="text-xs text-[#4BB9EC] font-bold hover:opacity-80 transition flex items-center gap-1"
                >
                  View All <ChevronRight className="w-3 h-3" />
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
                    <Users className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    <p className="text-sm text-brand-text-muted">No recent posts</p>
                    <button onClick={() => navigateToTeamWall?.(activeTeam?.id)} className="text-xs text-[#4BB9EC] font-bold mt-2 hover:opacity-80 transition">
                      Visit Team Hub →
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Preview Card */}
            <div className="bg-white border border-brand-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-brand-text-faint" />
                  <h3 className="text-sm font-bold text-brand-navy">Team Chat</h3>
                  {activeTeam && <span className="text-xs text-brand-text-muted">· {activeTeam.name}</span>}
                </div>
                <button
                  onClick={() => onNavigate?.('chats')}
                  className="text-xs text-[#4BB9EC] font-bold hover:opacity-80 transition flex items-center gap-1"
                >
                  Go to Chat <ChevronRight className="w-3 h-3" />
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
                              <div className="w-7 h-7 rounded-full bg-[#4BB9EC]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-[10px] font-bold text-[#4BB9EC]">
                                  {msg.profiles?.full_name?.charAt(0) || '?'}
                                </span>
                              </div>
                            )
                          )}
                          <div className="max-w-[75%]">
                            {!isOwn && (
                              <p className="text-[10px] font-semibold mb-0.5 text-brand-text-muted">
                                {msg.profiles?.full_name?.split(' ')[0]}
                              </p>
                            )}
                            <div
                              className={`px-3 py-2 rounded-2xl text-sm ${isOwn ? 'rounded-br-md bg-[#4BB9EC] text-white' : 'rounded-bl-md bg-brand-warm-gray text-brand-navy'}`}
                            >
                              <p className="leading-relaxed">{msg.content}</p>
                              <p className={`text-[10px] mt-0.5 ${isOwn ? 'text-white/60' : 'text-brand-text-faint'}`}>
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
                    <MessageCircle className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    <p className="text-sm text-brand-text-muted">All caught up</p>
                  </div>
                )}

                {/* Inline Chat Input */}
                <form onSubmit={handleSendChatMessage} className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <div className="flex-1 flex items-center px-3 py-2 rounded-2xl bg-brand-warm-gray">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 bg-transparent outline-none text-sm text-brand-navy placeholder:text-brand-text-faint"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || sendingChat}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-20 bg-[#4BB9EC] text-white"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* ── Recent Badges (horizontal pills — matches mobile RecentBadges) ── */}
          {recentBadges.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-brand-text-faint">Recent Badges</p>
                <button onClick={() => onNavigate?.('achievements')} className="text-xs text-[#4BB9EC] font-bold hover:opacity-80">
                  See All →
                </button>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                {recentBadges.map((b, i) => {
                  const name = b.achievements?.name || 'Badge'
                  const icon = b.achievements?.icon || '🏅'
                  return (
                    <button
                      key={b.id || i}
                      onClick={() => onNavigate?.('achievements')}
                      className="flex items-center gap-2 px-3.5 py-2 bg-white border border-brand-border rounded-full hover:shadow-sm transition flex-shrink-0"
                    >
                      <span className="text-base">{icon}</span>
                      <span className="text-xs font-bold text-brand-navy whitespace-nowrap">{name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── At a Glance Widgets (Standings + Stats) ── */}
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

          {/* ── Registration Banner ── */}
          {openSeasons?.length > 0 && (
            <div className="rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap bg-white border border-brand-border shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎉</span>
                <div>
                  <p className="text-sm font-bold text-brand-navy">New Season Registration Open!</p>
                  <p className="text-xs text-brand-text-muted">{openSeasons[0].name} — {openSeasons[0].organizations?.name}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {registrationData?.map(player => (
                  <button
                    key={player.id}
                    onClick={() => onShowReRegister?.({ player, season: openSeasons[0] })}
                    className="px-5 py-2.5 bg-[#4BB9EC] text-white rounded-xl text-xs font-bold hover:brightness-110 transition shadow-sm"
                  >
                    Register {player.first_name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Ambient Celebration (Tier 3 — matches mobile AmbientCelebration) ── */}
          {recentBadges.length > 0 && activeChild && (
            <div className="text-center px-10 py-4">
              <p className="text-sm text-brand-text-faint leading-relaxed">
                {activeChild.first_name} earned "{recentBadges[0]?.achievements?.name || 'a badge'}" recently.
              </p>
              <p className="text-xs text-brand-text-faint mt-0.5">That takes real commitment.</p>
            </div>
          )}

          {/* ── Invite Banner ── */}
          <button
            onClick={() => onNavigate?.('invite')}
            className="w-full rounded-2xl py-4 text-center text-sm font-medium bg-white border border-brand-border text-brand-text-muted hover:border-slate-300 hover:text-brand-navy transition shadow-sm"
          >
            Know someone who'd love to play? <strong className="text-[#4BB9EC]">Invite them →</strong>
          </button>

          {/* ── Getting Started Checklist (visible on smaller screens) ── */}
          <div className="xl:hidden">
            <ParentChecklistWidget
              onNavigate={onNavigate}
              onTeamHub={() => navigateToTeamWall?.(activeTeam?.id)}
              activeTeam={activeTeam}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
