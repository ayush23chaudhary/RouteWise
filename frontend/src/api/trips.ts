import { apiClient } from './client'
import type {
  Trip,
  TripPlanRequest,
  ScheduleEvent,
  DailyLog,
  ComplianceReport,
  TripStatusUpdateRequest,
} from './types'

// ─── Response Normalization ─────────────────────────────────────
function normalizeTrip(trip: any): Trip {
  const waypoints = (trip.waypoints || []).map((wp: any) => ({
    ...wp,
    waypoint_type: wp.type || wp.waypoint_type,
    coordinates: wp.coordinates || { latitude: wp.latitude, longitude: wp.longitude },
  }))

  const route_geometry = trip.route_geometry || []

  // Assign basic coordinates to events so they render on the map
  const events = (trip.events || []).map((ev: any, index: number) => {
    let start_coordinates = ev.start_coordinates
    let end_coordinates = ev.end_coordinates

    if (!start_coordinates) {
      if (index === 0 && route_geometry.length > 0) {
        start_coordinates = { longitude: route_geometry[0][0], latitude: route_geometry[0][1] }
      } else if (index === (trip.events?.length || 0) - 1 && route_geometry.length > 0) {
        start_coordinates = { longitude: route_geometry[route_geometry.length - 1][0], latitude: route_geometry[route_geometry.length - 1][1] }
      } else if (route_geometry.length > 0) {
        // Approximate location for intermediate events
        const ratio = Math.min(1, index / (trip.events?.length || 1))
        const geomIdx = Math.floor(ratio * (route_geometry.length - 1))
        start_coordinates = { longitude: route_geometry[geomIdx][0], latitude: route_geometry[geomIdx][1] }
      } else {
        start_coordinates = waypoints[0]?.coordinates
      }
      end_coordinates = start_coordinates
    }

    return {
      ...ev,
      duration_seconds: ev.duration_seconds || (new Date(ev.end_time).getTime() - new Date(ev.start_time).getTime()) / 1000,
      start_coordinates,
      end_coordinates,
    }
  })

  return {
    ...trip,
    waypoints,
    events,
  }
}

// ─── Plan new trip ────────────────────────────────────────────
export const planTrip = async (payload: TripPlanRequest): Promise<Trip> => {
  const { data } = await apiClient.post<any>('/trips/plan', payload)
  return normalizeTrip(data)
}

// ─── Fetch trip by ID ─────────────────────────────────────────
export const fetchTrip = async (tripId: string): Promise<Trip> => {
  const { data } = await apiClient.get<any>(`/trips/${tripId}`)
  return normalizeTrip(data)
}

// ─── Fetch timeline events ────────────────────────────────────
export const fetchTimeline = async (tripId: string): Promise<ScheduleEvent[]> => {
  const { data } = await apiClient.get<any[]>(`/trips/${tripId}/timeline`)
  // Simple normalization for direct timeline fetch
  return data.map((ev: any) => ({
    ...ev,
    duration_seconds: ev.duration_seconds || (new Date(ev.end_time).getTime() - new Date(ev.start_time).getTime()) / 1000,
  }))
}

// ─── Fetch ELD daily logs ─────────────────────────────────────
export const fetchLogs = async (tripId: string): Promise<DailyLog[]> => {
  const { data } = await apiClient.get<DailyLog[]>(`/trips/${tripId}/logs`)
  return data
}

// ─── Fetch compliance report ──────────────────────────────────
export const fetchCompliance = async (tripId: string): Promise<ComplianceReport> => {
  const { data } = await apiClient.get<ComplianceReport>(`/trips/${tripId}/compliance`)
  return data
}

// ─── Update trip status ───────────────────────────────────────
export const updateTripStatus = async (
  tripId: string,
  payload: TripStatusUpdateRequest
): Promise<{ trip_id: string; status: string }> => {
  const { data } = await apiClient.patch(`/trips/${tripId}/status`, payload)
  return data
}
