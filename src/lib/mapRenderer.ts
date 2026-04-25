import { geoMercator, geoPath, type GeoPermissibleObjects } from 'd3-geo'
import { select } from 'd3-selection'
import type { MaskBounds } from './contour'
import { renderCountryLabel } from './labelPath'

export interface CityDot {
  name: string
  lon: number
  lat: number
  capital: boolean
}

export type FontStyle = 'sans' | 'serif' | 'mono' | 'hand'

export interface MapStyle {
  showCities: boolean
  showBorders: boolean
  showNeighbors: boolean
  showNeighborLabels: boolean
  showSeaLabels: boolean
  font: FontStyle
  borderColor: string
  subBorderColor: string
}

export const DEFAULT_MAP_STYLE: MapStyle = {
  showCities: true,
  showBorders: true,
  showNeighbors: true,
  showNeighborLabels: true,
  showSeaLabels: true,
  font: 'sans',
  borderColor: '#ffffff',
  subBorderColor: '#ffffff',
}

export const FONT_FAMILIES: Record<FontStyle, string> = {
  sans: 'Geist, sans-serif',
  serif: 'Georgia, serif',
  mono: '"Geist Mono", monospace',
  hand: 'cursive',
}

export const BORDER_COLORS = ['#ffffff', '#f5deb3', '#d4a574', '#5b8db8', '#4a7c59', '#c0392b'] as const
export const SUB_BORDER_COLORS = ['#ffffff', '#f5deb3', '#d4a574', '#5b8db8', '#4a7c59', '#c0392b'] as const

