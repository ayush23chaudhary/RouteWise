import { create } from 'zustand'
import type { Trip } from '@/api/types'

interface TripStore {
  activeTrip: Trip | null
  selectedEventId: string | null
  hoveredEventId: string | null
  setActiveTrip: (trip: Trip | null) => void
  setSelectedEvent: (id: string | null) => void
  setHoveredEvent: (id: string | null) => void
}

export const useTripStore = create<TripStore>((set) => ({
  activeTrip: null,
  selectedEventId: null,
  hoveredEventId: null,
  setActiveTrip: (trip) => set({ activeTrip: trip }),
  setSelectedEvent: (id) => set({ selectedEventId: id }),
  setHoveredEvent: (id) => set({ hoveredEventId: id }),
}))
