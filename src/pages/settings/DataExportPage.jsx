import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  Download, Shield, Users, DollarSign, Calendar, Clock, Building2,
  CheckSquare, Trophy, ChevronDown, RefreshCw, AlertTriangle, FileText,
  Star, UserCog, X, Check
} from '../../constants/icons'

// ═══════════════════════════════════════════════════════════
// DATA EXPORT PAGE — Org Backup & CSV/JSON Export
// Glassmorphism Design — Client-side file generation
// ═══════════════════════════════════════════════════════════

const DE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Rajdhani:wght@400;500;600;700&display=swap');
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes scaleIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
  .de-au{animation:fadeUp .4s ease-out both}
  .de-ai{animation:fadeIn .3s ease-out both}
  .de-as{animation:scaleIn .25s ease-out both}
  .de-pulse{animation:pulse 1.5s ease-in-out infinite}
  .de-display{font-family:'Bebas Neue',sans-serif;letter-spacing:.05em}
  .de-heading{font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:.04em}
  .de-label{font-family:'Rajdhani',sans-serif;font-weight:600;letter-spacing:.03em}
  .de-glass{background:rgba(255,255,255,.03);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.08)}
  .de-glass-solid{background:rgba(255,255,255,.05);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,.08)}
`

// ═══════ HELPERS ═══════

function escapeCSV(value) {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function buildCSV(headers, rows) {
  const headerLine = headers.map(h => escapeCSV(h)).join(',')
  const dataLines = rows.map(row => row.map(cell => escapeCSV(cell)).join(','))
  return [headerLine, ...dataLines].join('\n')
}

function buildJSON(data, exportType) {
  return JSON.stringify({ exportType, exportedAt: new Date().toISOString(), recordCount: data.length, data }, null, 2)
}

function triggerDownload(content, filename, type) {
  const mimeType = type === 'json' ? 'application/json' : 'text/csv'
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtCurrency(v) {
  if (v === null || v === undefined) return ''
  return `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ═══════ EXPORT CATEGORY DEFINITIONS ═══════

const EXPORT_CATEGORIES = [
  {
    id: 'players',
    label: 'Player Roster',
    description: 'All players with name, age, team, position, guardian info, registration status',
    icon: Users,
    color: '#3B82F6',
    table: 'players',
  },
  {
    id: 'coaches',
    label: 'Coach Directory',
    description: 'All coaches with name, email, phone, teams, certifications',
    icon: UserCog,
    color: '#8B5CF6',
    table: 'coaches',
  },
  {
    id: 'payments',
    label: 'Payment Records',
    description: 'All payments with date, amount, status, payer, type',
    icon: DollarSign,
    color: '#10B981',
    table: 'payments',
  },
  {
    id: 'seasons',
    label: 'Season History',
    description: 'All seasons with dates, teams, player counts',
    icon: Trophy,
    color: '#F59E0B',
    table: 'seasons',
  },
  {
    id: 'teams',
    label: 'Team Rosters',
    description: 'Per-team breakdown with players and staff',
    icon: Star,
    color: '#EC4899',
    table: 'teams',
  },
  {
    id: 'registrations',
    label: 'Registration Data',
    description: 'All registrations with status, dates, payment info',
    icon: CheckSquare,
    color: '#06B6D4',
    table: 'registrations',
  },
  {
    id: 'events',
    label: 'Schedule / Events',
    description: 'All events with dates, locations, teams, results',
    icon: Calendar,
    color: '#F97316',
    table: 'schedule_events',
  },
  {
    id: 'full-backup',
    label: 'Full Org Backup',
    description: 'Everything above combined into one download',
    icon: Download,
    color: '#EF4444',
    table: null,
  },
]

// ═══════ MAIN COMPONENT ═══════

