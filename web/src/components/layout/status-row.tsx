import type { ReactNode } from 'react'

import type { ThumbnailState } from '@/api/types'
import { Thumbnail } from '@/components/artwork/thumbnail'

export function StatusRow({
  icon,
  label,
  value,
  active,
  thumbnailSrc,
  thumbnailState,
  onThumbnailClick,
}: {
  icon: ReactNode
  label: string
  value: string
  active?: boolean
  thumbnailSrc?: string
  thumbnailState?: ThumbnailState
  onThumbnailClick?: () => void
}) {
  return (
    <div className="flex gap-3 rounded-lg border bg-card p-3">
      {thumbnailState ? (
        onThumbnailClick ? (
          <button
            className="size-9 shrink-0 rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            type="button"
            aria-label={`Open ${value}`}
            onClick={onThumbnailClick}
          >
            <Thumbnail
              className="size-9 rounded-md border bg-muted object-cover transition hover:opacity-85"
              src={thumbnailSrc}
              state={thumbnailState}
              title={value}
            />
          </button>
        ) : (
          <Thumbnail
            className="size-9 shrink-0 rounded-md border bg-muted object-cover"
            src={thumbnailSrc}
            state={thumbnailState}
            title={value}
          />
        )
      ) : (
        <div className="mt-0.5 text-muted-foreground">{icon}</div>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{label}</div>
        <div className="truncate text-xs text-muted-foreground">{value}</div>
      </div>
      <span className={`mt-1 size-2 rounded-full ${active ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
    </div>
  )
}
