import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        maxWidth: 480,
        margin: '0 auto',
        gap: 16,
      }}>
        <div style={{
          fontFamily: 'var(--serif)',
          fontSize: 36,
          background: 'linear-gradient(135deg, #f4cf5f, #a08020)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Pulse
        </div>

        <div style={{
          background: 'rgba(248,113,113,0.08)',
          border: '1px solid rgba(248,113,113,0.25)',
          borderRadius: 14,
          padding: '20px 24px',
          width: '100%',
        }}>
          <div style={{ color: 'var(--red)', fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
            Something went wrong
          </div>
          <div style={{
            fontFamily: 'monospace',
            fontSize: 12,
            color: '#f87171aa',
            wordBreak: 'break-word',
            lineHeight: 1.6,
          }}>
            {error.message || String(error)}
          </div>
        </div>

        <div style={{ fontSize: 13, color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.7 }}>
          This is usually caused by Firestore not being set up.<br />
          Make sure you have created a <strong style={{ color: 'var(--gold)' }}>Firestore Database</strong> in your Firebase Console and that the rules allow reads/writes.
        </div>

        <button
          onClick={() => window.location.reload()}
          style={{
            background: 'var(--gold-soft)',
            border: '1px solid var(--border-strong)',
            color: 'var(--gold)',
            borderRadius: 10,
            padding: '10px 24px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Reload
        </button>
      </div>
    )
  }
}
