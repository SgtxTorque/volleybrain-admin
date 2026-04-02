import { supabase } from './supabase'

// ============================================
// PLAYER DEVELOPMENT SERVICE
// ============================================

export async function fetchPlayerAssignments(playerId, { status, limit = 50 } = {}) {
  let query = supabase
    .from('player_development_assignments')
    .select('*, drills(id, title, video_url, video_thumbnail_url, category, duration_minutes), assigner:profiles!player_development_assignments_assigned_by_fkey(full_name)')
    .eq('player_id', playerId)
    .order('assigned_at', { ascending: false })
    .limit(limit)

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  return { data, error }
}

export async function fetchTeamAssignments(teamId, { status } = {}) {
  let query = supabase
    .from('player_development_assignments')
    .select('*, drills(id, title, category, duration_minutes), players(id, first_name, last_name, photo_url)')
    .eq('team_id', teamId)
    .order('assigned_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  return { data, error }
}

export async function assignDrillToPlayers({ orgId, drillId, playerIds, assignedBy, teamId, playerGoal, targetCompletions, dueDate }) {
  const records = playerIds.map(playerId => ({
    org_id: orgId,
    player_id: playerId,
    assigned_by: assignedBy,
    team_id: teamId || null,
    drill_id: drillId,
    assignment_type: 'drill',
    player_goal: playerGoal || null,
    target_completions: targetCompletions || 1,
    due_date: dueDate || null,
  }))

  const { data, error } = await supabase
    .from('player_development_assignments')
    .insert(records)
    .select()

  return { data, error }
}

export async function updateAssignment(assignmentId, updates) {
  const { data, error } = await supabase
    .from('player_development_assignments')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', assignmentId)
    .select()
    .single()
  return { data, error }
}

export async function addCoachFeedback(assignmentId, { coachFeedback, coachRating, reviewedBy }) {
  return updateAssignment(assignmentId, {
    coach_feedback: coachFeedback,
    coach_rating: coachRating,
    reviewed_by: reviewedBy,
    reviewed_at: new Date().toISOString(),
  })
}

export async function archiveAssignment(assignmentId) {
  return updateAssignment(assignmentId, { status: 'archived' })
}

// ── Reflection Templates ──

export async function fetchReflectionTemplates(orgId, { reflectionType } = {}) {
  let query = supabase
    .from('reflection_templates')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (reflectionType) query = query.eq('reflection_type', reflectionType)

  const { data, error } = await query
  return { data, error }
}

export async function createReflectionTemplate(template) {
  const { data, error } = await supabase
    .from('reflection_templates')
    .insert(template)
    .select()
    .single()
  return { data, error }
}

export async function updateReflectionTemplate(templateId, updates) {
  const { data, error } = await supabase
    .from('reflection_templates')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', templateId)
    .select()
    .single()
  return { data, error }
}

export async function deleteReflectionTemplate(templateId) {
  const { error } = await supabase.from('reflection_templates').delete().eq('id', templateId)
  return { error }
}

// ── Practice Reflections (read-only on web) ──

export async function fetchEventReflections(eventId) {
  const { data, error } = await supabase
    .from('practice_reflections')
    .select('*, players(id, first_name, last_name, photo_url)')
    .eq('event_id', eventId)
    .order('submitted_at', { ascending: false })

  return { data, error }
}
