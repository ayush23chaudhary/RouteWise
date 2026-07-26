import { useQuery } from '@tanstack/react-query'
import { FileText, ChevronLeft, ChevronRight, Printer } from 'lucide-react'
import { useState } from 'react'
import { format } from 'date-fns'
import { fetchLogs } from '@/api/trips'
import { useTripStore } from '@/stores/tripStore'
import { SkeletonText } from '@/components/ui/Skeleton'
import type { DailyLog, DutyStatus } from '@/api/types'
import { PanelHeaderControls } from '@/components/layout/PanelHeaderControls'

const DUTY_ROW: Record<DutyStatus, number> = { OFF: 0, SB: 1, D: 2, ON: 3 }

const DUTY_STYLES: Record<DutyStatus, { color: string; label: string; trackColor: string }> = {
  OFF: { color: '#64748B', label: 'Off Duty',        trackColor: 'rgba(100,116,139,0.15)' },
  SB:  { color: '#A78BFA', label: 'Sleeper Berth',   trackColor: 'rgba(167,139,250,0.12)' },
  D:   { color: '#60A5FA', label: 'Driving',          trackColor: 'rgba(96,165,250,0.12)'  },
  ON:  { color: '#22D3EE', label: 'On Duty (Not D.)', trackColor: 'rgba(34,211,238,0.12)'  },
}

const DUTY_LABELS: DutyStatus[] = ['OFF', 'SB', 'D', 'ON']

function EldGrid({ intervals = [] }: { intervals?: DutyStatus[] }) {
  const SVG_W = 340
  const SVG_H = 92
  const LEFT  = 32
  const TOP   = 6
  const GRID_W = SVG_W - LEFT - 6
  const ROW_H  = (SVG_H - TOP - 14) / 4
  const CELL_W = GRID_W / 96
  const HOUR_W = GRID_W / 24

  const safeIntervals: DutyStatus[] =
    intervals.length === 96 ? intervals : Array(96).fill('OFF' as DutyStatus)

  // Build fill rects
  const rects: { x: number; w: number; status: DutyStatus }[] = []
  let prevStatus = safeIntervals[0]
  let startIdx = 0
  for (let i = 1; i <= safeIntervals.length; i++) {
    if (i === safeIntervals.length || safeIntervals[i] !== prevStatus) {
      rects.push({ x: startIdx * CELL_W, w: (i - startIdx) * CELL_W, status: prevStatus })
      if (i < safeIntervals.length) { prevStatus = safeIntervals[i]; startIdx = i }
    }
  }

  // Stepped ELD path
  let pathD = ''
  safeIntervals.forEach((status, idx) => {
    const x1 = LEFT + idx * CELL_W
    const x2 = LEFT + (idx + 1) * CELL_W
    const y = TOP + DUTY_ROW[status] * ROW_H + ROW_H / 2
    if (idx === 0) {
      pathD += `M ${x1} ${y} L ${x2} ${y}`
    } else {
      const prevDuty = safeIntervals[idx - 1]
      const prevY = TOP + DUTY_ROW[prevDuty] * ROW_H + ROW_H / 2
      pathD += prevY !== y ? ` L ${x1} ${y} L ${x2} ${y}` : ` L ${x2} ${y}`
    }
  })

  return (
    <div
      style={{ padding: '12px 10px 6px', background: 'var(--rw-bg-void)', borderRadius: 'var(--rw-radius-lg)', margin: '0' }}
      aria-label="ELD 24-hour duty grid"
      role="img"
    >
      <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ overflow: 'visible', display: 'block' }}>
        {/* Horizontal grid lines */}
        {[0, 1, 2, 3, 4].map(i => (
          <line
            key={`h-${i}`}
            x1={LEFT} y1={TOP + i * ROW_H}
            x2={LEFT + GRID_W} y2={TOP + i * ROW_H}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={i === 0 || i === 4 ? 0.8 : 0.4}
          />
        ))}

        {/* Hour vertical marks */}
        {Array.from({ length: 25 }).map((_, h) => (
          <g key={h}>
            <line
              x1={LEFT + h * HOUR_W} y1={TOP}
              x2={LEFT + h * HOUR_W} y2={TOP + 4 * ROW_H}
              stroke={h % 6 === 0 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)'}
              strokeWidth={h % 6 === 0 ? 0.8 : 0.35}
            />
            {h % 6 === 0 && (
              <text
                x={LEFT + h * HOUR_W}
                y={TOP + 4 * ROW_H + 12}
                textAnchor="middle"
                fontSize={8}
                fill="rgba(255,255,255,0.3)"
                fontFamily="JetBrains Mono, monospace"
              >
                {String(h).padStart(2, '0')}
              </text>
            )}
          </g>
        ))}

        {/* Row labels */}
        {DUTY_LABELS.map((d, i) => (
          <text
            key={d}
            x={LEFT - 4}
            y={TOP + i * ROW_H + ROW_H / 2 + 3.5}
            textAnchor="end"
            fontSize={8}
            fill={DUTY_STYLES[d].color}
            fontWeight={700}
            fontFamily="JetBrains Mono, monospace"
          >
            {d}
          </text>
        ))}

        {/* Colored fill blocks */}
        {rects.map(({ x, w, status }, i) => (
          <rect
            key={i}
            x={LEFT + x}
            y={TOP + DUTY_ROW[status] * ROW_H + 1.5}
            width={w}
            height={ROW_H - 3}
            fill={DUTY_STYLES[status].color}
            opacity={0.25}
            rx={1.5}
          />
        ))}

        {/* ELD stepped duty line */}
        <path
          d={pathD}
          fill="none"
          stroke="#60A5FA"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: 'drop-shadow(0 0 3px rgba(96,165,250,0.5))' }}
        />
      </svg>
    </div>
  )
}

