import type { Point } from './contour'
import { resamplePolygon, computeEFD, rotatePolygon, normalizePoly, descriptorDistance, geometricPolyDistance, type DistanceMetric } from './descriptor'

export type { DistanceMetric }

const CACHE_NAME = 'pareidomap-ml-v1'
const BASE = import.meta.env.BASE_URL

export interface MatchResult {
  iso_a3: string
  name: string
  subregion: string
  continent: string
  score: number
  bestAngle: number
}

interface CountryDescriptor {
  iso_a3: string
  name: string
  subregion: string
  continent: string
  descriptors: number[]
}

let countryDescriptors: CountryDescriptor[] = []
let worldFeatures: Map<string, object> = new Map()

async function cachedFetch(url: string): Promise<Response> {
  const cache = await caches.open(CACHE_NAME)
  const hit = await cache.match(url)
  if (hit) return hit
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  await cache.put(url, res.clone())
  return res
}

export async function loadCountryData(): Promise<void> {
  if (countryDescriptors.length > 0) return

  const [descRes, worldRes] = await Promise.all([
    cachedFetch(`${BASE}country-descriptors.json`),
    cachedFetch(`${BASE}world.geojson`),
  ])

  const descData = await descRes.json() as { countries: CountryDescriptor[] }
  countryDescriptors = descData.countries

  const worldData = await worldRes.json() as { features: Array<{ properties: { ISO_A3: string } }> }
  for (const feature of worldData.features) {
    const iso = feature.properties?.ISO_A3
    if (iso && iso !== '-99') worldFeatures.set(iso, feature)
  }
}

export function getFeatureByIso(iso: string): object | null {
  return worldFeatures.get(iso) ?? null
}

export function getAllFeatures(): object[] {
  return Array.from(worldFeatures.values())
}

const ROTATION_OFFSETS = Array.from({ length: 71 }, (_, i) => i - 35)
const N_SAMPLES = 512
const N_HARMONICS = 128
const GEO_N = 128
const SCORE_K = 3.5

// Lazily built cache of normalized geo polys for geometric distance computation
let geoPolyCache: Map<string, Point[]> | null = null

function getGeoPolyCache(): Map<string, Point[]> {
  if (geoPolyCache) return geoPolyCache
  geoPolyCache = new Map()
  for (const [iso, feature] of worldFeatures) {
    const f = feature as { geometry: { type: string; coordinates: number[][][][] | number[][][] } }
    if (!f?.geometry) continue
    const ring = getLargestRing(f.geometry)
    if (!ring) continue
    const projected: Point[] = (ring as unknown as number[][]).map(([lon, lat]) => [lon, mercatorY(lat)])
    const resampled = resamplePolygon(projected, GEO_N)
    geoPolyCache.set(iso, normalizePoly(resampled))
  }
  return geoPolyCache
}

// Flip Y so user's image coords (Y-down) align with Mercator coords (Y-up).
// Without this, EFD cn/dn components have opposite sign to country descriptors.
function flipY(poly: Point[]): Point[] {
  return poly.map(([x, y]) => [x, -y])
}

export function matchCountries(poly: Point[], metric: DistanceMetric = 'weighted'): MatchResult[] {
  if (countryDescriptors.length === 0) return []

  const normalized = flipY(poly)

  if (metric === 'weighted') {
    const rotatedDescs = ROTATION_OFFSETS.map(deg =>
      computeEFD(resamplePolygon(rotatePolygon(normalized, deg), N_SAMPLES), N_HARMONICS)
    )
    const scored = countryDescriptors.map(country => {
      let bestDist = Infinity, bestAngle = 0
      for (let r = 0; r < ROTATION_OFFSETS.length; r++) {
        const d = descriptorDistance(rotatedDescs[r], country.descriptors)
        if (d < bestDist) { bestDist = d; bestAngle = ROTATION_OFFSETS[r] }
      }
      const score = Math.round(100 * Math.exp(-bestDist * SCORE_K))
      return { iso_a3: country.iso_a3, name: country.name, subregion: country.subregion, continent: country.continent, score, bestAngle }
    })
    return scored.sort((a, b) => b.score - a.score).slice(0, 50)
  }

  // Geometric metrics: compare normalized raw polygons
  const geoCache = getGeoPolyCache()
  const rotatedGeoPoly = ROTATION_OFFSETS.map(deg =>
    normalizePoly(resamplePolygon(rotatePolygon(normalized, deg), GEO_N))
  )

  const scored = countryDescriptors.map(country => {
    const countryGeoPoly = geoCache.get(country.iso_a3)
    if (!countryGeoPoly) return null
    let bestDist = Infinity, bestAngle = 0
    for (let r = 0; r < ROTATION_OFFSETS.length; r++) {
      const d = geometricPolyDistance(rotatedGeoPoly[r], countryGeoPoly, metric)
      if (d < bestDist) { bestDist = d; bestAngle = ROTATION_OFFSETS[r] }
    }
    const score = Math.round(100 * Math.exp(-bestDist * SCORE_K))
    return { iso_a3: country.iso_a3, name: country.name, subregion: country.subregion, continent: country.continent, score, bestAngle }
  }).filter(Boolean) as MatchResult[]

  return scored.sort((a, b) => b.score - a.score).slice(0, 50)
}


