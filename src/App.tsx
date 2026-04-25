import { useEffect, useState } from 'react'
import { Onboarding } from '@/screens/Onboarding'
import { Camera } from '@/screens/Camera'
import { Preview } from '@/screens/Preview'
import { Trace, type TraceContinuePayload } from '@/screens/Trace'
import { Result } from '@/screens/Result'
import { Style } from '@/screens/Style'
import { loadCountryData, loadSeaData, matchCountries, type MatchResult } from '@/lib/matcher'
import { extractLargestBlob, traceContour, simplifyPolygon, type MaskBounds, type Point } from '@/lib/contour'

type Screen = 'onboarding' | 'camera' | 'preview' | 'trace' | 'result' | 'style'

export default function App() {
  const [screen, setScreen] = useState<Screen>('onboarding')
  const [photo, setPhoto] = useState<string | null>(null)
  const [matches, setMatches] = useState<MatchResult[] | null>(null)
  const [maskBounds, setMaskBounds] = useState<MaskBounds | null>(null)
  const [debugPoly, setDebugPoly] = useState<Point[] | null>(null)
  const [userPoly, setUserPoly] = useState<Point[] | null>(null)
  const [maskSize, setMaskSize] = useState<{ w: number; h: number } | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null)

  // Preload country and sea data in the background on mount
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
      // Derive bounds from the polygon — same bounding box the matching uses
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

  return (
    <div className="min-h-screen bg-[#1f2025] flex items-center justify-center">
      <div className="w-full max-w-[430px] min-h-screen bg-background relative overflow-x-hidden">
        {screen === 'onboarding' && (
          <Onboarding onStart={() => setScreen('camera')} />
        )}
        {screen === 'camera' && (
          <Camera onCapture={handleCapture} />
        )}
        {screen === 'preview' && photo && (
          <Preview
            photo={photo}
            onRetake={() => setScreen('camera')}
            onContinue={() => setScreen('trace')}
          />
        )}
        {screen === 'trace' && photo && (
          <Trace
            photo={photo}
            onRetake={() => setScreen('camera')}
            onContinue={handleContinue}
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
          />
        )}
        {screen === 'style' && selectedMatch && (
          <Style
            match={selectedMatch}
            photo={photo}
            maskBounds={maskBounds}
            maskSize={maskSize}
            onBack={() => setScreen('result')}
          />
        )}
      </div>
    </div>
  )
}
