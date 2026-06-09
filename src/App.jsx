import { useState, useRef, useEffect, lazy, Suspense } from 'react'
import { useAuth } from './hooks/useAuth'
import { useTransactions } from './hooks/useTransactions'
import { useAccounts } from './hooks/useAccounts'
import { useRecurring, nextOccurrence } from './hooks/useRecurring'
import { useToast } from './components/Toast'
import Toast from './components/Toast'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import Transactions from './components/Transactions'
import Budget from './components/Budget'
import Accounts from './components/Accounts'
import Account from './components/Account'
import TransactionForm from './components/TransactionForm'
import Recurring from './components/Recurring'

const Analytics  = lazy(() => import('./components/Analytics'))
const Portfolio  = lazy(() => import('./components/Portfolio'))

const TABS = [
  { id: 'dashboard',    label: 'Home',     icon: '⌂' },
  { id: 'accounts',     label: 'Accounts', icon: '🏦' },
  { id: 'transactions', label: 'Ledger',   icon: '≡'  },
  { id: 'budget',       label: 'Budget',   icon: '◎'  },
  { id: 'analytics',    label: 'Charts',   icon: '▲'  },
  { id: 'recurring',    label: 'Repeat',   icon: '↻'  },
  { id: 'portfolio',    label: 'Stocks',   icon: '📈' },
]

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
    }}>
      <div style={{
        fontFamily: 'var(--serif)', fontSize: 44, fontWeight: 700,
        background: 'linear-gradient(135deg, #f4cf5f 0%, #d4af37 50%, #a08020 100%)',
        WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>
        Pulse
      </div>
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        border: '2px solid rgba(212,175,55,0.2)', borderTopColor: 'var(--gold)',
        animation: 'spin .8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default function App() {
  const user  = useAuth()
  const [tab, setTab]               = useState('dashboard')
  const [showForm, setShowForm]     = useState(false)
  const [showSettings, setSettings] = useState(false)
  const [privacy, setPrivacy]       = useState(false)
  const [editingTx, setEditingTx]   = useState(null)
  const [toast, showToast]          = useToast()
  const autoPostedRef               = useRef(new Set())

  const { transactions, loading: txLoading, addTransaction, deleteTransaction, updateTransaction } =
    useTransactions(user?.uid)

  const { accounts } = useAccounts(user?.uid)

  const { recurring, addRecurring, updateRecurring, deleteRecurring } = useRecurring(user?.uid)

  // Auto-post due recurring transactions once per session
  useEffect(() => {
    if (!user?.uid || !recurring.length) return
    const todayStr = new Date().toISOString().slice(0, 10)
    recurring.forEach(async r => {
      if (!r.active || !r.nextDate || r.nextDate > todayStr) return
      if (autoPostedRef.current.has(r.id)) return
      autoPostedRef.current.add(r.id)
      await addTransaction({
        type: r.type, amount: r.amount,
        category: r.category || 'other',
        accountId: r.accountId || '',
        description: r.description || '',
        date: r.nextDate,
        notes: 'Auto-posted (recurring)',
      })
      let next = r.nextDate
      while (next <= todayStr) next = nextOccurrence(next, r.frequency)
      await updateRecurring(r.id, { nextDate: next })
      showToast(`Auto-posted: ${r.description || 'Recurring transaction'}`)
    })
  }, [user?.uid, recurring])

  if (user === undefined) return <LoadingScreen />
  if (user === null)      return <Auth />

  const hideFab = tab === 'accounts' || tab === 'recurring' || tab === 'portfolio'

  async function handleSave(tx) {
    if (editingTx) {
      await updateTransaction(editingTx.id, tx)
      showToast('Transaction updated ✓')
    } else {
      await addTransaction(tx)
      const label = tx.type === 'income' ? 'Income' : tx.type === 'transfer' ? 'Transfer' : 'Expense'
      showToast(`${label} saved ✓`)
    }
  }

  async function handleDelete(id) {
    await deleteTransaction(id)
    showToast('Transaction deleted')
  }

  function openEditTx(tx) {
    setEditingTx(tx)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingTx(null)
  }

  const initials = (user.displayName || user.email || '?').charAt(0).toUpperCase()

  return (
    <div className={`app-shell ${privacy ? 'private' : ''}`}>
      {/* Top bar */}
      <div className="top-bar">
        <div className="brand">Pulse</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="privacy-btn" onClick={() => setPrivacy(p => !p)}>
            {privacy ? '👁 Show' : '🙈 Hide'}
          </button>
          <button
            onClick={() => setSettings(true)}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, #f4cf5f, #a08020)',
              border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: 800, color: '#0a0a0a',
              flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title="Account settings"
          >
            {initials}
          </button>
        </div>
      </div>

      {/* Main content */}
      {tab === 'dashboard' && (
        txLoading
          ? <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>Loading…</div>
          : <Dashboard transactions={transactions} onDelete={handleDelete} onShowAll={() => setTab('transactions')} onEdit={openEditTx} />
      )}
      {tab === 'accounts' && <Accounts uid={user.uid} transactions={transactions} />}
      {tab === 'transactions' && (
        txLoading
          ? <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>Loading…</div>
          : <Transactions transactions={transactions} onDelete={handleDelete} onEdit={openEditTx} />
      )}
      {tab === 'budget' && (
        txLoading
          ? <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>Loading…</div>
          : <Budget transactions={transactions} uid={user.uid} />
      )}
      {tab === 'analytics' && (
        <Suspense fallback={<div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-dim)' }}>Loading charts…</div>}>
          {txLoading
            ? <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>Loading…</div>
            : <Analytics transactions={transactions} accounts={accounts} />
          }
        </Suspense>
      )}
      {tab === 'recurring' && <Recurring uid={user.uid} />}
      {tab === 'portfolio' && (
        <Suspense fallback={<div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-dim)' }}>Loading…</div>}>
          <Portfolio uid={user.uid} />
        </Suspense>
      )}

      {/* FAB */}
      {!hideFab && (
        <button className="fab" onClick={() => setShowForm(true)} title="Add transaction">+</button>
      )}

      {/* Bottom nav */}
      <nav className="bottom-nav">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`nav-item ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="nav-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {/* Transaction form (add + edit) */}
      {showForm && (
        <TransactionForm initial={editingTx} onSave={handleSave} onClose={closeForm} uid={user.uid} />
      )}

      {/* Account settings sheet */}
      {showSettings && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setSettings(false)}>
          <div className="sheet" style={{ maxHeight: '92vh', overflowY: 'auto' }}>
            <div className="sheet-handle" />
            <Account user={user} onToast={showToast} onClose={() => setSettings(false)} />
          </div>
        </div>
      )}

      <Toast msg={toast.msg} show={toast.show} />
    </div>
  )
}
