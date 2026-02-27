import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  Shield, Building2, Users, DollarSign, TrendingUp, Calendar, Clock,
  ChevronDown, RefreshCw, AlertTriangle, Star, Zap, Gem, Check, X,
  Search, Receipt, CreditCard, Sparkles
} from '../../constants/icons'

// ═══════════════════════════════════════════════════════════
// PLATFORM SUBSCRIPTIONS PAGE — Super-Admin Billing Manager
// Glassmorphism Design — Manage all org subscriptions
// ═══════════════════════════════════════════════════════════

const PS_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Rajdhani:wght@400;500;600;700&display=swap');
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes scaleIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  .ps-au{animation:fadeUp .4s ease-out both}
  .ps-ai{animation:fadeIn .3s ease-out both}
  .ps-as{animation:scaleIn .25s ease-out both}
  .ps-display{font-family:'Bebas Neue',sans-serif;letter-spacing:.05em}
  .ps-heading{font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:.04em}
  .ps-label{font-family:'Rajdhani',sans-serif;font-weight:600;letter-spacing:.03em}
  .ps-glass{background:rgba(255,255,255,.03);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.08)}
  .ps-glass-solid{background:rgba(255,255,255,.05);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,.08)}
  .ps-shimmer{background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.04) 50%,transparent 100%);background-size:200% 100%;animation:shimmer 3s ease-in-out infinite}
