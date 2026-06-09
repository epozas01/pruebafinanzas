import { useMemo, useState } from 'react'
import { pie as d3Pie, arc as d3Arc, scaleBand, scaleLinear, max as d3Max } from 'd3'
import { EXPENSE_CATEGORIES, CATEGORY_COLORS } from '../data/categories'
import { formatCurrency, isoMonth } from '../utils/format'
import { useExchangeRates } from '../hooks/useExchangeRates'
import { ACCOUNT_TYPES } from '../data/currencies'

function SpendingDonut({ data, total }) {
  const [hovered, setHovered] = useState(null)
  const SIZE = 220, CX = 110, CY = 110, OR = 90, IR = 60
  if (!total) return null

  const pieGen  = d3Pie().value(d => d.value).padAngle(data.length > 1 ? 0.05 : 0).sort(null)
  const arcPath = d3Arc().innerRadius(IR).outerRadius(OR).cornerRadius(5)
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
          <text y={-10} textAnchor="middle" fill="#5a5a54"
            fontSize={8} fontWeight={700} style={{ letterSpacing: 2, userSelect: 'none' }}>
            SPENDING
          </text>
          <text y={9} textAnchor="middle" fill="#f87171"
            fontSize={15} fontWeight={700} className="blur-private"
            style={{ userSelect: 'none' }}>
            {formatCurrency(total)}
          </text>
        </>}

        {hov && <>
          <text y={-20} textAnchor="middle" fill={hov.color}
            fontSize={11} fontWeight={700} style={{ userSelect: 'none' }}>
            {hov.name}
          </text>
          <text y={-2} textAnchor="middle" fill={hov.color}
            fontSize={14} fontWeight={700} className="blur-private"
            style={{ userSelect: 'none' }}>
            {formatCurrency(hov.value)}
          </text>
          <text y={15} textAnchor="middle" fill="#c0b898"
            fontSize={11} fontWeight={700} style={{ userSelect: 'none' }}>
            {((hov.value / total) * 100).toFixed(1)}%
          </text>
        </>}
      </g>
    </svg>
  )
}

function PatrimonyDonut({ data, netWorth, baseCurrency }) {
  const [hovered, setHovered] = useState(null)
  const SIZE = 220, CX = 110, CY = 110, OR = 90, IR = 66
  const total = data.reduce((s, d) => s + d.value, 0)
  if (!total) return null

  const pieGen  = d3Pie().value(d => d.value).padAngle(data.length > 1 ? 0.05 : 0).sort(null)
  const arcPath = d3Arc().innerRadius(IR).outerRadius(OR).cornerRadius(5)
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
          <text y={-10} textAnchor="middle" fill="#5a5a54"
            fontSize={8} fontWeight={700} style={{ letterSpacing: 2, userSelect: 'none' }}>
            NET WORTH
          </text>
          <text y={9} textAnchor="middle"
            fill={netWorth >= 0 ? '#f0e8d0' : '#f87171'}
            fontSize={15} fontWeight={700} className="blur-private"
            style={{ userSelect: 'none' }}>
            {netWorth < 0 ? '−' : ''}{formatCurrency(Math.abs(netWorth), baseCurrency)}
          </text>
        </>}

        {hov && <>
          <text y={-22} textAnchor="middle" fill={hov.color}
            fontSize={8} fontWeight={700} style={{ letterSpacing: 1.5, userSelect: 'none' }}>
            {hov.typeLabel.toUpperCase()}
          </text>
          <text y={-5} textAnchor="middle" fill={hov.color}
            fontSize={14} fontWeight={700} className="blur-private"
            style={{ userSelect: 'none' }}>
            {hov.isAsset ? '' : '−'}{formatCurrency(hov.value, baseCurrency)}
          </text>
          <text y={11} textAnchor="middle" fill="#c0b898"
            fontSize={10} style={{ userSelect: 'none' }}>
            {hov.typeIcon} {hov.name}
          </text>
          <text y={26} textAnchor="middle" fill={hov.color}
            fontSize={11} fontWeight={700} style={{ userSelect: 'none' }}>
            {((hov.value / total) * 100).toFixed(1)}%
          </text>
        </>}
      </g>
    </svg>
  )
}

