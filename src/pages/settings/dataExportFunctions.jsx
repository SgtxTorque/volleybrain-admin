// =============================================================================
// Data Export Functions -- all 7 export functions for each data category
// =============================================================================

import { supabase } from '../../lib/supabase'
import { fmtDate, fmtCurrency } from './dataExportHelpers'

export async function exportPlayers(activeOrg, getSeasonIds) {
  const seasonIds = await getSeasonIds()
  if (seasonIds.length === 0) return { headers: [], rows: [], data: [] }

  const { data: players } = await supabase
    .from('players')
    .select(
      'id, first_name, last_name, email, phone, birth_date, gender, grade, position, jersey_number, school, status, parent_name, parent_email, parent_phone, parent_phone_secondary, medical_notes, allergies, created_at, season_id'
    )
    .in('season_id', seasonIds)
    .order('last_name')

  if (!players || players.length === 0) return { headers: [], rows: [], data: [] }

  // Get team assignments
  const { data: teamAssignments } = await supabase
    .from('team_players')
    .select('player_id, teams(name)')
    .in(
      'player_id',
      players.map((p) => p.id)
    )

  const teamMap = {}
  ;(teamAssignments || []).forEach((ta) => {
    if (!teamMap[ta.player_id]) teamMap[ta.player_id] = []
    teamMap[ta.player_id].push(ta.teams?.name || '')
  })

  // Get season names
  const { data: seasonNames } = await supabase
    .from('seasons')
    .select('id, name')
    .in('id', seasonIds)
  const seasonMap = {}
  ;(seasonNames || []).forEach((s) => {
    seasonMap[s.id] = s.name
  })

  // Get registration status
  const { data: regs } = await supabase
    .from('registrations')
    .select('player_id, status')
    .in(
      'player_id',
      players.map((p) => p.id)
    )
  const regMap = {}
  ;(regs || []).forEach((r) => {
    regMap[r.player_id] = r.status
  })

  const headers = [
    'First Name', 'Last Name', 'Email', 'Phone', 'Date of Birth', 'Gender',
    'Grade', 'Position', 'Jersey #', 'School', 'Status', 'Registration Status',
    'Team(s)', 'Guardian Name', 'Guardian Email', 'Guardian Phone',
    'Guardian Phone 2', 'Medical Notes', 'Allergies', 'Season', 'Created',
  ]

  const rows = players.map((p) => [
    p.first_name, p.last_name, p.email, p.phone, fmtDate(p.birth_date),
    p.gender, p.grade, p.position, p.jersey_number, p.school,
    p.status, regMap[p.id] || '', (teamMap[p.id] || []).join('; '),
    p.parent_name, p.parent_email, p.parent_phone, p.parent_phone_secondary,
    p.medical_notes, p.allergies, seasonMap[p.season_id] || '', fmtDate(p.created_at),
  ])

  const jsonData = players.map((p) => ({
    ...p,
    teams: teamMap[p.id] || [],
    registration_status: regMap[p.id] || '',
    season_name: seasonMap[p.season_id] || '',
  }))

  return { headers, rows, data: jsonData }
}

export async function exportCoaches(activeOrg, getSeasonIds, selectedSeasonId) {
  const { data: coaches } = await supabase
    .from('coaches')
    .select(
      'id, first_name, last_name, email, phone, status, background_check_status, waiver_signed, code_of_conduct_signed, specialties, season_id'
    )
    .eq('organization_id', activeOrg.id)
    .order('last_name')

  if (!coaches || coaches.length === 0) return { headers: [], rows: [], data: [] }

  // Filter by season if selected
  let filtered = coaches
  if (selectedSeasonId !== 'all') {
    filtered = coaches.filter((c) => c.season_id === selectedSeasonId)
  }

  // Get team assignments
  const { data: teamAssignments } = await supabase
    .from('team_coaches')
    .select('coach_id, role, teams(name)')
    .in(
      'coach_id',
      filtered.map((c) => c.id)
    )

  const teamMap = {}
  ;(teamAssignments || []).forEach((ta) => {
    if (!teamMap[ta.coach_id]) teamMap[ta.coach_id] = []
    teamMap[ta.coach_id].push(
      `${ta.teams?.name || ''} (${ta.role || 'staff'})`
    )
  })

  const headers = [
    'First Name', 'Last Name', 'Email', 'Phone', 'Status',
    'Background Check', 'Waiver Signed', 'Code of Conduct', 'Specialties', 'Team(s)',
  ]

  const rows = filtered.map((c) => [
    c.first_name, c.last_name, c.email, c.phone, c.status,
    c.background_check_status || '', c.waiver_signed ? 'Yes' : 'No',
    c.code_of_conduct_signed ? 'Yes' : 'No', c.specialties || '',
    (teamMap[c.id] || []).join('; '),
  ])

  const jsonData = filtered.map((c) => ({ ...c, teams: teamMap[c.id] || [] }))

  return { headers, rows, data: jsonData }
}

