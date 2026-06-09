import { useState, useMemo } from 'react'
import { EXPENSE_CATEGORIES, CATEGORY_COLORS } from '../data/categories'
import { formatCurrency, isoMonth } from '../utils/format'
import { useBudget } from '../hooks/useBudget'

export default function Budget({ transactions, uid }) {
  const { budgets, setBudgetLimit } = useBudget(uid)
  const [editing, setEditing] = useState(null)
  const [editVal, setEditVal] = useState('')
  const month = isoMonth()

  const spending = useMemo(() => {
    const map = {}
    transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(month))
      .forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount })
    return map
  }, [transactions, month])

  async function saveEdit(catId) {
    const val = parseFloat(editVal)
    if (val > 0) await setBudgetLimit(catId, val)
    setEditing(null)
    setEditVal('')
  }

  return (
    <>
      <div className="sec-head">
        <div className="sec-title">Monthly Budget</div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
          {new Date().toLocaleString('default', { month: 'long' })}
        </div>
      </div>

      {EXPENSE_CATEGORIES.map(cat => {
        const limit     = budgets[cat.id] || 0
        const spent     = spending[cat.id] || 0
        const pct       = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0
        const left      = limit - spent
        const over      = spent > limit && limit > 0
        const color     = over ? 'var(--red)' : pct > 75 ? '#f59e0b' : CATEGORY_COLORS[cat.id] || 'var(--gold)'
        const isEditing = editing === cat.id

        return (
          <div className="budget-item" key={cat.id}>
            <div className="budget-top">
              <div className="budget-cat">{cat.icon} {cat.label}</div>
              <div className="budget-numbers">
                {isEditing ? (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input
                      type="number" min="1" step="1" value={editVal}
                      onChange={e => setEditVal(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit(cat.id); if (e.key === 'Escape') setEditing(null) }}
                      autoFocus
                      style={{
                        width: 90, padding: '4px 8px', background: 'var(--bg-elev)',
                        border: '1px solid var(--gold)', borderRadius: 8,
                        color: 'var(--text)', fontSize: 13, fontWeight: 700,
                      }}
                    />
                    <button
                      onClick={() => saveEdit(cat.id)}
                      style={{ background: 'var(--gold)', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 12, fontWeight: 700, color: '#0a0a0a' }}
                    >✓</button>
                  </div>
                ) : (
                  <div
                    className="budget-spent blur-private"
                    style={{ color, cursor: 'pointer', fontSize: 16 }}
                    onClick={() => { setEditing(cat.id); setEditVal(limit > 0 ? String(limit) : '') }}
                    title="Click to set budget"
                  >
                    {formatCurrency(spent)}
                    <span style={{ color: 'var(--text-dim)', fontSize: 12, fontWeight: 400, marginLeft: 4 }}>
                      / {limit > 0 ? formatCurrency(limit) : 'set budget'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${pct}%`,
                  background: over
                    ? 'var(--red)'
                    : pct > 75
                      ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                      : `linear-gradient(90deg, ${color}, ${color}aa)`,
                }}
              />
            </div>

            {limit > 0 ? (
              <div className={`budget-left blur-private ${over ? 'over' : ''}`}>
                {over
                  ? `⚠️ Over budget by ${formatCurrency(Math.abs(left))}`
                  : `${formatCurrency(left)} remaining`}
              </div>
            ) : (
              <div
                className="budget-left"
                style={{ cursor: 'pointer' }}
                onClick={() => { setEditing(cat.id); setEditVal('') }}
              >
                Tap amount to set a budget limit
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}
