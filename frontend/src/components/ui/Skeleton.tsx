interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
  'aria-label'?: string
}

const SHIMMER_STYLE: React.CSSProperties = {
  background: 'linear-gradient(90deg, var(--rw-bg-elevated) 25%, var(--rw-bg-hover) 50%, var(--rw-bg-elevated) 75%)',
  backgroundSize: '200% 100%',
  animation: 'rw-skeleton-shimmer 1.4s ease-in-out infinite',
}

export function Skeleton({ className, style, 'aria-label': ariaLabel }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label={ariaLabel ?? 'Loading…'}
      className={className}
      style={{
        borderRadius: 'var(--rw-radius-md)',
        ...SHIMMER_STYLE,
        ...style,
      }}
    />
  )
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div
      className={className}
      style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          style={{
            height: 12,
            width: i === lines - 1 ? '60%' : '100%',
            borderRadius: 'var(--rw-radius-sm)',
          }}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={className}
      style={{
        padding: 14,
        border: '1px solid var(--rw-border)',
        borderRadius: 'var(--rw-radius-xl)',
        background: 'var(--rw-bg-elevated)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Skeleton style={{ width: 32, height: 32, borderRadius: 'var(--rw-radius-lg)' }} />
        <Skeleton style={{ height: 14, width: 120 }} />
      </div>
      <SkeletonText lines={2} />
    </div>
  )
}
