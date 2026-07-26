import { forwardRef } from 'react'
import { clsx } from 'clsx'

interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
  'aria-label'?: string
}

export function Skeleton({ className, style, 'aria-label': ariaLabel }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label={ariaLabel ?? 'Loading...'}
      style={style}
      className={clsx('animate-pulse rounded-[--radius-md] bg-[--color-bg-elevated]', className)}
    />
  )
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={clsx('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-3" style={{ width: i === lines - 1 ? '65%' : '100%' }} />
      ))}
    </div>
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={clsx('p-4 border border-[--color-border] rounded-[--radius-lg] bg-[--color-bg-surface] space-y-3', className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-[--radius-md]" />
        <Skeleton className="h-4 w-32" />
      </div>
      <SkeletonText lines={2} />
    </div>
  )
}
