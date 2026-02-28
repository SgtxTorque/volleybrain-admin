// =============================================================================
// OrgSidebar — Left sidebar matching v0 org-sidebar.tsx
// Org card, stats, collections progress, needs attention, quick actions
// =============================================================================

import React from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useOrgBranding } from '../../contexts/OrgBrandingContext'
import { useJourney, JOURNEY_BADGES } from '../../contexts/JourneyContext'
import {
  AlertTriangle, ArrowRight, ClipboardCheck, DollarSign, FileWarning,
  Megaphone, UserPlus, CreditCard, ChevronRight, Award
} from 'lucide-react'

function getOrgInitials(name) {
  if (!name) return '?'
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
}

function StatItem({ value, label, isDark }) {
  return (
    <div className="flex flex-col items-center">
      <span className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</span>
      <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>
        {label}
      </span>
    </div>
  )
}

function AttentionItem({ icon, label, badge, badgeColor, onClick, isDark }) {
  if (!badge || badge === '0' || badge === 0) return null
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
        isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-slate-100'
      }`}
    >
      <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{icon}</span>
      <span className={`flex-1 text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{label}</span>
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${badgeColor}`}>
        {badge}
      </span>
    </button>
  )
}

function QuickAction({ icon, label, badge, onClick, isDark }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-2 rounded-xl p-4 shadow transition-all hover:shadow-md hover:-translate-y-0.5 ${
        isDark
          ? 'bg-slate-700/60 border border-white/[0.06]'
          : 'bg-white border border-slate-100'
      }`}
    >
      {badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
      {icon}
      <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{label}</span>
    </button>
  )
}

const ONBOARDING_NAV_MAP = {
  create_org: 'seasons',
  create_season: 'seasons',
  add_teams: 'teams',
  join_create_team: 'teams',
  add_roster: 'teams',
  add_coaches: 'coaches',
  assign_coach: 'coaches',
  register_players: 'registrations',
  create_schedule: 'schedule',
  first_practice: 'schedule',
  first_game: 'schedule',
  view_roster: 'teams',
  create_lineup: 'gameprep',
  plan_practice: 'schedule',
  game_prep: 'gameprep',
}

