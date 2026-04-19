import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useSegmentation } from '@/hooks/useSegmentation'

interface TapDot { x: number; y: number }

export interface TraceContinuePayload {
  mask: Uint8ClampedArray
  width: number
  height: number
}

export function Trace({ photo, onRetake, onContinue }: {
  photo: string
  onRetake: () => void
  onContinue: (payload: TraceContinuePayload) => void
}) {
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { status, downloadProgress, mask, segment, clearMask } = useSegmentation()
  const [tapDot, setTapDot] = useState<TapDot | null>(null)

  // Draw mask onto canvas whenever it changes
  useEffect(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img || !mask) return

    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const imageData = ctx.createImageData(canvas.width, canvas.height)
    for (let i = 0; i < mask.length; i++) {
      if (mask[i] === 255) {
        imageData.data[i * 4 + 0] = 0
        imageData.data[i * 4 + 1] = 47
        imageData.data[i * 4 + 2] = 167
        imageData.data[i * 4 + 3] = 115
      }
    }
    ctx.putImageData(imageData, 0, 0)
  }, [mask])

  // Clear canvas when mask is cleared
  useEffect(() => {
    if (!mask && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
  }, [mask])

  function handleTap(e: React.PointerEvent<HTMLDivElement>) {
    if (status !== 'ready' && status !== 'inferring') return
    const rect = e.currentTarget.getBoundingClientRect()
    const relX = (e.clientX - rect.left) / rect.width
    const relY = (e.clientY - rect.top) / rect.height
    setTapDot({ x: relX * 100, y: relY * 100 })
    if (imgRef.current) segment(imgRef.current, relX, relY)
  }

  function handleRetry() {
    clearMask()
    setTapDot(null)
  }

  const isDownloading = status === 'downloading'
  const isInferring = status === 'inferring'
  const hasMask = !!mask

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex items-center justify-between px-[18px] pt-12">
        <Logo />
      </div>

      {/* Image + canvas stack */}
      <div className="px-6 mt-6 flex-1 flex flex-col">
        <div className="relative rounded-[14px] overflow-hidden border border-border">
          <img
            ref={imgRef}
            src={photo}
            alt="Captured"
            className="w-full block"
            style={{ display: 'block' }}
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full transition-opacity duration-300"
            style={{ pointerEvents: 'none', opacity: hasMask ? 1 : 0 }}
          />
          {/* Tap handler */}
          <div
            className="absolute inset-0"
            style={{ cursor: status === 'ready' ? 'crosshair' : 'default' }}
            onPointerDown={handleTap}
          />
          {/* Tap dot */}
          {tapDot && (
            <div
              className="absolute w-4 h-4 rounded-full border-2 border-white bg-[#002FA7] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{ left: `${tapDot.x}%`, top: `${tapDot.y}%` }}
            />
          )}
          {/* Inferring spinner */}
          {isInferring && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-8 h-8 rounded-full border-2 border-[#002FA7] border-t-transparent animate-spin" />
            </div>
          )}
        </div>

        {!isDownloading && (
          <p className="text-xs text-muted-foreground text-center mt-3">
            {status === 'ready' && !hasMask && 'Tap the shape you want to trace'}
            {status === 'ready' && hasMask && 'Shape detected!'}
            {status === 'error' && 'Something went wrong'}
          </p>
        )}
      </div>

      {/* Download progress overlay */}
      {isDownloading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 z-10">
          <svg width="72" height="72" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="30" stroke="#E6EBF7" strokeWidth="4" fill="none" />
            <circle
              cx="36" cy="36" r="30"
              stroke="#002FA7" strokeWidth="4" fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 30}`}
              strokeDashoffset={`${2 * Math.PI * 30 * (1 - downloadProgress)}`}
              transform="rotate(-90 36 36)"
              style={{ transition: 'stroke-dashoffset 0.2s ease' }}
            />
          </svg>
          <p className="text-sm font-medium mt-4">Loading AI model</p>
          <p className="text-xs text-muted-foreground mt-1">
            {Math.round(downloadProgress * 100)}% — one-time download
          </p>
        </div>
      )}

      {/* Bottom actions */}
      <div className="flex flex-col px-6 pb-8 pt-4 gap-2">
        {hasMask ? (
          <>
            <Button className="w-full" onClick={() => {
              if (mask && imgRef.current) {
                onContinue({ mask, width: imgRef.current.naturalWidth, height: imgRef.current.naturalHeight })
              }
            }}>
              Looks good
              <ArrowRight className="w-[14px] h-[14px]" />
            </Button>
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={handleRetry}>
              Try again
            </Button>
          </>
        ) : (
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={onRetake}>
            <ArrowLeft className="w-[14px] h-[14px]" />
            Back to photo
          </Button>
        )}
      </div>
    </div>
  )
}
