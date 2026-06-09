import { useState } from 'react'
import {
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signOut,
  deleteUser,
} from 'firebase/auth'
import {
  collection, getDocs, deleteDoc, doc,
} from 'firebase/firestore'
import { auth, db } from '../firebase'
import { useLocalStorage } from '../hooks/useLocalStorage'

const CURRENCIES = [
  { code: 'USD', label: 'US Dollar ($)' },
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'GBP', label: 'British Pound (£)' },
  { code: 'JPY', label: 'Japanese Yen (¥)' },
  { code: 'CAD', label: 'Canadian Dollar (C$)' },
  { code: 'AUD', label: 'Australian Dollar (A$)' },
  { code: 'MXN', label: 'Mexican Peso (MX$)' },
  { code: 'BRL', label: 'Brazilian Real (R$)' },
  { code: 'COP', label: 'Colombian Peso (COP)' },
  { code: 'CLP', label: 'Chilean Peso (CLP)' },
]

function Section({ title, children }) {
  return (
    <div style={{ margin: '0 16px 16px' }}>
      <div style={{
        fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em',
        color: 'var(--gold)', fontWeight: 700, marginBottom: 10, paddingLeft: 4,
      }}>
        {title}
      </div>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)', overflow: 'hidden',
      }}>
        {children}
      </div>
    </div>
  )
}

function Row({ label, last, danger, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 16px', gap: 12,
      borderBottom: last ? 'none' : '1px solid var(--border)',
    }}>
      <span style={{ fontSize: 14, fontWeight: 500, color: danger ? 'var(--red)' : 'var(--text)', flexShrink: 0 }}>
        {label}
      </span>
      {children}
    </div>
  )
}

const inputStyle = {
  background: 'var(--bg-elev)', border: '1px solid var(--border)',
  borderRadius: 8, color: 'var(--text)', padding: '7px 12px',
  fontSize: 13, fontFamily: 'var(--sans)', outline: 'none',
  flex: 1, minWidth: 0,
}

const smallBtn = (color = 'var(--gold)') => ({
  background: 'transparent', border: `1px solid ${color}`, color,
  borderRadius: 8, padding: '6px 14px', fontSize: 12,
  fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
})

