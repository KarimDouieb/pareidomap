import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const WORLD_PATH = resolve(import.meta.dirname, '../public/world.geojson')
const OUT = resolve(import.meta.dirname, '../public/country-descriptors.json')
const N_HARMONICS = 128
const N_SAMPLES = 512

// ── Geometry helpers ────────────────────────────────────────────────────────

type Ring = [number, number][]

function polygonArea(ring: Ring): number {
  let area = 0
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    area += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1])
  }
  return Math.abs(area / 2)
}

function getLargestRing(geometry: any): Ring | null {
  const rings: Ring[] = []
  if (geometry.type === 'Polygon') {
    rings.push(geometry.coordinates[0])
  } else if (geometry.type === 'MultiPolygon') {
    for (const poly of geometry.coordinates) rings.push(poly[0])
  }
  if (rings.length === 0) return null
  return rings.reduce((best, r) => polygonArea(r) > polygonArea(best) ? r : best)
}

// Mercator-like projection: scale lon/lat to a comparable coordinate space
function projectRing(ring: Ring): Ring {
  return ring.map(([lon, lat]) => {
    const x = lon
    const y = Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2)) * (180 / Math.PI)
    return [x, y]
  })
}

function resamplePolygon(poly: Ring, n: number): Ring {
  // Compute cumulative arc lengths
  const lens: number[] = [0]
  for (let i = 1; i < poly.length; i++) {
    const dx = poly[i][0] - poly[i - 1][0]
    const dy = poly[i][1] - poly[i - 1][1]
    lens.push(lens[i - 1] + Math.sqrt(dx * dx + dy * dy))
  }
  // close
  const dx0 = poly[0][0] - poly[poly.length - 1][0]
  const dy0 = poly[0][1] - poly[poly.length - 1][1]
  const totalLen = lens[lens.length - 1] + Math.sqrt(dx0 * dx0 + dy0 * dy0)

  const result: Ring = []
  let j = 0
  for (let i = 0; i < n; i++) {
    const target = (i / n) * totalLen
    while (j < lens.length - 1 && lens[j + 1] < target) j++
    // Closing segment: interpolate from last vertex back to first vertex
    const isClosing = j >= lens.length - 1
    const seg = isClosing ? totalLen - lens[j] : lens[j + 1] - lens[j]
    const t = seg > 1e-10 ? (target - lens[j]) / seg : 0
    const a = poly[j]
    const b = isClosing ? poly[0] : poly[j + 1]
    result.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])])
  }
  return result
}

function computeEFD(poly: Ring, harmonics: number): Float32Array {
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
  // cumulative t
  const t: number[] = [0]
  for (let i = 0; i < n - 1; i++) t.push(t[i] + dt[i])

  const coeffs = new Float32Array(harmonics * 4)

  for (let h = 1; h <= harmonics; h++) {
    let an = 0, bn = 0, cn = 0, dn = 0
    const k = 2 * h * Math.PI / T
    const scale = T / (2 * h * h * Math.PI * Math.PI)

    for (let i = 0; i < n; i++) {
      const t1 = t[i]
      const t2 = t1 + dt[i]
      const cos1 = Math.cos(k * t1)
      const cos2 = Math.cos(k * t2)
      const sin1 = Math.sin(k * t1)
      const sin2 = Math.sin(k * t2)
      const dxDt = dx[i] / dt[i]
      const dyDt = dy[i] / dt[i]

      an += scale * dxDt * (sin2 - sin1)
      bn += scale * dxDt * (cos1 - cos2)
      cn += scale * dyDt * (sin2 - sin1)
      dn += scale * dyDt * (cos1 - cos2)
    }

    coeffs[(h - 1) * 4 + 0] = an
    coeffs[(h - 1) * 4 + 1] = bn
    coeffs[(h - 1) * 4 + 2] = cn
    coeffs[(h - 1) * 4 + 3] = dn
  }

  // Scale normalization: divide by semi-major axis of harmonic 1
  const a1 = coeffs[0], b1 = coeffs[1], c1 = coeffs[2], d1 = coeffs[3]
  const scale = Math.sqrt(a1 * a1 + b1 * b1 + c1 * c1 + d1 * d1) || 1
  for (let i = 0; i < coeffs.length; i++) coeffs[i] /= scale

  // Start-point phase normalization: rotate so harmonic-1 major axis aligns with x-axis
  const theta1 = 0.5 * Math.atan2(
    2 * (coeffs[0] * coeffs[2] + coeffs[1] * coeffs[3]),
    coeffs[0] * coeffs[0] + coeffs[1] * coeffs[1] - coeffs[2] * coeffs[2] - coeffs[3] * coeffs[3],
  )
  for (let h = 1; h <= harmonics; h++) {
    const angle = h * theta1
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
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

// ── Main ────────────────────────────────────────────────────────────────────

console.log('Reading world.geojson...')
const world = JSON.parse(readFileSync(WORLD_PATH, 'utf-8'))

interface CountryEntry {
  iso_a3: string
  name: string
  subregion: string
  continent: string
  descriptors: number[]
}

const entries: CountryEntry[] = []

for (const feature of world.features) {
  const { ISO_A3, ISO_A3_EH, ADM0_A3, NAME, SUBREGION, CONTINENT } = feature.properties
  const iso = (ISO_A3 && ISO_A3 !== '-99') ? ISO_A3
    : (ISO_A3_EH && ISO_A3_EH !== '-99') ? ISO_A3_EH
    : (ADM0_A3 && ADM0_A3 !== '-99') ? ADM0_A3
    : null
  if (!iso) continue

  const ring = getLargestRing(feature.geometry)
  if (!ring || ring.length < 10) continue

  const projected = projectRing(ring)
  const resampled = resamplePolygon(projected, N_SAMPLES)
  const descriptors = computeEFD(resampled, N_HARMONICS)

  entries.push({
    iso_a3: iso,
    name: NAME,
    subregion: SUBREGION ?? '',
    continent: CONTINENT ?? '',
    descriptors: Array.from(descriptors),
  })
}

writeFileSync(OUT, JSON.stringify({ version: 1, countries: entries }))
console.log(`Wrote ${OUT} (${entries.length} countries)`)
