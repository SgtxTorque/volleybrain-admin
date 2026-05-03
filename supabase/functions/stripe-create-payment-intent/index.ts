import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { isAuthorizedParent } from '../_shared/parent-auth.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Authenticate the caller
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const { payment_ids, customer_email, customer_name, metadata } = await req.json()

    if (!payment_ids || !customer_email) {
      return new Response(JSON.stringify({ error: 'Missing required fields: payment_ids, customer_email' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // 2. Validate payment_ids and derive amount from database
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const ids = Array.isArray(payment_ids) ? payment_ids : [payment_ids]
    const { data: paymentRecords, error: paymentError } = await serviceClient
      .from('payments')
      .select('id, amount, player_id, season_id')
      .in('id', ids)

    if (paymentError || !paymentRecords?.length) {
      return new Response(JSON.stringify({ error: 'Invalid payment references' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // 3. Verify caller is authorized (parent of players or org admin)
    const playerIds = [...new Set(paymentRecords.map(p => p.player_id).filter(Boolean))]
    const seasonIds = [...new Set(paymentRecords.map(p => p.season_id).filter(Boolean))]

    // Get org IDs from seasons
    const { data: seasons } = await serviceClient
      .from('seasons')
      .select('id, organization_id')
      .in('id', seasonIds)

    const orgIds = [...new Set((seasons || []).map(s => s.organization_id).filter(Boolean))]

    // Reject mixed-org payment sets — all payments must belong to one org
    if (orgIds.length !== 1) {
      return new Response(JSON.stringify({ error: 'All payments must belong to the same organization' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const resolvedOrgId = orgIds[0]

    // Check if caller is parent of the referenced players (primary or secondary)
    const { data: authorizedPlayers } = await serviceClient
      .from('players')
      .select('id')
      .in('id', playerIds)
      .eq('parent_account_id', user.id)

    let isParent = playerIds.length === 0 || authorizedPlayers?.length === playerIds.length

    // Fallback: check player_parents for any players not matched by primary parent_account_id
    if (!isParent && playerIds.length > 0) {
      const primaryIds = new Set((authorizedPlayers || []).map(p => p.id))
      const unmatched = playerIds.filter(id => !primaryIds.has(id))
      const secondaryChecks = await Promise.all(
        unmatched.map(pid => isAuthorizedParent(serviceClient, user.id, pid))
      )
      isParent = secondaryChecks.every(Boolean)
    }

    // Check if caller is admin of the specific org
    const { data: adminRoles } = await serviceClient
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', resolvedOrgId)
      .eq('role', 'league_admin')
      .eq('is_active', true)

    const isAdmin = (adminRoles?.length ?? 0) > 0

    // Also check platform admin
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('is_platform_admin')
      .eq('id', user.id)
      .single()

    const isPlatformAdmin = profile?.is_platform_admin === true

    if (!isParent && !isAdmin && !isPlatformAdmin) {
      return new Response(JSON.stringify({ error: 'Not authorized for these payments' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // 4. Derive amount from database (NOT from request body)
    const serverAmount = paymentRecords.reduce((sum, p) => sum + Math.round(parseFloat(p.amount || 0) * 100), 0)

    if (serverAmount <= 0) {
      return new Response(JSON.stringify({ error: 'No payable amount found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // 5. Find or create Stripe customer
    let customer
    const existingCustomers = await stripe.customers.list({ email: customer_email, limit: 1 })

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0]
    } else {
      customer = await stripe.customers.create({ email: customer_email, name: customer_name || undefined })
    }

    // 6. Create payment intent with server-derived amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: serverAmount,
      currency: 'usd',
      customer: customer.id,
      automatic_payment_methods: { enabled: true },
      metadata: { ...metadata, payment_ids: ids.join(','), user_id: user.id },
    })

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: 'Payment processing failed' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
