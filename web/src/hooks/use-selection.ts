import { useMemo, useState } from 'react'

import type { ArtItem } from '@/api/types'

export function useSelection(items: ArtItem[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(item.content_id)),
    [items, selectedIds],
  )

  const toggleSelected = (contentId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(contentId)) {
        next.delete(contentId)
      } else {
        next.add(contentId)
      }
      return next
    })
  }

  const selectItems = (nextItems: ArtItem[]) => {
    setSelectedIds(new Set(nextItems.map((item) => item.content_id)))
  }

  const clearSelected = () => {
    setSelectedIds(new Set())
  }

  return {
    clearSelected,
    selectedIds,
    selectedItems,
    selectItems,
    setSelectedIds,
    toggleSelected,
  }
}
