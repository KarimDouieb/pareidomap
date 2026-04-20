import type { CityDot } from './mapRenderer'

const CACHE_NAME = 'pareidomap-data-v1'
const BASE = import.meta.env.BASE_URL

export async function loadCities(): Promise<Record<string, CityDot[]>> {
  const cache = await caches.open(CACHE_NAME)
  const url = `${BASE}countryTopCities.json`
  const hit = await cache.match(url)
  const res = hit ?? await fetch(url)
  if (!hit) await cache.put(url, res.clone())

  const raw = await res.json() as Record<string, Array<{
    city: string; lat: number; lng: number
    capital: string | null; population: number | null
  }>>

  const result: Record<string, CityDot[]> = {}
  for (const [iso3, cityList] of Object.entries(raw)) {
    const capital = cityList.find(c => c.capital === 'primary')
    const topTwo = cityList
      .filter(c => c.capital !== 'primary' && c.population != null)
      .sort((a, b) => (b.population ?? 0) - (a.population ?? 0))
      .slice(0, 2)
    result[iso3] = [
      ...(capital ? [{ name: capital.city, lon: capital.lng, lat: capital.lat, capital: true }] : []),
      ...topTwo.map(c => ({ name: c.city, lon: c.lng, lat: c.lat, capital: false })),
    ]
  }
  return result
}
