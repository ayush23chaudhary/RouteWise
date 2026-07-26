import { motion, AnimatePresence } from 'framer-motion'
import { Navigation, Clock, ShieldCheck, ShieldAlert, Truck, MapPin, Activity, Route } from 'lucide-react'
import { useTripStore } from '@/stores/tripStore'

function MetricPill({ icon, label, value, accent }: {
  icon: React.ReactNode
  label: string
  value: string
  accent?: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        padding: '8px 10px',
        borderRadius: 'var(--rw-radius-lg)',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
        flex: 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ color: accent || 'var(--rw-text-tertiary)', display: 'flex' }}>{icon}</span>
        <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--rw-text-tertiary)' }}>
          {label}
        </span>
      </div>
      <span
        style={{
          fontFamily: 'var(--rw-font-mono)',
          fontSize: '14px',
          fontWeight: 800,
          color: accent || 'var(--rw-text-primary)',
          letterSpacing: '-0.01em',
          lineHeight: 1.1,
        }}
      >
        {value}
      </span>
    </div>
  )
}

export function OperationalHUD() {
  const { activeTrip } = useTripStore()

  if (!activeTrip) return null

  const events = activeTrip.events ?? []
  const waypoints = activeTrip.waypoints ?? []
  const driveEvents = events.filter(e => e.event_type === 'DRIVE')

  const totalDistance = activeTrip.metrics?.total_distance_miles ?? 0
  const totalDurationHours = activeTrip.metrics?.total_duration_hours ?? 0

  const totalDrivingSeconds = events
    .filter(e => e.duty_status === 'D')
    .reduce((sum, e) => sum + (e.duration_seconds || 0), 0)
  const totalDutySeconds = events
    .filter(e => e.duty_status === 'D' || e.duty_status === 'ON')
    .reduce((sum, e) => sum + (e.duration_seconds || 0), 0)

  const driveLeft = Math.max(0, 11 - totalDrivingSeconds / 3600)
  const dutyLeft  = Math.max(0, 14 - totalDutySeconds  / 3600)

  const isCompliant = activeTrip.compliance_report?.is_compliant ?? true
  const nextStop = waypoints.find(w => w.waypoint_type === 'PICKUP' || w.waypoint_type === 'DROPOFF')
  const stopCount = events.filter(e => e.event_type !== 'DRIVE').length

  // Drive pct for mini progress bar
  const drivePct = Math.min(100, (totalDrivingSeconds / 3600 / 11) * 100)

  return (
    <AnimatePresence>
      <motion.div
        key="operational-hud"
        initial={{ opacity: 0, y: -16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="absolute top-4 left-4 z-20 pointer-events-auto"
        style={{ width: 288 }}
      >
        <div
          style={{
            background: 'rgba(6, 7, 9, 0.88)',
            backdropFilter: 'blur(24px) saturate(200%)',
            WebkitBackdropFilter: 'blur(24px) saturate(200%)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 'var(--rw-radius-2xl)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.5)',
            overflow: 'hidden',
          }}
        >
          {/* ── Header ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              background: 'rgba(59,130,246,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Live indicator */}
              <div style={{ position: 'relative', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    background: 'rgba(59,130,246,0.15)',
                    border: '1px solid rgba(59,130,246,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Truck size={13} style={{ color: '#60A5FA' }} />
                </div>
                <span
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#22C55E',
                    border: '1.5px solid rgba(6,7,9,0.9)',
                    boxShadow: '0 0 6px rgba(34,197,94,0.6)',
                  }}
                />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--rw-text-primary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Dispatch HUD
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--rw-font-mono)',
                      fontSize: '9px',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: 'var(--rw-radius-full)',
                      background: 'rgba(34,197,94,0.12)',
                      color: '#4ADE80',
                      border: '1px solid rgba(34,197,94,0.25)',
                      letterSpacing: '0.06em',
                    }}
                  >
                    LIVE
                  </span>
                </div>
                <p style={{ fontFamily: 'var(--rw-font-mono)', fontSize: '9px', color: 'var(--rw-text-tertiary)', marginTop: 1 }}>
                  ID: {activeTrip.id?.substring(0, 14)}
                </p>
              </div>
            </div>

            {/* Compliance badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 8px',
                borderRadius: 'var(--rw-radius-full)',
                background: isCompliant ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${isCompliant ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                color: isCompliant ? '#4ADE80' : '#F87171',
                fontSize: '10px',
                fontWeight: 700,
              }}
            >
              {isCompliant
                ? <ShieldCheck size={12} strokeWidth={2.5} />
                : <ShieldAlert size={12} strokeWidth={2.5} />
              }
              {isCompliant ? 'PASS' : 'RISK'}
            </div>
          </div>

          {/* ── Metrics Grid ── */}
          <div style={{ display: 'flex', gap: 6, padding: '10px 12px 6px' }}>
            <MetricPill
              icon={<Route size={10} />}
              label="Distance"
              value={`${totalDistance} mi`}
              accent="#60A5FA"
            />
            <MetricPill
              icon={<Clock size={10} />}
              label="Duration"
              value={`${totalDurationHours.toFixed(1)}h`}
              accent="#A78BFA"
            />
          </div>

          <div style={{ display: 'flex', gap: 6, padding: '0 12px 8px' }}>
            <MetricPill
              icon={<Activity size={10} />}
              label="Drive Rem."
              value={`${driveLeft.toFixed(1)}h`}
              accent={driveLeft < 2 ? '#F87171' : driveLeft < 4 ? '#FBBF24' : '#4ADE80'}
            />
            <MetricPill
              icon={<Navigation size={10} />}
              label="Duty Rem."
              value={`${dutyLeft.toFixed(1)}h`}
              accent={dutyLeft < 3 ? '#F87171' : dutyLeft < 6 ? '#FBBF24' : '#22D3EE'}
            />
          </div>

          {/* ── Drive time bar ── */}
          <div style={{ padding: '0 12px 8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--rw-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Drive window
              </span>
              <span style={{ fontFamily: 'var(--rw-font-mono)', fontSize: '9px', color: 'var(--rw-text-tertiary)' }}>
                {(totalDrivingSeconds / 3600).toFixed(1)} / 11h
              </span>
            </div>
            <div
              style={{
                height: 4,
                background: 'rgba(255,255,255,0.06)',
                borderRadius: 'var(--rw-radius-full)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${drivePct}%`,
                  borderRadius: 'var(--rw-radius-full)',
                  background: drivePct > 90 ? 'linear-gradient(90deg, #EF4444, #F87171)' :
                    drivePct > 70 ? 'linear-gradient(90deg, #F59E0B, #FBBF24)' :
                    'linear-gradient(90deg, #2563EB, #60A5FA)',
                  boxShadow: `0 0 6px ${drivePct > 90 ? 'rgba(239,68,68,0.5)' : 'rgba(59,130,246,0.4)'}`,
                  transition: 'width 0.8s ease',
                }}
              />
            </div>
          </div>

          {/* ── Footer ── */}
          <div
            style={{
              padding: '8px 12px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255,255,255,0.01)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <MapPin size={10} style={{ color: 'var(--rw-text-tertiary)' }} />
              <span style={{ fontSize: '10px', color: 'var(--rw-text-tertiary)' }}>
                {nextStop ? `Next: ${nextStop.waypoint_type}` : 'En Route'}
              </span>
            </div>
            <span style={{ fontFamily: 'var(--rw-font-mono)', fontSize: '10px', color: 'var(--rw-text-tertiary)' }}>
              {stopCount} stops
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
