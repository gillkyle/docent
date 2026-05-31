import type { ReactNode } from 'react'

export function SidebarButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: ReactNode
  label: string
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition ${
        active
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-sidebar-foreground/72 hover:bg-sidebar-accent/60'
      }`}
      type="button"
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  )
}
