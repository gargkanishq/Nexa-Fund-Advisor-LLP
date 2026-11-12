export const ENQUIRY_TYPES = ['New Loan', 'Existing Loan'];

export const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];

export const EMPLOYMENT_TYPES = ['Salaried', 'Self-employed', 'Business Owner', 'Other'];

export const LEAD_STATUSES = [
  'New',
  'Contacted',
  'In Progress',
  'Disbursed',
  'Rejected',
  'Follow-up Required',
];

export const BLOG_CATEGORIES = [
  'Home Loans',
  'Balance Transfers',
  'Banking Knowledge',
  'Loan Documentation',
  'Personal Finance',
  'Financial Awareness',
];

/**
 * Normalizes an Indian mobile number input into a 10-digit string if valid.
 * Supports formats like "9891443855", "+91 98914 43855", "098914-43855", "919891443855".
 */
export function normalizeIndianPhone(rawPhone) {
  if (typeof rawPhone !== 'string') return '';
  const digitsOnly = rawPhone.replace(/[\s\-().+]/g, '');
  if (/^91[6-9]\d{9}$/.test(digitsOnly)) {
    return digitsOnly.slice(2);
  }
  if (/^0[6-9]\d{9}$/.test(digitsOnly)) {
    return digitsOnly.slice(1);
  }
  if (/^[6-9]\d{9}$/.test(digitsOnly)) {
    return digitsOnly;
  }
  return '';
}

export function isValidIndianPhone(rawPhone) {
  return normalizeIndianPhone(rawPhone).length === 10;
}

export function formatIndianPhone(tenDigitPhone) {
  const normalized = normalizeIndianPhone(tenDigitPhone);
  if (!normalized) return '';
  return `+91 ${normalized.slice(0, 5)} ${normalized.slice(5)}`;
}

export function sanitizeText(value, maxLength = 150) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, maxLength);
}

/**
 * Validates enquiry payload consistently on both client and server.
 * Returns { isValid, errors, sanitized }.
 */
export function validateEnquiryPayload(payload = {}) {
  const errors = {};

  const enquiryType = sanitizeText(payload.enquiryType, 40);
  if (!ENQUIRY_TYPES.includes(enquiryType)) {
    errors.enquiryType = 'Please select whether you are looking for a New Loan or an Existing Loan.';
  }

  const fullName = sanitizeText(payload.fullName, 100);
  if (fullName.length < 2) {
    errors.fullName = 'Please enter your full name (at least 2 characters).';
  } else if (!/^[\p{L}\p{M} .'-]+$/u.test(fullName)) {
    errors.fullName = 'Please enter a valid name using letters and standard punctuation.';
  }

  const rawPhone = sanitizeText(payload.phone, 24);
  const normalizedPhone = normalizeIndianPhone(rawPhone);
  if (!normalizedPhone) {
    errors.phone = 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.';
  }

  const city = sanitizeText(payload.city, 80);
  if (city.length < 2) {
    errors.city = 'Please enter your city or town.';
  }

  const gender = sanitizeText(payload.gender, 40);
  if (!GENDER_OPTIONS.includes(gender)) {
    errors.gender = 'Please select a gender option.';
  }

  const employmentType = sanitizeText(payload.employmentType, 40);
  if (!EMPLOYMENT_TYPES.includes(employmentType)) {
    errors.employmentType = 'Please select your employment type.';
  }

  const consent = Boolean(payload.consent);
  if (!consent) {
    errors.consent = 'Please accept the Privacy Policy consent to submit your enquiry.';
  }

  const notes = sanitizeText(payload.notes || '', 300);

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized: {
      enquiryType,
      fullName,
      phone: normalizedPhone ? formatIndianPhone(normalizedPhone) : '',
      normalizedPhone,
      city,
      gender,
      employmentType,
      consent,
      notes,
    },
  };
}
