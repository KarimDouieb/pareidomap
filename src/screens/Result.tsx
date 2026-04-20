import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getFeatureByIso, getAllFeatures, getDebugShapes, type MatchResult, type ShapeDebug } from '@/lib/matcher'
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
  const SIZE = 88
  const userRaw = normPts(debug.userRawPoly, SIZE, true)
  const countryRaw = debug.countryRawPoly ? normPts(debug.countryRawPoly, SIZE, true) : ''
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-0.5 rounded-[8px] p-0.5 transition-all cursor-pointer',
        isSelected ? 'ring-2 ring-[#002FA7]' : 'ring-1 ring-transparent hover:ring-border',
      )}
    >
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className={cn('rounded', isSelected ? 'bg-[#002FA7]/10' : 'bg-muted')}>
        {countryRaw && <polygon points={countryRaw} fill="none" stroke="#ef4444" strokeWidth="1" strokeLinejoin="round" opacity="0.85" />}
        <polygon points={userRaw} fill="none" stroke="#3b82f6" strokeWidth="1" strokeLinejoin="round" opacity="0.85" />
      </svg>
      <span className={cn('text-[9px] font-mono truncate max-w-[88px] text-center', isSelected ? 'text-[#002FA7] font-medium' : 'text-muted-foreground')}>{debug.name}</span>
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
}: {
  matches: MatchResult[] | null
  maskBounds: MaskBounds | null
  debugPoly: [number, number][] | null
  userPoly: Point[] | null
  maskSize: { w: number; h: number } | null
  photo: string | null
  onRetake: () => void
  onStyle?: (match: MatchResult) => void
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
    renderCountryMap(svg, feature, cities[match.iso_a3] ?? [], w, h, maskBounds, match.bestAngle, getAllFeatures(), maskSize ?? undefined, match.name, vs)
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

  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav bar */}
      <div className="flex items-center justify-between px-4 pt-12 pb-3">
        <button
          onClick={() => activeIndex > 0 ? setActiveIndex(i => i - 1) : onRetake()}
          className="w-9 h-9 rounded-[10px] border border-border flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <div className="text-sm font-semibold">Best match</div>
          {matches && (
            <div className="text-xs text-muted-foreground font-mono">
              {activeIndex + 1} of {matches.length} candidates
            </div>
          )}
        </div>
        <button className="w-9 h-9 rounded-[10px] border flex items-center justify-center border-[#002FA7] text-[#002FA7]">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Map area */}
      <div className="px-4">
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
      </div>

      {/* Score card */}
      {matches && matches[activeIndex] && (
        <div className="mx-4 mt-3 rounded-[14px] border border-border p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase mb-1">
                Identified as
              </div>
              <div className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-serif)' }}>
                {matches[activeIndex].name}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {matches[activeIndex].continent}
                {matches[activeIndex].subregion ? ` — ${matches[activeIndex].subregion}` : ''}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase mb-1">
                Score
              </div>
              <div className="text-3xl font-bold text-[#002FA7] leading-none">
                {matches[activeIndex].score}
                <span className="text-base font-normal">%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3">
            <button
              onClick={() => setActiveIndex(i => Math.max(0, i - 1))}
              className={cn(
                'w-9 h-9 rounded-[10px] border flex items-center justify-center',
                activeIndex === 0 ? 'border-border text-muted-foreground' : 'border-[#002FA7] text-[#002FA7]',
              )}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-muted-foreground">
              {activeIndex + 1} / {matches.length}
            </span>
            <button
              onClick={() => setActiveIndex(i => Math.min(matches.length - 1, i + 1))}
              className={cn(
                'w-9 h-9 rounded-[10px] border flex items-center justify-center',
                activeIndex === matches.length - 1 ? 'border-border text-muted-foreground' : 'border-[#002FA7] text-[#002FA7]',
              )}
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {debugShapes && (
        <div className="mx-4 mt-3 rounded-[14px] border border-border p-4">
          <div className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase mb-3">
            Best Matches &nbsp;
            <span className="text-blue-500">■</span> shape &nbsp;
            <span className="text-red-500">■</span> country
          </div>
          <div className="grid grid-cols-4 gap-3">
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

      <div className="flex gap-3 px-4 pb-8 pt-4 mt-auto">
        <Button variant="outline" className="flex-1" onClick={onRetake}>
          Retake
        </Button>
        <Button
          className="flex-1"
          onClick={() => matches?.[activeIndex] && onStyle?.(matches[activeIndex])}
        >
          Style this
          <ArrowRight className="w-[14px] h-[14px]" />
        </Button>
      </div>
    </div>
  )
}
