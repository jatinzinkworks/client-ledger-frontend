import type { ReactNode } from 'react'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface DataColumn<T> {
  header: string
  align?: 'right'
  /** Keep the header for screen readers only (e.g. an actions column). */
  hideHeader?: boolean
  render: (row: T) => ReactNode
}

interface DataTableProps<T> {
  columns: readonly DataColumn<T>[]
  rows: readonly T[]
  rowKey: (row: T) => string
  /** Makes rows clickable; give each row a link or button too, for keyboard users. */
  onRowClick?: (row: T) => void
}

/** The Zinkworks list table: muted uppercase header row, roomy body rows. */
export function DataTable<T>({ columns, rows, rowKey, onRowClick }: DataTableProps<T>) {
  const alignClass = (column: DataColumn<T>) => column.align === 'right' && 'text-right'
  return (
    <Table>
      <TableHeader className="bg-muted/60">
        <TableRow className="hover:bg-transparent">
          {columns.map((column) => (
            <TableHead
              key={column.header}
              className={cn('h-12 px-6 text-xs font-bold tracking-[0.04em] text-muted-foreground uppercase', alignClass(column))}
            >
              {column.hideHeader ? <span className="sr-only">{column.header}</span> : column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow
            key={rowKey(row)}
            onClick={onRowClick && (() => onRowClick(row))}
            className={cn(onRowClick && 'cursor-pointer')}
          >
            {columns.map((column) => (
              <TableCell key={column.header} className={cn('px-6 py-4 text-[15px] text-foreground', alignClass(column))}>
                {column.render(row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
