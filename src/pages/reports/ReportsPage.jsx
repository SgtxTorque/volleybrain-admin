import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useSport } from '../../contexts/SportContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { 
  Users, DollarSign, Calendar, BarChart3, Download, Filter, Settings,
  ChevronDown, ChevronUp, Search, FileText, PieChart, Check, X
} from '../../constants/icons'
import { Icon } from '../../components/ui'

function ReportsPage({ showToast }) {
  const tc = useThemeClasses()
  const { isDark, accent } = useTheme()
  const { selectedSeason: globalSeason } = useSeason()
  const { selectedSport: globalSport } = useSport()
  const { organization, user, profile } = useAuth()
  
  // Independent season/sport selection for reports
  const [seasons, setSeasons] = useState([])
  const [sports, setSports] = useState([])
  const [selectedSeasonId, setSelectedSeasonId] = useState(null)
  const [selectedSportId, setSelectedSportId] = useState('all')
  
  // Report state
  const [activeCategory, setActiveCategory] = useState('people')
  const [activeReport, setActiveReport] = useState('players')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [stats, setStats] = useState({})
  
  // Filter state
  const [filters, setFilters] = useState({
    team: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    search: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  
  // Sort state
  const [sortField, setSortField] = useState('')
  const [sortDir, setSortDir] = useState('asc')
  
  // Column customization
  const [showColumnPicker, setShowColumnPicker] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState({})
  const [columnOrder, setColumnOrder] = useState([])
  
  // Saved presets
  const [savedPresets, setSavedPresets] = useState([])
  const [showPresetModal, setShowPresetModal] = useState(false)
  const [presetName, setPresetName] = useState('')
  
  // Export state
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [exporting, setExporting] = useState(false)
  
  // Available teams for filter
  const [teams, setTeams] = useState([])
  
  // Category dropdown states
  const [openDropdown, setOpenDropdown] = useState(null)
  
  // Report categories and types
  const reportCategories = {
    people: {
      label: 'People',
      icon: 'users',
      reports: [
        { id: 'players', label: 'Player Roster', icon: 'users', description: 'All players with contact info' },
        { id: 'teams', label: 'Team Composition', icon: 'volleyball', description: 'Teams with roster counts' },
        { id: 'coaches', label: 'Coach Directory', icon: 'user-cog', description: 'All coaches and assignments' },
        { id: 'emergency', label: 'Emergency Contacts', icon: '🚨', description: 'Emergency contact list' },
        { id: 'jerseys', label: 'Jersey Assignment', icon: 'shirt', description: 'Jersey numbers and sizes' },
      ]
    },
    financial: {
      label: 'Financial',
      icon: 'dollar',
      reports: [
        { id: 'payments', label: 'Payment Summary', icon: 'dollar', description: 'Payment status by player' },
        { id: 'financial', label: 'Financial Overview', icon: 'bar-chart', description: 'Revenue and collections' },
        { id: 'outstanding', label: 'Outstanding Balances', icon: '⚠️', description: 'Unpaid balances' },
      ]
    },
    operations: {
      label: 'Operations',
      icon: 'calendar',
      reports: [
        { id: 'attendance', label: 'Attendance Report', icon: 'check-square', description: 'RSVP and attendance rates' },
        { id: 'registrations', label: 'Registration Report', icon: 'clipboard', description: 'Registration pipeline' },
        { id: 'volunteers', label: 'Volunteer Report', icon: '🙋', description: 'Volunteer participation' },
      ]
    },
  }
  
  // Load seasons and sports on mount
  useEffect(() => {
    loadSeasonsAndSports()
    loadSavedPresets()
  }, [organization?.id])
  
  // Set default season from global context
  useEffect(() => {
    if (globalSeason?.id && !selectedSeasonId) {
      setSelectedSeasonId(globalSeason.id)
    }
  }, [globalSeason?.id])
  
  // Set default sport from global context  
  useEffect(() => {
    if (globalSport?.id && selectedSportId === 'all') {
      setSelectedSportId(globalSport.id)
    }
  }, [globalSport?.id])
  
  // Load teams when season changes
  useEffect(() => {
    if (selectedSeasonId) {
      loadTeams()
    }
  }, [selectedSeasonId])
  
  // Load report data when relevant state changes
  useEffect(() => {
    if (selectedSeasonId) {
      loadReportData()
    }
  }, [selectedSeasonId, selectedSportId, activeReport, filters])
  
  // Initialize visible columns when report changes
  useEffect(() => {
    const cols = getAvailableColumns()
    const defaultVisible = {}
    const order = []
    cols.forEach(col => {
      defaultVisible[col.id] = col.defaultVisible !== false
      order.push(col.id)
    })
    setVisibleColumns(defaultVisible)
    setColumnOrder(order)
  }, [activeReport])
  
  async function loadSeasonsAndSports() {
    if (!organization?.id) return
    
    // Load all seasons (not just active)
    const { data: seasonData } = await supabase
      .from('seasons')
      .select('id, name, status, start_date, sport_id')
      .eq('organization_id', organization.id)
      .order('start_date', { ascending: false })
    
    setSeasons(seasonData || [])
    
    // Load sports
    const { data: sportData } = await supabase
      .from('sports')
      .select('id, name, icon')
      .eq('organization_id', organization.id)
      .order('name')
    
    setSports(sportData || [])
  }
  
  async function loadTeams() {
    const { data } = await supabase
      .from('teams')
      .select('id, name, color')
      .eq('season_id', selectedSeasonId)
      .order('name')
    setTeams(data || [])
  }
  
  function loadSavedPresets() {
    const saved = localStorage.getItem(`vb_report_presets_${organization?.id}`)
    if (saved) {
      setSavedPresets(JSON.parse(saved))
    }
  }
  
  function savePreset() {
    if (!presetName.trim()) return
    
    const preset = {
      id: Date.now(),
      name: presetName,
      category: activeCategory,
      report: activeReport,
      visibleColumns: { ...visibleColumns },
      columnOrder: [...columnOrder],
      filters: { ...filters },
      createdAt: new Date().toISOString()
    }
    
    const updated = [...savedPresets, preset]
    setSavedPresets(updated)
    localStorage.setItem(`vb_report_presets_${organization?.id}`, JSON.stringify(updated))
    
    setPresetName('')
    setShowPresetModal(false)
    showToast('Report preset saved!', 'success')
  }
  
  function loadPreset(preset) {
    setActiveCategory(preset.category)
    setActiveReport(preset.report)
    setVisibleColumns(preset.visibleColumns)
    setColumnOrder(preset.columnOrder)
    setFilters(preset.filters)
    showToast(`Loaded preset: ${preset.name}`, 'success')
  }
  
  function deletePreset(presetId) {
    const updated = savedPresets.filter(p => p.id !== presetId)
    setSavedPresets(updated)
    localStorage.setItem(`vb_report_presets_${organization?.id}`, JSON.stringify(updated))
    showToast('Preset deleted', 'success')
  }
  
  async function loadReportData() {
    setLoading(true)
    
    try {
      switch (activeReport) {
        case 'players':
          await loadPlayersReport()
          break
        case 'teams':
          await loadTeamsReport()
          break
        case 'payments':
          await loadPaymentsReport()
          break
        case 'outstanding':
          await loadOutstandingReport()
          break
        case 'attendance':
          await loadAttendanceReport()
          break
        case 'registrations':
          await loadRegistrationsReport()
          break
        case 'financial':
          await loadFinancialReport()
          break
        case 'jerseys':
          await loadJerseysReport()
          break
        case 'coaches':
          await loadCoachesReport()
          break
        case 'emergency':
          await loadEmergencyReport()
          break
        case 'volunteers':
          await loadVolunteersReport()
          break
      }
    } catch (err) {
      console.error('Error loading report:', err)
      showToast('Error loading report', 'error')
    }
    
    setLoading(false)
  }
  
  // Get selected season object
  const getSelectedSeason = () => seasons.find(s => s.id === selectedSeasonId)
  
  // ========== REPORT LOADERS ==========
  
  async function loadPlayersReport() {
    // Query ALL players for selected season, no joins that might filter
    const { data, error } = await supabase
      .from('players')
      .select(`
        id, first_name, last_name, email, phone, grade, position,
        jersey_number, uniform_size_jersey, status, photo_url,
        parent_name, parent_email, parent_phone, parent_phone_secondary,
        date_of_birth, school, medical_notes, allergies,
        created_at, updated_at
      `)
      .eq('season_id', selectedSeasonId)
      .order('last_name')
    
    if (error) {
      console.error('Players query error:', error)
      setData([])
      return
    }
    
    // Get team assignments separately
    const { data: teamAssignments } = await supabase
      .from('team_players')
      .select('player_id, teams (id, name, color)')
      .in('player_id', (data || []).map(p => p.id))
    
    // Create lookup map
    const teamMap = {}
    ;(teamAssignments || []).forEach(ta => {
      if (!teamMap[ta.player_id]) teamMap[ta.player_id] = []
      if (ta.teams) teamMap[ta.player_id].push(ta.teams)
    })
    
    // Transform data
    const transformed = (data || []).map(p => ({
      ...p,
      full_name: `${p.first_name} ${p.last_name}`,
      team_name: teamMap[p.id]?.[0]?.name || 'Unassigned',
      team_color: teamMap[p.id]?.[0]?.color || '#666',
      teams_list: teamMap[p.id]?.map(t => t.name).join(', ') || 'Unassigned',
      age: p.date_of_birth ? Math.floor((new Date() - new Date(p.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000)) : null
    }))
    
    // Apply filters
    let filtered = transformed
    if (filters.team !== 'all') {
      filtered = filtered.filter(p => teamMap[p.id]?.some(t => t.id === filters.team))
    }
    if (filters.status !== 'all') {
      filtered = filtered.filter(p => p.status === filters.status)
    }
    if (filters.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter(p => 
        p.full_name.toLowerCase().includes(search) ||
        p.parent_name?.toLowerCase().includes(search) ||
        p.parent_email?.toLowerCase().includes(search)
      )
    }
    
    setData(filtered)
    
    // Calculate stats
    setStats({
      total: filtered.length,
      active: filtered.filter(p => p.status === 'active').length,
      unassigned: filtered.filter(p => p.team_name === 'Unassigned').length,
      missingContact: filtered.filter(p => !p.parent_email && !p.parent_phone).length,
      labels: ['Total Players', 'Active', 'Unassigned', 'Missing Contact']
    })
  }
  
  async function loadTeamsReport() {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        id, name, color, age_group, team_type, skill_level, gender,
        max_roster_size, min_roster_size, roster_open, created_at, description
      `)
      .eq('season_id', selectedSeasonId)
      .order('name')
    
    if (error) {
      console.error('Teams query error:', error)
      setData([])
      return
    }
    
    // Get player counts
    const { data: playerCounts } = await supabase
      .from('team_players')
      .select('team_id')
      .in('team_id', (data || []).map(t => t.id))
    
    // Get coach assignments
    const { data: coachAssignments } = await supabase
      .from('coach_assignments')
      .select('team_id, coaches (first_name, last_name, role)')
      .in('team_id', (data || []).map(t => t.id))
    
    // Count players per team
    const countMap = {}
    ;(playerCounts || []).forEach(pc => {
      countMap[pc.team_id] = (countMap[pc.team_id] || 0) + 1
    })
    
    // Map coaches to teams
    const coachMap = {}
    ;(coachAssignments || []).forEach(ca => {
      if (!coachMap[ca.team_id]) coachMap[ca.team_id] = []
      if (ca.coaches) coachMap[ca.team_id].push(ca.coaches)
    })
    
    const transformed = (data || []).map(t => ({
      ...t,
      player_count: countMap[t.id] || 0,
      coach_count: coachMap[t.id]?.length || 0,
      head_coach: coachMap[t.id]?.find(c => c.role === 'head_coach')?.first_name || 
                  coachMap[t.id]?.[0]?.first_name || '-',
      coaches_list: coachMap[t.id]?.map(c => `${c.first_name} ${c.last_name}`).join(', ') || 'None',
      roster_status: (countMap[t.id] || 0) >= (t.min_roster_size || 6) ? 'Ready' : 'Need Players',
      roster_fill: t.max_roster_size ? Math.round(((countMap[t.id] || 0) / t.max_roster_size) * 100) : 0
    }))
    
    setData(transformed)
    
    const total = transformed.length
    const ready = transformed.filter(t => t.roster_status === 'Ready').length
    const needPlayers = transformed.filter(t => t.roster_status === 'Need Players').length
    const totalPlayers = transformed.reduce((sum, t) => sum + t.player_count, 0)
    
    setStats({
      total,
      ready,
      needPlayers,
      totalPlayers,
      labels: ['Total Teams', 'Ready', 'Need Players', 'Total Players']
    })
  }
  
  async function loadPaymentsReport() {
    // Get all players for season
    const { data: players } = await supabase
      .from('players')
      .select('id, first_name, last_name, parent_name, parent_email')
      .eq('season_id', selectedSeasonId)
      .order('last_name')
    
    // Get all payments
    const { data: payments } = await supabase
      .from('payments')
      .select('id, player_id, amount, paid, paid_at, payment_method, description')
      .eq('season_id', selectedSeasonId)
    
    // Group payments by player
    const paymentMap = {}
    ;(payments || []).forEach(p => {
      if (!paymentMap[p.player_id]) paymentMap[p.player_id] = []
      paymentMap[p.player_id].push(p)
    })
    
    const transformed = (players || []).map(p => {
      const playerPayments = paymentMap[p.id] || []
      const totalDue = playerPayments.reduce((sum, pay) => sum + (pay.amount || 0), 0)
      const totalPaid = playerPayments.filter(pay => pay.paid).reduce((sum, pay) => sum + (pay.amount || 0), 0)
      const balance = totalDue - totalPaid
      
      return {
        ...p,
        full_name: `${p.first_name} ${p.last_name}`,
        total_due: totalDue,
        total_paid: totalPaid,
        balance: balance,
        payment_status: totalDue === 0 ? 'No Fees' : balance === 0 ? 'Paid' : balance < totalDue ? 'Partial' : 'Unpaid',
        payment_count: playerPayments.length,
        last_payment: playerPayments.filter(pay => pay.paid).sort((a, b) => 
          new Date(b.paid_at) - new Date(a.paid_at)
        )[0]?.paid_at || null
      }
    })
    
    // Apply filters
    let filtered = transformed
    if (filters.status === 'paid') {
      filtered = filtered.filter(p => p.payment_status === 'Paid')
    } else if (filters.status === 'unpaid') {
      filtered = filtered.filter(p => p.payment_status === 'Unpaid')
    } else if (filters.status === 'partial') {
      filtered = filtered.filter(p => p.payment_status === 'Partial')
    }
    if (filters.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter(p => p.full_name.toLowerCase().includes(search))
    }
    
    setData(filtered)
    
    const totalRevenue = transformed.reduce((sum, p) => sum + p.total_due, 0)
    const collected = transformed.reduce((sum, p) => sum + p.total_paid, 0)
    const outstanding = totalRevenue - collected
    const collectionRate = totalRevenue > 0 ? Math.round((collected / totalRevenue) * 100) : 0
    
    setStats({
      totalRevenue,
      collected,
      outstanding,
      collectionRate,
      labels: ['Total Due', 'Collected', 'Outstanding', 'Collection Rate']
    })
  }
  
  async function loadOutstandingReport() {
    // Get players with unpaid balances
    const { data: players } = await supabase
      .from('players')
      .select('id, first_name, last_name, parent_name, parent_email, parent_phone')
      .eq('season_id', selectedSeasonId)
    
    const { data: payments } = await supabase
      .from('payments')
      .select('id, player_id, amount, paid, description, created_at')
      .eq('season_id', selectedSeasonId)
    
    const paymentMap = {}
    ;(payments || []).forEach(p => {
      if (!paymentMap[p.player_id]) paymentMap[p.player_id] = []
      paymentMap[p.player_id].push(p)
    })
    
    const transformed = (players || []).map(p => {
      const playerPayments = paymentMap[p.id] || []
      const totalDue = playerPayments.reduce((sum, pay) => sum + (pay.amount || 0), 0)
      const totalPaid = playerPayments.filter(pay => pay.paid).reduce((sum, pay) => sum + (pay.amount || 0), 0)
      const balance = totalDue - totalPaid
      const unpaidItems = playerPayments.filter(pay => !pay.paid)
      
      return {
        ...p,
        full_name: `${p.first_name} ${p.last_name}`,
        total_due: totalDue,
        total_paid: totalPaid,
        balance: balance,
        unpaid_items: unpaidItems.map(u => u.description).join(', ') || '-',
        days_outstanding: unpaidItems.length > 0 ? 
          Math.floor((new Date() - new Date(Math.min(...unpaidItems.map(u => new Date(u.created_at))))) / (1000 * 60 * 60 * 24)) : 0
      }
    }).filter(p => p.balance > 0)
    
    setData(transformed.sort((a, b) => b.balance - a.balance))
    
    const totalOutstanding = transformed.reduce((sum, p) => sum + p.balance, 0)
    const playerCount = transformed.length
    const avgBalance = playerCount > 0 ? Math.round(totalOutstanding / playerCount) : 0
    const over30Days = transformed.filter(p => p.days_outstanding > 30).length
    
    setStats({
      totalOutstanding,
      playerCount,
      avgBalance,
      over30Days,
      labels: ['Total Outstanding', 'Players with Balance', 'Avg Balance', 'Over 30 Days']
    })
  }
  
  async function loadAttendanceReport() {
    // Get all players
    const { data: players } = await supabase
      .from('players')
      .select('id, first_name, last_name')
      .eq('season_id', selectedSeasonId)
    
    // Get events
    const { data: events } = await supabase
      .from('events')
      .select('id, title, event_type, start_time')
      .eq('season_id', selectedSeasonId)
      .in('event_type', ['practice', 'game'])
      .order('start_time', { ascending: false })
      .limit(50)
    
    // Get RSVPs
    const { data: rsvps } = await supabase
      .from('rsvps')
      .select('id, player_id, event_id, status')
      .in('event_id', (events || []).map(e => e.id))
    
    // Group RSVPs by player
    const rsvpMap = {}
    ;(rsvps || []).forEach(r => {
      if (!rsvpMap[r.player_id]) rsvpMap[r.player_id] = []
      rsvpMap[r.player_id].push(r)
    })
    
    const eventCount = events?.length || 0
    
    const playerAttendance = (players || []).map(player => {
      const playerRsvps = rsvpMap[player.id] || []
      const attending = playerRsvps.filter(r => r.status === 'attending').length
      const notAttending = playerRsvps.filter(r => r.status === 'not_attending').length
      const noResponse = eventCount - attending - notAttending
      const rate = eventCount > 0 ? Math.round((attending / eventCount) * 100) : 0
      
      return {
        ...player,
        full_name: `${player.first_name} ${player.last_name}`,
        events_total: eventCount,
        attending,
        not_attending: notAttending,
        no_response: noResponse,
        attendance_rate: rate
      }
    })
    
    setData(playerAttendance.sort((a, b) => b.attendance_rate - a.attendance_rate))
    
    const avgRate = playerAttendance.length > 0 
      ? Math.round(playerAttendance.reduce((sum, p) => sum + p.attendance_rate, 0) / playerAttendance.length)
      : 0
    const perfect = playerAttendance.filter(p => p.attendance_rate === 100).length
    const low = playerAttendance.filter(p => p.attendance_rate < 50).length
    
    setStats({
      totalEvents: eventCount,
      avgRate,
      perfect,
      low,
      labels: ['Events Tracked', 'Avg Attendance', 'Perfect Attendance', 'Below 50%']
    })
  }
  
  async function loadRegistrationsReport() {
    // Get ALL players, including those without registration records
    const { data: players } = await supabase
      .from('players')
      .select(`
        id, first_name, last_name, parent_name, parent_email, parent_phone,
        status, created_at
      `)
      .eq('season_id', selectedSeasonId)
      .order('created_at', { ascending: false })
    
    // Get registration records separately
    const { data: registrations } = await supabase
      .from('registrations')
      .select('id, player_id, status, submitted_at, approved_at, denied_at, deny_reason')
      .in('player_id', (players || []).map(p => p.id))
    
    // Map registrations to players
    const regMap = {}
    ;(registrations || []).forEach(r => {
      regMap[r.player_id] = r
    })
    
    const transformed = (players || []).map(p => {
      const reg = regMap[p.id]
      return {
        ...p,
        full_name: `${p.first_name} ${p.last_name}`,
        reg_status: reg?.status || p.status || 'manual',
        registration_type: reg ? 'Online' : 'Manual Entry',
        submitted_at: reg?.submitted_at || p.created_at,
        approved_at: reg?.approved_at,
        denied_at: reg?.denied_at,
        deny_reason: reg?.deny_reason
      }
    })
    
    let filtered = transformed
    if (filters.status !== 'all') {
      filtered = filtered.filter(p => p.reg_status === filters.status)
    }
    if (filters.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter(p => 
        p.full_name.toLowerCase().includes(search) ||
        p.parent_name?.toLowerCase().includes(search)
      )
    }
    
    setData(filtered)
    
    const total = transformed.length
    const pending = transformed.filter(p => ['pending', 'submitted'].includes(p.reg_status)).length
    const approved = transformed.filter(p => ['approved', 'active'].includes(p.reg_status)).length
    const manual = transformed.filter(p => p.registration_type === 'Manual Entry').length
    
    setStats({
      total,
      pending,
      approved,
      manual,
      labels: ['Total', 'Pending', 'Approved', 'Manual Entry']
    })
  }
  
  async function loadFinancialReport() {
    const { data: payments } = await supabase
      .from('payments')
      .select(`
        id, amount, paid, paid_at, payment_method, description, created_at,
        players (first_name, last_name)
      `)
      .eq('season_id', selectedSeasonId)
      .order('created_at', { ascending: false })
    
    const transformed = (payments || []).map(p => ({
      ...p,
      player_name: p.players ? `${p.players.first_name} ${p.players.last_name}` : 'Unknown',
      status: p.paid ? 'Paid' : 'Pending'
    }))
    
    // Apply filters
    let filtered = transformed
    if (filters.dateFrom) {
      filtered = filtered.filter(p => new Date(p.created_at) >= new Date(filters.dateFrom))
    }
    if (filters.dateTo) {
      filtered = filtered.filter(p => new Date(p.created_at) <= new Date(filters.dateTo))
    }
    if (filters.status === 'paid') {
      filtered = filtered.filter(p => p.paid)
    } else if (filters.status === 'unpaid') {
      filtered = filtered.filter(p => !p.paid)
    }
    
    setData(filtered)
    
    const totalExpected = transformed.reduce((sum, p) => sum + (p.amount || 0), 0)
    const collected = transformed.filter(p => p.paid).reduce((sum, p) => sum + (p.amount || 0), 0)
    const pending = totalExpected - collected
    
    setStats({
      totalExpected,
      collected,
      pending,
      transactionCount: transformed.length,
      labels: ['Expected Revenue', 'Collected', 'Pending', 'Transactions']
    })
  }
  
  async function loadJerseysReport() {
    const { data: players } = await supabase
      .from('players')
      .select('id, first_name, last_name, jersey_number, uniform_size_jersey')
      .eq('season_id', selectedSeasonId)
      .order('jersey_number', { nullsFirst: false })
    
    // Get team assignments
    const { data: teamAssignments } = await supabase
      .from('team_players')
      .select('player_id, teams (id, name, color)')
      .in('player_id', (players || []).map(p => p.id))
    
    const teamMap = {}
    ;(teamAssignments || []).forEach(ta => {
      if (ta.teams) teamMap[ta.player_id] = ta.teams
    })
    
    const transformed = (players || []).map(p => ({
      ...p,
      full_name: `${p.first_name} ${p.last_name}`,
      team_name: teamMap[p.id]?.name || 'Unassigned',
      team_color: teamMap[p.id]?.color || '#666',
      has_jersey: !!p.jersey_number,
      has_size: !!p.uniform_size_jersey
    }))
    
    let filtered = transformed
    if (filters.team !== 'all') {
      filtered = filtered.filter(p => teamMap[p.id]?.id === filters.team)
    }
    
    setData(filtered)
    
    const total = filtered.length
    const assigned = filtered.filter(p => p.has_jersey).length
    const missingNumber = filtered.filter(p => !p.has_jersey).length
    const missingSize = filtered.filter(p => !p.has_size).length
    
    setStats({
      total,
      assigned,
      missingNumber,
      missingSize,
      labels: ['Total Players', 'Jersey Assigned', 'Missing Number', 'Missing Size']
    })
  }
  
  async function loadCoachesReport() {
    const { data } = await supabase
      .from('coaches')
      .select('id, first_name, last_name, email, phone, role, background_check_status, background_check_date, certifications')
      .eq('organization_id', organization?.id)
      .order('last_name')
    
    // Get team assignments
    const { data: assignments } = await supabase
      .from('coach_assignments')
      .select('coach_id, teams (id, name, season_id)')
      .in('coach_id', (data || []).map(c => c.id))
    
    const assignMap = {}
    ;(assignments || []).forEach(a => {
      if (!assignMap[a.coach_id]) assignMap[a.coach_id] = []
      if (a.teams) assignMap[a.coach_id].push(a.teams)
    })
    
    const transformed = (data || []).map(c => {
      const coachTeams = assignMap[c.id] || []
      const seasonTeams = coachTeams.filter(t => t.season_id === selectedSeasonId)
      
      return {
        ...c,
        full_name: `${c.first_name} ${c.last_name}`,
        team_count: seasonTeams.length,
        teams_list: seasonTeams.map(t => t.name).join(', ') || 'None',
        all_teams_list: coachTeams.map(t => t.name).join(', ') || 'None',
        bg_check_status: c.background_check_status || 'Not Submitted'
      }
    })
    
    setData(transformed)
    
    const total = transformed.length
    const headCoaches = transformed.filter(c => c.role === 'head_coach').length
    const assistants = transformed.filter(c => c.role === 'assistant').length
    const bgCleared = transformed.filter(c => c.background_check_status === 'cleared').length
    
    setStats({
      total,
      headCoaches,
      assistants,
      bgCleared,
      labels: ['Total Coaches', 'Head Coaches', 'Assistants', 'BG Cleared']
    })
  }
  
  async function loadEmergencyReport() {
    const { data: players } = await supabase
      .from('players')
      .select(`
        id, first_name, last_name,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
        parent_name, parent_phone, parent_email,
        medical_notes, allergies
      `)
      .eq('season_id', selectedSeasonId)
      .order('last_name')
    
    // Get team assignments
    const { data: teamAssignments } = await supabase
      .from('team_players')
      .select('player_id, teams (name)')
      .in('player_id', (players || []).map(p => p.id))
    
    const teamMap = {}
    ;(teamAssignments || []).forEach(ta => {
      if (ta.teams) teamMap[ta.player_id] = ta.teams.name
    })
    
    const transformed = (players || []).map(p => ({
      ...p,
      full_name: `${p.first_name} ${p.last_name}`,
      team_name: teamMap[p.id] || 'Unassigned',
      has_emergency: !!p.emergency_contact_name && !!p.emergency_contact_phone,
      has_medical: !!p.medical_notes || !!p.allergies
    }))
    
    setData(transformed)
    
    const total = transformed.length
    const complete = transformed.filter(p => p.has_emergency).length
    const missing = transformed.filter(p => !p.has_emergency).length
    const hasMedical = transformed.filter(p => p.has_medical).length
    
    setStats({
      total,
      complete,
      missing,
      hasMedical,
      labels: ['Total Players', 'Complete Info', 'Missing Emergency', 'Has Medical Notes']
    })
  }
  
  async function loadVolunteersReport() {
    const { data: events } = await supabase
      .from('events')
      .select(`
        id, title, start_time,
        event_volunteers (
          id, role, status,
          profiles (id, full_name, email)
        )
      `)
      .eq('season_id', selectedSeasonId)
      .order('start_time', { ascending: false })
      .limit(100)
    
    // Aggregate by volunteer
    const volunteerMap = {}
    ;(events || []).forEach(event => {
      (event.event_volunteers || []).forEach(v => {
        if (!v.profiles) return
        const id = v.profiles.id
        if (!volunteerMap[id]) {
          volunteerMap[id] = {
            id,
            full_name: v.profiles.full_name,
            email: v.profiles.email,
            total_signups: 0,
            roles: {}
          }
        }
        volunteerMap[id].total_signups++
        const role = v.role || 'General'
        volunteerMap[id].roles[role] = (volunteerMap[id].roles[role] || 0) + 1
      })
    })
    
    const transformed = Object.values(volunteerMap).map(v => ({
      ...v,
      top_role: Object.entries(v.roles).sort((a, b) => b[1] - a[1])[0]?.[0] || '-',
      roles_list: Object.entries(v.roles).map(([r, c]) => `${r}: ${c}`).join(', ')
    }))
    
    setData(transformed.sort((a, b) => b.total_signups - a.total_signups))
    
    const totalVolunteers = transformed.length
    const totalSignups = transformed.reduce((sum, v) => sum + v.total_signups, 0)
    const topVolunteer = transformed[0]?.full_name || '-'
    const eventsWithVols = (events || []).filter(e => e.event_volunteers?.length > 0).length
    
    setStats({
      totalVolunteers,
      totalSignups,
      topVolunteer,
      eventsWithVols,
      labels: ['Total Volunteers', 'Total Signups', 'Top Volunteer', 'Events Covered']
    })
  }
  
  // ========== COLUMN DEFINITIONS ==========
  
  const getAvailableColumns = () => {
    switch (activeReport) {
      case 'players':
        return [
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
      case 'teams':
        return [
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
          { id: 'description', label: 'Description', sortable: false, defaultVisible: false },
        ]
      case 'payments':
        return [
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
      case 'outstanding':
        return [
          { id: 'full_name', label: 'Player', sortable: true, defaultVisible: true },
          { id: 'parent_name', label: 'Parent', sortable: true, defaultVisible: true },
          { id: 'parent_email', label: 'Email', sortable: false, defaultVisible: true },
          { id: 'parent_phone', label: 'Phone', sortable: false, defaultVisible: true },
          { id: 'balance', label: 'Balance Due', sortable: true, defaultVisible: true, format: 'currency' },
          { id: 'unpaid_items', label: 'Unpaid Items', sortable: false, defaultVisible: true },
          { id: 'days_outstanding', label: 'Days Outstanding', sortable: true, defaultVisible: true },
        ]
      case 'attendance':
        return [
          { id: 'full_name', label: 'Player', sortable: true, defaultVisible: true },
          { id: 'events_total', label: 'Events', sortable: true, defaultVisible: true },
          { id: 'attending', label: 'Attending', sortable: true, defaultVisible: true },
          { id: 'not_attending', label: 'Not Attending', sortable: true, defaultVisible: true },
          { id: 'no_response', label: 'No Response', sortable: true, defaultVisible: true },
          { id: 'attendance_rate', label: 'Rate', sortable: true, defaultVisible: true, format: 'percent' },
        ]
      case 'registrations':
        return [
          { id: 'full_name', label: 'Player', sortable: true, defaultVisible: true },
          { id: 'parent_name', label: 'Parent', sortable: true, defaultVisible: true },
          { id: 'parent_email', label: 'Email', sortable: false, defaultVisible: true },
          { id: 'parent_phone', label: 'Phone', sortable: false, defaultVisible: false },
          { id: 'registration_type', label: 'Type', sortable: true, defaultVisible: true },
          { id: 'reg_status', label: 'Status', sortable: true, defaultVisible: true },
          { id: 'submitted_at', label: 'Submitted', sortable: true, defaultVisible: true, format: 'date' },
          { id: 'approved_at', label: 'Approved', sortable: true, defaultVisible: false, format: 'date' },
        ]
      case 'financial':
        return [
          { id: 'player_name', label: 'Player', sortable: true, defaultVisible: true },
          { id: 'description', label: 'Description', sortable: true, defaultVisible: true },
          { id: 'amount', label: 'Amount', sortable: true, defaultVisible: true, format: 'currency' },
          { id: 'status', label: 'Status', sortable: true, defaultVisible: true },
          { id: 'payment_method', label: 'Method', sortable: true, defaultVisible: true },
          { id: 'paid_at', label: 'Paid Date', sortable: true, defaultVisible: true, format: 'date' },
          { id: 'created_at', label: 'Created', sortable: true, defaultVisible: false, format: 'date' },
        ]
      case 'jerseys':
        return [
          { id: 'jersey_number', label: 'Jersey #', sortable: true, defaultVisible: true },
          { id: 'full_name', label: 'Player', sortable: true, defaultVisible: true },
          { id: 'team_name', label: 'Team', sortable: true, defaultVisible: true },
          { id: 'uniform_size_jersey', label: 'Size', sortable: true, defaultVisible: true },
        ]
      case 'coaches':
        return [
          { id: 'full_name', label: 'Coach', sortable: true, defaultVisible: true },
          { id: 'role', label: 'Role', sortable: true, defaultVisible: true },
          { id: 'email', label: 'Email', sortable: false, defaultVisible: true },
          { id: 'phone', label: 'Phone', sortable: false, defaultVisible: true },
          { id: 'teams_list', label: 'Teams (This Season)', sortable: false, defaultVisible: true },
          { id: 'all_teams_list', label: 'All Teams', sortable: false, defaultVisible: false },
          { id: 'bg_check_status', label: 'BG Check', sortable: true, defaultVisible: true },
          { id: 'background_check_date', label: 'BG Check Date', sortable: true, defaultVisible: false, format: 'date' },
        ]
      case 'emergency':
        return [
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
      case 'volunteers':
        return [
          { id: 'full_name', label: 'Volunteer', sortable: true, defaultVisible: true },
          { id: 'email', label: 'Email', sortable: false, defaultVisible: true },
          { id: 'total_signups', label: 'Total Signups', sortable: true, defaultVisible: true },
          { id: 'top_role', label: 'Top Role', sortable: true, defaultVisible: true },
          { id: 'roles_list', label: 'All Roles', sortable: false, defaultVisible: false },
        ]
      default:
        return []
    }
  }
  
  // Get visible columns in order
  const getVisibleColumnsOrdered = () => {
    const available = getAvailableColumns()
    return columnOrder
      .filter(colId => visibleColumns[colId])
      .map(colId => available.find(c => c.id === colId))
      .filter(Boolean)
  }
  
  // ========== SORTING ==========
  
  const sortedData = [...data].sort((a, b) => {
    if (!sortField) return 0
    const aVal = a[sortField]
    const bVal = b[sortField]
    if (aVal === bVal) return 0
    if (aVal === null || aVal === undefined) return 1
    if (bVal === null || bVal === undefined) return -1
    const comparison = aVal < bVal ? -1 : 1
    return sortDir === 'asc' ? comparison : -comparison
  })
  
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }
  
  // ========== FORMATTERS ==========
  
  const formatValue = (value, format) => {
    if (value === null || value === undefined) return '-'
    switch (format) {
      case 'currency':
        return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      case 'percent':
        return `${value}%`
      case 'date':
        return value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'
      default:
        return value
    }
  }
  
  // ========== EXPORT FUNCTIONS ==========
  
  const getCurrentReport = () => {
    for (const cat of Object.values(reportCategories)) {
      const found = cat.reports.find(r => r.id === activeReport)
      if (found) return found
    }
    return null
  }
  
  const getBrandedHeader = () => {
    const season = getSelectedSeason()
    return {
      orgName: organization?.name || 'Organization',
      seasonName: season?.name || 'All Seasons',
      reportTitle: getCurrentReport()?.label || 'Report',
      generatedBy: profile?.full_name || user?.email || 'Admin',
      generatedAt: new Date().toLocaleString(),
      logoUrl: organization?.logo_url
    }
  }
  
  async function exportCSV() {
    setExporting(true)
    const columns = getVisibleColumnsOrdered()
    const header = getBrandedHeader()
    
    let csv = `"${header.orgName}"\n`
    csv += `"${header.seasonName} - ${header.reportTitle}"\n`
    csv += `"Generated by: ${header.generatedBy}"\n`
    csv += `"Date: ${header.generatedAt}"\n`
    csv += `"Records: ${sortedData.length}"\n`
    csv += `\n`
    
    csv += columns.map(c => `"${c.label}"`).join(',') + '\n'
    
    sortedData.forEach(row => {
      csv += columns.map(c => {
        let val = row[c.id]
        if (c.format) val = formatValue(val, c.format)
        if (val === null || val === undefined) val = ''
        val = String(val).replace(/"/g, '""')
        return `"${val}"`
      }).join(',') + '\n'
    })
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${header.orgName.replace(/\s+/g, '_')}_${activeReport}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    
    showToast('Report exported to CSV', 'success')
    setExporting(false)
    setShowExportMenu(false)
  }
  
  async function exportPDF() {
    setExporting(true)
    const header = getBrandedHeader()
    const columns = getVisibleColumnsOrdered()
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${header.reportTitle} - ${header.orgName}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1a1a1a; }
          .header { border-bottom: 3px solid ${accent?.primary || '#f97316'}; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { font-size: 28px; color: #1a1a1a; margin-bottom: 5px; }
          .header h2 { font-size: 18px; color: #666; font-weight: normal; }
          .meta { display: flex; gap: 30px; margin-top: 15px; font-size: 12px; color: #888; }
          .stats { display: flex; gap: 20px; margin-bottom: 30px; flex-wrap: wrap; }
          .stat { background: #f8f9fa; padding: 15px 20px; border-radius: 8px; min-width: 120px; }
          .stat-value { font-size: 24px; font-weight: bold; color: #1a1a1a; }
          .stat-label { font-size: 11px; color: #666; text-transform: uppercase; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; }
          th { background: #f8f9fa; padding: 8px 6px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb; white-space: nowrap; }
          td { padding: 6px; border-bottom: 1px solid #e5e7eb; }
          tr:nth-child(even) { background: #fafafa; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #888; text-align: center; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${header.orgName}</h1>
          <h2>${header.seasonName} - ${header.reportTitle}</h2>
          <div class="meta">
            <span>Generated by: ${header.generatedBy}</span>
            <span>Date: ${header.generatedAt}</span>
            <span>Records: ${sortedData.length}</span>
          </div>
        </div>
        
        <div class="stats">
          ${stats.labels ? stats.labels.map((label, i) => {
            const keys = Object.keys(stats).filter(k => k !== 'labels')
            const value = stats[keys[i]]
            const isMonetary = ['totalRevenue', 'collected', 'outstanding', 'totalExpected', 'totalOutstanding', 'avgBalance'].includes(keys[i])
            const displayValue = isMonetary ? '$' + Number(value).toLocaleString() : 
                                keys[i].includes('Rate') ? value + '%' : value
            return `<div class="stat"><div class="stat-value">${displayValue}</div><div class="stat-label">${label}</div></div>`
          }).join('') : ''}
        </div>
        
        <table>
          <thead>
            <tr>${columns.map(c => `<th>${c.label}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${sortedData.map(row => `
              <tr>${columns.map(c => `<td>${formatValue(row[c.id], c.format)}</td>`).join('')}</tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          ${header.orgName} • Generated via VolleyBrain Admin Portal • ${header.generatedAt}
        </div>
      </body>
      </html>
    `
    
    const printWindow = window.open('', '_blank')
    printWindow.document.write(printContent)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 250)
    
    showToast('PDF export opened', 'success')
    setExporting(false)
    setShowExportMenu(false)
  }
  
  function printReport() { exportPDF() }
  
  async function emailReport() {
    setExporting(true)
    const header = getBrandedHeader()
    
    const subject = encodeURIComponent(`${header.reportTitle} - ${header.orgName}`)
    const body = encodeURIComponent(
      `${header.reportTitle}\n${header.orgName} - ${header.seasonName}\n\n` +
      `Generated: ${header.generatedAt}\nTotal Records: ${sortedData.length}\n\n` +
      `For the full report, please use the CSV or PDF export in VolleyBrain.`
    )
    
    window.location.href = `mailto:?subject=${subject}&body=${body}`
    showToast('Email client opened', 'success')
    setExporting(false)
    setShowExportMenu(false)
  }
  
  // ========== FILTER OPTIONS ==========
  
  const getStatusOptions = () => {
    switch (activeReport) {
      case 'players':
        return [
          { value: 'all', label: 'All Status' },
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'waitlist', label: 'Waitlist' },
        ]
      case 'payments':
      case 'outstanding':
        return [
          { value: 'all', label: 'All Status' },
          { value: 'paid', label: 'Paid' },
          { value: 'unpaid', label: 'Unpaid' },
          { value: 'partial', label: 'Partial' },
        ]
      case 'registrations':
        return [
          { value: 'all', label: 'All Status' },
          { value: 'pending', label: 'Pending' },
          { value: 'submitted', label: 'Submitted' },
          { value: 'approved', label: 'Approved' },
          { value: 'active', label: 'Active' },
          { value: 'manual', label: 'Manual' },
        ]
      case 'financial':
        return [
          { value: 'all', label: 'All Status' },
          { value: 'paid', label: 'Paid' },
          { value: 'unpaid', label: 'Pending' },
        ]
      default:
        return []
    }
  }
  
  // ========== RENDER ==========
  
  const currentReport = getCurrentReport()
  const columns = getVisibleColumnsOrdered()
  const allColumns = getAvailableColumns()
  const statusOptions = getStatusOptions()
  const selectedSeason = getSelectedSeason()
  
  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      {/* Top Header Bar */}
      <div className={`${tc.cardBg} border-b ${tc.border} px-6 py-4`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className={`text-2xl font-bold ${tc.text}`}>Reports & Analytics</h1>
            <p className={`text-sm ${tc.textMuted}`}>Generate, customize, and export reports</p>
          </div>
          
          {/* Season & Sport Selectors */}
          <div className="flex items-center gap-4">
            {/* Sport Selector */}
            {sports.length > 0 && (
              <div>
                <label className={`block text-xs ${tc.textMuted} mb-1`}>Sport</label>
                <select
                  value={selectedSportId}
                  onChange={e => setSelectedSportId(e.target.value)}
                  className={`${tc.input} rounded-lg px-3 py-2 text-sm min-w-[140px]`}
                >
                  <option value="all">All Sports</option>
                  {sports.map(s => (
                    <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Season Selector */}
            <div>
              <label className={`block text-xs ${tc.textMuted} mb-1`}>Season</label>
              <select
                value={selectedSeasonId || ''}
                onChange={e => setSelectedSeasonId(e.target.value)}
                className={`${tc.input} rounded-lg px-3 py-2 text-sm min-w-[180px]`}
              >
                <option value="">Select Season</option>
                {seasons.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.status === 'active' ? '●' : s.status === 'upcoming' ? '○' : '◌'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Category Tabs with Dropdowns */}
        <div className="flex items-center gap-2">
          {Object.entries(reportCategories).map(([catId, cat]) => (
            <div key={catId} className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === catId ? null : catId)}
                className={`px-4 py-2 rounded-xl font-medium transition flex items-center gap-2 ${
                  activeCategory === catId
                    ? 'bg-[var(--accent-primary)] text-white'
                    : `${tc.cardBgAlt} ${tc.text} ${tc.hoverBg}`
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span className="text-xs ml-1">▼</span>
              </button>
              
              {openDropdown === catId && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                  <div className={`absolute left-0 top-full mt-2 w-64 ${tc.cardBg} border ${tc.border} rounded-xl shadow-xl z-50 overflow-hidden`}>
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
                        className={`w-full text-left px-4 py-3 ${tc.hoverBg} transition flex items-center gap-3 ${
                          activeReport === report.id ? 'bg-[var(--accent-primary)]/10' : ''
                        }`}
                      >
                        <span className="text-xl">{report.icon}</span>
                        <div>
                          <p className={`font-medium ${tc.text}`}>{report.label}</p>
                          <p className={`text-xs ${tc.textMuted}`}>{report.description}</p>
                        </div>
                        {activeReport === report.id && (
                          <span className="ml-auto text-[var(--accent-primary)]">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
          
          {/* Saved Presets Dropdown */}
          <div className="relative ml-auto">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'presets' ? null : 'presets')}
              className={`px-4 py-2 rounded-xl font-medium transition flex items-center gap-2 ${tc.cardBgAlt} ${tc.text} ${tc.hoverBg}`}
            >
              <Star className="w-4 h-4 text-yellow-400" />
              <span>Saved</span>
              {savedPresets.length > 0 && (
                <span className="px-1.5 py-0.5 bg-[var(--accent-primary)] text-white text-xs rounded-full">
                  {savedPresets.length}
                </span>
              )}
            </button>
            
            {openDropdown === 'presets' && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                <div className={`absolute right-0 top-full mt-2 w-72 ${tc.cardBg} border ${tc.border} rounded-xl shadow-xl z-50 overflow-hidden`}>
                  <div className={`px-4 py-3 border-b ${tc.border}`}>
                    <p className={`font-semibold ${tc.text}`}>Saved Report Presets</p>
                  </div>
                  {savedPresets.length === 0 ? (
                    <div className={`px-4 py-6 text-center ${tc.textMuted}`}>
                      <p>No saved presets yet</p>
                      <p className="text-xs mt-1">Save your current view as a preset</p>
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto">
                      {savedPresets.map(preset => (
                        <div key={preset.id} className={`px-4 py-3 ${tc.hoverBg} flex items-center justify-between`}>
                          <button
                            onClick={() => { loadPreset(preset); setOpenDropdown(null) }}
                            className="flex-1 text-left"
                          >
                            <p className={`font-medium ${tc.text}`}>{preset.name}</p>
                            <p className={`text-xs ${tc.textMuted}`}>
                              {reportCategories[preset.category]?.reports.find(r => r.id === preset.report)?.label}
                            </p>
                          </button>
                          <button
                            onClick={() => deletePreset(preset.id)}
                            className={`p-1 rounded ${tc.hoverBg} text-red-400 hover:text-red-500`}
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className={`px-4 py-3 border-t ${tc.border}`}>
                    <button
                      onClick={() => { setShowPresetModal(true); setOpenDropdown(null) }}
                      className="w-full px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white font-medium text-sm"
                    >
                      + Save Current View
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden p-6">
        {!selectedSeasonId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <span className="text-6xl">📅</span>
              <p className={`${tc.text} font-medium mt-4 text-lg`}>Select a Season</p>
              <p className={`${tc.textMuted} mt-2`}>Choose a season from the dropdown above to view reports</p>
            </div>
          </div>
        ) : (
          <>
            {/* Report Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className={`text-xl font-bold ${tc.text} flex items-center gap-2`}>
                  <span className="text-2xl">{currentReport?.icon}</span>
                  {currentReport?.label}
                </h2>
                <p className={`${tc.textMuted} text-sm`}>
                  {currentReport?.description} • {selectedSeason?.name}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Column Picker */}
                <button
                  onClick={() => setShowColumnPicker(!showColumnPicker)}
                  className={`px-3 py-2 rounded-lg ${tc.cardBgAlt} ${tc.text} ${tc.hoverBg} text-sm font-medium flex items-center gap-2`}
                >
                  ⚙️ Columns
                </button>
                
                {/* Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 py-2 rounded-lg ${tc.cardBgAlt} ${tc.text} ${tc.hoverBg} text-sm font-medium flex items-center gap-2`}
                >
                  🔍 Filters
                  {(filters.team !== 'all' || filters.status !== 'all' || filters.search) && (
                    <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)]" />
                  )}
                </button>
                
                {/* Export */}
                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    disabled={loading || data.length === 0}
                    className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white font-medium text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    📤 Export ▼
                  </button>
                  
                  {showExportMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                      <div className={`absolute right-0 top-full mt-2 w-48 ${tc.cardBg} border ${tc.border} rounded-xl shadow-xl z-50 overflow-hidden`}>
                        {[
                          { id: 'csv', label: 'Download CSV', icon: 'bar-chart', action: exportCSV },
                          { id: 'pdf', label: 'Download PDF', icon: 'file-text', action: exportPDF },
                          { id: 'print', label: 'Print', icon: '🖨️', action: printReport },
                          { id: 'email', label: 'Email', icon: '📧', action: emailReport },
                        ].map(opt => (
                          <button
                            key={opt.id}
                            onClick={opt.action}
                            disabled={exporting}
                            className={`w-full text-left px-4 py-2.5 ${tc.hoverBg} ${tc.text} flex items-center gap-2 text-sm`}
                          >
                            <span>{opt.icon}</span>
                            <span>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Stats Bar */}
            {stats.labels && (
              <div className="grid grid-cols-4 gap-4 mb-4">
                {stats.labels.map((label, i) => {
                  const keys = Object.keys(stats).filter(k => k !== 'labels')
                  const value = stats[keys[i]]
                  const isMonetary = ['totalRevenue', 'collected', 'outstanding', 'totalExpected', 'totalOutstanding', 'avgBalance'].includes(keys[i])
                  
                  return (
                    <div key={label} className={`${tc.cardBg} border ${tc.border} rounded-xl p-4`}>
                      <p className={`text-2xl font-bold ${tc.text}`}>
                        {isMonetary ? `$${Number(value).toLocaleString()}` : 
                         keys[i].includes('Rate') ? `${value}%` : 
                         value}
                      </p>
                      <p className={`text-xs ${tc.textMuted} uppercase tracking-wider mt-1`}>{label}</p>
                    </div>
                  )
                })}
              </div>
            )}
            
            {/* Column Picker Panel */}
            {showColumnPicker && (
              <div className={`${tc.cardBg} border ${tc.border} rounded-xl p-4 mb-4`}>
                <div className="flex items-center justify-between mb-3">
                  <p className={`font-semibold ${tc.text}`}>Customize Columns</p>
                  <button
                    onClick={() => {
                      const defaultVisible = {}
                      allColumns.forEach(col => { defaultVisible[col.id] = col.defaultVisible !== false })
                      setVisibleColumns(defaultVisible)
                    }}
                    className={`text-sm ${tc.textMuted} hover:text-[var(--accent-primary)]`}
                  >
                    Reset to Default
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {allColumns.map(col => (
                    <label
                      key={col.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition ${
                        visibleColumns[col.id] 
                          ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]' 
                          : `${tc.cardBgAlt} ${tc.textMuted}`
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns[col.id] || false}
                        onChange={e => setVisibleColumns({ ...visibleColumns, [col.id]: e.target.checked })}
                        className="sr-only"
                      />
                      <span className="text-sm">{visibleColumns[col.id] ? '✓' : '○'}</span>
                      <span className="text-sm font-medium">{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            {/* Filters Panel */}
            {showFilters && (
              <div className={`${tc.cardBg} border ${tc.border} rounded-xl p-4 mb-4`}>
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <label className={`block text-xs ${tc.textMuted} mb-1`}>Search</label>
                    <input
                      type="text"
                      value={filters.search}
                      onChange={e => setFilters({ ...filters, search: e.target.value })}
                      placeholder="Search..."
                      className={`w-full ${tc.input} rounded-lg px-3 py-2 text-sm`}
                    />
                  </div>
                  
                  {['players', 'jerseys'].includes(activeReport) && teams.length > 0 && (
                    <div className="min-w-[160px]">
                      <label className={`block text-xs ${tc.textMuted} mb-1`}>Team</label>
                      <select
                        value={filters.team}
                        onChange={e => setFilters({ ...filters, team: e.target.value })}
                        className={`w-full ${tc.input} rounded-lg px-3 py-2 text-sm`}
                      >
                        <option value="all">All Teams</option>
                        {teams.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {statusOptions.length > 0 && (
                    <div className="min-w-[140px]">
                      <label className={`block text-xs ${tc.textMuted} mb-1`}>Status</label>
                      <select
                        value={filters.status}
                        onChange={e => setFilters({ ...filters, status: e.target.value })}
                        className={`w-full ${tc.input} rounded-lg px-3 py-2 text-sm`}
                      >
                        {statusOptions.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {activeReport === 'financial' && (
                    <>
                      <div className="min-w-[140px]">
                        <label className={`block text-xs ${tc.textMuted} mb-1`}>From Date</label>
                        <input
                          type="date"
                          value={filters.dateFrom}
                          onChange={e => setFilters({ ...filters, dateFrom: e.target.value })}
                          className={`w-full ${tc.input} rounded-lg px-3 py-2 text-sm`}
                        />
                      </div>
                      <div className="min-w-[140px]">
                        <label className={`block text-xs ${tc.textMuted} mb-1`}>To Date</label>
                        <input
                          type="date"
                          value={filters.dateTo}
                          onChange={e => setFilters({ ...filters, dateTo: e.target.value })}
                          className={`w-full ${tc.input} rounded-lg px-3 py-2 text-sm`}
                        />
                      </div>
                    </>
                  )}
                  
                  <div className="flex items-end">
                    <button
                      onClick={() => setFilters({ team: 'all', status: 'all', dateFrom: '', dateTo: '', search: '' })}
                      className={`px-4 py-2 rounded-lg ${tc.hoverBg} ${tc.textMuted} text-sm`}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Data Table */}
            <div className={`flex-1 ${tc.cardBg} border ${tc.border} rounded-xl overflow-hidden flex flex-col min-h-0`}>
              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className={`${tc.textMuted} mt-3`}>Loading report...</p>
                  </div>
                </div>
              ) : data.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-5xl">📭</span>
                    <p className={`${tc.text} font-medium mt-4`}>No data found</p>
                    <p className={`${tc.textMuted} text-sm mt-1`}>Try adjusting your filters or selecting a different season</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Table */}
                  <div className="flex-1 overflow-auto">
                    <table className="w-full">
                      <thead className={`${tc.cardBgAlt} sticky top-0`}>
                        <tr>
                          {columns.map(col => (
                            <th
                              key={col.id}
                              onClick={() => col.sortable && handleSort(col.id)}
                              className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${tc.textMuted} ${
                                col.sortable ? 'cursor-pointer hover:bg-black/5' : ''
                              } whitespace-nowrap`}
                            >
                              {col.label}
                              {col.sortable && sortField === col.id && (
                                <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sortedData.map((row, i) => (
                          <tr key={row.id || i} className={`border-b ${tc.border} ${tc.hoverBg} transition`}>
                            {columns.map(col => (
                              <td key={col.id} className={`px-4 py-3 text-sm ${tc.text}`}>
                                {col.id === 'team_name' && row.team_color ? (
                                  <span className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: row.team_color }} />
                                    {row[col.id]}
                                  </span>
                                ) : ['payment_status', 'status', 'reg_status', 'roster_status', 'bg_check_status'].includes(col.id) ? (
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    ['Paid', 'active', 'approved', 'Ready', 'cleared', 'Active'].includes(row[col.id]) 
                                      ? 'bg-emerald-500/20 text-emerald-500' 
                                      : ['Unpaid', 'denied', 'Need Players', 'failed'].includes(row[col.id])
                                      ? 'bg-red-500/20 text-red-500'
                                      : 'bg-amber-500/20 text-amber-500'
                                  }`}>
                                    {row[col.id]}
                                  </span>
                                ) : col.id === 'attendance_rate' || col.id === 'roster_fill' ? (
                                  <div className="flex items-center gap-2">
                                    <div className={`w-16 h-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'} overflow-hidden`}>
                                      <div 
                                        className={`h-full rounded-full ${
                                          row[col.id] >= 80 ? 'bg-emerald-500' : row[col.id] >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                        }`}
                                        style={{ width: `${Math.min(row[col.id], 100)}%` }}
                                      />
                                    </div>
                                    <span>{row[col.id]}%</span>
                                  </div>
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
                  
                  {/* Table Footer */}
                  <div className={`px-4 py-3 border-t ${tc.border} ${tc.cardBgAlt} flex items-center justify-between flex-shrink-0`}>
                    <p className={`text-sm ${tc.textMuted}`}>
                      Showing {sortedData.length} records • {columns.length} columns
                    </p>
                    <p className={`text-xs ${tc.textMuted}`}>
                      {organization?.name} • {selectedSeason?.name}
                    </p>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Save Preset Modal */}
      {showPresetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${tc.cardBg} rounded-2xl p-6 w-full max-w-md`}>
            <h3 className={`text-lg font-bold ${tc.text} mb-4`}>Save Report Preset</h3>
            <p className={`text-sm ${tc.textMuted} mb-4`}>
              Save your current view (report type, visible columns, filters) as a preset for quick access later.
            </p>
            <input
              type="text"
              value={presetName}
              onChange={e => setPresetName(e.target.value)}
              placeholder="Preset name (e.g., 'Contact List for Coaches')"
              className={`w-full ${tc.input} rounded-lg px-4 py-3 mb-4`}
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowPresetModal(false); setPresetName('') }}
                className={`px-4 py-2 rounded-lg ${tc.cardBgAlt} ${tc.text}`}
              >
                Cancel
              </button>
              <button
                onClick={savePreset}
                disabled={!presetName.trim()}
                className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white font-medium disabled:opacity-50"
              >
                Save Preset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


export { ReportsPage }
