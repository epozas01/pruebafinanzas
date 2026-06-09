import { useMemo, useState } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, Label, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'
import { EXPENSE_CATEGORIES, CATEGORY_COLORS } from '../data/categories'
import { formatCurrency, isoMonth } from '../utils/format'
import { useExchangeRates } from '../hooks/useExchangeRates'
import { ACCOUNT_TYPES } from '../data/currencies'

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

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#1a1a1a',
      border: '1px solid rgba(212,175,55,0.25)',
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: 13,
    }}>
      <div style={{ color: 'var(--gold)', fontWeight: 700, marginBottom: 4 }}>{payload[0]?.name}</div>
      <div style={{ color: '#f5f5f0' }}>{formatCurrency(payload[0]?.value)}</div>
    </div>
  )
}

export default function Analytics({ transactions, accounts = [] }) {
  const { toBase, baseCurrency } = useExchangeRates()
  const months = last6Months()
  const [selectedMonth, setSelectedMonth] = useState(isoMonth())

  const { pieData, barData, totalExp, totalInc } = useMemo(() => {
    const monthTx = transactions.filter(t => t.date.startsWith(selectedMonth))

    // Pie: expense breakdown by category
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

    // Bar: last 6 months income vs expense
    const bar = months.map(m => ({
      month: monthLabel(m),
      Income:  transactions.filter(t => t.type === 'income'  && t.date.startsWith(m)).reduce((s, t) => s + t.amount, 0),
      Expenses: transactions.filter(t => t.type === 'expense' && t.date.startsWith(m)).reduce((s, t) => s + t.amount, 0),
    }))

    const tExp = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const tInc = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)

    return { pieData: pie, barData: bar, totalExp: tExp, totalInc: tInc }
  }, [transactions, selectedMonth])

  const TYPE_COLORS = {
    checking:    '#60a5fa',
    savings:     '#4ade80',
    investment:  '#a78bfa',
    cash:        '#34d399',
    crypto:      '#f59e0b',
    credit_card: '#f87171',
    loan:        '#fb923c',
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
      const opening   = acc.openingBalance ?? acc.balance ?? 0
      const balance   = isAsset ? opening + inflow - outflow : opening + outflow - inflow
      const inBase    = toBase(balance, acc.currency) ?? balance
      return {
        name:      acc.name,
        typeLabel: type?.label  || acc.type,
        typeIcon:  type?.icon   || '',
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

      {/* Month selector */}
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

      {/* Summary row */}
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

      {/* Expense pie */}
      {pieData.length > 0 ? (
        <>
          <div style={{ padding: '0 16px 8px', fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 600 }}>
            Spending Breakdown
          </div>
          <div style={{ padding: '0 16px' }}>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingBottom: 16 }}>
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

      {/* 6-month bar chart */}
      <div style={{ padding: '8px 16px 8px', fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 600 }}>
        6-Month Overview
      </div>
      <div style={{ padding: '0 8px 16px' }}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} barSize={16} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" tick={{ fill: 'var(--text-dim)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-dim)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
            <Tooltip
              contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 10 }}
              labelStyle={{ color: 'var(--gold)', fontWeight: 700 }}
              itemStyle={{ color: 'var(--text)' }}
              formatter={v => formatCurrency(v)}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <Bar dataKey="Income"   fill="#4ade80" radius={[4,4,0,0]} />
            <Bar dataKey="Expenses" fill="#f87171" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Patrimony pie */}
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
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie
                    data={patrimonyData}
                    cx="50%" cy="50%"
                    innerRadius={62} outerRadius={92}
                    paddingAngle={2} dataKey="value"
                    strokeWidth={0}
                  >
                    {patrimonyData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                    <Label
                      content={({ viewBox: { cx, cy } }) => (
                        <g>
                          <text x={cx} y={cy - 9} textAnchor="middle" fill="#6b6b65" fontSize={9} fontWeight={700} letterSpacing={1.5}>
                            NET WORTH
                          </text>
                          <text x={cx} y={cy + 13} textAnchor="middle" fill={netWorth >= 0 ? '#f5f5f0' : '#f87171'} fontSize={15} fontWeight={700}>
                            {netWorth < 0 ? '−' : ''}{formatCurrency(Math.abs(netWorth), baseCurrency)}
                          </text>
                        </g>
                      )}
                      position="center"
                    />
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload
                      return (
                        <div style={{ background: '#1a1a1a', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
                          <div style={{ color: 'var(--gold)', fontWeight: 700, marginBottom: 2 }}>{d.typeIcon} {d.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6 }}>{d.typeLabel}</div>
                          <div style={{ color: d.isAsset ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
                            {d.isAsset ? '' : '−'}{formatCurrency(d.value, baseCurrency)}
                          </div>
                        </div>
                      )
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 8 }}>
                <div>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--green)', fontWeight: 700, marginBottom: 10 }}>Assets</div>
                  {assets.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 9 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0, marginTop: 3 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.typeIcon} {d.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{d.typeLabel}</div>
                        <div className="blur-private" style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', marginTop: 1 }}>{formatCurrency(d.value, baseCurrency)}</div>
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
                        <div className="blur-private" style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)', marginTop: 1 }}>{'−'}{formatCurrency(d.value, baseCurrency)}</div>
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
