import { Input } from '@/components/ui/input'
import { clampIntervalSeconds } from '@/lib/artwork'

export function IntervalInput({
  value,
  onValueChange,
}: {
  value: number
  onValueChange: (value: number) => void
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-muted-foreground">
      Interval
      <Input
        className="w-24"
        type="number"
        min={10}
        step={10}
        value={value}
        onBlur={() => onValueChange(clampIntervalSeconds(value))}
        onChange={(event) => onValueChange(Number(event.target.value))}
      />
      sec
    </label>
  )
}
