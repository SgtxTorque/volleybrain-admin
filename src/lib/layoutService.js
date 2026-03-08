import { supabase } from './supabase'

// The migration file (002_user_dashboard_layouts.sql) uses column name "widgets".
// Some users may have created the table with "active_widgets" instead.
// We detect the correct column name on first call and cache it.
let _widgetCol = null

async function detectWidgetColumn() {
  if (_widgetCol) return _widgetCol
  // Try 'widgets' first (matches our migration file)
  const { error } = await supabase
    .from('user_dashboard_layouts')
    .select('widgets')
    .limit(0)
  if (!error) {
    _widgetCol = 'widgets'
  } else {
    // Fallback to 'active_widgets' (user may have created table with this name)
    const { error: err2 } = await supabase
      .from('user_dashboard_layouts')
      .select('active_widgets')
      .limit(0)
    _widgetCol = err2 ? 'widgets' : 'active_widgets'
  }
  console.log('[layoutService] detected widget column:', _widgetCol)
  return _widgetCol
}

/**
 * Save a dashboard layout for the current user + role.
 * Upserts — creates if new, updates if exists.
 */
export async function saveLayout(userId, role, layout, widgets) {
  if (!userId) {
    console.warn('[layoutService] saveLayout called without userId')
    return null
  }

  const col = await detectWidgetColumn()
  const payload = {
    user_id: userId,
    role,
    layout,
    [col]: widgets,
    updated_at: new Date().toISOString(),
  }
  console.log('[layoutService] saveLayout:', { userId, role, widgetCount: widgets?.length, layoutItems: layout?.length, col })

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
 * Always returns { layout, widgets } regardless of column name.
 */
export async function loadLayout(userId, role) {
  if (!userId) {
    console.warn('[layoutService] loadLayout called without userId')
    return null
  }

  const col = await detectWidgetColumn()
  console.log('[layoutService] loadLayout:', { userId, role, col })

  const { data, error } = await supabase
    .from('user_dashboard_layouts')
    .select(`layout, ${col}`)
    .eq('user_id', userId)
    .eq('role', role)
    .maybeSingle()

  if (error) {
    console.error('[layoutService] loadLayout FAILED:', error.message, error.details, error.hint)
    return null
  }

  if (data) {
    // Normalize: always return { layout, widgets } regardless of column name
    const widgets = data.widgets || data.active_widgets || []
    console.log('[layoutService] loadLayout FOUND:', { layoutItems: data.layout?.length, widgets: widgets?.length })
    return { layout: data.layout, widgets }
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
