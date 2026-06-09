import { useState, lazy, Suspense } from 'react'
import { useAuth } from './hooks/useAuth'
import { useTransactions } from './hooks/useTransactions'
import { useToast } from './components/Toast'
import Toast from './components/Toast'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import Transactions from './components/Transactions'
import Budget from './components/Budget'
import Accounts from './components/Accounts'
import Account from './components/Account'
import TransactionForm from './components/TransactionForm'

const Analytics = lazy(() => import('./components/Analytics'))

const TABS = [
  { id: 'dashboard',    label: 'Home',     icon: '⌂' },
  { id: 'accounts',     label: 'Accounts', icon: '🏦' },
  { id: 'transactions', label: 'Ledger',   icon: '≡'  },
  { id: 'budget',       label: 'Budget',   icon: '◎'  },
  { id: 'analytics',    label: 'Charts',   icon: '▲'  },
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
  const [tab, setTab]              = useState('dashboard')
  const [showForm, setShowForm]    = useState(false)
  const [showSettings, setSettings] = useState(false)
  const [privacy, setPrivacy]      = useState(false)
  const [toast, showToast]         = useToast()

  const { transactions, loading: txLoading, addTransaction, deleteTransaction } =
    useTransactions(user?.uid)

  if (user === undefined) return <LoadingScreen />
  if (user === null)      return <Auth />

  const hideNav = false
  const hideFab = tab === 'accounts' // accounts tab has its own FAB

  async function handleSave(tx) {
    await addTransaction(tx)
    showToast(`${tx.type === 'income' ? 'Income' : 'Expense'} saved ✓`)
  }

  async function handleDelete(id) {
    await deleteTransaction(id)
    showToast('Transaction deleted')
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
          {/* Avatar → opens settings sheet */}
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
          : <Dashboard transactions={transactions} onDelete={handleDelete} onShowAll={() => setTab('transactions')} />
      )}
      {tab === 'accounts' && <Accounts uid={user.uid} />}
      {tab === 'transactions' && (
        txLoading
          ? <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>Loading…</div>
          : <Transactions transactions={transactions} onDelete={handleDelete} />
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
            : <Analytics transactions={transactions} />
          }
        </Suspense>
      )}

      {/* FAB — only on tabs that need it */}
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

      {/* Add transaction sheet */}
      {showForm && (
        <TransactionForm onSave={handleSave} onClose={() => setShowForm(false)} />
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
