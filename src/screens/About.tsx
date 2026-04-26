import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'

export function About({
  onMenuOpen,
  onStartHunting,
}: {
  onMenuOpen: () => void
  onStartHunting: () => void
}) {
  return (
    <div className="flex flex-col min-h-screen px-6">
      {/* Top bar */}
      <div className="flex items-center justify-between pt-12">
        <Logo />
        <button
          onClick={onMenuOpen}
          className="w-9 h-9 flex items-center justify-center text-foreground"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="mt-12 flex-1">
        <h1 className="text-[38px] font-bold leading-[1.05] tracking-[-0.02em]">
          About
        </h1>

        <div className="mt-8 space-y-5 text-sm text-muted-foreground leading-[1.7]">
          <p>
            PareidoMap is a visual experiment at the intersection of perception and cartography.
            It explores pareidolia — the tendency to see familiar patterns in random shapes — through the lens of geography.
          </p>
          <p>
            Snap any pattern around you. A stain on a wall, a cloud at dusk, a crumb on a plate.
            Trace its outline and we'll find the country it's been pretending to be all along.
          </p>
        </div>

        {/* Social links */}
        <div className="mt-10 flex items-center gap-6">
          <a
            href="https://twitter.com/KarimDouieb"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            X
          </a>
          <a
            href="https://instagram.com/karimdouieb"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            Instagram
          </a>
          <a
            href="https://linkedin.com/in/karimdouieb"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            LinkedIn
          </a>
        </div>
      </div>

      {/* CTA */}
      <div className="pb-8 pt-6">
        <Button
          variant="outline"
          className="w-full font-mono uppercase tracking-widest text-xs rounded-full"
          onClick={onStartHunting}
        >
          Start Hunting →
        </Button>
        <p className="text-center font-mono text-[10px] text-muted-foreground/60 mt-4">
          © Karim Douieb · 2026
        </p>
      </div>
    </div>
  )
}
