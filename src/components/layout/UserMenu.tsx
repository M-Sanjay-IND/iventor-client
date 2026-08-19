import { useState, useRef, useEffect } from 'react'
import { LogOut, ChevronDown, User } from 'lucide-react'
import { useAuth } from '@/features/auth'

export function UserMenu() {
  const { profile, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!profile) return null

  const displayName = `${profile.first_name} ${profile.last_name}`.trim()
  const initials = `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase()

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="skeuo-button-secondary flex items-center gap-2 rounded-lg border border-border px-2 py-1 text-xs transition-all"
        aria-label="User menu"
      >
        <div className="flex size-6 items-center justify-center rounded-md bg-primary text-[10px] font-bold text-primary-foreground">
          {initials || <User className="size-3" />}
        </div>
        <span className="max-w-[100px] truncate font-medium text-foreground hidden sm:inline">
          {displayName}
        </span>
        <ChevronDown className="size-3 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-60 rounded-xl border border-border bg-popover p-1.5 shadow-xl skeuo-card">
          <div className="border-b border-border/80 px-3 py-2.5">
            <p className="text-xs font-semibold text-foreground truncate">{displayName}</p>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-mono mt-0.5">
              {profile.role.name.replace('_', ' ')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              void signOut()
            }}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
          >
            <LogOut className="size-3.5" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}
