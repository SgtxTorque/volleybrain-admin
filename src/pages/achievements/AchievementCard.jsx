import { useState, useEffect } from 'react'
import { useThemeClasses } from '../../contexts/ThemeContext'
import { Check, Lock, Star } from '../../constants/icons'

// Rarity config for visual styling
const RARITY_CONFIG = {
  common: {
    label: 'Common',
    bgGradient: 'from-zinc-600 to-zinc-700',
    borderColor: 'border-zinc-500/50',
    glowColor: 'shadow-zinc-500/20',
    shimmer: false,
    glowIntensity: 0.3,
  },
  uncommon: {
    label: 'Uncommon',
    bgGradient: 'from-emerald-600 to-emerald-700',
    borderColor: 'border-emerald-400/50',
    glowColor: 'shadow-emerald-500/30',
    shimmer: false,
    glowIntensity: 0.4,
  },
  rare: {
    label: 'Rare',
    bgGradient: 'from-blue-500 to-blue-600',
    borderColor: 'border-blue-400/50',
    glowColor: 'shadow-blue-500/40',
    shimmer: false,
    glowIntensity: 0.5,
  },
  epic: {
    label: 'Epic',
    bgGradient: 'from-purple-500 to-purple-600',
    borderColor: 'border-purple-400/60',
    glowColor: 'shadow-purple-500/50',
    shimmer: true,
    glowIntensity: 0.6,
  },
  legendary: {
    label: 'Legendary',
    bgGradient: 'from-amber-400 via-yellow-500 to-orange-500',
    borderColor: 'border-yellow-400/70',
    glowColor: 'shadow-yellow-500/60',
    shimmer: true,
    prismatic: true,
    glowIntensity: 0.8,
  },
}

// Category icons and colors (fallback)
const CATEGORY_CONFIG = {
  offensive: { icon: '⚔️', label: 'Offensive', color: '#EF4444' },
  defensive: { icon: '🛡️', label: 'Defensive', color: '#3B82F6' },
  playmaker: { icon: '🎯', label: 'Playmaker', color: '#10B981' },
  heart: { icon: '💜', label: 'Heart & Hustle', color: '#A855F7' },
  elite: { icon: '⭐', label: 'Elite', color: '#FFD700' },
}

