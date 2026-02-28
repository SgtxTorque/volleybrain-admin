import { useState, useEffect, useRef, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useParentTutorial } from '../../contexts/ParentTutorialContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { PlayerCardExpanded } from '../../components/players'
import {
  ArrowLeft, Calendar, MapPin, Clock, Users, MessageCircle,
  FileText, ChevronRight, ChevronUp, Star,
  BarChart3, Camera, Megaphone, Trophy,
  Image as ImageIcon, Award
} from '../../constants/icons'
import PhotoLightbox from '../../components/common/PhotoLightbox'
import GiveShoutoutModal from '../../components/engagement/GiveShoutoutModal'
import CreateChallengeModal from '../../components/engagement/CreateChallengeModal'
import { fetchActiveChallenges } from '../../lib/challenge-service'
import FeedPost from './FeedPost'
import { HUB_STYLES, adjustBrightness } from '../../constants/hubStyles'
import NewPostModal from './NewPostModal'

// ═══════════════════════════════════════════════════════════
// @font-face — Tele-Grotesk (LOCAL FILES)
// ═══════════════════════════════════════════════════════════
const FONT_STYLES = `
@font-face {
  font-family: 'Tele-Grotesk';
  src: url('/fonts/Tele-GroteskNor-Regular.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Tele-Grotesk';
  src: url('/fonts/Tele-GroteskHal-Regular.ttf') format('truetype');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Tele-Grotesk';
  src: url('/fonts/Tele-GroteskFet-Regular.ttf') format('truetype');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Tele-Grotesk';
  src: url('/fonts/Tele-GroteskUlt-Regular.ttf') format('truetype');
  font-weight: 900;
  font-style: normal;
  font-display: swap;
}
`

const FONT_STACK = "'Tele-Grotesk', -apple-system, system-ui, sans-serif"

