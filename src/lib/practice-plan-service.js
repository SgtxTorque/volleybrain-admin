import { supabase } from './supabase'

// ============================================
// PRACTICE PLAN SERVICE — Supabase CRUD
// ============================================

export async function fetchPracticePlans({ orgId, sportId, teamId, templatesOnly, favoritesOnly, userId, limit = 50 }) {
  let query = supabase
    .from('practice_plans')
    .select('*, practice_plan_items(count), practice_plan_favorites!left(id, user_id)')
    .eq('org_id', orgId)
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (sportId) query = query.eq('sport_id', sportId)
  if (teamId) query = query.eq('team_id', teamId)
  if (templatesOnly) query = query.eq('is_template', true)

  const { data, error } = await query

  if (favoritesOnly && userId && data) {
    const filtered = data.filter(p =>
      p.practice_plan_favorites?.some(f => f.user_id === userId)
    )
    return { data: filtered, error }
  }

  return { data, error }
}

export async function fetchPracticePlan(planId) {
  const { data, error } = await supabase
    .from('practice_plans')
    .select(`
      *,
      practice_plan_items(
        *,
        drills(id, title, video_thumbnail_url, category, duration_minutes, intensity)
      )
    `)
    .eq('id', planId)
    .single()

  if (data?.practice_plan_items) {
    data.practice_plan_items.sort((a, b) => a.sort_order - b.sort_order)
  }

  return { data, error }
}

export async function createPracticePlan(plan) {
  const { data, error } = await supabase.from('practice_plans').insert(plan).select().single()
  return { data, error }
}

export async function updatePracticePlan(planId, updates) {
  const { data, error } = await supabase
    .from('practice_plans')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', planId)
    .select()
    .single()
  return { data, error }
}

export async function deletePracticePlan(planId) {
  const { error } = await supabase.from('practice_plans').delete().eq('id', planId)
  return { error }
}

export async function savePlanItems(planId, items) {
  // Delete existing items and re-insert (same pattern as game_lineups)
  await supabase.from('practice_plan_items').delete().eq('practice_plan_id', planId)

  if (items.length === 0) return { error: null }

  const records = items.map((item, index) => ({
    practice_plan_id: planId,
    drill_id: item.drill_id || null,
    sort_order: index,
    custom_title: item.custom_title || null,
    custom_notes: item.custom_notes || null,
    duration_minutes: item.duration_minutes || 10,
    item_type: item.item_type || 'drill',
  }))

  const { error } = await supabase.from('practice_plan_items').insert(records)
  return { error }
}

export async function togglePlanFavorite(userId, planId) {
  const { data: existing } = await supabase
    .from('practice_plan_favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('practice_plan_id', planId)
    .single()

  if (existing) {
    await supabase.from('practice_plan_favorites').delete().eq('id', existing.id)
    return { favorited: false }
  } else {
    await supabase.from('practice_plan_favorites').insert({ user_id: userId, practice_plan_id: planId })
    return { favorited: true }
  }
}

export async function attachPlanToEvent(eventId, planId) {
  const { data, error } = await supabase
    .from('event_practice_plans')
    .upsert({ event_id: eventId, practice_plan_id: planId, status: 'ready' }, { onConflict: 'event_id' })
    .select()
    .single()
  return { data, error }
}

export async function detachPlanFromEvent(eventId) {
  const { error } = await supabase
    .from('event_practice_plans')
    .delete()
    .eq('event_id', eventId)
  return { error }
}

export async function getEventPracticePlan(eventId) {
  const { data, error } = await supabase
    .from('event_practice_plans')
    .select(`
      *,
      practice_plans(
        *,
        practice_plan_items(
          *,
          drills(id, title, description, video_url, video_thumbnail_url, category, duration_minutes, intensity, equipment)
        )
      )
    `)
    .eq('event_id', eventId)
    .single()

  // Sort items
  if (data?.practice_plans?.practice_plan_items) {
    data.practice_plans.practice_plan_items.sort((a, b) => a.sort_order - b.sort_order)
  }

  return { data, error }
}

export async function updateEventPlanStatus(eventId, status, coachNotes) {
  const updates = { status }
  if (status === 'in_progress') updates.started_at = new Date().toISOString()
  if (status === 'completed') updates.completed_at = new Date().toISOString()
  if (coachNotes !== undefined) updates.coach_notes = coachNotes

  const { data, error } = await supabase
    .from('event_practice_plans')
    .update(updates)
    .eq('event_id', eventId)
    .select()
    .single()
  return { data, error }
}

export async function fetchUpcomingPracticeEvents(orgId, teamId) {
  const now = new Date().toISOString().split('T')[0]
  let query = supabase
    .from('schedule_events')
    .select('id, title, event_date, event_time, team_id, teams(name)')
    .eq('event_type', 'practice')
    .gte('event_date', now)
    .order('event_date')
    .limit(20)

  if (teamId) query = query.eq('team_id', teamId)

  const { data, error } = await query
  return { data, error }
}
