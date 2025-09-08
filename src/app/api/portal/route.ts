// app/api/portal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const { customerId, sessionId, returnUrl } = await req.json();

    let customer = customerId as string | undefined;

    if (!customer && sessionId) {
      const cs = await stripe.checkout.sessions.retrieve(sessionId);
      customer = cs.customer as string | undefined;
    }

    if (!customer) {
      return NextResponse.json({ error: 'Missing customerId or sessionId' }, { status: 400 });
    }

    const origin =
      returnUrl
        ? new URL(returnUrl).origin
        : req.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL;

    const portal = await stripe.billingPortal.sessions.create({
      customer,
      return_url: returnUrl ?? `${origin}/dashboard/billing`,
    });

    return NextResponse.json({ url: portal.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Stripe error' }, { status: 500 });
  }
}
