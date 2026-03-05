// =============================================================================
// OrgHealthHero — Admin dashboard centerpiece card
// Dark navy hero with health score ring, KPI pills, and urgent action items.
// DESIGN: Always-dark hero, game-day treatment (50% taller, prominent ring).
// Health score is transparent — weighted avg of 9 org-health components.
// =============================================================================

import { AlertCircle, TrendingUp, TrendingDown, Users, Shield, DollarSign, FileText, Calendar, UserCheck, CheckCircle2 } from 'lucide-react'

// Health score status thresholds
function getHealthStatus(score) {
  if (score >= 80) return { label: 'Healthy', color: '#22C55E' }
  if (score >= 50) return { label: 'Needs Attention', color: '#F59E0B' }
  return { label: 'Critical', color: '#EF4444' }
}

// Conic-gradient health ring — larger for game-day treatment
function HealthRing({ score, size = 200 }) {
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
      <div className="absolute inset-[8px] rounded-full bg-[#0B1628] flex flex-col items-center justify-center">
        <span className="text-7xl font-black text-white tabular-nums">{score}</span>
        <span className="text-lg font-bold uppercase tracking-wider text-slate-400">Health</span>
      </div>
    </div>
  )
}

// KPI pill — dark background
function KpiPill({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.06]">
      {Icon && (
        <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-slate-400" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-white text-xl font-bold tabular-nums">{value}</p>
        <p className="text-lg text-slate-500 truncate">{label}</p>
      </div>
    </div>
  )
}

// Urgent action item row
function UrgentItem({ label, count, severity = 'warning', onClick }) {
  const dotColor = {
    critical: 'bg-red-500',
    warning: 'bg-amber-500',
    info: 'bg-lynx-sky',
  }[severity] || 'bg-amber-500'

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-2.5 text-left hover:bg-white/[0.04] rounded-lg transition-colors px-2"
    >
      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />
      <span className="text-xl text-slate-300 flex-1 truncate">{label}</span>
      {count > 0 && (
        <span className="text-xl font-bold text-white bg-white/[0.08] px-2.5 py-0.5 rounded-lg tabular-nums">{count}</span>
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
    <div className="relative rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0B1628 0%, #122240 50%, #0B1628 100%)', minHeight: '420px' }}>
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

      <div className="relative z-10 p-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 h-full">
        {/* ─── LEFT SIDE (~60%) ─── */}
        <div className="flex flex-col gap-6">
          {/* Org name label */}
          <p className="text-lg text-white/40 uppercase tracking-wider font-semibold">{orgName}</p>

          {/* Title + Ring row */}
          <div className="flex items-center gap-8">
            <HealthRing score={healthScore} />
            <div>
              <h2 className="text-3xl font-extrabold text-white mb-1">Organization Health</h2>
              <p className="text-xl font-bold" style={{ color: status.color }}>
                {status.label}
              </p>
              <p className="text-lg text-slate-500 mt-2">
                Weighted score across registration, payments, waivers, rosters, schedules, coaches, and compliance.
              </p>
            </div>
          </div>

          {/* KPI Pills row */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
            <KpiPill icon={Shield} label="Active Teams" value={kpis.teams || 0} />
            <KpiPill icon={Users} label="Players" value={kpis.players || 0} />
            <KpiPill icon={DollarSign} label="Collected" value={`$${(kpis.revenueCollected || 0).toLocaleString()}`} />
            <KpiPill icon={FileText} label="Waivers" value={`${kpis.waiverPct || 0}%`} />
            <KpiPill icon={Calendar} label="Events / Mo" value={kpis.eventsMonth || 0} />
            <KpiPill icon={UserCheck} label="Coaches" value={kpis.coaches || 0} />
            <KpiPill icon={DollarSign} label="Outstanding" value={`$${(kpis.outstanding || 0).toLocaleString()}`} />
            <KpiPill icon={AlertCircle} label="Overdue" value={kpis.overduePayments || 0} />
          </div>
        </div>

        {/* ─── RIGHT SIDE (~40%) — NEEDS ATTENTION ─── */}
        <div className="border-l border-white/[0.06] pl-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-bold uppercase tracking-wider text-amber-400">Needs Attention</h3>
          </div>

          {urgentItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
              <p className="text-emerald-400 text-xl font-bold">All systems go</p>
              <p className="text-slate-500 text-lg mt-1">Nothing needs your attention right now.</p>
            </div>
          ) : (
            <div className="space-y-1 flex-1">
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
