import { useMemo } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { ROUTE_LABELS } from '@/constants'

export function Breadcrumbs() {
  const { pathname } = useLocation()

  const crumbs = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean)
    return segments.map((segment, index) => {
      const path = '/' + segments.slice(0, index + 1).join('/')
      const label = ROUTE_LABELS[segment] ?? segment
      const isLast = index === segments.length - 1
      return { path, label, isLast }
    })
  }, [pathname])

  if (crumbs.length <= 1) return null

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
      {crumbs.map(({ path, label, isLast }) => (
        <span key={path} className="flex items-center gap-1">
          {!isLast ? (
            <>
              <Link
                to={path}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {label}
              </Link>
              <ChevronRight className="size-3 text-muted-foreground/50" />
            </>
          ) : (
            <span className="font-medium text-foreground">{label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
