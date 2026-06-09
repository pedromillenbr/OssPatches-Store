/**
 * Strips characters that would be interpreted as formula prefixes in
 * Google Sheets / Excel (=, +, -, @, TAB, CR). Prevents CSV/formula injection.
 */
export function sanitizeSheetValue(value: unknown): string {
  if (typeof value !== 'string') return String(value ?? '');
  return value.replace(/^[=+\-@\t\r]+/, '').trim();
}

/**
 * Recursively sanitizes all string values in an object for Sheets injection.
 */
export function sanitizeForSheets<T>(obj: T): T {
  if (typeof obj === 'string') return sanitizeSheetValue(obj) as unknown as T;
  if (Array.isArray(obj)) return obj.map(sanitizeForSheets) as unknown as T;
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = sanitizeForSheets(val);
    }
    return result as T;
  }
  return obj;
}

/**
 * Returns true if the request body exceeds maxBytes.
 * Next.js buffers the body before the handler runs, so we check the
 * Content-Length header as a fast pre-check.
 */
export function isBodyTooLarge(req: { headers: Record<string, string | string[] | undefined> }, maxBytes: number): boolean {
  const len = req.headers['content-length'];
  if (!len) return false;
  return parseInt(String(len), 10) > maxBytes;
}