// ═══════════════════════════════════════════════════════════
// BRAND CONSTANTS (from lynx-brandbook-v2.html)
// ═══════════════════════════════════════════════════════════
const BRAND = {
  navy: '#10284C',
  sky: '#4BB9EC',
  deepSky: '#2A9BD4',
  ice: '#E8F4FD',
  slate: '#5A6B7F',
  silver: '#DFE4EA',
  cloud: '#F5F7FA',
  white: '#FFFFFF',
  frost: '#F0F3F7',
  midnight: '#0A1B33',
  charcoal: '#1A2332',
  graphite: '#232F3E',
  darkBorder: '#2A3545',
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

function VolleyballIcon({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

function getEventDayLabel(dateStr) {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const eventDate = new Date(dateStr)
  eventDate.setHours(0, 0, 0, 0)
  const diff = Math.round((eventDate - today) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'TODAY'
  if (diff === 1) return 'TOMORROW'
  return null
}

// ═══════════════════════════════════════════════════════════
// TEAM WALL PAGE — Instagram/Facebook-inspired 3-column layout
// ═══════════════════════════════════════════════════════════
function TeamWallPage({ teamId, showToast, onBack, onNavigate, activeView }) {
  const { profile, user } = useAuth()
  const { completeStep } = useParentTutorial?.() || {}
  const { isDark } = useTheme()
  const tc = useThemeClasses()

  // ── Theme derived values ──
  const pageBg = isDark ? BRAND.midnight : BRAND.cloud
  const cardBg = isDark ? BRAND.charcoal : BRAND.white
  const innerBg = isDark ? BRAND.graphite : BRAND.frost
  const borderColor = isDark ? BRAND.darkBorder : BRAND.silver
  const textPrimary = isDark ? '#FFFFFF' : BRAND.navy
  const textSecondary = isDark ? '#B0BEC5' : BRAND.slate
  const textMuted = isDark ? '#7B8FA0' : BRAND.slate
  const successColor = isDark ? '#34D399' : '#10B981'
  const errorColor = isDark ? '#F87171' : '#EF4444'
  const warningColor = isDark ? '#FBBF24' : '#F59E0B'
  const shadow = isDark ? '0 1px 3px rgba(0,0,0,.3)' : '0 1px 3px rgba(0,0,0,.05)'
  const shadowElevated = isDark ? '0 8px 24px rgba(0,0,0,.3)' : '0 8px 24px rgba(0,0,0,.08)'

  // Accent — always Sky Blue per brand book
  const g = BRAND.sky
  const gb = adjustBrightness(g, 20)
  const dim = adjustBrightness(g, -30)

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
  const [showNewPostModal, setShowNewPostModal] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState(null)

  // Engagement
  const [showShoutoutModal, setShowShoutoutModal] = useState(false)
  const [showCreateChallengeModal, setShowCreateChallengeModal] = useState(false)
  const [activePlayerPopup, setActivePlayerPopup] = useState(null)
  const [activeChallenges, setActiveChallenges] = useState([])

  // Gallery lightbox
  const [galleryLightboxIdx, setGalleryLightboxIdx] = useState(null)

  // Game record + recent form
  const [gameRecord, setGameRecord] = useState({ wins: 0, losses: 0, recentForm: [] })

  // Back-to-top FAB
  const centerRef = useRef(null)
  const [showBackToTop, setShowBackToTop] = useState(false)

  const playerPopupRef = useRef(null)

  // Close player popup on outside click
  useEffect(() => {
    if (!activePlayerPopup) return
    const handleClick = (e) => {
      if (playerPopupRef.current && !playerPopupRef.current.contains(e.target)) setActivePlayerPopup(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [activePlayerPopup])

  const isAdminOrCoach = profile?.role === 'admin' || profile?.role === 'coach'
  const canPost = isAdminOrCoach || profile?.role === 'parent'

  const galleryImages = useMemo(() => {
    return posts
      .filter(p => p.media_urls?.length > 0)
      .flatMap(p => Array.isArray(p.media_urls) ? p.media_urls : [])
  }, [posts])

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
        .select(`*, players (id, first_name, last_name, photo_url, jersey_number, position, parent_name, parent_email)`)
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
              .select('id, full_name, email, phone, avatar_url')
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

      try {
        const { data: games } = await supabase
          .from('games')
          .select('team_score, opponent_score, status, date')
          .eq('team_id', teamId)
          .eq('status', 'completed')
          .order('date', { ascending: false })
        if (games) {
          let wins = 0, losses = 0
          const recentForm = []
          games.forEach((g, i) => {
            const won = (g.team_score || 0) > (g.opponent_score || 0)
            if (won) wins++; else losses++
            if (i < 5) recentForm.push(won ? 'win' : 'loss')
          })
          setGameRecord({ wins, losses, recentForm })
        }
      } catch (err) {
        console.log('Could not load game record:', err)
      }

      completeStep?.('join_team_hub')
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
      const { data: postsData } = await supabase
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
    if (hasMorePosts && !loadingMorePosts) loadPosts(postsPage + 1, false)
  }

  function openTeamChat() {
    sessionStorage.setItem('openTeamChat', teamId)
    if (onNavigate) onNavigate('messages')
  }

  // ═══════════════════════════════════════════════════════════
  // POST MANAGEMENT
  // ═══════════════════════════════════════════════════════════

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
  // SCROLL HANDLER (back-to-top FAB)
  // ═══════════════════════════════════════════════════════════

  function handleCenterScroll() {
    if (centerRef.current) {
      setShowBackToTop(centerRef.current.scrollTop > 1500)
    }
  }

  // ═══════════════════════════════════════════════════════════
  // LOADING / ERROR STATES
  // ═══════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" style={{ fontFamily: FONT_STACK }}>
        <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full"
          style={{ borderColor: BRAND.sky, borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!team) {
    return (
      <div className="text-center py-12" style={{ fontFamily: FONT_STACK }}>
        <VolleyballIcon className="w-16 h-16 mx-auto" style={{ color: textMuted }} />
        <p className="mt-4" style={{ color: textPrimary, fontSize: 14, fontWeight: 400 }}>Team not found</p>
        <button onClick={onBack} className="mt-4" style={{ color: BRAND.sky, fontSize: 14, fontWeight: 500 }}>
          ← Go Back
        </button>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ═══════════════════════════════════════════════════════════

  const teamInitials = (team.name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const seasonLabel = team.seasons?.name || ''
  const sportIcon = team.seasons?.sports?.icon || '🏐'
  const totalGames = gameRecord.wins + gameRecord.losses
  const winRate = totalGames > 0 ? Math.round((gameRecord.wins / totalGames) * 100) : 0
  const nextGame = upcomingEvents.find(e => e.event_type === 'game') || upcomingEvents[0]
  const headCoach = coaches.find(c => c.role === 'head') || coaches[0] || null

  // Label style helper (11px/Hal 500/0.1em/uppercase/Slate)
  const labelStyle = { fontSize: 13, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: BRAND.slate }

  // ═══════════════════════════════════════════════════════════
  // RENDER — 3-column layout
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]"
      style={{ background: pageBg, fontFamily: FONT_STACK }}>
      <style>{FONT_STYLES}{HUB_STYLES}{`
.tw-hide-scrollbar::-webkit-scrollbar { width: 0; background: transparent; }
.tw-hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
`}</style>

      {/* ═══ MOBILE HEADER (below lg) ═══ */}
      <div className="lg:hidden flex items-center gap-3 px-4 py-3 shrink-0"
        style={{ borderBottom: `1px solid ${borderColor}` }}>
        <button onClick={onBack}
          className="shrink-0 w-8 h-8 flex items-center justify-center"
          style={{ borderRadius: 10, background: innerBg, color: textPrimary, transition: 'all 250ms' }}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        {team.logo_url ? (
          <img src={team.logo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: BRAND.ice, color: BRAND.deepSky, fontSize: 12, fontWeight: 700 }}>
            {teamInitials}
          </div>
        )}
        <h1 style={{ fontSize: 15, fontWeight: 700, color: textPrimary }}>{team.name}</h1>
      </div>

      {/* ═══ 3-COLUMN GRID ═══ */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_335px] lg:grid-cols-[335px_1fr_335px] px-4 lg:px-12" style={{ maxWidth: 1400, margin: '0 auto', gap: 24, height: 'calc(100vh - 64px)' }}>

        {/* ═══════════════════════════════════════════════════ */}
        {/* LEFT COLUMN — Team Identity (Static, No Scroll)   */}
        {/* ═══════════════════════════════════════════════════ */}
        <aside className="hidden lg:flex flex-col gap-4 p-4 xl:p-5 overflow-y-auto tw-hide-scrollbar"
          style={{ height: '100%' }}>

          {/* Back button */}
          <button onClick={onBack}
            className="flex items-center gap-2 self-start transition-all"
            style={{ fontSize: 15, fontWeight: 500, color: BRAND.sky, borderRadius: 10, padding: '4px 8px', marginBottom: -4 }}
            onMouseEnter={e => e.currentTarget.style.background = isDark ? `${BRAND.sky}15` : BRAND.ice}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {/* ─── Team Hero Header ─── */}
          <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12, boxShadow: shadow }}>
            <div className="flex flex-col items-center p-5 gap-3">
              {/* Logo */}
              <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center"
                style={{ border: `3px solid ${borderColor}` }}>
                {team.logo_url ? (
                  <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"
                    style={{ background: BRAND.ice }}>
                    <span style={{ fontSize: 24, fontWeight: 700, color: BRAND.navy }}>{teamInitials}</span>
                  </div>
                )}
              </div>

              {/* Name */}
              <h1 style={{ fontSize: 20, fontWeight: 700, color: textPrimary, textAlign: 'center', lineHeight: 1.3 }}>
                {team.name}
              </h1>

              {/* Season */}
              {seasonLabel && (
                <span style={labelStyle}>
                  {sportIcon} {seasonLabel}
                </span>
              )}

              {/* ─── Season Record ─── */}
              <div className="w-full pt-3 mt-1" style={{ borderTop: `1px solid ${borderColor}` }}>
                <p style={{ ...labelStyle, marginBottom: 8 }}>Season Record</p>

                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <span style={{ fontSize: 36, fontWeight: 900, color: successColor, lineHeight: 1 }}>
                      {gameRecord.wins}
                    </span>
                    <p style={labelStyle}>W</p>
                  </div>
                  <span style={{ fontSize: 20, color: textMuted }}>—</span>
                  <div className="text-center">
                    <span style={{ fontSize: 36, fontWeight: 900, color: errorColor, lineHeight: 1 }}>
                      {gameRecord.losses}
                    </span>
                    <p style={labelStyle}>L</p>
                  </div>
                </div>

                {/* Win % */}
                <p style={{ fontSize: 16, fontWeight: 400, color: textPrimary, textAlign: 'center', marginTop: 4 }}>
                  {totalGames > 0 ? `${winRate}%` : 'No games played'}
                </p>

                {/* Progress bar */}
                {totalGames > 0 && (
                  <div className="mt-3 w-full rounded-full overflow-hidden"
                    style={{ height: 5, background: isDark ? BRAND.graphite : BRAND.silver }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${winRate}%`, background: 'linear-gradient(90deg, #10B981, #4BB9EC)', transition: 'width 250ms' }} />
                  </div>
                )}

                {/* Recent form dots */}
                {gameRecord.recentForm.length > 0 && (
                  <div className="mt-3">
                    <p style={{ ...labelStyle, marginBottom: 6 }}>Recent Form</p>
                    <div className="flex items-center justify-center gap-2">
                      {gameRecord.recentForm.map((result, i) => (
                        <div key={i} className="w-3 h-3 rounded-full" style={{
                          background: result === 'win' ? successColor : result === 'loss' ? errorColor : warningColor,
                          transition: 'all 250ms',
                        }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── Next Event Hero Card (Photo Background) ─── */}
          {nextGame && (() => {
            const isGame = nextGame.event_type === 'game' || nextGame.event_type === 'tournament'
            const bgImage = isGame ? '/images/volleyball-game.jpg' : '/images/volleyball-practice.jpg'
            const dayLabel = getEventDayLabel(nextGame.event_date)

            return (
              <div style={{
                borderRadius: 12, overflow: 'hidden', position: 'relative', minHeight: 200,
                border: `1px solid ${borderColor}`, boxShadow: shadow,
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: `url(${bgImage})`,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.75) 0%, rgba(0,0,0,.15) 100%)' }} />
                <div style={{ position: 'relative', zIndex: 1, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: 200 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    <span style={{ padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#4BB9EC', color: '#fff' }}>
                      {(nextGame.event_type || 'GAME').toUpperCase()}
                    </span>
                    {dayLabel && (
                      <span style={{ padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#F59E0B', color: '#fff' }}>
                        {dayLabel}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,.8)' }}>
                    {nextGame.event_type === 'practice' ? 'Practice' : 'Game Day'}
                  </p>
                  <p style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>
                    {nextGame.opponent ? `vs ${nextGame.opponent}` : nextGame.title || 'Practice'}
                  </p>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {nextGame.event_date && (
                      <span>📅 {new Date(nextGame.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    )}
                    {nextGame.event_time && <span>🕐 {formatTime12(nextGame.event_time)}</span>}
                    {nextGame.location && <span>📍 {nextGame.location}</span>}
                  </div>
                  {nextGame.location && (
                    <button
                      onClick={() => {
                        const q = encodeURIComponent(nextGame.location || '')
                        window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank')
                      }}
                      style={{
                        marginTop: 12, padding: '8px 16px', borderRadius: 10,
                        background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)',
                        color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6, width: 'fit-content',
                        transition: 'all 250ms',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.25)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.15)' }}>
                      📍 Get Directions
                    </button>
                  )}
                </div>
              </div>
            )
          })()}

          {/* ─── Upcoming Events ─── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span style={labelStyle}>Upcoming</span>
              <button onClick={() => onNavigate?.('schedule')}
                className="flex items-center gap-1 transition-all"
                style={{ fontSize: 14, fontWeight: 500, color: BRAND.sky }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                Full Calendar <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12, boxShadow: shadow, overflow: 'hidden' }}>
              {upcomingEvents.slice(0, 3).map((event, i) => {
                const ed = new Date(event.event_date)
                return (
                  <div key={event.id} className="flex items-center gap-3 p-3.5"
                    style={{ borderBottom: i < Math.min(upcomingEvents.length, 3) - 1 ? `1px solid ${borderColor}` : 'none' }}>
                    <div className="text-center min-w-[36px]">
                      <p style={{ ...labelStyle, color: BRAND.sky, fontSize: 10 }}>
                        {ed.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                      </p>
                      <p style={{ fontSize: 28, fontWeight: 900, color: textPrimary, lineHeight: 1 }}>
                        {ed.getDate()}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p style={{ fontSize: 16, fontWeight: 500, color: textPrimary }} className="truncate">
                        {event.title || event.event_type}{event.opponent ? ` vs ${event.opponent}` : ''}
                      </p>
                      <p style={{ fontSize: 14, fontWeight: 400, color: textMuted }}>
                        {event.event_time && formatTime12(event.event_time)}
                        {event.location ? ` · ${event.location}` : ''}
                      </p>
                    </div>
                  </div>
                )
              })}
              {upcomingEvents.length === 0 && (
                <div className="p-6 text-center">
                  <Calendar className="w-8 h-8 mx-auto" style={{ color: textMuted }} />
                  <p style={{ fontSize: 14, fontWeight: 400, color: textMuted, marginTop: 8 }}>No upcoming events</p>
                </div>
              )}
            </div>
          </div>

          {/* ─── Quick Actions ─── */}
          <div>
            <span style={{ ...labelStyle, display: 'block', marginBottom: 8 }}>Quick Actions</span>
            <div className="flex flex-col gap-1">
              {[
                { icon: Calendar, label: 'View Schedule', action: () => onNavigate?.('schedule') },
                { icon: MessageCircle, label: 'Team Chat', action: openTeamChat },
                { icon: BarChart3, label: 'Standings', action: () => onNavigate?.('standings') },
                { icon: Trophy, label: 'Achievements', action: () => onNavigate?.('achievements') },
              ].map(item => (
                <button key={item.label} onClick={item.action}
                  className="flex items-center gap-3 w-full p-2.5 transition-all"
                  style={{ borderRadius: 10, fontSize: 16, fontWeight: 500, color: textPrimary, transition: 'all 250ms' }}
                  onMouseEnter={e => e.currentTarget.style.background = innerBg}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <item.icon className="w-[18px] h-[18px]" style={{ color: BRAND.slate }} />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronRight className="w-4 h-4" style={{ color: textMuted }} />
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ═══════════════════════════════════════════════════ */}
        {/* CENTER COLUMN — Social Feed (Scrollable)          */}
        {/* ═══════════════════════════════════════════════════ */}
        <main ref={centerRef} onScroll={handleCenterScroll}
          className="overflow-y-auto tw-hide-scrollbar"
          style={{ height: '100%' }}>
          <div className="px-4 lg:px-6 py-5 flex flex-col gap-5">

            {/* ─── Create Post Bar ─── */}
            {canPost && (
              <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12, boxShadow: shadow }}>
                <div className="flex items-center gap-3 p-4">
                  <div className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center overflow-hidden"
                    style={{ background: BRAND.ice, color: BRAND.deepSky, fontSize: 14, fontWeight: 700 }}>
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      profile?.full_name?.charAt(0) || 'U'
                    )}
                  </div>
                  <button onClick={() => setShowNewPostModal(true)}
                    className="flex flex-1 items-center px-4 py-2.5 text-left transition-all"
                    style={{
                      borderRadius: 999, border: `1px solid ${borderColor}`,
                      color: textMuted, fontSize: 16, fontWeight: 400,
                      background: innerBg, transition: 'all 250ms',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = isDark ? BRAND.graphite : '#E8ECF0'}
                    onMouseLeave={e => e.currentTarget.style.background = innerBg}>
                    Share a Moment...
                  </button>
                  <button onClick={() => setShowNewPostModal(true)}
                    className="w-9 h-9 shrink-0 flex items-center justify-center transition-all"
                    style={{ borderRadius: 999, color: BRAND.sky, transition: 'all 250ms' }}
                    onMouseEnter={e => e.currentTarget.style.background = isDark ? `${BRAND.sky}15` : BRAND.ice}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* ─── Post Feed ─── */}
            {posts.length > 0 ? (
              <div className="flex flex-col gap-5">
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
                    className="w-full py-3 text-center transition-all"
                    style={{
                      borderRadius: 12, background: cardBg, border: `1px solid ${borderColor}`,
                      color: textSecondary, fontSize: 16, fontWeight: 500, transition: 'all 250ms',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                    {loadingMorePosts ? 'Loading...' : 'Load More Posts'}
                  </button>
                )}

                {!hasMorePosts && posts.length > POSTS_PER_PAGE && (
                  <p className="text-center py-4" style={{ fontSize: 14, fontWeight: 400, color: textMuted }}>
                    End of feed
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center p-12"
                style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12, boxShadow: shadow }}>
                <Megaphone className="w-12 h-12 mx-auto" style={{ color: textMuted }} />
                <p style={{ fontSize: 16, fontWeight: 700, color: textSecondary, marginTop: 16 }}>No posts yet</p>
                <p style={{ fontSize: 14, fontWeight: 400, color: textMuted, marginTop: 4 }}>
                  Be the first to share with the team!
                </p>
              </div>
            )}
          </div>
        </main>

        {/* ═══════════════════════════════════════════════════ */}
        {/* RIGHT COLUMN — Discovery & Community (Scrollable) */}
        {/* ═══════════════════════════════════════════════════ */}
        <aside className="hidden md:flex flex-col gap-4 p-4 xl:p-5 overflow-y-auto tw-hide-scrollbar"
          style={{ height: '100%' }}>

          {/* ─── Gallery ─── */}
          <div>
            <span style={{ ...labelStyle, display: 'block', marginBottom: 8 }}>Gallery</span>
            {galleryImages.length > 0 ? (
              <div className="grid grid-cols-3 gap-1.5">
                {galleryImages.slice(0, 6).map((src, i) => (
                  <div key={i}
                    className="relative aspect-square overflow-hidden cursor-pointer"
                    style={{ borderRadius: 8, transition: 'transform 250ms' }}
                    onClick={() => setGalleryLightboxIdx(i)}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-6"
                style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12, boxShadow: shadow }}>
                <ImageIcon className="w-8 h-8 mx-auto" style={{ color: textMuted }} />
                <p style={{ fontSize: 14, fontWeight: 400, color: textMuted, marginTop: 8 }}>No photos yet</p>
              </div>
            )}
          </div>

          {/* ─── Challenges / Achievements / Leaderboard ─── */}
          <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12, boxShadow: shadow }}>
            {[
              { icon: Trophy, label: 'Challenges', count: activeChallenges.length, nav: 'challenges' },
              { icon: Award, label: 'Achievements', nav: 'achievements' },
              { icon: BarChart3, label: 'Leaderboard', nav: 'leaderboards' },
            ].map((item, i, arr) => (
              <button key={item.label} onClick={() => onNavigate?.(item.nav)}
                className="flex items-center gap-3 w-full p-3.5 transition-all text-left"
                style={{
                  borderBottom: i < arr.length - 1 ? `1px solid ${borderColor}` : 'none',
                  color: textPrimary, transition: 'all 250ms',
                }}
                onMouseEnter={e => e.currentTarget.style.background = innerBg}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <item.icon className="w-5 h-5" style={{ color: BRAND.sky }} />
                <span style={{ fontSize: 16, fontWeight: 500, flex: 1 }}>{item.label}</span>
                {item.count > 0 && (
                  <span style={{
                    fontSize: 13, fontWeight: 700, padding: '1px 8px', borderRadius: 999,
                    background: isDark ? `${BRAND.sky}20` : BRAND.ice, color: BRAND.sky,
                  }}>
                    {item.count}
                  </span>
                )}
                <ChevronRight className="w-4 h-4" style={{ color: textMuted }} />
              </button>
            ))}
          </div>

          {/* ─── Head Coach Profile Card ─── */}
          {headCoach && (
            <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12, boxShadow: shadow, transition: 'all 250ms', cursor: 'pointer' }}
              className="flex items-center gap-3 p-4"
              onMouseEnter={e => e.currentTarget.style.boxShadow = shadowElevated}
              onMouseLeave={e => e.currentTarget.style.boxShadow = shadow}>
              <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center shrink-0"
                style={{ background: BRAND.ice, color: BRAND.deepSky, fontSize: 20, fontWeight: 700 }}>
                {headCoach.avatar_url ? (
                  <img src={headCoach.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  headCoach.full_name?.charAt(0) || '?'
                )}
              </div>
              <div>
                <span style={labelStyle}>Head Coach</span>
                <p style={{ fontSize: 17, fontWeight: 700, color: textPrimary, marginTop: 2 }}>
                  {headCoach.full_name}
                </p>
                {headCoach.email && (
                  <p style={{ fontSize: 14, fontWeight: 400, color: textMuted }} className="truncate">
                    {headCoach.email}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ─── Team Roster ─── */}
          <div>
            <span style={{ ...labelStyle, display: 'block', marginBottom: 8 }}>
              Roster · {roster.length}
            </span>
            <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12, boxShadow: shadow, overflow: 'hidden' }}>
              {roster.map((player, i) => (
                <div key={player.id}
                  className="group flex items-center gap-3 px-3.5 py-2.5 cursor-pointer transition-all"
                  style={{
                    position: 'relative',
                    borderBottom: i < roster.length - 1 ? `1px solid ${borderColor}` : 'none',
                    transition: 'all 250ms',
                  }}
                  onClick={() => setActivePlayerPopup(activePlayerPopup === player.id ? null : player.id)}
                  onMouseEnter={e => e.currentTarget.style.background = innerBg}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
                    style={{ background: BRAND.ice, color: BRAND.deepSky, fontSize: 10, fontWeight: 700 }}>
                    {player.photo_url ? (
                      <img src={player.photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (player.first_name?.[0] || '') + (player.last_name?.[0] || '')
                    )}
                  </div>
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p style={{ fontSize: 15, fontWeight: 500, color: textPrimary }} className="truncate">
                      {player.first_name} {player.last_name}
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 400, color: BRAND.slate }}>
                      {player.jersey_number ? `#${player.jersey_number}` : ''}
                      {player.jersey_number && player.position ? ' · ' : ''}
                      {player.position || ''}
                    </p>
                  </div>
                  {/* Player popup */}
                  {activePlayerPopup === player.id && (
                    <div ref={playerPopupRef} style={{
                      position: 'absolute',
                      right: '100%',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      marginRight: 8,
                      background: isDark ? BRAND.charcoal : BRAND.white,
                      border: `1px solid ${isDark ? BRAND.darkBorder : BRAND.silver}`,
                      borderRadius: 12,
                      boxShadow: isDark ? '0 8px 24px rgba(0,0,0,.3)' : '0 8px 24px rgba(0,0,0,.08)',
                      padding: 12,
                      minWidth: 160,
                      zIndex: 50,
                    }}>
                      <button onClick={(e) => { e.stopPropagation(); setShowShoutoutModal(true); setActivePlayerPopup(null) }}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 10, background: BRAND.sky, color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', marginBottom: 6 }}>
                        ⭐ Give Shoutout
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedPlayer(player); setActivePlayerPopup(null) }}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 10, background: 'transparent', color: isDark ? '#B0BEC5' : BRAND.slate, fontSize: 13, fontWeight: 500, border: `1.5px solid ${isDark ? BRAND.darkBorder : BRAND.silver}`, cursor: 'pointer' }}>
                        👤 View Profile
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {roster.length === 0 && (
                <div className="p-6 text-center">
                  <Users className="w-8 h-8 mx-auto" style={{ color: textMuted }} />
                  <p style={{ fontSize: 14, fontWeight: 400, color: textMuted, marginTop: 8 }}>No players yet</p>
                </div>
              )}
            </div>
          </div>

          {/* ─── Documents ─── */}
          {documents.length > 0 && (
            <div>
              <span style={{ ...labelStyle, display: 'block', marginBottom: 8 }}>Documents</span>
              <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12, boxShadow: shadow, overflow: 'hidden' }}>
                {documents.slice(0, 3).map((doc, i) => (
                  <a key={doc.id} href={doc.file_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 transition-all"
                    style={{
                      borderBottom: i < Math.min(documents.length, 3) - 1 ? `1px solid ${borderColor}` : 'none',
                      transition: 'all 250ms',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = innerBg}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <FileText className="h-4 w-4 shrink-0" style={{ color: textMuted }} />
                    <span style={{ fontSize: 14, fontWeight: 400, color: textSecondary }} className="truncate">
                      {doc.name}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ═══ BACK-TO-TOP FAB ═══ */}
      {showBackToTop && (
        <button
          onClick={() => centerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 w-10 h-10 rounded-full flex items-center justify-center text-white"
          style={{
            background: BRAND.sky,
            boxShadow: `0 4px 16px ${BRAND.sky}40`,
            transition: 'all 250ms',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <ChevronUp className="w-5 h-5" />
        </button>
      )}

      {/* ═══ GALLERY LIGHTBOX ═══ */}
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
    </div>
  )
}

export { TeamWallPage }
