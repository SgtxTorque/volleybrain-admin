import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { X, Heart, Clock, Zap, Users, Edit, Trash2, ListPlus, UserPlus, ExternalLink } from 'lucide-react'
import { deleteDrill, getDrillUseCount, toggleDrillFavorite } from '../../lib/drill-service'
import { extractYouTubeId, getYouTubeEmbedUrl } from '../../lib/youtube-helpers'

const INTENSITY_CONFIG = {
  low: { label: 'Low', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  medium: { label: 'Medium', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  high: { label: 'High', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
}

export default function DrillDetailModal({ drill, visible, onClose, onEdit, onDelete, onAssignToPlayer, onAddToPlan, isFavorited, userId, showToast }) {
  const { isDark } = useTheme()
  const { user } = useAuth()
  const [useCount, setUseCount] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const [favorited, setFavorited] = useState(isFavorited)

  useEffect(() => {
    if (drill?.id) {
      setFavorited(isFavorited)
      loadUseCount()
    }
  }, [drill?.id, isFavorited])

  async function loadUseCount() {
    const { count } = await getDrillUseCount(drill.id)
    setUseCount(count || 0)
  }

  async function handleDelete() {
    if (!confirm('Delete this drill? It will be removed from all practice plans.')) return
    setDeleting(true)
    const { error } = await deleteDrill(drill.id)
    if (error) { showToast?.('Failed to delete drill', 'error'); setDeleting(false); return }
    showToast?.('Drill deleted', 'success')
    onDelete?.(drill.id)
    onClose()
  }

  async function handleToggleFavorite() {
    const result = await toggleDrillFavorite(userId || user?.id, drill.id)
    setFavorited(result.favorited)
  }

  if (!visible || !drill) return null

  const bg = isDark ? 'rgba(15,23,42,.97)' : 'rgba(255,255,255,.98)'
  const border = isDark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)'
  const textColor = isDark ? 'white' : '#1a1a1a'
  const mutedColor = isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)'
  const intensity = INTENSITY_CONFIG[drill.intensity] || INTENSITY_CONFIG.medium
  const videoId = extractYouTubeId(drill.video_url)
  const embedUrl = getYouTubeEmbedUrl(videoId)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl max-h-[85vh] rounded-xl overflow-hidden flex flex-col"
        style={{ background: bg, border: `1px solid ${border}` }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: `1px solid ${border}` }}>
          <button onClick={onClose} className="p-1 rounded-lg transition hover:bg-white/10">
            <X className="w-5 h-5" style={{ color: textColor }} />
          </button>
          <div className="flex items-center gap-2">
            <button onClick={handleToggleFavorite} className="p-2 rounded-lg transition hover:bg-white/10">
              <Heart className={`w-4 h-4 ${favorited ? 'text-red-400 fill-red-400' : ''}`} style={{ color: favorited ? undefined : mutedColor }} />
            </button>
            <button onClick={() => onEdit?.(drill)} className="p-2 rounded-lg transition hover:bg-white/10">
              <Edit className="w-4 h-4" style={{ color: mutedColor }} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Video */}
          {embedUrl ? (
            <div className="aspect-video bg-black">
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={drill.title}
              />
            </div>
          ) : drill.video_thumbnail_url ? (
            <div className="aspect-video bg-black relative">
              <img src={drill.video_thumbnail_url} alt={drill.title} className="w-full h-full object-cover" />
            </div>
          ) : null}

          <div className="p-5 space-y-4">
            {/* Title */}
            <h2 className="text-xl font-extrabold" style={{ color: textColor }}>{drill.title}</h2>

            {/* Meta badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)', color: textColor }}>
                <Clock className="w-3 h-3" /> {drill.duration_minutes} min
              </span>

              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)', color: textColor }}>
                {drill.category?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </span>

              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: intensity.bg, color: intensity.color }}>
                <Zap className="w-3 h-3" /> {intensity.label}
              </span>

              {useCount > 0 && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: isDark ? 'rgba(75,185,236,0.12)' : 'rgba(75,185,236,0.08)', color: 'var(--accent-primary)' }}>
                  Used in {useCount} plan{useCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Equipment */}
            {drill.equipment?.length > 0 && (
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest mb-1.5" style={{ color: mutedColor }}>Equipment</h4>
                <div className="flex flex-wrap gap-1.5">
                  {drill.equipment.map(e => (
                    <span key={e} className="text-xs px-2 py-0.5 rounded-md font-medium"
                      style={{ background: isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)', color: isDark ? '#94A3B8' : '#64748B' }}>
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {drill.description && (
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest mb-1.5" style={{ color: mutedColor }}>Description</h4>
                <p className="text-sm whitespace-pre-wrap" style={{ color: isDark ? '#CBD5E1' : '#475569' }}>
                  {drill.description}
                </p>
              </div>
            )}

            {/* Diagram */}
            {drill.diagram_url && (
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest mb-1.5" style={{ color: mutedColor }}>Court Diagram</h4>
                <img src={drill.diagram_url} alt="Drill diagram" className="w-full max-h-64 object-contain rounded-lg" style={{ background: isDark ? 'rgba(255,255,255,.04)' : '#f8f9fa' }} />
              </div>
            )}

            {/* Tags */}
            {drill.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {drill.tags.map(tag => (
                  <span key={tag} className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: isDark ? 'rgba(75,185,236,0.1)' : 'rgba(75,185,236,0.06)', color: 'var(--accent-primary)' }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3 shrink-0 flex items-center justify-between" style={{ borderTop: `1px solid ${border}` }}>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-lg transition"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => onAddToPlan?.(drill)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition"
              style={{ border: `1px solid ${border}`, color: textColor }}
            >
              <ListPlus className="w-3.5 h-3.5" /> Add to Plan
            </button>
            <button
              onClick={() => onAssignToPlayer?.(drill)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white transition hover:opacity-90"
              style={{ background: 'var(--accent-primary)' }}
            >
              <UserPlus className="w-3.5 h-3.5" /> Assign to Player
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
