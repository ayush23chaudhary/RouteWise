import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useTripStore } from '@/stores/tripStore'
import { MapEmptyState } from './MapEmptyState'
import type { ScheduleEvent, Waypoint } from '@/api/types'
import { Layers, Map as MapIcon, Moon, Sun } from 'lucide-react'

// Token handling
const CUSTOM_TOKEN = (import.meta as any).env?.VITE_MAPBOX_ACCESS_TOKEN
const HAS_CUSTOM_TOKEN = Boolean(CUSTOM_TOKEN && CUSTOM_TOKEN.trim().startsWith('pk.'))

if (HAS_CUSTOM_TOKEN) {
  mapboxgl.accessToken = CUSTOM_TOKEN.trim()
}

// A provider-independent fallback keeps the workspace usable when a Mapbox
// token is revoked, URL-restricted, or temporarily unavailable.
const FALLBACK_STYLE = {
  version: 8 as const,
  sources: {
    'carto-dark': {
      type: 'raster' as const,
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      ],
      tileSize: 256,
      attribution: '&copy; CARTO &copy; OpenStreetMap',
    },
  },
  layers: [{ id: 'carto-dark-layer', type: 'raster' as const, source: 'carto-dark' }],
}

// Map styles with fail-safe raster tile objects for non-key or invalid token environments
const MAPBOX_VECTOR_STYLES = [
  { id: 'light', label: 'Light Streets', url: 'mapbox://styles/mapbox/streets-v12', icon: Sun },
  { id: 'dark', label: 'Dark Logistics', url: 'mapbox://styles/mapbox/dark-v11', icon: Moon },
  { id: 'satellite', label: 'Satellite Hybrid', url: 'mapbox://styles/mapbox/satellite-streets-v12', icon: Layers },
  { id: 'navigation', label: 'Nav Night', url: 'mapbox://styles/mapbox/navigation-night-v1', icon: MapIcon },
]

const RASTER_STYLES = [
  {
    id: 'dark',
    label: 'Dark Logistics',
    url: {
      version: 8,
      sources: {
        'carto-dark': {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          ],
          tileSize: 256,
          attribution: '&copy; CARTO &copy; OpenStreetMap',
        },
      },
      layers: [{ id: 'carto-dark-layer', type: 'raster', source: 'carto-dark' }],
    },
    icon: Moon,
  },
  {
    id: 'voyager',
    label: 'Voyager Vector',
    url: {
      version: 8,
      sources: {
        'carto-voyager': {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
            'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
            'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
            'https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
          ],
          tileSize: 256,
          attribution: '&copy; CARTO &copy; OpenStreetMap',
        },
      },
      layers: [{ id: 'carto-voyager-layer', type: 'raster', source: 'carto-voyager' }],
    },
    icon: MapIcon,
  },
  {
    id: 'osm',
    label: 'OpenStreetMap',
    url: {
      version: 8,
      sources: {
        'osm-tiles': {
          type: 'raster',
          tiles: [
            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
          ],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap contributors',
        },
      },
      layers: [{ id: 'osm-layer', type: 'raster', source: 'osm-tiles' }],
    },
    icon: Layers,
  },
]

const INITIAL_STYLES = HAS_CUSTOM_TOKEN ? MAPBOX_VECTOR_STYLES : RASTER_STYLES


