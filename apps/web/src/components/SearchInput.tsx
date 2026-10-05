import { Search } from 'lucide-react'

import { FIELD_CONTROL } from '@/components/form/fieldStyles'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  className?: string
}

/** A list search box with a leading magnifier; the placeholder doubles as its accessible name. */
export function SearchInput({ value, onChange, placeholder, className }: SearchInputProps) {
  return (
    <div className={cn('relative w-full max-w-sm', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(FIELD_CONTROL, 'pl-9')}
      />
    </div>
  )
}
