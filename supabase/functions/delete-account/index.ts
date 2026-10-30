import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

// The service role key is what allows deleting another table's rows and the login itself
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const jsonResponse = (body: object, status: number) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
})

const ENDED_SUBSCRIPTION_STATUSES = ['canceled', 'incomplete_expired']

// These don't cascade from auth.users, so the login can't be deleted until they're empty.
// profiles and user_subscriptions do cascade, so deleting the login clears them.
const USER_DATA_TABLES = ['workout_logs', 'body_metrics', 'blueprints', 'weight_goals', 'exercises']

const cancelSubscriptions = async (stripeCustomerId: string) => {
  const subscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: 'all',
    limit: 100
  })

  for (const sub of subscriptions.data) {
    if (!ENDED_SUBSCRIPTION_STATUSES.includes(sub.status)) {
      await stripe.subscriptions.cancel(sub.id)
    }
  }
}

const deleteProgressPhotos = async (userId: string) => {
  while (true) {
    const { data: files, error } = await supabaseAdmin.storage.from('progress_pics').list(userId, { limit: 1000 })
    if (error) throw error
    if (!files || files.length === 0) return

    const { error: removeError } = await supabaseAdmin.storage
      .from('progress_pics')
      .remove(files.map(file => `${userId}/${file.name}`))
    if (removeError) throw removeError
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // The user comes from their signed-in token, so nobody can delete a different account
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

  if (authError || !user) {
    return jsonResponse({ error: 'Not signed in' }, 401)
  }

  try {
    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (subscriptionError) throw subscriptionError

    // Billing stops first, so a failure further down can never leave someone paying
    // for an account that's already half gone. Every step is safe to run again.
    if (subscription?.stripe_customer_id) {
      await cancelSubscriptions(subscription.stripe_customer_id)
    }

    await deleteProgressPhotos(user.id)

    for (const table of USER_DATA_TABLES) {
      const { error } = await supabaseAdmin.from(table).delete().eq('user_id', user.id)
      if (error) throw error
    }

    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    if (deleteUserError) throw deleteUserError

    console.log(`🗑️ Deleted account ${user.id}`)
    return jsonResponse({ ok: true }, 200)
  } catch (err) {
    console.error(`Account deletion failed for ${user.id}:`, err)
    return jsonResponse({ error: 'Deletion failed' }, 500)
  }
})
