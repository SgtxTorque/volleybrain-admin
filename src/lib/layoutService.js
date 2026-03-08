import { supabase } from './supabase'

/**
 * Save a dashboard layout for the current user + role.
 * Upserts — creates if new, updates if exists.
 */
export async function saveLayout(userId, role, layout, widgets) {
  if (!userId) {
    console.warn('[layoutService] saveLayout called without userId')
    return null
  }

  const payload = {
    user_id: userId,
    role,
    layout,
    widgets,
    updated_at: new Date().toISOString(),
  }
  console.log('[layoutService] saveLayout:', { userId, role, widgetCount: widgets?.length, layoutItems: layout?.length })

  const { data, error } = await supabase
    .from('user_dashboard_layouts')
    .upsert(payload, { onConflict: 'user_id,role' })
    .select()
    .maybeSingle()

  if (error) {
    console.error('[layoutService] saveLayout FAILED:', error.message, error.details, error.hint)
    return null
  }
  console.log('[layoutService] saveLayout SUCCESS:', data?.id)
  return data
}

/**
 * Load the saved layout for a user + role.
 * Returns null if no saved layout exists (use defaults).
 */
export async function loadLayout(userId, role) {
  if (!userId) {
    console.warn('[layoutService] loadLayout called without userId')
    return null
  }

  console.log('[layoutService] loadLayout:', { userId, role })

  const { data, error } = await supabase
    .from('user_dashboard_layouts')
    .select('layout, widgets')
    .eq('user_id', userId)
    .eq('role', role)
    .maybeSingle()

  if (error) {
    console.error('[layoutService] loadLayout FAILED:', error.message, error.details, error.hint)
    return null
  }

  if (data) {
    console.log('[layoutService] loadLayout FOUND:', { layoutItems: data.layout?.length, widgets: data.widgets?.length })
  } else {
    console.log('[layoutService] loadLayout: no saved layout for', role)
  }
  return data
}

/**
 * Delete the saved layout (reset to defaults).
 */
export async function resetLayout(userId, role) {
  if (!userId) return

  console.log('[layoutService] resetLayout:', { userId, role })

  const { error } = await supabase
    .from('user_dashboard_layouts')
    .delete()
    .eq('user_id', userId)
    .eq('role', role)

  if (error) {
    console.error('[layoutService] resetLayout FAILED:', error.message)
  }
}
