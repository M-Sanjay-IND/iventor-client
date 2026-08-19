import { Menu } from 'lucide-react'
import { Breadcrumbs } from './Breadcrumbs'
import { ThemeToggle } from './ThemeToggle'
import { UserMenu } from './UserMenu'

interface HeaderProps {
  onMobileMenuToggle: () => void
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border/80 bg-background/95 px-4 lg:px-6 backdrop-blur-md">
      {/* Left: Mobile menu + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="skeuo-button-secondary flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-4" />
        </button>
        <Breadcrumbs />
      </div>

      {/* Right: Theme Toggle + User Menu */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <div className="h-4 w-px bg-border/80" />
        <UserMenu />
      </div>
    </header>
  )
}
