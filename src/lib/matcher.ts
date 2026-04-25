import type { Point } from './contour'
import { resamplePolygon, rotatePolygon, normalizePoly, chamferDistance } from './descriptor'

const CACHE_NAME = 'pareidomap-ml-v1'
const BASE = import.meta.env.BASE_URL

export interface MatchResult {
  iso_a3: string
  name: string
  subregion: string
  continent: string
  score: number
  bestDist: number
  bestAngle: number
}

interface CountryMeta {
  iso_a3: string
  name: string
  subregion: string
  continent: string
}

let countryMeta: CountryMeta[] = []
let worldFeatures: Map<string, object> = new Map()
let seaFeaturesList: object[] = []

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
  if (countryMeta.length > 0) return

  const [descRes, worldRes] = await Promise.all([
    cachedFetch(`${BASE}country-descriptors.json`),
    cachedFetch(`${BASE}world.geojson`),
  ])

  const descData = await descRes.json() as { countries: CountryMeta[] }
  countryMeta = descData.countries

  const worldData = await worldRes.json() as { features: Array<{ properties: { ISO_A3: string; ISO_A3_EH: string; ADM0_A3: string; HOMEPART: number } }> }
  for (const feature of worldData.features) {
    const p = feature.properties
    const iso = (p?.ISO_A3 && p.ISO_A3 !== '-99') ? p.ISO_A3
      : (p?.HOMEPART === 1 && p?.ISO_A3_EH && p.ISO_A3_EH !== '-99') ? p.ISO_A3_EH
      : (p?.HOMEPART === 1 && p?.ADM0_A3 && p.ADM0_A3 !== '-99') ? p.ADM0_A3
      : null
    if (iso) worldFeatures.set(iso, feature)
  }
}

export function getFeatureByIso(iso: string): object | null {
  return worldFeatures.get(iso) ?? null
}

export function getAllFeatures(): object[] {
  return Array.from(worldFeatures.values())
}

export async function loadSeaData(): Promise<void> {
  if (seaFeaturesList.length > 0) return
  const res = await cachedFetch(`${BASE}worldSeas.json`)
  const data = await res.json() as { features: object[] }
  seaFeaturesList = data.features
}

export function getAllSeaFeatures(): object[] {
  return seaFeaturesList
}

const ROTATION_OFFSETS = Array.from({ length: 71 }, (_, i) => i - 35)
const GEO_N = 128
const SCORE_K = 3.5

// Lazily built cache of normalized geo polys
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
    geoPolyCache.set(iso, normalizePoly(resamplePolygon(projected, GEO_N)))
  }
  return geoPolyCache
}

// Flip Y so user's image coords (Y-down) align with Mercator coords (Y-up).
function flipY(poly: Point[]): Point[] {
  return poly.map(([x, y]) => [x, -y])
}

export function matchCountries(poly: Point[]): MatchResult[] {
  if (countryMeta.length === 0) return []

  const normalized = flipY(poly)
  const geoCache = getGeoPolyCache()
  const rotatedPolys = ROTATION_OFFSETS.map(deg =>
    normalizePoly(resamplePolygon(rotatePolygon(normalized, deg), GEO_N))
  )

  const scored = countryMeta.map(country => {
    const countryPoly = geoCache.get(country.iso_a3)
    if (!countryPoly) return null
    let bestDist = Infinity, bestAngle = 0
    for (let r = 0; r < ROTATION_OFFSETS.length; r++) {
      const d = chamferDistance(rotatedPolys[r], countryPoly)
      if (d < bestDist) { bestDist = d; bestAngle = ROTATION_OFFSETS[r] }
    }
    const score = Math.round(100 * Math.exp(-bestDist * SCORE_K))
    return { iso_a3: country.iso_a3, name: country.name, subregion: country.subregion, continent: country.continent, score, bestDist, bestAngle }
  }).filter(Boolean) as MatchResult[]

  return scored.sort((a, b) => a.bestDist - b.bestDist).slice(0, 320)
}

// ── Debug helpers ─────────────────────────────────────────────────────────────

export interface ShapeDebug {
  iso: string
  name: string
  bestDist: number
  bestAngle: number
  userRawPoly: Point[]
  countryRawPoly: Point[] | null
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

export function getDebugShapes(userPoly: Point[], isoCodes: string[]): ShapeDebug[] {
  const normalized = flipY(userPoly)
  const geoCache = getGeoPolyCache()
  const rotatedPolys = ROTATION_OFFSETS.map(deg => ({
    deg,
    poly: normalizePoly(resamplePolygon(rotatePolygon(normalized, deg), GEO_N)),
  }))

  return isoCodes.flatMap(iso => {
    const country = countryMeta.find(c => c.iso_a3 === iso)
    if (!country) return []
    const countryPoly = geoCache.get(iso)
    if (!countryPoly) return []

    let bestDist = Infinity, bestAngle = 0
    for (const { deg, poly } of rotatedPolys) {
      const d = chamferDistance(poly, countryPoly)
      if (d < bestDist) { bestDist = d; bestAngle = deg }
    }

    const userRawPoly = resamplePolygon(normalized, GEO_N)
    const countryBase = getCountryRawPoly(iso)
    const countryRawPoly = countryBase ? resamplePolygon(rotatePolygon(countryBase, -bestAngle), GEO_N) : null

    return [{ iso, name: country.name, bestDist, bestAngle, userRawPoly, countryRawPoly }]
  })
}

export function getCountryRawPoly(iso: string): Point[] | null {
  const feature = worldFeatures.get(iso) as { geometry: { type: string; coordinates: number[][][][] | number[][][] } } | undefined
  if (!feature?.geometry) return null
  const ring = getLargestRing(feature.geometry)
  if (!ring) return null
  const projected: Point[] = (ring as unknown as number[][]).map(([lon, lat]) => [lon, mercatorY(lat)])
  return resamplePolygon(projected, GEO_N)
}
