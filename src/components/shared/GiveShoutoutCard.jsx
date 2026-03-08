// =============================================================================
// GiveShoutoutCard — Compact card widget for giving shoutouts
// Used on parent and coach dashboards (4×8 grid = ~220×244px)
// =============================================================================

import { useState, useEffect, useCallback } from 'react'
import { Star, Send, ChevronDown, Check } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { fetchShoutoutCategories, giveShoutout } from '../../lib/shoutout-service'

export default function GiveShoutoutCard({ selectedTeam }) {
  const { user, profile } = useAuth()
  const { isDark } = useTheme()

  const [players, setPlayers] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const teamId = selectedTeam?.id

  useEffect(() => {
    if (!teamId) return
    loadData()
  }, [teamId])

  const loadData = useCallback(async () => {
    try {
      // Load team players
      const { data: tp } = await supabase
        .from('team_players')
        .select('player_id, players(id, first_name, last_name, photo_url)')
        .eq('team_id', teamId)

      const list = (tp || [])
        .map(t => t.players)
        .filter(p => p?.id && p.id !== user?.id)
        .sort((a, b) => (a.first_name || '').localeCompare(b.first_name || ''))
      setPlayers(list)

      // Load categories
      const orgId = profile?.current_organization_id
      const cats = await fetchShoutoutCategories(orgId)
      setCategories(cats.slice(0, 6)) // Max 6 for compact layout
    } catch (err) {
      console.warn('GiveShoutoutCard: load error', err)
    }
  }, [teamId, user?.id, profile?.current_organization_id])

  const canSend = selectedPlayer && selectedCategory && !sending

  const handleSend = async () => {
    if (!canSend || !user?.id || !profile) return
    setSending(true)
    try {
      const userRoles = profile?.user_roles || []
      const isAdmin = userRoles.some(r => r.role === 'admin')
      const isCoach = userRoles.some(r => r.role === 'coach')
      const giverRole = isAdmin ? 'admin' : isCoach ? 'coach' : 'parent'

      const result = await giveShoutout({
        giverId: user.id,
        giverRole,
        giverName: profile.full_name || 'Someone',
        receiverId: selectedPlayer.id,
        receiverRole: 'player',
        receiverName: `${selectedPlayer.first_name} ${selectedPlayer.last_name || ''}`.trim(),
        receiverAvatar: selectedPlayer.photo_url,
        teamId,
        organizationId: profile.current_organization_id || '',
        category: selectedCategory,
      })

      if (result?.success) {
        setSent(true)
        setSelectedPlayer(null)
        setSelectedCategory(null)
        setTimeout(() => setSent(false), 3000)
      }
    } catch (err) {
      console.warn('GiveShoutoutCard: send error', err)
    } finally {
      setSending(false)
    }
  }

  const cardBg = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-brand-border'

  if (!teamId) {
    return (
      <div className={`${cardBg} rounded-2xl shadow-sm p-3 h-full flex flex-col items-center justify-center overflow-hidden`}>
        <Star className={`w-6 h-6 mb-2 ${isDark ? 'text-amber-400/40' : 'text-amber-400/60'}`} />
        <p className={`text-r-sm font-semibold text-center ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Shoutouts</p>
        <p className={`text-r-xs text-center mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Assign a team to send shoutouts</p>
      </div>
    )
  }

  return (
    <div className={`${cardBg} rounded-2xl shadow-sm p-3 h-full flex flex-col overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-2">
        <Star className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
        <h3 className={`text-[10px] font-bold uppercase tracking-[1.2px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Give Shoutout
        </h3>
      </div>

      {/* Sent confirmation */}
      {sent ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full bg-green-500/15 flex items-center justify-center">
            <Check className="w-5 h-5 text-green-500" />
          </div>
          <p className={`text-r-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Sent!</p>
          <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>+10 XP for you</p>
        </div>
      ) : (
        <>
          {/* Player selector — compact dropdown */}
          <div className="relative mb-2">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-r-xs font-medium transition ${
                isDark
                  ? 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="truncate">
                {selectedPlayer
                  ? `${selectedPlayer.first_name} ${(selectedPlayer.last_name || '')[0] || ''}.`
                  : 'Select Player'}
              </span>
              <ChevronDown className={`w-3 h-3 flex-shrink-0 transition ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className={`absolute z-20 top-full left-0 right-0 mt-1 rounded-lg shadow-lg max-h-28 overflow-y-auto ${
                isDark ? 'bg-slate-800 border border-white/10' : 'bg-white border border-slate-200'
              }`}>
                {players.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedPlayer(p); setDropdownOpen(false) }}
                    className={`w-full text-left px-2.5 py-1.5 text-r-xs truncate transition ${
                      selectedPlayer?.id === p.id
                        ? 'bg-lynx-sky/10 text-lynx-sky font-bold'
                        : isDark ? 'text-slate-300 hover:bg-white/[0.06]' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {p.first_name} {p.last_name || ''}
                  </button>
                ))}
                {players.length === 0 && (
                  <p className={`px-2.5 py-2 text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No players</p>
                )}
              </div>
            )}
          </div>

          {/* Category pills — 2-column compact grid */}
          <div className="grid grid-cols-2 gap-1 flex-1 overflow-y-auto mb-2">
            {categories.map(cat => {
              const isSelected = selectedCategory?.id === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(isSelected ? null : cat)}
                  className={`flex items-center gap-1 px-1.5 py-1 rounded-lg text-[10px] font-semibold transition truncate ${
                    isSelected
                      ? 'ring-1 ring-lynx-sky bg-lynx-sky/10 text-lynx-sky'
                      : isDark ? 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                  title={cat.name}
                >
                  <span className="text-xs flex-shrink-0">{cat.emoji}</span>
                  <span className="truncate">{cat.name}</span>
                </button>
              )
            })}
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={`w-full py-2 rounded-xl font-bold text-r-sm flex items-center justify-center gap-1.5 transition ${
              canSend
                ? 'bg-lynx-sky text-white hover:brightness-110'
                : isDark ? 'bg-white/[0.06] text-slate-600 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-3 h-3" />
                Send
              </>
            )}
          </button>
        </>
      )}
    </div>
  )
}
