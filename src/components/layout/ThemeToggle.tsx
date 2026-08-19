import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative flex h-7 w-14 items-center rounded-full border border-border bg-muted p-0.5 skeuo-well transition-colors cursor-pointer"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <span className="sr-only">Toggle theme</span>

      {/* Background Icons */}
      <span className="flex w-full justify-between px-1 text-muted-foreground/60">
        <Sun className="size-3" />
        <Moon className="size-3" />
      </span>

      {/* Tactile Sliding Knob */}
      <span
        className={`absolute flex size-6 items-center justify-center rounded-full bg-card text-foreground skeuo-pill transition-transform duration-200 ease-out ${
          isDark ? 'translate-x-7' : 'translate-x-0'
        }`}
      >
        {isDark ? (
          <Moon className="size-3 text-foreground" />
        ) : (
          <Sun className="size-3 text-foreground" />
        )}
      </span>
    </button>
  )
}
