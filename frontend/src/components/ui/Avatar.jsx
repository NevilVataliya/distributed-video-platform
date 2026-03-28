import { cn } from '@/lib/utils'
import { User } from 'lucide-react'

export function Avatar({ src, alt = '', fallback, size = 'default', className }) {
  const initials = alt ? alt.slice(0, 2).toUpperCase() : fallback
  
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    default: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-lg',
  }

  return (
    <div
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full font-medium bg-muted text-muted-foreground border border-border shadow-sm items-center justify-center',
        sizes[size],
        className
      )}
    >
      {src ? (
        <img src={src} alt={alt} className="aspect-square h-full w-full object-cover" />
      ) : initials ? (
        initials
      ) : (
        <User className="h-1/2 w-1/2" />
      )}
    </div>
  )
}
