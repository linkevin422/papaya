// app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const {
      priceId,
      customerEmail, // optional, helps Stripe prefill email
      successUrl,    // optional override
      cancelUrl,     // optional override
      userId,        // optional, pass Supabase user id so webhooks can map
    } = await req.json()

    if (!priceId) {
      return NextResponse.json({ error: 'Missing priceId' }, { status: 400 })
    }

    const origin =
      successUrl
        ? new URL(successUrl).origin
        : req.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl ?? `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl ?? `${origin}/billing/cancel`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_email: customerEmail,
      // Turn this on after Stripe Tax is configured
      // automatic_tax: { enabled: true },
      metadata: {
        app: 'papaya',
        plan_price_id: priceId,
        ...(userId ? { userId } : {}),
      },
      subscription_data: {
        metadata: {
          app: 'papaya',
          plan_price_id: priceId,
          ...(userId ? { userId } : {}),
        },
      },
    })

    return NextResponse.json({ id: session.id, url: session.url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Stripe error' }, { status: 500 })
  }
}
