import { motion } from 'framer-motion'
import { Route, ArrowRight, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useUIStore } from '@/stores/uiStore'
import { useTripStore } from '@/stores/tripStore'
import { SAMPLE_DEMO_TRIP } from '@/data/sampleTrip'
import toast from 'react-hot-toast'

export function MapEmptyState() {
  const { setIsPlannerOpen } = useUIStore()
  const { setActiveTrip } = useTripStore()

  const handleLoadDemo = () => {
    setActiveTrip(SAMPLE_DEMO_TRIP)
    toast.success('Loaded LA to NYC Sample Route with HOS schedule!')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto z-20"
    >
      <div className="flex flex-col items-center gap-4 bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl px-8 py-6 shadow-2xl shadow-blue-950/40 text-center max-w-md">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Route size={26} className="text-white" />
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-100 mb-1">No Active Trip Selected</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Plan a custom route with FMCSA HOS compliance analysis, or load our pre-configured coast-to-coast sample trip.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full pt-1">
          <button
            onClick={handleLoadDemo}
            className="flex-1 flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-md shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Zap size={14} className="text-amber-300 fill-amber-300" />
            Load Demo Route
          </button>

          <Button
            variant="primary"
            size="md"
            className="flex-1 h-10 text-xs font-semibold rounded-xl"
            rightIcon={<ArrowRight size={14} />}
            onClick={() => setIsPlannerOpen(true)}
          >
            Plan Custom Trip
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
