import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason, isAllSeasons } from '../../contexts/SeasonContext'
import { useSport } from '../../contexts/SportContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import PageShell from '../../components/pages/PageShell'
import InnerStatRow from '../../components/pages/InnerStatRow'
import {
  CategoryTabBar, ColumnPicker, FilterBar,
  ReportDataTable, ExportMenu, SavePresetModal,
  getAvailableColumns, formatValue
} from './ReportCards'

// ============================================
// REPORTS PAGE - Lynx Brand Treatment
// Orchestrator: state, data loaders, column defs
// Sub-components live in ReportCards.jsx
// ============================================

const REPORT_CATEGORIES = {
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

function ReportsPage({ showToast }) {
  const { isDark } = useTheme()
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

  // ====== LIFECYCLE ======
  useEffect(() => { loadSeasonsAndSports(); loadSavedPresets() }, [organization?.id])
  useEffect(() => { if (globalSeason?.id && !selectedSeasonId && !isAllSeasons(globalSeason)) setSelectedSeasonId(globalSeason.id) }, [globalSeason?.id])
  useEffect(() => { if (globalSport?.id && selectedSportId === 'all') setSelectedSportId(globalSport.id) }, [globalSport?.id])
  useEffect(() => { if (selectedSeasonId) loadTeams() }, [selectedSeasonId])
  useEffect(() => { if (selectedSeasonId) loadReportData() }, [selectedSeasonId, selectedSportId, activeReport, filters])
  useEffect(() => {
    const cols = getAvailableColumns(activeReport)
    const dv = {}, order = []
    cols.forEach(col => { dv[col.id] = col.defaultVisible !== false; order.push(col.id) })
    setVisibleColumns(dv); setColumnOrder(order)
  }, [activeReport])

  // ====== INFRASTRUCTURE ======
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

  // ====== REPORT LOADERS ======

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

  async function loadCoachesReport() {
    const { data, error } = await supabase.from('coaches').select('id, profile_id, profiles:profile_id(full_name, email)')
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

  // ====== COLUMNS (imported from ReportCards) ======
  const getVisibleColumnsOrdered = () => {
    const available = getAvailableColumns(activeReport)
    return columnOrder.filter(colId => visibleColumns[colId]).map(colId => available.find(c => c.id === colId)).filter(Boolean)
  }

  // ====== SORT ======
  const sortedData = [...data].sort((a, b) => {
    if (!sortField) return 0; const av = a[sortField], bv = b[sortField]
    if (av === bv) return 0; if (av == null) return 1; if (bv == null) return -1
    return (av < bv ? -1 : 1) * (sortDir === 'asc' ? 1 : -1)
  })
  const handleSort = (field) => { if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); else { setSortField(field); setSortDir('asc') } }

  // ====== EXPORT ======
  const getCurrentReport = () => { for (const cat of Object.values(REPORT_CATEGORIES)) { const f = cat.reports.find(r => r.id === activeReport); if (f) return f } return null }
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
    setExporting(true); const header = getBrandedHeader(); const columns = getVisibleColumnsOrdered()
    const html = `<!DOCTYPE html><html><head><title>${header.reportTitle}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:40px;color:#1a1a1a}.header{border-bottom:3px solid #0f172a;padding-bottom:20px;margin-bottom:30px}.header h1{font-size:28px}.header h2{font-size:18px;color:#666;font-weight:normal}.meta{display:flex;gap:30px;margin-top:15px;font-size:12px;color:#888}.stats{display:flex;gap:20px;margin-bottom:30px;flex-wrap:wrap}.stat{background:#f8f9fa;padding:15px 20px;border-radius:8px;min-width:120px}.stat-value{font-size:24px;font-weight:bold}.stat-label{font-size:11px;color:#666;text-transform:uppercase;margin-top:4px}table{width:100%;border-collapse:collapse;font-size:10px}th{background:#f8f9fa;padding:8px 6px;text-align:left;font-weight:600;border-bottom:2px solid #e5e7eb;white-space:nowrap}td{padding:6px;border-bottom:1px solid #e5e7eb}tr:nth-child(even){background:#fafafa}.footer{margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:10px;color:#888;text-align:center}@media print{body{padding:20px}}</style></head><body><div class="header"><h1>${header.orgName}</h1><h2>${header.seasonName} - ${header.reportTitle}</h2><div class="meta"><span>By: ${header.generatedBy}</span><span>${header.generatedAt}</span><span>${sortedData.length} records</span></div></div><div class="stats">${stats.labels ? stats.labels.map((label, i) => { const keys = Object.keys(stats).filter(k => k !== 'labels'); const v = stats[keys[i]]; const m = ['totalRevenue','collected','outstanding','totalExpected','totalOutstanding','avgBalance'].includes(keys[i]); return `<div class="stat"><div class="stat-value">${m ? '$'+Number(v).toLocaleString() : keys[i].includes('Rate') ? v+'%' : v}</div><div class="stat-label">${label}</div></div>` }).join('') : ''}</div><table><thead><tr>${columns.map(c => `<th>${c.label}</th>`).join('')}</tr></thead><tbody>${sortedData.map(row => `<tr>${columns.map(c => `<td>${formatValue(row[c.id], c.format)}</td>`).join('')}</tr>`).join('')}</tbody></table><div class="footer">${header.orgName} &bull; Lynx &bull; ${header.generatedAt}</div></body></html>`
    const w = window.open('', '_blank'); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 250)
    showToast('PDF export opened', 'success'); setExporting(false); setShowExportMenu(false)
  }
  function printReport() { exportPDF() }
  async function emailReport() {
    setExporting(true); const h = getBrandedHeader()
    window.location.href = `mailto:?subject=${encodeURIComponent(`${h.reportTitle} - ${h.orgName}`)}&body=${encodeURIComponent(`${h.reportTitle}\n${h.orgName} - ${h.seasonName}\n\nGenerated: ${h.generatedAt}\nRecords: ${sortedData.length}\n\nUse CSV or PDF export in Lynx for the full report.`)}`
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

  // ====== DERIVED ======
  const currentReport = getCurrentReport()
  const columns = getVisibleColumnsOrdered()
  const allColumns = getAvailableColumns(activeReport)
  const statusOptions = getStatusOptions()
  const selectedSeason = getSelectedSeason()

  // Build InnerStatRow items from stats
  const buildStatItems = () => {
    if (!stats.labels) return []
    const keys = Object.keys(stats).filter(k => k !== 'labels')
    const icons = ['📊', '✅', '⚠️', '🔍']
    return stats.labels.map((label, i) => {
      const v = stats[keys[i]]
      const isMon = ['totalRevenue','collected','outstanding','totalExpected','totalOutstanding','avgBalance'].includes(keys[i])
      const isRate = keys[i].includes('Rate')
      return {
        label,
        value: isMon ? `$${Number(v).toLocaleString()}` : isRate ? `${v}%` : v,
        icon: icons[i] || '📊',
      }
    })
  }

  // Season/sport selector inputs
  const inputCls = `px-3 py-2 rounded-lg border text-r-sm font-medium focus:outline-none focus:border-lynx-sky focus:ring-1 focus:ring-lynx-sky/20 ${isDark ? 'bg-lynx-charcoal border-white/[0.06] text-white' : 'bg-white border-slate-200 text-slate-700'}`

  // V2 input style
  const v2Select = `px-4 py-2.5 rounded-xl text-sm font-medium border focus:outline-none focus:border-[#4BB9EC] focus:ring-2 focus:ring-[#4BB9EC]/10 ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-white' : 'bg-white border-[#E8ECF2] text-[#10284C]'}`

  // Total report count
  const totalReportCount = Object.values(REPORT_CATEGORIES).reduce((sum, cat) => sum + cat.reports.length, 0)

  return (
    <PageShell
      title="Reports"
      breadcrumb="Insights"
      subtitle="Generate, customize, and export reports"
      actions={
        <div className="flex items-center gap-3">
          {sports.length > 0 && (
            <select value={selectedSportId} onChange={e => setSelectedSportId(e.target.value)} className={`min-w-[140px] ${v2Select}`}>
              <option value="all">All Sports</option>
              {sports.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
            </select>
          )}
          <select value={selectedSeasonId || ''} onChange={e => setSelectedSeasonId(e.target.value)} className={`min-w-[180px] ${v2Select}`}>
            <option value="">Select Season</option>
            {seasons.filter(s => selectedSportId === 'all' || s.sport_id === selectedSportId).map(s => <option key={s.id} value={s.id}>{s.name} {s.status === 'active' ? '●' : s.status === 'upcoming' ? '○' : '◌'}</option>)}
          </select>
        </div>
      }
    >
      {/* Navy Overview Header */}
      <div className="bg-lynx-navy-h rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-white" style={{ fontFamily: 'var(--v2-font)' }}>
              Reports Center
            </h2>
            <p className="text-sm text-white/50 mt-1">Generate, customize, and export data reports</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <span className="text-3xl font-black italic text-[#4BB9EC]">{totalReportCount}</span>
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Reports</div>
            </div>
            <div className="text-center">
              <span className="text-3xl font-black italic text-[#22C55E]">{data.length}</span>
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Records</div>
            </div>
            <div className="text-center">
              <span className="text-3xl font-black italic text-white/70">{savedPresets.length}</span>
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Presets</div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="mb-6">
        <CategoryTabBar
          reportCategories={REPORT_CATEGORIES}
          activeCategory={activeCategory}
          activeReport={activeReport}
          openDropdown={openDropdown}
          setOpenDropdown={setOpenDropdown}
          setActiveCategory={setActiveCategory}
          setActiveReport={setActiveReport}
          setFilters={setFilters}
          setSortField={setSortField}
          savedPresets={savedPresets}
          loadPreset={loadPreset}
          deletePreset={deletePreset}
          setShowPresetModal={setShowPresetModal}
          isDark={isDark}
        />
      </div>

      {!selectedSeasonId ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
              <span className="text-2xl">📅</span>
            </div>
            <p className={`font-bold text-r-lg mt-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Select a Season</p>
            <p className="mt-2 text-r-sm text-slate-400">Choose a season to view reports</p>
          </div>
        </div>
      ) : (
        <>
          {/* Report Header + Actions */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className={`text-lg font-extrabold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#10284C]'}`} style={{ fontFamily: 'var(--v2-font)' }}>
                <span className="text-xl">{currentReport?.icon}</span>{currentReport?.label}
              </h2>
              <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{currentReport?.description} / {selectedSeason?.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowColumnPicker(!showColumnPicker)}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition ${isDark ? 'bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.08]' : 'bg-white border border-[#E8ECF2] text-[#10284C] hover:bg-[#F5F6F8]'}`}
              >
                ⚙️ Columns
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition ${isDark ? 'bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.08]' : 'bg-white border border-[#E8ECF2] text-[#10284C] hover:bg-[#F5F6F8]'}`}
              >
                🔍 Filters
                {(filters.team !== 'all' || filters.status !== 'all' || filters.search) && (
                  <span className="w-2 h-2 rounded-full bg-[#4BB9EC]" />
                )}
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={loading || data.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-lynx-navy-subtle text-white font-bold text-sm flex items-center gap-2 disabled:opacity-40 hover:brightness-110 transition"
                >
                  📤 Export ▼
                </button>
                <ExportMenu
                  showExportMenu={showExportMenu}
                  setShowExportMenu={setShowExportMenu}
                  exporting={exporting}
                  exportCSV={exportCSV}
                  exportPDF={exportPDF}
                  printReport={printReport}
                  emailReport={emailReport}
                  isDark={isDark}
                />
              </div>
            </div>
          </div>

          {/* Stats Row */}
          {stats.labels && <InnerStatRow stats={buildStatItems()} />}

          {/* Column Picker */}
          {showColumnPicker && (
            <ColumnPicker
              allColumns={allColumns}
              visibleColumns={visibleColumns}
              setVisibleColumns={setVisibleColumns}
              isDark={isDark}
            />
          )}

          {/* Filters */}
          {showFilters && (
            <FilterBar
              filters={filters}
              setFilters={setFilters}
              activeReport={activeReport}
              teams={teams}
              statusOptions={statusOptions}
              isDark={isDark}
            />
          )}

          {/* Data Table */}
          <ReportDataTable
            loading={loading}
            data={data}
            sortedData={sortedData}
            columns={columns}
            sortField={sortField}
            sortDir={sortDir}
            handleSort={handleSort}
            formatValue={formatValue}
            isDark={isDark}
            organization={organization}
            selectedSeason={selectedSeason}
          />
        </>
      )}

      {/* Save Preset Modal */}
      <SavePresetModal
        showPresetModal={showPresetModal}
        setShowPresetModal={setShowPresetModal}
        presetName={presetName}
        setPresetName={setPresetName}
        savePreset={savePreset}
        isDark={isDark}
      />
    </PageShell>
  )
}

export { ReportsPage }
