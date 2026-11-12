import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import {
  COOKIE_NAME,
  SESSION_TTL_SECONDS,
  signSessionToken,
  verifySessionToken,
} from './crypto.js';

function isHttpsRequest(c) {
  const proto = c.req.header('x-forwarded-proto');
  if (proto) return proto.toLowerCase() === 'https';
  try {
    return new URL(c.req.url).protocol === 'https:';
  } catch {
    return true;
  }
}

export async function setAdminSessionCookie(c, payload) {
  const token = await signSessionToken(payload, c.env);
  setCookie(c, COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: isHttpsRequest(c),
    maxAge: SESSION_TTL_SECONDS,
    path: '/',
  });
}

export function clearAdminSessionCookie(c) {
  deleteCookie(c, COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: isHttpsRequest(c),
    path: '/',
  });
}

export async function getAdminFromRequest(c) {
  const token = getCookie(c, COOKIE_NAME);
  if (!token) return null;
  return verifySessionToken(token, c.env);
}

export async function requireAdmin(c, next) {
  const admin = await getAdminFromRequest(c);
  if (!admin) {
    return c.json({ ok: false, message: 'Authentication required. Please sign in.' }, 401);
  }
  c.set('admin', admin);
  return next();
}

export function getClientIp(c) {
  const cfIp = c.req.header('cf-connecting-ip');
  if (cfIp) return cfIp.trim();
  const forwarded = c.req.header('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}
