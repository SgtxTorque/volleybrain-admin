// =============================================================================
// Edge Function: Delete User Account — auth.users cleanup only
// =============================================================================
// Called AFTER the client-side RPC `delete_profile_cascade` has already removed
// all profile/role/membership data from 60+ tables. This function's sole job is
// to delete the auth.users record, which requires the service role key.
//
// Security:
//   - Requires a valid Bearer token on the request (caller must be logged in)
//   - Caller's profile.is_platform_admin must be true
//   - Cannot delete your own account

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId } = await req.json().catch(() => ({}))

    if (!userId) {
      return json({ error: 'userId is required' }, 400)
    }

    // --- 1. Verify caller is authenticated ---------------------------------
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user: callerUser } } = await supabaseClient.auth.getUser()
    if (!callerUser) return json({ error: 'Unauthorized' }, 401)

    // --- 2. Verify caller is a platform admin ------------------------------
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('is_platform_admin')
      .eq('id', callerUser.id)
      .single()

    if (!callerProfile?.is_platform_admin) {
      return json({ error: 'Forbidden — platform admin required' }, 403)
    }

    // --- 3. Prevent self-deletion ------------------------------------------
    if (userId === callerUser.id) {
      return json({ error: 'Cannot delete your own account' }, 400)
    }

    // --- 4. Delete from auth.users -----------------------------------------
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (authDeleteError) {
      return json(
        { error: `Failed to delete auth account: ${authDeleteError.message}` },
        500
      )
    }

    return json({ success: true })
  } catch (err: any) {
    return json({ error: err?.message || 'Internal error' }, 500)
  }
})
