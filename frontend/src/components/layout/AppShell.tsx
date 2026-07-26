import { Toaster } from 'react-hot-toast'
import { Suspense, lazy } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TopNav } from './TopNav'
import { useUIStore } from '@/stores/uiStore'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { TripPlannerDrawer } from '@/features/trip-planner/TripPlannerDrawer'
import { MapWorkspace } from '@/features/map-workspace/MapWorkspace'
import { OperationalHUD } from '@/features/map-workspace/OperationalHUD'
import { SkeletonCard } from '@/components/ui/Skeleton'

const TimelinePanel   = lazy(() => import('@/features/timeline/TimelinePanel').then(m => ({ default: m.TimelinePanel })))
const CompliancePanel = lazy(() => import('@/features/compliance/CompliancePanel').then(m => ({ default: m.CompliancePanel })))
const EldLogsPanel    = lazy(() => import('@/features/eld-logs/EldLogsPanel').then(m => ({ default: m.EldLogsPanel })))

const PANEL_SPRING = { type: 'spring' as const, damping: 30, stiffness: 320, mass: 0.8 }
const OVERLAY_SPRING = { type: 'spring' as const, damping: 26, stiffness: 280, mass: 0.7 }

export function AppShell() {
  const { activePanel, panelMode, setPanelMode } = useUIStore()
  useKeyboardShortcuts()

  const PanelFallback = (
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
    </div>
  )

  const panelComponents: Record<string, React.ReactNode> = {
    timeline:   <Suspense fallback={PanelFallback}><TimelinePanel /></Suspense>,
    compliance: <Suspense fallback={PanelFallback}><CompliancePanel /></Suspense>,
    logs:       <Suspense fallback={PanelFallback}><EldLogsPanel /></Suspense>,
  }

  const renderPanel = activePanel && panelComponents[activePanel]

  return (
    <div
      className="flex flex-col overflow-hidden select-none"
      style={{ height: '100dvh', background: 'var(--rw-bg-void)', color: 'var(--rw-text-primary)', fontFamily: 'var(--rw-font-sans)' }}
    >
      <TopNav />

      {/* ── Workspace Row ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Map Canvas — always mounted, never unmounted */}
        <main className="flex-1 relative overflow-hidden" role="main">
          <OperationalHUD />
          <MapWorkspace />
        </main>

        {/* ── Side Panel: Normal + Expanded ── */}
        <AnimatePresence>
          {renderPanel && (panelMode === 'normal' || panelMode === 'expanded') && (
            <motion.aside
              key="sidebar-panel"
              initial={{ width: 0, opacity: 0 }}
              animate={{
                width: panelMode === 'expanded' ? 'var(--rw-panel-expanded)' : 'var(--rw-panel-normal)',
                opacity: 1,
              }}
              exit={{ width: 0, opacity: 0 }}
              transition={PANEL_SPRING}
              className="flex-shrink-0 flex flex-col overflow-hidden z-20"
              style={{
                background: 'var(--rw-bg-glass)',
                backdropFilter: 'blur(32px) saturate(200%)',
                WebkitBackdropFilter: 'blur(32px) saturate(200%)',
                borderLeft: '1px solid var(--rw-border)',
                boxShadow: '-4px 0 32px rgba(0,0,0,0.5)',
              }}
              role="complementary"
              aria-label={`${activePanel} panel`}
            >
              <motion.div
                key={activePanel}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.06 }}
                className="flex flex-col h-full"
              >
                {renderPanel}
              </motion.div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* ── Fullscreen Overlay ── */}
      <AnimatePresence>
        {renderPanel && panelMode === 'fullscreen' && (
          <motion.div
            key="fullscreen-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex flex-col"
            style={{
              background: 'rgba(6, 7, 9, 0.95)',
              backdropFilter: 'blur(32px)',
            }}
          >
            <motion.div
              initial={{ scale: 0.98, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.98, y: 8 }}
              transition={{ duration: 0.2 }}
              className="flex-1 m-4 overflow-hidden flex flex-col"
              style={{
                background: 'var(--rw-bg-surface)',
                border: '1px solid var(--rw-border-medium)',
                borderRadius: 'var(--rw-radius-3xl)',
                boxShadow: 'var(--rw-shadow-xl)',
              }}
            >
              {renderPanel}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Popout Focus Modal ── */}
      <AnimatePresence>
        {renderPanel && panelMode === 'popout' && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
            onClick={() => setPanelMode('normal')}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 24 }}
              transition={OVERLAY_SPRING}
              className="w-full max-w-4xl flex flex-col overflow-hidden"
              style={{
                height: '85vh',
                background: 'var(--rw-bg-surface)',
                border: '1px solid var(--rw-border-medium)',
                borderRadius: 'var(--rw-radius-3xl)',
                boxShadow: 'var(--rw-shadow-xl)',
              }}
              onClick={e => e.stopPropagation()}
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
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--rw-bg-elevated)',
            color: 'var(--rw-text-primary)',
            border: '1px solid var(--rw-border-medium)',
            borderRadius: 'var(--rw-radius-xl)',
            fontSize: '0.8125rem',
            fontFamily: 'var(--rw-font-sans)',
            boxShadow: 'var(--rw-shadow-lg)',
          },
          success: { iconTheme: { primary: 'var(--rw-compliant)', secondary: 'transparent' } },
          error:   { iconTheme: { primary: 'var(--rw-violation)', secondary: 'transparent' } },
        }}
      />
    </div>
  )
}
