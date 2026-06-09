import { useState, useEffect, useRef } from 'react'

const KEY  = 'd8k35vhr01qjgd6qs38gd8k35vhr01qjgd6qs390'
const BASE = 'https://finnhub.io/api/v1'

export async function fetchQuote(ticker) {
  const res = await fetch(`${BASE}/quote?symbol=${ticker}&token=${KEY}`)
  return res.json()
}

export async function fetchProfile(ticker) {
  const res = await fetch(`${BASE}/stock/profile2?symbol=${ticker}&token=${KEY}`)
  return res.json()
}

export async function fetchSearch(query) {
  const res = await fetch(`${BASE}/search?q=${encodeURIComponent(query)}&token=${KEY}`)
  return res.json()
}

// Yahoo Finance for international tickers (those containing a dot, e.g. BP.L, SAP.DE)
export async function fetchYahooQuote(ticker) {
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`,
    { headers: { Accept: 'application/json' } },
  )
  const data = await res.json()
  const meta = data?.chart?.result?.[0]?.meta
  if (!meta?.regularMarketPrice) return { c: 0, dp: 0 }
  const c  = meta.regularMarketPrice
  const pc = meta.chartPreviousClose ?? meta.previousClose ?? c
  const dp = pc ? ((c - pc) / pc) * 100 : 0
  return { c, dp }
}

function isInternational(ticker) {
  return ticker.includes('.')
}

export function useFinnhub(tickers) {
  const [quotes, setQuotes]   = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const timerRef = useRef(null)
  const key = tickers.join(',')

  useEffect(() => {
    if (!tickers.length) { setQuotes({}); return }

    async function fetchAll() {
      setLoading(true)
      setError(null)
      try {
        const entries = await Promise.all(
          tickers.map(async t => {
            const data = isInternational(t)
              ? await fetchYahooQuote(t)
              : await fetchQuote(t)
            return [t, data]
          })
        )
        setQuotes(Object.fromEntries(entries))
      } catch {
        setError('Could not fetch live prices')
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
    timerRef.current = setInterval(fetchAll, 60_000)
    return () => clearInterval(timerRef.current)
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  return { quotes, loading, error }
}
