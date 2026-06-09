import { useState, useMemo } from 'react'
import { CATEGORY_COLORS } from '../data/categories'
import { formatCurrency, isoMonth } from '../utils/format'
import { useBudget } from '../hooks/useBudget'
import { useBudgetCategories } from '../hooks/useBudgetCategories'

const EMOJI_SUGGESTIONS = ['🍔','🏠','🚗','🎬','🛍️','💊','📚','⚡','✈️','🐾','🎮','💇','🍷','🏋️','👶','🎁','📱','🧹']

function ManageCategories({ categories, onAdd, onRemove, onClose }) {
  const [icon, setIcon]   = useState('📦')
  const [label, setLabel] = useState('')
  const [showPicker, setShowPicker] = useState(false)

  function addCat(e) {
    e.preventDefault()
    if (!label.trim()) return
    const id = `custom_${label.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`
    onAdd({ id, label: label.trim(), icon })
    setLabel('')
    setIcon('📦')
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet" style={{ maxHeight: '88vh', overflowY: 'auto' }}>
        <div className="sheet-handle" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div className="sheet-title" style={{ marginBottom: 0 }}>Budget Categories</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Add new */}
        <form onSubmit={addCat} style={{ marginBottom: 24 }}>
          <div className="field-label" style={{ marginBottom: 8 }}>Add Category</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Emoji picker */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowPicker(p => !p)}
                style={{
                  width: 44, height: 44, borderRadius: 10, fontSize: 22,
                  background: 'var(--bg-elev)', border: '1px solid var(--border)',
                  cursor: 'pointer', flexShrink: 0,
                }}
              >
                {icon}
              </button>
              {showPicker && (
                <div style={{
                  position: 'absolute', top: 50, left: 0, zIndex: 10,
                  background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
                  borderRadius: 12, padding: 10,
                  display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4,
                  width: 200,
                }}>
                  {EMOJI_SUGGESTIONS.map(e => (
                    <button
                      key={e} type="button"
                      onClick={() => { setIcon(e); setShowPicker(false) }}
                      style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: 4, borderRadius: 6 }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <input
              style={{
                flex: 1, padding: '11px 14px', background: 'var(--bg-elev)',
                border: '1px solid var(--border)', borderRadius: 10,
                color: 'var(--text)', fontSize: 14, fontFamily: 'var(--sans)',
              }}
              placeholder="Category name…"
              value={label}
              onChange={e => setLabel(e.target.value)}
              required
            />
            <button
              type="submit"
              style={{
                padding: '11px 16px', background: 'var(--gold)', border: 'none',
                borderRadius: 10, color: '#0a0a0a', fontWeight: 800, fontSize: 18,
                cursor: 'pointer', flexShrink: 0,
              }}
            >+</button>
          </div>
        </form>

        {/* Current list */}
        <div className="field-label" style={{ marginBottom: 10 }}>Current Categories ({categories.length})</div>
        {categories.map(cat => (
          <div key={cat.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '11px 14px', background: 'var(--bg-elev)',
            border: '1px solid var(--border)', borderRadius: 10, marginBottom: 8,
          }}>
            <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{cat.icon}</span>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{cat.label}</span>
            <button
              onClick={() => onRemove(cat.id)}
              style={{
                background: 'none', border: '1px solid rgba(248,113,113,0.3)',
                color: 'var(--red)', borderRadius: 7, padding: '4px 10px',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}
            >Remove</button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Budget({ transactions, uid }) {
  const { budgets, setBudgetLimit }             = useBudget(uid)
  const { categories, addCategory, removeCategory } = useBudgetCategories(uid)
  const [editing, setEditing]   = useState(null)
  const [editVal, setEditVal]   = useState('')
  const [showManage, setShowManage] = useState(false)
  const month = isoMonth()

  const spending = useMemo(() => {
    const map = {}
    transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(month))
      .forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount })
    return map
  }, [transactions, month])

  const { totalBudget, totalSpent } = useMemo(() => ({
    totalBudget: categories.reduce((s, cat) => s + (budgets[cat.id] || 0), 0),
    totalSpent:  categories.reduce((s, cat) => s + (spending[cat.id] || 0), 0),
  }), [categories, budgets, spending])

  async function saveEdit(catId) {
    const val = parseFloat(editVal)
    if (val > 0) await setBudgetLimit(catId, val)
    setEditing(null)
    setEditVal('')
  }

  return (
    <>
      {totalBudget > 0 && (() => {
        const pct  = Math.min((totalSpent / totalBudget) * 100, 100)
        const over = totalSpent > totalBudget
        const left = totalBudget - totalSpent
        return (
          <div style={{
            margin: '16px 16px 0',
            background: 'linear-gradient(145deg, #1c1a0e, #0a0a0a)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius)',
            padding: '20px 20px 18px',
          }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'var(--gold)', fontWeight: 600, marginBottom: 6 }}>
              Monthly Budget
            </div>
            <div className="blur-private" style={{ fontFamily: 'var(--serif)', fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 14 }}>
              {formatCurrency(totalSpent)}
              <span style={{ fontSize: 16, color: 'var(--text-dim)', fontWeight: 400, marginLeft: 8 }}>
                / {formatCurrency(totalBudget)}
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 10 }}>
              <div style={{
                height: '100%', borderRadius: 3, transition: 'width .4s ease',
                width: `${pct}%`,
                background: over ? 'var(--red)' : pct > 75 ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : 'linear-gradient(90deg,var(--gold-bright),var(--gold))',
              }} />
            </div>
            <div style={{ fontSize: 12, color: over ? 'var(--red)' : 'var(--text-dim)', fontWeight: over ? 700 : 400 }}>
              {over ? `⚠️ Over budget by ${formatCurrency(Math.abs(left))}` : `${formatCurrency(left)} remaining this month`}
            </div>
          </div>
        )
      })()}
      <div className="sec-head">
        <div className="sec-title">Monthly Budget</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
            {new Date().toLocaleString('default', { month: 'long' })}
          </div>
          <button
            onClick={() => setShowManage(true)}
            style={{
              background: 'var(--gold-soft)', border: '1px solid var(--border-strong)',
              color: 'var(--gold)', borderRadius: 8, padding: '5px 12px',
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}
          >
            ✎ Edit
          </button>
        </div>
      </div>

      {categories.map(cat => {
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
                      style={{ width: 90, padding: '4px 8px', background: 'var(--bg-elev)', border: '1px solid var(--gold)', borderRadius: 8, color: 'var(--text)', fontSize: 13, fontWeight: 700 }}
                    />
                    <button onClick={() => saveEdit(cat.id)} style={{ background: 'var(--gold)', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 12, fontWeight: 700, color: '#0a0a0a' }}>✓</button>
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
              <div className="progress-fill" style={{
                width: `${pct}%`,
                background: over ? 'var(--red)' : pct > 75 ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : `linear-gradient(90deg,${color},${color}aa)`,
              }} />
            </div>

            {limit > 0 ? (
              <div className={`budget-left blur-private ${over ? 'over' : ''}`}>
                {over ? `⚠️ Over budget by ${formatCurrency(Math.abs(left))}` : `${formatCurrency(left)} remaining`}
              </div>
            ) : (
              <div className="budget-left" style={{ cursor: 'pointer' }} onClick={() => { setEditing(cat.id); setEditVal('') }}>
                Tap amount to set a budget limit
              </div>
            )}
          </div>
        )
      })}

      {categories.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <div className="empty-msg">No categories yet.<br />Tap <strong>✎ Edit</strong> to add one.</div>
        </div>
      )}

      {showManage && (
        <ManageCategories
          categories={categories}
          onAdd={addCategory}
          onRemove={removeCategory}
          onClose={() => setShowManage(false)}
        />
      )}
    </>
  )
}
