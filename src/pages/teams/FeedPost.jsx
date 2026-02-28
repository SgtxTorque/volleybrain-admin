import { useState, useEffect, useRef } from 'react'
import { MoreVertical, Trash2, Edit, MessageCircle, Share2 } from '../../constants/icons'
import { CommentSection } from '../../components/teams/CommentSection'
import { ReactionBar } from '../../components/teams/ReactionBar'
import PhotoLightbox from '../../components/common/PhotoLightbox'
import ShoutoutCard, { parseShoutoutMetadata } from '../../components/engagement/ShoutoutCard'

// ═══════════════════════════════════════════════════════════
// FEED POST — Social media card with Facebook-style photo grid
// ═══════════════════════════════════════════════════════════
function FeedPost({ post, g, gb, i, isDark, onCommentCountChange, onReactionCountChange, onDelete, onTogglePin, onEdit, isAdminOrCoach, currentUserId }) {
  const isPinned = post.is_pinned
  const postType = post.post_type || 'announcement'

  // Normalize media_urls — handle string, JSON string, or array
  const mediaUrls = (() => {
    const raw = post.media_urls
    if (!raw) return []
    if (Array.isArray(raw)) return raw
    if (typeof raw === 'string') {
      try { const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : [] } catch { return [] }
    }
    return []
  })()

  // Detect JSON metadata in title (shoutouts, milestones, level-ups store JSON here)
  const titleIsJson = (() => {
    if (!post.title || typeof post.title !== 'string') return false
    const trimmed = post.title.trim()
    return trimmed.startsWith('{') && trimmed.endsWith('}')
  })()

  const shoutoutMeta = postType === 'shoutout' ? parseShoutoutMetadata(post.title) : null
  const milestoneMeta = (postType === 'milestone' && titleIsJson) ? (() => {
    try { return JSON.parse(post.title) } catch { return null }
  })() : null
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

  // ═══ FACEBOOK-STYLE PHOTO GRID ═══
  function renderPhotoGrid() {
    const count = mediaUrls.length
    if (count === 0) return null

    // Single image — full width, natural aspect ratio
    if (count === 1) {
      return (
        <div className="px-4 pb-4">
          <div
            className="rounded-xl overflow-hidden cursor-pointer hover:brightness-95 transition"
            onClick={() => setLightboxIdx(0)}
          >
            <img src={mediaUrls[0]} alt="" className="w-full h-auto block" />
          </div>
        </div>
      )
    }

    // Two images — side by side, equal height
    if (count === 2) {
      return (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
            {mediaUrls.map((url, idx) => (
              <div
                key={idx}
                className="aspect-square cursor-pointer hover:brightness-95 transition"
                onClick={() => setLightboxIdx(idx)}
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )
    }

    // Three images — 1 large left, 2 stacked right
    if (count === 3) {
      return (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden" style={{ height: 320 }}>
            <div
              className="row-span-2 cursor-pointer hover:brightness-95 transition"
              onClick={() => setLightboxIdx(0)}
            >
              <img src={mediaUrls[0]} alt="" className="w-full h-full object-cover" />
            </div>
            <div
              className="cursor-pointer hover:brightness-95 transition"
              onClick={() => setLightboxIdx(1)}
            >
              <img src={mediaUrls[1]} alt="" className="w-full h-full object-cover" />
            </div>
            <div
              className="cursor-pointer hover:brightness-95 transition"
              onClick={() => setLightboxIdx(2)}
            >
              <img src={mediaUrls[2]} alt="" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      )
    }

    // Four images — 2x2 grid
    if (count === 4) {
      return (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
            {mediaUrls.map((url, idx) => (
              <div
                key={idx}
                className="aspect-square cursor-pointer hover:brightness-95 transition"
                onClick={() => setLightboxIdx(idx)}
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )
    }

    // Five+ images — 2x2 grid, last cell has +N overlay
    return (
      <div className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
          {mediaUrls.slice(0, 4).map((url, idx) => (
            <div
              key={idx}
              className="aspect-square cursor-pointer hover:brightness-95 transition relative"
              onClick={() => setLightboxIdx(idx)}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
              {idx === 3 && count > 4 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">+{count - 4}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

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

      {/* Content — before photos like Facebook */}
      <div className="px-6 pb-3">
        {shoutoutMeta ? (
          <ShoutoutCard
            metadataJson={post.title}
            giverName={post.profiles?.full_name || 'Someone'}
            createdAt={post.created_at}
            isDark={isDark}
          />
        ) : milestoneMeta ? (
          <div className="rounded-xl overflow-hidden" style={{ border: `1.5px solid ${milestoneMeta.tierColor || milestoneMeta.achievementColor || g}`, background: `${milestoneMeta.tierColor || g}08` }}>
            <div className="h-1" style={{ background: milestoneMeta.tierColor || g }} />
            <div className="p-5 flex flex-col items-center gap-2.5">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
                style={{ background: `${milestoneMeta.tierColor || g}20`, color: milestoneMeta.tierColor || g }}>
                {milestoneMeta.type === 'level_up' ? '⬆️' : '🏆'} {milestoneMeta.type === 'level_up' ? 'Level Up' : 'Achievement'}
              </div>
              <span className="text-5xl my-1">{milestoneMeta.achievementIcon || '🏆'}</span>
              <p className="text-[15px] font-medium text-center leading-relaxed" style={{ color: isDark ? 'white' : '#1a1a1a' }}>
                {post.content}
              </p>
            </div>
          </div>
        ) : (
          <>
            {post.title && !titleIsJson && (
              <h3 className="font-bold text-[16px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: isDark ? 'white' : '#1a1a1a' }}>{post.title}</h3>
            )}
            {post.content && (
              <p className="text-[14px] leading-relaxed whitespace-pre-wrap" style={{ color: isDark ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.55)' }}>{post.content}</p>
            )}
          </>
        )}
      </div>

      {/* Media — Facebook-style photo grid */}
      {renderPhotoGrid()}

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <PhotoLightbox
          photos={mediaUrls}
          initialIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}

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
