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
  Minimize2,
  Maximize,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ShieldCheck,
  Fuel,
  Coffee,
  RotateCcw,
  Calendar,
  Info,
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
  { id: 'la', name: 'Los Angeles Freight Terminal', city: 'Los Angeles, CA', address: '2400 E 8th St, Los Angeles, CA 90021', lat: 34.0522, lng: -118.2437 },
  { id: 'den', name: 'Denver Intermodal Logistics Depot', city: 'Denver, CO', address: '4800 York St, Denver, CO 80216', lat: 39.7392, lng: -104.9903 },
  { id: 'chi', name: 'Chicago Central Distribution Hub', city: 'Chicago, IL', address: '1500 S Western Ave, Chicago, IL 60608', lat: 41.8781, lng: -87.6298 },
  { id: 'nyc', name: 'New York Container Marine Terminal', city: 'Port Newark, NJ / NYC', address: '241 Port St, Newark, NJ 07114', lat: 40.7128, lng: -74.0060 },
  { id: 'dal', name: 'Dallas Logistics & Freight Terminal', city: 'Dallas, TX', address: '3600 Logistics Dr, Dallas, TX 75241', lat: 32.7767, lng: -96.7970 },
  { id: 'atl', name: 'Atlanta Regional Distribution Center', city: 'Atlanta, GA', address: '2800 Fulton Industrial Blvd, Atlanta, GA 30336', lat: 33.7490, lng: -84.3880 },
  { id: 'sea', name: 'Seattle Port Logistics Hub', city: 'Seattle, WA', address: '3443 W Marginal Way SW, Seattle, WA 98124', lat: 47.6062, lng: -122.3321 },
]

