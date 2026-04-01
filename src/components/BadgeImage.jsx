import { useState, useEffect } from 'react'

/**
 * BadgeImage - renders a pre-composited badge image from Supabase Storage.
 * Prefers badge_image_url (new composited badge), falls back to icon_url (legacy layered).
 * Shows a rarity-colored emoji fallback if neither URL is available.
 */

const RARITY_COLORS = {
  common: '#71717a',
  uncommon: '#10B981',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#FFD700',
}

function FallbackBadge({ rarity, size, icon }) {
  const color = RARITY_COLORS[rarity] || RARITY_COLORS.common
  return (
    <div
      className="rounded-lg flex items-center justify-center"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(145deg, ${color}30 0%, ${color}50 100%)`,
        border: `2px solid ${color}60`,
      }}
    >
      <span style={{ fontSize: size * 0.5 }}>{icon || '🏅'}</span>
    </div>
  )
}

export function BadgeImage({
  achievement,
  size = 64,
  locked = false,
  className = '',
}) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  const imageUrl = achievement.badge_image_url || achievement.icon_url

  useEffect(() => {
    setLoaded(false)
    setError(false)
  }, [imageUrl])

  if (!imageUrl || error) {
    return (
      <FallbackBadge
        rarity={achievement.rarity}
        size={size}
        icon={achievement.icon}
      />
    )
  }

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {!loaded && (
        <div
          className="absolute inset-0 animate-pulse bg-zinc-700/50 rounded-lg"
          style={{ width: size, height: size }}
        />
      )}
      <img
        src={imageUrl}
        alt={achievement.name}
        className={`w-full h-full object-contain ${loaded ? (locked ? 'opacity-70' : 'opacity-100') : 'opacity-0'} transition-opacity duration-300`}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  )
}

export default BadgeImage
