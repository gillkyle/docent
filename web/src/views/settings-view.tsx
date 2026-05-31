import type { AppSettings } from '@/api/types'
import { MatteSelect } from '@/components/shared/matte-select'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

export function SettingsView({
  settings,
  onSettingsChange,
  onSave,
}: {
  settings: AppSettings
  onSettingsChange: (settings: AppSettings) => void
  onSave: () => void
}) {
  return (
    <section className="p-4">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Defaults apply to uploads, single artwork display, and display-all playback.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>Default matte</Label>
            <MatteSelect
              value={settings.default_matte_id}
              onValueChange={(default_matte_id) =>
                onSettingsChange({ ...settings, default_matte_id })
              }
              triggerClassName="w-full sm:w-64"
            />
            <p className="text-sm text-muted-foreground">
              New artwork and display commands default to no matte unless changed here.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={onSave}>Save settings</Button>
        </CardFooter>
      </Card>
    </section>
  )
}
