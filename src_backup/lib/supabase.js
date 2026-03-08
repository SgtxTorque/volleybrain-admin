import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uqpjvbiuokwpldjvxiby.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcGp2Yml1b2t3cGxkanZ4aWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyMTEwODMsImV4cCI6MjA4Mjc4NzA4M30.k643d5gVS2uWWe_QgSvAMjWVuRgBIU2wI0bR38vYDCc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function checkIsAdmin(userId) {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'league_admin')
      .eq('is_active', true)
    
    return data && data.length > 0
  } catch (err) {
    console.error('checkIsAdmin error:', err)
    return false
  }
}

export async function getUserOrganization(userId) {
  try {
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('organization_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(1)
    
    if (roleError || !roleData || roleData.length === 0) {
      console.error('No role found:', roleError)
      return null
    }

    const orgId = roleData[0].organization_id

    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single()
    
    if (orgError) {
      console.error('Org fetch error:', orgError)
      return null
    }

    return orgData
  } catch (err) {
    console.error('getUserOrganization error:', err)
    return null
  }
}
