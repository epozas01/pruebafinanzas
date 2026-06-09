import { useState } from 'react'
import { useRecurring } from '../hooks/useRecurring'
import { useBudgetCategories } from '../hooks/useBudgetCategories'
import { useAccounts } from '../hooks/useAccounts'
import { INCOME_CATEGORIES } from '../data/categories'
import { formatCurrency, today } from '../utils/format'

const FREQUENCIES = [
  { id: 'daily',   label: 'Daily'   },
  { id: 'weekly',  label: 'Weekly'  },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly',  label: 'Yearly'  },
]

const FREQ_LABEL = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' }

function RecurringForm({ initial, onSave, onClose, uid }) {
  const { categories: expenseCategories } = useBudgetCategories(uid)
  const { accounts } = useAccounts(uid)
  const [form, setForm] = useState(initial ? {
    ...initial,
    amount: String(initial.amount ?? ''),
  } : {
    type: 'expense', amount: '', category: 'food',
    accountId: '', description: '', frequency: 'monthly', nextDate: today(), active: true,
  })

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const cats = form.type === 'expense' ? expenseCategories : INCOME_CATEGORIES

  function submit(e) {
    e.preventDefault()
    const amount = parseFloat(form.amount)
    if (!amount || amount <= 0) return
    onSave({ ...form, amount })
    onClose()
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-title">{initial ? 'Edit Recurring' : 'New Recurring Transaction'}</div>

        <div className="type-toggle">
          <button type="button" className={`type-btn expense ${form.type === 'expense' ? 'active' : ''}`}
            onClick={() => setForm(f => ({ ...f, type: 'expense', category: 'food' }))}>
            ↑ Expense
          </button>
          <button type="button" className={`type-btn income ${form.type === 'income' ? 'active' : ''}`}
            onClick={() => setForm(f => ({ ...f, type: 'income', category: 'salary' }))}>
            ↓ Income
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="row2">
            <div className="field">
              <label className="field-label">Amount</label>
              <input type="number" min="0.01" step="0.01" placeholder="0.00"
                value={form.amount} onChange={set('amount')} required autoFocus />
            </div>
            <div className="field">
              <label className="field-label">Frequency</label>
              <select value={form.frequency} onChange={set('frequency')}>
                {FREQUENCIES.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
            </div>
          </div>

          <div className="row2">
            <div className="field">
              <label className="field-label">Category</label>
              <select value={form.category} onChange={set('category')}>
                {cats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field-label">Next Date</label>
              <input type="date" value={form.nextDate} onChange={set('nextDate')} />
            </div>
          </div>

          <div className="field">
            <label className="field-label">Description</label>
            <input type="text" placeholder="e.g. Netflix, Rent, Salary…"
              value={form.description} onChange={set('description')} required />
          </div>

          {accounts.length > 0 && (
            <div className="field">
              <label className="field-label">Account (optional)</label>
              <select value={form.accountId} onChange={set('accountId')}>
                <option value="">— No account —</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}{a.bank ? ` · ${a.bank}` : ''}</option>
                ))}
              </select>
            </div>
          )}

          <button className="save-btn" type="submit">{initial ? 'Save Changes' : 'Add Recurring'}</button>
        </form>
      </div>
    </div>
  )
}

export default function Recurring({ uid }) {
  const { recurring, addRecurring, updateRecurring, deleteRecurring } = useRecurring(uid)
  const [showForm, setShowForm]   = useState(false)
  const [editing, setEditing]     = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)

  function openEdit(r) { setEditing(r); setShowForm(true) }

  async function handleSave(data) {
    if (editing) {
      const { id, createdAt, ...rest } = data
      await updateRecurring(editing.id, rest)
    } else {
      await addRecurring(data)
    }
    setEditing(null)
  }

  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <>
      <div className="sec-head">
        <div className="sec-title">Recurring Transactions</div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{recurring.length} rule{recurring.length !== 1 ? 's' : ''}</div>
      </div>

      {recurring.length === 0 ? (
        <div className="empty-state" style={{ paddingTop: 40 }}>
          <div className="empty-icon" style={{ fontSize: 40 }}>↻</div>
          <div className="empty-msg">No recurring transactions yet.<br />Tap + to add subscriptions, rent, salary…</div>
        </div>
      ) : (
        <div className="tx-list">
          {recurring.map(r => {
            const isDue = r.active && r.nextDate && r.nextDate <= todayStr
            return (
              <div key={r.id} className="tx-item" style={{ opacity: r.active ? 1 : 0.45 }}>
                <div className={`tx-icon ${r.type}`}>{r.type === 'income' ? '↓' : '↑'}</div>
                <div className="tx-info">
                  <div className="tx-desc" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {r.description || '—'}
                    {isDue && (
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: 'rgba(212,175,55,0.15)', color: 'var(--gold)', fontWeight: 700 }}>
                        DUE
                      </span>
                    )}
                    {!r.active && (
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: 'rgba(107,107,101,0.2)', color: 'var(--text-dim)', fontWeight: 700 }}>
                        PAUSED
                      </span>
                    )}
                  </div>
                  <div className="tx-meta">{FREQ_LABEL[r.frequency]} · Next: {r.nextDate || '—'}</div>
                </div>
                <div className="tx-right">
                  <div className={`tx-amt ${r.type} blur-private`}>
                    {r.type === 'income' ? '+' : '-'}{formatCurrency(r.amount)}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                  <button
                    onClick={() => updateRecurring(r.id, { active: !r.active })}
                    title={r.active ? 'Pause' : 'Resume'}
                    style={{ background: 'none', border: 'none', color: r.active ? 'var(--gold)' : 'var(--text-dim)', cursor: 'pointer', fontSize: 13, padding: '2px 6px', borderRadius: 6 }}
                  >{r.active ? '⏸' : '▶'}</button>
                  <button onClick={() => openEdit(r)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 14, padding: '2px 6px', borderRadius: 6 }} title="Edit">✎</button>
                  {confirmDel === r.id ? (
                    <button
                      onClick={() => { deleteRecurring(r.id); setConfirmDel(null) }}
                      style={{ background: 'rgba(248,113,113,0.15)', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 11, padding: '2px 6px', borderRadius: 6, fontWeight: 700 }}
                    >✓</button>
                  ) : (
                    <button
                      onClick={() => setConfirmDel(r.id)}
                      onBlur={() => setConfirmDel(null)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 14, padding: '2px 6px', borderRadius: 6 }}
                      title="Delete"
                    >✕</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <button className="fab" onClick={() => { setEditing(null); setShowForm(true) }} title="Add recurring">+</button>

      {showForm && (
        <RecurringForm
          initial={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null) }}
          uid={uid}
        />
      )}
    </>
  )
}
