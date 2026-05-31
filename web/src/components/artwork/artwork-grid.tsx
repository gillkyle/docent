import type React from 'react'

import type { ArtItem, ArtworkMeta, ThumbnailState } from '@/api/types'
import { ArtworkTile } from '@/components/artwork/artwork-tile'
import { EmptyState } from '@/components/shared/empty-state'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function ArtworkSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <Card key={index} className="gap-3 py-0">
          <Skeleton className="aspect-[16/9] rounded-b-none" />
          <div className="space-y-2 p-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </Card>
      ))}
    </div>
  )
}

export function ArtworkGrid({
  actionsForItem,
  currentId,
  emptyLabel,
  footerEndForItem,
  items,
  loading,
  meta,
  onDisplay,
  onOpen,
  onToggleSelected,
  selectedIds,
  thumbnailCache,
  thumbnailStates,
}: {
  actionsForItem?: (item: ArtItem) => React.ReactNode
  currentId: string | null
  emptyLabel?: string
  footerEndForItem?: (item: ArtItem) => React.ReactNode
  items: ArtItem[]
  loading?: boolean
  meta: Record<string, ArtworkMeta>
  onDisplay: (id: string) => void
  onOpen: (item: ArtItem) => void
  onToggleSelected?: (id: string) => void
  selectedIds?: Set<string>
  thumbnailCache: Record<string, string>
  thumbnailStates: Record<string, ThumbnailState>
}) {
  if (loading) return <ArtworkSkeleton />
  if (!items.length) return <EmptyState label={emptyLabel} />

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {items.map((item) => (
        <ArtworkTile
          key={item.content_id}
          actions={actionsForItem?.(item)}
          current={item.content_id === currentId}
          footerEnd={footerEndForItem?.(item)}
          item={item}
          meta={meta[item.content_id]}
          onDisplay={() => onDisplay(item.content_id)}
          onOpen={() => onOpen(item)}
          onToggleSelected={onToggleSelected ? () => onToggleSelected(item.content_id) : undefined}
          selected={selectedIds?.has(item.content_id)}
          thumbnailSrc={thumbnailCache[item.content_id]}
          thumbnailState={thumbnailStates[item.content_id] || 'pending'}
        />
      ))}
    </div>
  )
}

export { Badge }
