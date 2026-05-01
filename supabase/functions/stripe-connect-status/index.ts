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

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 2b. Verify caller is admin of this organization
    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', organization_id)
      .eq('role', 'league_admin')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('is_platform_admin')
      .eq('id', user.id)
      .single()

    if (!adminRole && callerProfile?.is_platform_admin !== true) {
      return new Response(
        JSON.stringify({ error: 'Admin access required for this organization' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Look up the org's stripe_account_id
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('stripe_account_id, stripe_onboarding_complete')
      .eq('id', organization_id)
      .single()

    if (orgError || !org) {
      return new Response(
        JSON.stringify({ error: 'Organization not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. No account connected
    if (!org.stripe_account_id) {
      return new Response(
        JSON.stringify({ connected: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // 5. Retrieve account from Stripe
    const account = await stripe.accounts.retrieve(org.stripe_account_id)

    // 6. Check onboarding status
    const chargesEnabled = account.charges_enabled || false
    const payoutsEnabled = account.payouts_enabled || false
    const detailsSubmitted = account.details_submitted || false
    const onboardingComplete = chargesEnabled && detailsSubmitted

    // 7. Update organizations table if status changed
    if (org.stripe_onboarding_complete !== onboardingComplete) {
      await supabase
        .from('organizations')
        .update({
          stripe_onboarding_complete: onboardingComplete,
          stripe_enabled: onboardingComplete ? true : org.stripe_onboarding_complete,
          updated_at: new Date().toISOString(),
        })
        .eq('id', organization_id)
    }

    // 8. Return status
    const businessName = account.business_profile?.name
      || account.settings?.dashboard?.display_name
      || account.email
      || 'Stripe Account'

    return new Response(
      JSON.stringify({
        connected: true,
        account_id: org.stripe_account_id,
        charges_enabled: chargesEnabled,
        payouts_enabled: payoutsEnabled,
        details_submitted: detailsSubmitted,
        onboarding_complete: onboardingComplete,
        business_name: businessName,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    console.error('stripe-connect-status error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to check Stripe status' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
