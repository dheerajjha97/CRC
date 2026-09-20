import { OfficeOrder } from '../types';

/**
 * Extracts the sequential dispatch/issue number from an order number string.
 * Handles formats like:
 * - "क्र./सं.सं.के./2026/101" -> 101
 * - "सं.सं.के./2026/1" -> 1
 * - "जावक-45" -> 45
 * - "पत्रांक/2026/12" -> 12
 * - "5" -> 5
 */
export function extractSequenceNumber(orderNumberStr: string): number | null {
  if (!orderNumberStr || typeof orderNumberStr !== 'string') return null;

  const trimmed = orderNumberStr.trim();

  // 1. Check for trailing numeric component (most common in official dispatch registers: .../101 or -101)
  const trailingMatch = trimmed.match(/(?:[\/\-_:\s]|^)(\d+)\s*$/);
  if (trailingMatch && trailingMatch[1]) {
    const val = parseInt(trailingMatch[1], 10);
    if (!isNaN(val)) {
      return val;
    }
  }

  // 2. Fallback: parse all digits in string and filter out 4-digit years (e.g., 2024..2035)
  const allNumbers = trimmed.match(/\d+/g);
  if (allNumbers && allNumbers.length > 0) {
    const currentYear = new Date().getFullYear();
    const candidateNumbers = allNumbers.map(n => parseInt(n, 10)).filter(n => !isNaN(n));

    // Filter out 4-digit year numbers if other numbers exist
    const nonYearCandidates = candidateNumbers.filter(
      n => !(n >= 2000 && n <= currentYear + 10)
    );

    if (nonYearCandidates.length > 0) {
      return nonYearCandidates[nonYearCandidates.length - 1];
    }

    return candidateNumbers[candidateNumbers.length - 1];
  }

  return null;
}

/**
 * Finds the highest sequence number among all saved orders.
 */
export function getHighestOrderSequence(orders: OfficeOrder[]): number {
  if (!orders || orders.length === 0) return 0;

  let maxSeq = 0;
  for (const o of orders) {
    if (o && o.orderNumber) {
      const seq = extractSequenceNumber(o.orderNumber);
      if (seq !== null && seq > maxSeq && seq < 10000000) {
        maxSeq = seq;
      }
    }
  }
  return maxSeq;
}

/**
 * Generates the next sequential order number (बढ़ते क्रम में)
 * based on the highest existing saved order number.
 */
export function generateNextOrderNumber(orders: OfficeOrder[], prefix?: string): string {
  const currentYear = new Date().getFullYear();
  const defaultPrefix = `क्र./सं.सं.के./${currentYear}/`;
  const cleanPrefix = (prefix && prefix.trim()) ? prefix.trim() : defaultPrefix;

  const highestSeq = getHighestOrderSequence(orders);
  const nextSeq = highestSeq > 0 ? highestSeq + 1 : (orders.length > 0 ? orders.length + 1 : 1);

  return `${cleanPrefix}${nextSeq}`;
}

/**
 * Sorts orders in ascending sequence (बढ़ते क्रम में) or descending sequence (घटते क्रम में).
 */
export function sortOrdersBySequence(
  orders: OfficeOrder[], 
  direction: 'asc' | 'desc' = 'asc'
): OfficeOrder[] {
  return [...orders].sort((a, b) => {
    const seqA = extractSequenceNumber(a.orderNumber) ?? 0;
    const seqB = extractSequenceNumber(b.orderNumber) ?? 0;

    if (seqA !== seqB) {
      return direction === 'asc' ? seqA - seqB : seqB - seqA;
    }

    // Fallback to date sorting
    const dateA = new Date(a.createdAt || a.orderDate).getTime();
    const dateB = new Date(b.createdAt || b.orderDate).getTime();
    return direction === 'asc' ? dateA - dateB : dateB - dateA;
  });
}
