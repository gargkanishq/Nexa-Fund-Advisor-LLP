import { Hono } from 'hono';
import { validateEnquiryPayload } from '../../shared/validation.js';
import { randomHex } from '../utils/crypto.js';
import { appendLeadToSheet, isGoogleSheetsConfigured } from '../utils/googleSheets.js';
import {
  checkRateLimit,
  cleanupExpiredRecords,
  getDedupeEntry,
  incrementRateLimit,
  setDedupeEntry,
} from '../utils/rateLimit.js';
import { getClientIp } from '../utils/session.js';

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const DEDUPE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

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
  const randomPart = randomHex(2).toUpperCase();
  return `NF-${datePart}-${randomPart}`;
}

const enquiries = new Hono();

enquiries.post('/', async (c) => {
  let body = {};
  try {
    body = await c.req.json();
  } catch {
    body = {};
  }

  // Honeypot anti-spam trap (hidden field legitimate users never fill)
  if (typeof body.website === 'string' && body.website.trim().length > 0) {
    return c.json({ ok: true, enquiryId: 'NF-ACCEPTED', mode: 'filtered' }, 200);
  }

  const ip = getClientIp(c);
  const rateKey = `enquiry:${ip}`;
  const rate = await checkRateLimit(c.env.DB, rateKey, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
  if (!rate.allowed) {
    return c.json(
      {
        ok: false,
        code: 'RATE_LIMITED',
        message: 'Too many enquiries submitted recently. Please wait a few minutes or call +91 98914 43855.',
      },
      429
    );
  }

  await incrementRateLimit(c.env.DB, rateKey, RATE_LIMIT_WINDOW_MS);

  const clientRequestId =
    typeof body.clientRequestId === 'string' ? body.clientRequestId.trim().slice(0, 64) : '';
  const clientDedupeKey = clientRequestId ? `req:${clientRequestId}` : '';

  if (clientDedupeKey) {
    const cachedToken = await getDedupeEntry(c.env.DB, clientDedupeKey);
    if (cachedToken) {
      return c.json({
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
    return c.json(
      {
        ok: false,
        code: 'VALIDATION_ERROR',
        message: 'Please review the highlighted fields and try again.',
        errors,
      },
      400
    );
  }

  const leadDedupeKey = `lead:${sanitized.normalizedPhone}:${sanitized.enquiryType}`;
  const recent = await getDedupeEntry(c.env.DB, leadDedupeKey);
  if (recent) {
    return c.json({
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

  if (!isGoogleSheetsConfigured(c.env)) {
    console.error('[Enquiry Blocked] Google Sheets credentials not configured', {
      enquiryId,
      enquiryType: sanitized.enquiryType,
      city: sanitized.city,
    });
    return c.json(
      {
        ok: false,
        code: 'SHEETS_NOT_CONFIGURED',
        message:
          'Lead sheet integration is awaiting Google Sheets API configuration. Please reach us immediately on WhatsApp (+91 98914 43855) or call us directly—your entered details remain preserved below.',
      },
      503
    );
  }

  try {
    await appendLeadToSheet(leadRecord, c.env);

    await setDedupeEntry(c.env.DB, leadDedupeKey, enquiryId, 'google_sheets', DEDUPE_WINDOW_MS);
    if (clientDedupeKey) {
      await setDedupeEntry(c.env.DB, clientDedupeKey, enquiryId, 'google_sheets', DEDUPE_WINDOW_MS);
    }

    try {
      c.executionCtx?.waitUntil(cleanupExpiredRecords(c.env.DB));
    } catch {
      // Ignored outside live Worker executionCtx (e.g. direct app.fetch tests)
    }

    return c.json(
      {
        ok: true,
        enquiryId,
        submittedAt: `${submissionDate}, ${submissionTime} IST`,
        mode: 'google_sheets',
        message: 'Thank you. Your loan enquiry has been recorded and our team will contact you shortly.',
      },
      201
    );
  } catch (err) {
    console.error('[Google Sheets Error]', {
      enquiryId,
      enquiryType: sanitized.enquiryType,
      city: sanitized.city,
      message: err?.message || String(err),
    });
    return c.json(
      {
        ok: false,
        code: 'SHEETS_WRITE_FAILED',
        message:
          'We could not record your enquiry right now due to a temporary connection issue. Please click Retry or connect with us directly on WhatsApp (+91 98914 43855).',
      },
      502
    );
  }
});

export default enquiries;