const EVENT_CONFIG: Record<string, { color: string; label: string; iconSvg: string }> = {
  START: {
    color: '#22C55E',
    label: 'Origin Start',
    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`,
  },
  PICKUP: {
    color: '#06B6D4',
    label: 'Cargo Pickup',
    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`,
  },
  DROPOFF: {
    color: '#F97316',
    label: 'Cargo Dropoff',
    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  },
  FUEL_STOP: {
    color: '#10B981',
    label: 'Fuel Stop',
    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 22V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v18M13 10h4a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9l-3-3"/></svg>`,
  },
  REST_BREAK: {
    color: '#F59E0B',
    label: '30-Min Rest Break',
    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  },
  DAILY_RESET: {
    color: '#8B5CF6',
    label: '10-Hour Reset',
    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 4v6h6M22 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L2 10m20 4l-3.64 4.36A9 9 0 0 1 3.51 15"/></svg>`,
  },
  RESTART_34H: {
    color: '#6366F1',
    label: '34-Hour Restart',
    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`,
  },
  PRE_TRIP: {
    color: '#38BDF8',
    label: 'Pre-Trip Inspection',
    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
  },
  VIOLATION: {
    color: '#EF4444',
    label: 'HOS Violation',
    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  },
}

function createMarkerElement(type: string, isSelected: boolean = false): HTMLElement {
  const config = EVENT_CONFIG[type] || { color: '#3B82F6', label: type, iconSvg: '' }
  const el = document.createElement('div')
  el.className = 'group relative cursor-pointer'

  const ringGlow = isSelected ? `box-shadow: 0 0 24px ${config.color}, 0 0 12px rgba(255,255,255,0.9);` : `box-shadow: 0 0 12px ${config.color}90;`

  el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;position:relative">
      <div style="background:${config.color}; ${ringGlow} width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#FFF; border:2.5px solid #FFFFFF; transition:transform 0.2s">
        ${config.iconSvg}
      </div>
    </div>
  `
  return el
}

function createTruckElement() {
  const el = document.createElement('div')
  el.className = 'truck-marker-el'
  el.innerHTML = `
    <div style="position:relative; width:44px; height:44px; display:flex; align-items:center; justify-content:center;">
      <div style="position:absolute; inset:0; background:rgba(59,130,246,0.3); border-radius:50%; animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
      <div style="background:linear-gradient(135deg, #3B82F6, #1D4ED8); width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#FFF; border:2.5px solid #FFFFFF; box-shadow:0 0 20px rgba(59,130,246,0.9);">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="1" y="3" width="15" height="13"></rect>
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
          <circle cx="5.5" cy="18.5" r="2.5"></circle>
          <circle cx="18.5" cy="18.5" r="2.5"></circle>
        </svg>
      </div>
    </div>
  `
  return el
}

export function MapWorkspace() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const truckMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const activePopupRef = useRef<mapboxgl.Popup | null>(null)
  const hasAppliedFallback = useRef(false)


  const { activeTrip, selectedEventId, setSelectedEvent } = useTripStore()
  const [mapLoaded, setMapLoaded] = useState(false)
  const [isUsingFallback, setIsUsingFallback] = useState(!HAS_CUSTOM_TOKEN)

  const activeStyles = isUsingFallback ? RASTER_STYLES : MAPBOX_VECTOR_STYLES
  const [currentStyleId, setCurrentStyleId] = useState(activeStyles[0].id)

  // 1. Initialize Mapbox Instance & Container Resize Observer
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    const initialStyleObj = activeStyles.find(s => s.id === currentStyleId) || activeStyles[0]

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: initialStyleObj.url as any,
      center: [-98.5795, 39.8283],
      zoom: 4.2,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
      logoPosition: 'bottom-left',
    })

    const mapInstance = map.current

    mapInstance.addControl(new mapboxgl.NavigationControl({ showCompass: true, visualizePitch: true }), 'bottom-right')
    mapInstance.addControl(new mapboxgl.ScaleControl({ unit: 'imperial' }), 'bottom-left')

    mapInstance.on('load', () => {
      setMapLoaded(true)
      mapInstance.resize()
    })

    mapInstance.on('error', (event) => {
      const message = event.error?.message ?? 'Unknown Mapbox error'
      console.error('Map basemap failed to load:', message)

      // Fall back to reliable raster tiles if custom Mapbox token fails
      if (!hasAppliedFallback.current && HAS_CUSTOM_TOKEN) {
        hasAppliedFallback.current = true
        setIsUsingFallback(true)
        setMapLoaded(false)
        setCurrentStyleId(RASTER_STYLES[0].id)
        mapInstance.setStyle(FALLBACK_STYLE as mapboxgl.StyleSpecification)
        mapInstance.once('style.load', () => {
          setMapLoaded(true)
          mapInstance.resize()
        })
      }
    })

    // Setup ResizeObserver to keep canvas sized accurately when panels open/close
    const resizeObserver = new ResizeObserver(() => {
      mapInstance.resize()
    })
    resizeObserver.observe(mapContainer.current)

    // Trigger initial resize after first frame tick
    requestAnimationFrame(() => {
      mapInstance.resize()
    })

    return () => {
      resizeObserver.disconnect()
      map.current?.remove()
      map.current = null
    }
  }, [])

  // 2. Change Map Style
  const switchMapStyle = (styleId: string) => {
    setCurrentStyleId(styleId)
    const currentStylesList = isUsingFallback ? RASTER_STYLES : MAPBOX_VECTOR_STYLES
    const targetStyle = currentStylesList.find(s => s.id === styleId) || RASTER_STYLES.find(s => s.id === styleId)
    if (map.current && targetStyle) {
      setMapLoaded(false)
      map.current.setStyle(targetStyle.url as any)
      map.current.once('style.load', () => {
        setMapLoaded(true)
        map.current?.resize()
      })
    }
  }


  // 3. Render Polyline & Enterprise Markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    // Clear existing markers & popups
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []
    if (activePopupRef.current) activePopupRef.current.remove()

    // Remove existing route layers/sources
    if (map.current.getLayer('route-line-glow')) map.current.removeLayer('route-line-glow')
    if (map.current.getLayer('route-line-core')) map.current.removeLayer('route-line-core')
    if (map.current.getSource('route-source')) map.current.removeSource('route-source')

    if (!activeTrip) return

    const events = activeTrip.events ?? []
    const waypoints = activeTrip.waypoints ?? []
    const driveEvents = events.filter(e => e.event_type === 'DRIVE' && e.start_coordinates && e.end_coordinates)

    const coords: [number, number][] = (activeTrip.route_geometry && activeTrip.route_geometry.length > 0)
      ? activeTrip.route_geometry
      : waypoints.filter(w => w.coordinates).map(w => [w.coordinates.longitude, w.coordinates.latitude] as [number, number])

    // Build GeoJSON route feature
    if (coords.length > 0) {
      map.current.addSource('route-source', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: coords },
          properties: {},
        },
      })



      // Outer Glowing Line
      map.current.addLayer({
        id: 'route-line-glow',
        type: 'line',
        source: 'route-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#2563EB',
          'line-width': 10,
          'line-opacity': 0.45,
          'line-blur': 3,
        },
      })

      // Inner Crisp Polyline
      map.current.addLayer({
        id: 'route-line-core',
        type: 'line',
        source: 'route-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#60A5FA',
          'line-width': 4.5,
          'line-opacity': 0.95,
        },
      })
    }

    // Add Waypoint Markers
    waypoints.forEach((wp: Waypoint) => {
      if (!wp?.coordinates) return
      const isSelected = selectedEventId === wp.id
      const markerEl = createMarkerElement(wp.waypoint_type, isSelected)

      const config = EVENT_CONFIG[wp.waypoint_type] || { color: '#3B82F6', label: wp.waypoint_type }

      const popupHtml = `
        <div style="font-family:Inter,sans-serif;background:#0F172A;color:#F8FAFC;border:1px solid #334155;border-radius:12px;padding:12px;min-width:200px;box-shadow:0 12px 32px rgba(0,0,0,0.6)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <span style="background:${config.color}25;color:${config.color};font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;text-transform:uppercase;letter-spacing:0.05em;border:1px solid ${config.color}50">
              ${wp.waypoint_type}
            </span>
            <span style="font-size:10px;color:#94A3B8;font-family:JetBrains Mono,monospace">Waypoint</span>
          </div>
          <div style="font-size:13px;font-weight:700;color:#F1F5F9;margin-bottom:4px">${(wp as any).address || 'Logistics Location'}</div>
          <div style="font-size:11px;color:#94A3B8;font-family:JetBrains Mono,monospace">${wp.coordinates.latitude.toFixed(4)}, ${wp.coordinates.longitude.toFixed(4)}</div>
        </div>
      `

      const popup = new mapboxgl.Popup({ offset: 20, closeButton: false }).setHTML(popupHtml)

      const marker = new mapboxgl.Marker({ element: markerEl, anchor: 'center' })
        .setLngLat([wp.coordinates.longitude, wp.coordinates.latitude])
        .setPopup(popup)
        .addTo(map.current!)

      markerEl.addEventListener('click', () => {
        if (wp.id) setSelectedEvent(wp.id)
      })

      markersRef.current.push(marker)
    })

    // Add Schedule Event Markers (Fuel, Breaks, Resets)
    events
      .filter(e => e.event_type !== 'DRIVE' && e.start_coordinates)
      .forEach(e => {
        const isSelected = selectedEventId === e.id
        const markerEl = createMarkerElement(e.event_type, isSelected)
        const config = EVENT_CONFIG[e.event_type] || { color: '#3B82F6', label: e.event_type }

        const durationHrs = (e as any).duration_hours || (e.duration_seconds ? e.duration_seconds / 3600 : 0)

        const popupHtml = `
          <div style="font-family:Inter,sans-serif;background:#0F172A;color:#F8FAFC;border:1px solid #334155;border-radius:12px;padding:12px;min-width:220px;box-shadow:0 12px 32px rgba(0,0,0,0.6)">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
              <span style="background:${config.color}25;color:${config.color};font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;text-transform:uppercase;letter-spacing:0.05em;border:1px solid ${config.color}50">
                ${config.label}
              </span>
              <span style="font-size:11px;font-weight:700;color:#60A5FA;font-family:JetBrains Mono,monospace">${durationHrs.toFixed(1)}h</span>
            </div>
            <div style="font-size:12px;color:#CBD5E1;margin-bottom:6px;line-height:1.4">${e.notes || 'HOS Scheduled Activity'}</div>
            <div style="display:grid;grid-template-cols:1fr 1fr;gap:6px;border-t:1px solid #1E293B;padding-top:6px;font-size:10px;color:#94A3B8 font-family:JetBrains Mono,monospace">
              <div>Duty: <strong style="color:#F1F5F9">${e.duty_status || 'ON'}</strong></div>
              <div>Dist: <strong style="color:#F1F5F9">${(e.distance_miles || 0).toFixed(0)} mi</strong></div>
            </div>
          </div>
        `

        const popup = new mapboxgl.Popup({ offset: 20, closeButton: false }).setHTML(popupHtml)

        const marker = new mapboxgl.Marker({ element: markerEl, anchor: 'center' })
          .setLngLat([e.start_coordinates.longitude, e.start_coordinates.latitude])
          .setPopup(popup)
          .addTo(map.current!)

        markerEl.addEventListener('click', () => {
          setSelectedEvent(e.id)
        })

        if (isSelected) {
          activePopupRef.current = popup
          popup.addTo(map.current!)
        }

        markersRef.current.push(marker)
      })

    // Animated Truck Vehicle Simulation along Highway Polyline
    let animFrameId: number | null = null
    if (driveEvents.length > 0 && coords.length > 1) {
      if (truckMarkerRef.current) truckMarkerRef.current.remove()

      const truckEl = createTruckElement()
      const truckMarker = new mapboxgl.Marker({ element: truckEl, anchor: 'center' })
        .setLngLat(coords[0])
        .addTo(map.current!)

      truckMarkerRef.current = truckMarker

      let animStep = 0
      let animProgress = 0

      const animateTruck = () => {
        if (!map.current || coords.length <= 1) return

        animProgress += 0.003
        if (animProgress >= 1) {
          animProgress = 0
          animStep = (animStep + 1) % (coords.length - 1)
        }

        const p1 = coords[animStep]
        const p2 = coords[animStep + 1]

        if (p1 && p2) {
          const lng = p1[0] + (p2[0] - p1[0]) * animProgress
          const lat = p1[1] + (p2[1] - p1[1]) * animProgress
          truckMarker.setLngLat([lng, lat])
        }

        animFrameId = requestAnimationFrame(animateTruck)
      }

      animFrameId = requestAnimationFrame(animateTruck)
    }

    // Fit Map Bounds smoothly
    const allCoords: [number, number][] = [
      ...waypoints.filter(w => w?.coordinates).map(w => [w.coordinates.longitude, w.coordinates.latitude] as [number, number]),
      ...events.filter(e => e.start_coordinates).map(e => [e.start_coordinates.longitude, e.start_coordinates.latitude] as [number, number]),
    ]

    if (allCoords.length > 0) {
      const bounds = allCoords.reduce(
        (b, coord) => b.extend(coord),
        new mapboxgl.LngLatBounds(allCoords[0], allCoords[0])
      )

      map.current.fitBounds(bounds, {
        padding: { top: 90, bottom: 90, left: 90, right: 420 },
        pitch: 45,
        bearing: -10,
        maxZoom: 13,
        duration: 1800,
      })
    }

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId)
      if (truckMarkerRef.current) {
        truckMarkerRef.current.remove()
        truckMarkerRef.current = null
      }
    }
  }, [activeTrip, mapLoaded])

  // 4. Handle Timeline Selection Sync (Camera FlyTo)
  useEffect(() => {
    if (!map.current || !activeTrip || !selectedEventId) return

    const targetEvent = activeTrip.events?.find(e => e.id === selectedEventId)
    const targetWaypoint = activeTrip.waypoints?.find(w => w.id === selectedEventId)

    const coords = targetEvent?.start_coordinates || targetWaypoint?.coordinates
    if (coords) {
      map.current.flyTo({
        center: [coords.longitude, coords.latitude],
        zoom: 9.5,
        pitch: 55,
        bearing: 15,
        duration: 1600,
        essential: true,
      })
    }
  }, [selectedEventId, activeTrip])

  return (
    <div className="relative w-full h-full bg-[#0A0B0D] overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0 z-0" />

      {/* Floating Map Style Control */}
      <div className="absolute top-4 right-4 z-20 flex items-center bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-1.5 shadow-2xl gap-1">
        {activeStyles.map((style) => {
          const Icon = style.icon
          const isActive = currentStyleId === style.id
          return (
            <button
              key={style.id}
              onClick={() => switchMapStyle(style.id)}
              title={style.label}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{style.label.split(' ')[0]}</span>
            </button>
          )
        })}
      </div>

      {!activeTrip && <MapEmptyState />}
    </div>
  )
}
