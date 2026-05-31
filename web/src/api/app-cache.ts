import type { CachedAppData } from '@/api/types'

const APP_CACHE_KEY = 'docent.app-cache.v1'
const APP_CACHE_TTL = 3 * 60 * 60 * 1000

export const readAppCache = (): CachedAppData | null => {
  try {
    const raw = window.localStorage.getItem(APP_CACHE_KEY)
    if (!raw) return null
    const cached = JSON.parse(raw) as CachedAppData
    if (Date.now() - cached.savedAt > APP_CACHE_TTL) return null
    return cached
  } catch {
    return null
  }
}

export const writeAppCache = (data: Omit<CachedAppData, 'savedAt'>) => {
  try {
    window.localStorage.setItem(APP_CACHE_KEY, JSON.stringify({ ...data, savedAt: Date.now() }))
  } catch {
    // Ignore storage quota/private mode failures; network data still works.
  }
}
