import { Fragment } from 'react'
import { Link } from 'react-router'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

export interface Crumb {
  label: string
  /** Omit for the current page (the last crumb). */
  to?: string
}

/** "Clients / Rajesh Mehta / Mehta Textiles" above a detail page. */
export function PageBreadcrumb({ crumbs }: { crumbs: readonly Crumb[] }) {
  return (
    <Breadcrumb>
      <BreadcrumbList className="text-[15px]">
        {crumbs.map((crumb, i) => (
          <Fragment key={`${i}-${crumb.label}`}>
            {i > 0 && <BreadcrumbSeparator>/</BreadcrumbSeparator>}
            <BreadcrumbItem>
              {crumb.to ? (
                <BreadcrumbLink asChild className="text-brand">
                  <Link to={crumb.to}>{crumb.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
