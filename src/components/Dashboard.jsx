import { useMemo } from 'react'
import { formatCurrency, formatDate, isoMonth } from '../utils/format'
import { getCategoryMeta } from '../data/categories'

function TxRow({ tx, onDelete }) {
  const isTransfer = tx.type === 'transfer'
  const meta = isTransfer ? null : getCategoryMeta(tx.category, tx.type)
  return (
    <div className="tx-item">
      <div className={`tx-icon ${tx.type}`}>{isTransfer ? '⇄' : meta.icon}</div>
      <div className="tx-info">
        <div className="tx-desc">{tx.description || (isTransfer ? 'Transfer' : meta.label)}</div>
        <div className="tx-meta">
          {isTransfer
            ? `${tx.fromAccountName || '—'} → ${tx.toAccountName || '—'}`
            : meta.label}
        </div>
      </div>
      <div className="tx-right">
        <div className={`tx-amt ${tx.type}`}>
          {!isTransfer && (tx.type === 'income' ? '+' : '-')}{formatCurrency(tx.amount)}
        </div>
        <div className="tx-date">{formatDate(tx.date)}</div>
      </div>
      <button className="tx-delete" onClick={() => onDelete(tx.id)} title="Delete">✕</button>
    </div>
  )
}

export default function Dashboard({ transactions, onDelete, onShowAll }) {
  const month = isoMonth()

  const { balance, monthIncome, monthExpense, recent } = useMemo(() => {
    const income  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

    const mInc = transactions
      .filter(t => t.type === 'income' && t.date.startsWith(month))
      .reduce((s, t) => s + t.amount, 0)

    const mExp = transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(month))
      .reduce((s, t) => s + t.amount, 0)

    const sorted = [...transactions].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5)

    return { balance: income - expense, monthIncome: mInc, monthExpense: mExp, recent: sorted }
  }, [transactions, month])

  return (
    <>
      {/* Hero */}
      <div className="hero">
        <div className="hero-label">Net Balance</div>
        <div className={`hero-value blur-private ${balance >= 0 ? 'positive' : 'negative'}`}>
          {formatCurrency(balance)}
        </div>
        <div className="hero-row">
          <div className="hero-stat">
            <div className="hero-stat-label">Income this month</div>
            <div className="hero-stat-val inc blur-private">{formatCurrency(monthIncome)}</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-label">Spent this month</div>
            <div className="hero-stat-val exp blur-private">{formatCurrency(monthExpense)}</div>
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="sec-head">
        <div className="sec-title">Recent</div>
        <button className="sec-link" onClick={onShowAll}>See all →</button>
      </div>

      <div className="tx-list">
        {recent.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💳</div>
            <div className="empty-msg">No transactions yet.<br />Tap + to add your first one.</div>
          </div>
        ) : (
          recent.map(tx => <TxRow key={tx.id} tx={tx} onDelete={onDelete} />)
        )}
      </div>
    </>
  )
}
