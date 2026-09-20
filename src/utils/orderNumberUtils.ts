import { OfficeOrder } from '../types';

/**
 * Extracts sequence number from various Hindi and English order number patterns
 * Examples: 
 * - "क्र./CRC/2026/01" -> 1
 * - "क्र./CRC/2026/105" -> 105
 * - "क्र. /CRC/2026/2" -> 2
 * - "104" -> 104
 * - "क्र. 55" -> 55
 */
export function extractSequenceNumber(orderNumber: string | undefined | null): number | null {
  if (!orderNumber) return null;

  const trimmed = orderNumber.trim();

  // Pattern 1: Suffix after last slash e.g. ".../105" or ".../ 105"
  const slashMatch = trimmed.match(/\/+\s*(\d+)\s*$/);
  if (slashMatch && slashMatch[1]) {
    return parseInt(slashMatch[1], 10);
  }

  // Pattern 2: Sequence after Hindi/Eng abbreviation e.g. "क्र. 105" or "No. 105"
  const numMatch = trimmed.match(/(?:क्र\.?|क्रमांक|No\.?|Num\.?|Order)\s*[:/-]?\s*(\d+)/i);
  if (numMatch && numMatch[1]) {
    return parseInt(numMatch[1], 10);
  }

  // Pattern 3: Any last digit sequence in the string
  const anyDigits = trimmed.match(/(\d+)(?!.*\d)/);
  if (anyDigits && anyDigits[1]) {
    return parseInt(anyDigits[1], 10);
  }

  return null;
}

/**
 * Finds the highest order sequence number among all saved orders in history
 */
export function getHighestOrderSequence(orders: OfficeOrder[]): number {
  if (!orders || orders.length === 0) return 0;

  let maxSeq = 0;
  for (const order of orders) {
    const seq = extractSequenceNumber(order.orderNumber);
    if (seq !== null && !isNaN(seq) && seq > maxSeq) {
      maxSeq = seq;
    }
  }

  return maxSeq;
}

/**
 * Generates the next sequential order number based on saved orders and prefix
 * Always produces sequential continuous numbers, starting from max + 1
 */
export function generateNextOrderNumber(prefix: string, orders: OfficeOrder[]): string {
  const cleanPrefix = (prefix || 'क्र./सं.सं.के./2026/').trim();
  const highest = getHighestOrderSequence(orders);
  const nextNumber = highest + 1;

  // Format with leading zero if less than 10 (e.g. 01, 02... 10, 101)
  const formattedSeq = nextNumber < 10 ? `0${nextNumber}` : `${nextNumber}`;

  // If prefix already ends with '/', just append sequence
  if (cleanPrefix.endsWith('/')) {
    return `${cleanPrefix}${formattedSeq}`;
  }

  return `${cleanPrefix}/${formattedSeq}`;
}

/**
 * Sorts orders strictly by numerical order sequence
 */
export function sortOrdersBySequence(orders: OfficeOrder[], ascending: boolean = false): OfficeOrder[] {
  return [...orders].sort((a, b) => {
    const seqA = extractSequenceNumber(a.orderNumber) ?? 0;
    const seqB = extractSequenceNumber(b.orderNumber) ?? 0;

    if (seqA !== seqB) {
      return ascending ? seqA - seqB : seqB - seqA;
    }

    // Fallback to createdAt date
    const dateA = new Date(a.createdAt || a.orderDate || 0).getTime();
    const dateB = new Date(b.createdAt || b.orderDate || 0).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
}
