import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  QrCode,
  BarChart3,
  Settings,
  X,
  Boxes,
} from 'lucide-react'
import { NAV_ITEMS, APP_NAME } from '@/constants'
import type { LucideIcon } from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  QrCode,
  BarChart3,
  Settings,
}

interface MobileSidebarProps {
  open: boolean
  onClose: () => void
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside className="absolute inset-y-0 left-0 w-64 border-r border-sidebar-border bg-sidebar shadow-2xl skeuo-card">
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground skeuo-button-primary">
              <Boxes className="size-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
              {APP_NAME}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="skeuo-button-secondary flex size-7 items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:text-sidebar-foreground"
            aria-label="Close menu"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="space-y-1.5 p-3">
          {NAV_ITEMS.map((item) => {
            const Icon = ICON_MAP[item.icon]
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-card text-foreground skeuo-pill font-semibold shadow-xs'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {Icon && (
                      <Icon
                        className={`size-4 shrink-0 ${
                          isActive ? 'text-foreground' : 'text-sidebar-foreground/70'
                        }`}
                      />
                    )}
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="ml-auto size-1.5 rounded-full bg-foreground" />
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>
      </aside>
    </div>
  )
}
