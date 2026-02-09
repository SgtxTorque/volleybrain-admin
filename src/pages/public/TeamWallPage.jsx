import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useParentTutorial } from '../../contexts/ParentTutorialContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { PlayerCardExpanded } from '../../components/players'
import { 
  ArrowLeft, Calendar, MapPin, Clock, Users, MessageCircle, 
  FileText, Plus, Send, X, ChevronRight, Star, Check,
  BarChart3, Camera, Edit, Flag, Megaphone, Trash2, Trophy, UserCog,
  Heart, Share2, MoreVertical
} from '../../constants/icons'

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

function adjustBrightness(hex, amount) {
  try {
    const h = (hex || '#F59E0B').replace('#', '')
    const r = Math.max(0, Math.min(255, parseInt(h.substring(0, 2), 16) + amount))
    const gv = Math.max(0, Math.min(255, parseInt(h.substring(2, 4), 16) + amount))
    const b = Math.max(0, Math.min(255, parseInt(h.substring(4, 6), 16) + amount))
    return `#${r.toString(16).padStart(2, '0')}${gv.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  } catch {
    return hex || '#F59E0B'
  }
}

// ═══════════════════════════════════════════════════════════
// INLINE STYLES — TeamHub visual redesign
// ═══════════════════════════════════════════════════════════
const HUB_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Rajdhani:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

  @keyframes twFadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes twFadeIn{from{opacity:0}to{opacity:1}}
  @keyframes twScaleIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
  @keyframes twCardIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes twVsFlash{0%,80%,100%{opacity:.85}90%{opacity:1;text-shadow:0 0 30px rgba(239,68,68,.5)}}
  @keyframes twMarquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
  @keyframes twFloatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}

  .tw-au{animation:twFadeUp .5s ease-out both}
  .tw-ai{animation:twFadeIn .4s ease-out both}
  .tw-as{animation:twScaleIn .3s ease-out both}
  .tw-ac{animation:twCardIn .4s ease-out both}

  .tw-display{font-family:'Bebas Neue',sans-serif;letter-spacing:.05em}
  .tw-heading{font-family:'Rajdhani','Oswald',sans-serif;font-weight:700;letter-spacing:.04em}
  .tw-mono{font-family:'JetBrains Mono',monospace}

  .tw-ecard{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06);transition:all .25s}
  .tw-ecard:hover{border-color:rgba(245,158,11,.2);transform:translateY(-1px)}
  .tw-ecard-glow{background:linear-gradient(165deg,rgba(245,158,11,.05) 0%,rgba(255,255,255,.02) 35%,rgba(10,10,15,.95) 100%);border:1px solid rgba(245,158,11,.15);box-shadow:0 0 8px rgba(245,158,11,.04)}
  .tw-ecard-glow:hover{border-color:rgba(245,158,11,.3)}

  .tw-nos::-webkit-scrollbar{display:none}.tw-nos{-ms-overflow-style:none;scrollbar-width:none}
  .tw-clift{transition:transform .2s}.tw-clift:hover{transform:translateY(-2px)}

  .tw-badge-accent{border-left:3px solid rgba(168,85,247,.4);background:linear-gradient(90deg,rgba(168,85,247,.04),transparent 30%)}
  .tw-reminder-accent{border-left:3px solid rgba(56,189,248,.4);background:linear-gradient(90deg,rgba(56,189,248,.04),transparent 30%)}

  /* Light mode overrides */
  .tw-light .tw-ecard{background:rgba(0,0,0,.02);border-color:rgba(0,0,0,.08)}
  .tw-light .tw-ecard:hover{border-color:rgba(245,158,11,.3)}
  .tw-light .tw-ecard-glow{background:linear-gradient(165deg,rgba(245,158,11,.06) 0%,rgba(255,255,255,.8) 35%,rgba(255,255,255,.95) 100%);border-color:rgba(245,158,11,.2)}
`

// ═══════════════════════════════════════════════════════════
// TEAM WALL PAGE — Real Supabase data + TeamHub visuals
// ═══════════════════════════════════════════════════════════
function TeamWallPage({ teamId, showToast, onBack, onNavigate, activeView }) {
  const { profile, user } = useAuth()
  const parentTutorial = useParentTutorial()
  const tc = useThemeClasses()
  const { isDark } = useTheme()

  // Complete "join_team_hub" step for parents when they visit
  useEffect(() => {
    if (activeView === 'parent' && teamId) {
      parentTutorial?.completeStep?.('join_team_hub')
    }
  }, [activeView, teamId])

  // ── Core data (preserved from original) ──
  const [team, setTeam] = useState(null)
  const [roster, setRoster] = useState([])
  const [coaches, setCoaches] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [loading, setLoading] = useState(true)

  // Posts/Feed with pagination
  const [posts, setPosts] = useState([])
  const [postsPage, setPostsPage] = useState(1)
  const [hasMorePosts, setHasMorePosts] = useState(true)
  const [loadingMorePosts, setLoadingMorePosts] = useState(false)
  const POSTS_PER_PAGE = 10

  const [documents, setDocuments] = useState([])
  const [activeTab, setActiveTab] = useState('feed')

  // Modals
  const [showNewPostModal, setShowNewPostModal] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [showEventDetail, setShowEventDetail] = useState(null)

  // ── Visual state (from TeamHub redesign) ──
  const [bannerSlide, setBannerSlide] = useState(0)
  const [tickerText, setTickerText] = useState('')
  const [editingTicker, setEditingTicker] = useState(false)
  const [tickerOverflows, setTickerOverflows] = useState(false)
  const tickerRef = useRef(null)

  // Team accent color
  const g = team?.color || '#F59E0B'
  const gb = adjustBrightness(g, 20)
  const dim = adjustBrightness(g, -30)

  // Banner config
  const bannerSlides = [
    { id: 1, type: 'photo', label: 'Team Photo' },
    { id: 2, type: 'next_game', label: 'Next Game' },
    { id: 3, type: 'season_stats', label: 'Season Pulse' },
  ]

  // Next upcoming game for countdown
  const nextGame = upcomingEvents.find(e => e.event_type === 'game') || upcomingEvents[0]
  const countdownTarget = nextGame ? `${nextGame.event_date}T${nextGame.event_time || '19:00:00'}` : null
  const cd = useCountdown(countdownTarget)

  // Auto-advance banner
  useEffect(() => {
    const i = setInterval(() => setBannerSlide(p => (p + 1) % bannerSlides.length), 7000)
    return () => clearInterval(i)
  }, [bannerSlides.length])

  // Init ticker from team motto
  useEffect(() => {
    if (team?.motto) setTickerText(`🐝 "${team.motto}"`)
    else if (team?.name) setTickerText(`🐝 Welcome to ${team.name}!`)
  }, [team])

  // Check ticker overflow
  useEffect(() => {
    if (tickerRef.current) {
      setTickerOverflows(tickerRef.current.scrollWidth > tickerRef.current.clientWidth)
    }
  }, [tickerText])

  // ═══════════════════════════════════════════════════════════
  // DATA LOADING — Preserved exactly from original public/TeamWallPage
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

  async function toggleReaction(postId) {
    const { data: existing } = await supabase
      .from('post_reactions')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user?.id)
      .single()

    if (existing) {
      await supabase.from('post_reactions').delete().eq('id', existing.id)
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, reaction_count: Math.max(0, (p.reaction_count || 0) - 1) } : p
      ))
    } else {
      await supabase.from('post_reactions').insert({
        post_id: postId,
        user_id: user?.id,
        reaction_type: 'like'
      })
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, reaction_count: (p.reaction_count || 0) + 1 } : p
      ))
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

  // ═══════════════════════════════════════════════════════════
  // LOADING / ERROR STATES (preserved from original)
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
        <button onClick={onBack} className="mt-4 text-[var(--accent-primary)]">
          ← Go Back
        </button>
      </div>
    )
  }

  // Derived values
  const teamInitials = (team.name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const seasonLabel = team.seasons?.name || ''
  const sportIcon = team.seasons?.sports?.icon || '🏐'
  const isCoachOrAdmin = profile?.role === 'admin' || profile?.role === 'coach'
  const canPost = isCoachOrAdmin || profile?.role === 'parent'

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <div className={`space-y-0 ${!isDark ? 'tw-light' : ''}`} style={{ fontFamily: "'DM Sans', system-ui" }}>
      <style>{HUB_STYLES}</style>

      {/* BACK BUTTON */}
      <button onClick={onBack}
        className={`flex items-center gap-2 mb-4 ${tc.textMuted} hover:${tc.text} transition`}>
        <ArrowLeft className="w-5 h-5" />
        <span className="tw-heading text-xs tracking-widest">BACK</span>
      </button>

      {/* ═══ HERO BANNER CAROUSEL ═══ */}
      <header className="relative rounded-2xl overflow-hidden mb-0" style={{ height: 300 }}>
        {bannerSlides.map((slide, idx) => (
          <div key={slide.id} className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: bannerSlide === idx ? 1 : 0, zIndex: bannerSlide === idx ? 1 : 0 }}>
            {slide.type === 'photo' && <PhotoBanner team={team} g={g} teamInitials={teamInitials} />}
            {slide.type === 'next_game' && <NextGameBanner team={team} nextGame={nextGame} cd={cd} g={g} teamInitials={teamInitials} />}
            {slide.type === 'season_stats' && <SeasonPulseBanner team={team} roster={roster} coaches={coaches} g={g} sportIcon={sportIcon} />}
          </div>
        ))}

        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-24 z-10"
          style={{ background: isDark ? 'linear-gradient(transparent, var(--bg-primary, #0A0A0F))' : 'linear-gradient(transparent, var(--bg-primary, #f8f8f8))' }} />

        {/* Dots */}
        <div className="absolute bottom-16 right-6 z-20 flex gap-1.5">
          {bannerSlides.map((_, i) => (
            <button key={i} onClick={() => setBannerSlide(i)} className="transition-all rounded-full" style={{
              width: bannerSlide === i ? 20 : 7, height: 7,
              background: bannerSlide === i ? g : 'rgba(255,255,255,.2)',
            }} />
          ))}
        </div>
      </header>

      {/* ═══ TEAM IDENTITY BAR ═══ */}
      <div className="relative z-20 -mt-14 mb-4 px-1">
        <div className="flex items-end gap-4">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl" style={{
              background: `linear-gradient(135deg, ${g}30, ${g}10)`,
              border: `3px solid ${isDark ? 'var(--bg-primary, #0A0A0F)' : 'var(--bg-primary, #f8f8f8)'}`,
              boxShadow: `0 0 0 2px ${g}40, 0 8px 24px rgba(0,0,0,.4)`,
            }}>
              {team.logo_url ? (
                <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
              ) : (
                <span className="tw-display text-3xl font-bold" style={{ color: g }}>{teamInitials}</span>
              )}
            </div>
          </div>

          <div className="flex-1 pb-1 min-w-0">
            <h1 className="tw-display text-2xl md:text-3xl font-bold leading-none truncate" style={{ color: isDark ? 'white' : '#1a1a1a' }}>
              {team.name} <span style={{ color: g }}>{sportIcon}</span>
            </h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-[11px] tw-heading tracking-[.12em]" style={{ color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)' }}>
                {seasonLabel}
              </span>
              {team.motto && (
                <span className="text-[11px] italic" style={{ color: isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.25)' }}>
                  "{team.motto}"
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ TICKER ═══ */}
      <div className="mb-4 px-1">
        <div className="rounded-xl overflow-hidden relative" style={{ background: `${g}0a`, border: `1px solid ${g}1a` }}>
          {editingTicker ? (
            <div className="flex items-center gap-2 p-2">
              <input type="text" maxLength={150} value={tickerText} onChange={e => setTickerText(e.target.value)}
                className="flex-1 bg-transparent text-sm px-3 py-1.5 outline-none" style={{ color: isDark ? 'white' : '#333' }}
                placeholder="Team message (150 chars max)" autoFocus />
              <span className="text-[10px] tw-mono mr-2" style={{ color: isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.2)' }}>{tickerText.length}/150</span>
              <button onClick={() => setEditingTicker(false)} className="px-3 py-1 rounded text-[10px] tw-heading tracking-wider"
                style={{ background: g, color: '#000' }}>SAVE</button>
            </div>
          ) : (
            <div className="flex items-center h-9 px-4 overflow-hidden">
              <div ref={tickerRef} className="whitespace-nowrap text-sm" style={{ color: `${g}cc` }}>
                {tickerOverflows ? (
                  <div style={{ animation: 'twMarquee 20s linear infinite', display: 'inline-block' }}>
                    <span className="mr-16">{tickerText}</span><span className="mr-16">{tickerText}</span>
                  </div>
                ) : <span>{tickerText}</span>}
              </div>
              {isCoachOrAdmin && (
                <button onClick={() => setEditingTicker(true)} className="ml-auto flex-shrink-0 pl-4 text-xs transition"
                  style={{ color: isDark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.2)' }}>✏️</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══ QUICK ACTIONS ═══ */}
      <div className="mb-5 tw-au px-1" style={{ animationDelay: '.1s' }}>
        <div className="flex gap-2 overflow-x-auto tw-nos pb-1">
          {[
            canPost && { icon: '✏️', label: 'New Post', action: () => setShowNewPostModal(true), primary: true },
            { icon: '💬', label: 'Team Chat', action: openTeamChat },
            { icon: '📅', label: 'Schedule', action: () => setActiveTab('schedule') },
            { icon: '📋', label: 'Roster', action: () => setActiveTab('roster') },
            { icon: '📄', label: 'Docs', action: () => setActiveTab('documents') },
          ].filter(Boolean).map((a) => (
            <button key={a.label} onClick={a.action}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-semibold tw-heading tracking-wider transition whitespace-nowrap tw-clift"
              style={a.primary ? {
                background: `linear-gradient(135deg, ${g}, ${dim})`, color: '#0A0A0F',
                boxShadow: `0 0 12px ${g}26`,
              } : {
                background: isDark ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.03)',
                border: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.08)',
                color: isDark ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.5)',
              }}>
              <span>{a.icon}</span> {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ TABS ═══ */}
      <div className="mb-5 px-1">
        <div className="flex gap-1" style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.08)' }}>
          {[
            { key: 'feed', icon: '📰', label: 'Feed' },
            { key: 'roster', icon: '👥', label: 'Roster' },
            { key: 'schedule', icon: '📅', label: 'Schedule' },
            { key: 'documents', icon: '📄', label: 'Documents' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="px-4 py-2 text-[11px] tw-heading tracking-wider transition rounded-t-lg"
              style={activeTab === tab.key ? {
                background: `${g}15`, color: g, borderBottom: `2px solid ${g}`,
              } : {
                color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)', borderBottom: '2px solid transparent',
              }}>
              {tab.icon} {tab.label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-1">

        {/* LEFT: Tab Content */}
        <div className="lg:col-span-8 space-y-4">

          {/* FEED */}
          {activeTab === 'feed' && (
            <>
              <SectionHeader icon="📰" title="TEAM" accent="FEED" g={g} isDark={isDark} />
              {posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.map((post, i) => (
                    <FeedPost key={post.id} post={post} g={g} i={i} onReact={toggleReaction} isDark={isDark} />
                  ))}
                  {hasMorePosts && (
                    <button onClick={loadMorePosts} disabled={loadingMorePosts}
                      className="w-full py-3 rounded-xl text-[11px] tw-heading tracking-wider transition"
                      style={{
                        background: isDark ? 'rgba(255,255,255,.02)' : 'rgba(0,0,0,.02)',
                        border: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.08)',
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
                    <p className="text-center text-[10px] tw-heading tracking-[.3em] py-4"
                      style={{ color: isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.1)' }}>— END OF FEED —</p>
                  )}
                </div>
              ) : (
                <div className="tw-ecard rounded-xl p-8 text-center">
                  <Megaphone className="w-12 h-12 mx-auto" style={{ color: isDark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.15)' }} />
                  <p className="mt-4" style={{ color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)' }}>No posts yet</p>
                  <p className="text-sm" style={{ color: isDark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.2)' }}>Check back later for team updates!</p>
                </div>
              )}
            </>
          )}

          {/* ROSTER */}
          {activeTab === 'roster' && (
            <>
              <SectionHeader icon="👥" title="TEAM" accent="ROSTER" g={g} isDark={isDark} />
              <div className="tw-ecard rounded-xl overflow-hidden">
                <div className="px-4 py-3" style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,.04)' : '1px solid rgba(0,0,0,.06)' }}>
                  <span className="text-[10px] tw-heading tracking-[.25em]" style={{ color: isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)' }}>
                    {sportIcon} ROSTER ({roster.length})
                  </span>
                </div>
                {roster.map(player => (
                  <div key={player.id} onClick={() => setSelectedPlayer(player)}
                    className="p-4 flex items-center gap-4 cursor-pointer transition hover:bg-white/5"
                    style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,.03)' : '1px solid rgba(0,0,0,.04)' }}>
                    {player.photo_url ? (
                      <img src={player.photo_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center tw-display text-sm font-bold"
                        style={{ background: `${g}10`, color: g, border: `1px solid ${g}15` }}>
                        {player.first_name?.[0]}{player.last_name?.[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${tc.text}`}>{player.first_name} {player.last_name}</p>
                      <p className={`text-sm ${tc.textMuted}`}>
                        {player.jersey_number && `#${player.jersey_number} · `}{player.position || 'Player'}
                      </p>
                    </div>
                    <ChevronRight className={`w-5 h-5 ${tc.textMuted}`} />
                  </div>
                ))}
                {roster.length === 0 && (
                  <div className="p-8 text-center">
                    <Users className={`w-12 h-12 mx-auto ${tc.textMuted}`} />
                    <p className={`${tc.textMuted} mt-4`}>No players on roster yet</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* SCHEDULE */}
          {activeTab === 'schedule' && (
            <>
              <SectionHeader icon="📅" title="UPCOMING" accent="EVENTS" g={g} isDark={isDark} />
              <div className="tw-ecard rounded-xl overflow-hidden">
                {upcomingEvents.map(event => {
                  const eventDate = new Date(event.event_date)
                  const isGame = event.event_type === 'game'
                  return (
                    <div key={event.id} onClick={() => setShowEventDetail(event)}
                      className="p-4 flex items-center gap-4 cursor-pointer transition hover:bg-white/5"
                      style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,.03)' : '1px solid rgba(0,0,0,.04)' }}>
                      <div className="text-center min-w-[44px]">
                        <p className="text-[8px] tw-heading tracking-wider" style={{ color: isGame ? g : '#38BDF8' }}>
                          {eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                        </p>
                        <p className={`tw-display text-2xl font-bold leading-none ${tc.text}`}>{eventDate.getDate()}</p>
                      </div>
                      <div className="w-px h-8" style={{ background: isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.06)' }} />
                      <div className="flex-1">
                        <span className="px-2 py-0.5 rounded text-[9px] tw-heading tracking-wider font-medium"
                          style={{ background: isGame ? `${g}15` : 'rgba(56,189,248,.1)', color: isGame ? g : '#38BDF8' }}>
                          {isGame ? '🏐 GAME' : '🏋️ PRACTICE'}
                        </span>
                        <p className={`font-medium ${tc.text} mt-1`}>
                          {event.title || event.event_type}{event.opponent && ` vs ${event.opponent}`}
                        </p>
                        <p className={`text-sm ${tc.textMuted}`}>
                          {event.event_time && formatTime12(event.event_time)}
                          {event.venues?.name && ` · ${event.venues.name}`}
                        </p>
                      </div>
                      <ChevronRight className={`w-5 h-5 ${tc.textMuted}`} />
                    </div>
                  )
                })}
                {upcomingEvents.length === 0 && (
                  <div className="p-8 text-center">
                    <Calendar className={`w-12 h-12 mx-auto ${tc.textMuted}`} />
                    <p className={`${tc.textMuted} mt-4`}>No upcoming events</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* DOCUMENTS */}
          {activeTab === 'documents' && (
            <>
              <SectionHeader icon="📄" title="TEAM" accent="DOCUMENTS" g={g} isDark={isDark} />
              <div className="tw-ecard rounded-xl overflow-hidden">
                {documents.map(doc => (
                  <a key={doc.id} href={doc.file_url} target="_blank" rel="noopener noreferrer"
                    className="p-4 flex items-center gap-4 transition hover:bg-white/5 block"
                    style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,.03)' : '1px solid rgba(0,0,0,.04)' }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(56,189,248,.1)' }}>
                      <FileText className="w-6 h-6" style={{ color: '#38BDF8' }} />
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${tc.text}`}>{doc.name}</p>
                      <p className={`text-sm ${tc.textMuted}`}>{doc.category} · {new Date(doc.created_at).toLocaleDateString()}</p>
                    </div>
                    <ChevronRight className={`w-5 h-5 ${tc.textMuted}`} />
                  </a>
                ))}
                {documents.length === 0 && (
                  <div className="p-8 text-center">
                    <FileText className={`w-12 h-12 mx-auto ${tc.textMuted}`} />
                    <p className={`${tc.textMuted} mt-4`}>No documents uploaded</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* RIGHT: Sidebar */}
        <aside className="lg:col-span-4 space-y-5">

          {/* UPCOMING PREVIEW */}
          <div className="tw-ecard-glow rounded-xl overflow-hidden tw-au" style={{ animationDelay: '.15s' }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${g}15` }}>
              <span className="text-[10px] tw-heading tracking-[.25em]" style={{ color: `${g}80` }}>📅 UPCOMING</span>
              <button onClick={() => setActiveTab('schedule')} className="text-[9px] tw-heading tracking-wider" style={{ color: isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.25)' }}>VIEW ALL →</button>
            </div>
            <div className="p-3 space-y-1">
              {upcomingEvents.slice(0, 3).map(event => {
                const ed = new Date(event.event_date)
                const isGame = event.event_type === 'game'
                return (
                  <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg transition cursor-pointer hover:bg-white/[.015]">
                    <div className="text-center min-w-[32px]">
                      <p className="text-[8px] tw-heading tracking-wider" style={{ color: isGame ? g : '#38BDF8' }}>
                        {ed.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                      </p>
                      <p className={`tw-display text-lg font-bold leading-none ${tc.text}`}>{ed.getDate()}</p>
                    </div>
                    <div className="w-px h-5" style={{ background: isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.06)' }} />
                    <div>
                      <p className={`text-[11px] font-semibold ${tc.text}`}>
                        {event.title || event.event_type}{event.opponent && ` vs ${event.opponent}`}
                      </p>
                      <p className="text-[9px]" style={{ color: isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.25)' }}>
                        {event.event_time && formatTime12(event.event_time)}
                      </p>
                    </div>
                  </div>
                )
              })}
              {upcomingEvents.length === 0 && (
                <p className={`text-center py-4 text-[11px] ${tc.textMuted}`}>No upcoming events</p>
              )}
            </div>
          </div>

          {/* ROSTER PREVIEW */}
          <div className="tw-ecard rounded-xl overflow-hidden tw-au" style={{ animationDelay: '.2s' }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,.04)' : '1px solid rgba(0,0,0,.06)' }}>
              <span className="text-[10px] tw-heading tracking-[.25em]" style={{ color: isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)' }}>🏐 ROSTER ({roster.length})</span>
              <button onClick={() => setActiveTab('roster')} className="text-[9px] tw-heading tracking-wider" style={{ color: isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.25)' }}>VIEW ALL →</button>
            </div>
            <div className="p-2 space-y-0.5">
              {roster.slice(0, 5).map(p => (
                <button key={p.id} onClick={() => setSelectedPlayer(p)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition text-left hover:bg-white/[.015]">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center tw-display text-sm font-bold flex-shrink-0"
                    style={{ background: `${g}10`, color: g, border: `1px solid ${g}15` }}>
                    {p.first_name?.[0]}{p.last_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[11px] font-semibold truncate ${tc.text}`}>{p.first_name} {p.last_name}</p>
                    <p className="text-[9px]" style={{ color: isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.25)' }}>
                      {p.jersey_number && `#${p.jersey_number} · `}{p.position || 'Player'}
                    </p>
                  </div>
                </button>
              ))}
              {roster.length === 0 && <p className={`text-center py-4 text-[11px] ${tc.textMuted}`}>No players yet</p>}
            </div>
          </div>

          {/* COACHES */}
          <div className="tw-ecard rounded-xl overflow-hidden tw-au" style={{ animationDelay: '.25s' }}>
            <div className="px-4 py-3" style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,.04)' : '1px solid rgba(0,0,0,.06)' }}>
              <span className="text-[10px] tw-heading tracking-[.25em]" style={{ color: isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)' }}>🎓 COACHES</span>
            </div>
            <div className="p-3 space-y-2">
              {coaches.map(coach => (
                <div key={coach.id} className="flex items-center gap-3 p-2 rounded-lg">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center tw-display text-sm font-bold"
                    style={{ background: `${g}15`, color: g }}>
                    {coach.full_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className={`text-[11px] font-semibold ${tc.text}`}>{coach.full_name}</p>
                    <p className="text-[9px]" style={{ color: isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.25)' }}>
                      {coach.role === 'head' ? 'Head Coach' : coach.role === 'assistant' ? 'Assistant Coach' : 'Coach'}
                    </p>
                  </div>
                </div>
              ))}
              {coaches.length === 0 && <p className={`${tc.textMuted} p-2`}>No coaches assigned</p>}
            </div>
          </div>

          {/* QUICK STATS */}
          <div className="tw-ecard rounded-xl overflow-hidden tw-au" style={{ animationDelay: '.3s' }}>
            <div className="px-4 py-3" style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,.04)' : '1px solid rgba(0,0,0,.06)' }}>
              <span className="text-[10px] tw-heading tracking-[.25em]" style={{ color: isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)' }}>📊 QUICK STATS</span>
            </div>
            <div className="grid grid-cols-2 gap-2 p-3">
              {[
                { v: roster.length, l: 'Players', c: '#38BDF8' },
                { v: coaches.length, l: 'Coaches', c: g },
                { v: upcomingEvents.length, l: 'Upcoming', c: '#4ADE80' },
                { v: posts.length, l: 'Posts', c: '#A78BFA' },
              ].map(s => (
                <div key={s.l} className="text-center py-2.5 rounded-xl" style={{ background: `${s.c}08`, border: `1px solid ${s.c}15` }}>
                  <p className="tw-display text-xl font-bold" style={{ color: s.c }}>{s.v}</p>
                  <p className="text-[8px] tw-heading tracking-wider" style={{ color: isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.25)' }}>{s.l.toUpperCase()}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* ═══ FAB ═══ */}
      {canPost && (
        <button onClick={() => setShowNewPostModal(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl flex items-center justify-center text-xl text-black font-bold shadow-2xl transition hover:scale-105 active:scale-95"
          style={{ background: `linear-gradient(135deg,${gb},${g})`, boxShadow: `0 0 24px ${g}33`, animation: 'twFloatY 3s ease-in-out infinite' }}>
          ✏️
        </button>
      )}

      {/* ═══ NEW POST MODAL ═══ */}
      {showNewPostModal && (
        <NewPostModal teamId={teamId} g={g} gb={gb} dim={dim} isDark={isDark}
          onClose={() => setShowNewPostModal(false)}
          onSuccess={() => { loadPosts(1, true); setShowNewPostModal(false) }}
          showToast={showToast}
          canPin={isCoachOrAdmin} />
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
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// BANNER SLIDES
// ═══════════════════════════════════════════════════════════

function PhotoBanner({ team, g, teamInitials }) {
  return (
    <div className="absolute inset-0" style={{ background: team.banner_url ? undefined : 'linear-gradient(135deg, #1a1520 0%, #0d1117 50%, #141820 100%)' }}>
      {team.banner_url ? (
        <img src={team.banner_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-[100px] opacity-[.03]">🐝</p>
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition cursor-pointer" style={{ background: 'rgba(0,0,0,.4)' }}>
        <div className="text-center">
          <p className="text-3xl mb-2">📷</p>
          <p className="text-xs text-white/60 tw-heading tracking-wider">UPLOAD COVER PHOTO</p>
        </div>
      </div>
    </div>
  )
}

function NextGameBanner({ team, nextGame, cd, g, teamInitials }) {
  if (!nextGame) {
    return (
      <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0e0a14 0%, #0A0A0F 50%, #0a0f14 100%)' }}>
        <div className="text-center">
          <p className="text-[9px] tw-heading tracking-[.4em] text-white/20 mb-2">NO UPCOMING GAMES</p>
          <p className="tw-display text-3xl font-bold text-white/10">CHECK BACK SOON</p>
        </div>
      </div>
    )
  }

  const oppTag = (nextGame.opponent || 'OPP').slice(0, 4).toUpperCase()

  return (
    <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0e0a14 0%, #0A0A0F 50%, #0a0f14 100%)' }}>
      <div className="absolute" style={{ top: '10%', left: '30%', width: '40%', height: '60%', background: `radial-gradient(ellipse,${g}0a 0%,transparent 60%)`, filter: 'blur(30px)' }} />
      <div className="absolute left-4 top-1/2 -translate-y-1/2 hidden lg:block" style={{ writingMode: 'vertical-rl' }}>
        <span className="tw-display text-[50px] font-bold leading-none tracking-[.15em]" style={{ color: 'rgba(255,255,255,.02)' }}>NEXT MATCH</span>
      </div>
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
        <div className="flex items-center gap-6 md:gap-10 mb-4">
          <div className="text-center">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: `${g}15`, border: `1.5px solid ${g}35` }}>
              {team.logo_url ? (
                <img src={team.logo_url} alt="" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <span className="tw-display text-2xl md:text-3xl font-bold" style={{ color: g }}>{teamInitials}</span>
              )}
            </div>
            <p className="text-[9px] tw-heading tracking-wider text-white/40">{team.name}</p>
          </div>
          <span className="tw-display text-4xl md:text-5xl font-bold" style={{ color: '#EF4444', animation: 'twVsFlash 3s ease-in-out infinite' }}>VS</span>
          <div className="text-center">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: 'rgba(255,255,255,.03)', border: '1.5px solid rgba(255,255,255,.06)' }}>
              <span className="tw-display text-2xl md:text-3xl font-bold text-white/15">{oppTag}</span>
            </div>
            <p className="text-[9px] tw-heading tracking-wider text-white/20">{nextGame.opponent || 'Opponent'}</p>
          </div>
        </div>
        <div className="flex gap-2 mb-3">
          {cd.d !== undefined && [
            { v: cd.d, l: 'DAYS' }, { v: cd.h, l: 'HRS' }, { v: cd.m, l: 'MINS' }, { v: cd.s, l: 'SECS' },
          ].map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="text-center">
                <span className="tw-display text-2xl md:text-3xl font-bold text-white">{String(d.v).padStart(2, '0')}</span>
                <p className="text-[7px] tw-heading tracking-[.2em] text-white/20">{d.l}</p>
              </div>
              {i < 3 && <span className="tw-display text-xl text-white/10 -mt-3">:</span>}
            </div>
          ))}
        </div>
        <p className="text-[10px] tw-heading tracking-wider text-white/25">
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
        <p className="text-[9px] tw-heading tracking-[.4em] text-white/20 mb-2">SEASON SNAPSHOT</p>
        <h2 className="tw-display text-3xl md:text-4xl font-bold text-white mb-1">{sportIcon} {team.name}</h2>
        <p className="text-sm tw-heading tracking-wider mb-6" style={{ color: g }}>{team.seasons?.name || 'Current Season'}</p>
        <div className="flex gap-6">
          <div className="text-center">
            <p className="tw-display text-3xl font-bold text-white">{roster.length}</p>
            <p className="text-[9px] text-white/20 tw-heading tracking-wider">PLAYERS</p>
          </div>
          <div className="w-px h-16" style={{ background: 'rgba(255,255,255,.04)' }} />
          <div className="text-center">
            <p className="tw-display text-3xl font-bold text-white">{coaches.length}</p>
            <p className="text-[9px] text-white/20 tw-heading tracking-wider">COACHES</p>
          </div>
          <div className="w-px h-16" style={{ background: 'rgba(255,255,255,.04)' }} />
          <div className="text-center">
            <p className="tw-display text-3xl font-bold text-white">{roster.filter(r => r.position).length}</p>
            <p className="text-[9px] text-white/20 tw-heading tracking-wider">POSITIONS SET</p>
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
    <div className="flex items-center gap-3 mb-2 tw-au">
      <span className="text-base">{icon}</span>
      <h2 className="tw-display text-xl font-bold">
        <span style={{ color: isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.35)' }}>{title}</span>{' '}
        <span style={{ color: g }}>{accent}</span>
      </h2>
      <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg,${g}1a,transparent)` }} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// FEED POST
// ═══════════════════════════════════════════════════════════
function FeedPost({ post, g, i, onReact, isDark }) {
  const postType = post.post_type || 'announcement'
  const accentClass = postType === 'milestone' ? 'tw-badge-accent' : postType === 'game_recap' ? 'tw-reminder-accent' : ''
  const typeIcon = { announcement: '📢', game_recap: '🏐', shoutout: '⭐', milestone: '🏆', photo: '📷' }[postType] || '📝'

  return (
    <article className={`tw-ecard rounded-xl overflow-hidden tw-ac ${accentClass}`} style={{ animationDelay: `${.15 + i * .04}s` }}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: `${g}10`, color: g, border: `1px solid ${g}15` }}>
              {post.profiles?.full_name?.charAt(0) || '?'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold" style={{ color: isDark ? 'white' : '#1a1a1a' }}>{post.profiles?.full_name || 'Team Admin'}</p>
                <span className="text-[8px] tw-heading tracking-wider px-1.5 py-0.5 rounded" style={{ background: `${g}08`, color: `${g}99` }}>
                  {typeIcon} {postType.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <p className="text-[10px]" style={{ color: isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.25)' }}>
                {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </p>
            </div>
          </div>
          {post.is_pinned && <span className="text-[9px] tw-heading" style={{ color: `${g}60` }}>📌</span>}
        </div>

        {post.media_urls?.length > 0 && (
          <div className={`mb-3 grid ${post.media_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
            {post.media_urls.map((url, idx) => (
              <img key={idx} src={url} alt="" className="rounded-xl w-full h-48 object-cover cursor-pointer hover:opacity-90 transition" />
            ))}
          </div>
        )}

        {post.title && <h3 className="font-bold text-[13px] tw-heading tracking-wide mb-1" style={{ color: isDark ? 'white' : '#1a1a1a' }}>{post.title}</h3>}
        <p className="text-[12px] leading-relaxed whitespace-pre-wrap" style={{ color: isDark ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.45)' }}>{post.content}</p>

        <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: isDark ? '1px solid rgba(255,255,255,.04)' : '1px solid rgba(0,0,0,.06)' }}>
          <button onClick={() => onReact(post.id)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] transition hover:bg-red-500/5"
            style={{ border: isDark ? '1px solid rgba(255,255,255,.04)' : '1px solid rgba(0,0,0,.06)', color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)' }}>
            ❤️ <span className="tw-mono text-[10px]">{post.reaction_count || 0}</span>
          </button>
          <button className="flex items-center gap-1.5 text-[11px]" style={{ color: isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.25)' }}>
            💬 <span className="tw-mono">{post.comment_count || 0}</span>
          </button>
        </div>
      </div>
    </article>
  )
}

// ═══════════════════════════════════════════════════════════
// NEW POST MODAL
// ═══════════════════════════════════════════════════════════
function NewPostModal({ teamId, g, gb, dim, isDark, onClose, onSuccess, showToast, canPin = false }) {
  const { user } = useAuth()
  const [postType, setPostType] = useState('announcement')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPinned, setIsPinned] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const inp = { background: isDark ? 'rgba(255,255,255,.025)' : 'rgba(0,0,0,.03)', border: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.08)' }

  async function handleSubmit(e) {
    e?.preventDefault?.()
    if (!content.trim()) return
    setSubmitting(true)
    try {
      const { error } = await supabase.from('team_posts').insert({
        team_id: teamId,
        author_id: user?.id,
        title: title.trim() || null,
        content: content.trim(),
        post_type: postType,
        is_pinned: isPinned,
        is_published: true
      })
      if (error) throw error
      showToast?.('Post created!', 'success')
      onSuccess()
    } catch (err) {
      console.error('Error creating post:', err)
      showToast?.('Error creating post', 'error')
    }
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 tw-ai" style={{ background: 'rgba(0,0,0,.65)' }} onClick={onClose}>
      <div className="rounded-xl w-full max-w-lg overflow-hidden tw-as shadow-2xl"
        style={{ background: isDark ? 'rgba(10,10,15,.95)' : 'rgba(255,255,255,.98)', border: isDark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(0,0,0,.1)', backdropFilter: 'blur(20px)' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between p-5" style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.08)' }}>
          <h2 className="tw-heading text-base font-bold tracking-wider" style={{ color: g }}>CREATE POST</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: isDark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.2)' }}>✕</button>
        </div>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto tw-nos">
          <div className="flex flex-wrap gap-1.5">
            {[['announcement', '📢 ANNOUNCEMENT'], ['game_recap', '🏐 GAME RECAP'], ['shoutout', '⭐ SHOUTOUT'], ['milestone', '🏆 MILESTONE'], ['photo', '📷 PHOTO']].map(([k, l]) => (
              <button key={k} onClick={() => setPostType(k)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold tw-heading tracking-wider transition" style={{
                background: postType === k ? `${g}15` : (isDark ? 'rgba(255,255,255,.02)' : 'rgba(0,0,0,.02)'),
                color: postType === k ? g : (isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.25)'),
                border: `1px solid ${postType === k ? `${g}25` : (isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.06)')}`
              }}>{l}</button>
            ))}
          </div>
          <input type="text" placeholder="Title (optional)" value={title} onChange={e => setTitle(e.target.value)}
            className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none" style={{ ...inp, color: isDark ? 'white' : '#333' }} />
          <textarea placeholder="Share with the team…" value={content} onChange={e => setContent(e.target.value)} rows={4}
            className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none resize-none" style={{ ...inp, color: isDark ? 'white' : '#333' }} />
          {canPin && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} className="accent-amber-500 rounded w-4 h-4" />
              <span className="text-[9px] tw-heading tracking-wider" style={{ color: isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.3)' }}>📌 PIN TO TOP</span>
            </label>
          )}
        </div>

        <div className="p-5 flex gap-3" style={{ borderTop: isDark ? '1px solid rgba(255,255,255,.04)' : '1px solid rgba(0,0,0,.06)' }}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-[10px] font-bold tw-heading tracking-wider transition"
            style={{ border: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.08)', color: isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.3)' }}>CANCEL</button>
          <button onClick={handleSubmit} disabled={!content.trim() || submitting}
            className="flex-1 py-2.5 rounded-xl text-[10px] font-bold tw-heading tracking-wider text-black transition hover:brightness-110 disabled:opacity-25"
            style={{ background: `linear-gradient(135deg,${gb},${g})`, boxShadow: `0 0 14px ${g}26` }}>
            {submitting ? 'POSTING...' : 'PUBLISH'}
          </button>
        </div>
      </div>
    </div>
  )
}

export { TeamWallPage }
