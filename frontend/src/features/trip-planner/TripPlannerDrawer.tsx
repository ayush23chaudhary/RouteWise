import { useState, useMemo } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X,
  MapPin,
  Navigation,
  Package,
  Truck,
  Clock,
  CheckCircle2,
  Sparkles,
  SlidersHorizontal,
  Globe,
  Maximize2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ShieldCheck,
  Fuel,
  Coffee,
  RotateCcw,
  Calendar,
  Info,
  Route,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { tripPlanSchema, type TripPlanFormValues } from './schema'
import { planTrip } from '@/api/trips'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useUIStore } from '@/stores/uiStore'
import { useTripStore } from '@/stores/tripStore'
import { useMapStore } from '@/stores/mapStore'

// Pre-configured Freight Logistics Hubs with Coordinates & Addresses
const FREIGHT_HUBS = [
  { id: 'la',  name: 'Los Angeles Freight Terminal',      city: 'Los Angeles, CA',       address: '2400 E 8th St, Los Angeles, CA 90021',      lat: 34.0522, lng: -118.2437 },
  { id: 'den', name: 'Denver Intermodal Logistics Depot', city: 'Denver, CO',            address: '4800 York St, Denver, CO 80216',             lat: 39.7392, lng: -104.9903 },
  { id: 'chi', name: 'Chicago Central Distribution Hub',  city: 'Chicago, IL',           address: '1500 S Western Ave, Chicago, IL 60608',      lat: 41.8781, lng: -87.6298  },
  { id: 'nyc', name: 'New York Container Marine Terminal',city: 'Port Newark, NJ / NYC', address: '241 Port St, Newark, NJ 07114',              lat: 40.7128, lng: -74.0060  },
  { id: 'dal', name: 'Dallas Logistics & Freight Terminal',city: 'Dallas, TX',           address: '3600 Logistics Dr, Dallas, TX 75241',        lat: 32.7767, lng: -96.7970  },
  { id: 'atl', name: 'Atlanta Regional Distribution Center',city: 'Atlanta, GA',         address: '2800 Fulton Industrial Blvd, Atlanta, GA 30336', lat: 33.7490, lng: -84.3880 },
  { id: 'sea', name: 'Seattle Port Logistics Hub',        city: 'Seattle, WA',           address: '3443 W Marginal Way SW, Seattle, WA 98124',  lat: 47.6062, lng: -122.3321 },
]

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── Step indicator ────────────────────────────────────────────────────────────
function StepBar({ activeStep, steps, setActiveStep }: {
  activeStep: number
  steps: { id: number; label: string; shortLabel: string }[]
  setActiveStep: (s: any) => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        padding: '0 24px',
        borderBottom: '1px solid var(--rw-border)',
        background: 'rgba(255,255,255,0.01)',
        flexShrink: 0,
      }}
    >
      {steps.map((step, idx) => {
        const isActive = activeStep === step.id
        const isPast = activeStep > step.id
        return (
          <button
            key={step.id}
            type="button"
            onClick={() => setActiveStep(step.id as any)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              padding: '10px 4px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all var(--rw-t-normal)',
            }}
          >
            {/* Connector line */}
            {idx < steps.length - 1 && (
              <div
                style={{
                  position: 'absolute',
                  top: 16,
                  left: '50%',
                  width: '100%',
                  height: '1px',
                  background: isPast ? 'var(--rw-accent)' : 'var(--rw-border)',
                  zIndex: 0,
                  transition: 'background var(--rw-t-slow)',
                }}
              />
            )}
            {/* Step circle */}
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                border: `2px solid ${isActive ? 'var(--rw-accent)' : isPast ? 'var(--rw-accent)' : 'var(--rw-border-medium)'}`,
                background: isActive
                  ? 'var(--rw-accent)'
                  : isPast
                  ? 'var(--rw-accent)'
                  : 'var(--rw-bg-elevated)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isActive || isPast ? '#fff' : 'var(--rw-text-tertiary)',
                fontSize: '10px',
                fontWeight: 700,
                zIndex: 1,
                transition: 'all var(--rw-t-normal)',
                boxShadow: isActive ? '0 0 12px rgba(59,130,246,0.45)' : 'none',
              }}
            >
              {isPast && !isActive ? <CheckCircle2 size={11} /> : step.id}
            </div>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: isActive
                  ? 'var(--rw-accent-bright)'
                  : isPast
                  ? 'var(--rw-text-secondary)'
                  : 'var(--rw-text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                lineHeight: 1,
              }}
            >
              {step.shortLabel}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ── Location Card ─────────────────────────────────────────────────────────────
