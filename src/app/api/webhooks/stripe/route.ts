// app/api/webhooks/stripe/route.ts
import { headers } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STRIPE_API_VERSION = '2025-08-27.basil' as const;

// Lazy Stripe so nothing runs at import time
async function getStripe() {
  const { default: Stripe } = await import('stripe');
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  return new Stripe(key, { apiVersion: STRIPE_API_VERSION });
}

export async function POST(req: Request) {
  // 1) pull signature + secret
  const sig = (await headers()).get('stripe-signature');
  if (!sig) return new Response('Missing stripe-signature', { status: 400 });

  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!whSecret) return new Response('Missing STRIPE_WEBHOOK_SECRET', { status: 500 });

  // 2) read the raw body
  const raw = await req.text();

  // 3) verify and parse
  const stripe = await getStripe();
  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, sig, whSecret);
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message ?? 'invalid signature'}`, { status: 400 });
  }

  // 4) handle events
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any;
      // TODO: your fulfillment
      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as any;
      // TODO: sync subscription status to your DB
      break;
    }
    default:
      // no-op
      break;
  }

  return new Response('ok');
}
