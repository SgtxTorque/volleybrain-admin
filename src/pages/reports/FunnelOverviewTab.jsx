import { useTheme } from '../../contexts/ThemeContext'
import {
  Users, DollarSign, Clock,
  CheckCircle2, XCircle, ArrowRight, AlertTriangle
} from '../../constants/icons'

// ============================================
// FUNNEL OVERVIEW TAB
// ============================================
export default function FunnelOverviewTab({ metrics, funnelStages, maxFunnel, hasFunnelTable, formatTime }) {
  const { isDark } = useTheme()
  const cardCls = isDark
    ? 'bg-white/[0.03] border border-white/[0.06]'
    : 'bg-white border border-[#E8ECF2]'

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
        {[
          { label: 'Total Registered', value: metrics.totalRegistrations, icon: Users, color: '#6366f1' },
          { label: 'Pending Review', value: metrics.pending, icon: Clock, color: '#f59e0b' },
          { label: 'Approved', value: metrics.approved, icon: CheckCircle2, color: '#10b981' },
          { label: 'Denied / Withdrawn', value: metrics.denied, icon: XCircle, color: '#ef4444' },
          { label: 'Fully Paid', value: metrics.paid, icon: DollarSign, color: '#06b6d4' },
          { label: 'Avg Approval Time', value: formatTime(metrics.avgApprovalTime), icon: Clock, color: '#8b5cf6', raw: true },
        ].map((m) => (
          <div key={m.label} className={`${cardCls} rounded-[14px] p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${m.color}20` }}>
                <m.icon className="w-4 h-4" style={{ color: m.color }} />
              </div>
            </div>
            <p className={`text-r-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{m.raw ? m.value : m.value.toLocaleString()}</p>
            <p className="text-[10px] font-bold tracking-wider mt-1 text-slate-400">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Funnel Visualization */}
      <div className={`${cardCls} rounded-[14px] p-6`}>
        <h2 className={`text-sm font-extrabold mb-1 ${isDark ? 'text-white' : 'text-[#10284C]'}`} style={{ fontFamily: 'var(--v2-font)' }}>CONVERSION FUNNEL</h2>
        <p className="text-r-xs mb-6 text-slate-400">
          {hasFunnelTable ? 'Full funnel tracking active' : 'Based on existing registration and payment data. Run the SQL migration to enable full page view tracking.'}
        </p>

        <div className="space-y-3">
          {funnelStages.map((stage, i) => {
            const pct = maxFunnel > 0 ? (stage.count / maxFunnel) * 100 : 0
            const prevCount = i > 0 ? funnelStages[i - 1].count : null
            const dropoff = prevCount && prevCount > 0 ? Math.round(((prevCount - stage.count) / prevCount) * 100) : null
            const convRate = prevCount && prevCount > 0 ? Math.round((stage.count / prevCount) * 100) : null

            return (
              <div key={stage.label}>
                {/* Drop-off indicator between stages */}
                {dropoff !== null && dropoff > 0 && (
                  <div className="flex items-center gap-2 ml-8 mb-1">
                    <ArrowRight className="w-3 h-3" style={{ color: dropoff > 50 ? '#ef4444' : dropoff > 25 ? '#f59e0b' : '#10b981' }} />
                    <span className="text-[11px] font-bold" style={{ color: dropoff > 50 ? '#ef4444' : dropoff > 25 ? '#f59e0b' : '#10b981' }}>
                      {convRate}% conversion / {dropoff}% drop-off
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${stage.color}20` }}>
                    <stage.icon className="w-4 h-4" style={{ color: stage.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-r-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{stage.label}</span>
                      <span className="text-r-sm font-bold tabular-nums" style={{ color: stage.color }}>{stage.count.toLocaleString()}</span>
                    </div>
                    <div className={`w-full h-8 rounded-lg overflow-hidden ${isDark ? 'bg-white/[0.04]' : 'bg-slate-50'}`}>
                      <div
                        className="h-full rounded-lg fnl-bar"
                        style={{ '--target-w': `${Math.max(pct, 2)}%`, width: `${Math.max(pct, 2)}%`, background: `linear-gradient(90deg, ${stage.color}, ${stage.color}99)`, animationDelay: `${i * .1 + .2}s` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Overall conversion rate */}
        {metrics.totalRegistrations > 0 && (
          <div className={`mt-6 pt-4 flex items-center justify-between ${isDark ? 'border-t border-white/[0.06]' : 'border-t border-slate-200'}`}>
            <span className="text-r-sm font-bold text-slate-400">Overall Conversion (Submitted to Paid)</span>
            <span className="text-r-lg font-bold text-lynx-navy">
              {metrics.submitted > 0 ? Math.round((metrics.paid / metrics.submitted) * 100) : 0}%
            </span>
          </div>
        )}
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className={`${cardCls} rounded-[14px] p-5`}>
          <p className="text-[10px] font-bold tracking-wider text-slate-400">TOTAL EXPECTED</p>
          <p className={`text-r-2xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>${metrics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className={`${cardCls} rounded-[14px] p-5`}>
          <p className="text-[10px] font-bold tracking-wider text-slate-400">COLLECTED</p>
          <p className="text-r-2xl font-extrabold mt-1 text-emerald-500">${metrics.collectedRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className={`${cardCls} rounded-[14px] p-5`}>
          <p className="text-[10px] font-bold tracking-wider text-slate-400">COLLECTION RATE</p>
          <p className="text-r-2xl font-extrabold mt-1 text-lynx-navy">
            {metrics.totalRevenue > 0 ? Math.round((metrics.collectedRevenue / metrics.totalRevenue) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Funnel table hint */}
      {!hasFunnelTable && (
        <div className={`p-4 rounded-[14px] flex items-start gap-3 ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-500" />
          <div>
            <p className={`text-r-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Enable Full Funnel Tracking</p>
            <p className="text-r-xs mt-1 text-slate-400">
              Run the <code className={`px-1.5 py-0.5 rounded text-r-xs ${isDark ? 'bg-white/[0.04]' : 'bg-slate-50'}`}>registration_funnel_events</code> SQL migration in Supabase to track page views, form starts, and step completions. Without it, the funnel shows submitted to approved to paid only.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
