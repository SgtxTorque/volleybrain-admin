import { useState, useEffect } from 'react'
import {
  Calendar, Users, ClipboardList, CreditCard, ChevronRight, Check,
  User as UserCircle, Award
} from '../../constants/icons'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../contexts/ThemeContext'
import { usePriorityItems } from './PriorityCardsEngine'
import { ParentChecklistWidget } from './ParentOnboarding'

// Volleyball icon component
function VolleyballIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10" />
      <path d="M2 12a15.3 15.3 0 0 1 10-4 15.3 15.3 0 0 1 10 4" />
    </svg>
  )
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
  'attendance_streak_10': { name: '10 Game Streak', icon: '💥', color: '#EF4444', rarity: 'Rare' },
  'first_game': { name: 'Game Day', icon: '🎮', color: '#3B82F6', rarity: 'Common' },
  'first_win': { name: 'Winner', icon: '🥇', color: '#F59E0B', rarity: 'Common' },
  'tournament_ready': { name: 'Tournament Ready', icon: '🎯', color: '#8B5CF6', rarity: 'Rare' },
}

/**
 * ParentLeftSidebar — left column of the parent dashboard
 * BRAND-styled with offWhite bg, consistent section headers
 */
export default function ParentLeftSidebar({
  orgLogo, orgName, orgTagline,
  profile,
  registrationData,
  teamIds,
  seasonId,
  organizationId,
  organization,
  paymentSummary,
  activeTeam,
  onNavigate,
  navigateToTeamWall,
  onShowPayment,
  onShowAddChild,
  handlePriorityAction,
  onShowActionSidebar,
  priorityEngine,
}) {
  const { isDark } = useTheme()

  // Badge data
  const [playerBadges, setPlayerBadges] = useState([])
  const [badgesInProgress, setBadgesInProgress] = useState([])

  const activeChild = registrationData?.[0]
  const activeChildId = activeChild?.id

  useEffect(() => {
    let cancelled = false
    if (!activeChildId) return

    async function loadBadges() {
      try {
        const { data, error } = await supabase
          .from('player_achievements')
          .select('*')
          .eq('player_id', activeChildId)
          .order('created_at', { ascending: false })
        if (cancelled) return
        if (error) {
          console.warn('player_achievements query failed:', error.message)
          setPlayerBadges([])
        } else {
          setPlayerBadges(data || [])
        }
      } catch {
        if (!cancelled) setPlayerBadges([])
      }
      try {
        const { data, error } = await supabase
          .from('player_achievement_progress')
          .select('*')
          .eq('player_id', activeChildId)
        if (cancelled) return
        if (error) {
          console.warn('player_achievement_progress query failed:', error.message)
          setBadgesInProgress([])
        } else {
          setBadgesInProgress(data || [])
        }
      } catch {
        if (!cancelled) setBadgesInProgress([])
      }
    }

    loadBadges()
    return () => { cancelled = true }
  }, [activeChildId])

  return (
    <aside className="hidden xl:flex w-[310px] shrink-0 flex-col bg-brand-off-white overflow-y-auto p-5 space-y-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>

      {/* ── Org Header Card ── */}
      <div className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm">
        {orgLogo ? (
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-brand-border shadow-sm">
              <img src={orgLogo} alt={orgName} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-brand-navy truncate">{orgName}</p>
              {orgTagline && <p className="text-[11px] text-brand-text-muted truncate">{orgTagline}</p>}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#4BB9EC]/10 flex items-center justify-center">
              <VolleyballIcon className="w-5 h-5 text-[#4BB9EC]" />
            </div>
            <p className="text-sm font-bold text-brand-navy">Lynx</p>
          </div>
        )}
        <div className="border-t border-brand-border pt-3">
          <div className="flex items-center gap-3">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-brand-warm-gray flex items-center justify-center">
                <UserCircle className="w-5 h-5 text-brand-text-muted" />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-brand-navy">{profile?.full_name || 'Parent'}</p>
              <p className="text-[11px] text-brand-text-muted">Parent</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Parent Stats Row ── */}
      <div className="flex gap-2">
        {[
          { value: registrationData.length, label: 'Players' },
          { value: [...new Set(registrationData.map(c => c.season?.id).filter(Boolean))].length, label: 'Seasons' },
          { value: teamIds.length, label: 'Teams' },
        ].map(stat => (
          <div key={stat.label} className="flex-1 bg-brand-warm-gray rounded-xl px-3 py-3 text-center">
            <div className="text-xl font-black text-brand-navy">{stat.value}</div>
            <div className="text-[10px] text-brand-text-faint mt-0.5 uppercase font-bold tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Payment Summary Card ── */}
      <div
        className="bg-white border border-brand-border rounded-2xl p-4 cursor-pointer hover:shadow-md transition-shadow shadow-sm"
        onClick={() => paymentSummary.totalDue > 0 ? onShowPayment?.() : onNavigate?.('payments')}
      >
        <p className="text-[10px] font-bold uppercase tracking-[1.2px] text-brand-text-faint mb-2">Payment Status</p>
        {paymentSummary.totalDue > 0 ? (
          <>
            <p className="text-2xl font-black text-red-500">${paymentSummary.totalDue.toFixed(2)}</p>
            <p className="text-[11px] text-brand-text-muted mt-1">Balance due</p>
            {paymentSummary.totalPaid > 0 && (
              <div className="mt-2">
                <div className="w-full h-1.5 rounded-full bg-brand-warm-gray">
                  <div
                    className="h-1.5 rounded-full bg-[#22C55E] transition-all duration-500"
                    style={{ width: `${Math.min(100, (paymentSummary.totalPaid / (paymentSummary.totalDue + paymentSummary.totalPaid)) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-brand-text-muted mt-1">${paymentSummary.totalPaid.toFixed(2)} paid</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#22C55E]/10 flex items-center justify-center">
              <Check className="w-4 h-4 text-[#22C55E]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#22C55E]">All Paid Up</p>
              <p className="text-[11px] text-brand-text-muted">No outstanding balance</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Needs Attention Card ── */}
      <div className="bg-white border border-brand-border rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-[1.2px] text-brand-text-faint">Needs Attention</p>
          {priorityEngine.count > 0 && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">
              {priorityEngine.count}
            </span>
          )}
        </div>
        {priorityEngine.count > 0 ? (
          <div className="space-y-2">
            {priorityEngine.items.slice(0, 3).map((item, i) => (
              <button
                key={i}
                onClick={() => handlePriorityAction?.(item)}
                className="w-full flex items-center justify-between py-2 group"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                    item.actionType === 'payment' ? 'bg-red-50 text-red-500' :
                    item.actionType === 'waiver' ? 'bg-purple-50 text-purple-500' :
                    item.actionType === 'rsvp' ? 'bg-blue-50 text-blue-500' :
                    'bg-amber-50 text-amber-500'
                  }`}>
                    {item.actionType === 'payment' ? '💰' : item.actionType === 'waiver' ? '📋' : item.actionType === 'rsvp' ? '📅' : '⚠️'}
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-brand-navy">{item.title || item.label}</div>
                    {item.subtitle && <div className="text-[10px] text-brand-text-muted">{item.subtitle}</div>}
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-brand-text-faint group-hover:text-[#4BB9EC] transition" />
              </button>
            ))}
            {priorityEngine.count > 3 && (
              <button
                onClick={() => onShowActionSidebar?.()}
                className="text-[11px] text-[#4BB9EC] font-bold hover:opacity-80 transition w-full text-left pt-1"
              >
                View All {priorityEngine.count} items →
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 py-2">
            <div className="w-8 h-8 rounded-full bg-[#22C55E]/10 flex items-center justify-center">
              <Check className="w-4 h-4 text-[#22C55E]" />
            </div>
            <div>
              <p className="text-xs font-bold text-brand-navy">All caught up!</p>
              <p className="text-[10px] text-brand-text-muted">Nothing needs your attention</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Quick Actions (matches mobile QuickActionsGrid) ── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[1.2px] text-brand-text-faint mb-2">Quick Actions</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Calendar', icon: Calendar, action: () => onNavigate?.('schedule') },
            { label: 'Team Hub', icon: Users, action: () => navigateToTeamWall?.(activeTeam?.id) },
            { label: 'Register', icon: ClipboardList, action: () => onShowAddChild?.() },
            { label: 'Payments', icon: CreditCard, action: () => onNavigate?.('payments') },
          ].map(btn => (
            <button
              key={btn.label}
              onClick={btn.action}
              className="flex flex-col items-center gap-1.5 p-3.5 rounded-xl bg-white border border-brand-border hover:shadow-sm hover:border-[#4BB9EC]/20 transition-all"
            >
              <btn.icon className="w-5 h-5 text-brand-text-muted" />
              <span className="text-[11px] font-bold text-brand-navy">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Badge Progress Preview ── */}
      <div className="bg-white border border-brand-border rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-[1.2px] text-brand-text-faint">Badge Progress</p>
          <button onClick={() => onNavigate?.('achievements')} className="text-[10px] text-[#4BB9EC] font-bold hover:opacity-80 transition">
            View All →
          </button>
        </div>
        {playerBadges.length > 0 ? (
          <div className="flex gap-3 flex-wrap">
            {playerBadges.slice(0, 3).map((b, i) => {
              const def = BADGE_DEFS[b.badge_id] || BADGE_DEFS[b.achievement_id] || { name: b.badge_id || 'Badge', icon: '🏅', color: '#6B7280', rarity: 'Common' }
              return (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: `${def.color}15`, border: `2px solid ${def.color}40` }}
                  >
                    {def.icon}
                  </div>
                  <span className="text-[10px] font-bold text-brand-text-muted text-center max-w-[55px] leading-tight">{def.name}</span>
                </div>
              )
            })}
          </div>
        ) : badgesInProgress.length > 0 ? (
          <div className="space-y-2.5">
            {badgesInProgress.slice(0, 2).map((b, i) => {
              const def = BADGE_DEFS[b.badge_id] || BADGE_DEFS[b.achievement_id] || { name: b.badge_id || 'Badge', icon: '🏅', color: '#6B7280' }
              const pct = b.target_value > 0 ? Math.min((b.current_value / b.target_value) * 100, 100) : 0
              return (
                <div key={i} className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: `${def.color}15`, border: `2px solid ${def.color}40` }}
                  >
                    {def.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] font-bold text-brand-navy truncate">{def.name}</span>
                      <span className="text-[10px] text-brand-text-muted ml-2 flex-shrink-0">{b.current_value}/{b.target_value}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-brand-warm-gray overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: def.color }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-[11px] text-brand-text-muted text-center py-2">No badges earned yet</p>
        )}
      </div>

      {/* ── Getting Started Checklist ── */}
      <ParentChecklistWidget
        onNavigate={onNavigate}
        onTeamHub={() => navigateToTeamWall?.(activeTeam?.id)}
        activeTeam={activeTeam}
        compact
      />
    </aside>
  )
}
