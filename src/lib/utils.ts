import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges class names with Tailwind CSS conflict resolution.
 *
 * Combines clsx's conditional class logic with tailwind-merge's
 * deduplication of conflicting Tailwind utilities.
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-primary', 'px-6')
 * // → 'py-2 px-6 bg-primary' (px-4 is overridden by px-6)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
