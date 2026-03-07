import { useState, useMemo } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { Search } from '../../constants/icons'

// ============================================
// PIPELINE TAB - Registration pipeline table
// ============================================
const pipeStatusColors = {
  pending:    { bg: 'rgba(245,158,11,.15)', text: '#f59e0b' },
  approved:   { bg: 'rgba(16,185,129,.15)', text: '#10b981' },
  paid:       { bg: 'rgba(6,182,212,.15)',  text: '#06b6d4' },
  partial:    { bg: 'rgba(139,92,246,.15)', text: '#8b5cf6' },
  unpaid:     { bg: 'rgba(239,68,68,.15)',  text: '#ef4444' },
  denied:     { bg: 'rgba(239,68,68,.15)',  text: '#ef4444' },
  waitlisted: { bg: 'rgba(245,158,11,.15)', text: '#f59e0b' },
  manual:     { bg: 'rgba(100,116,139,.12)', text: '#94a3b8' },
  unknown:    { bg: 'rgba(100,116,139,.12)', text: '#94a3b8' },
}

export default function PipelineTab({ metrics, organization, selectedSeason }) {
  const { isDark } = useTheme()
  const cardCls = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-slate-200'
  const inputCls = isDark
    ? 'bg-white/[0.04] border border-white/[0.06] text-white placeholder-slate-500'
    : 'bg-white border border-slate-200 text-slate-700 placeholder-slate-400'

  const [pipelineFilter, setPipelineFilter] = useState('all')
  const [pipelineSearch, setPipelineSearch] = useState('')
  const [pipelineSort, setPipelineSort] = useState({ field: 'submitted_at', dir: 'desc' })

  const filteredPipeline = useMemo(() => {
    let rows = [...metrics.pipeline]
    if (pipelineFilter !== 'all') rows = rows.filter(r => r.pipe_status === pipelineFilter)
    if (pipelineSearch) {
      const s = pipelineSearch.toLowerCase()
      rows = rows.filter(r => r.name.toLowerCase().includes(s) || r.parent_name.toLowerCase().includes(s) || r.parent_email.toLowerCase().includes(s))
    }
    rows.sort((a, b) => {
      const av = a[pipelineSort.field], bv = b[pipelineSort.field]
      if (av == null) return 1; if (bv == null) return -1
      return (av < bv ? -1 : 1) * (pipelineSort.dir === 'asc' ? 1 : -1)
    })
    return rows
  }, [metrics.pipeline, pipelineFilter, pipelineSearch, pipelineSort])

  const handlePipelineSort = (field) => {
    if (pipelineSort.field === field) setPipelineSort({ field, dir: pipelineSort.dir === 'asc' ? 'desc' : 'asc' })
    else setPipelineSort({ field, dir: 'asc' })
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={pipelineSearch} onChange={e => setPipelineSearch(e.target.value)} placeholder="Search by name or email..."
              className={`w-full pl-10 pr-4 py-2.5 text-r-sm rounded-lg outline-none focus:ring-1 focus:ring-lynx-sky/30 ${inputCls}`} />
          </div>
        </div>
        <div>
          <select value={pipelineFilter} onChange={e => setPipelineFilter(e.target.value)}
            className={`px-3 py-2.5 text-r-sm rounded-lg outline-none focus:ring-1 focus:ring-lynx-sky/30 ${inputCls}`}>
            <option value="all">All Status ({metrics.pipeline.length})</option>
            <option value="pending">Pending ({metrics.pipeline.filter(r => r.pipe_status === 'pending').length})</option>
            <option value="approved">Approved ({metrics.pipeline.filter(r => r.pipe_status === 'approved').length})</option>
            <option value="unpaid">Unpaid ({metrics.pipeline.filter(r => r.pipe_status === 'unpaid').length})</option>
            <option value="partial">Partial ({metrics.pipeline.filter(r => r.pipe_status === 'partial').length})</option>
            <option value="paid">Paid ({metrics.pipeline.filter(r => r.pipe_status === 'paid').length})</option>
            <option value="denied">Denied ({metrics.pipeline.filter(r => r.pipe_status === 'denied').length})</option>
            <option value="manual">Manual ({metrics.pipeline.filter(r => r.pipe_status === 'manual').length})</option>
          </select>
        </div>
      </div>

      {/* Pipeline status summary bar */}
      {metrics.pipeline.length > 0 && (
        <div className={`${cardCls} rounded-[14px] p-4`}>
          <div className={`flex items-center gap-1 h-4 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.04]' : 'bg-slate-50'}`}>
            {['paid', 'partial', 'approved', 'unpaid', 'pending', 'denied'].map(status => {
              const count = metrics.pipeline.filter(r => r.pipe_status === status).length
              const pct = (count / metrics.pipeline.length) * 100
              if (pct === 0) return null
              return <div key={status} className="h-full" style={{ width: `${pct}%`, background: pipeStatusColors[status]?.text }} title={`${status}: ${count}`} />
            })}
          </div>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            {['paid', 'partial', 'approved', 'unpaid', 'pending', 'denied'].map(status => {
              const count = metrics.pipeline.filter(r => r.pipe_status === status).length
              if (count === 0) return null
              return (
                <button key={status} onClick={() => setPipelineFilter(pipelineFilter === status ? 'all' : status)}
                  className="flex items-center gap-1.5 text-r-xs font-bold" style={{ color: pipeStatusColors[status]?.text, opacity: pipelineFilter === 'all' || pipelineFilter === status ? 1 : .4 }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: pipeStatusColors[status]?.text }} />
                  {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Table */}
      <div className={`${cardCls} rounded-[14px] overflow-hidden`}>
        {filteredPipeline.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <p className={`font-bold text-r-lg mt-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>No registrations found</p>
            <p className="text-r-sm mt-1 text-slate-400">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 380px)' }}>
            <table className="w-full">
              <thead className={`sticky top-0 ${isDark ? 'bg-lynx-charcoal/95' : 'bg-slate-50/95'}`} style={{ backdropFilter: 'blur(8px)' }}>
                <tr>
                  {[
                    { id: 'name', label: 'Player' },
                    { id: 'parent_name', label: 'Parent' },
                    { id: 'parent_email', label: 'Email' },
                    { id: 'submitted_at', label: 'Submitted' },
                    { id: 'pipe_status', label: 'Status' },
                    { id: 'total_due', label: 'Due' },
                    { id: 'total_paid', label: 'Paid' },
                    { id: 'balance', label: 'Balance' },
                  ].map(col => (
                    <th key={col.id} onClick={() => handlePipelineSort(col.id)}
                      className="px-4 py-3 text-left text-[10px] font-bold tracking-wider cursor-pointer whitespace-nowrap text-slate-400">
                      {col.label}{pipelineSort.field === col.id && <span className="ml-1">{pipelineSort.dir === 'asc' ? '↑' : '↓'}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPipeline.map((row) => (
                  <tr key={row.id} className={`transition ${isDark ? 'hover:bg-white/[0.02] border-b border-white/[0.04]' : 'hover:bg-slate-50 border-b border-slate-100'}`}>
                    <td className={`px-4 py-3 text-r-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{row.name}</td>
                    <td className={`px-4 py-3 text-r-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{row.parent_name}</td>
                    <td className="px-4 py-3 text-r-sm text-slate-400">{row.parent_email}</td>
                    <td className={`px-4 py-3 text-r-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {row.submitted_at ? new Date(row.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold"
                        style={{ background: pipeStatusColors[row.pipe_status]?.bg, color: pipeStatusColors[row.pipe_status]?.text }}>
                        {row.pipe_status}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-r-sm tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>{row.total_due > 0 ? `$${row.total_due.toFixed(2)}` : '-'}</td>
                    <td className="px-4 py-3 text-r-sm tabular-nums text-emerald-500">{row.total_paid > 0 ? `$${row.total_paid.toFixed(2)}` : '-'}</td>
                    <td className={`px-4 py-3 text-r-sm font-bold tabular-nums ${row.balance > 0 ? 'text-red-500' : 'text-slate-400'}`}>{row.balance > 0 ? `$${row.balance.toFixed(2)}` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className={`px-4 py-3 flex items-center justify-between ${isDark ? 'border-t border-white/[0.06] bg-white/[0.02]' : 'border-t border-slate-200 bg-slate-50'}`}>
          <p className="text-r-sm text-slate-400">Showing {filteredPipeline.length} of {metrics.pipeline.length} registrations</p>
          <p className="text-r-xs text-slate-400">{organization?.name} / {selectedSeason?.name}</p>
        </div>
      </div>
    </div>
  )
}
