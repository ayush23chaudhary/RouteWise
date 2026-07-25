import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Clock, Navigation, MapPin, ShieldCheck, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { fetchTimeline } from '@/api/trips'
import { useTripStore } from '@/stores/tripStore'
import { useUIStore } from '@/stores/uiStore'
import { Badge, eventTypeToBadgeVariant } from '@/components/ui/Badge'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { PanelHeaderControls } from '@/components/layout/PanelHeaderControls'
import type { ScheduleEvent, EventType } from '@/api/types'

const EVENT_COLORS: Record<EventType, string> = {
  PRE_TRIP:    '#6366F1',
  DRIVE:       '#3B82F6',
  REST_BREAK:  '#F59E0B',
  DAILY_RESET: '#8B5CF6',
  RESTART_34H: '#8B5CF6',
  FUEL_STOP:   '#10B981',
  PICKUP:      '#06B6D4',
  DROPOFF:     '#F97316',
}

const EVENT_LABELS: Record<EventType, string> = {
  PRE_TRIP:    'Pre-Trip Inspection',
  DRIVE:       'Driving Leg',
  REST_BREAK:  '30-Min Mandatory Rest',
  DAILY_RESET: '10-Hour Daily Reset',
  RESTART_34H: '34-Hour Weekly Restart',
  FUEL_STOP:   'Fuel Stop',
  PICKUP:      'Pickup / Loading Hub',
  DROPOFF:     'Dropoff / Unloading Hub',
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

function EventRow({ event, isSelected, isExpanded, onClick }: {
  event: ScheduleEvent
  isSelected: boolean
  isExpanded: boolean
  onClick: () => void
}) {
  const color = EVENT_COLORS[event.event_type] || '#3B82F6'
  const label = EVENT_LABELS[event.event_type] || event.event_type
  const duration = formatDuration(event)
  const startObj = event.start_time ? new Date(event.start_time) : null
  const startTime = (startObj && !isNaN(startObj.getTime())) ? format(startObj, 'MMM d, HH:mm') : '—'

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.01, x: 2 }}
      className={`group relative flex flex-col gap-2 p-3.5 rounded-2xl border cursor-pointer transition-all ${
        isSelected
          ? 'bg-slate-900 border-blue-500/80 shadow-xl shadow-blue-500/10'
          : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs font-bold text-slate-100">{label}</span>
          <Badge variant={eventTypeToBadgeVariant(event.event_type)}>
            {event.duty_status || 'ON'}
          </Badge>
        </div>
        <span className="text-xs font-bold font-mono text-blue-400">{duration}</span>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800/50">
        <span>{startTime}</span>
        {event.distance_miles ? (
          <span className="text-slate-300 font-semibold">{event.distance_miles.toFixed(0)} mi</span>
        ) : (
          <span className="text-emerald-400 font-medium">Duty Event</span>
        )}
      </div>

      {isExpanded && (
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-300 font-mono">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Navigation size={13} className="text-blue-400" />
            <span>Duty Status: <strong className="text-slate-200">{event.duty_status}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>HOS Pass</span>
          </div>
          {event.notes && (
            <div className="col-span-2 text-[10px] text-slate-400 font-sans italic pt-1">
              "{event.notes}"
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}

export function TimelinePanel() {
  const { activeTrip, selectedEventId, setSelectedEvent } = useTripStore()
  const { panelMode } = useUIStore()

  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['timeline', activeTrip?.id],
    queryFn: () => fetchTimeline(activeTrip!.id),
    enabled: Boolean(activeTrip?.id) && activeTrip?.id !== 'demo-la-nyc-70h-cycle',
    staleTime: 5 * 60 * 1000,
  })

  const displayEvents = eventsData ?? activeTrip?.events ?? []
  const isExpanded = panelMode === 'expanded' || panelMode === 'fullscreen' || panelMode === 'popout'

  return (
    <div className="flex flex-col h-full bg-slate-950/95 backdrop-blur-xl text-slate-100">
      <PanelHeaderControls
        title="HOS Operational Timeline"
        icon={<Clock size={18} />}
        badgeText={`${displayEvents.length} Events`}
      />

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="space-y-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
        ) : displayEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
            <Clock size={36} className="text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-400">No active timeline events</p>
          </div>
        ) : (
          <div className={`grid gap-3 ${isExpanded ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {displayEvents.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                isSelected={selectedEventId === event.id}
                isExpanded={isExpanded}
                onClick={() => setSelectedEvent(event.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
