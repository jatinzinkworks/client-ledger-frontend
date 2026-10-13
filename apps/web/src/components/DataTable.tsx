import type { ReactNode } from 'react'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface DataColumn<T> {
  header: string
  /**
   * Aligns the column, heading and cells together: text reads from the left (the default), short
   * fixed-width values (dates, counts, rates, badges) sit centred, and amounts line up on the right.
   */
  align?: 'center' | 'right'
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

/** The Zinkworks list table: muted uppercase header row, roomy body rows; each heading aligns with its cells. */
export function DataTable<T>({ columns, rows, rowKey, onRowClick }: DataTableProps<T>) {
  const alignClass = (column: DataColumn<T>) =>
    column.align === 'right' ? 'text-right' : column.align === 'center' && 'text-center'
  return (
    <Table>
      <TableHeader className="bg-muted/60">
        <TableRow className="hover:bg-transparent">
          {columns.map((column) => (
            <TableHead
              key={column.header}
              className={cn(
                'h-12 px-4 text-xs font-bold tracking-[0.04em] text-muted-foreground uppercase first:pl-6 last:pr-6',
                alignClass(column),
              )}
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
              <TableCell key={column.header} className={cn('px-4 py-4 text-[15px] text-foreground first:pl-6 last:pr-6', alignClass(column))}>
                {column.render(row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
