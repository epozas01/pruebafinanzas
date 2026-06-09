import { useState } from 'react'
import { CURRENCIES, ACCOUNT_TYPES } from '../data/currencies'

const empty = () => ({
  name: '', bank: '', type: 'checking', currency: 'USD', balance: '',
})

export default function AccountForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial ? { ...initial, balance: String(initial.balance) } : empty())

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  function submit(e) {
    e.preventDefault()
    const balance = parseFloat(form.balance)
    if (isNaN(balance)) return
    onSave({ ...form, balance })
    onClose()
  }

  const typeMeta = ACCOUNT_TYPES.find(t => t.id === form.type) || ACCOUNT_TYPES[0]

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-title">
          {initial ? 'Edit Account' : 'Add Account'}
        </div>

        <form onSubmit={submit}>
          {/* Type grid */}
          <div className="field">
            <label className="field-label">Account Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {ACCOUNT_TYPES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: t.id }))}
                  style={{
                    padding: '10px 4px',
                    borderRadius: 10,
                    border: `1px solid ${form.type === t.id ? (t.isAsset ? 'rgba(74,222,128,0.5)' : 'rgba(248,113,113,0.5)') : 'var(--border)'}`,
                    background: form.type === t.id ? (t.isAsset ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)') : 'var(--bg-elev)',
                    color: form.type === t.id ? (t.isAsset ? 'var(--green)' : 'var(--red)') : 'var(--text-mid)',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'all .15s',
                  }}
                >
                  <span style={{ fontSize: 18 }}>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label className="field-label">Account Name</label>
            <input
              type="text"
              placeholder={`e.g. My ${typeMeta.label}`}
              value={form.name}
              onChange={set('name')}
              required
              autoFocus
            />
          </div>

          <div className="field">
            <label className="field-label">Bank / Institution (optional)</label>
            <input
              type="text"
              placeholder="e.g. Chase, Fidelity, Coinbase…"
              value={form.bank}
              onChange={set('bank')}
            />
          </div>

          <div className="row2">
            <div className="field">
              <label className="field-label">Currency</label>
              <select value={form.currency} onChange={set('currency')}>
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.code} — {c.symbol}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="field-label">
                {typeMeta.isAsset ? 'Current Balance' : 'Amount Owed'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.balance}
                onChange={set('balance')}
                required
              />
            </div>
          </div>

          {!typeMeta.isAsset && (
            <div style={{
              fontSize: 12, color: 'var(--text-dim)', marginBottom: 16,
              padding: '8px 12px', background: 'rgba(248,113,113,0.06)',
              border: '1px solid rgba(248,113,113,0.15)', borderRadius: 8,
            }}>
              Enter what you currently owe. This will be counted as a liability in your net worth.
            </div>
          )}

          <button className="save-btn" type="submit">
            {initial ? 'Save Changes' : 'Add Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
