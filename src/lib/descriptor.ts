import type { Point } from './contour'

// ── Arc-length uniform resampling ─────────────────────────────────────────────
export function resamplePolygon(poly: Point[], n: number): Point[] {
  if (poly.length < 2) return poly
  const lens: number[] = [0]
  for (let i = 1; i < poly.length; i++) {
    const dx = poly[i][0] - poly[i - 1][0]
    const dy = poly[i][1] - poly[i - 1][1]
    lens.push(lens[i - 1] + Math.sqrt(dx * dx + dy * dy))
  }
  // close the loop
  const dx0 = poly[0][0] - poly[poly.length - 1][0]
  const dy0 = poly[0][1] - poly[poly.length - 1][1]
  const totalLen = lens[lens.length - 1] + Math.sqrt(dx0 * dx0 + dy0 * dy0)

  const result: Point[] = []
  let j = 0
  for (let i = 0; i < n; i++) {
    const target = (i / n) * totalLen
    while (j < lens.length - 1 && lens[j + 1] < target) j++
    // Last segment: closing edge from poly[last] back to poly[0]
    const isClosing = j >= lens.length - 1
    const seg = isClosing ? totalLen - lens[j] : lens[j + 1] - lens[j]
    const t = seg > 1e-10 ? (target - lens[j]) / seg : 0
    const a = poly[j]
    const b = isClosing ? poly[0] : poly[j + 1]
    result.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])])
  }
  return result
}

// ── Elliptic Fourier Descriptors (full 4 coeffs per harmonic) ─────────────────
// Returns Float32Array of length harmonics*4: [a1,b1,c1,d1, a2,b2,c2,d2, ...]
// Scale-normalized and start-point phase-normalized.
export function computeEFD(poly: Point[], harmonics: number): Float32Array {
  const n = poly.length
  const dx: number[] = []
  const dy: number[] = []
  const dt: number[] = []

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    dx.push(poly[j][0] - poly[i][0])
    dy.push(poly[j][1] - poly[i][1])
    dt.push(Math.sqrt(dx[i] * dx[i] + dy[i] * dy[i]) || 1e-10)
  }

  const T = dt.reduce((s, v) => s + v, 0)
  const cumT: number[] = [0]
  for (let i = 0; i < n - 1; i++) cumT.push(cumT[i] + dt[i])

  const coeffs = new Float32Array(harmonics * 4)

  for (let h = 1; h <= harmonics; h++) {
    let an = 0, bn = 0, cn = 0, dn = 0
    const scale = T / (2 * h * h * Math.PI * Math.PI)
    const k = 2 * h * Math.PI / T

    for (let i = 0; i < n; i++) {
      const t1 = cumT[i]
      const t2 = t1 + dt[i]
      const sinDiff = Math.sin(k * t2) - Math.sin(k * t1)
      const cosDiff = Math.cos(k * t1) - Math.cos(k * t2)
      const dxDt = dx[i] / dt[i]
      const dyDt = dy[i] / dt[i]
      an += scale * dxDt * sinDiff
      bn += scale * dxDt * cosDiff
      cn += scale * dyDt * sinDiff
      dn += scale * dyDt * cosDiff
    }

    coeffs[(h - 1) * 4 + 0] = an
    coeffs[(h - 1) * 4 + 1] = bn
    coeffs[(h - 1) * 4 + 2] = cn
    coeffs[(h - 1) * 4 + 3] = dn
  }

  // Scale normalization
  const a1 = coeffs[0], b1 = coeffs[1], c1 = coeffs[2], d1 = coeffs[3]
  const norm = Math.sqrt(a1 * a1 + b1 * b1 + c1 * c1 + d1 * d1) || 1
  for (let i = 0; i < coeffs.length; i++) coeffs[i] /= norm

  // Start-point phase normalization
  const theta1 = 0.5 * Math.atan2(
    2 * (coeffs[0] * coeffs[2] + coeffs[1] * coeffs[3]),
    coeffs[0] ** 2 + coeffs[1] ** 2 - coeffs[2] ** 2 - coeffs[3] ** 2,
  )
  for (let h = 1; h <= harmonics; h++) {
    const angle = h * theta1
    const cos = Math.cos(angle), sin = Math.sin(angle)
    const ai = coeffs[(h - 1) * 4 + 0]
    const bi = coeffs[(h - 1) * 4 + 1]
    const ci = coeffs[(h - 1) * 4 + 2]
    const di = coeffs[(h - 1) * 4 + 3]
    coeffs[(h - 1) * 4 + 0] = ai * cos + bi * sin
    coeffs[(h - 1) * 4 + 1] = -ai * sin + bi * cos
    coeffs[(h - 1) * 4 + 2] = ci * cos + di * sin
    coeffs[(h - 1) * 4 + 3] = -ci * sin + di * cos
  }

  return coeffs
}

// ── Polygon rotation ──────────────────────────────────────────────────────────
export function rotatePolygon(poly: Point[], deg: number): Point[] {
  const rad = (deg * Math.PI) / 180
  const cos = Math.cos(rad), sin = Math.sin(rad)
  // center
  let cx = 0, cy = 0
  for (const [x, y] of poly) { cx += x; cy += y }
  cx /= poly.length; cy /= poly.length
  return poly.map(([x, y]) => {
    const dx = x - cx, dy = y - cy
    return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos]
  })
}

// ── L2 distance ───────────────────────────────────────────────────────────────
export function descriptorDistance(a: Float32Array | number[], b: Float32Array | number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2
  return Math.sqrt(sum)
}

// ── Reconstruct polygon from EFD coefficients (for visualization / debug) ─────
// Returns nPoints samples of the shape in normalized EFD space (centered at origin).
export function reconstructFromEFD(
  coeffs: Float32Array | number[],
  harmonics: number,
  nPoints: number,
): Point[] {
  const pts: Point[] = []
  for (let i = 0; i < nPoints; i++) {
    const t = (i / nPoints) * 2 * Math.PI
    let x = 0, y = 0
    for (let h = 1; h <= harmonics; h++) {
      const angle = h * t
      x += coeffs[(h - 1) * 4 + 0] * Math.cos(angle) + coeffs[(h - 1) * 4 + 1] * Math.sin(angle)
      y += coeffs[(h - 1) * 4 + 2] * Math.cos(angle) + coeffs[(h - 1) * 4 + 3] * Math.sin(angle)
    }
    pts.push([x, y])
  }
  return pts
}
