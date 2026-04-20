import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const WORLD_PATH = resolve(import.meta.dirname, '../public/world.geojson')
const OUT = resolve(import.meta.dirname, '../public/country-descriptors.json')

console.log('Reading world.geojson...')
const world = JSON.parse(readFileSync(WORLD_PATH, 'utf-8'))

interface CountryEntry {
  iso_a3: string
  name: string
  subregion: string
  continent: string
}

const entries: CountryEntry[] = []
const seen = new Set<string>()

for (const feature of world.features) {
  const { ISO_A3, ISO_A3_EH, ADM0_A3, HOMEPART, NAME, SUBREGION, CONTINENT } = feature.properties
  const iso = (ISO_A3 && ISO_A3 !== '-99') ? ISO_A3
    : (HOMEPART === 1 && ISO_A3_EH && ISO_A3_EH !== '-99') ? ISO_A3_EH
    : (HOMEPART === 1 && ADM0_A3 && ADM0_A3 !== '-99') ? ADM0_A3
    : null
  if (!iso || seen.has(iso)) continue
  seen.add(iso)
  entries.push({ iso_a3: iso, name: NAME, subregion: SUBREGION ?? '', continent: CONTINENT ?? '' })
}

writeFileSync(OUT, JSON.stringify({ version: 1, countries: entries }))
console.log(`Wrote ${OUT} (${entries.length} countries)`)
