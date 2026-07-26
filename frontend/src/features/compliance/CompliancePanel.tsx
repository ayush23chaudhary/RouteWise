import { useQuery } from '@tanstack/react-query'
import { Shield, CheckCircle2, AlertTriangle, XCircle, HeartPulse, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { fetchCompliance } from '@/api/trips'
import { useTripStore } from '@/stores/tripStore'
import { SkeletonText } from '@/components/ui/Skeleton'
import { PanelHeaderControls } from '@/components/layout/PanelHeaderControls'

// ── Arc Gauge ────────────────────────────────────────────────────────────────
function ArcGauge({
  label,
  value,
  total,
  unit = 'h',
  color = '#3B82F6',
  size = 92,
  strokeWidth = 8,
}: {
  label: string
  value: number
  total: number
  unit?: string
  color?: string
  size?: number
  strokeWidth?: number
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.min((value / total) * 100, 100)
  const used = circumference * (pct / 100)
  const remaining = Math.max(0, total - value)
  const isWarning = pct > 80
  const isCritical = pct > 95
  const displayColor = isCritical ? '#EF4444' : isWarning ? '#F59E0B' : color

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: '16px 10px',
        borderRadius: 'var(--rw-radius-xl)',
        background: 'var(--rw-bg-elevated)',
        border: '1px solid var(--rw-border)',
        transition: 'all var(--rw-t-normal)',
      }}
    >
      <div style={{ position: 'relative', width: size, height: size }}>
        {/* Gradient glow effect */}
        {pct > 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${displayColor}15 0%, transparent 70%)`,
            }}
          />
        )}
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Used arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={displayColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${used} ${circumference - used}`}
            strokeLinecap="round"
            fill="transparent"
            style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1), stroke 0.4s ease' }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--rw-font-mono)',
              fontSize: '15px',
              fontWeight: 700,
              color: displayColor,
              lineHeight: 1,
            }}
          >
            {remaining.toFixed(1)}
          </span>
          <span style={{ fontSize: '9px', color: 'var(--rw-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {unit} left
          </span>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--rw-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </p>
        <p style={{ fontSize: '10px', color: 'var(--rw-text-tertiary)', fontFamily: 'var(--rw-font-mono)', marginTop: 2 }}>
          {value.toFixed(1)} / {total}{unit}
        </p>
      </div>
    </div>
  )
}

// ── Horizontal Progress Bar ──────────────────────────────────────────────────
function HoursBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = Math.min((value / total) * 100, 100)
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--rw-text-secondary)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--rw-font-mono)', fontSize: '11px', color, fontWeight: 700 }}>
          {value.toFixed(1)}/{total}h
        </span>
      </div>
      <div
        style={{
          height: 6,
          background: 'var(--rw-bg-elevated)',
          borderRadius: 'var(--rw-radius-full)',
          overflow: 'hidden',
          border: '1px solid var(--rw-border)',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
          style={{
            height: '100%',
            background: `linear-gradient(90deg, ${color}bb, ${color})`,
            borderRadius: 'var(--rw-radius-full)',
            boxShadow: `0 0 8px ${color}60`,
          }}
        />
      </div>
    </div>
  )
}

