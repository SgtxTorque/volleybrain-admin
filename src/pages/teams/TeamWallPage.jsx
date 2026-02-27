import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { PlayerCardExpanded } from '../../components/players'
import {
  ArrowLeft, Calendar, MapPin, Clock, Users, MessageCircle,
  FileText, Plus, Send, X, ChevronRight, Star, Check,
  BarChart3, Camera, Edit, Flag, Megaphone, Trash2, Trophy, UserCog,
  Share2, MoreVertical, Download, Maximize2, Upload
} from '../../constants/icons'
import { CommentSection } from '../../components/teams/CommentSection'
import { ReactionBar } from '../../components/teams/ReactionBar'
import { PhotoGallery, Lightbox } from '../../components/teams/PhotoGallery'
import GiveShoutoutModal from '../../components/engagement/GiveShoutoutModal'
import ChallengeCard, { parseChallengeMetadata } from '../../components/engagement/ChallengeCard'
import CreateChallengeModal from '../../components/engagement/CreateChallengeModal'
import ChallengeDetailModal from '../../components/engagement/ChallengeDetailModal'
import { fetchActiveChallenges, optInToChallenge } from '../../lib/challenge-service'
import FeedPost from './FeedPost'
import NewPostModal from './NewPostModal'

// ═══════════════════════════════════════════════════════════
// HELPERS (preserved exactly)
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

const EMOJIS = ['🏐', '🔥', '💪', '🏆', '⭐', '❤️', '💯', '🐝', '👍']

// ═══════════════════════════════════════════════════════════
// STYLES — Dramatic visual overhaul
// ═══════════════════════════════════════════════════════════
const HUB_STYLES = `
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes scaleIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
  @keyframes cardIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes vsFlash{0%,80%,100%{opacity:.85}90%{opacity:1;text-shadow:0 0 30px rgba(239,68,68,.5)}}
  @keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
  @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
  @keyframes slideIn{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}
  @keyframes shimmer{from{left:-100%}to{left:200%}}
  @keyframes glowPulse{0%,100%{box-shadow:0 0 8px rgba(255,255,255,.04)}50%{box-shadow:0 0 20px rgba(255,255,255,.08)}}
  @keyframes borderPulse{0%,100%{border-color:rgba(255,255,255,.08)}50%{border-color:rgba(255,255,255,.18)}}
  @keyframes cheerPop{0%{transform:translateY(0) scale(1);opacity:1}50%{transform:translateY(-40px) scale(1.4);opacity:.8}100%{transform:translateY(-80px) scale(.6);opacity:0}}
  @keyframes livePulse{0%{box-shadow:0 0 0 0 rgba(16,185,129,.4)}70%{box-shadow:0 0 0 10px rgba(16,185,129,0)}100%{box-shadow:0 0 0 0 rgba(16,185,129,0)}}
  @keyframes storyRing{0%,100%{border-color:var(--ring-c1,#6366f1)}50%{border-color:var(--ring-c2,#ef4444)}}

  .tw-au{animation:fadeUp .5s ease-out both}
  .tw-ai{animation:fadeIn .4s ease-out both}
  .tw-as{animation:scaleIn .3s ease-out both}
  .tw-ac{animation:cardIn .5s ease-out both}
  .cheer-pop{animation:cheerPop .8s cubic-bezier(.17,.67,.83,.67) forwards}
  .live-pulse{animation:livePulse 2s infinite}

  /* ── Glass Cards ── */
  .tw-glass{
    background:rgba(255,255,255,.03);
    backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
    border:1px solid rgba(255,255,255,.08);
    border-radius:24px;
    transition:all .3s cubic-bezier(.4,0,.2,1);
    box-shadow:0 8px 32px rgba(0,0,0,.12)
  }
  .tw-glass:hover{border-color:rgba(255,255,255,.15);transform:translateY(-2px);box-shadow:0 16px 48px rgba(0,0,0,.2)}

  .tw-glass-glow{
    background:linear-gradient(165deg,rgba(255,255,255,.04) 0%,rgba(255,255,255,.025) 40%,rgba(10,10,15,.9) 100%);
    backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
    border:1px solid rgba(255,255,255,.1);
    border-radius:24px;
    box-shadow:0 8px 32px rgba(0,0,0,.1),0 0 0 1px rgba(255,255,255,.03);
    transition:all .3s cubic-bezier(.4,0,.2,1)
  }
  .tw-glass-glow:hover{border-color:rgba(255,255,255,.18);box-shadow:0 16px 48px rgba(0,0,0,.18),0 0 20px rgba(255,255,255,.04)}

  .tw-nos::-webkit-scrollbar{display:none}.tw-nos{-ms-overflow-style:none;scrollbar-width:none}
  .tw-clift{transition:transform .2s}.tw-clift:hover{transform:translateY(-2px)}

  .tw-auto-accent{border-left:3px solid rgba(99,102,241,.3);background:linear-gradient(90deg,rgba(99,102,241,.04),transparent 30%)}
  .tw-badge-accent{border-left:3px solid rgba(168,85,247,.4);background:linear-gradient(90deg,rgba(168,85,247,.04),transparent 30%)}
  .tw-reminder-accent{border-left:3px solid rgba(56,189,248,.4);background:linear-gradient(90deg,rgba(56,189,248,.04),transparent 30%)}

  /* ── Light Mode ── */
  .tw-light .tw-glass{
    background:rgba(255,255,255,.72);
    border-color:rgba(0,0,0,.06);
    box-shadow:0 4px 24px rgba(0,0,0,.07),0 0 0 1px rgba(0,0,0,.02)
  }
  .tw-light .tw-glass:hover{border-color:rgba(0,0,0,.12);box-shadow:0 16px 48px rgba(0,0,0,.1)}
  .tw-light .tw-glass-glow{
    background:linear-gradient(165deg,rgba(99,102,241,.04) 0%,rgba(255,255,255,.88) 40%,rgba(255,255,255,.95) 100%);
    border-color:rgba(0,0,0,.08);
    box-shadow:0 4px 24px rgba(0,0,0,.06)
  }
  .tw-light .tw-glass-glow:hover{box-shadow:0 16px 48px rgba(0,0,0,.1)}
`

