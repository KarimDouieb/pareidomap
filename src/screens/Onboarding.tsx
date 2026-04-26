import { ArrowRight, Images } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/Logo'
import { cn } from '@/lib/utils'

const ITALY_PATH =
  'M80 30 L98 24 L108 30 L118 38 L130 32 L138 40 L132 54 L120 62 L112 74 L108 88 L112 100 L118 112 L124 126 L130 142 L134 156 L142 164 L156 168 L168 178 L164 192 L152 196 L142 192 L136 182 L128 176 L118 172 L108 168 L100 158 L94 146 L92 132 L88 118 L80 108 L72 98 L66 88 L62 78 L58 68 L62 58 L68 48 L76 38 Z'

const STEPS = [
  { n: 1, title: 'Snap',  desc: 'A photo of any pattern' },
  { n: 2, title: 'Trace', desc: 'Tap to outline the shape' },
  { n: 3, title: 'Match', desc: 'We find the closest country' },
]

export function Onboarding({ onStart, onGallery }: { onStart: () => void; onGallery: () => void }) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Top bar */}
      <div className="flex items-center justify-between px-[18px] pt-12">
        <Logo />
        <Badge>v0.1 · beta</Badge>
      </div>

      {/* Hero illustration */}
      <div className="px-6 mt-9">
        <div className="w-full aspect-[4/3] rounded-[14px] border border-border bg-[#FAFAFA] relative overflow-hidden">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 240 180"
            preserveAspectRatio="xMidYMid slice"
          >
            {/* faux stain / texture blob */}
            <ellipse cx="118" cy="92" rx="58" ry="48" fill="#6b4a30" opacity="0.18" />
            <path
              d="M70 90 Q 78 60 108 56 Q 138 52 154 70 Q 168 84 158 100 Q 168 120 154 134 Q 134 144 118 132 Q 92 134 80 122 Q 60 110 70 90 Z"
              fill="#0A0A0A"
              opacity="0.85"
            />
            {/* Italy outline overlaid on blob */}
            <g transform="translate(118 70) scale(0.4)">
              <path
                d={ITALY_PATH}
                fill="none"
                stroke="#002FA7"
                strokeWidth="3"
                strokeLinejoin="round"
              />
            </g>
            {/* hand-drawn arrow + label */}
            <path
              d="M180 38 Q 168 50 152 60"
              stroke="#002FA7"
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M156 56 L 152 60 L 158 64"
              stroke="#002FA7"
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text
              x="184"
              y="34"
              fontFamily="Caveat, cursive"
              fontSize="18"
              fill="#002FA7"
              fontWeight="600"
            >
              it's italy!
            </text>
          </svg>
        </div>
      </div>

      {/* Title + description */}
      <div className="text-center px-7 pt-8">
        <h1 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.02em]">
          See <span className="hand-circle">countries</span>
          <br />
          in everything.
        </h1>
        <p className="text-sm text-muted-foreground mt-[18px] max-w-[280px] mx-auto leading-[1.55]">
          A stain on the wall. A crumb on a plate. A cloud at dusk.
          Snap it — we'll find the country it's pretending to be.
        </p>
      </div>

      {/* Steps card */}
      <div className="px-6 pt-6">
        <Card>
          <CardContent className="p-1">
            {STEPS.map((step, i) => (
              <div
                key={step.n}
                className={cn(
                  'flex items-center gap-3 px-[14px] py-3',
                  i < STEPS.length - 1 && 'border-b border-border'
                )}
              >
                <div className="w-[26px] h-[26px] rounded-full bg-[#E6EBF7] text-[#002FA7] font-mono text-xs font-medium flex items-center justify-center shrink-0">
                  {step.n}
                </div>
                <div>
                  <div className="text-sm font-medium">{step.title}</div>
                  <div className="text-xs text-muted-foreground">{step.desc}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* CTAs */}
      <div className="flex-1 flex flex-col justify-end px-6 pb-8 pt-6">
        <Button className="w-full" onClick={onStart}>
          Start hunting
          <ArrowRight className="w-[14px] h-[14px]" />
        </Button>
        <Button variant="ghost" className="mt-1.5 text-muted-foreground w-full gap-2" onClick={onGallery}>
          <Images className="w-4 h-4" />
          My gallery
        </Button>
      </div>
    </div>
  )
}
