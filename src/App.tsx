import { useEffect, useState } from 'react'
import { Onboarding } from '@/screens/Onboarding'
import { Camera } from '@/screens/Camera'
import { Preview } from '@/screens/Preview'
import { Trace, type TraceContinuePayload } from '@/screens/Trace'
import { Result } from '@/screens/Result'
import { Style } from '@/screens/Style'
import { Export } from '@/screens/Export'
import { Gallery } from '@/screens/Gallery'
import { About } from '@/screens/About'
import { MenuDrawer } from '@/components/MenuDrawer'
import { loadCountryData, loadSeaData, matchCountries, type MatchResult } from '@/lib/matcher'
import { extractLargestBlob, traceContour, simplifyPolygon, type MaskBounds, type Point } from '@/lib/contour'

type Screen = 'onboarding' | 'camera' | 'preview' | 'trace' | 'result' | 'style' | 'export' | 'gallery' | 'about'

export default function App() {
  const [screen, setScreen] = useState<Screen>('onboarding')
  const [menuOpen, setMenuOpen] = useState(false)
  const [photo, setPhoto] = useState<string | null>(null)
  const [matches, setMatches] = useState<MatchResult[] | null>(null)
  const [maskBounds, setMaskBounds] = useState<MaskBounds | null>(null)
  const [debugPoly, setDebugPoly] = useState<Point[] | null>(null)
  const [userPoly, setUserPoly] = useState<Point[] | null>(null)
  const [maskSize, setMaskSize] = useState<{ w: number; h: number } | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null)
  const [exportBlob, setExportBlob] = useState<Blob | null>(null)

  useEffect(() => {
    loadCountryData().catch(() => {})
    loadSeaData().catch(() => {})
  }, [])

  function handleCapture(dataUrl: string) {
    setPhoto(dataUrl)
    setScreen('trace')
  }

  function handleContinue({ mask, width, height }: TraceContinuePayload) {
    setMatches(null)
    setMaskBounds(null)
    setScreen('result')
    setTimeout(() => {
      const blob = extractLargestBlob(mask, width, height)
      const contour = traceContour(blob, width, height)
      const poly = simplifyPolygon(contour, 2)
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (const [x, y] of poly) {
        if (x < minX) minX = x; if (x > maxX) maxX = x
        if (y < minY) minY = y; if (y > maxY) maxY = y
      }
      setMaskBounds({ normCx: (minX + maxX) / 2 / width, normCy: (minY + maxY) / 2 / height, normW: (maxX - minX) / width, normH: (maxY - minY) / height })
      setMaskSize({ w: width, h: height })
      setDebugPoly(poly)
      setUserPoly(poly)
      setMatches(matchCountries(poly))
    }, 0)
  }

  function navigate(s: Screen) {
    setMenuOpen(false)
    setScreen(s)
  }

  const openMenu = () => setMenuOpen(true)

  return (
    <div className="min-h-screen bg-[#1f2025] flex items-center justify-center">
      <div className="w-full max-w-[430px] min-h-screen bg-background relative overflow-x-hidden">
        {screen === 'onboarding' && (
          <Onboarding onStart={() => setScreen('camera')} onGallery={() => setScreen('gallery')} onMenuOpen={openMenu} />
        )}
        {screen === 'camera' && (
          <Camera onCapture={handleCapture} onMenuOpen={openMenu} />
        )}
        {screen === 'preview' && photo && (
          <Preview
            photo={photo}
            onRetake={() => setScreen('camera')}
            onContinue={() => setScreen('trace')}
            onMenuOpen={openMenu}
          />
        )}
        {screen === 'trace' && photo && (
          <Trace
            photo={photo}
            onRetake={() => setScreen('camera')}
            onContinue={handleContinue}
            onMenuOpen={openMenu}
          />
        )}
        {screen === 'result' && (
          <Result
            matches={matches}
            maskBounds={maskBounds}
            debugPoly={debugPoly}
            userPoly={userPoly}
            maskSize={maskSize}
            photo={photo}
            onRetake={() => { setMatches(null); setMaskBounds(null); setDebugPoly(null); setUserPoly(null); setMaskSize(null); setScreen('camera') }}
            onStyle={(match) => { setSelectedMatch(match); setScreen('style') }}
            onMenuOpen={openMenu}
          />
        )}
        {screen === 'style' && selectedMatch && (
          <Style
            match={selectedMatch}
            photo={photo}
            maskBounds={maskBounds}
            maskSize={maskSize}
            onBack={() => setScreen('result')}
            onExport={(blob) => { setExportBlob(blob); setScreen('export') }}
            onMenuOpen={openMenu}
          />
        )}
        {screen === 'export' && exportBlob && selectedMatch && (
          <Export
            blob={exportBlob}
            match={{ country: selectedMatch.name, score: selectedMatch.score }}
            onBack={() => setScreen('style')}
            onMenuOpen={openMenu}
          />
        )}
        {screen === 'gallery' && (
          <Gallery onMenuOpen={openMenu} onStartHunting={() => setScreen('camera')} />
        )}
        {screen === 'about' && (
          <About onMenuOpen={openMenu} onStartHunting={() => setScreen('camera')} />
        )}
        <MenuDrawer
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          onNavigate={navigate}
        />
      </div>
    </div>
  )
}
