import { useState } from 'react'
import { Onboarding } from '@/screens/Onboarding'
import { Camera } from '@/screens/Camera'
import { Preview } from '@/screens/Preview'
import { Trace } from '@/screens/Trace'

type Screen = 'onboarding' | 'camera' | 'preview' | 'trace'

export default function App() {
  const [screen, setScreen] = useState<Screen>('onboarding')
  const [photo, setPhoto] = useState<string | null>(null)

  function handleCapture(dataUrl: string) {
    setPhoto(dataUrl)
    setScreen('preview')
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
            onRetake={() => setScreen('preview')}
            onContinue={() => console.log('continue to match')}
          />
        )}
      </div>
    </div>
  )
}
