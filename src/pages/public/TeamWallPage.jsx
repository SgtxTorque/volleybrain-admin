import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { useOrgBranding } from '../../contexts/OrgBrandingContext'
import { supabase } from '../../lib/supabase'
import { PlayerCardExpanded } from '../../components/players'
import { CommentSection } from '../../components/teams/CommentSection'
import { ReactionBar } from '../../components/teams/ReactionBar'
import {
  ArrowLeft, Calendar, MapPin, Clock, Users, MessageCircle,
  FileText, Plus, Send, X, ChevronRight, Star, Check,
  BarChart3, Camera, Edit, Flag, Megaphone, Trash2, Trophy, UserCog,
  Heart, Share2, MoreVertical, Award, Upload
} from '../../constants/icons'

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

const EMOJIS = ['🏐', '🔥', '💪', '🏆', '⭐', '❤️', '💯', '🐝', '👍']

// ═══════════════════════════════════════════════════════════
// TEAM WALL PAGE — v0 3-panel layout
// ═══════════════════════════════════════════════════════════
function TeamWallPage({ teamId, showToast, onBack, onNavigate }) {
  const { profile, user } = useAuth()
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const { orgLogo, orgName, hasCustomBranding } = useOrgBranding()

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
  const [picker, setPicker] = useState(null)
  const [coverUploading, setCoverUploading] = useState(false)
  const coverInputRef = useRef(null)

  // Game record state
  const [gameRecord, setGameRecord] = useState({ wins: 0, losses: 0 })
  // Gallery images from posts
  const [galleryImages, setGalleryImages] = useState([])

  const g = team?.color || '#0d9488' // teal-600 default matching v0

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
          .select('id, home_team_id, away_team_id, home_score, away_score, status')
          .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
          .eq('status', 'completed')

        let w = 0, l = 0
        ;(games || []).forEach(game => {
          const isHome = game.home_team_id === teamId
          const won = isHome ? game.home_score > game.away_score : game.away_score > game.home_score
          if (won) w++; else l++
        })
        setGameRecord({ wins: w, losses: l })
      } catch (err) {
        console.log('Could not load game record:', err)
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
        // Extract gallery images from posts with media
        const imgs = (postsData || [])
          .filter(p => p.media_urls?.length > 0)
          .flatMap(p => p.media_urls)
          .slice(0, 6)
        setGalleryImages(imgs)
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

  // Cover photo upload
  async function handleCoverUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `team-covers/${teamId}/cover.${ext}`
      const { error: upErr } = await supabase.storage
        .from('team-assets')
        .upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data: urlData } = supabase.storage.from('team-assets').getPublicUrl(path)
      const publicUrl = urlData?.publicUrl
      if (publicUrl) {
        await supabase.from('teams').update({ banner_url: publicUrl }).eq('id', teamId)
        setTeam(prev => ({ ...prev, banner_url: publicUrl }))
        showToast?.('Cover photo updated!', 'success')
      }
    } catch (err) {
      console.error('Cover upload error:', err)
      showToast?.('Failed to upload cover photo', 'error')
    }
    setCoverUploading(false)
  }

  // ═══════════════════════════════════════════════════════════
  // LOADING / ERROR STATES (preserved)
  // ═══════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!team) {
    return (
      <div className="text-center py-12">
        <VolleyballIcon className={`w-16 h-16 mx-auto ${tc.textMuted}`} />
        <p className={`${tc.text} mt-4`}>Team not found</p>
        <button onClick={onBack} className="mt-4 text-teal-600">← Go Back</button>
      </div>
    )
  }

  const teamInitials = (team.name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const seasonLabel = team.seasons?.name || ''
  const sportIcon = team.seasons?.sports?.icon || '🏐'
  const isAdmin = profile?.role === 'admin'
  const isCoach = profile?.role === 'coach'
  const canPost = isAdmin || isCoach || profile?.role === 'parent'
  const totalGames = gameRecord.wins + gameRecord.losses
  const winRate = totalGames > 0 ? Math.round((gameRecord.wins / totalGames) * 100) : 0

  // Tab definitions matching v0 feed-tabs.tsx
  const tabs = [
    { id: 'feed', label: 'Feed', Icon: FileText },
    { id: 'schedule', label: 'Schedule', Icon: Calendar },
    { id: 'achievements', label: 'Achievements', Icon: Trophy },
    { id: 'stats', label: 'Stats', Icon: BarChart3 },
  ]

  // ═══════════════════════════════════════════════════════════
  // RENDER — v0 3-panel layout
  // ═══════════════════════════════════════════════════════════

  return (
    <div className={`flex flex-col h-[calc(100vh-4rem)] ${isDark ? 'bg-slate-900' : 'bg-[#f5f6f8]'}`}>

      {/* ═══ HERO BANNER — matching v0 team-hero.tsx ═══ */}
      <div className="shrink-0 px-6 pt-6">
        <div className={`relative overflow-hidden rounded-xl shadow-md ${isDark ? 'shadow-black/20' : ''}`}>
          <div className="relative h-56">
            {/* Background image or gradient fallback */}
            {team.banner_url ? (
              <img src={team.banner_url} alt={team.name} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${g}dd, ${g}88, ${g}44)` }} />
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-800/90 via-slate-800/40 to-transparent" />

            {/* Camera button — top right */}
            {(isAdmin || isCoach) && (
              <>
                <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                <button
                  onClick={() => coverInputRef.current?.click()}
                  disabled={coverUploading}
                  className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                >
                  {coverUploading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
              </>
            )}

            {/* Back button — top left */}
            <button
              onClick={onBack}
              className="absolute top-4 left-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            {/* Team info overlay — bottom */}
            <div className="absolute bottom-0 left-0 flex w-full items-end justify-between p-6 z-10">
              <div className="flex items-center gap-4">
                {/* Team logo/initials */}
                <div className="flex h-14 w-14 items-center justify-center rounded-xl shadow-lg overflow-hidden"
                  style={{ background: team.logo_url ? 'transparent' : (isDark ? '#1e293b' : '#2c3e50') }}>
                  {team.logo_url ? (
                    <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-white">{teamInitials}</span>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white uppercase tracking-wide">
                    {(team.name || '').split(' ').map((word, i, arr) => (
                      <span key={i}>
                        {i < arr.length - 1 ? word + ' ' : <span className="italic text-white/80">{word}</span>}
                      </span>
                    ))}
                  </h1>
                  <div className="mt-1 flex items-center gap-3 text-sm text-white/80">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {roster.length} Players &middot; {coaches.length} Coaches
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="h-3.5 w-3.5" />
                      {seasonLabel}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                      Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Join Huddle button */}
              <button
                onClick={openTeamChat}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:brightness-110 hover:-translate-y-0.5"
                style={{ background: isDark ? '#1e293b' : '#2c3e50' }}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-teal-500 animate-pulse" />
                Join Huddle
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ 3-PANEL LAYOUT — matching v0 page structure ═══ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ═══ LEFT: Roster Sidebar ═══ */}
        <aside className={`hidden lg:flex w-[220px] shrink-0 flex-col gap-4 overflow-y-auto py-6 pl-6 pr-4 border-r ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Roster
            </h3>
            <span className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className="h-2 w-2 rounded-full bg-teal-600" />
              {roster.length} players
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            {roster.map(player => (
              <button
                key={player.id}
                onClick={() => setSelectedPlayer(player)}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                }`}
              >
                <span className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                  isDark
                    ? 'border-slate-600 text-slate-400 group-hover:border-teal-500 group-hover:text-teal-500'
                    : 'border-slate-300 text-slate-500 group-hover:border-teal-600 group-hover:text-teal-600'
                }`}>
                  {player.jersey_number || (player.first_name?.[0] + (player.last_name?.[0] || ''))}
                </span>
                <div className="flex-1 overflow-hidden">
                  <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {player.first_name} {player.last_name?.[0]}.
                  </p>
                  <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    {player.position || 'Player'}
                  </p>
                </div>
              </button>
            ))}
            {roster.length === 0 && (
              <p className={`text-center py-8 text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No players on roster</p>
            )}
          </div>
        </aside>

        {/* ═══ CENTER: Feed ═══ */}
        <main className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-2xl mx-auto flex flex-col gap-6">

            {/* Tab Bar — matching v0 feed-tabs.tsx */}
            <div className={`flex items-center rounded-xl p-1.5 shadow-sm ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
              {tabs.map(tab => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-teal-600 text-white shadow-sm'
                        : isDark
                          ? 'text-slate-400 hover:text-slate-200'
                          : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <tab.Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* ── FEED TAB ── */}
            {activeTab === 'feed' && (
              <>
                {/* Post Composer — matching v0 feed-composer.tsx */}
                {canPost && (
                  <div className={`overflow-hidden rounded-xl shadow-sm ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                    <div className="flex items-center gap-3 px-5 pt-4 pb-3">
                      <div className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center bg-teal-600 text-sm font-semibold text-white">
                        {profile?.full_name?.charAt(0) || 'U'}
                      </div>
                      <button
                        onClick={() => setShowNewPostModal(true)}
                        className={`flex flex-1 items-center rounded-xl border px-4 py-2.5 text-sm text-left ${
                          isDark
                            ? 'border-slate-700 bg-slate-700/50 text-slate-400'
                            : 'border-slate-200 bg-slate-50 text-slate-400'
                        }`}
                      >
                        What's on your mind?
                      </button>
                    </div>
                    <div className={`flex items-center gap-1 border-t px-5 py-2 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                      {[
                        { icon: Camera, label: 'Photo/Video', color: 'text-teal-600 hover:bg-teal-50' },
                        { icon: BarChart3, label: 'Poll', color: 'text-emerald-600 hover:bg-emerald-50' },
                        { icon: Award, label: 'Shoutout', color: 'text-amber-500 hover:bg-amber-50' },
                        { icon: Trophy, label: 'Challenge', color: 'text-purple-600 hover:bg-purple-50' },
                      ].map(action => (
                        <button
                          key={action.label}
                          onClick={() => setShowNewPostModal(true)}
                          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                            isDark ? 'text-slate-400 hover:bg-slate-700' : action.color
                          }`}
                        >
                          <action.icon className="h-[18px] w-[18px]" />
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
                      <FeedPost
                        key={post.id}
                        post={post}
                        isDark={isDark}
                        g={g}
                        profile={profile}
                        user={user}
                        teamId={teamId}
                        onReact={toggleReaction}
                        onDelete={async (postId) => {
                          await supabase.from('team_posts').delete().eq('id', postId)
                          setPosts(prev => prev.filter(p => p.id !== postId))
                          showToast?.('Post deleted', 'success')
                        }}
                        onPin={async (postId, pinned) => {
                          await supabase.from('team_posts').update({ is_pinned: pinned }).eq('id', postId)
                          setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_pinned: pinned } : p))
                          showToast?.(pinned ? 'Post pinned' : 'Post unpinned', 'success')
                        }}
                        onReactionCountChange={(postId, count) => {
                          setPosts(prev => prev.map(p => p.id === postId ? { ...p, reaction_count: count } : p))
                        }}
                        onCommentCountChange={(postId, count) => {
                          setPosts(prev => prev.map(p => p.id === postId ? { ...p, comment_count: count } : p))
                        }}
                        showToast={showToast}
                      />
                    ))}
                    {hasMorePosts && (
                      <button
                        onClick={loadMorePosts}
                        disabled={loadingMorePosts}
                        className={`w-full py-3 rounded-xl text-sm font-medium transition-colors ${
                          isDark
                            ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            : 'bg-white text-slate-500 hover:bg-slate-50 shadow-sm'
                        }`}
                      >
                        {loadingMorePosts ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                            Loading...
                          </span>
                        ) : 'Load More Posts'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className={`rounded-xl p-12 text-center shadow-sm ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                    <Megaphone className={`w-14 h-14 mx-auto ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                    <p className={`mt-5 text-lg font-semibold ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>No posts yet</p>
                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Check back later for team updates!</p>
                  </div>
                )}
              </>
            )}

            {/* ── SCHEDULE TAB ── */}
            {activeTab === 'schedule' && (
              <div className={`overflow-hidden rounded-xl shadow-sm ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                {upcomingEvents.map((event, i) => {
                  const eventDate = new Date(event.event_date)
                  const isGame = event.event_type === 'game'
                  return (
                    <div
                      key={event.id}
                      onClick={() => setShowEventDetail(event)}
                      className={`flex items-center gap-4 px-6 py-4 transition-colors cursor-pointer ${
                        isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'
                      } ${i > 0 ? (isDark ? 'border-t border-slate-700' : 'border-t border-slate-200') : ''}`}
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        isGame ? 'bg-teal-100 text-teal-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {event.title || (isGame ? 'Game' : 'Practice')}
                          {event.opponent && (
                            <>
                              {' '}<span className={isDark ? 'text-slate-400' : 'text-slate-500'}>vs</span>{' '}
                              <span className="text-teal-600">{event.opponent}</span>
                            </>
                          )}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {event.event_time && formatTime12(event.event_time)}
                          {event.venues?.name && ` · ${event.venues.name}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {event.event_time && formatTime12(event.event_time)}
                        </p>
                      </div>
                    </div>
                  )
                })}
                {upcomingEvents.length === 0 && (
                  <div className="p-12 text-center">
                    <Calendar className={`w-14 h-14 mx-auto ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                    <p className={`mt-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No upcoming events</p>
                  </div>
                )}
              </div>
            )}

            {/* ── ACHIEVEMENTS TAB (placeholder) ── */}
            {activeTab === 'achievements' && (
              <div className={`rounded-xl p-12 text-center shadow-sm ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                <Trophy className={`w-14 h-14 mx-auto ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                <p className={`mt-5 text-lg font-semibold ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>Team Achievements</p>
                <p className={`text-sm mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Coming soon — track milestones and awards</p>
              </div>
            )}

            {/* ── STATS TAB (placeholder) ── */}
            {activeTab === 'stats' && (
              <div className={`rounded-xl p-12 text-center shadow-sm ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                <BarChart3 className={`w-14 h-14 mx-auto ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                <p className={`mt-5 text-lg font-semibold ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>Team Stats</p>
                <p className={`text-sm mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Coming soon — season statistics and analytics</p>
              </div>
            )}
          </div>
        </main>

        {/* ═══ RIGHT: Widgets Sidebar ═══ */}
        <aside className={`hidden xl:flex w-[280px] shrink-0 flex-col gap-6 overflow-y-auto py-6 pl-6 pr-6 border-l ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>

          {/* Upcoming Events */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Upcoming
              </h3>
              <button
                onClick={() => onNavigate?.('schedule')}
                className="flex items-center gap-1 text-xs font-medium text-teal-600 transition-colors hover:text-teal-500"
              >
                Full Calendar
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {upcomingEvents.slice(0, 3).map(event => {
                const isGame = event.event_type === 'game'
                return (
                  <div
                    key={event.id}
                    className={`rounded-xl p-4 shadow-sm transition-all hover:shadow-md cursor-pointer ${isDark ? 'bg-slate-800' : 'bg-white'}`}
                    onClick={() => setShowEventDetail(event)}
                  >
                    <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {isGame && event.opponent ? (
                        <>Game vs <span className="text-teal-600">{event.opponent}</span></>
                      ) : (
                        event.title || (isGame ? 'Game' : 'Practice')
                      )}
                    </p>
                    <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {event.event_time && ` · ${formatTime12(event.event_time)}`}
                    </p>
                  </div>
                )
              })}
              {upcomingEvents.length === 0 && (
                <p className={`text-center py-6 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No upcoming events</p>
              )}
            </div>
          </section>

          {/* Season Record */}
          <section className="flex flex-col gap-4">
            <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Season Record
            </h3>
            <div className={`flex flex-col items-center gap-3 rounded-xl p-6 shadow-sm ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-teal-600">{gameRecord.wins}</span>
                <span className={`text-lg ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>&mdash;</span>
                <span className="text-4xl font-bold text-red-500">{gameRecord.losses}</span>
              </div>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {totalGames > 0 ? `${winRate}% win rate` : 'No games played'}
              </p>
            </div>
          </section>

          {/* Gallery */}
          <section className="flex flex-col gap-4">
            <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Gallery
            </h3>
            {galleryImages.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {galleryImages.slice(0, 6).map((src, i) => (
                  <div key={i} className="relative aspect-square overflow-hidden rounded-xl transition-all hover:opacity-80 cursor-pointer">
                    <img src={src} alt={`Gallery photo ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className={`rounded-xl p-6 text-center shadow-sm ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                <Camera className={`w-8 h-8 mx-auto ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                <p className={`mt-2 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No photos yet</p>
              </div>
            )}
          </section>

          {/* Documents link */}
          {documents.length > 0 && (
            <section className="flex flex-col gap-4">
              <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Documents
              </h3>
              <div className={`rounded-xl shadow-sm overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                {documents.slice(0, 3).map((doc, i) => (
                  <a
                    key={doc.id}
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'
                    } ${i > 0 ? (isDark ? 'border-t border-slate-700' : 'border-t border-slate-200') : ''}`}
                  >
                    <FileText className={`h-4 w-4 shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                    <span className={`text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{doc.name}</span>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Coaches */}
          {coaches.length > 0 && (
            <section className="flex flex-col gap-4">
              <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Coaches
              </h3>
              <div className={`rounded-xl shadow-sm overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                {coaches.map((coach, i) => (
                  <div
                    key={coach.id}
                    className={`flex items-center gap-3 px-4 py-3 ${
                      i > 0 ? (isDark ? 'border-t border-slate-700' : 'border-t border-slate-200') : ''
                    }`}
                  >
                    <div className="h-9 w-9 rounded-full flex items-center justify-center bg-teal-100 text-teal-700 text-sm font-bold">
                      {coach.full_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{coach.full_name}</p>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {coach.role === 'head' ? 'Head Coach' : coach.role === 'assistant' ? 'Assistant' : 'Coach'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>

      {/* ═══ FAB ═══ */}
      {canPost && (
        <button
          onClick={() => setShowNewPostModal(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-xl flex items-center justify-center text-white shadow-lg transition hover:scale-110 active:scale-95 bg-teal-600 hover:bg-teal-500"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* ═══ NEW POST MODAL ═══ */}
      {showNewPostModal && (
        <NewPostModal
          teamId={teamId} isDark={isDark}
          onClose={() => setShowNewPostModal(false)}
          onSuccess={() => { loadPosts(1, true); setShowNewPostModal(false) }}
          showToast={showToast}
          canPin={isAdmin || isCoach}
          profile={profile}
          user={user}
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
// FEED POST — v0 card style with preserved functionality
// ═══════════════════════════════════════════════════════════
function FeedPost({ post, isDark, g, profile, user, teamId, onReact, onDelete, onPin, onReactionCountChange, onCommentCountChange, showToast }) {
  const isPinned = post.is_pinned
  const postType = post.post_type || 'announcement'
  const [showMenu, setShowMenu] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [localReactionCount, setLocalReactionCount] = useState(post.reaction_count || 0)
  const [localCommentCount, setLocalCommentCount] = useState(post.comment_count || 0)
  const menuRef = useRef(null)
  const isAuthor = post.author_id === user?.id
  const isAdmin = profile?.role === 'admin'
  const isCoach = profile?.role === 'coach'
  const canManage = isAuthor || isAdmin || isCoach

  const badgeMap = {
    announcement: { label: 'Announcement', color: isDark ? 'bg-teal-900/50 text-teal-400' : 'bg-teal-50 text-teal-700' },
    game_recap: { label: 'Game Recap', color: isDark ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-50 text-blue-700' },
    shoutout: { label: 'Shoutout', color: isDark ? 'bg-amber-900/50 text-amber-400' : 'bg-amber-50 text-amber-700' },
    milestone: { label: 'Milestone', color: isDark ? 'bg-purple-900/50 text-purple-400' : 'bg-purple-50 text-purple-700' },
    photo: { label: 'Photo', color: isDark ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-50 text-emerald-700' },
  }
  const badge = badgeMap[postType] || badgeMap.announcement

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false)
    }
    if (showMenu) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showMenu])

  const timeAgo = (() => {
    const diff = Date.now() - new Date(post.created_at).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  })()

  return (
    <div className={`overflow-hidden rounded-xl shadow-sm ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold overflow-hidden ${
          isDark ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
        }`}>
          {post.profiles?.avatar_url ? (
            <img src={post.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            post.profiles?.full_name?.charAt(0) || '?'
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {post.profiles?.full_name || 'Team Admin'}
            </span>
            <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{timeAgo}</span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.color}`}>
              {badge.label}
            </span>
          </div>
        </div>
        {/* Three-dot menu */}
        <div className="relative" ref={menuRef}>
          {isPinned && <span className="text-xs mr-1">📌</span>}
          {canManage && (
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`rounded-lg p-1.5 transition-colors ${
                isDark ? 'text-slate-500 hover:bg-slate-700 hover:text-slate-300' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
              }`}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          )}
          {showMenu && (
            <div className={`absolute right-0 top-full mt-1 w-40 rounded-xl overflow-hidden z-50 shadow-lg ${
              isDark ? 'bg-slate-700 border border-slate-600' : 'bg-white border border-slate-200'
            }`}>
              <button
                onClick={() => { onPin?.(post.id, !isPinned); setShowMenu(false) }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  isDark ? 'text-slate-200 hover:bg-slate-600' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {isPinned ? '📌 Unpin' : '📌 Pin to top'}
              </button>
              {isAuthor && (
                <button
                  onClick={() => { onDelete?.(post.id); setShowMenu(false) }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    isDark ? 'text-red-400 hover:bg-slate-600' : 'text-red-500 hover:bg-red-50'
                  }`}
                >
                  🗑 Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-3">
        {post.title && (
          <h3 className={`font-bold text-base mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{post.title}</h3>
        )}
        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{post.content}</p>
      </div>

      {/* Full-bleed Image */}
      {post.media_urls?.length > 0 && (
        <div className={`${post.media_urls.length === 1 ? '' : 'px-4 pb-3'}`}>
          <div className={`${post.media_urls.length === 1 ? '' : 'grid grid-cols-2 gap-2'}`}>
            {post.media_urls.map((url, idx) => (
              <div key={idx} className={`relative overflow-hidden ${post.media_urls.length === 1 ? 'w-full h-72' : 'rounded-xl h-48'}`}>
                <img src={url} alt="Post image" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Engagement summary */}
      <div className="flex items-center gap-4 px-5 py-2.5">
        <span className={`flex items-center gap-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <Heart className="h-3.5 w-3.5 text-amber-500" />
          {localReactionCount}
        </span>
        <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {localCommentCount} {localCommentCount === 1 ? 'comment' : 'comments'}
        </span>
      </div>

      {/* Action bar — Like | Comment | Share */}
      <div className={`flex items-center border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
        <div className={`flex flex-1 items-center justify-center py-2.5 transition-colors ${
          isDark ? 'hover:bg-slate-700/60' : 'hover:bg-slate-50'
        }`}>
          <ReactionBar
            postId={post.id}
            reactionCount={localReactionCount}
            isDark={isDark}
            g={g}
            onCountChange={(count) => {
              setLocalReactionCount(count)
              onReactionCountChange?.(post.id, count)
            }}
          />
        </div>
        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
            isDark ? 'text-slate-400 hover:bg-slate-700/60 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          <MessageCircle className="h-[18px] w-[18px]" />
          <span>Comment</span>
        </button>
        <button
          className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
            isDark ? 'text-slate-400 hover:bg-slate-700/60 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          <Share2 className="h-[18px] w-[18px]" />
          <span>Share</span>
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <CommentSection
          postId={post.id}
          commentCount={localCommentCount}
          isDark={isDark}
          g={g}
          onCountChange={(count) => {
            setLocalCommentCount(count)
            onCommentCountChange?.(post.id, count)
          }}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// NEW POST MODAL — Preserved with v0 styling
// ═══════════════════════════════════════════════════════════
function NewPostModal({ teamId, isDark, onClose, onSuccess, showToast, canPin = false, profile, user }) {
  const [postType, setPostType] = useState('announcement')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPinned, setIsPinned] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [drag, setDrag] = useState(false)
  const [media, setMedia] = useState([])
  const fr = useRef(null)

  async function handleSubmit() {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div
        className={`w-full max-w-lg overflow-hidden rounded-xl shadow-2xl ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Create Post</h2>
          <button onClick={onClose} className={`rounded-lg p-1.5 transition-colors ${isDark ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-400 hover:bg-slate-100'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Post type selector */}
          <div className="flex flex-wrap gap-2">
            {[
              ['announcement', '📢 Announcement'],
              ['game_recap', '🏐 Game Recap'],
              ['shoutout', '⭐ Shoutout'],
              ['milestone', '🏆 Milestone'],
              ['photo', '📷 Photo'],
            ].map(([k, l]) => (
              <button
                key={k}
                onClick={() => setPostType(k)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  postType === k
                    ? 'bg-teal-600 text-white'
                    : isDark
                      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Title (optional)"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className={`w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
            } border`}
          />

          <textarea
            placeholder="Share with the team..."
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={4}
            className={`w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none ${
              isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
            } border`}
          />

          {/* Drag-drop media */}
          <div
            onDragEnter={e => { e.preventDefault(); setDrag(true) }}
            onDragLeave={e => { e.preventDefault(); setDrag(false) }}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); setDrag(false); setMedia(p => [...p, ...Array.from(e.dataTransfer?.files || []).map(f => f.name)]) }}
            onClick={() => fr.current?.click()}
            className={`border-2 border-dashed p-5 text-center cursor-pointer transition rounded-xl ${
              drag
                ? 'border-teal-500 bg-teal-50'
                : isDark ? 'border-slate-600 hover:border-slate-500' : 'border-slate-300 hover:border-slate-400'
            }`}
          >
            <input ref={fr} type="file" accept="image/*,video/*" multiple className="hidden"
              onChange={e => setMedia(p => [...p, ...Array.from(e.target.files || []).map(f => f.name)])} />
            <Upload className={`w-6 h-6 mx-auto ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <p className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Drop files or click to upload</p>
          </div>

          {media.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {media.map((f, i) => (
                <span key={i} className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 ${
                  isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                }`}>
                  📎 {f}
                  <button onClick={() => setMedia(p => p.filter((_, j) => j !== i))} className="hover:text-red-500">×</button>
                </span>
              ))}
            </div>
          )}

          {canPin && (
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} className="accent-teal-600 rounded" />
              <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>📌 Pin to top</span>
            </label>
          )}
        </div>

        {/* Footer */}
        <div className={`flex gap-3 px-6 py-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <button
            onClick={onClose}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || submitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 transition-colors disabled:opacity-40"
          >
            {submitting ? 'Posting...' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  )
}

export { TeamWallPage }