function formatSeconds(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return `${h}h ${m.toString().padStart(2, '0')}m`
}

function LogCard({ log }: { log: any }) {
  const dateStr = log.log_date || log.date || new Date().toISOString()
  const dateObj = new Date(dateStr)
  const formattedDate = isNaN(dateObj.getTime()) ? 'Daily Log' : format(dateObj, 'EEEE, MMMM d, yyyy')
  const dayOfWeek = isNaN(dateObj.getTime()) ? '' : format(dateObj, 'EEE')

  const offDutySec = log.off_duty_seconds     ?? ((log.duty_hours?.OFF ?? 0) * 3600)
  const sleeperSec = log.sleeper_berth_seconds ?? ((log.duty_hours?.SB  ?? 0) * 3600)
  const drivingSec = log.driving_seconds        ?? ((log.duty_hours?.D   ?? 0) * 3600)
  const onDutySec  = log.on_duty_seconds        ?? ((log.duty_hours?.ON  ?? 0) * 3600)
  const totalSec   = offDutySec + sleeperSec + drivingSec + onDutySec
  const drivingPct = totalSec > 0 ? Math.round((drivingSec / 86400) * 100) : 0

  const summaryItems = [
    { key: 'OFF', label: 'OFF',  value: offDutySec, color: DUTY_STYLES.OFF.color },
    { key: 'SB',  label: 'SB',  value: sleeperSec, color: DUTY_STYLES.SB.color  },
    { key: 'D',   label: 'D',   value: drivingSec, color: DUTY_STYLES.D.color   },
    { key: 'ON',  label: 'ON',  value: onDutySec,  color: DUTY_STYLES.ON.color  },
  ]

  return (
    <div
      style={{
        borderRadius: 'var(--rw-radius-2xl)',
        background: 'var(--rw-bg-elevated)',
        border: '1px solid var(--rw-border)',
        overflow: 'hidden',
        boxShadow: 'var(--rw-shadow-md)',
      }}
    >
      {/* Card Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.02)',
          borderBottom: '1px solid var(--rw-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--rw-radius-lg)',
              background: 'var(--rw-accent-subtle)',
              border: '1px solid var(--rw-accent-border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ fontFamily: 'var(--rw-font-mono)', fontSize: '10px', fontWeight: 700, color: 'var(--rw-accent-bright)', lineHeight: 1 }}>
              {dayOfWeek.toUpperCase()}
            </span>
          </div>
          <div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--rw-text-primary)', lineHeight: 1.3 }}>
              {formattedDate}
            </p>
            <p style={{ fontSize: '10px', color: 'var(--rw-text-tertiary)', fontFamily: 'var(--rw-font-mono)', marginTop: 1 }}>
              Driving {drivingPct}% of 24h window
            </p>
          </div>
        </div>
      </div>

      {/* ELD Grid */}
      <EldGrid intervals={log.grid_intervals} />

      {/* Duty Time Summary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          borderTop: '1px solid var(--rw-border)',
        }}
      >
        {summaryItems.map(({ key, label, value, color }, i) => (
          <div
            key={key}
            style={{
              padding: '10px 8px',
              textAlign: 'center',
              borderRight: i < 3 ? '1px solid var(--rw-border)' : 'none',
            }}
          >
            <p style={{ fontSize: '10px', fontWeight: 700, color, marginBottom: 3, letterSpacing: '0.05em' }}>
              {label}
            </p>
            <p style={{ fontFamily: 'var(--rw-font-mono)', fontSize: '11px', fontWeight: 600, color: 'var(--rw-text-secondary)' }}>
              {formatSeconds(value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function EldLogsPanel() {
  const { activeTrip } = useTripStore()
  const [logIndex, setLogIndex] = useState(0)

  const isCustomClientTrip = activeTrip?.id?.startsWith('trip-') || activeTrip?.id === 'demo-la-nyc-70h-cycle'

  const { data: logs, isLoading } = useQuery({
    queryKey: ['logs', activeTrip?.id],
    queryFn: () => fetchLogs(activeTrip!.id),
    enabled: Boolean(activeTrip?.id) && !isCustomClientTrip,
    staleTime: 5 * 60 * 1000,
  })

  const displayLogs = logs ?? activeTrip?.daily_logs ?? []
  const currentLog = displayLogs[logIndex]
  const hasMultiple = displayLogs.length > 1

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: 'transparent', color: 'var(--rw-text-primary)' }}
    >
      <PanelHeaderControls
        title="FMCSA ELD Logs"
        icon={<FileText size={16} />}
        badgeText={`${displayLogs.length} Day${displayLogs.length !== 1 ? 's' : ''}`}
      />

      <div className="flex-1 overflow-y-auto" style={{ padding: '12px' }}>
        {isLoading ? (
          <SkeletonText lines={6} />
        ) : displayLogs.length === 0 ? (
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
              <FileText size={20} style={{ color: 'var(--rw-text-tertiary)' }} />
            </div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--rw-text-secondary)', marginBottom: 6 }}>
              No ELD logs available
            </p>
            <p style={{ fontSize: '12px', color: 'var(--rw-text-tertiary)', lineHeight: 1.5 }}>
              Complete a trip plan to generate official FMCSA ELD records
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Day Navigator */}
            {hasMultiple && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: 'var(--rw-radius-xl)',
                  background: 'var(--rw-bg-elevated)',
                  border: '1px solid var(--rw-border)',
                }}
              >
                <button
                  disabled={logIndex === 0}
                  onClick={() => setLogIndex(i => i - 1)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: 'var(--rw-radius-md)',
                    background: logIndex === 0 ? 'transparent' : 'var(--rw-bg-hover)',
                    border: '1px solid var(--rw-border)',
                    color: logIndex === 0 ? 'var(--rw-text-disabled)' : 'var(--rw-text-secondary)',
                    cursor: logIndex === 0 ? 'not-allowed' : 'pointer',
                    transition: 'all var(--rw-t-fast)',
                  }}
                  aria-label="Previous day"
                >
                  <ChevronLeft size={14} />
                </button>

                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontFamily: 'var(--rw-font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--rw-text-primary)' }}>
                    Day {logIndex + 1}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--rw-text-tertiary)', margin: '0 4px' }}>of</span>
                  <span style={{ fontFamily: 'var(--rw-font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--rw-text-primary)' }}>
                    {displayLogs.length}
                  </span>
                </div>

                <button
                  disabled={logIndex === displayLogs.length - 1}
                  onClick={() => setLogIndex(i => i + 1)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: 'var(--rw-radius-md)',
                    background: logIndex === displayLogs.length - 1 ? 'transparent' : 'var(--rw-bg-hover)',
                    border: '1px solid var(--rw-border)',
                    color: logIndex === displayLogs.length - 1 ? 'var(--rw-text-disabled)' : 'var(--rw-text-secondary)',
                    cursor: logIndex === displayLogs.length - 1 ? 'not-allowed' : 'pointer',
                    transition: 'all var(--rw-t-fast)',
                  }}
                  aria-label="Next day"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}

            {/* Log Card */}
            {currentLog && <LogCard log={currentLog} />}

            {/* Legend */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 6,
              }}
            >
              {(Object.entries(DUTY_STYLES) as [DutyStatus, typeof DUTY_STYLES[DutyStatus]][]).map(([key, style]) => (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 10px',
                    borderRadius: 'var(--rw-radius-md)',
                    background: 'var(--rw-bg-elevated)',
                    border: '1px solid var(--rw-border)',
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: style.color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--rw-text-secondary)', fontWeight: 500 }}>
                    {style.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
