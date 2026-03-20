import { useState } from 'react'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import {
  Settings, Layers, Sparkles, Palette, Globe, Mail, Clock, DollarSign,
  Users, Shield, Star, Crown, Zap, Rocket, Check, ChevronRight
} from '../../constants/icons'

// ═══════════════════════════════════════════════════════════
// PLATFORM SETTINGS — Static Config Page (Super Admin)
// Clean professional cards, no glassmorphism
// ═══════════════════════════════════════════════════════════

const TABS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'tiers', label: 'Tiers & Limits', icon: Layers },
  { id: 'flags', label: 'Feature Flags', icon: Sparkles },
  { id: 'branding', label: 'Branding', icon: Palette },
]

// ── General config (display-only) ──
const GENERAL_CONFIG = [
  { label: 'Platform Name', value: 'Lynx', icon: Shield, description: 'The public-facing name of the platform' },
  { label: 'Platform Domain', value: 'thelynxapp.com', icon: Globe, description: 'Primary domain for the platform' },
  { label: 'Default Timezone', value: 'America/Chicago (CST/CDT)', icon: Clock, description: 'Default timezone for new organizations' },
  { label: 'Support Email', value: 'support@thelynxapp.com', icon: Mail, description: 'Where support requests are routed' },
]

// ── Tier config (read-only) ──
const TIERS = [
  {
    name: 'Free',
    price: '$0',
    priceNote: 'forever',
    maxTeams: 1,
    maxMembers: 15,
    color: 'slate',
    icon: Shield,
    features: ['Basic roster management', 'Schedule & calendar', 'Team wall'],
  },
  {
    name: 'Pro',
    price: '$29',
    priceNote: '/mo',
    maxTeams: 3,
    maxMembers: 50,
    color: 'sky',
    icon: Star,
    features: ['Everything in Free', 'Attendance tracking', 'Parent messaging', 'Basic reports'],
  },
  {
    name: 'Club',
    price: '$79',
    priceNote: '/mo',
    maxTeams: 10,
    maxMembers: 200,
    color: 'violet',
    icon: Crown,
    features: ['Everything in Pro', 'Payment collection', 'Registration forms', 'Jersey management', 'Push notifications'],
  },
  {
    name: 'Elite',
    price: '$149',
    priceNote: '/mo',
    maxTeams: 25,
    maxMembers: 500,
    color: 'amber',
    icon: Zap,
    features: ['Everything in Club', 'Game day command center', 'Advanced analytics', 'Season archives', 'Priority support'],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    priceNote: '',
    maxTeams: 'Unlimited',
    maxMembers: 'Unlimited',
    color: 'emerald',
    icon: Rocket,
    features: ['Everything in Elite', 'Dedicated account manager', 'Custom integrations', 'SLA guarantee', 'White-label options'],
  },
]

// ── Branding defaults ──
const BRAND_COLORS = [
  { name: 'Navy', hex: '#10284C', usage: 'Navigation, headers, primary text' },
  { name: 'Sky', hex: '#4BB9EC', usage: 'Accent, links, interactive elements' },
  { name: 'Gold', hex: '#F5A623', usage: 'Highlights, badges, premium indicators' },
]

const DEFAULT_SPORTS = [
  { name: 'Volleyball', emoji: '🏐' },
  { name: 'Basketball', emoji: '🏀' },
  { name: 'Soccer', emoji: '⚽' },
  { name: 'Baseball', emoji: '⚾' },
  { name: 'Softball', emoji: '🥎' },
  { name: 'Football', emoji: '🏈' },
]

