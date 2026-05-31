import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function CollectionDialog({
  open,
  value,
  onOpenChange,
  onValueChange,
  onCreate,
}: {
  open: boolean
  value: string
  onOpenChange: (open: boolean) => void
  onValueChange: (value: string) => void
  onCreate: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="size-4" />
          Collection
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New collection</DialogTitle>
          <DialogDescription>
            Collections keep artwork ready for different rooms, moods, and schedules.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="collection-name">Name</Label>
          <Input
            id="collection-name"
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder="Spiritual artwork"
          />
        </div>
        <DialogFooter>
          <Button onClick={onCreate} disabled={!value.trim()}>
            Create collection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
