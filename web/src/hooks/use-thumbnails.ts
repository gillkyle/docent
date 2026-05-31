import { useEffect, useRef, useState } from 'react'

import type { ArtItem, ThumbnailState } from '@/api/types'

export function useThumbnails(itemsToQueue: ArtItem[]) {
  const [thumbnailCache, setThumbnailCache] = useState<Record<string, string>>({})
  const [thumbnailStates, setThumbnailStates] = useState<Record<string, ThumbnailState>>({})
  const requestedThumbnailIds = useRef(new Set<string>())

  useEffect(() => {
    const ids = itemsToQueue
      .map((item) => item.content_id)
      .filter((id) => !thumbnailCache[id] && !requestedThumbnailIds.current.has(id))
      .slice(0, 24)
    if (!ids.length) return
    ids.forEach((id) => requestedThumbnailIds.current.add(id))

    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 12000)
    const request = window.setTimeout(() => {
      setThumbnailStates((current) => ({
        ...current,
        ...Object.fromEntries(ids.map((id) => [id, 'loading' as const])),
      }))

      fetch('/api/thumbnails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_ids: ids }),
        signal: controller.signal,
      })
        .then((response) => {
          if (!response.ok) throw new Error('Thumbnail batch failed')
          return response.json() as Promise<{ thumbnails: Record<string, string>; missing?: string[] }>
        })
        .then((data) => {
          const loadedIds = Object.keys(data.thumbnails || {})
          setThumbnailCache((current) => ({
            ...current,
            ...Object.fromEntries(
              Object.entries(data.thumbnails || {}).map(([id, b64]) => [
                id,
                `data:image/jpeg;base64,${b64}`,
              ]),
            ),
          }))
          const failedIds = ids.filter((id) => !loadedIds.includes(id))
          setThumbnailStates((current) => ({
            ...current,
            ...Object.fromEntries(loadedIds.map((id) => [id, 'loaded' as const])),
            ...Object.fromEntries(failedIds.map((id) => [id, 'failed' as const])),
          }))
        })
        .catch(() => {
          ids.forEach((id) => requestedThumbnailIds.current.delete(id))
          setThumbnailStates((current) => ({
            ...current,
            ...Object.fromEntries(ids.map((id) => [id, 'failed' as const])),
          }))
        })
        .finally(() => window.clearTimeout(timer))
    }, 0)

    return () => {
      controller.abort()
      window.clearTimeout(request)
      window.clearTimeout(timer)
    }
  }, [itemsToQueue, thumbnailCache])

  return { thumbnailCache, thumbnailStates }
}
