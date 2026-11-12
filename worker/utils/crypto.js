const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export const COOKIE_NAME = 'nexa_admin_session';
export const SESSION_TTL_SECONDS = 12 * 60 * 60; // 12 hours
export const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000;
export const PBKDF2_ITERATIONS = 100000; // Maximum supported by Cloudflare Workers Web Crypto

export function bytesToHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function hexToBytes(hex) {
  if (!hex || typeof hex !== 'string' || hex.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(hex)) {
    return null;
  }
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function toBase64Url(input) {
  const bytes = typeof input === 'string' ? textEncoder.encode(input) : new Uint8Array(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function fromBase64Url(str) {
  if (!str || typeof str !== 'string') return null;
  try {
    const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (str.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

export function timingSafeEqualBytes(a, b) {
  if (!(a instanceof Uint8Array) || !(b instanceof Uint8Array)) return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

export function randomHex(byteLength = 16) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

/**
 * Generates a PBKDF2-SHA256 hash formatted for Cloudflare Workers secrets:
 * pbkdf2_sha256$100000$<saltHex>$<derivedHex>
 */
export async function hashPasswordPbkdf2(password, iterations = PBKDF2_ITERATIONS) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string.');
  }
  if (iterations < 10000 || iterations > PBKDF2_ITERATIONS) {
    throw new Error(`PBKDF2 iterations must be between 10000 and ${PBKDF2_ITERATIONS}.`);
  }

  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  return `pbkdf2_sha256$${iterations}$${bytesToHex(salt)}$${bytesToHex(new Uint8Array(derivedBits))}`;
}

export async function verifyPasswordPbkdf2(password, storedHash) {
  if (!password || typeof password !== 'string' || !storedHash || typeof storedHash !== 'string') {
    return false;
  }

  const parts = storedHash.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2_sha256') {
    return false;
  }

  const iterations = Number.parseInt(parts[1], 10);
  if (!Number.isFinite(iterations) || iterations < 10000 || iterations > PBKDF2_ITERATIONS) {
    return false;
  }

  const salt = hexToBytes(parts[2]);
  const expected = hexToBytes(parts[3]);
  if (!salt || !expected || expected.length !== 32) {
    return false;
  }

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  return timingSafeEqualBytes(new Uint8Array(derivedBits), expected);
}

/**
 * Constant-time comparison helper via HMAC-SHA256 digest equality
 * so string length differences never leak timing information.
 */
async function timingSafeCompareStrings(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ephemeralKey = await crypto.subtle.generateKey(
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const [sigA, sigB] = await Promise.all([
    crypto.subtle.sign('HMAC', ephemeralKey, textEncoder.encode(a)),
    crypto.subtle.sign('HMAC', ephemeralKey, textEncoder.encode(b)),
  ]);
  return timingSafeEqualBytes(new Uint8Array(sigA), new Uint8Array(sigB));
}

export async function verifyAdminCredentials(email, password, env) {
  const expectedEmail = (env?.ADMIN_EMAIL || '').trim().toLowerCase();
  const normalizedEmail = (email || '').trim().toLowerCase();

  if (!expectedEmail || !normalizedEmail) {
    return false;
  }

  const emailMatches = await timingSafeCompareStrings(normalizedEmail, expectedEmail);
  if (!emailMatches) {
    return false;
  }

  if (env?.ADMIN_PASSWORD_HASH) {
    return verifyPasswordPbkdf2(password, env.ADMIN_PASSWORD_HASH);
  }

  if (env?.ADMIN_PASSWORD) {
    return timingSafeCompareStrings(password || '', env.ADMIN_PASSWORD);
  }

  return false;
}

export function getSessionSecret(env) {
  const secret = env?.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be configured with at least 32 characters.');
  }
  return secret;
}

async function importHmacKey(secret, usage) {
  return crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage]
  );
}

export async function signSessionToken(payload, env, ttlMs = SESSION_TTL_MS) {
  const secret = getSessionSecret(env);
  const now = Date.now();
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + ttlMs,
    jti: randomHex(8),
  };
  const body = toBase64Url(JSON.stringify(tokenPayload));
  const key = await importHmacKey(secret, 'sign');
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(body));
  return `${body}.${toBase64Url(signature)}`;
}

export async function verifySessionToken(token, env) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const secret = env?.SESSION_SECRET;
  if (!secret || secret.length < 32) return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  if (!body || !sig) return null;

  const sigBytes = fromBase64Url(sig);
  if (!sigBytes) return null;

  const key = await importHmacKey(secret, 'verify');
  const valid = await crypto.subtle.verify('HMAC', key, sigBytes, textEncoder.encode(body));
  if (!valid) return null;

  const bodyBytes = fromBase64Url(body);
  if (!bodyBytes) return null;

  try {
    const parsed = JSON.parse(textDecoder.decode(bodyBytes));
    if (!parsed || typeof parsed.exp !== 'number' || Date.now() > parsed.exp) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
