import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { computeLayout } from '@/lib/layout'
import type { MaskBounds } from '@/lib/contour'

interface Props {
  photo: string | null
  maskBounds: MaskBounds | null
  maskSize: { w: number; h: number } | null
  svgRef: RefObject<SVGSVGElement>
  onResize: (w: number, h: number) => void
  children?: ReactNode
}

export function PhotoMapCanvas({ photo, maskBounds, maskSize, svgRef, onResize, children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState<{ w: number; h: number } | null>(null)

  const photoObjPositionY = useMemo(() => {
    if (!containerSize || !maskBounds || !maskSize) return 50
    return computeLayout(containerSize.w, containerSize.h, maskBounds, maskSize).objPositionY
  }, [containerSize, maskBounds, maskSize])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver(() => {
      const { offsetWidth: w, offsetHeight: h } = container
      if (w <= 0 || h <= 0) return
      setContainerSize({ w, h })
      onResize(w, h)
    })
    ro.observe(container)
    return () => ro.disconnect()
  // onResize is intentionally excluded — callers should memoize it if needed
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full rounded-[14px] overflow-hidden relative"
      style={{ aspectRatio: '1/1' }}
    >
      {photo && (
        <img
          src={photo}
          alt="captured"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: `50% ${photoObjPositionY}%` }}
        />
      )}
      <svg ref={svgRef} className="absolute inset-0 w-full h-full" />
      {children}
    </div>
  )
}