export function renderCountryMap(
  svgEl: SVGSVGElement,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  feature: any,
  cities: CityDot[],
  width: number,
  height: number,
  maskBounds: MaskBounds | null,
  bestAngle: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  allFeatures: any[] = [],
  maskSize: { w: number; h: number } | null = null,
  countryName = '',
  verticalShift = 0,
  style: MapStyle | null = null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  seaFeatures: any[] = [],
): void {
  const s = style ?? DEFAULT_MAP_STYLE
  const fontFamily = FONT_FAMILIES[s.font]
  const svg = select(svgEl)
  svg.selectAll('*').remove()
  svg.attr('viewBox', `0 0 ${width} ${height}`)

  // ── Project country into a normalised 1000×1000 space ──────────────────────
  const REF = 1000
  const tempProj = geoMercator().fitSize([REF, REF], feature as GeoPermissibleObjects)
  const tempPathGen = geoPath(tempProj)

  // Use only the largest ring (mainland) for alignment — matches getCountryRawPoly / debug panel.
  // The full feature (all islands) is used for rendering but not for bounds.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const geom = (feature as any).geometry
  const rings: number[][][] = geom?.type === 'Polygon'
    ? [geom.coordinates[0]]
    : geom?.type === 'MultiPolygon'
      ? geom.coordinates.map((p: number[][][][]) => p[0])
      : []
  const mainlandRing: number[][] = rings.length
    ? rings.reduce((best, r) => r.length > best.length ? r : best)
    : []
  const mainlandFeature = mainlandRing.length
    ? { type: 'Feature', geometry: { type: 'Polygon', coordinates: [mainlandRing] }, properties: {} }
    : feature
  const [[bx0, by0], [bx1, by1]] = tempPathGen.bounds(mainlandFeature as GeoPermissibleObjects)
  const countryCx = (bx0 + bx1) / 2
  const countryCy = (by0 + by1) / 2

  // Compute bounding box of the ROTATED mainland polygon so scale matches
  // what normPts sees after rotation in the debug panel.
  const rad = bestAngle * Math.PI / 180
  const cosA = Math.cos(rad), sinA = Math.sin(rad)
  let minRX = Infinity, maxRX = -Infinity, minRY = Infinity, maxRY = -Infinity
  for (const coords of mainlandRing) {
    const pt = tempProj(coords as [number, number])
    if (!pt) continue
    const dx = pt[0] - countryCx, dy = pt[1] - countryCy
    const rx = dx * cosA - dy * sinA
    const ry = dx * sinA + dy * cosA
    if (rx < minRX) minRX = rx; if (rx > maxRX) maxRX = rx
    if (ry < minRY) minRY = ry; if (ry > maxRY) maxRY = ry
  }
  const countryMaxDim = (maxRX > minRX)
    ? Math.max(maxRX - minRX, maxRY - minRY)
    : Math.max(bx1 - bx0, by1 - by0)

  // ── Compute SVG-space transform ─────────────────────────────────────────────
  let transform: string
  let maskCx = width / 2, maskCy = height / 2, overlayScale = 1
  if (maskBounds && countryMaxDim > 0) {
    // Apply object-cover transform: mask coords are in natural image space,
    // but the photo is displayed with object-cover in the container.
    const imgW = maskSize?.w ?? width
    const imgH = maskSize?.h ?? height
    const coverScale = Math.max(width / imgW, height / imgH)
    const offsetX = (width - imgW * coverScale) / 2
    const offsetY = (height - imgH * coverScale) / 2
    maskCx = maskBounds.normCx * imgW * coverScale + offsetX
    maskCy = maskBounds.normCy * imgH * coverScale + offsetY + verticalShift
    const maskMaxDim = Math.max(maskBounds.normW * imgW, maskBounds.normH * imgH) * coverScale
    overlayScale = maskMaxDim / countryMaxDim
    transform = `translate(${maskCx},${maskCy}) rotate(${bestAngle}) scale(${overlayScale}) translate(${-countryCx},${-countryCy})`
  } else {
    // Fallback: fit to frame
    const proj = geoMercator().fitExtent([[40, 40], [width - 40, height - 40]], feature as GeoPermissibleObjects)
    const pathGen = geoPath(proj)
    const g = svg.append('g')
    g.append('path').datum(feature as GeoPermissibleObjects).attr('d', d => pathGen(d))
      .attr('fill', 'rgba(0,0,0,0.2)').attr('stroke', 'none')
    if (s.showBorders) {
      g.append('path').datum(feature as GeoPermissibleObjects).attr('d', d => pathGen(d))
        .attr('fill', 'none').attr('stroke', s.borderColor).attr('stroke-width', 2)
        .attr('stroke-linejoin', 'round').attr('filter', 'drop-shadow(0 0 4px rgba(0,0,0,0.9))')
    }
    if (s.showCities) renderCities(svg, cities, proj, fontFamily, s.borderColor)
    renderBadge(svg)
    return
  }

  // ── Render with aligned transform ──────────────────────────────────────────
  // All geometry lives in the 1000-space and is positioned via the group transform
  const g = svg.append('g').attr('transform', transform)

  const strokeScale = 1 / ((maskBounds ? Math.sqrt((maskBounds.normW * width) ** 2 + (maskBounds.normH * height) ** 2) : REF) / countryMaxDim)

  // World background: all countries using the same projection for geographic context
  if (s.showNeighbors && allFeatures.length > 0) {
    const worldG = g.append('g')
    for (const f of allFeatures) {
      worldG.append('path').datum(f as GeoPermissibleObjects)
        .attr('d', d => tempPathGen(d))
        .attr('fill', 'none')
        .attr('stroke', s.subBorderColor)
        .attr('stroke-opacity', 0.33)
        .attr('stroke-width', 0.8 * strokeScale)
        .attr('stroke-linejoin', 'round')
    }
  }

  g.append('path').datum(feature as GeoPermissibleObjects)
    .attr('d', d => tempPathGen(d))
    .attr('fill', 'rgba(0,0,0,0.25)')
    .attr('stroke', 'none')

  if (s.showBorders) {
    g.append('path').datum(feature as GeoPermissibleObjects)
      .attr('d', d => tempPathGen(d))
      .attr('fill', 'none')
      .attr('stroke', s.borderColor)
      .attr('stroke-width', 2 * strokeScale)
      .attr('stroke-linejoin', 'round')
      .attr('filter', 'drop-shadow(0 0 4px rgba(0,0,0,0.9))')
  }

  // Country name label following the medial axis of the mainland polygon
  const projectedMainland = mainlandRing
    .map(coords => tempProj(coords as [number, number]))
    .filter((p): p is [number, number] => p !== null)
  renderCountryLabel(svg, projectedMainland, countryName, transform, fontFamily, s.borderColor)

  if (s.showCities) {
    // Cities — compute container-space coords by manually applying the SVG transform,
    // then render in an un-rotated group so labels stay horizontal.
    const cityDiag = maskBounds
      ? Math.sqrt((maskBounds.normW * width) ** 2 + (maskBounds.normH * height) ** 2) * 1.1
      : REF
    const textScale = overlayScale * countryMaxDim / (cityDiag || 1)
    const cityG = svg.append('g')
    for (const city of cities) {
      const projected = tempProj([city.lon, city.lat])
      if (!projected) continue
      const dx = (projected[0] - countryCx) * overlayScale
      const dy = (projected[1] - countryCy) * overlayScale
      const px = maskCx + dx * cosA - dy * sinA
      const py = maskCy + dx * sinA + dy * cosA

      if (city.capital) {
        cityG.append('circle').attr('cx', px).attr('cy', py).attr('r', 8 * textScale)
          .attr('fill', 'none').attr('stroke', s.borderColor).attr('stroke-width', 1.2 * textScale)
      }
      cityG.append('circle').attr('cx', px).attr('cy', py).attr('r', (city.capital ? 4 : 3) * textScale)
        .attr('fill', s.borderColor).attr('opacity', 0.9)

      cityG.append('text')
        .attr('x', px + 10 * textScale).attr('y', py + 4 * textScale)
        .attr('font-family', fontFamily)
        .attr('font-size', (city.capital ? 11 : 9) * textScale)
        .attr('font-weight', city.capital ? '500' : '400')
        .attr('fill', s.borderColor).attr('opacity', 0.9)
        .attr('filter', 'drop-shadow(0 1px 2px rgba(0,0,0,0.9))')
        .text(city.name)
    }
  }

  if (s.showNeighborLabels && allFeatures.length > 0) {
    renderNeighborLabels(
      svg, allFeatures, feature,
      tempProj, tempPathGen, maskCx, maskCy,
      countryCx, countryCy, countryMaxDim, overlayScale, cosA, sinA,
      width, height, fontFamily, s.borderColor,
    )
  }

  if (s.showSeaLabels && seaFeatures.length > 0) {
    renderSeaLabels(
      svg, seaFeatures, tempProj,
      maskCx, maskCy, countryCx, countryCy,
      overlayScale, cosA, sinA,
      width, height, fontFamily, s.borderColor,
    )
  }

  renderBadge(svg)
}

