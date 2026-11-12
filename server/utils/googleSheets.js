import { google } from 'googleapis';

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

export function isGoogleSheetsConfigured() {
  return Boolean(
    process.env.GOOGLE_SHEET_ID &&
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY
  );
}

export function getGoogleSheetsStatus() {
  return {
    configured: isGoogleSheetsConfigured(),
    sheetName: process.env.GOOGLE_SHEET_NAME || 'Leads',
    localFallbackEnabled: process.env.ALLOW_LOCAL_LEAD_FALLBACK === 'true',
  };
}

function createSheetsClient() {
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

async function ensureHeaders(sheets, spreadsheetId, sheetName) {
  const range = `${sheetName}!A1:K1`;
  const existing = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const firstRow = existing.data.values?.[0];
  if (!firstRow || firstRow.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [SHEET_HEADERS] },
    });
  }
}

export async function appendLeadToSheet(lead) {
  if (!isGoogleSheetsConfigured()) {
    const err = new Error('Google Sheets credentials are not configured.');
    err.code = 'SHEETS_NOT_CONFIGURED';
    throw err;
  }

  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const sheetName = process.env.GOOGLE_SHEET_NAME || 'Leads';
  const sheets = createSheetsClient();

  await ensureHeaders(sheets, spreadsheetId, sheetName);

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

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:K`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  });

  return { enquiryId: lead.enquiryId, sheetName };
}
