import { toBase64Url } from './crypto.js';

export const SHEET_HEADERS = [
  'Enquiry ID',
  'Submission Date',
  'Submission Time',
  'Full Name',
  'Phone Number',
  'City',
  'Gender',
  'Employment Type',
  'Enquiry Type',
  'Lead Status',
  'Notes',
];

const cachedTokens = new Map();

export function isGoogleSheetsConfigured(env) {
  return Boolean(
    env?.GOOGLE_SHEET_ID &&
      env?.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      env?.GOOGLE_PRIVATE_KEY
  );
}

export function getGoogleSheetsStatus(env) {
  return {
    configured: isGoogleSheetsConfigured(env),
    sheetName: env?.GOOGLE_SHEET_NAME || 'Leads',
    localFallbackEnabled: false,
  };
}

function pemToArrayBuffer(rawPem) {
  const normalized = (rawPem || '').replace(/\\n/g, '\n');
  const base64Body = normalized
    .replace(/-----BEGIN [A-Z ]+-----/g, '')
    .replace(/-----END [A-Z ]+-----/g, '')
    .replace(/\s+/g, '');

  if (!base64Body) {
    throw new Error('GOOGLE_PRIVATE_KEY is empty or malformed.');
  }

  const binary = atob(base64Body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function createServiceAccountJwt(serviceAccountEmail, privateKeyPem) {
  const nowSec = Math.floor(Date.now() / 1000);
  const header = toBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claimSet = toBase64Url(
    JSON.stringify({
      iss: serviceAccountEmail,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      iat: nowSec,
      exp: nowSec + 3600,
    })
  );

  const signingInput = `${header}.${claimSet}`;
  const keyBuffer = pemToArrayBuffer(privateKeyPem);
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );

  return `${signingInput}.${toBase64Url(signature)}`;
}

async function getGoogleAccessToken(env, fetchImpl = fetch) {
  const email = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const cacheKey = `${email}:${env.GOOGLE_SHEET_ID}`;
  const cached = cachedTokens.get(cacheKey);
  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.accessToken;
  }

  const assertion = await createServiceAccountJwt(email, env.GOOGLE_PRIVATE_KEY);
  const tokenRes = await fetchImpl('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text().catch(() => '');
    throw new Error(`Google OAuth token exchange failed (${tokenRes.status}): ${errText.slice(0, 250)}`);
  }

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error('Google OAuth response did not include an access_token.');
  }

  const expiresInMs = (Number(tokenData.expires_in) || 3600) * 1000;
  cachedTokens.set(cacheKey, {
    accessToken: tokenData.access_token,
    expiresAt: Date.now() + expiresInMs,
  });

  return tokenData.access_token;
}

async function ensureHeaders(spreadsheetId, sheetName, accessToken, fetchImpl = fetch) {
  const range = encodeURIComponent(`${sheetName}!A1:K1`);
  const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${range}`;

  const existingRes = await fetchImpl(baseUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!existingRes.ok) {
    const errText = await existingRes.text().catch(() => '');
    throw new Error(`Google Sheets header check failed (${existingRes.status}): ${errText.slice(0, 250)}`);
  }

  const existingData = await existingRes.json();
  const firstRow = existingData.values?.[0];

  if (!firstRow || firstRow.length === 0) {
    const updateRes = await fetchImpl(`${baseUrl}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [SHEET_HEADERS] }),
    });

    if (!updateRes.ok) {
      const errText = await updateRes.text().catch(() => '');
      throw new Error(`Google Sheets header creation failed (${updateRes.status}): ${errText.slice(0, 250)}`);
    }
  }
}

export async function appendLeadToSheet(lead, env, fetchImpl = fetch) {
  if (!isGoogleSheetsConfigured(env)) {
    const err = new Error('Google Sheets credentials are not configured.');
    err.code = 'SHEETS_NOT_CONFIGURED';
    throw err;
  }

  const spreadsheetId = env.GOOGLE_SHEET_ID;
  const sheetName = env.GOOGLE_SHEET_NAME || 'Leads';
  const accessToken = await getGoogleAccessToken(env, fetchImpl);

  await ensureHeaders(spreadsheetId, sheetName, accessToken, fetchImpl);

  const row = [
    lead.enquiryId,
    lead.submissionDate,
    lead.submissionTime,
    lead.fullName,
    lead.phone,
    lead.city,
    lead.gender,
    lead.employmentType,
    lead.enquiryType,
    lead.leadStatus || 'New',
    lead.notes || '',
  ];

  const appendRange = encodeURIComponent(`${sheetName}!A:K`);
  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId
  )}/values/${appendRange}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const appendRes = await fetchImpl(appendUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: [row] }),
  });

  if (!appendRes.ok) {
    const errText = await appendRes.text().catch(() => '');
    throw new Error(`Google Sheets row append failed (${appendRes.status}): ${errText.slice(0, 250)}`);
  }

  return { enquiryId: lead.enquiryId, sheetName };
}

export function clearGoogleTokenCacheForTests() {
  cachedTokens.clear();
}
