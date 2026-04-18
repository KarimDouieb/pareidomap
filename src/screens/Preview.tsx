import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'
import { ArrowLeft, ArrowRight } from 'lucide-react'

export function Preview({ photo, onRetake, onContinue }: {
  photo: string
  onRetake: () => void
  onContinue: () => void
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex items-center justify-between px-[18px] pt-12">
        <Logo />
      </div>

      <div className="px-6 mt-9 flex-1 flex flex-col">
        <div className="w-full aspect-square rounded-[14px] border border-border overflow-hidden">
          <img src={photo} alt="Captured" className="w-full h-full object-cover" />
        </div>

        <p className="text-sm text-muted-foreground text-center mt-4">
          Happy with this shot?
        </p>
      </div>

      <div className="flex flex-col px-6 pb-8 pt-6 gap-2">
        <Button className="w-full" onClick={onContinue}>
          Trace the shape
          <ArrowRight className="w-[14px] h-[14px]" />
        </Button>
        <Button variant="ghost" className="w-full text-muted-foreground" onClick={onRetake}>
          <ArrowLeft className="w-[14px] h-[14px]" />
          Retake
        </Button>
      </div>
    </div>
  )
}
