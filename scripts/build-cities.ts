import { writeFileSync } from 'fs'
import { resolve } from 'path'

const PLACES_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_populated_places_simple.geojson'
const OUT = resolve(import.meta.dirname, '../public/cities.json')

interface Place {
  type: 'Feature'
  properties: {
    name: string
    adm0_a3: string
    featurecla: string
    pop_max: number
    scalerank: number
  }
  geometry: { type: 'Point'; coordinates: [number, number] }
}

console.log('Downloading populated places...')
const res = await fetch(PLACES_URL)
if (!res.ok) throw new Error(`HTTP ${res.status}`)
const data = await res.json() as { features: Place[] }

const cities: Record<string, Array<{ name: string; lon: number; lat: number; capital: boolean }>> = {}

for (const f of data.features) {
  const p = f.properties
  const iso = p.adm0_a3
  if (!iso || iso === '-99') continue

  const isCapital = p.featurecla?.includes('capital') ?? false
  const isMajor = p.pop_max >= 1_000_000

  if (!isCapital && !isMajor) continue

  if (!cities[iso]) cities[iso] = []
  cities[iso].push({
    name: p.name,
    lon: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1],
    capital: isCapital,
  })
}

// Keep at most 6 cities per country, capitals first
for (const iso of Object.keys(cities)) {
  cities[iso].sort((a, b) => (b.capital ? 1 : 0) - (a.capital ? 1 : 0))
  cities[iso] = cities[iso].slice(0, 6)
}

writeFileSync(OUT, JSON.stringify(cities))
console.log(`Wrote ${OUT} (${Object.keys(cities).length} countries, ${Object.values(cities).flat().length} cities)`)
