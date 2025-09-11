import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

const supabase = createClient()

export async function GET() {
  try {
    const { count: basicCount, error: basicError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_level', 'basic')

    if (basicError) {
      console.error('Basic count error:', basicError)
    }

    const { count: proCount, error: proError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_level', 'pro')

    if (proError) {
      console.error('Pro count error:', proError)
    }

    return NextResponse.json({
      basic: basicCount ?? 0,
      pro: proCount ?? 0,
    })
  } catch (err: any) {
    console.error('Unexpected stats error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
