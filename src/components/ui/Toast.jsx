import { useEffect } from 'react'

export function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  const typeStyles = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    warning: 'bg-amber-500',
    info: 'bg-sky-500',
  }

  return (
    <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3 ${typeStyles[type]} text-white`}>
      <span>
        {type === 'success' && '✓'}
        {type === 'error' && '✕'}
        {type === 'warning' && '⚠'}
        {type === 'info' && 'ℹ'}
      </span>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">×</button>
    </div>
  )
}
