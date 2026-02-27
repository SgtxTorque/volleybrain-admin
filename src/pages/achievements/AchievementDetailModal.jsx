import { useState, useEffect } from 'react'
import { useThemeClasses, useTheme } from '../../contexts/ThemeContext'
import { X, Check, Lock, Target, Calendar, Users, Trophy, Star, ChevronRight } from '../../constants/icons'
import { supabase } from '../../lib/supabase'

// Rarity styling
const RARITY_STYLES = {
  common: { label: 'Common', color: '#71717a', bgClass: 'bg-zinc-600' },
  uncommon: { label: 'Uncommon', color: '#10B981', bgClass: 'bg-emerald-600' },
  rare: { label: 'Rare', color: '#3B82F6', bgClass: 'bg-blue-500' },
  epic: { label: 'Epic', color: '#A855F7', bgClass: 'bg-purple-500' },
  legendary: { label: 'Legendary', color: '#FFD700', bgClass: 'bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500' },
}

const CATEGORY_CONFIG = {
  offensive: { icon: '⚔️', label: 'Offensive', color: '#EF4444' },
  defensive: { icon: '🛡️', label: 'Defensive', color: '#3B82F6' },
  playmaker: { icon: '🎯', label: 'Playmaker', color: '#10B981' },
  heart: { icon: '💜', label: 'Heart & Hustle', color: '#A855F7' },
  elite: { icon: '⭐', label: 'Elite', color: '#FFD700' },
}

// Image component with loading state
function LayeredImage({ src, alt, className, style, fallback }) {
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
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </>
  )
}