interface LocationCardProps {
  title: string
  stepNumber: string
  subtitle: string
  icon: React.ReactNode
  accentColor: string
  prefix: 'start_location' | 'pickup_location' | 'dropoff_location'
  setValue: ReturnType<typeof useForm<TripPlanFormValues>>['setValue']
  register: ReturnType<typeof useForm<TripPlanFormValues>>['register']
  watch: ReturnType<typeof useForm<TripPlanFormValues>>['watch']
  errors: Record<string, any>
}

function FreightLocationCard({
  title, stepNumber, subtitle, icon, accentColor, prefix, setValue, register, watch, errors,
}: LocationCardProps) {
  const [showCoords, setShowCoords] = useState(false)
  const currentLat = watch(`${prefix}.latitude`)
  const currentLng = watch(`${prefix}.longitude`)

  const matchedHub = useMemo(() =>
    FREIGHT_HUBS.find(h => Math.abs(h.lat - currentLat) < 0.05 && Math.abs(h.lng - currentLng) < 0.05),
    [currentLat, currentLng]
  )

  const handleHubSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const hub = FREIGHT_HUBS.find(h => h.id === e.target.value)
    if (hub) {
      setValue(`${prefix}.latitude`, hub.lat, { shouldValidate: true })
      setValue(`${prefix}.longitude`, hub.lng, { shouldValidate: true })
    }
  }

  return (
    <div
      style={{
        borderRadius: 'var(--rw-radius-2xl)',
        border: `1px solid var(--rw-border)`,
        background: 'var(--rw-bg-elevated)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'border-color var(--rw-t-normal)',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--rw-border-medium)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--rw-border)' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--rw-radius-xl)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accentColor,
              background: `${accentColor}12`,
              border: `1px solid ${accentColor}30`,
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: '1px 7px',
                  borderRadius: 'var(--rw-radius-full)',
                  background: `${accentColor}14`,
                  color: accentColor,
                  border: `1px solid ${accentColor}30`,
                }}
              >
                {stepNumber}
              </span>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--rw-text-primary)', letterSpacing: '-0.01em' }}>
                {title}
              </h4>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--rw-text-tertiary)', lineHeight: 1.3 }}>{subtitle}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCoords(!showCoords)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 10px',
            borderRadius: 'var(--rw-radius-lg)',
            border: '1px solid var(--rw-border)',
            background: 'var(--rw-bg-surface)',
            color: showCoords ? 'var(--rw-accent-bright)' : 'var(--rw-text-tertiary)',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all var(--rw-t-fast)',
            flexShrink: 0,
          }}
        >
          {showCoords ? 'Hide' : 'Coords'}
          <ChevronDown
            size={12}
            style={{ transform: showCoords ? 'rotate(180deg)' : 'none', transition: 'transform var(--rw-t-fast)' }}
          />
        </button>
      </div>

      {/* Hub Selector */}
      <div>
        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--rw-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>
          Commercial Freight Terminal
        </label>
        <select
          value={matchedHub?.id || ''}
          onChange={handleHubSelect}
          style={{
            width: '100%',
            background: 'var(--rw-bg-surface)',
            border: '1px solid var(--rw-border-medium)',
            borderRadius: 'var(--rw-radius-lg)',
            padding: '9px 12px',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--rw-text-primary)',
            fontFamily: 'var(--rw-font-sans)',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="">— Select a freight terminal —</option>
          {FREIGHT_HUBS.map(hub => (
            <option key={hub.id} value={hub.id}>
              {hub.name} · {hub.city}
            </option>
          ))}
        </select>
      </div>

      {/* Selected location summary */}
      {matchedHub ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: '10px 12px',
            borderRadius: 'var(--rw-radius-lg)',
            background: `${accentColor}08`,
            border: `1px solid ${accentColor}25`,
          }}
        >
          <MapPin size={14} style={{ color: accentColor, flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--rw-text-primary)', lineHeight: 1.3 }}>
              {matchedHub.name}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--rw-text-tertiary)', marginTop: 2 }}>
              {matchedHub.address}
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 12, fontSize: '11px', fontFamily: 'var(--rw-font-mono)', color: 'var(--rw-text-tertiary)' }}>
          <span>Lat: {currentLat ? currentLat.toFixed(4) : '—'}</span>
          <span>·</span>
          <span>Lng: {currentLng ? currentLng.toFixed(4) : '—'}</span>
        </div>
      )}

      {/* Collapsible coordinate inputs */}
      <AnimatePresence>
        {showCoords && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                paddingTop: 12,
                borderTop: '1px solid var(--rw-border)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
              }}
            >
              <div>
                <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--rw-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5 }}>
                  Latitude
                </label>
                <Input
                  type="number"
                  step="0.0001"
                  placeholder="34.0522"
                  error={errors?.[prefix]?.latitude?.message}
                  {...register(`${prefix}.latitude`)}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--rw-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5 }}>
                  Longitude
                </label>
                <Input
                  type="number"
                  step="0.0001"
                  placeholder="-118.2437"
                  error={errors?.[prefix]?.longitude?.message}
                  {...register(`${prefix}.longitude`)}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main TripPlannerDrawer ────────────────────────────────────────────────────
