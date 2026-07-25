import { useQuery } from '@tanstack/react-query'
import { FileText, ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react'
import { useState } from 'react'
import { format } from 'date-fns'
import { fetchLogs } from '@/api/trips'
import { useTripStore } from '@/stores/tripStore'
import { SkeletonText } from '@/components/ui/Skeleton'
import type { DailyLog, DutyStatus } from '@/api/types'
import { PanelHeaderControls } from '@/components/layout/PanelHeaderControls'

const DUTY_ROW: Record<DutyStatus, number> = { OFF: 0, SB: 1, D: 2, ON: 3 }
const DUTY_COLORS: Record<DutyStatus, string> = {
  OFF: 'var(--color-text-tertiary)',
  SB:  '#8B5CF6',
  D:   '#3B82F6',
  ON:  '#06B6D4',
}
const DUTY_LABELS: DutyStatus[] = ['OFF', 'SB', 'D', 'ON']

function EldGrid({ intervals = [] }: { intervals?: DutyStatus[] }) {
  const SVG_W = 320
  const SVG_H = 80
  const LEFT  = 28
  const TOP   = 8
  const GRID_W = SVG_W - LEFT - 8
  const ROW_H  = (SVG_H - TOP - 8) / 4
  const CELL_W = GRID_W / 96

  const safeIntervals = intervals.length === 96 ? intervals : Array(96).fill('OFF' as DutyStatus)

  const rects: { x: number; w: number; status: DutyStatus }[] = []
  let prevStatus = safeIntervals[0]
  let startIdx = 0

  for (let i = 1; i <= safeIntervals.length; i++) {
    if (i === safeIntervals.length || safeIntervals[i] !== prevStatus) {
      rects.push({ x: startIdx * CELL_W, w: (i - startIdx) * CELL_W, status: prevStatus })
      if (i < safeIntervals.length) { prevStatus = safeIntervals[i]; startIdx = i }
    }
  }

  // Construct continuous ELD stepped line path
  let pathD = ''
  safeIntervals.forEach((status, idx) => {
    const duty = status as DutyStatus
    const x1 = LEFT + idx * CELL_W
    const x2 = LEFT + (idx + 1) * CELL_W
    const y = TOP + (DUTY_ROW[duty] ?? 0) * ROW_H + ROW_H / 2

    if (idx === 0) {
      pathD += `M ${x1} ${y} L ${x2} ${y}`
    } else {
      const prevDuty = safeIntervals[idx - 1] as DutyStatus
      const prevY = TOP + (DUTY_ROW[prevDuty] ?? 0) * ROW_H + ROW_H / 2
      if (prevY !== y) {
        pathD += ` L ${x1} ${y} L ${x2} ${y}`
      } else {
        pathD += ` L ${x2} ${y}`
      }
    }
  })


  return (
    <div className="px-4 py-3" aria-label="ELD 24-hour grid" role="img">
      <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="overflow-visible">
        {/* Background Grid Horizontal Lines */}
        {[0, 1, 2, 3, 4].map(i => (
          <line
            key={`h-${i}`}
            x1={LEFT} y1={TOP + i * ROW_H}
            x2={LEFT + GRID_W} y2={TOP + i * ROW_H}
            stroke="#1E293B"
            strokeWidth={0.75}
          />
        ))}

        {/* Hour Vertical Lines */}
        {Array.from({ length: 25 }).map((_, h) => (
          <g key={h}>
            <line
              x1={LEFT + h * (GRID_W / 24)} y1={TOP}
              x2={LEFT + h * (GRID_W / 24)} y2={TOP + 4 * ROW_H}
              stroke="#1E293B"
              strokeWidth={h % 6 === 0 ? 1 : 0.4}
            />
            {h % 6 === 0 && (
              <text
                x={LEFT + h * (GRID_W / 24)}
                y={TOP + 4 * ROW_H + 11}
                textAnchor="middle"
                fontSize={7}
                fill="#64748B"
                fontFamily="JetBrains Mono, monospace"
              >{String(h).padStart(2, '0')}</text>
            )}
          </g>
        ))}

        {/* Row Labels */}
        {DUTY_LABELS.map((d, i) => (
          <text
            key={d}
            x={LEFT - 5}
            y={TOP + i * ROW_H + ROW_H / 2 + 3}
            textAnchor="end"
            fontSize={8}
            fill="#94A3B8"
            fontWeight={600}
            fontFamily="JetBrains Mono, monospace"
          >{d}</text>
        ))}

        {/* Colored Status Blocks */}
        {rects.map(({ x, w, status }, i) => (
          <rect
            key={i}
            x={LEFT + x}
            y={TOP + DUTY_ROW[status] * ROW_H + 1}
            width={w}
            height={ROW_H - 2}
            fill={DUTY_COLORS[status]}
            opacity={0.35}
            rx={1}
          />
        ))}

        {/* Stepped ELD Duty Line Path */}
        <path
          d={pathD}
          fill="none"
          stroke="#60A5FA"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
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

  const offDutySec = log.off_duty_seconds ?? ((log.duty_hours?.OFF ?? 0) * 3600)
  const sleeperSec = log.sleeper_berth_seconds ?? ((log.duty_hours?.SB ?? 0) * 3600)
  const drivingSec = log.driving_seconds ?? ((log.duty_hours?.D ?? 0) * 3600)
  const onDutySec  = log.on_duty_seconds ?? ((log.duty_hours?.ON ?? 0) * 3600)

  return (
    <div className="border border-slate-700/70 rounded-xl bg-slate-900/90 overflow-hidden shadow-lg">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/50">
        <p className="text-xs font-bold text-slate-200">
          {formattedDate}
        </p>
      </div>
      <EldGrid intervals={log.grid_intervals} />
      <div className="grid grid-cols-4 divide-x divide-slate-800 border-t border-slate-800">
        {[
          { label: 'OFF',  value: offDutySec, color: '#94A3B8' },
          { label: 'SB',   value: sleeperSec, color: '#8B5CF6' },
          { label: 'D',    value: drivingSec, color: '#3B82F6' },
          { label: 'ON',   value: onDutySec,  color: '#06B6D4' },
        ].map(({ label, value, color }) => (
          <div key={label} className="py-2.5 text-center">
            <p className="text-[10px] font-bold mb-0.5" style={{ color }}>{label}</p>
            <p className="text-[11px] text-slate-200 font-mono font-semibold">{formatSeconds(value)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function EldLogsPanel() {
  const { activeTrip } = useTripStore()
  const [logIndex, setLogIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const { data: logs, isLoading } = useQuery({
    queryKey: ['logs', activeTrip?.id],
    queryFn: () => fetchLogs(activeTrip!.id),
    enabled: Boolean(activeTrip?.id) && activeTrip?.id !== 'demo-la-nyc-70h-cycle',
    staleTime: 5 * 60 * 1000,
  })

  const displayLogs = logs ?? activeTrip?.daily_logs ?? []
  const currentLog = displayLogs[logIndex]

  return (
    <div className="flex flex-col h-full bg-slate-950/95 backdrop-blur-xl text-slate-100">
      <PanelHeaderControls
        title="FMCSA ELD Daily Logs"
        icon={<FileText size={18} />}
        badgeText={`${displayLogs.length} Days`}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <SkeletonText lines={5} />
        ) : displayLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
            <FileText size={36} className="text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-400">No ELD logs available</p>
          </div>
        ) : (
          <>
            {displayLogs.length > 1 && (
              <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2">
                <button
                  disabled={logIndex === 0}
                  onClick={() => setLogIndex(i => i - 1)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-bold text-slate-300 font-mono">
                  Day {logIndex + 1} of {displayLogs.length}
                </span>
                <button
                  disabled={logIndex === displayLogs.length - 1}
                  onClick={() => setLogIndex(i => i + 1)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {currentLog && <LogCard log={currentLog} />}
          </>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && currentLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-4xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-blue-400" />
                <h3 className="text-base font-bold text-slate-100">Official FMCSA 24-Hour ELD Log</h3>
              </div>
              <button
                onClick={() => setIsFullscreen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              >
                <X size={18} />
              </button>
            </div>

            <LogCard log={currentLog} />
          </div>
        </div>
      )}
    </div>
  )
}
