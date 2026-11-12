import { Hono } from 'hono';
import { verifyAdminCredentials } from '../utils/crypto.js';
import { checkRateLimit, incrementRateLimit, resetRateLimit } from '../utils/rateLimit.js';
import {
  clearAdminSessionCookie,
  getAdminFromRequest,
  getClientIp,
  requireAdmin,
  setAdminSessionCookie,
} from '../utils/session.js';
import { getGoogleSheetsStatus } from '../utils/googleSheets.js';

const MAX_LOGIN_ATTEMPTS = 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const auth = new Hono();

auth.get('/session', async (c) => {
  const admin = await getAdminFromRequest(c);
  if (!admin) {
    return c.json({ authenticated: false, admin: null });
  }
  return c.json({
    authenticated: true,
    admin: { email: admin.email, name: admin.name },
  });
});

auth.post('/login', async (c) => {
  const ip = getClientIp(c);
  const rateKey = `login:${ip}`;

  const rate = await checkRateLimit(c.env.DB, rateKey, MAX_LOGIN_ATTEMPTS, LOGIN_WINDOW_MS);
  if (!rate.allowed) {
    return c.json(
      {
        ok: false,
        message: `Too many login attempts. Please wait about ${rate.retryAfterMinutes} minute(s) and try again.`,
      },
      429
    );
  }

  let body = {};
  try {
    body = await c.req.json();
  } catch {
    body = {};
  }

  const { email, password } = body || {};
  const valid = await verifyAdminCredentials(email, password, c.env);

  if (!valid) {
    await incrementRateLimit(c.env.DB, rateKey, LOGIN_WINDOW_MS);
    return c.json(
      {
        ok: false,
        message: 'Invalid email address or password.',
      },
      401
    );
  }

  await resetRateLimit(c.env.DB, rateKey);

  const adminPayload = {
    email: (c.env.ADMIN_EMAIL || 'gopal.arora@nexafundadvisor.com').trim(),
    name: c.env.ADMIN_NAME || 'Mr. Gopal Arora',
  };

  await setAdminSessionCookie(c, adminPayload);
  return c.json({ ok: true, admin: adminPayload });
});

auth.post('/logout', (c) => {
  clearAdminSessionCookie(c);
  return c.json({ ok: true });
});

auth.get('/diagnostics', requireAdmin, (c) => {
  return c.json({
    ok: true,
    googleSheets: getGoogleSheetsStatus(c.env),
    storageMode: c.env?.UPLOADS ? 'r2' : 'unconfigured',
  });
});

export default auth;
