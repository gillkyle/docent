import { useEffect, useState } from 'react'

import { readAppCache, writeAppCache } from '@/api/app-cache'
import { api } from '@/api/client'
import type {
  AppSettings,
  ArtItem,
  ArtworkMeta,
  CachedAppData,
  Collection,
  PlaybackStatus,
  TvInfo,
} from '@/api/types'

export function useAppData() {
  const [items, setItems] = useState<ArtItem[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [meta, setMeta] = useState<Record<string, ArtworkMeta>>({})
  const [collections, setCollections] = useState<Collection[]>([])
  const [tvInfo, setTvInfo] = useState<TvInfo | null>(null)
  const [playback, setPlayback] = useState<PlaybackStatus>({ active: false })
  const [settings, setSettings] = useState<AppSettings>({ default_matte_id: 'none' })
  const [status, setStatus] = useState('Loading gallery')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const applyCachedData = (cached: CachedAppData) => {
    setItems(cached.art.items || [])
    setCurrentId(cached.art.current_id || null)
    setMeta(cached.metadata.artwork || {})
    setCollections(cached.collectionData.collections || [])
    setPlayback(cached.playbackData || { active: false })
    setSettings(cached.appSettings || { default_matte_id: 'none' })
    setLoading(false)
    setStatus('Restored cached gallery')
  }

  const loadEverything = async (force = false) => {
    const cached = !force ? readAppCache() : null
    if (cached && loading) {
      applyCachedData(cached)
    }

    setRefreshing(true)
    setStatus(force ? 'Refreshing from Frame' : cached ? 'Refreshing cached gallery' : 'Loading gallery')
    try {
      const [art, metadata, collectionData, info, playbackData, appSettings] = await Promise.all([
        api<{ items: ArtItem[]; current_id?: string | null }>(
          force ? '/art/refresh' : '/art',
          force ? { method: 'POST' } : undefined,
        ),
        api<{ artwork: Record<string, ArtworkMeta> }>('/artwork-meta'),
        api<{ collections: Collection[] }>('/collections'),
        api<TvInfo>('/info').catch(() => null),
        api<PlaybackStatus>('/playback').catch(() => ({ active: false })),
        api<AppSettings>('/settings').catch(() => ({ default_matte_id: 'none' })),
      ])
      setItems(art.items || [])
      setCurrentId(art.current_id || null)
      setMeta(metadata.artwork || {})
      setCollections(collectionData.collections || [])
      setTvInfo(info)
      setPlayback(playbackData)
      setSettings(appSettings)
      writeAppCache({ art, metadata, collectionData, playbackData, appSettings })
      setStatus(info ? 'Frame connected' : 'Gallery loaded, TV unreachable')
      return appSettings
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not load gallery')
      return null
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadEverything(), 0)
    return () => window.clearTimeout(timer)
    // Initial boot only; user actions call loadEverything directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
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
    setCollections,
    setCurrentId,
    setItems,
    setMeta,
    setPlayback,
    setSettings,
    setStatus,
  }
}
