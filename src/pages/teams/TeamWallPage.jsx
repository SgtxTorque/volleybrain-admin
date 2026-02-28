import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { PlayerCardExpanded } from '../../components/players'
import {
  ArrowLeft, Calendar, MapPin, Clock, Users, MessageCircle,
  FileText, Plus, Send, X, ChevronRight, Star, Check,
  BarChart3, Camera, Edit, Flag, Megaphone, Trash2, Trophy, UserCog,
  Share2, MoreVertical, Download, Maximize2, Upload, Image as ImageIcon
} from '../../constants/icons'
import { CommentSection } from '../../components/teams/CommentSection'
import { ReactionBar } from '../../components/teams/ReactionBar'
import { PhotoGallery } from '../../components/teams/PhotoGallery'
import PhotoLightbox from '../../components/common/PhotoLightbox'
import GiveShoutoutModal from '../../components/engagement/GiveShoutoutModal'
import ChallengeCard, { parseChallengeMetadata } from '../../components/engagement/ChallengeCard'
import CreateChallengeModal from '../../components/engagement/CreateChallengeModal'
import ChallengeDetailModal from '../../components/engagement/ChallengeDetailModal'
import { fetchActiveChallenges, optInToChallenge } from '../../lib/challenge-service'
import FeedPost from './FeedPost'
import { HUB_STYLES, adjustBrightness } from '../../constants/hubStyles'
import NewPostModal from './NewPostModal'

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

function VolleyballIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10" />
      <path d="M2 12a15.3 15.3 0 0 1 10-4 15.3 15.3 0 0 1 10 4" />
    </svg>
  )
}

function formatTime12(timeStr) {
  if (!timeStr) return ''
  const [hours, minutes] = timeStr.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return hour12 + ':' + minutes + ' ' + ampm
}

function useCountdown(targetDate) {
  const [val, setVal] = useState({})
  useEffect(() => {
    if (!targetDate) return
    const tick = () => {
      const d = Math.max(0, new Date(targetDate).getTime() - Date.now())
      setVal({
        d: Math.floor(d / 864e5),
        h: Math.floor((d % 864e5) / 36e5),
        m: Math.floor((d % 36e5) / 6e4),
        s: Math.floor((d % 6e4) / 1e3),
      })
    }
    tick()
    const i = setInterval(tick, 1000)
    return () => clearInterval(i)
  }, [targetDate])
  return val
}

