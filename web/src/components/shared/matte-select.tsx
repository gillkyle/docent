import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MATTE_OPTIONS } from '@/lib/mattes'

export function MatteSelect({
  value,
  onValueChange,
  triggerClassName,
}: {
  value: string
  onValueChange: (value: string) => void
  triggerClassName?: string
}) {
  return (
    <Select value={value || 'none'} onValueChange={onValueChange}>
      <SelectTrigger className={triggerClassName}>
        <SelectValue placeholder="Matte" />
      </SelectTrigger>
      <SelectContent>
        {MATTE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
