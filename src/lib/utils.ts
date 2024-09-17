import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function notNull<T>(value: T | null): value is T {
  return value != null
}

export function ifDefined(field: string, response: object): string | undefined {
  if (field in response) return response[field as keyof typeof response] as string
}