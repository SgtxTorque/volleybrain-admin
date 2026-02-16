import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  CreditCard, Zap, Gem, Star, Shield, Check, X, Clock, ArrowRight,
  Users, Building2, ChevronDown, AlertTriangle, Receipt, Sparkles,
  TrendingUp, Calendar, RefreshCw
} from '../../constants/icons'

// ═══════════════════════════════════════════════════════════
// SUBSCRIPTION PAGE — Org Admin Billing & Plan Management
// Glassmorphism Design — Stripe placeholder flows
// ═══════════════════════════════════════════════════════════

const SUB_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Rajdhani:wght@400;500;600;700&display=swap');
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes scaleIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  .sb-au{animation:fadeUp .4s ease-out both}
  .sb-ai{animation:fadeIn .3s ease-out both}
  .sb-as{animation:scaleIn .25s ease-out both}
  .sb-display{font-family:'Bebas Neue',sans-serif;letter-spacing:.05em}
  .sb-heading{font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:.04em}
  .sb-label{font-family:'Rajdhani',sans-serif;font-weight:600;letter-spacing:.03em}
  .sb-glass{background:rgba(255,255,255,.03);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.08)}
  .sb-glass-solid{background:rgba(255,255,255,.05);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,.08)}
  .sb-shimmer{background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.04) 50%,transparent 100%);background-size:200% 100%;animation:shimmer 3s ease-in-out infinite}
