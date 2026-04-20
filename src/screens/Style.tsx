import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { getFeatureByIso, getAllFeatures } from '@/lib/matcher'
import {
  renderStylePreview,
  DEFAULT_MAP_STYLE,
  BORDER_COLORS,
  SUB_BORDER_COLORS,
  type MapStyle,
  type FontStyle,
  type CityDot,
} from '@/lib/mapRenderer'
import type { MatchResult } from '@/lib/matcher'

const CACHE_NAME = 'pareidomap-data-v1'
const BASE = import.meta.env.BASE_URL

async function loadCities(): Promise<Record<string, CityDot[]>> {
  const cache = await caches.open(CACHE_NAME)
  const url = `${BASE}countryTopCities.json`
  const hit = await cache.match(url)
  const res = hit ?? await fetch(url)
  if (!hit) await cache.put(url, res.clone())

  const raw = await res.json() as Record<string, Array<{
    city: string; lat: number; lng: number
    capital: string | null; population: number | null
  }>>

  const result: Record<string, CityDot[]> = {}
  for (const [iso3, cityList] of Object.entries(raw)) {
    const capital = cityList.find(c => c.capital === 'primary')
    const topTwo = cityList
      .filter(c => c.capital !== 'primary' && c.population != null)
      .sort((a, b) => (b.population ?? 0) - (a.population ?? 0))
      .slice(0, 2)
    result[iso3] = [
      ...(capital ? [{ name: capital.city, lon: capital.lng, lat: capital.lat, capital: true }] : []),
      ...topTwo.map(c => ({ name: c.city, lon: c.lng, lat: c.lat, capital: false })),
    ]
  }
  return result
}

const TOGGLE_ROWS: { key: keyof Pick<MapStyle, 'showCities' | 'showBorders' | 'showNeighbors'>; label: string }[] = [
  { key: 'showCities', label: 'Capital & cities' },
  { key: 'showNeighbors', label: 'Bordering countries' },
  { key: 'showBorders', label: 'Show borders' },
]

const FONTS: { value: FontStyle; label: string }[] = [
  { value: 'sans', label: 'Sans' },
  { value: 'serif', label: 'Serif' },
  { value: 'mono', label: 'Mono' },
  { value: 'hand', label: 'Hand' },
]

export function Style({
  match,
  onBack,
}: {
  match: MatchResult
  onBack: () => void
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [cities, setCities] = useState<Record<string, CityDot[]>>({})
  const [mapStyle, setMapStyle] = useState<MapStyle>(DEFAULT_MAP_STYLE)

  useEffect(() => {
    loadCities().then(setCities).catch(() => {})
  }, [])

  useEffect(() => {
    const svg = svgRef.current
    const container = containerRef.current
    if (!svg || !container) return
    const feature = getFeatureByIso(match.iso_a3)
    if (!feature) return
    const { offsetWidth: w, offsetHeight: h } = container
    if (w <= 0 || h <= 0) return
    renderStylePreview(svg, feature, cities[match.iso_a3] ?? [], w, h, getAllFeatures(), match.name, mapStyle)
  }, [match, cities, mapStyle])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver(() => {
      const svg = svgRef.current
      if (!svg) return
      const { offsetWidth: w, offsetHeight: h } = container
      if (w <= 0 || h <= 0) return
      const feature = getFeatureByIso(match.iso_a3)
      if (!feature) return
      renderStylePreview(svg, feature, cities[match.iso_a3] ?? [], w, h, getAllFeatures(), match.name, mapStyle)
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [match, cities, mapStyle])

  function update(patch: Partial<MapStyle>) {
    setMapStyle(s => ({ ...s, ...patch }))
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-[10px] border border-border flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <div className="text-sm font-semibold">Style</div>
          <div className="text-xs text-muted-foreground font-mono tracking-widest">CUSTOMISE</div>
        </div>
        <button className="w-9 h-9 rounded-[10px] border border-border flex items-center justify-center">
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Map preview */}
      <div className="px-4">
        <div
          ref={containerRef}
          className="w-full rounded-[14px] overflow-hidden relative"
          style={{ aspectRatio: '4/3' }}
        >
          <svg ref={svgRef} className="absolute inset-0 w-full h-full" />
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 mt-4 space-y-3 pb-10">
        {/* Toggles */}
        <div className="rounded-[14px] border border-border divide-y divide-border">
          {TOGGLE_ROWS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between px-4 py-3">
              <Label htmlFor={key} className="text-sm font-normal cursor-pointer">{label}</Label>
              <Switch
                id={key}
                checked={mapStyle[key]}
                onCheckedChange={(v: boolean) => update({ [key]: v })}
              />
            </div>
          ))}
        </div>

        {/* Font */}
        <div className="rounded-[14px] border border-border p-4">
          <div className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase mb-2">Font</div>
          <div className="flex gap-1.5">
            {FONTS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => update({ font: value })}
                className={cn(
                  'flex-1 py-1.5 text-xs rounded-[8px] border transition-colors',
                  mapStyle.font === value
                    ? 'border-[#002FA7] bg-[#002FA7]/10 text-[#002FA7] font-medium'
                    : 'border-border text-muted-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Border color */}
        <div className="rounded-[14px] border border-border p-4">
          <div className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase mb-3">Border Color</div>
          <div className="flex gap-2.5">
            {BORDER_COLORS.map(color => (
              <button
                key={color}
                onClick={() => update({ borderColor: color })}
                style={{ background: color }}
                className={cn(
                  'w-8 h-8 rounded-full border-2 transition-transform',
                  mapStyle.borderColor === color ? 'border-[#002FA7] scale-110' : 'border-transparent',
                )}
              />
            ))}
          </div>
        </div>

        {/* Sub-border color */}
        <div className="rounded-[14px] border border-border p-4">
          <div className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase mb-3">Sub-border Color</div>
          <div className="flex gap-2.5">
            {SUB_BORDER_COLORS.map(color => (
              <button
                key={color}
                onClick={() => update({ subBorderColor: color })}
                style={{ background: color }}
                className={cn(
                  'w-8 h-8 rounded-full border-2 transition-transform',
                  mapStyle.subBorderColor === color ? 'border-[#002FA7] scale-110' : 'border-transparent',
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
