// =============================================================================
// ShoutoutCard — Desktop shoutout card for team feed
// =============================================================================

import React, { useMemo } from 'react'
import { Heart, Star } from 'lucide-react'

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

export default function ShoutoutCard({ metadataJson, giverName, createdAt, isDark }) {
  const data = useMemo(() => parseShoutoutMetadata(metadataJson), [metadataJson])

  if (!data) return null

  const borderColor = data.categoryColor || '#3B82F6'
  const timeAgo = getTimeAgo(createdAt)

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border: `1.5px solid ${borderColor}`,
        background: `${borderColor}08`,
      }}
    >
      {/* Accent stripe */}
      <div className="h-1" style={{ background: borderColor }} />

      <div className="p-5 flex flex-col items-center gap-2.5">
        {/* Header row */}
        <div className="w-full flex items-center justify-between">
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
            style={{ background: `${borderColor}20`, color: borderColor }}
          >
            <Heart className="w-3 h-3" />
            Shoutout
          </div>
          <span
            className="text-xs"
            style={{ color: isDark ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.35)' }}
          >
            {timeAgo}
          </span>
        </div>

        {/* Large emoji */}
        <span className="text-5xl my-1">{data.categoryEmoji}</span>

        {/* Main text */}
        <p
          className="text-[15px] font-medium text-center leading-relaxed"
          style={{ color: isDark ? 'white' : '#1a1a1a' }}
        >
          <span className="font-bold">{giverName}</span> gave{' '}
          <span className="font-bold">{data.receiverName}</span> a{' '}
          <span className="font-bold" style={{ color: borderColor }}>
            {data.categoryName}
          </span>{' '}
          shoutout!
        </p>

        {/* Optional message */}
        {data.message && (
          <div
            className="px-4 py-2.5 rounded-xl mt-1"
            style={{ background: `${borderColor}12` }}
          >
            <p
              className="text-sm italic text-center leading-relaxed"
              style={{ color: isDark ? 'rgba(255,255,255,.55)' : 'rgba(0,0,0,.55)' }}
            >
              &ldquo;{data.message}&rdquo;
            </p>
          </div>
        )}

        {/* XP pill */}
        <div className="flex items-center gap-1.5 mt-1">
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          <span
            className="text-xs font-semibold"
            style={{ color: isDark ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.35)' }}
          >
            +15 XP
          </span>
        </div>
      </div>
    </div>
  )
}
