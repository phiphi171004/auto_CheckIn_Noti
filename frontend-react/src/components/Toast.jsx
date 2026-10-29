import { useEffect } from 'react'

export default function Toast({ message, tone = 'neutral', onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, tone === 'negative' ? 6000 : 4200)
    return () => clearTimeout(timer)
  }, [onDone, tone])

  return (
    <div
      className="toast"
      data-tone={tone}
      role={tone === 'negative' ? 'alert' : 'status'}
      aria-live={tone === 'negative' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <span className="toast-dot" aria-hidden="true" />
      <p className="toast-message">{message}</p>
    </div>
  )
}
