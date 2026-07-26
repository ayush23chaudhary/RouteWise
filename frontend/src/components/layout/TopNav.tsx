import { Clock, Shield, FileText, Route, Zap, Navigation2 } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { useTripStore } from '@/stores/tripStore'
import { SAMPLE_DEMO_TRIP } from '@/data/sampleTrip'
import { Badge, statusToBadgeVariant } from '@/components/ui/Badge'
import toast from 'react-hot-toast'

/* ── Nav tab definitions ─────────────────────────────────── */
const NAV_ITEMS = [
  {
    id: 'timeline'   as const,
    label: 'Timeline',
    shortcut: 'T',
    icon: Clock,
    activeGrad: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)',
    activeGlow: 'rgba(37,99,235,0.45)',
    activeBorder: 'rgba(96,165,250,0.5)',
    activeText: '#DBEAFE',
    indicatorColor: '#60A5FA',
  },
  {
    id: 'compliance' as const,
    label: 'Compliance',
    shortcut: 'C',
    icon: Shield,
    activeGrad: 'linear-gradient(135deg, #065F46 0%, #059669 100%)',
    activeGlow: 'rgba(5,150,105,0.45)',
    activeBorder: 'rgba(52,211,153,0.5)',
    activeText: '#D1FAE5',
    indicatorColor: '#34D399',
  },
  {
    id: 'logs' as const,
    label: 'ELD Logs',
    shortcut: 'L',
    icon: FileText,
    activeGrad: 'linear-gradient(135deg, #4C1D95 0%, #7C3AED 100%)',
    activeGlow: 'rgba(124,58,237,0.45)',
    activeBorder: 'rgba(167,139,250,0.5)',
    activeText: '#EDE9FE',
    indicatorColor: '#A78BFA',
  },
]

