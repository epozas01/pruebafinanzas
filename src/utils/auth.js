const SALT = 'pulse_v1'

export async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(SALT + password)
  const buf  = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export function getAccount() {
  try { return JSON.parse(localStorage.getItem('pulse_account')) || null }
  catch { return null }
}

export function getSession() {
  try { return JSON.parse(localStorage.getItem('pulse_session')) || null }
  catch { return null }
}

export function saveSession(session) {
  localStorage.setItem('pulse_session', JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem('pulse_session')
}

export function saveAccount(account) {
  localStorage.setItem('pulse_account', JSON.stringify(account))
}
