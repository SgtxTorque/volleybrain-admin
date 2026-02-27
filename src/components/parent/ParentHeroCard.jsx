import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function formatTime12(timeStr) {
  if (!timeStr) return ''
  const [hours, minutes] = timeStr.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return hour12 + ':' + minutes + ' ' + ampm
}

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
  'first_game': { name: 'Game Day', icon: '🎮', color: '#3B82F6', rarity: 'Common' },
  'first_win': { name: 'Winner', icon: '🥇', color: '#F59E0B', rarity: 'Common' },
}

const RARITY_COLORS = { 'Common': '#6B7280', 'Uncommon': '#10B981', 'Rare': '#3B82F6', 'Epic': '#8B5CF6', 'Legendary': '#F59E0B' }

/**
 * ParentHeroCard — premium player card for the Parent Dashboard
 *
 * Props:
 *   selectedPlayerTeam  — object with merged player+team data, or null
 *   playerTeams         — array of all player+team combos (for carousel)
 *   onSelectPlayerTeam  — callback when a carousel card is clicked
 *   onNavigate          — page navigation (receives page-name string)
 *   navigateToTeamWall  — team hub navigation (receives teamId)
 *   onShowPayment       — open payment modal
 *   onShowAddChild      — open add-child modal
 *   onShowEventDetail   — open event detail modal (receives event object)
 *   onPhotoUploaded     — callback after photo upload (childId, photoUrl)
 *   showToast           — toast notification
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
  const [recentActivity, setRecentActivity] = useState([])
  const [earnedBadges, setEarnedBadges] = useState([])
  const [galleryPhotos, setGalleryPhotos] = useState([])

  const playerId = selectedPlayerTeam?.playerId
  const teamId = selectedPlayerTeam?.teamId
  const sportIcon = selectedPlayerTeam?.sportIcon || '🏐'

  useEffect(() => {
    let cancelled = false

    async function loadHeroData() {
      if (!playerId) return

      // Shoutouts received
      let shoutoutsReceived = []
      try {
        const { data, error } = await supabase
          .from('shoutouts')
          .select('id, category, created_at, shoutout_categories(emoji)')
          .eq('receiver_id', playerId)
          .order('created_at', { ascending: false })
          .limit(2)
        if (!error && data) shoutoutsReceived = data.map(s => ({
          type: 'shoutout_received',
          icon: s.shoutout_categories?.emoji || '💪',
          text: `${s.category} shoutout`,
          date: s.created_at,
        }))
      } catch { /* silent */ }

      // Shoutouts given
      let shoutoutsGiven = []
      try {
        const { data, error } = await supabase
          .from('shoutouts')
          .select('id, category, created_at, shoutout_categories(emoji)')
          .eq('giver_id', playerId)
          .order('created_at', { ascending: false })
          .limit(2)
        if (!error && data) shoutoutsGiven = data.map(s => ({
          type: 'shoutout_given',
          icon: s.shoutout_categories?.emoji || '🤝',
          text: `Gave ${s.category}`,
          date: s.created_at,
        }))
      } catch { /* silent */ }

      // Achievements earned
      let achievements = []
      try {
        const { data, error } = await supabase
          .from('player_achievements')
          .select('*, achievements(name, icon, rarity, color_primary)')
          .eq('player_id', playerId)
          .order('created_at', { ascending: false })
          .limit(3)
        if (!error && data) {
          achievements = data
          if (!cancelled) setEarnedBadges(data)
        }
      } catch { /* silent */ }

      const achievementItems = achievements.slice(0, 2).map(a => ({
        type: 'achievement',
        icon: a.achievements?.icon || BADGE_DEFS[a.achievement_id]?.icon || '🏅',
        text: a.achievements?.name || BADGE_DEFS[a.achievement_id]?.name || 'New Badge',
        date: a.created_at,
      }))

      // Merge timeline
      const allItems = [...shoutoutsReceived, ...shoutoutsGiven, ...achievementItems]
      allItems.sort((a, b) => new Date(b.date) - new Date(a.date))
      if (!cancelled) setRecentActivity(allItems.slice(0, 4))

      // Gallery photos
      if (teamId) {
        try {
          const { data, error } = await supabase
            .from('team_posts')
            .select('id, media_urls')
            .eq('team_id', teamId)
            .eq('is_published', true)
            .not('media_urls', 'is', null)
            .order('created_at', { ascending: false })
            .limit(5)
          if (!error && data) {
            const flat = []
            for (const post of data) {
              for (const url of (post.media_urls || [])) {
                flat.push(url)
                if (flat.length >= 5) break
              }
              if (flat.length >= 5) break
            }
            if (!cancelled) setGalleryPhotos(flat)
          }
        } catch { /* silent */ }
      }
    }

    loadHeroData()
    return () => { cancelled = true }
  }, [playerId, teamId])

  // ALWAYS render the outer container — never return null
  if (!selectedPlayerTeam) {
    return (
      <div
        className="bg-white border border-lynx-silver rounded-xl shadow-sm overflow-hidden flex items-center justify-center"
        style={{ minHeight: '420px' }}
      >
        <div className="text-center text-lynx-slate p-8">
          <div className="text-5xl mb-3">👤</div>
          <div className="text-lg font-semibold text-lynx-slate">Loading player...</div>
          <div className="text-sm mt-1">Player information is loading</div>
        </div>
      </div>
    )
  }

  const {
    firstName = '',
    lastName = '',
    playerPhoto = null,
    teamName = 'Unassigned',
    teamColor = '#6366F1',
    seasonName = '',
    jerseyNumber = '',
    position = 'Player',
    isActive = true,
    unpaidAmount = 0,
    nextEvent = null,
    eventCount = 0,
  } = selectedPlayerTeam

  // Build merged timeline: nextEvent first, then recent activity
  const displayTimeline = []
  if (nextEvent) {
    displayTimeline.push({
      type: 'event',
      icon: nextEvent.event_type === 'game' ? sportIcon : '🏋️',
      text: new Date(nextEvent.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' ' + formatTime12(nextEvent.event_time),
      onClick: () => onShowEventDetail?.(nextEvent),
    })
  }
  if (eventCount > 0) {
    displayTimeline.push({
      type: 'info',
      icon: '📅',
      text: `${eventCount} event${eventCount !== 1 ? 's' : ''} scheduled`,
    })
  }
  for (const item of recentActivity) {
    if (displayTimeline.length >= 5) break
    displayTimeline.push(item)
  }

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

  return (
    <>
      <div
        className="bg-white border border-lynx-silver rounded-xl shadow-sm overflow-hidden"
        style={{ minHeight: '420px' }}
        data-tutorial="player-card"
      >
        <div className="flex" style={{ minHeight: '420px' }}>

          {/* ——— Photo Column (280px, full height) ——— */}
          <div className="w-[220px] min-w-[220px] relative overflow-hidden flex-shrink-0 group" style={{ minHeight: '420px' }}>
            {/* Team-color gradient background */}
            <div className="absolute inset-0" style={{
              background: `linear-gradient(135deg, ${teamColor} 0%, ${teamColor}cc 40%, #1e293b 100%)`
            }} />
            {/* Dot pattern overlay */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(circle at 30% 50%, white 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }} />

            {/* Player photo — absolute, full bleed */}
            {playerPhoto ? (
              <img
                src={playerPhoto}
                alt={firstName}
                className="absolute inset-0 w-full h-full object-cover object-top z-[1]"
              />
            ) : (
              <div className="absolute inset-0 z-[1] flex items-center justify-center">
                <span className="text-[80px] font-black text-white/15 tracking-tighter">
                  {firstName?.[0]}{lastName?.[0]}
                </span>
              </div>
            )}

            {/* Upload photo overlay (hover) */}
            <label className="absolute inset-0 z-[3] flex items-center justify-center bg-black/0 group-hover:bg-black/40 cursor-pointer opacity-0 group-hover:opacity-100">
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              <div className="text-center text-white">
                <div className="text-3xl mb-1">📷</div>
                <div className="text-xs font-bold">{playerPhoto ? 'Change Photo' : 'Upload Photo'}</div>
              </div>
            </label>

            {/* Jersey number badge — top right */}
            {jerseyNumber && (
              <div className="absolute top-4 right-4 z-[3]">
                <div className="text-4xl font-black text-white drop-shadow-lg" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                  #{jerseyNumber}
                </div>
              </div>
            )}

            {/* Name + status overlay — bottom of photo, dark gradient */}
            <div
              className="absolute bottom-0 left-0 right-0 z-[2] px-5 pb-5 pt-16"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)' }}
            >
              <div className="uppercase font-black leading-none tracking-tight">
                <span className="block text-sm text-white/70">{firstName}</span>
                <span className="block text-2xl text-white mt-0.5">{lastName}</span>
              </div>
              <div className="mt-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold backdrop-blur-sm ${
                  isActive
                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/30'
                    : 'bg-amber-500/30 text-amber-300 border border-amber-400/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  {isActive ? 'Active' : 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* ——— Info Column (flex-1) ——— */}
          <div className="flex-1 flex flex-col min-w-0 bg-white">

            {/* Top Identity Bar — Premium Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-lynx-silver">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                  style={{ backgroundColor: teamColor }}
                >
                  <span className="text-white">{sportIcon}</span>
                </div>
                <div className="w-px h-8 bg-slate-200 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-lg font-black uppercase tracking-wide text-slate-900 truncate leading-tight">
                    {teamName}
                  </div>
                  <div className="text-sm text-lynx-slate">
                    {position} &middot; {seasonName || 'Current Season'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-bold ${
                  isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  {isActive ? 'Active' : 'Pending'}
                </span>
                {unpaidAmount > 0 ? (
                  <button onClick={() => onShowPayment?.()} className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100">
                    ${unpaidAmount.toFixed(2)} due
                  </button>
                ) : (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                    Paid Up
                  </span>
                )}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex border-b border-lynx-silver">
              {[
                { label: 'Player Card', icon: '🪪', action: () => onNavigate?.(`player-${playerId}`) },
                { label: 'Team Hub', icon: '👥', action: () => navigateToTeamWall?.(teamId) },
                { label: 'Profile', icon: '👤', action: () => onNavigate?.(`player-profile-${playerId}`) },
                { label: 'Achievements', icon: '🏆', action: () => onNavigate?.('achievements') },
              ].map((btn, i, arr) => (
                <button
                  key={btn.label}
                  onClick={btn.action}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 px-1
                    text-slate-500 hover:text-[var(--accent-primary)] hover:bg-lynx-cloud
                    ${i < arr.length - 1 ? 'border-r border-lynx-silver' : ''}`}
                >
                  <span className="text-base">{btn.icon}</span>
                  <span className="text-xs font-medium text-slate-600">{btn.label}</span>
                </button>
              ))}
            </div>

            {/* 2-Column Grid: Left (What's Next + Gallery) | Right (Badge Showcase, row-span-2) */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 px-4 py-2.5">
                <div className="grid grid-cols-[1fr_0.65fr] gap-3 h-full">

                  {/* LEFT ROW 1: What's Next */}
                  <div>
                    <div className="text-[10px] uppercase tracking-widest font-bold text-lynx-slate mb-1.5">What's Next</div>
                    <div className="flex flex-wrap gap-1.5">
                      {displayTimeline.length > 0 ? (
                        displayTimeline.map((item, i) => (
                          <button
                            key={`${item.type}-${i}`}
                            onClick={item.onClick || undefined}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                              item.type === 'event'
                                ? 'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-400'
                                : item.type === 'achievement'
                                ? 'border-purple-200 bg-purple-50 text-purple-700'
                                : item.type === 'shoutout_received'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : item.type === 'shoutout_given'
                                ? 'border-blue-200 bg-blue-50 text-blue-700'
                                : 'border-lynx-silver bg-white text-slate-600'
                            }`}
                          >
                            <span className="text-sm flex-shrink-0">{item.icon}</span>
                            <span className="truncate max-w-[130px]">{item.text}</span>
                          </button>
                        ))
                      ) : (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-lynx-cloud text-lynx-slate">
                          No recent activity
                        </span>
                      )}
                    </div>
                  </div>

                  {/* RIGHT: Badge Showcase — spans both rows */}
                  <div className="row-span-2 flex flex-col border-l border-slate-100 pl-3">
                    <div className="text-[10px] uppercase tracking-widest font-bold text-lynx-slate mb-1.5">Badge Showcase</div>
                    {earnedBadges.length > 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-evenly">
                        {earnedBadges.slice(0, 3).map((b, i) => {
                          const def = BADGE_DEFS[b.achievement_id] || {
                            name: b.achievements?.name || 'Badge',
                            icon: b.achievements?.icon || '🏅',
                            color: b.achievements?.color_primary || '#6B7280',
                            rarity: b.achievements?.rarity || 'Common',
                          }
                          const rarityColor = RARITY_COLORS[def.rarity] || RARITY_COLORS[b.achievements?.rarity] || '#6B7280'
                          return (
                            <div key={b.id || i} className="flex flex-col items-center gap-1">
                              <div
                                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                                style={{
                                  background: `${def.color}15`,
                                  border: `2px solid ${rarityColor}`,
                                  boxShadow: `0 0 8px ${rarityColor}20`,
                                }}
                              >
                                {def.icon}
                              </div>
                              <span className="text-xs font-bold text-slate-600 text-center max-w-[70px] leading-tight truncate">
                                {def.name}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center rounded-lg bg-lynx-cloud">
                        <div className="text-center">
                          <span className="text-2xl block mb-1">🏅</span>
                          <p className="text-sm text-lynx-slate font-medium">No badges yet</p>
                          <p className="text-xs text-slate-300 mt-0.5">Keep playing!</p>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => onNavigate?.('achievements')}
                      className="text-[11px] text-[var(--accent-primary)] font-semibold hover:opacity-80 text-center mt-1.5"
                    >
                      View all badges →
                    </button>
                  </div>

                  {/* LEFT ROW 2: Gallery */}
                  <div>
                    <div className="text-[10px] uppercase tracking-widest font-bold text-lynx-slate mb-1.5">Gallery</div>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const url = galleryPhotos[i]
                        return url ? (
                          <div
                            key={i}
                            className="flex-1 min-w-0 rounded-lg overflow-hidden bg-slate-100 border border-lynx-silver"
                            style={{ aspectRatio: '1' }}
                          >
                            <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                          </div>
                        ) : (
                          <div
                            key={i}
                            className="flex-1 min-w-0 rounded-lg bg-slate-100 border border-lynx-silver flex items-center justify-center"
                            style={{ aspectRatio: '1' }}
                          >
                            <span className="text-slate-300 text-sm">📷</span>
                          </div>
                        )
                      })}
                      <button
                        onClick={() => navigateToTeamWall?.(teamId)}
                        className="text-[11px] text-[var(--accent-primary)] font-semibold hover:opacity-80 flex-shrink-0 whitespace-nowrap"
                      >
                        See all →
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mini Player Carousel (multi-child) */}
      {playerTeams.length > 1 && (
        <div className="relative mt-4">
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {playerTeams.map((combo) => {
              const isSelected = selectedPlayerTeam?.playerId === combo.playerId && selectedPlayerTeam?.teamId === combo.teamId
              return (
                <button
                  key={`${combo.playerId}-${combo.teamId}`}
                  onClick={() => onSelectPlayerTeam?.(combo)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl flex-shrink-0 border ${
                    isSelected
                      ? 'bg-white border-2 shadow-md'
                      : 'bg-lynx-cloud border-lynx-silver hover:bg-white hover:shadow-sm'
                  }`}
                  style={isSelected ? { borderColor: combo.teamColor } : {}}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0"
                    style={{ backgroundColor: combo.teamColor }}
                  >
                    {combo.playerPhoto ? (
                      <img src={combo.playerPhoto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      combo.firstName?.charAt(0) || '?'
                    )}
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-sm font-bold text-slate-900 truncate">{combo.firstName}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: combo.teamColor }} />
                      <p className="text-sm text-lynx-slate truncate">
                        {combo.teamName}
                        {combo.jerseyNumber ? ` · #${combo.jerseyNumber}` : ''}
                      </p>
                    </div>
                  </div>
                  {combo.hasPendingActions && (
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
                  )}
                </button>
              )
            })}
            <button
              onClick={() => onShowAddChild?.()}
              className="flex items-center gap-2 px-4 py-3 rounded-xl flex-shrink-0 border-2 border-dashed border-slate-300 text-slate-400 hover:border-emerald-500 hover:text-emerald-600"
            >
              <span className="text-lg font-bold">+</span>
              <span className="text-sm font-semibold">Add Child</span>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
