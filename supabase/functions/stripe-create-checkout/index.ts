import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string

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
      supabaseUrl,
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

    // 2. Parse request body
    const { payment_ids, customer_email, customer_name, description, success_url, cancel_url, metadata, organization_id } = await req.json()

    if (!payment_ids || !customer_email) {
      return new Response(JSON.stringify({ error: 'Missing required fields: payment_ids, customer_email' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

    // 3. Validate payment_ids and derive amount from database
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

    // 4. Verify caller is authorized
    const playerIds = [...new Set(paymentRecords.map(p => p.player_id).filter(Boolean))]
    const seasonIds = [...new Set(paymentRecords.map(p => p.season_id).filter(Boolean))]

    // Get org IDs from seasons
    const { data: seasons } = await serviceClient
      .from('seasons')
      .select('id, organization_id')
      .in('id', seasonIds)

    const orgIds = [...new Set((seasons || []).map(s => s.organization_id).filter(Boolean))]

    // Check if caller is parent of the referenced players
    const { data: authorizedPlayers } = await serviceClient
      .from('players')
      .select('id')
      .in('id', playerIds)
      .eq('parent_account_id', user.id)

    const isParent = playerIds.length === 0 || authorizedPlayers?.length === playerIds.length

    // Check if caller is admin
    const { data: adminRoles } = await serviceClient
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .in('organization_id', orgIds)
      .eq('role', 'league_admin')
      .eq('is_active', true)

    const isAdmin = (adminRoles?.length ?? 0) > 0

    // Check platform admin
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

    // 5. Derive amount from database (NOT from request body)
    const serverAmount = paymentRecords.reduce((sum, p) => sum + Math.round(parseFloat(p.amount || 0) * 100), 0)

    if (serverAmount <= 0) {
      return new Response(JSON.stringify({ error: 'No payable amount found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // 6. Look up connected Stripe account from database (NOT from request)
    // Use the org_id derived from payment records, not the client-supplied one
    const resolvedOrgId = orgIds[0] || organization_id
    let stripeAccountId: string | null = null

    if (resolvedOrgId) {
      const { data: org, error: orgError } = await serviceClient
        .from('organizations')
        .select('stripe_account_id, stripe_onboarding_complete')
        .eq('id', resolvedOrgId)
        .single()

      if (orgError) {
        console.error('Error looking up organization:', orgError)
      } else if (org?.stripe_account_id) {
        if (!org.stripe_onboarding_complete) {
          return new Response(
            JSON.stringify({ error: 'Organization Stripe setup is incomplete' }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          )
        }
        stripeAccountId = org.stripe_account_id
      }
    }

    // Stripe SDK options — route to connected account if available
    const stripeOpts = stripeAccountId ? { stripeAccount: stripeAccountId } : undefined

    // 7. Find or create customer (scoped to connected account if applicable)
    let customer
    const existingCustomers = await stripe.customers.list(
      { email: customer_email, limit: 1 },
      stripeOpts
    )

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0]
    } else {
      customer = await stripe.customers.create(
        { email: customer_email, name: customer_name || undefined },
        stripeOpts
      )
    }

    // Platform application fee: $0.50 per transaction (50 cents)
    // Only applied when routing to a connected account
    const applicationFeeAmount = stripeAccountId ? 50 : undefined

    const sessionParams: any = {
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: description || 'Lynx Payment' },
          unit_amount: serverAmount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: success_url || `${req.headers.get('origin')}/payments?success=true`,
      cancel_url: cancel_url || `${req.headers.get('origin')}/payments?canceled=true`,
      metadata: { ...metadata, payment_ids: ids.join(','), user_id: user.id },
    }

    // Add application fee for connected accounts
    if (applicationFeeAmount && stripeAccountId) {
      sessionParams.payment_intent_data = {
        application_fee_amount: applicationFeeAmount,
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams, stripeOpts)

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: 'Checkout session creation failed' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
