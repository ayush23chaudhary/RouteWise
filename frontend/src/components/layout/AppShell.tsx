import { Toaster } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { TopNav } from './TopNav'
import { useUIStore } from '@/stores/uiStore'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { TripPlannerDrawer } from '@/features/trip-planner/TripPlannerDrawer'
import { MapWorkspace } from '@/features/map-workspace/MapWorkspace'
import { TimelinePanel } from '@/features/timeline/TimelinePanel'
import { CompliancePanel } from '@/features/compliance/CompliancePanel'
import { EldLogsPanel } from '@/features/eld-logs/EldLogsPanel'
import { OperationalHUD } from '@/features/map-workspace/OperationalHUD'

export function AppShell() {
  const { activePanel, panelMode, setPanelMode } = useUIStore()
  useKeyboardShortcuts()

  const panelComponents: Record<string, React.ReactNode> = {
    timeline:   <TimelinePanel />,
    compliance: <CompliancePanel />,
    logs:       <EldLogsPanel />,
  }

  const renderPanel = activePanel && panelComponents[activePanel]

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[--color-bg-base] text-slate-100 font-sans select-none">
      <TopNav />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Map Canvas — Always Active Background */}
        <main className="flex-1 relative overflow-hidden" role="main">
          <OperationalHUD />
          <MapWorkspace />
        </main>

        {/* Normal & Expanded Sidebar Panel Modes */}
        {renderPanel && (panelMode === 'normal' || panelMode === 'expanded') && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{
              width: panelMode === 'expanded' ? 720 : 380,
              opacity: 1,
            }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="flex-shrink-0 border-l border-slate-800/80 bg-slate-950/95 backdrop-blur-2xl overflow-hidden flex flex-col z-20 shadow-2xl"
            role="complementary"
            aria-label={`${activePanel} panel`}
          >
            {renderPanel}
          </motion.aside>
        )}
      </div>

      {/* Fullscreen Overlay Mode */}
      <AnimatePresence>
        {renderPanel && panelMode === 'fullscreen' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex flex-col p-4 shadow-2xl"
          >
            <div className="flex-1 overflow-hidden border border-slate-800 rounded-3xl bg-slate-950 flex flex-col shadow-2xl">
              {renderPanel}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pop-out Centered Focus Modal Mode */}
      <AnimatePresence>
        {renderPanel && panelMode === 'popout' && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-4xl h-[85vh] shadow-2xl overflow-hidden flex flex-col"
            >
              {renderPanel}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Trip Planner Drawer */}
      <TripPlannerDrawer />

      {/* Toast notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--color-bg-elevated)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8125rem',
          },
          success: { iconTheme: { primary: 'var(--color-compliant)', secondary: 'transparent' } },
          error: { iconTheme: { primary: 'var(--color-violation)', secondary: 'transparent' } },
        }}
      />
    </div>
  )
}
