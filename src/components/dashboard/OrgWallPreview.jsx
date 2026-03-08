// =============================================================================
// OrgWallPreview — 3 recent team wall posts preview
// =============================================================================

import { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { MessageCircle, Heart, ChevronRight } from 'lucide-react'

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const d = new Date(dateStr)
  const diffMin = Math.round((now - d) / 60000)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  const diffD = Math.round(diffH / 24)
  return `${diffD}d ago`
}

export default function OrgWallPreview({ seasonId, onNavigate }) {
  const { isDark } = useTheme()
  const [posts, setPosts] = useState([])

  useEffect(() => {
    if (!seasonId) return
    async function load() {
      // Query copied from TeamWallPage.jsx loadPosts (lines 310-318)
      const { data } = await supabase
        .from('team_posts')
        .select('id, content, created_at, post_type, team_id, teams(name, color), profiles:author_id(id, full_name, avatar_url)')
        .eq('is_published', true)
        .neq('post_type', 'shoutout')
        .order('created_at', { ascending: false })
        .limit(3)
      setPosts(data || [])
    }
    load()
  }, [seasonId])

  const cardBg = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-brand-border'

  return (
    <div className={`${cardBg} rounded-2xl shadow-sm p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <MessageCircle className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <h3 className={`text-r-lg font-bold uppercase tracking-[1.2px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Team Wall
          </h3>
        </div>
        <button
          onClick={() => onNavigate?.('teams')}
          className="text-r-base text-lynx-sky font-medium flex items-center gap-1"
        >
          View <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-4">
          <p className={`text-r-lg ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No recent posts</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} className={`p-2.5 rounded-lg ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-r-base font-bold text-white"
                  style={{ backgroundColor: post.teams?.color || '#4BB9EC' }}
                >
                  {(post.profiles?.full_name || '?').charAt(0).toUpperCase()}
                </div>
                <span className={`text-r-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {post.profiles?.full_name || 'Coach'}
                </span>
                <span className={`text-r-lg ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                  {timeAgo(post.created_at)}
                </span>
                {post.teams?.name && (
                  <span
                    className="text-r-base font-bold px-1.5 py-0.5 rounded-md ml-auto"
                    style={{
                      color: post.teams.color || '#4BB9EC',
                      backgroundColor: `${post.teams.color || '#4BB9EC'}15`,
                    }}
                  >
                    {post.teams.name}
                  </span>
                )}
              </div>
              <p className={`text-r-base line-clamp-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {post.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
