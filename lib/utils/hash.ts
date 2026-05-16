/**
 * lib/utils/hash.ts
 *
 * Lightweight hashing utilities for device fingerprinting.
 * Uses the Web Crypto API (available in Node.js 18+ and Edge Runtime).
 */

/**
 * Hash a User-Agent string into a 16-char hex fingerprint.
 * Not reversible to the original UA, but consistent for the same input.
 * 16 hex chars = 64 bits — enough for fingerprint deduplication.
 */
export async function hashUA(ua: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ua);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}
