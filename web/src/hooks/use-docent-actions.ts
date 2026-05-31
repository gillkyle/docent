import { api } from '@/api/client'
import type React from 'react'
import type { AppSettings, ArtItem, Collection, CommandState, PlaybackStatus } from '@/api/types'
import { clampIntervalSeconds } from '@/lib/artwork'

type ActionDeps = {
  collections: Collection[]
  displayIntervalSeconds: number
  displayMatteId: string
  loadEverything: (force?: boolean) => Promise<AppSettings | null>
  selectedItems: ArtItem[]
  setCommandState: (state: CommandState) => void
  setCurrentId: (id: string | null) => void
  setItems: React.Dispatch<React.SetStateAction<ArtItem[]>>
  setPlayback: (playback: PlaybackStatus) => void
  setSelected: React.Dispatch<React.SetStateAction<ArtItem | null>>
  setSelectedCollectionId: (id: string | null) => void
  setSelectedIds: (ids: Set<string>) => void
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>
  setStatus: (status: string) => void
}

export function useDocentActions({
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
}: ActionDeps) {
  const displayArtwork = async (contentId: string) => {
    setCommandState({ kind: 'running', label: 'Displaying artwork' })
    try {
      const result = await api<{ ok: boolean; content_id: string; matte_id?: string; warning?: string }>('/select', {
        method: 'POST',
        body: JSON.stringify({ content_id: contentId, matte_id: displayMatteId }),
      })
      setCurrentId(contentId)
      setStatus(result.warning || 'Display command succeeded')
      setPlayback({ active: false })
      setSelected(null)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Display command failed')
    } finally {
      setCommandState({ kind: 'idle' })
    }
  }

  const startDisplayAllForIds = async (ids: string[], label: string) => {
    if (!ids.length) return
    const duration = clampIntervalSeconds(displayIntervalSeconds)
    setCommandState({ kind: 'running', label: 'Starting display all' })
    try {
      const nextPlayback = await api<PlaybackStatus>('/playback', {
        method: 'POST',
        body: JSON.stringify({
          content_ids: ids,
          duration,
          shuffle: false,
          matte_id: displayMatteId,
        }),
      })
      setPlayback(nextPlayback)
      setCurrentId(ids[0])
      setStatus(`Display all started: ${label}`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not start display all')
    } finally {
      setCommandState({ kind: 'idle' })
    }
  }

  const stopDisplayAll = async () => {
    setCommandState({ kind: 'running', label: 'Stopping display all' })
    try {
      await api('/playback', { method: 'DELETE' })
      setPlayback({ active: false })
      setStatus('Display all stopped')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not stop display all')
    } finally {
      setCommandState({ kind: 'idle' })
    }
  }

  const saveSettings = async (settings: AppSettings) => {
    setCommandState({ kind: 'running', label: 'Saving settings' })
    try {
      const nextSettings = await api<AppSettings>('/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      })
      setSettings(nextSettings)
      setStatus('Settings saved')
      return nextSettings
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not save settings')
      return null
    } finally {
      setCommandState({ kind: 'idle' })
    }
  }

  const addArtworkToCollection = async (collectionId: string, contentId: string) => {
    await api(`/collections/${collectionId}/items`, {
      method: 'POST',
      body: JSON.stringify({ content_ids: [contentId] }),
    })
    await loadEverything()
  }

  const addSelectionToCollection = async (collectionId: string) => {
    const ids = selectedItems.map((item) => item.content_id)
    if (!ids.length) return
    setCommandState({ kind: 'running', label: 'Adding selected artwork' })
    try {
      await api(`/collections/${collectionId}/items`, {
        method: 'POST',
        body: JSON.stringify({ content_ids: ids }),
      })
      const collection = collections.find((item) => item.id === collectionId)
      setStatus(`Added ${ids.length} artwork${ids.length === 1 ? '' : 's'} to ${collection?.name || 'collection'}`)
      await loadEverything()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not update collection')
    } finally {
      setCommandState({ kind: 'idle' })
    }
  }

  const removeSelectionFromCollection = async (collectionId: string) => {
    const ids = selectedItems.map((item) => item.content_id)
    if (!ids.length) return
    setCommandState({ kind: 'running', label: 'Removing selected artwork' })
    try {
      await api(`/collections/${collectionId}/items`, {
        method: 'DELETE',
        body: JSON.stringify({ content_ids: ids }),
      })
      const collection = collections.find((item) => item.id === collectionId)
      setSelectedIds(new Set())
      setStatus(`Removed ${ids.length} artwork${ids.length === 1 ? '' : 's'} from ${collection?.name || 'collection'}`)
      await loadEverything()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not update collection')
    } finally {
      setCommandState({ kind: 'idle' })
    }
  }

  const removeArtworkFromCollection = async (collectionId: string, contentId: string) => {
    setCommandState({ kind: 'running', label: 'Removing artwork from collection' })
    try {
      await api(`/collections/${collectionId}/items`, {
        method: 'DELETE',
        body: JSON.stringify({ content_ids: [contentId] }),
      })
      const collection = collections.find((item) => item.id === collectionId)
      setStatus(`Removed artwork from ${collection?.name || 'collection'}`)
      await loadEverything()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not update collection')
    } finally {
      setCommandState({ kind: 'idle' })
    }
  }

  const createCollection = async (name: string) => {
    const trimmedName = name.trim()
    if (!trimmedName) return null
    const collection = await api<Collection>('/collections', {
      method: 'POST',
      body: JSON.stringify({ name: trimmedName }),
    })
    const ids = selectedItems.map((item) => item.content_id)
    if (ids.length) {
      await api(`/collections/${collection.id}/items`, {
        method: 'POST',
        body: JSON.stringify({ content_ids: ids }),
      })
      setSelectedCollectionId(collection.id)
      setStatus(`Created ${trimmedName} with ${ids.length} selected artwork${ids.length === 1 ? '' : 's'}`)
    }
    await loadEverything()
    return collection
  }

  const uploadFiles = async (files: FileList | null, defaultMatteId: string) => {
    if (!files?.length) return
    setCommandState({ kind: 'running', label: `Uploading ${files.length} artwork${files.length === 1 ? '' : 's'}` })
    try {
      for (const file of Array.from(files)) {
        const body = new FormData()
        body.append('file', file)
        body.append('filename', file.name.replace(/\.[^.]+$/, ''))
        body.append('matte', defaultMatteId || 'none')
        await api('/upload', { method: 'POST', body })
      }
      await loadEverything(true)
      setStatus('Upload complete')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setCommandState({ kind: 'idle' })
    }
  }

  const deleteArtwork = async (contentId: string) => {
    await api('/delete', {
      method: 'POST',
      body: JSON.stringify({ content_ids: [contentId] }),
    })
    setSelected(null)
    await loadEverything(true)
  }

  const changeArtworkMatte = async (contentId: string, matteId: string) => {
    setCommandState({ kind: 'running', label: 'Updating matte' })
    try {
      const result = await api<{ ok: boolean; content_id: string; matte_id: string }>('/matte', {
        method: 'POST',
        body: JSON.stringify({ content_id: contentId, matte_id: matteId }),
      })
      setItems((current) =>
        current.map((item) =>
          item.content_id === contentId ? { ...item, matte_id: result.matte_id } : item,
        ),
      )
      setSelected((current) =>
        current?.content_id === contentId ? { ...current, matte_id: result.matte_id } : current,
      )
      setStatus('Matte updated')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not update matte')
    } finally {
      setCommandState({ kind: 'idle' })
    }
  }

  const changeCollectionMatte = async (collection: Collection, matteId: string) => {
    if (!collection.content_ids.length) return
    setCommandState({ kind: 'running', label: 'Updating collection matte' })
    try {
      const result = await api<{
        ok: boolean
        matte_id: string
        changed: string[]
        failed: Array<{ content_id: string; error: string }>
      }>('/matte/batch', {
        method: 'POST',
        body: JSON.stringify({ content_ids: collection.content_ids, matte_id: matteId }),
      })
      const changed = new Set(result.changed)
      setItems((current) =>
        current.map((item) =>
          changed.has(item.content_id) ? { ...item, matte_id: result.matte_id } : item,
        ),
      )
      setSelected((current) =>
        current && changed.has(current.content_id) ? { ...current, matte_id: result.matte_id } : current,
      )
      setStatus(
        result.failed.length
          ? `Matte updated for ${result.changed.length}; ${result.failed.length} rejected by TV`
          : `Matte updated for ${result.changed.length} artwork${result.changed.length === 1 ? '' : 's'}`,
      )
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not update collection matte')
    } finally {
      setCommandState({ kind: 'idle' })
    }
  }

  return {
    addArtworkToCollection,
    addSelectionToCollection,
    changeArtworkMatte,
    changeCollectionMatte,
    createCollection,
    deleteArtwork,
    displayArtwork,
    removeArtworkFromCollection,
    removeSelectionFromCollection,
    saveSettings,
    startDisplayAllForIds,
    stopDisplayAll,
    uploadFiles,
  }
}
