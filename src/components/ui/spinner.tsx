import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Animated loading spinner using CSS.
 *
 * Uses a rotating border technique for a clean, Apple-inspired spinner.
 * Inherits color from parent via `currentColor`.
 *
 * @example
 * <Spinner className="size-6 text-primary" />
 */
export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Screen reader label */
  label?: string
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, label = 'Loading...', ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        aria-label={label}
        className={cn(
          'inline-block size-4 animate-spin rounded-full',
          'border-2 border-current border-t-transparent',
          className,
        )}
        {...props}
      >
        <span className="sr-only">{label}</span>
      </div>
    )
  },
)
Spinner.displayName = 'Spinner'

export { Spinner }
