import { create } from 'zustand'

interface MapStore {
  center: [number, number]
  zoom: number
  setCenter: (center: [number, number]) => void
  setZoom: (zoom: number) => void
  flyTo: (center: [number, number], zoom?: number) => void
}

export const useMapStore = create<MapStore>((set) => ({
  center: [-98.5795, 39.8283], // Center of USA
  zoom: 4,
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  flyTo: (center, zoom = 10) => set({ center, zoom }),
}))
