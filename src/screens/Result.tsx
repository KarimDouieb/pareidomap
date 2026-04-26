import { useEffect, useMemo, useRef, useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'
import { cn } from '@/lib/utils'
import { getFeatureByIso, getAllFeatures, getAllSeaFeatures, getDebugShapes, type MatchResult, type ShapeDebug } from '@/lib/matcher'
import { renderCountryMap, type CityDot } from '@/lib/mapRenderer'
import { loadCities } from '@/lib/cities'
import { computeLayout } from '@/lib/layout'
import { PhotoMapCanvas } from '@/components/PhotoMapCanvas'
import type { MaskBounds, Point } from '@/lib/contour'

function normPts(pts: Point[], size: number, flipY = true): string {
  if (pts.length === 0) return ''
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const [x, y] of pts) {
    if (x < minX) minX = x; if (x > maxX) maxX = x
    if (y < minY) minY = y; if (y > maxY) maxY = y
  }
  const w = maxX - minX || 1, h = maxY - minY || 1
  const scale = (size * 0.85) / Math.max(w, h)
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2
  const sy = flipY ? -1 : 1
  return pts.map(([x, y]) => `${(x - cx) * scale + size / 2},${sy * (y - cy) * scale + size / 2}`).join(' ')
}

function ShapeCard({ debug, isSelected, onClick }: { debug: ShapeDebug; isSelected: boolean; onClick: () => void }) {
  const SIZE = 72
  const userRaw = normPts(debug.userRawPoly, SIZE, true)
  const countryRaw = debug.countryRawPoly ? normPts(debug.countryRawPoly, SIZE, true) : ''
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 rounded-lg p-1 transition-all cursor-pointer shrink-0',
        isSelected ? 'ring-2 ring-foreground' : 'ring-1 ring-transparent hover:ring-border',
      )}
    >
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className={cn('rounded', isSelected ? 'bg-foreground/10' : 'bg-muted')}>
        {countryRaw && <polygon points={countryRaw} fill="none" stroke="#ef4444" strokeWidth="1" strokeLinejoin="round" opacity="0.85" />}
        <polygon points={userRaw} fill="none" stroke="#3b82f6" strokeWidth="1" strokeLinejoin="round" opacity="0.85" />
      </svg>
      <span className={cn('text-[9px] font-mono truncate max-w-[72px] text-center', isSelected ? 'text-foreground font-medium' : 'text-muted-foreground')}>{debug.name}</span>
    </button>
  )
}

export function Result({
  matches,
  maskBounds,
  debugPoly,
  userPoly,
  maskSize,
  photo,
  onRetake,
  onStyle,
  onMenuOpen,
}: {
  matches: MatchResult[] | null
  maskBounds: MaskBounds | null
  debugPoly: [number, number][] | null
  userPoly: Point[] | null
  maskSize: { w: number; h: number } | null
  photo: string | null
  onRetake: () => void
  onStyle?: (match: MatchResult) => void
  onMenuOpen: () => void
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [cities, setCities] = useState<Record<string, CityDot[]>>({})
  const [debugShapes, setDebugShapes] = useState<ShapeDebug[] | null>(null)
  const [containerSize, setContainerSize] = useState<{ w: number; h: number } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const polyTransform = useMemo(() => {
    if (!containerSize || !maskBounds || !maskSize) return null
    const { coverScale, offsetX, offsetY } = computeLayout(containerSize.w, containerSize.h, maskBounds, maskSize)
    return { coverScale, offsetX, offsetY }
  }, [containerSize, maskBounds, maskSize])

  useEffect(() => {
    loadCities().then(setCities).catch(() => {})
  }, [])

  function renderMap(w: number, h: number) {
    const svg = svgRef.current
    if (!svg || !matches || matches.length === 0) return
    const match = matches[activeIndex]
    const feature = getFeatureByIso(match.iso_a3)
    if (!feature) return
    const vs = maskBounds && maskSize ? computeLayout(w, h, maskBounds, maskSize).vertShift : 0
    renderCountryMap(svg, feature, cities[match.iso_a3] ?? [], w, h, maskBounds, match.bestAngle, getAllFeatures(), maskSize ?? undefined, match.name, vs, null, getAllSeaFeatures())
  }

  useEffect(() => {
    if (!containerSize) return
    renderMap(containerSize.w, containerSize.h)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, activeIndex, cities, maskBounds, maskSize, containerSize])

  useEffect(() => {
    if (!matches || !userPoly) return
    setDebugShapes(getDebugShapes(userPoly, matches.slice(0, 320).map(m => m.iso_a3)))
  }, [matches, userPoly])

  const loading = !matches
  const currentMatch = matches?.[activeIndex]

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

      {/* Map area */}
      <PhotoMapCanvas
        photo={photo}
        maskBounds={maskBounds}
        maskSize={maskSize}
        svgRef={svgRef}
        onResize={(w, h) => setContainerSize({ w, h })}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin opacity-80" />
          </div>
        )}
        {debugPoly && debugPoly.length > 1 && maskSize && polyTransform && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <g transform={`translate(${polyTransform.offsetX}, ${polyTransform.offsetY}) scale(${polyTransform.coverScale})`}>
              <polygon
                points={debugPoly.map(([x, y]) => `${x},${y}`).join(' ')}
                fill="none"
                stroke="#00ff88"
                strokeWidth={maskSize.w * 0.003}
                strokeLinejoin="round"
                opacity="0.8"
              />
            </g>
          </svg>
        )}
      </PhotoMapCanvas>

      {/* Match info */}
      {currentMatch && (
        <div className="mt-4">
          <div className="flex items-baseline justify-between gap-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Matching Country
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Score {currentMatch.score}%
            </div>
          </div>
          <div className="mt-1 flex items-end justify-between gap-4">
            <div>
              <div className="text-[28px] font-bold leading-tight tracking-[-0.02em]">
                {currentMatch.name}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {currentMatch.continent}
                {currentMatch.subregion ? ` — ${currentMatch.subregion}` : ''}
              </div>
            </div>
            {/* <Button
              variant="outline"
              className="font-mono uppercase tracking-widest text-xs rounded-full shrink-0"
              onClick={() => currentMatch && onStyle?.(currentMatch)}
            >
              Style +
            </Button> */}
          </div>
        </div>
      )}

      {/* Shape cards row */}
      {debugShapes && (
        <div className="mt-4">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Best Matches
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {debugShapes.map(d => (
              <ShapeCard
                key={d.iso}
                debug={d}
                isSelected={matches?.[activeIndex]?.iso_a3 === d.iso}
                onClick={() => {
                  const idx = matches?.findIndex(m => m.iso_a3 === d.iso) ?? -1
                  if (idx >= 0) setActiveIndex(idx)
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Bottom actions */}
      <div className="flex gap-3 pb-8 pt-4 mt-auto">
        <button
          onClick={onRetake}
          className="flex-1 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground py-3"
        >
          ← Back
        </button>
        <Button
          variant="outline"
          className="flex-1 font-mono uppercase tracking-widest text-xs rounded-full"
          onClick={() => currentMatch && onStyle?.(currentMatch)}
        >
          Style →
        </Button>
      </div>
    </div>
  )
}
