import { clsx } from 'clsx'
import type { EventType, TripStatus, DutyStatus } from '@/api/types'

type BadgeVariant = 'driving' | 'rest' | 'fuel' | 'pickup' | 'dropoff' | 'pretrip' | 'reset' | 'compliant' | 'violation' | 'warning' | 'planned' | 'active' | 'completed' | 'cancelled' | 'default'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
  dot?: boolean
}

const variantMap: Record<BadgeVariant, string> = {
  driving:   'bg-[--color-driving-bg]   text-[--color-driving]   border-[--color-driving]/20',
  rest:      'bg-[--color-rest-break-bg] text-[--color-rest-break] border-[--color-rest-break]/20',
  fuel:      'bg-[--color-fuel-bg]      text-[--color-fuel]      border-[--color-fuel]/20',
  pickup:    'bg-[--color-pickup-bg]    text-[--color-pickup]    border-[--color-pickup]/20',
  dropoff:   'bg-[--color-dropoff-bg]   text-[--color-dropoff]   border-[--color-dropoff]/20',
  pretrip:   'bg-[--color-pretrip-bg]  text-[--color-pretrip]  border-[--color-pretrip]/20',
  reset:     'bg-[--color-daily-reset-bg] text-[--color-daily-reset] border-[--color-daily-reset]/20',
  compliant: 'bg-[--color-compliant-bg] text-[--color-compliant] border-[--color-compliant]/20',
  violation: 'bg-[--color-violation-bg] text-[--color-violation] border-[--color-violation]/20',
  warning:   'bg-[--color-warning-bg]   text-[--color-warning]   border-[--color-warning]/20',
  planned:   'bg-[--color-accent-subtle] text-[--color-accent]   border-[--color-accent]/20',
  active:    'bg-[--color-compliant-bg] text-[--color-compliant] border-[--color-compliant]/20',
  completed: 'bg-[--color-bg-elevated]  text-[--color-text-secondary] border-[--color-border]',
  cancelled: 'bg-[--color-violation-bg] text-[--color-violation] border-[--color-violation]/20',
  default:   'bg-[--color-bg-elevated]  text-[--color-text-secondary] border-[--color-border]',
}

export const eventTypeToBadgeVariant = (eventType: EventType): BadgeVariant => {
  const map: Record<EventType, BadgeVariant> = {
    PRE_TRIP:    'pretrip',
    DRIVE:       'driving',
    REST_BREAK:  'rest',
    DAILY_RESET: 'reset',
    RESTART_34H: 'reset',
    FUEL_STOP:   'fuel',
    PICKUP:      'pickup',
    DROPOFF:     'dropoff',
  }
  return map[eventType] ?? 'default'
}

export const statusToBadgeVariant = (status: TripStatus): BadgeVariant => {
  const map: Record<TripStatus, BadgeVariant> = {
    PLANNED:   'planned',
    ACTIVE:    'active',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  }
  return map[status]
}

export function Badge({ variant = 'default', children, className, dot }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-[--radius-sm] border',
        variantMap[variant],
        className
      )}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" aria-hidden="true" />
      )}
      {children}
    </span>
  )
}
