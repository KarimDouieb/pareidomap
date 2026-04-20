import type { MaskBounds } from './contour'

export function computeLayout(cW: number, cH: number, maskBounds: MaskBounds, maskSize: { w: number; h: number }) {
  const coverScale = Math.max(cW / maskSize.w, cH / maskSize.h)
  const scaledH = maskSize.h * coverScale
  const defOffsetY = (cH - scaledH) / 2
  const shapeCy = maskBounds.normCy * scaledH + defOffsetY
  let vs = cH / 2 - shapeCy
  vs = Math.max(defOffsetY, Math.min(-defOffsetY, vs))
  return {
    coverScale,
    offsetX: (cW - maskSize.w * coverScale) / 2,
    offsetY: defOffsetY + vs,
    vertShift: vs,
    objPositionY: defOffsetY !== 0 ? 50 + vs * 50 / defOffsetY : 50,
  }
}
