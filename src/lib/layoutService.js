import { supabase } from './supabase'

/**
 * Save a dashboard layout for the current user + role.
 * Upserts — creates if new, updates if exists.
 */
export async function saveLayout(userId, role, layout, widgets) {
  if (!userId) return null

  const { data, error } = await supabase
    .from('user_dashboard_layouts')
    .upsert({
      user_id: userId,
      role,
      layout,
      widgets,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,role',
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to save layout:', error)
    return null
  }
  return data
}

/**
 * Load the saved layout for a user + role.
 * Returns null if no saved layout exists (use defaults).
 */
export async function loadLayout(userId, role) {
  if (!userId) return null

  const { data, error } = await supabase
    .from('user_dashboard_layouts')
    .select('layout, widgets')
    .eq('user_id', userId)
    .eq('role', role)
    .maybeSingle()

  if (error) {
    console.error('Failed to load layout:', error)
    return null
  }
  return data
}

/**
 * Delete the saved layout (reset to defaults).
 */
export async function resetLayout(userId, role) {
  if (!userId) return

  await supabase
    .from('user_dashboard_layouts')
    .delete()
    .eq('user_id', userId)
    .eq('role', role)
}
