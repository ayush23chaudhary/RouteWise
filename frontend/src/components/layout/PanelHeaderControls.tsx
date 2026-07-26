import { Maximize2, Minimize2, Maximize, ExternalLink, X } from 'lucide-react'
import { useUIStore, type PanelMode } from '@/stores/uiStore'

interface PanelHeaderControlsProps {
  title: string
  icon: React.ReactNode
  badgeText?: string
}

export function PanelHeaderControls({ title, icon, badgeText }: PanelHeaderControlsProps) {
  const { panelMode, setPanelMode, toggleExpanded, toggleFullscreen, setActivePanel } = useUIStore()

  return (
    <div className="flex items-center justify-between h-13 px-4 border-b border-slate-800/80 bg-slate-900/80 flex-shrink-0 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="text-blue-400 flex items-center justify-center">
          {icon}
        </div>
        <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
          {title}
        </h2>
        {badgeText && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-semibold border border-blue-500/30">
            {badgeText}
          </span>
        )}
      </div>

      {/* Adaptive Mode Controls */}
      <div className="flex items-center gap-1">
        {/* Toggle Expanded (~70% width) */}
        <button
          onClick={toggleExpanded}
          className={`p-1.5 rounded-xl transition-all ${
            panelMode === 'expanded'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title={panelMode === 'expanded' ? 'Restore Normal Width (380px)' : 'Expand Panel (70% Width)'}
        >
          {panelMode === 'expanded' ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>

        {/* Toggle Pop-out Focus Mode */}
        <button
          onClick={() => setPanelMode(panelMode === 'popout' ? 'normal' : 'popout')}
          className={`p-1.5 rounded-xl transition-all ${
            panelMode === 'popout'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title={panelMode === 'popout' ? 'Restore Sidebar' : 'Pop-out Focus Mode'}
        >
          <ExternalLink size={16} />
        </button>

        {/* Toggle Fullscreen (Hotkey: F) */}
        <button
          onClick={toggleFullscreen}
          className={`p-1.5 rounded-xl transition-all ${
            panelMode === 'fullscreen'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title={panelMode === 'fullscreen' ? 'Exit Fullscreen (ESC)' : 'Fullscreen Overlay (F)'}
        >
          <Maximize size={16} />
        </button>

        {/* Close Panel */}
        <button
          onClick={() => setActivePanel(null)}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors ml-1"
          title="Close Panel"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
