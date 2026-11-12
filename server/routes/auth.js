import express from 'express';
import {
  checkLoginRateLimit,
  clearFailedLogins,
  clearSessionCookie,
  getAdminFromRequest,
  recordFailedLogin,
  requireAdmin,
  setSessionCookie,
  verifyAdminCredentials,
} from '../utils/auth.js';
import { getGoogleSheetsStatus } from '../utils/googleSheets.js';

const router = express.Router();

router.get('/session', (req, res) => {
  const admin = getAdminFromRequest(req);
  if (!admin) {
    return res.json({ authenticated: false, admin: null });
  }
  return res.json({
    authenticated: true,
    admin: { email: admin.email, name: admin.name },
  });
});

router.post('/login', (req, res) => {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const rate = checkLoginRateLimit(ip);
  if (!rate.allowed) {
    return res.status(429).json({
      ok: false,
      message: `Too many login attempts. Please wait about ${rate.retryAfterMinutes} minute(s) and try again.`,
    });
  }

  const { email, password } = req.body || {};
  if (!verifyAdminCredentials(email, password)) {
    recordFailedLogin(ip);
    return res.status(401).json({
      ok: false,
      message: 'Invalid email address or password.',
    });
  }

  clearFailedLogins(ip);
  const adminPayload = {
    email: (process.env.ADMIN_EMAIL || 'gopal.arora@nexafundadvisor.com').trim(),
    name: process.env.ADMIN_NAME || 'Mr. Gopal Arora',
  };
  setSessionCookie(res, adminPayload);
  return res.json({ ok: true, admin: adminPayload });
});

router.post('/logout', (_req, res) => {
  clearSessionCookie(res);
  return res.json({ ok: true });
});

router.get('/diagnostics', requireAdmin, (_req, res) => {
  return res.json({
    ok: true,
    googleSheets: getGoogleSheetsStatus(),
  });
});

export default router;
