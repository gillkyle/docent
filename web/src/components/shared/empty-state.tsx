import { ImageIcon } from 'lucide-react'

export function EmptyState({
  label = 'No artwork found',
  description = 'Upload artwork or choose a different collection filter.',
}: {
  label?: string
  description?: string
}) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed bg-card/55 p-6 text-center">
      <ImageIcon className="mb-3 size-8 text-muted-foreground" />
      <div className="font-medium">{label}</div>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
