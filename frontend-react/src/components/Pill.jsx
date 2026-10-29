const TONES = {
  neutral: '',
  positive: 'pos',
  negative: 'neg',
  warning: 'warn'
}

export default function Pill({ tone = 'neutral', children }) {
  const modifier = TONES[tone] || ''
  return <span className={`pill ${modifier}`.trim()}>{children}</span>
}