// ── Tier color mapping ──
function getTierColors(color, isDark) {
  const map = {
    slate: {
      bg: isDark ? 'bg-slate-700/40' : 'bg-slate-50',
      border: isDark ? 'border-slate-600' : 'border-slate-200',
      badge: isDark ? 'bg-slate-600 text-slate-200' : 'bg-slate-200 text-slate-700',
      accent: 'text-slate-400',
    },
    sky: {
      bg: isDark ? 'bg-sky-900/20' : 'bg-sky-50',
      border: isDark ? 'border-sky-700/40' : 'border-sky-200',
      badge: isDark ? 'bg-sky-800 text-sky-200' : 'bg-sky-100 text-sky-700',
      accent: 'text-sky-400',
    },
    violet: {
      bg: isDark ? 'bg-violet-900/20' : 'bg-violet-50',
      border: isDark ? 'border-violet-700/40' : 'border-violet-200',
      badge: isDark ? 'bg-violet-800 text-violet-200' : 'bg-violet-100 text-violet-700',
      accent: 'text-violet-400',
    },
    amber: {
      bg: isDark ? 'bg-amber-900/20' : 'bg-amber-50',
      border: isDark ? 'border-amber-700/40' : 'border-amber-200',
      badge: isDark ? 'bg-amber-800 text-amber-200' : 'bg-amber-100 text-amber-700',
      accent: 'text-amber-400',
    },
    emerald: {
      bg: isDark ? 'bg-emerald-900/20' : 'bg-emerald-50',
      border: isDark ? 'border-emerald-700/40' : 'border-emerald-200',
      badge: isDark ? 'bg-emerald-800 text-emerald-200' : 'bg-emerald-100 text-emerald-700',
      accent: 'text-emerald-400',
    },
  }
  return map[color] || map.slate
}

// ═══════════════════════════════════════════════════════════
// SECTION COMPONENTS
// ═══════════════════════════════════════════════════════════

