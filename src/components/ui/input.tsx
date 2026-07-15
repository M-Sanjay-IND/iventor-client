import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Input component with error state styling.
 *
 * Follows shadcn/ui conventions. Supports forwardRef for
 * integration with react-hook-form.
 *
 * @example
 * <Input type="email" placeholder="admin@company.com" />
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2',
          'text-sm text-foreground placeholder:text-muted-foreground',
          'ring-offset-background transition-colors',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }
