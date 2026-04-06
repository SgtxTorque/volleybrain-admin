// =============================================================================
// Edge Function: Create Player Account (requires service role key)
// =============================================================================
// Called by parent dashboard when creating a Player Pass for their child.
// Validates parent ownership of the player, then creates a Supabase auth user.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const { email, password, playerName, playerId, organizationId } = await req.json()

    if (!email || !password || !playerId || !organizationId) {
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

    // Verify parent has rights to this player (parent_account_id must match)
    const { data: player } = await supabaseAdmin
      .from('players')
      .select('id, parent_account_id')
      .eq('id', playerId)
      .single()

    if (!player) {
      return new Response(JSON.stringify({ error: 'Player not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (player.parent_account_id !== parentUser.id) {
      return new Response(JSON.stringify({ error: 'You do not have permission to create an account for this player' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create the auth account (auto-confirm — no verification email)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: playerName,
        account_type: 'player_child',
        player_id: playerId,
        parent_id: parentUser.id,
      }
    })

    if (authError) {
      if (authError.message?.includes('already been registered')) {
        return new Response(JSON.stringify({ error: 'A player account with this username already exists. Try a different username.' }), {
          status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      throw authError
    }

    return new Response(JSON.stringify({ userId: authData.user.id }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
