// =============================================================================
// TeamWallPreviewCard — 3 recent team wall posts
// =============================================================================

import { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { MessageCircle, ChevronRight } from 'lucide-react'

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const d = new Date(dateStr)
  const diffMin = Math.round((now - d) / 60000)
  if (diffMin < 60) return `${diffMin}m`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `${diffH}h`
  return `${Math.round(diffH / 24)}d`
}

export default function TeamWallPreviewCard({ teamId, navigateToTeamWall }) {
  const { isDark } = useTheme()
  const [posts, setPosts] = useState([])

  useEffect(() => {
    if (!teamId) return
    async function load() {
      // Query copied from TeamWallPage.jsx loadPosts (lines 310-318)
      const { data } = await supabase
        .from('team_posts')
        .select('id, content, created_at, post_type, profiles:author_id(id, full_name, avatar_url)')
        .eq('team_id', teamId)
        .eq('is_published', true)
        .neq('post_type', 'shoutout')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(3)
      setPosts(data || [])
    }
    load()
  }, [teamId])

  const cardBg = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-brand-border'

  return (
    <div className={`${cardBg} rounded-2xl shadow-sm p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <MessageCircle className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <h3 className={`text-[10px] font-bold uppercase tracking-[1.2px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Team Wall
          </h3>
        </div>
        <button onClick={() => navigateToTeamWall?.(teamId)} className="text-xs text-lynx-sky font-medium flex items-center gap-1">
          Open <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-3">
          <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No posts yet</p>
          <button onClick={() => navigateToTeamWall?.(teamId)} className="text-xs text-lynx-sky font-semibold mt-1">
            Post to your team
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map(post => (
            <div key={post.id} className={`p-2 rounded-lg ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {post.profiles?.full_name || 'Coach'}
                </span>
                <span className={`text-[10px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                  {timeAgo(post.created_at)}
                </span>
              </div>
              <p className={`text-xs line-clamp-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {post.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
