// =============================================================================
// GiveShoutoutModal — Desktop modal for creating shoutouts
// =============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react'
import { X, ArrowLeft, Search, ChevronRight, Send, Star } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { giveShoutout, fetchShoutoutCategories } from '../../lib/shoutout-service'
import { DEFAULT_SHOUTOUT_CATEGORIES } from '../../lib/engagement-constants'

// =============================================================================
// Component
// =============================================================================

export default function GiveShoutoutModal({ visible, teamId, onClose, onSuccess, preselectedRecipient }) {
  const { isDark, accent } = useTheme()
  const { user, profile } = useAuth()

  const [step, setStep] = useState(preselectedRecipient ? 'category' : 'recipient')
  const [recipients, setRecipients] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedRecipient, setSelectedRecipient] = useState(preselectedRecipient || null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  // Reset when modal opens
  useEffect(() => {
    if (visible) {
      setStep(preselectedRecipient ? 'category' : 'recipient')
      setSelectedRecipient(preselectedRecipient || null)
      setSelectedCategory(null)
      setMessage('')
      setSearch('')
      loadData()
    }
  }, [visible])

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch team members (players)
      const { data: teamPlayers } = await supabase
        .from('team_players')
        .select('player_id, players(id, first_name, last_name, photo_url)')
        .eq('team_id', teamId)

      // Fetch team coaches
      const { data: teamCoaches } = await supabase
        .from('team_coaches')
        .select('coach_id, profiles(id, full_name, avatar_url)')
        .eq('team_id', teamId)

      const memberMap = new Map()

      for (const tp of teamPlayers || []) {
        const player = tp.players
        if (!player?.id || player.id === user?.id) continue
        memberMap.set(player.id, {
          id: player.id,
          full_name: `${player.first_name} ${player.last_name}`,
          avatar_url: player.photo_url || null,
          role: 'player',
        })
      }

      for (const tc of teamCoaches || []) {
        const prof = tc.profiles
        if (!prof?.id || prof.id === user?.id) continue
        if (memberMap.has(prof.id)) continue
        memberMap.set(prof.id, {
          id: prof.id,
          full_name: prof.full_name || 'Unknown',
          avatar_url: prof.avatar_url || null,
          role: 'coach',
        })
      }

      setRecipients(Array.from(memberMap.values()).sort((a, b) => a.full_name.localeCompare(b.full_name)))

      // Fetch shoutout categories
      const orgId = profile?.current_organization_id || undefined
      let cats = await fetchShoutoutCategories(orgId)
      if (!cats || cats.length === 0) {
        // Fallback to defaults
        cats = DEFAULT_SHOUTOUT_CATEGORIES.map((c, i) => ({ ...c, id: `default-${i}` }))
      }
      setCategories(cats)
    } catch (err) {
      console.error('[GiveShoutout] loadData error:', err)
    } finally {
      setLoading(false)
    }
  }, [teamId, user?.id, profile?.current_organization_id])

  // Filtered recipients
  const filteredRecipients = useMemo(() => {
    if (!search.trim()) return recipients
    const q = search.toLowerCase()
    return recipients.filter((r) => r.full_name.toLowerCase().includes(q))
  }, [recipients, search])

  // Giver role
  const giverRole = profile?.is_admin ? 'admin' : 'coach'

  // Send shoutout
  const handleSend = async () => {
    if (!selectedRecipient || !selectedCategory || !user?.id || !profile) return

    setSending(true)
    try {
      const result = await giveShoutout({
        giverId: user.id,
        giverRole,
        giverName: profile.full_name || 'Someone',
        receiverId: selectedRecipient.id,
        receiverRole: selectedRecipient.role,
        receiverName: selectedRecipient.full_name,
        receiverAvatar: selectedRecipient.avatar_url,
        teamId,
        organizationId: profile.current_organization_id || '',
        category: selectedCategory,
        message: message.trim() || undefined,
      })

      if (result.success) {
        onSuccess?.()
        onClose()
      } else {
        alert(result.error || 'Failed to send shoutout')
      }
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setSending(false)
    }
  }

  // Navigation
  const goBack = () => {
    if (step === 'category') setStep('recipient')
    else if (step === 'message') setStep('category')
    else if (step === 'preview') setStep('message')
    else onClose()
  }

  const getInitials = (name) => {
    const parts = name.split(' ')
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase()
  }

  if (!visible) return null

  const cardBg = isDark ? 'bg-slate-800' : 'bg-white'
  const borderCls = isDark ? 'border-slate-700' : 'border-slate-200'
  const textCls = isDark ? 'text-white' : 'text-slate-900'
  const textSecCls = isDark ? 'text-slate-300' : 'text-slate-600'
  const textMutedCls = isDark ? 'text-slate-400' : 'text-slate-500'
  const inputBg = isDark ? 'bg-slate-900 border-slate-600' : 'bg-white border-slate-300'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={`relative ${cardBg} rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-modal-in`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${borderCls}`}>
          <button onClick={goBack} className={`p-1 rounded-lg hover:bg-black/10 ${textCls}`}>
            {step === 'recipient' ? <X size={20} /> : <ArrowLeft size={20} />}
          </button>
          <h2 className={`text-lg font-bold ${textCls}`}>Give Shoutout</h2>
          <div className="w-7" />
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* STEP: RECIPIENT */}
          {step === 'recipient' && (
            <div>
              <h3 className={`text-xl font-extrabold mb-1 ${textCls}`}>Who deserves a shoutout?</h3>

              {/* Search */}
              <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border mb-3 ${inputBg}`}>
                <Search size={16} className={textMutedCls} />
                <input
                  type="text"
                  placeholder="Search teammates..."
                  className={`flex-1 bg-transparent outline-none text-sm ${textCls} placeholder:${textMutedCls}`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: accent.primary, borderTopColor: 'transparent' }} />
                </div>
              ) : filteredRecipients.length === 0 ? (
                <p className={`text-center py-8 ${textMutedCls}`}>No teammates found</p>
              ) : (
                <div className="space-y-0">
                  {filteredRecipients.map((r) => (
                    <button
                      key={r.id}
                      className={`w-full flex items-center gap-3 py-3.5 px-2 border-b ${borderCls} hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-lg`}
                      onClick={() => { setSelectedRecipient(r); setStep('category') }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{ backgroundColor: accent.primary + '25', color: accent.primary }}
                      >
                        {getInitials(r.full_name)}
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`font-semibold ${textCls}`}>{r.full_name}</p>
                        <p className={`text-xs ${textMutedCls}`}>{r.role === 'coach' ? 'Coach' : 'Player'}</p>
                      </div>
                      <ChevronRight size={16} className={textMutedCls} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP: CATEGORY */}
          {step === 'category' && (
            <div>
              <h3 className={`text-xl font-extrabold mb-0.5 ${textCls}`}>What&apos;s the shoutout for?</h3>
              <p className={`text-sm mb-5 ${textSecCls}`}>For {selectedRecipient?.full_name}</p>

              <div className="grid grid-cols-2 gap-2.5">
                {categories.map((cat) => {
                  const isSelected = selectedCategory?.id === cat.id
                  return (
                    <button
                      key={cat.id}
                      className="flex items-center gap-2.5 py-4 px-3.5 rounded-xl border-[1.5px] transition-all hover:scale-[1.02]"
                      style={{
                        borderColor: isSelected ? (cat.color || accent.primary) : (isDark ? '#334155' : '#e2e8f0'),
                        backgroundColor: isSelected ? (cat.color || accent.primary) + '20' : 'transparent',
                      }}
                      onClick={() => { setSelectedCategory(cat); setStep('message') }}
                    >
                      <span className="text-2xl">{cat.emoji}</span>
                      <span
                        className="text-sm font-semibold flex-1 text-left"
                        style={{ color: isSelected ? (cat.color || accent.primary) : (isDark ? '#fff' : '#1e293b') }}
                      >
                        {cat.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP: MESSAGE */}
          {step === 'message' && (
            <div>
              <h3 className={`text-xl font-extrabold mb-0.5 ${textCls}`}>Add a message (optional)</h3>
              <p className={`text-sm mb-5 ${textSecCls}`}>
                {selectedCategory?.emoji} {selectedCategory?.name} for {selectedRecipient?.full_name}
              </p>

              <textarea
                className={`w-full border rounded-xl p-4 text-sm min-h-[120px] resize-none ${inputBg} ${textCls} placeholder:${textMutedCls}`}
                placeholder="Great job today! You really showed up when it counted..."
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 200))}
                maxLength={200}
                autoFocus
              />
              <p className={`text-xs text-right mt-1 ${textMutedCls}`}>{message.length}/200</p>

              <button
                className="w-full py-3.5 rounded-xl text-white font-bold mt-5 transition-opacity hover:opacity-90"
                style={{ backgroundColor: accent.primary }}
                onClick={() => setStep('preview')}
              >
                Preview
              </button>

              <button
                className={`w-full py-3 text-center font-semibold ${textSecCls} hover:underline`}
                onClick={() => setStep('preview')}
              >
                Skip
              </button>
            </div>
          )}

          {/* STEP: PREVIEW */}
          {step === 'preview' && (
            <div>
              <h3 className={`text-xl font-extrabold mb-5 ${textCls}`}>Preview your shoutout</h3>

              {/* Preview Card */}
              <div
                className="border-2 rounded-2xl p-7 flex flex-col items-center gap-2 mb-4"
                style={{
                  borderColor: selectedCategory?.color || accent.primary,
                  backgroundColor: (selectedCategory?.color || accent.primary) + '10',
                }}
              >
                <span className="text-6xl">{selectedCategory?.emoji}</span>
                <p className={`text-xl font-extrabold ${textCls}`}>{selectedCategory?.name}</p>
                <p className={`text-base ${textSecCls}`}>For {selectedRecipient?.full_name}</p>
                {message.trim() && (
                  <p className={`text-sm italic text-center mt-2 px-4 ${textCls}`}>
                    &ldquo;{message.trim()}&rdquo;
                  </p>
                )}
                <p className={`text-xs mt-2 ${textMutedCls}`}>From {profile?.full_name || 'You'}</p>
              </div>

              {/* XP info */}
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg mb-5 ${isDark ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
                <Star size={14} className="text-yellow-400 fill-yellow-400" />
                <span className={`text-xs font-medium ${textSecCls}`}>
                  +10 XP for you, +15 XP for {selectedRecipient?.full_name?.split(' ')[0]}
                </span>
              </div>

              {/* Send button */}
              <button
                className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl text-white font-bold text-base transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: selectedCategory?.color || accent.primary }}
                onClick={handleSend}
                disabled={sending}
              >
                {sending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={16} />
                    Send Shoutout
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
