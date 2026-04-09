// =============================================================================
// Edge Function: Delete User Account (platform admin only)
// =============================================================================
// Permanently deletes a user from BOTH the auth.users table and all related
// profile/role/membership data. The client-side anon key cannot touch
// auth.users, so this runs with the service role key.
//
// Security:
//   - Requires a valid Bearer token on the request (caller must be logged in)
//   - Caller's profile.is_platform_admin must be true
//
// Why this matters: Deleting only the profiles row leaves a ghost auth.users
// record behind. The email becomes permanently "taken" — the user can't sign
// up again, and forgot-password sends a reset link to a profile-less account.

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
    const { userId, email } = await req.json().catch(() => ({}))

    if (!userId && !email) {
      return json({ error: 'userId or email required' }, 400)
    }

    // --- 1. Verify caller is authenticated ---------------------------------
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user: callerUser } } = await supabaseClient.auth.getUser()
    if (!callerUser) return json({ error: 'Not authenticated' }, 401)

    // --- 2. Verify caller is a platform admin ------------------------------
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('is_platform_admin')
      .eq('id', callerUser.id)
      .single()

    if (!callerProfile?.is_platform_admin) {
      return json({ error: 'Platform admin access required' }, 403)
    }

    // --- 3. Resolve target user id ----------------------------------------
    let targetUserId: string | undefined = userId
    if (!targetUserId && email) {
      const { data: listResult } = await supabaseAdmin.auth.admin.listUsers()
      const targetAuth = listResult?.users?.find(
        (u: any) => u.email?.toLowerCase() === String(email).toLowerCase()
      )
      targetUserId = targetAuth?.id
    }
    if (!targetUserId) return json({ error: 'User not found' }, 404)

    // Sanity: don't let a platform admin delete their own account via this path
    if (targetUserId === callerUser.id) {
      return json({ error: 'Cannot delete your own account' }, 400)
    }

    // --- 4. Delete dependent rows in dependency order ----------------------
    // Any individual failure is logged but not fatal — the goal is to reach
    // the auth.users delete at the end. If dependent tables have ON DELETE
    // CASCADE to profiles.id, those are already handled; we delete explicitly
    // for the ones that don't.

    const warnings: string[] = []

    async function safeDelete(label: string, fn: () => Promise<{ error: any }>) {
      try {
        const { error } = await fn()
        if (error) warnings.push(`${label}: ${error.message}`)
      } catch (e: any) {
        warnings.push(`${label}: ${e?.message || 'unknown'}`)
      }
    }

    // team_coaches (via coaches rows owned by this user)
    try {
      const { data: coachRows } = await supabaseAdmin
        .from('coaches')
        .select('id')
        .eq('profile_id', targetUserId)
      const coachIds = (coachRows || []).map((c: any) => c.id)
      if (coachIds.length > 0) {
        await safeDelete('team_coaches', () =>
          supabaseAdmin.from('team_coaches').delete().in('coach_id', coachIds)
        )
      }
    } catch (e: any) {
      warnings.push(`team_coaches lookup: ${e?.message || 'unknown'}`)
    }

    await safeDelete('coaches', () =>
      supabaseAdmin.from('coaches').delete().eq('profile_id', targetUserId!)
    )
    await safeDelete('user_roles', () =>
      supabaseAdmin.from('user_roles').delete().eq('user_id', targetUserId!)
    )
    await safeDelete('channel_members', () =>
      supabaseAdmin.from('channel_members').delete().eq('user_id', targetUserId!)
    )
    await safeDelete('invitations (accepted_by)', () =>
      supabaseAdmin.from('invitations').delete().eq('accepted_by', targetUserId!)
    )
    await safeDelete('profiles', () =>
      supabaseAdmin.from('profiles').delete().eq('id', targetUserId!)
    )

    // --- 5. Delete from auth.users — the crucial step ---------------------
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)
    if (authDeleteError) {
      return json(
        {
          error: `Auth delete failed: ${authDeleteError.message}`,
          warnings,
        },
        500
      )
    }

    return json({
      success: true,
      userId: targetUserId,
      message: `User ${targetUserId} fully deleted (auth + data)`,
      warnings,
    })
  } catch (err: any) {
    return json({ error: err?.message || 'Internal error' }, 500)
  }
})