export default function OrgSidebar({ stats, season, onNavigate }) {
  const { isDark, accent } = useTheme()
  const { orgName, orgLogo } = useOrgBranding()
  const journey = useJourney()

  const initials = getOrgInitials(orgName)

  const showOnboarding = journey && !journey.loading && !journey.isComplete && !journey.isDismissed

  return (
    <aside className={`flex w-[360px] shrink-0 flex-col gap-6 overflow-y-auto py-8 pl-6 pr-4 scrollbar-hide ${
      isDark ? 'bg-lynx-midnight' : 'bg-lynx-cloud'
    }`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      {/* Org Card */}
      <div className={`flex flex-col items-center gap-4 rounded-xl p-6 shadow ${
        isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white'
      }`}>
        {orgLogo ? (
          <img
            src={orgLogo}
            alt={orgName}
            className="h-[200px] w-[200px] rounded-xl object-cover shadow -mt-[30px]"
          />
        ) : (
          <div
            className="flex h-[200px] w-[200px] items-center justify-center rounded-xl text-4xl font-bold text-white shadow -mt-[30px]"
            style={{ backgroundColor: accent.primary || '#10284C' }}
          >
            {initials}
          </div>
        )}
        <div className="text-center w-full">
          <h2 className={`text-2xl font-bold break-words ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {orgName || 'My Organization'}
          </h2>
          <p className={`mt-0.5 text-base break-words ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
            {season?.name || 'No season selected'}
            {season?.status ? ` · ${season.status.charAt(0).toUpperCase() + season.status.slice(1)}` : ''}
          </p>
        </div>
        <div className="flex w-full items-center justify-around pt-2">
          <StatItem value={stats.totalRegistrations || 0} label="PLAYERS" isDark={isDark} />
          <StatItem value={stats.teams || 0} label="TEAMS" isDark={isDark} />
          <StatItem value={stats.coachCount || 0} label="COACHES" isDark={isDark} />
        </div>
      </div>

      {/* Onboarding Progress — disappears when all steps done */}
      {showOnboarding && (
        <button
          onClick={() => {
            if (journey.currentStep && ONBOARDING_NAV_MAP[journey.currentStep.id]) {
              onNavigate(ONBOARDING_NAV_MAP[journey.currentStep.id])
            }
          }}
          className={`-mt-[19px] rounded-xl p-5 shadow text-left transition-all hover:shadow-md hover:-translate-y-0.5 ${
            isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Setup Progress</span>
            <span className="text-sm font-bold" style={{ color: accent.primary || '#0d9488' }}>
              {journey.completedCount}/{journey.totalSteps}
            </span>
          </div>
          <div className={`mt-3 h-2.5 overflow-hidden rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, journey.progressPercent)}%`, backgroundColor: accent.primary || '#0d9488' }}
            />
          </div>
          {journey.currentStep && (
            <div className="mt-3 flex items-center gap-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>
                Next:
              </span>
              <span className={`text-sm font-bold flex-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {journey.currentStep.title}
              </span>
              <ChevronRight className="h-4 w-4" style={{ color: accent.primary || '#0d9488' }} />
            </div>
          )}
        </button>
      )}

      {/* Needs Attention */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 px-1 pb-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
            Needs Attention
          </span>
        </div>
        <AttentionItem
          icon={<ClipboardCheck className="h-4 w-4" />}
          label="Pending registrations"
          badge={stats.pending > 0 ? String(stats.pending) : null}
          badgeColor={isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'}
          onClick={() => onNavigate('registrations')}
          isDark={isDark}
        />
        <AttentionItem
          icon={<DollarSign className="h-4 w-4" />}
          label="Overdue payments"
          badge={stats.pastDue > 0 ? `$${stats.pastDue.toLocaleString()}` : null}
          badgeColor={isDark ? 'bg-red-500/20 text-red-400 !text-sm !font-black' : 'bg-red-50 text-red-600 !text-sm !font-black'}
          onClick={() => onNavigate('payments')}
          isDark={isDark}
        />
        <AttentionItem
          icon={<FileWarning className="h-4 w-4" />}
          label="Unsigned waivers"
          badge={stats.unsignedWaivers > 0 ? String(stats.unsignedWaivers) : null}
          badgeColor={isDark ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-50 text-teal-700'}
          onClick={() => onNavigate('waivers')}
          isDark={isDark}
        />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col gap-3">
        <span className={`px-1 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
          Quick Actions
        </span>
        <div className="grid grid-cols-2 gap-3">
          <QuickAction
            icon={<ClipboardCheck className={`h-5 w-5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />}
            label="Regs"
            badge={stats.pending}
            onClick={() => onNavigate('registrations')}
            isDark={isDark}
          />
          <QuickAction
            icon={<CreditCard className={`h-5 w-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />}
            label="Payments"
            onClick={() => onNavigate('payments')}
            isDark={isDark}
          />
          <QuickAction
            icon={<UserPlus className={`h-5 w-5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} />}
            label="Invite"
            onClick={() => onNavigate('registrations')}
            isDark={isDark}
          />
          <QuickAction
            icon={<Megaphone className={`h-5 w-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />}
            label="Blast"
            onClick={() => onNavigate('blasts')}
            isDark={isDark}
          />
        </div>
      </div>

      {/* Recent Badges */}
      {journey?.earnedBadges?.length > 0 && (() => {
        const recentBadges = journey.earnedBadges.slice(-3).reverse()
        return (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 px-1">
              <Award className={`h-4 w-4 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
              <span className={`text-xs font-semibold uppercase tracking-wider flex-1 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
                Recent Badges
              </span>
              <button
                onClick={() => onNavigate('badges')}
                className="flex items-center gap-1 text-xs font-bold transition-colors"
                style={{ color: isDark ? '#5eead4' : '#0d9488' }}
              >
                View All
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {recentBadges.map(badgeId => {
                const badge = JOURNEY_BADGES[badgeId]
                if (!badge) return null
                return (
                  <div
                    key={badgeId}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                      isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white'
                    }`}
                  >
                    <span className="text-2xl">{badge.icon}</span>
                    <div className="flex flex-col min-w-0">
                      <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{badge.name}</span>
                      <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>{badge.description}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}
    </aside>
  )
}
