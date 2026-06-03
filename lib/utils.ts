import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const fmt_date = (date: Date) =>
  `${date.getFullYear()}-${(date.getMonth() + 1).toFixed(0).padStart(2, "0")}-${date.getDate().toFixed(0).padStart(2, "0")}`;