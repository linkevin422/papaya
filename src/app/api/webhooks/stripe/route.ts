// app/api/webhooks/stripe/route.ts
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const STRIPE_API_VERSION = '2025-08-27.basil' as const

// Lazy Stripe so nothing runs at import time
async function getStripe() {
  const { default: Stripe } = await import('stripe')
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
  return new Stripe(key, { apiVersion: STRIPE_API_VERSION })
}

export async function POST(req: Request) {
  const sig = (await headers()).get('stripe-signature')
  if (!sig) return new Response('Missing stripe-signature', { status: 400 })

  const whSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!whSecret) return new Response('Missing STRIPE_WEBHOOK_SECRET', { status: 500 })

  const raw = await req.text()
  const stripe = await getStripe()

  let event
  try {
    event = await stripe.webhooks.constructEventAsync(raw, sig, whSecret)
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message ?? 'invalid signature'}`, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        // Save the Stripe customer on the user profile so the Billing Portal works.
        const session = event.data.object as any
        const customerId = session.customer as string | undefined
        const userId = session.metadata?.userId as string | undefined

        if (customerId && userId) {
          const supabase = createClient()
          await supabase
            .from('profiles')
            .update({ stripe_customer_id: customerId })
            .eq('id', userId)
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        // You can sync subscription status later if you want UI badges.
        break
      }

      default:
        break
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'handler failed' }, { status: 500 })
  }
}
