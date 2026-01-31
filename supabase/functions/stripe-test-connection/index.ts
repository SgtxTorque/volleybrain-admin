import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const secretKey = Deno.env.get('STRIPE_SECRET_KEY')
    
    if (!secretKey) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'STRIPE_SECRET_KEY not configured in Edge Function secrets'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Use fetch directly instead of Stripe SDK for better Deno compatibility
    const response = await fetch('https://api.stripe.com/v1/account', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: errorData.error?.message || 'Invalid API key' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const account = await response.json()
    const isTestMode = secretKey.includes('_test_')
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Connection successful! ${isTestMode ? '(Test Mode)' : '(Live Mode)'}`,
        account_name: account.business_profile?.name || account.email || 'Stripe Account',
        test_mode: isTestMode
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
