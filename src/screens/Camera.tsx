import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Camera as CameraIcon, Images } from 'lucide-react'

const isMobile = window.matchMedia('(pointer: coarse)').matches

export function Camera({ onCapture }: { onCapture: (dataUrl: string) => void }) {
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

  if (!isMobile) {
    return <input ref={libraryRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 h-full">
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleChange} />
      <input ref={libraryRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      <Button onClick={() => cameraRef.current?.click()} className="w-48 gap-2">
        <CameraIcon className="w-5 h-5" />
        Take Photo
      </Button>
      <Button onClick={() => libraryRef.current?.click()} variant="outline" className="w-48 gap-2">
        <Images className="w-5 h-5" />
        Choose from Library
      </Button>
    </div>
  )
}