export function TopNav() {
  const { activePanel, setActivePanel, setIsPlannerOpen } = useUIStore()
  const { activeTrip, setActiveTrip } = useTripStore()

  const handleLoadDemo = () => {
    setActiveTrip(SAMPLE_DEMO_TRIP)
    toast.success('LA → NYC sample route loaded', {
      icon: '🗺️',
      style: {
        background: 'var(--rw-bg-elevated)',
        color: 'var(--rw-text-primary)',
        border: '1px solid var(--rw-border)',
        fontSize: '0.8125rem',
        fontFamily: 'var(--rw-font-sans)',
      },
    })
  }

  return (
    <header
      role="banner"
      style={{
        height: 'var(--rw-nav-h)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0,
        zIndex: 30,
        background: 'rgba(8, 9, 14, 0.94)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.04)',
        gap: 12,
      }}
    >
      {/* ── LEFT: Logo + Mission ID ───────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, minWidth: 0 }}>
        {/* Logo mark */}
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 18px rgba(59,130,246,0.45)',
            flexShrink: 0,
          }}
        >
          <Route size={14} style={{ color: '#fff' }} strokeWidth={2.5} />
        </div>

        {/* Wordmark */}
        <span
          style={{
            fontSize: '15px',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            color: 'var(--rw-text-primary)',
            userSelect: 'none',
            flexShrink: 0,
          }}
        >
          Route<span style={{ color: '#60A5FA' }}>Wise</span>
        </span>

        {/* Trip status chip */}
        {activeTrip ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, paddingLeft: 10, borderLeft: '1px solid var(--rw-border-medium)' }}>
            <span
              style={{
                fontFamily: 'var(--rw-font-mono)',
                fontSize: '11px',
                color: 'var(--rw-text-tertiary)',
                maxWidth: 110,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {activeTrip.id?.substring(0, 12)}…
            </span>
            <Badge variant={statusToBadgeVariant(activeTrip.status)} dot>
              {activeTrip.status}
            </Badge>
          </div>
        ) : (
          <button
            onClick={handleLoadDemo}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 10px',
              borderRadius: 'var(--rw-radius-full)',
              border: '1px solid rgba(16,185,129,0.25)',
              background: 'rgba(16,185,129,0.08)',
              color: '#34D399',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(16,185,129,0.15)'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(16,185,129,0.4)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(16,185,129,0.08)'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(16,185,129,0.25)'
            }}
          >
            <Zap size={11} style={{ color: '#FBBF24', fill: '#FBBF24' }} />
            Load Demo
          </button>
        )}
      </div>

      {/* ── CENTER: Panel Tabs ────────────────────────────── */}
      {activeTrip && (
        <nav
          role="navigation"
          aria-label="Data panels"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            flex: 1,
            justifyContent: 'center',
          }}
        >
          {NAV_ITEMS.map(({ id, label, shortcut, icon: Icon, activeGrad, activeGlow, activeBorder, activeText, indicatorColor }) => {
            const isActive = activePanel === id
            return (
              <button
                key={id}
                onClick={() => setActivePanel(activePanel === id ? null : id)}
                aria-pressed={isActive}
                title={`${label} (${shortcut})`}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '0 16px',
                  height: 36,
                  borderRadius: 'var(--rw-radius-xl)',
                  border: `1px solid ${isActive ? activeBorder : 'rgba(255,255,255,0.08)'}`,
                  background: isActive ? activeGrad : 'rgba(255,255,255,0.04)',
                  color: isActive ? activeText : 'rgba(255,255,255,0.55)',
                  fontSize: '13px',
                  fontWeight: isActive ? 700 : 500,
                  letterSpacing: isActive ? '-0.01em' : '0',
                  cursor: 'pointer',
                  transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
                  boxShadow: isActive
                    ? `0 4px 16px ${activeGlow}, inset 0 1px 0 rgba(255,255,255,0.12)`
                    : 'none',
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                  fontFamily: 'var(--rw-font-sans)',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'
                    ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.85)'
                    ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.14)'
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'
                    ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.55)'
                    ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)'
                  }
                }}
              >
                {/* Icon */}
                <Icon
                  size={14}
                  strokeWidth={isActive ? 2.5 : 2}
                  style={{ color: isActive ? indicatorColor : 'currentColor', flexShrink: 0 }}
                />

                {/* Label */}
                <span>{label}</span>

                {/* Keyboard shortcut hint */}
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'var(--rw-font-mono)',
                    opacity: isActive ? 0.6 : 0.35,
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 4,
                    padding: '0 4px',
                    lineHeight: '16px',
                    letterSpacing: '0.05em',
                    display: 'none', // show on wider screens
                  }}
                  className="xl-shortcut"
                >
                  {shortcut}
                </span>

                {/* Active bottom indicator line */}
                {isActive && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      bottom: -1,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '60%',
                      height: 2,
                      borderRadius: 'var(--rw-radius-full)',
                      background: indicatorColor,
                      boxShadow: `0 0 8px ${indicatorColor}`,
                    }}
                  />
                )}
              </button>
            )
          })}
        </nav>
      )}

      {/* ── RIGHT: Trip Metrics + CTA ─────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {/* Trip metrics */}
        {activeTrip && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              paddingRight: 12,
              borderRight: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {[
              {
                label: 'DISTANCE',
                value: activeTrip.metrics?.total_distance_miles?.toFixed(0) ?? '—',
                unit: 'mi',
                color: '#60A5FA',
              },
              {
                label: 'DURATION',
                value: activeTrip.metrics?.total_duration_hours?.toFixed(1) ?? '—',
                unit: 'h',
                color: '#A78BFA',
              },
            ].map(({ label, value, unit, color }) => (
              <div key={label} style={{ textAlign: 'right' }}>
                <p
                  style={{
                    fontFamily: 'var(--rw-font-mono)',
                    fontSize: '13px',
                    fontWeight: 700,
                    color,
                    lineHeight: 1.1,
                  }}
                >
                  {value}
                  <span style={{ fontSize: '10px', color: 'var(--rw-text-tertiary)', fontWeight: 400, marginLeft: 2 }}>
                    {unit}
                  </span>
                </p>
                <p
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    color: 'var(--rw-text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    marginTop: 1,
                  }}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Plan Trip CTA */}
        <button
          onClick={() => setIsPlannerOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '0 16px',
            height: 34,
            borderRadius: 'var(--rw-radius-xl)',
            border: '1px solid rgba(59,130,246,0.4)',
            background: 'linear-gradient(135deg, #2563EB 0%, #6366F1 100%)',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.18s ease',
            boxShadow: '0 4px 14px rgba(59,130,246,0.4)',
            fontFamily: 'var(--rw-font-sans)',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(59,130,246,0.55)'
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 14px rgba(59,130,246,0.4)'
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
          }}
        >
          <Navigation2 size={13} strokeWidth={2.5} />
          Plan Trip
        </button>
      </div>
    </header>
  )
}
