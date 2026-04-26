import { useEffect, useRef } from 'react'
import { Camera as CameraIcon, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'

const isMobile = window.matchMedia('(pointer: coarse)').matches

export function Camera({
  onCapture,
  onMenuOpen,
}: {
  onCapture: (dataUrl: string) => void
  onMenuOpen: () => void
}) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const libraryRef = useRef<HTMLInputElement>(null)

  const openedRef = useRef(false)
  useEffect(() => {
    if (isMobile || openedRef.current) return
    openedRef.current = true
    libraryRef.current?.click()
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onCapture(reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col min-h-screen px-6">
      {/* Top bar */}
      <div className="flex items-center justify-between pt-12">
        <Logo />
        <button
          onClick={onMenuOpen}
          className="w-9 h-9 flex items-center justify-center"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleChange} />
      <input ref={libraryRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />

      {isMobile && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Button
            variant="outline"
            className="w-full max-w-xs font-mono uppercase tracking-widest text-xs rounded-full gap-2"
            onClick={() => cameraRef.current?.click()}
          >
            <CameraIcon className="w-4 h-4" />
            Take a Photo →
          </Button>
          <button
            onClick={() => libraryRef.current?.click()}
            className="font-mono text-xs uppercase tracking-widest text-muted-foreground py-2"
          >
            Pick from Library
          </button>
        </div>
      )}
    </div>
  )
}
