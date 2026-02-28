import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

// ============================================
// REACTION BAR — Emoji reaction picker for Team Hub posts
// ============================================

const REACTION_EMOJIS = [
  { type: 'like', emoji: '👍', label: 'Like' },
  { type: 'love', emoji: '❤️', label: 'Love' },
  { type: 'fire', emoji: '🔥', label: 'Fire' },
  { type: 'volleyball', emoji: '🏐', label: 'Volleyball' },
  { type: 'star', emoji: '⭐', label: 'Star' },
  { type: 'clap', emoji: '👏', label: 'Clap' },
]

export function ReactionBar({ postId, reactionCount = 0, isDark, g, onCountChange }) {
  const { user } = useAuth()
  const [reactions, setReactions] = useState({})     // { type: count }
  const [myReaction, setMyReaction] = useState(null)  // reaction_type string
  const [showPicker, setShowPicker] = useState(false)
  const [loading, setLoading] = useState(false)
  const pickerRef = useRef(null)
  const timerRef = useRef(null)

  // Load reactions for this post
  const loadReactions = useCallback(async () => {
    if (!postId) return
    try {
      const { data, error } = await supabase
        .from('post_reactions')
        .select('id, user_id, reaction_type')
        .eq('post_id', postId)

      if (error) throw error

      // Group by type
      const grouped = {}
      let mine = null
      ;(data || []).forEach(r => {
        grouped[r.reaction_type] = (grouped[r.reaction_type] || 0) + 1
        if (r.user_id === user?.id) mine = r.reaction_type
      })
      setReactions(grouped)
      setMyReaction(mine)
    } catch (err) {
      console.error('Error loading reactions:', err)
    }
  }, [postId, user?.id])

  useEffect(() => {
    loadReactions()
  }, [loadReactions])

  // Close picker on click outside
  useEffect(() => {
    if (!showPicker) return
    const handleClick = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showPicker])

  async function handleReaction(type) {
    if (loading || !user) return
    setLoading(true)
    setShowPicker(false)

    try {
      if (myReaction === type) {
        // Remove reaction
        await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)

        setReactions(prev => {
          const updated = { ...prev }
          updated[type] = Math.max(0, (updated[type] || 1) - 1)
          if (updated[type] === 0) delete updated[type]
          return updated
        })
        setMyReaction(null)
        const newCount = Math.max(0, (reactionCount || 1) - 1)
        onCountChange?.(newCount)

        await supabase
          .from('team_posts')
          .update({ reaction_count: newCount })
          .eq('id', postId)
      } else if (myReaction) {
        // Change reaction type — delete old then insert new
        await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)

        await supabase
          .from('post_reactions')
          .insert({ post_id: postId, user_id: user.id, reaction_type: type })

        setReactions(prev => {
          const updated = { ...prev }
          updated[myReaction] = Math.max(0, (updated[myReaction] || 1) - 1)
          if (updated[myReaction] === 0) delete updated[myReaction]
          updated[type] = (updated[type] || 0) + 1
          return updated
        })
        setMyReaction(type)
        // Count doesn't change — just swapped type
      } else {
        // Add new reaction
        await supabase
          .from('post_reactions')
          .insert({ post_id: postId, user_id: user.id, reaction_type: type })

        setReactions(prev => ({
          ...prev,
          [type]: (prev[type] || 0) + 1,
        }))
        setMyReaction(type)
        const newCount = (reactionCount || 0) + 1
        onCountChange?.(newCount)

        await supabase
          .from('team_posts')
          .update({ reaction_count: newCount })
          .eq('id', postId)
      }
    } catch (err) {
      console.error('Error toggling reaction:', err)
      // Refresh to get correct state
      loadReactions()
    }
    setLoading(false)
  }

  const totalReactions = Object.values(reactions).reduce((a, b) => a + b, 0)
  const activeEmojis = REACTION_EMOJIS.filter(r => reactions[r.type] > 0)
  const myEmoji = REACTION_EMOJIS.find(r => r.type === myReaction)

  return (
    <div className="relative flex items-center gap-3">
      {/* Reaction summary pills */}
      {activeEmojis.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {activeEmojis.map(r => (
            <button
              key={r.type}
              onClick={() => handleReaction(r.type)}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all"
              style={{
                background: myReaction === r.type
                  ? (isDark ? `${g}20` : `${g}15`)
                  : (isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)'),
                border: `1px solid ${myReaction === r.type ? `${g}40` : (isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)')}`,
              }}
            >
              <span className="text-sm">{r.emoji}</span>
              <span style={{ color: myReaction === r.type ? g : (isDark ? 'rgba(255,255,255,.6)' : 'rgba(0,0,0,.55)') }}>
                {reactions[r.type]}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Add reaction / main button */}
      <div className="relative" ref={pickerRef}>
        <button
          onClick={() => {
            if (myReaction) {
              // Quick toggle off
              handleReaction(myReaction)
            } else {
              setShowPicker(prev => !prev)
            }
          }}
          onMouseEnter={() => {
            if (!myReaction) {
              timerRef.current = setTimeout(() => setShowPicker(true), 400)
            }
          }}
          onMouseLeave={() => clearTimeout(timerRef.current)}
          className="flex items-center gap-2 transition-all group"
        >
          <span className={`text-xl transition-transform ${myReaction ? 'scale-110' : 'group-hover:scale-110'}`}>
            {myEmoji?.emoji || '👍'}
          </span>
          {totalReactions > 0 && (
            <div className="text-left">
              <p className="text-sm font-bold" style={{ color: myReaction ? g : (isDark ? 'rgba(255,255,255,.7)' : 'rgba(0,0,0,.6)') }}>{totalReactions}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider leading-none" style={{ color: isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)' }}>
                {totalReactions === 1 ? 'REACTION' : 'REACTIONS'}
              </p>
            </div>
          )}
          {totalReactions === 0 && (
            <div className="text-left">
              <p className="text-sm font-bold" style={{ color: isDark ? 'rgba(255,255,255,.7)' : 'rgba(0,0,0,.6)' }}>0</p>
              <p className="text-[10px] font-bold uppercase tracking-wider leading-none" style={{ color: isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)' }}>REACTIONS</p>
            </div>
          )}
        </button>

        {/* Emoji Picker Popup */}
        {showPicker && (
          <div
            className="absolute bottom-full left-0 mb-2 flex items-center gap-1 px-2 py-1.5 rounded-xl shadow-xl z-20"
            style={{
              background: isDark ? 'rgba(15,23,42,.95)' : 'rgba(255,255,255,.97)',
              border: isDark ? '1px solid rgba(255,255,255,.1)' : '1px solid rgba(0,0,0,.08)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              animation: 'scaleIn 0.15s ease-out',
            }}
          >
            {REACTION_EMOJIS.map(r => (
              <button
                key={r.type}
                onClick={() => handleReaction(r.type)}
                className="w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:scale-125 active:scale-95"
                style={{
                  background: myReaction === r.type ? `${g}20` : 'transparent',
                }}
                title={r.label}
              >
                <span className="text-lg">{r.emoji}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
