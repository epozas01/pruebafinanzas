import { useState, useMemo, useEffect } from 'react'
import { pie as d3Pie, arc as d3Arc } from 'd3'
import { formatCurrency } from '../utils/format'
import { usePortfolio } from '../hooks/usePortfolio'
import { useFinnhub, fetchQuote, fetchYahooQuote, fetchSearch } from '../hooks/useFinnhub'

const COLORS = [
  '#d4af37', '#34d399', '#fb923c', '#a78bfa',
  '#60a5fa', '#f472b6', '#4ade80', '#fbbf24',
  '#38bdf8', '#c084fc',
]

// ─── Allocation donut ────────────────────────────────────────────────────────
function AllocationDonut({ data, total }) {
  const [hovered, setHovered] = useState(null)
  const SIZE = 200, CX = 100, CY = 100, OR = 80, IR = 56
  if (!total || !data.length) return null

  const pieGen  = d3Pie().value(d => d.value).padAngle(data.length > 1 ? 0.04 : 0).sort(null)
  const arcPath = d3Arc().innerRadius(IR).outerRadius(OR).cornerRadius(4)
  const arcs    = pieGen(data)
  const hov     = hovered !== null ? arcs[hovered]?.data : null

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}
      style={{ display: 'block', margin: '0 auto' }}>
      <g transform={`translate(${CX},${CY})`}>
        {arcs.map((a, i) => (
          <path key={i} d={arcPath(a)} fill={a.data.color}
            opacity={hovered === null || hovered === i ? 1 : 0.2}
            style={{ cursor: 'pointer', transition: 'opacity .2s' }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            onTouchStart={e => { e.preventDefault(); setHovered(i) }}
            onTouchEnd={() => setTimeout(() => setHovered(null), 1200)}
          />
        ))}

        {!hov && <>
          <text y={-8} textAnchor="middle" fill="#5a5a54"
            fontSize={7} fontWeight={700} style={{ letterSpacing: 2, userSelect: 'none' }}>
            PORTFOLIO
          </text>
          <text y={10} textAnchor="middle" fill="#f0e8d0"
            fontSize={13} fontWeight={700} className="blur-private"
            style={{ userSelect: 'none' }}>
            {formatCurrency(total)}
          </text>
        </>}

        {hov && <>
          <text y={-18} textAnchor="middle" fill={hov.color}
            fontSize={11} fontWeight={800} style={{ userSelect: 'none' }}>
            {hov.name}
          </text>
          <text y={-1} textAnchor="middle" fill={hov.color}
            fontSize={13} fontWeight={700} className="blur-private"
            style={{ userSelect: 'none' }}>
            {formatCurrency(hov.value)}
          </text>
          <text y={16} textAnchor="middle" fill="#c0b898"
            fontSize={11} fontWeight={700} style={{ userSelect: 'none' }}>
            {((hov.value / total) * 100).toFixed(1)}%
          </text>
        </>}
      </g>
    </svg>
  )
}

