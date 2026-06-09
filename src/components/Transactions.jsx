import { useState, useMemo } from 'react'
import { formatCurrency, formatDate } from '../utils/format'
import { getCategoryMeta, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/categories'

const ALL_CATS = [
  { id: 'all', label: 'All', icon: '' },
  { id: 'income', label: 'Income', icon: '↓' },
  { id: 'expense', label: 'Expenses', icon: '↑' },
  ...EXPENSE_CATEGORIES,
  ...INCOME_CATEGORIES,
]

function TxRow({ tx, onDelete }) {
  const meta = getCategoryMeta(tx.category, tx.type)
  return (
    <div className="tx-item">
      <div className={`tx-icon ${tx.type}`}>{meta.icon}</div>
      <div className="tx-info">
        <div className="tx-desc">{tx.description || meta.label}</div>
        <div className="tx-meta">{meta.label} · {formatDate(tx.date)}</div>
      </div>
      <div className="tx-right">
        <div className={`tx-amt ${tx.type} blur-private`}>
          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
        </div>
      </div>
      <button className="tx-delete" onClick={() => onDelete(tx.id)} title="Delete">✕</button>
    </div>
  )
}

export default function Transactions({ transactions, onDelete }) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const shown = useMemo(() => {
    let list = [...transactions].sort((a, b) => b.id - a.id)

    if (filter === 'income')  list = list.filter(t => t.type === 'income')
    else if (filter === 'expense') list = list.filter(t => t.type === 'expense')
    else if (filter !== 'all') list = list.filter(t => t.category === filter)

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t =>
        (t.description || '').toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      )
    }

    return list
  }, [transactions, filter, search])

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

      <div className="chips" style={{ marginTop: 12 }}>
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

      <div className="tx-list">
        {shown.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div className="empty-msg">No transactions found.</div>
          </div>
        ) : (
          shown.map(tx => <TxRow key={tx.id} tx={tx} onDelete={onDelete} />)
        )}
      </div>
    </>
  )
}
