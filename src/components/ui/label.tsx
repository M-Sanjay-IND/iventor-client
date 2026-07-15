import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Label component for form fields.
 *
 * Renders as an HTML <label> with consistent typography.
 * Automatically styles for disabled and error states via peer selectors.
 *
 * @example
 * <Label htmlFor="email">Email Address</Label>
 * <Input id="email" />
 */
const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={cn(
        'text-sm font-medium leading-none',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className,
      )}
      {...props}
    />
  )
})
Label.displayName = 'Label'

export { Label }
