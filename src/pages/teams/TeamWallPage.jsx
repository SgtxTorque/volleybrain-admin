import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { PlayerCardExpanded } from '../../components/players'
import { 
  ArrowLeft, Calendar, MapPin, Clock, Users, MessageCircle, 
  FileText, Plus, Send, X, ChevronRight, Star, Check,
  BarChart3, Camera, Edit, Flag, Megaphone, Trash2, Trophy, UserCog,
  Heart, Share2, MoreVertical
} from '../../constants/icons'

// Volleyball icon component
function VolleyballIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10" />
      <path d="M2 12a15.3 15.3 0 0 1 10-4 15.3 15.3 0 0 1 10 4" />
    </svg>
  )
}

// Helper function to format time to 12-hour format
function formatTime12(timeStr) {
  if (!timeStr) return ''
  const [hours, minutes] = timeStr.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return hour12 + ':' + minutes + ' ' + ampm
}

// ============================================
// TEAM WALL PAGE - Team Hub for Players/Parents/Coaches
// ============================================
function TeamWallPage({ teamId, showToast, onBack, onNavigate }) {
  const { profile, user } = useAuth()
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  
  // Core data
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
  
  useEffect(() => {
    if (teamId) loadTeamData()
  }, [teamId])
  
  async function loadTeamData() {
    setLoading(true)
    try {
      // Load team info
      const { data: teamData } = await supabase
        .from('teams')
        .select('*, seasons(name, sports(name, icon))')
        .eq('id', teamId)
        .single()
      
      setTeam(teamData)
      
      // Load roster
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
      
      // Load coaches - try different query patterns
      try {
        const { data: coachesData } = await supabase
          .from('team_coaches')
          .select('*, coach_id')
          .eq('team_id', teamId)
        
        if (coachesData?.length > 0) {
          // Get coach profiles separately
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
      
      // Load upcoming events from schedule_events table
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
      
      // Load posts (first page)
      await loadPosts(1, true)
      
      // Load documents
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
    // Check if user already reacted
    const { data: existing } = await supabase
      .from('post_reactions')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user?.id)
      .single()
    
    if (existing) {
      // Remove reaction
      await supabase.from('post_reactions').delete().eq('id', existing.id)
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, reaction_count: Math.max(0, (p.reaction_count || 0) - 1) } : p
      ))
    } else {
      // Add reaction
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
  
  // Navigate to team chat
  function openTeamChat() {
    // Store the team ID so ChatsPage can auto-select this team's chat
    sessionStorage.setItem('openTeamChat', teamId)
    if (onNavigate) {
      onNavigate('messages')
    } else {
      console.warn('TeamWallPage: onNavigate prop not provided - cannot navigate to chat')
    }
  }
  
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
        <button onClick={onBack} className={`mt-4 text-[var(--accent-primary)]`}>
          ← Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button 
        onClick={onBack}
        className={`flex items-center gap-2 ${tc.textMuted} hover:${tc.text} transition`}
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      {/* Team Header */}
      <div 
        className="relative rounded-2xl overflow-hidden"
        style={{ backgroundColor: team.color || '#6366F1' }}
      >
        {team.banner_url && (
          <img 
            src={team.banner_url} 
            alt="" 
            className="absolute inset-0 w-full h-full object-cover opacity-30" 
          />
        )}
        <div className="relative p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {team.logo_url ? (
              <img src={team.logo_url} alt={team.name} className="w-20 h-20 rounded-xl object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-white/20 flex items-center justify-center">
                <VolleyballIcon className="w-10 h-10 text-white" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white/80 text-sm">{team.seasons?.sports?.icon || '🏐'} {team.seasons?.name}</span>
              </div>
              <h1 className="text-3xl font-bold text-white">{team.name}</h1>
              {team.motto && <p className="text-white/80 italic">"{team.motto}"</p>}
            </div>
          </div>
          
          {/* Quick Actions - Including Chat Button */}
          <div className="flex gap-2">
            <button
              onClick={openTeamChat}
              className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-800 rounded-xl font-semibold transition flex items-center gap-2 shadow-lg"
            >
              <MessageCircle className="w-5 h-5" />
              Team Chat
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex gap-2 border-b ${tc.border} pb-2`}>
        {['feed', 'roster', 'schedule', 'documents'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t-xl font-medium transition ${
              activeTab === tab
                ? 'bg-[var(--accent-primary)] text-white'
                : `${tc.text} hover:bg-white/5`
            }`}
          >
            {tab === 'feed' && '📰 '}
            {tab === 'roster' && '👥 '}
            {tab === 'schedule' && '📅 '}
            {tab === 'documents' && '📄 '}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'feed' && (
            <>
              {/* New Post Button (for coaches/admins/parents) */}
              {(profile?.role === 'admin' || profile?.role === 'coach' || profile?.role === 'parent') && (
                <button
                  onClick={() => setShowNewPostModal(true)}
                  className={`w-full ${tc.cardBg} border ${tc.border} rounded-2xl p-4 flex items-center gap-3 hover:border-[var(--accent-primary)]/50 transition`}
                >
                  <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-[var(--accent-primary)]" />
                  </div>
                  <span className={tc.textMuted}>Share an update with the team...</span>
                </button>
              )}
              
              {/* Posts Feed with Pagination */}
              {posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.map(post => (
                    <div key={post.id} className={`${tc.cardBg} border ${tc.border} rounded-2xl overflow-hidden`}>
                      {/* Post Header */}
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center text-[var(--accent-primary)] font-bold">
                            {post.profiles?.full_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className={`font-medium ${tc.text}`}>{post.profiles?.full_name || 'Team Admin'}</p>
                            <p className={`text-xs ${tc.textMuted}`}>
                              {new Date(post.created_at).toLocaleDateString('en-US', { 
                                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        </div>
                        {post.is_pinned && (
                          <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-medium">
                            📌 Pinned
                          </span>
                        )}
                      </div>
                      
                      {/* Post Content */}
                      <div className="px-4 pb-4">
                        {post.title && <h3 className={`font-semibold ${tc.text} mb-2`}>{post.title}</h3>}
                        <p className={`${tc.textSecondary} whitespace-pre-wrap`}>{post.content}</p>
                        
                        {/* Media */}
                        {post.media_urls?.length > 0 && (
                          <div className={`mt-3 grid ${post.media_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
                            {post.media_urls.map((url, idx) => (
                              <img 
                                key={idx} 
                                src={url} 
                                alt="" 
                                className="rounded-xl w-full h-48 object-cover cursor-pointer hover:opacity-90 transition"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Post Actions */}
                      <div className={`px-4 py-3 border-t ${tc.border} flex items-center gap-4`}>
                        <button 
                          onClick={() => toggleReaction(post.id)}
                          className={`flex items-center gap-2 ${tc.textMuted} hover:text-red-400 transition`}
                        >
                          <Heart className="w-5 h-5" />
                          <span>{post.reaction_count || 0}</span>
                        </button>
                        <button className={`flex items-center gap-2 ${tc.textMuted} hover:text-[var(--accent-primary)] transition`}>
                          <MessageCircle className="w-5 h-5" />
                          <span>{post.comment_count || 0}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Load More Button */}
                  {hasMorePosts && (
                    <button
                      onClick={loadMorePosts}
                      disabled={loadingMorePosts}
                      className={`w-full py-3 rounded-xl border ${tc.border} ${tc.text} font-medium hover:bg-white/5 transition disabled:opacity-50`}
                    >
                      {loadingMorePosts ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
                          Loading...
                        </span>
                      ) : (
                        'Load More Posts'
                      )}
                    </button>
                  )}
                  
                  {!hasMorePosts && posts.length > POSTS_PER_PAGE && (
                    <p className={`text-center ${tc.textMuted} py-4`}>
                      You've reached the end! 🎉
                    </p>
                  )}
                </div>
              ) : (
                <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-8 text-center`}>
                  <Megaphone className={`w-12 h-12 mx-auto ${tc.textMuted}`} />
                  <p className={`${tc.textMuted} mt-4`}>No posts yet</p>
                  <p className={`text-sm ${tc.textMuted}`}>Check back later for team updates!</p>
                </div>
              )}
            </>
          )}
          
          {activeTab === 'roster' && (
            <div className={`${tc.cardBg} border ${tc.border} rounded-2xl overflow-hidden`}>
              <div className={`p-4 border-b ${tc.border}`}>
                <h2 className={`font-semibold ${tc.text}`}>Team Roster ({roster.length})</h2>
              </div>
              <div className="divide-y divide-gray-700/50">
                {roster.map(player => (
                  <div 
                    key={player.id}
                    onClick={() => setSelectedPlayer(player)}
                    className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition"
                  >
                    {player.photo_url ? (
                      <img src={player.photo_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[var(--accent-primary)]/20 flex items-center justify-center text-[var(--accent-primary)] font-bold">
                        {player.first_name?.[0]}{player.last_name?.[0]}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className={`font-medium ${tc.text}`}>{player.first_name} {player.last_name}</p>
                      <p className={`text-sm ${tc.textMuted}`}>
                        {player.jersey_number && `#${player.jersey_number} • `}
                        {player.position || 'Player'}
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
            </div>
          )}
          
          {activeTab === 'schedule' && (
            <div className={`${tc.cardBg} border ${tc.border} rounded-2xl overflow-hidden`}>
              <div className={`p-4 border-b ${tc.border}`}>
                <h2 className={`font-semibold ${tc.text}`}>Upcoming Events</h2>
              </div>
              <div className="divide-y divide-gray-700/50">
                {upcomingEvents.map(event => {
                  const eventDate = new Date(event.event_date)
                  return (
                    <div 
                      key={event.id}
                      onClick={() => setShowEventDetail(event)}
                      className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition"
                    >
                      <div className="text-center min-w-[50px]">
                        <p className={`text-xs ${tc.textMuted} uppercase`}>
                          {eventDate.toLocaleDateString('en-US', { weekday: 'short' })}
                        </p>
                        <p className={`text-2xl font-bold ${tc.text}`}>{eventDate.getDate()}</p>
                        <p className={`text-xs ${tc.textMuted}`}>
                          {eventDate.toLocaleDateString('en-US', { month: 'short' })}
                        </p>
                      </div>
                      <div className="flex-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          event.event_type === 'game' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {event.event_type === 'game' ? '🏐 Game' : '🏋️ Practice'}
                        </span>
                        <p className={`font-medium ${tc.text} mt-1`}>
                          {event.title || event.event_type}
                          {event.opponent && ` vs ${event.opponent}`}
                        </p>
                        <p className={`text-sm ${tc.textMuted}`}>
                          {event.event_time && formatTime12(event.event_time)}
                          {event.venues?.name && ` • ${event.venues.name}`}
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
            </div>
          )}
          
          {activeTab === 'documents' && (
            <div className={`${tc.cardBg} border ${tc.border} rounded-2xl overflow-hidden`}>
              <div className={`p-4 border-b ${tc.border}`}>
                <h2 className={`font-semibold ${tc.text}`}>Team Documents</h2>
              </div>
              <div className="divide-y divide-gray-700/50">
                {documents.map(doc => (
                  <a 
                    key={doc.id}
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 flex items-center gap-4 hover:bg-white/5 transition"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${tc.text}`}>{doc.name}</p>
                      <p className={`text-sm ${tc.textMuted}`}>
                        {doc.category} • {new Date(doc.created_at).toLocaleDateString()}
                      </p>
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
            </div>
          )}
        </div>

        {/* Sidebar - 1 col */}
        <div className="space-y-6">
          {/* Coaches Card */}
          <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5`}>
            <h3 className={`font-semibold ${tc.text} mb-4 flex items-center gap-2`}>
              🎓 Coaches
            </h3>
            <div className="space-y-3">
              {coaches.map(coach => (
                <div key={coach.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
                    {coach.full_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className={`font-medium ${tc.text}`}>{coach.full_name}</p>
                    <p className={`text-xs ${tc.textMuted}`}>
                      {coach.role === 'head' ? 'Head Coach' : coach.role === 'assistant' ? 'Assistant Coach' : 'Coach'}
                    </p>
                  </div>
                </div>
              ))}
              {coaches.length === 0 && (
                <p className={tc.textMuted}>No coaches assigned</p>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5`}>
            <h3 className={`font-semibold ${tc.text} mb-4 flex items-center gap-2`}>
              📊 Team Stats
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-xl bg-blue-500/10">
                <p className="text-2xl font-bold text-blue-400">{roster.length}</p>
                <p className={`text-xs ${tc.textMuted}`}>Players</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-amber-500/10">
                <p className="text-2xl font-bold text-amber-400">{coaches.length}</p>
                <p className={`text-xs ${tc.textMuted}`}>Coaches</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-emerald-500/10">
                <p className="text-2xl font-bold text-emerald-400">{upcomingEvents.length}</p>
                <p className={`text-xs ${tc.textMuted}`}>Upcoming</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-purple-500/10">
                <p className="text-2xl font-bold text-purple-400">{posts.length}</p>
                <p className={`text-xs ${tc.textMuted}`}>Posts</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Post Modal */}
      {showNewPostModal && (
        <NewPostModal
          teamId={teamId}
          onClose={() => setShowNewPostModal(false)}
          onSuccess={() => { loadPosts(1, true); setShowNewPostModal(false) }}
          showToast={showToast}
          canPin={profile?.role === 'admin' || profile?.role === 'coach'}
        />
      )}

      {/* Player Card Expanded Modal */}
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

// ============================================
// NEW POST MODAL
// ============================================
function NewPostModal({ teamId, onClose, onSuccess, showToast, canPin = false }) {
  const { user } = useAuth()
  const tc = useThemeClasses()
  
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [postType, setPostType] = useState('announcement')
  const [isPinned, setIsPinned] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  async function handleSubmit(e) {
    e.preventDefault()
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div 
        className={`${tc.cardBg} border ${tc.border} rounded-2xl w-full max-w-lg`}
        onClick={e => e.stopPropagation()}
      >
        <div className={`p-6 border-b ${tc.border} flex items-center justify-between`}>
          <h2 className={`text-xl font-semibold ${tc.text}`}>Create Post</h2>
          <button onClick={onClose} className={`p-2 rounded-lg ${tc.hoverBg}`}>
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={`block text-sm font-medium ${tc.text} mb-1`}>Post Type</label>
            <select
              value={postType}
              onChange={e => setPostType(e.target.value)}
              className={`w-full px-4 py-2 rounded-xl ${tc.input}`}
            >
              <option value="announcement">📢 Announcement</option>
              <option value="game_recap">🏐 Game Recap</option>
              <option value="shoutout">⭐ Player Shoutout</option>
              <option value="milestone">🏆 Team Milestone</option>
              <option value="photo">📷 Photo</option>
            </select>
          </div>
          
          <div>
            <label className={`block text-sm font-medium ${tc.text} mb-1`}>Title (optional)</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Give your post a title..."
              className={`w-full px-4 py-2 rounded-xl ${tc.input}`}
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium ${tc.text} mb-1`}>Content</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="What's happening with the team?"
              rows={4}
              className={`w-full px-4 py-2 rounded-xl ${tc.input} resize-none`}
              required
            />
          </div>
          
          {canPin && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={e => setIsPinned(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className={`text-sm ${tc.text}`}>📌 Pin this post to the top</span>
            </label>
          )}
          
          <div className={`flex gap-3 pt-4 border-t ${tc.border}`}>
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-2 rounded-xl border ${tc.border} ${tc.text}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!content.trim() || submitting}
              className="flex-1 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold disabled:opacity-50 hover:brightness-110 transition"
            >
              {submitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export { TeamWallPage }
