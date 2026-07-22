import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  QrCode,
  BarChart3,
  Settings,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'
import { NAV_ITEMS } from '@/constants'
import { APP_NAME } from '@/constants'
import type { LucideIcon } from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Package,
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
      className={`flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Brand */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        {!collapsed && (
          <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
            {APP_NAME}
          </span>
        )}
        <button
          type="button"
          onClick={onToggle}
          className={`flex size-8 items-center justify-center rounded-md text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground ${
            collapsed ? 'mx-auto' : 'ml-auto'
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

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-3">
        {NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon]
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                } ${collapsed ? 'justify-center px-0' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              {Icon && <Icon className="size-4 shrink-0" />}
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
