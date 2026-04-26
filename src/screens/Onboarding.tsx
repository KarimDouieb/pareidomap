import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'

const STEPS = [
  { n: '01', title: 'Snap', desc: 'Take a photo of any pattern' },
  { n: '02', title: 'Trace', desc: 'Tap to outline the shape' },
  { n: '03', title: 'Match', desc: 'We find the closest country' },
]

export function Onboarding({
  onStart,
  onGallery,
  onMenuOpen,
}: {
  onStart: () => void
  onGallery: () => void
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

      {/* Heading */}
      <div className="mt-12">
        <h1 className="text-[38px] font-bold leading-[1.05] tracking-[-0.02em]">
          Everything<br />is a map.<br />
          <span className="text-muted-foreground font-medium">You just haven't<br />seen it yet.</span>
        </h1>
      </div>

      {/* Steps */}
      <div className="mt-10 space-y-5">
        {STEPS.map(step => (
          <div key={step.n} className="flex items-start gap-5">
            <span className="font-mono text-xs text-muted-foreground w-6 shrink-0 pt-0.5">{step.n}</span>
            <div>
              <div className="text-sm font-semibold">{step.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{step.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex-1 flex flex-col justify-end pb-8 pt-8">
        <Button
          variant="outline"
          className="w-full font-mono uppercase tracking-widest text-xs rounded-full"
          onClick={onStart}
        >
          Start Hunting →
        </Button>
        <button
          onClick={onGallery}
          className="w-full text-center font-mono text-xs uppercase tracking-widest text-muted-foreground py-3 mt-1"
        >
          See Gallery
        </button>
        <p className="text-center font-mono text-[10px] text-muted-foreground/60 mt-1">
          © Karim Douieb · 2026
        </p>
      </div>
    </div>
  )
}
