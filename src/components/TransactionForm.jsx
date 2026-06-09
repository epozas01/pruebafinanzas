import { useState } from 'react'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/categories'
import { today } from '../utils/format'

const empty = (type = 'expense') => ({
  type,
  amount: '',
  category: type === 'expense' ? 'food' : 'salary',
  description: '',
  date: today(),
  notes: '',
})

export default function TransactionForm({ onSave, onClose }) {
  const [form, setForm] = useState(empty('expense'))

  const set = (k) => (e) => {
    const val = e.target.value
    setForm(f => ({ ...f, [k]: val }))
  }

  function switchType(t) {
    setForm(f => ({
      ...empty(t),
      date: f.date,
    }))
  }

  function submit(e) {
    e.preventDefault()
    const amount = parseFloat(form.amount)
    if (!amount || amount <= 0) return
    onSave({ ...form, amount, id: Date.now() })
    onClose()
  }

  const cats = form.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-title">New Transaction</div>

        <div className="type-toggle">
          <button
            type="button"
            className={`type-btn expense ${form.type === 'expense' ? 'active' : ''}`}
            onClick={() => switchType('expense')}
          >
            ↑ Expense
          </button>
          <button
            type="button"
            className={`type-btn income ${form.type === 'income' ? 'active' : ''}`}
            onClick={() => switchType('income')}
          >
            ↓ Income
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="field">
            <label className="field-label">Amount</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={set('amount')}
              required
              autoFocus
            />
          </div>

          <div className="row2">
            <div className="field">
              <label className="field-label">Category</label>
              <select value={form.category} onChange={set('category')}>
                {cats.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="field-label">Date</label>
              <input type="date" value={form.date} onChange={set('date')} />
            </div>
          </div>

          <div className="field">
            <label className="field-label">Description</label>
            <input
              type="text"
              placeholder="e.g. Grocery run, Netflix…"
              value={form.description}
              onChange={set('description')}
            />
          </div>

          <div className="field">
            <label className="field-label">Notes (optional)</label>
            <textarea
              rows={2}
              placeholder="Any extra details…"
              value={form.notes}
              onChange={set('notes')}
              style={{ resize: 'none' }}
            />
          </div>

          <button className="save-btn" type="submit">Save Transaction</button>
        </form>
      </div>
    </div>
  )
}
