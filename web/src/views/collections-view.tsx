import { useState } from 'react'
import { Folder, FolderOpen, Play, Trash2 } from 'lucide-react'

import type { ArtItem, ArtworkMeta, Collection, ThumbnailState } from '@/api/types'
import { ArtworkGrid } from '@/components/artwork/artwork-grid'
import { EmptyState } from '@/components/shared/empty-state'
import { IntervalInput } from '@/components/shared/interval-input'
import { MatteSelect } from '@/components/shared/matte-select'
import { Button } from '@/components/ui/button'

export function CollectionsView({
  collections,
  currentId,
  displayIntervalSeconds,
  meta,
  onDisplay,
  onDisplayAll,
  onDisplayIntervalChange,
  onOpenArtwork,
  onRemove,
  onSelectCollection,
  onSetCollectionMatte,
  selectedCollection,
  selectedCollectionItems,
  thumbnailCache,
  thumbnailStates,
}: {
  collections: Collection[]
  currentId: string | null
  displayIntervalSeconds: number
  meta: Record<string, ArtworkMeta>
  onDisplay: (id: string) => void
  onDisplayAll: (collection: Collection) => void
  onDisplayIntervalChange: (seconds: number) => void
  onOpenArtwork: (item: ArtItem) => void
  onRemove: (contentId: string) => void
  onSelectCollection: (collectionId: string) => void
  onSetCollectionMatte: (collection: Collection, matteId: string) => void
  selectedCollection: Collection | null
  selectedCollectionItems: ArtItem[]
  thumbnailCache: Record<string, string>
  thumbnailStates: Record<string, ThumbnailState>
}) {
  if (!collections.length) {
    return (
      <section className="min-h-0 p-4">
        <EmptyState
          label="No collections yet"
          description="Create a collection from selected artwork in the Library."
        />
      </section>
    )
  }

  return (
    <section className="min-h-0 p-4">
      <div className="space-y-4">
        <div className="rounded-lg border bg-card">
          <div className="flex flex-col gap-1 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-medium">Collections</div>
              <div className="text-xs text-muted-foreground">
                Choose a collection to review and manage its artwork.
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {collections.length} saved set{collections.length === 1 ? '' : 's'}
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto p-3">
            {collections.map((collection) => (
              <button
                key={collection.id}
                className={`min-w-52 rounded-md border px-3 py-2 text-left transition ${
                  collection.id === selectedCollection?.id
                    ? 'border-primary bg-primary/8'
                    : 'bg-background hover:bg-accent/55'
                }`}
                type="button"
                onClick={() => onSelectCollection(collection.id)}
              >
                <span className="flex items-center gap-2">
                  <Folder className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm font-medium">{collection.name}</span>
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {collection.content_ids.length} artwork
                  {collection.content_ids.length === 1 ? '' : 's'}
                </span>
              </button>
            ))}
          </div>
        </div>

        <CollectionPreviewPanel
          collection={selectedCollection}
          currentId={currentId}
          displayIntervalSeconds={displayIntervalSeconds}
          items={selectedCollectionItems}
          meta={meta}
          onDisplay={onDisplay}
          onDisplayAll={onDisplayAll}
          onDisplayIntervalChange={onDisplayIntervalChange}
          onOpenArtwork={onOpenArtwork}
          onRemove={onRemove}
          onSetCollectionMatte={onSetCollectionMatte}
          thumbnailCache={thumbnailCache}
          thumbnailStates={thumbnailStates}
        />
      </div>
    </section>
  )
}

function CollectionPreviewPanel({
  collection,
  currentId,
  displayIntervalSeconds,
  items,
  meta,
  onDisplay,
  onDisplayAll,
  onDisplayIntervalChange,
  onOpenArtwork,
  onRemove,
  onSetCollectionMatte,
  thumbnailCache,
  thumbnailStates,
}: {
  collection: Collection | null
  currentId: string | null
  displayIntervalSeconds: number
  items: ArtItem[]
  meta: Record<string, ArtworkMeta>
  onDisplay: (id: string) => void
  onDisplayAll: (collection: Collection) => void
  onDisplayIntervalChange: (seconds: number) => void
  onOpenArtwork: (item: ArtItem) => void
  onRemove: (contentId: string) => void
  onSetCollectionMatte: (collection: Collection, matteId: string) => void
  thumbnailCache: Record<string, string>
  thumbnailStates: Record<string, ThumbnailState>
}) {
  const [collectionMatteId, setCollectionMatteId] = useState('none')

  if (!collection) {
    return <EmptyState label="Choose a collection" description="Select a saved set to manage its artwork." />
  }

  return (
    <section className="min-w-0 rounded-lg border bg-card">
      <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FolderOpen className="size-4" />
            Collection
          </div>
          <h2 className="truncate text-xl font-semibold tracking-normal">{collection.name}</h2>
          <p className="text-sm text-muted-foreground">
            {collection.content_ids.length} artwork{collection.content_ids.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <MatteSelect
            value={collectionMatteId}
            onValueChange={setCollectionMatteId}
            triggerClassName="w-40"
          />
          <Button
            variant="outline"
            onClick={() => onSetCollectionMatte(collection, collectionMatteId)}
            disabled={!collection.content_ids.length}
          >
            Set matte
          </Button>
          <IntervalInput value={displayIntervalSeconds} onValueChange={onDisplayIntervalChange} />
          <Button onClick={() => onDisplayAll(collection)} disabled={!collection.content_ids.length}>
            <Play className="size-4" />
            Display all
          </Button>
        </div>
      </div>

      <div className="p-4">
        <ArtworkGrid
          currentId={currentId}
          emptyLabel="No artwork in this collection"
          items={items}
          meta={meta}
          onDisplay={onDisplay}
          onOpen={onOpenArtwork}
          thumbnailCache={thumbnailCache}
          thumbnailStates={thumbnailStates}
          footerEndForItem={(item) => (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onRemove(item.content_id)}
                aria-label={`Remove ${item.title || item.file_name || item.content_id} from ${collection.name}`}
              >
                <Trash2 className="size-3.5" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => onDisplay(item.content_id)}>
                <Play className="size-3.5" />
                Display
              </Button>
            </div>
          )}
        />
      </div>
    </section>
  )
}
