import { useState } from 'react'
import { hashPassword, getAccount, saveAccount, saveSession } from '../utils/auth'

export default function Auth({ onLogin }) {
  const [mode, setMode]       = useState(getAccount() ? 'login' : 'register')
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [password, setPass]   = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'register') {
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
        if (password !== confirm) { setError('Passwords do not match.'); return }
        const existing = getAccount()
        if (existing) { setError('An account already exists. Please sign in.'); return }

        const passwordHash = await hashPassword(password)
        const account = { name: name.trim(), email: email.trim().toLowerCase(), passwordHash }
        saveAccount(account)
        saveSession({ name: account.name, email: account.email })
        onLogin({ name: account.name, email: account.email })

      } else {
        const account = getAccount()
        if (!account) { setError('No account found. Please create one.'); return }
        if (account.email !== email.trim().toLowerCase()) { setError('Incorrect email or password.'); return }

        const passwordHash = await hashPassword(password)
        if (account.passwordHash !== passwordHash) { setError('Incorrect email or password.'); return }

        saveSession({ name: account.name, email: account.email })
        onLogin({ name: account.name, email: account.email })
      }
    } finally {
      setLoading(false)
    }
  }

  const hasAccount = Boolean(getAccount())

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '40px 24px 60px',
      maxWidth: 520,
      margin: '0 auto',
    }}>
      {/* Brand */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          fontFamily: 'var(--serif)',
          fontSize: 48,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg, #f4cf5f 0%, #d4af37 50%, #a08020 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 8,
        }}>
          Pulse
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.3em' }}>
          Personal Finance
        </div>
      </div>

      {/* Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(212,175,55,0.04), transparent 60%), var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: 24,
      }}>
        {/* Mode tabs */}
        {!hasAccount ? null : (
          <div style={{
            display: 'flex',
            background: 'var(--bg-elev)',
            borderRadius: 12,
            padding: 4,
            marginBottom: 24,
            gap: 4,
          }}>
            {['login', 'register'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError('') }}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: mode === m ? 'var(--gold-soft)' : 'none',
                  border: mode === m ? '1px solid var(--border-strong)' : '1px solid transparent',
                  borderRadius: 8,
                  color: mode === m ? 'var(--gold)' : 'var(--text-mid)',
                  fontWeight: 700,
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  transition: 'all .2s',
                }}
              >
                {m === 'login' ? 'Sign In' : 'New Account'}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="field">
              <label className="field-label">Full Name</label>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
          )}

          <div className="field">
            <label className="field-label">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus={mode === 'login'}
            />
          </div>

          <div className="field">
            <label className="field-label">Password</label>
            <input
              type="password"
              placeholder={mode === 'register' ? 'Min. 6 characters' : '••••••••'}
              value={password}
              onChange={e => setPass(e.target.value)}
              required
            />
          </div>

          {mode === 'register' && (
            <div className="field">
              <label className="field-label">Confirm Password</label>
              <input
                type="password"
                placeholder="Repeat password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
              />
            </div>
          )}

          {error && (
            <div style={{
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.25)',
              color: 'var(--red)',
              padding: '10px 14px',
              borderRadius: 10,
              fontSize: 13,
              marginBottom: 16,
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          <button className="save-btn" type="submit" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Switch mode hint */}
        {!hasAccount && mode === 'register' && (
          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--text-dim)' }}>
            Your data stays on this device — nothing is sent to a server.
          </p>
        )}
      </div>
    </div>
  )
}
