import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// ═══════════════════════════════════════════════════════════
// BETA FEEDBACK WIDGET — Floating FAB + 3-mode modal
// Mounts at app root; appears on every page for every role
// ═══════════════════════════════════════════════════════════

function deriveScreenName(pathname) {
  const map = {
    '/': 'Dashboard',
    '/dashboard': 'Dashboard',
    '/schedule': 'Schedule',
    '/teams': 'Teams',
    '/registrations': 'Registrations',
    '/payments': 'Payments',
    '/members': 'Members',
    '/coaches': 'Coaches',
    '/attendance': 'Attendance',
    '/chat': 'Chat',
    '/chats': 'Chat',
    '/reports': 'Reports',
    '/settings': 'Settings',
    '/setup': 'Setup Wizard',
    '/parent': 'Parent Dashboard',
    '/player': 'Player Dashboard',
    '/login': 'Login',
    '/my-stuff': 'My Stuff',
    '/blasts': 'Announcements',
    '/gameprep': 'Game Prep',
    '/standings': 'Standings',
    '/leaderboards': 'Leaderboards',
    '/achievements': 'Achievements',
    '/jerseys': 'Jerseys',
    '/archives': 'Archives',
    '/directory': 'Org Directory',
  }
  if (map[pathname]) return map[pathname]
  for (const [prefix, name] of Object.entries(map)) {
    if (pathname.startsWith(prefix + '/')) return name
  }
  if (pathname.startsWith('/register')) return 'Registration Form'
  if (pathname.startsWith('/platform')) return 'Platform Admin'
  if (pathname.startsWith('/invite')) return 'Invite Page'
  if (pathname.startsWith('/join')) return 'Join Page'
  return pathname
}

const REACTIONS = [
  { sentiment: 'love', emoji: '\u{1F60D}', label: 'Love it' },
  { sentiment: 'like', emoji: '\u{1F44D}', label: "It's good" },
  { sentiment: 'confused', emoji: '\u{1F615}', label: 'Confused' },
  { sentiment: 'frustrated', emoji: '\u{1F624}', label: 'Frustrated' },
  { sentiment: 'broken', emoji: '\u{1F41B}', label: 'Broken' },
]

