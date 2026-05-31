import type { ArtItem, ArtworkMeta, Collection, SortMode } from '@/api/types'

export const artworkTitle = (item: ArtItem, artworkMeta?: ArtworkMeta) =>
  artworkMeta?.title || item.title || item.file_name || item.content_id

export const artworkTimestamp = (item: ArtItem, artworkMeta?: ArtworkMeta) => {
  if (artworkMeta?.uploaded_at) {
    const uploadedAt = Date.parse(artworkMeta.uploaded_at)
    if (!Number.isNaN(uploadedAt)) return uploadedAt
  }

  if (item.image_date) {
    const normalized = item.image_date.replace(
      /^(\d{4}):(\d{2}):(\d{2})\s+/,
      '$1-$2-$3T',
    )
    const imageDate = Date.parse(normalized)
    if (!Number.isNaN(imageDate)) return imageDate
  }

  return 0
}

export const visibleArtwork = ({
  activeCollection,
  collections,
  items,
  meta,
  query,
  sortMode,
}: {
  activeCollection: string
  collections: Collection[]
  items: ArtItem[]
  meta: Record<string, ArtworkMeta>
  query: string
  sortMode: SortMode
}) => {
  const collection = collections.find((item) => item.id === activeCollection)
  const collectionIds = collection ? new Set(collection.content_ids) : null
  const normalizedQuery = query.trim().toLowerCase()

  const filtered = items.filter((item) => {
    if (collectionIds && !collectionIds.has(item.content_id)) return false
    if (!normalizedQuery) return true
    return artworkTitle(item, meta[item.content_id]).toLowerCase().includes(normalizedQuery)
  })

  return filtered
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      if (sortMode === 'frame') return a.index - b.index
      if (sortMode === 'title') {
        return artworkTitle(a.item, meta[a.item.content_id]).localeCompare(
          artworkTitle(b.item, meta[b.item.content_id]),
          undefined,
          { sensitivity: 'base' },
        )
      }

      const delta =
        artworkTimestamp(b.item, meta[b.item.content_id]) -
        artworkTimestamp(a.item, meta[a.item.content_id])
      return sortMode === 'newest' ? delta || a.index - b.index : -delta || a.index - b.index
    })
    .map(({ item }) => item)
}

export const collectionItems = (collection: Collection | null, items: ArtItem[]) => {
  if (!collection) return []
  const byId = new Map(items.map((item) => [item.content_id, item]))
  return collection.content_ids.flatMap((id) => {
    const item = byId.get(id)
    return item ? [item] : []
  })
}

export const clampIntervalSeconds = (seconds: number) =>
  Math.max(10, Math.round(Number.isFinite(seconds) ? seconds : 300))
