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
    const { payment_ids, amount, customer_email, customer_name, description, success_url, cancel_url, metadata, organization_id } = await req.json()

    if (!payment_ids || !amount || !customer_email) {
      throw new Error('Missing required fields: payment_ids, amount, customer_email')
    }

    // Look up the org's connected Stripe account
    let stripeAccountId: string | null = null

    if (organization_id) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('stripe_account_id, stripe_onboarding_complete')
        .eq('id', organization_id)
        .single()

      if (orgError) {
        console.error('Error looking up organization:', orgError)
      } else if (org?.stripe_account_id) {
        if (!org.stripe_onboarding_complete) {
          throw new Error('Organization Stripe setup is incomplete. Please complete onboarding first.')
        }
        stripeAccountId = org.stripe_account_id
      }
    }

    // Stripe SDK options — route to connected account if available
    const stripeOpts = stripeAccountId ? { stripeAccount: stripeAccountId } : undefined

    // Find or create customer (scoped to connected account if applicable)
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
          unit_amount: amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: success_url || `${req.headers.get('origin')}/payments?success=true`,
      cancel_url: cancel_url || `${req.headers.get('origin')}/payments?canceled=true`,
      metadata: { ...metadata, payment_ids: Array.isArray(payment_ids) ? payment_ids.join(',') : payment_ids },
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
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
