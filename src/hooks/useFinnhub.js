import { useState, useEffect, useRef } from 'react'

// Finnhub — search/autocomplete only
const FH_KEY  = 'd8k35vhr01qjgd6qs38gd8k35vhr01qjgd6qs390'
const FH_BASE = 'https://finnhub.io/api/v1'

// Twelve Data — all quotes (US + international)
const TD_KEY  = '388372fb14f54079837605980ccc1843'
const TD_BASE = 'https://api.twelvedata.com'

// Yahoo Finance suffix → Twelve Data exchange code
const SUFFIX_MAP = {
  L:  'LSE',  DE: 'XETRA', PA: 'EPA',  AS: 'AMS',
  T:  'TSE',  HK: 'HKEX',  AX: 'ASX',  TO: 'TSX',
  V:  'TSXV', SW: 'SIX',   MI: 'MIL',  MC: 'BME',
  ST: 'STO',  CO: 'CPH',   OL: 'OSL',  HE: 'HEL',
  BR: 'EBR',  LS: 'ELI',   SA: 'SAO',  BO: 'BSE',
  NS: 'NSE',  KS: 'KRX',   SS: 'SHH',  SZ: 'SHZ',
}

function toTD(ticker) {
  if (!ticker.includes('.')) return ticker
  const dot      = ticker.lastIndexOf('.')
  const sym      = ticker.slice(0, dot)
  const suffix   = ticker.slice(dot + 1).toUpperCase()
  const exchange = SUFFIX_MAP[suffix]
  return exchange ? `${sym}:${exchange}` : sym
}

function normalize(q) {
  if (!q || q.status === 'error') return { c: 0, dp: 0 }
  const c  = parseFloat(q.close) || 0
  const dp = parseFloat(q.percent_change) || 0
  return { c, dp }
}

// ─── Exports used by Portfolio form ─────────────────────────────────────────

export async function fetchSearch(query) {
  const res = await fetch(`${FH_BASE}/search?q=${encodeURIComponent(query)}&token=${FH_KEY}`)
  return res.json()
}

export async function validateTicker(ticker) {
  const sym = toTD(ticker)
  const res = await fetch(`${TD_BASE}/price?symbol=${encodeURIComponent(sym)}&apikey=${TD_KEY}`)
  const data = await res.json()
  return data.price ? parseFloat(data.price) : null
}

// ─── Quote hook ──────────────────────────────────────────────────────────────

export function useFinnhub(tickers) {
  const [quotes, setQuotes]   = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const timerRef = useRef(null)
  const key = tickers.join(',')

  useEffect(() => {
    if (!tickers.length) { setQuotes({}); return }

    const tdSymbols = tickers.map(toTD)

    async function fetchAll() {
      setLoading(true)
      setError(null)
      try {
        const symbolParam = tdSymbols.join(',')
        const res  = await fetch(`${TD_BASE}/quote?symbol=${encodeURIComponent(symbolParam)}&apikey=${TD_KEY}`)
        const data = await res.json()

        const result = {}
        tickers.forEach((ticker, i) => {
          // Single-ticker response: data is the quote directly
          // Multi-ticker response: data is keyed by TD symbol
          const q = tickers.length === 1 ? data : (data[tdSymbols[i]] ?? data[ticker])
          result[ticker] = normalize(q)
        })
        setQuotes(result)
      } catch {
        setError('Could not fetch live prices')
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
    timerRef.current = setInterval(fetchAll, 300_000)
    return () => clearInterval(timerRef.current)
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  return { quotes, loading, error }
}
