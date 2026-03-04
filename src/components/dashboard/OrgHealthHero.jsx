// =============================================================================
// OrgHealthHero — Admin dashboard centerpiece card
// Dark navy hero with health score ring, KPI pills, and urgent action items.
// DESIGN: Always-dark hero (same pattern as CoachGameDayHeroV2, LynxSidebar).
// =============================================================================

import { AlertCircle, TrendingUp, TrendingDown, Users, Shield, DollarSign, FileText, Calendar, UserCheck } from 'lucide-react'

// Health score status thresholds
function getHealthStatus(score) {
  if (score >= 80) return { label: 'Healthy', color: '#22C55E' }
  if (score >= 50) return { label: 'Needs Attention', color: '#F59E0B' }
  return { label: 'Critical', color: '#EF4444' }
}

// Conic-gradient health ring
function HealthRing({ score, size = 160 }) {
  const status = getHealthStatus(score)
  const pct = Math.min(100, Math.max(0, score))

  return (
    <div
      className="relative rounded-full flex items-center justify-center"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${status.color} ${pct * 3.6}deg, rgba(255,255,255,0.08) ${pct * 3.6}deg)`,
      }}
    >
      <div className="absolute inset-[6px] rounded-full bg-[#0B1628] flex flex-col items-center justify-center">
        <span className="text-6xl font-black text-white tabular-nums">{score}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Health</span>
      </div>
    </div>
  )
}

// KPI pill
function KpiPill({ label, value, change, icon: Icon }) {
  const isPositive = change > 0
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.06]">
      {Icon && (
        <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-slate-400" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-white text-sm font-bold tabular-nums">{value}</p>
        <p className="text-[10px] text-slate-500 truncate">{label}</p>
      </div>
      {change !== undefined && change !== null && (
        <div className={`flex items-center gap-0.5 text-[10px] font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isPositive ? '+' : ''}{change}%
        </div>
      )}
    </div>
  )
}

// Urgent action item
function UrgentItem({ label, count, severity = 'warning', onClick }) {
  const dotColor = {
    critical: 'bg-red-500',
    warning: 'bg-amber-500',
    info: 'bg-lynx-sky',
  }[severity] || 'bg-amber-500'

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-2 text-left hover:bg-white/[0.04] rounded-lg transition-colors px-1"
    >
      <div className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
      <span className="text-sm text-slate-300 flex-1 truncate">{label}</span>
      {count > 0 && (
        <span className="text-sm font-bold text-white tabular-nums">{count}</span>
      )}
    </button>
  )
}

// =============================================================================
// Main Component
// =============================================================================
export default function OrgHealthHero({
  orgName = 'Organization',
  healthScore = 0,
  kpis = {},
  urgentItems = [],
  onNavigate,
}) {
  const status = getHealthStatus(healthScore)

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0B1628 0%, #122240 50%, #0B1628 100%)', minHeight: '280px' }}>
      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 30% 50%, rgba(75,185,236,0.08) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 p-6 grid grid-cols-1 lg:grid-cols-[200px_1fr_280px] gap-6">
        {/* Left — Score Block */}
        <div className="flex flex-col items-center justify-center gap-3">
          <HealthRing score={healthScore} />
          <div className="text-center">
            <h2 className="text-lg font-black text-white tracking-wide">{orgName}</h2>
            <p className="text-xs font-bold mt-1" style={{ color: status.color }}>
              {status.label}
            </p>
          </div>
        </div>

        {/* Center — KPI Pills */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
          <KpiPill
            icon={Shield}
            label="Active Teams"
            value={kpis.teams || 0}
          />
          <KpiPill
            icon={Users}
            label="Registered Players"
            value={kpis.players || 0}
          />
          <KpiPill
            icon={DollarSign}
            label="Revenue Collected"
            value={`$${(kpis.revenueCollected || 0).toLocaleString()}`}
          />
          <KpiPill
            icon={FileText}
            label="Waiver Completion"
            value={`${kpis.waiverPct || 0}%`}
          />
          <KpiPill
            icon={Calendar}
            label="Events This Month"
            value={kpis.eventsMonth || 0}
          />
          <KpiPill
            icon={UserCheck}
            label="Active Coaches"
            value={kpis.coaches || 0}
          />
          <KpiPill
            icon={DollarSign}
            label="Outstanding"
            value={`$${(kpis.outstanding || 0).toLocaleString()}`}
          />
          <KpiPill
            icon={AlertCircle}
            label="Overdue Payments"
            value={kpis.overduePayments || 0}
          />
        </div>

        {/* Right — Urgent Actions */}
        <div className="border-l border-white/[0.06] pl-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Needs Attention</h3>
          </div>
          {urgentItems.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-emerald-400 text-sm font-semibold">All clear!</p>
              <p className="text-slate-500 text-xs mt-1">Nothing needs your attention.</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {urgentItems.map((item, idx) => (
                <UrgentItem
                  key={idx}
                  label={item.label}
                  count={item.count}
                  severity={item.severity}
                  onClick={() => onNavigate?.(item.page)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