// ─── Holding form ────────────────────────────────────────────────────────────
function HoldingForm({ initial, onSave, onClose }) {
  const [ticker,      setTicker]      = useState(initial?.ticker        ?? '')
  const [shares,      setShares]      = useState(initial?.shares        ?? '')
  const [buyPrice,    setBuyPrice]    = useState(initial?.purchasePrice ?? '')
  const [name,        setName]        = useState(initial?.name          ?? '')
  const [tickerErr,   setTickerErr]   = useState('')
  const [priceWarn,   setPriceWarn]   = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSugg,    setShowSugg]    = useState(false)

  // Debounced search as user types
  useEffect(() => {
    if (ticker.length < 1) { setSuggestions([]); return }
    if (name) return  // already resolved — don't re-search
    const t = setTimeout(async () => {
      try {
        const data = await fetchSearch(ticker)
        setSuggestions(
          (data.result || [])
            .filter(r => r.type === 'Common Stock' || r.type === 'ETP' || r.type === 'ADR')
            .slice(0, 6)
        )
        setShowSugg(true)
      } catch { /* ignore */ }
    }, 280)
    return () => clearTimeout(t)
  }, [ticker]) // eslint-disable-line react-hooks/exhaustive-deps

  async function pickSuggestion(item) {
    setTicker(item.displaySymbol)
    setName(item.description)
    setSuggestions([])
    setShowSugg(false)
    setTickerErr('')
    setPriceWarn('')
    try {
      const sym = item.displaySymbol
      const q   = sym.includes('.') ? await fetchYahooQuote(sym) : await fetchQuote(sym)
      if (!q?.c) setPriceWarn('Live price unavailable for this ticker — you can still save it.')
    } catch { /* ignore */ }
  }

  function submit(e) {
    e.preventDefault()
    const s = parseFloat(shares)
    if (!ticker || !s || s <= 0) return
    onSave({
      ticker: ticker.trim().toUpperCase(),
      shares: s,
      name: name || ticker.trim().toUpperCase(),
      purchasePrice: buyPrice !== '' ? parseFloat(buyPrice) : null,
    })
    onClose()
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-title">{initial ? 'Edit Holding' : 'Add Holding'}</div>

        <form onSubmit={submit}>
          <div className="field" style={{ position: 'relative' }}>
            <label className="field-label">Ticker Symbol</label>
            <input
              type="text"
              placeholder="e.g. AAPL, TSLA, MSFT…"
              value={ticker}
              onChange={e => {
                setTicker(e.target.value.toUpperCase())
                setName('')
                setTickerErr('')
              }}
              onBlur={() => setTimeout(() => setShowSugg(false), 150)}
              onFocus={() => suggestions.length && setShowSugg(true)}
              autoFocus
              autoComplete="off"
            />

            {/* Autocomplete dropdown */}
            {showSugg && suggestions.length > 0 && (
              <div style={{
                position: 'absolute', top: 'calc(100% - 4px)', left: 0, right: 0,
                background: '#161614', border: '1px solid var(--border-strong)',
                borderTop: 'none', borderRadius: '0 0 12px 12px',
                zIndex: 300, overflow: 'hidden',
              }}>
                {suggestions.map((item, i) => (
                  <div
                    key={i}
                    onMouseDown={e => { e.preventDefault(); pickSuggestion(item) }}
                    style={{
                      padding: '10px 14px', cursor: 'pointer', display: 'flex',
                      alignItems: 'baseline', gap: 10,
                      borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,175,55,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--gold)', minWidth: 52 }}>
                      {item.displaySymbol}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.description}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {tickerErr  && <div style={{ fontSize: 11, color: 'var(--red)',    marginTop: 4 }}>{tickerErr}</div>}
            {priceWarn  && <div style={{ fontSize: 11, color: '#f59e0b',       marginTop: 4 }}>⚠ {priceWarn}</div>}
            {name && !tickerErr && <div style={{ fontSize: 11, color: 'var(--gold)', marginTop: 4 }}>✓ {name}</div>}
          </div>

          <div className="row2">
            <div className="field">
              <label className="field-label">Shares owned</label>
              <input
                type="number" min="0.0001" step="any"
                placeholder="10"
                value={shares}
                onChange={e => setShares(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label className="field-label">Avg buy price</label>
              <input
                type="number" min="0" step="0.01"
                placeholder="Optional"
                value={buyPrice}
                onChange={e => setBuyPrice(e.target.value)}
              />
            </div>
          </div>

          <button className="save-btn" type="submit">
            {initial ? 'Save Changes' : 'Add to Portfolio'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Holding card ────────────────────────────────────────────────────────────
function HoldingCard({ holding, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { color, ticker, name, shares, price, dailyChangePct, totalValue, gainLoss, gainLossPct } = holding
  const up = dailyChangePct != null && dailyChangePct >= 0

  return (
    <div
      style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)', padding: '14px 16px', marginBottom: 10,
        display: 'flex', alignItems: 'center', gap: 14, transition: 'border-color .2s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {/* Ticker badge */}
      <div style={{
        width: 44, height: 44, borderRadius: 13, flexShrink: 0,
        background: color + '18', border: `1px solid ${color}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: ticker.length > 3 ? 9 : 11, fontWeight: 800, color,
        letterSpacing: '0.03em',
      }}>
        {ticker.slice(0, 5)}
      </div>

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name || ticker}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span>{shares} share{shares !== 1 ? 's' : ''}</span>
          {price != null && <span>${price.toFixed(2)}</span>}
          {dailyChangePct != null && (
            <span style={{ color: up ? 'var(--green)' : 'var(--red)' }}>
              {up ? '+' : ''}{dailyChangePct.toFixed(2)}%
            </span>
          )}
        </div>
      </div>

      {/* Value + gain */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        {totalValue != null ? (
          <div className="blur-private" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
            {formatCurrency(totalValue)}
          </div>
        ) : (
          <div style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic' }}>Price N/A</div>
        )}
        {gainLoss != null && (
          <div className="blur-private" style={{ fontSize: 11, color: gainLoss >= 0 ? 'var(--green)' : 'var(--red)', marginTop: 2, fontWeight: 600 }}>
            {gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss)}
            <span style={{ fontWeight: 400, marginLeft: 4 }}>
              ({gainLossPct >= 0 ? '+' : ''}{gainLossPct.toFixed(1)}%)
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
        <button
          onClick={() => onEdit(holding)}
          style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 14, padding: '2px 6px', borderRadius: 6 }}
          title="Edit"
        >✎</button>
        {confirmDelete ? (
          <button
            onClick={() => onDelete(holding.id)}
            style={{ background: 'rgba(248,113,113,0.15)', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 11, padding: '2px 6px', borderRadius: 6, fontWeight: 700 }}
          >✓</button>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            onBlur={() => setConfirmDelete(false)}
            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 14, padding: '2px 6px', borderRadius: 6 }}
            title="Delete"
          >✕</button>
        )}
      </div>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function Portfolio({ uid }) {
  const { holdings, loading, addHolding, updateHolding, deleteHolding } = usePortfolio(uid)
  const tickers = useMemo(() => holdings.map(h => h.ticker), [holdings])
  const { quotes, loading: quotesLoading, error: quotesError } = useFinnhub(tickers)

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState(null)

  const enriched = useMemo(() => {
    return holdings.map((h, i) => {
      const q              = quotes[h.ticker]
      const price          = q?.c  || null   // treat 0 as no data
      const dailyChangePct = q?.c  ? (q?.dp ?? null) : null
      const totalValue     = price != null ? price * h.shares : null
      const gainLoss       = h.purchasePrice != null && price != null
        ? (price - h.purchasePrice) * h.shares : null
      const gainLossPct    = h.purchasePrice != null && price != null
        ? ((price - h.purchasePrice) / h.purchasePrice) * 100 : null
      return { ...h, color: COLORS[i % COLORS.length], price, dailyChangePct, totalValue, gainLoss, gainLossPct }
    })
  }, [holdings, quotes])

  const totalValue    = enriched.reduce((s, h) => s + (h.totalValue ?? 0), 0)
  const totalGainLoss = enriched.reduce((s, h) => h.gainLoss != null ? s + h.gainLoss : s, 0)
  const hasAnyGain    = enriched.some(h => h.gainLoss != null)

  const donutData = enriched
    .filter(h => h.totalValue != null && h.totalValue > 0)
    .map(h => ({ name: h.ticker, value: h.totalValue, color: h.color }))

  async function handleSave(data) {
    if (editing) {
      await updateHolding(editing.id, { ...editing, ...data })
    } else {
      await addHolding(data)
    }
    setEditing(null)
  }

  function openEdit(h) { setEditing(h); setShowForm(true) }

  if (loading) return (
    <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
      Loading portfolio…
    </div>
  )

  return (
    <>
      {/* Summary / donut card */}
      {enriched.length > 0 && (
        <div style={{
          margin: '20px 16px 0',
          background: 'linear-gradient(145deg, #1c1a0e, #0a0a0a)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius)',
          padding: '24px 22px 20px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -40, right: -40, width: 180, height: 180,
            background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'var(--gold)', fontWeight: 600, marginBottom: 6 }}>
            Portfolio Value
          </div>

          {quotesLoading && totalValue === 0 ? (
            <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-mid)', marginBottom: 12 }}>Loading…</div>
          ) : (
            <div className="blur-private" style={{
              fontFamily: 'var(--serif)', fontSize: 42, fontWeight: 700,
              letterSpacing: '-0.02em', color: 'var(--text)', lineHeight: 1, marginBottom: 8,
            }}>
              {formatCurrency(totalValue)}
            </div>
          )}

          {hasAnyGain && (
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: totalGainLoss >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {totalGainLoss >= 0 ? '+' : ''}{formatCurrency(totalGainLoss)} total gain/loss
            </div>
          )}

          {donutData.length > 0 && (
            <AllocationDonut data={donutData} total={totalValue} />
          )}

          {/* Legend */}
          {donutData.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14, justifyContent: 'center' }}>
              {donutData.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-dim)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                  {d.name}
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text-dim)' }}>
            {quotesError ? (
              <span style={{ color: '#f59e0b' }}>⚠ {quotesError}</span>
            ) : (
              <>
                <span style={{ color: 'var(--gold)', opacity: .7 }}>●</span>
                {' '}15-min delayed · refreshes every 60s
              </>
            )}
          </div>
        </div>
      )}

      {/* Holdings list */}
      <div className="sec-head">
        <div className="sec-title">Holdings</div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
          {enriched.length} position{enriched.length !== 1 ? 's' : ''}
        </div>
      </div>

      {enriched.length === 0 ? (
        <div className="empty-state" style={{ paddingTop: 40 }}>
          <div className="empty-icon">📈</div>
          <div className="empty-msg">No holdings yet.<br />Tap + to add your first position.</div>
        </div>
      ) : (
        <div className="tx-list">
          {enriched.map(h => (
            <HoldingCard key={h.id} holding={h} onEdit={openEdit} onDelete={deleteHolding} />
          ))}
        </div>
      )}

      <button className="fab" onClick={() => { setEditing(null); setShowForm(true) }} title="Add holding">+</button>

      {showForm && (
        <HoldingForm
          initial={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null) }}
        />
      )}
    </>
  )
}