export default function BetaFeedbackWidget() {
  const location = useLocation()
  const { user, profile, organization } = useAuth() || {}

  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState(null) // null | 'reaction' | 'comment' | 'bug'
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmation, setConfirmation] = useState(null) // string to show
  const [hasAnimated, setHasAnimated] = useState(false)

  const modalRef = useRef(null)
  const textareaRef = useRef(null)

  // Hide on PA feedback page
  if (location.pathname === '/platform/feedback') return null

  // Pulse animation plays once on mount
  useEffect(() => {
    const timer = setTimeout(() => setHasAnimated(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  // Escape key closes modal
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') closeModal() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen])

  // Auto-focus textarea when entering comment/bug mode
  useEffect(() => {
    if ((mode === 'comment' || mode === 'bug') && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [mode])

  const closeModal = useCallback(() => {
    setIsOpen(false)
    setMode(null)
    setMessage('')
    setConfirmation(null)
  }, [])

  const getActiveView = () => {
    try { return localStorage.getItem('lynx_active_view') || 'unknown' } catch { return 'unknown' }
  }

  const buildPayload = (type, sentiment = null, msg = null) => ({
    user_id: user?.id || null,
    organization_id: organization?.id || null,
    user_role: user ? getActiveView() : 'anonymous',
    user_email: user?.email || null,
    user_name: profile?.full_name || profile?.first_name || null,
    feedback_type: type,
    sentiment: sentiment || null,
    message: msg || null,
    screen_url: location.pathname,
    screen_name: deriveScreenName(location.pathname),
    platform: 'web',
    device_info: {
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      timestamp: new Date().toISOString(),
    },
    status: 'new',
  })

  const submit = async (type, sentiment = null, msg = null) => {
    setSubmitting(true)
    const payload = buildPayload(type, sentiment, msg)
    const { error } = await supabase.from('beta_feedback').insert([payload])
    if (error) console.error('Feedback submission failed:', error)
    setSubmitting(false)
    return !error
  }

  const handleReaction = async (sentiment) => {
    await submit('reaction', sentiment)
    setConfirmation('Thanks! \u{1F499}')
    setTimeout(closeModal, 1500)
  }

  const handleCommentSubmit = async () => {
    if (!message.trim()) return
    await submit('comment', null, message.trim())
    setConfirmation('Thanks! We read every one. \u{1F499}')
    setTimeout(closeModal, 1500)
  }

  const handleBugSubmit = async () => {
    if (!message.trim()) return
    await submit('bug', 'broken', message.trim())
    setConfirmation("Got it \u2014 we're on it. \u{1F527}")
    setTimeout(closeModal, 1500)
  }

  // ── Confirmation overlay ──
  if (confirmation) {
    return (
      <>
        {/* Backdrop */}
        <div className="fixed inset-0 z-[9998] bg-black/20" onClick={closeModal} />
        {/* Confirmation card */}
        <div className="fixed z-[9999] bottom-6 right-6 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
          w-[calc(100%-48px)] sm:w-auto sm:min-w-[280px] max-w-[360px]
          bg-white rounded-[14px] shadow-2xl p-8 text-center animate-[feedbackFadeIn_0.2s_ease]">
          <p className="text-lg font-semibold text-slate-800">{confirmation}</p>
        </div>
      </>
    )
  }

  // ── FAB button ──
  if (!isOpen) {
    return (
      <>
        <style>{`
          @keyframes feedbackPulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(75, 185, 236, 0.5); }
            50% { box-shadow: 0 0 0 12px rgba(75, 185, 236, 0); }
          }
          @keyframes feedbackFadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Send feedback"
          className="fixed bottom-6 right-6 z-[9999] w-12 h-12 rounded-full bg-[#4BB9EC] text-white shadow-lg
            hover:scale-105 transition-transform duration-200 flex items-center justify-center"
          style={!hasAnimated ? { animation: 'feedbackPulse 1.5s ease 1' } : undefined}
        >
          {/* Speech bubble SVG */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </>
    )
  }

  // ── Modal ──
  return (
    <>
      <style>{`
        @keyframes feedbackFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Backdrop */}
      <div className="fixed inset-0 z-[9998] bg-black/20" onClick={closeModal} />

      {/* Modal card — bottom sheet on mobile, floating card on desktop */}
      <div
        ref={modalRef}
        role="dialog"
        aria-label="Send feedback"
        className="fixed z-[9999]
          bottom-0 left-0 right-0 sm:bottom-6 sm:right-6 sm:left-auto
          w-full sm:w-[360px] max-h-[480px]
          bg-white sm:rounded-[14px] rounded-t-[14px] shadow-2xl
          flex flex-col overflow-hidden
          animate-[feedbackFadeIn_0.2s_ease]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="text-lg font-bold text-[#10284C]">
            {!mode && "How's it going?"}
            {mode === 'reaction' && 'Quick Reaction'}
            {mode === 'comment' && "What's on your mind?"}
            {mode === 'bug' && 'What happened?'}
          </h3>
          <button
            onClick={closeModal}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close feedback"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Mode selector */}
        {!mode && (
          <div className="px-5 pb-5 flex flex-col gap-2">
            <button
              onClick={() => setMode('reaction')}
              className="flex items-center gap-3 p-3 rounded-[14px] border border-slate-200 hover:border-[#4BB9EC] hover:bg-sky-50/50 transition-colors text-left"
            >
              <span className="text-2xl">{'\u{1F60A}'}</span>
              <div>
                <p className="text-sm font-semibold text-slate-800">Quick Reaction</p>
                <p className="text-xs text-slate-400">One tap</p>
              </div>
            </button>
            <button
              onClick={() => setMode('comment')}
              className="flex items-center gap-3 p-3 rounded-[14px] border border-slate-200 hover:border-[#4BB9EC] hover:bg-sky-50/50 transition-colors text-left"
            >
              <span className="text-2xl">{'\u{1F4AC}'}</span>
              <div>
                <p className="text-sm font-semibold text-slate-800">Share a Thought</p>
                <p className="text-xs text-slate-400">Tell us more</p>
              </div>
            </button>
            <button
              onClick={() => setMode('bug')}
              className="flex items-center gap-3 p-3 rounded-[14px] border border-slate-200 hover:border-red-300 hover:bg-red-50/50 transition-colors text-left"
            >
              <span className="text-2xl">{'\u26A0\uFE0F'}</span>
              <div>
                <p className="text-sm font-semibold text-slate-800">Something's Broken</p>
                <p className="text-xs text-slate-400">Report a bug</p>
              </div>
            </button>
          </div>
        )}

        {/* Quick Reaction view */}
        {mode === 'reaction' && (
          <div className="px-5 pb-5">
            <div className="flex justify-between gap-1">
              {REACTIONS.map((r) => (
                <button
                  key={r.sentiment}
                  onClick={() => handleReaction(r.sentiment)}
                  disabled={submitting}
                  className="flex-1 flex flex-col items-center gap-1 py-3 rounded-[14px] hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  <span className="text-3xl">{r.emoji}</span>
                  <span className="text-[11px] text-slate-500 font-medium">{r.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setMode(null)}
              className="mt-3 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              &larr; Back
            </button>
          </div>
        )}

        {/* Share a Thought view */}
        {mode === 'comment' && (
          <div className="px-5 pb-5 flex flex-col gap-3">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
                placeholder="What's working? What's confusing? What would you change?"
                className="w-full h-28 px-3 py-2 rounded-[14px] border border-slate-200 text-sm text-slate-700 resize-none
                  focus:border-[#4BB9EC] focus:ring-1 focus:ring-[#4BB9EC] outline-none placeholder:text-slate-400"
              />
              <span className="absolute bottom-2 right-3 text-[11px] text-slate-300">{message.length}/1000</span>
            </div>
            <button
              onClick={handleCommentSubmit}
              disabled={submitting || !message.trim()}
              className="w-full py-2.5 rounded-[14px] bg-[#4BB9EC] text-white text-sm font-semibold
                hover:brightness-110 transition-all disabled:opacity-50"
            >
              {submitting ? 'Sending...' : 'Send'}
            </button>
            <button
              onClick={() => { setMode(null); setMessage('') }}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              &larr; Back
            </button>
          </div>
        )}

        {/* Bug Report view */}
        {mode === 'bug' && (
          <div className="px-5 pb-5 flex flex-col gap-3">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
                placeholder="Describe what you were trying to do and what went wrong"
                className="w-full h-28 px-3 py-2 rounded-[14px] border border-slate-200 text-sm text-slate-700 resize-none
                  focus:border-red-400 focus:ring-1 focus:ring-red-400 outline-none placeholder:text-slate-400"
              />
              <span className="absolute bottom-2 right-3 text-[11px] text-slate-300">{message.length}/1000</span>
            </div>
            <button
              onClick={handleBugSubmit}
              disabled={submitting || !message.trim()}
              className="w-full py-2.5 rounded-[14px] bg-red-500 text-white text-sm font-semibold
                hover:brightness-110 transition-all disabled:opacity-50"
            >
              {submitting ? 'Sending...' : 'Report Bug'}
            </button>
            <button
              onClick={() => { setMode(null); setMessage('') }}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              &larr; Back
            </button>
          </div>
        )}
      </div>
    </>
  )
}
