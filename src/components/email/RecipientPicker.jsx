import { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { X } from '../../constants/icons'

export default function RecipientPicker({ selected = [], onChange }) {
  const { isDark } = useTheme()
  const { organization } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const timer = setTimeout(() => searchProfiles(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  async function searchProfiles(q) {
    setLoading(true)
    try {
      // Search profiles by name or email within org
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('current_organization_id', organization.id)
        .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(20)

      // Also search parents via players table
      const { data: players } = await supabase
        .from('players')
        .select('id, parent_name, parent_email')
        .eq('organization_id', organization.id)
        .or(`parent_name.ilike.%${q}%,parent_email.ilike.%${q}%`)
        .limit(20)

      const profileResults = (data || []).map(p => ({
        id: p.id,
        name: p.full_name || p.email,
        email: p.email,
        source: 'profile',
      }))

      const parentResults = (players || [])
        .filter(p => p.parent_email)
        .map(p => ({
          id: `parent-${p.id}`,
          name: p.parent_name || p.parent_email,
          email: p.parent_email,
          source: 'parent',
        }))

      // Deduplicate by email
      const seen = new Set()
      const all = [...profileResults, ...parentResults].filter(r => {
        if (seen.has(r.email?.toLowerCase())) return false
        seen.add(r.email?.toLowerCase())
        return true
      })

      // Filter out already selected
      const selectedEmails = new Set(selected.map(s => s.email?.toLowerCase()))
      setResults(all.filter(r => !selectedEmails.has(r.email?.toLowerCase())))
    } catch (err) {
      console.error('Recipient search error:', err)
    }
    setLoading(false)
  }

  function addRecipient(r) {
    onChange([...selected, r])
    setQuery('')
    setResults([])
  }

  function removeRecipient(email) {
    onChange(selected.filter(s => s.email?.toLowerCase() !== email.toLowerCase()))
  }

  return (
    <div>
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map(r => (
            <span
              key={r.email}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                isDark ? 'bg-[#4BB9EC]/15 text-[#4BB9EC]' : 'bg-[#4BB9EC]/10 text-[#0d7bb5]'
              }`}
            >
              {r.name || r.email}
              <button
                onClick={() => removeRecipient(r.email)}
                className="hover:opacity-70"
                type="button"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search by name or email..."
        className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium ${
          isDark
            ? 'bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-500'
            : 'bg-[#F5F6F8] border-[#E8ECF2] text-[#10284C] placeholder:text-slate-400'
        } border focus:border-[#4BB9EC] focus:ring-2 focus:ring-[#4BB9EC]/10 outline-none transition`}
      />

      {/* Results dropdown */}
      {(results.length > 0 || loading) && (
        <div className={`mt-1 rounded-xl border max-h-48 overflow-y-auto ${
          isDark ? 'bg-[#0B1D35] border-white/[0.08]' : 'bg-white border-[#E8ECF2]'
        }`}>
          {loading && (
            <div className="p-3 text-center text-xs text-slate-400">Searching...</div>
          )}
          {results.map(r => (
            <button
              key={r.id}
              onClick={() => addRecipient(r)}
              className={`w-full text-left px-4 py-2.5 text-sm transition ${
                isDark ? 'hover:bg-white/[0.04] text-white' : 'hover:bg-[#F5F6F8] text-[#10284C]'
              }`}
              type="button"
            >
              <span className="font-medium">{r.name}</span>
              <span className="text-slate-400 ml-2 text-xs">{r.email}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
