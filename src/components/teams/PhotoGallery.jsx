import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { X, ChevronLeft, ChevronRight, Download, Maximize2 } from 'lucide-react'

// ============================================
// PHOTO GALLERY — Grid view + Lightbox for Team Hub
// ============================================

export function Lightbox({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex)

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setIdx(i => Math.min(i + 1, images.length - 1))
      if (e.key === 'ArrowLeft') setIdx(i => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [images.length, onClose])

  const current = images[idx]
  if (!current) return null

  function handleDownload() {
    const a = document.createElement('a')
    a.href = current
    a.download = `team-photo-${idx + 1}.jpg`
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center" style={{ background: 'rgba(0,0,0,.92)' }} onClick={onClose}>
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10">
        <span className="text-white/50 text-sm font-mono">{idx + 1} / {images.length}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleDownload() }}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Image */}
      <img
        src={current}
        alt=""
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
        onClick={e => e.stopPropagation()}
      />

      {/* Nav arrows */}
      {idx > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); setIdx(i => i - 1) }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      {idx < images.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); setIdx(i => i + 1) }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
    </div>
  )
}

export function PhotoGallery({ teamId, isDark, g }) {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [lightboxIdx, setLightboxIdx] = useState(null)

  const loadPhotos = useCallback(async () => {
    if (!teamId) return
    setLoading(true)
    try {
      // Get all posts with media_urls for this team
      const { data, error } = await supabase
        .from('team_posts')
        .select('id, media_urls, created_at, profiles:author_id(full_name)')
        .eq('team_id', teamId)
        .eq('is_published', true)
        .not('media_urls', 'is', null)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Flatten all media URLs into a flat list
      const allPhotos = []
      ;(data || []).forEach(post => {
        ;(post.media_urls || []).forEach(url => {
          allPhotos.push({
            url,
            postId: post.id,
            date: post.created_at,
            author: post.profiles?.full_name,
          })
        })
      })
      setPhotos(allPhotos)
    } catch (err) {
      console.error('Error loading gallery:', err)
    }
    setLoading(false)
  }, [teamId])

  useEffect(() => {
    loadPhotos()
  }, [loadPhotos])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: g, borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-16">
        <span className="text-4xl opacity-20">📷</span>
        <p className="text-[11px] tw-heading tracking-wider mt-3" style={{ color: isDark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.15)' }}>
          NO PHOTOS YET
        </p>
        <p className="text-[12px] mt-1" style={{ color: isDark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.3)' }}>
          Photos from posts will appear here
        </p>
      </div>
    )
  }

  const photoUrls = photos.map(p => p.url)

  return (
    <>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {photos.map((photo, i) => (
          <button
            key={i}
            onClick={() => setLightboxIdx(i)}
            className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer"
          >
            <img src={photo.url} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition">
              <div className="absolute bottom-2 right-2">
                <Maximize2 className="w-4 h-4 text-white/70" />
              </div>
            </div>
          </button>
        ))}
      </div>

      {lightboxIdx !== null && (
        <Lightbox
          images={photoUrls}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </>
  )
}
