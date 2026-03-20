import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../contexts/ThemeContext'
import { ChevronRight } from '../../constants/icons'

const BADGE_DEFS = {
  'ace_sniper': { name: 'Ace Sniper', icon: '🏐', color: '#F59E0B', rarity: 'Rare' },
  'kill_shot': { name: 'Kill Shot', icon: '⚡', color: '#EF4444', rarity: 'Epic' },
  'heart_breaker': { name: 'Heart Breaker', icon: '💜', color: '#EC4899', rarity: 'Rare' },
  'ground_zero': { name: 'Ground Zero', icon: '💎', color: '#06B6D4', rarity: 'Uncommon' },
  'iron_fortress': { name: 'Iron Fortress', icon: '🛡️', color: '#6366F1', rarity: 'Legendary' },
  'puppet_master': { name: 'Puppet Master', icon: '🎭', color: '#F59E0B', rarity: 'Epic' },
  'ace_master': { name: 'Ace Master', icon: '🎯', color: '#10B981', rarity: 'Rare' },
  'dig_machine': { name: 'Dig Machine', icon: '💪', color: '#8B5CF6', rarity: 'Uncommon' },
  'mvp': { name: 'MVP', icon: '⭐', color: '#EF4444', rarity: 'Legendary' },
  'team_player': { name: 'Team Player', icon: '🤝', color: '#3B82F6', rarity: 'Common' },
  'first_practice': { name: 'First Practice', icon: '🌟', color: '#F59E0B', rarity: 'Common' },
  'perfect_attendance': { name: 'Perfect Attendance', icon: '⭐', color: '#10B981', rarity: 'Rare' },
  'attendance_streak_5': { name: '5 Game Streak', icon: '🔥', color: '#EF4444', rarity: 'Uncommon' },
  'attendance_streak_10': { name: '10 Game Streak', icon: '💥', color: '#EF4444', rarity: 'Rare' },
  'first_game': { name: 'Game Day', icon: '🎮', color: '#3B82F6', rarity: 'Common' },
  'first_win': { name: 'Winner', icon: '🥇', color: '#F59E0B', rarity: 'Common' },
}

const RARITY_COLORS = { 'Common': '#6B7280', 'Uncommon': '#10B981', 'Rare': '#3B82F6', 'Epic': '#8B5CF6', 'Legendary': '#F59E0B' }

/**
 * ParentHeroCard — mobile AthleteCard parity
 * White card with rounded corners, avatar with jersey badge, player metadata,
 * expandable stat pills, level indicator. Multi-child carousel below.
 */
