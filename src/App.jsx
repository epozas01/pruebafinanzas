import { useState, lazy, Suspense } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useToast } from './components/Toast'
import Toast from './components/Toast'
import Dashboard from './components/Dashboard'
import Transactions from './components/Transactions'
import Budget from './components/Budget'
import TransactionForm from './components/TransactionForm'
import Auth from './components/Auth'
import Account from './components/Account'
import { getSession, saveSession } from './utils/auth'

const Analytics = lazy(() => import('./components/Analytics'))

const TABS = [
  { id: 'dashboard',    label: 'Home',    icon: '⌂' },
  { id: 'transactions', label: 'Ledger',  icon: '≡' },
  { id: 'budget',       label: 'Budget',  icon: '◎' },
  { id: 'analytics',    label: 'Charts',  icon: '▲' },
  { id: 'account',      label: 'Account', icon: '○' },
]

export default function App() {
  const [session, setSession]    = useState(() => getSession())
  const [tab, setTab]            = useState('dashboard')
  const [transactions, setTxs]   = useLocalStorage('pulse_transactions', [])
  const [showForm, setShowForm]  = useState(false)
  const [privacy, setPrivacy]    = useState(false)
  const [toast, showToast]       = useToast()

  // ── Auth ──────────────────────────────────────────────────────────────────
  if (!session) {
    return <Auth onLogin={s => setSession(s)} />
  }

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleSave(tx) {
    setTxs([...transactions, tx])
    showToast(`${tx.type === 'income' ? 'Income' : 'Expense'} saved ✓`)
  }

  function handleDelete(id) {
    setTxs(transactions.filter(t => t.id !== id))
    showToast('Transaction deleted')
  }

  function handleSessionUpdate(updated) {
    saveSession(updated)
    setSession(updated)
    showToast('Profile updated ✓')
  }

  function handleLogout() {
    setSession(null)
    setTab('dashboard')
  }

  const hideNav  = tab === 'account'
  const hideFab  = tab === 'account'

  return (
    <div className={`app-shell ${privacy ? 'private' : ''}`}>
      {/* Top bar — hidden on Account tab (it has its own header) */}
      {tab !== 'account' && (
        <div className="top-bar">
          <div className="brand">Pulse</div>
          <button className="privacy-btn" onClick={() => setPrivacy(p => !p)}>
            {privacy ? '👁 Show' : '🙈 Hide'}
          </button>
        </div>
      )}

      {/* Main content */}
      {tab === 'dashboard' && (
        <Dashboard
          transactions={transactions}
          onDelete={handleDelete}
          onShowAll={() => setTab('transactions')}
        />
      )}
      {tab === 'transactions' && (
        <Transactions transactions={transactions} onDelete={handleDelete} />
      )}
      {tab === 'budget' && (
        <Budget transactions={transactions} />
      )}
      {tab === 'analytics' && (
        <Suspense fallback={
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-dim)' }}>
            Loading charts…
          </div>
        }>
          <Analytics transactions={transactions} />
        </Suspense>
      )}
      {tab === 'account' && (
        <Account
          session={session}
          onLogout={handleLogout}
          onSessionUpdate={handleSessionUpdate}
        />
      )}

      {/* FAB — hidden on Account tab */}
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

      {/* Transaction form sheet */}
      {showForm && (
        <TransactionForm
          onSave={handleSave}
          onClose={() => setShowForm(false)}
        />
      )}

      <Toast msg={toast.msg} show={toast.show} />
    </div>
  )
}
