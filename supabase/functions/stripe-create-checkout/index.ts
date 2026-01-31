import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno'

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
    const { payment_ids, amount, customer_email, customer_name, description, success_url, cancel_url, metadata } = await req.json()

    if (!payment_ids || !amount || !customer_email) {
      throw new Error('Missing required fields: payment_ids, amount, customer_email')
    }

    let customer
    const existingCustomers = await stripe.customers.list({ email: customer_email, limit: 1 })
    
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0]
    } else {
      customer = await stripe.customers.create({ email: customer_email, name: customer_name || undefined })
    }

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: description || 'VolleyBrain Payment' },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: success_url || `${req.headers.get('origin')}/payments?success=true`,
      cancel_url: cancel_url || `${req.headers.get('origin')}/payments?canceled=true`,
      metadata: { ...metadata, payment_ids: Array.isArray(payment_ids) ? payment_ids.join(',') : payment_ids },
    })

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})