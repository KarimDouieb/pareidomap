import { useEffect, useState } from 'react'
import { Onboarding } from '@/screens/Onboarding'
import { Camera } from '@/screens/Camera'
import { Preview } from '@/screens/Preview'
import { Trace, type TraceContinuePayload } from '@/screens/Trace'
import { Result } from '@/screens/Result'
import { loadCountryData, matchCountries, type MatchResult } from '@/lib/matcher'
import { extractLargestBlob, traceContour, simplifyPolygon, getMaskBounds, type MaskBounds, type Point } from '@/lib/contour'

type Screen = 'onboarding' | 'camera' | 'preview' | 'trace' | 'result'

export default function App() {
  const [screen, setScreen] = useState<Screen>('onboarding')
  const [photo, setPhoto] = useState<string | null>(null)
  const [matches, setMatches] = useState<MatchResult[] | null>(null)
  const [maskBounds, setMaskBounds] = useState<MaskBounds | null>(null)
  const [debugPoly, setDebugPoly] = useState<Point[] | null>(null)
  const [maskSize, setMaskSize] = useState<{ w: number; h: number } | null>(null)

  // Preload country data in the background on mount
  useEffect(() => { loadCountryData().catch(() => {}) }, [])

  function handleCapture(dataUrl: string) {
    setPhoto(dataUrl)
    setScreen('trace')
  }

  function handleContinue({ mask, width, height }: TraceContinuePayload) {
    setMatches(null)
    setMaskBounds(getMaskBounds(mask, width, height))
    setScreen('result')
    // Run matching asynchronously so the result screen appears immediately
    setTimeout(() => {
      const blob = extractLargestBlob(mask, width, height)
      const contour = traceContour(blob, width, height)
      const poly = simplifyPolygon(contour, 2)
      setMaskSize({ w: width, h: height })
      setDebugPoly(poly)
      const results = matchCountries(poly)
      setMatches(results)
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
            maskSize={maskSize}
            photo={photo}
            onRetake={() => { setMatches(null); setMaskBounds(null); setDebugPoly(null); setMaskSize(null); setScreen('camera') }}
          />
        )}
      </div>
    </div>
  )
}
