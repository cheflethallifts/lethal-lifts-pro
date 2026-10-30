import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'

// 1. Initialize Stripe with your secure Secret Key
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

// WebCrypto provider required for Deno environment
const cryptoProvider = Stripe.createSubtleCryptoProvider()

// Initialize Supabase with the SERVICE_ROLE_KEY to bypass RLS policies
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// past_due keeps Pro while Stripe retries the card. If the retries run out, the
// subscription moves to canceled or unpaid and a new event removes Pro.
const PRO_SUBSCRIPTION_STATUSES = ['active', 'trialing', 'past_due']

// Asks Stripe for the customer's current subscriptions instead of trusting one
// event. Events can arrive out of order, and a customer can hold more than one
// subscription, so cancelling one shouldn't remove Pro if another is still paid.
const syncProStatus = async (stripeCustomerId: string) => {
  const subscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: 'all',
    limit: 100
  })
  const isPro = subscriptions.data.some(sub => PRO_SUBSCRIPTION_STATUSES.includes(sub.status))

  const { data, error } = await supabaseAdmin
    .from('user_subscriptions')
    .update({ is_pro: isPro, updated_at: new Date().toISOString() })
    .eq('stripe_customer_id', stripeCustomerId)
    .select('user_id')

  if (error) throw error

  if (data.length === 0) {
    console.warn(`No user found for Stripe customer ${stripeCustomerId}`)
  } else {
    console.log(`🔄 Synced ${stripeCustomerId}: is_pro = ${isPro}`)
  }
}

serve(async (req) => {
  // 2. Stripe requires verifying a cryptographic signature so hackers can't fake payments
  const signature = req.headers.get('Stripe-Signature')
  const body = await req.text()

  let receivedEvent;
  try {
    receivedEvent = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
      undefined,
      cryptoProvider
    )
  } catch (err) {
    console.error(`⚠️  Webhook signature verification failed.`, err.message)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  console.log(`✅ Success: Received event type ${receivedEvent.type}`)

  // 3. Handle successful checkout sessions
  if (receivedEvent.type === 'checkout.session.completed') {
    const session = receivedEvent.data.object;

    // Remember the client_reference_id we appended to the link in App.jsx? Here it is!
    const userId = session.client_reference_id;
    const stripeCustomerId = session.customer;

    if (userId) {
      // Force update the database to make this user a PRO!
      const { error } = await supabaseAdmin
        .from('user_subscriptions')
        .upsert({
          user_id: userId,
          is_pro: true,
          stripe_customer_id: stripeCustomerId,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error("Database update failed:", error)
        return new Response("Database error", { status: 500 })
      }

      console.log(`🎉 Upgraded user ${userId} to PRO!`)
    } else {
      // A retry can't fix this, so it's logged for a manual fix instead of failing.
      // It means someone paid through a link that didn't carry their user ID.
      console.error(`🚨 Paid checkout ${session.id} has no client_reference_id. Customer: ${stripeCustomerId}`)
    }
  }

  // 4. Handle cancellations, failed payments and re-activations
  if (receivedEvent.type === 'customer.subscription.updated' || receivedEvent.type === 'customer.subscription.deleted') {
    const subscription = receivedEvent.data.object;

    try {
      await syncProStatus(subscription.customer as string)
    } catch (err) {
      // A 500 tells Stripe to retry, so a brief outage can't leave Pro out of sync
      console.error("Subscription sync failed:", err)
      return new Response("Sync error", { status: 500 })
    }
  }

  // Tell Stripe we successfully received and processed the event
  return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
  })
})
