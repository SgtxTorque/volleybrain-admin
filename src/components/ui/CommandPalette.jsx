import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ArrowRight, Command, CornerDownLeft, Users, User, LayoutDashboard } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useSeason } from '../../contexts/SeasonContext'
import { supabase } from '../../lib/supabase'
import { ROUTES, PAGE_TITLES, getPathForPage } from '../../lib/routes'

// ============================================
// COMMAND PALETTE — Cmd/Ctrl+K Quick Navigation
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

export function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { isDark, accent } = useTheme()
  const { selectedSeason } = useSeason()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [searching, setSearching] = useState(false)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setResults([])
      setSelectedIdx(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Build results from query
  const buildResults = useCallback(async (q) => {
    const items = []
    const lower = q.toLowerCase().trim()

    if (!lower) {
      // Show popular pages when empty
      const popular = ['dashboard', 'teams', 'registrations', 'schedule', 'payments', 'chats', 'blasts']
      popular.forEach(id => {
        const entry = PAGE_ENTRIES.find(e => e.id === id)
        if (entry) items.push(entry)
      })
      setResults(items)
      setSelectedIdx(0)
      return
    }

    // Filter pages
    const pageMatches = PAGE_ENTRIES.filter(e =>
      e.label.toLowerCase().includes(lower) || e.id.includes(lower)
    ).slice(0, 6)
    items.push(...pageMatches)

    setResults([...items])
    setSelectedIdx(0)

    // Search players and teams from Supabase (only if 2+ chars)
    if (lower.length >= 2 && selectedSeason?.id) {
      setSearching(true)
      try {
        const [playerRes, teamRes] = await Promise.all([
          supabase
            .from('players')
            .select('id, first_name, last_name, jersey_number')
            .eq('season_id', selectedSeason.id)
            .or(`first_name.ilike.%${lower}%,last_name.ilike.%${lower}%`)
            .limit(5),
          supabase
            .from('teams')
            .select('id, name, color')
            .eq('season_id', selectedSeason.id)
            .ilike('name', `%${lower}%`)
            .limit(5),
        ])

        const dbItems = []

        if (teamRes.data?.length) {
          teamRes.data.forEach(t => dbItems.push({
            type: 'team',
            id: t.id,
            label: t.name,
            detail: t.color,
            path: `/teams/${t.id}`,
            section: 'Teams',
          }))
        }

        if (playerRes.data?.length) {
          playerRes.data.forEach(p => dbItems.push({
            type: 'player',
            id: p.id,
            label: `${p.first_name} ${p.last_name}`,
            detail: p.jersey_number ? `#${p.jersey_number}` : null,
            path: `/parent/player/${p.id}`,
            section: 'Players',
          }))
        }

        // Merge db results after page results
        setResults(prev => [...prev.filter(r => r.type === 'page'), ...dbItems])
      } catch (err) {
        console.error('[CommandPalette] search error:', err)
      }
      setSearching(false)
    }
  }, [selectedSeason?.id])

  // Debounced search
  useEffect(() => {
    if (!isOpen) return
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => buildResults(query), 150)
    return () => clearTimeout(debounceRef.current)
  }, [query, isOpen, buildResults])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIdx(i => Math.min(i + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIdx(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const selected = results[selectedIdx]
        if (selected) {
          navigate(selected.path)
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, results, selectedIdx, navigate, onClose])

  if (!isOpen) return null

  const bg = isDark ? 'bg-slate-900/95' : 'bg-white/95'
  const cardBg = isDark ? 'bg-slate-800' : 'bg-white'
  const border = isDark ? 'border-slate-700' : 'border-slate-200'
  const text = isDark ? 'text-white' : 'text-slate-900'
  const textSec = isDark ? 'text-slate-400' : 'text-slate-500'
  const hoverBg = isDark ? 'bg-slate-700/50' : 'bg-slate-100'

  // Group results by section
  const grouped = {}
  results.forEach(r => {
    const sec = r.section || 'Results'
    if (!grouped[sec]) grouped[sec] = []
    grouped[sec].push(r)
  })

  let flatIdx = 0

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]" onClick={onClose} />

      {/* Palette */}
      <div className={`fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg z-[201] ${cardBg} border ${border} rounded-xl shadow-2xl overflow-hidden`}>
        {/* Search input */}
        <div className={`flex items-center gap-3 px-4 py-3 border-b ${border}`}>
          <Search className="w-5 h-5 flex-shrink-0" style={{ color: accent.primary }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search pages, players, teams..."
            className={`flex-1 bg-transparent outline-none text-sm ${text} placeholder-slate-500`}
          />
          <kbd className={`text-xs px-1.5 py-0.5 rounded border ${border} ${textSec}`}>ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[360px] overflow-y-auto py-2">
          {Object.entries(grouped).length === 0 && !searching && query.length > 0 && (
            <div className={`px-4 py-8 text-center ${textSec} text-sm`}>
              No results found
            </div>
          )}

          {Object.entries(grouped).map(([section, items]) => (
            <div key={section}>
              <div className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider ${textSec}`}>
                {section}
              </div>
              {items.map(item => {
                const idx = flatIdx++
                const isSelected = idx === selectedIdx
                const TypeIcon = item.type === 'team' ? Users : item.type === 'player' ? User : LayoutDashboard

                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${isSelected ? hoverBg : ''}`}
                    onMouseEnter={() => setSelectedIdx(idx)}
                    onClick={() => { navigate(item.path); onClose() }}
                  >
                    <TypeIcon className="w-4 h-4 flex-shrink-0" style={{ color: isSelected ? accent.primary : (isDark ? '#64748b' : '#94a3b8') }} />
                    <span className={`flex-1 text-sm ${text}`}>{item.label}</span>
                    {item.detail && (
                      <span className={`text-xs ${textSec}`}>{item.detail}</span>
                    )}
                    {isSelected && (
                      <ArrowRight className="w-3.5 h-3.5" style={{ color: accent.primary }} />
                    )}
                  </button>
                )
              })}
            </div>
          ))}

          {searching && (
            <div className={`px-4 py-3 text-center ${textSec} text-xs`}>
              Searching...
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center gap-4 px-4 py-2 border-t ${border} ${textSec} text-xs`}>
          <span className="flex items-center gap-1"><CornerDownLeft className="w-3 h-3" /> Select</span>
          <span>↑↓ Navigate</span>
          <span>ESC Close</span>
        </div>
      </div>
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
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  return { isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }
}
