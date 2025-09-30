import { getLatestRates } from '@/lib/rates'

export type Entry = {
  amount: number
  currency: string
  date?: string
  recurring_interval?: 'daily' | 'monthly' | 'yearly'
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
    console.warn(`Missing rate for ${fromCurrency} or ${toCurrency}`, {
      fromRate,
      toRate,
      rates,
    })
    return NaN
  }

  const converted = (amount / fromRate) * toRate
  return isNaN(converted) ? 0 : converted
}

/**
 * Calculate flow for a single set of entries (e.g. an edge).
 * Handles recurring and one-off entries separately.
 */
export function calculateFlows(
  entries: Entry[],
  masterCurrency: string,
  rates: Record<string, number>
): FlowTotals {
  const safeRates = { ...rates, [masterCurrency]: 1 }

  if (entries.length === 0) {
    return { daily: 0, monthly: 0, yearly: 0 }
  }

  // normalize all entries
  const normalized = entries
    .map((e) => ({
      ...e,
      amount: convertAmount(e.amount, e.currency, masterCurrency, safeRates),
    }))
    .filter((e) => !isNaN(e.amount))

  if (normalized.length === 0) {
    return { daily: 0, monthly: 0, yearly: 0 }
  }

  let daily = 0
  let monthly = 0
  let yearly = 0

  // non-recurring grouped by date
  const dateTotals: Record<string, number> = {}

  for (const e of normalized) {
    const interval = e.recurring_interval?.toLowerCase().trim();
    switch (interval) {
      case 'daily':
        daily += e.amount
        monthly += e.amount * 30
        yearly += e.amount * 365
        break
      case 'monthly':
        monthly += e.amount
        daily += e.amount / 30
        yearly += e.amount * 12
        break
      case 'yearly':
        yearly += e.amount
        monthly += e.amount / 12
        daily += e.amount / 365
        break
      default:
        const date = e.date || 'unknown'
        dateTotals[date] = (dateTotals[date] || 0) + e.amount
        break
    }
  }
  
  // handle non-recurring entries
  const nonRecDates = Object.keys(dateTotals)
  const nonRecTotal = Object.values(dateTotals).reduce((a, b) => a + b, 0)

  if (nonRecDates.length > 0) {
    const parsedDates = nonRecDates
      .filter((d) => d !== 'unknown')
      .map((d) => new Date(d).getTime())

    if (parsedDates.length > 0) {
      const minDate = Math.min(...parsedDates)
      const maxDate = Math.max(...parsedDates)
      const spanDays = Math.max(
        1,
        Math.floor((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1
      )
      daily += nonRecTotal / spanDays
      monthly += (nonRecTotal / spanDays) * 30
      yearly += (nonRecTotal / spanDays) * 365
    } else {
      daily += nonRecTotal
      monthly += nonRecTotal * 30
      yearly += nonRecTotal * 365
    }
  }

  return { daily, monthly, yearly }
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