export async function exportPayments(activeOrg, getSeasonIds) {
  const seasonIds = await getSeasonIds()
  if (seasonIds.length === 0) return { headers: [], rows: [], data: [] }

  const { data: payments } = await supabase
    .from('payments')
    .select(
      'id, player_id, amount, paid, paid_at, payment_method, description, fee_category, created_at, season_id, players(first_name, last_name)'
    )
    .in('season_id', seasonIds)
    .order('created_at', { ascending: false })

  if (!payments || payments.length === 0) return { headers: [], rows: [], data: [] }

  // Get season names
  const { data: seasonNames } = await supabase
    .from('seasons')
    .select('id, name')
    .in('id', seasonIds)
  const seasonMap = {}
  ;(seasonNames || []).forEach((s) => {
    seasonMap[s.id] = s.name
  })

  const headers = [
    'Player', 'Amount', 'Paid', 'Paid At', 'Payment Method',
    'Description', 'Fee Category', 'Season', 'Created',
  ]

  const rows = payments.map((p) => [
    `${p.players?.first_name || ''} ${p.players?.last_name || ''}`.trim(),
    fmtCurrency(p.amount), p.paid ? 'Yes' : 'No', fmtDate(p.paid_at),
    p.payment_method || '', p.description || '', p.fee_category || '',
    seasonMap[p.season_id] || '', fmtDate(p.created_at),
  ])

  const jsonData = payments.map((p) => ({
    ...p,
    player_name: `${p.players?.first_name || ''} ${p.players?.last_name || ''}`.trim(),
    season_name: seasonMap[p.season_id] || '',
  }))

  return { headers, rows, data: jsonData }
}

export async function exportSeasons(activeOrg, getSeasonIds, selectedSeasonId) {
  const { data: allSeasons } = await supabase
    .from('seasons')
    .select(
      'id, name, status, start_date, end_date, sport_id, fee_registration, fee_uniform, fee_monthly, capacity, description, created_at'
    )
    .eq('organization_id', activeOrg.id)
    .order('start_date', { ascending: false })

  if (!allSeasons || allSeasons.length === 0)
    return { headers: [], rows: [], data: [] }

  let filtered = allSeasons
  if (selectedSeasonId !== 'all') {
    filtered = allSeasons.filter((s) => s.id === selectedSeasonId)
  }

  // Get team and player counts per season
  const seasonIds = filtered.map((s) => s.id)
  const { data: teams } = await supabase
    .from('teams')
    .select('id, season_id')
    .in('season_id', seasonIds)
  const { data: players } = await supabase
    .from('players')
    .select('id, season_id')
    .in('season_id', seasonIds)

  const teamCounts = {}
  const playerCounts = {}
  ;(teams || []).forEach((t) => {
    teamCounts[t.season_id] = (teamCounts[t.season_id] || 0) + 1
  })
  ;(players || []).forEach((p) => {
    playerCounts[p.season_id] = (playerCounts[p.season_id] || 0) + 1
  })

  const headers = [
    'Season Name', 'Status', 'Start Date', 'End Date', 'Reg Fee',
    'Uniform Fee', 'Monthly Fee', 'Capacity', 'Teams', 'Players',
    'Description', 'Created',
  ]

  const rows = filtered.map((s) => [
    s.name, s.status, fmtDate(s.start_date), fmtDate(s.end_date),
    fmtCurrency(s.fee_registration), fmtCurrency(s.fee_uniform),
    fmtCurrency(s.fee_monthly), s.capacity || '',
    teamCounts[s.id] || 0, playerCounts[s.id] || 0,
    s.description || '', fmtDate(s.created_at),
  ])

  const jsonData = filtered.map((s) => ({
    ...s,
    team_count: teamCounts[s.id] || 0,
    player_count: playerCounts[s.id] || 0,
  }))

  return { headers, rows, data: jsonData }
}

