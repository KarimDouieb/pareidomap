import { useEffect, useRef, useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'
import { useSegmentation } from '@/hooks/useSegmentation'

interface TapDot { x: number; y: number; remove?: boolean }

export interface TraceContinuePayload {
  mask: Uint8ClampedArray
  width: number
  height: number
}

export function Trace({
  photo,
  onRetake,
  onContinue,
  onMenuOpen,
}: {
  photo: string
  onRetake: () => void
  onContinue: (payload: TraceContinuePayload) => void
  onMenuOpen: () => void
}) {
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { status, downloadProgress, mask, segment, subtractSegment, clearMask } = useSegmentation()
  const [tapDots, setTapDots] = useState<TapDot[]>([])
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null)
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
        imageData.data[i * 4 + 0] = 24
        imageData.data[i * 4 + 1] = 21
        imageData.data[i * 4 + 2] = 18
        imageData.data[i * 4 + 3] = 120
      }
    }
    ctx.putImageData(imageData, 0, 0)
  }, [mask])

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

    const now = Date.now()
    const last = lastTapRef.current
    const isDoubleTap = last && now - last.time < 350
      && Math.abs(relX - last.x) < 0.05 && Math.abs(relY - last.y) < 0.05

    lastTapRef.current = { time: now, x: relX, y: relY }

    if (isDoubleTap && mask) {
      if (tapTimerRef.current) { clearTimeout(tapTimerRef.current); tapTimerRef.current = null }
      lastTapRef.current = null
      setTapDots(dots => [...dots, { x: relX * 100, y: relY * 100, remove: true }])
      if (imgRef.current) subtractSegment(imgRef.current, relX, relY)
    } else {
      if (tapTimerRef.current) { clearTimeout(tapTimerRef.current); tapTimerRef.current = null }
      tapTimerRef.current = setTimeout(() => {
        tapTimerRef.current = null
        lastTapRef.current = null
        setTapDots([{ x: relX * 100, y: relY * 100 }])
        if (imgRef.current) segment(imgRef.current, relX, relY)
      }, 350)
    }
  }

  function handleRetry() {
    if (tapTimerRef.current) { clearTimeout(tapTimerRef.current); tapTimerRef.current = null }
    clearMask()
    setTapDots([])
    lastTapRef.current = null
  }

  const isDownloading = status === 'downloading'
  const isInferring = status === 'inferring'
  const hasMask = !!mask

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

      {/* Image + canvas stack */}
      <div className="mt-6 flex-1 flex flex-col">
        <div className="relative rounded-xl overflow-hidden border border-border">
          <img
            ref={imgRef}
            src={photo}
            alt="Captured"
            className="w-full block"
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full transition-opacity duration-300"
            style={{ pointerEvents: 'none', opacity: hasMask ? 1 : 0 }}
          />
          <div
            className="absolute inset-0"
            style={{ cursor: status === 'ready' ? 'crosshair' : 'default' }}
            onPointerDown={handleTap}
          />
          {tapDots.map((dot, i) => (
            <div
              key={i}
              className={`absolute w-4 h-4 rounded-full border-2 border-white -translate-x-1/2 -translate-y-1/2 pointer-events-none ${dot.remove ? 'bg-red-500' : 'bg-foreground'}`}
              style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
            />
          ))}
          {isInferring && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin opacity-80" />
            </div>
          )}
        </div>

        {!isDownloading && (
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground text-center mt-3">
            {status === 'ready' && !hasMask && 'Tap the shape you want to trace'}
            {status === 'ready' && hasMask && 'Shape detected — double-tap to remove a part'}
            {status === 'error' && 'Something went wrong'}
          </p>
        )}
      </div>

      {/* Download progress overlay */}
      {isDownloading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 z-10">
          <svg width="72" height="72" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="30" stroke="hsl(var(--muted))" strokeWidth="4" fill="none" />
            <circle
              cx="36" cy="36" r="30"
              stroke="hsl(var(--foreground))" strokeWidth="4" fill="none"
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
      <div className="flex flex-col pb-8 pt-4 gap-3">
        {hasMask ? (
          <>
            <Button
              variant="outline"
              className="w-full font-mono uppercase tracking-widest text-xs rounded-full"
              onClick={() => {
                if (mask && imgRef.current) {
                  onContinue({ mask, width: imgRef.current.naturalWidth, height: imgRef.current.naturalHeight })
                }
              }}
            >
              Looks Good →
            </Button>
            <button
              className="w-full text-center font-mono text-xs uppercase tracking-widest text-muted-foreground py-2"
              onClick={handleRetry}
            >
              Try Again
            </button>
          </>
        ) : (
          <button
            className="w-full text-center font-mono text-xs uppercase tracking-widest text-muted-foreground py-2"
            onClick={onRetake}
          >
            ← Back to Photo
          </button>
        )}
      </div>
    </div>
  )
}
