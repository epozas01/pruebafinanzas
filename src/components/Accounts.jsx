import { useState, useMemo } from 'react'
import { useAccounts } from '../hooks/useAccounts'
import { useExchangeRates } from '../hooks/useExchangeRates'
import { ACCOUNT_TYPES } from '../data/currencies'
import { formatCurrency } from '../utils/format'
import AccountForm from './AccountForm'

function computeBalance(acc, transactions) {
  const isAsset = ACCOUNT_TYPES.find(t => t.id === acc.type)?.isAsset ?? true
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
    } else if (t.type === 'income') {
      inflow += t.amount
    } else {
      outflow += t.amount
    }
  })
  const opening = acc.openingBalance ?? acc.balance ?? 0
  return isAsset ? opening + inflow - outflow : opening + outflow - inflow
}

function PatrimonyCard({ accountsWithBalance, toBase, baseCurrency, ratesLoading, ratesError, updatedAt }) {
  const { assets, liabilities, netWorth } = useMemo(() => {
    let assets = 0, liabilities = 0
    accountsWithBalance.forEach(({ acc, balance }) => {
      const type   = ACCOUNT_TYPES.find(t => t.id === acc.type)
      const inBase = toBase(balance, acc.currency) ?? balance
      if (type?.isAsset) assets += inBase
      else liabilities += inBase
    })
    return { assets, liabilities, netWorth: assets - liabilities }
  }, [accountsWithBalance, toBase])

  return (
    <div style={{
      margin: '20px 16px 0',
      background: 'linear-gradient(145deg, #1c1a0e, #0a0a0a)',
      border: '1px solid var(--border-strong)',
      borderRadius: 'var(--radius)',
      padding: '24px 22px 20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: -40, right: -40, width: 180, height: 180,
        background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'var(--gold)', fontWeight: 600, marginBottom: 6 }}>
        Total Patrimony
      </div>

      {ratesLoading ? (
        <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-mid)', marginBottom: 16 }}>Calculating…</div>
      ) : (
        <div className="blur-private" style={{
          fontFamily: 'var(--serif)', fontSize: 42, fontWeight: 700, letterSpacing: '-0.02em',
          color: netWorth >= 0 ? 'var(--text)' : 'var(--red)', lineHeight: 1, marginBottom: 18,
        }}>
          {formatCurrency(netWorth, baseCurrency)}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-dim)', fontWeight: 600, marginBottom: 4 }}>Assets</div>
          <div className="blur-private" style={{ fontSize: 18, fontWeight: 700, color: 'var(--green)' }}>
            {ratesLoading ? '…' : formatCurrency(assets, baseCurrency)}
          </div>
        </div>
        <div style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-dim)', fontWeight: 600, marginBottom: 4 }}>Liabilities</div>
          <div className="blur-private" style={{ fontSize: 18, fontWeight: 700, color: 'var(--red)' }}>
            {ratesLoading ? '…' : formatCurrency(liabilities, baseCurrency)}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 6 }}>
        {ratesError ? (
          <span style={{ color: '#f59e0b' }}>⚠ {ratesError}</span>
        ) : updatedAt ? (
          <>
            <span style={{ color: 'var(--gold)', opacity: .7 }}>●</span>
            Live FX · {updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </>
        ) : null}
      </div>
    </div>
  )
}

