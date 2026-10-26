import { versionLabel } from '@cl/schemas'
import { NavLink, Outlet } from 'react-router'

import { useIdleTimeout } from '@/auth/useIdleTimeout'
import { useSignOut } from '@/auth/useSignOut'
import { FinancialYearPicker } from '@/components/FinancialYearPicker'
import { SignOutButton } from '@/components/SignOutButton'
import { ThemeToggle } from '@/components/ThemeToggle'
import { cn } from '@/lib/utils'
import { FIRM } from '@/utils/branding'
import { APP_VERSION } from '@/utils/config'
import { NAV_ITEMS } from '@/utils/navigation'

const SIDEBAR_ACTION = 'text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground'

export function AppLayout() {
  const signOut = useSignOut()
  useIdleTimeout(() => void signOut('idle'))

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

        <FinancialYearPicker className="px-2" />

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

        <div className="flex flex-wrap gap-1 border-t border-sidebar-border pt-3 md:mt-auto md:flex-col md:flex-nowrap md:items-start">
          <ThemeToggle className={SIDEBAR_ACTION} />
          <SignOutButton className={SIDEBAR_ACTION} />
          {/* Lines up with the buttons' icons (size="sm" buttons with an icon pad 2.5). */}
          <span className="w-full px-2.5 pt-1 text-left text-xs text-sidebar-muted">{versionLabel(APP_VERSION)}</span>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 md:px-6 md:pt-8 md:pb-16">
        <Outlet />
      </main>
    </div>
  )
}