function GeneralSection({ isDark, tc }) {
  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className={`text-xl font-bold ${tc.text}`}>General Settings</h2>
        <p className={`text-sm ${tc.textSecondary} mt-1`}>
          Core platform configuration. These values are display-only for now.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {GENERAL_CONFIG.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.label}
              className={`rounded-[14px] p-5 border shadow-sm ${
                isDark
                  ? 'bg-[#1E293B] border-[#2A3545]'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isDark ? 'bg-sky-500/10' : 'bg-sky-50'
                }`}>
                  <Icon className="w-5 h-5 text-sky-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium uppercase tracking-wide ${tc.textMuted}`}>
                    {item.label}
                  </p>
                  <p className={`text-base font-semibold mt-0.5 ${tc.text}`}>
                    {item.value}
                  </p>
                  <p className={`text-xs mt-1 ${tc.textMuted}`}>
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className={`rounded-[14px] p-4 border mt-6 ${
        isDark ? 'bg-amber-900/10 border-amber-800/30' : 'bg-amber-50 border-amber-200'
      }`}>
        <p className={`text-sm ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
          Editing these settings will be available in a future update. Changes here would affect all organizations on the platform.
        </p>
      </div>
    </div>
  )
}

function TiersSection({ isDark, tc }) {
  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className={`text-xl font-bold ${tc.text}`}>Tiers & Limits</h2>
        <p className={`text-sm ${tc.textSecondary} mt-1`}>
          Subscription tiers and their resource limits. Read-only configuration.
        </p>
      </div>

      {/* Comparison table */}
      <div className={`rounded-[14px] border shadow-sm overflow-hidden ${
        isDark ? 'bg-[#1E293B] border-[#2A3545]' : 'bg-white border-slate-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={isDark ? 'bg-slate-800/50' : 'bg-slate-50'}>
                <th className={`text-left px-5 py-3.5 font-semibold ${tc.text}`}>Tier</th>
                <th className={`text-center px-5 py-3.5 font-semibold ${tc.text}`}>Price</th>
                <th className={`text-center px-5 py-3.5 font-semibold ${tc.text}`}>Max Teams</th>
                <th className={`text-center px-5 py-3.5 font-semibold ${tc.text}`}>Max Members</th>
                <th className={`text-left px-5 py-3.5 font-semibold ${tc.text}`}>Key Features</th>
              </tr>
            </thead>
            <tbody>
              {TIERS.map((tier, idx) => {
                const colors = getTierColors(tier.color, isDark)
                const Icon = tier.icon
                return (
                  <tr
                    key={tier.name}
                    className={`border-t ${isDark ? 'border-[#2A3545]' : 'border-slate-100'} ${
                      idx % 2 === 0
                        ? ''
                        : isDark ? 'bg-slate-800/20' : 'bg-slate-50/50'
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors.bg}`}>
                          <Icon className={`w-4 h-4 ${colors.accent}`} />
                        </div>
                        <span className={`font-semibold ${tc.text}`}>{tier.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`font-bold text-base ${tc.text}`}>{tier.price}</span>
                      {tier.priceNote && (
                        <span className={`text-xs ${tc.textMuted}`}>{tier.priceNote}</span>
                      )}
                    </td>
                    <td className={`px-5 py-4 text-center font-medium ${tc.text}`}>
                      {typeof tier.maxTeams === 'number' ? tier.maxTeams : tier.maxTeams}
                    </td>
                    <td className={`px-5 py-4 text-center font-medium ${tc.text}`}>
                      {typeof tier.maxMembers === 'number' ? tier.maxMembers.toLocaleString() : tier.maxMembers}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {tier.features.slice(0, 3).map((f) => (
                          <span
                            key={f}
                            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${colors.badge}`}
                          >
                            <Check className="w-3 h-3" />
                            {f}
                          </span>
                        ))}
                        {tier.features.length > 3 && (
                          <span className={`text-xs ${tc.textMuted}`}>
                            +{tier.features.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tier detail cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
        {TIERS.map((tier) => {
          const colors = getTierColors(tier.color, isDark)
          const Icon = tier.icon
          return (
            <div
              key={tier.name}
              className={`rounded-[14px] p-5 border shadow-sm ${
                isDark ? 'bg-[#1E293B] border-[#2A3545]' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.bg} border ${colors.border}`}>
                  <Icon className={`w-5 h-5 ${colors.accent}`} />
                </div>
                <div>
                  <h3 className={`font-bold ${tc.text}`}>{tier.name}</h3>
                  <p className={`text-sm ${tc.textMuted}`}>
                    {tier.price}{tier.priceNote}
                  </p>
                </div>
              </div>

              <div className={`flex gap-4 mb-4 py-3 px-4 rounded-lg ${colors.bg}`}>
                <div className="text-center flex-1">
                  <p className={`text-lg font-bold ${tc.text}`}>{tier.maxTeams}</p>
                  <p className={`text-xs ${tc.textMuted}`}>Teams</p>
                </div>
                <div className={`w-px ${isDark ? 'bg-slate-600' : 'bg-slate-200'}`} />
                <div className="text-center flex-1">
                  <p className={`text-lg font-bold ${tc.text}`}>
                    {typeof tier.maxMembers === 'number' ? tier.maxMembers.toLocaleString() : tier.maxMembers}
                  </p>
                  <p className={`text-xs ${tc.textMuted}`}>Members</p>
                </div>
              </div>

              <ul className="space-y-1.5">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className={`w-3.5 h-3.5 flex-shrink-0 ${colors.accent}`} />
                    <span className={`text-sm ${tc.textSecondary}`}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FeatureFlagsSection({ isDark, tc }) {
  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className={`text-xl font-bold ${tc.text}`}>Feature Flags</h2>
        <p className={`text-sm ${tc.textSecondary} mt-1`}>
          Toggle features on and off across the platform.
        </p>
      </div>

      <div className={`rounded-[14px] border shadow-sm p-12 text-center ${
        isDark ? 'bg-[#1E293B] border-[#2A3545]' : 'bg-white border-slate-200'
      }`}>
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 ${
          isDark ? 'bg-violet-500/10' : 'bg-violet-50'
        }`}>
          <Sparkles className="w-8 h-8 text-violet-500" />
        </div>
        <h3 className={`text-lg font-bold mb-2 ${tc.text}`}>Coming Soon</h3>
        <p className={`text-sm max-w-md mx-auto ${tc.textMuted}`}>
          Feature flags will allow you to enable or disable platform features per tier,
          per organization, or globally. This includes beta features, maintenance modes,
          and gradual rollouts.
        </p>
        <div className={`mt-6 inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full ${
          isDark ? 'bg-violet-500/10 text-violet-400' : 'bg-violet-50 text-violet-600'
        }`}>
          <Rocket className="w-4 h-4" />
          Planned for v2.0
        </div>
      </div>
    </div>
  )
}

function BrandingSection({ isDark, tc }) {
  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className={`text-xl font-bold ${tc.text}`}>Branding Defaults</h2>
        <p className={`text-sm ${tc.textSecondary} mt-1`}>
          Default platform colors and sport types. Organizations can override these with their own branding.
        </p>
      </div>

      {/* Platform colors */}
      <div className={`rounded-[14px] border shadow-sm p-5 ${
        isDark ? 'bg-[#1E293B] border-[#2A3545]' : 'bg-white border-slate-200'
      }`}>
        <h3 className={`text-sm font-semibold uppercase tracking-wide mb-4 ${tc.textMuted}`}>
          Platform Colors
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {BRAND_COLORS.map((c) => (
            <div key={c.name} className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl shadow-sm border flex-shrink-0"
                style={{ backgroundColor: c.hex, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
              />
              <div className="min-w-0">
                <p className={`font-semibold text-sm ${tc.text}`}>{c.name}</p>
                <p className={`text-xs font-mono ${tc.textMuted}`}>{c.hex}</p>
                <p className={`text-xs ${tc.textMuted} truncate`}>{c.usage}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Default sport types */}
      <div className={`rounded-[14px] border shadow-sm p-5 ${
        isDark ? 'bg-[#1E293B] border-[#2A3545]' : 'bg-white border-slate-200'
      }`}>
        <h3 className={`text-sm font-semibold uppercase tracking-wide mb-4 ${tc.textMuted}`}>
          Default Sport Types
        </h3>
        <div className="flex flex-wrap gap-3">
          {DEFAULT_SPORTS.map((sport) => (
            <div
              key={sport.name}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border ${
                isDark
                  ? 'bg-slate-800/50 border-[#2A3545]'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className="text-lg">{sport.emoji}</span>
              <span className={`text-sm font-medium ${tc.text}`}>{sport.name}</span>
            </div>
          ))}
        </div>
        <p className={`text-xs mt-3 ${tc.textMuted}`}>
          Organizations select their sport type during onboarding. Additional sports can be added to the platform here.
        </p>
      </div>

      <div className={`rounded-[14px] p-4 border mt-2 ${
        isDark ? 'bg-amber-900/10 border-amber-800/30' : 'bg-amber-50 border-amber-200'
      }`}>
        <p className={`text-sm ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
          Branding customization (logo uploads, custom color pickers, sport icon management) will be editable in a future update.
        </p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

function PlatformSettings({ showToast }) {
  const { isDark } = useTheme()
  const tc = useThemeClasses()
  const [activeTab, setActiveTab] = useState('general')

  return (
    <div className={`min-h-screen ${isDark ? 'bg-lynx-midnight' : 'bg-lynx-cloud'}`}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-sky-500/10' : 'bg-sky-50'
            }`}>
              <Settings className="w-5 h-5 text-sky-500" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${tc.text}`}>Platform Settings</h1>
              <p className={`text-sm ${tc.textMuted}`}>
                Global configuration for the Lynx platform
              </p>
            </div>
          </div>
        </div>

        {/* Layout: sidebar tabs + content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar tabs */}
          <div className="lg:w-56 flex-shrink-0">
            <nav className={`rounded-[14px] border shadow-sm overflow-hidden ${
              isDark ? 'bg-[#1E293B] border-[#2A3545]' : 'bg-white border-slate-200'
            }`}>
              {TABS.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors text-left ${
                      isActive
                        ? isDark
                          ? 'bg-sky-500/10 text-sky-400 border-l-2 border-sky-400'
                          : 'bg-sky-50 text-sky-600 border-l-2 border-sky-500'
                        : isDark
                          ? 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 border-l-2 border-transparent'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-2 border-transparent'
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                    <span>{tab.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Content area */}
          <div className="flex-1 min-w-0">
            {activeTab === 'general' && <GeneralSection isDark={isDark} tc={tc} />}
            {activeTab === 'tiers' && <TiersSection isDark={isDark} tc={tc} />}
            {activeTab === 'flags' && <FeatureFlagsSection isDark={isDark} tc={tc} />}
            {activeTab === 'branding' && <BrandingSection isDark={isDark} tc={tc} />}
          </div>
        </div>
      </div>
    </div>
  )
}

export { PlatformSettings }
export default PlatformSettings
