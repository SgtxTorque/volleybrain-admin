import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') as string

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  let event: Stripe.Event

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured')
    return new Response(
      JSON.stringify({ error: 'Webhook secret not configured' }),
      { status: 500 }
    )
  }

  if (!signature) {
    return new Response(
      JSON.stringify({ error: 'Missing stripe-signature header' }),
      { status: 400 }
    )
  }

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return new Response(
      JSON.stringify({ error: 'Invalid signature' }),
      { status: 400 }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  console.log(`Processing webhook event: ${event.type}`)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const paymentIds = session.metadata?.payment_ids?.split(',').filter(Boolean) || []

        console.log(`Checkout completed for payments: ${paymentIds.join(', ')}`)

        if (paymentIds.length > 0) {
          const { data, error } = await supabase
            .from('payments')
            .update({
              paid: true,
              paid_date: new Date().toISOString().split('T')[0],
              payment_method: 'stripe',
              reference_number: session.payment_intent as string,
              stripe_payment_intent_id: session.payment_intent as string,
              status: 'verified',
              verified_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .in('id', paymentIds)

          if (error) {
            console.error('Error updating payments:', error)
          } else {
            console.log(`✅ Marked ${paymentIds.length} payments as paid`)
          }
        }
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const paymentIds = paymentIntent.metadata?.payment_ids?.split(',').filter(Boolean) || []

        console.log(`Payment intent succeeded: ${paymentIntent.id}`)

        if (paymentIds.length > 0) {
          const { error } = await supabase
            .from('payments')
            .update({
              paid: true,
              paid_date: new Date().toISOString().split('T')[0],
              payment_method: 'stripe',
              reference_number: paymentIntent.id,
              stripe_payment_intent_id: paymentIntent.id,
              status: 'verified',
              verified_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .in('id', paymentIds)

          if (error) {
            console.error('Error updating payments:', error)
          } else {
            console.log(`✅ Marked ${paymentIds.length} payments as paid via payment_intent`)
          }
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log(`❌ Payment failed: ${paymentIntent.id} - ${paymentIntent.last_payment_error?.message}`)
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const paymentIntentId = charge.payment_intent as string

        console.log(`🔄 Refund received for payment intent: ${paymentIntentId}`)

        if (paymentIntentId) {
          const { error } = await supabase
            .from('payments')
            .update({
              paid: false,
              status: 'refunded',
              payment_method: 'stripe',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_payment_intent_id', paymentIntentId)

          if (error) {
            console.error('Error processing refund:', error)
          } else {
            console.log(`✅ Marked payment as refunded`)
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