// Returns a single-polygon Feature using only the largest ring (by coordinate count,
// a reliable proxy for area). Strips overseas territories, islands, exclaves.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function largestPolygonFeature(f: any): any {
  const geom = f?.geometry
  if (!geom) return f
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rings: number[][][] = geom.type === 'Polygon' ? [geom.coordinates[0]]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    : geom.type === 'MultiPolygon' ? geom.coordinates.map((p: any) => p[0])
    : []
  if (rings.length <= 1) return f
  const best = rings.reduce((a, b) => a.length >= b.length ? a : b)
  return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [best] }, properties: f.properties }
}

function clipPolyToRect(pts: [number, number][], x0: number, y0: number, x1: number, y1: number): [number, number][] {
  type P = [number, number]
  function clipEdge(poly: P[], inside: (p: P) => boolean, intersect: (a: P, b: P) => P): P[] {
    if (!poly.length) return []
    const out: P[] = []
    for (let i = 0; i < poly.length; i++) {
      const cur = poly[i], prev = poly[(i + poly.length - 1) % poly.length]
      const ci = inside(cur), pi = inside(prev)
      if (ci) { if (!pi) out.push(intersect(prev, cur)); out.push(cur) }
      else if (pi) out.push(intersect(prev, cur))
    }
    return out
  }
  function ix(a: P, b: P, fn: (p: P) => number): P {
    const da = fn(a), db = fn(b), t = da / (da - db)
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
  }
  let p = pts
  p = clipEdge(p, q => q[0] >= x0, (a, b) => ix(a, b, q => q[0] - x0))
  p = clipEdge(p, q => q[0] <= x1, (a, b) => ix(a, b, q => x1 - q[0]))
  p = clipEdge(p, q => q[1] >= y0, (a, b) => ix(a, b, q => q[1] - y0))
  p = clipEdge(p, q => q[1] <= y1, (a, b) => ix(a, b, q => y1 - q[1]))
  return p
}

