import { apiClient } from './client'
import type {
  Trip,
  TripPlanRequest,
  ScheduleEvent,
  DailyLog,
  ComplianceReport,
  TripStatusUpdateRequest,
} from './types'

// ─── Plan new trip ────────────────────────────────────────────
export const planTrip = async (payload: TripPlanRequest): Promise<Trip> => {
  const { data } = await apiClient.post<Trip>('/trips/plan', payload)
  return data
}

// ─── Fetch trip by ID ─────────────────────────────────────────
export const fetchTrip = async (tripId: string): Promise<Trip> => {
  const { data } = await apiClient.get<Trip>(`/trips/${tripId}`)
  return data
}

// ─── Fetch timeline events ────────────────────────────────────
export const fetchTimeline = async (tripId: string): Promise<ScheduleEvent[]> => {
  const { data } = await apiClient.get<ScheduleEvent[]>(`/trips/${tripId}/timeline`)
  return data
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
