import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Navigation, MapPin, ShieldCheck, Fuel, Coffee, RotateCcw, Truck, Package } from 'lucide-react'
import { format } from 'date-fns'
import { fetchTimeline } from '@/api/trips'
import { useTripStore } from '@/stores/tripStore'
import { useUIStore } from '@/stores/uiStore'
import { Badge, eventTypeToBadgeVariant } from '@/components/ui/Badge'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { PanelHeaderControls } from '@/components/layout/PanelHeaderControls'
import type { ScheduleEvent, EventType } from '@/api/types'

const EVENT_CONFIG: Record<EventType, {
  color: string
  bg: string
  border: string
  label: string
  Icon: React.ElementType
}> = {
  PRE_TRIP:    { color: '#818CF8', bg: 'rgba(99,102,241,0.08)',  border: 'rgba(99,102,241,0.2)',  label: 'Pre-Trip Inspection', Icon: Navigation },
  DRIVE:       { color: '#60A5FA', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.2)',  label: 'Driving Segment',     Icon: Truck },
  REST_BREAK:  { color: '#FBBF24', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)',  label: '30-Min Rest Break',   Icon: Coffee },
  DAILY_RESET: { color: '#A78BFA', bg: 'rgba(139,92,246,0.08)',  border: 'rgba(139,92,246,0.2)',  label: '10-Hour Reset',       Icon: RotateCcw },
  RESTART_34H: { color: '#A78BFA', bg: 'rgba(139,92,246,0.08)',  border: 'rgba(139,92,246,0.2)',  label: '34-Hour Restart',     Icon: RotateCcw },
  FUEL_STOP:   { color: '#34D399', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)',  label: 'Fuel Stop',           Icon: Fuel },
  PICKUP:      { color: '#22D3EE', bg: 'rgba(6,182,212,0.08)',   border: 'rgba(6,182,212,0.2)',   label: 'Cargo Pickup',        Icon: Package },
  DROPOFF:     { color: '#FB923C', bg: 'rgba(249,115,22,0.08)',  border: 'rgba(249,115,22,0.2)',  label: 'Cargo Dropoff',       Icon: MapPin },
}

