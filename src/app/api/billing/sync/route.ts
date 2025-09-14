import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const STRIPE_API_VERSION = '2025-08-27.basil' as const

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY! // service role bypasses RLS
  return createClient(url, key)
}

async function getStripe() {
  const { default: Stripe } = await import('stripe')
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: STRIPE_API_VERSION })
}

export async function GET(req: NextRequest) {
  try {
    const sessionId = new URL(req.url).searchParams.get('session_id')
    if (!sessionId) return NextResponse.json({ ok: false, error: 'Missing session_id' }, { status: 400 })

    const stripe = await getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['subscription'] })

    const customerId = session.customer as string | undefined
    const userId =
      (session.metadata as any)?.userId ||
      (session as any)?.client_reference_id ||
      undefined
    const email =
      session.customer_details?.email ||
      (session as any)?.customer_email ||
      undefined

    console.log('SYNC linkers:', { customerId, userId, email })

    if (!customerId) {
      return NextResponse.json({ ok: false, error: 'No customer on session' }, { status: 400 })
    }

    const client = sb()
    let updated = false

    if (userId) {
      const { data, error } = await client
        .from('profiles')
        .update({ stripe_customer_id: customerId, subscription_level: 'pro' })
        .eq('id', userId)
        .select('id')
      if (error) throw error
      updated = !!(data && data.length)
    }

    if (!updated && email) {
      const { data, error } = await client
        .from('profiles')
        .update({ stripe_customer_id: customerId, subscription_level: 'pro' })
        .eq('email', email)
        .select('id')
      if (error) throw error
      updated = !!(data && data.length)
    }

    return NextResponse.json({
      ok: true,
      updated,
      linkers: { customerId, userId, email },
      sessionId,
    })
  } catch (e: any) {
    console.error('SYNC error:', e)
    return NextResponse.json({ ok: false, error: e?.message ?? 'sync failed' }, { status: 500 })
  }
}
