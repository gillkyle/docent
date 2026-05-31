import { useMemo, useState } from 'react'
import { CalendarClock, ImageIcon, RefreshCw, Settings, Tv, Upload, Folder } from 'lucide-react'

import type { ActiveView, ArtItem, CommandState, NavItem, SortMode } from '@/api/types'
import { ArtworkSheet } from '@/components/artwork/artwork-sheet'
import { SidebarButton } from '@/components/layout/sidebar-button'
import { StatusRow } from '@/components/layout/status-row'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { collectionItems, visibleArtwork } from '@/lib/artwork'
import { deriveTvUiState } from '@/lib/tv-ui'
import { useAppData } from '@/hooks/use-app-data'
import { useDocentActions } from '@/hooks/use-docent-actions'
import { useSelection } from '@/hooks/use-selection'
import { useThumbnails } from '@/hooks/use-thumbnails'
import { CollectionsView } from '@/views/collections-view'
import { LibraryView } from '@/views/library-view'
import { SchedulesView } from '@/views/schedules-view'
import { SettingsView } from '@/views/settings-view'

const NAV_ITEMS: NavItem[] = [
  { value: 'art', label: 'Library', icon: ImageIcon },
  { value: 'collections', label: 'Collections', icon: Folder },
  { value: 'schedules', label: 'Schedules', icon: CalendarClock },
  { value: 'settings', label: 'Settings', icon: Settings },
]