function formatDuration(event: ScheduleEvent): string {
  let seconds = event.duration_seconds
  if (typeof seconds !== 'number' || isNaN(seconds)) {
    if (event.start_time && event.end_time) {
      const diffMs = new Date(event.end_time).getTime() - new Date(event.start_time).getTime()
      seconds = Math.max(0, Math.floor(diffMs / 1000))
    } else {
      seconds = 0
    }
  }
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

// Group events by day
function groupByDay(events: ScheduleEvent[] = []) {
  const safeEvents = Array.isArray(events) ? events : []
  const groups: { date: string; events: ScheduleEvent[] }[] = []
  const seen: Record<string, number> = {}

  for (const event of safeEvents) {
    const dateObj = event.start_time ? new Date(event.start_time) : null
    const key = dateObj && !isNaN(dateObj.getTime())
      ? format(dateObj, 'yyyy-MM-dd')
      : 'unknown'
    const label = dateObj && !isNaN(dateObj.getTime())
      ? format(dateObj, 'EEE, MMM d')
      : 'Unknown Day'

    if (seen[key] === undefined) {
      seen[key] = groups.length
      groups.push({ date: label, events: [] })
    }
    groups[seen[key]].events.push(event)
  }
  return groups
}

function EventRow({
  event,
  isSelected,
  isExpanded,
  index,
  onClick,
}: {
  event: ScheduleEvent
  isSelected: boolean
  isExpanded: boolean
  index: number
  onClick: () => void
}) {
  const cfg = EVENT_CONFIG[event.event_type] || {
    color: '#60A5FA',
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.2)',
    label: event.event_type,
    Icon: Navigation,
  }
  const { Icon } = cfg
  const duration = formatDuration(event)
  const startObj = event.start_time ? new Date(event.start_time) : null
  const startTime = startObj && !isNaN(startObj.getTime()) ? format(startObj, 'HH:mm') : '—'
  const endObj = event.end_time ? new Date(event.end_time) : null
  const endTime = endObj && !isNaN(endObj.getTime()) ? format(endObj, 'HH:mm') : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: index * 0.025 }}
    >
      <button
        onClick={onClick}
        className="w-full text-left"
        aria-selected={isSelected}
        style={{
          display: 'block',
          borderRadius: 'var(--rw-radius-xl)',
          padding: '12px 14px',
          border: `1px solid ${isSelected ? cfg.color + '60' : 'var(--rw-border)'}`,
          background: isSelected ? cfg.bg : 'var(--rw-bg-elevated)',
          boxShadow: isSelected ? `0 0 0 1px ${cfg.color}30, inset 0 0 0 1px ${cfg.color}15` : 'none',
          cursor: 'pointer',
          transition: 'all var(--rw-t-normal)',
          marginBottom: '6px',
        }}
        onMouseEnter={e => {
          if (!isSelected) {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--rw-border-medium)'
            ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--rw-bg-hover)'
          }
        }}
        onMouseLeave={e => {
          if (!isSelected) {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--rw-border)'
            ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--rw-bg-elevated)'
          }
        }}
      >
        {/* Top Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Event type icon dot */}
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 'var(--rw-radius-md)',
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: cfg.color,
                flexShrink: 0,
              }}
            >
              <Icon size={13} strokeWidth={2.5} />
            </div>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--rw-text-primary)', lineHeight: 1.3 }}>
                {cfg.label}
              </p>
              {event.duty_status && (
                <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--rw-text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 1 }}>
                  {event.duty_status}
                </p>
              )}
            </div>
          </div>

          <span
            style={{
              fontFamily: 'var(--rw-font-mono)',
              fontSize: '12px',
              fontWeight: 700,
              color: cfg.color,
              letterSpacing: '-0.01em',
            }}
          >
            {duration}
          </span>
        </div>

        {/* Time + Distance Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 8,
            borderTop: '1px solid var(--rw-border-subtle)',
          }}
        >
          <span style={{ fontFamily: 'var(--rw-font-mono)', fontSize: '11px', color: 'var(--rw-text-tertiary)' }}>
            {startTime}{endTime ? ` – ${endTime}` : ''}
          </span>
          {event.distance_miles ? (
            <span style={{ fontFamily: 'var(--rw-font-mono)', fontSize: '11px', fontWeight: 600, color: 'var(--rw-text-secondary)' }}>
              {event.distance_miles.toFixed(0)} mi
            </span>
          ) : (
            <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--rw-fuel)' }}>
              Duty Event
            </span>
          )}
        </div>

        {/* Expanded Detail */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ overflow: 'hidden' }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                  paddingTop: 10,
                  marginTop: 8,
                  borderTop: '1px solid var(--rw-border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={12} style={{ color: 'var(--rw-compliant)', flexShrink: 0 }} />
                  <span style={{ fontSize: '11px', color: 'var(--rw-text-tertiary)' }}>HOS Pass</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Navigation size={12} style={{ color: 'var(--rw-accent-bright)', flexShrink: 0 }} />
                  <span style={{ fontSize: '11px', color: 'var(--rw-text-tertiary)' }}>
                    {event.duty_status ?? 'ON'}
                  </span>
                </div>
                {event.notes && (
                  <div style={{ gridColumn: 'span 2', fontSize: '11px', color: 'var(--rw-text-tertiary)', fontStyle: 'italic', lineHeight: 1.4 }}>
                    {event.notes}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </motion.div>
  )
}