function polyAreaAndCentroid(pts: [number, number][]): { area: number; cx: number; cy: number } {
  let area = 0, cx = 0, cy = 0
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]
    const cross = x1 * y2 - x2 * y1
    area += cross; cx += (x1 + x2) * cross; cy += (y1 + y2) * cross
  }
  area /= 2
  if (Math.abs(area) < 1e-6) {
    const mx = pts.reduce((s, p) => s + p[0], 0) / pts.length
    const my = pts.reduce((s, p) => s + p[1], 0) / pts.length
    return { area: 0, cx: mx, cy: my }
  }
  return { area: Math.abs(area), cx: cx / (6 * area), cy: cy / (6 * area) }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderNeighborLabels(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  svg: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  allFeatures: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mainFeature: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tempProj: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tempPathGen: any,
  maskCx: number, maskCy: number,
  countryCx: number, countryCy: number,
  countryMaxDim: number,
  overlayScale: number, cosA: number, sinA: number,
  width: number, height: number,
  fontFamily: string, color: string,
): void {
  function toScreen(px: number, py: number): [number, number] {
    const dx = (px - countryCx) * overlayScale
    const dy = (py - countryCy) * overlayScale
    return [maskCx + dx * cosA - dy * sinA, maskCy + dx * sinA + dy * cosA]
  }

  // Stage-1 filter: centroid must be within 2.5× countryMaxDim in 1000-space.
  // Scale-independent — prevents far-away countries (USA, Australia…) regardless
  // of how small overlayScale is.
  const cutoff1000 = countryMaxDim * 2.5

  const candidates: Array<{ name: string; lx: number; ly: number; score: number; fontSize: number }> = []

  for (const f of allFeatures) {
    if (f === mainFeature) continue
    const name = (f?.properties?.NAME || '') as string
    if (!name) continue

    // Use only the largest polygon ring — strips overseas territories so centroid
    // and bounds reflect the mainland (French Guiana ≠ France, Alaska ≠ USA, etc.)
    const mainPoly = largestPolygonFeature(f)

    const centroid1000 = tempPathGen.centroid(mainPoly) as [number, number] | null
    if (!centroid1000 || !isFinite(centroid1000[0])) continue

    // Stage-1: 1000-space distance gate
    if (Math.abs(centroid1000[0] - countryCx) > cutoff1000 ||
        Math.abs(centroid1000[1] - countryCy) > cutoff1000) continue

    // Project the actual polygon ring to screen space and clip to viewport
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawRing: [number, number][] = (mainPoly?.geometry?.coordinates?.[0] as any[] ?? [])
      .map((c: [number, number]) => tempProj(c))
      .filter((p: [number, number] | null): p is [number, number] => p !== null)
    if (rawRing.length < 3) continue
    const screenRing = rawRing.map(([px, py]) => toScreen(px, py))
    const clipped = clipPolyToRect(screenRing, 0, 0, width, height)
    if (clipped.length < 3) continue

    const { area: visArea, cx: lx, cy: ly } = polyAreaAndCentroid(clipped)
    if (visArea < 300) continue

    // Bounding box of the clipped polygon for font sizing
    const clMinX = Math.min(...clipped.map(p => p[0]))
    const clMaxX = Math.max(...clipped.map(p => p[0]))
    const clMinY = Math.min(...clipped.map(p => p[1]))
    const clMaxY = Math.max(...clipped.map(p => p[1]))
    const clW = clMaxX - clMinX, clH = clMaxY - clMinY

    const maxFontH = clH * 0.35
    const maxFontW = clW * 0.78 / Math.max(name.length * 0.55, 1)
    const fontSize = Math.min(10, maxFontH, maxFontW)
    if (fontSize < 7) continue

    const dist1000 = Math.hypot(centroid1000[0] - countryCx, centroid1000[1] - countryCy)
    const score = visArea * (countryMaxDim / Math.max(dist1000, 1))
    candidates.push({ name, lx, ly, score, fontSize })
  }

  // Sort by combined score: visible area weighted by proximity to the main country
  candidates.sort((a, b) => b.score - a.score)
  for (const { name, lx, ly, fontSize } of candidates.slice(0, 3)) {
    svg.append('text')
      .attr('x', lx)
      .attr('y', ly)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-family', fontFamily)
      .attr('font-size', fontSize)
      .attr('font-style', 'italic')
      .attr('fill', color)
      .attr('opacity', 0.6)
      .attr('filter', 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))')
      .text(name)
  }
}

const SEA_FONT = '"Times New Roman", Georgia, serif'

