import { NavLink, Outlet } from 'react-router'

import { ThemeToggle } from '@/components/ThemeToggle'
import { cn } from '@/lib/utils'
import { FIRM } from '@/utils/branding'
import { NAV_ITEMS } from '@/utils/navigation'

export function AppLayout() {
  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col gap-6 bg-sidebar px-3 py-4 text-sidebar-foreground md:sticky md:top-0 md:h-svh md:w-52 md:overflow-y-auto md:py-6">
        <div className="flex flex-col gap-3 px-2">
          <div
            role="img"
            aria-label={FIRM.logoAlt}
            className="hidden h-[72px] w-full max-w-[156px] items-center justify-center rounded-md bg-white md:flex"
          >
            <img src={FIRM.logoSrc} alt="" className="w-[132px]" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[15px] leading-snug font-bold">{FIRM.name}</span>
            <span className="text-xs text-sidebar-muted">{FIRM.tagline}</span>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto md:flex-col">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex min-h-11 shrink-0 items-center gap-3 rounded-md px-3 text-[15px] font-bold transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-foreground'
                    : 'text-sidebar-foreground/85 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                )
              }
            >
              <Icon className="size-[18px] shrink-0" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-sidebar-border pt-3 md:mt-auto">
          <ThemeToggle className="text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground" />
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 md:px-10 md:pt-8 md:pb-16">
        <div className="mx-auto max-w-[1200px]">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
