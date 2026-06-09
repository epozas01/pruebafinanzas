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
          tickers.map(t => fetchQuote(t).then(data => [t, data]))
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
