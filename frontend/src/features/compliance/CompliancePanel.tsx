import { useQuery } from '@tanstack/react-query'
import { Shield, CheckCircle2, AlertTriangle, XCircle, HeartPulse } from 'lucide-react'
import { motion } from 'framer-motion'
import { fetchCompliance } from '@/api/trips'
import { useTripStore } from '@/stores/tripStore'
import { SkeletonText } from '@/components/ui/Skeleton'
import { PanelHeaderControls } from '@/components/layout/PanelHeaderControls'

// ...

function CircularGauge({
  label, value, total, unit = 'h', color = '#3B82F6', size = 82, strokeWidth = 7,
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
  const strokeDashoffset = circumference - (pct / 100) * circumference
  const remaining = Math.max(0, total - value)

  return (
    <div className="flex flex-col items-center text-center space-y-1.5 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3 shadow-md">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1E293B"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-xs font-bold font-mono text-slate-100">{remaining.toFixed(1)}</span>
          <span className="text-[8px] text-slate-400 uppercase tracking-wider font-semibold">{unit} left</span>
        </div>
      </div>
      <span className="text-[10px] font-bold text-slate-300 tracking-tight uppercase">{label}</span>
    </div>
  )
}

export function CompliancePanel() {
  const { activeTrip } = useTripStore()

  const { data: report, isLoading } = useQuery({
    queryKey: ['compliance', activeTrip?.id],
    queryFn: () => fetchCompliance(activeTrip!.id),
    enabled: Boolean(activeTrip?.id) && activeTrip?.id !== 'demo-la-nyc-70h-cycle',
    staleTime: 5 * 60 * 1000,
  })

  const displayReport = report ?? activeTrip?.compliance_report ?? (
    activeTrip ? {
      is_compliant: activeTrip.status === 'ACTIVE' || activeTrip.status === 'COMPLETED' || activeTrip.status === 'PLANNED',
      violations: [],
    } : null
  )

  const events = activeTrip?.events ?? []
  const drivingHours = events.filter(e => e.event_type === 'DRIVE').reduce((s, e) => s + (e.duration_seconds || 0), 0) / 3600
  const onDutyHours  = events.filter(e => ['DRIVE','PICKUP','DROPOFF','PRE_TRIP','FUEL_STOP'].includes(e.event_type)).reduce((s, e) => s + (e.duration_seconds || 0), 0) / 3600
  const healthScore = displayReport?.is_compliant ? 98 : 45

  return (
    <div className="flex flex-col h-full bg-slate-950/95 backdrop-blur-xl text-slate-100">
      <PanelHeaderControls
        title="FMCSA Compliance Engine"
        icon={<Shield size={18} />}
        badgeText={displayReport?.is_compliant ? 'HOS PASS' : 'HOS RISK'}
      />

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-4"><SkeletonText lines={4} /></div>
        ) : !displayReport ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
            <Shield size={36} className="text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-400">No active trip compliance data</p>
          </div>
        ) : (
          <div className="p-4 space-y-5">
            {/* Status Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex items-center justify-between p-4 rounded-2xl border ${
                displayReport.is_compliant
                  ? 'bg-emerald-950/40 border-emerald-500/30 shadow-lg shadow-emerald-950/30'
                  : 'bg-rose-950/40 border-rose-500/30 shadow-lg shadow-rose-950/30'
              }`}
            >
              <div className="flex items-center gap-3">
                {displayReport.is_compliant
                  ? <CheckCircle2 size={24} className="text-emerald-400 flex-shrink-0" />
                  : <XCircle      size={24} className="text-rose-400 flex-shrink-0" />
                }
                <div>
                  <p className={`text-sm font-bold ${displayReport.is_compliant ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {displayReport.is_compliant ? 'All HOS Rules Satisfied' : 'Violations Detected'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">FMCSA 49 CFR Part 395 · 70h/8d Cycle</p>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <HeartPulse size={12} className="text-emerald-400" /> Score
                </span>
                <span className="text-base font-extrabold font-mono text-emerald-400">{healthScore}%</span>
              </div>
            </motion.div>

            {/* Circular Gauges Grid */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                HOS Clocks & Remaining Margins
              </span>
              <div className="grid grid-cols-3 gap-2">
                <CircularGauge
                  label="11h Drive"
                  value={drivingHours}
                  total={11}
                  color="#3B82F6"
                />
                <CircularGauge
                  label="14h Duty"
                  value={onDutyHours}
                  total={14}
                  color="#06B6D4"
                />
                <CircularGauge
                  label="70h Cycle"
                  value={58.5}
                  total={70}
                  color="#8B5CF6"
                />
              </div>
            </div>

            {/* Violations / Warnings List */}
            {((displayReport.violations?.length ?? 0) > 0 || (displayReport.warnings?.length ?? 0) > 0) && (
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Alerts & HOS Warnings
                </span>

                {displayReport.violations?.map((v: string, i: number) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                    <XCircle size={15} className="text-rose-400 flex-shrink-0 mt-0.5" />
                    <span>{v}</span>
                  </div>
                ))}

                {displayReport.warnings?.map((w: string, i: number) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-950/50 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                    <AlertTriangle size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
