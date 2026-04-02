import { useState, useEffect } from 'react'
import { Search } from '../../constants/icons'

// ═══════════════════════════════════════════════════════════
// CHAT PICKERS — Emoji + GIF (extracted from ChatsPage)
// ═══════════════════════════════════════════════════════════

const EMOJI_CATEGORIES = {
  recent: ['👍', '❤️', '😂', '🔥', '👏', '🙌', '💪', '🎉'],
  smileys: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥'],
  gestures: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🙏', '💪'],
  sports: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🏋️', '🤺', '🤾', '🏌️', '🏇', '⛹️', '🏊', '🚴', '🧗', '🤸', '🤼', '🤽', '🤾', '🧘'],
  hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  celebration: ['🎉', '🎊', '🎈', '🎁', '🎀', '🎗️', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🌟', '⭐', '✨', '💫', '🔥', '💥', '💯'],
}

const TENOR_API_KEY = import.meta.env.VITE_TENOR_API_KEY || ''

// ═══════════════════════════════════════════════════════════
// EMOJI PICKER — Glass treatment
// ═══════════════════════════════════════════════════════════
function EmojiPicker({ onSelect, onClose, isDark }) {
  const [activeCategory, setActiveCategory] = useState('recent')

  return (
    <div className="absolute bottom-full mb-2 left-0 w-80 overflow-hidden shadow-2xl ch-as"
      style={{
        background: isDark ? 'rgba(15,23,42,.95)' : 'rgba(255,255,255,.95)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        border: isDark ? '1px solid rgba(255,255,255,.1)' : '1px solid rgba(0,0,0,.08)',
        borderRadius: 20,
      }}>
      <div className="flex" style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.06)' }}>
        {Object.keys(EMOJI_CATEGORIES).map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className="flex-1 py-2.5 text-xs font-medium transition-all"
            style={{
              color: activeCategory === cat ? (isDark ? 'white' : '#1a1a1a') : (isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)'),
              background: activeCategory === cat ? (isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)') : 'transparent',
            }}>
            {cat === 'recent' ? '🕐' : cat === 'smileys' ? '😀' : cat === 'gestures' ? '👋' : cat === 'sports' ? '🏐' : cat === 'hearts' ? '❤️' : '🎉'}
          </button>
        ))}
      </div>
      <div className="p-2 grid grid-cols-8 gap-1 max-h-48 overflow-y-auto ch-nos">
        {EMOJI_CATEGORIES[activeCategory].map((emoji, i) => (
          <button key={i} onClick={() => onSelect(emoji)}
            className="w-8 h-8 rounded-lg transition-all hover:scale-125 text-xl"
            onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            {emoji}
          </button>
        ))}
      </div>
      <button onClick={onClose}
        className="w-full py-2.5 text-sm font-bold transition"
        style={{ borderTop: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.06)', color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)' }}>
        Close
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// GIF PICKER — Tenor API, glass treatment
// ═══════════════════════════════════════════════════════════
function GifPicker({ onSelect, onClose, isDark }) {
  const [query, setQuery] = useState('')
  const [gifs, setGifs] = useState([])
  const [loading, setLoading] = useState(false)
  const [trending, setTrending] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => { loadTrending() }, [])

  async function loadTrending() {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`https://tenor.googleapis.com/v2/featured?key=${TENOR_API_KEY}&limit=20&media_filter=tinygif,gif&contentfilter=medium`)
      const data = await res.json()
      if (data.results) setTrending(data.results)
      else if (data.error) setError(data.error.message)
    } catch (err) { console.error('Error loading trending GIFs:', err); setError('Failed to load GIFs') }
    setLoading(false)
  }

  async function searchGifs(q) {
    if (!q.trim()) { setGifs([]); return }
    setLoading(true)
    try {
      const res = await fetch(`https://tenor.googleapis.com/v2/search?key=${TENOR_API_KEY}&q=${encodeURIComponent(q)}&limit=20&media_filter=tinygif,gif&contentfilter=medium`)
      const data = await res.json()
      setGifs(data.results || [])
    } catch (err) { console.error('Error searching GIFs:', err) }
    setLoading(false)
  }

  const getGifUrl = (gif, type = 'preview') => {
    if (type === 'preview') return gif.media_formats?.tinygif?.url || gif.media_formats?.nanogif?.url || gif.media_formats?.gif?.url || gif.url
    return gif.media_formats?.gif?.url || gif.media_formats?.mediumgif?.url || gif.media_formats?.tinygif?.url || gif.url
  }

  const displayGifs = query ? gifs : trending

  return (
    <div className="absolute bottom-full mb-2 left-0 w-80 overflow-hidden shadow-2xl ch-as"
      style={{
        background: isDark ? 'rgba(15,23,42,.95)' : 'rgba(255,255,255,.95)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        border: isDark ? '1px solid rgba(255,255,255,.1)' : '1px solid rgba(0,0,0,.08)',
        borderRadius: 20,
      }}>
      <div className="p-3" style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.06)' }}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.03)', border: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.04)' }}>
          <Search className="w-4 h-4" style={{ color: isDark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.3)' }} />
          <input type="text" placeholder="Search GIFs..." value={query}
            onChange={e => { setQuery(e.target.value); searchGifs(e.target.value) }}
            className="flex-1 bg-transparent outline-none text-sm" style={{ color: isDark ? 'white' : '#1a1a1a' }} />
        </div>
      </div>
      <div className="p-2 grid grid-cols-2 gap-2 max-h-64 overflow-y-auto ch-nos">
        {loading ? (
          <div className="col-span-2 text-center py-8">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: '#6366f1', borderTopColor: 'transparent' }} />
          </div>
        ) : displayGifs.length === 0 ? (
          <div className="col-span-2 text-center py-8" style={{ color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)' }}>
            {error ? error : query ? 'No GIFs found' : 'Loading...'}
          </div>
        ) : (
          displayGifs.map(gif => (
            <button key={gif.id} onClick={() => onSelect(getGifUrl(gif, 'full'))}
              className="aspect-square rounded-xl overflow-hidden transition-all hover:ring-2"
              style={{ background: isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)' }}>
              <img src={getGifUrl(gif, 'preview')} alt={gif.content_description || 'GIF'}
                className="w-full h-full object-cover" loading="lazy"
                onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="50" x="25" font-size="40">🎬</text></svg>' }} />
            </button>
          ))
        )}
      </div>
      <div className="px-3 py-2 flex items-center justify-between" style={{ borderTop: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.06)' }}>
        <span className="text-[10px]" style={{ color: isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.25)' }}>Powered by Tenor</span>
        <button onClick={onClose} className="text-sm font-bold transition" style={{ color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)' }}>Close</button>
      </div>
    </div>
  )
}

export { EmojiPicker, GifPicker }
