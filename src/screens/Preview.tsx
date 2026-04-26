import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'

export function Preview({
  photo,
  onRetake,
  onContinue,
  onMenuOpen,
}: {
  photo: string
  onRetake: () => void
  onContinue: () => void
  onMenuOpen: () => void
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Full-width image with overlaid nav */}
      <div className="relative w-full">
        <img src={photo} alt="Captured" className="w-full block" />
        {/* Overlay nav */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-12">
          <div className="bg-white/90 rounded-full px-3 py-1.5">
            <Logo />
          </div>
          <button
            onClick={onMenuOpen}
            className="w-9 h-9 flex items-center justify-center bg-white/20 rounded-full backdrop-blur-sm"
            aria-label="Menu"
          >
            <Menu className="w-5 h-5 text-white drop-shadow-md" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col px-6">
        <p className="text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-6">
          Tap the shape you want to trace
        </p>
      </div>

      <div className="px-6 pb-8 pt-6 flex flex-col gap-3">
        <Button
          variant="outline"
          className="w-full font-mono uppercase tracking-widest text-xs rounded-full"
          onClick={onContinue}
        >
          Looks Good →
        </Button>
        <button
          onClick={onRetake}
          className="w-full text-center font-mono text-xs uppercase tracking-widest text-muted-foreground py-2"
        >
          ← Retake Picture
        </button>
      </div>
    </div>
  )
}
