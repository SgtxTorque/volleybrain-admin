import { useState, useEffect, useRef } from 'react'
import { MoreVertical, Trash2, Edit, MessageCircle, Share2, Maximize2 } from '../../constants/icons'
import { CommentSection } from '../../components/teams/CommentSection'
import { ReactionBar } from '../../components/teams/ReactionBar'
import { Lightbox } from '../../components/teams/PhotoGallery'

// ═══════════════════════════════════════════════════════════
// FEED POST — Social media card with cheer animation
// ═══════════════════════════════════════════════════════════
function FeedPost({ post, g, gb, i, isDark, onCommentCountChange, onReactionCountChange, onDelete, onTogglePin, onEdit, isAdminOrCoach, currentUserId }) {
  const isPinned = post.is_pinned
  const postType = post.post_type || 'announcement'
  const [localCommentCount, setLocalCommentCount] = useState(post.comment_count || 0)
  const [localReactionCount, setLocalReactionCount] = useState(post.reaction_count || 0)
  const [lightboxIdx, setLightboxIdx] = useState(null)
  const [showMenu, setShowMenu] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(post.title || '')
  const [editContent, setEditContent] = useState(post.content || '')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const menuRef = useRef(null)

  const canModify = isAdminOrCoach || post.author_id === currentUserId

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showMenu])

  const accentClass = postType === 'milestone' ? 'tw-badge-accent' :
    postType === 'game_recap' ? 'tw-reminder-accent' :
    postType === 'shoutout' ? 'tw-badge-accent' :
    postType === 'challenge' ? 'tw-auto-accent' : ''

  const typeIcon = {
    announcement: '📢', game_recap: '🏐', shoutout: '⭐', milestone: '🏆', photo: '📷', challenge: '🏆',
  }[postType] || '📝'

  return (
    <article className={`tw-glass overflow-hidden tw-ac ${accentClass}`} style={{ animationDelay: `${.1 + i * .05}s` }}>
      {/* Post Header — Instagram style */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Avatar with gradient ring */}
          <div className="p-[2px] rounded-xl" style={{ background: `linear-gradient(135deg, ${g}, ${gb})` }}>
            <div className="w-11 h-11 rounded-[14px] flex items-center justify-center text-base font-bold overflow-hidden"
              style={{ background: isDark ? 'rgb(15,23,42)' : '#fff', color: isDark ? 'white' : '#1a1a1a' }}>
              {post.profiles?.avatar_url ? (
                <img src={post.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                post.profiles?.full_name?.charAt(0) || '?'
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <p className="font-bold text-[15px]" style={{ color: isDark ? 'white' : '#1a1a1a' }}>
                {post.profiles?.full_name || 'Team Admin'}
              </p>
              <span className="text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg"
                style={{ background: `${g}10`, color: `${g}99` }}>
                {typeIcon} {postType.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <p className="text-[11px] mt-0.5" style={{ color: isDark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.3)' }}>
              {new Date(post.created_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isPinned && <span className="text-sm" style={{ color: `${g}60` }}>📌</span>}
          {canModify && (
            <div className="relative" ref={menuRef}>
              <button onClick={() => setShowMenu(!showMenu)}
                className="w-10 h-10 rounded-full flex items-center justify-center transition"
                style={{ color: isDark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.15)' }}
                onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <MoreVertical className="w-5 h-5" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-1 z-40 py-1.5 rounded-xl shadow-xl min-w-[160px]"
                  style={{
                    background: isDark ? 'rgba(15,23,42,.95)' : 'rgba(255,255,255,.97)',
                    border: isDark ? '1px solid rgba(255,255,255,.1)' : '1px solid rgba(0,0,0,.08)',
                    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                  }}>
                  {(post.author_id === currentUserId || isAdminOrCoach) && (
                    <button onClick={() => { setEditing(true); setShowMenu(false) }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs transition-colors text-left"
                      style={{ color: isDark ? 'rgba(255,255,255,.6)' : 'rgba(0,0,0,.6)' }}
                      onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <Edit className="w-3.5 h-3.5" /> Edit Post
                    </button>
                  )}
                  {isAdminOrCoach && (
                    <button onClick={() => { onTogglePin?.(post.id, post.is_pinned); setShowMenu(false) }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs transition-colors text-left"
                      style={{ color: isDark ? 'rgba(255,255,255,.6)' : 'rgba(0,0,0,.6)' }}
                      onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      📌 {post.is_pinned ? 'Unpin Post' : 'Pin to Top'}
                    </button>
                  )}
                  <div style={{ borderTop: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.06)', margin: '4px 0' }} />
                  <button onClick={() => { setConfirmDelete(true); setShowMenu(false) }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs transition-colors text-left text-red-400"
                    onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <Trash2 className="w-3.5 h-3.5" /> Delete Post
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Media — Cinematic with Lightbox */}
      {post.media_urls?.length > 0 && (
        <div className="px-4 pb-4">
          <div className={`grid ${post.media_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
            {post.media_urls.map((url, idx) => (
              <div key={idx} onClick={() => setLightboxIdx(idx)} className="relative rounded-xl overflow-hidden group cursor-pointer" style={{ height: post.media_urls.length === 1 ? 320 : 200 }}>
                <img src={url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition">
                  <div className="absolute bottom-3 right-3">
                    <Maximize2 className="w-5 h-5 text-white/70" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {lightboxIdx !== null && (
            <Lightbox images={post.media_urls} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
          )}
        </div>
      )}

      {/* Content */}
      <div className="px-6 pb-4">
        {post.title && (
          <h3 className="font-bold text-[16px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: isDark ? 'white' : '#1a1a1a' }}>{post.title}</h3>
        )}
        <p className="text-[14px] leading-relaxed whitespace-pre-wrap" style={{ color: isDark ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.55)' }}>{post.content}</p>
      </div>

      {/* Interaction Bar — Cheers + Comments + Share */}
      <div className="px-6 pb-6">
        <div className="flex items-center justify-between pt-4" style={{ borderTop: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.06)' }}>
          <div className="flex items-center gap-6">
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

            <div className="flex items-center gap-2.5">
              <MessageCircle className="w-6 h-6" style={{ color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.3)' }} />
              <div className="text-left">
                <p className="text-sm font-bold" style={{ color: isDark ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.5)' }}>{localCommentCount}</p>
                <p className="text-[8px] font-bold uppercase tracking-wider leading-none" style={{ color: isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.2)' }}>COMMENTS</p>
              </div>
            </div>
          </div>

          <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider transition"
            style={{ color: isDark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.15)' }}
            onMouseEnter={e => e.currentTarget.style.color = isDark ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.5)'}
            onMouseLeave={e => e.currentTarget.style.color = isDark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.15)'}>
            <Share2 className="w-4 h-4" /> SHARE
          </button>
        </div>
      </div>

      {/* Comments */}
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

      {/* Edit Post Overlay */}
      {editing && (
        <div className="px-6 pb-5">
          <div className="rounded-xl p-4" style={{ background: isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.02)', border: isDark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(0,0,0,.06)' }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: g }}>EDIT POST</p>
            <input
              type="text"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              placeholder="Title (optional)"
              className="w-full px-3 py-2 rounded-lg text-sm mb-2 bg-transparent outline-none"
              style={{ border: isDark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(0,0,0,.06)', color: isDark ? 'white' : '#333' }}
            />
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg text-sm bg-transparent outline-none resize-none"
              style={{ border: isDark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(0,0,0,.06)', color: isDark ? 'white' : '#333' }}
            />
            <div className="flex gap-2 mt-3">
              <button onClick={() => setEditing(false)}
                className="px-4 py-1.5 rounded-lg text-xs" style={{ border: isDark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(0,0,0,.06)', color: isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)' }}>
                Cancel
              </button>
              <button onClick={() => {
                onEdit?.(post.id, editContent.trim(), editTitle.trim())
                setEditing(false)
              }}
                disabled={!editContent.trim()}
                className="px-4 py-1.5 rounded-lg text-xs font-bold transition hover:brightness-110 disabled:opacity-30"
                style={{ background: g, color: '#0f172a' }}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="px-6 pb-5">
          <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)' }}>
            <p className="text-xs text-red-400">Delete this post permanently?</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="px-3 py-1 rounded-lg text-xs" style={{ color: isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)' }}>
                Cancel
              </button>
              <button onClick={() => onDelete?.(post.id)} className="px-3 py-1 rounded-lg text-xs font-bold bg-red-500 text-white hover:bg-red-600 transition">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}

export default FeedPost