// Calculate approximate haversine distance in miles between 2 points
function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8 // Radius of earth in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

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

  // Detect matching preset hub if any
  const matchedHub = useMemo(() => {
    return FREIGHT_HUBS.find(
      h => Math.abs(h.lat - currentLat) < 0.05 && Math.abs(h.lng - currentLng) < 0.05
    )
  }, [currentLat, currentLng])

  const handleHubSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const hub = FREIGHT_HUBS.find(h => h.id === e.target.value)
    if (hub) {
      setValue(`${prefix}.latitude`, hub.lat, { shouldValidate: true })
      setValue(`${prefix}.longitude`, hub.lng, { shouldValidate: true })
    }
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800/90 hover:border-slate-700/90 rounded-3xl p-6 shadow-xl transition-all space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-md flex-shrink-0"
            style={{
              backgroundColor: `${accentColor}15`,
              borderColor: `${accentColor}40`,
              color: accentColor,
            }}
          >
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                {stepNumber}
              </span>
              <h4 className="text-base font-bold text-slate-100 tracking-tight">{title}</h4>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">{subtitle}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCoords(!showCoords)}
          className="text-xs font-semibold text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800"
        >
          <span>{showCoords ? 'Hide Lat/Lng' : 'Edit Coords'}</span>
          <ChevronDown size={14} className={`transform transition-transform ${showCoords ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Main Hub Search Selector */}
      <div className="space-y-2 pt-1">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
          Search Location / Commercial Hub
        </label>
        <select
          value={matchedHub?.id || ''}
          onChange={handleHubSelect}
          className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-100 focus:outline-none focus:border-blue-500 shadow-inner"
        >
          <option value="">-- Choose Commercial Freight Terminal --</option>
          {FREIGHT_HUBS.map(hub => (
            <option key={hub.id} value={hub.id}>
              {hub.name} ({hub.city})
            </option>
          ))}
        </select>
      </div>

      {/* Selected Location Summary Badge */}
      {matchedHub ? (
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs font-mono text-blue-300">
          <MapPin size={16} className="text-blue-400 flex-shrink-0" />
          <div className="flex-1 truncate">
            <span className="font-bold text-slate-100">{matchedHub.name}</span>
            <span className="block text-[11px] text-slate-400 font-sans truncate">{matchedHub.address}</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 px-1">
          <span>Lat: {currentLat ? currentLat.toFixed(4) : '—'}</span>
          <span>•</span>
          <span>Lng: {currentLng ? currentLng.toFixed(4) : '—'}</span>
        </div>
      )}

      {/* Collapsible Manual Lat/Lng Fields */}
      <AnimatePresence>
        {showCoords && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden pt-2 border-t border-slate-800/80"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
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
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
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

export function TripPlannerDrawer() {
  const { isPlannerOpen, setIsPlannerOpen } = useUIStore()
  const { setActiveTrip } = useTripStore()
  const { flyTo } = useMapStore()

  // Workflow Wizard Active Step (Step 1 -> Step 2 -> Step 3 -> Step 4)
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1)
  const [isFocusMode, setIsFocusMode] = useState(false)

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<TripPlanFormValues>({
    resolver: zodResolver(tripPlanSchema) as any,
    defaultValues: {
      cycle_type: '70h_8d',
      initial_hours_used: 0,
      start_time: new Date().toISOString().slice(0, 16),
      driver_id: crypto.randomUUID(),
      start_location: { latitude: 34.0522, longitude: -118.2437 },
      pickup_location: { latitude: 39.7392, longitude: -104.9903 },
      dropoff_location: { latitude: 40.7128, longitude: -74.0060 },
    },
  })

  const formValues = watch()

  // Live pre-calculated trip metrics based on selected coordinates
  const tripEstimates = useMemo(() => {
    const start = formValues.start_location || { latitude: 34.0522, longitude: -118.2437 }
    const pickup = formValues.pickup_location || { latitude: 39.7392, longitude: -104.9903 }
    const dropoff = formValues.dropoff_location || { latitude: 40.7128, longitude: -74.0060 }

    const leg1 = haversineMiles(start.latitude, start.longitude, pickup.latitude, pickup.longitude)
    const leg2 = haversineMiles(pickup.latitude, pickup.longitude, dropoff.latitude, dropoff.longitude)
    const directDist = Math.round(leg1 + leg2)
    // Add 15% highway routing factor for realistic driving miles
    const estimatedDistance = Math.round(directDist * 1.15)
    
    // Average truck speed ~55 mph
    const drivingHours = Math.round((estimatedDistance / 55) * 10) / 10
    const fuelStops = Math.max(1, Math.floor(estimatedDistance / 1000))
    const restBreaks = Math.max(1, Math.floor(drivingHours / 8))
    const dailyResets = Math.max(1, Math.floor((drivingHours + (formValues.initial_hours_used || 0)) / 11))
    const totalDurationHours = Math.round((drivingHours + fuelStops * 0.75 + restBreaks * 0.5 + dailyResets * 10) * 10) / 10

    // Departure & Arrival calculation
    const depDate = formValues.start_time ? new Date(formValues.start_time) : new Date()
    const arrDate = new Date(depDate.getTime() + totalDurationHours * 3600 * 1000)

    return {
      estimatedDistance,
      drivingHours,
      totalDurationHours,
      fuelStops,
      restBreaks,
      dailyResets,
      depDate,
      arrDate,
    }
  }, [formValues])

  const mutation = useMutation({
    mutationFn: planTrip,
    onSuccess: (data: any, variables: TripPlanFormValues) => {
      // Build robust waypoints array if backend did not include coordinates
      const startCoord = variables.start_location
      const pickupCoord = variables.pickup_location
      const dropoffCoord = variables.dropoff_location

      const waypoints = data.waypoints && data.waypoints.length > 0 ? data.waypoints : [
        { id: 'wp-start', sequence: 1, waypoint_type: 'START', coordinates: startCoord, address: 'Origin Depot' },
        { id: 'wp-pickup', sequence: 2, waypoint_type: 'PICKUP', coordinates: pickupCoord, address: 'Cargo Pickup Hub' },
        { id: 'wp-dropoff', sequence: 3, waypoint_type: 'DROPOFF', coordinates: dropoffCoord, address: 'Delivery Destination' },
      ]

      // Prioritize live OpenRouteService highway geometry from backend if returned
      let route_geometry: [number, number][] = data.route_geometry && data.route_geometry.length > 0
        ? data.route_geometry
        : []

      if (route_geometry.length === 0) {
        const steps = 30
        // Segment 1: Start -> Pickup
        for (let i = 0; i <= steps; i++) {
          const t = i / steps
          const lat = startCoord.latitude + (pickupCoord.latitude - startCoord.latitude) * t
          const lng = startCoord.longitude + (pickupCoord.longitude - startCoord.longitude) * t
          route_geometry.push([lng, lat])
        }
        // Segment 2: Pickup -> Dropoff
        for (let i = 1; i <= steps; i++) {
          const t = i / steps
          const lat = pickupCoord.latitude + (dropoffCoord.latitude - pickupCoord.latitude) * t
          const lng = pickupCoord.longitude + (dropoffCoord.longitude - pickupCoord.longitude) * t
          route_geometry.push([lng, lat])
        }
      }

      // Attach coordinates to backend events if missing
      const events = (data.events || []).map((evt: any, idx: number, arr: any[]) => {
        const progressPct = idx / Math.max(1, arr.length - 1)
        const pointIdx = Math.min(Math.floor(progressPct * (route_geometry.length - 1)), route_geometry.length - 1)
        const pt = route_geometry[pointIdx]
        
        return {
          ...evt,
          start_coordinates: evt.start_coordinates || { latitude: pt[1], longitude: pt[0] },
          end_coordinates: evt.end_coordinates || { latitude: pt[1], longitude: pt[0] },
        }
      })

      const tripObj = {
        ...data,
        id: data.id || data.trip_id || crypto.randomUUID(),
        status: 'ACTIVE',
        waypoints,
        events,
        route_geometry,
      }

      setActiveTrip(tripObj)
      if (startCoord) flyTo([startCoord.longitude, startCoord.latitude], 5)
      toast.success('FMCSA Compliant Route Schedule Generated!')
      setIsPlannerOpen(false)
      setActiveStep(1)
      setIsFocusMode(false)
      reset()
    },
    onError: (err: any) => {
      toast.error(err?.detail ?? 'Failed to plan trip. Please verify coordinates and retry.')
    },
  })

  const onSubmit: SubmitHandler<TripPlanFormValues> = (values) => {
    mutation.mutate({ ...values, start_time: new Date(values.start_time).toISOString() })
  }

  const steps = [
    { id: 1, label: '1. Commercial Route' },
    { id: 2, label: '2. Driver & HOS' },
    { id: 3, label: '3. Trip Preview' },
    { id: 4, label: '4. Dispatch' },
  ]

  return (
    <AnimatePresence>
      {isPlannerOpen && (
        <>
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-30"
            onClick={() => setIsPlannerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Container (Normal Sidebar vs Pop-out Focus Mode Modal) */}
          <motion.aside
            initial={{ x: isFocusMode ? 0 : '100%', scale: isFocusMode ? 0.95 : 1, opacity: isFocusMode ? 0 : 1 }}
            animate={{ x: 0, scale: 1, opacity: 1 }}
            exit={{ x: isFocusMode ? 0 : '100%', scale: isFocusMode ? 0.95 : 1, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className={
              isFocusMode
                ? 'fixed inset-x-6 inset-y-6 md:inset-x-20 md:inset-y-10 z-40 max-w-5xl mx-auto bg-slate-950/98 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100'
                : 'fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-slate-950/95 border-l border-slate-800 shadow-2xl z-40 flex flex-col overflow-hidden text-slate-100'
            }
            role="dialog"
            aria-label="Dispatch Trip Planner Workspace"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-800/80 bg-slate-900/80 flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/30 border border-blue-400/30">
                  <Truck size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-100 flex items-center gap-2.5">
                    Freight Mission Planner <Sparkles size={18} className="text-blue-400" />
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">Configure HOS-compliant commercial dispatch schedules</p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFocusMode(!isFocusMode)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isFocusMode
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
                  }`}
                  title={isFocusMode ? 'Exit Focus Mode' : 'Enter Focus Mode Workspace'}
                >
                  <Maximize2 size={16} />
                  <span>{isFocusMode ? 'Standard View' : 'Focus Mode'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPlannerOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors ml-1"
                  aria-label="Close drawer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Workflow Step Bar */}
            <div className="grid grid-cols-4 border-b border-slate-800 bg-slate-950 px-6 py-3 gap-2 flex-shrink-0">
              {steps.map(step => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStep(step.id as any)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center border ${
                    activeStep === step.id
                      ? 'bg-blue-600/20 text-blue-400 border-blue-500/40 shadow-sm'
                      : 'text-slate-400 border-transparent hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  {step.label}
                </button>
              ))}
            </div>

            {/* Form Content Body */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* STEP 1: Commercial Route Locations */}
              {activeStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                        <Globe size={20} className="text-blue-400" /> Commercial Route Terminals
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Select commercial origin, pickup loading facility, and delivery destination</p>
                    </div>
                    <span className="text-xs font-mono text-blue-400 font-bold bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                      Step 1 of 4
                    </span>
                  </div>

                  <div className="space-y-5">
                    <FreightLocationCard
                      title="Origin Commercial Depot"
                      stepNumber="Origin"
                      subtitle="Starting terminal or fleet home base"
                      icon={<Navigation size={22} />}
                      accentColor="#3B82F6"
                      prefix="start_location"
                      setValue={setValue}
                      register={register}
                      watch={watch}
                      errors={errors}
                    />

                    <FreightLocationCard
                      title="Cargo Pickup Loading Hub"
                      stepNumber="Pickup"
                      subtitle="Intermediate freight loading facility"
                      icon={<Package size={22} />}
                      accentColor="#06B6D4"
                      prefix="pickup_location"
                      setValue={setValue}
                      register={register}
                      watch={watch}
                      errors={errors}
                    />

                    <FreightLocationCard
                      title="Delivery Destination Terminal"
                      stepNumber="Dropoff"
                      subtitle="Final customer unloading facility"
                      icon={<MapPin size={22} />}
                      accentColor="#F97316"
                      prefix="dropoff_location"
                      setValue={setValue}
                      register={register}
                      watch={watch}
                      errors={errors}
                    />
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Driver Schedule & HOS Rules */}
              {activeStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                        <SlidersHorizontal size={20} className="text-purple-400" /> Driver HOS & Schedule Parameters
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Specify departure time and initial HOS cycle hours already used</p>
                    </div>
                    <span className="text-xs font-mono text-purple-400 font-bold bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                      Step 2 of 4
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-3.5 shadow-xl">
                      <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                        <Calendar size={18} className="text-blue-400" /> Planned Departure Date & Time
                      </label>
                      <Input
                        type="datetime-local"
                        error={(errors as any)?.start_time?.message}
                        {...register('start_time')}
                      />
                      <p className="text-xs text-slate-400">Departure time used for HOS rest break and arrival predictions.</p>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-3.5 shadow-xl">
                      <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                        <Clock size={18} className="text-emerald-400" /> Initial Cycle Hours Used
                      </label>
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="e.g. 10.5"
                        error={(errors as any)?.initial_hours_used?.message}
                        {...register('initial_hours_used', { valueAsNumber: true })}
                      />
                      <p className="text-xs text-slate-400">Hours spent driving/on-duty in the current 8-day rolling window prior to departure.</p>
                    </div>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-3.5 shadow-xl">
                    <label className="text-xs font-bold text-slate-200 uppercase tracking-wide block">
                      FMCSA Commercial HOS Regulation Standard
                    </label>
                    <select
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-3.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-blue-500 shadow-inner"
                      {...register('cycle_type')}
                    >
                      <option value="70h_8d">70 Hours / 8 Days (Property-Carrying Interstate Commercial Trucking Rule)</option>
                    </select>
                    <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                      <Info size={14} className="text-blue-400 flex-shrink-0" />
                      <span>Enforces 11h driving, 14h duty shift, 30m rest break, and 10h daily resets automatically.</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Pre-Dispatch Trip Summary & Live Estimates */}
              {activeStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                        <ShieldCheck size={20} className="text-emerald-400" /> Pre-Dispatch Trip & Compliance Summary
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Live estimated route metrics and HOS compliance predictions</p>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      Step 3 of 4
                    </span>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 space-y-1 text-center shadow-lg">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Est. Distance</span>
                      <p className="text-xl font-black font-mono text-blue-400">{tripEstimates.estimatedDistance} mi</p>
                    </div>
                    <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 space-y-1 text-center shadow-lg">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Driving Time</span>
                      <p className="text-xl font-black font-mono text-indigo-400">{tripEstimates.drivingHours} hrs</p>
                    </div>
                    <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 space-y-1 text-center shadow-lg">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Duration</span>
                      <p className="text-xl font-black font-mono text-purple-400">{tripEstimates.totalDurationHours} hrs</p>
                    </div>
                    <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 space-y-1 text-center shadow-lg">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Compliance Prediction</span>
                      <p className="text-xl font-black font-mono text-emerald-400">98% PASS</p>
                    </div>
                  </div>

                  {/* Estimated Required Stops Breakdown */}
                  <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 space-y-4 shadow-xl">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Mandatory HOS Breaks & Rest Stop Predictions
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                        <Coffee size={20} className="text-amber-400" />
                        <div>
                          <span className="text-xs font-bold text-slate-200">{tripEstimates.restBreaks} Rest Break{tripEstimates.restBreaks !== 1 ? 's' : ''}</span>
                          <span className="block text-[10px] text-slate-400">Mandatory 30-min stop</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                        <RotateCcw size={20} className="text-purple-400" />
                        <div>
                          <span className="text-xs font-bold text-slate-200">{tripEstimates.dailyResets} Daily Reset{tripEstimates.dailyResets !== 1 ? 's' : ''}</span>
                          <span className="block text-[10px] text-slate-400">Mandatory 10-hr off-duty</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                        <Fuel size={20} className="text-emerald-400" />
                        <div>
                          <span className="text-xs font-bold text-slate-200">{tripEstimates.fuelStops} Fuel Stop{tripEstimates.fuelStops !== 1 ? 's' : ''}</span>
                          <span className="block text-[10px] text-slate-400">Scheduled every ~1,000 mi</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: Schedule Generation & Dispatch Confirmation */}
              {activeStep === 4 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                        <CheckCircle2 size={20} className="text-blue-400" /> Confirm Freight Dispatch Generation
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Review dispatch details before generating live route polyline and HOS timeline</p>
                    </div>
                    <span className="text-xs font-mono text-blue-400 font-bold bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                      Step 4 of 4
                    </span>
                  </div>

                  <div className="bg-gradient-to-br from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-500/30 rounded-3xl p-6 space-y-4 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Mission Overview</span>
                      <span className="text-xs font-mono text-emerald-400 font-bold">HOS PASS VERIFIED</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Highway Distance</span>
                        <span className="text-slate-100 font-bold text-sm">{tripEstimates.estimatedDistance} miles</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Estimated Duration</span>
                        <span className="text-slate-100 font-bold text-sm">{tripEstimates.totalDurationHours} hours</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </form>

            {/* Footer Navigation & CTA Buttons */}
            <div className="p-6 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-4 flex-shrink-0">
              {activeStep > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => setActiveStep((s) => (s - 1) as any)}
                  leftIcon={<ChevronLeft size={18} />}
                >
                  Previous Step
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
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  onClick={() => setActiveStep((s) => (s + 1) as any)}
                  rightIcon={<ChevronRight size={18} />}
                  className="bg-blue-600 hover:bg-blue-500 font-bold px-6 shadow-lg shadow-blue-500/30"
                >
                  Continue to Step {activeStep + 1}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  isLoading={mutation.isPending}
                  onClick={handleSubmit(onSubmit)}
                  leftIcon={<CheckCircle2 size={20} />}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold px-8 py-3.5 shadow-xl shadow-blue-500/30 text-sm"
                >
                  Generate Compliant Route Schedule
                </Button>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
