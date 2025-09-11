// app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const STRIPE_API_VERSION = '2025-08-27.basil' as const

async function getStripe() {
  const { default: Stripe } = await import('stripe')
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
  return new Stripe(key, { apiVersion: STRIPE_API_VERSION })
}

export async function POST(req: NextRequest) {
  try {
    const { priceId, successUrl, cancelUrl, customerId, mode = 'subscription' } = await req.json()
    const stripe = await getStripe()

    const origin =
      req.headers.get('origin') ??
      process.env.NEXT_PUBLIC_APP_URL ??
      'http://localhost:3000'

    // Get the current user id on the server so we can pass it to Stripe metadata
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id

    const session = await stripe.checkout.sessions.create({
      mode,
      customer: customerId, // ok to omit and let Stripe create a new one
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl ?? `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl ?? `${origin}/billing/cancel`,
      allow_promotion_codes: true,
      metadata: userId ? { userId } : undefined,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Checkout failed' }, { status: 500 })
  }
}