export async function exportTeams(activeOrg, getSeasonIds) {
  const seasonIds = await getSeasonIds()
  if (seasonIds.length === 0) return { headers: [], rows: [], data: [] }

  const { data: teams } = await supabase
    .from('teams')
    .select(
      'id, name, color, age_group, team_type, skill_level, gender, max_roster_size, season_id'
    )
    .in('season_id', seasonIds)
    .order('name')

  if (!teams || teams.length === 0) return { headers: [], rows: [], data: [] }

  // Get season names
  const { data: seasonNames } = await supabase
    .from('seasons')
    .select('id, name')
    .in('id', seasonIds)
  const seasonMap = {}
  ;(seasonNames || []).forEach((s) => {
    seasonMap[s.id] = s.name
  })

  // Get players per team
  const { data: tp } = await supabase
    .from('team_players')
    .select('team_id, players(first_name, last_name, jersey_number)')
    .in(
      'team_id',
      teams.map((t) => t.id)
    )

  const playerMap = {}
  ;(tp || []).forEach((item) => {
    if (!playerMap[item.team_id]) playerMap[item.team_id] = []
    playerMap[item.team_id].push(
      `${item.players?.first_name || ''} ${item.players?.last_name || ''}`.trim()
    )
  })

  // Get coaches per team
  const { data: tc_data } = await supabase
    .from('team_coaches')
    .select('team_id, role, coaches(first_name, last_name)')
    .in(
      'team_id',
      teams.map((t) => t.id)
    )

  const coachMap = {}
  ;(tc_data || []).forEach((item) => {
    if (!coachMap[item.team_id]) coachMap[item.team_id] = []
    coachMap[item.team_id].push(
      `${item.coaches?.first_name || ''} ${item.coaches?.last_name || ''}`.trim() +
        ` (${item.role || 'staff'})`
    )
  })

  const headers = [
    'Team Name', 'Color', 'Age Group', 'Type', 'Skill Level',
    'Gender', 'Max Roster', 'Player Count', 'Players', 'Coaches', 'Season',
  ]

  const rows = teams.map((t) => [
    t.name, t.color || '', t.age_group || '', t.team_type || '',
    t.skill_level || '', t.gender || '', t.max_roster_size || '',
    (playerMap[t.id] || []).length,
    (playerMap[t.id] || []).join('; '), (coachMap[t.id] || []).join('; '),
    seasonMap[t.season_id] || '',
  ])

  const jsonData = teams.map((t) => ({
    ...t,
    players: playerMap[t.id] || [],
    coaches: coachMap[t.id] || [],
    player_count: (playerMap[t.id] || []).length,
    season_name: seasonMap[t.season_id] || '',
  }))

  return { headers, rows, data: jsonData }
}

export async function exportRegistrations(activeOrg, getSeasonIds) {
  const seasonIds = await getSeasonIds()
  if (seasonIds.length === 0) return { headers: [], rows: [], data: [] }

  // Get players in these seasons
  const { data: players } = await supabase
    .from('players')
    .select('id, first_name, last_name, parent_name, parent_email, season_id')
    .in('season_id', seasonIds)

  if (!players || players.length === 0) return { headers: [], rows: [], data: [] }

  const { data: regs } = await supabase
    .from('registrations')
    .select('id, player_id, status, submitted_at, approved_at, denied_at, deny_reason')
    .in(
      'player_id',
      players.map((p) => p.id)
    )
    .order('submitted_at', { ascending: false })

  if (!regs || regs.length === 0) return { headers: [], rows: [], data: [] }

  const playerMap = {}
  players.forEach((p) => {
    playerMap[p.id] = p
  })

  // Get season names
  const { data: seasonNames } = await supabase
    .from('seasons')
    .select('id, name')
    .in('id', seasonIds)
  const seasonMap = {}
  ;(seasonNames || []).forEach((s) => {
    seasonMap[s.id] = s.name
  })

  const headers = [
    'Player', 'Guardian', 'Guardian Email', 'Status', 'Submitted',
    'Approved', 'Denied', 'Deny Reason', 'Season',
  ]

  const rows = regs.map((r) => {
    const p = playerMap[r.player_id] || {}
    return [
      `${p.first_name || ''} ${p.last_name || ''}`.trim(),
      p.parent_name || '', p.parent_email || '', r.status,
      fmtDate(r.submitted_at), fmtDate(r.approved_at), fmtDate(r.denied_at),
      r.deny_reason || '', seasonMap[p.season_id] || '',
    ]
  })

  const jsonData = regs.map((r) => {
    const p = playerMap[r.player_id] || {}
    return {
      ...r,
      player_name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
      season_name: seasonMap[p.season_id] || '',
    }
  })

  return { headers, rows, data: jsonData }
}

export async function exportEvents(activeOrg, getSeasonIds) {
  const seasonIds = await getSeasonIds()
  if (seasonIds.length === 0) return { headers: [], rows: [], data: [] }

  const { data: events } = await supabase
    .from('schedule_events')
    .select(
      'id, title, event_type, event_date, event_time, location, team_id, opponent_name, our_score, opponent_score, game_status, game_result, season_id, created_at, teams(name)'
    )
    .in('season_id', seasonIds)
    .order('event_date', { ascending: false })

  if (!events || events.length === 0) return { headers: [], rows: [], data: [] }

  // Get season names
  const { data: seasonNames } = await supabase
    .from('seasons')
    .select('id, name')
    .in('id', seasonIds)
  const seasonMap = {}
  ;(seasonNames || []).forEach((s) => {
    seasonMap[s.id] = s.name
  })

  const headers = [
    'Title', 'Type', 'Date', 'Time', 'Location', 'Team',
    'Opponent', 'Our Score', 'Opp Score', 'Result', 'Game Status',
    'Season', 'Created',
  ]

  const rows = events.map((e) => [
    e.title, e.event_type, fmtDate(e.event_date), e.event_time || '',
    e.location || '', e.teams?.name || '', e.opponent_name || '',
    e.our_score ?? '', e.opponent_score ?? '', e.game_result || '',
    e.game_status || '', seasonMap[e.season_id] || '', fmtDate(e.created_at),
  ])

  const jsonData = events.map((e) => ({
    ...e,
    team_name: e.teams?.name || '',
    season_name: seasonMap[e.season_id] || '',
  }))

  return { headers, rows, data: jsonData }
}
