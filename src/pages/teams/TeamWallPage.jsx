import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useParentTutorial } from '../../contexts/ParentTutorialContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { PlayerCardExpanded } from '../../components/players'
import {
  ArrowLeft, ChevronUp, Camera, Megaphone
} from '../../constants/icons'
import TeamWallLeftSidebar from './TeamWallLeftSidebar'
import TeamWallRightSidebar from './TeamWallRightSidebar'
import PhotoLightbox from '../../components/common/PhotoLightbox'
import GiveShoutoutModal from '../../components/engagement/GiveShoutoutModal'
import CreateChallengeModal from '../../components/engagement/CreateChallengeModal'
import { fetchActiveChallenges } from '../../lib/challenge-service'
import FeedPost from './FeedPost'
import { HUB_STYLES, adjustBrightness } from '../../constants/hubStyles'
import NewPostModal from './NewPostModal'

// ═══════════════════════════════════════════════════════════
// @font-face — Inter Variable (replaces Tele-Grotesk)
// ═══════════════════════════════════════════════════════════
const FONT_STYLES = `
@font-face {
  font-family: 'Inter';
  src: url('/fonts/Inter-Variable.ttf') format('truetype');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Inter';
  src: url('/fonts/Inter-Variable-Italic.ttf') format('truetype');
  font-weight: 100 900;
  font-style: italic;
  font-display: swap;
}
`

const FONT_STACK = "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"

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

