import { geoMercator, geoPath, type GeoPermissibleObjects } from 'd3-geo'
import { select } from 'd3-selection'
import type { MaskBounds } from './contour'

export interface CityDot {
  name: string
  lon: number
  lat: number
  capital: boolean
}

export function renderCountryMap(
  svgEl: SVGSVGElement,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  feature: any,
  cities: CityDot[],
  width: number,
  height: number,
  maskBounds: MaskBounds | null,
  bestAngle: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  allFeatures: any[] = [],
): void {
  const svg = select(svgEl)
  svg.selectAll('*').remove()
  svg.attr('viewBox', `0 0 ${width} ${height}`)

  // ── Project country into a normalised 1000×1000 space ──────────────────────
  const REF = 1000
  const tempProj = geoMercator().fitSize([REF, REF], feature as GeoPermissibleObjects)
  const tempPathGen = geoPath(tempProj)
  const [[bx0, by0], [bx1, by1]] = tempPathGen.bounds(feature as GeoPermissibleObjects)
  const [countryCx, countryCy] = tempPathGen.centroid(feature as GeoPermissibleObjects)
  const countryDiag = Math.sqrt((bx1 - bx0) ** 2 + (by1 - by0) ** 2)

  // ── Compute SVG-space transform ─────────────────────────────────────────────
  let transform: string
  if (maskBounds && countryDiag > 0) {
    const cx = maskBounds.normCx * width
    const cy = maskBounds.normCy * height
    const maskDiag = Math.sqrt((maskBounds.normW * width) ** 2 + (maskBounds.normH * height) ** 2)
    const scale = (maskDiag * 1.1) / countryDiag  // slight padding factor
    // SVG transforms apply right-to-left:
    // 1. center country at origin, 2. scale, 3. rotate, 4. move to mask centroid
    // bestAngle is rotation in Y-up EFD space; Y-down (SVG) flips the sign, so we use +bestAngle here.
    transform = `translate(${cx},${cy}) rotate(${bestAngle}) scale(${scale}) translate(${-countryCx},${-countryCy})`
  } else {
    // Fallback: fit to frame
    const proj = geoMercator().fitExtent([[40, 40], [width - 40, height - 40]], feature as GeoPermissibleObjects)
    const pathGen = geoPath(proj)
    const g = svg.append('g')
    g.append('path').datum(feature as GeoPermissibleObjects).attr('d', d => pathGen(d))
      .attr('fill', 'rgba(0,0,0,0.2)').attr('stroke', 'none')
    g.append('path').datum(feature as GeoPermissibleObjects).attr('d', d => pathGen(d))
      .attr('fill', 'none').attr('stroke', 'white').attr('stroke-width', 2)
      .attr('stroke-linejoin', 'round').attr('filter', 'drop-shadow(0 0 4px rgba(0,0,0,0.9))')
    renderCities(svg, cities, proj)
    renderBadge(svg)
    return
  }

  // ── Render with aligned transform ──────────────────────────────────────────
  // All geometry lives in the 1000-space and is positioned via the group transform
  const g = svg.append('g').attr('transform', transform)

  // World background: all countries using the same projection for geographic context
  if (allFeatures.length > 0) {
    const worldG = g.append('g')
    for (const f of allFeatures) {
      worldG.append('path').datum(f as GeoPermissibleObjects)
        .attr('d', d => tempPathGen(d))
        .attr('fill', 'none')
        .attr('stroke', 'rgba(255,255,255,0.12)')
        .attr('stroke-width', 0.8 / ((maskBounds ? Math.sqrt((maskBounds.normW * width) ** 2 + (maskBounds.normH * height) ** 2) : REF) / countryDiag))
        .attr('stroke-linejoin', 'round')
    }
  }

  g.append('path').datum(feature as GeoPermissibleObjects)
    .attr('d', d => tempPathGen(d))
    .attr('fill', 'rgba(0,0,0,0.25)')
    .attr('stroke', 'none')

  g.append('path').datum(feature as GeoPermissibleObjects)
    .attr('d', d => tempPathGen(d))
    .attr('fill', 'none')
    .attr('stroke', 'white')
    .attr('stroke-width', 2 / ((maskBounds ? Math.sqrt((maskBounds.normW * width) ** 2 + (maskBounds.normH * height) ** 2) : REF) / countryDiag))
    .attr('stroke-linejoin', 'round')
    .attr('filter', 'drop-shadow(0 0 4px rgba(0,0,0,0.9))')

  // Cities — project to 1000-space, then let the group transform position them
  for (const city of cities) {
    const coords = tempProj([city.lon, city.lat])
    if (!coords) continue
    const [cx, cy] = coords

    if (city.capital) {
      g.append('circle').attr('cx', cx).attr('cy', cy).attr('r', 8)
        .attr('fill', 'none').attr('stroke', 'white').attr('stroke-width', 1.2)
    }
    g.append('circle').attr('cx', cx).attr('cy', cy).attr('r', city.capital ? 4 : 3)
      .attr('fill', 'white').attr('opacity', 0.9)

    // Scale text inversely so it reads at a constant size regardless of zoom
    const scale = countryDiag / ((maskBounds ? Math.sqrt((maskBounds.normW * width) ** 2 + (maskBounds.normH * height) ** 2) * 1.1 : REF))
    g.append('text')
      .attr('x', cx + 10 * scale).attr('y', cy + 4 * scale)
      .attr('font-family', 'Geist, sans-serif')
      .attr('font-size', (city.capital ? 11 : 9) * scale)
      .attr('font-weight', city.capital ? '500' : '400')
      .attr('fill', 'white').attr('opacity', 0.9)
      .attr('filter', 'drop-shadow(0 1px 2px rgba(0,0,0,0.9))')
      .text(city.name)
  }

  renderBadge(svg)
}

function renderCities(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  svg: any,
  cities: CityDot[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  proj: any,
) {
  for (const city of cities) {
    const coords = proj([city.lon, city.lat])
    if (!coords) continue
    const [cx, cy] = coords
    if (city.capital) {
      svg.append('circle').attr('cx', cx).attr('cy', cy).attr('r', 6)
        .attr('fill', 'none').attr('stroke', 'white').attr('stroke-width', 1)
    }
    svg.append('circle').attr('cx', cx).attr('cy', cy).attr('r', city.capital ? 3 : 2.5)
      .attr('fill', 'white').attr('opacity', 0.9)
    svg.append('text')
      .attr('x', cx + 8).attr('y', cy + 4)
      .attr('font-family', 'Geist, sans-serif').attr('font-size', city.capital ? 10 : 8)
      .attr('fill', 'white').attr('opacity', 0.9)
      .attr('filter', 'drop-shadow(0 1px 2px rgba(0,0,0,0.9))').text(city.name)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderBadge(svg: any) {
  const badge = svg.append('g').attr('transform', 'translate(10,10)')
  badge.append('rect').attr('rx', 3).attr('width', 82).attr('height', 18)
    .attr('fill', 'black').attr('opacity', 0.55)
  badge.append('text').attr('x', 6).attr('y', 13)
    .attr('font-family', 'Geist Mono, monospace').attr('font-size', 8)
    .attr('font-weight', '600').attr('letter-spacing', '0.08em')
    .attr('fill', 'white').text('PAREIDOMAP')
}
