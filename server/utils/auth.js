import crypto from 'node:crypto';

const COOKIE_NAME = 'nexa_admin_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

// Sliding-window rate limit for failed login attempts per IP
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export function getSessionSecret() {
  return process.env.SESSION_SECRET || 'dev-only-insecure-session-secret-change-in-production';
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password, storedHash) {
  if (!password || !storedHash || !storedHash.startsWith('scrypt$')) return false;
  const parts = storedHash.split('$');
  if (parts.length !== 3) return false;
  const [, salt, originalHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const original = Buffer.from(originalHex, 'hex');
  if (derived.length !== original.length) return false;
  return crypto.timingSafeEqual(derived, original);
}

export function verifyAdminCredentials(email, password) {
  const expectedEmail = (process.env.ADMIN_EMAIL || 'gopal.arora@nexafundadvisor.com').trim().toLowerCase();
  const normalizedEmail = (email || '').trim().toLowerCase();

  if (!normalizedEmail || normalizedEmail !== expectedEmail) {
    return false;
  }

  const storedHash = process.env.ADMIN_PASSWORD_HASH;
  if (storedHash) {
    return verifyPassword(password, storedHash);
  }

  const plainPassword = process.env.ADMIN_PASSWORD;
  if (!plainPassword) {
    return false;
  }

  const a = Buffer.from(password || '', 'utf8');
  const b = Buffer.from(plainPassword, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function signSessionToken(payload) {
  const secret = getSessionSecret();
  const exp = Date.now() + SESSION_TTL_MS;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const secret = getSessionSecret();
  const expectedSig = crypto.createHmac('sha256', secret).update(body).digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!parsed.exp || Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setSessionCookie(res, payload) {
  const token = signSessionToken(payload);
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_TTL_MS,
    path: '/',
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

export function getAdminFromRequest(req) {
  const token = req.cookies?.[COOKIE_NAME];
  return verifySessionToken(token);
}

export function requireAdmin(req, res, next) {
  const admin = getAdminFromRequest(req);
  if (!admin) {
    return res.status(401).json({ ok: false, message: 'Authentication required. Please sign in.' });
  }
  req.admin = admin;
  return next();
}

export function checkLoginRateLimit(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip) || { count: 0, resetAt: now + LOGIN_WINDOW_MS };
  if (now > record.resetAt) {
    loginAttempts.set(ip, { count: 0, resetAt: now + LOGIN_WINDOW_MS });
    return { allowed: true };
  }
  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    const retryAfterMinutes = Math.ceil((record.resetAt - now) / 60000);
    return { allowed: false, retryAfterMinutes };
  }
  return { allowed: true };
}

export function recordFailedLogin(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
  } else {
    record.count += 1;
    loginAttempts.set(ip, record);
  }
}

export function clearFailedLogins(ip) {
  loginAttempts.delete(ip);
}
