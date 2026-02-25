import { useState, useEffect, useCallback, useRef } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

// ============================================
// TOAST SYSTEM — Stacking, Animations, Progress Bar
// ============================================

let toastId = 0

const TYPE_CONFIG = {
  success: { icon: CheckCircle, bg: 'bg-emerald-500', ring: 'ring-emerald-400/30', bar: 'bg-emerald-300' },
  error:   { icon: XCircle, bg: 'bg-red-500', ring: 'ring-red-400/30', bar: 'bg-red-300' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-500', ring: 'ring-amber-400/30', bar: 'bg-amber-300' },
  info:    { icon: Info, bg: 'bg-sky-500', ring: 'ring-sky-400/30', bar: 'bg-sky-300' },
}

const TOAST_CSS = `
@keyframes toast-slide-in {
  0% { transform: translateX(120%); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}
@keyframes toast-slide-out {
  0% { transform: translateX(0); opacity: 1; }
  100% { transform: translateX(120%); opacity: 0; }
}
@keyframes toast-progress {
  0% { width: 100%; }
  100% { width: 0%; }
}
`

let cssInjected = false
function injectCSS() {
  if (cssInjected) return
  const el = document.createElement('style')
  el.textContent = TOAST_CSS
  document.head.appendChild(el)
  cssInjected = true
}

// Individual toast item
function ToastItem({ toast, onClose }) {
  const [exiting, setExiting] = useState(false)
  const timerRef = useRef(null)
  const config = TYPE_CONFIG[toast.type] || TYPE_CONFIG.info
  const Icon = config.icon
  const duration = toast.duration || 4000

  injectCSS()

  const handleClose = useCallback(() => {
    setExiting(true)
    setTimeout(() => onClose(toast.id), 300)
  }, [toast.id, onClose])

  useEffect(() => {
    timerRef.current = setTimeout(handleClose, duration)
    return () => clearTimeout(timerRef.current)
  }, [duration, handleClose])

  const handleMouseEnter = () => clearTimeout(timerRef.current)
  const handleMouseLeave = () => {
    timerRef.current = setTimeout(handleClose, 1500)
  }

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl ring-1 ${config.bg} ${config.ring} text-white min-w-[320px] max-w-[420px] overflow-hidden`}
      style={{
        animation: exiting ? 'toast-slide-out 0.3s ease-in forwards' : 'toast-slide-in 0.35s ease-out',
      }}
    >
      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
      <span className="flex-1 text-sm font-medium leading-snug">{toast.message}</span>
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-0.5 rounded-md hover:bg-white/20 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black/10">
        <div
          className={`h-full ${config.bar}`}
          style={{
            animation: `toast-progress ${duration}ms linear forwards`,
          }}
        />
      </div>
    </div>
  )
}

// Toast container — renders all active toasts
export function ToastContainer({ toasts, onRemove }) {
  if (!toasts || toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2">
      {toasts.slice(-5).map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={onRemove} />
      ))}
    </div>
  )
}

// Hook for managing toasts — drop-in replacement
export function useToast() {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'success', duration) => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, type, duration }])
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return { toasts, showToast, removeToast }
}

// Legacy single-toast wrapper for backward compatibility
export function Toast({ message, type = 'success', onClose }) {
  return (
    <ToastContainer
      toasts={[{ id: 'legacy', message, type }]}
      onRemove={onClose}
    />
  )
}
