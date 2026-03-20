// =============================================================================
// InviteCodeModal — Shows/generates team invite code for Team Managers
// Ported from mobile InviteCodeModal.tsx, adapted for web
// =============================================================================

import { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { X, Copy, Share2, Check, RefreshCw } from '../../constants/icons'

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export default function InviteCodeModal({ teamId, teamName, onClose, showToast }) {
  const { isDark } = useTheme()
  const [code, setCode] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (teamId) loadOrCreateCode()
  }, [teamId])

  async function loadOrCreateCode() {
    setLoading(true)
    setError(null)
    try {
      // Check for existing active code
      const { data: existing, error: fetchError } = await supabase
        .from('team_invite_codes')
        .select('code')
        .eq('team_id', teamId)
        .eq('is_active', true)
        .maybeSingle()

      if (fetchError) {
        // Table may not exist
        if (fetchError.message?.includes('relation') || fetchError.code === '42P01') {
          setError('Invite codes are not yet available. The team_invite_codes table needs to be created.')
          setLoading(false)
          return
        }
        throw fetchError
      }

      if (existing?.code) {
        setCode(existing.code)
      } else {
        // Generate and insert a new code
        const newCode = generateCode()
        const { error: insertError } = await supabase
          .from('team_invite_codes')
          .insert({
            team_id: teamId,
            code: newCode,
            is_active: true,
            created_at: new Date().toISOString(),
          })

        if (insertError) throw insertError
        setCode(newCode)
      }
    } catch (err) {
      console.error('InviteCodeModal error:', err)
      setError('Could not load invite code. Please try again.')
    }
    setLoading(false)
  }

  async function handleCopyCode() {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      showToast?.('Code copied to clipboard', 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast?.('Failed to copy', 'error')
    }
  }

  async function handleCopyLink() {
    if (!code) return
    const link = `https://thelynxapp.com/join?code=${code}`
    try {
      await navigator.clipboard.writeText(link)
      setCopiedLink(true)
      showToast?.('Link copied to clipboard', 'success')
      setTimeout(() => setCopiedLink(false), 2000)
    } catch {
      showToast?.('Failed to copy', 'error')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className={`w-full max-w-md rounded-[14px] overflow-hidden ${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-lynx-silver shadow-xl'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-r-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Invite Code</h2>
              <p className={`text-r-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{teamName}</p>
            </div>
            <button onClick={onClose} className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}>
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 text-lynx-sky animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-6">
              <p className={`text-r-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{error}</p>
            </div>
          ) : (
            <>
              <p className={`text-r-sm text-center mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Share this code with parents and players to join your team
              </p>

              {/* Code Display */}
              <div className={`text-center py-6 px-4 rounded-[14px] mb-6 ${isDark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-lynx-cloud border border-slate-100'}`}>
                <p className={`text-r-4xl font-bold tracking-[0.3em] font-mono ${isDark ? 'text-white' : 'text-lynx-navy'}`}>
                  {code}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleCopyCode}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[14px] font-bold text-r-sm transition ${
                    copied
                      ? 'bg-emerald-500 text-white'
                      : 'bg-lynx-sky text-white hover:bg-lynx-deep'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Code'}
                </button>
                <button
                  onClick={handleCopyLink}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[14px] font-bold text-r-sm transition ${
                    copiedLink
                      ? 'bg-emerald-500 text-white'
                      : isDark
                        ? 'border border-white/[0.06] text-white hover:bg-white/[0.06]'
                        : 'border border-lynx-silver text-slate-700 hover:bg-lynx-cloud'
                  }`}
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  {copiedLink ? 'Copied!' : 'Share Link'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