// ═══════════════════════════════════════════════════════════
// TEAM WALL PAGE — Instagram/Facebook-inspired 3-column layout
// ═══════════════════════════════════════════════════════════
function TeamWallPage({ teamId, showToast, onBack, onNavigate, activeView }) {
  const { profile, user, isAdmin } = useAuth()
  const { completeStep } = useParentTutorial?.() || {}
  const { isDark } = useTheme()

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
  const [shoutoutPreselect, setShoutoutPreselect] = useState(null)
  const [activeChallenges, setActiveChallenges] = useState([])
  const [shoutoutDigest, setShoutoutDigest] = useState({ recent: [], total: 0, lastShoutoutDate: null })

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

  const isAdminOrCoach = isAdmin || activeView === 'coach'
  const canPost = isAdminOrCoach || activeView === 'parent'

  const [galleryImages, setGalleryImages] = useState([])

  // ═══════════════════════════════════════════════════════════
  // DATA LOADING
  // ═══════════════════════════════════════════════════════════

  useEffect(() => {
    if (teamId) loadTeamData()
  }, [teamId])

  // Load shoutout digest after roster is available (needs player names)
  useEffect(() => {
    if (roster.length > 0 && teamId) {
      loadShoutoutDigest()
    }
  }, [roster, teamId])

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
        const { data: photoPosts } = await supabase
          .from('team_posts')
          .select('media_urls')
          .eq('team_id', teamId)
          .eq('is_published', true)
          .not('media_urls', 'is', null)
          .order('created_at', { ascending: false })
          .limit(20)
        const images = (photoPosts || [])
          .flatMap(p => Array.isArray(p.media_urls) ? p.media_urls : [])
        setGalleryImages(images)
      } catch (err) {
        console.log('Could not load gallery:', err)
      }

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
        const { data: completedGames } = await supabase
          .from('schedule_events')
          .select('game_result, our_score, opponent_score, event_date')
          .eq('team_id', teamId)
          .eq('event_type', 'game')
          .eq('game_status', 'completed')
          .order('event_date', { ascending: false })
        if (completedGames) {
          let wins = 0, losses = 0
          const recentForm = []
          completedGames.forEach((g, i) => {
            if (g.game_result === 'win') wins++
            else if (g.game_result === 'loss') losses++
            if (i < 5) recentForm.push(g.game_result || 'loss')
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

      // Try with profile join first
      let { data: postsData, error } = await supabase
        .from('team_posts')
        .select('*, profiles:author_id(id, full_name, avatar_url)')
        .eq('team_id', teamId)
        .eq('is_published', true)
        .neq('post_type', 'shoutout')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to)

      // Fallback: if join fails, fetch without profile join
      if (error) {
        console.error('Posts query error (with join):', error)
        const fallback = await supabase
          .from('team_posts')
          .select('*')
          .eq('team_id', teamId)
          .eq('is_published', true)
          .neq('post_type', 'shoutout')
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false })
          .range(from, to)
        postsData = fallback.data
        if (fallback.error) console.error('Posts fallback query error:', fallback.error)
      }

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

  async function loadShoutoutDigest() {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      // Simple query — no joins (the players:receiver_id join causes 400 errors)
      const { data: recentShoutouts, error } = await supabase
        .from('shoutouts')
        .select('id, receiver_id, category, message, created_at, giver_id')
        .eq('team_id', teamId)
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })

      if (error) {
        console.log('Shoutout digest query error:', error)
        setShoutoutDigest({ recent: [], total: 0, lastShoutoutDate: null })
        return
      }

      if (!recentShoutouts || recentShoutouts.length === 0) {
        setShoutoutDigest({ recent: [], total: 0, lastShoutoutDate: null })
        return
      }

      // Group by receiver — use the already-loaded roster state for names
      const byReceiver = new Map()
      for (const s of recentShoutouts) {
        const rid = s.receiver_id
        if (!byReceiver.has(rid)) {
          const player = roster.find(p => p.id === rid)
          byReceiver.set(rid, {
            receiverId: rid,
            name: player ? `${player.first_name} ${player.last_name}` : 'Player',
            photo: player?.photo_url || null,
            count: 0,
            categories: [],
          })
        }
        const entry = byReceiver.get(rid)
        entry.count++
        if (s.category && !entry.categories.includes(s.category)) {
          entry.categories.push(s.category)
        }
      }

      // Sort by count descending
      const ranked = Array.from(byReceiver.values()).sort((a, b) => b.count - a.count)

      setShoutoutDigest({
        recent: ranked,
        total: recentShoutouts.length,
        lastShoutoutDate: recentShoutouts[0]?.created_at || null,
      })
    } catch (err) {
      console.log('Could not load shoutout digest:', err)
      setShoutoutDigest({ recent: [], total: 0, lastShoutoutDate: null })
    }
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
        <p className="mt-4" style={{ color: textPrimary, fontSize: 16, fontWeight: 500 }}>Team not found</p>
        <button onClick={onBack} className="mt-4" style={{ color: BRAND.sky, fontSize: 16, fontWeight: 500 }}>
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
  const labelStyle = { fontSize: 16, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: BRAND.slate }

  // Theme object for sidebar components
  const th = { cardBg, innerBg, borderColor, textPrimary, textSecondary, textMuted, successColor, errorColor, warningColor, shadow, shadowElevated, labelStyle, isDark, BRAND }

  function handleShoutout(preselect) {
    setShoutoutPreselect(preselect)
    setShowShoutoutModal(true)
  }

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
            style={{ background: BRAND.ice, color: BRAND.deepSky, fontSize: 14, fontWeight: 700 }}>
            {teamInitials}
          </div>
        )}
        <h1 style={{ fontSize: 18, fontWeight: 700, color: textPrimary }}>{team.name}</h1>
      </div>

      {/* ═══ 3-COLUMN GRID ═══ */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_335px] lg:grid-cols-[335px_1fr_335px] px-4 lg:px-12" style={{ gap: 24, height: 'calc(100vh - 64px)' }}>

        {/* LEFT COLUMN */}
        <TeamWallLeftSidebar
          team={team} teamInitials={teamInitials} seasonLabel={seasonLabel}
          sportIcon={sportIcon} gameRecord={gameRecord} upcomingEvents={upcomingEvents}
          nextGame={nextGame} headCoach={headCoach} th={th}
          onBack={onBack} onNavigate={onNavigate} openTeamChat={openTeamChat}
        />

        {/* ═══════════════════════════════════════════════════ */}
        {/* CENTER COLUMN — Social Feed (Scrollable)          */}
        {/* ═══════════════════════════════════════════════════ */}
        <main ref={centerRef} onScroll={handleCenterScroll}
          className="overflow-y-auto tw-hide-scrollbar"
          style={{ height: '100%' }}>
          <div className="px-4 lg:px-6 py-5 flex flex-col gap-5">

            {/* ─── Create Post Bar ─── */}
            {canPost && (
              <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 14, boxShadow: shadow }}>
                <div className="flex items-center gap-3 p-4">
                  <div className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center overflow-hidden"
                    style={{ background: BRAND.ice, color: BRAND.deepSky, fontSize: 16, fontWeight: 700 }}>
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
                      color: textMuted, fontSize: 18, fontWeight: 500,
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

            {/* ─── Shoutout Digest Card ─── */}
            {(() => {
              const hasActivity = shoutoutDigest.total > 0

              const nudges = [
                "Who impressed you this week? \u{1F3D0}",
                "Recognize a teammate's hard work \u2B50",
                "Shoutouts boost team morale! \u{1F4AA}",
                "Be the first to give props this week \u{1F64C}",
                "Your teammates love recognition \u2764\uFE0F",
              ]
              const nudge = nudges[Math.floor(Date.now() / 86400000) % nudges.length]

              return (
                <div style={{
                  background: isDark ? 'rgba(75,185,236,.06)' : 'rgba(75,185,236,.03)',
                  border: `1px solid ${isDark ? 'rgba(75,185,236,.12)' : 'rgba(75,185,236,.08)'}`,
                  borderRadius: 14,
                  padding: '14px 18px',
                  transition: 'all 250ms',
                }}>
                  {hasActivity ? (
                    <>
                      {/* Header row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 18 }}>⭐</span>
                          <span style={{ fontSize: 16, fontWeight: 700, color: '#4BB9EC', letterSpacing: '0.05em' }}>
                            {shoutoutDigest.total} SHOUTOUT{shoutoutDigest.total !== 1 ? 'S' : ''} THIS WEEK
                          </span>
                        </div>
                        <button
                          onClick={() => { setShoutoutPreselect(null); setShowShoutoutModal(true) }}
                          style={{
                            padding: '5px 12px', borderRadius: 999, fontSize: 14, fontWeight: 600,
                            background: '#4BB9EC', color: '#fff', border: 'none', cursor: 'pointer',
                            transition: 'all 200ms',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#2A9BD4'}
                          onMouseLeave={e => e.currentTarget.style.background = '#4BB9EC'}
                        >
                          Give Shoutout
                        </button>
                      </div>

                      {/* Player summary — show top 4 max */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {shoutoutDigest.recent.slice(0, 4).map((r) => (
                          <div key={r.receiverId} style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '4px 10px 4px 4px', borderRadius: 999,
                            background: isDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.04)',
                            fontSize: 14, fontWeight: 600,
                            color: isDark ? 'rgba(255,255,255,.75)' : 'rgba(0,0,0,.7)',
                          }}>
                            <div style={{
                              width: 22, height: 22, borderRadius: '50%', overflow: 'hidden',
                              background: '#4BB9EC', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0,
                            }}>
                              {r.photo ? (
                                <img src={r.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                r.name.split(' ').map(n => n[0]).join('')
                              )}
                            </div>
                            {r.name.split(' ')[0]}
                            <span style={{ color: '#4BB9EC', fontWeight: 700 }}>({r.count})</span>
                          </div>
                        ))}
                        {shoutoutDigest.recent.length > 4 && (
                          <span style={{ fontSize: 14, fontWeight: 500, color: isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.35)' }}>
                            +{shoutoutDigest.recent.length - 4} more
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    /* Nudge state — no shoutouts in 7 days */
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 24 }}>⭐</span>
                        <div>
                          <p style={{ fontSize: 16, fontWeight: 600, color: isDark ? 'rgba(255,255,255,.7)' : 'rgba(0,0,0,.6)' }}>
                            No shoutouts this week
                          </p>
                          <p style={{ fontSize: 14, fontWeight: 400, color: isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.35)', marginTop: 2 }}>
                            {nudge}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setShoutoutPreselect(null); setShowShoutoutModal(true) }}
                        style={{
                          padding: '6px 14px', borderRadius: 999, fontSize: 14, fontWeight: 600,
                          background: '#4BB9EC', color: '#fff', border: 'none', cursor: 'pointer',
                          transition: 'all 200ms', whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#2A9BD4'}
                        onMouseLeave={e => e.currentTarget.style.background = '#4BB9EC'}
                      >
                        Be the first ⭐
                      </button>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* ─── Post Feed ─── */}
            {(() => {
              return posts.length > 0 ? (
              <div className="flex flex-col" style={{ gap: '17px' }}>
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
                      borderRadius: 14, background: cardBg, border: `1px solid ${borderColor}`,
                      color: textSecondary, fontSize: 18, fontWeight: 500, transition: 'all 250ms',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                    {loadingMorePosts ? 'Loading...' : 'Load More Posts'}
                  </button>
                )}

                {!hasMorePosts && posts.length > POSTS_PER_PAGE && (
                  <p className="text-center py-4" style={{ fontSize: 16, fontWeight: 500, color: textMuted }}>
                    End of feed
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center p-12"
                style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 14, boxShadow: shadow }}>
                <Megaphone className="w-12 h-12 mx-auto" style={{ color: textMuted }} />
                <p style={{ fontSize: 18, fontWeight: 700, color: textSecondary, marginTop: 16 }}>No posts yet</p>
                <p style={{ fontSize: 16, fontWeight: 500, color: textMuted, marginTop: 4 }}>
                  Be the first to share with the team!
                </p>
              </div>
            )
            })()}
          </div>
        </main>

        {/* RIGHT COLUMN */}
        <TeamWallRightSidebar
          roster={roster} headCoach={headCoach} galleryImages={galleryImages}
          documents={documents} activeChallenges={activeChallenges}
          th={th} onNavigate={onNavigate}
          onGalleryClick={(i) => setGalleryLightboxIdx(i)}
          onSelectPlayer={setSelectedPlayer}
          onShoutout={handleShoutout}
        />
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
      {galleryLightboxIdx !== null && createPortal(
        <PhotoLightbox
          photos={galleryImages}
          initialIndex={galleryLightboxIdx}
          onClose={() => setGalleryLightboxIdx(null)}
        />,
        document.body
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
          onBack={() => setSelectedPlayer(null)}
          context="roster"
          viewerRole={activeView === 'parent' ? 'parent' : activeView === 'coach' ? 'coach' : 'admin'}
          seasonId={team?.season_id}
          sport={team?.seasons?.sports?.name?.toLowerCase() || ''}
          isOwnChild={false}
        />
      )}

      {/* ═══ ENGAGEMENT MODALS ═══ */}
      <GiveShoutoutModal
        visible={showShoutoutModal}
        teamId={teamId}
        preselectedRecipient={shoutoutPreselect}
        onClose={() => { setShowShoutoutModal(false); setShoutoutPreselect(null) }}
        onSuccess={() => { loadPosts(1, true); loadShoutoutDigest(); showToast?.('Shoutout sent!', 'success'); setShoutoutPreselect(null) }}
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