export default function Account({ user, onToast }) {
  const [currency, setCurrency] = useLocalStorage('pulse_currency', 'USD')

  // Name editing
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName]         = useState(user.displayName || '')

  // Password change
  const [changingPass, setChangingPass] = useState(false)
  const [oldPass, setOldPass]           = useState('')
  const [newPass, setNewPass]           = useState('')
  const [confirmPass, setConfirmPass]   = useState('')
  const [passError, setPassError]       = useState('')

  // Danger zone
  const [confirmClear, setConfirmClear]   = useState(false)
  const [clearing, setClearing]           = useState(false)

  async function saveName() {
    if (!newName.trim()) return
    await updateProfile(user, { displayName: newName.trim() })
    setEditingName(false)
    onToast('Name updated ✓')
  }

  async function changePassword(e) {
    e.preventDefault()
    setPassError('')
    try {
      const cred = EmailAuthProvider.credential(user.email, oldPass)
      await reauthenticateWithCredential(user, cred)
      if (newPass.length < 6) { setPassError('New password must be at least 6 characters.'); return }
      if (newPass !== confirmPass) { setPassError('New passwords do not match.'); return }
      await updatePassword(user, newPass)
      setOldPass(''); setNewPass(''); setConfirmPass('')
      setChangingPass(false)
      onToast('Password updated ✓')
    } catch (err) {
      setPassError(
        err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
          ? 'Current password is incorrect.'
          : 'Something went wrong. Please try again.',
      )
    }
  }

  async function clearAllData() {
    setClearing(true)
    try {
      const txSnap = await getDocs(collection(db, `users/${user.uid}/transactions`))
      await Promise.all(txSnap.docs.map(d => deleteDoc(d.ref)))
      await deleteDoc(doc(db, `users/${user.uid}/settings/budget`))
      setConfirmClear(false)
      onToast('All data cleared')
    } finally {
      setClearing(false)
    }
  }

  const initials = (user.displayName || user.email || '?').charAt(0).toUpperCase()

  return (
    <>
      {/* Header */}
      <div style={{ padding: '28px 20px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 58, height: 58, borderRadius: '50%',
          background: 'linear-gradient(135deg, #f4cf5f, #a08020)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, fontWeight: 700, color: '#0a0a0a', flexShrink: 0,
        }}>
          {initials}
        </div>
        <div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 600 }}>
            {user.displayName || 'Welcome'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 2 }}>{user.email}</div>
        </div>
      </div>

      {/* Profile */}
      <Section title="Profile">
        <Row label="Display Name">
          {editingName ? (
            <div style={{ display: 'flex', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
              <input
                style={inputStyle}
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
                autoFocus
              />
              <button style={smallBtn()} onClick={saveName}>Save</button>
              <button style={smallBtn('var(--text-dim)')} onClick={() => setEditingName(false)}>✕</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 14, color: 'var(--text-mid)' }}>{user.displayName || '—'}</span>
              <button style={smallBtn()} onClick={() => { setNewName(user.displayName || ''); setEditingName(true) }}>Edit</button>
            </div>
          )}
        </Row>
        <Row label="Email" last>
          <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>{user.email}</span>
        </Row>
      </Section>

      {/* Preferences */}
      <Section title="Preferences">
        <Row label="Currency" last>
          <select
            value={currency}
            onChange={e => { setCurrency(e.target.value); onToast('Currency updated ✓') }}
            style={{
              ...inputStyle, flex: 'none', width: 'auto', paddingRight: 32,
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23d4af37' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")",
              backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
              appearance: 'none', cursor: 'pointer',
            }}
          >
            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </Row>
      </Section>

      {/* Security */}
      <Section title="Security">
        {changingPass ? (
          <div style={{ padding: 16 }}>
            <form onSubmit={changePassword}>
              <div className="field" style={{ marginBottom: 12 }}>
                <label className="field-label">Current Password</label>
                <input type="password" value={oldPass} onChange={e => setOldPass(e.target.value)} autoFocus required />
              </div>
              <div className="field" style={{ marginBottom: 12 }}>
                <label className="field-label">New Password</label>
                <input type="password" placeholder="Min. 6 characters" value={newPass} onChange={e => setNewPass(e.target.value)} required />
              </div>
              <div className="field" style={{ marginBottom: 12 }}>
                <label className="field-label">Confirm New Password</label>
                <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} required />
              </div>
              {passError && (
                <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 12, textAlign: 'center' }}>{passError}</div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="save-btn" type="submit" style={{ flex: 1, padding: 12 }}>Update Password</button>
                <button type="button" onClick={() => { setChangingPass(false); setPassError('') }} style={{ ...smallBtn('var(--text-dim)'), padding: '12px 16px' }}>Cancel</button>
              </div>
            </form>
          </div>
        ) : (
          <Row label="Password" last>
            <button style={smallBtn()} onClick={() => setChangingPass(true)}>Change</button>
          </Row>
        )}
      </Section>

      {/* Danger zone */}
      <Section title="Danger Zone">
        <Row label="Clear All Transactions" danger>
          {confirmClear ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                style={{ ...smallBtn('var(--red)'), background: 'rgba(248,113,113,0.1)' }}
                onClick={clearAllData}
                disabled={clearing}
              >
                {clearing ? '…' : 'Yes, clear'}
              </button>
              <button style={smallBtn('var(--text-dim)')} onClick={() => setConfirmClear(false)}>Cancel</button>
            </div>
          ) : (
            <button style={smallBtn('var(--red)')} onClick={() => setConfirmClear(true)}>Clear</button>
          )}
        </Row>
        <Row label="Sign Out" last danger>
          <button style={smallBtn('var(--red)')} onClick={() => signOut(auth)}>
            Sign Out
          </button>
        </Row>
      </Section>

      <div style={{ padding: '8px 20px 0', textAlign: 'center', fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.05em' }}>
        Pulse · Synced with Firebase
      </div>
    </>
  )
}
