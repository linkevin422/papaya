import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!  // only server-side
const supabaseAdmin = createClient(url, serviceKey)

const FX_API = 'https://api.frankfurter.app/latest?from=USD'

export async function GET() {
  try {
    const res = await fetch(FX_API)
    if (!res.ok) throw new Error(`FX API error: ${res.status}`)
    const json = await res.json()

    console.log('FX API response:', json)

    const rateDate = json.date
    const baseCode = json.base
    const rates = json.rates

    if (!rateDate || !baseCode || !rates) {
      return NextResponse.json({ error: 'Bad FX API response', json }, { status: 500 })
    }

    const { error } = await supabaseAdmin.from('exchange_rates').upsert({
      rate_date: rateDate,
      base_code: baseCode,
      rates: rates,
    })

    if (error) {
      console.error(error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      rate_date: rateDate,
      base: baseCode,
      count: Object.keys(rates).length,
    })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
