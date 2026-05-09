interface JKMarkProps {
  size?: number
  variant?: 'light' | 'dark'
  className?: string
}

// The JK·Garage wordmark — square stamp + logotype.
// variant='light' → bone on dark backgrounds (login)
// variant='dark'  → ink on light backgrounds (signup)
export function JKMark({ size = 24, variant = 'light', className }: JKMarkProps) {
  const color = variant === 'light' ? '#F2EFEA' : '#0B0D0E'

  return (
    <div className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      {/* Square stamp — text "JK" inside a bordered box */}
      <div
        className="shrink-0 flex items-center justify-center font-display font-bold"
        style={{
          width: 32,
          height: 32,
          border: `1.5px solid ${color}`,
          fontSize: 14,
          letterSpacing: '0.02em',
          color,
          lineHeight: 1,
        }}
        aria-hidden
      >
        JK
      </div>

      <span
        className="font-display font-bold uppercase leading-none"
        style={{ fontSize: size * 0.55, color, letterSpacing: '0.18em' }}
      >
        Jekotech
        <span style={{ opacity: 0.5, margin: '0 4px' }}>·</span>
        <span style={{ color: '#FF5A1F' }}>Garage</span>
      </span>
    </div>
  )
}
