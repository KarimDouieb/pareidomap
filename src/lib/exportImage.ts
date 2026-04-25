import type { MaskBounds } from './contour'
import { computeLayout } from './layout'

// Export at 3× the display container so the result is crisp on high-DPI screens.
const EXPORT_SCALE = 2.5

/**
 * Composite the photo and the SVG map overlay into a single high-resolution
 * JPEG blob, replicating the exact CSS object-cover + object-position layout
 * that the PhotoMapCanvas uses.
 */
export async function renderComposite(
  photo: string,
  svgEl: SVGSVGElement,
  containerW: number,
  containerH: number,
  maskBounds: MaskBounds | null,
  maskSize: { w: number; h: number } | null,
): Promise<Blob> {
  const exportW = Math.round(containerW * EXPORT_SCALE)
  const exportH = Math.round(containerH * EXPORT_SCALE)

  const canvas = document.createElement('canvas')
  canvas.width = exportW
  canvas.height = exportH
  const ctx = canvas.getContext('2d')!

  // Black background so JPEG has no transparent regions.
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, exportW, exportH)

  // Step 1 — draw the photo with the same object-cover + objectPosition as CSS.
  const img = await loadImage(photo)
  const { objPositionY } = maskBounds && maskSize
    ? computeLayout(containerW, containerH, maskBounds, maskSize)
    : { objPositionY: 50 }
  drawCoverPhoto(ctx, img, exportW, exportH, objPositionY)

  // Step 2 — draw the SVG overlay at export resolution.
  // The SVG's viewBox matches the container (set by mapRenderer); giving it
  // explicit width/height scales all vector content up to the export size.
  await drawSvgOnCanvas(ctx, svgEl, exportW, exportH)

  return new Promise((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', 0.92),
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image failed to load'))
    img.src = src
  })
}

/**
 * Replicate CSS object-fit:cover with object-position:50% {objPositionY}%.
 * coverScale fills the canvas in both dimensions; the offset clips the excess.
 */
function drawCoverPhoto(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cW: number,
  cH: number,
  objPositionY: number,
) {
  const coverScale = Math.max(cW / img.naturalWidth, cH / img.naturalHeight)
  const scaledW = img.naturalWidth * coverScale
  const scaledH = img.naturalHeight * coverScale
  const dx = (cW - scaledW) / 2                        // always centred horizontally
  const dy = (cH - scaledH) * (objPositionY / 100)     // vertical from objPositionY %
  ctx.drawImage(img, dx, dy, scaledW, scaledH)
}

/**
 * Serialize the SVG, stamp explicit export dimensions onto the clone, and
 * paint it over the canvas.  Using a data URI avoids blob-URL restrictions
 * inside some mobile WebViews.
 */
async function drawSvgOnCanvas(
  ctx: CanvasRenderingContext2D,
  svgEl: SVGSVGElement,
  w: number,
  h: number,
) {
  const clone = svgEl.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(w))
  clone.setAttribute('height', String(h))
  // viewBox stays as-is (set by mapRenderer to container dims); SVG scales content to w×h.

  const svgStr = new XMLSerializer().serializeToString(clone)
  const dataUri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr)
  const img = await loadImage(dataUri)
  ctx.drawImage(img, 0, 0, w, h)
}
