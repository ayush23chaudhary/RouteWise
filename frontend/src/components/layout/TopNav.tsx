import { Clock, Shield, FileText, Route, Zap, Map } from 'lucide-react'
import { clsx } from 'clsx'
import { useUIStore } from '@/stores/uiStore'
import { useTripStore } from '@/stores/tripStore'
import { SAMPLE_DEMO_TRIP } from '@/data/sampleTrip'
import { Badge, statusToBadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

export function TopNav() {
  const { activePanel, setActivePanel, setIsPlannerOpen } = useUIStore()
  const { activeTrip, setActiveTrip } = useTripStore()

  const navItems = [
    { id: 'timeline' as const,   label: 'Timeline',   icon: Clock   },
    { id: 'compliance' as const, label: 'Compliance', icon: Shield  },
    { id: 'logs' as const,       label: 'ELD Logs',   icon: FileText },
  ]

  const handleLoadDemo = () => {
    setActiveTrip(SAMPLE_DEMO_TRIP)
    toast.success('Loaded LA to NYC Sample Route!')
  }

  return (
    <header
      className="flex-shrink-0 h-13 flex items-center justify-between px-5 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md z-20 shadow-md shadow-slate-950/50"
      role="banner"
    >
      {/* Left — Branding */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Route size={16} className="text-white" />
          </div>
          <span className="font-bold text-slate-100 text-base tracking-tight">
            Route<span className="text-blue-400">Wise</span>
          </span>
        </div>

        {activeTrip ? (
          <div className="flex items-center gap-2 pl-4 border-l border-slate-800">
            <span className="text-xs text-slate-400 font-mono">
              {activeTrip.id ? `${activeTrip.id.substring(0, 10)}…` : '—'}
            </span>
            <Badge variant={statusToBadgeVariant(activeTrip.status)} dot>
              {activeTrip.status}
            </Badge>
          </div>
        ) : (
          <button
            onClick={handleLoadDemo}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 hover:bg-emerald-900/60 transition-all shadow-sm"
          >
            <Zap size={13} className="text-amber-400 fill-amber-400" />
            Quick Demo Route
          </button>
        )}
      </div>

      {/* Center — Panel Navigation */}
      {activeTrip && (
        <nav className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800" role="navigation">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActivePanel(activePanel === id ? null : id)}
              aria-pressed={activePanel === id}
              className={clsx(
                'flex items-center gap-2 h-7.5 px-3.5 rounded-lg text-xs font-semibold transition-all',
                activePanel === id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
              )}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </nav>
      )}

      {/* Right — Actions */}
      <div className="flex items-center gap-3">
        {activeTrip && (
          <div className="flex items-center gap-4 pr-4 border-r border-slate-800">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Distance</p>
              <p className="text-xs font-bold text-slate-200 font-mono">
                {activeTrip.metrics?.total_distance_miles?.toFixed(0) ?? '—'} mi
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Duration</p>
              <p className="text-xs font-bold text-slate-200 font-mono">
                {activeTrip.metrics?.total_duration_hours?.toFixed(1) ?? '—'}h
              </p>
            </div>
          </div>
        )}

        <Button
          variant="primary"
          size="sm"
          className="h-8.5 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-600/30"
          leftIcon={<Map size={14} />}
          onClick={() => setIsPlannerOpen(true)}
        >
          Plan Trip
        </Button>
      </div>
    </header>
  )
}
