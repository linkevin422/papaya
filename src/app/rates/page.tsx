'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const supabase = createClient()

type RateRow = {
  rate_date: string
  base_code: string
  currency: string
  value: number
}

export default function RatesPage() {
  const [rates, setRates] = useState<RateRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadRates = async () => {
      setLoading(true)
      setError(null)

      // first get the latest date available
      const { data: latestRow, error: latestErr } = await supabase
        .from('exchange_rates')
        .select('rate_date')
        .order('rate_date', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (latestErr) {
        setError(latestErr.message)
        setLoading(false)
        return
      }
      if (!latestRow) {
        setError('No exchange rates available.')
        setLoading(false)
        return
      }

      const targetDate = latestRow.rate_date

      // call your RPC
      const { data, error: rpcErr } = await supabase.rpc('get_rates_by_date', {
        target_date: targetDate,
      })

      if (rpcErr) {
        setError(rpcErr.message)
        setLoading(false)
        return
      }

      setRates(data || [])
      setLoading(false)
    }

    loadRates()
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">Exchange Rates</h1>

      {loading && <p className="text-sm opacity-70">Loading…</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {!loading && !error && rates.length === 0 && (
        <p className="text-sm opacity-70">No rates found.</p>
      )}

      {!loading && !error && rates.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border border-white/10">
            <thead className="bg-zinc-900">
              <tr>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Base</th>
                <th className="px-3 py-2 text-left">Currency</th>
                <th className="px-3 py-2 text-left">Value</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((r, i) => (
                <tr key={i} className="border-t border-white/10">
                  <td className="px-3 py-2">{r.rate_date}</td>
                  <td className="px-3 py-2">{r.base_code}</td>
                  <td className="px-3 py-2">{r.currency}</td>
                  <td className="px-3 py-2">{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
