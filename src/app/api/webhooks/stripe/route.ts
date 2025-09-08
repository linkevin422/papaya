// app/api/webhooks/stripe/route.ts
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)


function isProStatus(status: string | null | undefined) {
  return status === 'active' || status === 'trialing'
}

async function setUserSubLevel({
  userId,
  email,
  level,
  stripeCustomerId,
  stripeSubscriptionId,
}: {
  userId?: string
  email?: string
  level: 'pro' | 'basic'
  stripeCustomerId?: string
  stripeSubscriptionId?: string
}) {
  const payload: Record<string, any> = {
    subscription_level: level,
    updated_at: new Date().toISOString(),
  }
  if (stripeCustomerId) payload.stripe_customer_id = stripeCustomerId
  if (stripeSubscriptionId) payload.stripe_subscription_id = stripeSubscriptionId

  if (userId) {
    await supabaseAdmin.from('profiles').update(payload).eq('id', userId)
    return
  }
  if (email) {
    await supabaseAdmin.from('profiles').update(payload).ilike('email', email)
  }
}

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')
  const buf = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    return new NextResponse(`Webhook signature verification failed: ${err.message}`, { status: 400 })
  }

  try {
    switch (event.type) {
      // Fired right after a successful Checkout for subscriptions
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const customerId = session.customer as string | undefined
        const subscriptionId = session.subscription as string | undefined
        const email =
          session.customer_details?.email ||
          session.customer_email ||
          undefined
        const userId =
          (session.metadata?.userId as string | undefined) ||
          (session.metadata?.supabase_user_id as string | undefined)

        await setUserSubLevel({
          userId,
          email,
          level: 'pro',
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
        })
        break
      }

      // Keep profile in sync if status changes later
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        const status = sub.status
        const level: 'pro' | 'basic' = isProStatus(status) ? 'pro' : 'basic'

        // Try to find the user by metadata on the subscription first
        const userId =
          (sub.metadata?.userId as string | undefined) ||
          (sub.metadata?.supabase_user_id as string | undefined)

        // If we do not have metadata here, we still update by customer id
        // by selecting the profile with matching stripe_customer_id
        if (userId) {
          await setUserSubLevel({
            userId,
            level,
            stripeCustomerId: customerId,
            stripeSubscriptionId: sub.id,
          })
        } else {
          // Fallback: update by stripe_customer_id
          await supabaseAdmin
            .from('profiles')
            .update({
              subscription_level: level,
              stripe_customer_id: customerId,
              stripe_subscription_id: sub.id,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_customer_id', customerId)
        }
        break
      }

      // Downgrade when canceled
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string

        const userId =
          (sub.metadata?.userId as string | undefined) ||
          (sub.metadata?.supabase_user_id as string | undefined)

        if (userId) {
          await setUserSubLevel({
            userId,
            level: 'basic',
            stripeCustomerId: customerId,
            stripeSubscriptionId: sub.id,
          })
        } else {
          await supabaseAdmin
            .from('profiles')
            .update({
              subscription_level: 'basic',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_customer_id', customerId)
        }
        break
      }

      default:
        // Ignore other events quietly
        break
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    return new NextResponse(`Webhook handler error: ${err.message}`, { status: 500 })
  }
}
