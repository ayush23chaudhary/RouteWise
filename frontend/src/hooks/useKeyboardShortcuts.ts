import { useEffect } from 'react'
import { useUIStore } from '@/stores/uiStore'

export function useKeyboardShortcuts() {
  const {
    activePanel,
    panelMode,
    setActivePanel,
    setPanelMode,
    toggleFullscreen,
    isPlannerOpen,
    setIsPlannerOpen,
  } = useUIStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcut keys when typing inside inputs, selects, or textareas
      const target = e.target as HTMLElement
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return
      }

      // ESC: Exit Fullscreen / Popout Mode or Close Planner
      if (e.key === 'Escape') {
        if (panelMode === 'fullscreen' || panelMode === 'popout') {
          setPanelMode('normal')
        } else if (isPlannerOpen) {
          setIsPlannerOpen(false)
        }
        return
      }

      // F Key: Toggle Fullscreen Mode
      if (e.key === 'f' || e.key === 'F') {
        if (activePanel) {
          e.preventDefault()
          toggleFullscreen()
        }
        return
      }

      // 1 Key: Switch to Timeline
      if (e.key === '1') {
        e.preventDefault()
        setActivePanel('timeline')
        return
      }

      // 2 Key: Switch to Compliance
      if (e.key === '2') {
        e.preventDefault()
        setActivePanel('compliance')
        return
      }

      // 3 Key: Switch to ELD Logs
      if (e.key === '3') {
        e.preventDefault()
        setActivePanel('logs')
        return
      }

      // P Key: Toggle Trip Planner
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault()
        setIsPlannerOpen(!isPlannerOpen)
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    activePanel,
    panelMode,
    isPlannerOpen,
    setActivePanel,
    setPanelMode,
    toggleFullscreen,
    setIsPlannerOpen,
  ])
}
