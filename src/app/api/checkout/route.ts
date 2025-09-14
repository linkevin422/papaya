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
    const { priceId, successUrl, cancelUrl, customerId } = await req.json()
    const stripe = await getStripe()

    const origin =
      req.headers.get('origin') ??
      process.env.NEXT_PUBLIC_APP_URL ??
      'http://localhost:3000'

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      
      const userId = user?.id ?? undefined
      const email = user?.email ?? undefined
      
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId || undefined,                 // use existing if you have it
        customer_email: !customerId ? email : undefined,   // otherwise bind to Supabase email
        client_reference_id: userId,                       // extra handle for webhook
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl ?? `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl ?? `${origin}/pricing`,
        allow_promotion_codes: true,
        metadata: userId ? { userId } : undefined,         // surface userId on session
        subscription_data: userId ? { metadata: { userId } } : undefined, // and on subscription
      })
              
    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Checkout failed' }, { status: 500 })
  }
}
