import { useState, useEffect, useCallback } from 'react'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  Activity, Shield, CreditCard, Mail, Globe, Phone, ExternalLink,
  Check, X, RefreshCw, AlertTriangle, Key, Link, Zap, Clock, Eye
} from '../../constants/icons'

// ═══════════════════════════════════════════════════════════
// PLATFORM INTEGRATIONS — Integration Status & Health Monitor
// Connection tests, webhook health, env config checks
// ═══════════════════════════════════════════════════════════

// ── Icon string-to-component map ──
const ICON_MAP = {
  Shield,
  CreditCard,
  Mail,
  Globe,
  Phone,
}

// ── Integration definitions ──
const INTEGRATIONS = [
  {
    name: 'Supabase',
    icon: 'Shield',
    description: 'Backend database, auth, and storage',
    status: 'connected',
    testFn: async () => {
      const { count, error } = await supabase.from('organizations').select('*', { count: 'exact', head: true })
      return { ok: !error, detail: error ? error.message : `${count} organizations` }
    },
    dashboardUrl: 'https://supabase.com/dashboard/project/uqpjvbiuokwpldjvxiby',
    configuredKeys: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'],
  },
  {
    name: 'Stripe',
    icon: 'CreditCard',
    description: 'Payment processing',
    testFn: async () => {
      const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
      if (!key) return { ok: false, detail: 'Publishable key not configured' }
      try {
        const { data, error } = await supabase.functions.invoke('stripe-test-connection')
        return { ok: !error, detail: error ? error.message : 'Connection verified' }
      } catch (e) {
        return { ok: false, detail: e.message || 'Test failed' }
      }
    },
    dashboardUrl: 'https://dashboard.stripe.com',
    configuredKeys: ['VITE_STRIPE_PUBLISHABLE_KEY'],
  },
  {
    name: 'Resend',
    icon: 'Mail',
    description: 'Transactional and campaign email delivery',
    testFn: async () => {
      const { data, error } = await supabase
        .from('email_notifications')
        .select('created_at, status')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      if (error || !data) return { ok: false, detail: 'No emails sent yet' }
      return { ok: true, detail: `Last email: ${new Date(data.created_at).toLocaleString()}` }
    },
    dashboardUrl: 'https://resend.com/emails',
    configuredKeys: ['RESEND_API_KEY (Edge Function secret)'],
  },
  {
    name: 'Vercel',
    icon: 'Globe',
    description: 'Web app hosting and deployment',
    status: 'connected',
    testFn: null,
    dashboardUrl: 'https://vercel.com/dashboard',
    configuredKeys: ['Managed via Vercel dashboard'],
  },
  {
    name: 'Expo (Mobile)',
    icon: 'Phone',
    description: 'Mobile app build and push notifications',
    testFn: null,
    dashboardUrl: 'https://expo.dev',
    configuredKeys: ['Managed via EAS'],
  },
]

// ── Webhook definitions ──
const WEBHOOKS = [
  { name: 'Stripe Webhook', endpoint: '/functions/v1/stripe-webhook', description: 'Receives payment events from Stripe' },
  { name: 'Resend Webhook', endpoint: '/functions/v1/resend-webhooks', description: 'Tracks email delivery, opens, bounces' },
]

// ── Environment variable checks ──
const ENV_CHECKS = [
  { key: 'VITE_SUPABASE_URL', present: !!import.meta.env.VITE_SUPABASE_URL },
  { key: 'VITE_SUPABASE_ANON_KEY', present: !!import.meta.env.VITE_SUPABASE_ANON_KEY },
  { key: 'VITE_STRIPE_PUBLISHABLE_KEY', present: !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY },
]

// ── Quick links ──
const QUICK_LINKS = [
  { label: 'Supabase Dashboard', url: 'https://supabase.com/dashboard/project/uqpjvbiuokwpldjvxiby', icon: Shield },
  { label: 'Stripe Dashboard', url: 'https://dashboard.stripe.com', icon: CreditCard },
  { label: 'Resend Dashboard', url: 'https://resend.com/emails', icon: Mail },
  { label: 'Vercel Dashboard', url: 'https://vercel.com/dashboard', icon: Globe },
  { label: 'GitHub Repo', url: 'https://github.com/SgtxTorque/volleybrain-admin', icon: Link },
  { label: 'Lynx Production', url: 'https://www.thelynxapp.com', icon: Zap },
]

// ── Status helpers ──
function getStatusColor(status) {
  switch (status) {
    case 'connected': return 'bg-emerald-400'
    case 'degraded': return 'bg-amber-400'
    case 'disconnected': return 'bg-red-400'
    default: return 'bg-slate-400'
  }
}

