export function Logo({ size = 22 }: { size?: number }) {
  return (
    <div className="flex items-center gap-[7px]">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#002FA7" strokeWidth="1.6" />
        <ellipse cx="12" cy="12" rx="4" ry="10" stroke="#002FA7" strokeWidth="1" opacity="0.6" />
        <line x1="2" y1="12" x2="22" y2="12" stroke="#002FA7" strokeWidth="1" opacity="0.6" />
        <circle cx="12" cy="12" r="2" fill="#002FA7" />
      </svg>
      <span className="font-sans font-semibold tracking-[-0.02em] text-[15px] text-foreground">
        Pareido<span className="text-[#002FA7]">Map</span>
      </span>
    </div>
  )
}