// ── Debug helpers ─────────────────────────────────────────────────────────────

export interface ShapeDebug {
  iso: string
  name: string
  bestDist: number
  bestAngle: number
  userRawPoly: Point[]           // user poly in Mercator Y-up (no rotation)
  countryRawPoly: Point[] | null // country rotated by -bestAngle in Mercator Y-up to align with user
}

function mercatorY(lat: number): number {
  return Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2)) * (180 / Math.PI)
}

function getLargestRing(geometry: { type: string; coordinates: number[][][][] | number[][][] }): Point[] | null {
  const rings: number[][][] = []
  if (geometry.type === 'Polygon') rings.push((geometry.coordinates as number[][][])[0])
  else if (geometry.type === 'MultiPolygon') {
    for (const poly of geometry.coordinates as number[][][][]) rings.push(poly[0])
  }
  if (rings.length === 0) return null
  return rings.reduce((best, r) => r.length > best.length ? r : best) as Point[]
}

// Returns EFD reconstructions at the best-matching rotation for each country.
// userPoly should be the raw simplified polygon (image coords); Y-flip is applied internally.
export function getDebugShapes(userPoly: Point[], isoCodes: string[], metric: DistanceMetric = 'weighted'): ShapeDebug[] {
  const normalized = flipY(userPoly)

  // Pre-compute per-rotation data for the chosen metric
  const rotatedEFDs = metric === 'weighted'
    ? ROTATION_OFFSETS.map(deg => ({
        deg,
        efd: computeEFD(resamplePolygon(rotatePolygon(normalized, deg), N_SAMPLES), N_HARMONICS),
      }))
    : null
  const rotatedGeoPoly = metric !== 'weighted'
    ? ROTATION_OFFSETS.map(deg => ({
        deg,
        poly: normalizePoly(resamplePolygon(rotatePolygon(normalized, deg), GEO_N)),
      }))
    : null
  const geoCache = metric !== 'weighted' ? getGeoPolyCache() : null

  return isoCodes.flatMap(iso => {
    const country = countryDescriptors.find(c => c.iso_a3 === iso)
    if (!country) return []

    // Find the rotation that best matches this country
    let bestDist = Infinity, bestAngle = 0
    if (rotatedEFDs) {
      for (const { deg, efd } of rotatedEFDs) {
        const d = descriptorDistance(efd, country.descriptors)
        if (d < bestDist) { bestDist = d; bestAngle = deg }
      }
    } else {
      const countryGeoPoly = geoCache!.get(iso)
      if (!countryGeoPoly) return []
      for (const { deg, poly } of rotatedGeoPoly!) {
        const d = geometricPolyDistance(poly, countryGeoPoly, metric)
        if (d < bestDist) { bestDist = d; bestAngle = deg }
      }
    }

    const userRawPoly = resamplePolygon(normalized, N_SAMPLES)  // Mercator Y-up, no rotation
    const countryBase = getCountryRawPoly(iso)
    const countryRawPoly = countryBase ? resamplePolygon(rotatePolygon(countryBase, -bestAngle), N_SAMPLES) : null

    return [{ iso, name: country.name, bestDist, bestAngle, userRawPoly, countryRawPoly }]
  })
}

// Returns the resampled + Mercator-projected polygon for a country (for raw shape overlay).
export function getCountryRawPoly(iso: string): Point[] | null {
  const feature = worldFeatures.get(iso) as { geometry: { type: string; coordinates: number[][][][] | number[][][] } } | undefined
  if (!feature?.geometry) return null
  const ring = getLargestRing(feature.geometry)
  if (!ring) return null
  const projected: Point[] = (ring as unknown as number[][]).map(([lon, lat]) => [lon, mercatorY(lat)])
  return resamplePolygon(projected, N_SAMPLES)
}
