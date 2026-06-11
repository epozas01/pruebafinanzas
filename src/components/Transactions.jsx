import { useState, useMemo } from 'react'
import { formatCurrency, formatDate } from '../utils/format'
import { getCategoryMeta, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/categories'

const ALL_CATS = [
  { id: 'all',      label: 'All',       icon: ''  },
  { id: 'income',   label: 'Income',    icon: '↓' },
  { id: 'expense',  label: 'Expenses',  icon: '↑' },
  { id: 'transfer', label: 'Transfers', icon: '⇄' },
  ...EXPENSE_CATEGORIES,
  ...INCOME_CATEGORIES,
]

const DATE_RANGES = [
  { id: 'all',   label: 'All time' },
  { id: 'month', label: 'This month' },
  { id: 'last',  label: 'Last month' },
  { id: '3mo',   label: '3 months' },
]

function rangeStart(range) {
  const now = new Date()
  if (range === 'month') return new Date(now.getFullYear(), now.getMonth(), 1)
  if (range === 'last')  return new Date(now.getFullYear(), now.getMonth() - 1, 1)
  if (range === '3mo')   return new Date(now.getFullYear(), now.getMonth() - 2, 1)
  return null
}

function rangeEnd(range) {
  const now = new Date()
  if (range === 'last') return new Date(now.getFullYear(), now.getMonth(), 1)
  return null
}

function TxRow({ tx, onDelete, onEdit }) {
  const isTransfer = tx.type === 'transfer'
  const meta = isTransfer ? null : getCategoryMeta(tx.category, tx.type)
  return (
    <div className="tx-item">
      <div className={`tx-icon ${tx.type}`}>{isTransfer ? '⇄' : meta.icon}</div>
      <div className="tx-info">
        <div className="tx-desc">{tx.description || (isTransfer ? 'Transfer' : meta.label)}</div>
        <div className="tx-meta">
          {isTransfer
            ? `${tx.fromAccountName || '—'} → ${tx.toAccountName || '—'} · ${formatDate(tx.date)}`
            : `${meta.label} · ${formatDate(tx.date)}`}
        </div>
        {tx.notes && <div className="tx-notes">{tx.notes}</div>}
      </div>
      <div className="tx-right">
        <div className={`tx-amt ${tx.type} blur-private`}>
          {!isTransfer && (tx.type === 'income' ? '+' : '-')}{formatCurrency(tx.amount)}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 2, flexShrink: 0, alignItems: 'center' }}>
        {onEdit && <button className="tx-edit" onClick={() => onEdit(tx)} title="Edit">✎</button>}
        <button className="tx-delete" onClick={() => onDelete(tx.id)} title="Delete">✕</button>
      </div>
    </div>
  )
}

export default function Transactions({ transactions, onDelete, onEdit }) {
  const [filter, setFilter] = useState('all')
  const [range, setRange]   = useState('all')
  const [search, setSearch] = useState('')

  const shown = useMemo(() => {
    let list = [...transactions].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

    if (filter === 'income')   list = list.filter(t => t.type === 'income')
    else if (filter === 'expense')  list = list.filter(t => t.type === 'expense')
    else if (filter === 'transfer') list = list.filter(t => t.type === 'transfer')
    else if (filter !== 'all') list = list.filter(t => t.category === filter)

    const start = rangeStart(range)
    const end   = rangeEnd(range)
    if (start) {
      const startStr = start.toISOString().slice(0, 10)
      list = list.filter(t => t.date >= startStr)
    }
    if (end) {
      const endStr = end.toISOString().slice(0, 10)
      list = list.filter(t => t.date < endStr)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t =>
        (t.description || '').toLowerCase().includes(q) ||
        (t.notes || '').toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      )
    }

    return list
  }, [transactions, filter, range, search])

  const summary = useMemo(() => {
    const inc = shown.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const exp = shown.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    return { net: inc - exp, hasFlow: inc > 0 || exp > 0 }
  }, [shown])

  const isFiltered = filter !== 'all' || range !== 'all' || search.trim() !== ''

  return (
    <>
      <div style={{ padding: '16px 16px 0' }}>
        <input
          style={{
            width: '100%',
            padding: '11px 16px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            color: 'var(--text)',
            fontSize: '14px',
          }}
          placeholder="🔍  Search transactions…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="chips" style={{ marginTop: 12, paddingBottom: 8 }}>
        {DATE_RANGES.map(r => (
          <button
            key={r.id}
            className={`chip ${range === r.id ? 'active' : ''}`}
            onClick={() => setRange(r.id)}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="chips">
        {ALL_CATS.map(c => (
          <button
            key={c.id}
            className={`chip ${filter === c.id ? 'active' : ''}`}
            onClick={() => setFilter(c.id)}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* Filtered summary */}
      {isFiltered && shown.length > 0 && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '4px 20px 10px', fontSize: 12, color: 'var(--text-dim)',
        }}>
          <span>{shown.length} result{shown.length !== 1 ? 's' : ''}</span>
          {summary.hasFlow && (
            <span className="blur-private" style={{ fontWeight: 700, color: summary.net >= 0 ? 'var(--green)' : 'var(--red)' }}>
              Net: {summary.net >= 0 ? '+' : ''}{formatCurrency(summary.net)}
            </span>
          )}
        </div>
      )}

      <div className="tx-list">
        {shown.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div className="empty-msg">No transactions found.</div>
          </div>
        ) : (
          shown.map(tx => <TxRow key={tx.id} tx={tx} onDelete={onDelete} onEdit={onEdit} />)
        )}
      </div>
    </>
  )
}