// ═══════════════════════════════════════════════════════════
// TEAM WALL PAGE
// ═══════════════════════════════════════════════════════════
function TeamWallPage({ teamId, showToast, onBack, onNavigate }) {
  const { profile, user } = useAuth()
  const tc = useThemeClasses()
  const { isDark } = useTheme()

  // ── Core data (preserved exactly) ──
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
  const [tickerText, setTickerText] = useState('')
  const [editingTicker, setEditingTicker] = useState(false)
  const [tickerOverflows, setTickerOverflows] = useState(false)
  const tickerRef = useRef(null)
  const [showAllRoster, setShowAllRoster] = useState(false)

  // Engagement state
  const [showShoutoutModal, setShowShoutoutModal] = useState(false)
  const [showCreateChallengeModal, setShowCreateChallengeModal] = useState(false)
  const [showChallengeDetailModal, setShowChallengeDetailModal] = useState(false)
  const [selectedChallengeId, setSelectedChallengeId] = useState(null)
  const [activeChallenges, setActiveChallenges] = useState([])

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

  useEffect(() => {
    const i = setInterval(() => setBannerSlide(p => (p + 1) % bannerSlides.length), 7000)
    return () => clearInterval(i)
  }, [bannerSlides.length])

  useEffect(() => {
    if (team?.motto) setTickerText(`🐝 "${team.motto}"`)
    else if (team?.name) setTickerText(`🐝 Welcome to ${team.name}!`)
  }, [team])

  useEffect(() => {
    if (tickerRef.current) {
      setTickerOverflows(tickerRef.current.scrollWidth > tickerRef.current.clientWidth)
    }
  }, [tickerText])

  // ═══════════════════════════════════════════════════════════
  // DATA LOADING — Preserved exactly from original
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

  const isAdminOrCoach = profile?.role === 'admin' || profile?.role === 'coach'

  // ═══════════════════════════════════════════════════════════
  // LOADING / ERROR STATES (preserved)
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

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <div className={`min-h-screen pb-24 ${!isDark ? 'tw-light' : ''}`}>
      <style>{HUB_STYLES}</style>

      {/* ═══════════════════════════════════════════════════════
          HYPE PROFILE HEADER — Glass card with banner inside
      ═══════════════════════════════════════════════════════ */}
      <div className="tw-glass overflow-hidden mb-8 tw-au" style={{ borderRadius: 32 }}>
        {/* Banner Carousel */}
        <div className="relative" style={{ height: 280 }}>
          {bannerSlides.map((slide, idx) => (
            <div key={slide.id} className="absolute inset-0 transition-opacity duration-700"
              style={{ opacity: bannerSlide === idx ? 1 : 0, zIndex: bannerSlide === idx ? 1 : 0 }}>
              {slide.type === 'photo' && <PhotoBanner team={team} g={g} teamInitials={teamInitials}
                canEdit={profile?.role === 'admin' || profile?.role === 'coach'}
                showToast={showToast}
                onBannerUpdate={(url) => setTeam(prev => ({ ...prev, banner_url: url }))} />}
              {slide.type === 'next_game' && <NextGameBanner team={team} nextGame={nextGame} cd={cd} g={g} teamInitials={teamInitials} />}
              {slide.type === 'season_stats' && <SeasonPulseBanner team={team} roster={roster} coaches={coaches} g={g} sportIcon={sportIcon} />}
            </div>
          ))}

          {/* Back button */}
          <button onClick={onBack}
            className="absolute top-5 left-5 z-20 w-11 h-11 rounded-2xl flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all"
            style={{ background: 'rgba(0,0,0,.35)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,.1)' }}>
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Banner dots */}
          <div className="absolute bottom-4 right-6 z-20 flex gap-2">
            {bannerSlides.map((_, i) => (
              <button key={i} onClick={() => setBannerSlide(i)} className="transition-all rounded-full" style={{
                width: bannerSlide === i ? 24 : 8, height: 8,
                background: bannerSlide === i ? g : 'rgba(255,255,255,.25)',
                boxShadow: bannerSlide === i ? `0 0 12px ${g}50` : 'none',
              }} />
            ))}
          </div>

          {/* Edit button */}
          {(profile?.role === 'admin' || profile?.role === 'coach') && (
            <button onClick={() => setShowBannerEdit(!showBannerEdit)}
              className="absolute top-5 right-5 z-20 w-10 h-10 rounded-2xl flex items-center justify-center text-white/40 hover:text-white/80 hover:scale-105 transition-all"
              style={{ background: 'rgba(0,0,0,.35)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,.1)' }}>
              ⚙️
            </button>
          )}

          {showBannerEdit && (
            <div className="absolute top-[68px] right-5 z-30 p-5 shadow-2xl tw-as"
              style={{ background: isDark ? 'rgba(15,23,42,.95)' : 'rgba(255,255,255,.95)', border: isDark ? '1px solid rgba(255,255,255,.1)' : '1px solid rgba(0,0,0,.08)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', width: 280, borderRadius: 20 }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-4" style={{ color: `${g}88` }}>BANNER SETTINGS</p>
              {bannerSlides.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between py-2.5" style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,.04)' : '1px solid rgba(0,0,0,.06)' }}>
                  <span className="text-xs" style={{ color: isDark ? 'rgba(255,255,255,.6)' : 'rgba(0,0,0,.5)' }}>Slide {i + 1}: {s.label}</span>
                  <button className="text-[9px] px-2.5 py-1 rounded-lg transition" style={{ background: isDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.04)', color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)' }}>Edit</button>
                </div>
              ))}
              <button className="mt-4 w-full py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider text-center transition"
                style={{ border: isDark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(0,0,0,.08)', color: `${g}88` }}>
                + ADD SLIDE
              </button>
            </div>
          )}

          {/* Gradient fade into card body */}
          <div className="absolute bottom-0 left-0 right-0 h-32 z-10"
            style={{ background: isDark ? 'linear-gradient(transparent, rgba(15,23,42,.98))' : 'linear-gradient(transparent, rgba(255,255,255,.95))' }} />
        </div>

        {/* ═══ TEAM IDENTITY — Inside the hype card ═══ */}
        <div className="relative z-20 px-8 md:px-10 -mt-20 pb-8">
          <div className="flex items-end gap-6">
            {/* Team logo — large with gradient ring */}
            <div className="relative flex-shrink-0">
              <div className="p-1 rounded-3xl" style={{ background: `linear-gradient(135deg, ${g}, ${dim})` }}>
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-[22px] flex items-center justify-center overflow-hidden"
                  style={{ background: isDark ? 'rgb(15,23,42)' : '#fff', boxShadow: '0 8px 32px rgba(0,0,0,.3)' }}>
                  {team.logo_url ? (
                    <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl md:text-6xl font-extrabold tracking-tight" style={{ color: g }}>{teamInitials}</span>
                  )}
                </div>
              </div>
              {(profile?.role === 'admin' || profile?.role === 'coach') && (
                <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-lg"
                  style={{ background: isDark ? 'rgb(15,23,42)' : '#fff', border: `2px solid ${g}50`, color: g }}>
                  📷
                </button>
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 pb-2">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-none tracking-tight">
                {(team.name || '').split(' ').map((word, i, arr) => (
                  <span key={i}>
                    {i < arr.length - 1 ? (
                      <span style={{ color: isDark ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.3)' }}>{word} </span>
                    ) : (
                      <span style={{ color: g }}>{word}</span>
                    )}
                  </span>
                ))}
              </h1>
              <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
                  style={{ background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)', color: isDark ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.4)' }}>
                  {sportIcon} {seasonLabel}
                </span>
                <span className="flex items-center gap-2 text-xs font-bold" style={{ color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.25)' }}>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 live-pulse" /> ACTIVE
                </span>
              </div>
            </div>
          </div>

          {/* ═══ STAT COLUMNS + HUDDLE BUTTON ═══ */}
          <div className="flex items-center justify-between mt-6 pt-6" style={{ borderTop: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.06)' }}>
            <div className="flex gap-8 md:gap-12">
              {[
                { l: 'PLAYERS', v: roster.length },
                { l: 'COACHES', v: coaches.length, c: g },
                { l: 'EVENTS', v: upcomingEvents.length, c: '#38BDF8' },
                { l: 'POSTS', v: posts.length, c: '#A78BFA' },
              ].map(s => (
                <div key={s.l} className="text-center cursor-default">
                  <p className="text-2xl md:text-3xl font-extrabold tracking-tight leading-none" style={{ color: s.c || (isDark ? 'white' : '#1a1a1a') }}>{s.v}</p>
                  <p className="text-[8px] font-bold uppercase tracking-wider mt-1" style={{ color: isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.2)' }}>{s.l}</p>
                </div>
              ))}
            </div>
            <button onClick={openTeamChat}
              className="flex items-center gap-3 px-6 py-3.5 rounded-2xl text-white font-bold text-sm shadow-lg hover:scale-105 active:scale-95 transition-all"
              style={{ background: `linear-gradient(135deg, ${g}, ${dim})`, boxShadow: `0 4px 20px ${g}40` }}>
              <MessageCircle className="w-5 h-5" /> JOIN HUDDLE
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          INSTAGRAM-STYLE HIGHLIGHT CIRCLES
      ═══════════════════════════════════════════════════════ */}
      <div className="flex gap-5 overflow-x-auto tw-nos pb-5 mb-4 px-1">
        {[
          { label: 'Highlights', icon: '🔥', active: true },
          { label: 'Tourney', icon: '🏆' },
          { label: 'Practice', icon: '👟' },
          { label: 'Milestones', icon: '⭐' },
          { label: 'Legacy', icon: '📜' },
        ].map((h, i) => (
          <div key={h.label} className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group tw-au" style={{ animationDelay: `${i * .06}s` }}>
            <div className="w-[76px] h-[76px] md:w-[84px] md:h-[84px] rounded-full p-[3px] transition-transform group-hover:scale-110"
              style={{
                background: h.active
                  ? `linear-gradient(135deg, ${g}, #ef4444, ${g})`
                  : (isDark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.1)'),
              }}>
              <div className="w-full h-full rounded-full flex items-center justify-center text-2xl md:text-3xl"
                style={{
                  background: isDark ? 'rgb(15,23,42)' : '#fff',
                  border: isDark ? '3px solid rgb(15,23,42)' : '3px solid #fff',
                }}>
                {h.icon}
              </div>
            </div>
            <span className="text-[9px] font-semibold uppercase tracking-wide uppercase transition"
              style={{ color: h.active ? g : (isDark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.3)') }}>
              {h.label}
            </span>
          </div>
        ))}
      </div>

      {/* ═══ TICKER ═══ */}
      <div className="mb-6">
        <div className="rounded-2xl overflow-hidden relative"
          style={{
            background: isDark ? `${g}08` : 'rgba(255,255,255,.6)',
            border: `1px solid ${isDark ? g + '1a' : g + '20'}`,
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,.03)',
          }}>
          {editingTicker ? (
            <div className="flex items-center gap-2 p-3">
              <input type="text" maxLength={150} value={tickerText} onChange={e => setTickerText(e.target.value)}
                className="flex-1 bg-transparent text-sm px-3 py-1.5 outline-none" style={{ color: isDark ? 'white' : '#333' }}
                placeholder="Team message (150 chars max)" autoFocus />
              <span className="text-[10px] font-mono mr-2" style={{ color: isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.2)' }}>{tickerText.length}/150</span>
              <button onClick={() => setEditingTicker(false)} className="px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition"
                style={{ background: g, color: '#0f172a' }}>SAVE</button>
            </div>
          ) : (
            <div className="flex items-center h-11 px-5 overflow-hidden">
              <div ref={tickerRef} className="whitespace-nowrap text-sm font-medium" style={{ color: `${g}cc` }}>
                {tickerOverflows ? (
                  <div style={{ animation: 'marquee 20s linear infinite', display: 'inline-block' }}>
                    <span className="mr-16">{tickerText}</span><span className="mr-16">{tickerText}</span>
                  </div>
                ) : (
                  <span>{tickerText}</span>
                )}
              </div>
              {(profile?.role === 'admin' || profile?.role === 'coach') && (
                <button onClick={() => setEditingTicker(true)} className="ml-auto flex-shrink-0 pl-4 text-sm transition"
                  style={{ color: isDark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.2)' }}>✏️</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══ QUICK ACTIONS ═══ */}
      <div className="mb-6 tw-au" style={{ animationDelay: '.1s' }}>
        <div className="flex gap-2.5 overflow-x-auto tw-nos pb-1">
          {[
            (profile?.role === 'admin' || profile?.role === 'coach' || profile?.role === 'parent') && { icon: '✏️', label: 'New Post', action: () => setShowNewPostModal(true), primary: true },
            { icon: '⭐', label: 'Shoutout', action: () => setShowShoutoutModal(true), primary: false },
            (profile?.role === 'admin' || profile?.role === 'coach') && { icon: '🏆', label: 'Challenge', action: () => setShowCreateChallengeModal(true), primary: false },
            { icon: '💬', label: 'Team Chat', action: openTeamChat, primary: false },
            { icon: '📅', label: 'Schedule', action: () => setActiveTab('schedule'), primary: false },
            { icon: '📋', label: 'Roster', action: () => setActiveTab('roster'), primary: false },
            { icon: '📄', label: 'Docs', action: () => setActiveTab('documents'), primary: false },
          ].filter(Boolean).map((a) => (
            <button key={a.label} onClick={a.action}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl text-[11px] font-bold font-bold uppercase tracking-wider transition whitespace-nowrap tw-clift"
              style={a.primary ? {
                background: `linear-gradient(135deg, ${g}, ${dim})`, color: '#0f172a',
                boxShadow: `0 4px 20px ${g}30`,
              } : {
                background: isDark ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.7)',
                backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                border: isDark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(0,0,0,.06)',
                color: isDark ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.5)',
                boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,.04)'
              }}>
              <span className="text-base">{a.icon}</span> {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ TAB NAVIGATION — Pill style ═══ */}
      <div className="mb-8">
        <div className="flex gap-1 rounded-2xl p-1.5" style={{ background: isDark ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.03)' }}>
          {[
            { key: 'feed', icon: '📰', label: 'Feed' },
            { key: 'challenges', icon: '🏆', label: 'Challenges' },
            { key: 'gallery', icon: '📷', label: 'Gallery' },
            { key: 'roster', icon: '👥', label: 'Roster' },
            { key: 'schedule', icon: '📅', label: 'Schedule' },
            { key: 'documents', icon: '📄', label: 'Documents' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex-1 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all rounded-xl"
              style={activeTab === tab.key ? {
                background: isDark ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.9)',
                color: g,
                boxShadow: isDark ? '0 2px 8px rgba(0,0,0,.2)' : '0 2px 8px rgba(0,0,0,.06)',
              } : {
                color: isDark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.3)',
              }}>
              {tab.icon} {tab.label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <main>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT: Tab Content */}
          <div className="lg:col-span-8 space-y-6">

            {/* FEED */}
            {activeTab === 'feed' && (
              <>
                <SectionHeader icon="📰" title="TEAM" accent="FEED" g={g} isDark={isDark} />
                {posts.length > 0 ? (
                  <div className="space-y-6">
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
                        className="w-full py-4 rounded-2xl text-[11px] font-bold uppercase tracking-wider transition"
                        style={{
                          background: isDark ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.02)',
                          border: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.06)',
                          color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.4)',
                        }}>
                        {loadingMorePosts ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: g, borderTopColor: 'transparent' }} />
                            LOADING...
                          </span>
                        ) : 'LOAD MORE POSTS'}
                      </button>
                    )}
                    {!hasMorePosts && posts.length > POSTS_PER_PAGE && (
                      <p className="text-center text-[10px] font-bold uppercase tracking-widest py-6" style={{ color: isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.1)' }}>— END OF FEED —</p>
                    )}
                  </div>
                ) : (
                  <div className="tw-glass p-12 text-center">
                    <Megaphone className="w-14 h-14 mx-auto" style={{ color: isDark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.12)' }} />
                    <p className="mt-5 text-lg font-semibold" style={{ color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.3)' }}>No posts yet</p>
                    <p className="text-sm mt-1" style={{ color: isDark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.2)' }}>Check back later for team updates!</p>
                  </div>
                )}
              </>
            )}

            {/* CHALLENGES */}
            {activeTab === 'challenges' && (
              <>
                <SectionHeader icon="🏆" title="ACTIVE" accent="CHALLENGES" g={g} isDark={isDark} />
                {isAdminOrCoach && (
                  <button
                    onClick={() => setShowCreateChallengeModal(true)}
                    className="mb-4 flex items-center gap-2 px-5 py-3 rounded-2xl text-[11px] font-bold font-bold uppercase tracking-wider"
                    style={{ background: `linear-gradient(135deg, ${g}, ${dim})`, color: '#0f172a' }}
                  >
                    <Trophy className="w-4 h-4" /> CREATE CHALLENGE
                  </button>
                )}
                {activeChallenges.length > 0 ? (
                  <div className="space-y-4">
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
                  <div className="tw-glass p-12 text-center">
                    <Trophy className="w-14 h-14 mx-auto" style={{ color: isDark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.12)' }} />
                    <p className="mt-5 text-lg font-semibold" style={{ color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.3)' }}>No active challenges</p>
                    <p className="text-sm mt-1" style={{ color: isDark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.2)' }}>
                      {isAdminOrCoach ? 'Create a challenge to motivate your team!' : 'Check back later for team challenges!'}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* GALLERY */}
            {activeTab === 'gallery' && (
              <>
                <SectionHeader icon="📷" title="PHOTO" accent="GALLERY" g={g} isDark={isDark} />
                <PhotoGallery teamId={teamId} isDark={isDark} g={g} />
              </>
            )}

            {/* ROSTER */}
            {activeTab === 'roster' && (
              <>
                <SectionHeader icon="👥" title="TEAM" accent="ROSTER" g={g} isDark={isDark} />
                <div className="tw-glass overflow-hidden">
                  <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.06)' }}>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)' }}>
                      {sportIcon} ROSTER ({roster.length})
                    </span>
                  </div>
                  <div className="divide-y" style={{ borderColor: isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)' }}>
                    {roster.map(player => (
                      <div key={player.id} onClick={() => setSelectedPlayer(player)}
                        className="p-5 flex items-center gap-4 cursor-pointer transition-all"
                        onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        {player.photo_url ? (
                          <img src={player.photo_url} alt="" className="w-14 h-14 rounded-2xl object-cover shadow-md" />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-extrabold"
                            style={{ background: `${g}12`, color: g, border: `1px solid ${g}20` }}>
                            {player.first_name?.[0]}{player.last_name?.[0]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[15px]" style={{ color: isDark ? 'white' : '#1a1a1a' }}>
                            {player.first_name} {player.last_name}
                          </p>
                          <p className="text-sm" style={{ color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)' }}>
                            {player.jersey_number && `#${player.jersey_number} · `}{player.position || 'Player'}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5" style={{ color: isDark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.2)' }} />
                      </div>
                    ))}
                    {roster.length === 0 && (
                      <div className="p-10 text-center">
                        <Users className="w-14 h-14 mx-auto" style={{ color: isDark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.12)' }} />
                        <p className="mt-4" style={{ color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)' }}>No players on roster yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* SCHEDULE */}
            {activeTab === 'schedule' && (
              <>
                <SectionHeader icon="📅" title="UPCOMING" accent="EVENTS" g={g} isDark={isDark} />
                <div className="tw-glass overflow-hidden">
                  <div className="divide-y" style={{ borderColor: isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)' }}>
                    {upcomingEvents.map(event => {
                      const eventDate = new Date(event.event_date)
                      const isGame = event.event_type === 'game'
                      return (
                        <div key={event.id} onClick={() => setShowEventDetail(event)}
                          className="p-5 flex items-center gap-5 cursor-pointer transition-all"
                          onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.02)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <div className="text-center min-w-[48px]">
                            <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: isGame ? g : '#38BDF8' }}>
                              {eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                            </p>
                            <p className="text-3xl font-extrabold tracking-tight leading-none" style={{ color: isDark ? 'white' : '#1a1a1a' }}>
                              {eventDate.getDate()}
                            </p>
                          </div>
                          <div className="w-px h-10" style={{ background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)' }} />
                          <div className="flex-1">
                            <span className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider font-medium"
                              style={{ background: isGame ? `${g}15` : 'rgba(56,189,248,.1)', color: isGame ? g : '#38BDF8' }}>
                              {isGame ? '🏐 GAME' : '🏋️ PRACTICE'}
                            </span>
                            <p className="font-bold mt-1.5 text-[15px]" style={{ color: isDark ? 'white' : '#1a1a1a' }}>
                              {event.title || event.event_type}{event.opponent && ` vs ${event.opponent}`}
                            </p>
                            <p className="text-sm" style={{ color: isDark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.3)' }}>
                              {event.event_time && formatTime12(event.event_time)}
                              {event.venues?.name && ` · ${event.venues.name}`}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5" style={{ color: isDark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.2)' }} />
                        </div>
                      )
                    })}
                    {upcomingEvents.length === 0 && (
                      <div className="p-10 text-center">
                        <Calendar className="w-14 h-14 mx-auto" style={{ color: isDark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.12)' }} />
                        <p className="mt-4" style={{ color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)' }}>No upcoming events</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* DOCUMENTS */}
            {activeTab === 'documents' && (
              <>
                <SectionHeader icon="📄" title="TEAM" accent="DOCUMENTS" g={g} isDark={isDark} />
                <div className="tw-glass overflow-hidden">
                  <div className="divide-y" style={{ borderColor: isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)' }}>
                    {documents.map(doc => (
                      <a key={doc.id} href={doc.file_url} target="_blank" rel="noopener noreferrer"
                        className="p-5 flex items-center gap-4 transition-all block"
                        onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(56,189,248,.1)' }}>
                          <FileText className="w-6 h-6" style={{ color: '#38BDF8' }} />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-[15px]" style={{ color: isDark ? 'white' : '#1a1a1a' }}>{doc.name}</p>
                          <p className="text-sm" style={{ color: isDark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.3)' }}>
                            {doc.category} · {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5" style={{ color: isDark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.2)' }} />
                      </a>
                    ))}
                    {documents.length === 0 && (
                      <div className="p-10 text-center">
                        <FileText className="w-14 h-14 mx-auto" style={{ color: isDark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.12)' }} />
                        <p className="mt-4" style={{ color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)' }}>No documents uploaded</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* RIGHT: Sidebar */}
          <aside className="lg:col-span-4 space-y-6">

            {/* UPCOMING EVENTS */}
            <div className="tw-glass-glow overflow-hidden tw-au" style={{ animationDelay: '.15s' }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${g}15` }}>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: `${g}80` }}>📅 UPCOMING</span>
                <button onClick={() => setActiveTab('schedule')} className="text-[9px] font-bold uppercase tracking-wider transition"
                  style={{ color: isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.25)' }}>VIEW ALL →</button>
              </div>
              <div className="p-4 space-y-1.5">
                {upcomingEvents.slice(0, 3).map(event => {
                  const ed = new Date(event.event_date)
                  const isGame = event.event_type === 'game'
                  return (
                    <div key={event.id} className="flex items-center gap-3 p-2.5 rounded-xl transition cursor-pointer"
                      onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div className="text-center min-w-[36px]">
                        <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: isGame ? g : '#38BDF8' }}>
                          {ed.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                        </p>
                        <p className="text-xl font-extrabold tracking-tight leading-none" style={{ color: isDark ? 'white' : '#1a1a1a' }}>{ed.getDate()}</p>
                      </div>
                      <div className="w-px h-6" style={{ background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)' }} />
                      <div>
                        <p className="text-[12px] font-bold" style={{ color: isDark ? 'white' : '#1a1a1a' }}>
                          {event.title || event.event_type}{event.opponent && ` vs ${event.opponent}`}
                        </p>
                        <p className="text-[10px]" style={{ color: isDark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.25)' }}>
                          {event.event_time && formatTime12(event.event_time)}
                        </p>
                      </div>
                    </div>
                  )
                })}
                {upcomingEvents.length === 0 && (
                  <p className="text-center py-6 text-[11px]" style={{ color: isDark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.2)' }}>No upcoming events</p>
                )}
              </div>
            </div>

            {/* ROSTER PREVIEW */}
            <div className="tw-glass overflow-hidden tw-au" style={{ animationDelay: '.2s' }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.06)' }}>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)' }}>
                  🏐 ROSTER ({roster.length})
                </span>
                <button onClick={() => { setActiveTab('roster'); setShowAllRoster(!showAllRoster) }}
                  className="text-[9px] font-bold uppercase tracking-wider transition"
                  style={{ color: isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.25)' }}>VIEW ALL →</button>
              </div>
              <div className="p-3 space-y-1">
                {roster.slice(0, 5).map(p => (
                  <button key={p.id} onClick={() => setSelectedPlayer(p)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-left"
                    onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-extrabold flex-shrink-0"
                      style={{ background: `${g}12`, color: g, border: `1px solid ${g}18` }}>
                      {p.first_name?.[0]}{p.last_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold truncate" style={{ color: isDark ? 'white' : '#1a1a1a' }}>{p.first_name} {p.last_name}</p>
                      <p className="text-[10px]" style={{ color: isDark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.25)' }}>
                        {p.jersey_number && `#${p.jersey_number} · `}{p.position || 'Player'}
                      </p>
                    </div>
                  </button>
                ))}
                {roster.length === 0 && (
                  <p className="text-center py-6 text-[11px]" style={{ color: isDark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.2)' }}>No players yet</p>
                )}
              </div>
            </div>

            {/* COACHES */}
            <div className="tw-glass overflow-hidden tw-au" style={{ animationDelay: '.25s' }}>
              <div className="px-5 py-4" style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.06)' }}>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)' }}>🎓 COACHES</span>
              </div>
              <div className="p-4 space-y-2">
                {coaches.map(coach => (
                  <div key={coach.id} className="flex items-center gap-3.5 p-2.5 rounded-xl">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-extrabold"
                      style={{ background: `${g}15`, color: g }}>
                      {coach.full_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-[12px] font-bold" style={{ color: isDark ? 'white' : '#1a1a1a' }}>{coach.full_name}</p>
                      <p className="text-[10px]" style={{ color: isDark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.25)' }}>
                        {coach.role === 'head' ? 'Head Coach' : coach.role === 'assistant' ? 'Assistant Coach' : 'Coach'}
                      </p>
                    </div>
                  </div>
                ))}
                {coaches.length === 0 && (
                  <p className="text-center py-6 text-[11px]" style={{ color: isDark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.2)' }}>No coaches assigned</p>
                )}
              </div>
            </div>

            {/* QUICK STATS */}
            <div className="tw-glass overflow-hidden tw-au" style={{ animationDelay: '.3s' }}>
              <div className="px-5 py-4" style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.06)' }}>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)' }}>📊 QUICK STATS</span>
              </div>
              <div className="grid grid-cols-2 gap-3 p-4">
                {[
                  { v: roster.length, l: 'Players', c: '#38BDF8' },
                  { v: coaches.length, l: 'Coaches', c: g },
                  { v: upcomingEvents.length, l: 'Upcoming', c: '#4ADE80' },
                  { v: posts.length, l: 'Posts', c: '#A78BFA' },
                ].map(s => (
                  <div key={s.l} className="text-center py-3.5 rounded-2xl" style={{ background: `${s.c}0a`, border: `1px solid ${s.c}18` }}>
                    <p className="text-2xl font-extrabold tracking-tight" style={{ color: s.c }}>{s.v}</p>
                    <p className="text-[8px] font-bold uppercase tracking-wider mt-0.5" style={{ color: isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.25)' }}>{s.l.toUpperCase()}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* INVITE */}
            <div className="tw-glass-glow p-6 text-center tw-au" style={{ animationDelay: '.35s' }}>
              <p className="text-4xl mb-3">📨</p>
              <p className="text-sm font-bold mb-1" style={{ color: isDark ? 'white' : '#1a1a1a' }}>Invite to {team.name}</p>
              <p className="text-[11px] mb-4" style={{ color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.3)' }}>Share a registration link with friends and family</p>
              <button className="w-full py-3 rounded-2xl text-[11px] font-bold font-bold uppercase tracking-wider transition hover:brightness-110"
                style={{ background: `linear-gradient(135deg, ${g}, ${dim})`, color: '#0f172a', boxShadow: `0 4px 16px ${g}30` }}>
                COPY INVITE LINK
              </button>
            </div>
          </aside>
        </div>
      </main>

      {/* ═══ FAB ═══ */}
      {(profile?.role === 'admin' || profile?.role === 'coach' || profile?.role === 'parent') && (
        <button onClick={() => setShowNewPostModal(true)}
          className="fixed bottom-6 right-6 z-40 w-16 h-16 rounded-2xl flex items-center justify-center text-2xl text-black font-bold shadow-2xl transition hover:scale-110 active:scale-95"
          style={{
            background: `linear-gradient(135deg,${gb},${g})`,
            boxShadow: `0 8px 32px ${g}40`,
            animation: 'floatY 3s ease-in-out infinite',
          }}>✏️</button>
      )}

      {/* ═══ NEW POST MODAL ═══ */}
      {showNewPostModal && (
        <NewPostModal
          teamId={teamId} g={g} gb={gb} dim={dim} isDark={isDark}
          onClose={() => setShowNewPostModal(false)}
          onSuccess={() => { loadPosts(1, true); setShowNewPostModal(false) }}
          showToast={showToast}
          canPin={profile?.role === 'admin' || profile?.role === 'coach'}
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
// UTILITY
// ═══════════════════════════════════════════════════════════
function adjustBrightness(hex, amount) {
  try {
    const h = hex.replace('#', '')
    const r = Math.max(0, Math.min(255, parseInt(h.substring(0, 2), 16) + amount))
    const gv = Math.max(0, Math.min(255, parseInt(h.substring(2, 4), 16) + amount))
    const b = Math.max(0, Math.min(255, parseInt(h.substring(4, 6), 16) + amount))
    return `#${r.toString(16).padStart(2, '0')}${gv.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  } catch {
    return hex
  }
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
      <div className="absolute left-4 top-1/2 -translate-y-1/2 hidden lg:block" style={{ writingMode: 'vertical-rl' }}>
        <span className="text-[60px] font-extrabold leading-none tracking-[.15em]" style={{ color: 'rgba(255,255,255,.02)' }}>NEXT MATCH</span>
      </div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden lg:block" style={{ writingMode: 'vertical-rl' }}>
        <span className="text-[60px] font-extrabold leading-none tracking-[.15em]" style={{ color: 'rgba(255,255,255,.02)' }}>NEXT MATCH</span>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
        <div className="flex items-center gap-6 md:gap-12 mb-4">
          <div className="text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mx-auto mb-2" style={{ background: `${g}15`, border: `1.5px solid ${g}35` }}>
              {team.logo_url ? (
                <img src={team.logo_url} alt="" className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <span className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: g }}>{teamInitials}</span>
              )}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">{team.name}</p>
          </div>
          <span className="text-5xl md:text-6xl font-extrabold tracking-tight" style={{ color: '#EF4444', animation: 'vsFlash 3s ease-in-out infinite' }}>VS</span>
          <div className="text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mx-auto mb-2" style={{ background: 'rgba(255,255,255,.03)', border: '1.5px solid rgba(255,255,255,.06)' }}>
              <span className="text-3xl md:text-4xl font-extrabold tracking-tight text-white/15">{oppTag}</span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/20">{nextGame.opponent || 'Opponent'}</p>
          </div>
        </div>

        <div className="flex gap-3 mb-3">
          {cd.d !== undefined && [
            { v: cd.d, l: 'DAYS' }, { v: cd.h, l: 'HRS' }, { v: cd.m, l: 'MINS' }, { v: cd.s, l: 'SECS' },
          ].map((d, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="text-center">
                <span className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">{String(d.v).padStart(2, '0')}</span>
                <p className="text-[7px] font-bold uppercase tracking-wider text-white/20">{d.l}</p>
              </div>
              {i < 3 && <span className="text-2xl font-extrabold text-white/10 -mt-3">:</span>}
            </div>
          ))}
        </div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/25">
          {nextGame.event_time && formatTime12(nextGame.event_time)}
          {nextGame.venues?.name && ` · ${nextGame.venues.name}`}
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
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-1">{sportIcon} {team.name}</h2>
        <p className="text-sm font-bold uppercase tracking-wider mb-6" style={{ color: g }}>{team.seasons?.name || 'Current Season'}</p>
        <div className="flex gap-8">
          <div className="text-center">
            <p className="text-4xl font-extrabold text-white">{roster.length}</p>
            <p className="text-[9px] text-white/20 font-bold uppercase tracking-wider">PLAYERS</p>
          </div>
          <div className="w-px h-16" style={{ background: 'rgba(255,255,255,.06)' }} />
          <div className="text-center">
            <p className="text-4xl font-extrabold text-white">{coaches.length}</p>
            <p className="text-[9px] text-white/20 font-bold uppercase tracking-wider">COACHES</p>
          </div>
          <div className="w-px h-16" style={{ background: 'rgba(255,255,255,.06)' }} />
          <div className="text-center">
            <p className="text-4xl font-extrabold text-white">{roster.filter(r => r.position).length}</p>
            <p className="text-[9px] text-white/20 font-bold uppercase tracking-wider">POSITIONS SET</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// SECTION HEADER
// ═══════════════════════════════════════════════════════════
function SectionHeader({ icon, title, accent, g, isDark }) {
  return (
    <div className="flex items-center gap-3 mb-3 tw-au">
      <span className="text-lg">{icon}</span>
      <h2 className="text-2xl font-extrabold tracking-tight">
        <span style={{ color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.25)' }}>{title}</span>{' '}
        <span style={{ color: g }}>{accent}</span>
      </h2>
      <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg,${g}25,transparent)` }} />
    </div>
  )
}

export { TeamWallPage }
