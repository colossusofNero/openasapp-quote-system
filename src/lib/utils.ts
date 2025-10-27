import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Safe currency formatter that handles NaN, null, undefined, and string values
 * @param value - The value to format (number, string, null, or undefined)
 * @param currency - Currency code (default: 'USD')
 * @returns Formatted currency string or '—' if invalid
 */
export function formatMoney(value: number | string | null | undefined, currency: string = 'USD'): string {
  const num = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(num)) return '—';
  // Type assertion is safe here because Number.isFinite checks for valid numbers
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num as number);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

/**
 * Timezone-aware date formatter with error handling
 * @param iso - ISO date string or Date object
 * @param tz - Timezone (default: 'America/Phoenix')
 * @returns Formatted date string (e.g., "Oct 27, 2025") or '—' if invalid
 */
export function formatDateWithTimezone(
  iso: string | Date | null | undefined,
  tz: string = 'America/Phoenix'
): string {
  try {
    if (!iso) return '—';
    const d = typeof iso === 'string' ? new Date(iso) : iso;
    if (isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(d);
  } catch {
    return '—';
  }
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}
