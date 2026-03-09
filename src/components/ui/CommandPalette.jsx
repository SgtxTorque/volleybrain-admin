import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, ArrowRight, CornerDownLeft, Users, User, LayoutDashboard,
  Calendar, Trophy, ClipboardList, Settings, MessageCircle, Megaphone,
  Shirt, CreditCard, BarChart3, Clock, Target, X,
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { globalSearch, QUICK_NAV_ITEMS, getRecentSearches, saveRecentSearch } from '../../lib/searchService'
import { ROUTES, PAGE_TITLES } from '../../lib/routes'

// ============================================
// COMMAND PALETTE — Cmd/Ctrl+K Global Search
// ============================================

// Static page entries derived from routes
const PAGE_ENTRIES = Object.entries(ROUTES).map(([pageId, path]) => ({
  type: 'page',
  id: pageId,
  label: PAGE_TITLES[path] || pageId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
  path,
  section: path.startsWith('/settings/') ? 'Settings' :
           path.startsWith('/platform/') ? 'Platform' :
           'Pages',
}))

// Icon mapping for result types
const TYPE_ICONS = {
  page: LayoutDashboard,
  player: User,
  team: Users,
  season: Calendar,
  event: Calendar,
  coach: Target,
  profile: User,
}

// Icon mapping for nav items
const NAV_ICON_MAP = {
  'layout-dashboard': LayoutDashboard,
  'users': Users,
  'calendar': Calendar,
  'clipboard-list': ClipboardList,
  'credit-card': CreditCard,
  'shirt': Shirt,
  'message-circle': MessageCircle,
  'megaphone': Megaphone,
  'trophy': Trophy,
  'bar-chart-2': BarChart3,
  'settings': Settings,
}