function D3BarChart({ data }) {
  const [tooltip, setTooltip] = useState(null)

  const W = 340, H = 200
  const mg = { top: 10, right: 8, bottom: 32, left: 44 }
  const iW = W - mg.left - mg.right
  const iH = H - mg.top - mg.bottom

  const xOuter = scaleBand().domain(data.map(d => d.month)).range([0, iW]).padding(0.35)
  const xInner = scaleBand().domain(['Income', 'Expenses']).range([0, xOuter.bandwidth()]).padding(0.08)
  const yMax   = d3Max(data, d => Math.max(d.Income, d.Expenses)) || 1
  const yScale = scaleLinear().domain([0, yMax * 1.15]).range([iH, 0])
  const yTicks = yScale.ticks(4)

  const COLORS = { Income: '#4ade80', Expenses: '#f87171' }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: 'visible' }}>
      <g transform={`translate(${mg.left},${mg.top})`}>

        {yTicks.map((t, i) => (
          <line key={i} x1={0} x2={iW} y1={yScale(t)} y2={yScale(t)}
            stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
        ))}

        {yTicks.map((t, i) => (
          <text key={i} x={-6} y={yScale(t)} textAnchor="end" dominantBaseline="middle"
            fill="#5a5a54" fontSize={9}>
            {t >= 1000 ? `$${(t / 1000).toFixed(1)}k` : `$${t}`}
          </text>
        ))}

        {data.map(d => (
          <g key={d.month} transform={`translate(${xOuter(d.month)},0)`}>
            {['Income', 'Expenses'].map(key => {
              const val = d[key]
              const bh  = Math.max(0, iH - yScale(val))
              const by  = yScale(val)
              const bx  = xInner(key)
              const bw  = xInner.bandwidth()
              return (
                <rect key={key}
                  x={bx} y={by} width={bw} height={bh || 2}
                  fill={COLORS[key]} rx={3}
                  opacity={tooltip && !(tooltip.month === d.month && tooltip.key === key) ? 0.35 : 0.85}
                  style={{ cursor: 'pointer', transition: 'opacity .15s' }}
                  onMouseEnter={() => setTooltip({ month: d.month, key, val, x: xOuter(d.month) + bx + bw / 2, y: by })}
                  onMouseLeave={() => setTooltip(null)}
                />
              )
            })}
            <text x={xOuter.bandwidth() / 2} y={iH + 16} textAnchor="middle" fill="#5a5a54" fontSize={10}>
              {d.month}
            </text>
          </g>
        ))}

        {tooltip && (() => {
          const tw = 132, th = 24
          const tx = Math.min(Math.max(tooltip.x - tw / 2, 0), iW - tw)
          const ty = Math.max(tooltip.y - th - 6, 0)
          return (
            <g transform={`translate(${tx},${ty})`} style={{ pointerEvents: 'none' }}>
              <rect width={tw} height={th} rx={6} fill="#1a1a1a" stroke="rgba(212,175,55,0.3)" strokeWidth={1} />
              <text x={tw / 2} y={15} textAnchor="middle"
                fill={COLORS[tooltip.key]} fontSize={10} fontWeight={700}>
                {tooltip.key}: {formatCurrency(tooltip.val)}
              </text>
            </g>
          )
        })()}

        <g transform={`translate(${iW - 108}, ${iH + 18})`}>
          <rect width={8} height={8} rx={2} fill="#4ade80" />
          <text x={12} y={8} fill="#8a8a84" fontSize={9}>Income</text>
          <rect x={60} width={8} height={8} rx={2} fill="#f87171" />
          <text x={72} y={8} fill="#8a8a84" fontSize={9}>Expenses</text>
        </g>
      </g>
    </svg>
  )
}

