import type { EventType, TripStatus } from '@/api/types'

type BadgeVariant =
  | 'driving' | 'rest' | 'fuel' | 'pickup' | 'dropoff'
  | 'pretrip' | 'reset' | 'compliant' | 'violation' | 'warning'
  | 'planned' | 'active' | 'completed' | 'cancelled' | 'default'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  dot?: boolean
}

const VARIANT_STYLES: Record<BadgeVariant, { color: string; bg: string; border: string }> = {
  driving:   { color: 'var(--rw-drive)',      bg: 'var(--rw-drive-bg)',      border: 'rgba(59,130,246,0.25)'  },
  rest:      { color: 'var(--rw-rest)',       bg: 'var(--rw-rest-bg)',       border: 'rgba(245,158,11,0.25)'  },
  fuel:      { color: 'var(--rw-fuel)',       bg: 'var(--rw-fuel-bg)',       border: 'rgba(16,185,129,0.25)'  },
  pickup:    { color: 'var(--rw-pickup)',     bg: 'var(--rw-pickup-bg)',     border: 'rgba(6,182,212,0.25)'   },
  dropoff:   { color: 'var(--rw-dropoff)',    bg: 'var(--rw-dropoff-bg)',    border: 'rgba(249,115,22,0.25)'  },
  pretrip:   { color: 'var(--rw-pretrip)',    bg: 'var(--rw-pretrip-bg)',    border: 'rgba(99,102,241,0.25)'  },
  reset:     { color: 'var(--rw-reset)',      bg: 'var(--rw-reset-bg)',      border: 'rgba(139,92,246,0.25)'  },
  compliant: { color: 'var(--rw-compliant)',  bg: 'var(--rw-compliant-bg)',  border: 'var(--rw-compliant-border)' },
  violation: { color: 'var(--rw-violation)',  bg: 'var(--rw-violation-bg)',  border: 'var(--rw-violation-border)' },
  warning:   { color: 'var(--rw-warning)',    bg: 'var(--rw-warning-bg)',    border: 'var(--rw-warning-border)'  },
  planned:   { color: 'var(--rw-accent)',     bg: 'var(--rw-accent-subtle)', border: 'var(--rw-accent-border)'   },
  active:    { color: 'var(--rw-compliant)',  bg: 'var(--rw-compliant-bg)',  border: 'var(--rw-compliant-border)' },
  completed: { color: 'var(--rw-text-secondary)', bg: 'var(--rw-bg-elevated)', border: 'var(--rw-border)' },
  cancelled: { color: 'var(--rw-violation)',  bg: 'var(--rw-violation-bg)',  border: 'var(--rw-violation-border)' },
  default:   { color: 'var(--rw-text-secondary)', bg: 'var(--rw-bg-elevated)', border: 'var(--rw-border)' },
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
  return map[status] ?? 'default'
}

export function Badge({ variant = 'default', children, className, style, dot }: BadgeProps) {
  const s = VARIANT_STYLES[variant]
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 8px',
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.04em',
        borderRadius: 'var(--rw-radius-full)',
        color: s.color,
        background: s.bg,
        border: `1px solid ${s.border}`,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {dot && (
        <span
          aria-hidden="true"
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'currentColor',
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  )
}
