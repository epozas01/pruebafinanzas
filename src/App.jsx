import { useState, lazy, Suspense } from 'react'
import { useAuth } from './hooks/useAuth'
import { useTransactions } from './hooks/useTransactions'
import { useToast } from './components/Toast'
import Toast from './components/Toast'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import Transactions from './components/Transactions'
import Budget from './components/Budget'
import Account from './components/Account'
import TransactionForm from './components/TransactionForm'

const Analytics = lazy(() => import('./components/Analytics'))

const TABS = [
  { id: 'dashboard',    label: 'Home',    icon: '⌂' },
  { id: 'transactions', label: 'Ledger',  icon: '≡' },
  { id: 'budget',       label: 'Budget',  icon: '◎' },
  { id: 'analytics',    label: 'Charts',  icon: '▲' },
  { id: 'account',      label: 'Account', icon: '○' },
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
        WebkitBackgroundClip: 'text', backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        Pulse
      </div>
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        border: '2px solid rgba(212,175,55,0.2)',
        borderTopColor: 'var(--gold)',
        animation: 'spin .8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default function App() {
  const user                     = useAuth()           // undefined=loading, null=signed out, obj=signed in
  const [tab, setTab]            = useState('dashboard')
  const [showForm, setShowForm]  = useState(false)
  const [privacy, setPrivacy]    = useState(false)
  const [toast, showToast]       = useToast()

  const { transactions, loading: txLoading, addTransaction, deleteTransaction } =
    useTransactions(user?.uid)

  // ── Loading auth state ────────────────────────────────────────────────────
  if (user === undefined) return <LoadingScreen />

  // ── Not signed in ─────────────────────────────────────────────────────────
  if (user === null) return <Auth />

  // ── Signed in ─────────────────────────────────────────────────────────────
  async function handleSave(tx) {
    await addTransaction(tx)
    showToast(`${tx.type === 'income' ? 'Income' : 'Expense'} saved ✓`)
  }

  async function handleDelete(id) {
    await deleteTransaction(id)
    showToast('Transaction deleted')
  }

  return (
    <div className={`app-shell ${privacy ? 'private' : ''}`}>
      {/* Top bar — hidden on Account tab */}
      {tab !== 'account' && (
        <div className="top-bar">
          <div className="brand">Pulse</div>
          <button className="privacy-btn" onClick={() => setPrivacy(p => !p)}>
            {privacy ? '👁 Show' : '🙈 Hide'}
          </button>
        </div>
      )}

      {/* Loading transactions skeleton */}
      {txLoading && tab !== 'account' && (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
          Loading your data…
        </div>
      )}

      {!txLoading && (
        <>
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
            <Budget transactions={transactions} uid={user.uid} />
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
        </>
      )}

      {tab === 'account' && (
        <Account user={user} onToast={showToast} />
      )}

      {/* FAB — hidden on Account tab */}
      {tab !== 'account' && (
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

      {showForm && (
        <TransactionForm onSave={handleSave} onClose={() => setShowForm(false)} />
      )}

      <Toast msg={toast.msg} show={toast.show} />
    </div>
  )
}