export function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate()
  const theme = useTheme() || {}
  const { isDark, accent } = theme
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [searching, setSearching] = useState(false)
  const [recentSearches, setRecentSearches] = useState([])
  const inputRef = useRef(null)
  const debounceRef = useRef(null)
  const resultsRef = useRef(null)

  // Focus input when opened + load recent searches
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setResults([])
      setSelectedIdx(0)
      setRecentSearches(getRecentSearches())
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Listen for custom event to open search from sidebar
  useEffect(() => {
    const handler = () => {
      // Trigger open by dispatching keyboard event isn't clean,
      // so we use the onClose's companion open function via custom event
      document.dispatchEvent(new CustomEvent('command-palette-open'))
    }
    document.addEventListener('open-global-search', handler)
    return () => document.removeEventListener('open-global-search', handler)
  }, [])

  // Build results from query
  const buildResults = useCallback(async (q) => {
    const lower = q.toLowerCase().trim()

    if (!lower) {
      setResults([])
      setSelectedIdx(0)
      return
    }

    // First: show matching pages immediately
    const pageMatches = PAGE_ENTRIES.filter(e =>
      e.label.toLowerCase().includes(lower) || e.id.includes(lower)
    ).slice(0, 5)
    setResults(pageMatches)
    setSelectedIdx(0)

    // Then: search all entities via service (only if 2+ chars)
    if (lower.length >= 2) {
      setSearching(true)
      try {
        const dbResults = await globalSearch(q)
        // Merge: pages first, then grouped entity results
        setResults(prev => {
          const pages = prev.filter(r => r.type === 'page')
          // Convert db results to palette format
          const entities = dbResults.map(r => ({
            ...r,
            label: r.title,
            detail: r.subtitle,
          }))
          return [...pages, ...entities]
        })
      } catch (err) {
        console.error('[CommandPalette] search error:', err)
      }
      setSearching(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    if (!isOpen) return
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => buildResults(query), 200)
    return () => clearTimeout(debounceRef.current)
  }, [query, isOpen, buildResults])

  // Scroll selected item into view
  useEffect(() => {
    if (!resultsRef.current) return
    const selected = resultsRef.current.querySelector('[data-selected="true"]')
    if (selected) {
      selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selectedIdx])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return
    const allItems = getAllItems()
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIdx(i => Math.min(i + 1, allItems.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIdx(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const selected = allItems[selectedIdx]
        if (selected) {
          handleSelect(selected)
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, results, selectedIdx, navigate, onClose, query, recentSearches])

  // Get all items in display order (for keyboard navigation)
  function getAllItems() {
    if (query.trim().length > 0 && results.length > 0) {
      return results
    }
    if (query.trim().length === 0) {
      // Quick nav + recent searches
      const items = [...QUICK_NAV_ITEMS.map(i => ({ ...i, type: 'quicknav', label: i.title }))]
      if (recentSearches.length > 0) {
        items.push(...recentSearches.map(r => ({ ...r, type: r.type || 'recent', label: r.title })))
      }
      return items
    }
    return []
  }

  function handleSelect(item) {
    if (item.path) {
      // Save to recent if it's an entity result
      if (item.type !== 'page' && item.type !== 'quicknav') {
        saveRecentSearch(item)
      }
      navigate(item.path)
      onClose()
    }
  }

  if (!isOpen) return null

  const cardBg = isDark ? 'bg-[#0f1d33]' : 'bg-white'
  const border = isDark ? 'border-white/10' : 'border-slate-200'
  const text = isDark ? 'text-white' : 'text-slate-900'
  const textSec = isDark ? 'text-slate-400' : 'text-slate-500'
  const hoverBg = isDark ? 'bg-white/5' : 'bg-slate-50'
  const selectedBg = isDark ? 'bg-sky-500/10' : 'bg-sky-50'

  // Group results by section for display
  const grouped = {}
  results.forEach(r => {
    const sec = r.section || 'Results'
    if (!grouped[sec]) grouped[sec] = []
    grouped[sec].push(r)
  })

  const allItems = getAllItems()
  let flatIdx = 0

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]" onClick={onClose} />

      {/* Palette */}
      <div
        className={`fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-[600px] z-[201] ${cardBg} border ${border} rounded-2xl shadow-2xl overflow-hidden`}
        style={{ animation: 'fadeScaleIn 150ms ease-out' }}
      >
        {/* Search input */}
        <div className={`flex items-center gap-3 px-5 py-3.5 border-b ${border}`}>
          <Search className="w-5 h-5 flex-shrink-0" style={{ color: accent?.primary || '#5BCBFA' }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search players, teams, coaches, events..."
            className={`flex-1 bg-transparent outline-none text-sm font-medium ${text} placeholder-slate-400`}
          />
          {searching && (
            <span className={`text-xs ${textSec} animate-pulse`}>Searching...</span>
          )}
          <kbd className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${border} ${textSec}`}>ESC</kbd>
        </div>

        {/* Results area */}
        <div ref={resultsRef} className="max-h-[400px] overflow-y-auto">
          {/* Empty state: show quick nav + recent searches */}
          {query.trim().length === 0 && (
            <>
              {/* Quick Navigation */}
              <div className="py-2">
                <div className={`px-5 py-1.5 text-[10px] font-bold uppercase tracking-wider ${textSec}`}>
                  Quick Navigation
                </div>
                {QUICK_NAV_ITEMS.map((item, i) => {
                  const isSelected = i === selectedIdx
                  const NavIcon = NAV_ICON_MAP[item.icon] || LayoutDashboard
                  return (
                    <button
                      key={item.path}
                      data-selected={isSelected}
                      className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors ${isSelected ? selectedBg : `hover:${hoverBg}`}`}
                      onMouseEnter={() => setSelectedIdx(i)}
                      onClick={() => handleSelect({ ...item, label: item.title })}
                    >
                      <NavIcon className="w-4 h-4 flex-shrink-0" style={{ color: isSelected ? (accent?.primary || '#5BCBFA') : (isDark ? '#64748b' : '#94a3b8') }} />
                      <span className={`flex-1 text-sm font-medium ${text}`}>{item.title}</span>
                      {isSelected && <ArrowRight className="w-3.5 h-3.5" style={{ color: accent?.primary || '#5BCBFA' }} />}
                    </button>
                  )
                })}
              </div>

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className={`py-2 border-t ${border}`}>
                  <div className={`px-5 py-1.5 text-[10px] font-bold uppercase tracking-wider ${textSec} flex items-center justify-between`}>
                    <span>Recent</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        localStorage.removeItem('lynx-recent-searches')
                        setRecentSearches([])
                      }}
                      className={`text-[10px] font-normal hover:text-red-400 transition-colors ${textSec}`}
                    >
                      Clear
                    </button>
                  </div>
                  {recentSearches.map((item, ri) => {
                    const globalIdx = QUICK_NAV_ITEMS.length + ri
                    const isSelected = globalIdx === selectedIdx
                    const TypeIcon = TYPE_ICONS[item.type] || User
                    return (
                      <button
                        key={`recent-${item.type}-${item.id}`}
                        data-selected={isSelected}
                        className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors ${isSelected ? selectedBg : `hover:${hoverBg}`}`}
                        onMouseEnter={() => setSelectedIdx(globalIdx)}
                        onClick={() => handleSelect(item)}
                      >
                        <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: isDark ? '#475569' : '#cbd5e1' }} />
                        <TypeIcon className="w-4 h-4 flex-shrink-0" style={{ color: isSelected ? (accent?.primary || '#5BCBFA') : (isDark ? '#64748b' : '#94a3b8') }} />
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-medium ${text} truncate block`}>{item.title}</span>
                          {item.subtitle && <span className={`text-xs ${textSec} truncate block`}>{item.subtitle}</span>}
                        </div>
                        {isSelected && <ArrowRight className="w-3.5 h-3.5" style={{ color: accent?.primary || '#5BCBFA' }} />}
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* Search results */}
          {query.trim().length > 0 && results.length === 0 && !searching && query.length >= 2 && (
            <div className={`px-5 py-10 text-center ${textSec} text-sm`}>
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}

          {query.trim().length > 0 && query.trim().length < 2 && (
            <div className={`px-5 py-10 text-center ${textSec} text-sm`}>
              Type at least 2 characters to search...
            </div>
          )}

          {query.trim().length > 0 && results.length > 0 && (
            <div className="py-2">
              {Object.entries(grouped).map(([section, items]) => (
                <div key={section}>
                  <div className={`px-5 py-1.5 text-[10px] font-bold uppercase tracking-wider ${textSec}`}>
                    {section}
                  </div>
                  {items.map(item => {
                    const idx = flatIdx++
                    const isSelected = idx === selectedIdx
                    const TypeIcon = TYPE_ICONS[item.type] || LayoutDashboard

                    return (
                      <button
                        key={`${item.type}-${item.id}`}
                        data-selected={isSelected}
                        className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors ${isSelected ? selectedBg : `hover:${hoverBg}`}`}
                        onMouseEnter={() => setSelectedIdx(idx)}
                        onClick={() => handleSelect(item)}
                      >
                        <TypeIcon className="w-4 h-4 flex-shrink-0" style={{ color: isSelected ? (accent?.primary || '#5BCBFA') : (isDark ? '#64748b' : '#94a3b8') }} />
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-medium ${text} truncate block`}>{item.label || item.title}</span>
                          {(item.detail || item.subtitle) && (
                            <span className={`text-xs ${textSec} truncate block`}>{item.detail || item.subtitle}</span>
                          )}
                        </div>
                        {item.color && (
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        )}
                        {item.avatar && (
                          <img src={item.avatar} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                        )}
                        {isSelected && (
                          <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: accent?.primary || '#5BCBFA' }} />
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          )}

          {searching && results.length === 0 && (
            <div className={`px-5 py-10 text-center ${textSec} text-xs`}>
              <Search className="w-5 h-5 mx-auto mb-2 animate-pulse" style={{ color: accent?.primary || '#5BCBFA' }} />
              Searching across all data...
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center gap-4 px-5 py-2.5 border-t ${border} ${textSec} text-[10px] font-medium`}>
          <span className="flex items-center gap-1"><CornerDownLeft className="w-3 h-3" /> Select</span>
          <span>↑↓ Navigate</span>
          <span>ESC Close</span>
          <span className="ml-auto opacity-60">⌘K to search anytime</span>
        </div>
      </div>

      <style>{`
        @keyframes fadeScaleIn {
          from { opacity: 0; transform: translate(-50%, 0) scale(0.97); }
          to { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }
      `}</style>
    </>
  )
}

// Global keyboard hook — add to MainApp
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }
    // Also listen for custom event from sidebar/header triggers
    const handleOpen = () => setIsOpen(true)

    window.addEventListener('keydown', handleKey)
    document.addEventListener('open-global-search', handleOpen)
    document.addEventListener('command-palette-open', handleOpen)
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.removeEventListener('open-global-search', handleOpen)
      document.removeEventListener('command-palette-open', handleOpen)
    }
  }, [])

  return { isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }
}
