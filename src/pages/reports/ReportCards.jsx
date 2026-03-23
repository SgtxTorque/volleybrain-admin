import { Star, ChevronDown, ChevronUp, Search } from '../../constants/icons'

// ============================================
// REPORT CARDS - Sub-components for ReportsPage
// Column Picker, Filter Bar, Data Table, Export Menu, Preset Modal
// ============================================

const cardCls = (isDark) =>
  `${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'} rounded-[14px]`

const inputCls = (isDark) =>
  `px-4 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:border-[#4BB9EC] focus:ring-2 focus:ring-[#4BB9EC]/10 ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-white' : 'bg-white border-[#E8ECF2] text-[#10284C]'}`

// ---- Category Tab Bar ----
export function CategoryTabBar({
  reportCategories, activeCategory, activeReport, openDropdown, setOpenDropdown,
  setActiveCategory, setActiveReport, setFilters, setSortField,
  savedPresets, loadPreset, deletePreset, setShowPresetModal, isDark
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {Object.entries(reportCategories).map(([catId, cat]) => (
        <div key={catId} className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === catId ? null : catId)}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 ${
              activeCategory === catId
                ? 'bg-[#4BB9EC]/15 text-[#4BB9EC]'
                : `${isDark ? 'bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.08]' : 'bg-white border border-[#E8ECF2] text-[#10284C] hover:bg-[#F5F6F8]'}`
            }`}
            style={{ fontFamily: 'var(--v2-font)' }}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
            <ChevronDown className="w-3 h-3 opacity-50" />
          </button>
          {openDropdown === catId && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
              <div className={`absolute left-0 top-full mt-2 w-72 z-50 overflow-hidden shadow-2xl rounded-[14px] border ${isDark ? 'bg-[#0B1D35] border-white/[0.08]' : 'bg-white border-[#E8ECF2]'}`}>
                {cat.reports.map(report => (
                  <button
                    key={report.id}
                    onClick={() => {
                      setActiveCategory(catId)
                      setActiveReport(report.id)
                      setOpenDropdown(null)
                      setFilters({ team: 'all', status: 'all', dateFrom: '', dateTo: '', search: '' })
                      setSortField('')
                    }}
                    className={`w-full text-left px-4 py-3 transition flex items-center gap-3 ${
                      activeReport === report.id
                        ? 'bg-[#4BB9EC]/10'
                        : isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-[#F5F6F8]'
                    }`}
                  >
                    <span className="text-xl">{report.icon}</span>
                    <div className="flex-1">
                      <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-[#10284C]'}`} style={{ fontFamily: 'var(--v2-font)' }}>{report.label}</p>
                      <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{report.description}</p>
                    </div>
                    {activeReport === report.id && <span className="text-[#4BB9EC]">&#10003;</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      ))}

      {/* Presets Button */}
      <div className="relative ml-auto">
        <button
          onClick={() => setOpenDropdown(openDropdown === 'presets' ? null : 'presets')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 ${isDark ? 'bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.08]' : 'bg-white border border-[#E8ECF2] text-[#10284C] hover:bg-[#F5F6F8]'}`}
        >
          <Star className="w-4 h-4 text-yellow-400" />
          <span>Saved</span>
          {savedPresets.length > 0 && (
            <span className="px-1.5 py-0.5 text-xs font-bold rounded-full bg-[#10284C] text-white">
              {savedPresets.length}
            </span>
          )}
        </button>
        {openDropdown === 'presets' && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
            <div className={`absolute right-0 top-full mt-2 w-72 z-50 overflow-hidden shadow-2xl rounded-[14px] border ${isDark ? 'bg-[#0B1D35] border-white/[0.08]' : 'bg-white border-[#E8ECF2]'}`}>
              <div className={`px-4 py-3 border-b ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'}`}>
                <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-[#10284C]'}`} style={{ fontFamily: 'var(--v2-font)' }}>Saved Report Presets</p>
              </div>
              {savedPresets.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-r-sm text-slate-400">No saved presets yet</p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {savedPresets.map(preset => (
                    <div
                      key={preset.id}
                      className={`px-4 py-3 flex items-center justify-between transition ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'}`}
                    >
                      <button
                        onClick={() => { loadPreset(preset); setOpenDropdown(null) }}
                        className="flex-1 text-left"
                      >
                        <p className={`font-bold text-r-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{preset.name}</p>
                        <p className="text-r-xs text-slate-400">
                          {reportCategories[preset.category]?.reports.find(r => r.id === preset.report)?.label}
                        </p>
                      </button>
                      <button onClick={() => deletePreset(preset.id)} className="p-1 rounded text-red-400 hover:text-red-500 text-r-sm">
                        &#128465;
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className={`px-4 py-3 border-t ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'}`}>
                <button
                  onClick={() => { setShowPresetModal(true); setOpenDropdown(null) }}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#10284C] text-white font-bold text-sm hover:brightness-110 transition"
                >
                  + Save Current View
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ---- Column Picker ----
export function ColumnPicker({ allColumns, visibleColumns, setVisibleColumns, isDark }) {
  return (
    <div className={`p-4 mb-4 ${cardCls(isDark)}`}>
      <div className="flex items-center justify-between mb-3">
        <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-[#10284C]'}`} style={{ fontFamily: 'var(--v2-font)' }}>Customize Columns</p>
        <button
          onClick={() => {
            const dv = {}
            allColumns.forEach(c => { dv[c.id] = c.defaultVisible !== false })
            setVisibleColumns(dv)
          }}
          className="text-sm font-bold text-[#4BB9EC]"
        >
          Reset to Default
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {allColumns.map(col => (
          <label
            key={col.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition text-sm font-medium ${
              visibleColumns[col.id]
                ? 'bg-[#4BB9EC]/15 text-[#4BB9EC]'
                : `${isDark ? 'bg-white/[0.04] border border-white/[0.08]' : 'bg-[#F5F6F8] border border-[#E8ECF2]'} text-slate-400`
            }`}
          >
            <input
              type="checkbox"
              checked={visibleColumns[col.id] || false}
              onChange={e => setVisibleColumns({ ...visibleColumns, [col.id]: e.target.checked })}
              className="sr-only"
            />
            <span>{visibleColumns[col.id] ? '\u2713' : '\u25CB'}</span>
            <span>{col.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

// ---- Filter Bar ----
export function FilterBar({
  filters, setFilters, activeReport, teams, statusOptions, isDark
}) {
  const ic = inputCls(isDark)
  return (
    <div className={`p-4 mb-4 ${cardCls(isDark)}`}>
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-r-xs font-bold tracking-wider mb-1 text-slate-400">SEARCH</label>
          <input
            type="text"
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
            placeholder="Search..."
            className={`w-full ${ic}`}
          />
        </div>
        {['players', 'jerseys', 'schedule'].includes(activeReport) && teams.length > 0 && (
          <div className="min-w-[160px]">
            <label className="block text-r-xs font-bold tracking-wider mb-1 text-slate-400">TEAM</label>
            <select
              value={filters.team}
              onChange={e => setFilters({ ...filters, team: e.target.value })}
              className={`w-full ${ic}`}
            >
              <option value="all">All Teams</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        )}
        {statusOptions.length > 0 && (
          <div className="min-w-[140px]">
            <label className="block text-r-xs font-bold tracking-wider mb-1 text-slate-400">STATUS</label>
            <select
              value={filters.status}
              onChange={e => setFilters({ ...filters, status: e.target.value })}
              className={`w-full ${ic}`}
            >
              {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        )}
        {activeReport === 'financial' && (
          <>
            <div className="min-w-[140px]">
              <label className="block text-r-xs font-bold tracking-wider mb-1 text-slate-400">FROM DATE</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={e => setFilters({ ...filters, dateFrom: e.target.value })}
                className={`w-full ${ic}`}
              />
            </div>
            <div className="min-w-[140px]">
              <label className="block text-r-xs font-bold tracking-wider mb-1 text-slate-400">TO DATE</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={e => setFilters({ ...filters, dateTo: e.target.value })}
                className={`w-full ${ic}`}
              />
            </div>
          </>
        )}
        <div className="flex items-end">
          <button
            onClick={() => setFilters({ team: 'all', status: 'all', dateFrom: '', dateTo: '', search: '' })}
            className={`px-4 py-2 rounded-lg text-r-sm font-bold ${cardCls(isDark)} text-slate-400`}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}

// ---- Data Table ----
export function ReportDataTable({
  loading, data, sortedData, columns, sortField, sortDir,
  handleSort, formatValue, isDark, organization, selectedSeason
}) {
  if (loading) {
    return (
      <div className={`flex-1 flex items-center justify-center ${cardCls(isDark)} overflow-hidden`}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-lynx-sky border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-3 text-r-sm text-slate-400">Loading report...</p>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={`flex-1 flex items-center justify-center ${cardCls(isDark)} overflow-hidden`}>
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
            <span className="text-2xl">&#128235;</span>
          </div>
          <p className={`font-bold mt-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>No data found</p>
          <p className="text-r-sm mt-1 text-slate-400">Try adjusting your filters or selecting a different season</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex-1 overflow-hidden flex flex-col min-h-0 ${cardCls(isDark)}`}>
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className={`sticky top-0 ${isDark ? 'bg-[#0B1D35]/95' : 'bg-[#F5F6F8]/95'}`} style={{ backdropFilter: 'blur(8px)' }}>
            <tr>
              {columns.map(col => (
                <th
                  key={col.id}
                  onClick={() => col.sortable && handleSort(col.id)}
                  className={`px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest whitespace-nowrap text-slate-400 ${
                    col.sortable ? 'cursor-pointer hover:text-[#4BB9EC]' : ''
                  }`}
                >
                  {col.label}
                  {col.sortable && sortField === col.id && (
                    <span className="ml-1">{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, i) => (
              <tr
                key={row.id || i}
                className={`transition ${i % 2 === 1 ? (isDark ? 'bg-white/[0.02]' : 'bg-slate-50/50') : ''} ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'}`}
                style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,.04)' : '1px solid rgba(0,0,0,.04)' }}
              >
                {columns.map(col => (
                  <td key={col.id} className={`px-4 py-3 text-r-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {renderCellValue(row, col, formatValue, isDark)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Footer */}
      <div className={`px-4 py-3 flex items-center justify-between flex-shrink-0 border-t ${isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-[#E8ECF2] bg-[#F5F6F8]'}`}>
        <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Showing {sortedData.length} records, {columns.length} columns
        </p>
        <p className={`text-xs ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
          {organization?.name} / {selectedSeason?.name}
        </p>
      </div>
    </div>
  )
}

function renderCellValue(row, col, formatValue, isDark) {
  if (col.id === 'team_name' && row.team_color) {
    return (
      <span className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: row.team_color }} />
        {row[col.id]}
      </span>
    )
  }

  if (['payment_status', 'status', 'reg_status', 'roster_status', 'bg_check_status', 'display_type'].includes(col.id)) {
    const val = row[col.id]
    const isGreen = ['Paid', 'active', 'approved', 'Ready', 'cleared', 'Active', 'Game'].includes(val)
    const isRed = ['Unpaid', 'denied', 'Need Players', 'failed'].includes(val)
    return (
      <span
        className="px-2.5 py-1 rounded-full text-r-xs font-bold"
        style={{
          background: isGreen
            ? (isDark ? 'rgba(16,185,129,.15)' : 'rgba(16,185,129,.1)')
            : isRed
              ? (isDark ? 'rgba(239,68,68,.15)' : 'rgba(239,68,68,.1)')
              : (isDark ? 'rgba(245,158,11,.15)' : 'rgba(245,158,11,.1)'),
          color: isGreen ? '#10b981' : isRed ? '#ef4444' : '#f59e0b'
        }}
      >
        {val}
      </span>
    )
  }

  if (col.id === 'roster_fill') {
    const pct = row[col.id]
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 h-2 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(pct, 100)}%`,
              background: pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'
            }}
          />
        </div>
        <span>{pct}%</span>
      </div>
    )
  }

  if (col.id === 'value' && row.format) {
    return formatValue(row[col.id], row.format)
  }

  return formatValue(row[col.id], col.format)
}

// ---- Export Menu ----
export function ExportMenu({
  showExportMenu, setShowExportMenu, exporting,
  exportCSV, exportPDF, printReport, emailReport, isDark
}) {
  if (!showExportMenu) return null
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
      <div className={`absolute right-0 top-full mt-2 w-48 z-50 overflow-hidden shadow-2xl rounded-[14px] border ${isDark ? 'bg-[#0B1D35] border-white/[0.08]' : 'bg-white border-[#E8ECF2]'}`}>
        {[
          { id: 'csv', label: 'Download CSV', icon: '\uD83D\uDCCA', action: exportCSV },
          { id: 'pdf', label: 'Download PDF', icon: '\uD83D\uDCC4', action: exportPDF },
          { id: 'print', label: 'Print', icon: '\uD83D\uDDA8\uFE0F', action: printReport },
          { id: 'email', label: 'Email', icon: '\uD83D\uDCE7', action: emailReport },
        ].map(opt => (
          <button
            key={opt.id}
            onClick={opt.action}
            disabled={exporting}
            className={`w-full text-left px-4 py-2.5 flex items-center gap-2 text-sm font-medium transition ${isDark ? 'text-white hover:bg-white/[0.04]' : 'text-[#10284C] hover:bg-[#F5F6F8]'}`}
          >
            <span>{opt.icon}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
    </>
  )
}

// ---- Column Definitions ----
export function getAvailableColumns(activeReport) {
  switch (activeReport) {
    case 'players': return [
      { id: 'full_name', label: 'Player Name', sortable: true, defaultVisible: true },
      { id: 'team_name', label: 'Team', sortable: true, defaultVisible: true },
      { id: 'grade', label: 'Grade', sortable: true, defaultVisible: true },
      { id: 'position', label: 'Position', sortable: true, defaultVisible: true },
      { id: 'jersey_number', label: 'Jersey #', sortable: true, defaultVisible: true },
      { id: 'parent_name', label: 'Parent Name', sortable: true, defaultVisible: true },
      { id: 'parent_email', label: 'Parent Email', sortable: false, defaultVisible: true },
      { id: 'parent_phone', label: 'Parent Phone', sortable: false, defaultVisible: true },
      { id: 'parent_phone_secondary', label: 'Secondary Phone', sortable: false, defaultVisible: false },
      { id: 'email', label: 'Player Email', sortable: false, defaultVisible: false },
      { id: 'phone', label: 'Player Phone', sortable: false, defaultVisible: false },
      { id: 'status', label: 'Status', sortable: true, defaultVisible: true },
      { id: 'age', label: 'Age', sortable: true, defaultVisible: false },
      { id: 'date_of_birth', label: 'DOB', sortable: true, defaultVisible: false, format: 'date' },
      { id: 'school', label: 'School', sortable: true, defaultVisible: false },
      { id: 'uniform_size_jersey', label: 'Jersey Size', sortable: true, defaultVisible: false },
      { id: 'created_at', label: 'Added', sortable: true, defaultVisible: false, format: 'date' },
    ]
    case 'teams': return [
      { id: 'name', label: 'Team Name', sortable: true, defaultVisible: true },
      { id: 'age_group', label: 'Age Group', sortable: true, defaultVisible: true },
      { id: 'team_type', label: 'Type', sortable: true, defaultVisible: true },
      { id: 'gender', label: 'Gender', sortable: true, defaultVisible: false },
      { id: 'skill_level', label: 'Skill Level', sortable: true, defaultVisible: false },
      { id: 'player_count', label: 'Players', sortable: true, defaultVisible: true },
      { id: 'max_roster_size', label: 'Max Size', sortable: true, defaultVisible: true },
      { id: 'roster_fill', label: 'Fill %', sortable: true, defaultVisible: false, format: 'percent' },
      { id: 'head_coach', label: 'Head Coach', sortable: true, defaultVisible: true },
      { id: 'coaches_list', label: 'All Coaches', sortable: false, defaultVisible: false },
      { id: 'roster_status', label: 'Status', sortable: true, defaultVisible: true },
    ]
    case 'payments': return [
      { id: 'full_name', label: 'Player', sortable: true, defaultVisible: true },
      { id: 'parent_name', label: 'Parent', sortable: true, defaultVisible: true },
      { id: 'parent_email', label: 'Email', sortable: false, defaultVisible: false },
      { id: 'total_due', label: 'Total Due', sortable: true, defaultVisible: true, format: 'currency' },
      { id: 'total_paid', label: 'Paid', sortable: true, defaultVisible: true, format: 'currency' },
      { id: 'balance', label: 'Balance', sortable: true, defaultVisible: true, format: 'currency' },
      { id: 'payment_status', label: 'Status', sortable: true, defaultVisible: true },
      { id: 'payment_count', label: '# Payments', sortable: true, defaultVisible: false },
      { id: 'last_payment', label: 'Last Payment', sortable: true, defaultVisible: true, format: 'date' },
    ]
    case 'outstanding': return [
      { id: 'full_name', label: 'Player', sortable: true, defaultVisible: true },
      { id: 'parent_name', label: 'Parent', sortable: true, defaultVisible: true },
      { id: 'parent_email', label: 'Email', sortable: false, defaultVisible: true },
      { id: 'parent_phone', label: 'Phone', sortable: false, defaultVisible: true },
      { id: 'balance', label: 'Balance Due', sortable: true, defaultVisible: true, format: 'currency' },
      { id: 'unpaid_items', label: 'Unpaid Items', sortable: false, defaultVisible: true },
      { id: 'days_outstanding', label: 'Days Outstanding', sortable: true, defaultVisible: true },
    ]
    case 'schedule': return [
      { id: 'title', label: 'Event', sortable: true, defaultVisible: true },
      { id: 'display_type', label: 'Type', sortable: true, defaultVisible: true },
      { id: 'team_name', label: 'Team', sortable: true, defaultVisible: true },
      { id: 'display_date', label: 'Date', sortable: true, defaultVisible: true, format: 'date' },
      { id: 'display_time', label: 'Time', sortable: true, defaultVisible: true },
      { id: 'location', label: 'Location', sortable: true, defaultVisible: true },
    ]
    case 'registrations': return [
      { id: 'full_name', label: 'Player', sortable: true, defaultVisible: true },
      { id: 'parent_name', label: 'Parent', sortable: true, defaultVisible: true },
      { id: 'parent_email', label: 'Email', sortable: false, defaultVisible: true },
      { id: 'parent_phone', label: 'Phone', sortable: false, defaultVisible: false },
      { id: 'registration_type', label: 'Type', sortable: true, defaultVisible: true },
      { id: 'reg_status', label: 'Status', sortable: true, defaultVisible: true },
      { id: 'submitted_at', label: 'Submitted', sortable: true, defaultVisible: true, format: 'date' },
      { id: 'approved_at', label: 'Approved', sortable: true, defaultVisible: false, format: 'date' },
    ]
    case 'financial': return [
      { id: 'player_name', label: 'Player', sortable: true, defaultVisible: true },
      { id: 'description', label: 'Description', sortable: true, defaultVisible: true },
      { id: 'amount', label: 'Amount', sortable: true, defaultVisible: true, format: 'currency' },
      { id: 'status', label: 'Status', sortable: true, defaultVisible: true },
      { id: 'payment_method', label: 'Method', sortable: true, defaultVisible: true },
      { id: 'paid_at', label: 'Paid Date', sortable: true, defaultVisible: true, format: 'date' },
      { id: 'created_at', label: 'Created', sortable: true, defaultVisible: false, format: 'date' },
    ]
    case 'jerseys': return [
      { id: 'jersey_number', label: 'Jersey #', sortable: true, defaultVisible: true },
      { id: 'full_name', label: 'Player', sortable: true, defaultVisible: true },
      { id: 'team_name', label: 'Team', sortable: true, defaultVisible: true },
      { id: 'uniform_size_jersey', label: 'Size', sortable: true, defaultVisible: true },
    ]
    case 'coaches': return [
      { id: 'full_name', label: 'Coach', sortable: true, defaultVisible: true },
      { id: 'role', label: 'Role', sortable: true, defaultVisible: true },
      { id: 'email', label: 'Email', sortable: false, defaultVisible: true },
      { id: 'teams_list', label: 'Teams (This Season)', sortable: false, defaultVisible: true },
      { id: 'team_count', label: '# Teams', sortable: true, defaultVisible: true },
    ]
    case 'emergency': return [
      { id: 'full_name', label: 'Player', sortable: true, defaultVisible: true },
      { id: 'team_name', label: 'Team', sortable: true, defaultVisible: true },
      { id: 'parent_name', label: 'Parent', sortable: true, defaultVisible: true },
      { id: 'parent_phone', label: 'Parent Phone', sortable: false, defaultVisible: true },
      { id: 'emergency_contact_name', label: 'Emergency Contact', sortable: true, defaultVisible: true },
      { id: 'emergency_contact_phone', label: 'Emergency Phone', sortable: false, defaultVisible: true },
      { id: 'emergency_contact_relationship', label: 'Relationship', sortable: true, defaultVisible: true },
      { id: 'medical_notes', label: 'Medical Notes', sortable: false, defaultVisible: false },
      { id: 'allergies', label: 'Allergies', sortable: false, defaultVisible: false },
    ]
    case 'season_summary': return [
      { id: 'metric', label: 'Metric', sortable: true, defaultVisible: true },
      { id: 'value', label: 'Value', sortable: true, defaultVisible: true },
      { id: 'category', label: 'Category', sortable: true, defaultVisible: true },
    ]
    default: return []
  }
}

// ---- Format Value ----
export function formatValue(value, format) {
  if (value == null) return '-'
  switch (format) {
    case 'currency': return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    case 'percent': return `${value}%`
    case 'date': return value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'
    default: return value
  }
}

// ---- Save Preset Modal ----
export function SavePresetModal({ showPresetModal, setShowPresetModal, presetName, setPresetName, savePreset, isDark }) {
  if (!showPresetModal) return null
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(8px)' }}
      onClick={() => { setShowPresetModal(false); setPresetName('') }}
    >
      <div
        className={`w-full max-w-md p-6 rounded-[14px] border ${isDark ? 'bg-[#0B1D35] border-white/[0.08]' : 'bg-white border-[#E8ECF2]'}`}
        onClick={e => e.stopPropagation()}
      >
        <h3 className={`text-lg font-extrabold mb-2 ${isDark ? 'text-white' : 'text-[#10284C]'}`} style={{ fontFamily: 'var(--v2-font)' }}>Save Report Preset</h3>
        <p className={`text-sm mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Save your current view (report type, visible columns, filters) as a preset for quick access later.
        </p>
        <input
          type="text"
          value={presetName}
          onChange={e => setPresetName(e.target.value)}
          placeholder="Preset name (e.g., 'Contact List for Coaches')"
          className={`w-full mb-4 ${inputCls(isDark)}`}
          autoFocus
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={() => { setShowPresetModal(false); setPresetName('') }}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold ${isDark ? 'bg-white/[0.06] text-white hover:bg-white/[0.1] border border-white/[0.1]' : 'bg-[#F5F6F8] text-[#10284C] hover:bg-[#E8ECF2] border border-[#E8ECF2]'}`}
          >
            Cancel
          </button>
          <button
            onClick={savePreset}
            disabled={!presetName.trim()}
            className="px-5 py-2.5 rounded-xl bg-[#10284C] text-white font-bold text-sm disabled:opacity-50 hover:brightness-110 transition"
          >
            Save Preset
          </button>
        </div>
      </div>
    </div>
  )
}
