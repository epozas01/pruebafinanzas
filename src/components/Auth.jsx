import { useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from 'firebase/auth'
import { auth } from '../firebase'

const googleProvider = new GoogleAuthProvider()

const ERROR_MAP = {
  'auth/email-already-in-use':   'That email is already registered. Try signing in.',
  'auth/user-not-found':         'No account found with that email.',
  'auth/wrong-password':         'Incorrect password.',
  'auth/invalid-credential':     'Incorrect email or password.',
  'auth/invalid-email':          'Please enter a valid email address.',
  'auth/weak-password':          'Password must be at least 6 characters.',
  'auth/network-request-failed': 'Network error — check your connection.',
  'auth/too-many-requests':      'Too many attempts. Please try again later.',
  'auth/operation-not-allowed':  'Google sign-in is not enabled. Go to Firebase Console → Authentication → Sign-in method → Google → Enable.',
  'auth/unauthorized-domain':    'This domain is not authorized. Go to Firebase Console → Authentication → Settings → Authorized domains and add this site\'s URL.',
  'auth/popup-blocked':          'Popup was blocked by your browser. Please allow popups for this site and try again.',
  'auth/cancelled-popup-request':'Sign-in cancelled.',
}

function friendlyError(code) {
  return ERROR_MAP[code] || `Sign-in failed (${code}). Check Firebase Console → Authentication.`
}

export default function Auth() {
  const [mode, setMode]       = useState('login')
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [password, setPass]   = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading]       = useState(false)
  const [googleLoading, setGLoading] = useState(false)

  async function handleGoogle() {
    setError('')
    setGLoading(true)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(friendlyError(err.code))
      }
    } finally {
      setGLoading(false)
    }
  }

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

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading || loading}
          style={{
            width: '100%',
            padding: '13px 16px',
            background: '#fff',
            border: '1px solid #e2e2e2',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            fontSize: 14,
            fontWeight: 600,
            color: '#3c3c3c',
            cursor: 'pointer',
            marginBottom: 16,
            transition: 'box-shadow .2s',
          }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
        >
          {googleLoading ? (
            <span style={{ fontSize: 13, color: '#777' }}>Signing in…</span>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
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
