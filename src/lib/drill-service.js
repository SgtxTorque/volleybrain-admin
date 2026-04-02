import { supabase } from './supabase'

// ============================================
// DRILL SERVICE — Supabase CRUD for drills
// ============================================

export async function fetchDrills({ orgId, sportId, category, search, teamId, favoritesOnly, userId, limit = 50, offset = 0 }) {
  let query = supabase
    .from('drills')
    .select('*, drill_favorites!left(id, user_id)', { count: 'exact' })
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (sportId) query = query.eq('sport_id', sportId)
  if (category) query = query.eq('category', category)
  if (teamId) query = query.eq('team_id', teamId)
  if (search) query = query.ilike('title', `%${search}%`)

  const { data, error, count } = await query

  // Post-filter favorites if requested
  if (favoritesOnly && userId && data) {
    const filtered = data.filter(d =>
      d.drill_favorites?.some(f => f.user_id === userId)
    )
    return { data: filtered, error, count: filtered.length }
  }

  return { data, error, count }
}

export async function fetchDrill(drillId) {
  const { data, error } = await supabase
    .from('drills')
    .select('*, drill_favorites!left(id, user_id)')
    .eq('id', drillId)
    .single()
  return { data, error }
}

export async function createDrill(drill) {
  const { data, error } = await supabase.from('drills').insert(drill).select().single()
  return { data, error }
}

export async function updateDrill(drillId, updates) {
  const { data, error } = await supabase
    .from('drills')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', drillId)
    .select()
    .single()
  return { data, error }
}

export async function deleteDrill(drillId) {
  const { error } = await supabase.from('drills').delete().eq('id', drillId)
  return { error }
}

export async function toggleDrillFavorite(userId, drillId) {
  const { data: existing } = await supabase
    .from('drill_favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('drill_id', drillId)
    .single()

  if (existing) {
    await supabase.from('drill_favorites').delete().eq('id', existing.id)
    return { favorited: false }
  } else {
    await supabase.from('drill_favorites').insert({ user_id: userId, drill_id: drillId })
    return { favorited: true }
  }
}

export async function fetchDrillCategories({ orgId, sportId }) {
  let query = supabase
    .from('drill_categories')
    .select('*')
    .order('sort_order')

  // Get system defaults (org_id IS NULL) AND org-specific
  query = query.or(`org_id.is.null,org_id.eq.${orgId}`)
  if (sportId) query = query.or(`sport_id.is.null,sport_id.eq.${sportId}`)

  const { data, error } = await query
  return { data, error }
}

export function getDrillUseCount(drillId) {
  return supabase
    .from('practice_plan_items')
    .select('id', { count: 'exact', head: true })
    .eq('drill_id', drillId)
}