function AccountCard({ acc, balance, linkedCount, onEdit, onDelete }) {
  const type = ACCOUNT_TYPES.find(t => t.id === acc.type) || ACCOUNT_TYPES[0]
  const [confirmDelete, setConfirmDelete] = useState(false)

  const openingBalance = acc.openingBalance ?? acc.balance ?? 0
  const hasChanged     = Math.abs(balance - openingBalance) > 0.001

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)', padding: '14px 16px', marginBottom: 10,
      display: 'flex', alignItems: 'center', gap: 14, transition: 'border-color .2s',
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 13, flexShrink: 0,
        background: type.isAsset ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
      }}>
        {type.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {acc.name}
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
            background: type.isAsset ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
            color: type.isAsset ? 'var(--green)' : 'var(--red)',
          }}>
            {type.label}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
          {acc.bank && <span>{acc.bank} · </span>}
          {linkedCount > 0
            ? <span>{linkedCount} transaction{linkedCount !== 1 ? 's' : ''} linked</span>
            : <span style={{ fontStyle: 'italic' }}>No transactions linked</span>
          }
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div className="blur-private" style={{ fontSize: 16, fontWeight: 700, color: type.isAsset ? 'var(--text)' : 'var(--red)' }}>
          {type.isAsset ? '' : '−'}{formatCurrency(balance, acc.currency)}
        </div>
        <div style={{ fontSize: 11, color: 'var(--gold)', marginTop: 2, fontWeight: 600 }}>
          {acc.currency}
          {hasChanged && (
            <span style={{ color: balance > openingBalance ? 'var(--green)' : 'var(--red)', marginLeft: 6 }}>
              {balance > openingBalance ? '↑' : '↓'}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
        <button onClick={() => onEdit(acc)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 14, padding: '2px 6px', borderRadius: 6 }} title="Edit">✎</button>
        {confirmDelete ? (
          <button onClick={() => onDelete(acc.id)} style={{ background: 'rgba(248,113,113,0.15)', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 11, padding: '2px 6px', borderRadius: 6, fontWeight: 700 }}>✓</button>
        ) : (
          <button onClick={() => setConfirmDelete(true)} onBlur={() => setConfirmDelete(false)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 14, padding: '2px 6px', borderRadius: 6 }} title="Delete">✕</button>
        )}
      </div>
    </div>
  )
}

export default function Accounts({ uid, transactions = [] }) {
  const { accounts, loading, addAccount, updateAccount, deleteAccount } = useAccounts(uid)
  const { toBase, baseCurrency, loading: ratesLoading, error: ratesError, updatedAt } = useExchangeRates()

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState(null)

  // Compute live balance per account from linked transactions
  const accountsWithBalance = useMemo(() =>
    accounts.map(acc => ({
      acc,
      balance:      computeBalance(acc, transactions),
      linkedCount:  transactions.filter(t => t.accountId === acc.id).length,
    })),
    [accounts, transactions],
  )

  const byType = useMemo(() => ({
    assets:      accountsWithBalance.filter(({ acc }) => ACCOUNT_TYPES.find(t => t.id === acc.type)?.isAsset !== false),
    liabilities: accountsWithBalance.filter(({ acc }) => ACCOUNT_TYPES.find(t => t.id === acc.type)?.isAsset === false),
  }), [accountsWithBalance])

  async function handleSave(data) {
    if (editing) {
      const { id, createdAt, ...rest } = data
      await updateAccount(editing.id, rest)
    } else {
      await addAccount(data)
    }
    setEditing(null)
  }

  function openEdit(acc) {
    setEditing(acc)
    setShowForm(true)
  }

  return (
    <>
      <PatrimonyCard
        accountsWithBalance={accountsWithBalance}
        toBase={toBase}
        baseCurrency={baseCurrency}
        ratesLoading={ratesLoading}
        ratesError={ratesError}
        updatedAt={updatedAt}
      />

      {loading ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>Loading accounts…</div>
      ) : accounts.length === 0 ? (
        <div className="empty-state" style={{ paddingTop: 40 }}>
          <div className="empty-icon">🏦</div>
          <div className="empty-msg">No accounts yet.<br />Tap + to add your first account.</div>
        </div>
      ) : (
        <>
          {byType.assets.length > 0 && (
            <>
              <div className="sec-head">
                <div className="sec-title">Assets</div>
                <div style={{ fontSize: 12, color: 'var(--green)' }}>{byType.assets.length} account{byType.assets.length !== 1 ? 's' : ''}</div>
              </div>
              <div className="tx-list">
                {byType.assets.map(({ acc, balance, linkedCount }) => (
                  <AccountCard key={acc.id} acc={acc} balance={balance} linkedCount={linkedCount} onEdit={openEdit} onDelete={deleteAccount} />
                ))}
              </div>
            </>
          )}
          {byType.liabilities.length > 0 && (
            <>
              <div className="sec-head">
                <div className="sec-title">Liabilities</div>
                <div style={{ fontSize: 12, color: 'var(--red)' }}>{byType.liabilities.length} account{byType.liabilities.length !== 1 ? 's' : ''}</div>
              </div>
              <div className="tx-list">
                {byType.liabilities.map(({ acc, balance, linkedCount }) => (
                  <AccountCard key={acc.id} acc={acc} balance={balance} linkedCount={linkedCount} onEdit={openEdit} onDelete={deleteAccount} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      <button className="fab" onClick={() => { setEditing(null); setShowForm(true) }} title="Add account">+</button>

      {showForm && (
        <AccountForm
          initial={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null) }}
        />
      )}
    </>
  )
}
