import { motion } from 'framer-motion'
import { Route, ArrowRight, Zap, Map, Truck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useUIStore } from '@/stores/uiStore'
import { useTripStore } from '@/stores/tripStore'
import { SAMPLE_DEMO_TRIP } from '@/data/sampleTrip'
import toast from 'react-hot-toast'

const FEATURE_ITEMS = [
  { icon: '🛣️', label: 'FMCSA HOS Compliance' },
  { icon: '📊', label: 'Live ELD Timeline' },
  { icon: '🗺️', label: 'Route Visualization' },
]

export function MapEmptyState() {
  const { setIsPlannerOpen } = useUIStore()
  const { setActiveTrip } = useTripStore()

  const handleLoadDemo = () => {
    setActiveTrip(SAMPLE_DEMO_TRIP)
    toast.success('LA → NYC sample route loaded!', {
      icon: '🗺️',
      style: {
        background: 'var(--rw-bg-elevated)',
        color: 'var(--rw-text-primary)',
        border: '1px solid var(--rw-border)',
        fontSize: '0.8125rem',
      },
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto z-20"
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          background: 'rgba(6, 7, 9, 0.90)',
          backdropFilter: 'blur(24px) saturate(200%)',
          WebkitBackdropFilter: 'blur(24px) saturate(200%)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 'var(--rw-radius-3xl)',
          padding: '28px 32px',
          textAlign: 'center',
          maxWidth: 380,
          boxShadow: '0 24px 64px rgba(0,0,0,0.8), 0 8px 24px rgba(0,0,0,0.6)',
        }}
      >
        {/* Logo Icon */}
        <div style={{ position: 'relative' }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 'var(--rw-radius-2xl)',
              background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 60%, #8B5CF6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 32px rgba(59,130,246,0.45)',
            }}
          >
            <Route size={28} style={{ color: '#fff' }} />
          </div>
          {/* Animated ping */}
          <div
            style={{
              position: 'absolute',
              inset: -4,
              borderRadius: 'var(--rw-radius-3xl)',
              border: '1px solid rgba(59,130,246,0.25)',
              animation: 'ping 3s ease-out infinite',
            }}
          />
        </div>

        {/* Text */}
        <div>
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 800,
              color: 'var(--rw-text-primary)',
              marginBottom: 8,
              letterSpacing: '-0.02em',
            }}
          >
            No Active Mission
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--rw-text-tertiary)', lineHeight: 1.6, maxWidth: 280 }}>
            Plan a commercial route with automatic FMCSA HOS compliance scheduling and ELD log generation.
          </p>
        </div>

        {/* Feature Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          {FEATURE_ITEMS.map(({ icon, label }) => (
            <span
              key={label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--rw-text-secondary)',
                background: 'var(--rw-bg-elevated)',
                border: '1px solid var(--rw-border)',
                borderRadius: 'var(--rw-radius-full)',
                padding: '3px 10px',
              }}
            >
              <span style={{ fontSize: '13px' }}>{icon}</span>
              {label}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          <button
            onClick={handleLoadDemo}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              height: 40,
              borderRadius: 'var(--rw-radius-xl)',
              fontSize: '12px',
              fontWeight: 700,
              color: '#fff',
              background: 'linear-gradient(135deg, #059669, #10B981)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all var(--rw-t-normal)',
              boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(16,185,129,0.45)'
              ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(16,185,129,0.3)'
              ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
            }}
          >
            <Zap size={13} style={{ color: '#FBBF24', fill: '#FBBF24' }} />
            Load Demo
          </button>

          <button
            onClick={() => setIsPlannerOpen(true)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              height: 40,
              borderRadius: 'var(--rw-radius-xl)',
              fontSize: '12px',
              fontWeight: 700,
              color: '#fff',
              background: 'linear-gradient(135deg, #2563EB, #6366F1)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all var(--rw-t-normal)',
              boxShadow: '0 4px 16px rgba(59,130,246,0.35)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(59,130,246,0.5)'
              ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(59,130,246,0.35)'
              ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
            }}
          >
            <Truck size={13} />
            Plan Custom Route
            <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
