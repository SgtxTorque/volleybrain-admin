/**
 * Stripe Checkout Service for VolleyBrain
 * 
 * Calls deployed Supabase Edge Functions to handle Stripe payments.
 * Uses the existing supabase client for consistent auth/config.
 */

import { supabase } from './supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

/**
 * Create a Stripe Checkout Session and get the redirect URL
 */
export async function createCheckoutSession({
  payment_ids,
  amount,
  customer_email,
  customer_name,
  description,
  success_url,
  cancel_url,
  metadata = {}
}) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/stripe-create-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      payment_ids,
      amount,
      customer_email,
      customer_name,
      description,
      success_url,
      cancel_url,
      metadata,
    }),
  })

  const data = await response.json()

  if (!response.ok || data.error) {
    throw new Error(data.error || 'Failed to create checkout session')
  }

  return data // { sessionId, url }
}

/**
 * Check URL params for Stripe return status
 */
export function getCheckoutResult() {
  const params = new URLSearchParams(window.location.search)
  return {
    success: params.get('success') === 'true',
    canceled: params.get('canceled') === 'true',
    sessionId: params.get('session_id'),
  }
}
