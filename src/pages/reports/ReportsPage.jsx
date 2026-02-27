import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useSport } from '../../contexts/SportContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { 
  Users, DollarSign, Calendar, BarChart3, Download, Filter, Settings,
  ChevronDown, ChevronUp, Search, FileText, PieChart, Check, X, Star
} from '../../constants/icons'

// ═══════════════════════════════════════════════════════════
// REPORTS PAGE — 2026 Glass Redesign
// Fixed: team_coaches, schedule_events, coaches→profiles, Star import
// Added: Schedule Summary, Season Summary reports
// ═══════════════════════════════════════════════════════════

const RPT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Rajdhani:wght@400;500;600;700&display=swap');
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes scaleIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
  .rpt-au{animation:fadeUp .4s ease-out both}
  .rpt-ai{animation:fadeIn .3s ease-out both}
  .rpt-as{animation:scaleIn .25s ease-out both}
  .rpt-display{font-family:'Bebas Neue',sans-serif;letter-spacing:.05em}
  .rpt-heading{font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:.04em}
  .rpt-glass{background:rgba(255,255,255,.03);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.08)}
  .rpt-glass-solid{background:rgba(255,255,255,.05);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,.08)}
  .rpt-nos::-webkit-scrollbar{display:none}.rpt-nos{-ms-overflow-style:none;scrollbar-width:none}
  .rpt-light .rpt-glass{background:rgba(255,255,255,.65);border-color:rgba(0,0,0,.06);box-shadow:0 4px 24px rgba(0,0,0,.06)}
  .rpt-light .rpt-glass-solid{background:rgba(255,255,255,.72);border-color:rgba(0,0,0,.06)}
