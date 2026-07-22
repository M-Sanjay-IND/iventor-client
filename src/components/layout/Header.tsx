import { Menu } from 'lucide-react'
import { Breadcrumbs } from './Breadcrumbs'
import { ThemeToggle } from './ThemeToggle'
import { UserMenu } from './UserMenu'

interface HeaderProps {
  onMobileMenuToggle: () => void
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4 lg:px-6">
      {/* Left: mobile menu + breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
        <Breadcrumbs />
      </div>

      {/* Right: theme toggle + user */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  )
}
