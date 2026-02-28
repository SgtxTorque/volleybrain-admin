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
 * Handles its own data fetching for payments, badges, and priority items
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

  // Badge data — fetched when active child changes
  const [playerBadges, setPlayerBadges] = useState([])
  const [badgesInProgress, setBadgesInProgress] = useState([])

  const activeChild = registrationData?.[0]
  const activeChildId = activeChild?.id

  useEffect(() => {
    let cancelled = false
    if (!activeChildId) return

    async function loadBadges() {
      // player_achievements table (NOT player_badges — doesn't exist in schema)
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
      // player_achievement_progress
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
    <aside className={`hidden xl:flex w-[310px] shrink-0 flex-col ${isDark ? 'bg-lynx-midnight' : 'bg-white'} overflow-y-auto p-5 space-y-5 scrollbar-hide`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>

      {/* Org Header Card */}
      <div className={`${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-lynx-silver'} rounded-xl shadow-sm p-5`}>
        {orgLogo ? (
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl overflow-hidden shadow-sm ${isDark ? 'border border-white/[0.06]' : 'border border-slate-100'}`}>
              <img src={orgLogo} alt={orgName} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'} truncate`}>{orgName}</p>
              {orgTagline && <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'} truncate`}>{orgTagline}</p>}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center">
              <VolleyballIcon className="w-5 h-5 text-[var(--accent-primary)]" />
            </div>
            <div>
              <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Lynx</p>
            </div>
          </div>
        )}
        <div className={`border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'} pt-3`}>
          <div className="flex items-center gap-3">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className={`w-9 h-9 rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-100'} flex items-center justify-center`}>
                <UserCircle className="w-5 h-5 text-slate-400" />
              </div>
            )}
            <div>
              <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{profile?.full_name || 'Parent'}</p>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Parent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Parent Stats */}
      <div className="flex gap-2">
        {[
          { value: registrationData.length, label: 'Players' },
          { value: [...new Set(registrationData.map(c => c.season?.id).filter(Boolean))].length, label: 'Seasons' },
          { value: teamIds.length, label: 'Teams' },
        ].map(stat => (
          <div key={stat.label} className={`flex-1 ${isDark ? 'bg-white/[0.06]' : 'bg-lynx-cloud'} rounded-xl px-3 py-3 text-center`}>
            <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{stat.value}</div>
            <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-lynx-slate'} mt-0.5 uppercase font-semibold tracking-wide`}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Payment Summary Card */}
      <div
        className={`${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-lynx-silver'} rounded-xl shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow`}
        onClick={() => paymentSummary.totalDue > 0 ? onShowPayment?.() : onNavigate?.('payments')}
      >
        <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-lynx-slate'} mb-3`}>Payment Status</h3>
        {paymentSummary.totalDue > 0 ? (
          <>
            <p className="text-2xl font-black text-red-500">${paymentSummary.totalDue.toFixed(2)}</p>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'} mt-1`}>Balance due</p>
            {paymentSummary.totalPaid > 0 && (
              <div className="mt-2">
                <div className={`w-full h-2 rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
                  <div
                    className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, (paymentSummary.totalPaid / (paymentSummary.totalDue + paymentSummary.totalPaid)) * 100)}%` }}
                  />
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-lynx-slate'} mt-1`}>${paymentSummary.totalPaid.toFixed(2)} paid</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
              <Check className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-600">All Paid Up</p>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>No outstanding balance</p>
            </div>
          </div>
        )}
      </div>

      {/* Needs Attention Card */}
      <div className={`${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-lynx-silver'} rounded-xl shadow-sm p-4`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Needs Attention</h3>
          {priorityEngine.count > 0 && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
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
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                    item.actionType === 'payment' ? 'bg-red-50 text-red-500' :
                    item.actionType === 'waiver' ? 'bg-purple-50 text-purple-500' :
                    item.actionType === 'rsvp' ? 'bg-blue-50 text-blue-500' :
                    'bg-amber-50 text-amber-500'
                  }`}>
                    {item.actionType === 'payment' ? '💰' : item.actionType === 'waiver' ? '📋' : item.actionType === 'rsvp' ? '📅' : '⚠️'}
                  </div>
                  <div className="text-left">
                    <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.title || item.label}</div>
                    {item.subtitle && <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>{item.subtitle}</div>}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition" />
              </button>
            ))}
            {priorityEngine.count > 3 && (
              <button
                onClick={() => onShowActionSidebar?.()}
                className="text-sm text-[var(--accent-primary)] font-semibold hover:opacity-80 transition w-full text-left pt-1"
              >
                View All {priorityEngine.count} items →
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 py-2">
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
              <Check className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>All caught up!</p>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Nothing needs your attention</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-lynx-slate'} mb-3`}>Quick Actions</h3>
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
              className={`flex flex-col items-center gap-2 p-4 rounded-xl ${isDark ? 'bg-white/[0.06] hover:bg-white/10' : 'bg-lynx-cloud hover:bg-slate-100'} transition-colors`}
            >
              <btn.icon className={`w-5 h-5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} />
              <span className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Badge Progress Preview */}
      <div className={`${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-lynx-silver'} rounded-xl shadow-sm p-4`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Badge Progress</h3>
          <button onClick={() => onNavigate?.('achievements')} className="text-xs text-[var(--accent-primary)] font-semibold hover:opacity-80 transition">
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
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: `${def.color}15`, border: `2px solid ${def.color}40` }}
                  >
                    {def.icon}
                  </div>
                  <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-lynx-slate'} text-center max-w-[60px] leading-tight`}>{def.name}</span>
                </div>
              )
            })}
          </div>
        ) : badgesInProgress.length > 0 ? (
          <div className="space-y-3">
            {badgesInProgress.slice(0, 2).map((b, i) => {
              const def = BADGE_DEFS[b.badge_id] || BADGE_DEFS[b.achievement_id] || { name: b.badge_id || 'Badge', icon: '🏅', color: '#6B7280' }
              const pct = b.target_value > 0 ? Math.min((b.current_value / b.target_value) * 100, 100) : 0
              return (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: `${def.color}15`, border: `2px solid ${def.color}40` }}
                  >
                    {def.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'} truncate`}>{def.name}</span>
                      <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-lynx-slate'} ml-2 flex-shrink-0`}>{b.current_value}/{b.target_value}</span>
                    </div>
                    <div className={`h-1.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-100'} overflow-hidden`}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: def.color }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'} text-center py-2`}>No badges earned yet</p>
        )}
      </div>

      {/* Getting Started Checklist */}
      <ParentChecklistWidget
        onNavigate={onNavigate}
        onTeamHub={() => navigateToTeamWall?.(activeTeam?.id)}
        activeTeam={activeTeam}
        compact
      />
    </aside>
  )
}