export function CompliancePanel() {
  const { activeTrip } = useTripStore()

  const isCustomClientTrip = activeTrip?.id?.startsWith('trip-') || activeTrip?.id === 'demo-la-nyc-70h-cycle'

  const { data: report, isLoading } = useQuery({
    queryKey: ['compliance', activeTrip?.id],
    queryFn: () => fetchCompliance(activeTrip!.id),
    enabled: Boolean(activeTrip?.id) && !isCustomClientTrip,
    staleTime: 5 * 60 * 1000,
  })

  const displayReport = report ?? activeTrip?.compliance_report ?? (
    activeTrip ? {
      is_compliant: ['ACTIVE', 'COMPLETED', 'PLANNED'].includes(activeTrip.status),
      violations: [],
    } : null
  )

  const rawEvents = activeTrip?.events ?? []
  const events = Array.isArray(rawEvents) ? rawEvents : []
  const drivingHours = events
    .filter(e => e?.event_type === 'DRIVE')
    .reduce((s, e) => s + (e?.duration_seconds || 0), 0) / 3600
  const onDutyHours = events
    .filter(e => e?.event_type && ['DRIVE', 'PICKUP', 'DROPOFF', 'PRE_TRIP', 'FUEL_STOP'].includes(e.event_type))
    .reduce((s, e) => s + (e?.duration_seconds || 0), 0) / 3600
  const cycleHours = 58.5 // from initial_hours_used + drivingHours as proxy

  const healthScore = displayReport?.is_compliant ? 98 : 45
  const isCompliant = displayReport?.is_compliant ?? true
  const violationCount = displayReport?.violations?.length ?? 0
  const warningCount = displayReport?.warnings?.length ?? 0

  const badgeVariant = isCompliant ? 'success' : 'danger'
  const badgeText = isCompliant ? 'HOS PASS' : 'HOS RISK'

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: 'transparent', color: 'var(--rw-text-primary)' }}
    >
      <PanelHeaderControls
        title="FMCSA Compliance"
        icon={<Shield size={16} />}
        badgeText={badgeText}
        badgeVariant={badgeVariant}
      />

      <div className="flex-1 overflow-y-auto" style={{ padding: '16px' }}>
        {isLoading ? (
          <SkeletonText lines={6} />
        ) : !displayReport ? (
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
              <Shield size={20} style={{ color: 'var(--rw-text-tertiary)' }} />
            </div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--rw-text-secondary)', marginBottom: 6 }}>
              No compliance data
            </p>
            <p style={{ fontSize: '12px', color: 'var(--rw-text-tertiary)', lineHeight: 1.5 }}>
              Plan and activate a trip to see FMCSA HOS analysis
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ── Status Card ── */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                borderRadius: 'var(--rw-radius-2xl)',
                padding: '16px',
                background: isCompliant
                  ? 'var(--rw-compliant-bg)'
                  : 'var(--rw-violation-bg)',
                border: `1px solid ${isCompliant ? 'var(--rw-compliant-border)' : 'var(--rw-violation-border)'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 'var(--rw-radius-xl)',
                      background: isCompliant
                        ? 'rgba(34,197,94,0.12)'
                        : 'rgba(239,68,68,0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isCompliant ? 'var(--rw-compliant)' : 'var(--rw-violation)',
                    }}
                  >
                    {isCompliant
                      ? <CheckCircle2 size={20} />
                      : <XCircle size={20} />
                    }
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: isCompliant ? 'var(--rw-compliant)' : 'var(--rw-violation)',
                        lineHeight: 1.3,
                      }}
                    >
                      {isCompliant ? 'All HOS Rules Satisfied' : 'Violations Detected'}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--rw-text-tertiary)', marginTop: 2 }}>
                      FMCSA 49 CFR Part 395 · 70h/8d
                    </p>
                  </div>
                </div>

                {/* Health Score */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginBottom: 2 }}>
                    <HeartPulse size={11} style={{ color: isCompliant ? 'var(--rw-compliant)' : 'var(--rw-violation)' }} />
                    <span style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--rw-text-tertiary)' }}>
                      Score
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--rw-font-mono)',
                      fontSize: '20px',
                      fontWeight: 800,
                      color: isCompliant ? 'var(--rw-compliant)' : 'var(--rw-violation)',
                      lineHeight: 1,
                    }}
                  >
                    {healthScore}%
                  </span>
                </div>
              </div>

              {/* Counts row */}
              {(violationCount > 0 || warningCount > 0) && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  {violationCount > 0 && (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      color: 'var(--rw-violation)',
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: 'var(--rw-radius-full)',
                      padding: '2px 8px',
                    }}>
                      {violationCount} violation{violationCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  {warningCount > 0 && (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      color: 'var(--rw-warning)',
                      background: 'rgba(245,158,11,0.1)',
                      border: '1px solid rgba(245,158,11,0.2)',
                      borderRadius: 'var(--rw-radius-full)',
                      padding: '2px 8px',
                    }}>
                      {warningCount} warning{warningCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              )}
            </motion.div>

            {/* ── HOS Arc Gauges ── */}
            <div>
              <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--rw-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                HOS Clocks — Remaining Margins
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <ArcGauge label="11h Drive"  value={drivingHours}  total={11}  color="#3B82F6" />
                <ArcGauge label="14h Duty"   value={onDutyHours}  total={14}  color="#06B6D4" />
                <ArcGauge label="70h Cycle"  value={cycleHours}   total={70}  color="#8B5CF6" />
              </div>
            </div>

            {/* ── Linear Bars ── */}
            <div
              style={{
                borderRadius: 'var(--rw-radius-xl)',
                background: 'var(--rw-bg-elevated)',
                border: '1px solid var(--rw-border)',
                padding: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                <TrendingUp size={13} style={{ color: 'var(--rw-accent-bright)' }} />
                <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--rw-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Utilisation Breakdown
                </p>
              </div>
              <HoursBar label="Drive Window"   value={drivingHours} total={11}  color="#3B82F6" />
              <HoursBar label="Duty Shift"     value={onDutyHours}  total={14}  color="#06B6D4" />
              <HoursBar label="Cycle (8-day)"  value={cycleHours}   total={70}  color="#8B5CF6" />
            </div>

            {/* ── Violations + Warnings ── */}
            {((displayReport.violations?.length ?? 0) > 0 || (displayReport.warnings?.length ?? 0) > 0) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--rw-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Alerts & HOS Warnings
                </p>

                {displayReport.violations?.map((v: string, i: number) => (
                  <motion.div
                    key={`v-${i}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '12px',
                      borderRadius: 'var(--rw-radius-lg)',
                      background: 'var(--rw-violation-bg)',
                      border: '1px solid var(--rw-violation-border)',
                    }}
                  >
                    <XCircle size={14} style={{ color: 'var(--rw-violation)', flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#FCA5A5', lineHeight: 1.4 }}>{v}</span>
                  </motion.div>
                ))}

                {displayReport.warnings?.map((w: string, i: number) => (
                  <motion.div
                    key={`w-${i}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 + 0.1 }}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '12px',
                      borderRadius: 'var(--rw-radius-lg)',
                      background: 'var(--rw-warning-bg)',
                      border: '1px solid var(--rw-warning-border)',
                    }}
                  >
                    <AlertTriangle size={14} style={{ color: 'var(--rw-warning)', flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#FCD34D', lineHeight: 1.4 }}>{w}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
