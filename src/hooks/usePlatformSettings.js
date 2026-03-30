import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function usePlatformSettings(category) {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)

  const loadSettings = useCallback(async () => {
    setLoading(true)
    const query = supabase.from('platform_settings').select('*')
    if (category) query.eq('category', category)
    const { data } = await query
    const map = {}
    ;(data || []).forEach(s => { map[s.key] = s.value })
    setSettings(map)
    setLoading(false)
  }, [category])

  useEffect(() => { loadSettings() }, [loadSettings])

  const updateSetting = useCallback(async (key, value, userId) => {
    const { error } = await supabase
      .from('platform_settings')
      .upsert({ key, value, category: category || 'general', updated_by: userId, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    if (!error) {
      setSettings(prev => ({ ...prev, [key]: value }))
      // Audit log
      await supabase.from('platform_admin_actions').insert({
        admin_id: userId,
        action_type: 'update_setting',
        target_type: 'setting',
        target_id: null,
        details: { key, category }
      })
    }
    return { error }
  }, [category])

  return { settings, loading, updateSetting, reload: loadSettings }
}
