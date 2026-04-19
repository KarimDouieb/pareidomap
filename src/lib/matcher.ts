import type { Point } from './contour'
import { resamplePolygon, computeEFD, rotatePolygon, descriptorDistance } from './descriptor'

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

const ROTATION_OFFSETS = [-45, -30, -15, 0, 15, 30, 45]
const N_SAMPLES = 512
const N_HARMONICS = 32
const SCORE_K = 3.5

export function matchCountries(poly: Point[]): MatchResult[] {
  if (countryDescriptors.length === 0) return []

  // Pre-compute descriptors at each rotation angle
  const rotatedDescs = ROTATION_OFFSETS.map(deg => {
    const rotated = rotatePolygon(poly, deg)
    const resampled = resamplePolygon(rotated, N_SAMPLES)
    return computeEFD(resampled, N_HARMONICS)
  })

  const scored = countryDescriptors.map(country => {
    let bestDist = Infinity
    let bestAngle = 0
    for (let r = 0; r < ROTATION_OFFSETS.length; r++) {
      const d = descriptorDistance(rotatedDescs[r], country.descriptors)
      if (d < bestDist) { bestDist = d; bestAngle = ROTATION_OFFSETS[r] }
    }
    const score = Math.round(100 * Math.exp(-bestDist * SCORE_K))
    return { iso_a3: country.iso_a3, name: country.name, subregion: country.subregion, continent: country.continent, score, bestAngle }
  })

  return scored.sort((a, b) => b.score - a.score).slice(0, 15)
}
