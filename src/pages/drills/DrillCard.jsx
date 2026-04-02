import { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { Heart, Play, Clock, Zap } from 'lucide-react'

const INTENSITY_CONFIG = {
  low: { label: 'Low', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  medium: { label: 'Med', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  high: { label: 'High', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
}

export default function DrillCard({ drill, isFavorited, onToggleFavorite, onClick }) {
  const { isDark } = useTheme()
  const [imgError, setImgError] = useState(false)

  const intensity = INTENSITY_CONFIG[drill.intensity] || INTENSITY_CONFIG.medium
  const hasVideo = !!drill.video_url
  const thumbnail = !imgError && drill.video_thumbnail_url

  return (
    <div
      onClick={() => onClick?.(drill)}
      className={`group relative rounded-[14px] border overflow-hidden cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg ${
        isDark
          ? 'bg-white/[0.03] border-white/[0.06] hover:border-white/[0.12]'
          : 'bg-white border-[#E8ECF2] hover:border-[#CBD5E1]'
      }`}
    >
      {/* Thumbnail / Placeholder */}
      <div className="relative aspect-video overflow-hidden">
        {thumbnail ? (
          <img
            src={drill.video_thumbnail_url}
            alt={drill.title}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${
            isDark ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-slate-100 to-slate-200'
          }`}>
            <span className="text-3xl">🏐</span>
          </div>
        )}

        {/* Play overlay */}
        {hasVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition">
            <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
            </div>
          </div>
        )}

        {/* Duration badge */}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-xs font-bold bg-black/60 text-white flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {drill.duration_minutes}m
        </div>

        {/* Favorite */}
        <button
          onClick={e => { e.stopPropagation(); onToggleFavorite?.(drill.id) }}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 hover:bg-black/60 transition"
        >
          <Heart
            className={`w-3.5 h-3.5 transition ${isFavorited ? 'text-red-400 fill-red-400' : 'text-white/70'}`}
          />
        </button>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className={`text-base font-bold truncate ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
          {drill.title}
        </h3>

        <div className="flex items-center gap-2 mt-1.5">
          {/* Category pill */}
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            isDark ? 'bg-white/[0.06] text-slate-400' : 'bg-slate-100 text-slate-500'
          }`}>
            {drill.category?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </span>

          {/* Intensity */}
          <span
            className="text-xs font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5"
            style={{ background: intensity.bg, color: intensity.color }}
          >
            <Zap className="w-2.5 h-2.5" />
            {intensity.label}
          </span>
        </div>
      </div>
    </div>
  )
}
