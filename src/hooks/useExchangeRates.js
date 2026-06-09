import { useState, useEffect } from 'react'
import { getCurrency } from '../utils/format'

const CACHE_KEY = 'pulse_fx_rates'
const CACHE_TTL = 4 * 60 * 60 * 1000 // 4 hours

export function useExchangeRates() {
  const baseCurrency = getCurrency()
  const [rates, setRates]         = useState({})
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)

  useEffect(() => {
    async function fetchRates() {
      // Try cache first
      try {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY))
        if (cached && cached.base === baseCurrency && Date.now() - cached.ts < CACHE_TTL) {
          setRates(cached.rates)
          setUpdatedAt(new Date(cached.ts))
          setLoading(false)
          return
        }
      } catch {}

      try {
        const res  = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`)
        const data = await res.json()
        if (data.result === 'success') {
          const entry = { base: baseCurrency, rates: data.rates, ts: Date.now() }
          try { localStorage.setItem(CACHE_KEY, JSON.stringify(entry)) } catch {}
          setRates(data.rates)
          setUpdatedAt(new Date())
        } else {
          setError('Could not fetch exchange rates.')
        }
      } catch (err) {
        setError('No connection — using last known rates.')
        // Fall back to stale cache
        try {
          const stale = JSON.parse(localStorage.getItem(CACHE_KEY))
          if (stale) { setRates(stale.rates); setUpdatedAt(new Date(stale.ts)) }
        } catch {}
      } finally {
        setLoading(false)
      }
    }
    fetchRates()
  }, [baseCurrency])

  // Convert `amount` in `fromCurrency` → base currency
  // open.er-api rates are: 1 base = N foreign, so divide to get back to base
  function toBase(amount, fromCurrency) {
    if (!fromCurrency || fromCurrency === baseCurrency) return amount
    const rate = rates[fromCurrency]
    if (!rate) return null
    return amount / rate
  }

  return { rates, loading, error, updatedAt, toBase, baseCurrency }
}