// Image component with loading state and fallback
function LayeredImage({ src, alt, className, style, fallback, onLoad }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoaded(false)
    setError(false)
  }, [src])

  if (error || !src) {
    return fallback || null
  }

  return (
    <>
      {!loaded && (
        <div className={`${className} animate-pulse bg-zinc-700/50`} style={style} />
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        style={style}
        onLoad={() => {
          setLoaded(true)
          onLoad?.()
        }}
        onError={() => setError(true)}
      />
    </>
  )
}

export function AchievementCard({ 
  achievement, 
  isEarned = false, 
  earnedData = null,
  currentValue = 0,
  progress = 0,
  onClick,
  size = 'default', // 'compact', 'default', 'large'
}) {
  const tc = useThemeClasses()
  const [isHovered, setIsHovered] = useState(false)
  const [imagesLoaded, setImagesLoaded] = useState(0)
  
  const rarity = RARITY_CONFIG[achievement.rarity] || RARITY_CONFIG.common
  const category = CATEGORY_CONFIG[achievement.category] || CATEGORY_CONFIG.offensive
  
  // Check if we have image URL
  const hasImages = !!achievement.icon_url
  
  // Format earned date
  const earnedDate = earnedData?.earned_at 
    ? new Date(earnedData.earned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null

  // Size classes
  const sizeClasses = {
    compact: 'w-20 h-24',
    default: 'w-28 h-36',
    large: 'w-36 h-44',
  }
  
  const badgeSizes = {
    compact: { container: 'w-14 h-14', icon: 'w-8 h-8', frame: 'w-14 h-14', glow: 'w-20 h-20' },
    default: { container: 'w-18 h-18', icon: 'w-10 h-10', frame: 'w-18 h-18', glow: 'w-24 h-24' },
    large: { container: 'w-22 h-22', icon: 'w-12 h-12', frame: 'w-22 h-22', glow: 'w-28 h-28' },
  }
  
  const iconSizes = {
    compact: 'text-2xl',
    default: 'text-3xl',
    large: 'text-4xl',
  }

  const bs = badgeSizes[size]

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative group cursor-pointer
        ${sizeClasses[size]}
        transition-all duration-300 ease-out
        ${isHovered ? 'scale-105 z-10' : 'scale-100'}
      `}
    >
      {/* Outer glow effect for earned badges */}
      {isEarned && (
        <div 
          className={`
            absolute inset-0 rounded-xl blur-xl opacity-0 group-hover:opacity-60
            transition-opacity duration-300
          `}
          style={{ 
            background: `radial-gradient(circle, ${achievement.color_glow || achievement.color_primary} 0%, transparent 70%)` 
          }}
        />
      )}
      
      {/* Main card */}
      <div
        className={`
          relative w-full h-full rounded-xl overflow-hidden
          border-2 transition-all duration-300
          ${isEarned 
            ? `${rarity.borderColor} ${rarity.glowColor} shadow-lg` 
            : 'border-zinc-700/50'
          }
          ${isHovered && isEarned ? 'shadow-2xl' : ''}
        `}
        style={{
          background: isEarned 
            ? `linear-gradient(145deg, ${achievement.color_primary}15 0%, ${achievement.color_secondary || achievement.color_primary}25 100%)`
            : 'linear-gradient(145deg, #27272a 0%, #18181b 100%)',
        }}
      >
        {/* Shimmer effect for epic/legendary */}
        {isEarned && rarity.shimmer && (
          <div className="absolute inset-0 overflow-hidden">
            <div 
              className={`
                absolute inset-0 
                bg-gradient-to-r from-transparent via-white/20 to-transparent
                -translate-x-full group-hover:translate-x-full
                transition-transform duration-1000 ease-in-out
              `}
              style={{ transform: isHovered ? 'translateX(100%)' : 'translateX(-100%)' }}
            />
          </div>
        )}
        
        {/* Prismatic animation for legendary */}
        {isEarned && rarity.prismatic && (
          <div 
            className="absolute inset-0 opacity-30 mix-blend-overlay animate-prismatic"
            style={{
              background: 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #8b00ff, #ff0000)',
              backgroundSize: '400% 400%',
            }}
          />
        )}
        
        {/* Top section - Rarity bar */}
        <div 
          className={`
            h-1.5 w-full
            bg-gradient-to-r ${isEarned ? rarity.bgGradient : 'from-zinc-700 to-zinc-800'}
          `}
        />
        
        {/* Badge icon section */}
        <div className="flex flex-col items-center justify-center pt-3 pb-2">
          <div 
            className={`
              relative flex items-center justify-center
              ${size === 'compact' ? 'w-14 h-14' : size === 'large' ? 'w-20 h-20' : 'w-16 h-16'}
              ${!isEarned ? 'grayscale opacity-50' : ''}
            `}
          >
            {hasImages ? (
              <img
                src={achievement.icon_url}
                alt={achievement.name}
                className="w-full h-full object-contain rounded-lg"
              />
            ) : (
              <div 
                className={`
                  w-full h-full rounded-lg flex items-center justify-center
                `}
                style={{
                  background: isEarned 
                    ? `linear-gradient(145deg, ${achievement.color_primary}40 0%, ${achievement.color_secondary || achievement.color_primary}60 100%)`
                    : 'linear-gradient(145deg, #3f3f46 0%, #27272a 100%)',
                  border: `2px solid ${isEarned ? achievement.color_primary + '80' : '#52525b'}`,
                }}
              >
                <span className={`${iconSizes[size]}`}>
                  {achievement.icon || category.icon}
                </span>
              </div>
            )}
            
            {/* Earned checkmark */}
            {isEarned && (
              <div 
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg"
                style={{ zIndex: 10 }}
              >
                <Check className="w-3 h-3 text-white" strokeWidth={3} />
              </div>
            )}
            
            {/* Lock icon for unearned */}
            {!isEarned && progress === 0 && (
              <div 
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center"
                style={{ zIndex: 10 }}
              >
                <Lock className="w-3 h-3 text-zinc-500" />
              </div>
            )}
          </div>
        </div>
        
        {/* Name */}
        <div className="px-2 text-center">
          <p 
            className={`
              text-xs font-bold uppercase tracking-wide leading-tight
              ${isEarned ? 'text-white' : 'text-zinc-500'}
            `}
            style={{ 
              textShadow: isEarned ? `0 1px 2px ${achievement.color_secondary || achievement.color_primary}` : 'none',
              fontSize: size === 'compact' ? '0.6rem' : size === 'large' ? '0.75rem' : '0.65rem',
            }}
          >
            {achievement.name}
          </p>
        </div>
        
        {/* Bottom section - Progress or earned date */}
        <div className="absolute bottom-0 left-0 right-0 px-2 pb-2">
          {isEarned ? (
            // Earned date
            <div className="text-center">
              <span 
                className="text-xs text-emerald-400 font-medium"
                style={{ fontSize: size === 'compact' ? '0.55rem' : '0.65rem' }}
              >
                {earnedDate}
              </span>
            </div>
          ) : achievement.threshold ? (
            // Progress bar and count
            <div className="space-y-1">
              <div className="flex justify-center">
                <span 
                  className="text-xs text-zinc-400 font-mono"
                  style={{ fontSize: size === 'compact' ? '0.55rem' : '0.65rem' }}
                >
                  {currentValue}/{achievement.threshold}
                </span>
              </div>
              <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min(progress, 100)}%`,
                    background: progress > 0 
                      ? `linear-gradient(90deg, ${achievement.color_primary} 0%, ${achievement.color_secondary || achievement.color_primary} 100%)`
                      : 'transparent',
                  }}
                />
              </div>
            </div>
          ) : (
            // No progress (special achievements)
            <div className="text-center">
              <span 
                className="text-xs text-zinc-600"
                style={{ fontSize: size === 'compact' ? '0.55rem' : '0.65rem' }}
              >
                Special
              </span>
            </div>
          )}
        </div>
        
        {/* Rarity indicator dot */}
        <div className="absolute top-2.5 right-2">
          <div 
            className={`
              w-2 h-2 rounded-full
              ${isEarned ? '' : 'opacity-30'}
            `}
            style={{
              background: isEarned 
                ? `linear-gradient(145deg, ${
                    achievement.rarity === 'legendary' ? '#FFD700' :
                    achievement.rarity === 'epic' ? '#A855F7' :
                    achievement.rarity === 'rare' ? '#3B82F6' :
                    achievement.rarity === 'uncommon' ? '#10B981' :
                    '#71717a'
                  } 0%, ${
                    achievement.rarity === 'legendary' ? '#F59E0B' :
                    achievement.rarity === 'epic' ? '#7C3AED' :
                    achievement.rarity === 'rare' ? '#1D4ED8' :
                    achievement.rarity === 'uncommon' ? '#059669' :
                    '#52525b'
                  } 100%)`
                : '#52525b',
              boxShadow: isEarned && (achievement.rarity === 'legendary' || achievement.rarity === 'epic')
                ? `0 0 6px ${achievement.rarity === 'legendary' ? '#FFD700' : '#A855F7'}`
                : 'none',
            }}
          />
        </div>
      </div>
      
      {/* CSS for animations */}
      <style>{`
        @keyframes prismatic {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-prismatic {
          animation: prismatic 3s ease infinite;
        }
      `}</style>
    </div>
  )
}

