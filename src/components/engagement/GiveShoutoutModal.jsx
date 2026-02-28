// =============================================================================
// GiveShoutoutModal — Desktop modal for giving shoutouts
// =============================================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { X, ArrowLeft, Search, Send, Star, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { fetchShoutoutCategories, giveShoutout } from '../../lib/shoutout-service'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'

// =============================================================================
// Component
// =============================================================================

export default function GiveShoutoutModal({ visible, teamId, onClose, onSuccess, preselectedRecipient }) {
  const { isDark } = useTheme()
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

  // Reset on open
  useEffect(() => {
    if (visible) {
      setStep(preselectedRecipient ? 'category' : 'recipient')
      setSelectedRecipient(preselectedRecipient || null)
      setSelectedCategory(null)
      setMessage('')
      setSearch('')
      loadData()
    }
  }, [visible, preselectedRecipient])

  // Load team members + categories
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: teamPlayers } = await supabase
        .from('team_players')
        .select('player_id, players(id, first_name, last_name, photo_url)')
        .eq('team_id', teamId)

      const { data: teamCoaches } = await supabase
        .from('team_coaches')
        .select('coach_id, coaches(user_id, profiles(id, full_name, avatar_url))')
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
        const coach = tc.coaches
        const prof = coach?.profiles
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

      const orgId = profile?.current_organization_id || undefined
      const cats = await fetchShoutoutCategories(orgId)
      setCategories(cats)
    } catch (err) {
      console.error('[GiveShoutout] loadData error:', err)
    } finally {
      setLoading(false)
    }
  }, [teamId, user?.id, profile?.current_organization_id])

  const filteredRecipients = useMemo(() => {
    if (!search.trim()) return recipients
    const q = search.toLowerCase()
    return recipients.filter(r => r.full_name.toLowerCase().includes(q))
  }, [recipients, search])

  const userRoles = profile?.user_roles || []
  const isAdmin = userRoles.some(r => r.role === 'admin')
  const isCoach = userRoles.some(r => r.role === 'coach')
  const isParent = userRoles.some(r => r.role === 'parent')
  const giverRole = isAdmin ? 'admin' : isCoach ? 'coach' : isParent ? 'parent' : 'player'

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
        receiverName: selectedRecipient.full_name || selectedRecipient.name || 'Player',
        receiverAvatar: selectedRecipient.avatar_url,
        teamId,
        organizationId: profile.current_organization_id || '',
        category: selectedCategory,
        message: message.trim() || undefined,
      })
      if (result.success) {
        onSuccess?.()
        onClose()
      }
    } catch (err) {
      console.error('[GiveShoutout] send error:', err)
    } finally {
      setSending(false)
    }
  }

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

  const bg = isDark ? 'rgba(15,23,42,.97)' : 'rgba(255,255,255,.98)'
  const border = isDark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)'
  const textColor = isDark ? 'white' : '#1a1a1a'
  const mutedColor = isDark ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.35)'
  const subtleColor = isDark ? 'rgba(255,255,255,.55)' : 'rgba(0,0,0,.55)'
  const inputBg = isDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.03)'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg max-h-[85vh] rounded-xl overflow-hidden flex flex-col"
        style={{ background: bg, border: `1px solid ${border}`, backdropFilter: 'blur(24px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${border}` }}>
          <button onClick={goBack} className="p-1 rounded-lg transition hover:bg-white/10">
            {step === 'recipient' ? <X className="w-5 h-5" style={{ color: textColor }} /> : <ArrowLeft className="w-5 h-5" style={{ color: textColor }} />}
          </button>
          <h2 className="text-lg font-bold" style={{ color: textColor }}>Give Shoutout</h2>
          <div className="w-7" />
        </div>

        {/* Steps */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* STEP 1: Select Recipient */}
          {step === 'recipient' && (
            <div>
              <h3 className="text-xl font-extrabold mb-1" style={{ color: textColor }}>Who deserves a shoutout?</h3>

              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl mb-3 mt-3" style={{ background: inputBg, border: `1px solid ${border}` }}>
                <Search className="w-4 h-4" style={{ color: mutedColor }} />
                <input
                  type="text"
                  placeholder="Search teammates..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: textColor }}
                  autoFocus
                />
              </div>

              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
                </div>
              ) : (
                <div className="space-y-0.5">
                  {filteredRecipients.map(r => (
                    <button
                      key={r.id}
                      onClick={() => { setSelectedRecipient(r); setStep('category') }}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition hover:bg-white/5"
                      style={{ borderBottom: `1px solid ${border}` }}
                    >
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'var(--accent-primary)', color: 'white', opacity: 0.8 }}>
                        {r.avatar_url ? <img src={r.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : getInitials(r.full_name)}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold" style={{ color: textColor }}>{r.full_name}</p>
                        <p className="text-xs" style={{ color: mutedColor }}>{r.role === 'coach' ? 'Coach' : 'Player'}</p>
                      </div>
                      <ChevronRight className="w-4 h-4" style={{ color: mutedColor }} />
                    </button>
                  ))}
                  {filteredRecipients.length === 0 && !loading && (
                    <p className="text-center py-10 text-sm" style={{ color: mutedColor }}>No teammates found</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Select Category */}
          {step === 'category' && (
            <div>
              <h3 className="text-xl font-extrabold mb-1" style={{ color: textColor }}>What's the shoutout for?</h3>
              <p className="text-sm mb-5" style={{ color: subtleColor }}>For {selectedRecipient?.full_name}</p>

              <div className="grid grid-cols-2 gap-2.5">
                {categories.map(cat => {
                  const isSelected = selectedCategory?.id === cat.id
                  return (
                    <button
                      key={cat.id}
                      onClick={() => { setSelectedCategory(cat); setStep('message') }}
                      className="flex items-center gap-2.5 px-3.5 py-4 rounded-xl transition text-left"
                      style={{
                        border: `1.5px solid ${isSelected ? (cat.color || 'var(--accent-primary)') : border}`,
                        background: isSelected ? `${cat.color || 'var(--accent-primary)'}20` : 'transparent',
                      }}
                    >
                      <span className="text-2xl">{cat.emoji}</span>
                      <span className="text-sm font-semibold flex-1" style={{ color: isSelected ? (cat.color || 'var(--accent-primary)') : textColor }}>
                        {cat.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Optional Message */}
          {step === 'message' && (
            <div>
              <h3 className="text-xl font-extrabold mb-1" style={{ color: textColor }}>Add a message (optional)</h3>
              <p className="text-sm mb-5" style={{ color: subtleColor }}>
                {selectedCategory?.emoji} {selectedCategory?.name} for {selectedRecipient?.full_name}
              </p>

              <textarea
                value={message}
                onChange={e => setMessage(e.target.value.slice(0, 200))}
                placeholder="Great job today! You really showed up when it counted..."
                className="w-full px-4 py-3 rounded-xl text-sm resize-none outline-none"
                style={{ background: inputBg, border: `1px solid ${border}`, color: textColor, minHeight: 120 }}
                autoFocus
              />
              <p className="text-xs text-right mt-1.5" style={{ color: mutedColor }}>{message.length}/200</p>

              <button
                onClick={() => setStep('preview')}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-white mt-4 transition hover:opacity-90"
                style={{ background: 'var(--accent-primary)' }}
              >
                Preview
              </button>

              <button
                onClick={() => setStep('preview')}
                className="w-full py-3 text-sm font-semibold mt-1"
                style={{ color: subtleColor }}
              >
                Skip
              </button>
            </div>
          )}

          {/* STEP 4: Preview & Send */}
          {step === 'preview' && (
            <div>
              <h3 className="text-xl font-extrabold mb-4" style={{ color: textColor }}>Preview your shoutout</h3>

              {/* Preview Card */}
              <div
                className="rounded-xl p-7 flex flex-col items-center gap-2 mb-4"
                style={{
                  border: `2px solid ${selectedCategory?.color || 'var(--accent-primary)'}`,
                  background: `${selectedCategory?.color || 'var(--accent-primary)'}10`,
                }}
              >
                <span className="text-6xl">{selectedCategory?.emoji}</span>
                <h4 className="text-xl font-extrabold" style={{ color: textColor }}>{selectedCategory?.name}</h4>
                <p className="text-sm" style={{ color: subtleColor }}>For {selectedRecipient?.full_name}</p>
                {message.trim() && (
                  <p className="text-sm italic text-center mt-2 px-4" style={{ color: textColor }}>
                    &ldquo;{message.trim()}&rdquo;
                  </p>
                )}
                <p className="text-xs mt-2" style={{ color: mutedColor }}>From {profile?.full_name || 'You'}</p>
              </div>

              {/* XP info */}
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-5" style={{ background: inputBg }}>
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-medium" style={{ color: subtleColor }}>
                  +10 XP for you, +15 XP for {selectedRecipient?.full_name?.split(' ')[0]}
                </span>
              </div>

              {/* Send */}
              <button
                onClick={handleSend}
                disabled={sending}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-50"
                style={{ background: selectedCategory?.color || 'var(--accent-primary)' }}
              >
                {sending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
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
