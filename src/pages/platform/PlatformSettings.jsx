import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { usePlatformSettings } from '../../hooks/usePlatformSettings'
import {
  Settings, Layers, Sparkles, Palette, Globe, Mail, Clock, DollarSign,
  Users, Shield, Star, Crown, Zap, Rocket, Check, ChevronRight, Save,
  RefreshCw
} from '../../constants/icons'

// Simple toggle component since ToggleLeft/Right not in icon set
function ToggleSwitch({ enabled, onToggle }) {
  return (
    <button onClick={onToggle} className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${enabled ? 'bg-emerald-500' : 'bg-slate-400'}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  )
}

// ═══════════════════════════════════════════════════════════
// PLATFORM SETTINGS — Functional Config Page (Super Admin)
// ═══════════════════════════════════════════════════════════

const TABS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'tiers', label: 'Tiers & Limits', icon: Layers },
  { id: 'flags', label: 'Feature Flags', icon: Sparkles },
  { id: 'branding', label: 'Branding', icon: Palette },
]

const TIMEZONE_OPTIONS = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
  'UTC',
]

const DEFAULT_TIERS_CONFIG = {
  free:       { name: 'Free',       price: '$0',      priceNote: 'forever', maxTeams: 1,          maxMembers: 15,         color: 'slate',   features: ['Basic roster management', 'Schedule & calendar', 'Team wall'] },
  pro:        { name: 'Pro',        price: '$29',     priceNote: '/mo',     maxTeams: 3,          maxMembers: 50,         color: 'sky',     features: ['Everything in Free', 'Attendance tracking', 'Parent messaging', 'Basic reports'] },
  club:       { name: 'Club',       price: '$79',     priceNote: '/mo',     maxTeams: 10,         maxMembers: 200,        color: 'violet',  features: ['Everything in Pro', 'Payment collection', 'Registration forms', 'Jersey management', 'Push notifications'] },
  elite:      { name: 'Elite',      price: '$149',    priceNote: '/mo',     maxTeams: 25,         maxMembers: 500,        color: 'amber',   features: ['Everything in Club', 'Game day command center', 'Advanced analytics', 'Season archives', 'Priority support'] },
  enterprise: { name: 'Enterprise', price: 'Custom',  priceNote: '',        maxTeams: 'Unlimited', maxMembers: 'Unlimited', color: 'emerald', features: ['Everything in Elite', 'Dedicated account manager', 'Custom integrations', 'SLA guarantee', 'White-label options'] },
}

const DEFAULT_FEATURE_FLAGS = {
  engagement_system:  { enabled: true,  description: 'Shoutouts, challenges, XP, and leveling system' },
  social_cards:       { enabled: true,  description: 'Shareable game day and schedule social cards' },
  email_system:       { enabled: true,  description: 'Platform email system for org communications' },
  basketball_mode:    { enabled: true,  description: 'Basketball sport type with position-specific features' },
  advanced_lineup:    { enabled: true,  description: 'Advanced lineup builder with rotations and substitutions' },
  team_manager_role:  { enabled: true,  description: 'Team manager role with limited admin permissions' },
}

const DEFAULT_BRAND_COLORS = {
  primary:   '#10284C',
  secondary: '#4BB9EC',
  accent:    '#F5A623',
}

const DEFAULT_SPORTS = [
  { name: 'Volleyball', emoji: '🏐', enabled: true },
  { name: 'Basketball', emoji: '🏀', enabled: true },
  { name: 'Soccer', emoji: '⚽', enabled: true },
  { name: 'Baseball', emoji: '⚾', enabled: true },
  { name: 'Softball', emoji: '🥎', enabled: true },
  { name: 'Football', emoji: '🏈', enabled: true },
]

