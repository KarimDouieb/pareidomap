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

      <div className="mt-6 flex-1 flex flex-col">
        <div className="w-full aspect-square rounded-xl border border-border overflow-hidden">
          <img src={photo} alt="Captured" className="w-full h-full object-cover" />
        </div>
        <p className="text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-4">
          Tap the shape you want to trace
        </p>
      </div>

      <div className="pb-8 pt-6 flex flex-col gap-3">
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
