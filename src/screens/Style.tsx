import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'
import { getFeatureByIso, getAllFeatures, getAllSeaFeatures, type MatchResult } from '@/lib/matcher'
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
import { renderComposite } from '@/lib/exportImage'
import type { MaskBounds } from '@/lib/contour'

const TOGGLE_ROWS: { key: keyof Pick<MapStyle, 'showCities' | 'showBorders' | 'showNeighbors' | 'showNeighborLabels' | 'showSeaLabels'>; label: string }[] = [
  { key: 'showCities', label: 'Capital & cities' },
  { key: 'showNeighbors', label: 'Bordering countries' },
  { key: 'showNeighborLabels', label: 'Country labels' },
  { key: 'showSeaLabels', label: 'Sea & ocean labels' },
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
  onExport,
  onMenuOpen,
}: {
  match: MatchResult
  photo: string | null
  maskBounds: MaskBounds | null
  maskSize: { w: number; h: number } | null
  onBack: () => void
  onExport: (blob: Blob) => void
  onMenuOpen: () => void
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [cities, setCities] = useState<Record<string, CityDot[]>>({})
  const [mapStyle, setMapStyle] = useState<MapStyle>(DEFAULT_MAP_STYLE)
  const [containerSize, setContainerSize] = useState<{ w: number; h: number } | null>(null)
  const [exporting, setExporting] = useState(false)
  const fontIndex = FONTS.findIndex(f => f.value === mapStyle.font)

  useEffect(() => {
    loadCities().then(setCities).catch(() => {})
  }, [])

  function renderMap(w: number, h: number) {
    const svg = svgRef.current
    if (!svg) return
    const feature = getFeatureByIso(match.iso_a3)
    if (!feature) return
    const vs = maskBounds && maskSize ? computeLayout(w, h, maskBounds, maskSize).vertShift : 0
    renderCountryMap(svg, feature, cities[match.iso_a3] ?? [], w, h, maskBounds, match.bestAngle, getAllFeatures(), maskSize ?? undefined, match.name, vs, mapStyle, getAllSeaFeatures())
  }

  useEffect(() => {
    if (!containerSize) return
    renderMap(containerSize.w, containerSize.h)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cities, maskBounds, maskSize, containerSize, mapStyle])

  async function handleExport() {
    if (!svgRef.current || !containerSize || !photo) return
    setExporting(true)
    try {
      const blob = await renderComposite(photo, svgRef.current, containerSize.w, containerSize.h, maskBounds, maskSize)
      onExport(blob)
    } finally {
      setExporting(false)
    }
  }

  function update(patch: Partial<MapStyle>) {
    setMapStyle(s => ({ ...s, ...patch }))
  }

  function prevFont() {
    const i = (fontIndex - 1 + FONTS.length) % FONTS.length
    update({ font: FONTS[i].value })
  }

  function nextFont() {
    const i = (fontIndex + 1) % FONTS.length
    update({ font: FONTS[i].value })
  }

  return (
    <div className="flex flex-col min-h-screen px-4">
      {/* Top bar */}
      <div className="flex items-center justify-between pt-12 pb-4">
        <Logo />
        <button
          onClick={onMenuOpen}
          className="w-9 h-9 flex items-center justify-center"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Map preview */}
      <PhotoMapCanvas
        photo={photo}
        maskBounds={maskBounds}
        maskSize={maskSize}
        svgRef={svgRef}
        onResize={(w, h) => setContainerSize({ w, h })}
      />

      {/* Controls */}
      <div className="mt-4 space-y-3 pb-10">
        {/* Font carousel */}
        <div className="rounded-lg border border-border p-4">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Font</div>
          <div className="flex items-center justify-between gap-3">
            <button onClick={prevFont} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-sm tracking-wide">{FONTS[fontIndex]?.label}</span>
            <button onClick={nextFont} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Border color swatches */}
        <div className="rounded-lg border border-border p-4">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Border Color</div>
          <div className="flex gap-3 flex-wrap">
            {BORDER_COLORS.map(color => (
              <button
                key={color}
                onClick={() => update({ borderColor: color })}
                style={{ background: color }}
                className={cn(
                  'w-8 h-8 rounded-full border-2 transition-transform',
                  mapStyle.borderColor === color ? 'border-foreground scale-110' : 'border-transparent',
                )}
              />
            ))}
          </div>
        </div>

        {/* Sub-border color swatches */}
        <div className="rounded-lg border border-border p-4">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Sub-border Color</div>
          <div className="flex gap-3 flex-wrap">
            {SUB_BORDER_COLORS.map(color => (
              <button
                key={color}
                onClick={() => update({ subBorderColor: color })}
                style={{ background: color }}
                className={cn(
                  'w-8 h-8 rounded-full border-2 transition-transform',
                  mapStyle.subBorderColor === color ? 'border-foreground scale-110' : 'border-transparent',
                )}
              />
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="rounded-lg border border-border divide-y divide-border">
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
      </div>

      {/* Bottom actions */}
      <div className="flex gap-3 pb-8 pt-2 mt-auto sticky bottom-0 bg-background">
        <button
          onClick={onBack}
          className="flex-1 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground py-3"
        >
          ← Back
        </button>
        <Button
          variant="outline"
          className="flex-1 font-mono uppercase tracking-widest text-xs rounded-full"
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? 'Saving…' : 'Looks Good →'}
        </Button>
      </div>
    </div>
  )
}
