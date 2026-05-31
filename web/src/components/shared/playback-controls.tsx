import { Play, StopCircle } from 'lucide-react'

import type { PlaybackStatus } from '@/api/types'
import { IntervalInput } from '@/components/shared/interval-input'
import { MatteSelect } from '@/components/shared/matte-select'
import { Button } from '@/components/ui/button'

export function PlaybackControls({
  canPlay,
  displayIntervalSeconds,
  displayMatteId,
  label,
  onDisplayAll,
  onDisplayIntervalChange,
  onDisplayMatteChange,
  onStop,
  playback,
}: {
  canPlay: boolean
  displayIntervalSeconds: number
  displayMatteId: string
  label: string
  onDisplayAll: () => void
  onDisplayIntervalChange: (seconds: number) => void
  onDisplayMatteChange?: (matteId: string) => void
  onStop?: () => void
  playback?: PlaybackStatus
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {onDisplayMatteChange && (
        <MatteSelect
          value={displayMatteId}
          onValueChange={onDisplayMatteChange}
          triggerClassName="w-40"
        />
      )}
      <IntervalInput value={displayIntervalSeconds} onValueChange={onDisplayIntervalChange} />
      {playback?.active && onStop && (
        <Button variant="outline" size="sm" onClick={onStop}>
          <StopCircle className="size-4" />
          Stop display all
        </Button>
      )}
      <Button size="sm" onClick={onDisplayAll} disabled={!canPlay}>
        <Play className="size-4" />
        {label}
      </Button>
    </div>
  )
}
