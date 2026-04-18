import * as React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {}

function Badge({ className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[4px] border border-border bg-muted px-1.5 py-0.5 font-mono text-[10.5px] text-muted-foreground',
        className
      )}
      {...props}
    />
  )
}

export { Badge }
