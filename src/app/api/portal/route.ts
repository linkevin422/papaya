// app/api/portal/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STRIPE_API_VERSION = '2025-08-27.basil' as const;

// local, lazy Stripe getter so nothing throws at import time
async function getStripe() {
  const { default: Stripe } = await import('stripe');
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  return new Stripe(key, { apiVersion: STRIPE_API_VERSION });
}

export async function POST(req: NextRequest) {
  try {
    const { customerId, sessionId, returnUrl } = await req.json();

    const stripe = await getStripe();

    let customer = customerId as string | undefined;
    if (!customer && sessionId) {
      const cs = await stripe.checkout.sessions.retrieve(sessionId);
      customer = cs.customer as string | undefined;
    }
    if (!customer) {
      return NextResponse.json({ error: 'Missing customerId or sessionId' }, { status: 400 });
    }

    const origin = returnUrl
      ? new URL(returnUrl).origin
      : req.headers.get('origin') ??
        process.env.NEXT_PUBLIC_APP_URL ??
        'http://localhost:3000';

    const portal = await stripe.billingPortal.sessions.create({
      customer,
      return_url: returnUrl ?? `${origin}/dashboard/billing`,
    });

    return NextResponse.json({ url: portal.url });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Stripe error' }, { status: 500 });
  }
}
