import type { ReactNode } from 'react'

interface SettingsSectionProps {
  title: string
  description: string
  children: ReactNode
}

/** A settings card: title and description on the left third, the fields on the right. */
export function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <section
      aria-label={title}
      className="grid gap-x-8 gap-y-6 rounded-lg border border-border bg-card p-6 text-card-foreground md:grid-cols-3"
    >
      <div className="flex flex-col gap-1.5">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-sm leading-relaxed">{description}</p>
      </div>
      <div className="flex min-w-0 flex-col gap-4 md:col-span-2">{children}</div>
    </section>
  )
}