// ── Tier color mapping ──
function getTierColors(color, isDark) {
  const map = {
    slate:   { bg: isDark ? 'bg-slate-700/40' : 'bg-slate-50', border: isDark ? 'border-slate-600' : 'border-slate-200', badge: isDark ? 'bg-slate-600 text-slate-200' : 'bg-slate-200 text-slate-700', accent: 'text-slate-400' },
    sky:     { bg: isDark ? 'bg-sky-900/20' : 'bg-sky-50', border: isDark ? 'border-sky-700/40' : 'border-sky-200', badge: isDark ? 'bg-sky-800 text-sky-200' : 'bg-sky-100 text-sky-700', accent: 'text-sky-400' },
    violet:  { bg: isDark ? 'bg-violet-900/20' : 'bg-violet-50', border: isDark ? 'border-violet-700/40' : 'border-violet-200', badge: isDark ? 'bg-violet-800 text-violet-200' : 'bg-violet-100 text-violet-700', accent: 'text-violet-400' },
    amber:   { bg: isDark ? 'bg-amber-900/20' : 'bg-amber-50', border: isDark ? 'border-amber-700/40' : 'border-amber-200', badge: isDark ? 'bg-amber-800 text-amber-200' : 'bg-amber-100 text-amber-700', accent: 'text-amber-400' },
    emerald: { bg: isDark ? 'bg-emerald-900/20' : 'bg-emerald-50', border: isDark ? 'border-emerald-700/40' : 'border-emerald-200', badge: isDark ? 'bg-emerald-800 text-emerald-200' : 'bg-emerald-100 text-emerald-700', accent: 'text-emerald-400' },
  }
  return map[color] || map.slate
}

const TIER_ICONS = { free: Shield, pro: Star, club: Crown, elite: Zap, enterprise: Rocket }

// ═══════════════════════════════════════════════════════════
// SECTION COMPONENTS
// ═══════════════════════════════════════════════════════════

