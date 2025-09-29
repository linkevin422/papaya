  import { getLatestRates } from '@/lib/rates'

  export type Entry = {
    amount: number
    currency: string
    date?: string // optional for now, in case you use it later
  }

  export type FlowTotals = {
    daily: number
    monthly: number
    yearly: number
  }

  /**
   * Convert an amount from one currency into another, using the rates map.
   * Rates map is expected to be normalized to a common base (e.g. USD = 1).
   */
  export function convertAmount(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    rates: Record<string, number>
  ): number {
    const fromRate = rates[fromCurrency]
    const toRate = rates[toCurrency]

    if (!fromRate || !toRate) {
      console.warn(`Missing rate for ${fromCurrency} or ${toCurrency}`, { fromRate, toRate, rates })
      return NaN
    }

    // Always normalize, even if fromCurrency === toCurrency
    const converted = (amount / fromRate) * toRate
    return isNaN(converted) ? 0 : converted
  }

  /**
   * Calculate flow for a single set of entries (e.g. an edge).
   * Returns normalized daily, monthly, yearly totals.
   */
  export function calculateFlows(
    entries: Entry[],
    masterCurrency: string,
    rates: Record<string, number>
  ): FlowTotals {
    // ensure masterCurrency exists in rates
    const safeRates = { ...rates, [masterCurrency]: 1 }

    if (entries.length === 0) {
      return { daily: 0, monthly: 0, yearly: 0 }
    }

    // normalize all entries
    const normalized = entries.map(e => ({
      ...e,
      amount: convertAmount(e.amount, e.currency, masterCurrency, safeRates)
    })).filter(e => !isNaN(e.amount))

    if (normalized.length === 0) {
      return { daily: 0, monthly: 0, yearly: 0 }
    }

    // group totals by date
    const dateTotals: Record<string, number> = {}
    for (const e of normalized) {
      const date = e.date || "unknown"
      dateTotals[date] = (dateTotals[date] || 0) + e.amount
    }

    const dates = Object.keys(dateTotals)
    const total = Object.values(dateTotals).reduce((a, b) => a + b, 0)

    // average if multiple days exist, otherwise total for single day
// average across the full date span, not just unique payout days
const parsedDates = dates
  .filter(d => d !== "unknown")
  .map(d => new Date(d).getTime())

let daily: number
if (parsedDates.length > 0) {
  const minDate = Math.min(...parsedDates)
  const maxDate = Math.max(...parsedDates)
  const spanDays = Math.max(1, Math.floor((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1)
  daily = total / spanDays
} else {
  daily = total
}

    return {
      daily,
      monthly: daily * 30,
      yearly: daily * 365
    }
  }

  /**
   * Sum up totals across multiple flows (e.g. all edges in a flow).
   */
  export function aggregateTotals(flows: FlowTotals[]): FlowTotals {
    return flows.reduce(
      (acc, f) => ({
        daily: acc.daily + f.daily,
        monthly: acc.monthly + f.monthly,
        yearly: acc.yearly + f.yearly,
      }),
      { daily: 0, monthly: 0, yearly: 0 }
    )
  }

  /**
   * Convenience: fetch rates once and run calculations.
   */
  export async function getFlowTotals(
    entries: Entry[],
    masterCurrency: string
  ): Promise<FlowTotals> {
    const rates = await getLatestRates()
    return calculateFlows(entries, masterCurrency, rates)
  }