function DataExportPage({ showToast }) {
  const { user, profile, organization, isPlatformAdmin } = useAuth()
  const { isDark, accent } = useTheme()
  const tc = useThemeClasses()
  const accentColor = accent?.primary || '#EAB308'

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

  // ═══════ ACCESS GATE ═══════
  const hasAccess = useMemo(() => {
    if (isPlatformAdmin) return true
    if (!profile || !organization) return false
    return true // admin role check is done in MainApp route gating
  }, [isPlatformAdmin, profile, organization])

  // ═══════ LOAD ORGS FOR PLATFORM ADMIN ═══════
  useEffect(() => {
    if (!isPlatformAdmin) return
    async function loadOrgs() {
      const { data } = await supabase.from('organizations').select('id, name, slug, is_active').eq('is_active', true).order('name')
      if (data) setAllOrgs(data)
    }
    loadOrgs()
  }, [isPlatformAdmin])

  useEffect(() => {
    if (isPlatformAdmin && selectedOrgId) {
      const org = allOrgs.find(o => o.id === selectedOrgId) || organization
      setSelectedOrg(org)
    }
  }, [selectedOrgId, allOrgs, isPlatformAdmin, organization])

  // ═══════ LOAD SEASONS + ROW COUNTS ═══════
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
        .from('seasons').select('id, name, status, start_date, end_date')
        .eq('organization_id', orgId)
        .order('start_date', { ascending: false })
      setSeasons(seasonData || [])

      // Get season IDs for this org
      const seasonIds = (seasonData || []).map(s => s.id)
      if (seasonIds.length === 0) {
        setRowCounts({ players: 0, coaches: 0, payments: 0, seasons: (seasonData || []).length, teams: 0, registrations: 0, events: 0 })
        setLoading(false)
        return
      }

      // Count rows in parallel
      const [players, coaches, payments, teams, registrations, events] = await Promise.all([
        supabase.from('players').select('id', { count: 'exact', head: true }).in('season_id', seasonIds),
        supabase.from('coaches').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
        supabase.from('payments').select('id', { count: 'exact', head: true }).in('season_id', seasonIds),
        supabase.from('teams').select('id', { count: 'exact', head: true }).in('season_id', seasonIds),
        supabase.from('registrations').select('id', { count: 'exact', head: true }).in('player_id',
          (await supabase.from('players').select('id').in('season_id', seasonIds)).data?.map(p => p.id) || []
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

  // ═══════ SEASON IDs FOR FILTER ═══════
  const getSeasonIds = useCallback(async () => {
    if (!activeOrg?.id) return []
    if (selectedSeasonId !== 'all') return [selectedSeasonId]
    const { data } = await supabase.from('seasons').select('id').eq('organization_id', activeOrg.id)
    return (data || []).map(s => s.id)
  }, [activeOrg?.id, selectedSeasonId])

  // ═══════ EXPORT FUNCTIONS ═══════

  async function exportPlayers(format) {
    const seasonIds = await getSeasonIds()
    if (seasonIds.length === 0) return { headers: [], rows: [], data: [] }

    const { data: players } = await supabase
      .from('players')
      .select('id, first_name, last_name, email, phone, date_of_birth, gender, grade, position, jersey_number, school, status, parent_name, parent_email, parent_phone, parent_phone_secondary, medical_notes, allergies, created_at, season_id')
      .in('season_id', seasonIds)
      .order('last_name')

    if (!players || players.length === 0) return { headers: [], rows: [], data: [] }

    // Get team assignments
    const { data: teamAssignments } = await supabase
      .from('team_players').select('player_id, teams(name)')
      .in('player_id', players.map(p => p.id))

    const teamMap = {}
    ;(teamAssignments || []).forEach(ta => {
      if (!teamMap[ta.player_id]) teamMap[ta.player_id] = []
      teamMap[ta.player_id].push(ta.teams?.name || '')
    })

    // Get season names
    const { data: seasonNames } = await supabase.from('seasons').select('id, name').in('id', seasonIds)
    const seasonMap = {}
    ;(seasonNames || []).forEach(s => { seasonMap[s.id] = s.name })

    // Get registration status
    const { data: regs } = await supabase
      .from('registrations').select('player_id, status')
      .in('player_id', players.map(p => p.id))
    const regMap = {}
    ;(regs || []).forEach(r => { regMap[r.player_id] = r.status })

    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Date of Birth', 'Gender', 'Grade', 'Position', 'Jersey #', 'School', 'Status', 'Registration Status', 'Team(s)', 'Guardian Name', 'Guardian Email', 'Guardian Phone', 'Guardian Phone 2', 'Medical Notes', 'Allergies', 'Season', 'Created']

    const rows = players.map(p => [
      p.first_name, p.last_name, p.email, p.phone, fmtDate(p.date_of_birth),
      p.gender, p.grade, p.position, p.jersey_number, p.school,
      p.status, regMap[p.id] || '', (teamMap[p.id] || []).join('; '),
      p.parent_name, p.parent_email, p.parent_phone, p.parent_phone_secondary,
      p.medical_notes, p.allergies, seasonMap[p.season_id] || '', fmtDate(p.created_at)
    ])

    const jsonData = players.map(p => ({
      ...p, teams: teamMap[p.id] || [], registration_status: regMap[p.id] || '', season_name: seasonMap[p.season_id] || ''
    }))

    return { headers, rows, data: jsonData }
  }

  async function exportCoaches(format) {
    const { data: coaches } = await supabase
      .from('coaches')
      .select('id, first_name, last_name, email, phone, status, background_check_status, waiver_signed, code_of_conduct_signed, specialties, season_id')
      .eq('organization_id', activeOrg.id)
      .order('last_name')

    if (!coaches || coaches.length === 0) return { headers: [], rows: [], data: [] }

    // Filter by season if selected
    let filtered = coaches
    if (selectedSeasonId !== 'all') {
      filtered = coaches.filter(c => c.season_id === selectedSeasonId)
    }

    // Get team assignments
    const { data: teamAssignments } = await supabase
      .from('team_coaches').select('coach_id, role, teams(name)')
      .in('coach_id', filtered.map(c => c.id))

    const teamMap = {}
    ;(teamAssignments || []).forEach(ta => {
      if (!teamMap[ta.coach_id]) teamMap[ta.coach_id] = []
      teamMap[ta.coach_id].push(`${ta.teams?.name || ''} (${ta.role || 'staff'})`)
    })

    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Status', 'Background Check', 'Waiver Signed', 'Code of Conduct', 'Specialties', 'Team(s)']

    const rows = filtered.map(c => [
      c.first_name, c.last_name, c.email, c.phone, c.status,
      c.background_check_status || '', c.waiver_signed ? 'Yes' : 'No',
      c.code_of_conduct_signed ? 'Yes' : 'No', c.specialties || '',
      (teamMap[c.id] || []).join('; ')
    ])

    const jsonData = filtered.map(c => ({ ...c, teams: teamMap[c.id] || [] }))

    return { headers, rows, data: jsonData }
  }

  async function exportPayments(format) {
    const seasonIds = await getSeasonIds()
    if (seasonIds.length === 0) return { headers: [], rows: [], data: [] }

    const { data: payments } = await supabase
      .from('payments')
      .select('id, player_id, amount, paid, paid_at, payment_method, description, fee_category, created_at, season_id, players(first_name, last_name)')
      .in('season_id', seasonIds)
      .order('created_at', { ascending: false })

    if (!payments || payments.length === 0) return { headers: [], rows: [], data: [] }

    // Get season names
    const { data: seasonNames } = await supabase.from('seasons').select('id, name').in('id', seasonIds)
    const seasonMap = {}
    ;(seasonNames || []).forEach(s => { seasonMap[s.id] = s.name })

    const headers = ['Player', 'Amount', 'Paid', 'Paid At', 'Payment Method', 'Description', 'Fee Category', 'Season', 'Created']

    const rows = payments.map(p => [
      `${p.players?.first_name || ''} ${p.players?.last_name || ''}`.trim(),
      fmtCurrency(p.amount), p.paid ? 'Yes' : 'No', fmtDate(p.paid_at),
      p.payment_method || '', p.description || '', p.fee_category || '',
      seasonMap[p.season_id] || '', fmtDate(p.created_at)
    ])

    const jsonData = payments.map(p => ({
      ...p, player_name: `${p.players?.first_name || ''} ${p.players?.last_name || ''}`.trim(),
      season_name: seasonMap[p.season_id] || ''
    }))

    return { headers, rows, data: jsonData }
  }

  async function exportSeasons(format) {
    const { data: allSeasons } = await supabase
      .from('seasons')
      .select('id, name, status, start_date, end_date, sport_id, fee_registration, fee_uniform, fee_monthly, capacity, description, created_at')
      .eq('organization_id', activeOrg.id)
      .order('start_date', { ascending: false })

    if (!allSeasons || allSeasons.length === 0) return { headers: [], rows: [], data: [] }

    let filtered = allSeasons
    if (selectedSeasonId !== 'all') {
      filtered = allSeasons.filter(s => s.id === selectedSeasonId)
    }

    // Get team and player counts per season
    const seasonIds = filtered.map(s => s.id)
    const { data: teams } = await supabase.from('teams').select('id, season_id').in('season_id', seasonIds)
    const { data: players } = await supabase.from('players').select('id, season_id').in('season_id', seasonIds)

    const teamCounts = {}
    const playerCounts = {}
    ;(teams || []).forEach(t => { teamCounts[t.season_id] = (teamCounts[t.season_id] || 0) + 1 })
    ;(players || []).forEach(p => { playerCounts[p.season_id] = (playerCounts[p.season_id] || 0) + 1 })

    const headers = ['Season Name', 'Status', 'Start Date', 'End Date', 'Reg Fee', 'Uniform Fee', 'Monthly Fee', 'Capacity', 'Teams', 'Players', 'Description', 'Created']

    const rows = filtered.map(s => [
      s.name, s.status, fmtDate(s.start_date), fmtDate(s.end_date),
      fmtCurrency(s.fee_registration), fmtCurrency(s.fee_uniform), fmtCurrency(s.fee_monthly),
      s.capacity || '', teamCounts[s.id] || 0, playerCounts[s.id] || 0,
      s.description || '', fmtDate(s.created_at)
    ])

    const jsonData = filtered.map(s => ({
      ...s, team_count: teamCounts[s.id] || 0, player_count: playerCounts[s.id] || 0
    }))

    return { headers, rows, data: jsonData }
  }

  async function exportTeams(format) {
    const seasonIds = await getSeasonIds()
    if (seasonIds.length === 0) return { headers: [], rows: [], data: [] }

    const { data: teams } = await supabase
      .from('teams')
      .select('id, name, color, age_group, team_type, skill_level, gender, max_roster_size, season_id')
      .in('season_id', seasonIds)
      .order('name')

    if (!teams || teams.length === 0) return { headers: [], rows: [], data: [] }

    // Get season names
    const { data: seasonNames } = await supabase.from('seasons').select('id, name').in('id', seasonIds)
    const seasonMap = {}
    ;(seasonNames || []).forEach(s => { seasonMap[s.id] = s.name })

    // Get players per team
    const { data: tp } = await supabase
      .from('team_players').select('team_id, players(first_name, last_name, jersey_number)')
      .in('team_id', teams.map(t => t.id))

    const playerMap = {}
    ;(tp || []).forEach(item => {
      if (!playerMap[item.team_id]) playerMap[item.team_id] = []
      playerMap[item.team_id].push(`${item.players?.first_name || ''} ${item.players?.last_name || ''}`.trim())
    })

    // Get coaches per team
    const { data: tc_data } = await supabase
      .from('team_coaches').select('team_id, role, coaches(first_name, last_name)')
      .in('team_id', teams.map(t => t.id))

    const coachMap = {}
    ;(tc_data || []).forEach(item => {
      if (!coachMap[item.team_id]) coachMap[item.team_id] = []
      coachMap[item.team_id].push(`${item.coaches?.first_name || ''} ${item.coaches?.last_name || ''}`.trim() + ` (${item.role || 'staff'})`)
    })

    const headers = ['Team Name', 'Color', 'Age Group', 'Type', 'Skill Level', 'Gender', 'Max Roster', 'Player Count', 'Players', 'Coaches', 'Season']

    const rows = teams.map(t => [
      t.name, t.color || '', t.age_group || '', t.team_type || '', t.skill_level || '',
      t.gender || '', t.max_roster_size || '', (playerMap[t.id] || []).length,
      (playerMap[t.id] || []).join('; '), (coachMap[t.id] || []).join('; '),
      seasonMap[t.season_id] || ''
    ])

    const jsonData = teams.map(t => ({
      ...t, players: playerMap[t.id] || [], coaches: coachMap[t.id] || [],
      player_count: (playerMap[t.id] || []).length, season_name: seasonMap[t.season_id] || ''
    }))

    return { headers, rows, data: jsonData }
  }

  async function exportRegistrations(format) {
    const seasonIds = await getSeasonIds()
    if (seasonIds.length === 0) return { headers: [], rows: [], data: [] }

    // Get players in these seasons
    const { data: players } = await supabase
      .from('players').select('id, first_name, last_name, parent_name, parent_email, season_id')
      .in('season_id', seasonIds)

    if (!players || players.length === 0) return { headers: [], rows: [], data: [] }

    const { data: regs } = await supabase
      .from('registrations')
      .select('id, player_id, status, submitted_at, approved_at, denied_at, deny_reason')
      .in('player_id', players.map(p => p.id))
      .order('submitted_at', { ascending: false })

    if (!regs || regs.length === 0) return { headers: [], rows: [], data: [] }

    const playerMap = {}
    players.forEach(p => { playerMap[p.id] = p })

    // Get season names
    const { data: seasonNames } = await supabase.from('seasons').select('id, name').in('id', seasonIds)
    const seasonMap = {}
    ;(seasonNames || []).forEach(s => { seasonMap[s.id] = s.name })

    const headers = ['Player', 'Guardian', 'Guardian Email', 'Status', 'Submitted', 'Approved', 'Denied', 'Deny Reason', 'Season']

    const rows = regs.map(r => {
      const p = playerMap[r.player_id] || {}
      return [
        `${p.first_name || ''} ${p.last_name || ''}`.trim(),
        p.parent_name || '', p.parent_email || '', r.status,
        fmtDate(r.submitted_at), fmtDate(r.approved_at), fmtDate(r.denied_at),
        r.deny_reason || '', seasonMap[p.season_id] || ''
      ]
    })

    const jsonData = regs.map(r => {
      const p = playerMap[r.player_id] || {}
      return { ...r, player_name: `${p.first_name || ''} ${p.last_name || ''}`.trim(), season_name: seasonMap[p.season_id] || '' }
    })

    return { headers, rows, data: jsonData }
  }

  async function exportEvents(format) {
    const seasonIds = await getSeasonIds()
    if (seasonIds.length === 0) return { headers: [], rows: [], data: [] }

    const { data: events } = await supabase
      .from('schedule_events')
      .select('id, title, event_type, event_date, event_time, location, team_id, opponent_name, our_score, opponent_score, game_status, game_result, season_id, created_at, teams(name)')
      .in('season_id', seasonIds)
      .order('event_date', { ascending: false })

    if (!events || events.length === 0) return { headers: [], rows: [], data: [] }

    // Get season names
    const { data: seasonNames } = await supabase.from('seasons').select('id, name').in('id', seasonIds)
    const seasonMap = {}
    ;(seasonNames || []).forEach(s => { seasonMap[s.id] = s.name })

    const headers = ['Title', 'Type', 'Date', 'Time', 'Location', 'Team', 'Opponent', 'Our Score', 'Opp Score', 'Result', 'Game Status', 'Season', 'Created']

    const rows = events.map(e => [
      e.title, e.event_type, fmtDate(e.event_date), e.event_time || '',
      e.location || '', e.teams?.name || '', e.opponent_name || '',
      e.our_score ?? '', e.opponent_score ?? '', e.game_result || '',
      e.game_status || '', seasonMap[e.season_id] || '', fmtDate(e.created_at)
    ])

    const jsonData = events.map(e => ({
      ...e, team_name: e.teams?.name || '', season_name: seasonMap[e.season_id] || ''
    }))

    return { headers, rows, data: jsonData }
  }

  // ═══════ EXPORT DISPATCHER ═══════

  const exportFunctions = {
    players: exportPlayers,
    coaches: exportCoaches,
    payments: exportPayments,
    seasons: exportSeasons,
    teams: exportTeams,
    registrations: exportRegistrations,
    events: exportEvents,
  }

  async function handleExport(categoryId) {
    if (!activeOrg) return
    setExporting(prev => ({ ...prev, [categoryId]: true }))

    try {
      if (categoryId === 'full-backup') {
        await handleFullBackup()
        return
      }

      const exportFn = exportFunctions[categoryId]
      if (!exportFn) return

      const { headers, rows, data } = await exportFn(exportFormat)

      if ((!rows || rows.length === 0) && (!data || data.length === 0)) {
        showToast('No data found for this export', 'warning')
        setExporting(prev => ({ ...prev, [categoryId]: false }))
        return
      }

      const dateStr = new Date().toISOString().split('T')[0]
      const seasonSuffix = selectedSeasonId !== 'all' ? `_${seasons.find(s => s.id === selectedSeasonId)?.name?.replace(/\s+/g, '-') || 'season'}` : ''

      if (exportFormat === 'csv') {
        const csv = buildCSV(headers, rows)
        triggerDownload(csv, `volleybrain_${orgSlug}_${categoryId}${seasonSuffix}_${dateStr}.csv`, 'csv')
      } else {
        const json = buildJSON(data, categoryId)
        triggerDownload(json, `volleybrain_${orgSlug}_${categoryId}${seasonSuffix}_${dateStr}.json`, 'json')
      }

      setLastExports(prev => ({ ...prev, [categoryId]: new Date().toISOString() }))
      showToast(`${EXPORT_CATEGORIES.find(c => c.id === categoryId)?.label} exported successfully`, 'success')
    } catch (err) {
      console.error('Export error:', err)
      showToast('Export failed: ' + err.message, 'error')
    }
    setExporting(prev => ({ ...prev, [categoryId]: false }))
  }

  async function handleFullBackup() {
    const categories = ['players', 'coaches', 'payments', 'seasons', 'teams', 'registrations', 'events']
    const dateStr = new Date().toISOString().split('T')[0]
    const seasonSuffix = selectedSeasonId !== 'all' ? `_${seasons.find(s => s.id === selectedSeasonId)?.name?.replace(/\s+/g, '-') || 'season'}` : ''

    setProgress({ active: true, category: 'full-backup', step: 'Starting...', percent: 0 })

    try {
      if (exportFormat === 'json') {
        // JSON: single file with all data
        const backup = { exportType: 'full-backup', organization: activeOrg?.name, exportedAt: new Date().toISOString(), data: {} }
        for (let i = 0; i < categories.length; i++) {
          const cat = categories[i]
          const label = EXPORT_CATEGORIES.find(c => c.id === cat)?.label || cat
          setProgress({ active: true, category: 'full-backup', step: `Exporting ${label}...`, percent: Math.round(((i) / categories.length) * 100) })
          const { data } = await exportFunctions[cat](exportFormat)
          backup.data[cat] = data || []
        }
        setProgress({ active: true, category: 'full-backup', step: 'Building file...', percent: 95 })
        const json = JSON.stringify(backup, null, 2)
        triggerDownload(json, `volleybrain_${orgSlug}_full-backup${seasonSuffix}_${dateStr}.json`, 'json')
      } else {
        // CSV: export each table as separate download
        for (let i = 0; i < categories.length; i++) {
          const cat = categories[i]
          const label = EXPORT_CATEGORIES.find(c => c.id === cat)?.label || cat
          setProgress({ active: true, category: 'full-backup', step: `Exporting ${label}...`, percent: Math.round(((i) / categories.length) * 100) })
          const { headers, rows } = await exportFunctions[cat]('csv')
          if (rows && rows.length > 0) {
            const csv = buildCSV(headers, rows)
            triggerDownload(csv, `volleybrain_${orgSlug}_${cat}${seasonSuffix}_${dateStr}.csv`, 'csv')
            // Small delay between downloads so browser doesn't block them
            await new Promise(r => setTimeout(r, 500))
          }
        }
      }

      setProgress({ active: true, category: 'full-backup', step: 'Complete!', percent: 100 })
      setLastExports(prev => ({ ...prev, 'full-backup': new Date().toISOString() }))
      showToast('Full backup exported successfully', 'success')
    } catch (err) {
      console.error('Full backup error:', err)
      showToast('Backup failed: ' + err.message, 'error')
    }

    setTimeout(() => setProgress({ active: false, category: '', step: '', percent: 0 }), 2000)
    setExporting(prev => ({ ...prev, 'full-backup': false }))
  }

  // ═══════ COUNT FOR CATEGORY ═══════
  function getCount(catId) {
    if (catId === 'full-backup') {
      return Object.values(rowCounts).reduce((a, b) => a + b, 0)
    }
    return rowCounts[catId] ?? '...'
  }

  // ═══════ ACCESS GATE RENDER ═══════
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'} border rounded-2xl p-8 text-center max-w-md`}>
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className={`text-xl font-bold ${tc.text} mb-2`}>Access Denied</h2>
          <p className={tc.textMuted}>Only organization admins and platform super-admins can access data exports.</p>
        </div>
      </div>
    )
  }

  // ═══════ RENDER ═══════
  return (
    <>
      <style>{DE_STYLES}</style>
      <div className="space-y-6 max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="de-au" style={{ animationDelay: '.05s' }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className={`de-display text-3xl sm:text-4xl ${tc.text}`}>
                DATA EXPORT
              </h1>
              <p className={`de-label text-sm ${tc.textMuted} mt-1`}>
                Download your organization's data as CSV or JSON
              </p>
            </div>
            <button
              onClick={loadMetadata}
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm de-label transition ${
                isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10' : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Counts
            </button>
          </div>
        </div>

        {/* PLATFORM ADMIN ORG SELECTOR */}
        {isPlatformAdmin && (
          <div className="de-au" style={{ animationDelay: '.1s' }}>
            <div className={`de-glass rounded-2xl p-4 ${isDark ? '' : 'bg-white/80 border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5" style={{ color: accentColor }} />
                <span className={`de-label text-sm ${tc.text}`}>Platform Admin — Export for:</span>
                <div className="relative flex-1 max-w-xs">
                  <button
                    onClick={() => setShowOrgSelector(!showOrgSelector)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm transition ${
                      isDark ? 'bg-white/5 hover:bg-white/10 text-white border border-white/10' : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200'
                    }`}
                  >
                    <span className="truncate">{selectedOrg?.name || 'Select organization...'}</span>
                    <ChevronDown className="w-4 h-4 shrink-0" />
                  </button>
                  {showOrgSelector && (
                    <div className={`absolute top-full left-0 right-0 mt-1 rounded-xl border shadow-xl max-h-60 overflow-y-auto z-50 ${
                      isDark ? 'bg-slate-800 border-white/10' : 'bg-white border-slate-200'
                    }`}>
                      {allOrgs.map(org => (
                        <button
                          key={org.id}
                          onClick={() => { setSelectedOrgId(org.id); setShowOrgSelector(false) }}
                          className={`w-full text-left px-3 py-2 text-sm transition flex items-center gap-2 ${
                            org.id === selectedOrgId
                              ? isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-900'
                              : isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          {org.id === selectedOrgId && <Check className="w-3 h-3 shrink-0" style={{ color: accentColor }} />}
                          <span className="truncate">{org.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FILTERS */}
        <div className="de-au" style={{ animationDelay: '.15s' }}>
          <div className={`de-glass rounded-2xl p-4 ${isDark ? '' : 'bg-white/80 border-slate-200'}`}>
            <div className="flex flex-wrap items-center gap-4">
              {/* Season Filter */}
              <div className="flex items-center gap-2">
                <span className={`de-label text-xs ${tc.textMuted}`}>SEASON</span>
                <select
                  value={selectedSeasonId}
                  onChange={e => setSelectedSeasonId(e.target.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                    isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="all">All Seasons</option>
                  {seasons.map(s => (
                    <option key={s.id} value={s.id}>{s.name} {s.status !== 'active' ? `(${s.status})` : ''}</option>
                  ))}
                </select>
              </div>

              {/* Format Selector */}
              <div className="flex items-center gap-2">
                <span className={`de-label text-xs ${tc.textMuted}`}>FORMAT</span>
                <div className={`flex rounded-lg border overflow-hidden ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                  {['csv', 'json'].map(fmt => (
                    <button
                      key={fmt}
                      onClick={() => setExportFormat(fmt)}
                      className={`px-3 py-1.5 text-sm de-label transition ${
                        exportFormat === fmt
                          ? `text-white`
                          : isDark ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-white text-slate-500 hover:bg-slate-50'
                      }`}
                      style={exportFormat === fmt ? { backgroundColor: accentColor } : {}}
                    >
                      {fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div className={`ml-auto flex items-center gap-2 text-xs ${tc.textMuted}`}>
                <FileText className="w-3.5 h-3.5" />
                <span className="de-label">Data scoped to {activeOrg?.name || 'your organization'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* PROGRESS BAR */}
        {progress.active && (
          <div className="de-as">
            <div className={`de-glass rounded-2xl p-4 ${isDark ? '' : 'bg-white/80 border-slate-200'}`}>
              <div className="flex items-center gap-3 mb-2">
                <RefreshCw className="w-4 h-4 animate-spin" style={{ color: accentColor }} />
                <span className={`de-label text-sm ${tc.text}`}>{progress.step}</span>
                <span className={`ml-auto de-label text-sm ${tc.textMuted}`}>{progress.percent}%</span>
              </div>
              <div className={`w-full h-2 rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress.percent}%`, backgroundColor: accentColor }}
                />
              </div>
            </div>
          </div>
        )}

        {/* EXPORT CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {EXPORT_CATEGORIES.map((cat, i) => {
            const IconComp = cat.icon
            const count = getCount(cat.id)
            const isExporting = exporting[cat.id]
            const lastExport = lastExports[cat.id]
            const isFullBackup = cat.id === 'full-backup'

            return (
              <div
                key={cat.id}
                className={`de-au ${isFullBackup ? 'md:col-span-2' : ''}`}
                style={{ animationDelay: `${0.2 + i * 0.05}s` }}
              >
                <div className={`de-glass rounded-2xl p-5 transition group ${
                  isDark
                    ? 'hover:bg-white/[.06]'
                    : 'bg-white/80 border-slate-200 hover:bg-white'
                } ${isFullBackup ? 'border-2' : ''}`}
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
                        <h3 className={`de-heading text-base ${tc.text}`}>{cat.label}</h3>
                        {isFullBackup && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] de-label" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                            ALL DATA
                          </span>
                        )}
                      </div>
                      <p className={`text-xs ${tc.textMuted} mb-3`}>{cat.description}</p>

                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Row count */}
                        <span className={`text-xs de-label ${tc.textMuted}`}>
                          {loading ? (
                            <span className="de-pulse">Counting...</span>
                          ) : (
                            `${typeof count === 'number' ? count.toLocaleString() : count} rows`
                          )}
                        </span>

                        {/* Last export */}
                        {lastExport && (
                          <span className={`text-[10px] ${tc.textMuted} flex items-center gap-1`}>
                            <Clock className="w-3 h-3" />
                            Last: {new Date(lastExport).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Export Button */}
                    <button
                      onClick={() => handleExport(cat.id)}
                      disabled={isExporting || loading || (count === 0 && !isFullBackup)}
                      className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm de-label transition-all ${
                        isExporting
                          ? 'opacity-60 cursor-not-allowed'
                          : count === 0 && !isFullBackup
                            ? 'opacity-30 cursor-not-allowed'
                            : 'hover:scale-[1.02] active:scale-[0.98]'
                      }`}
                      style={{
                        backgroundColor: isExporting || (count === 0 && !isFullBackup) ? (isDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.05)') : `${cat.color}15`,
                        color: isExporting || (count === 0 && !isFullBackup) ? (isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.3)') : cat.color,
                        borderWidth: 1,
                        borderColor: isExporting || (count === 0 && !isFullBackup) ? 'transparent' : `${cat.color}30`,
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
        <div className="de-au" style={{ animationDelay: '.6s' }}>
          <div className={`flex items-start gap-3 rounded-xl p-4 ${isDark ? 'bg-amber-500/5 border border-amber-500/10' : 'bg-amber-50 border border-amber-200'}`}>
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className={`text-xs de-label ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>Data Privacy Notice</p>
              <p className={`text-xs mt-1 ${isDark ? 'text-amber-300/70' : 'text-amber-600'}`}>
                Exported data may contain sensitive personal information including names, emails, phone numbers, and medical notes.
                Handle downloaded files securely and in compliance with your organization's data policies.
              </p>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}

export { DataExportPage }
