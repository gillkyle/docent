import type { LucideIcon } from 'lucide-react'

export type ArtItem = {
  content_id: string
  title?: string
  file_name?: string
  matte_id?: string
  image_date?: string
  favorite?: boolean
}

export type ArtworkMeta = {
  title?: string
  original_filename?: string
  width?: number
  height?: number
  uploaded_at?: string
}

export type Collection = {
  id: string
  name: string
  content_ids: string[]
  created?: string
}

export type TvInfo = {
  supported?: boolean
  artmode?: string
  ip?: string
}

export type PlaybackStatus = {
  active: boolean
  content_ids?: string[]
  current_id?: string | null
  duration?: number
  shuffle?: boolean
  matte_id?: string
  warning?: string | null
  error?: string | null
  paused_reason?: string | null
}

export type ThumbnailState = 'pending' | 'loading' | 'loaded' | 'failed'
export type CommandState = { kind: 'idle' } | { kind: 'running'; label: string }
export type SortMode = 'newest' | 'oldest' | 'title' | 'frame'
export type ActiveView = 'art' | 'collections' | 'schedules' | 'settings'

export type AppSettings = {
  default_matte_id: string
}

export type CachedAppData = {
  savedAt: number
  art: { items: ArtItem[]; current_id?: string | null }
  metadata: { artwork: Record<string, ArtworkMeta> }
  collectionData: { collections: Collection[] }
  playbackData: PlaybackStatus
  appSettings: AppSettings
}

export type TvUiState = {
  command: CommandState
  currentId: string | null
  currentTitle: string
  loading: boolean
  playback: PlaybackStatus
  status: string
  tvInfo: TvInfo | null
}

export type NavItem = {
  value: ActiveView
  label: string
  icon: LucideIcon
}
