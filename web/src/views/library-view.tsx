import { Folder, Play, Search, Square, SquareCheck, Trash2 } from 'lucide-react'

import type { ArtItem, ArtworkMeta, Collection, PlaybackStatus, SortMode, ThumbnailState } from '@/api/types'
import { ArtworkGrid } from '@/components/artwork/artwork-grid'
import { CollectionDialog } from '@/components/shared/collection-dialog'
import { PlaybackControls } from '@/components/shared/playback-controls'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function LibraryView({
  activeCollection,
  collectionDialogOpen,
  collectionName,
  collections,
  currentId,
  displayIntervalSeconds,
  displayMatteId,
  loading,
  meta,
  onAddArtworkToCollection,
  onAddSelectionToCollection,
  onClearSelected,
  onCollectionDialogOpenChange,
  onCollectionNameChange,
  onCreateCollection,
  onDisplay,
  onDisplayAll,
  onDisplayIntervalChange,
  onDisplayMatteChange,
  onOpenArtwork,
  onQueryChange,
  onRemoveSelectionFromCollection,
  onSelectVisible,
  onSortModeChange,
  onStopDisplayAll,
  onToggleSelected,
  onActiveCollectionChange,
  playback,
  playbackScopeLabel,
  query,
  selectedIds,
  sortMode,
  thumbnailCache,
  thumbnailStates,
  visibleItems,
}: {
  activeCollection: string
  collectionDialogOpen: boolean
  collectionName: string
  collections: Collection[]
  currentId: string | null
  displayIntervalSeconds: number
  displayMatteId: string
  loading: boolean
  meta: Record<string, ArtworkMeta>
  onAddArtworkToCollection: (collectionId: string, contentId: string) => void
  onAddSelectionToCollection: (collectionId: string) => void
  onClearSelected: () => void
  onCollectionDialogOpenChange: (open: boolean) => void
  onCollectionNameChange: (name: string) => void
  onCreateCollection: () => void
  onDisplay: (id: string) => void
  onDisplayAll: () => void
  onDisplayIntervalChange: (seconds: number) => void
  onDisplayMatteChange: (matteId: string) => void
  onOpenArtwork: (item: ArtItem) => void
  onQueryChange: (query: string) => void
  onRemoveSelectionFromCollection: () => void
  onSelectVisible: () => void
  onSortModeChange: (sortMode: SortMode) => void
  onStopDisplayAll: () => void
  onToggleSelected: (contentId: string) => void
  onActiveCollectionChange: (collectionId: string) => void
  playback: PlaybackStatus
  playbackScopeLabel: string
  query: string
  selectedIds: Set<string>
  sortMode: SortMode
  thumbnailCache: Record<string, string>
  thumbnailStates: Record<string, ThumbnailState>
  visibleItems: ArtItem[]
}) {
  return (
    <>
      <div className="flex flex-col gap-3 border-b px-4 py-3 xl:flex-row xl:items-center xl:justify-end">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="w-full pl-8 sm:w-64"
              placeholder="Search artwork"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
            />
          </div>
          <Select value={activeCollection} onValueChange={onActiveCollectionChange}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="All artwork" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All artwork</SelectItem>
              {collections.map((collection) => (
                <SelectItem key={collection.id} value={collection.id}>
                  {collection.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortMode} onValueChange={(value) => onSortModeChange(value as SortMode)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="frame">Frame order</SelectItem>
            </SelectContent>
          </Select>
          <CollectionDialog
            open={collectionDialogOpen}
            value={collectionName}
            onOpenChange={onCollectionDialogOpenChange}
            onValueChange={onCollectionNameChange}
            onCreate={onCreateCollection}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 border-b px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Button variant="outline" size="sm" onClick={onSelectVisible} disabled={!visibleItems.length}>
            <SquareCheck className="size-4" />
            Select visible
          </Button>
          <Button variant="ghost" size="sm" onClick={onClearSelected} disabled={!selectedIds.size}>
            <Square className="size-4" />
            Clear
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={!selectedIds.size || !collections.length}>
                <Folder className="size-4" />
                Add selected
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {collections.map((collection) => (
                <DropdownMenuItem
                  key={collection.id}
                  onClick={() => onAddSelectionToCollection(collection.id)}
                >
                  <Folder className="size-4" />
                  {collection.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {activeCollection !== 'all' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemoveSelectionFromCollection}
              disabled={!selectedIds.size}
            >
              <Trash2 className="size-4" />
              Remove from collection
            </Button>
          )}
          <span>{selectedIds.size ? `${selectedIds.size} selected` : `${visibleItems.length} visible`}</span>
        </div>
        <PlaybackControls
          canPlay={Boolean(visibleItems.length)}
          displayIntervalSeconds={displayIntervalSeconds}
          displayMatteId={displayMatteId}
          label={`Display all ${playbackScopeLabel}`}
          onDisplayAll={onDisplayAll}
          onDisplayIntervalChange={onDisplayIntervalChange}
          onDisplayMatteChange={onDisplayMatteChange}
          onStop={onStopDisplayAll}
          playback={playback}
        />
      </div>

      <section className="p-4">
        <ArtworkGrid
          actionsForItem={(item) => (
            <>
              <DropdownMenuItem onClick={() => onDisplay(item.content_id)}>
                <Play className="size-4" />
                Display on Frame
              </DropdownMenuItem>
              {collections.map((collection) => (
                <DropdownMenuItem
                  key={collection.id}
                  onClick={() => onAddArtworkToCollection(collection.id, item.content_id)}
                >
                  <Folder className="size-4" />
                  Add to {collection.name}
                </DropdownMenuItem>
              ))}
            </>
          )}
          currentId={currentId}
          items={visibleItems}
          loading={loading}
          meta={meta}
          onDisplay={onDisplay}
          onOpen={onOpenArtwork}
          onToggleSelected={onToggleSelected}
          selectedIds={selectedIds}
          thumbnailCache={thumbnailCache}
          thumbnailStates={thumbnailStates}
        />
      </section>
    </>
  )
}
