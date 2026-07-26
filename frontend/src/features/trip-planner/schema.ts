import { z } from 'zod'

const coordinateSchema = z.object({
  latitude:  z.coerce.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
  longitude: z.coerce.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
})

export const tripPlanSchema = z.object({
  driver_id: z.string().uuid('Must be a valid UUID').default(() => crypto.randomUUID()),
  start_time: z.string().min(1, 'Start time is required'),
  start_location: coordinateSchema,
  pickup_location: coordinateSchema,
  dropoff_location: coordinateSchema,
  cycle_type: z.literal('70h_8d').default('70h_8d'),
  initial_hours_used: z.coerce.number().min(0).max(70).default(0),
})

export type TripPlanFormValues = z.infer<typeof tripPlanSchema>
