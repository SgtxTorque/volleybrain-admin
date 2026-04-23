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
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') as string)
      .auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Parse request body
    const { organization_id } = await req.json()

    if (!organization_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: organization_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Verify user is an admin/director of the organization
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organization_id)
      .in('role', ['admin', 'director', 'owner'])

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_platform_admin')
      .eq('id', user.id)
      .single()

    const isAdmin = (roles && roles.length > 0) || profile?.is_platform_admin === true

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'You must be an admin of this organization' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Check if org already has a stripe_account_id
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('stripe_account_id, stripe_onboarding_complete, name')
      .eq('id', organization_id)
      .single()

    if (orgError || !org) {
      return new Response(
        JSON.stringify({ error: 'Organization not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const origin = req.headers.get('origin') || 'https://www.thelynxapp.com'
    let stripeAccountId = org.stripe_account_id

    // 4a. Already connected and onboarding complete
    if (stripeAccountId && org.stripe_onboarding_complete) {
      return new Response(
        JSON.stringify({ already_connected: true, account_id: stripeAccountId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // 5a. No account yet — create a Standard Connect account
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'standard',
        email: user.email,
        metadata: {
          organization_id,
          platform: 'lynx',
        },
      })

      stripeAccountId = account.id

      // Save the account ID to the organization
      const { error: updateError } = await supabase
        .from('organizations')
        .update({
          stripe_account_id: account.id,
          stripe_onboarding_complete: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', organization_id)

      if (updateError) {
        console.error('Error saving stripe_account_id:', updateError)
      }
    }

    // 5b. Create an Account Link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${origin}/settings/payment-setup?stripe_refresh=true`,
      return_url: `${origin}/settings/payment-setup?stripe_return=true`,
      type: 'account_onboarding',
    })

    return new Response(
      JSON.stringify({ url: accountLink.url, account_id: stripeAccountId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    console.error('stripe-connect-onboard error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
