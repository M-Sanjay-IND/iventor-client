import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  QrCode,
  BarChart3,
  Settings,
  PanelLeftClose,
  PanelLeft,
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

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={`flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 select-none ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-14 items-center border-b border-sidebar-border/80 px-4">
        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground skeuo-button-primary">
              <Boxes className="size-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
              {APP_NAME}
            </span>
          </div>
        ) : (
          <div className="mx-auto flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground skeuo-button-primary">
            <Boxes className="size-4" />
          </div>
        )}

        <button
          type="button"
          onClick={onToggle}
          className={`flex size-7 items-center justify-center rounded-lg text-sidebar-foreground/60 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground ${
            collapsed ? 'hidden' : 'ml-auto'
          }`}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeft className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </button>
      </div>

      {/* Navigation Dock */}
      <nav className="flex-1 space-y-1.5 p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon]
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-card text-foreground skeuo-pill font-semibold shadow-xs'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'
                } ${collapsed ? 'justify-center px-0 py-2.5' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              {({ isActive }) => (
                <>
                  {Icon && (
                    <Icon
                      className={`size-4 shrink-0 transition-transform ${
                        isActive ? 'text-foreground' : 'text-sidebar-foreground/70'
                      }`}
                    />
                  )}
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && isActive && (
                    <span className="ml-auto size-1.5 rounded-full bg-foreground" />
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer expand button when collapsed */}
      {collapsed && (
        <div className="p-3 border-t border-sidebar-border">
          <button
            type="button"
            onClick={onToggle}
            className="flex size-9 mx-auto items-center justify-center rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
            aria-label="Expand sidebar"
          >
            <PanelLeft className="size-4" />
          </button>
        </div>
      )}
    </aside>
  )
}
