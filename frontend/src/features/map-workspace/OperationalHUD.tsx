import { motion, AnimatePresence } from 'framer-motion'
import { Navigation, Clock, ShieldCheck, ShieldAlert, Truck, MapPin, Gauge } from 'lucide-react'
import { useTripStore } from '@/stores/tripStore'

export function OperationalHUD() {
  const { activeTrip } = useTripStore()

  if (!activeTrip) return null

  const events = activeTrip.events ?? []
  const waypoints = activeTrip.waypoints ?? []
  const driveEvents = events.filter(e => e.event_type === 'DRIVE')

  const totalDistance = activeTrip.metrics?.total_distance_miles ?? 0
  const totalDurationHours = activeTrip.metrics?.total_duration_hours ?? 0

  // Calculate driving vs duty hours used/remaining based on events
  const totalDrivingSeconds = events
    .filter(e => e.duty_status === 'D')
    .reduce((sum, e) => sum + (e.duration_seconds || 0), 0)

  const totalDutySeconds = events
    .filter(e => e.duty_status === 'D' || e.duty_status === 'ON')
    .reduce((sum, e) => sum + (e.duration_seconds || 0), 0)

  const drivingHoursLeft = Math.max(0, 11 - totalDrivingSeconds / 3600).toFixed(1)
  const dutyHoursLeft = Math.max(0, 14 - totalDutySeconds / 3600).toFixed(1)

  const isCompliant = activeTrip.compliance_report?.is_compliant ?? true
  const nextStop = waypoints.find(w => w.waypoint_type === 'PICKUP' || w.waypoint_type === 'DROPOFF')
  const currentSegment = driveEvents[0]?.notes ?? 'En Route (Commercial Interstate)'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="absolute top-5 left-5 z-20 pointer-events-auto"
      >
        <div className="w-80 bg-slate-950/85 backdrop-blur-2xl border border-slate-800/90 rounded-2xl p-4 shadow-2xl shadow-slate-950/80 text-slate-100 flex flex-col gap-3.5">
          {/* Header Row */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                <Truck size={16} />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold tracking-tight text-slate-100 uppercase">DISPATCH HUD</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 font-semibold border border-blue-500/30">
                    LIVE
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono truncate max-w-[170px]">
                  ID: {activeTrip.id}
                </p>
              </div>
            </div>

            {/* Compliance Badge */}
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                isCompliant
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-950/60 text-rose-400 border-rose-500/30'
              }`}
            >
              {isCompliant ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
              <span>{isCompliant ? 'HOS PASS' : 'HOS RISK'}</span>
            </div>
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-2.5 flex flex-col">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-1">
                <Navigation size={12} className="text-blue-400" />
                <span>REMAINING</span>
              </div>
              <span className="text-sm font-bold font-mono text-slate-100">
                {totalDistance} <span className="text-xs text-slate-400 font-sans font-normal">mi</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                EST: {totalDurationHours.toFixed(1)} hrs
              </span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-2.5 flex flex-col">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-1">
                <Clock size={12} className="text-amber-400" />
                <span>HOS DRIVE REM</span>
              </div>
              <span className="text-sm font-bold font-mono text-emerald-400">
                {drivingHoursLeft} <span className="text-xs text-slate-400 font-sans font-normal">hrs</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                DUTY: {dutyHoursLeft} hrs left
              </span>
            </div>
          </div>

          {/* Current Status Footer */}
          <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-2.5 flex flex-col gap-1 text-[11px]">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                <Gauge size={12} className="text-cyan-400" /> Current Segment:
              </span>
              <span className="font-semibold text-slate-200 truncate max-w-[120px] font-mono">
                {currentSegment.split(':')[0]}
              </span>
            </div>
            {nextStop && (
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                  <MapPin size={12} className="text-rose-400" /> Next Destination:
                </span>
                <span className="font-semibold text-slate-200 font-mono">
                  {nextStop.waypoint_type}
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
