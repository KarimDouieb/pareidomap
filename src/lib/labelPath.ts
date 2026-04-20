// Renders a country name label that follows the shape's medial axis.
// Uses PCA to find the principal orientation, then scan-lines along that
// axis to find cross-section midpoints (the spine). The spine becomes an
// SVG textPath so the label curves with the country silhouette.

type Pt = [number, number]

// ── Geometry ──────────────────────────────────────────────────────────────────

function rotate(pt: Pt, a: number): Pt {
  const c = Math.cos(a), s = Math.sin(a)
  return [pt[0] * c - pt[1] * s, pt[0] * s + pt[1] * c]
}

function dot(a: Pt, b: Pt) { return a[0] * b[0] + a[1] * b[1] }

function distToSegment(p: Pt, a: Pt, b: Pt): number {
  const abx = b[0] - a[0], aby = b[1] - a[1]
  const apx = p[0] - a[0], apy = p[1] - a[1]
  const t = Math.max(0, Math.min(1, dot([apx, apy], [abx, aby]) / (dot([abx, aby], [abx, aby]) || 1)))
  return Math.hypot(apx - t * abx, apy - t * aby)
}

function distToPoly(pt: Pt, poly: Pt[]): number {
  let min = Infinity
  for (let i = 0; i < poly.length; i++) {
    const d = distToSegment(pt, poly[i], poly[(i + 1) % poly.length])
    if (d < min) min = d
  }
  return min
}

// ── Principal axis via PCA ────────────────────────────────────────────────────

function pcaAngle(pts: Pt[]): number {
  const n = pts.length
  const cx = pts.reduce((s, p) => s + p[0], 0) / n
  const cy = pts.reduce((s, p) => s + p[1], 0) / n
  let sxx = 0, sxy = 0, syy = 0
  for (const [x, y] of pts) {
    const dx = x - cx, dy = y - cy
    sxx += dx * dx; sxy += dx * dy; syy += dy * dy
  }
  return 0.5 * Math.atan2(2 * sxy, sxx - syy)
}

// ── Scan-line medial axis ─────────────────────────────────────────────────────

function smooth(pts: Pt[], k: number): Pt[] {
  return pts.map((_, i) => {
    const lo = Math.max(0, i - k), hi = Math.min(pts.length - 1, i + k)
    const w = hi - lo + 1
    return pts.slice(lo, hi + 1).reduce<Pt>((acc, p) => [acc[0] + p[0] / w, acc[1] + p[1] / w], [0, 0])
  })
}

function computeSpine(polygon: Pt[], steps = 80): Pt[] {
  const angle = pcaAngle(polygon)
  const rotated = polygon.map(p => rotate(p, -angle))

  // After aligning the main axis to horizontal (X), scan with vertical lines
  // (constant X) to get cross-sections perpendicular to the main axis.
  // Midpoints of those cross-sections form the spine along the main axis.
  const allX = rotated.map(p => p[0])
  const minX = Math.min(...allX), maxX = Math.max(...allX)

  const raw: Pt[] = []
  for (let i = 0; i <= steps; i++) {
    const x = minX + (maxX - minX) * i / steps
    const ys: number[] = []
    for (let j = 0; j < rotated.length; j++) {
      const a = rotated[j], b = rotated[(j + 1) % rotated.length]
      if ((a[0] <= x) !== (b[0] <= x)) {
        ys.push(a[1] + (x - a[0]) * (b[1] - a[1]) / (b[0] - a[0]))
      }
    }
    if (ys.length >= 2) {
      ys.sort((a, b) => a - b)
      raw.push(rotate([x, (ys[0] + ys[ys.length - 1]) / 2], angle))
    }
  }

  return smooth(raw, 5)
}

// ── Font size: largest that fits along the whole spine ────────────────────────

function maxFitFontSize(spine: Pt[], polygon: Pt[]): number {
  const clearances: number[] = []
  for (let i = 0; i < spine.length; i += 2) {
    clearances.push(distToPoly(spine[i], polygon))
  }
  if (clearances.length === 0) return 12
  clearances.sort((a, b) => a - b)
  // Use ~30th-percentile clearance so narrow ends don't shrink the whole label
  const p30 = clearances[Math.floor(clearances.length * 0.3)]
  // Cap at 15% of the polygon's bounding-box max dimension
  const allX = polygon.map(p => p[0]), allY = polygon.map(p => p[1])
  const maxDim = Math.max(Math.max(...allX) - Math.min(...allX), Math.max(...allY) - Math.min(...allY))
  return Math.min(p30 * 1.4, maxDim * 0.15)
}

// ── Path string (quadratic-smoothed polyline) ─────────────────────────────────

function spineToPath(pts: Pt[]): string {
  if (pts.length < 2) return ''
  // Ensure left-to-right so text isn't upside-down
  const ordered = pts[pts.length - 1][0] < pts[0][0] ? [...pts].reverse() : pts
  const [f, ...rest] = ordered
  let d = `M${f[0].toFixed(1)},${f[1].toFixed(1)}`
  for (let i = 0; i < rest.length - 1; i++) {
    const mx = (rest[i][0] + rest[i + 1][0]) / 2
    const my = (rest[i][1] + rest[i + 1][1]) / 2
    d += ` Q${rest[i][0].toFixed(1)},${rest[i][1].toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}`
  }
  const last = rest[rest.length - 1]
  d += ` L${last[0].toFixed(1)},${last[1].toFixed(1)}`
  return d
}

// ── Public API ────────────────────────────────────────────────────────────────

export function renderCountryLabel(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  svg: any,
  polygon: Pt[],
  name: string,
  transform: string,
): void {
  if (polygon.length < 8 || !name) return

  const spine = computeSpine(polygon)
  if (spine.length < 4) return

  const fontSize = maxFitFontSize(spine, polygon)
  const pathId = `lp-${name.replace(/[^a-z0-9]/gi, '-')}`

  const g = svg.append('g').attr('transform', transform)

  g.append('path')
    .attr('id', pathId)
    .attr('d', spineToPath(spine))
    .attr('fill', 'none')
    .attr('stroke', 'none')

  g.append('text')
    .attr('font-family', 'Geist, sans-serif')
    .attr('font-size', fontSize)
    .attr('font-weight', '700')
    .attr('letter-spacing', '0.06em')
    .attr('fill', 'white')
    .attr('opacity', 0.88)
    .attr('filter', 'drop-shadow(0 1px 3px rgba(0,0,0,0.95))')
    .attr('dominant-baseline', 'middle')
    .append('textPath')
    .attr('href', `#${pathId}`)
    .attr('xlink:href', `#${pathId}`)
    .attr('startOffset', '50%')
    .attr('text-anchor', 'middle')
    .text(name)
}
