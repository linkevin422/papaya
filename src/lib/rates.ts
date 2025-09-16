import { createClient } from '@/lib/supabase'

const supabase = createClient()

export async function getLatestRates() {
  // get the most recent date
  const { data: latestRow, error: latestErr } = await supabase
    .from('exchange_rates')
    .select('rate_date')
    .order('rate_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latestErr || !latestRow) return {}

  const { data } = await supabase.rpc('get_rates_by_date', {
    target_date: latestRow.rate_date,
  })

  const map: Record<string, number> = {}
  for (const r of data || []) {
    map[r.currency] = r.value
  }
  return map
}
