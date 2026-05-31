import type { ReactNode } from 'react'
import { MoreHorizontal, Play, Square, SquareCheck } from 'lucide-react'

import type { ArtItem, ArtworkMeta, ThumbnailState } from '@/api/types'
import { Thumbnail } from '@/components/artwork/thumbnail'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export function ArtworkTile({
  actions,
  current,
  footerEnd,
  item,
  meta,
  onDisplay,
  onOpen,
  onToggleSelected,
  selected,
  thumbnailSrc,
  thumbnailState,
}: {
  actions?: ReactNode
  current: boolean
  footerEnd?: ReactNode
  item: ArtItem
  meta?: ArtworkMeta
  onDisplay: () => void
  onOpen: () => void
  onToggleSelected?: () => void
  selected?: boolean
  thumbnailSrc?: string
  thumbnailState: ThumbnailState
}) {
  const title = meta?.title || item.title || item.file_name || 'Untitled artwork'
  const detail = [meta?.width && meta?.height ? `${meta.width} x ${meta.height}` : null, item.matte_id]
    .filter(Boolean)
    .join(' | ')

  return (
    <Card className="group min-w-0 gap-0 overflow-hidden py-0">
      <div className="relative aspect-[16/9] bg-muted">
        <button className="h-full w-full text-left" onClick={onOpen} type="button">
          <Thumbnail
            className="h-full w-full object-cover"
            src={thumbnailSrc}
            state={thumbnailState}
            title={title}
          />
        </button>
        {onToggleSelected && (
          <Button
            className="absolute top-2 right-2 bg-background/92 shadow-sm"
            variant="outline"
            size="icon-sm"
            type="button"
            aria-label={selected ? 'Deselect artwork' : 'Select artwork'}
            onClick={onToggleSelected}
          >
            {selected ? <SquareCheck className="size-4" /> : <Square className="size-4" />}
          </Button>
        )}
        {current && <Badge className="absolute top-2 left-2">On Frame</Badge>}
      </div>
      <CardHeader className="px-3 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate text-sm">{title}</CardTitle>
            <CardDescription className="truncate text-xs">
              {detail || meta?.original_filename || 'Frame artwork'}
            </CardDescription>
          </div>
          {actions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Artwork actions">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">{actions}</DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardFooter className="justify-between px-3 py-2">
        <Button variant="ghost" size="sm" onClick={onOpen}>
          Details
        </Button>
        {footerEnd || (
          <Button variant="outline" size="sm" onClick={onDisplay}>
            <Play className="size-3.5" />
            Display
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
