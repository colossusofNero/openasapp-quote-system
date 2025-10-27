/**
 * Quote Selectors and Utilities
 * Pure functions for processing quote data with robust error handling
 */

import { SavedQuote } from '../validations/quote.schema';
import { formatMoney } from '../utils';

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

export interface QuoteCounts {
  all: number;
  draft: number;
  sent: number;
  accepted: number;
  rejected: number;
}

/**
 * Calculate quote counts by status
 * @param quotes - Array of quotes
 * @returns Counts object with totals for each status
 */
export function selectCounts(quotes: SavedQuote[] = []): QuoteCounts {
  const all = quotes.length;
  const draft = quotes.filter(q => q.status === 'draft').length;
  const sent = quotes.filter(q => q.status === 'sent').length;
  const accepted = quotes.filter(q => q.status === 'accepted').length;
  const rejected = quotes.filter(q => q.status === 'rejected').length;

  return { all, draft, sent, accepted, rejected };
}

/**
 * Select most recent quotes sorted by updatedAt or createdAt
 * @param quotes - Array of quotes
 * @param n - Number of recent quotes to return (default: 5)
 * @returns Array of most recent quotes
 */
export function selectRecent(quotes: SavedQuote[] = [], n: number = 5): SavedQuote[] {
  return [...quotes]
    .sort((a, b) => {
      const dateA = new Date(a.updatedAt ?? a.createdAt).getTime();
      const dateB = new Date(b.updatedAt ?? b.createdAt).getTime();
      return dateB - dateA; // Descending order (newest first)
    })
    .slice(0, n);
}

/**
 * Safely extract and format the quote total amount
 * Handles NaN, null, undefined, and string values
 * @param quote - Quote object
 * @returns Formatted currency string or '—' if invalid
 */
export function displayTotal(quote: SavedQuote | null | undefined): string {
  if (!quote) return '—';

  try {
    // Try to get bidAmount from output
    const bidAmount = quote.output?.bidAmount;

    if (bidAmount != null) {
      const result = formatMoney(bidAmount, 'USD');

      // If formatMoney returned '—', log a warning for debugging
      if (result === '—' && process.env.NODE_ENV === 'development') {
        console.warn(`[Quote ${quote.id}] Invalid bidAmount:`, bidAmount);
      }

      return result;
    }

    return '—';
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[Quote ${quote.id}] Error formatting total:`, error);
    }
    return '—';
  }
}

/**
 * Get the display name for a quote (client name or property address)
 * @param quote - Quote object
 * @returns Display name or '—' if not available
 */
export function getQuoteDisplayName(quote: SavedQuote | null | undefined): string {
  if (!quote?.input) return '—';

  const name = quote.input.propertyOwnerName;
  if (name && name.trim()) return name.trim();

  const address = quote.input.propertyAddress;
  if (address && address.trim()) return address.trim();

  return '—';
}

/**
 * Get the property address for a quote
 * @param quote - Quote object
 * @returns Property address or '—' if not available
 */
export function getPropertyAddress(quote: SavedQuote | null | undefined): string {
  if (!quote?.input?.propertyAddress) return '—';

  const address = quote.input.propertyAddress.trim();
  return address || '—';
}

/**
 * Get status badge variant for UI styling
 * @param status - Quote status
 * @returns Badge variant string
 */
export function getStatusVariant(
  status: QuoteStatus
): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' {
  switch (status) {
    case 'accepted':
      return 'success';
    case 'sent':
      return 'warning';
    case 'rejected':
      return 'destructive';
    case 'expired':
      return 'secondary';
    case 'draft':
    default:
      return 'default';
  }
}

/**
 * Get human-readable status label
 * @param status - Quote status
 * @returns Friendly status label
 */
export function getStatusLabel(status: QuoteStatus): string {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'sent':
      return 'Sent';
    case 'accepted':
      return 'Accepted';
    case 'rejected':
      return 'Rejected';
    case 'expired':
      return 'Expired';
    default:
      return 'Unknown';
  }
}