function last6Months() {
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    months.push(d.toISOString().slice(0, 7))
  }
  return months
}

function monthLabel(iso) {
  const d = new Date(iso + '-01')
  return d.toLocaleString('default', { month: 'short' })
}

export default function Analytics({ transactions, accounts = [] }) {
  const { toBase, baseCurrency } = useExchangeRates()
  const months = last6Months()
  const [selectedMonth, setSelectedMonth] = useState(isoMonth())

  const { pieData, barData, totalExp, totalInc } = useMemo(() => {
    const monthTx = transactions.filter(t => t.date.startsWith(selectedMonth))

    const expMap = {}
    monthTx.filter(t => t.type === 'expense').forEach(t => {
      expMap[t.category] = (expMap[t.category] || 0) + t.amount
    })
    const pie = Object.entries(expMap)
      .map(([id, value]) => {
        const cat = EXPENSE_CATEGORIES.find(c => c.id === id)
        return { name: cat ? `${cat.icon} ${cat.label}` : id, value, color: CATEGORY_COLORS[id] || '#6b7280' }
      })
      .sort((a, b) => b.value - a.value)

    const bar = months.map(m => ({
      month:    monthLabel(m),
      Income:   transactions.filter(t => t.type === 'income'  && t.date.startsWith(m)).reduce((s, t) => s + t.amount, 0),
      Expenses: transactions.filter(t => t.type === 'expense' && t.date.startsWith(m)).reduce((s, t) => s + t.amount, 0),
    }))

    const tExp = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const tInc = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)

    return { pieData: pie, barData: bar, totalExp: tExp, totalInc: tInc }
  }, [transactions, selectedMonth])

  const TYPE_COLORS = {
    checking:    '#d4af37',
    savings:     '#34d399',
    investment:  '#f59e0b',
    cash:        '#fde68a',
    crypto:      '#fb923c',
    credit_card: '#f87171',
    loan:        '#e05252',
  }

  const patrimonyData = useMemo(() => {
    if (!accounts.length) return []
    return accounts.map(acc => {
      const type    = ACCOUNT_TYPES.find(t => t.id === acc.type)
      const isAsset = type?.isAsset ?? true
      const linked  = transactions.filter(t =>
        t.type === 'transfer'
          ? t.fromAccountId === acc.id || t.toAccountId === acc.id
          : t.accountId === acc.id
      )
      let inflow = 0, outflow = 0
      linked.forEach(t => {
        if (t.type === 'transfer') {
          if (t.fromAccountId === acc.id) outflow += t.amount
          else inflow += t.amount
        } else if (t.type === 'income') inflow += t.amount
        else outflow += t.amount
      })
      const opening = acc.openingBalance ?? acc.balance ?? 0
      const balance = isAsset ? opening + inflow - outflow : opening + outflow - inflow
      const inBase  = toBase(balance, acc.currency) ?? balance
      return {
        name:      acc.name,
        typeLabel: type?.label || acc.type,
        typeIcon:  type?.icon  || '',
        value:     Math.max(0, Math.abs(inBase)),
        isAsset,
        color:     TYPE_COLORS[acc.type] || (isAsset ? '#4ade80' : '#f87171'),
      }
    }).filter(d => d.value > 0.01)
  }, [accounts, transactions, toBase])

  const patrimonyStats = useMemo(() => {
    const assets      = patrimonyData.filter(d =>  d.isAsset)
    const liabilities = patrimonyData.filter(d => !d.isAsset)
    const totalAssets = assets.reduce((s, d) => s + d.value, 0)
    const totalLiab   = liabilities.reduce((s, d) => s + d.value, 0)
    return { assets, liabilities, totalAssets, totalLiab, netWorth: totalAssets - totalLiab }
  }, [patrimonyData])

  return (
    <>
      <div className="sec-head">
        <div className="sec-title">Analytics</div>
      </div>

      <div className="month-row">
        {months.map(m => (
          <button
            key={m}
            className={`month-pill ${selectedMonth === m ? 'active' : ''}`}
            onClick={() => setSelectedMonth(m)}
          >
            {monthLabel(m)} {new Date(m + '-01').getFullYear()}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px 16px' }}>
        <div className="card-sm">
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-dim)', marginBottom: 6 }}>Income</div>
          <div className="blur-private" style={{ fontSize: 20, fontWeight: 700, color: 'var(--green)' }}>{formatCurrency(totalInc)}</div>
        </div>
        <div className="card-sm">
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-dim)', marginBottom: 6 }}>Expenses</div>
          <div className="blur-private" style={{ fontSize: 20, fontWeight: 700, color: 'var(--red)' }}>{formatCurrency(totalExp)}</div>
        </div>
      </div>

      {pieData.length > 0 ? (
        <>
          <div style={{ padding: '0 16px 8px', fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 600 }}>
            Spending Breakdown
          </div>
          <div style={{ padding: '0 16px' }}>
            <SpendingDonut data={pieData} total={totalExp} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 12, paddingBottom: 16 }}>
              {pieData.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-mid)' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                  {d.name}
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state" style={{ paddingTop: 24 }}>
          <div className="empty-icon">📊</div>
          <div className="empty-msg">No expense data for this month.</div>
        </div>
      )}

      <div style={{ padding: '8px 16px 8px', fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 600 }}>
        6-Month Overview
      </div>
      <div style={{ padding: '0 8px 16px' }}>
        <D3BarChart data={barData} />
      </div>

      {patrimonyData.length > 0 && (() => {
        const { assets, liabilities, totalAssets, totalLiab, netWorth } = patrimonyStats
        return (
          <>
            <div style={{ padding: '8px 16px 8px', fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 600 }}>
              Patrimony Breakdown
            </div>
            <div style={{
              margin: '0 16px 24px',
              background: 'linear-gradient(145deg, #1c1a0e, #0a0a0a)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius)',
              padding: '20px 16px',
            }}>
              <PatrimonyDonut data={patrimonyData} netWorth={netWorth} baseCurrency={baseCurrency} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 8 }}>
                <div>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--green)', fontWeight: 700, marginBottom: 10 }}>Assets</div>
                  {assets.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 9 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0, marginTop: 3 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.typeIcon} {d.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{d.typeLabel}</div>
                        <div className="blur-private" style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', marginTop: 1 }}>
                          {formatCurrency(d.value, baseCurrency)}
                          <span style={{ fontWeight: 400, color: 'var(--text-dim)', marginLeft: 5 }}>
                            {((d.value / (totalAssets + totalLiab)) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {assets.length > 1 && (
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>Total</span>
                      <span className="blur-private" style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)' }}>{formatCurrency(totalAssets, baseCurrency)}</span>
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--red)', fontWeight: 700, marginBottom: 10 }}>Liabilities</div>
                  {liabilities.length === 0 ? (
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic' }}>None — debt free 🎉</div>
                  ) : liabilities.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 9 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0, marginTop: 3 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.typeIcon} {d.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{d.typeLabel}</div>
                        <div className="blur-private" style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)', marginTop: 1 }}>
                          {'−'}{formatCurrency(d.value, baseCurrency)}
                          <span style={{ fontWeight: 400, color: 'var(--text-dim)', marginLeft: 5 }}>
                            {((d.value / (totalAssets + totalLiab)) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {liabilities.length > 1 && (
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>Total</span>
                      <span className="blur-private" style={{ fontSize: 12, fontWeight: 700, color: 'var(--red)' }}>{'−'}{formatCurrency(totalLiab, baseCurrency)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )
      })()}
    </>
  )
}
