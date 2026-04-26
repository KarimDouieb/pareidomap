import { Logo } from '@/components/Logo'

type Screen = 'onboarding' | 'camera' | 'preview' | 'trace' | 'result' | 'style' | 'export' | 'gallery' | 'about'

const MENU_ITEMS: { label: string; screen: Screen }[] = [
  { label: 'Create map', screen: 'camera' },
  { label: 'Gallery', screen: 'gallery' },
  { label: 'About', screen: 'about' },
]

export function MenuDrawer({
  open,
  onClose,
  onNavigate,
}: {
  open: boolean
  onClose: () => void
  onNavigate: (screen: Screen) => void
}) {
  return (
    <div
      className={`fixed inset-0 z-50 flex ${open ? '' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      {/* Left panel */}
      <div
        className={`w-[65%] bg-[#1A1814] flex flex-col pt-16 pb-10 px-8 transition-transform duration-300 ease-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <nav className="flex-1 flex flex-col justify-center gap-1">
          {MENU_ITEMS.map(item => (
            <button
              key={item.screen}
              onClick={() => { onNavigate(item.screen); onClose() }}
              className="text-left text-[26px] font-bold text-white/80 py-3 hover:text-white transition-colors leading-tight"
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="text-white/60">
          <Logo />
        </div>
      </div>

      {/* Right overlay */}
      <div
        className={`flex-1 bg-black/60 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
    </div>
  )
}