function splitSeaName(name: string): string[] {
  const words = name.split(/\s+/)
  if (words.length <= 2) return words
  const half = Math.ceil(words.length / 2)
  return [words.slice(0, half).join(' '), words.slice(half).join(' ')]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderSeaLabels(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  svg: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  seaFeatures: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tempProj: any,
  maskCx: number, maskCy: number,
  countryCx: number, countryCy: number,
  overlayScale: number, cosA: number, sinA: number,
  width: number, height: number,
  _fontFamily: string, color: string,
): void {
  function toScreen(px: number, py: number): [number, number] {
    const dx = (px - countryCx) * overlayScale
    const dy = (py - countryCy) * overlayScale
    return [maskCx + dx * cosA - dy * sinA, maskCy + dx * sinA + dy * cosA]
  }

  const candidates: Array<{ lines: string[]; lx: number; ly: number; score: number; fontSize: number }> = []

  for (const f of seaFeatures) {
    const name = (f?.properties?.NAME || '') as string
    if (!name) continue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const coords = f?.geometry?.coordinates?.[0] as [number, number][] | undefined
    if (!coords || coords.length < 3) continue

    const rawRing: [number, number][] = coords
      .map((c: [number, number]) => tempProj(c))
      .filter((p: [number, number] | null): p is [number, number] => p !== null)
    if (rawRing.length < 3) continue

    const screenRing = rawRing.map(([px, py]) => toScreen(px, py))
    const clipped = clipPolyToRect(screenRing, 0, 0, width, height)
    if (clipped.length < 3) continue

    const { area: visArea, cx: lx, cy: ly } = polyAreaAndCentroid(clipped)
    if (visArea < 500) continue

    const clMinX = Math.min(...clipped.map(p => p[0]))
    const clMaxX = Math.max(...clipped.map(p => p[0]))
    const clMinY = Math.min(...clipped.map(p => p[1]))
    const clMaxY = Math.max(...clipped.map(p => p[1]))
    const clW = clMaxX - clMinX, clH = clMaxY - clMinY

    const lines = splitSeaName(name)
    const longestLine = lines.reduce((a, b) => a.length >= b.length ? a : b)
    const maxFontH = clH * 0.18 / lines.length
    const maxFontW = clW * 0.55 / Math.max(longestLine.length * 0.5, 1)
    const fontSize = Math.min(14, maxFontH, maxFontW)
    if (fontSize < 6) continue

    const seaCx = rawRing.reduce((s, p) => s + p[0], 0) / rawRing.length
    const seaCy = rawRing.reduce((s, p) => s + p[1], 0) / rawRing.length
    const dist = Math.hypot(seaCx - countryCx, seaCy - countryCy)
    const score = visArea / Math.max(dist, 1)
    candidates.push({ lines, lx, ly, score, fontSize })
  }

  candidates.sort((a, b) => b.score - a.score)
  for (const { lines, lx, ly, fontSize } of candidates.slice(0, 3)) {
    const lineHeight = fontSize * 1.0
    const textEl = svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('font-family', SEA_FONT)
      .attr('font-size', fontSize)
      .attr('font-style', 'italic')
      .attr('letter-spacing', '0.06em')
      .attr('fill', color)
      .attr('opacity', 0.8)
      .attr('filter', 'drop-shadow(0 1px 2px rgba(0,0,0,0.7))')
    for (let i = 0; i < lines.length; i++) {
      textEl.append('tspan')
        .attr('x', lx)
        .attr('y', ly - ((lines.length - 1) * lineHeight) / 2 + i * lineHeight)
        .attr('dominant-baseline', 'middle')
        .text(lines[i])
    }
  }
}

function renderCities(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  svg: any,
  cities: CityDot[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  proj: any,
  fontFamily = 'Geist, sans-serif',
  color = 'white',
) {
  for (const city of cities) {
    const coords = proj([city.lon, city.lat])
    if (!coords) continue
    const [cx, cy] = coords
    if (city.capital) {
      svg.append('circle').attr('cx', cx).attr('cy', cy).attr('r', 6)
        .attr('fill', 'none').attr('stroke', color).attr('stroke-width', 1)
    }
    svg.append('circle').attr('cx', cx).attr('cy', cy).attr('r', city.capital ? 3 : 2.5)
      .attr('fill', color).attr('opacity', 0.9)
    svg.append('text')
      .attr('x', cx + 8).attr('y', cy + 4)
      .attr('font-family', fontFamily).attr('font-size', city.capital ? 10 : 8)
      .attr('fill', color).attr('opacity', 0.9)
      .attr('filter', 'drop-shadow(0 1px 2px rgba(0,0,0,0.9))').text(city.name)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderBadge(svg: any) {
  const badge = svg.append('g').attr('transform', 'translate(10,10)')
  badge.append('rect').attr('rx', 3).attr('width', 82).attr('height', 18)
    .attr('fill', 'black').attr('opacity', 0.55)
  badge.append('text').attr('x', 6).attr('y', 13)
    .attr('font-family', 'Geist Mono, monospace').attr('font-size', 8)
    .attr('font-weight', '600').attr('letter-spacing', '0.08em')
    .attr('fill', 'white').text('PAREIDOMAP')
}