function getStatusLabel(status) {
  switch (status) {
    case 'connected': return 'Connected'
    case 'degraded': return 'Degraded'
    case 'disconnected': return 'Disconnected'
    default: return 'Not Tested'
  }
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export default function PlatformIntegrations({ showToast }) {
  const { isDark } = useTheme()
  const tc = useThemeClasses()

  // Integration test results: { [name]: { status, detail, testing } }
  const [testResults, setTestResults] = useState({})
  // Webhook health data
  const [webhookHealth, setWebhookHealth] = useState({})
  const [loadingWebhooks, setLoadingWebhooks] = useState(true)

  // ── Load webhook health on mount ──
  useEffect(() => {
    loadWebhookHealth()
  }, [])

  async function loadWebhookHealth() {
    setLoadingWebhooks(true)
    try {
      const [stripeRes, resendRes] = await Promise.all([
        supabase
          .from('payments')
          .select('created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('email_notifications')
          .select('created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
      ])

      const now = Date.now()
      const health = {}

      if (stripeRes.data?.created_at) {
        const lastAt = new Date(stripeRes.data.created_at).getTime()
        const hoursSince = (now - lastAt) / (1000 * 60 * 60)
        health['Stripe Webhook'] = {
          lastReceived: stripeRes.data.created_at,
          status: hoursSince < 72 ? 'active' : 'unknown',
        }
      } else {
        health['Stripe Webhook'] = { lastReceived: null, status: 'unknown' }
      }

      if (resendRes.data?.created_at) {
        const lastAt = new Date(resendRes.data.created_at).getTime()
        const hoursSince = (now - lastAt) / (1000 * 60 * 60)
        health['Resend Webhook'] = {
          lastReceived: resendRes.data.created_at,
          status: hoursSince < 72 ? 'active' : 'unknown',
        }
      } else {
        health['Resend Webhook'] = { lastReceived: null, status: 'unknown' }
      }

      setWebhookHealth(health)
    } catch (err) {
      console.error('Failed to load webhook health:', err)
    } finally {
      setLoadingWebhooks(false)
    }
  }

  // ── Run a connection test for a single integration ──
  const runTest = useCallback(async (integration) => {
    if (!integration.testFn) return

    setTestResults(prev => ({
      ...prev,
      [integration.name]: { status: 'testing', detail: 'Testing...' },
    }))

    try {
      const result = await integration.testFn()
      setTestResults(prev => ({
        ...prev,
        [integration.name]: {
          status: result.ok ? 'connected' : 'disconnected',
          detail: result.detail,
        },
      }))
      if (showToast) {
        showToast(
          result.ok
            ? `${integration.name} connection verified`
            : `${integration.name} test failed: ${result.detail}`,
          result.ok ? 'success' : 'error'
        )
      }
    } catch (err) {
      setTestResults(prev => ({
        ...prev,
        [integration.name]: { status: 'disconnected', detail: err.message || 'Unknown error' },
      }))
      if (showToast) {
        showToast(`${integration.name} test error: ${err.message}`, 'error')
      }
    }
  }, [showToast])

  // ── Run all tests ──
  const runAllTests = useCallback(async () => {
    const testable = INTEGRATIONS.filter(i => i.testFn)
    for (const integration of testable) {
      await runTest(integration)
    }
  }, [runTest])

  // ── Resolve the current status for an integration ──
  function resolveStatus(integration) {
    const result = testResults[integration.name]
    if (result) return result.status
    return integration.status || 'not_tested'
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  const cardClass = isDark
    ? 'bg-[#0B1628] border border-white/[0.06] rounded-xl'
    : 'bg-white border border-slate-200 rounded-xl shadow-sm'
  const sectionTitle = isDark ? 'text-white' : 'text-slate-900'
  const secondaryText = isDark ? 'text-slate-400' : 'text-slate-500'
  const mutedText = isDark ? 'text-slate-500' : 'text-slate-400'

  return (
    <div className={`min-h-screen ${tc.pageBg} p-6`}>
      <div className="max-w-6xl mx-auto space-y-8">

        {/* ── Page Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${sectionTitle}`}>Integrations</h1>
            <p className={`mt-1 text-sm ${secondaryText}`}>
              Monitor third-party service connections, webhook health, and environment configuration.
            </p>
          </div>
          <button
            onClick={runAllTests}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent-primary)] text-white hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="w-4 h-4" />
            Test All Connections
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* SECTION 1: Integration Status Dashboard                */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section>
          <h2 className={`text-lg font-semibold mb-4 ${sectionTitle}`}>Integration Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {INTEGRATIONS.map(integration => {
              const IconComponent = ICON_MAP[integration.icon] || Activity
              const status = resolveStatus(integration)
              const result = testResults[integration.name]
              const isTesting = result?.status === 'testing'

              return (
                <div key={integration.name} className={`${cardClass} p-5 flex flex-col gap-3`}>
                  {/* Top row: Icon + name + status dot */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
                        <IconComponent className={`w-5 h-5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} />
                      </div>
                      <div>
                        <h3 className={`font-semibold text-sm ${sectionTitle}`}>{integration.name}</h3>
                        <p className={`text-xs ${secondaryText}`}>{integration.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${getStatusColor(status)}`} />
                      <span className={`text-xs font-medium ${secondaryText}`}>{getStatusLabel(status)}</span>
                    </div>
                  </div>

                  {/* Test result detail */}
                  {result && result.status !== 'testing' && (
                    <div className={`text-xs px-3 py-2 rounded-lg ${
                      result.status === 'connected'
                        ? isDark ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                        : isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-700'
                    }`}>
                      {result.status === 'connected' ? <Check className="w-3 h-3 inline mr-1" /> : <X className="w-3 h-3 inline mr-1" />}
                      {result.detail}
                    </div>
                  )}

                  {/* Config keys tag */}
                  <div className="flex flex-wrap gap-1.5">
                    {integration.configuredKeys.map(k => {
                      const isEnvKey = k.startsWith('VITE_')
                      const isPresent = isEnvKey ? !!import.meta.env[k] : true
                      return (
                        <span
                          key={k}
                          className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${
                            isPresent
                              ? isDark ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                              : isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {isPresent ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          {isPresent ? 'Configured' : 'Missing Config'}
                        </span>
                      )
                    })}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 mt-auto pt-2 border-t border-white/[0.06]">
                    {integration.testFn && (
                      <button
                        onClick={() => runTest(integration)}
                        disabled={isTesting}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          isTesting
                            ? 'opacity-50 cursor-not-allowed'
                            : isDark
                              ? 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                        {isTesting ? 'Testing...' : 'Test Connection'}
                      </button>
                    )}
                    <a
                      href={integration.dashboardUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        isDark
                          ? 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open Dashboard
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* SECTION 2: Webhook Health                              */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section>
          <h2 className={`text-lg font-semibold mb-4 ${sectionTitle}`}>Webhook Health</h2>
          <div className={`${cardClass} divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-slate-100'}`}>
            {WEBHOOKS.map(webhook => {
              const health = webhookHealth[webhook.name]
              const whStatus = health?.status || 'unknown'
              const lastReceived = health?.lastReceived

              return (
                <div key={webhook.name} className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
                      <Activity className={`w-5 h-5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} />
                    </div>
                    <div className="min-w-0">
                      <h3 className={`font-semibold text-sm ${sectionTitle}`}>{webhook.name}</h3>
                      <p className={`text-xs ${secondaryText} truncate`}>{webhook.description}</p>
                      <p className={`text-xs mt-0.5 font-mono ${mutedText}`}>{webhook.endpoint}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    {/* Last received */}
                    <div className="text-right">
                      <p className={`text-xs ${mutedText}`}>Last received</p>
                      <p className={`text-sm font-medium ${secondaryText}`}>
                        {loadingWebhooks
                          ? 'Loading...'
                          : lastReceived
                            ? new Date(lastReceived).toLocaleString()
                            : 'No data'}
                      </p>
                    </div>

                    {/* Status badge */}
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      whStatus === 'active'
                        ? isDark ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                        : isDark ? 'bg-slate-700/50 text-slate-400' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${whStatus === 'active' ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                      {whStatus === 'active' ? 'Active' : 'Unknown'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* SECTION 3: Environment & Configuration                 */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section>
          <h2 className={`text-lg font-semibold mb-4 ${sectionTitle}`}>Environment &amp; Configuration</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Env variable checklist */}
            <div className={`${cardClass} p-5`}>
              <div className="flex items-center gap-2 mb-4">
                <Key className={`w-4 h-4 ${secondaryText}`} />
                <h3 className={`font-semibold text-sm ${sectionTitle}`}>Environment Variables</h3>
              </div>
              <div className="space-y-3">
                {ENV_CHECKS.map(env => (
                  <div key={env.key} className="flex items-center justify-between">
                    <span className={`text-sm font-mono ${secondaryText}`}>{env.key}</span>
                    {env.present ? (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Check className="w-4 h-4" />
                        <span className="text-xs font-medium">Present</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-400">
                        <X className="w-4 h-4" />
                        <span className="text-xs font-medium">Missing</span>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className={`${cardClass} p-5`}>
              <div className="flex items-center gap-2 mb-4">
                <ExternalLink className={`w-4 h-4 ${secondaryText}`} />
                <h3 className={`font-semibold text-sm ${sectionTitle}`}>Quick Links</h3>
              </div>
              <div className="space-y-2">
                {QUICK_LINKS.map(link => {
                  const LinkIcon = link.icon
                  return (
                    <a
                      key={link.label}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isDark
                          ? 'text-slate-300 hover:bg-white/[0.06]'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <LinkIcon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1">{link.label}</span>
                      <ExternalLink className={`w-3.5 h-3.5 ${mutedText}`} />
                    </a>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
