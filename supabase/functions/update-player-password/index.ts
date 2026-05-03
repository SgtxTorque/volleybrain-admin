// =============================================================================
// Edge Function: Update Player Password (requires service role key)
// =============================================================================
// Called when a parent changes their child's PIN. Updates the Supabase auth
// password for the player's auth account.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { isAuthorizedParent } from '../_shared/parent-auth.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, newPassword } = await req.json()

    if (!userId || !newPassword) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verify the request is from an authenticated parent
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // Verify parent is authenticated
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: { user: parentUser } } = await supabaseClient.auth.getUser()
    if (!parentUser) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verify the target user is a player_child owned by this parent
    const { data: player } = await supabaseAdmin
      .from('players')
      .select('id, parent_account_id')
      .eq('profile_id', userId)
      .single()

    if (!player) {
      return new Response(JSON.stringify({ error: 'You do not have permission to change this password' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (player.parent_account_id !== parentUser.id) {
      // Fallback: check player_parents for secondary parent authorization
      const isParent = await isAuthorizedParent(supabaseAdmin, parentUser.id, player.id);
      if (!isParent) {
        return new Response(JSON.stringify({ error: 'You do not have permission to change this password' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // Update the auth password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    })

    if (updateError) throw updateError

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
