import { useState, useMemo } from 'react'
import { useAccounts } from '../hooks/useAccounts'
import { useExchangeRates } from '../hooks/useExchangeRates'
import { ACCOUNT_TYPES } from '../data/currencies'
import { formatCurrency } from '../utils/format'
import AccountForm from './AccountForm'

function PatrimonyCard({ accounts, toBase, baseCurrency, ratesLoading, ratesError, updatedAt }) {
  const { assets, liabilities, netWorth } = useMemo(() => {
    let assets = 0, liabilities = 0
    accounts.forEach(acc => {
      const type   = ACCOUNT_TYPES.find(t => t.id === acc.type)
      const inBase = toBase(acc.balance, acc.currency) ?? acc.balance
      if (type?.isAsset) assets += inBase
      else liabilities += inBase
    })
    return { assets, liabilities, netWorth: assets - liabilities }
  }, [accounts, toBase])

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
      {/* Glow */}
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
          fontFamily: 'var(--serif)',
          fontSize: 42,
          fontWeight: 700,
          color: netWorth >= 0 ? 'var(--text)' : 'var(--red)',
          letterSpacing: '-0.02em',
          lineHeight: 1,
          marginBottom: 18,
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

      {/* Rates footer */}
      <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 6 }}>
        {ratesError ? (
          <span style={{ color: 'var(--red)' }}>⚠ {ratesError}</span>
        ) : updatedAt ? (
          <>
            <span style={{ color: 'var(--gold)', opacity: .7 }}>●</span>
            Live FX · updated {updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </>
        ) : null}
      </div>
    </div>
  )
}

function AccountCard({ acc, onEdit, onDelete }) {
  const type    = ACCOUNT_TYPES.find(t => t.id === acc.type) || ACCOUNT_TYPES[0]
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      padding: '14px 16px',
      marginBottom: 10,
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      transition: 'border-color .2s',
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {/* Icon */}
      <div style={{
        width: 44, height: 44, borderRadius: 13, flexShrink: 0,
        background: type.isAsset ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20,
      }}>
        {type.icon}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          {acc.name}
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
            background: type.isAsset ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
            color: type.isAsset ? 'var(--green)' : 'var(--red)',
          }}>
            {type.label}
          </span>
        </div>
        {acc.bank && (
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{acc.bank}</div>
        )}
      </div>

      {/* Balance */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div className="blur-private" style={{
          fontSize: 16, fontWeight: 700,
          color: type.isAsset ? 'var(--text)' : 'var(--red)',
        }}>
          {type.isAsset ? '' : '−'}{formatCurrency(acc.balance, acc.currency)}
        </div>
        <div style={{ fontSize: 11, color: 'var(--gold)', marginTop: 2, fontWeight: 600 }}>
          {acc.currency}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
        <button
          onClick={() => onEdit(acc)}
          style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 14, padding: '2px 6px', borderRadius: 6 }}
          title="Edit"
        >✎</button>
        {confirmDelete ? (
          <button
            onClick={() => onDelete(acc.id)}
            style={{ background: 'rgba(248,113,113,0.15)', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 11, padding: '2px 6px', borderRadius: 6, fontWeight: 700 }}
          >✓</button>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            onBlur={() => setConfirmDelete(false)}
            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 14, padding: '2px 6px', borderRadius: 6 }}
            title="Delete"
          >✕</button>
        )}
      </div>
    </div>
  )
}

export default function Accounts({ uid }) {
  const { accounts, loading, addAccount, updateAccount, deleteAccount } = useAccounts(uid)
  const { toBase, baseCurrency, loading: ratesLoading, error: ratesError, updatedAt } = useExchangeRates()

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState(null)

  const byType = useMemo(() => {
    const assets      = accounts.filter(a => ACCOUNT_TYPES.find(t => t.id === a.type)?.isAsset !== false)
    const liabilities = accounts.filter(a => ACCOUNT_TYPES.find(t => t.id === a.type)?.isAsset === false)
    return { assets, liabilities }
  }, [accounts])

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
        accounts={accounts}
        toBase={toBase}
        baseCurrency={baseCurrency}
        ratesLoading={ratesLoading}
        ratesError={ratesError}
        updatedAt={updatedAt}
      />

      {loading ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
          Loading accounts…
        </div>
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
                {byType.assets.map(acc => (
                  <AccountCard key={acc.id} acc={acc} onEdit={openEdit} onDelete={deleteAccount} />
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
                {byType.liabilities.map(acc => (
                  <AccountCard key={acc.id} acc={acc} onEdit={openEdit} onDelete={deleteAccount} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* FAB */}
      <button
        className="fab"
        onClick={() => { setEditing(null); setShowForm(true) }}
        title="Add account"
      >
        +
      </button>

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