// ═══════════════════════════════════════════════════════════
// TEAM WALL PAGE — 3-column layout
// ═══════════════════════════════════════════════════════════
function TeamWallPage({ teamId, showToast, onBack, onNavigate }) {
  const { profile, user } = useAuth()
  const tc = useThemeClasses()
  const { isDark } = useTheme()

  // ── Core data ──
  const [team, setTeam] = useState(null)
  const [roster, setRoster] = useState([])
  const [coaches, setCoaches] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [loading, setLoading] = useState(true)

  const [posts, setPosts] = useState([])
  const [postsPage, setPostsPage] = useState(1)
  const [hasMorePosts, setHasMorePosts] = useState(true)
  const [loadingMorePosts, setLoadingMorePosts] = useState(false)
  const POSTS_PER_PAGE = 10

  const [documents, setDocuments] = useState([])
  const [activeTab, setActiveTab] = useState('feed')

  const [showNewPostModal, setShowNewPostModal] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [showEventDetail, setShowEventDetail] = useState(null)

  const [bannerSlide, setBannerSlide] = useState(0)
  const [showBannerEdit, setShowBannerEdit] = useState(false)

  // Engagement state
  const [showShoutoutModal, setShowShoutoutModal] = useState(false)
  const [showCreateChallengeModal, setShowCreateChallengeModal] = useState(false)
  const [showChallengeDetailModal, setShowChallengeDetailModal] = useState(false)
  const [selectedChallengeId, setSelectedChallengeId] = useState(null)
  const [activeChallenges, setActiveChallenges] = useState([])

  // Gallery lightbox
  const [galleryLightboxIdx, setGalleryLightboxIdx] = useState(null)

  const g = team?.color || '#6366F1'
  const gb = adjustBrightness(g, 20)
  const dim = adjustBrightness(g, -30)

  const bannerSlides = [
    { id: 1, type: 'photo', label: 'Team Photo' },
    { id: 2, type: 'next_game', label: 'Next Game' },
    { id: 3, type: 'season_stats', label: 'Season Pulse' },
  ]

  const nextGame = upcomingEvents.find(e => e.event_type === 'game') || upcomingEvents[0]
  const countdownTarget = nextGame ? `${nextGame.event_date}T${nextGame.event_time || '19:00:00'}` : null
  const cd = useCountdown(countdownTarget)

  const isAdminOrCoach = profile?.role === 'admin' || profile?.role === 'coach'
  const canPost = isAdminOrCoach || profile?.role === 'parent'

  // Gallery images from posts
  const galleryImages = useMemo(() => {
    return posts
      .filter(p => p.media_urls?.length > 0)
      .flatMap(p => Array.isArray(p.media_urls) ? p.media_urls : [])
  }, [posts])

  // Game record
  const [gameRecord, setGameRecord] = useState({ wins: 0, losses: 0 })

  useEffect(() => {
    const i = setInterval(() => setBannerSlide(p => (p + 1) % bannerSlides.length), 7000)
    return () => clearInterval(i)
  }, [bannerSlides.length])

  // ═══════════════════════════════════════════════════════════
  // DATA LOADING
  // ═══════════════════════════════════════════════════════════

  useEffect(() => {
    if (teamId) loadTeamData()
  }, [teamId])

  async function loadTeamData() {
    setLoading(true)
    try {
      const { data: teamData } = await supabase
        .from('teams')
        .select('*, seasons(name, sports(name, icon))')
        .eq('id', teamId)
        .single()

      setTeam(teamData)

      const { data: players } = await supabase
        .from('team_players')
        .select(`
          *,
          players (
            id, first_name, last_name, photo_url, jersey_number, position,
            parent_name, parent_email
          )
        `)
        .eq('team_id', teamId)

      setRoster(players?.map(p => p.players).filter(Boolean) || [])

      try {
        const { data: coachesData } = await supabase
          .from('team_coaches')
          .select('*, coach_id')
          .eq('team_id', teamId)

        if (coachesData?.length > 0) {
          const coachIds = coachesData.map(c => c.coach_id).filter(Boolean)
          if (coachIds.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, full_name, email, phone')
              .in('id', coachIds)

            setCoaches(coachesData.map(c => ({
              ...profiles?.find(p => p.id === c.coach_id),
              role: c.role
            })).filter(c => c.id))
          }
        }
      } catch (err) {
        console.log('Could not load coaches:', err)
        setCoaches([])
      }

      try {
        const today = new Date().toISOString().split('T')[0]
        const { data: events } = await supabase
          .from('schedule_events')
          .select('*')
          .eq('team_id', teamId)
          .gte('event_date', today)
          .order('event_date')
          .order('event_time')
          .limit(5)

        setUpcomingEvents(events || [])
      } catch (err) {
        console.log('Could not load events:', err)
        setUpcomingEvents([])
      }

      await loadPosts(1, true)

      // Load active challenges
      try {
        const challenges = await fetchActiveChallenges(teamId)
        setActiveChallenges(challenges)
      } catch (err) {
        console.log('Could not load challenges:', err)
        setActiveChallenges([])
      }

      try {
        const { data: docs } = await supabase
          .from('team_documents')
          .select('*')
          .eq('team_id', teamId)
          .order('created_at', { ascending: false })

        setDocuments(docs || [])
      } catch (err) {
        console.log('Could not load documents:', err)
        setDocuments([])
      }

      // Load game record
      try {
        const { data: games } = await supabase
          .from('games')
          .select('result')
          .eq('team_id', teamId)
          .not('result', 'is', null)

        if (games) {
          const wins = games.filter(g => g.result === 'win').length
          const losses = games.filter(g => g.result === 'loss').length
          setGameRecord({ wins, losses })
        }
      } catch (err) {
        console.log('Could not load game record:', err)
      }

    } catch (err) {
      console.error('Error loading team data:', err)
      showToast?.('Error loading team data', 'error')
    }
    setLoading(false)
  }

  async function reloadChallenges() {
    try {
      const challenges = await fetchActiveChallenges(teamId)
      setActiveChallenges(challenges)
    } catch (err) {
      console.log('Could not reload challenges:', err)
    }
  }

  async function loadPosts(page = 1, reset = false) {
    if (loadingMorePosts) return
    setLoadingMorePosts(true)
    try {
      const from = (page - 1) * POSTS_PER_PAGE
      const to = from + POSTS_PER_PAGE - 1

      const { data: postsData, count } = await supabase
        .from('team_posts')
        .select('*, profiles:author_id(id, full_name, avatar_url)', { count: 'exact' })
        .eq('team_id', teamId)
        .eq('is_published', true)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (reset) {
        setPosts(postsData || [])
      } else {
        setPosts(prev => [...prev, ...(postsData || [])])
      }
      setPostsPage(page)
      setHasMorePosts((postsData?.length || 0) === POSTS_PER_PAGE)
    } catch (err) {
      console.error('Error loading posts:', err)
    }
    setLoadingMorePosts(false)
  }

  function loadMorePosts() {
    if (hasMorePosts && !loadingMorePosts) {
      loadPosts(postsPage + 1, false)
    }
  }

  function openTeamChat() {
    sessionStorage.setItem('openTeamChat', teamId)
    if (onNavigate) {
      onNavigate('messages')
    } else {
      console.warn('TeamWallPage: onNavigate prop not provided - cannot navigate to chat')
    }
  }

  // Post management functions
  async function deletePost(postId) {
    try {
      await supabase.from('team_posts').delete().eq('id', postId)
      setPosts(prev => prev.filter(p => p.id !== postId))
      showToast?.('Post deleted', 'success')
    } catch (err) {
      console.error('Error deleting post:', err)
      showToast?.('Failed to delete post', 'error')
    }
  }

  async function togglePinPost(postId, currentlyPinned) {
    try {
      await supabase.from('team_posts').update({ is_pinned: !currentlyPinned }).eq('id', postId)
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_pinned: !currentlyPinned } : p))
      showToast?.(!currentlyPinned ? 'Post pinned to top' : 'Post unpinned', 'success')
    } catch (err) {
      console.error('Error toggling pin:', err)
      showToast?.('Failed to update pin', 'error')
    }
  }

  async function editPostContent(postId, newContent, newTitle) {
    try {
      const updates = { content: newContent, updated_at: new Date().toISOString() }
      if (newTitle !== undefined) updates.title = newTitle || null
      await supabase.from('team_posts').update(updates).eq('id', postId)
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...updates } : p))
      showToast?.('Post updated', 'success')
    } catch (err) {
      console.error('Error editing post:', err)
      showToast?.('Failed to update post', 'error')
    }
  }

  // ═══════════════════════════════════════════════════════════
  // LOADING / ERROR STATES
  // ═══════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!team) {
    return (
      <div className="text-center py-12">
        <VolleyballIcon className={`w-16 h-16 mx-auto ${tc.textMuted}`} />
        <p className={`${tc.text} mt-4`}>Team not found</p>
        <button onClick={onBack} className="mt-4 text-[var(--accent-primary)]">← Go Back</button>
      </div>
    )
  }

  const teamInitials = (team.name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const seasonLabel = team.seasons?.name || ''
  const sportIcon = team.seasons?.sports?.icon || '🏐'

  const tabs = [
    { id: 'feed', label: 'Feed', icon: '📰' },
    { id: 'schedule', label: 'Schedule', icon: '📅' },
    { id: 'challenges', label: 'Challenges', icon: '🏆' },
    { id: 'gallery', label: 'Gallery', icon: '📷' },
  ]

  const totalGames = gameRecord.wins + gameRecord.losses
  const winRate = totalGames > 0 ? Math.round((gameRecord.wins / totalGames) * 100) : 0

  // ═══════════════════════════════════════════════════════════
  // RENDER — 3-column layout
  // ═══════════════════════════════════════════════════════════

  return (
    <div className={`flex flex-col h-[calc(100vh-4rem)] ${!isDark ? 'tw-light' : ''}`} style={{ background: isDark ? undefined : '#f5f6f8' }}>
      <style>{HUB_STYLES}</style>

      {/* ═══ HERO BANNER ═══ */}
      <div className="shrink-0 px-6 pt-6">
        <div className={`relative overflow-hidden rounded-xl shadow-md ${isDark ? 'shadow-black/20' : ''}`}>
          <div className="relative h-56">
            {/* Banner slides */}
            {bannerSlides.map((slide, idx) => (
              <div key={slide.id} className="absolute inset-0 transition-opacity duration-700"
                style={{ opacity: bannerSlide === idx ? 1 : 0, zIndex: bannerSlide === idx ? 1 : 0 }}>
                {slide.type === 'photo' && <PhotoBanner team={team} g={g} teamInitials={teamInitials}
                  canEdit={isAdminOrCoach}
                  showToast={showToast}
                  onBannerUpdate={(url) => setTeam(prev => ({ ...prev, banner_url: url }))} />}
                {slide.type === 'next_game' && <NextGameBanner team={team} nextGame={nextGame} cd={cd} g={g} teamInitials={teamInitials} />}
                {slide.type === 'season_stats' && <SeasonPulseBanner team={team} roster={roster} coaches={coaches} g={g} sportIcon={sportIcon} />}
              </div>
            ))}

            {/* Back button */}
            <button onClick={onBack}
              className="absolute top-4 left-4 z-20 w-10 h-10 rounded-xl flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all"
              style={{ background: 'rgba(0,0,0,.35)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,.1)' }}>
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Banner dots */}
            <div className="absolute bottom-3 right-4 z-20 flex gap-1.5">
              {bannerSlides.map((_, i) => (
                <button key={i} onClick={() => setBannerSlide(i)} className="transition-all rounded-full" style={{
                  width: bannerSlide === i ? 20 : 6, height: 6,
                  background: bannerSlide === i ? g : 'rgba(255,255,255,.3)',
                }} />
              ))}
            </div>

            {/* Gradient fade */}
            <div className="absolute bottom-0 left-0 right-0 h-24 z-10"
              style={{ background: isDark ? 'linear-gradient(transparent, rgb(15,23,42))' : 'linear-gradient(transparent, #f5f6f8)' }} />

            {/* Team info overlay */}
            <div className="absolute bottom-0 left-0 flex w-full items-end justify-between p-6 z-10">
              <div className="flex items-end gap-4">
                {/* Team logo */}
                <div className="p-0.5 rounded-xl" style={{ background: `linear-gradient(135deg, ${g}, ${dim})` }}>
                  <div className="w-16 h-16 rounded-[14px] flex items-center justify-center overflow-hidden"
                    style={{ background: isDark ? 'rgb(15,23,42)' : '#fff' }}>
                    {team.logo_url ? (
                      <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-extrabold" style={{ color: g }}>{teamInitials}</span>
                    )}
                  </div>
                </div>
                <div className="pb-1">
                  <h1 className="text-xl font-extrabold tracking-tight text-white leading-tight">{team.name}</h1>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-white/50">{roster.length} Players</span>
                    <span className="text-white/20">·</span>
                    <span className="text-[10px] text-white/50">{seasonLabel}</span>
                    <span className="text-white/20">·</span>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={openTeamChat}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition hover:scale-105"
                style={{ background: `${g}cc`, backdropFilter: 'blur(8px)' }}>
                <MessageCircle className="w-4 h-4" /> Join Huddle
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ 3-PANEL LAYOUT ═══ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ═══ LEFT: Roster Sidebar ═══ */}
        <aside className={`hidden lg:flex w-[220px] shrink-0 flex-col overflow-y-auto py-6 pl-6 pr-4 border-r tw-nos ${isDark ? 'border-white/[.06]' : 'border-slate-200'}`}>
          {/* Roster header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)' }}>
              Roster
            </h3>
            <span className="text-[10px] font-medium" style={{ color: isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.25)' }}>
              {roster.length}
            </span>
          </div>

          {/* Roster list */}
          <div className="flex flex-col gap-0.5">
            {roster.map(player => (
              <button key={player.id} onClick={() => setSelectedPlayer(player)}
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors"
                onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{ background: `${g}15`, color: g }}>
                  {player.jersey_number || (player.first_name?.[0] || '') + (player.last_name?.[0] || '')}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: isDark ? 'rgba(255,255,255,.7)' : 'rgba(0,0,0,.7)' }}>
                    {player.first_name} {player.last_name?.[0]}.
                  </p>
                  <p className="text-[10px] truncate" style={{ color: isDark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.3)' }}>
                    {player.position || 'Player'}
                  </p>
                </div>
              </button>
            ))}
            {roster.length === 0 && (
              <p className="text-center py-6 text-[10px]" style={{ color: isDark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.2)' }}>
                No players yet
              </p>
            )}
          </div>

          {/* Coaches */}
          {coaches.length > 0 && (
            <>
              <div className="mt-6 mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)' }}>
                  Coaches
                </h3>
              </div>
              {coaches.map(coach => (
                <div key={coach.id} className="flex items-center gap-3 px-3 py-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                    style={{ background: `${g}15`, color: g }}>
                    {coach.full_name?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: isDark ? 'rgba(255,255,255,.7)' : 'rgba(0,0,0,.7)' }}>
                      {coach.full_name}
                    </p>
                    <p className="text-[10px]" style={{ color: isDark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.3)' }}>
                      {coach.role === 'head' ? 'Head Coach' : 'Assistant'}
                    </p>
                  </div>
                </div>
              ))}
            </>
          )}
        </aside>

        {/* ═══ CENTER: Feed ═══ */}
        <main className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 tw-nos">
          <div className="max-w-2xl mx-auto flex flex-col gap-6">

            {/* Tab Navigation */}
            <div className="flex items-center rounded-xl p-1.5 shadow-sm" style={{ background: isDark ? 'rgba(255,255,255,.04)' : '#fff' }}>
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
                  style={activeTab === tab.id ? {
                    background: g, color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,.15)',
                  } : {
                    color: isDark ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.4)',
                  }}>
                  <span>{tab.icon}</span> {tab.label}
                </button>
              ))}
            </div>

            {/* ═══ FEED TAB ═══ */}
            {activeTab === 'feed' && (
              <>
                {/* Post Composer */}
                {canPost && (
                  <div className="overflow-hidden rounded-xl shadow-sm" style={{ background: isDark ? 'rgba(255,255,255,.04)' : '#fff' }}>
                    <div className="flex items-center gap-3 px-5 pt-4 pb-3">
                      <div className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold text-white overflow-hidden"
                        style={{ background: `linear-gradient(135deg, ${g}, ${gb})` }}>
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          profile?.full_name?.charAt(0) || 'U'
                        )}
                      </div>
                      <button onClick={() => setShowNewPostModal(true)}
                        className="flex flex-1 items-center rounded-xl border px-4 py-2.5 text-sm text-left transition-colors"
                        style={{
                          borderColor: isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.1)',
                          color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)',
                          background: isDark ? 'rgba(255,255,255,.02)' : 'rgba(0,0,0,.02)',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)'}
                        onMouseLeave={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.02)' : 'rgba(0,0,0,.02)'}>
                        What's on your mind?
                      </button>
                    </div>

                    {/* Quick action buttons */}
                    <div className="flex items-center gap-1 border-t px-5 py-2" style={{ borderColor: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)' }}>
                      {[
                        { icon: '📷', label: 'Photo/Video', action: () => setShowNewPostModal(true) },
                        { icon: '⭐', label: 'Shoutout', action: () => setShowShoutoutModal(true) },
                        { icon: '🏆', label: 'Challenge', action: () => setShowCreateChallengeModal(true), show: isAdminOrCoach },
                      ].filter(a => a.show !== false).map(action => (
                        <button key={action.label} onClick={action.action}
                          className="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
                          style={{ color: isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.45)' }}
                          onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <span>{action.icon}</span>
                          <span className="hidden xl:inline">{action.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feed Posts */}
                {posts.length > 0 ? (
                  <div className="flex flex-col gap-6">
                    {posts.map((post, i) => (
                      <FeedPost key={post.id} post={post} g={g} gb={gb} i={i} isDark={isDark}
                        isAdminOrCoach={isAdminOrCoach}
                        currentUserId={user?.id}
                        onDelete={deletePost}
                        onTogglePin={togglePinPost}
                        onEdit={editPostContent}
                        onCommentCountChange={(postId, count) => {
                          setPosts(prev => prev.map(p => p.id === postId ? { ...p, comment_count: count } : p))
                        }}
                        onReactionCountChange={(postId, count) => {
                          setPosts(prev => prev.map(p => p.id === postId ? { ...p, reaction_count: count } : p))
                        }} />
                    ))}
                    {hasMorePosts && (
                      <button onClick={loadMorePosts} disabled={loadingMorePosts}
                        className="w-full py-3 rounded-xl text-sm font-medium transition-colors"
                        style={{
                          background: isDark ? 'rgba(255,255,255,.04)' : '#fff',
                          color: isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.5)',
                        }}>
                        {loadingMorePosts ? 'Loading...' : 'Load More Posts'}
                      </button>
                    )}
                    {!hasMorePosts && posts.length > POSTS_PER_PAGE && (
                      <p className="text-center text-xs py-4" style={{ color: isDark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.15)' }}>
                        End of feed
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl p-12 text-center shadow-sm" style={{ background: isDark ? 'rgba(255,255,255,.04)' : '#fff' }}>
                    <Megaphone className="w-12 h-12 mx-auto" style={{ color: isDark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.15)' }} />
                    <p className="mt-4 text-sm font-semibold" style={{ color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)' }}>No posts yet</p>
                    <p className="text-xs mt-1" style={{ color: isDark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.2)' }}>Be the first to share with the team!</p>
                  </div>
                )}
              </>
            )}

            {/* ═══ SCHEDULE TAB ═══ */}
            {activeTab === 'schedule' && (
              <div className="rounded-xl overflow-hidden shadow-sm" style={{ background: isDark ? 'rgba(255,255,255,.04)' : '#fff' }}>
                {upcomingEvents.map(event => {
                  const eventDate = new Date(event.event_date)
                  const isGame = event.event_type === 'game'
                  return (
                    <div key={event.id}
                      className="flex items-center gap-5 px-5 py-4 transition-colors cursor-pointer"
                      style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,.04)' : '1px solid rgba(0,0,0,.06)' }}
                      onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div className="text-center min-w-[44px]">
                        <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: isGame ? g : '#38BDF8' }}>
                          {eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                        </p>
                        <p className="text-2xl font-extrabold leading-none" style={{ color: isDark ? 'white' : '#1a1a1a' }}>
                          {eventDate.getDate()}
                        </p>
                      </div>
                      <div className="w-px h-8" style={{ background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)' }} />
                      <div className="flex-1">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                          style={{ background: isGame ? `${g}15` : 'rgba(56,189,248,.1)', color: isGame ? g : '#38BDF8' }}>
                          {isGame ? '🏐 Game' : '🏋️ Practice'}
                        </span>
                        <p className="font-semibold mt-1 text-sm" style={{ color: isDark ? 'white' : '#1a1a1a' }}>
                          {event.title || event.event_type}{event.opponent && ` vs ${event.opponent}`}
                        </p>
                        <p className="text-xs" style={{ color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)' }}>
                          {event.event_time && formatTime12(event.event_time)}
                          {event.location && ` · ${event.location}`}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4" style={{ color: isDark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.2)' }} />
                    </div>
                  )
                })}
                {upcomingEvents.length === 0 && (
                  <div className="p-12 text-center">
                    <Calendar className="w-12 h-12 mx-auto" style={{ color: isDark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.15)' }} />
                    <p className="mt-4 text-sm" style={{ color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)' }}>No upcoming events</p>
                  </div>
                )}
              </div>
            )}

            {/* ═══ CHALLENGES TAB ═══ */}
            {activeTab === 'challenges' && (
              <>
                {isAdminOrCoach && (
                  <button onClick={() => setShowCreateChallengeModal(true)}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition hover:brightness-110"
                    style={{ background: `linear-gradient(135deg, ${g}, ${dim})` }}>
                    <Trophy className="w-4 h-4" /> Create Challenge
                  </button>
                )}
                {activeChallenges.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {activeChallenges.map(ch => (
                      <ChallengeCard
                        key={ch.id}
                        metadataJson={JSON.stringify({
                          title: ch.title,
                          description: ch.description,
                          challengeType: ch.challenge_type,
                          targetValue: ch.target_value,
                          xpReward: ch.xp_reward,
                          startsAt: ch.starts_at,
                          endsAt: ch.ends_at,
                        })}
                        coachName=""
                        createdAt={ch.created_at}
                        participantCount={ch.participants?.length || 0}
                        isOptedIn={ch.participants?.some(p => p.player_id === user?.id)}
                        userProgress={ch.participants?.find(p => p.player_id === user?.id)?.current_value || 0}
                        teamProgress={ch.totalProgress || 0}
                        isDark={isDark}
                        accentColor={g}
                        onOptIn={async () => {
                          if (!user?.id) return
                          await optInToChallenge(ch.id, user.id)
                          reloadChallenges()
                        }}
                        onViewDetails={() => {
                          setSelectedChallengeId(ch.id)
                          setShowChallengeDetailModal(true)
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl p-12 text-center shadow-sm" style={{ background: isDark ? 'rgba(255,255,255,.04)' : '#fff' }}>
                    <Trophy className="w-12 h-12 mx-auto" style={{ color: isDark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.15)' }} />
                    <p className="mt-4 text-sm" style={{ color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)' }}>No active challenges</p>
                  </div>
                )}
              </>
            )}

            {/* ═══ GALLERY TAB ═══ */}
            {activeTab === 'gallery' && (
              <PhotoGallery teamId={teamId} isDark={isDark} g={g} />
            )}
          </div>
        </main>

        {/* ═══ RIGHT: Widgets Sidebar ═══ */}
        <aside className={`hidden xl:flex w-[280px] shrink-0 flex-col gap-6 overflow-y-auto py-6 pl-6 pr-6 border-l tw-nos ${isDark ? 'border-white/[.06]' : 'border-slate-200'}`}>

          {/* UPCOMING EVENTS */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)' }}>
                Upcoming
              </h3>
              <button onClick={() => setActiveTab('schedule')} className="flex items-center gap-1 text-[10px] font-medium transition" style={{ color: g }}>
                Full Calendar <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {upcomingEvents.slice(0, 3).map(event => {
                const ed = new Date(event.event_date)
                const isGame = event.event_type === 'game'
                return (
                  <div key={event.id} className="rounded-xl p-3.5 shadow-sm transition-all cursor-pointer"
                    style={{ background: isDark ? 'rgba(255,255,255,.04)' : '#fff' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.08)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,.04)'}>
                    <div className="flex items-center gap-3">
                      <div className="text-center min-w-[32px]">
                        <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: isGame ? g : '#38BDF8' }}>
                          {ed.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                        </p>
                        <p className="text-lg font-extrabold leading-none" style={{ color: isDark ? 'white' : '#1a1a1a' }}>{ed.getDate()}</p>
                      </div>
                      <div className="w-px h-6" style={{ background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.08)' }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate" style={{ color: isDark ? 'rgba(255,255,255,.7)' : 'rgba(0,0,0,.7)' }}>
                          {event.title || event.event_type}{event.opponent && ` vs ${event.opponent}`}
                        </p>
                        <p className="text-[10px]" style={{ color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)' }}>
                          {event.event_time && formatTime12(event.event_time)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
              {upcomingEvents.length === 0 && (
                <p className="text-center py-4 text-[10px]" style={{ color: isDark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.2)' }}>
                  No upcoming events
                </p>
              )}
            </div>
          </section>

          {/* SEASON RECORD */}
          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)' }}>
              Season Record
            </h3>
            <div className="flex flex-col items-center gap-2 rounded-xl p-6 shadow-sm"
              style={{ background: isDark ? 'rgba(255,255,255,.04)' : '#fff' }}>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-extrabold" style={{ color: g }}>{gameRecord.wins}</span>
                <span className="text-xl" style={{ color: isDark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.15)' }}>&mdash;</span>
                <span className="text-4xl font-extrabold text-red-500">{gameRecord.losses}</span>
              </div>
              <p className="text-xs" style={{ color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)' }}>
                {totalGames > 0 ? `${winRate}% win rate` : 'No games played'}
              </p>
            </div>
          </section>

          {/* GALLERY */}
          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)' }}>
              Gallery
            </h3>
            {galleryImages.length > 0 ? (
              <div className="grid grid-cols-3 gap-1.5">
                {galleryImages.slice(0, 6).map((src, i) => (
                  <div key={i} className="relative aspect-square overflow-hidden rounded-lg cursor-pointer transition hover:brightness-90"
                    onClick={() => setGalleryLightboxIdx(i)}>
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl p-6 text-center shadow-sm" style={{ background: isDark ? 'rgba(255,255,255,.04)' : '#fff' }}>
                <ImageIcon className="w-8 h-8 mx-auto" style={{ color: isDark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.15)' }} />
                <p className="text-[10px] mt-2" style={{ color: isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.25)' }}>No photos yet</p>
              </div>
            )}
          </section>

          {/* DOCUMENTS */}
          {documents.length > 0 && (
            <section className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)' }}>
                Documents
              </h3>
              <div className="rounded-xl overflow-hidden shadow-sm" style={{ background: isDark ? 'rgba(255,255,255,.04)' : '#fff' }}>
                {documents.slice(0, 3).map(doc => (
                  <a key={doc.id} href={doc.file_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 transition-colors"
                    style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,.04)' : '1px solid rgba(0,0,0,.06)' }}
                    onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <FileText className="h-4 w-4 shrink-0" style={{ color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)' }} />
                    <span className="text-xs truncate" style={{ color: isDark ? 'rgba(255,255,255,.6)' : 'rgba(0,0,0,.6)' }}>{doc.name}</span>
                  </a>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>

      {/* ═══ FAB ═══ */}
      {canPost && (
        <button onClick={() => setShowNewPostModal(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-xl flex items-center justify-center text-white shadow-lg transition hover:scale-110 active:scale-95"
          style={{ background: `linear-gradient(135deg, ${gb}, ${g})`, boxShadow: `0 8px 32px ${g}40` }}>
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* ═══ Gallery Lightbox ═══ */}
      {galleryLightboxIdx !== null && (
        <PhotoLightbox
          photos={galleryImages}
          initialIndex={galleryLightboxIdx}
          onClose={() => setGalleryLightboxIdx(null)}
        />
      )}

      {/* ═══ NEW POST MODAL ═══ */}
      {showNewPostModal && (
        <NewPostModal
          teamId={teamId} g={g} gb={gb} dim={dim} isDark={isDark}
          onClose={() => setShowNewPostModal(false)}
          onSuccess={() => { loadPosts(1, true); setShowNewPostModal(false) }}
          showToast={showToast}
          canPin={isAdminOrCoach}
        />
      )}

      {/* ═══ PLAYER CARD EXPANDED ═══ */}
      {selectedPlayer && (
        <PlayerCardExpanded
          player={selectedPlayer}
          visible={!!selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          context="roster"
          viewerRole={profile?.role === 'parent' ? 'parent' : profile?.role === 'coach' ? 'coach' : 'admin'}
          seasonId={team?.season_id}
          sport={team?.seasons?.sports?.name?.toLowerCase() || 'volleyball'}
          isOwnChild={false}
        />
      )}

      {/* ═══ ENGAGEMENT MODALS ═══ */}
      <GiveShoutoutModal
        visible={showShoutoutModal}
        teamId={teamId}
        onClose={() => setShowShoutoutModal(false)}
        onSuccess={() => { loadPosts(1, true); showToast?.('Shoutout sent!', 'success') }}
      />
      <CreateChallengeModal
        visible={showCreateChallengeModal}
        teamId={teamId}
        organizationId={team?.organization_id || profile?.current_organization_id || ''}
        onClose={() => setShowCreateChallengeModal(false)}
        onSuccess={() => { reloadChallenges(); loadPosts(1, true); showToast?.('Challenge created!', 'success') }}
      />
      <ChallengeDetailModal
        visible={showChallengeDetailModal}
        challengeId={selectedChallengeId}
        onClose={() => { setShowChallengeDetailModal(false); setSelectedChallengeId(null) }}
        onOptInSuccess={reloadChallenges}
      />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// BANNER SLIDES
// ═══════════════════════════════════════════════════════════

function PhotoBanner({ team, g, teamInitials, canEdit, showToast, onBannerUpdate }) {
  const coverRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  async function handleCoverUpload(e) {
    const file = e.target.files?.[0]
    if (!file || !canEdit) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `covers/${team.id}-${Date.now()}.${ext}`
      const { data, error } = await supabase.storage
        .from('team-photos')
        .upload(path, file, { cacheControl: '3600', upsert: true })

      if (error) throw error

      const { data: publicUrl } = supabase.storage
        .from('team-photos')
        .getPublicUrl(data.path)

      const url = publicUrl?.publicUrl
      if (url) {
        await supabase.from('teams').update({ banner_url: url }).eq('id', team.id)
        onBannerUpdate?.(url)
        showToast?.('Cover photo updated!', 'success')
      }
    } catch (err) {
      console.error('Cover upload error:', err)
      showToast?.('Failed to upload cover photo', 'error')
    }
    setUploading(false)
  }

  return (
    <div className="absolute inset-0" style={{ background: team.banner_url ? undefined : `linear-gradient(135deg, #1a1520 0%, #0d1117 50%, #141820 100%)` }}>
      {team.banner_url ? (
        <img src={team.banner_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-[120px] opacity-[.03]">🐝</p>
        </div>
      )}
      {canEdit && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition cursor-pointer" style={{ background: 'rgba(0,0,0,.4)' }}
          onClick={() => coverRef.current?.click()}>
          <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
          <div className="text-center">
            {uploading ? (
              <>
                <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-2" style={{ borderColor: g, borderTopColor: 'transparent' }} />
                <p className="text-xs text-white/60 font-bold uppercase tracking-wider">UPLOADING...</p>
              </>
            ) : (
              <>
                <p className="text-4xl mb-2">📷</p>
                <p className="text-xs text-white/60 font-bold uppercase tracking-wider">UPLOAD COVER PHOTO</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function NextGameBanner({ team, nextGame, cd, g, teamInitials }) {
  if (!nextGame) {
    return (
      <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0e0a14 0%, #0A0A0F 50%, #0a0f14 100%)' }}>
        <div className="text-center">
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/20 mb-2">NO UPCOMING GAMES</p>
          <p className="text-3xl font-extrabold tracking-tight text-white/10">CHECK BACK SOON</p>
        </div>
      </div>
    )
  }

  const oppTag = (nextGame.opponent || 'OPP').slice(0, 4).toUpperCase()

  return (
    <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0e0a14 0%, #0A0A0F 50%, #0a0f14 100%)' }}>
      <div className="absolute" style={{ top: '10%', left: '30%', width: '40%', height: '60%', background: `radial-gradient(ellipse,${g}0a 0%,transparent 60%)`, filter: 'blur(30px)' }} />
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
        <div className="flex items-center gap-6 md:gap-10 mb-3">
          <div className="text-center">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center mx-auto mb-1.5" style={{ background: `${g}15`, border: `1.5px solid ${g}35` }}>
              {team.logo_url ? (
                <img src={team.logo_url} alt="" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <span className="text-2xl md:text-3xl font-extrabold" style={{ color: g }}>{teamInitials}</span>
              )}
            </div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">{team.name}</p>
          </div>
          <span className="text-4xl md:text-5xl font-extrabold" style={{ color: '#EF4444', animation: 'vsFlash 3s ease-in-out infinite' }}>VS</span>
          <div className="text-center">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center mx-auto mb-1.5" style={{ background: 'rgba(255,255,255,.03)', border: '1.5px solid rgba(255,255,255,.06)' }}>
              <span className="text-2xl md:text-3xl font-extrabold text-white/15">{oppTag}</span>
            </div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-white/20">{nextGame.opponent || 'Opponent'}</p>
          </div>
        </div>

        <div className="flex gap-3 mb-2">
          {cd.d !== undefined && [
            { v: cd.d, l: 'DAYS' }, { v: cd.h, l: 'HRS' }, { v: cd.m, l: 'MIN' }, { v: cd.s, l: 'SEC' },
          ].map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="text-center">
                <span className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">{String(d.v).padStart(2, '0')}</span>
                <p className="text-[7px] font-bold uppercase tracking-wider text-white/20">{d.l}</p>
              </div>
              {i < 3 && <span className="text-xl font-extrabold text-white/10 -mt-3">:</span>}
            </div>
          ))}
        </div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/25">
          {nextGame.event_time && formatTime12(nextGame.event_time)}
        </p>
      </div>
    </div>
  )
}

function SeasonPulseBanner({ team, roster, coaches, g, sportIcon }) {
  return (
    <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0f0d14 0%, #0A0A0F 50%, #0d0f14 100%)' }}>
      <div className="absolute" style={{ top: '20%', left: '20%', width: '60%', height: '50%', background: `radial-gradient(ellipse,${g}08 0%,transparent 60%)`, filter: 'blur(40px)' }} />
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
        <p className="text-[9px] font-bold uppercase tracking-widest text-white/20 mb-2">SEASON SNAPSHOT</p>
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-1">{sportIcon} {team.name}</h2>
        <p className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: g }}>{team.seasons?.name || 'Current Season'}</p>
        <div className="flex gap-8">
          <div className="text-center">
            <p className="text-3xl font-extrabold text-white">{roster.length}</p>
            <p className="text-[8px] text-white/20 font-bold uppercase tracking-wider">PLAYERS</p>
          </div>
          <div className="w-px h-12" style={{ background: 'rgba(255,255,255,.06)' }} />
          <div className="text-center">
            <p className="text-3xl font-extrabold text-white">{coaches.length}</p>
            <p className="text-[8px] text-white/20 font-bold uppercase tracking-wider">COACHES</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export { TeamWallPage }