export function TimelinePanel() {
  const { activeTrip, selectedEventId, setSelectedEvent } = useTripStore()
  const { panelMode } = useUIStore()

  const isCustomClientTrip = activeTrip?.id?.startsWith('trip-') || activeTrip?.id === 'demo-la-nyc-70h-cycle'

  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['timeline', activeTrip?.id],
    queryFn: () => fetchTimeline(activeTrip!.id),
    enabled: Boolean(activeTrip?.id) && !isCustomClientTrip,
    staleTime: 5 * 60 * 1000,
  })

  const rawEvents = eventsData ?? activeTrip?.events ?? []
  const displayEvents = Array.isArray(rawEvents) ? rawEvents : []
  const isExpanded = panelMode === 'expanded' || panelMode === 'fullscreen' || panelMode === 'popout'
  const groups = groupByDay(displayEvents)

  // Drive stats
  const totalDriveH = displayEvents
    .filter(e => e?.event_type === 'DRIVE')
    .reduce((s, e) => s + (e.duration_seconds ?? 0), 0) / 3600
  const stopCount = displayEvents.filter(e => e?.event_type !== 'DRIVE').length

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: 'transparent', color: 'var(--rw-text-primary)' }}
    >
      <PanelHeaderControls
        title="HOS Timeline"
        icon={<Clock size={16} />}
        badgeText={`${displayEvents.length} events`}
      />

      {/* Stats Strip */}
      {displayEvents.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            borderBottom: '1px solid var(--rw-border)',
            flexShrink: 0,
          }}
        >
          {[
            { label: 'Total Events', value: String(displayEvents.length), color: 'var(--rw-accent-bright)' },
            { label: 'Drive Time',   value: `${totalDriveH.toFixed(1)}h`,  color: 'var(--rw-drive)' },
            { label: 'HOS Stops',    value: String(stopCount),              color: 'var(--rw-rest)' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                padding: '10px 12px',
                textAlign: 'center',
                borderRight: '1px solid var(--rw-border)',
              }}
            >
              <p style={{ fontFamily: 'var(--rw-font-mono)', fontSize: '15px', fontWeight: 700, color, lineHeight: 1 }}>
                {value}
              </p>
              <p style={{ fontSize: '9px', fontWeight: 600, color: 'var(--rw-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Event List */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: '12px' }}
      >
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : displayEvents.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
              padding: '48px 24px',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--rw-radius-xl)',
                background: 'var(--rw-bg-elevated)',
                border: '1px solid var(--rw-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Clock size={20} style={{ color: 'var(--rw-text-tertiary)' }} />
            </div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--rw-text-secondary)', marginBottom: 6 }}>
              No timeline events
            </p>
            <p style={{ fontSize: '12px', color: 'var(--rw-text-tertiary)', lineHeight: 1.5 }}>
              Plan a trip to generate an HOS-compliant schedule
            </p>
          </div>
        ) : isExpanded ? (
          // Expanded: two-column with day groups
          <div>
            {groups.map((group, gi) => (
              <div key={gi} style={{ marginBottom: 20 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 10,
                    paddingBottom: 6,
                    borderBottom: '1px solid var(--rw-border)',
                    position: 'sticky',
                    top: 0,
                    background: 'var(--rw-bg-surface)',
                    zIndex: 1,
                    padding: '6px 0',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--rw-text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                    }}
                  >
                    {group.date}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontFamily: 'var(--rw-font-mono)',
                      color: 'var(--rw-text-tertiary)',
                      background: 'var(--rw-bg-elevated)',
                      border: '1px solid var(--rw-border)',
                      borderRadius: 'var(--rw-radius-full)',
                      padding: '1px 7px',
                    }}
                  >
                    {group.events.length}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {group.events.map((event, idx) => (
                    <EventRow
                      key={event.id}
                      event={event}
                      isSelected={selectedEventId === event.id}
                      isExpanded={isExpanded}
                      index={idx}
                      onClick={() => setSelectedEvent(event.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Normal: single column with day groups
          <div>
            {groups.map((group, gi) => (
              <div key={gi} style={{ marginBottom: 20 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 8,
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    padding: '4px 0 8px',
                    background: 'var(--rw-bg-surface)',
                  }}
                >
                  <div style={{ flex: 1, height: '1px', background: 'var(--rw-border)' }} />
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: 'var(--rw-text-tertiary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      padding: '2px 8px',
                      background: 'var(--rw-bg-elevated)',
                      border: '1px solid var(--rw-border)',
                      borderRadius: 'var(--rw-radius-full)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {group.date}
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--rw-border)' }} />
                </div>
                {group.events.map((event, idx) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    isSelected={selectedEventId === event.id}
                    isExpanded={false}
                    index={idx}
                    onClick={() => setSelectedEvent(event.id)}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
