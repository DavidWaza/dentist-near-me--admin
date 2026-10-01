import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * The one helper every component needs. Later classes win by Tailwind
 * semantics, so a caller passing `py-2` replaces a default `py-6`.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
