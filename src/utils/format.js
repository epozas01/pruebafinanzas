export function getCurrency() {
  try {
    const raw = localStorage.getItem('pulse_currency')
    return raw ? JSON.parse(raw) : 'USD'
  } catch { return 'USD' }
}

export function formatCurrency(n, currency) {
  const c = currency || getCurrency()
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: c,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

export function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatMonth(iso) {
  const d = new Date(iso + '-01')
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function isoMonth(date = new Date()) {
  return date.toISOString().slice(0, 7)
}

export function today() {
  return new Date().toISOString().slice(0, 10)
}