export function AchievementDetailModal({
  achievement,
  isEarned = false,
  earnedData = null,
  currentValue = 0,
  progress = 0,
  isTracked = false,
  onClose,
  onTrack,
  onUntrack,
  playerId,
}) {
  const tc = useThemeClasses()
  const { colors } = useTheme()
  const [earnPercentage, setEarnPercentage] = useState(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [showUnlockEffect, setShowUnlockEffect] = useState(false)
  
  const rarity = RARITY_STYLES[achievement.rarity] || RARITY_STYLES.common
  const category = CATEGORY_CONFIG[achievement.category] || CATEGORY_CONFIG.offensive
  const hasImages = !!achievement.icon_url
  
  // Show unlock effect animation briefly when modal opens for earned achievements
  useEffect(() => {
    if (isEarned && achievement.unlock_effect_url) {
      setShowUnlockEffect(true)
      const timer = setTimeout(() => setShowUnlockEffect(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [isEarned, achievement.unlock_effect_url])
  
  // Load achievement statistics (what % of players have earned this)
  useEffect(() => {
    if (achievement.id) {
      loadAchievementStats()
    }
  }, [achievement.id])
  
  async function loadAchievementStats() {
    setLoadingStats(true)
    try {
      // Get total players
      const { count: totalPlayers } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
      
      // Get players who earned this achievement
      const { count: earnedCount } = await supabase
        .from('player_achievements')
        .select('*', { count: 'exact', head: true })
        .eq('achievement_id', achievement.id)
      
      if (totalPlayers && totalPlayers > 0) {
        setEarnPercentage(Math.round((earnedCount / totalPlayers) * 100))
      }
    } catch (err) {
      console.error('Error loading achievement stats:', err)
    }
    setLoadingStats(false)
  }
  
  // Format dates
  const earnedDate = earnedData?.earned_at 
    ? new Date(earnedData.earned_at).toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      })
    : null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className={`
          ${tc.cardBg} rounded-xl w-full max-w-md overflow-hidden
          border ${tc.border} shadow-2xl
          animate-in fade-in zoom-in-95 duration-200
        `}
      >
        {/* Hero section with badge */}
        <div 
          className="relative h-56 flex items-center justify-center overflow-hidden"
          style={{
            background: isEarned
              ? `linear-gradient(145deg, ${achievement.color_primary}30 0%, ${achievement.color_secondary || achievement.color_primary}50 100%)`
              : 'linear-gradient(145deg, #27272a 0%, #18181b 100%)',
          }}
        >
          {/* Background pattern */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, ${isEarned ? achievement.color_primary : '#52525b'} 1px, transparent 0)`,
              backgroundSize: '24px 24px',
            }}
          />
          
          {/* Animated glow effect */}
          {isEarned && (
            <div 
              className="absolute inset-0 opacity-40 animate-pulse-slow"
              style={{
                background: `radial-gradient(circle at center, ${achievement.color_glow || achievement.color_primary}40 0%, transparent 60%)`,
              }}
            />
          )}
          
          {/* Unlock effect overlay */}
          {showUnlockEffect && achievement.unlock_effect_url && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-unlock-burst">
              <LayeredImage
                src={achievement.unlock_effect_url}
                alt="unlock effect"
                className="w-48 h-48 object-contain"
                style={{ opacity: 0.8 }}
              />
            </div>
          )}
          
          {/* Large badge */}
          <div 
            className={`
              relative w-32 h-32 flex items-center justify-center
              ${isEarned ? '' : 'grayscale opacity-50'}
            `}
          >
            {hasImages ? (
              <img
                src={achievement.icon_url}
                alt={achievement.name}
                className="w-full h-full object-contain rounded-xl"
              />
            ) : (
              <div 
                className="w-28 h-28 rounded-xl flex items-center justify-center"
                style={{
                  background: isEarned 
                    ? `linear-gradient(145deg, ${achievement.color_primary}50 0%, ${achievement.color_secondary || achievement.color_primary}70 100%)`
                    : 'linear-gradient(145deg, #3f3f46 0%, #27272a 100%)',
                  border: `3px solid ${isEarned ? achievement.color_primary : '#52525b'}`,
                  boxShadow: isEarned 
                    ? `0 0 30px ${achievement.color_primary}40, inset 0 0 20px ${achievement.color_primary}20`
                    : 'none',
                }}
              >
                <span className="text-6xl">{achievement.icon}</span>
              </div>
            )}
            
            {/* Earned checkmark */}
            {isEarned && (
              <div 
                className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg"
                style={{ boxShadow: '0 0 15px #10B98150', zIndex: 10 }}
              >
                <Check className="w-6 h-6 text-white" strokeWidth={3} />
              </div>
            )}
            
            {/* Lock for unearned */}
            {!isEarned && (
              <div 
                className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center"
                style={{ zIndex: 10 }}
              >
                <Lock className="w-5 h-5 text-zinc-500" />
              </div>
            )}
          </div>
          
          {/* Close button */}
          <button
            onClick={onClose}
            className={`
              absolute top-4 right-4 w-10 h-10 rounded-full
              bg-black/30 hover:bg-black/50 
              flex items-center justify-center transition-colors
            `}
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          {/* Rarity badge */}
          <div 
            className={`
              absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
              ${rarity.bgClass} text-white
            `}
          >
            {rarity.label}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title and description */}
          <div className="text-center">
            <h2 className={`text-2xl font-black uppercase tracking-wide ${tc.text}`}>
              {achievement.name}
            </h2>
            {achievement.description && (
              <p className={`mt-1 text-sm ${tc.textSecondary}`}>
                {achievement.description}
              </p>
            )}
          </div>
          
          {/* How to earn */}
          <div className={`p-4 rounded-xl ${tc.inputBg} border ${tc.border}`}>
            <div className="flex items-start gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ 
                  background: `${category.color}20`,
                  border: `1px solid ${category.color}40`,
                }}
              >
                <Target className="w-5 h-5" style={{ color: category.color }} />
              </div>
              <div>
                <p className={`text-xs font-medium uppercase tracking-wide ${tc.textMuted}`}>
                  How to Unlock
                </p>
                <p className={`mt-1 text-sm font-medium ${tc.text}`}>
                  {achievement.how_to_earn}
                </p>
              </div>
            </div>
          </div>
          
          {/* Progress section (if not earned and has progress) */}
          {!isEarned && achievement.threshold && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className={`text-sm font-medium ${tc.text}`}>Progress</span>
                <span className={`text-sm font-bold ${tc.text}`}>
                  {currentValue} / {achievement.threshold}
                </span>
              </div>
              <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min(progress, 100)}%`,
                    background: `linear-gradient(90deg, ${achievement.color_primary} 0%, ${achievement.color_secondary || achievement.color_primary} 100%)`,
                    boxShadow: progress > 0 ? `0 0 10px ${achievement.color_primary}50` : 'none',
                  }}
                />
              </div>
              <p className={`text-xs ${tc.textMuted}`}>
                {achievement.threshold - currentValue} more to unlock
              </p>
            </div>
          )}
          
          {/* Earned context */}
          {isEarned && earnedData && (
            <div className={`p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-emerald-400 uppercase tracking-wide">
                    Unlocked
                  </p>
                  <p className="text-sm font-medium text-emerald-300">
                    {earnedDate}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Stats row */}
          <div className="flex gap-4">
            {/* Category */}
            <div className={`flex-1 p-3 rounded-xl ${tc.inputBg} border ${tc.border} text-center`}>
              <span className="text-xl">{category.icon}</span>
              <p className={`mt-1 text-xs ${tc.textMuted}`}>{category.label}</p>
            </div>
            
            {/* Type */}
            <div className={`flex-1 p-3 rounded-xl ${tc.inputBg} border ${tc.border} text-center`}>
              <span className="text-xl">
                {achievement.type === 'badge' ? '🏅' : 
                 achievement.type === 'calling_card' ? '🎴' : '🛡️'}
              </span>
              <p className={`mt-1 text-xs ${tc.textMuted} capitalize`}>{achievement.type.replace('_', ' ')}</p>
            </div>
            
            {/* Rarity percentage */}
            <div className={`flex-1 p-3 rounded-xl ${tc.inputBg} border ${tc.border} text-center`}>
              {loadingStats ? (
                <div className="w-5 h-5 mx-auto border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin" />
              ) : earnPercentage !== null ? (
                <>
                  <span className={`text-lg font-bold ${tc.text}`}>{earnPercentage}%</span>
                  <p className={`mt-0.5 text-xs ${tc.textMuted}`}>have this</p>
                </>
              ) : (
                <>
                  <Users className={`w-5 h-5 mx-auto ${tc.textMuted}`} />
                  <p className={`mt-1 text-xs ${tc.textMuted}`}>—</p>
                </>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3">
            {!isEarned && (
              <button
                onClick={() => isTracked ? onUntrack?.() : onTrack?.()}
                className={`
                  flex-1 py-3 px-4 rounded-xl font-medium text-sm
                  flex items-center justify-center gap-2 transition-all
                  ${isTracked 
                    ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/50' 
                    : `${tc.inputBg} ${tc.text} border ${tc.border} hover:border-[var(--accent-primary)]`
                  }
                `}
              >
                <Star className={`w-4 h-4 ${isTracked ? 'fill-current' : ''}`} />
                {isTracked ? 'Tracking' : 'Track This'}
              </button>
            )}
            
            <button
              onClick={onClose}
              className={`
                ${isEarned ? 'flex-1' : ''} py-3 px-6 rounded-xl font-medium text-sm
                ${tc.inputBg} ${tc.text} border ${tc.border}
                hover:bg-zinc-700/50 transition-colors
              `}
            >
              Close
            </button>
          </div>
        </div>
      </div>
      
      {/* Animation styles */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes zoom-in-95 {
          from { transform: scale(0.95); }
          to { transform: scale(1); }
        }
        @keyframes unlock-burst {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.6; }
        }
        .animate-in {
          animation: fade-in 0.2s ease-out, zoom-in-95 0.2s ease-out;
        }
        .animate-unlock-burst {
          animation: unlock-burst 2s ease-out forwards;
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

export default AchievementDetailModal
