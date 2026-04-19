export type Point = [number, number]

// ── Largest blob ─────────────────────────────────────────────────────────────
// Keeps only the largest connected foreground component (removes stray pixels).
export function extractLargestBlob(
  mask: Uint8ClampedArray,
  width: number,
  height: number,
): Uint8ClampedArray {
  const labels = new Int32Array(width * height)
  let labelId = 0
  const sizes: number[] = []

  function floodFill(start: number) {
    const id = ++labelId
    sizes.push(0)
    const stack = [start]
    while (stack.length) {
      const idx = stack.pop()!
      if (labels[idx] !== 0 || mask[idx] !== 255) continue
      labels[idx] = id
      sizes[id - 1]++
      const x = idx % width, y = (idx / width) | 0
      if (x > 0) stack.push(idx - 1)
      if (x < width - 1) stack.push(idx + 1)
      if (y > 0) stack.push(idx - width)
      if (y < height - 1) stack.push(idx + width)
    }
  }

  for (let i = 0; i < mask.length; i++) {
    if (mask[i] === 255 && labels[i] === 0) floodFill(i)
  }

  if (sizes.length === 0) return mask
  const bestLabel = sizes.indexOf(Math.max(...sizes)) + 1

  const result = new Uint8ClampedArray(mask.length)
  for (let i = 0; i < labels.length; i++) {
    if (labels[i] === bestLabel) result[i] = 255
  }
  return result
}

// ── Mask bounding box + centroid ─────────────────────────────────────────────
export interface MaskBounds {
  normCx: number  // centroid x, normalised 0-1
  normCy: number  // centroid y, normalised 0-1
  normW: number   // bounding box width, normalised
  normH: number   // bounding box height, normalised
}

export function getMaskBounds(
  mask: Uint8ClampedArray,
  width: number,
  height: number,
): MaskBounds | null {
  let minX = width, minY = height, maxX = 0, maxY = 0
  let sumX = 0, sumY = 0, count = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y * width + x] === 255) {
        if (x < minX) minX = x; if (x > maxX) maxX = x
        if (y < minY) minY = y; if (y > maxY) maxY = y
        sumX += x; sumY += y; count++
      }
    }
  }
  if (count === 0) return null
  return {
    normCx: sumX / count / width,
    normCy: sumY / count / height,
    normW: (maxX - minX) / width,
    normH: (maxY - minY) / height,
  }
}

// ── Moore neighbor boundary tracing ──────────────────────────────────────────
const DX = [1, 1, 0, -1, -1, -1, 0, 1]  // E, SE, S, SW, W, NW, N, NE
const DY = [0, 1, 1, 1, 0, -1, -1, -1]

function isFg(mask: Uint8ClampedArray, x: number, y: number, w: number, h: number): boolean {
  if (x < 0 || x >= w || y < 0 || y >= h) return false
  return mask[y * w + x] === 255
}

export function traceContour(
  mask: Uint8ClampedArray,
  width: number,
  height: number,
): Point[] {
  // Find topmost-leftmost foreground pixel
  let sx = -1, sy = -1
  outer: for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y * width + x] === 255) { sx = x; sy = y; break outer }
    }
  }
  if (sx === -1) return []

  const boundary: Point[] = []
  let cx = sx, cy = sy
  let backtrack = 6 // N (opposite of S, since we enter from top)

  let iterations = 0
  const maxIter = width * height * 2

  do {
    boundary.push([cx, cy])
    let found = false
    for (let i = 0; i < 8; i++) {
      const dir = (backtrack + i) % 8
      const nx = cx + DX[dir]
      const ny = cy + DY[dir]
      if (isFg(mask, nx, ny, width, height)) {
        backtrack = (dir + 5) % 8
        cx = nx; cy = ny
        found = true
        break
      }
    }
    if (!found) break
    iterations++
  } while ((cx !== sx || cy !== sy || boundary.length < 3) && iterations < maxIter)

  return boundary
}

// ── Ramer-Douglas-Peucker simplification ─────────────────────────────────────
function perpendicularDist(p: Point, a: Point, b: Point): number {
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len === 0) return Math.sqrt((p[0] - a[0]) ** 2 + (p[1] - a[1]) ** 2)
  return Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / len
}

export function simplifyPolygon(poly: Point[], epsilon: number): Point[] {
  if (poly.length <= 2) return poly
  let maxDist = 0, idx = 0
  for (let i = 1; i < poly.length - 1; i++) {
    const d = perpendicularDist(poly[i], poly[0], poly[poly.length - 1])
    if (d > maxDist) { maxDist = d; idx = i }
  }
  if (maxDist > epsilon) {
    const left = simplifyPolygon(poly.slice(0, idx + 1), epsilon)
    const right = simplifyPolygon(poly.slice(idx), epsilon)
    return [...left.slice(0, -1), ...right]
  }
  return [poly[0], poly[poly.length - 1]]
}
