import { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react'

// ═══════════════════════════════════════════════════════════
// PHOTO LIGHTBOX — Full-screen photo viewer with navigation
// ═══════════════════════════════════════════════════════════
function PhotoLightbox({ photos, initialIndex = 0, onClose }) {
  const [idx, setIdx] = useState(initialIndex)

  const goPrev = useCallback(() => setIdx(i => Math.max(i - 1, 0)), [])
  const goNext = useCallback(() => setIdx(i => Math.min(i + 1, photos.length - 1)), [photos.length])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose, goNext, goPrev])

  const current = photos[idx]
  if (!current) return null

  function handleDownload(e) {
    e.stopPropagation()
    const a = document.createElement('a')
    a.href = current
    a.download = `photo-${idx + 1}.jpg`
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center tw-ai"
      style={{ background: 'rgba(0,0,0,.92)' }}
      onClick={onClose}
    >
      {/* Top bar — counter + actions */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10">
        <span className="text-white/60 text-sm font-mono">
          {photos.length > 1 ? `${idx + 1} / ${photos.length}` : ''}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose() }}
            style={{
              width: 44, height: 44, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.2)',
              color: '#FFFFFF', cursor: 'pointer', transition: 'all 200ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.3)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.15)' }}
          >
            <X style={{ width: 22, height: 22 }} />
          </button>
        </div>
      </div>

      {/* Photo */}
      <img
        src={current}
        alt=""
        className="max-w-[90vw] max-h-[85vh] object-contain select-none"
        style={{ borderRadius: 8 }}
        onClick={e => e.stopPropagation()}
      />

      {/* Left arrow */}
      {photos.length > 1 && idx > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); goPrev() }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center text-white/50 hover:text-white bg-black/30 hover:bg-black/60 transition"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Right arrow */}
      {photos.length > 1 && idx < photos.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goNext() }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center text-white/50 hover:text-white bg-black/30 hover:bg-black/60 transition"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
    </div>
  )
}

export default PhotoLightbox