`

// ═══════ PLAN DEFINITIONS ═══════

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    icon: Star,
    color: '#94A3B8',
    monthlyPrice: 0,
    annualPrice: 0,
    teamLimit: 2,
    playerLimit: 30,
    features: ['Up to 2 teams', 'Up to 30 players', 'Basic scheduling', 'Payment tracking', 'VolleyBrain branding'],
    limitations: ['VolleyBrain branding on public pages', 'Email support (48hr response)', 'No custom branding'],
  },
  {
    id: 'starter',
    name: 'Starter',
    icon: Zap,
    color: '#3B82F6',
    monthlyPrice: 2900,
    annualPrice: 29000,
    teamLimit: 10,
    playerLimit: 150,
    features: ['Up to 10 teams', 'Up to 150 players', 'Custom branding', 'Registration forms', 'Email support (24hr)', 'CSV data exports'],
    limitations: [],
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: Gem,
    color: '#8B5CF6',
    monthlyPrice: 7900,
    annualPrice: 79000,
    teamLimit: null,
    playerLimit: null,
    features: ['Unlimited teams', 'Unlimited players', 'White-label branding', 'Priority support (4hr)', 'Advanced analytics', 'Season archives', 'Push notifications', 'All export formats'],
    limitations: [],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Shield,
    color: '#F59E0B',
    monthlyPrice: null,
    annualPrice: null,
    teamLimit: null,
    playerLimit: null,
    features: ['Everything in Pro', 'Multi-organization', 'API access', 'Dedicated account manager', 'Custom feature development', 'SSO / SAML', 'SLA guarantee', 'Onboarding support'],
    limitations: [],
  },
]

function fmtCents(cents) {
  if (cents === null || cents === undefined) return 'Custom'
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ═══════ MAIN COMPONENT ═══════

function SubscriptionPage({ showToast }) {
  const { user, profile, organization, isPlatformAdmin } = useAuth()
  const { isDark, accent } = useTheme()
  const tc = useThemeClasses()
  const accentColor = accent?.primary || '#EAB308'

  const [subscription, setSubscription] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [billingToggle, setBillingToggle] = useState('monthly')
  const [usage, setUsage] = useState({ teams: 0, players: 0 })
  const [changingPlan, setChangingPlan] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  // ═══════ LOAD DATA ═══════
  useEffect(() => {
    if (!organization?.id) return
    loadSubscription()
  }, [organization?.id])

  async function loadSubscription() {
    setLoading(true)
    try {
      // Load subscription
      const { data: sub } = await supabase
        .from('platform_subscriptions')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      setSubscription(sub)

      // Load invoices
      const { data: inv } = await supabase
        .from('platform_invoices')
        .select('*')
        .eq('organization_id', organization.id)
        .order('invoice_date', { ascending: false })
        .limit(20)

      setInvoices(inv || [])

      // Load usage stats
      const { data: seasons } = await supabase
        .from('seasons').select('id').eq('organization_id', organization.id)
      const seasonIds = (seasons || []).map(s => s.id)

      if (seasonIds.length > 0) {
        const [teamRes, playerRes] = await Promise.all([
          supabase.from('teams').select('id', { count: 'exact', head: true }).in('season_id', seasonIds),
          supabase.from('players').select('id', { count: 'exact', head: true }).in('season_id', seasonIds),
        ])
        setUsage({ teams: teamRes.count || 0, players: playerRes.count || 0 })
      }
    } catch (err) {
      console.error('Error loading subscription:', err)
    }
    setLoading(false)
  }

  // ═══════ PLAN ACTIONS ═══════
  const currentPlan = PLANS.find(p => p.id === (subscription?.plan_tier || 'free')) || PLANS[0]

  async function handleChangePlan(planId) {
    if (planId === 'enterprise') {
      window.open('mailto:support@volleybrain.com?subject=Enterprise Plan Inquiry&body=Organization: ' + encodeURIComponent(organization?.name || ''), '_blank')
      return
    }

    if (planId === currentPlan.id) return
    setChangingPlan(true)

    try {
      const plan = PLANS.find(p => p.id === planId)
      const priceCents = billingToggle === 'annual' ? plan.annualPrice : plan.monthlyPrice
      const now = new Date()
      const periodEnd = new Date(now)
      if (billingToggle === 'annual') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1)
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1)
      }

      if (subscription) {
        // Update existing subscription
        const { error } = await supabase
          .from('platform_subscriptions')
          .update({
            plan_tier: planId,
            billing_cycle: billingToggle,
            price_cents: priceCents,
            status: 'active',
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            cancelled_at: null,
            updated_at: now.toISOString(),
          })
          .eq('id', subscription.id)

        if (error) throw error
      } else {
        // Create new subscription
        const { error } = await supabase
          .from('platform_subscriptions')
          .insert({
            organization_id: organization.id,
            plan_tier: planId,
            billing_cycle: billingToggle,
            price_cents: priceCents,
            status: 'active',
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
          })

        if (error) throw error
      }

      showToast(`Plan changed to ${plan.name}!`, 'success')
      await loadSubscription()
    } catch (err) {
      console.error('Plan change error:', err)
      showToast('Failed to change plan: ' + err.message, 'error')
    }
    setChangingPlan(false)
  }

  async function handleCancelSubscription() {
    if (!subscription) return
    try {
      const { error } = await supabase
        .from('platform_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id)

      if (error) throw error
      showToast('Subscription cancelled. You can reactivate anytime.', 'success')
      setShowCancelConfirm(false)
      await loadSubscription()
    } catch (err) {
      showToast('Failed to cancel: ' + err.message, 'error')
    }
  }

  // ═══════ LOADING STATE ═══════
  if (loading) {
    return (
      <>
        <style>{SUB_STYLES}</style>
        <div className="space-y-6 max-w-6xl mx-auto">
          <div className="sb-au"><div className={`h-10 w-64 rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-200'} sb-shimmer`} /></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className={`h-72 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-100'} sb-shimmer`} style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        </div>
      </>
    )
  }

  // ═══════ RENDER ═══════
  return (
    <>
      <style>{SUB_STYLES}</style>
      <div className="space-y-6 max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="sb-au" style={{ animationDelay: '.05s' }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className={`sb-display text-3xl sm:text-4xl ${tc.text}`}>SUBSCRIPTION & BILLING</h1>
              <p className={`sb-label text-sm ${tc.textMuted} mt-1`}>
                Manage your plan, billing, and invoices
              </p>
            </div>
            <button onClick={loadSubscription} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm sb-label transition ${isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10' : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'}`}>
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* CURRENT PLAN BANNER */}
        <div className="sb-au" style={{ animationDelay: '.1s' }}>
          <div className={`sb-glass rounded-2xl p-5 ${isDark ? '' : 'bg-white/80 border-slate-200'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${currentPlan.color}15` }}>
                <currentPlan.icon className="w-6 h-6" style={{ color: currentPlan.color }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className={`sb-heading text-xl ${tc.text}`}>
                    {currentPlan.name} Plan
                  </h2>
                  {subscription?.status === 'trialing' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] sb-label bg-amber-500/15 text-amber-400">TRIAL</span>
                  )}
                  {subscription?.status === 'past_due' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] sb-label bg-red-500/15 text-red-400">PAST DUE</span>
                  )}
                  {subscription?.status === 'cancelled' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] sb-label bg-slate-500/15 text-slate-400">CANCELLED</span>
                  )}
                  {(subscription?.status === 'active' && currentPlan.id !== 'free') && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] sb-label bg-emerald-500/15 text-emerald-400">ACTIVE</span>
                  )}
                </div>
                <p className={`text-sm ${tc.textMuted} mt-0.5`}>
                  {subscription?.billing_cycle === 'annual' ? 'Annual' : 'Monthly'} billing
                  {subscription?.current_period_end ? ` · Renews ${fmtDate(subscription.current_period_end)}` : ''}
                  {subscription?.trial_ends_at && subscription?.status === 'trialing' ? ` · Trial ends ${fmtDate(subscription.trial_ends_at)}` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className={`sb-display text-2xl ${tc.text}`}>
                  {currentPlan.monthlyPrice === null ? 'Custom' : currentPlan.monthlyPrice === 0 ? 'Free' : `${fmtCents(subscription?.price_cents || currentPlan.monthlyPrice)}`}
                </p>
                {currentPlan.monthlyPrice !== null && currentPlan.monthlyPrice > 0 && (
                  <p className={`text-xs ${tc.textMuted}`}>per {subscription?.billing_cycle === 'annual' ? 'year' : 'month'}</p>
                )}
              </div>
            </div>

            {/* Usage bars */}
            {(currentPlan.teamLimit || currentPlan.playerLimit) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4" style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)'}` }}>
                {currentPlan.teamLimit && (
                  <UsageBar label="Teams" used={usage.teams} limit={currentPlan.teamLimit} color={currentPlan.color} isDark={isDark} tc={tc} />
                )}
                {currentPlan.playerLimit && (
                  <UsageBar label="Players" used={usage.players} limit={currentPlan.playerLimit} color={currentPlan.color} isDark={isDark} tc={tc} />
                )}
              </div>
            )}
            {!currentPlan.teamLimit && !currentPlan.playerLimit && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4" style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)'}` }}>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" style={{ color: currentPlan.color }} />
                  <span className={`text-sm ${tc.textMuted}`}><span className={tc.text}>{usage.teams}</span> teams (unlimited)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" style={{ color: currentPlan.color }} />
                  <span className={`text-sm ${tc.textMuted}`}><span className={tc.text}>{usage.players}</span> players (unlimited)</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BILLING CYCLE TOGGLE */}
        <div className="sb-au flex items-center justify-center gap-3" style={{ animationDelay: '.15s' }}>
          <span className={`sb-label text-sm ${billingToggle === 'monthly' ? tc.text : tc.textMuted}`}>Monthly</span>
          <button
            onClick={() => setBillingToggle(billingToggle === 'monthly' ? 'annual' : 'monthly')}
            className={`relative w-14 h-7 rounded-full transition-colors ${billingToggle === 'annual' ? '' : isDark ? 'bg-white/10' : 'bg-slate-200'}`}
            style={billingToggle === 'annual' ? { backgroundColor: accentColor } : {}}
          >
            <div className={`absolute top-0.5 ${billingToggle === 'annual' ? 'left-7.5' : 'left-0.5'} w-6 h-6 rounded-full bg-white shadow transition-all`}
              style={{ left: billingToggle === 'annual' ? '30px' : '2px' }}
            />
          </button>
          <span className={`sb-label text-sm ${billingToggle === 'annual' ? tc.text : tc.textMuted}`}>
            Annual
            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>Save ~17%</span>
          </span>
        </div>

        {/* PLAN CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan, i) => {
            const isCurrent = plan.id === currentPlan.id
            const price = billingToggle === 'annual' ? plan.annualPrice : plan.monthlyPrice
            const displayPrice = billingToggle === 'annual' && plan.annualPrice ? Math.round(plan.annualPrice / 12) : plan.monthlyPrice
            const PlanIcon = plan.icon

            return (
              <div
                key={plan.id}
                className="sb-au"
                style={{ animationDelay: `${0.2 + i * 0.06}s` }}
              >
                <div
                  className={`sb-glass rounded-2xl p-5 h-full flex flex-col relative transition ${
                    isDark ? 'hover:bg-white/[.06]' : 'bg-white/80 border-slate-200 hover:bg-white'
                  } ${plan.popular ? 'ring-2' : ''}`}
                  style={plan.popular ? { '--tw-ring-color': plan.color, borderColor: `${plan.color}40` } : {}}
                >
                  {/* Popular badge */}
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 rounded-full text-[10px] sb-label text-white" style={{ backgroundColor: plan.color }}>
                        MOST POPULAR
                      </span>
                    </div>
                  )}

                  {/* Plan header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${plan.color}15` }}>
                      <PlanIcon className="w-4.5 h-4.5" style={{ color: plan.color }} />
                    </div>
                    <h3 className={`sb-heading text-lg ${tc.text}`}>{plan.name}</h3>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    {plan.monthlyPrice === null ? (
                      <div>
                        <span className={`sb-display text-3xl ${tc.text}`}>Custom</span>
                        <p className={`text-xs ${tc.textMuted} mt-1`}>Tailored to your needs</p>
                      </div>
                    ) : plan.monthlyPrice === 0 ? (
                      <div>
                        <span className={`sb-display text-3xl ${tc.text}`}>$0</span>
                        <span className={`text-sm ${tc.textMuted} ml-1`}>/mo</span>
                        <p className={`text-xs ${tc.textMuted} mt-1`}>Free forever</p>
                      </div>
                    ) : (
                      <div>
                        <span className={`sb-display text-3xl ${tc.text}`}>{fmtCents(displayPrice)}</span>
                        <span className={`text-sm ${tc.textMuted} ml-1`}>/mo</span>
                        {billingToggle === 'annual' && (
                          <p className={`text-xs ${tc.textMuted} mt-1`}>{fmtCents(plan.annualPrice)}/year billed annually</p>
                        )}
                        {billingToggle === 'monthly' && (
                          <p className={`text-xs ${tc.textMuted} mt-1`}>{fmtCents(plan.monthlyPrice)}/month</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 flex-1 mb-4">
                    {plan.features.map((f, fi) => (
                      <li key={fi} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: plan.color }} />
                        <span className={`text-xs ${tc.textMuted}`}>{f}</span>
                      </li>
                    ))}
                    {plan.limitations.map((l, li) => (
                      <li key={`l-${li}`} className="flex items-start gap-2">
                        <X className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400/50" />
                        <span className={`text-xs ${tc.textMuted} opacity-60`}>{l}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Action button */}
                  <button
                    onClick={() => handleChangePlan(plan.id)}
                    disabled={isCurrent || changingPlan}
                    className={`w-full py-2.5 rounded-xl text-sm sb-label transition-all ${
                      isCurrent
                        ? isDark ? 'bg-white/5 text-slate-400 cursor-default' : 'bg-slate-100 text-slate-400 cursor-default'
                        : 'hover:scale-[1.02] active:scale-[0.98] text-white'
                    }`}
                    style={!isCurrent ? { backgroundColor: plan.color } : {}}
                  >
                    {isCurrent ? 'Current Plan' :
                     plan.monthlyPrice === null ? 'Contact Sales' :
                     changingPlan ? 'Updating...' :
                     PLANS.indexOf(plan) > PLANS.indexOf(currentPlan) ? 'Upgrade' : 'Switch'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* PAYMENT METHOD */}
        <div className="sb-au" style={{ animationDelay: '.5s' }}>
          <h2 className={`sb-heading text-lg ${tc.text} mb-3`}>PAYMENT METHOD</h2>
          <div className={`sb-glass rounded-2xl p-5 ${isDark ? '' : 'bg-white/80 border-slate-200'}`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                <CreditCard className="w-6 h-6" style={{ color: accentColor }} />
              </div>
              <div className="flex-1">
                <p className={`sb-heading text-base ${tc.text}`}>Stripe Payments Coming Soon</p>
                <p className={`text-xs ${tc.textMuted} mt-0.5`}>
                  VolleyBrain is currently in beta. Plans are managed by our team.
                  Automated billing via Stripe will be available soon.
                </p>
              </div>
              <span className="px-3 py-1.5 rounded-lg text-xs sb-label" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>BETA</span>
            </div>
          </div>
        </div>

        {/* BILLING HISTORY */}
        <div className="sb-au" style={{ animationDelay: '.55s' }}>
          <h2 className={`sb-heading text-lg ${tc.text} mb-3`}>BILLING HISTORY</h2>
          <div className={`sb-glass rounded-2xl overflow-hidden ${isDark ? '' : 'bg-white/80 border-slate-200'}`}>
            {invoices.length === 0 ? (
              <div className="p-8 text-center">
                <Receipt className="w-8 h-8 mx-auto mb-2" style={{ color: `${accentColor}50` }} />
                <p className={`text-sm ${tc.textMuted}`}>No invoices yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={isDark ? 'bg-white/[.02]' : 'bg-slate-50'}>
                      <th className={`text-left px-4 py-3 text-xs sb-label ${tc.textMuted}`}>Date</th>
                      <th className={`text-left px-4 py-3 text-xs sb-label ${tc.textMuted}`}>Amount</th>
                      <th className={`text-left px-4 py-3 text-xs sb-label ${tc.textMuted}`}>Status</th>
                      <th className={`text-right px-4 py-3 text-xs sb-label ${tc.textMuted}`}>Paid At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(inv => (
                      <tr key={inv.id} className={`border-t ${isDark ? 'border-white/[.04]' : 'border-slate-100'}`}>
                        <td className={`px-4 py-3 text-sm ${tc.text}`}>{fmtDate(inv.invoice_date)}</td>
                        <td className={`px-4 py-3 text-sm ${tc.text} sb-label`}>{fmtCents(inv.amount_cents)}</td>
                        <td className="px-4 py-3">
                          <InvoiceStatusBadge status={inv.status} />
                        </td>
                        <td className={`px-4 py-3 text-sm text-right ${tc.textMuted}`}>{fmtDate(inv.paid_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* CANCEL SUBSCRIPTION */}
        {subscription && subscription.status === 'active' && currentPlan.id !== 'free' && (
          <div className="sb-au" style={{ animationDelay: '.6s' }}>
            <div className={`rounded-xl p-4 ${isDark ? 'bg-red-500/5 border border-red-500/10' : 'bg-red-50 border border-red-200'}`}>
              {!showCancelConfirm ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm sb-label ${isDark ? 'text-red-300' : 'text-red-700'}`}>Cancel Subscription</p>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-red-300/60' : 'text-red-500'}`}>You'll be downgraded to the Free plan at the end of your billing period.</p>
                  </div>
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className={`px-4 py-2 rounded-lg text-sm sb-label transition ${isDark ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                  >
                    Cancel Plan
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <p className={`text-sm sb-label ${isDark ? 'text-red-300' : 'text-red-700'}`}>Are you sure? This will cancel your {currentPlan.name} plan.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelSubscription}
                      className="px-4 py-2 rounded-lg text-sm sb-label bg-red-500 text-white hover:bg-red-600 transition"
                    >
                      Yes, Cancel
                    </button>
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className={`px-4 py-2 rounded-lg text-sm sb-label transition ${isDark ? 'bg-white/5 text-slate-300 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      Keep Plan
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </>
  )
}

// ═══════ USAGE BAR COMPONENT ═══════

function UsageBar({ label, used, limit, color, isDark, tc }) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0
  const isNearLimit = pct >= 80
  const barColor = isNearLimit ? '#EF4444' : color

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs sb-label ${tc.textMuted}`}>{label}</span>
        <span className={`text-xs sb-label ${isNearLimit ? 'text-red-400' : tc.text}`}>{used} / {limit}</span>
      </div>
      <div className={`w-full h-2 rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: barColor }} />
      </div>
      {isNearLimit && (
        <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Approaching limit — consider upgrading
        </p>
      )}
    </div>
  )
}

// ═══════ INVOICE STATUS BADGE ═══════

function InvoiceStatusBadge({ status }) {
  const styles = {
    paid: 'bg-emerald-500/15 text-emerald-400',
    open: 'bg-blue-500/15 text-blue-400',
    draft: 'bg-slate-500/15 text-slate-400',
    void: 'bg-slate-500/15 text-slate-400',
    uncollectible: 'bg-red-500/15 text-red-400',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${styles[status] || styles.draft}`}>
      {status}
    </span>
  )
}

export { SubscriptionPage }
