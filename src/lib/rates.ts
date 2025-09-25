import { createClient } from '@/lib/supabase'

const supabase = createClient()

export async function getLatestRates(): Promise<Record<string, number>> {
  // get most recent date
  const { data: latestRow, error: latestErr } = await supabase
    .from('exchange_rates')
    .select('rate_date')
    .order('rate_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latestErr || !latestRow) {
    console.warn("No exchange rate data found", latestErr)
    return {}
  }

  // fetch rates for that date
  const { data } = await supabase.rpc('get_rates_by_date', {
    target_date: latestRow.rate_date,
  })

  const map: Record<string, number> = {}

  for (const r of data || []) {
    map[r.currency] = r.value
  }

  // fallback: if DB doesn't include TWD (or master currency), add it manually
  // The masterCurrency is injected later in calculateFlows, so here we just return map as is
  if (!map['USD']) {
    console.warn("Missing USD rate in DB")
  }

  return map
}
