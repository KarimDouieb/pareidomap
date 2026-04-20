import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { getFeatureByIso, getAllFeatures, type MatchResult } from '@/lib/matcher'
import {
  renderCountryMap,
  DEFAULT_MAP_STYLE,
  BORDER_COLORS,
  SUB_BORDER_COLORS,
  type MapStyle,
  type FontStyle,
  type CityDot,
} from '@/lib/mapRenderer'
import { loadCities } from '@/lib/cities'
import { computeLayout } from '@/lib/layout'
import { PhotoMapCanvas } from '@/components/PhotoMapCanvas'
import type { MaskBounds } from '@/lib/contour'

const TOGGLE_ROWS: { key: keyof Pick<MapStyle, 'showCities' | 'showBorders' | 'showNeighbors' | 'showNeighborLabels'>; label: string }[] = [
  { key: 'showCities', label: 'Capital & cities' },
  { key: 'showNeighbors', label: 'Bordering countries' },
  { key: 'showNeighborLabels', label: 'Country labels' },
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
  photo,
  maskBounds,
  maskSize,
  onBack,
}: {
  match: MatchResult
  photo: string | null
  maskBounds: MaskBounds | null
  maskSize: { w: number; h: number } | null
  onBack: () => void
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [cities, setCities] = useState<Record<string, CityDot[]>>({})
  const [mapStyle, setMapStyle] = useState<MapStyle>(DEFAULT_MAP_STYLE)
  const [containerSize, setContainerSize] = useState<{ w: number; h: number } | null>(null)

  useEffect(() => {
    loadCities().then(setCities).catch(() => {})
  }, [])

  function renderMap(w: number, h: number) {
    const svg = svgRef.current
    if (!svg) return
    const feature = getFeatureByIso(match.iso_a3)
    if (!feature) return
    const vs = maskBounds && maskSize ? computeLayout(w, h, maskBounds, maskSize).vertShift : 0
    renderCountryMap(svg, feature, cities[match.iso_a3] ?? [], w, h, maskBounds, match.bestAngle, getAllFeatures(), maskSize ?? undefined, match.name, vs, mapStyle)
  }

  useEffect(() => {
    if (!containerSize) return
    renderMap(containerSize.w, containerSize.h)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cities, maskBounds, maskSize, containerSize, mapStyle])

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
        <PhotoMapCanvas
          photo={photo}
          maskBounds={maskBounds}
          maskSize={maskSize}
          svgRef={svgRef}
          onResize={(w, h) => setContainerSize({ w, h })}
        />
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
