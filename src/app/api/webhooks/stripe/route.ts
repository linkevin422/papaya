import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const STRIPE_API_VERSION = '2025-08-27.basil' as const

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key) // bypasses RLS
}

async function getStripe() {
  const { default: Stripe } = await import('stripe')
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: STRIPE_API_VERSION })
}

async function setLevelBy(
  where: { id?: string; email?: string; stripe_customer_id?: string },
  updates: Record<string, any>
) {
  const client = sb()
  const query = client.from('profiles').update(updates)
  if (where.id) query.eq('id', where.id)
  if (where.email) query.eq('email', where.email)
  if (where.stripe_customer_id) query.eq('stripe_customer_id', where.stripe_customer_id)
  const { data, error } = await query.select('id, email, stripe_customer_id, subscription_level')
  console.log('📝 UPDATE where=', where, 'updates=', updates, 'res=', { data, error })
  if (error) throw error
  return data ?? []
}

function mapLevel(status?: string): 'pro' | 'basic' {
  return status === 'active' || status === 'trialing' ? 'pro' : 'basic'
}

export async function POST(req: Request) {
  console.log('🔥 Stripe webhook hit START')
  const sig = (await headers()).get('stripe-signature')
  if (!sig) return new Response('Missing stripe-signature', { status: 400 })

  const whsec = process.env.STRIPE_WEBHOOK_SECRET
  if (!whsec) return new Response('Missing STRIPE_WEBHOOK_SECRET', { status: 500 })

  const raw = await req.text()
  const stripe = await getStripe()

  let event
  try {
    event = await stripe.webhooks.constructEventAsync(raw, sig, whsec)
    console.log('📦 EVENT:', event.type)
  } catch (err: any) {
    console.error('❌ constructEvent failed:', err?.message)
    return new Response(`Webhook Error: ${err?.message ?? 'invalid signature'}`, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as any
        const customerId = s.customer as string | undefined
        const userId = (s.metadata && s.metadata.userId) || s.client_reference_id || undefined
        const email: string | undefined =
          s.customer_details?.email || s.customer_email || undefined

        console.log('🧷 session linkers:', { customerId, userId, email })

        if (customerId && userId) {
          await setLevelBy({ id: userId }, { stripe_customer_id: customerId, subscription_level: 'pro' })
        } else if (customerId && email) {
          await setLevelBy({ email }, { stripe_customer_id: customerId, subscription_level: 'pro' })
        } else if (customerId) {
          // last resort: try by existing stripe_customer_id (repeat purchase)
          await setLevelBy({ stripe_customer_id: customerId }, { subscription_level: 'pro' })
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as any
        const customerId = sub.customer as string | undefined
        const level = mapLevel(sub.status as string | undefined)
        console.log('🔄 sub status → level', { status: sub.status, level, customerId })

        if (customerId) {
          const rows = await setLevelBy({ stripe_customer_id: customerId }, { subscription_level: level })
          if (!rows.length) {
            // fallback by customer email if we have no row yet
            const customer = await stripe.customers.retrieve(customerId)
            const email: string | undefined = (customer as any)?.email
            if (email) {
              await setLevelBy({ email }, { subscription_level: level, stripe_customer_id: customerId })
            }
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as any
        const customerId = sub.customer as string | undefined
        if (customerId) {
          const rows = await setLevelBy({ stripe_customer_id: customerId }, { subscription_level: 'basic' })
          if (!rows.length) {
            const customer = await stripe.customers.retrieve(customerId)
            const email: string | undefined = (customer as any)?.email
            if (email) {
              await setLevelBy({ email }, { subscription_level: 'basic', stripe_customer_id: customerId })
            }
          }
        }
        break
      }

      default:
        console.log('ℹ️ Unhandled type:', event.type)
        break
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('💥 handler error:', e)
    return NextResponse.json({ error: e?.message ?? 'handler failed' }, { status: 500 })
  }
}
