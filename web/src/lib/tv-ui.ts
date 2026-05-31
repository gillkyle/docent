import { match } from 'ts-pattern'

import type { TvUiState } from '@/api/types'

export function deriveTvUiState(state: TvUiState) {
  return match(state)
    .with({ command: { kind: 'running' } }, ({ command, currentTitle, playback, tvInfo }) => ({
      headerStatus: command.label,
      nowShowing: playback.active ? `Display all: ${playback.content_ids?.length || 0} artworks` : currentTitle,
      nowShowingActive: Boolean(state.currentId || playback.active),
      tvActive: Boolean(tvInfo),
      tvLabel: tvInfo?.ip || 'Samsung Frame',
      tvValue: tvInfo?.artmode || 'Checking status',
    }))
    .with({ loading: true }, ({ currentTitle, playback, tvInfo }) => ({
      headerStatus: 'Loading gallery',
      nowShowing: playback.active ? `Display all: ${playback.content_ids?.length || 0} artworks` : currentTitle,
      nowShowingActive: Boolean(state.currentId || playback.active),
      tvActive: Boolean(tvInfo),
      tvLabel: tvInfo?.ip || 'Samsung Frame',
      tvValue: tvInfo?.artmode || 'Checking status',
    }))
    .with({ tvInfo: null, currentId: null }, ({ status }) => ({
      headerStatus: status.includes('failed') || status.includes('Cannot') ? status : 'TV status unknown',
      nowShowing: 'Nothing confirmed',
      nowShowingActive: false,
      tvActive: false,
      tvLabel: 'Samsung Frame',
      tvValue: 'No recent contact',
    }))
    .with({ tvInfo: null }, ({ currentTitle, playback, status }) => ({
      headerStatus: status.includes('succeeded')
        ? `${status}; status check pending`
        : 'Status check pending, gallery is available',
      nowShowing: playback.active ? `Display all: ${playback.content_ids?.length || 0} artworks` : currentTitle,
      nowShowingActive: true,
      tvActive: true,
      tvLabel: 'Samsung Frame',
      tvValue: 'Last command or gallery load succeeded',
    }))
    .otherwise(({ currentTitle, playback, status, tvInfo }) => ({
      headerStatus: status || 'Frame connected',
      nowShowing: playback.active ? `Display all: ${playback.content_ids?.length || 0} artworks` : currentTitle,
      nowShowingActive: Boolean(state.currentId || playback.active),
      tvActive: true,
      tvLabel: tvInfo?.ip || 'Samsung Frame',
      tvValue: tvInfo?.artmode || 'Reachable',
    }))
}
