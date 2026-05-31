import { ImageIcon } from 'lucide-react'

import type { ThumbnailState } from '@/api/types'
import { Skeleton } from '@/components/ui/skeleton'

export function Thumbnail({
  src,
  state,
  title,
  className,
}: {
  src?: string
  state: ThumbnailState
  title: string
  className?: string
}) {
  if (state === 'pending' || state === 'loading') {
    return <Skeleton className={className} />
  }

  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-muted text-muted-foreground ${className || ''}`}>
        <ImageIcon className="size-5" />
      </div>
    )
  }

  return <img className={className} src={src} alt={title} loading="lazy" />
}
