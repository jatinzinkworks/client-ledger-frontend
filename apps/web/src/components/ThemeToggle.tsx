import { Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useTheme } from '@/theme/useTheme'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <Button variant="ghost" size="sm" className={className} onClick={toggleTheme} aria-label={`Switch to ${next} theme`}>
      {theme === 'dark' ? <Sun /> : <Moon />}
      <span>{theme === 'dark' ? 'Light' : 'Dark'} Theme</span>
    </Button>
  )
}
