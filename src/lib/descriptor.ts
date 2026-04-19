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
// phaseNorm=false skips the theta1 rotation — shapes stay in their natural orientation.
// Use phaseNorm=false only for visualization; matching always needs phaseNorm=true.
export function computeEFD(poly: Point[], harmonics: number, phaseNorm = true): Float32Array {
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

  if (phaseNorm) {
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

// ── Polygon normalization ─────────────────────────────────────────────────────
// Centers at origin, scales max bounding dimension to 1.
// Mirrors the normalization used in the debug raw-polygon display.
export function normalizePoly(pts: Point[]): Point[] {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const [x, y] of pts) {
    if (x < minX) minX = x; if (x > maxX) maxX = x
    if (y < minY) minY = y; if (y > maxY) maxY = y
  }
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2
  const scale = Math.max(maxX - minX, maxY - minY) || 1
  return pts.map(([x, y]) => [(x - cx) / scale, (y - cy) / scale])
}

// ── Distance metrics ──────────────────────────────────────────────────────────

export type DistanceMetric = 'weighted' | 'chamfer' | 'hausdorff' | 'frechet' | 'turning'

// weighted: 1/h² on EFD coefficients — used when metric === 'weighted'
export function descriptorDistance(a: Float32Array | number[], b: Float32Array | number[]): number {
  let sum = 0
  const H = a.length / 4
  for (let h = 1; h <= H; h++) {
    const w = 1 / (h * h), base = (h - 1) * 4
    for (let k = 0; k < 4; k++) sum += w * (a[base + k] - b[base + k]) ** 2
  }
  return Math.sqrt(sum)
}

// Geometric distances — operate directly on normalized Point[] sequences.
// Both inputs must already be normalized (normalizePoly) and have the same length.

// chamfer: mean nearest-neighbour distance (one-sided, robust to outliers)
function distChamfer(a: Point[], b: Point[]): number {
  let sum = 0
  for (const [ax, ay] of a) {
    let minD = Infinity
    for (const [bx, by] of b) { const d = (ax-bx)**2+(ay-by)**2; if (d < minD) minD = d }
    sum += Math.sqrt(minD)
  }
  return sum / a.length
}

// hausdorff: worst-case nearest-neighbour distance (bidirectional)
function distHausdorff(a: Point[], b: Point[]): number {
  function directed(p: Point[], q: Point[]): number {
    let maxD = 0
    for (const [px, py] of p) {
      let minD = Infinity
      for (const [qx, qy] of q) { const d = (px-qx)**2+(py-qy)**2; if (d < minD) minD = d }
      if (minD > maxD) maxD = minD
    }
    return Math.sqrt(maxD)
  }
  return Math.max(directed(a, b), directed(b, a))
}

// frechet: discrete dog-leash distance — order-sensitive, iterative DP
function distFrechet(a: Point[], b: Point[]): number {
  const n = a.length, m = b.length
  const dp = new Float32Array(n * m)
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      const d = Math.sqrt((a[i][0]-b[j][0])**2+(a[i][1]-b[j][1])**2)
      if (i === 0 && j === 0) dp[0] = d
      else if (i === 0) dp[j] = Math.max(d, dp[j-1])
      else if (j === 0) dp[i*m] = Math.max(d, dp[(i-1)*m])
      else dp[i*m+j] = Math.max(d, Math.min(dp[(i-1)*m+j], dp[i*m+j-1], dp[(i-1)*m+j-1]))
    }
  }
  return dp[n*m-1]
}

// turning: RMS difference of cumulative turning-angle functions
function turningAngles(poly: Point[]): number[] {
  const n = poly.length, out: number[] = []
  let cum = 0
  for (let i = 0; i < n; i++) {
    const [x0, y0] = poly[(i-1+n) % n], [x1, y1] = poly[i], [x2, y2] = poly[(i+1) % n]
    let a = Math.atan2(y2-y1, x2-x1) - Math.atan2(y1-y0, x1-x0)
    if (a >  Math.PI) a -= 2*Math.PI
    if (a < -Math.PI) a += 2*Math.PI
    cum += a; out.push(cum)
  }
  return out
}
function distTurning(a: Point[], b: Point[]): number {
  const ta = turningAngles(a), tb = turningAngles(b)
  let sum = 0
  for (let i = 0; i < ta.length; i++) sum += (ta[i]-tb[i])**2
  return Math.sqrt(sum / ta.length)
}

export function geometricPolyDistance(a: Point[], b: Point[], metric: DistanceMetric): number {
  if (metric === 'chamfer')   return distChamfer(a, b)
  if (metric === 'hausdorff') return distHausdorff(a, b)
  if (metric === 'frechet')   return distFrechet(a, b)
  return distTurning(a, b)
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