function GeneralSection({ isDark, tc, showToast, userId }) {
  const { settings, loading, updateSetting } = usePlatformSettings('general')
  const [form, setForm] = useState({
    general_platform_name: 'Lynx',
    general_support_email: 'support@thelynxapp.com',
    general_timezone: 'America/Chicago',
    general_maintenance_mode: false,
    general_trial_days: 14,
  })
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!loading && Object.keys(settings).length > 0) {
      setForm({
        general_platform_name: settings.general_platform_name || 'Lynx',
        general_support_email: settings.general_support_email || 'support@thelynxapp.com',
        general_timezone: settings.general_timezone || 'America/Chicago',
        general_maintenance_mode: settings.general_maintenance_mode || false,
        general_trial_days: settings.general_trial_days || 14,
      })
    }
  }, [loading, settings])

  async function handleSave() {
    const keys = Object.keys(form)
    for (const key of keys) {
      await updateSetting(key, form[key], userId)
    }
    setDirty(false)
    showToast('General settings saved', 'success')
  }

  function update(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  const inputCls = `w-full px-3 py-2.5 rounded-xl text-sm border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'}`

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-xl font-bold ${tc.text}`}>General Settings</h2>
          <p className={`text-sm ${tc.textSecondary} mt-1`}>Core platform configuration.</p>
        </div>
        {dirty && (
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white bg-emerald-500 hover:bg-emerald-600 transition">
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`rounded-[14px] p-5 border shadow-sm ${isDark ? 'bg-[#1E293B] border-[#2A3545]' : 'bg-white border-slate-200'}`}>
          <label className={`text-xs font-medium uppercase tracking-wide block mb-2 ${tc.textMuted}`}>
            <Shield className="w-3.5 h-3.5 inline mr-1" />Platform Name
          </label>
          <input type="text" value={form.general_platform_name} onChange={e => update('general_platform_name', e.target.value)} className={inputCls} />
        </div>

        <div className={`rounded-[14px] p-5 border shadow-sm ${isDark ? 'bg-[#1E293B] border-[#2A3545]' : 'bg-white border-slate-200'}`}>
          <label className={`text-xs font-medium uppercase tracking-wide block mb-2 ${tc.textMuted}`}>
            <Mail className="w-3.5 h-3.5 inline mr-1" />Support Email
          </label>
          <input type="email" value={form.general_support_email} onChange={e => update('general_support_email', e.target.value)} className={inputCls} />
        </div>

        <div className={`rounded-[14px] p-5 border shadow-sm ${isDark ? 'bg-[#1E293B] border-[#2A3545]' : 'bg-white border-slate-200'}`}>
          <label className={`text-xs font-medium uppercase tracking-wide block mb-2 ${tc.textMuted}`}>
            <Clock className="w-3.5 h-3.5 inline mr-1" />Default Timezone
          </label>
          <select value={form.general_timezone} onChange={e => update('general_timezone', e.target.value)} className={inputCls}>
            {TIMEZONE_OPTIONS.map(tz => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </div>

        <div className={`rounded-[14px] p-5 border shadow-sm ${isDark ? 'bg-[#1E293B] border-[#2A3545]' : 'bg-white border-slate-200'}`}>
          <label className={`text-xs font-medium uppercase tracking-wide block mb-2 ${tc.textMuted}`}>
            <DollarSign className="w-3.5 h-3.5 inline mr-1" />Default Trial Duration (days)
          </label>
          <input type="number" min={1} max={90} value={form.general_trial_days} onChange={e => update('general_trial_days', parseInt(e.target.value) || 14)} className={inputCls} />
        </div>
      </div>

      {/* Maintenance Mode Toggle */}
      <div className={`rounded-[14px] p-5 border shadow-sm ${isDark ? 'bg-[#1E293B] border-[#2A3545]' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${tc.text}`}>Maintenance Mode</p>
            <p className={`text-xs ${tc.textMuted} mt-0.5`}>When enabled, users see a maintenance banner. Platform admins can still access all features.</p>
          </div>
          <ToggleSwitch enabled={form.general_maintenance_mode} onToggle={() => update('general_maintenance_mode', !form.general_maintenance_mode)} />
        </div>
      </div>
    </div>
  )
}

function TiersSection({ isDark, tc, showToast, userId }) {
  const { settings, loading, updateSetting } = usePlatformSettings('tiers')
  const [tiersConfig, setTiersConfig] = useState(DEFAULT_TIERS_CONFIG)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (settings.tiers_config && Object.keys(settings.tiers_config).length > 0) {
        setTiersConfig(settings.tiers_config)
      }
    }
  }, [loading, settings])

  async function handleSave() {
    await updateSetting('tiers_config', tiersConfig, userId)
    setDirty(false)
    showToast('Tier configuration saved', 'success')
  }

  function updateTier(tierId, field, value) {
    setTiersConfig(prev => ({
      ...prev,
      [tierId]: { ...prev[tierId], [field]: value }
    }))
    setDirty(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-xl font-bold ${tc.text}`}>Tiers & Limits</h2>
          <p className={`text-sm ${tc.textSecondary} mt-1`}>Subscription tiers and their resource limits.</p>
        </div>
        {dirty && (
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white bg-emerald-500 hover:bg-emerald-600 transition">
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        )}
      </div>

      {/* Comparison table */}
      <div className={`rounded-[14px] border shadow-sm overflow-hidden ${isDark ? 'bg-[#1E293B] border-[#2A3545]' : 'bg-white border-slate-200'}`}>
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
              {Object.entries(tiersConfig).map(([tierId, tier], idx) => {
                const colors = getTierColors(tier.color, isDark)
                const Icon = TIER_ICONS[tierId] || Shield
                return (
                  <tr key={tierId} className={`border-t ${isDark ? 'border-[#2A3545]' : 'border-slate-100'} ${idx % 2 === 0 ? '' : isDark ? 'bg-slate-800/20' : 'bg-slate-50/50'}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors.bg}`}>
                          <Icon className={`w-4 h-4 ${colors.accent}`} />
                        </div>
                        <span className={`font-semibold ${tc.text}`}>{tier.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <input
                        type="text"
                        value={tier.price}
                        onChange={e => updateTier(tierId, 'price', e.target.value)}
                        className={`w-20 text-center text-sm font-bold rounded-lg px-2 py-1 border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                      />
                      <input
                        type="text"
                        value={tier.priceNote}
                        onChange={e => updateTier(tierId, 'priceNote', e.target.value)}
                        className={`w-16 text-center text-xs rounded-lg px-1 py-0.5 border ml-1 ${isDark ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}
                      />
                    </td>
                    <td className="px-5 py-4 text-center">
                      <input
                        type="text"
                        value={tier.maxTeams}
                        onChange={e => updateTier(tierId, 'maxTeams', isNaN(parseInt(e.target.value)) ? e.target.value : parseInt(e.target.value))}
                        className={`w-20 text-center text-sm font-medium rounded-lg px-2 py-1 border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                      />
                    </td>
                    <td className="px-5 py-4 text-center">
                      <input
                        type="text"
                        value={tier.maxMembers}
                        onChange={e => updateTier(tierId, 'maxMembers', isNaN(parseInt(e.target.value)) ? e.target.value : parseInt(e.target.value))}
                        className={`w-24 text-center text-sm font-medium rounded-lg px-2 py-1 border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                      />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {(tier.features || []).slice(0, 3).map(f => (
                          <span key={f} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${colors.badge}`}>
                            <Check className="w-3 h-3" />{f}
                          </span>
                        ))}
                        {(tier.features || []).length > 3 && (
                          <span className={`text-xs ${tc.textMuted}`}>+{tier.features.length - 3} more</span>
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
    </div>
  )
}

function FeatureFlagsSection({ isDark, tc, showToast, userId }) {
  const { settings, loading, updateSetting } = usePlatformSettings('flags')
  const [flags, setFlags] = useState(DEFAULT_FEATURE_FLAGS)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (settings.feature_flags && Object.keys(settings.feature_flags).length > 0) {
        setFlags(settings.feature_flags)
      }
    }
  }, [loading, settings])

  async function toggleFlag(flagName) {
    const updated = {
      ...flags,
      [flagName]: { ...flags[flagName], enabled: !flags[flagName].enabled }
    }
    setFlags(updated)
    setDirty(true)
  }

  async function handleSave() {
    await updateSetting('feature_flags', flags, userId)
    setDirty(false)
    showToast('Feature flags saved', 'success')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-xl font-bold ${tc.text}`}>Feature Flags</h2>
          <p className={`text-sm ${tc.textSecondary} mt-1`}>Toggle features on and off across the platform.</p>
        </div>
        {dirty && (
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white bg-emerald-500 hover:bg-emerald-600 transition">
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        )}
      </div>

      <div className={`rounded-[14px] border shadow-sm divide-y ${isDark ? 'bg-[#1E293B] border-[#2A3545] divide-[#2A3545]' : 'bg-white border-slate-200 divide-slate-100'}`}>
        {Object.entries(flags).map(([flagName, flag]) => (
          <div key={flagName} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className={`text-sm font-medium ${tc.text}`}>{flagName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
              <p className={`text-xs ${tc.textMuted} mt-0.5`}>{flag.description}</p>
            </div>
            <ToggleSwitch enabled={flag.enabled} onToggle={() => toggleFlag(flagName)} />
          </div>
        ))}
      </div>
    </div>
  )
}

function BrandingSection({ isDark, tc, showToast, userId }) {
  const { settings, loading, updateSetting } = usePlatformSettings('branding')
  const [colors, setColors] = useState(DEFAULT_BRAND_COLORS)
  const [sports, setSports] = useState(DEFAULT_SPORTS)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (settings.branding_colors && Object.keys(settings.branding_colors).length > 0) {
        setColors(settings.branding_colors)
      }
      if (settings.branding_sports && settings.branding_sports.length > 0) {
        setSports(settings.branding_sports)
      }
    }
  }, [loading, settings])

  async function handleSave() {
    await updateSetting('branding_colors', colors, userId)
    await updateSetting('branding_sports', sports, userId)
    setDirty(false)
    showToast('Branding settings saved', 'success')
  }

  function updateColor(key, value) {
    setColors(prev => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  function toggleSport(idx) {
    setSports(prev => prev.map((s, i) => i === idx ? { ...s, enabled: !s.enabled } : s))
    setDirty(true)
  }

  const colorLabels = { primary: 'Primary (Navy)', secondary: 'Secondary (Sky)', accent: 'Accent (Gold)' }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-xl font-bold ${tc.text}`}>Branding Defaults</h2>
          <p className={`text-sm ${tc.textSecondary} mt-1`}>Default platform colors and sport types. Organizations can override these.</p>
        </div>
        {dirty && (
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white bg-emerald-500 hover:bg-emerald-600 transition">
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        )}
      </div>

      {/* Platform colors */}
      <div className={`rounded-[14px] border shadow-sm p-5 ${isDark ? 'bg-[#1E293B] border-[#2A3545]' : 'bg-white border-slate-200'}`}>
        <h3 className={`text-sm font-semibold uppercase tracking-wide mb-4 ${tc.textMuted}`}>Platform Colors</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Object.entries(colors).map(([key, hex]) => (
            <div key={key} className="flex items-center gap-3">
              <input
                type="color"
                value={hex}
                onChange={e => updateColor(key, e.target.value)}
                className="w-12 h-12 rounded-xl border-0 cursor-pointer"
                style={{ backgroundColor: hex }}
              />
              <div className="min-w-0">
                <p className={`font-semibold text-sm ${tc.text}`}>{colorLabels[key] || key}</p>
                <input
                  type="text"
                  value={hex}
                  onChange={e => updateColor(key, e.target.value)}
                  className={`text-xs font-mono w-24 px-2 py-1 rounded-lg border ${isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sport types */}
      <div className={`rounded-[14px] border shadow-sm p-5 ${isDark ? 'bg-[#1E293B] border-[#2A3545]' : 'bg-white border-slate-200'}`}>
        <h3 className={`text-sm font-semibold uppercase tracking-wide mb-4 ${tc.textMuted}`}>Default Sport Types</h3>
        <div className="flex flex-wrap gap-3">
          {sports.map((sport, idx) => (
            <button
              key={sport.name}
              onClick={() => toggleSport(idx)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border transition ${
                sport.enabled
                  ? isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : isDark ? 'bg-slate-800/50 border-[#2A3545] text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <span className="text-lg">{sport.emoji}</span>
              <span className="text-sm font-medium">{sport.name}</span>
              {sport.enabled && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
        <p className={`text-xs mt-3 ${tc.textMuted}`}>
          Click to enable/disable sport types. Organizations select their sport during onboarding.
        </p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

function PlatformSettings({ showToast }) {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const tc = useThemeClasses()
  const [activeTab, setActiveTab] = useState('general')

  return (
    <div className={`min-h-screen ${isDark ? 'bg-lynx-midnight' : 'bg-lynx-cloud'}`}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-sky-500/10' : 'bg-sky-50'}`}>
              <Settings className="w-5 h-5 text-sky-500" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${tc.text}`}>Platform Settings</h1>
              <p className={`text-sm ${tc.textMuted}`}>Global configuration for the Lynx platform</p>
            </div>
          </div>
        </div>

        {/* Layout: sidebar tabs + content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar tabs */}
          <div className="lg:w-56 flex-shrink-0">
            <nav className={`rounded-[14px] border shadow-sm overflow-hidden ${isDark ? 'bg-[#1E293B] border-[#2A3545]' : 'bg-white border-slate-200'}`}>
              {TABS.map(tab => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors text-left ${
                      isActive
                        ? isDark ? 'bg-sky-500/10 text-sky-400 border-l-2 border-sky-400' : 'bg-sky-50 text-sky-600 border-l-2 border-sky-500'
                        : isDark ? 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 border-l-2 border-transparent' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-2 border-transparent'
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
            {activeTab === 'general' && <GeneralSection isDark={isDark} tc={tc} showToast={showToast} userId={user?.id} />}
            {activeTab === 'tiers' && <TiersSection isDark={isDark} tc={tc} showToast={showToast} userId={user?.id} />}
            {activeTab === 'flags' && <FeatureFlagsSection isDark={isDark} tc={tc} showToast={showToast} userId={user?.id} />}
            {activeTab === 'branding' && <BrandingSection isDark={isDark} tc={tc} showToast={showToast} userId={user?.id} />}
          </div>
        </div>
      </div>
    </div>
  )
}

export { PlatformSettings }
export default PlatformSettings
