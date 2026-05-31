import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function SchedulesView() {
  return (
    <section className="p-4">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Schedules</CardTitle>
          <CardDescription>
            Timed collection playback is not active yet. Keep scheduling out of the primary workflow until the backend is ready.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <SchedulePreview day="Sunday" time="8:00 AM" collection="Spiritual artwork" />
          <SchedulePreview day="Evening" time="6:30 PM" collection="Quiet landscapes" />
        </CardContent>
      </Card>
    </section>
  )
}

function SchedulePreview({
  day,
  time,
  collection,
}: {
  day: string
  time: string
  collection: string
}) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="font-medium">{day}</div>
        <Badge variant="secondary">{time}</Badge>
      </div>
      <div className="mt-2 text-sm text-muted-foreground">{collection}</div>
    </div>
  )
}
