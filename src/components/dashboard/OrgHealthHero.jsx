// =============================================================================
// OrgHealthHero — Admin dashboard centerpiece card (redesigned)
// Centered org name, focal health ring with status inside, clickable
// needs-attention items, compact 2×4 KPI grid at bottom.
// =============================================================================

import { AlertCircle, Users, Shield, DollarSign, FileText, Calendar, UserCheck, CheckCircle2, ChevronRight } from 'lucide-react'

function getHealthStatus(score) {
  if (score >= 80) return { label: 'Healthy', color: '#22C55E' }
  if (score >= 50) return { label: 'Needs Attention', color: '#F59E0B' }
  return { label: 'Critical', color: '#EF4444' }
}

function HealthRing({ score, size = 140 }) {
  const status = getHealthStatus(score)
  const pct = Math.min(100, Math.max(0, score))

  return (
    <div
      className="relative rounded-full flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${status.color} ${pct * 3.6}deg, rgba(255,255,255,0.08) ${pct * 3.6}deg)`,
      }}
    >
      <div className="absolute inset-[7px] rounded-full bg-[#0B1628] flex flex-col items-center justify-center">
        <span className="text-5xl font-black text-white tabular-nums leading-none">{score}</span>
        <span className="text-[11px] font-bold uppercase tracking-wider mt-1" style={{ color: status.color }}>
          {status.label}
        </span>
      </div>
    </div>
  )
}

function KpiCell({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.04]">
      {Icon && <Icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
      <div className="min-w-0">
        <p className="text-white text-sm font-bold tabular-nums leading-tight">{value}</p>
        <p className="text-[10px] text-slate-500 truncate leading-tight">{label}</p>
      </div>
    </div>
  )
}

function UrgentItem({ label, count, severity = 'warning', onClick }) {
  const dotColor = {
    critical: 'bg-red-500',
    warning: 'bg-amber-500',
    info: 'bg-lynx-sky',
  }[severity] || 'bg-amber-500'

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 py-1.5 text-left hover:bg-white/[0.04] rounded-lg transition-colors px-1.5 group"
    >
      <div className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
      <span className="text-sm text-slate-300 flex-1 truncate">{label}</span>
      {count > 0 && (
        <span className="text-xs font-bold text-white bg-white/[0.08] px-2 py-0.5 rounded-md tabular-nums">{count}</span>
      )}
      <ChevronRight className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </button>
  )
}

const MAX_VISIBLE_ITEMS = 5

export default function OrgHealthHero({
  orgName = 'Organization',
  healthScore = 0,
  kpis = {},
  urgentItems = [],
  onNavigate,
}) {
  const visibleItems = urgentItems.slice(0, MAX_VISIBLE_ITEMS)
  const hiddenCount = urgentItems.length - visibleItems.length

  return (
    <div className="relative rounded-2xl overflow-hidden h-full" style={{ background: 'linear-gradient(135deg, #0B1628 0%, #122240 50%, #0B1628 100%)' }}>
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
        style={{ background: 'radial-gradient(ellipse at 30% 40%, rgba(75,185,236,0.08) 0%, transparent 60%)' }}
      />

      <div className="relative z-10 p-4 flex flex-col h-full gap-3">
        {/* ── Org Name — centered, bright, large ── */}
        <h2 className="text-lg font-extrabold text-white text-center uppercase tracking-wide">
          {orgName}
        </h2>

        {/* ── Ring + Needs Attention Row ── */}
        <div className="flex items-start gap-4 flex-1 min-h-0">
          {/* Health Ring */}
          <div className="flex items-center justify-center pt-1">
            <HealthRing score={healthScore} size={130} />
          </div>

          {/* Needs Attention Items */}
          <div className="flex-1 min-w-0">
            {urgentItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                <p className="text-emerald-400 text-sm font-bold">All systems go</p>
                <p className="text-slate-500 text-xs mt-0.5">Nothing needs attention.</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {visibleItems.map((item, idx) => (
                  <UrgentItem
                    key={idx}
                    label={item.label}
                    count={item.count}
                    severity={item.severity}
                    onClick={() => onNavigate?.(item.page)}
                  />
                ))}
                {hiddenCount > 0 && (
                  <button
                    onClick={() => onNavigate?.('reports')}
                    className="text-xs text-lynx-sky font-bold hover:underline px-1.5 pt-1"
                  >
                    View All ({urgentItems.length}) →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── KPI Grid — 2 rows × 4 cols ── */}
        <div className="grid grid-cols-4 gap-1.5">
          <KpiCell icon={Shield} label="Teams" value={kpis.teams || 0} />
          <KpiCell icon={Users} label="Players" value={kpis.players || 0} />
          <KpiCell icon={DollarSign} label="Collected" value={`$${((kpis.revenueCollected || 0) / 1000).toFixed(1)}k`} />
          <KpiCell icon={FileText} label="Waivers" value={`${kpis.waiverPct || 0}%`} />
          <KpiCell icon={Calendar} label="Events" value={kpis.eventsMonth || 0} />
          <KpiCell icon={UserCheck} label="Coaches" value={kpis.coaches || 0} />
          <KpiCell icon={DollarSign} label="Outstand." value={`$${((kpis.outstanding || 0) / 1000).toFixed(1)}k`} />
          <KpiCell icon={AlertCircle} label="Overdue" value={kpis.overduePayments || 0} />
        </div>
      </div>
    </div>
  )
}
