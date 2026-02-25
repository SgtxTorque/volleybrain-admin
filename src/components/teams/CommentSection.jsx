import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Send, Trash2, ChevronDown, ChevronUp, CornerDownRight } from 'lucide-react'

// ============================================
// COMMENT SECTION — Inline comments for Team Hub posts
// ============================================

const COLLAPSE_THRESHOLD = 2

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function CommentItem({ comment, isDark, g, canDelete, onDelete, onReply, isReply = false }) {
  const [confirming, setConfirming] = useState(false)

  return (
    <div className={`flex gap-3 ${isReply ? 'ml-8' : ''}`}>
      {isReply && (
        <CornerDownRight className="w-3.5 h-3.5 flex-shrink-0 mt-2" style={{ color: isDark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.12)' }} />
      )}
      {/* Avatar */}
      <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold overflow-hidden"
        style={{ background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)', color: isDark ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.4)' }}>
        {comment.profiles?.avatar_url ? (
          <img src={comment.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          comment.profiles?.full_name?.charAt(0) || '?'
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: isDark ? 'rgba(255,255,255,.7)' : 'rgba(0,0,0,.7)' }}>
            {comment.profiles?.full_name || 'Unknown'}
          </span>
          <span className="text-[10px]" style={{ color: isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.2)' }}>
            {timeAgo(comment.created_at)}
          </span>
        </div>
        <p className="text-[13px] leading-relaxed mt-0.5" style={{ color: isDark ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.55)' }}>
          {comment.content}
        </p>
        <div className="flex items-center gap-3 mt-1">
          {!isReply && (
            <button
              onClick={() => onReply(comment.id, comment.profiles?.full_name)}
              className="text-[10px] font-semibold tracking-wide transition-colors hover:underline"
              style={{ color: isDark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.25)' }}
            >
              REPLY
            </button>
          )}
          {canDelete && (
            confirming ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { onDelete(comment.id); setConfirming(false) }}
                  className="text-[10px] font-semibold text-red-400 hover:text-red-300"
                >
                  DELETE
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="text-[10px] font-semibold" style={{ color: isDark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.25)' }}
                >
                  CANCEL
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirming(true)} className="opacity-0 group-hover/comment:opacity-100 transition-opacity">
                <Trash2 className="w-3 h-3" style={{ color: isDark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.15)' }} />
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
}

export function CommentSection({ postId, commentCount = 0, isDark, g, onCountChange }) {
  const { user, profile } = useAuth()
  const isAdmin = profile?.role === 'admin'

  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replyTo, setReplyTo] = useState(null) // { id, name }
  const [localCount, setLocalCount] = useState(commentCount)

  // Load comments when expanded
  const loadComments = useCallback(async () => {
    if (!postId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('team_post_comments')
        .select('*, profiles:author_id(id, full_name, avatar_url)')
        .eq('post_id', postId)
        .is('is_deleted', false)
        .order('created_at', { ascending: true })

      if (error) throw error
      setComments(data || [])
    } catch (err) {
      console.error('Error loading comments:', err)
    }
    setLoading(false)
  }, [postId])

  useEffect(() => {
    if (expanded) loadComments()
  }, [expanded, loadComments])

  // Submit comment
  async function handleSubmit(e) {
    e?.preventDefault()
    if (!text.trim() || submitting) return
    setSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('team_post_comments')
        .insert({
          post_id: postId,
          author_id: user?.id,
          content: text.trim(),
          parent_comment_id: replyTo?.id || null,
        })
        .select('*, profiles:author_id(id, full_name, avatar_url)')
        .single()

      if (error) throw error

      setComments(prev => [...prev, data])
      setText('')
      setReplyTo(null)
      const newCount = localCount + 1
      setLocalCount(newCount)
      onCountChange?.(newCount)

      // Update count in team_posts
      await supabase
        .from('team_posts')
        .update({ comment_count: newCount })
        .eq('id', postId)
    } catch (err) {
      console.error('Error posting comment:', err)
    }
    setSubmitting(false)
  }

  // Delete comment
  async function handleDelete(commentId) {
    try {
      await supabase
        .from('team_post_comments')
        .update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: user?.id })
        .eq('id', commentId)

      setComments(prev => prev.filter(c => c.id !== commentId))
      const newCount = Math.max(0, localCount - 1)
      setLocalCount(newCount)
      onCountChange?.(newCount)

      await supabase
        .from('team_posts')
        .update({ comment_count: newCount })
        .eq('id', postId)
    } catch (err) {
      console.error('Error deleting comment:', err)
    }
  }

  // Organize into threads
  const topLevel = comments.filter(c => !c.parent_comment_id)
  const replies = comments.filter(c => c.parent_comment_id)
  const replyMap = {}
  replies.forEach(r => {
    if (!replyMap[r.parent_comment_id]) replyMap[r.parent_comment_id] = []
    replyMap[r.parent_comment_id].push(r)
  })

  const visibleComments = expanded ? topLevel : topLevel.slice(0, COLLAPSE_THRESHOLD)
  const hiddenCount = topLevel.length - COLLAPSE_THRESHOLD

  return (
    <div className="px-6 pb-5">
      {/* Expand/collapse toggle */}
      {localCount > 0 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide mb-3 transition-colors"
          style={{ color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.3)' }}
        >
          <ChevronDown className="w-3.5 h-3.5" />
          {localCount === 1 ? 'View 1 comment' : `View all ${localCount} comments`}
        </button>
      )}

      {/* Comments list */}
      {expanded && (
        <div className="space-y-4 mb-4">
          {loading ? (
            <div className="flex items-center gap-2 py-2">
              <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: g, borderTopColor: 'transparent' }} />
              <span className="text-[11px]" style={{ color: isDark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.25)' }}>Loading comments...</span>
            </div>
          ) : visibleComments.length === 0 ? (
            <p className="text-[12px] py-2" style={{ color: isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.2)' }}>No comments yet. Be the first!</p>
          ) : (
            <>
              {visibleComments.map(comment => (
                <div key={comment.id} className="group/comment">
                  <CommentItem
                    comment={comment}
                    isDark={isDark}
                    g={g}
                    canDelete={isAdmin || comment.author_id === user?.id}
                    onDelete={handleDelete}
                    onReply={(id, name) => setReplyTo({ id, name })}
                  />
                  {/* Threaded replies */}
                  {replyMap[comment.id]?.map(reply => (
                    <div key={reply.id} className="group/comment mt-2">
                      <CommentItem
                        comment={reply}
                        isDark={isDark}
                        g={g}
                        canDelete={isAdmin || reply.author_id === user?.id}
                        onDelete={handleDelete}
                        onReply={() => {}}
                        isReply
                      />
                    </div>
                  ))}
                </div>
              ))}

              {!expanded && hiddenCount > 0 && (
                <button
                  onClick={() => setExpanded(true)}
                  className="text-[11px] font-semibold"
                  style={{ color: g }}
                >
                  View {hiddenCount} more {hiddenCount === 1 ? 'comment' : 'comments'}
                </button>
              )}
            </>
          )}

          {expanded && topLevel.length > COLLAPSE_THRESHOLD && (
            <button
              onClick={() => setExpanded(false)}
              className="flex items-center gap-1 text-[11px] font-semibold tracking-wide transition-colors"
              style={{ color: isDark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.25)' }}
            >
              <ChevronUp className="w-3.5 h-3.5" />
              Collapse
            </button>
          )}
        </div>
      )}

      {/* Reply indicator */}
      {replyTo && (
        <div className="flex items-center gap-2 mb-2 px-1">
          <CornerDownRight className="w-3 h-3" style={{ color: g }} />
          <span className="text-[11px]" style={{ color: g }}>
            Replying to {replyTo.name}
          </span>
          <button onClick={() => setReplyTo(null)} className="text-[10px] ml-1" style={{ color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.3)' }}>
            ✕
          </button>
        </div>
      )}

      {/* Comment input */}
      {user && (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-bold overflow-hidden"
            style={{ background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)', color: isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.35)' }}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              profile?.full_name?.charAt(0) || '?'
            )}
          </div>
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={replyTo ? `Reply to ${replyTo.name}...` : 'Add a comment...'}
            className="flex-1 text-[13px] bg-transparent outline-none py-2 px-3 rounded-xl transition-colors"
            style={{
              background: isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)',
              border: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.06)',
              color: isDark ? 'white' : '#333',
            }}
          />
          <button
            type="submit"
            disabled={!text.trim() || submitting}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
            style={{
              background: text.trim() ? g : 'transparent',
              color: text.trim() ? 'white' : (isDark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.15)'),
              opacity: submitting ? 0.5 : 1,
            }}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      )}
    </div>
  )
}
