import { useState } from 'react'
import { INCOME_CATEGORIES } from '../data/categories'
import { useBudgetCategories } from '../hooks/useBudgetCategories'
import { useAccounts } from '../hooks/useAccounts'
import { today } from '../utils/format'

const empty = (type = 'expense') => ({
  type,
  amount: '',
  category: type === 'expense' ? 'food' : type === 'income' ? 'salary' : '',
  accountId: '',
  fromAccountId: '',
  toAccountId: '',
  description: '',
  date: today(),
  notes: '',
})

export default function TransactionForm({ onSave, onClose, uid }) {
  const { categories: expenseCategories } = useBudgetCategories(uid)
  const { accounts } = useAccounts(uid)
  const [form, setForm] = useState(empty('expense'))

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  function switchType(t) {
    setForm(f => ({ ...empty(t), date: f.date, accountId: f.accountId }))
  }

  function submit(e) {
    e.preventDefault()
    const amount = parseFloat(form.amount)
    if (!amount || amount <= 0) return
    if (form.type === 'transfer') {
      if (!form.fromAccountId || !form.toAccountId) return
      if (form.fromAccountId === form.toAccountId) return
      const fromAcc = accounts.find(a => a.id === form.fromAccountId)
      const toAcc   = accounts.find(a => a.id === form.toAccountId)
      onSave({
        ...form, amount,
        fromAccountName: fromAcc?.name || '',
        toAccountName:   toAcc?.name   || '',
      })
    } else {
      onSave({ ...form, amount })
    }
    onClose()
  }

  const cats = form.type === 'expense' ? expenseCategories : INCOME_CATEGORIES

  // Make sure selected category still exists after category list change
  const catExists = cats.some(c => c.id === form.category)
  const safeCategory = catExists ? form.category : (cats[0]?.id || '')

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-title">New Transaction</div>

        <div className="type-toggle">
          <button type="button" className={`type-btn expense ${form.type === 'expense' ? 'active' : ''}`} onClick={() => switchType('expense')}>
            ↑ Expense
          </button>
          <button type="button" className={`type-btn income ${form.type === 'income' ? 'active' : ''}`} onClick={() => switchType('income')}>
            ↓ Income
          </button>
          <button type="button" className={`type-btn transfer ${form.type === 'transfer' ? 'active' : ''}`} onClick={() => switchType('transfer')}>
            ⇄ Transfer
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="field">
            <label className="field-label">Amount</label>
            <input type="number" min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={set('amount')} required autoFocus />
          </div>

          {form.type === 'transfer' ? (
            <>
              <div className="field">
                <label className="field-label">From Account</label>
                <select value={form.fromAccountId} onChange={set('fromAccountId')} required>
                  <option value="">— Select account —</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id} disabled={a.id === form.toAccountId}>
                      {a.name}{a.bank ? ` · ${a.bank}` : ''} ({a.currency})
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="field-label">To Account</label>
                <select value={form.toAccountId} onChange={set('toAccountId')} required>
                  <option value="">— Select account —</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id} disabled={a.id === form.fromAccountId}>
                      {a.name}{a.bank ? ` · ${a.bank}` : ''} ({a.currency})
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="field-label">Date</label>
                <input type="date" value={form.date} onChange={set('date')} />
              </div>
            </>
          ) : (
            <>
              <div className="row2">
                <div className="field">
                  <label className="field-label">Category</label>
                  <select value={safeCategory} onChange={set('category')}>
                    {cats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">Date</label>
                  <input type="date" value={form.date} onChange={set('date')} />
                </div>
              </div>

              {accounts.length > 0 && (
                <div className="field">
                  <label className="field-label">Account</label>
                  <select value={form.accountId} onChange={set('accountId')}>
                    <option value="">— No account —</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name}{a.bank ? ` · ${a.bank}` : ''} ({a.currency})</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          <div className="field">
            <label className="field-label">Description</label>
            <input type="text" placeholder="e.g. Grocery run, Netflix…" value={form.description} onChange={set('description')} />
          </div>

          <div className="field">
            <label className="field-label">Notes (optional)</label>
            <textarea rows={2} placeholder="Any extra details…" value={form.notes} onChange={set('notes')} style={{ resize: 'none' }} />
          </div>

          <button className="save-btn" type="submit">Save Transaction</button>
        </form>
      </div>
    </div>
  )
}
