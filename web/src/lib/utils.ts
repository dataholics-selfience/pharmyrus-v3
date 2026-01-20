import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility for merging Tailwind CSS classes
 * Prevents class conflicts and maintains specificity
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format date for pharmaceutical contexts
 * @param date - Date to format
 * @returns Formatted date string (DD/MM/YYYY)
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Format patent number for display
 * @param patentNumber - Raw patent number
 * @returns Formatted patent number
 */
export function formatPatentNumber(patentNumber: string): string {
  // BR112024016586 → BR 11 2024 016586
  if (patentNumber.startsWith('BR')) {
    const clean = patentNumber.replace(/[^0-9]/g, '')
    if (clean.length >= 10) {
      return `BR ${clean.slice(0, 2)} ${clean.slice(2, 6)} ${clean.slice(6)}`
    }
  }
  return patentNumber
}

/**
 * Truncate text with ellipsis
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

/**
 * Delay execution (for testing/animations)
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