function App() {
  const [activeView, setActiveView] = useState<ActiveView>('art')
  const [activeCollection, setActiveCollection] = useState('all')
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)
  const [selected, setSelected] = useState<ArtItem | null>(null)
  const [query, setQuery] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('newest')
  const [commandState, setCommandState] = useState<CommandState>({ kind: 'idle' })
  const [uploading, setUploading] = useState(false)
  const [collectionName, setCollectionName] = useState('')
  const [collectionDialogOpen, setCollectionDialogOpen] = useState(false)
  const [displayMatteId, setDisplayMatteId] = useState('none')
  const [displayIntervalSeconds, setDisplayIntervalSeconds] = useState(300)

  const appData = useAppData()
  const {
    collections,
    currentId,
    items,
    loading,
    meta,
    playback,
    refreshing,
    settings,
    status,
    tvInfo,
    loadEverything,
    setCurrentId,
    setItems,
    setPlayback,
    setSettings,
    setStatus,
  } = appData

  const visibleItems = useMemo(
    () => visibleArtwork({ activeCollection, collections, items, meta, query, sortMode }),
    [activeCollection, collections, items, meta, query, sortMode],
  )

  const selectedCollection = useMemo(
    () =>
      collections.find((collection) => collection.id === selectedCollectionId) ||
      collections[0] ||
      null,
    [collections, selectedCollectionId],
  )

  const selectedCollectionItems = useMemo(
    () => collectionItems(selectedCollection, items),
    [items, selectedCollection],
  )

  const {
    clearSelected,
    selectedIds,
    selectedItems,
    selectItems,
    setSelectedIds,
    toggleSelected,
  } = useSelection(items)

  const currentTitle = currentId
    ? meta[currentId]?.title ||
      items.find((item) => item.content_id === currentId)?.title ||
      'Selected artwork'
    : 'Nothing selected'

  const nowShowingId = playback.current_id || currentId
  const nowShowingItem = nowShowingId
    ? items.find((item) => item.content_id === nowShowingId) || null
    : null
  const activeViewLabel = NAV_ITEMS.find((item) => item.value === activeView)?.label || 'Library'

  const tvUi = useMemo(
    () =>
      deriveTvUiState({
        command: commandState,
        currentId,
        currentTitle,
        loading,
        playback,
        status,
        tvInfo,
      }),
    [commandState, currentId, currentTitle, loading, playback, status, tvInfo],
  )

  const playbackScopeLabel =
    selectedIds.size > 0
      ? `${selectedIds.size} selected`
      : activeCollection === 'all'
        ? `${visibleItems.length} visible`
        : collections.find((collection) => collection.id === activeCollection)?.name || 'collection'

  const thumbnailQueue = useMemo(
    () => [
      ...(nowShowingItem ? [nowShowingItem] : []),
      ...visibleItems,
      ...selectedCollectionItems,
    ],
    [nowShowingItem, selectedCollectionItems, visibleItems],
  )
  const { thumbnailCache, thumbnailStates } = useThumbnails(thumbnailQueue)

  const actions = useDocentActions({
    collections,
    displayIntervalSeconds,
    displayMatteId,
    loadEverything,
    selectedItems,
    setCommandState,
    setCurrentId,
    setItems,
    setPlayback,
    setSelected,
    setSelectedCollectionId,
    setSelectedIds,
    setSettings,
    setStatus,
  })

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    try {
      await actions.uploadFiles(files, settings.default_matte_id || 'none')
    } finally {
      setUploading(false)
    }
  }

  const createCollection = async () => {
    const collection = await actions.createCollection(collectionName)
    if (!collection) return
    setCollectionName('')
    setCollectionDialogOpen(false)
  }

  const saveSettings = async () => {
    const nextSettings = await actions.saveSettings(settings)
    if (nextSettings) setDisplayMatteId(nextSettings.default_matte_id || 'none')
  }

  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="grid min-h-svh grid-cols-1 lg:grid-cols-[280px_1fr]">
        <aside className="border-b bg-sidebar/70 px-4 py-4 lg:border-r lg:border-b-0">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ImageIcon className="size-4" />
            </div>
            <div>
              <div className="text-base font-semibold leading-tight">Docent</div>
              <div className="text-xs text-muted-foreground">Frame art manager</div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-3">
            <StatusRow
              icon={<Tv className="size-4" />}
              label={tvUi.tvLabel}
              value={tvUi.tvValue}
              active={tvUi.tvActive}
            />
            <StatusRow
              icon={<ImageIcon className="size-4" />}
              label="Now showing"
              value={tvUi.nowShowing}
              active={tvUi.nowShowingActive}
              thumbnailSrc={nowShowingId ? thumbnailCache[nowShowingId] : undefined}
              thumbnailState={nowShowingId ? thumbnailStates[nowShowingId] || 'pending' : 'failed'}
              onThumbnailClick={nowShowingItem ? () => setSelected(nowShowingItem) : undefined}
            />
          </div>

          <Separator className="my-4" />

          <nav className="grid grid-cols-2 gap-1 sm:grid-cols-4 lg:block lg:space-y-1">
            {NAV_ITEMS.map((item) => (
              <SidebarButton
                key={item.value}
                icon={<item.icon className="size-4" />}
                label={item.label}
                active={activeView === item.value}
                onClick={() => setActiveView(item.value)}
              />
            ))}
          </nav>
        </aside>

        <section className="flex min-w-0 flex-col">
          <header className="flex flex-col gap-3 border-b bg-background/92 px-4 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-normal">{activeViewLabel}</h1>
              <p className="text-sm text-muted-foreground">{tvUi.headerStatus}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() => void loadEverything(true)}
                disabled={refreshing}
              >
                <RefreshCw className={refreshing ? 'animate-spin' : ''} />
                Refresh
              </Button>
              <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/85">
                <Upload className="size-4" />
                Upload
                <Input
                  className="sr-only !w-px"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => void uploadFiles(event.currentTarget.files)}
                  disabled={uploading}
                />
              </label>
            </div>
          </header>

          <div className="min-h-0 flex-1">
            {activeView === 'art' && (
              <LibraryView
                activeCollection={activeCollection}
                collectionDialogOpen={collectionDialogOpen}
                collectionName={collectionName}
                collections={collections}
                currentId={currentId}
                displayIntervalSeconds={displayIntervalSeconds}
                displayMatteId={displayMatteId}
                loading={loading}
                meta={meta}
                onActiveCollectionChange={setActiveCollection}
                onAddArtworkToCollection={(collectionId, contentId) =>
                  void actions.addArtworkToCollection(collectionId, contentId)
                }
                onAddSelectionToCollection={(collectionId) =>
                  void actions.addSelectionToCollection(collectionId)
                }
                onClearSelected={clearSelected}
                onCollectionDialogOpenChange={setCollectionDialogOpen}
                onCollectionNameChange={setCollectionName}
                onCreateCollection={() => void createCollection()}
                onDisplay={(id) => void actions.displayArtwork(id)}
                onDisplayAll={() => {
                  const ids = selectedIds.size
                    ? selectedItems.map((item) => item.content_id)
                    : visibleItems.map((item) => item.content_id)
                  void actions.startDisplayAllForIds(ids, playbackScopeLabel)
                }}
                onDisplayIntervalChange={setDisplayIntervalSeconds}
                onDisplayMatteChange={setDisplayMatteId}
                onOpenArtwork={setSelected}
                onQueryChange={setQuery}
                onRemoveSelectionFromCollection={() =>
                  void actions.removeSelectionFromCollection(activeCollection)
                }
                onSelectVisible={() => selectItems(visibleItems)}
                onSortModeChange={setSortMode}
                onStopDisplayAll={() => void actions.stopDisplayAll()}
                onToggleSelected={toggleSelected}
                playback={playback}
                playbackScopeLabel={playbackScopeLabel}
                query={query}
                selectedIds={selectedIds}
                sortMode={sortMode}
                thumbnailCache={thumbnailCache}
                thumbnailStates={thumbnailStates}
                visibleItems={visibleItems}
              />
            )}

            {activeView === 'collections' && (
              <CollectionsView
                collections={collections}
                currentId={currentId}
                displayIntervalSeconds={displayIntervalSeconds}
                meta={meta}
                onDisplay={(id) => void actions.displayArtwork(id)}
                onDisplayAll={(collection) => {
                  setActiveCollection(collection.id)
                  setSelectedIds(new Set())
                  void actions.startDisplayAllForIds(collection.content_ids, collection.name)
                }}
                onDisplayIntervalChange={setDisplayIntervalSeconds}
                onOpenArtwork={setSelected}
                onRemove={(id) => {
                  if (selectedCollection) void actions.removeArtworkFromCollection(selectedCollection.id, id)
                }}
                onSelectCollection={setSelectedCollectionId}
                onSetCollectionMatte={(collection, matteId) =>
                  void actions.changeCollectionMatte(collection, matteId)
                }
                selectedCollection={selectedCollection}
                selectedCollectionItems={selectedCollectionItems}
                thumbnailCache={thumbnailCache}
                thumbnailStates={thumbnailStates}
              />
            )}

            {activeView === 'schedules' && <SchedulesView />}

            {activeView === 'settings' && (
              <SettingsView
                settings={settings}
                onSettingsChange={setSettings}
                onSave={() => void saveSettings()}
              />
            )}
          </div>
        </section>
      </div>

      <ArtworkSheet
        item={selected}
        meta={selected ? meta[selected.content_id] : undefined}
        thumbnailSrc={selected ? thumbnailCache[selected.content_id] : undefined}
        thumbnailState={selected ? thumbnailStates[selected.content_id] || 'pending' : 'pending'}
        current={selected?.content_id === currentId}
        onOpenChange={(open) => !open && setSelected(null)}
        onDisplay={(id) => void actions.displayArtwork(id)}
        onMatteChange={(id, matteId) => void actions.changeArtworkMatte(id, matteId)}
        onDelete={(id) => void actions.deleteArtwork(id)}
      />
    </main>
  )
}

export default App
