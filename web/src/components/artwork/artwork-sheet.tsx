import { Play, Trash2 } from 'lucide-react'

import type { ArtItem, ArtworkMeta, ThumbnailState } from '@/api/types'
import { Thumbnail } from '@/components/artwork/thumbnail'
import { MatteSelect } from '@/components/shared/matte-select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'

export function ArtworkSheet({
  item,
  meta,
  thumbnailSrc,
  thumbnailState,
  current,
  onOpenChange,
  onDisplay,
  onMatteChange,
  onDelete,
}: {
  item: ArtItem | null
  meta?: ArtworkMeta
  thumbnailSrc?: string
  thumbnailState: ThumbnailState
  current: boolean
  onOpenChange: (open: boolean) => void
  onDisplay: (id: string) => void
  onMatteChange: (id: string, matteId: string) => void
  onDelete: (id: string) => void
}) {
  const title = item ? meta?.title || item.title || item.file_name || 'Untitled artwork' : ''

  return (
    <Sheet open={Boolean(item)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-xl">
        {item && (
          <>
            <SheetHeader className="border-b p-4">
              <SheetTitle>{title}</SheetTitle>
              <SheetDescription>
                {current ? 'Currently displayed on the Frame' : 'Ready to display'}
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-4 p-4">
              <Thumbnail
                className="aspect-[16/9] w-full rounded-lg border bg-muted object-cover"
                src={thumbnailSrc}
                state={thumbnailState}
                title={title}
              />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Metadata label="Size" value={meta?.width && meta?.height ? `${meta.width} x ${meta.height}` : 'Unknown'} />
                <Metadata label="Original file" value={meta?.original_filename || 'Unknown'} />
                <Metadata label="Content ID" value={item.content_id} />
              </div>
              <div className="grid gap-2 rounded-lg border bg-card p-3">
                <Label>Artwork matte</Label>
                <MatteSelect
                  value={item.matte_id || 'none'}
                  onValueChange={(matteId) => onMatteChange(item.content_id, matteId)}
                  triggerClassName="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Changes only this artwork. It does not alter the default matte setting.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => onDisplay(item.content_id)}>
                  <Play className="size-4" />
                  Display on Frame
                </Button>
                <Button variant="destructive" onClick={() => onDelete(item.content_id)}>
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Metadata({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="truncate font-medium">{value}</div>
    </div>
  )
}
