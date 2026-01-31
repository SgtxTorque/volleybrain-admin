import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string

serve(async (req) => {
  const body = await req.text()
  let event: Stripe.Event

  try {
    event = JSON.parse(body)
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const paymentIds = session.metadata?.payment_ids?.split(',').filter(Boolean) || []
      
      if (paymentIds.length > 0) {
        await supabase
          .from('payments')
          .update({
            paid: true,
            paid_date: new Date().toISOString().split('T')[0],
            payment_method: 'stripe',
            reference_number: session.payment_intent as string,
            stripe_payment_intent_id: session.payment_intent as string,
            status: 'verified',
            verified_at: new Date().toISOString(),
          })
          .in('id', paymentIds)
        
        console.log(`Marked ${paymentIds.length} payments as paid`)
      }
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const paymentIds = paymentIntent.metadata?.payment_ids?.split(',').filter(Boolean) || []
      
      if (paymentIds.length > 0) {
        await supabase
          .from('payments')
          .update({
            paid: true,
            paid_date: new Date().toISOString().split('T')[0],
            payment_method: 'stripe',
            reference_number: paymentIntent.id,
            stripe_payment_intent_id: paymentIntent.id,
            status: 'verified',
            verified_at: new Date().toISOString(),
          })
          .in('id', paymentIds)
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})