import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  Download, Shield, Clock, RefreshCw, AlertTriangle, FileText,
  ChevronDown, Check,
} from '../../constants/icons'
import PageShell from '../../components/pages/PageShell'
import {
  buildCSV, buildJSON, triggerDownload, EXPORT_CATEGORIES,
} from './dataExportHelpers'
import {
  exportPlayers, exportCoaches, exportPayments,
  exportSeasons, exportTeams, exportRegistrations, exportEvents,
} from './dataExportFunctions'

// =============================================================================
// DATA EXPORT PAGE -- Org Backup & CSV/JSON Export
// =============================================================================

function DataExportPage({ showToast }) {
  const { profile, organization, isPlatformAdmin } = useAuth()
  const { isDark } = useTheme()
  const tc = useThemeClasses()

  // Platform admin org selector
  const [allOrgs, setAllOrgs] = useState([])
  const [selectedOrgId, setSelectedOrgId] = useState(organization?.id || null)
  const [selectedOrg, setSelectedOrg] = useState(organization || null)
  const [showOrgSelector, setShowOrgSelector] = useState(false)

  // Filters
  const [seasons, setSeasons] = useState([])
  const [selectedSeasonId, setSelectedSeasonId] = useState('all')
  const [exportFormat, setExportFormat] = useState('csv')

  // State
  const [rowCounts, setRowCounts] = useState({})
  const [exporting, setExporting] = useState({})
  const [lastExports, setLastExports] = useState({})
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState({ active: false, category: '', step: '', percent: 0 })

  const activeOrg = isPlatformAdmin ? selectedOrg : organization
  const orgSlug = activeOrg?.slug || activeOrg?.name?.replace(/\s+/g, '-').toLowerCase() || 'org'

  // ======= ACCESS GATE =======
  const hasAccess = useMemo(() => {
    if (isPlatformAdmin) return true
    if (!profile || !organization) return false
    return true // admin role check is done in MainApp route gating
  }, [isPlatformAdmin, profile, organization])

  // ======= LOAD ORGS FOR PLATFORM ADMIN =======
  useEffect(() => {
    if (!isPlatformAdmin) return
    async function loadOrgs() {
      const { data } = await supabase
        .from('organizations')
        .select('id, name, slug, is_active')
        .eq('is_active', true)
        .order('name')
      if (data) setAllOrgs(data)
    }
    loadOrgs()
  }, [isPlatformAdmin])

  useEffect(() => {
    if (isPlatformAdmin && selectedOrgId) {
      const org = allOrgs.find((o) => o.id === selectedOrgId) || organization
      setSelectedOrg(org)
    }
  }, [selectedOrgId, allOrgs, isPlatformAdmin, organization])

  // ======= LOAD SEASONS + ROW COUNTS =======
  useEffect(() => {
    if (!activeOrg?.id) return
    loadMetadata()
  }, [activeOrg?.id])

  async function loadMetadata() {
    setLoading(true)
    try {
      const orgId = activeOrg.id

      // Load seasons
      const { data: seasonData } = await supabase
        .from('seasons')
        .select('id, name, status, start_date, end_date')
        .eq('organization_id', orgId)
        .order('start_date', { ascending: false })
      setSeasons(seasonData || [])

      // Get season IDs for this org
      const seasonIds = (seasonData || []).map((s) => s.id)
      if (seasonIds.length === 0) {
        setRowCounts({
          players: 0, coaches: 0, payments: 0,
          seasons: (seasonData || []).length, teams: 0,
          registrations: 0, events: 0,
        })
        setLoading(false)
        return
      }

      // Count rows in parallel
      const [players, coaches, payments, teams, registrations, events] =
        await Promise.all([
          supabase.from('players').select('id', { count: 'exact', head: true }).in('season_id', seasonIds),
          supabase.from('coaches').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
          supabase.from('payments').select('id', { count: 'exact', head: true }).in('season_id', seasonIds),
          supabase.from('teams').select('id', { count: 'exact', head: true }).in('season_id', seasonIds),
          supabase.from('registrations').select('id', { count: 'exact', head: true }).in(
            'player_id',
            (await supabase.from('players').select('id').in('season_id', seasonIds)).data?.map((p) => p.id) || []
          ),
          supabase.from('schedule_events').select('id', { count: 'exact', head: true }).in('season_id', seasonIds),
        ])

      setRowCounts({
        players: players.count || 0,
        coaches: coaches.count || 0,
        payments: payments.count || 0,
        seasons: (seasonData || []).length,
        teams: teams.count || 0,
        registrations: registrations.count || 0,
        events: events.count || 0,
      })
    } catch (err) {
      console.error('Error loading metadata:', err)
    }
    setLoading(false)
  }

  // ======= SEASON IDs FOR FILTER =======
  const getSeasonIds = useCallback(async () => {
    if (!activeOrg?.id) return []
    if (selectedSeasonId !== 'all') return [selectedSeasonId]
    const { data } = await supabase
      .from('seasons')
      .select('id')
      .eq('organization_id', activeOrg.id)
    return (data || []).map((s) => s.id)
  }, [activeOrg?.id, selectedSeasonId])

  // ======= EXPORT DISPATCHER =======
  const exportFunctions = {
    players: () => exportPlayers(activeOrg, getSeasonIds),
    coaches: () => exportCoaches(activeOrg, getSeasonIds, selectedSeasonId),
    payments: () => exportPayments(activeOrg, getSeasonIds),
    seasons: () => exportSeasons(activeOrg, getSeasonIds, selectedSeasonId),
    teams: () => exportTeams(activeOrg, getSeasonIds),
    registrations: () => exportRegistrations(activeOrg, getSeasonIds),
    events: () => exportEvents(activeOrg, getSeasonIds),
  }

  async function handleExport(categoryId) {
    if (!activeOrg) return
    setExporting((prev) => ({ ...prev, [categoryId]: true }))

    try {
      if (categoryId === 'full-backup') {
        await handleFullBackup()
        return
      }

      const exportFn = exportFunctions[categoryId]
      if (!exportFn) return

      const { headers, rows, data } = await exportFn()

      if ((!rows || rows.length === 0) && (!data || data.length === 0)) {
        showToast('No data found for this export', 'warning')
        setExporting((prev) => ({ ...prev, [categoryId]: false }))
        return
      }

      const dateStr = new Date().toISOString().split('T')[0]
      const seasonSuffix =
        selectedSeasonId !== 'all'
          ? `_${seasons.find((s) => s.id === selectedSeasonId)?.name?.replace(/\s+/g, '-') || 'season'}`
          : ''

      if (exportFormat === 'csv') {
        const csv = buildCSV(headers, rows)
        triggerDownload(csv, `lynx_${orgSlug}_${categoryId}${seasonSuffix}_${dateStr}.csv`, 'csv')
      } else {
        const json = buildJSON(data, categoryId)
        triggerDownload(json, `lynx_${orgSlug}_${categoryId}${seasonSuffix}_${dateStr}.json`, 'json')
      }

      setLastExports((prev) => ({ ...prev, [categoryId]: new Date().toISOString() }))
      showToast(
        `${EXPORT_CATEGORIES.find((c) => c.id === categoryId)?.label} exported successfully`,
        'success'
      )
    } catch (err) {
      console.error('Export error:', err)
      showToast('Export failed: ' + err.message, 'error')
    }
    setExporting((prev) => ({ ...prev, [categoryId]: false }))
  }

  async function handleFullBackup() {
    const categories = ['players', 'coaches', 'payments', 'seasons', 'teams', 'registrations', 'events']
    const dateStr = new Date().toISOString().split('T')[0]
    const seasonSuffix =
      selectedSeasonId !== 'all'
        ? `_${seasons.find((s) => s.id === selectedSeasonId)?.name?.replace(/\s+/g, '-') || 'season'}`
        : ''

    setProgress({ active: true, category: 'full-backup', step: 'Starting...', percent: 0 })

    try {
      if (exportFormat === 'json') {
        // JSON: single file with all data
        const backup = {
          exportType: 'full-backup',
          organization: activeOrg?.name,
          exportedAt: new Date().toISOString(),
          data: {},
        }
        for (let i = 0; i < categories.length; i++) {
          const cat = categories[i]
          const label = EXPORT_CATEGORIES.find((c) => c.id === cat)?.label || cat
          setProgress({
            active: true, category: 'full-backup',
            step: `Exporting ${label}...`,
            percent: Math.round((i / categories.length) * 100),
          })
          const { data } = await exportFunctions[cat]()
          backup.data[cat] = data || []
        }
        setProgress({ active: true, category: 'full-backup', step: 'Building file...', percent: 95 })
        const json = JSON.stringify(backup, null, 2)
        triggerDownload(json, `lynx_${orgSlug}_full-backup${seasonSuffix}_${dateStr}.json`, 'json')
      } else {
        // CSV: export each table as separate download
        for (let i = 0; i < categories.length; i++) {
          const cat = categories[i]
          const label = EXPORT_CATEGORIES.find((c) => c.id === cat)?.label || cat
          setProgress({
            active: true, category: 'full-backup',
            step: `Exporting ${label}...`,
            percent: Math.round((i / categories.length) * 100),
          })
          const { headers, rows } = await exportFunctions[cat]()
          if (rows && rows.length > 0) {
            const csv = buildCSV(headers, rows)
            triggerDownload(csv, `lynx_${orgSlug}_${cat}${seasonSuffix}_${dateStr}.csv`, 'csv')
            // Small delay between downloads so browser doesn't block them
            await new Promise((r) => setTimeout(r, 500))
          }
        }
      }

      setProgress({ active: true, category: 'full-backup', step: 'Complete!', percent: 100 })
      setLastExports((prev) => ({ ...prev, 'full-backup': new Date().toISOString() }))
      showToast('Full backup exported successfully', 'success')
    } catch (err) {
      console.error('Full backup error:', err)
      showToast('Backup failed: ' + err.message, 'error')
    }

    setTimeout(() => setProgress({ active: false, category: '', step: '', percent: 0 }), 2000)
    setExporting((prev) => ({ ...prev, 'full-backup': false }))
  }

  // ======= COUNT FOR CATEGORY =======
  function getCount(catId) {
    if (catId === 'full-backup') {
      return Object.values(rowCounts).reduce((a, b) => a + b, 0)
    }
    return rowCounts[catId] ?? '...'
  }

  // ======= ACCESS GATE RENDER =======
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'} border rounded-[14px] p-8 text-center max-w-md`}>
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className={`text-xl font-bold ${tc.text} mb-2`}>Access Denied</h2>
          <p className={tc.textMuted}>
            Only organization admins and platform super-admins can access data exports.
          </p>
        </div>
      </div>
    )
  }

  // ======= RENDER =======
  return (
    <PageShell
      title="Data Export"
      subtitle="Download your organization's data as CSV or JSON"
      breadcrumb="Setup > Data Export"
      actions={
        <button
          onClick={loadMetadata}
          disabled={loading}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition ${
            isDark ? 'bg-white/[0.06] border border-white/[0.1] text-white hover:bg-white/[0.1]' : 'bg-[#F5F6F8] border border-[#E8ECF2] text-[#10284C] hover:bg-[#E8ECF2]'
          }`}
          style={{ fontFamily: 'var(--v2-font)' }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Counts
        </button>
      }
    >
      <div className="space-y-6">
        {/* Navy Header */}
        <div className="bg-[#10284C] rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-white" style={{ fontFamily: 'var(--v2-font)' }}>
                Data Export
              </h2>
              <p className="text-sm text-white/50">Download your organization's data as CSV or JSON</p>
            </div>
            <div className="text-right">
              <span className="text-4xl font-black italic text-[#4BB9EC]">
                {loading ? '...' : Object.values(rowCounts).reduce((a, b) => a + b, 0).toLocaleString()}
              </span>
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Total Records</div>
            </div>
          </div>
        </div>

        {/* PLATFORM ADMIN ORG SELECTOR */}
        {isPlatformAdmin && (
          <div className={`rounded-[14px] p-4 ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'}`}>
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-lynx-sky" />
              <span className={`text-sm ${tc.text}`}>Platform Admin - Export for:</span>
              <div className="relative flex-1 max-w-xs">
                <button
                  onClick={() => setShowOrgSelector(!showOrgSelector)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm transition ${
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200'
                  }`}
                >
                  <span className="truncate">{selectedOrg?.name || 'Select organization...'}</span>
                  <ChevronDown className="w-4 h-4 shrink-0" />
                </button>
                {showOrgSelector && (
                  <div
                    className={`absolute top-full left-0 right-0 mt-1 rounded-xl border shadow-xl max-h-60 overflow-y-auto z-50 ${
                      isDark ? 'bg-slate-800 border-white/10' : 'bg-white border-slate-200'
                    }`}
                  >
                    {allOrgs.map((org) => (
                      <button
                        key={org.id}
                        onClick={() => {
                          setSelectedOrgId(org.id)
                          setShowOrgSelector(false)
                        }}
                        className={`w-full text-left px-3 py-2 text-sm transition flex items-center gap-2 ${
                          org.id === selectedOrgId
                            ? isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-900'
                            : isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        {org.id === selectedOrgId && (
                          <Check className="w-3 h-3 shrink-0 text-lynx-sky" />
                        )}
                        <span className="truncate">{org.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* FILTERS */}
        <div className={`rounded-[14px] p-4 ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'}`}>
          <div className="flex flex-wrap items-center gap-4">
            {/* Season Filter */}
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`} style={{ fontFamily: 'var(--v2-font)' }}>Season</span>
              <select
                value={selectedSeasonId}
                onChange={(e) => setSelectedSeasonId(e.target.value)}
                className={`px-3 py-2 rounded-xl text-sm font-medium border transition ${
                  isDark
                    ? 'bg-white/[0.04] border-white/[0.08] text-white'
                    : 'bg-white border-[#E8ECF2] text-[#10284C]'
                } focus:border-[#4BB9EC] focus:ring-2 focus:ring-[#4BB9EC]/10`}
              >
                <option value="all">All Seasons</option>
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.status !== 'active' ? `(${s.status})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Format Selector - V2 Pill Style */}
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`} style={{ fontFamily: 'var(--v2-font)' }}>Format</span>
              <div className={`flex items-center gap-1 rounded-xl p-1 ${isDark ? 'bg-white/[0.04] border border-white/[0.06]' : 'border border-[#E8ECF2]'}`}>
                {['csv', 'json'].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setExportFormat(fmt)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-bold transition ${
                      exportFormat === fmt
                        ? 'bg-[#4BB9EC]/15 text-[#4BB9EC]'
                        : isDark ? 'text-slate-500 hover:bg-white/[0.06]' : 'text-slate-400 hover:bg-[#F5F6F8]'
                    }`}
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className={`ml-auto flex items-center gap-2 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              <FileText className="w-3.5 h-3.5" />
              <span>Data scoped to {activeOrg?.name || 'your organization'}</span>
            </div>
          </div>
        </div>

        {/* PROGRESS BAR */}
        {progress.active && (
          <div className={`rounded-[14px] p-4 ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'}`}>
            <div className="flex items-center gap-3 mb-2">
              <RefreshCw className="w-4 h-4 animate-spin text-lynx-sky" />
              <span className={`text-sm ${tc.text}`}>{progress.step}</span>
              <span className={`ml-auto text-sm ${tc.textMuted}`}>{progress.percent}%</span>
            </div>
            <div className={`w-full h-2 rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
              <div
                className="h-full rounded-full transition-all duration-500 bg-lynx-sky"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )}

        {/* EXPORT CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {EXPORT_CATEGORIES.map((cat) => {
            const IconComp = cat.icon
            const count = getCount(cat.id)
            const isExporting = exporting[cat.id]
            const lastExport = lastExports[cat.id]
            const isFullBackup = cat.id === 'full-backup'

            return (
              <div key={cat.id} className={isFullBackup ? 'md:col-span-2' : ''}>
                <div
                  className={`rounded-[14px] border p-5 hover:shadow-md transition group ${
                    isFullBackup ? 'border-2' : ''
                  } ${isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-white border-[#E8ECF2]'}`}
                  style={isFullBackup ? { borderColor: `${cat.color}30` } : {}}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${cat.color}15` }}
                    >
                      <IconComp className="w-5 h-5" style={{ color: cat.color }} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`text-base ${tc.text}`}>{cat.label}</h3>
                        {isFullBackup && (
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px]"
                            style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                          >
                            ALL DATA
                          </span>
                        )}
                      </div>
                      <p className={`text-xs ${tc.textMuted} mb-3`}>{cat.description}</p>

                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Row count */}
                        <span className={`text-xs ${tc.textMuted}`}>
                          {loading ? (
                            <span className="animate-pulse">Counting...</span>
                          ) : (
                            `${typeof count === 'number' ? count.toLocaleString() : count} rows`
                          )}
                        </span>

                        {/* Last export */}
                        {lastExport && (
                          <span className={`text-[10px] ${tc.textMuted} flex items-center gap-1`}>
                            <Clock className="w-3 h-3" />
                            Last:{' '}
                            {new Date(lastExport).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Export Button */}
                    <button
                      onClick={() => handleExport(cat.id)}
                      disabled={isExporting || loading || (count === 0 && !isFullBackup)}
                      className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all ${
                        isExporting
                          ? 'opacity-60 cursor-not-allowed'
                          : count === 0 && !isFullBackup
                            ? 'opacity-30 cursor-not-allowed'
                            : 'hover:scale-[1.02] active:scale-[0.98]'
                      }`}
                      style={{
                        backgroundColor:
                          isExporting || (count === 0 && !isFullBackup)
                            ? isDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.05)'
                            : `${cat.color}15`,
                        color:
                          isExporting || (count === 0 && !isFullBackup)
                            ? isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.3)'
                            : cat.color,
                        borderWidth: 1,
                        borderColor:
                          isExporting || (count === 0 && !isFullBackup)
                            ? 'transparent'
                            : `${cat.color}30`,
                      }}
                    >
                      {isExporting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Export {exportFormat.toUpperCase()}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* FOOTER INFO */}
        <div
          className={`flex items-start gap-3 rounded-[14px] p-4 ${
            isDark
              ? 'bg-amber-500/5 border border-amber-500/10'
              : 'bg-amber-50 border border-amber-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className={`text-xs ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
              Data Privacy Notice
            </p>
            <p className={`text-xs mt-1 ${isDark ? 'text-amber-300/70' : 'text-amber-600'}`}>
              Exported data may contain sensitive personal information including names, emails,
              phone numbers, and medical notes. Handle downloaded files securely and in compliance
              with your organization's data policies.
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  )
}

export { DataExportPage }
