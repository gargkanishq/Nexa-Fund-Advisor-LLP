import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateEnquiryPayload } from '../../shared/validation.js';
import { appendLeadToSheet, isGoogleSheetsConfigured } from '../utils/googleSheets.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_LEADS_FILE = path.resolve(__dirname, '../data/local-leads-dev.json');

const router = express.Router();

// In-memory IP rate limit & recent duplicate submission cache
const ipWindow = new Map();
const recentRequests = new Map(); // key -> { enquiryId, expiresAt }
const processedClientTokens = new Map(); // clientRequestId -> { enquiryId, expiresAt }

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const DEDUPE_WINDOW_MS = 5 * 60 * 1000;

function checkIpLimit(ip) {
  const now = Date.now();
  const entry = ipWindow.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
  if (now > entry.resetAt) {
    ipWindow.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  ipWindow.set(ip, entry);
  return true;
}

function getISTDateAndTime(date = new Date()) {
  const submissionDate = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

  const submissionTime = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);

  return { submissionDate, submissionTime };
}

function generateEnquiryId() {
  const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randomPart = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `NF-${datePart}-${randomPart}`;
}

async function saveLeadLocallyForDev(lead) {
  await fs.mkdir(path.dirname(LOCAL_LEADS_FILE), { recursive: true });
  let existing = [];
  try {
    const raw = await fs.readFile(LOCAL_LEADS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) existing = parsed;
  } catch {
    existing = [];
  }
  existing.unshift(lead);
  await fs.writeFile(LOCAL_LEADS_FILE, JSON.stringify(existing, null, 2), 'utf8');
}

router.post('/', async (req, res) => {
  const body = req.body || {};

  // Honeypot anti-spam trap (hidden field that legitimate users never fill)
  if (typeof body.website === 'string' && body.website.trim().length > 0) {
    return res.status(200).json({ ok: true, enquiryId: 'NF-ACCEPTED', mode: 'filtered' });
  }

  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  if (!checkIpLimit(ip)) {
    return res.status(429).json({
      ok: false,
      code: 'RATE_LIMITED',
      message: 'Too many enquiries submitted recently. Please wait a few minutes or call +91 98914 43855.',
    });
  }

  const clientRequestId =
    typeof body.clientRequestId === 'string' ? body.clientRequestId.trim().slice(0, 64) : '';
  const now = Date.now();
  if (clientRequestId) {
    const cachedToken = processedClientTokens.get(clientRequestId);
    if (cachedToken && cachedToken.expiresAt > now) {
      return res.status(200).json({
        ok: true,
        deduplicated: true,
        enquiryId: cachedToken.enquiryId,
        mode: cachedToken.mode,
        message: 'Your enquiry has already been received.',
      });
    }
  }

  const { isValid, errors, sanitized } = validateEnquiryPayload(body);
  if (!isValid) {
    return res.status(400).json({
      ok: false,
      code: 'VALIDATION_ERROR',
      message: 'Please review the highlighted fields and try again.',
      errors,
    });
  }

  const dedupeKey = `${sanitized.normalizedPhone}:${sanitized.enquiryType}`;
  const recent = recentRequests.get(dedupeKey);
  if (recent && recent.expiresAt > now) {
    return res.status(200).json({
      ok: true,
      deduplicated: true,
      enquiryId: recent.enquiryId,
      mode: recent.mode,
      message: 'We have already received your recent enquiry and our team will reach out shortly.',
    });
  }

  const timestamp = new Date();
  const { submissionDate, submissionTime } = getISTDateAndTime(timestamp);
  const enquiryId = generateEnquiryId();

  const leadRecord = {
    enquiryId,
    submissionDate,
    submissionTime,
    fullName: sanitized.fullName,
    phone: sanitized.phone,
    city: sanitized.city,
    gender: sanitized.gender,
    employmentType: sanitized.employmentType,
    enquiryType: sanitized.enquiryType,
    leadStatus: 'New',
    notes: sanitized.notes,
    submittedAtIso: timestamp.toISOString(),
  };

  if (isGoogleSheetsConfigured()) {
    try {
      await appendLeadToSheet(leadRecord);
      recentRequests.set(dedupeKey, {
        enquiryId,
        mode: 'google_sheets',
        expiresAt: now + DEDUPE_WINDOW_MS,
      });
      if (clientRequestId) {
        processedClientTokens.set(clientRequestId, {
          enquiryId,
          mode: 'google_sheets',
          expiresAt: now + DEDUPE_WINDOW_MS,
        });
      }
      return res.status(201).json({
        ok: true,
        enquiryId,
        submittedAt: `${submissionDate}, ${submissionTime} IST`,
        mode: 'google_sheets',
        message: 'Thank you. Your loan enquiry has been recorded and our team will contact you shortly.',
      });
    } catch (err) {
      console.error('[Google Sheets Error]', err?.message || err);
      return res.status(502).json({
        ok: false,
        code: 'SHEETS_WRITE_FAILED',
        message:
          'We could not record your enquiry right now due to a temporary connection issue. Please click Retry or connect with us directly on WhatsApp (+91 98914 43855).',
      });
    }
  }

  if (process.env.ALLOW_LOCAL_LEAD_FALLBACK === 'true') {
    await saveLeadLocallyForDev(leadRecord);
    recentRequests.set(dedupeKey, {
      enquiryId,
      mode: 'local_dev_fallback',
      expiresAt: now + DEDUPE_WINDOW_MS,
    });
    if (clientRequestId) {
      processedClientTokens.set(clientRequestId, {
        enquiryId,
        mode: 'local_dev_fallback',
        expiresAt: now + DEDUPE_WINDOW_MS,
      });
    }
    return res.status(201).json({
      ok: true,
      enquiryId,
      submittedAt: `${submissionDate}, ${submissionTime} IST`,
      mode: 'local_dev_fallback',
      message:
        'Enquiry saved in local preview log (Google Sheets integration awaits live Service Account credentials in .env).',
    });
  }

  return res.status(503).json({
    ok: false,
    code: 'SHEETS_NOT_CONFIGURED',
    message:
      'Lead sheet integration is awaiting Google Sheets API configuration. Please reach us immediately on WhatsApp (+91 98914 43855) or call us directly—your entered details remain preserved below.',
  });
});

export default router;
