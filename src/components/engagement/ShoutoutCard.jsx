// =============================================================================
// ShoutoutCard — Desktop card for shoutout posts in Team Hub feed
// =============================================================================

import { Heart, Star } from 'lucide-react'
import { useMemo } from 'react'
import { useTheme } from '../../contexts/ThemeContext'

// =============================================================================
// Parse helper
// =============================================================================

export function parseShoutoutMetadata(json) {
  if (!json) return null
  try {
    const data = JSON.parse(json)
    if (!data.receiverName || !data.categoryEmoji) return null
    return data
  } catch {
    return null
  }
}

// =============================================================================
// Time ago helper
// =============================================================================

function getTimeAgo(dateStr) {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `${diffD}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// =============================================================================
// Component
// =============================================================================

export default function ShoutoutCard({ metadataJson, giverName, createdAt }) {
  const { isDark } = useTheme()
  const data = useMemo(() => parseShoutoutMetadata(metadataJson), [metadataJson])

  if (!data) return null

  const borderColor = data.categoryColor || '#F97316'
  const timeAgo = getTimeAgo(createdAt)

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.01]"
      style={{
        border: `1.5px solid ${borderColor}`,
        backgroundColor: borderColor + '08',
      }}
    >
      {/* Accent stripe */}
      <div className="h-1" style={{ backgroundColor: borderColor }} />

      <div className="p-5 flex flex-col items-center gap-2">
        {/* Header row */}
        <div className="flex items-center justify-between w-full">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide"
            style={{ backgroundColor: borderColor + '20', color: borderColor }}
          >
            <Heart size={10} />
            Shoutout
          </span>
          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {timeAgo}
          </span>
        </div>

        {/* Large emoji */}
        <span className="text-5xl my-1">{data.categoryEmoji}</span>

        {/* Main text */}
        <p className={`text-[15px] font-medium text-center leading-relaxed ${isDark ? 'text-white' : 'text-slate-800'}`}>
          <span className="font-bold">{giverName}</span> gave{' '}
          <span className="font-bold">{data.receiverName}</span> a{' '}
          <span className="font-bold" style={{ color: borderColor }}>{data.categoryName}</span> shoutout!
        </p>

        {/* Optional message */}
        {data.message && (
          <div
            className="px-4 py-2.5 rounded-xl mt-1"
            style={{ backgroundColor: borderColor + '12' }}
          >
            <p className={`text-sm italic text-center leading-5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              &ldquo;{data.message}&rdquo;
            </p>
          </div>
        )}

        {/* XP pill */}
        <div className="flex items-center gap-1 mt-1">
          <Star size={12} className="text-yellow-400 fill-yellow-400" />
          <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            +15 XP
          </span>
        </div>
      </div>
    </div>
  )
}
