import { create } from 'zustand'

type Panel = 'timeline' | 'compliance' | 'logs' | 'settings' | null
export type PanelMode = 'normal' | 'expanded' | 'fullscreen' | 'popout'

interface UIStore {
  activePanel: Panel
  panelMode: PanelMode
  isPlannerOpen: boolean
  isLoading: boolean
  setActivePanel: (panel: Panel) => void
  setPanelMode: (mode: PanelMode) => void
  toggleFullscreen: () => void
  toggleExpanded: () => void
  setIsPlannerOpen: (open: boolean) => void
  setIsLoading: (loading: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  activePanel: 'timeline',
  panelMode: 'normal',
  isPlannerOpen: false,
  isLoading: false,
  setActivePanel: (panel) => set({ activePanel: panel, panelMode: 'normal' }),
  setPanelMode: (mode) => set({ panelMode: mode }),
  toggleFullscreen: () => set((state) => ({ panelMode: state.panelMode === 'fullscreen' ? 'normal' : 'fullscreen' })),
  toggleExpanded: () => set((state) => ({ panelMode: state.panelMode === 'expanded' ? 'normal' : 'expanded' })),
  setIsPlannerOpen: (open) => set({ isPlannerOpen: open }),
  setIsLoading: (loading) => set({ isLoading: loading }),
}))
