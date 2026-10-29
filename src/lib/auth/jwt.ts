export interface JwtPayload {
  sub?: string;
  userId?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

/**
 * Robust base64url decode compatible with Browser, Node.js, and Next.js Edge Runtime.
 */
function decodeBase64(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }

  if (typeof atob === 'function') {
    // Decode UTF-8 string properly from binary string
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(base64, 'base64').toString('utf-8');
  }

  throw new Error('No base64 decoding mechanism available');
}

/**
 * Safely parse a JWT payload without throwing.
 */
export function parseJwt<T = JwtPayload>(token: string | null | undefined): T | null {
  if (!token || typeof token !== 'string') return null;

  try {
    const parts = token.trim().split('.');
    if (parts.length !== 3) return null;

    const payloadJson = decodeBase64(parts[1]);
    return JSON.parse(payloadJson) as T;
  } catch {
    return null;
  }
}

/**
 * Check if a JWT is expired, malformed, or missing.
 * @param token The JWT string to evaluate
 * @param bufferSeconds Buffer window (default 30s) to guard against expiration during transit
 */
export function isTokenExpired(token: string | null | undefined, bufferSeconds = 30): boolean {
  if (!token || typeof token !== 'string') return true;

  const payload = parseJwt(token);
  if (!payload || typeof payload.exp !== 'number') {
    return true;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowSeconds + bufferSeconds;
}

/**
 * Returns remaining milliseconds until token expiration.
 * Returns 0 if expired, malformed, or missing.
 */
export function getTokenRemainingMs(token: string | null | undefined): number {
  if (!token || typeof token !== 'string') return 0;
  const payload = parseJwt(token);
  if (!payload || typeof payload.exp !== 'number') return 0;

  const remaining = payload.exp * 1000 - Date.now();
  return remaining > 0 ? remaining : 0;
}