`

const TIER_CONFIG = {
  free:       { label: 'Free',       icon: Star,   color: '#94A3B8', monthly: 0,    annual: 0 },
  starter:    { label: 'Starter',    icon: Zap,    color: '#3B82F6', monthly: 2900, annual: 29000 },
  pro:        { label: 'Pro',        icon: Gem,    color: '#8B5CF6', monthly: 7900, annual: 79000 },
  enterprise: { label: 'Enterprise', icon: Shield, color: '#F59E0B', monthly: null, annual: null },
}

const STATUS_CONFIG = {
  active:    { label: 'Active',   color: '#10B981' },
  trialing:  { label: 'Trial',    color: '#F59E0B' },
  past_due:  { label: 'Past Due', color: '#EF4444' },
  cancelled: { label: 'Cancelled', color: '#64748B' },
  expired:   { label: 'Expired',  color: '#64748B' },
}

function fmtCents(cents) {
  if (cents === null || cents === undefined) return 'Custom'
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ═══════ MAIN COMPONENT ═══════

function PlatformSubscriptionsPage({ showToast }) {
  const { isPlatformAdmin } = useAuth()
  const { isDark, accent } = useTheme()
  const tc = useThemeClasses()
  const accentColor = accent?.primary || '#EAB308'

  const [subscriptions, setSubscriptions] = useState([])
  const [orgs, setOrgs] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [filterTier, setFilterTier] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  // Modals
  const [editingSub, setEditingSub] = useState(null)
  const [editForm, setEditForm] = useState({ plan_tier: 'free', billing_cycle: 'monthly', status: 'active', trial_days: 14 })
  const [showInvoicesFor, setShowInvoicesFor] = useState(null)
  const [savingSub, setSavingSub] = useState(false)
  const [creatingInvoice, setCreatingInvoice] = useState(false)

  // ═══════ ACCESS GATE ═══════
  if (!isPlatformAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'} border rounded-xl p-8 text-center max-w-md`}>
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className={`text-xl font-bold ${tc.text} mb-2`}>Access Denied</h2>
          <p className={tc.textMuted}>Only platform super-admins can manage subscriptions.</p>
        </div>
      </div>
    )
  }

  // ═══════ LOAD DATA ═══════
  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [subsRes, orgsRes] = await Promise.all([
        supabase.from('platform_subscriptions').select('*').order('created_at', { ascending: false }),
        supabase.from('organizations').select('id, name, slug, is_active, created_at').order('name'),
      ])

      setSubscriptions(subsRes.data || [])
      setOrgs(orgsRes.data || [])
    } catch (err) {
      console.error('Load error:', err)
    }
    setLoading(false)
  }

  // ═══════ COMPUTED ═══════

  // Merge orgs with their subscriptions
  const orgRows = useMemo(() => {
    const subMap = {}
    subscriptions.forEach(s => { subMap[s.organization_id] = s })

    return orgs.map(org => ({
      ...org,
      subscription: subMap[org.id] || null,
      tier: subMap[org.id]?.plan_tier || 'free',
      status: subMap[org.id]?.status || 'none',
      priceCents: subMap[org.id]?.price_cents || 0,
      billingCycle: subMap[org.id]?.billing_cycle || 'monthly',
    }))
  }, [orgs, subscriptions])

  // Filtered rows
  const filteredRows = useMemo(() => {
    return orgRows.filter(row => {
      if (search && !row.name.toLowerCase().includes(search.toLowerCase())) return false
      if (filterTier !== 'all' && row.tier !== filterTier) return false
      if (filterStatus !== 'all' && row.status !== filterStatus) return false
      return true
    })
  }, [orgRows, search, filterTier, filterStatus])

  // Revenue metrics
  const metrics = useMemo(() => {
    let mrr = 0
    let arr = 0
    const tierCounts = { free: 0, starter: 0, pro: 0, enterprise: 0 }
    const tierRevenue = { free: 0, starter: 0, pro: 0, enterprise: 0 }

    subscriptions.forEach(s => {
      if (s.status !== 'active' && s.status !== 'trialing') return
      tierCounts[s.plan_tier] = (tierCounts[s.plan_tier] || 0) + 1
      const monthly = s.billing_cycle === 'annual' ? Math.round((s.price_cents || 0) / 12) : (s.price_cents || 0)
      mrr += monthly
      tierRevenue[s.plan_tier] = (tierRevenue[s.plan_tier] || 0) + monthly
    })
    arr = mrr * 12

    const activeCount = subscriptions.filter(s => s.status === 'active' || s.status === 'trialing').length
    const trialCount = subscriptions.filter(s => s.status === 'trialing').length
    const pastDueCount = subscriptions.filter(s => s.status === 'past_due').length

    return { mrr, arr, activeCount, trialCount, pastDueCount, tierCounts, tierRevenue, totalOrgs: orgs.length }
  }, [subscriptions, orgs])

  // ═══════ EDIT SUBSCRIPTION ═══════

  function openEditSub(org) {
    const sub = org.subscription
    setEditingSub(org)
    setEditForm({
      plan_tier: sub?.plan_tier || 'free',
      billing_cycle: sub?.billing_cycle || 'monthly',
      status: sub?.status || 'active',
      trial_days: 14,
    })
  }

  async function saveSubscription() {
    if (!editingSub) return
    setSavingSub(true)

    try {
      const tier = TIER_CONFIG[editForm.plan_tier]
      const priceCents = editForm.plan_tier === 'free' ? 0 :
        editForm.billing_cycle === 'annual' ? (tier?.annual || 0) : (tier?.monthly || 0)

      const now = new Date()
      const periodEnd = new Date(now)
      if (editForm.billing_cycle === 'annual') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1)
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1)
      }

      let trialEndsAt = null
      if (editForm.status === 'trialing' && editForm.trial_days > 0) {
        const trialEnd = new Date(now)
        trialEnd.setDate(trialEnd.getDate() + editForm.trial_days)
        trialEndsAt = trialEnd.toISOString()
      }

      if (editingSub.subscription) {
        // Update existing
        const { error } = await supabase
          .from('platform_subscriptions')
          .update({
            plan_tier: editForm.plan_tier,
            billing_cycle: editForm.billing_cycle,
            status: editForm.status,
            price_cents: priceCents,
            trial_ends_at: trialEndsAt,
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            cancelled_at: editForm.status === 'cancelled' ? now.toISOString() : null,
            updated_at: now.toISOString(),
          })
          .eq('id', editingSub.subscription.id)
        if (error) throw error
      } else {
        // Create new
        const { error } = await supabase
          .from('platform_subscriptions')
          .insert({
            organization_id: editingSub.id,
            plan_tier: editForm.plan_tier,
            billing_cycle: editForm.billing_cycle,
            status: editForm.status,
            price_cents: priceCents,
            trial_ends_at: trialEndsAt,
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
          })
        if (error) throw error
      }

      showToast(`Subscription updated for ${editingSub.name}`, 'success')
      setEditingSub(null)
      await loadData()
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
    }
    setSavingSub(false)
  }

  // ═══════ INVOICES ═══════

  async function loadOrgInvoices(orgId) {
    setShowInvoicesFor(orgId)
    const { data } = await supabase
      .from('platform_invoices')
      .select('*')
      .eq('organization_id', orgId)
      .order('invoice_date', { ascending: false })
      .limit(20)
    setInvoices(data || [])
  }

  async function markInvoicePaid(invoiceId) {
    const { error } = await supabase
      .from('platform_invoices')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', invoiceId)
    if (error) {
      showToast('Error: ' + error.message, 'error')
    } else {
      showToast('Invoice marked as paid', 'success')
      if (showInvoicesFor) loadOrgInvoices(showInvoicesFor)
    }
  }

  async function createInvoice(orgId, amountCents) {
    setCreatingInvoice(true)
    const sub = subscriptions.find(s => s.organization_id === orgId)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30)

    const { error } = await supabase
      .from('platform_invoices')
      .insert({
        subscription_id: sub?.id || null,
        organization_id: orgId,
        amount_cents: amountCents,
        status: 'open',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
      })
    if (error) {
      showToast('Error: ' + error.message, 'error')
    } else {
      showToast('Invoice created', 'success')
      if (showInvoicesFor === orgId) loadOrgInvoices(orgId)
    }
    setCreatingInvoice(false)
  }

  // ═══════ LOADING ═══════
  if (loading) {
    return (
      <>
        <style>{PS_STYLES}</style>
        <div className="space-y-6 max-w-7xl mx-auto">
          <div className="ps-au"><div className={`h-10 w-80 rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-200'} ps-shimmer`} /></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className={`h-28 rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-100'} ps-shimmer`} style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        </div>
      </>
    )
  }

  // ═══════ RENDER ═══════
  return (
    <>
      <style>{PS_STYLES}</style>
      <div className="space-y-6 max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="ps-au" style={{ animationDelay: '.05s' }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className={`ps-display text-3xl sm:text-4xl ${tc.text}`}>PLATFORM SUBSCRIPTIONS</h1>
              <p className={`ps-label text-sm ${tc.textMuted} mt-1`}>Manage organization plans, billing, and revenue</p>
            </div>
            <button onClick={loadData} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm ps-label transition ${isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10' : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'}`}>
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* REVENUE METRICS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Monthly Revenue (MRR)', value: fmtCents(metrics.mrr), icon: DollarSign, color: '#10B981' },
            { label: 'Annual Revenue (ARR)', value: fmtCents(metrics.arr), icon: TrendingUp, color: '#3B82F6' },
            { label: 'Active Subscriptions', value: metrics.activeCount, icon: Sparkles, color: '#8B5CF6' },
            { label: 'Orgs on Platform', value: metrics.totalOrgs, icon: Building2, color: '#F59E0B' },
          ].map((m, i) => (
            <div key={i} className="ps-au" style={{ animationDelay: `${0.1 + i * 0.05}s` }}>
              <div className={`ps-glass rounded-xl p-4 ${isDark ? '' : 'bg-white/80 border-slate-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <m.icon className="w-4 h-4" style={{ color: m.color }} />
                  <span className={`text-[11px] ps-label ${tc.textMuted}`}>{m.label}</span>
                </div>
                <p className={`ps-display text-2xl ${tc.text}`}>{m.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* TIER BREAKDOWN */}
        <div className="ps-au" style={{ animationDelay: '.3s' }}>
          <div className={`ps-glass rounded-xl p-4 ${isDark ? '' : 'bg-white/80 border-slate-200'}`}>
            <h3 className={`ps-label text-xs ${tc.textMuted} mb-3`}>REVENUE BY TIER</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(TIER_CONFIG).map(([tierId, tier]) => {
                const TierIcon = tier.icon
                return (
                  <div key={tierId} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-white/[.02]' : 'bg-slate-50'}`}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${tier.color}15` }}>
                      <TierIcon className="w-4 h-4" style={{ color: tier.color }} />
                    </div>
                    <div>
                      <p className={`text-xs ps-label ${tc.text}`}>{tier.label}</p>
                      <p className={`text-[11px] ${tc.textMuted}`}>
                        {metrics.tierCounts[tierId] || 0} orgs · {fmtCents(metrics.tierRevenue[tierId] || 0)}/mo
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* FILTERS */}
        <div className="ps-au" style={{ animationDelay: '.35s' }}>
          <div className={`ps-glass rounded-xl p-4 ${isDark ? '' : 'bg-white/80 border-slate-200'}`}>
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className={`flex items-center gap-2 flex-1 min-w-[200px] px-3 py-2 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                <Search className="w-4 h-4" style={{ color: `${accentColor}80` }} />
                <input
                  type="text"
                  placeholder="Search organizations..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className={`bg-transparent text-sm outline-none w-full ${tc.text}`}
                />
                {search && <button onClick={() => setSearch('')}><X className="w-3.5 h-3.5 text-slate-400" /></button>}
              </div>

              {/* Tier filter */}
              <select value={filterTier} onChange={e => setFilterTier(e.target.value)} className={`px-3 py-2 rounded-xl text-sm border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
                <option value="all">All Tiers</option>
                {Object.entries(TIER_CONFIG).map(([id, t]) => (
                  <option key={id} value={id}>{t.label}</option>
                ))}
              </select>

              {/* Status filter */}
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={`px-3 py-2 rounded-xl text-sm border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
                <option value="all">All Status</option>
                {Object.entries(STATUS_CONFIG).map(([id, s]) => (
                  <option key={id} value={id}>{s.label}</option>
                ))}
                <option value="none">No Subscription</option>
              </select>

              <span className={`text-xs ps-label ${tc.textMuted} ml-auto`}>{filteredRows.length} organizations</span>
            </div>
          </div>
        </div>

        {/* ORGANIZATIONS TABLE */}
        <div className="ps-au" style={{ animationDelay: '.4s' }}>
          <div className={`ps-glass rounded-xl overflow-hidden ${isDark ? '' : 'bg-white/80 border-slate-200'}`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={isDark ? 'bg-white/[.02]' : 'bg-slate-50'}>
                    <th className={`text-left px-4 py-3 text-xs ps-label ${tc.textMuted}`}>Organization</th>
                    <th className={`text-left px-4 py-3 text-xs ps-label ${tc.textMuted}`}>Plan</th>
                    <th className={`text-left px-4 py-3 text-xs ps-label ${tc.textMuted}`}>Status</th>
                    <th className={`text-left px-4 py-3 text-xs ps-label ${tc.textMuted}`}>Billing</th>
                    <th className={`text-right px-4 py-3 text-xs ps-label ${tc.textMuted}`}>Revenue</th>
                    <th className={`text-left px-4 py-3 text-xs ps-label ${tc.textMuted}`}>Period End</th>
                    <th className={`text-right px-4 py-3 text-xs ps-label ${tc.textMuted}`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map(row => {
                    const tier = TIER_CONFIG[row.tier] || TIER_CONFIG.free
                    const statusCfg = STATUS_CONFIG[row.status] || { label: 'None', color: '#64748B' }
                    const TierIcon = tier.icon

                    return (
                      <tr key={row.id} className={`border-t ${isDark ? 'border-white/[.04] hover:bg-white/[.02]' : 'border-slate-100 hover:bg-slate-50'} transition`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" style={{ color: tier.color }} />
                            <div>
                              <p className={`text-sm ${tc.text}`}>{row.name}</p>
                              <p className={`text-[10px] ${tc.textMuted}`}>{row.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <TierIcon className="w-3.5 h-3.5" style={{ color: tier.color }} />
                            <span className="text-sm ps-label" style={{ color: tier.color }}>{tier.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] ps-label" style={{ backgroundColor: `${statusCfg.color}15`, color: statusCfg.color }}>
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-sm ${tc.textMuted}`}>
                          {row.billingCycle === 'annual' ? 'Annual' : 'Monthly'}
                        </td>
                        <td className={`px-4 py-3 text-sm text-right ps-label ${tc.text}`}>
                          {row.priceCents > 0 ? fmtCents(row.priceCents) : '—'}
                          {row.priceCents > 0 && <span className={`text-[10px] ${tc.textMuted}`}>/{row.billingCycle === 'annual' ? 'yr' : 'mo'}</span>}
                        </td>
                        <td className={`px-4 py-3 text-sm ${tc.textMuted}`}>
                          {fmtDate(row.subscription?.current_period_end)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditSub(row)}
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] ps-label transition ${isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                            >
                              Edit Plan
                            </button>
                            <button
                              onClick={() => loadOrgInvoices(row.id)}
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] ps-label transition ${isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                            >
                              Invoices
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <Building2 className={`w-8 h-8 mx-auto mb-2 ${tc.textMuted}`} />
                        <p className={`text-sm ${tc.textMuted}`}>No organizations match your filters</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* EDIT SUBSCRIPTION MODAL */}
        {editingSub && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingSub(null)} />
            <div className={`relative w-full max-w-lg rounded-xl p-6 ps-as ${isDark ? 'bg-slate-800 border border-white/10' : 'bg-white border border-slate-200'} shadow-2xl`}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className={`ps-heading text-lg ${tc.text}`}>Edit Subscription</h3>
                  <p className={`text-xs ${tc.textMuted}`}>{editingSub.name}</p>
                </div>
                <button onClick={() => setEditingSub(null)} className={`p-1.5 rounded-lg transition ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Plan Tier */}
                <div>
                  <label className={`text-xs ps-label ${tc.textMuted} block mb-1`}>PLAN TIER</label>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(TIER_CONFIG).map(([id, tier]) => {
                      const TierIcon = tier.icon
                      return (
                        <button
                          key={id}
                          onClick={() => setEditForm({ ...editForm, plan_tier: id })}
                          className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition text-center ${
                            editForm.plan_tier === id
                              ? `border-2`
                              : isDark ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-50'
                          }`}
                          style={editForm.plan_tier === id ? { borderColor: tier.color, backgroundColor: `${tier.color}10` } : {}}
                        >
                          <TierIcon className="w-4 h-4" style={{ color: tier.color }} />
                          <span className={`text-xs ps-label ${editForm.plan_tier === id ? tc.text : tc.textMuted}`}>{tier.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Billing Cycle */}
                <div>
                  <label className={`text-xs ps-label ${tc.textMuted} block mb-1`}>BILLING CYCLE</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['monthly', 'annual'].map(cycle => (
                      <button
                        key={cycle}
                        onClick={() => setEditForm({ ...editForm, billing_cycle: cycle })}
                        className={`px-4 py-2.5 rounded-xl text-sm ps-label border transition ${
                          editForm.billing_cycle === cycle
                            ? 'text-white'
                            : isDark ? 'border-white/10 text-slate-300 hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                        style={editForm.billing_cycle === cycle ? { backgroundColor: accentColor, borderColor: accentColor } : {}}
                      >
                        {cycle === 'monthly' ? 'Monthly' : 'Annual'}
                        {editForm.plan_tier !== 'free' && editForm.plan_tier !== 'enterprise' && (
                          <span className="block text-[10px] opacity-75 mt-0.5">
                            {fmtCents(cycle === 'annual' ? TIER_CONFIG[editForm.plan_tier]?.annual : TIER_CONFIG[editForm.plan_tier]?.monthly)}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className={`text-xs ps-label ${tc.textMuted} block mb-1`}>STATUS</label>
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl text-sm border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                  >
                    {Object.entries(STATUS_CONFIG).map(([id, s]) => (
                      <option key={id} value={id}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {/* Trial days (shown only when trialing) */}
                {editForm.status === 'trialing' && (
                  <div>
                    <label className={`text-xs ps-label ${tc.textMuted} block mb-1`}>TRIAL DURATION (DAYS)</label>
                    <input
                      type="number"
                      value={editForm.trial_days}
                      onChange={e => setEditForm({ ...editForm, trial_days: parseInt(e.target.value) || 0 })}
                      min={1} max={90}
                      className={`w-full px-3 py-2.5 rounded-xl text-sm border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                    />
                  </div>
                )}

                {/* Price preview */}
                {editForm.plan_tier !== 'free' && editForm.plan_tier !== 'enterprise' && (
                  <div className={`flex items-center gap-2 p-3 rounded-xl ${isDark ? 'bg-white/[.03]' : 'bg-slate-50'}`}>
                    <DollarSign className="w-4 h-4" style={{ color: accentColor }} />
                    <span className={`text-sm ${tc.textMuted}`}>Price:</span>
                    <span className={`text-sm ps-label ${tc.text}`}>
                      {fmtCents(editForm.billing_cycle === 'annual' ? TIER_CONFIG[editForm.plan_tier]?.annual : TIER_CONFIG[editForm.plan_tier]?.monthly)}
                      /{editForm.billing_cycle === 'annual' ? 'year' : 'month'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={saveSubscription}
                  disabled={savingSub}
                  className="flex-1 py-2.5 rounded-xl text-sm ps-label text-white transition hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: accentColor }}
                >
                  {savingSub ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setEditingSub(null)}
                  className={`px-6 py-2.5 rounded-xl text-sm ps-label transition ${isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* INVOICES SLIDE-OVER */}
        {showInvoicesFor && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowInvoicesFor(null)} />
            <div className={`relative w-full max-w-lg h-full overflow-y-auto ps-as ${isDark ? 'bg-slate-900 border-l border-white/10' : 'bg-white border-l border-slate-200'} shadow-2xl`}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className={`ps-heading text-lg ${tc.text}`}>Invoices</h3>
                    <p className={`text-xs ${tc.textMuted}`}>{orgs.find(o => o.id === showInvoicesFor)?.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const sub = subscriptions.find(s => s.organization_id === showInvoicesFor)
                        const amount = sub?.price_cents || 0
                        if (amount > 0) createInvoice(showInvoicesFor, amount)
                        else showToast('Cannot create invoice for free plan', 'warning')
                      }}
                      disabled={creatingInvoice}
                      className="px-3 py-1.5 rounded-lg text-xs ps-label text-white transition hover:opacity-90"
                      style={{ backgroundColor: accentColor }}
                    >
                      + Create Invoice
                    </button>
                    <button onClick={() => setShowInvoicesFor(null)} className={`p-1.5 rounded-lg transition ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}>
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {invoices.length === 0 ? (
                  <div className="py-12 text-center">
                    <Receipt className="w-8 h-8 mx-auto mb-2" style={{ color: `${accentColor}50` }} />
                    <p className={`text-sm ${tc.textMuted}`}>No invoices yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {invoices.map(inv => {
                      const statusColors = {
                        paid: '#10B981', open: '#3B82F6', draft: '#64748B', void: '#64748B', uncollectible: '#EF4444'
                      }
                      return (
                        <div key={inv.id} className={`p-4 rounded-xl ${isDark ? 'bg-white/[.03] border border-white/[.06]' : 'bg-slate-50 border border-slate-100'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm ps-label ${tc.text}`}>{fmtCents(inv.amount_cents)}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] ps-label" style={{ backgroundColor: `${statusColors[inv.status] || '#64748B'}15`, color: statusColors[inv.status] || '#64748B' }}>
                              {inv.status.toUpperCase()}
                            </span>
                          </div>
                          <div className={`flex items-center gap-3 text-xs ${tc.textMuted}`}>
                            <span>Issued: {fmtDate(inv.invoice_date)}</span>
                            <span>Due: {fmtDate(inv.due_date)}</span>
                            {inv.paid_at && <span>Paid: {fmtDate(inv.paid_at)}</span>}
                          </div>
                          {(inv.status === 'open' || inv.status === 'draft') && (
                            <button
                              onClick={() => markInvoicePaid(inv.id)}
                              className="mt-2 px-3 py-1 rounded-lg text-[11px] ps-label bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition"
                            >
                              <Check className="w-3 h-3 inline mr-1" />
                              Mark Paid
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}

export { PlatformSubscriptionsPage }
