import { useEffect, useRef, useState, useCallback } from 'react'

export function useToast() {
  const [state, setState] = useState({ msg: '', show: false })
  const timer = useRef(null)

  const show = useCallback((msg) => {
    clearTimeout(timer.current)
    setState({ msg, show: true })
    timer.current = setTimeout(() => setState(s => ({ ...s, show: false })), 2800)
  }, [])

  return [state, show]
}

export default function Toast({ msg, show }) {
  return <div className={`toast ${show ? 'show' : ''}`}>{msg}</div>
}
