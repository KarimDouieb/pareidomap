import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getFeatureByIso, getAllFeatures, type MatchResult } from '@/lib/matcher'
import { renderCountryMap, type CityDot } from '@/lib/mapRenderer'
import type { MaskBounds } from '@/lib/contour'

const CACHE_NAME = 'pareidomap-ml-v1'
const BASE = import.meta.env.BASE_URL

async function loadCities(): Promise<Record<string, CityDot[]>> {
  const cache = await caches.open(CACHE_NAME)
  const url = `${BASE}cities.json`
  const hit = await cache.match(url)
  const res = hit ?? await fetch(url)
  if (!hit) await cache.put(url, res.clone())
  return res.json()
}

export function Result({
  matches,
  maskBounds,
  photo,
  onRetake,
}: {
  matches: MatchResult[] | null
  maskBounds: MaskBounds | null
  photo: string | null
  onRetake: () => void
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [cities, setCities] = useState<Record<string, CityDot[]>>({})
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadCities().then(setCities).catch(() => {})
  }, [])

  useEffect(() => {
    if (!matches || matches.length === 0) return
    const svg = svgRef.current
    const container = containerRef.current
    if (!svg || !container) return

    const match = matches[activeIndex]
    const feature = getFeatureByIso(match.iso_a3)
    if (!feature) return

    const { offsetWidth: w, offsetHeight: h } = container
    if (w === 0 || h === 0) return

    renderCountryMap(
      svg,
      feature,
      cities[match.iso_a3] ?? [],
      w,
      h,
      maskBounds,
      match.bestAngle,
      getAllFeatures(),
    )
  }, [matches, activeIndex, cities, maskBounds])

  // Re-render when container resizes
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver(() => {
      if (!matches || matches.length === 0) return
      const match = matches[activeIndex]
      const feature = getFeatureByIso(match.iso_a3)
      if (!feature || !svgRef.current) return
      const { offsetWidth: w, offsetHeight: h } = container
      if (w > 0 && h > 0) {
        renderCountryMap(svgRef.current, feature, cities[match.iso_a3] ?? [], w, h, maskBounds, match.bestAngle, getAllFeatures())
      }
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [matches, activeIndex, cities])

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
        <button className="w-9 h-9 rounded-[10px] border border-border flex items-center justify-center">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Map area */}
      <div className="px-4">
        <div
          ref={containerRef}
          className="w-full rounded-[14px] overflow-hidden relative"
          style={{ aspectRatio: '4/3' }}
        >
          {/* Photo background */}
          {photo && (
            <img src={photo} alt="captured" className="absolute inset-0 w-full h-full object-cover" />
          )}
          {/* D3 overlay */}
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin opacity-80" />
            </div>
          ) : (
            <svg ref={svgRef} className="absolute inset-0 w-full h-full" />
          )}
        </div>
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

          {/* Carousel navigation */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setActiveIndex(i => Math.max(0, i - 1))}
              className={cn(
                'w-9 h-9 rounded-[10px] border flex items-center justify-center',
                activeIndex === 0 ? 'border-border text-muted-foreground' : 'border-[#002FA7] text-[#002FA7]',
              )}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              {matches.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={cn(
                    'rounded-full transition-all',
                    i === activeIndex ? 'w-6 h-2 bg-[#002FA7]' : 'w-2 h-2 bg-border',
                  )}
                />
              ))}
            </div>

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

      {/* Action buttons */}
      <div className="flex gap-3 px-4 pb-8 pt-4 mt-auto">
        <Button variant="outline" className="flex-1" onClick={onRetake}>
          Retake
        </Button>
        <Button className="flex-1">
          Style this
          <ArrowRight className="w-[14px] h-[14px]" />
        </Button>
      </div>
    </div>
  )
}