export default function ParentHeroCard({
  selectedPlayerTeam,
  playerTeams = [],
  onSelectPlayerTeam,
  onNavigate,
  navigateToTeamWall,
  onShowPayment,
  onShowAddChild,
  onShowEventDetail,
  onPhotoUploaded,
  showToast,
}) {
  const { isDark } = useTheme()
  const [playerStats, setPlayerStats] = useState(null)
  const [earnedBadges, setEarnedBadges] = useState([])
  const [expanded, setExpanded] = useState(false)

  const playerId = selectedPlayerTeam?.playerId
  const teamId = selectedPlayerTeam?.teamId

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      if (!playerId) return

      // Player stats
      try {
        const { data, error } = await supabase
          .from('player_season_stats')
          .select('*')
          .eq('player_id', playerId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (!cancelled && !error) setPlayerStats(data)
      } catch { /* silent */ }

      // Badges
      try {
        const { data, error } = await supabase
          .from('player_achievements')
          .select('*, achievements(name, icon, rarity, color_primary)')
          .eq('player_id', playerId)
          .order('created_at', { ascending: false })
          .limit(3)
        if (!cancelled && !error) setEarnedBadges(data || [])
      } catch { /* silent */ }
    }

    loadData()
    return () => { cancelled = true }
  }, [playerId])

  // Upload handler
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !playerId) return
    const ext = file.name.split('.').pop()
    const filePath = `${playerId}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('player-photos')
      .upload(filePath, file, { upsert: true })
    if (uploadError) {
      showToast?.('Upload failed: ' + uploadError.message, 'error')
      return
    }
    const { data: urlData } = supabase.storage
      .from('player-photos')
      .getPublicUrl(filePath)
    const photoUrl = urlData?.publicUrl + '?t=' + Date.now()
    const { error: updateError } = await supabase
      .from('players')
      .update({ photo_url: photoUrl })
      .eq('id', playerId)
    if (updateError) {
      showToast?.('Failed to save: ' + updateError.message, 'error')
      return
    }
    onPhotoUploaded?.(playerId, photoUrl)
    showToast?.('Photo updated!', 'success')
  }

  // Loading state
  if (!selectedPlayerTeam) {
    return (
      <div className="bg-white border border-brand-border rounded-2xl p-8 text-center shadow-sm" style={{ minHeight: '160px' }}>
        <div className="text-4xl mb-2">👤</div>
        <p className="text-sm font-medium text-brand-text-muted">Loading player...</p>
      </div>
    )
  }

  const {
    firstName = '',
    lastName = '',
    playerPhoto = null,
    teamName = 'Unassigned',
    teamColor = '#4BB9EC',
    seasonName = '',
    sportIcon = '🏐',
    jerseyNumber = '',
    position = 'Player',
    isActive = true,
    unpaidAmount = 0,
    nextEvent = null,
    eventCount = 0,
  } = selectedPlayerTeam

  const hasPhoto = !!playerPhoto
  const statPills = [
    { label: 'Kills', emoji: '⚡', value: playerStats?.total_kills || playerStats?.kills || 0 },
    { label: 'Aces', emoji: '🏐', value: playerStats?.total_aces || playerStats?.aces || 0 },
    { label: 'Digs', emoji: '💪', value: playerStats?.total_digs || playerStats?.digs || 0 },
    { label: 'Assists', emoji: '🤝', value: playerStats?.total_assists || playerStats?.assists || 0 },
  ]

  return (
    <>
      {/* ── Main Athlete Card (matches mobile AthleteCard Tier 1) ── */}
      <div
        className={`bg-white border border-brand-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all ${expanded ? 'scale-[1.005]' : ''}`}
        data-tutorial="player-card"
      >
        <div className="flex items-start gap-4 p-4">
          {/* Avatar with jersey badge */}
          <div className="relative group flex-shrink-0">
            <div
              className="w-14 h-14 rounded-xl overflow-hidden border-2"
              style={{ borderColor: teamColor + '40', backgroundColor: teamColor + '15' }}
            >
              {playerPhoto ? (
                <img src={playerPhoto} alt={firstName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center relative">
                  <span className="text-lg font-black" style={{ color: teamColor }}>
                    {firstName?.[0]}{lastName?.[0]}
                  </span>
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-lynx-sky flex items-center justify-center shadow-sm">
                    <span className="text-[8px] text-white">📷</span>
                  </div>
                </div>
              )}
            </div>
            {/* Jersey number badge */}
            {jerseyNumber && (
              <div className="absolute -bottom-1 -right-1 bg-[#0D1B3E] text-white text-[10px] font-black px-1.5 py-0.5 rounded-md leading-none">
                #{jerseyNumber}
              </div>
            )}
            {/* Photo upload overlay */}
            <label className="absolute inset-0 rounded-xl cursor-pointer bg-black/0 group-hover:bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              <span className="text-white text-xs font-bold">📷</span>
            </label>
          </div>

          {/* Player info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <h3 className="text-lg font-black text-brand-navy leading-tight truncate">
                  {firstName} {lastName}
                </h3>
                <p className="text-xs font-semibold text-brand-text-muted mt-0.5 truncate">
                  {teamName} · {position} {jerseyNumber ? `· #${jerseyNumber}` : ''}
                </p>
              </div>
              {/* Level badge */}
              <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
                {isActive ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Pending
                  </span>
                )}
              </div>
            </div>

            {/* Quick action pills */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              <button
                onClick={() => onNavigate?.(`player-${playerId}`)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-brand-off-white border border-brand-border text-brand-navy hover:border-[#4BB9EC]/30 transition"
              >
                🪪 Player Card
              </button>
              <button
                onClick={() => navigateToTeamWall?.(teamId)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-brand-off-white border border-brand-border text-brand-navy hover:border-[#4BB9EC]/30 transition"
              >
                👥 Team Hub
              </button>
              <button
                onClick={() => onNavigate?.('achievements')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-brand-off-white border border-brand-border text-brand-navy hover:border-[#4BB9EC]/30 transition"
              >
                🏆 Badges
              </button>
              {unpaidAmount > 0 && (
                <button
                  onClick={() => onShowPayment?.()}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition"
                >
                  💳 ${unpaidAmount.toFixed(0)} due
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Expandable stats row (matches mobile velocity-sensitive expansion) */}
        {hasPhoto && (
          <>
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-center gap-1 py-1.5 border-t border-brand-border text-[10px] font-bold uppercase tracking-wider text-brand-text-faint hover:text-[#4BB9EC] transition"
            >
              {expanded ? 'Hide Stats' : 'Show Stats'}
              <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${expanded ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="flex gap-2 px-4 pb-3 pt-1">
                {statPills.map(s => (
                  <div key={s.label} className="flex-1 bg-brand-off-white rounded-lg px-2 py-2 text-center">
                    <p className="text-[10px] font-bold uppercase text-brand-text-faint">{s.emoji} {s.label}</p>
                    <p className="text-lg font-black text-brand-navy leading-tight">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Earned badges strip (mini) */}
        {earnedBadges.length > 0 && (
          <div className="flex items-center gap-2 px-4 pb-3 border-t border-brand-border pt-2">
            {earnedBadges.slice(0, 3).map((b, i) => {
              const def = BADGE_DEFS[b.achievement_id] || {
                name: b.achievements?.name || 'Badge',
                icon: b.achievements?.icon || '🏅',
                color: b.achievements?.color_primary || '#6B7280',
                rarity: b.achievements?.rarity || 'Common',
              }
              const rarityColor = RARITY_COLORS[def.rarity] || '#6B7280'
              return (
                <div
                  key={b.id || i}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-base"
                  style={{ background: `${def.color}15`, border: `1.5px solid ${rarityColor}40` }}
                  title={def.name}
                >
                  {def.icon}
                </div>
              )
            })}
            <button
              onClick={() => onNavigate?.('achievements')}
              className="text-[10px] text-[#4BB9EC] font-bold ml-auto hover:opacity-80"
            >
              {earnedBadges.length > 3 ? `+${earnedBadges.length - 3} more` : 'View all'} →
            </button>
          </div>
        )}
      </div>

      {/* ── Multi-child carousel (matches mobile child switcher) ── */}
      {playerTeams.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
          {playerTeams.map((combo) => {
            const isSelected = selectedPlayerTeam?.playerId === combo.playerId && selectedPlayerTeam?.teamId === combo.teamId
            return (
              <button
                key={`${combo.playerId}-${combo.teamId}`}
                onClick={() => onSelectPlayerTeam?.(combo)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl flex-shrink-0 transition-all border ${
                  isSelected
                    ? 'bg-white shadow-sm border-2'
                    : 'bg-brand-off-white border-brand-border hover:bg-white'
                }`}
                style={isSelected ? { borderColor: combo.teamColor } : {}}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs overflow-hidden flex-shrink-0"
                  style={{ backgroundColor: combo.teamColor }}
                >
                  {combo.playerPhoto ? (
                    <img src={combo.playerPhoto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    combo.firstName?.charAt(0) || '?'
                  )}
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-xs font-bold text-brand-navy truncate">{combo.firstName}</p>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: combo.teamColor }} />
                    <p className="text-[10px] text-brand-text-muted truncate">
                      {combo.teamName}{combo.jerseyNumber ? ` · #${combo.jerseyNumber}` : ''}
                    </p>
                  </div>
                </div>
                {combo.hasPendingActions && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                )}
              </button>
            )
          })}
          <button
            onClick={() => onShowAddChild?.()}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl flex-shrink-0 border-2 border-dashed border-brand-border text-brand-text-muted hover:border-[#22C55E] hover:text-[#22C55E] transition"
          >
            <span className="text-base font-bold">+</span>
            <span className="text-xs font-semibold">Add Child</span>
          </button>
        </div>
      )}
    </>
  )
}
