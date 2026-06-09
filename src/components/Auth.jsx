import { useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import { auth } from '../firebase'

const ERROR_MAP = {
  'auth/email-already-in-use':  'That email is already registered. Try signing in.',
  'auth/user-not-found':        'No account found with that email.',
  'auth/wrong-password':        'Incorrect password.',
  'auth/invalid-credential':    'Incorrect email or password.',
  'auth/invalid-email':         'Please enter a valid email address.',
  'auth/weak-password':         'Password must be at least 6 characters.',
  'auth/network-request-failed':'Network error — check your connection.',
  'auth/too-many-requests':     'Too many attempts. Please try again later.',
}

function friendlyError(code) {
  return ERROR_MAP[code] || 'Something went wrong. Please try again.'
}

export default function Auth() {
  const [mode, setMode]       = useState('login')
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [password, setPass]   = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (mode === 'register' && password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      if (mode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
        await updateProfile(cred.user, { displayName: name.trim() })
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password)
      }
      // onAuthStateChanged in App.jsx picks up the new user automatically
    } catch (err) {
      setError(friendlyError(err.code))
    } finally {
      setLoading(false)
    }
  }

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
          fontSize: 52,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg, #f4cf5f 0%, #d4af37 50%, #a08020 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 8,
          lineHeight: 1,
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
        <div style={{
          display: 'flex',
          background: 'var(--bg-elev)',
          borderRadius: 12,
          padding: 4,
          marginBottom: 24,
          gap: 4,
        }}>
          {[
            { id: 'login',    label: 'Sign In' },
            { id: 'register', label: 'Create Account' },
          ].map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => { setMode(m.id); setError('') }}
              style={{
                flex: 1,
                padding: '10px',
                background: mode === m.id ? 'var(--gold-soft)' : 'none',
                border: mode === m.id ? '1px solid var(--border-strong)' : '1px solid transparent',
                borderRadius: 8,
                color: mode === m.id ? 'var(--gold)' : 'var(--text-mid)',
                fontWeight: 700,
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                cursor: 'pointer',
                transition: 'all .2s',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

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
            {loading
              ? 'Please wait…'
              : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--text-dim)' }}>
          Your data syncs securely across all your devices.
        </p>
      </div>
    </div>
  )
}