`

function ReportsPage({ showToast }) {
  const tc = useThemeClasses()
  const { isDark, accent } = useTheme()
  const { selectedSeason: globalSeason } = useSeason()
  const { selectedSport: globalSport } = useSport()
  const { organization, user, profile } = useAuth()
  
  const [seasons, setSeasons] = useState([])
  const [sports, setSports] = useState([])
  const [selectedSeasonId, setSelectedSeasonId] = useState(null)
  const [selectedSportId, setSelectedSportId] = useState('all')
  const [activeCategory, setActiveCategory] = useState('people')
  const [activeReport, setActiveReport] = useState('players')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [stats, setStats] = useState({})
  const [filters, setFilters] = useState({ team: 'all', status: 'all', dateFrom: '', dateTo: '', search: '' })
  const [showFilters, setShowFilters] = useState(false)
  const [sortField, setSortField] = useState('')
  const [sortDir, setSortDir] = useState('asc')
  const [showColumnPicker, setShowColumnPicker] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState({})
  const [columnOrder, setColumnOrder] = useState([])
  const [savedPresets, setSavedPresets] = useState([])
  const [showPresetModal, setShowPresetModal] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [teams, setTeams] = useState([])
  const [openDropdown, setOpenDropdown] = useState(null)

  const reportCategories = {
    people: {
      label: 'People', icon: '👥',
      reports: [
        { id: 'players', label: 'Player Roster', icon: '🏐', description: 'All players with contact info' },
        { id: 'teams', label: 'Team Composition', icon: '⚡', description: 'Teams with roster counts' },
        { id: 'coaches', label: 'Coach Directory', icon: '🧑‍🏫', description: 'All coaches and assignments' },
        { id: 'emergency', label: 'Emergency Contacts', icon: '🚨', description: 'Emergency contact list' },
        { id: 'jerseys', label: 'Jersey Assignment', icon: '👕', description: 'Jersey numbers and sizes' },
      ]
    },
    financial: {
      label: 'Financial', icon: '💰',
      reports: [
        { id: 'payments', label: 'Payment Summary', icon: '💳', description: 'Payment status by player' },
        { id: 'financial', label: 'Financial Overview', icon: '📊', description: 'Revenue and collections' },
        { id: 'outstanding', label: 'Outstanding Balances', icon: '⚠️', description: 'Unpaid balances' },
      ]
    },
    operations: {
      label: 'Operations', icon: '📋',
      reports: [
        { id: 'schedule', label: 'Schedule Summary', icon: '📅', description: 'Events by type and team' },
        { id: 'registrations', label: 'Registration Report', icon: '📝', description: 'Registration pipeline' },
        { id: 'season_summary', label: 'Season Summary', icon: '🏆', description: 'High-level season overview' },
      ]
    },
  }

  // ═══════ LIFECYCLE ═══════
  useEffect(() => { loadSeasonsAndSports(); loadSavedPresets() }, [organization?.id])
  useEffect(() => { if (globalSeason?.id && !selectedSeasonId) setSelectedSeasonId(globalSeason.id) }, [globalSeason?.id])
  useEffect(() => { if (globalSport?.id && selectedSportId === 'all') setSelectedSportId(globalSport.id) }, [globalSport?.id])
  useEffect(() => { if (selectedSeasonId) loadTeams() }, [selectedSeasonId])
  useEffect(() => { if (selectedSeasonId) loadReportData() }, [selectedSeasonId, selectedSportId, activeReport, filters])
  useEffect(() => {
    const cols = getAvailableColumns()
    const dv = {}, order = []
    cols.forEach(col => { dv[col.id] = col.defaultVisible !== false; order.push(col.id) })
    setVisibleColumns(dv); setColumnOrder(order)
  }, [activeReport])

  // ═══════ INFRASTRUCTURE ═══════
  async function loadSeasonsAndSports() {
    if (!organization?.id) return
    const { data: sd } = await supabase.from('seasons').select('id, name, status, start_date, sport_id').eq('organization_id', organization.id).order('start_date', { ascending: false })
    setSeasons(sd || [])
    const { data: sp } = await supabase.from('sports').select('id, name, icon').eq('organization_id', organization.id).order('name')
    setSports(sp || [])
  }
  async function loadTeams() {
    const { data } = await supabase.from('teams').select('id, name, color').eq('season_id', selectedSeasonId).order('name')
    setTeams(data || [])
  }
  function loadSavedPresets() {
    const saved = localStorage.getItem(`vb_report_presets_${organization?.id}`)
    if (saved) setSavedPresets(JSON.parse(saved))
  }
  function savePreset() {
    if (!presetName.trim()) return
    const preset = { id: Date.now(), name: presetName, category: activeCategory, report: activeReport, visibleColumns: { ...visibleColumns }, columnOrder: [...columnOrder], filters: { ...filters }, createdAt: new Date().toISOString() }
    const updated = [...savedPresets, preset]
    setSavedPresets(updated); localStorage.setItem(`vb_report_presets_${organization?.id}`, JSON.stringify(updated))
    setPresetName(''); setShowPresetModal(false); showToast('Report preset saved!', 'success')
  }
  function loadPreset(preset) {
    setActiveCategory(preset.category); setActiveReport(preset.report)
    setVisibleColumns(preset.visibleColumns); setColumnOrder(preset.columnOrder)
    setFilters(preset.filters); showToast(`Loaded preset: ${preset.name}`, 'success')
  }
  function deletePreset(presetId) {
    const updated = savedPresets.filter(p => p.id !== presetId)
    setSavedPresets(updated); localStorage.setItem(`vb_report_presets_${organization?.id}`, JSON.stringify(updated))
    showToast('Preset deleted', 'success')
  }
  async function loadReportData() {
    setLoading(true)
    try {
      switch (activeReport) {
        case 'players': await loadPlayersReport(); break
        case 'teams': await loadTeamsReport(); break
        case 'payments': await loadPaymentsReport(); break
        case 'outstanding': await loadOutstandingReport(); break
        case 'schedule': await loadScheduleReport(); break
        case 'registrations': await loadRegistrationsReport(); break
        case 'financial': await loadFinancialReport(); break
        case 'jerseys': await loadJerseysReport(); break
        case 'coaches': await loadCoachesReport(); break
        case 'emergency': await loadEmergencyReport(); break
        case 'season_summary': await loadSeasonSummaryReport(); break
      }
    } catch (err) { console.error('Error loading report:', err); showToast?.('Error loading report', 'error') }
    setLoading(false)
  }
  const getSelectedSeason = () => seasons.find(s => s.id === selectedSeasonId)

  // ═══════ REPORT LOADERS ═══════

  async function loadPlayersReport() {
    const { data, error } = await supabase.from('players')
      .select('id, first_name, last_name, email, phone, grade, position, jersey_number, uniform_size_jersey, status, photo_url, parent_name, parent_email, parent_phone, parent_phone_secondary, date_of_birth, school, medical_notes, allergies, created_at, updated_at')
      .eq('season_id', selectedSeasonId).order('last_name')
    if (error) { console.error('Players query error:', error); setData([]); return }
    const { data: ta } = await supabase.from('team_players').select('player_id, teams (id, name, color)').in('player_id', (data || []).map(p => p.id))
    const teamMap = {}
    ;(ta || []).forEach(t => { if (!teamMap[t.player_id]) teamMap[t.player_id] = []; if (t.teams) teamMap[t.player_id].push(t.teams) })
    const transformed = (data || []).map(p => ({
      ...p, full_name: `${p.first_name} ${p.last_name}`,
      team_name: teamMap[p.id]?.[0]?.name || 'Unassigned', team_color: teamMap[p.id]?.[0]?.color || '#666',
      teams_list: teamMap[p.id]?.map(t => t.name).join(', ') || 'Unassigned',
      age: p.date_of_birth ? Math.floor((new Date() - new Date(p.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000)) : null
    }))
    let filtered = transformed
    if (filters.team !== 'all') filtered = filtered.filter(p => teamMap[p.id]?.some(t => t.id === filters.team))
    if (filters.status !== 'all') filtered = filtered.filter(p => p.status === filters.status)
    if (filters.search) { const s = filters.search.toLowerCase(); filtered = filtered.filter(p => p.full_name.toLowerCase().includes(s) || p.parent_name?.toLowerCase().includes(s) || p.parent_email?.toLowerCase().includes(s)) }
    setData(filtered)
    setStats({ total: filtered.length, active: filtered.filter(p => p.status === 'active').length, unassigned: filtered.filter(p => p.team_name === 'Unassigned').length, missingContact: filtered.filter(p => !p.parent_email && !p.parent_phone).length, labels: ['Total Players', 'Active', 'Unassigned', 'Missing Contact'] })
  }

  async function loadTeamsReport() {
    const { data, error } = await supabase.from('teams').select('id, name, color, age_group, team_type, skill_level, gender, max_roster_size, min_roster_size, roster_open, created_at, description').eq('season_id', selectedSeasonId).order('name')
    if (error) { setData([]); return }
    const { data: pc } = await supabase.from('team_players').select('team_id').in('team_id', (data || []).map(t => t.id))
    // FIXED: team_coaches instead of coach_assignments
    const { data: ca } = await supabase.from('team_coaches').select('team_id, coach_id, role').in('team_id', (data || []).map(t => t.id))
    const coachIds = [...new Set((ca || []).map(c => c.coach_id).filter(Boolean))]
    let coachNames = {}
    if (coachIds.length > 0) {
      const { data: coaches } = await supabase.from('coaches').select('id, profile_id, profiles:profile_id(full_name)').in('id', coachIds)
      ;(coaches || []).forEach(c => { coachNames[c.id] = c.profiles?.full_name || 'Unknown' })
    }
    const countMap = {}; (pc || []).forEach(p => { countMap[p.team_id] = (countMap[p.team_id] || 0) + 1 })
    const coachMap = {}; (ca || []).forEach(a => { if (!coachMap[a.team_id]) coachMap[a.team_id] = []; coachMap[a.team_id].push({ name: coachNames[a.coach_id] || 'Unknown', role: a.role }) })
    const transformed = (data || []).map(t => ({
      ...t, player_count: countMap[t.id] || 0, coach_count: coachMap[t.id]?.length || 0,
      head_coach: coachMap[t.id]?.find(c => c.role === 'head_coach')?.name || coachMap[t.id]?.[0]?.name || '-',
      coaches_list: coachMap[t.id]?.map(c => c.name).join(', ') || 'None',
      roster_status: (countMap[t.id] || 0) >= (t.min_roster_size || 6) ? 'Ready' : 'Need Players',
      roster_fill: t.max_roster_size ? Math.round(((countMap[t.id] || 0) / t.max_roster_size) * 100) : 0
    }))
    setData(transformed)
    setStats({ total: transformed.length, ready: transformed.filter(t => t.roster_status === 'Ready').length, needPlayers: transformed.filter(t => t.roster_status === 'Need Players').length, totalPlayers: transformed.reduce((s, t) => s + t.player_count, 0), labels: ['Total Teams', 'Ready', 'Need Players', 'Total Players'] })
  }

  async function loadPaymentsReport() {
    const { data: players } = await supabase.from('players').select('id, first_name, last_name, parent_name, parent_email').eq('season_id', selectedSeasonId).order('last_name')
    const { data: payments } = await supabase.from('payments').select('id, player_id, amount, paid, paid_at, payment_method, description').eq('season_id', selectedSeasonId)
    const pm = {}; (payments || []).forEach(p => { if (!pm[p.player_id]) pm[p.player_id] = []; pm[p.player_id].push(p) })
    const transformed = (players || []).map(p => {
      const pp = pm[p.id] || []; const totalDue = pp.reduce((s, x) => s + (x.amount || 0), 0)
      const totalPaid = pp.filter(x => x.paid).reduce((s, x) => s + (x.amount || 0), 0); const balance = totalDue - totalPaid
      return { ...p, full_name: `${p.first_name} ${p.last_name}`, total_due: totalDue, total_paid: totalPaid, balance,
        payment_status: totalDue === 0 ? 'No Fees' : balance === 0 ? 'Paid' : balance < totalDue ? 'Partial' : 'Unpaid',
        payment_count: pp.length, last_payment: pp.filter(x => x.paid).sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at))[0]?.paid_at || null }
    })
    let filtered = transformed
    if (filters.status === 'paid') filtered = filtered.filter(p => p.payment_status === 'Paid')
    else if (filters.status === 'unpaid') filtered = filtered.filter(p => p.payment_status === 'Unpaid')
    else if (filters.status === 'partial') filtered = filtered.filter(p => p.payment_status === 'Partial')
    if (filters.search) { const s = filters.search.toLowerCase(); filtered = filtered.filter(p => p.full_name.toLowerCase().includes(s)) }
    setData(filtered)
    const tr = transformed.reduce((s, p) => s + p.total_due, 0); const co = transformed.reduce((s, p) => s + p.total_paid, 0)
    setStats({ totalRevenue: tr, collected: co, outstanding: tr - co, collectionRate: tr > 0 ? Math.round((co / tr) * 100) : 0, labels: ['Total Due', 'Collected', 'Outstanding', 'Collection Rate'] })
  }

  async function loadOutstandingReport() {
    const { data: players } = await supabase.from('players').select('id, first_name, last_name, parent_name, parent_email, parent_phone').eq('season_id', selectedSeasonId)
    const { data: payments } = await supabase.from('payments').select('id, player_id, amount, paid, description, created_at').eq('season_id', selectedSeasonId)
    const pm = {}; (payments || []).forEach(p => { if (!pm[p.player_id]) pm[p.player_id] = []; pm[p.player_id].push(p) })
    const transformed = (players || []).map(p => {
      const pp = pm[p.id] || []; const totalDue = pp.reduce((s, x) => s + (x.amount || 0), 0)
      const totalPaid = pp.filter(x => x.paid).reduce((s, x) => s + (x.amount || 0), 0); const balance = totalDue - totalPaid
      const unpaid = pp.filter(x => !x.paid)
      return { ...p, full_name: `${p.first_name} ${p.last_name}`, total_due: totalDue, total_paid: totalPaid, balance,
        unpaid_items: unpaid.map(u => u.description).join(', ') || '-',
        days_outstanding: unpaid.length > 0 ? Math.floor((new Date() - new Date(Math.min(...unpaid.map(u => new Date(u.created_at))))) / (1000*60*60*24)) : 0 }
    }).filter(p => p.balance > 0)
    setData(transformed.sort((a, b) => b.balance - a.balance))
    const tot = transformed.reduce((s, p) => s + p.balance, 0); const cnt = transformed.length
    setStats({ totalOutstanding: tot, playerCount: cnt, avgBalance: cnt > 0 ? Math.round(tot / cnt) : 0, over30Days: transformed.filter(p => p.days_outstanding > 30).length, labels: ['Total Outstanding', 'Players with Balance', 'Avg Balance', 'Over 30 Days'] })
  }

  // FIXED: schedule_events with event_date/event_time columns
  async function loadScheduleReport() {
    const { data: events, error } = await supabase.from('schedule_events')
      .select('id, title, event_type, event_date, event_time, location, team_id, teams(name, color)')
      .eq('season_id', selectedSeasonId).order('event_date', { ascending: false }).limit(200)
    if (error) { console.error('Schedule error:', error); setData([]); setStats({ total: 0, games: 0, practices: 0, other: 0, labels: ['Total Events', 'Games', 'Practices', 'Other'] }); return }
    const transformed = (events || []).map(e => ({ ...e, team_name: e.teams?.name || 'All Teams', team_color: e.teams?.color || '#666',
      display_type: e.event_type === 'game' ? 'Game' : e.event_type === 'practice' ? 'Practice' : e.event_type || 'Event', display_date: e.event_date, display_time: e.event_time }))
    let filtered = transformed
    if (filters.team !== 'all') filtered = filtered.filter(e => e.team_id === filters.team)
    if (filters.status !== 'all') filtered = filtered.filter(e => e.event_type === filters.status)
    if (filters.search) { const s = filters.search.toLowerCase(); filtered = filtered.filter(e => (e.title||'').toLowerCase().includes(s) || (e.location||'').toLowerCase().includes(s)) }
    setData(filtered)
    setStats({ total: filtered.length, games: filtered.filter(e => e.event_type === 'game').length, practices: filtered.filter(e => e.event_type === 'practice').length, other: filtered.length - filtered.filter(e => e.event_type === 'game').length - filtered.filter(e => e.event_type === 'practice').length, labels: ['Total Events', 'Games', 'Practices', 'Other'] })
  }

  async function loadRegistrationsReport() {
    const { data: players } = await supabase.from('players').select('id, first_name, last_name, parent_name, parent_email, parent_phone, status, created_at').eq('season_id', selectedSeasonId).order('created_at', { ascending: false })
    let regMap = {}
    try {
      const { data: regs, error } = await supabase.from('registrations').select('id, player_id, status, submitted_at, approved_at, denied_at, deny_reason').in('player_id', (players || []).map(p => p.id))
      if (!error && regs) regs.forEach(r => { regMap[r.player_id] = r })
    } catch (e) { /* registrations table may not exist */ }
    const transformed = (players || []).map(p => {
      const reg = regMap[p.id]
      return { ...p, full_name: `${p.first_name} ${p.last_name}`, reg_status: reg?.status || p.status || 'manual',
        registration_type: reg ? 'Online' : 'Manual Entry', submitted_at: reg?.submitted_at || p.created_at, approved_at: reg?.approved_at }
    })
    let filtered = transformed
    if (filters.status !== 'all') filtered = filtered.filter(p => p.reg_status === filters.status)
    if (filters.search) { const s = filters.search.toLowerCase(); filtered = filtered.filter(p => p.full_name.toLowerCase().includes(s) || p.parent_name?.toLowerCase().includes(s)) }
    setData(filtered)
    setStats({ total: transformed.length, pending: transformed.filter(p => ['pending','submitted'].includes(p.reg_status)).length, approved: transformed.filter(p => ['approved','active'].includes(p.reg_status)).length, manual: transformed.filter(p => p.registration_type === 'Manual Entry').length, labels: ['Total', 'Pending', 'Approved', 'Manual Entry'] })
  }

  async function loadFinancialReport() {
    const { data: payments } = await supabase.from('payments').select('id, amount, paid, paid_at, payment_method, description, created_at, players (first_name, last_name)').eq('season_id', selectedSeasonId).order('created_at', { ascending: false })
    const transformed = (payments || []).map(p => ({ ...p, player_name: p.players ? `${p.players.first_name} ${p.players.last_name}` : 'Unknown', status: p.paid ? 'Paid' : 'Pending' }))
    let filtered = transformed
    if (filters.dateFrom) filtered = filtered.filter(p => new Date(p.created_at) >= new Date(filters.dateFrom))
    if (filters.dateTo) filtered = filtered.filter(p => new Date(p.created_at) <= new Date(filters.dateTo))
    if (filters.status === 'paid') filtered = filtered.filter(p => p.paid)
    else if (filters.status === 'unpaid') filtered = filtered.filter(p => !p.paid)
    setData(filtered)
    const te = transformed.reduce((s, p) => s + (p.amount || 0), 0); const co = transformed.filter(p => p.paid).reduce((s, p) => s + (p.amount || 0), 0)
    setStats({ totalExpected: te, collected: co, pending: te - co, transactionCount: transformed.length, labels: ['Expected Revenue', 'Collected', 'Pending', 'Transactions'] })
  }

  async function loadJerseysReport() {
    const { data: players } = await supabase.from('players').select('id, first_name, last_name, jersey_number, uniform_size_jersey').eq('season_id', selectedSeasonId).order('jersey_number', { nullsFirst: false })
    const { data: ta } = await supabase.from('team_players').select('player_id, teams (id, name, color)').in('player_id', (players || []).map(p => p.id))
    const teamMap = {}; (ta || []).forEach(t => { if (t.teams) teamMap[t.player_id] = t.teams })
    const transformed = (players || []).map(p => ({ ...p, full_name: `${p.first_name} ${p.last_name}`, team_name: teamMap[p.id]?.name || 'Unassigned', team_color: teamMap[p.id]?.color || '#666', has_jersey: !!p.jersey_number, has_size: !!p.uniform_size_jersey }))
    let filtered = transformed
    if (filters.team !== 'all') filtered = filtered.filter(p => teamMap[p.id]?.id === filters.team)
    setData(filtered)
    setStats({ total: filtered.length, assigned: filtered.filter(p => p.has_jersey).length, missingNumber: filtered.filter(p => !p.has_jersey).length, missingSize: filtered.filter(p => !p.has_size).length, labels: ['Total Players', 'Jersey Assigned', 'Missing Number', 'Missing Size'] })
  }

  // FIXED: coaches uses profile_id→profiles, team_coaches instead of coach_assignments
  async function loadCoachesReport() {
    const { data, error } = await supabase.from('coaches').select('id, profile_id, profiles:profile_id(full_name, email)').eq('organization_id', organization?.id)
    if (error) { console.error('Coaches error:', error); setData([]); setStats({ total: 0, assigned: 0, unassigned: 0, totalTeams: 0, labels: ['Total Coaches', 'Assigned', 'Unassigned', 'Teams Covered'] }); return }
    const coachIds = (data || []).map(c => c.id)
    let assignMap = {}
    if (coachIds.length > 0) {
      const { data: assignments } = await supabase.from('team_coaches').select('coach_id, team_id, role, teams (id, name, season_id)').in('coach_id', coachIds)
      ;(assignments || []).forEach(a => { if (!assignMap[a.coach_id]) assignMap[a.coach_id] = []; if (a.teams) assignMap[a.coach_id].push({ ...a.teams, role: a.role }) })
    }
    const transformed = (data || []).map(c => {
      const ct = assignMap[c.id] || []; const st = ct.filter(t => t.season_id === selectedSeasonId)
      return { ...c, full_name: c.profiles?.full_name || 'Unknown', email: c.profiles?.email || '-', team_count: st.length, teams_list: st.map(t => t.name).join(', ') || 'None', role: st[0]?.role || 'coach' }
    })
    setData(transformed)
    const total = transformed.length; const assigned = transformed.filter(c => c.team_count > 0).length
    setStats({ total, assigned, unassigned: total - assigned, totalTeams: [...new Set(transformed.flatMap(c => (assignMap[c.id] || []).filter(t => t.season_id === selectedSeasonId).map(t => t.id)))].length, labels: ['Total Coaches', 'Assigned', 'Unassigned', 'Teams Covered'] })
  }

  async function loadEmergencyReport() {
    const { data: players } = await supabase.from('players').select('id, first_name, last_name, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, parent_name, parent_phone, parent_email, medical_notes, allergies').eq('season_id', selectedSeasonId).order('last_name')
    const { data: ta } = await supabase.from('team_players').select('player_id, teams (name)').in('player_id', (players || []).map(p => p.id))
    const teamMap = {}; (ta || []).forEach(t => { if (t.teams) teamMap[t.player_id] = t.teams.name })
    const transformed = (players || []).map(p => ({ ...p, full_name: `${p.first_name} ${p.last_name}`, team_name: teamMap[p.id] || 'Unassigned', has_emergency: !!p.emergency_contact_name && !!p.emergency_contact_phone, has_medical: !!p.medical_notes || !!p.allergies }))
    setData(transformed)
    setStats({ total: transformed.length, complete: transformed.filter(p => p.has_emergency).length, missing: transformed.filter(p => !p.has_emergency).length, hasMedical: transformed.filter(p => p.has_medical).length, labels: ['Total Players', 'Complete Info', 'Missing Emergency', 'Has Medical Notes'] })
  }

  // NEW: Season Summary
  async function loadSeasonSummaryReport() {
    const { data: players } = await supabase.from('players').select('id, status').eq('season_id', selectedSeasonId)
    const { data: teamData } = await supabase.from('teams').select('id').eq('season_id', selectedSeasonId)
    const { data: payments } = await supabase.from('payments').select('amount, paid').eq('season_id', selectedSeasonId)
    const { data: events } = await supabase.from('schedule_events').select('id, event_type').eq('season_id', selectedSeasonId)
    const tp = (players||[]).length; const tt = (teamData||[]).length; const te = (events||[]).length
    const tr = (payments||[]).reduce((s,p) => s + (p.amount||0), 0); const co = (payments||[]).filter(p => p.paid).reduce((s,p) => s + (p.amount||0), 0)
    const cr = tr > 0 ? Math.round((co/tr)*100) : 0; const games = (events||[]).filter(e => e.event_type === 'game').length
    setData([
      { metric: 'Total Players', value: tp, category: 'People' },
      { metric: 'Active Players', value: (players||[]).filter(p => p.status === 'active').length, category: 'People' },
      { metric: 'Total Teams', value: tt, category: 'People' },
      { metric: 'Total Events', value: te, category: 'Operations' },
      { metric: 'Games Scheduled', value: games, category: 'Operations' },
      { metric: 'Practices Scheduled', value: (events||[]).filter(e => e.event_type === 'practice').length, category: 'Operations' },
      { metric: 'Total Revenue Expected', value: tr, category: 'Financial', format: 'currency' },
      { metric: 'Revenue Collected', value: co, category: 'Financial', format: 'currency' },
      { metric: 'Collection Rate', value: cr, category: 'Financial', format: 'percent' },
      { metric: 'Outstanding Balance', value: tr - co, category: 'Financial', format: 'currency' },
    ])
    setStats({ totalPlayers: tp, totalTeams: tt, totalEvents: te, collectionRate: cr, labels: ['Players', 'Teams', 'Events', 'Collection Rate'] })
  }

  // ═══════ COLUMNS ═══════
  const getAvailableColumns = () => {
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
  const getVisibleColumnsOrdered = () => {
    const available = getAvailableColumns()
    return columnOrder.filter(colId => visibleColumns[colId]).map(colId => available.find(c => c.id === colId)).filter(Boolean)
  }

  // ═══════ SORT + FORMAT ═══════
  const sortedData = [...data].sort((a, b) => {
    if (!sortField) return 0; const av = a[sortField], bv = b[sortField]
    if (av === bv) return 0; if (av == null) return 1; if (bv == null) return -1
    return (av < bv ? -1 : 1) * (sortDir === 'asc' ? 1 : -1)
  })
  const handleSort = (field) => { if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); else { setSortField(field); setSortDir('asc') } }
  const formatValue = (value, format) => {
    if (value == null) return '-'
    switch (format) {
      case 'currency': return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      case 'percent': return `${value}%`
      case 'date': return value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'
      default: return value
    }
  }

  // ═══════ EXPORT ═══════
  const getCurrentReport = () => { for (const cat of Object.values(reportCategories)) { const f = cat.reports.find(r => r.id === activeReport); if (f) return f } return null }
  const getBrandedHeader = () => {
    const season = getSelectedSeason()
    return { orgName: organization?.name || 'Organization', seasonName: season?.name || 'All Seasons', reportTitle: getCurrentReport()?.label || 'Report', generatedBy: profile?.full_name || user?.email || 'Admin', generatedAt: new Date().toLocaleString() }
  }
  async function exportCSV() {
    setExporting(true); const columns = getVisibleColumnsOrdered(); const header = getBrandedHeader()
    let csv = `"${header.orgName}"\n"${header.seasonName} - ${header.reportTitle}"\n"Generated by: ${header.generatedBy}"\n"Date: ${header.generatedAt}"\n"Records: ${sortedData.length}"\n\n`
    csv += columns.map(c => `"${c.label}"`).join(',') + '\n'
    sortedData.forEach(row => { csv += columns.map(c => { let v = row[c.id]; if (c.format) v = formatValue(v, c.format); if (v == null) v = ''; return `"${String(v).replace(/"/g, '""')}"` }).join(',') + '\n' })
    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${header.orgName.replace(/\s+/g, '_')}_${activeReport}_${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url)
    showToast('Report exported to CSV', 'success'); setExporting(false); setShowExportMenu(false)
  }
  async function exportPDF() {
    setExporting(true); const header = getBrandedHeader(); const columns = getVisibleColumnsOrdered(); const ac = accent?.primary || '#6366f1'
    const html = `<!DOCTYPE html><html><head><title>${header.reportTitle}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:40px;color:#1a1a1a}.header{border-bottom:3px solid ${ac};padding-bottom:20px;margin-bottom:30px}.header h1{font-size:28px}.header h2{font-size:18px;color:#666;font-weight:normal}.meta{display:flex;gap:30px;margin-top:15px;font-size:12px;color:#888}.stats{display:flex;gap:20px;margin-bottom:30px;flex-wrap:wrap}.stat{background:#f8f9fa;padding:15px 20px;border-radius:8px;min-width:120px}.stat-value{font-size:24px;font-weight:bold}.stat-label{font-size:11px;color:#666;text-transform:uppercase;margin-top:4px}table{width:100%;border-collapse:collapse;font-size:10px}th{background:#f8f9fa;padding:8px 6px;text-align:left;font-weight:600;border-bottom:2px solid #e5e7eb;white-space:nowrap}td{padding:6px;border-bottom:1px solid #e5e7eb}tr:nth-child(even){background:#fafafa}.footer{margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:10px;color:#888;text-align:center}@media print{body{padding:20px}}</style></head><body><div class="header"><h1>${header.orgName}</h1><h2>${header.seasonName} - ${header.reportTitle}</h2><div class="meta"><span>By: ${header.generatedBy}</span><span>${header.generatedAt}</span><span>${sortedData.length} records</span></div></div><div class="stats">${stats.labels ? stats.labels.map((label, i) => { const keys = Object.keys(stats).filter(k => k !== 'labels'); const v = stats[keys[i]]; const m = ['totalRevenue','collected','outstanding','totalExpected','totalOutstanding','avgBalance'].includes(keys[i]); return `<div class="stat"><div class="stat-value">${m ? '$'+Number(v).toLocaleString() : keys[i].includes('Rate') ? v+'%' : v}</div><div class="stat-label">${label}</div></div>` }).join('') : ''}</div><table><thead><tr>${columns.map(c => `<th>${c.label}</th>`).join('')}</tr></thead><tbody>${sortedData.map(row => `<tr>${columns.map(c => `<td>${formatValue(row[c.id], c.format)}</td>`).join('')}</tr>`).join('')}</tbody></table><div class="footer">${header.orgName} &bull; VolleyBrain &bull; ${header.generatedAt}</div></body></html>`
    const w = window.open('', '_blank'); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 250)
    showToast('PDF export opened', 'success'); setExporting(false); setShowExportMenu(false)
  }
  function printReport() { exportPDF() }
  async function emailReport() {
    setExporting(true); const h = getBrandedHeader()
    window.location.href = `mailto:?subject=${encodeURIComponent(`${h.reportTitle} - ${h.orgName}`)}&body=${encodeURIComponent(`${h.reportTitle}\n${h.orgName} - ${h.seasonName}\n\nGenerated: ${h.generatedAt}\nRecords: ${sortedData.length}\n\nUse CSV or PDF export in VolleyBrain for the full report.`)}`
    showToast('Email client opened', 'success'); setExporting(false); setShowExportMenu(false)
  }
  const getStatusOptions = () => {
    switch (activeReport) {
      case 'players': return [{ value: 'all', label: 'All Status' },{ value: 'active', label: 'Active' },{ value: 'inactive', label: 'Inactive' },{ value: 'waitlist', label: 'Waitlist' }]
      case 'payments': case 'outstanding': return [{ value: 'all', label: 'All Status' },{ value: 'paid', label: 'Paid' },{ value: 'unpaid', label: 'Unpaid' },{ value: 'partial', label: 'Partial' }]
      case 'registrations': return [{ value: 'all', label: 'All Status' },{ value: 'pending', label: 'Pending' },{ value: 'submitted', label: 'Submitted' },{ value: 'approved', label: 'Approved' },{ value: 'active', label: 'Active' },{ value: 'manual', label: 'Manual' }]
      case 'financial': return [{ value: 'all', label: 'All Status' },{ value: 'paid', label: 'Paid' },{ value: 'unpaid', label: 'Pending' }]
      case 'schedule': return [{ value: 'all', label: 'All Types' },{ value: 'game', label: 'Games' },{ value: 'practice', label: 'Practices' }]
      default: return []
    }
  }

  // ═══════ RENDER ═══════
  const currentReport = getCurrentReport()
  const columns = getVisibleColumnsOrdered()
  const allColumns = getAvailableColumns()
  const statusOptions = getStatusOptions()
  const selectedSeason = getSelectedSeason()
  const gc = `${tc.cardBg} border ${tc.border} rounded-2xl`
  const gi = `${tc.inputBg} border ${tc.border} ${tc.text} rounded-xl`

  return (
    <div className={`flex flex-col h-[calc(100vh-100px)] ${!isDark ? 'rpt-light' : ''}`} style={{ fontFamily: "'DM Sans', system-ui" }}>
      <style>{RPT_STYLES}</style>
      
      {/* TOP HEADER */}
      <div className={`px-6 py-5 rpt-glass-solid border-b ${tc.border}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className={`rpt-display text-3xl font-bold ${tc.text}`}>REPORTS & ANALYTICS</h1>
            <p className={`text-sm mt-0.5 ${tc.textMuted}`}>Generate, customize, and export reports</p>
          </div>
          <div className="flex items-center gap-4">
            {sports.length > 0 && (
              <div>
                <label className={`block text-[10px] font-bold rpt-heading tracking-wider mb-1 ${tc.textMuted}`}>SPORT</label>
                <select value={selectedSportId} onChange={e => setSelectedSportId(e.target.value)} className={`px-3 py-2 text-sm outline-none min-w-[140px] ${gi}`}>
                  <option value="all">All Sports</option>
                  {sports.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className={`block text-[10px] font-bold rpt-heading tracking-wider mb-1 ${tc.textMuted}`}>SEASON</label>
              <select value={selectedSeasonId || ''} onChange={e => setSelectedSeasonId(e.target.value)} className={`px-3 py-2 text-sm outline-none min-w-[180px] ${gi}`}>
                <option value="">Select Season</option>
                {seasons.map(s => <option key={s.id} value={s.id}>{s.name} {s.status === 'active' ? '●' : s.status === 'upcoming' ? '○' : '◌'}</option>)}
              </select>
            </div>
          </div>
        </div>
        {/* Category Tabs */}
        <div className="flex items-center gap-2">
          {Object.entries(reportCategories).map(([catId, cat]) => (
            <div key={catId} className="relative">
              <button onClick={() => setOpenDropdown(openDropdown === catId ? null : catId)}
                className={`px-4 py-2 rounded-xl font-bold text-sm transition flex items-center gap-2 ${activeCategory !== catId ? `${gc} ${tc.text}` : ''}`}
                style={activeCategory === catId ? { background: accent.primary, color: 'white', boxShadow: `0 2px 12px ${accent.primary}40` } : undefined}>
                <span>{cat.icon}</span><span>{cat.label}</span><span className="text-[10px] ml-1 opacity-50">▼</span>
              </button>
              {openDropdown === catId && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                  <div className={`absolute left-0 top-full mt-2 w-72 z-50 overflow-hidden shadow-2xl rpt-as rounded-2xl border backdrop-blur-xl ${tc.modalBg} ${tc.border}`}>
                    {cat.reports.map(report => (
                      <button key={report.id} onClick={() => { setActiveCategory(catId); setActiveReport(report.id); setOpenDropdown(null); setFilters({ team: 'all', status: 'all', dateFrom: '', dateTo: '', search: '' }); setSortField('') }}
                        className="w-full text-left px-4 py-3 transition flex items-center gap-3"
                        style={{ background: activeReport === report.id ? `${accent.primary}15` : 'transparent' }}
                        onMouseEnter={e => { if (activeReport !== report.id) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.02)' }}
                        onMouseLeave={e => { if (activeReport !== report.id) e.currentTarget.style.background = 'transparent' }}>
                        <span className="text-xl">{report.icon}</span>
                        <div className="flex-1"><p className={`font-bold text-[13px] ${tc.text}`}>{report.label}</p><p className={`text-[11px] ${tc.textMuted}`}>{report.description}</p></div>
                        {activeReport === report.id && <span style={{ color: accent.primary }}>✓</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
          {/* Presets */}
          <div className="relative ml-auto">
            <button onClick={() => setOpenDropdown(openDropdown === 'presets' ? null : 'presets')} className={`px-4 py-2 rounded-xl font-bold text-sm transition flex items-center gap-2 ${gc} ${tc.text}`}>
              <Star className="w-4 h-4" style={{ color: '#facc15' }} /><span>Saved</span>
              {savedPresets.length > 0 && <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full text-white" style={{ background: accent.primary }}>{savedPresets.length}</span>}
            </button>
            {openDropdown === 'presets' && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                <div className={`absolute right-0 top-full mt-2 w-72 z-50 overflow-hidden shadow-2xl rpt-as rounded-2xl border backdrop-blur-xl ${tc.modalBg} ${tc.border}`}>
                  <div className={`px-4 py-3 border-b ${tc.border}`}>
                    <p className={`font-bold text-sm ${tc.text}`}>Saved Report Presets</p>
                  </div>
                  {savedPresets.length === 0 ? (
                    <div className="px-4 py-6 text-center"><p className={`text-sm ${tc.textMuted}`}>No saved presets yet</p></div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto rpt-nos">
                      {savedPresets.map(preset => (
                        <div key={preset.id} className="px-4 py-3 flex items-center justify-between transition"
                          onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.02)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <button onClick={() => { loadPreset(preset); setOpenDropdown(null) }} className="flex-1 text-left">
                            <p className={`font-bold text-[13px] ${tc.text}`}>{preset.name}</p>
                            <p className={`text-[11px] ${tc.textMuted}`}>{reportCategories[preset.category]?.reports.find(r => r.id === preset.report)?.label}</p>
                          </button>
                          <button onClick={() => deletePreset(preset.id)} className="p-1 rounded text-red-400 hover:text-red-500">🗑️</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className={`px-4 py-3 border-t ${tc.border}`}>
                    <button onClick={() => { setShowPresetModal(true); setOpenDropdown(null) }} className="w-full px-4 py-2 rounded-xl text-white font-bold text-sm" style={{ background: accent.primary }}>+ Save Current View</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden p-6">
        {!selectedSeasonId ? (
          <div className="flex-1 flex items-center justify-center rpt-ai">
            <div className="text-center"><span className="text-6xl">📅</span><p className={`font-bold text-lg mt-4 ${tc.text}`}>Select a Season</p><p className={`mt-2 text-sm ${tc.textMuted}`}>Choose a season to view reports</p></div>
          </div>
        ) : (
          <>
            {/* Report Header + Actions */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className={`text-xl font-bold flex items-center gap-2 ${tc.text}`}><span className="text-2xl">{currentReport?.icon}</span>{currentReport?.label}</h2>
                <p className={`text-sm ${tc.textMuted}`}>{currentReport?.description} • {selectedSeason?.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowColumnPicker(!showColumnPicker)} className={`px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition ${gc} ${tc.text}`}>⚙️ Columns</button>
                <button onClick={() => setShowFilters(!showFilters)} className={`px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition ${gc} ${tc.text}`}>
                  🔍 Filters {(filters.team !== 'all' || filters.status !== 'all' || filters.search) && <span className="w-2 h-2 rounded-full" style={{ background: accent.primary }} />}
                </button>
                <div className="relative">
                  <button onClick={() => setShowExportMenu(!showExportMenu)} disabled={loading || data.length === 0} className="px-4 py-2 rounded-xl text-white font-bold text-sm flex items-center gap-2 disabled:opacity-40" style={{ background: accent.primary, boxShadow: `0 2px 12px ${accent.primary}30` }}>📤 Export ▼</button>
                  {showExportMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                      <div className={`absolute right-0 top-full mt-2 w-48 z-50 overflow-hidden shadow-2xl rpt-as rounded-xl border backdrop-blur-xl ${tc.modalBg} ${tc.border}`}>
                        {[{ id:'csv', label:'Download CSV', icon:'📊', action:exportCSV },{ id:'pdf', label:'Download PDF', icon:'📄', action:exportPDF },{ id:'print', label:'Print', icon:'🖨️', action:printReport },{ id:'email', label:'Email', icon:'📧', action:emailReport }].map(opt => (
                          <button key={opt.id} onClick={opt.action} disabled={exporting} className={`w-full text-left px-4 py-2.5 flex items-center gap-2 text-sm transition ${tc.text}`}
                            onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.03)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><span>{opt.icon}</span><span>{opt.label}</span></button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Stats */}
            {stats.labels && (
              <div className="grid grid-cols-4 gap-3 mb-4">
                {stats.labels.map((label, i) => {
                  const keys = Object.keys(stats).filter(k => k !== 'labels'); const v = stats[keys[i]]
                  const isMon = ['totalRevenue','collected','outstanding','totalExpected','totalOutstanding','avgBalance'].includes(keys[i])
                  return (<div key={label} className={`p-4 rpt-au ${gc}`} style={{ animationDelay: `${i*.05}s` }}>
                    <p className={`text-2xl font-bold ${tc.text}`}>{isMon ? `$${Number(v).toLocaleString()}` : keys[i].includes('Rate') ? `${v}%` : v}</p>
                    <p className={`text-[10px] font-bold rpt-heading tracking-wider mt-1 ${tc.textMuted}`}>{label}</p>
                  </div>)
                })}
              </div>
            )}
            
            {/* Column Picker */}
            {showColumnPicker && (
              <div className={`p-4 mb-4 rpt-as ${gc}`}>
                <div className="flex items-center justify-between mb-3">
                  <p className={`font-bold text-sm ${tc.text}`}>Customize Columns</p>
                  <button onClick={() => { const dv = {}; allColumns.forEach(c => { dv[c.id] = c.defaultVisible !== false }); setVisibleColumns(dv) }} className="text-sm font-bold" style={{ color: accent.primary }}>Reset to Default</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {allColumns.map(col => (
                    <label key={col.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition text-sm font-medium ${!visibleColumns[col.id] ? `${gc} ${tc.textMuted}` : ''}`}
                      style={visibleColumns[col.id] ? { background: `${accent.primary}15`, color: accent.primary } : undefined}>
                      <input type="checkbox" checked={visibleColumns[col.id] || false} onChange={e => setVisibleColumns({ ...visibleColumns, [col.id]: e.target.checked })} className="sr-only" />
                      <span>{visibleColumns[col.id] ? '✓' : '○'}</span><span>{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            {/* Filters */}
            {showFilters && (
              <div className={`p-4 mb-4 rpt-as ${gc}`}>
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <label className={`block text-[10px] font-bold rpt-heading tracking-wider mb-1 ${tc.textMuted}`}>SEARCH</label>
                    <input type="text" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} placeholder="Search..." className={`w-full px-3 py-2 text-sm outline-none ${gi}`} />
                  </div>
                  {['players','jerseys','schedule'].includes(activeReport) && teams.length > 0 && (
                    <div className="min-w-[160px]">
                      <label className={`block text-[10px] font-bold rpt-heading tracking-wider mb-1 ${tc.textMuted}`}>TEAM</label>
                      <select value={filters.team} onChange={e => setFilters({ ...filters, team: e.target.value })} className={`w-full px-3 py-2 text-sm outline-none ${gi}`}>
                        <option value="all">All Teams</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                  )}
                  {statusOptions.length > 0 && (
                    <div className="min-w-[140px]">
                      <label className={`block text-[10px] font-bold rpt-heading tracking-wider mb-1 ${tc.textMuted}`}>STATUS</label>
                      <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} className={`w-full px-3 py-2 text-sm outline-none ${gi}`}>
                        {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                  )}
                  {activeReport === 'financial' && (
                    <>
                      <div className="min-w-[140px]">
                        <label className={`block text-[10px] font-bold rpt-heading tracking-wider mb-1 ${tc.textMuted}`}>FROM DATE</label>
                        <input type="date" value={filters.dateFrom} onChange={e => setFilters({ ...filters, dateFrom: e.target.value })} className={`w-full px-3 py-2 text-sm outline-none ${gi}`} />
                      </div>
                      <div className="min-w-[140px]">
                        <label className={`block text-[10px] font-bold rpt-heading tracking-wider mb-1 ${tc.textMuted}`}>TO DATE</label>
                        <input type="date" value={filters.dateTo} onChange={e => setFilters({ ...filters, dateTo: e.target.value })} className={`w-full px-3 py-2 text-sm outline-none ${gi}`} />
                      </div>
                    </>
                  )}
                  <div className="flex items-end">
                    <button onClick={() => setFilters({ team: 'all', status: 'all', dateFrom: '', dateTo: '', search: '' })} className={`px-4 py-2 rounded-xl text-sm font-bold ${gc} ${tc.textMuted}`}>Clear</button>
                  </div>
                </div>
              </div>
            )}
            
            {/* DATA TABLE */}
            <div className={`flex-1 overflow-hidden flex flex-col min-h-0 ${gc}`}>
              {loading ? (
                <div className="flex-1 flex items-center justify-center"><div className="text-center">
                  <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: accent.primary, borderTopColor: 'transparent' }} />
                  <p className={`mt-3 text-sm ${tc.textMuted}`}>Loading report...</p>
                </div></div>
              ) : data.length === 0 ? (
                <div className="flex-1 flex items-center justify-center"><div className="text-center">
                  <span className="text-5xl">📭</span><p className={`font-bold mt-4 ${tc.text}`}>No data found</p><p className={`text-sm mt-1 ${tc.textMuted}`}>Try adjusting your filters or selecting a different season</p>
                </div></div>
              ) : (
                <>
                  <div className="flex-1 overflow-auto rpt-nos">
                    <table className="w-full">
                      <thead className={`sticky top-0 backdrop-blur-sm ${tc.cardBg}`}>
                        <tr>
                          {columns.map(col => (
                            <th key={col.id} onClick={() => col.sortable && handleSort(col.id)}
                              className={`px-4 py-3 text-left text-[10px] font-bold rpt-heading tracking-wider whitespace-nowrap ${col.sortable ? 'cursor-pointer' : ''} ${tc.textMuted}`}
                              onMouseEnter={e => { if (col.sortable) e.currentTarget.style.color = isDark ? 'rgba(255,255,255,.7)' : 'rgba(0,0,0,.7)' }}
                              onMouseLeave={e => { if (col.sortable) e.currentTarget.style.color = '' }}>
                              {col.label}{col.sortable && sortField === col.id && <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sortedData.map((row, i) => (
                          <tr key={row.id || i} className="transition"
                            style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,.04)' : '1px solid rgba(0,0,0,.04)' }}
                            onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.02)' : 'rgba(0,0,0,.01)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            {columns.map(col => (
                              <td key={col.id} className={`px-4 py-3 text-sm ${tc.text}`}>
                                {col.id === 'team_name' && row.team_color ? (
                                  <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: row.team_color }} />{row[col.id]}</span>
                                ) : ['payment_status','status','reg_status','roster_status','bg_check_status','display_type'].includes(col.id) ? (
                                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={{
                                    background: ['Paid','active','approved','Ready','cleared','Active','Game'].includes(row[col.id]) ? (isDark ? 'rgba(16,185,129,.15)' : 'rgba(16,185,129,.1)') :
                                      ['Unpaid','denied','Need Players','failed'].includes(row[col.id]) ? (isDark ? 'rgba(239,68,68,.15)' : 'rgba(239,68,68,.1)') :
                                      (isDark ? 'rgba(245,158,11,.15)' : 'rgba(245,158,11,.1)'),
                                    color: ['Paid','active','approved','Ready','cleared','Active','Game'].includes(row[col.id]) ? '#10b981' :
                                      ['Unpaid','denied','Need Players','failed'].includes(row[col.id]) ? '#ef4444' : '#f59e0b'
                                  }}>{row[col.id]}</span>
                                ) : col.id === 'roster_fill' ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 h-2 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)' }}>
                                      <div className="h-full rounded-full" style={{ width: `${Math.min(row[col.id], 100)}%`, background: row[col.id] >= 80 ? '#10b981' : row[col.id] >= 50 ? '#f59e0b' : '#ef4444' }} />
                                    </div>
                                    <span>{row[col.id]}%</span>
                                  </div>
                                ) : col.id === 'value' && row.format ? (
                                  formatValue(row[col.id], row.format)
                                ) : (
                                  formatValue(row[col.id], col.format)
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Footer */}
                  <div className={`px-4 py-3 flex items-center justify-between flex-shrink-0 border-t ${tc.border} ${tc.cardBgAlt}`}>
                    <p className={`text-sm ${tc.textMuted}`}>Showing {sortedData.length} records • {columns.length} columns</p>
                    <p className={`text-xs ${tc.textMuted}`}>{organization?.name} • {selectedSeason?.name}</p>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Save Preset Modal */}
      {showPresetModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 rpt-ai" style={{ background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(8px)' }} onClick={() => { setShowPresetModal(false); setPresetName('') }}>
          <div className={`w-full max-w-md p-6 rpt-as rounded-3xl border ${tc.modalBg} ${tc.border}`} style={{ backdropFilter: 'blur(24px)' }} onClick={e => e.stopPropagation()}>
            <h3 className={`text-lg font-bold mb-2 ${tc.text}`}>Save Report Preset</h3>
            <p className={`text-sm mb-4 ${tc.textMuted}`}>Save your current view (report type, visible columns, filters) as a preset for quick access later.</p>
            <input type="text" value={presetName} onChange={e => setPresetName(e.target.value)} placeholder="Preset name (e.g., 'Contact List for Coaches')"
              className={`w-full px-4 py-3 mb-4 outline-none text-sm ${gi}`} autoFocus />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowPresetModal(false); setPresetName('') }} className={`px-4 py-2 rounded-xl text-sm font-bold ${gc} ${tc.text}`}>Cancel</button>
              <button onClick={savePreset} disabled={!presetName.trim()} className="px-4 py-2 rounded-xl text-white font-bold text-sm disabled:opacity-50" style={{ background: accent.primary }}>Save Preset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export { ReportsPage }
