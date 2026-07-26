import { Maximize2, Minimize2, Maximize, ExternalLink, X } from 'lucide-react'
import { useUIStore, type PanelMode } from '@/stores/uiStore'

interface PanelHeaderControlsProps {
  title: string
  icon: React.ReactNode
  badgeText?: string
  badgeVariant?: 'default' | 'success' | 'warning' | 'danger'
}

const BADGE_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  default: {
    color: 'var(--rw-accent-bright)',
    bg: 'var(--rw-accent-subtle)',
    border: 'var(--rw-accent-border)',
  },
  success: {
    color: 'var(--rw-compliant)',
    bg: 'var(--rw-compliant-bg)',
    border: 'var(--rw-compliant-border)',
  },
  warning: {
    color: 'var(--rw-warning)',
    bg: 'var(--rw-warning-bg)',
    border: 'var(--rw-warning-border)',
  },
  danger: {
    color: 'var(--rw-violation)',
    bg: 'var(--rw-violation-bg)',
    border: 'var(--rw-violation-border)',
  },
}

export function PanelHeaderControls({
  title,
  icon,
  badgeText,
  badgeVariant = 'default',
}: PanelHeaderControlsProps) {
  const { panelMode, setPanelMode, toggleExpanded, toggleFullscreen, setActivePanel } = useUIStore()
  const badgeStyle = BADGE_STYLES[badgeVariant]

  return (
    <div
      className="flex items-center justify-between px-4 flex-shrink-0"
      style={{
        height: 'var(--rw-nav-h)',
        background: 'rgba(10, 12, 16, 0.6)',
        borderBottom: '1px solid var(--rw-border)',
      }}
    >
      {/* Left: Icon + Title + Badge */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{ color: 'var(--rw-accent-bright)', width: 20, height: 20 }}
        >
          {icon}
        </div>
        <h2
          className="font-bold uppercase tracking-wider truncate"
          style={{ fontSize: '11px', letterSpacing: '0.08em', color: 'var(--rw-text-primary)' }}
        >
          {title}
        </h2>
        {badgeText && (
          <span
            className="font-mono flex-shrink-0"
            style={{
              fontSize: '10px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 'var(--rw-radius-full)',
              color: badgeStyle.color,
              background: badgeStyle.bg,
              border: `1px solid ${badgeStyle.border}`,
            }}
          >
            {badgeText}
          </span>
        )}
      </div>

      {/* Right: Window Controls */}
      <div className="flex items-center gap-0.5" role="toolbar" aria-label="Panel controls">
        <PanelControlButton
          onClick={toggleExpanded}
          isActive={panelMode === 'expanded'}
          activeColor="#3B82F6"
          title={panelMode === 'expanded' ? 'Restore width' : 'Expand panel'}
          aria-label={panelMode === 'expanded' ? 'Restore normal width' : 'Expand panel'}
        >
          {panelMode === 'expanded' ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </PanelControlButton>

        <PanelControlButton
          onClick={() => setPanelMode(panelMode === 'popout' ? 'normal' : 'popout')}
          isActive={panelMode === 'popout'}
          activeColor="#8B5CF6"
          title={panelMode === 'popout' ? 'Restore sidebar' : 'Pop-out focus mode'}
          aria-label={panelMode === 'popout' ? 'Restore sidebar' : 'Pop-out focus mode'}
        >
          <ExternalLink size={14} />
        </PanelControlButton>

        <PanelControlButton
          onClick={toggleFullscreen}
          isActive={panelMode === 'fullscreen'}
          activeColor="#22C55E"
          title={panelMode === 'fullscreen' ? 'Exit fullscreen (Esc)' : 'Fullscreen (F)'}
          aria-label={panelMode === 'fullscreen' ? 'Exit fullscreen' : 'Fullscreen overlay'}
        >
          <Maximize size={14} />
        </PanelControlButton>

        <div
          className="ml-1"
          style={{ width: '1px', height: '16px', background: 'var(--rw-border)' }}
          aria-hidden="true"
        />

        <PanelControlButton
          onClick={() => setActivePanel(null)}
          title="Close panel"
          aria-label="Close panel"
        >
          <X size={14} />
        </PanelControlButton>
      </div>
    </div>
  )
}

function PanelControlButton({
  children,
  onClick,
  isActive,
  activeColor,
  title,
  ...rest
}: {
  children: React.ReactNode
  onClick: () => void
  isActive?: boolean
  activeColor?: string
  title?: string
  [key: string]: any
}) {
  const baseStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: 'var(--rw-radius-md)',
    border: 'none',
    cursor: 'pointer',
    transition: 'all var(--rw-t-fast)',
    color: isActive ? '#fff' : 'var(--rw-text-tertiary)',
    background: isActive && activeColor
      ? `${activeColor}22`
      : 'transparent',
    outline: 'none',
  }

  return (
    <button
      onClick={onClick}
      style={baseStyle}
      title={title}
      onMouseEnter={e => {
        if (!isActive) {
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--rw-text-primary)'
          ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--rw-bg-hover)'
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--rw-text-tertiary)'
          ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
        }
      }}
      {...rest}
    >
      {children}
    </button>
  )
}
