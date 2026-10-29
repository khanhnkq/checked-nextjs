import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Gộp class CSS Tailwind an toàn, tránh xung đột thuộc tính
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