// Compact version for dashboard widgets
export function AchievementBadge({ achievement, isEarned, onClick }) {
  return (
    <AchievementCard 
      achievement={achievement} 
      isEarned={isEarned} 
      onClick={onClick}
      size="compact"
    />
  )
}

// Calling card preview component
export function CallingCardPreview({ achievement, isEquipped = false, onClick }) {
  const tc = useThemeClasses()
  const hasFrameUrl = achievement.frame_url && achievement.type === 'calling_card'
  
  return (
    <div
      onClick={onClick}
      className={`
        relative cursor-pointer rounded-xl overflow-hidden
        border-2 transition-all duration-300
        ${isEquipped 
          ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/30' 
          : 'border-zinc-700/50 hover:border-zinc-600'
        }
        h-20 group
      `}
    >
      {/* Background - either image or gradient */}
      {hasFrameUrl ? (
        <LayeredImage
          src={achievement.frame_url}
          alt={achievement.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : achievement.banner_gradient ? (
        <div 
          className="absolute inset-0"
          style={{ background: achievement.banner_gradient }}
        />
      ) : (
        <div 
          className="absolute inset-0"
          style={{ 
            background: `linear-gradient(135deg, ${achievement.color_primary} 0%, ${achievement.color_secondary || achievement.color_primary} 100%)` 
          }}
        />
      )}
      
      {/* Overlay with name */}
      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
        <div className="text-center">
          {achievement.icon_url ? (
            <LayeredImage
              src={achievement.icon_url}
              alt={achievement.name}
              className="w-8 h-8 mx-auto object-contain"
              fallback={<span className="text-2xl">{achievement.icon}</span>}
            />
          ) : (
            <span className="text-2xl">{achievement.icon}</span>
          )}
          <p className="text-xs font-bold text-white uppercase tracking-wide mt-1">
            {achievement.name}
          </p>
        </div>
      </div>
      
      {/* Equipped indicator */}
      {isEquipped && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--accent-primary)] flex items-center justify-center">
          <Check className="w-3 h-3 text-white" strokeWidth={3} />
        </div>
      )}
      
      {/* Hover effect */}
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
    </div>
  )
}

export default AchievementCard