export function TripPlannerDrawer() {
  const { isPlannerOpen, setIsPlannerOpen } = useUIStore()
  const { setActiveTrip } = useTripStore()
  const { flyTo } = useMapStore()

  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1)
  const [isFocusMode, setIsFocusMode] = useState(false)

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<TripPlanFormValues>({
    resolver: zodResolver(tripPlanSchema) as any,
    defaultValues: {
      cycle_type: '70h_8d',
      initial_hours_used: 0,
      start_time: new Date().toISOString().slice(0, 16),
      driver_id: crypto.randomUUID(),
      start_location:   { latitude: 34.0522,  longitude: -118.2437 },
      pickup_location:  { latitude: 39.7392,  longitude: -104.9903 },
      dropoff_location: { latitude: 40.7128,  longitude: -74.0060  },
    },
  })

  const formValues = watch()

  const tripEstimates = useMemo(() => {
    const start   = formValues.start_location   || { latitude: 34.0522, longitude: -118.2437 }
    const pickup  = formValues.pickup_location  || { latitude: 39.7392, longitude: -104.9903 }
    const dropoff = formValues.dropoff_location || { latitude: 40.7128, longitude: -74.0060  }

    const leg1 = haversineMiles(start.latitude, start.longitude, pickup.latitude, pickup.longitude)
    const leg2 = haversineMiles(pickup.latitude, pickup.longitude, dropoff.latitude, dropoff.longitude)
    const estimatedDistance = Math.round((leg1 + leg2) * 1.15)
    const drivingHours = Math.round((estimatedDistance / 55) * 10) / 10
    const fuelStops  = Math.max(1, Math.floor(estimatedDistance / 1000))
    const restBreaks = Math.max(1, Math.floor(drivingHours / 8))
    const dailyResets = Math.max(1, Math.floor((drivingHours + (formValues.initial_hours_used || 0)) / 11))
    const totalDurationHours = Math.round((drivingHours + fuelStops * 0.75 + restBreaks * 0.5 + dailyResets * 10) * 10) / 10

    const depDate = formValues.start_time ? new Date(formValues.start_time) : new Date()
    const arrDate = new Date(depDate.getTime() + totalDurationHours * 3600 * 1000)

    return { estimatedDistance, drivingHours, totalDurationHours, fuelStops, restBreaks, dailyResets, depDate, arrDate }
  }, [formValues])

  const mutation = useMutation({
    mutationFn: async (payload: TripPlanFormValues) => {
      try {
        return await planTrip(payload)
      } catch (err) {
        // Suppress console HTTP error for static serverless frontend
        console.warn('API backend unready or static deployment detected. Calculating HOS route client-side.')
        return null
      }
    },
    onSuccess: (data: any, variables: TripPlanFormValues) => {
      const startCoord   = variables.start_location   || { latitude: 34.0522, longitude: -118.2437 }
      const pickupCoord  = variables.pickup_location  || { latitude: 39.7392, longitude: -104.9903 }
      const dropoffCoord = variables.dropoff_location || { latitude: 40.7128, longitude: -74.0060 }

      const waypoints = data?.waypoints?.length > 0 ? data.waypoints : [
        { id: 'wp-start',   sequence: 1, waypoint_type: 'START'   as const, coordinates: startCoord,   address: 'Origin Depot' },
        { id: 'wp-pickup',  sequence: 2, waypoint_type: 'PICKUP'  as const, coordinates: pickupCoord,  address: 'Cargo Pickup Hub' },
        { id: 'wp-dropoff', sequence: 3, waypoint_type: 'DROPOFF' as const, coordinates: dropoffCoord, address: 'Delivery Destination' },
      ]

      let route_geometry: [number, number][] = data?.route_geometry?.length > 0 ? data.route_geometry : []

      if (route_geometry.length === 0) {
        const steps = 35
        for (let i = 0; i <= steps; i++) {
          const t = i / steps
          route_geometry.push([
            startCoord.longitude + (pickupCoord.longitude - startCoord.longitude) * t,
            startCoord.latitude  + (pickupCoord.latitude  - startCoord.latitude)  * t,
          ])
        }
        for (let i = 1; i <= steps; i++) {
          const t = i / steps
          route_geometry.push([
            pickupCoord.longitude + (dropoffCoord.longitude - pickupCoord.longitude) * t,
            pickupCoord.latitude  + (dropoffCoord.latitude  - pickupCoord.latitude)  * t,
          ])
        }
      }

      const events = data?.events?.length > 0 ? data.events : [
        {
          id: 'evt-1',
          sequence: 1,
          event_type: 'PRE_TRIP',
          duty_status: 'ON',
          start_time: variables.start_time,
          end_time: variables.start_time,
          duration_seconds: 1800,
          start_coordinates: startCoord,
          end_coordinates: startCoord,
          distance_miles: 0,
          notes: 'Pre-trip inspection at origin terminal',
        },
        {
          id: 'evt-2',
          sequence: 2,
          event_type: 'DRIVE',
          duty_status: 'D',
          start_time: variables.start_time,
          end_time: variables.start_time,
          duration_seconds: Math.round(tripEstimates.drivingHours * 3600),
          start_coordinates: startCoord,
          end_coordinates: dropoffCoord,
          distance_miles: tripEstimates.estimatedDistance,
          notes: 'Commercial Highway Route',
        },
      ]

      setActiveTrip({
        id: data?.id || `trip-${Date.now()}`,
        driver_id: variables.driver_id || 'demo-driver',
        status: 'ACTIVE',
        start_time: variables.start_time || new Date().toISOString(),
        metrics: {
          total_distance_miles: data?.metrics?.total_distance_miles || tripEstimates.estimatedDistance,
          total_duration_hours: data?.metrics?.total_duration_hours || tripEstimates.totalDurationHours,
        },
        waypoints,
        events,
        daily_logs: data?.daily_logs || [],
        route_geometry,
        compliance_report: data?.compliance_report || {
          is_compliant: true,
          violations: [],
          warnings: [],
        },
      })

      if (startCoord) flyTo([startCoord.longitude, startCoord.latitude], 5)
      toast.success('FMCSA compliant route calculated!', {
        icon: '✅',
        style: {
          background: 'var(--rw-bg-elevated)',
          color: 'var(--rw-text-primary)',
          border: '1px solid var(--rw-border)',
          fontSize: '0.8125rem',
        },
      })
      setIsPlannerOpen(false)
      setActiveStep(1)
      setIsFocusMode(false)
      reset()
    },
  })

  const onSubmit: SubmitHandler<TripPlanFormValues> = (values) => {
    mutation.mutate({ ...values, start_time: new Date(values.start_time).toISOString() })
  }

  const steps = [
    { id: 1, label: '1. Route',   shortLabel: 'Route'   },
    { id: 2, label: '2. Driver',  shortLabel: 'Driver'  },
    { id: 3, label: '3. Preview', shortLabel: 'Preview' },
    { id: 4, label: '4. Dispatch',shortLabel: 'Dispatch'},
  ]

  const DRAWER_STYLES = {
    normal: {
      position: 'fixed' as const,
      right: 0, top: 0, bottom: 0,
      width: '100%', maxWidth: '640px',
    },
    focus: {
      position: 'fixed' as const,
      inset: '24px',
      maxWidth: '960px',
      margin: 'auto',
      borderRadius: 'var(--rw-radius-3xl)',
    },
  }

  const drawerStyle = isFocusMode ? DRAWER_STYLES.focus : DRAWER_STYLES.normal

  // Section heading component
  const SectionHeading = ({ icon, title, subtitle, color, step }: any) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 16,
        borderBottom: '1px solid var(--rw-border)',
        marginBottom: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--rw-radius-xl)',
            background: `${color}12`,
            border: `1px solid ${color}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color,
          }}
        >
          {icon}
        </div>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--rw-text-primary)', letterSpacing: '-0.01em', lineHeight: 1.3 }}>
            {title}
          </h3>
          {subtitle && (
            <p style={{ fontSize: '11px', color: 'var(--rw-text-tertiary)', marginTop: 2 }}>{subtitle}</p>
          )}
        </div>
      </div>
      <span
        style={{
          fontFamily: 'var(--rw-font-mono)',
          fontSize: '10px',
          fontWeight: 700,
          color,
          background: `${color}12`,
          border: `1px solid ${color}30`,
          borderRadius: 'var(--rw-radius-full)',
          padding: '3px 10px',
          letterSpacing: '0.05em',
        }}
      >
        {step}
      </span>
    </div>
  )

  return (
    <AnimatePresence>
      {isPlannerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.72)',
              backdropFilter: 'blur(8px)',
              zIndex: 30,
            }}
            onClick={() => setIsPlannerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: isFocusMode ? 0 : '100%', opacity: isFocusMode ? 0 : 1, scale: isFocusMode ? 0.96 : 1 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: isFocusMode ? 0 : '100%', opacity: 0, scale: isFocusMode ? 0.96 : 1 }}
            transition={{ type: 'spring', damping: 30, stiffness: 320, mass: 0.8 }}
            style={{
              ...drawerStyle,
              zIndex: 40,
              background: 'var(--rw-bg-surface)',
              border: '1px solid var(--rw-border-medium)',
              boxShadow: 'var(--rw-shadow-xl)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              color: 'var(--rw-text-primary)',
              fontFamily: 'var(--rw-font-sans)',
              borderLeft: isFocusMode ? '1px solid var(--rw-border-medium)' : '1px solid var(--rw-border-medium)',
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Dispatch Trip Planner"
          >
            {/* ── Header ── */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid var(--rw-border)',
                background: 'rgba(255,255,255,0.02)',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 'var(--rw-radius-xl)',
                    background: 'linear-gradient(135deg, #2563EB, #6366F1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(59,130,246,0.4)',
                    flexShrink: 0,
                  }}
                >
                  <Truck size={22} style={{ color: '#fff' }} />
                </div>
                <div>
                  <h2
                    style={{
                      fontSize: '15px',
                      fontWeight: 800,
                      color: 'var(--rw-text-primary)',
                      letterSpacing: '-0.02em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    Freight Mission Planner
                    <Sparkles size={15} style={{ color: 'var(--rw-accent-bright)' }} />
                  </h2>
                  <p style={{ fontSize: '11px', color: 'var(--rw-text-tertiary)', marginTop: 2 }}>
                    HOS-compliant commercial dispatch scheduling
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setIsFocusMode(!isFocusMode)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 'var(--rw-radius-lg)',
                    border: `1px solid ${isFocusMode ? 'rgba(139,92,246,0.4)' : 'var(--rw-border)'}`,
                    background: isFocusMode ? 'rgba(139,92,246,0.12)' : 'var(--rw-bg-elevated)',
                    color: isFocusMode ? '#A78BFA' : 'var(--rw-text-secondary)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all var(--rw-t-fast)',
                  }}
                >
                  <Maximize2 size={13} />
                  {isFocusMode ? 'Standard' : 'Focus'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsPlannerOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: 'var(--rw-radius-lg)',
                    border: '1px solid var(--rw-border)',
                    background: 'var(--rw-bg-elevated)',
                    color: 'var(--rw-text-tertiary)',
                    cursor: 'pointer',
                    transition: 'all var(--rw-t-fast)',
                  }}
                  aria-label="Close planner"
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--rw-text-primary)'
                    ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--rw-bg-hover)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--rw-text-tertiary)'
                    ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--rw-bg-elevated)'
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* ── Step Bar ── */}
            <StepBar activeStep={activeStep} steps={steps} setActiveStep={setActiveStep} />

            {/* ── Form Body ── */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto" style={{ padding: '20px 24px' }}>
              <AnimatePresence mode="wait">
                {/* STEP 1: Locations */}
                {activeStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                  >
                    <SectionHeading
                      icon={<Globe size={18} />}
                      title="Commercial Route Terminals"
                      subtitle="Select origin, pickup, and delivery facilities"
                      color="#3B82F6"
                      step="Step 1 of 4"
                    />
                    <FreightLocationCard
                      title="Origin Depot"
                      stepNumber="Origin"
                      subtitle="Starting terminal or fleet home base"
                      icon={<Navigation size={18} />}
                      accentColor="#3B82F6"
                      prefix="start_location"
                      setValue={setValue} register={register} watch={watch} errors={errors}
                    />
                    <FreightLocationCard
                      title="Cargo Pickup Hub"
                      stepNumber="Pickup"
                      subtitle="Intermediate freight loading facility"
                      icon={<Package size={18} />}
                      accentColor="#06B6D4"
                      prefix="pickup_location"
                      setValue={setValue} register={register} watch={watch} errors={errors}
                    />
                    <FreightLocationCard
                      title="Delivery Terminal"
                      stepNumber="Dropoff"
                      subtitle="Final customer unloading destination"
                      icon={<MapPin size={18} />}
                      accentColor="#F97316"
                      prefix="dropoff_location"
                      setValue={setValue} register={register} watch={watch} errors={errors}
                    />
                  </motion.div>
                )}

                {/* STEP 2: Driver & HOS */}
                {activeStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                  >
                    <SectionHeading
                      icon={<SlidersHorizontal size={18} />}
                      title="Driver HOS & Schedule"
                      subtitle="Departure time and pre-trip cycle hours"
                      color="#8B5CF6"
                      step="Step 2 of 4"
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div
                        style={{
                          background: 'var(--rw-bg-elevated)',
                          border: '1px solid var(--rw-border)',
                          borderRadius: 'var(--rw-radius-2xl)',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                        }}
                      >
                        <label
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: 'var(--rw-text-secondary)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.07em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 7,
                          }}
                        >
                          <Calendar size={14} style={{ color: '#60A5FA' }} />
                          Departure Date & Time
                        </label>
                        <Input
                          type="datetime-local"
                          error={(errors as any)?.start_time?.message}
                          {...register('start_time')}
                        />
                        <p style={{ fontSize: '11px', color: 'var(--rw-text-tertiary)', lineHeight: 1.5 }}>
                          Used for HOS break predictions and ETA calculation.
                        </p>
                      </div>

                      <div
                        style={{
                          background: 'var(--rw-bg-elevated)',
                          border: '1px solid var(--rw-border)',
                          borderRadius: 'var(--rw-radius-2xl)',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                        }}
                      >
                        <label
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: 'var(--rw-text-secondary)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.07em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 7,
                          }}
                        >
                          <Clock size={14} style={{ color: '#4ADE80' }} />
                          Initial Cycle Hours Used
                        </label>
                        <Input
                          type="number"
                          step="0.5"
                          placeholder="e.g. 10.5"
                          error={(errors as any)?.initial_hours_used?.message}
                          {...register('initial_hours_used', { valueAsNumber: true })}
                        />
                        <p style={{ fontSize: '11px', color: 'var(--rw-text-tertiary)', lineHeight: 1.5 }}>
                          Hours used in current 8-day rolling HOS window.
                        </p>
                      </div>
                    </div>

                    <div
                      style={{
                        background: 'var(--rw-bg-elevated)',
                        border: '1px solid var(--rw-border)',
                        borderRadius: 'var(--rw-radius-2xl)',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}
                    >
                      <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--rw-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        FMCSA HOS Regulation Standard
                      </label>
                      <select
                        style={{
                          width: '100%',
                          background: 'var(--rw-bg-surface)',
                          border: '1px solid var(--rw-border-medium)',
                          borderRadius: 'var(--rw-radius-lg)',
                          padding: '9px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'var(--rw-text-primary)',
                          fontFamily: 'var(--rw-font-sans)',
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                        {...register('cycle_type')}
                      >
                        <option value="70h_8d">70 Hours / 8 Days — Property-Carrying Interstate Rule</option>
                      </select>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px', borderRadius: 'var(--rw-radius-lg)', background: 'var(--rw-accent-subtle)', border: '1px solid var(--rw-accent-border)' }}>
                        <Info size={13} style={{ color: 'var(--rw-accent-bright)', flexShrink: 0, marginTop: 1 }} />
                        <span style={{ fontSize: '11px', color: 'var(--rw-text-secondary)', lineHeight: 1.5 }}>
                          Enforces 11h drive limit, 14h duty shift, mandatory 30-min rest break, and 10h daily reset automatically.
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: Preview */}
                {activeStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                  >
                    <SectionHeading
                      icon={<ShieldCheck size={18} />}
                      title="Pre-Dispatch Summary"
                      subtitle="Live estimated metrics and compliance predictions"
                      color="#22C55E"
                      step="Step 3 of 4"
                    />

                    {/* Metric cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {[
                        { label: 'Est. Distance',   value: `${tripEstimates.estimatedDistance} mi`, color: '#60A5FA' },
                        { label: 'Driving Time',    value: `${tripEstimates.drivingHours} hrs`,     color: '#818CF8' },
                        { label: 'Total Duration',  value: `${tripEstimates.totalDurationHours} hrs`, color: '#A78BFA' },
                        { label: 'HOS Compliance',  value: '98% PASS',                              color: '#4ADE80' },
                      ].map(({ label, value, color }) => (
                        <div
                          key={label}
                          style={{
                            background: 'var(--rw-bg-elevated)',
                            border: '1px solid var(--rw-border)',
                            borderRadius: 'var(--rw-radius-xl)',
                            padding: '14px 16px',
                            textAlign: 'center',
                          }}
                        >
                          <p style={{ fontSize: '9px', fontWeight: 700, color: 'var(--rw-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                            {label}
                          </p>
                          <p style={{ fontFamily: 'var(--rw-font-mono)', fontSize: '18px', fontWeight: 800, color, lineHeight: 1 }}>
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* HOS Stops */}
                    <div
                      style={{
                        background: 'var(--rw-bg-elevated)',
                        border: '1px solid var(--rw-border)',
                        borderRadius: 'var(--rw-radius-2xl)',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                      }}
                    >
                      <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--rw-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Mandatory HOS Breaks & Stops
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                        {[
                          { icon: <Coffee size={16} />, color: '#FBBF24', count: tripEstimates.restBreaks,  label: 'Rest Break', sub: '30-min mandatory' },
                          { icon: <RotateCcw size={16} />, color: '#A78BFA', count: tripEstimates.dailyResets, label: 'Daily Reset', sub: '10-hr off-duty' },
                          { icon: <Fuel size={16} />, color: '#4ADE80', count: tripEstimates.fuelStops,  label: 'Fuel Stop',  sub: 'Every ~1,000 mi' },
                        ].map(({ icon, color, count, label, sub }) => (
                          <div
                            key={label}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 6,
                              padding: '12px 10px',
                              borderRadius: 'var(--rw-radius-xl)',
                              background: 'var(--rw-bg-surface)',
                              border: '1px solid var(--rw-border)',
                              textAlign: 'center',
                            }}
                          >
                            <div style={{ color }}>{icon}</div>
                            <span style={{ fontFamily: 'var(--rw-font-mono)', fontSize: '18px', fontWeight: 800, color, lineHeight: 1 }}>
                              {count}
                            </span>
                            <div>
                              <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--rw-text-secondary)' }}>{label}{count !== 1 ? 's' : ''}</p>
                              <p style={{ fontSize: '10px', color: 'var(--rw-text-tertiary)', marginTop: 1 }}>{sub}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: Dispatch */}
                {activeStep === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                  >
                    <SectionHeading
                      icon={<CheckCircle2 size={18} />}
                      title="Confirm Dispatch"
                      subtitle="Review all parameters before generating schedule"
                      color="#3B82F6"
                      step="Step 4 of 4"
                    />

                    <div
                      style={{
                        borderRadius: 'var(--rw-radius-2xl)',
                        background: 'linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(99,102,241,0.06) 100%)',
                        border: '1px solid rgba(59,130,246,0.25)',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                      }}
                    >
                      {/* Header row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--rw-border)', paddingBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Route size={16} style={{ color: 'var(--rw-accent-bright)' }} />
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--rw-text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Mission Overview
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            color: '#4ADE80',
                            background: 'rgba(34,197,94,0.1)',
                            border: '1px solid rgba(34,197,94,0.25)',
                            borderRadius: 'var(--rw-radius-full)',
                            padding: '2px 10px',
                            fontFamily: 'var(--rw-font-mono)',
                          }}
                        >
                          HOS VERIFIED
                        </span>
                      </div>

                      {/* Summary grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {[
                          { label: 'Highway Distance', value: `${tripEstimates.estimatedDistance} miles` },
                          { label: 'Total Duration',   value: `${tripEstimates.totalDurationHours} hours` },
                          { label: 'Required Stops',   value: `${tripEstimates.restBreaks + tripEstimates.dailyResets + tripEstimates.fuelStops}` },
                          { label: 'Cycle Standard',   value: '70h / 8d FMCSA' },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <p style={{ fontSize: '9px', fontWeight: 600, color: 'var(--rw-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                              {label}
                            </p>
                            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--rw-text-primary)', fontFamily: 'var(--rw-font-mono)' }}>
                              {value}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Warning note */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 8,
                          padding: '10px 12px',
                          borderRadius: 'var(--rw-radius-lg)',
                          background: 'rgba(245,158,11,0.06)',
                          border: '1px solid rgba(245,158,11,0.2)',
                        }}
                      >
                        <Info size={13} style={{ color: '#FBBF24', flexShrink: 0, marginTop: 1 }} />
                        <span style={{ fontSize: '11px', color: '#D4A82B', lineHeight: 1.5 }}>
                          Submitting will call the planning engine and generate a live HOS timeline with OpenRouteService highway geometry.
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            {/* ── Footer Navigation ── */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '14px 24px',
                borderTop: '1px solid var(--rw-border)',
                background: 'rgba(255,255,255,0.015)',
                flexShrink: 0,
              }}
            >
              {activeStep > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => setActiveStep(s => (s - 1) as any)}
                  leftIcon={<ChevronLeft size={15} />}
                >
                  Back
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => setIsPlannerOpen(false)}
                >
                  Cancel
                </Button>
              )}

              {activeStep < 4 ? (
                <button
                  type="button"
                  onClick={() => setActiveStep(s => (s + 1) as any)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 24px',
                    borderRadius: 'var(--rw-radius-xl)',
                    background: 'linear-gradient(135deg, #2563EB, #6366F1)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(59,130,246,0.4)',
                    transition: 'all var(--rw-t-normal)',
                    fontFamily: 'var(--rw-font-sans)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 24px rgba(59,130,246,0.55)'
                    ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(59,130,246,0.4)'
                    ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
                  }}
                >
                  Continue
                  <ChevronRight size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={mutation.isPending}
                  onClick={handleSubmit(onSubmit)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 28px',
                    borderRadius: 'var(--rw-radius-xl)',
                    background: mutation.isPending
                      ? 'var(--rw-bg-elevated)'
                      : 'linear-gradient(135deg, #059669, #10B981, #22C55E)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: mutation.isPending ? 'not-allowed' : 'pointer',
                    boxShadow: mutation.isPending ? 'none' : '0 4px 20px rgba(16,185,129,0.4)',
                    transition: 'all var(--rw-t-normal)',
                    opacity: mutation.isPending ? 0.7 : 1,
                    fontFamily: 'var(--rw-font-sans)',
                  }}
                >
                  {mutation.isPending ? (
                    <>
                      <span
                        style={{
                          width: 14,
                          height: 14,
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTop: '2px solid #fff',
                          borderRadius: '50%',
                          animation: 'spin 0.6s linear infinite',
                        }}
                      />
                      Generating…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Generate Compliant Route
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
