// ─── Shared ──────────────────────────────────────────────────
export interface Coordinates {
  latitude: number
  longitude: number
}

export interface ProblemDetails {
  type: string
  title: string
  status: number
  detail: string
  instance: string
  correlation_id: string
  invalid_params?: Record<string, string[]>
}

// ─── Trip Planning ────────────────────────────────────────────
export interface TripPlanRequest {
  driver_id: string
  start_time: string          // ISO 8601
  start_location: Coordinates
  pickup_location: Coordinates
  dropoff_location: Coordinates
  cycle_type: '70h_8d'
  initial_hours_used?: number
}

export type TripStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

export type EventType =
  | 'PRE_TRIP'
  | 'DRIVE'
  | 'REST_BREAK'
  | 'DAILY_RESET'
  | 'RESTART_34H'
  | 'FUEL_STOP'
  | 'PICKUP'
  | 'DROPOFF'

export type DutyStatus = 'OFF' | 'SB' | 'D' | 'ON'

export interface Waypoint {
  id: string
  sequence: number
  waypoint_type: 'START' | 'PICKUP' | 'DROPOFF'
  coordinates: Coordinates
  duration_seconds: number
}

export interface ScheduleEvent {
  id: string
  sequence: number
  event_type: EventType
  duty_status: DutyStatus
  start_time: string
  end_time: string
  duration_seconds: number
  start_coordinates: Coordinates
  end_coordinates: Coordinates
  distance_miles: number
  notes?: string
}

export interface TripMetrics {
  total_distance_miles: number
  total_duration_hours: number
}

export interface Trip {
  id: string
  driver_id: string
  status: TripStatus
  start_time: string
  metrics: TripMetrics
  waypoints: Waypoint[]
  events: ScheduleEvent[]
  daily_logs: DailyLog[]
  compliance_report?: ComplianceReport
  route_geometry?: [number, number][]
}


// ─── ELD Logs ────────────────────────────────────────────────
export interface DailyLog {
  id: string
  log_date: string            // YYYY-MM-DD
  off_duty_seconds: number
  sleeper_berth_seconds: number
  driving_seconds: number
  on_duty_seconds: number
  grid_intervals: DutyStatus[]  // Exactly 96 items
}

// ─── Compliance ───────────────────────────────────────────────
export interface ComplianceReport {
  is_compliant: boolean
  violations: string[]
  warnings?: string[]
}

// ─── Status Update ────────────────────────────────────────────
export interface TripStatusUpdateRequest {
  status: TripStatus
}

// ─── Health ───────────────────────────────────────────────────
export interface HealthResponse {
  status: 'healthy'
  service: string
  timestamp: number
}
