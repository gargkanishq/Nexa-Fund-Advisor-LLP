import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, RefreshCw, AlertCircle, MessageCircle } from 'lucide-react';
import {
  EMPLOYMENT_TYPES,
  ENQUIRY_TYPES,
  GENDER_OPTIONS,
  validateEnquiryPayload,
} from '../../shared/validation';
import { COMPANY } from '../data/siteContent';

function createInitialForm(defaultLoanMode = '', contextNote = '') {
  return {
    enquiryType: ENQUIRY_TYPES.includes(defaultLoanMode) ? defaultLoanMode : '',
    fullName: '',
    phone: '',
    city: '',
    gender: '',
    employmentType: '',
    consent: false,
    notes: contextNote || '',
    website: '', // hidden honeypot field
  };
}

export default function EnquiryForm({
  contextNote = '',
  defaultLoanMode = '',
  onSuccessClose,
}) {
  const formId = useId();
  const [form, setForm] = useState(() => createInitialForm(defaultLoanMode, contextNote));
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ state: 'idle', message: '', enquiryId: '', submittedAt: '', mode: '' });
  const [clientRequestId, setClientRequestId] = useState(() =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );
  const submittingRef = useRef(false);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      enquiryType: prev.enquiryType || (ENQUIRY_TYPES.includes(defaultLoanMode) ? defaultLoanMode : ''),
      notes: contextNote || prev.notes,
    }));
  }, [contextNote, defaultLoanMode]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  async function submitForm(event) {
    if (event) event.preventDefault();
    if (submittingRef.current || status.state === 'submitting') return;

    const { isValid, errors: validationErrors, sanitized } = validateEnquiryPayload(form);
    if (!isValid) {
      setErrors(validationErrors);
      setStatus({
        state: 'validation_error',
        message: 'Please review the highlighted fields before submitting.',
        enquiryId: '',
        submittedAt: '',
        mode: '',
      });
      return;
    }

    submittingRef.current = true;
    setErrors({});
    setStatus({ state: 'submitting', message: '', enquiryId: '', submittedAt: '', mode: '' });

    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...sanitized,
          consent: form.consent,
          website: form.website,
          clientRequestId,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        if (data.errors) setErrors(data.errors);
        setStatus({
          state: 'error',
          message:
            data.message ||
            'Unable to submit right now. Your details are preserved—please click Retry or contact us on WhatsApp.',
          enquiryId: '',
          submittedAt: '',
          mode: '',
        });
        return;
      }

      setStatus({
        state: 'success',
        message:
          data.message ||
          'Thank you! Your enquiry has been recorded and our team will contact you shortly.',
        enquiryId: data.enquiryId || '',
        submittedAt: data.submittedAt || new Date().toLocaleString('en-IN'),
        mode: data.mode || '',
      });
    } catch {
      setStatus({
        state: 'error',
        message:
          'A network error interrupted submission. Your entered details have NOT been lost—please click Retry below.',
        enquiryId: '',
        submittedAt: '',
        mode: '',
      });
    } finally {
      submittingRef.current = false;
    }
  }

  function handleResetForAnother() {
    setForm(createInitialForm(defaultLoanMode, contextNote));
    setErrors({});
    setStatus({ state: 'idle', message: '', enquiryId: '', submittedAt: '', mode: '' });
    setClientRequestId(
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    );
  }

  if (status.state === 'success') {
    return (
      <div role="status" aria-live="polite">
        <div className="alert alert-success" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <CheckCircle2 size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ display: 'block', fontSize: '1.05rem', marginBottom: '6px' }}>
                Enquiry Submitted Successfully
              </strong>
              <p style={{ marginBottom: '10px' }}>{status.message}</p>
              <div style={{ fontSize: '0.86rem', display: 'grid', gap: '4px' }}>
                {status.enquiryId && (
                  <div>
                    <strong>Reference ID:</strong> {status.enquiryId}
                  </div>
                )}
                <div>
                  <strong>Enquiry Type:</strong> {form.enquiryType}
                </div>
                {status.submittedAt && (
                  <div>
                    <strong>Recorded At:</strong> {status.submittedAt}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '14px' }}>
          <a
            href={COMPANY.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-navy btn-sm"
          >
            <MessageCircle size={16} />
            Message on WhatsApp
          </a>
          <button
            type="button"
            className="btn btn-outline-navy btn-sm"
            onClick={handleResetForAnother}
          >
            Submit Another Enquiry
          </button>
          {onSuccessClose && (
            <button
              type="button"
              className="btn btn-gold btn-sm"
              onClick={onSuccessClose}
            >
              Done
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submitForm} noValidate aria-label="Loan Enquiry Form">
      {contextNote && (
        <div
          style={{
            marginBottom: '16px',
            padding: '8px 12px',
            background: 'var(--gold-soft)',
            border: '1px solid rgba(200, 163, 77, 0.45)',
            borderRadius: '6px',
            fontSize: '0.85rem',
            color: 'var(--navy)',
            fontWeight: 600,
          }}
        >
          Selected Context: {contextNote}
        </div>
      )}

      {status.state === 'error' && (
        <div className="alert alert-error" role="alert">
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ marginBottom: '10px' }}>{status.message}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-navy btn-sm"
                  onClick={() => submitForm()}
                >
                  <RefreshCw size={15} />
                  Retry Submission
                </button>
                <a
                  href={COMPANY.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-navy btn-sm"
                >
                  <MessageCircle size={15} />
                  WhatsApp {COMPANY.phoneDisplay}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prominent Two-Option Selector First: New Loan vs Existing Loan */}
      <div className="form-group">
        <label id={`${formId}-enquiry-type-label`}>
          1. How can we assist you? <span style={{ color: 'var(--danger)' }}>*</span>
        </label>
        <div
          className="enquiry-type-toggle"
          role="radiogroup"
          aria-labelledby={`${formId}-enquiry-type-label`}
        >
          <button
            type="button"
            role="radio"
            aria-checked={form.enquiryType === 'New Loan'}
            className={`enquiry-type-option ${form.enquiryType === 'New Loan' ? 'selected' : ''}`}
            onClick={() => handleChange('enquiryType', 'New Loan')}
          >
            <span>New Loan</span>
            <small>Fresh loan application &amp; bank comparison</small>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={form.enquiryType === 'Existing Loan'}
            className={`enquiry-type-option ${form.enquiryType === 'Existing Loan' ? 'selected' : ''}`}
            onClick={() => handleChange('enquiryType', 'Existing Loan')}
          >
            <span>Existing Loan</span>
            <small>Balance transfer &amp; interest review</small>
          </button>
        </div>
        {errors.enquiryType && <div className="field-error">{errors.enquiryType}</div>}
      </div>

      {/* Honeypot anti-spam field */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor={`${formId}-website`}>Leave this field blank</label>
        <input
          id={`${formId}-website`}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(e) => handleChange('website', e.target.value)}
        />
      </div>

      <div className="form-grid-2">
        <div className="form-group">
          <label htmlFor={`${formId}-fullName`}>
            Full Name <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <input
            id={`${formId}-fullName`}
            type="text"
            autoComplete="name"
            placeholder="e.g., Rajesh Sharma"
            className={`form-control ${errors.fullName ? 'has-error' : ''}`}
            value={form.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            required
          />
          {errors.fullName && <div className="field-error">{errors.fullName}</div>}
        </div>

        <div className="form-group">
          <label htmlFor={`${formId}-phone`}>
            Mobile Number (India) <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <input
            id={`${formId}-phone`}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="e.g., 98914 43855"
            className={`form-control ${errors.phone ? 'has-error' : ''}`}
            value={form.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            required
          />
          {errors.phone && <div className="field-error">{errors.phone}</div>}
        </div>
      </div>

      <div className="form-grid-2">
        <div className="form-group">
          <label htmlFor={`${formId}-city`}>
            City <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <input
            id={`${formId}-city`}
            type="text"
            autoComplete="address-level2"
            placeholder="e.g., Delhi / Ludhiana"
            className={`form-control ${errors.city ? 'has-error' : ''}`}
            value={form.city}
            onChange={(e) => handleChange('city', e.target.value)}
            required
          />
          {errors.city && <div className="field-error">{errors.city}</div>}
        </div>

        <div className="form-group">
          <label htmlFor={`${formId}-gender`}>
            Gender <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <select
            id={`${formId}-gender`}
            className={`form-control ${errors.gender ? 'has-error' : ''}`}
            value={form.gender}
            onChange={(e) => handleChange('gender', e.target.value)}
            required
          >
            <option value="">Select gender</option>
            {GENDER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.gender && <div className="field-error">{errors.gender}</div>}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor={`${formId}-employmentType`}>
          Employment Type <span style={{ color: 'var(--danger)' }}>*</span>
        </label>
        <select
          id={`${formId}-employmentType`}
          className={`form-control ${errors.employmentType ? 'has-error' : ''}`}
          value={form.employmentType}
          onChange={(e) => handleChange('employmentType', e.target.value)}
          required
        >
          <option value="">Select employment profile</option>
          {EMPLOYMENT_TYPES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {errors.employmentType && <div className="field-error">{errors.employmentType}</div>}
      </div>

      <div className="checkbox-row">
        <input
          id={`${formId}-consent`}
          type="checkbox"
          checked={form.consent}
          onChange={(e) => handleChange('consent', e.target.checked)}
        />
        <label htmlFor={`${formId}-consent`}>
          I agree to Nexa Fund Advisor LLP contacting me regarding my loan enquiry and have read the{' '}
          <Link
            to="/privacy-policy"
            onClick={() => {
              if (onSuccessClose) onSuccessClose();
            }}
            style={{ color: 'var(--navy)', fontWeight: 700 }}
          >
            Privacy Policy
          </Link>
          .
        </label>
      </div>
      {errors.consent && (
        <div className="field-error" style={{ marginTop: '-10px', marginBottom: '14px' }}>
          {errors.consent}
        </div>
      )}

      <button
        type="submit"
        className="btn btn-gold"
        style={{ width: '100%', fontSize: '1rem' }}
        disabled={status.state === 'submitting'}
      >
        {status.state === 'submitting' ? 'Submitting Enquiry...' : 'Submit Enquiry'}
      </button>

      <p
        style={{
          marginTop: '10px',
          marginBottom: 0,
          fontSize: '0.78rem',
          color: 'var(--muted)',
          textAlign: 'center',
        }}
      >
        Initial consultations and preliminary estimates are completely free. No sensitive documents required at this step.
      </p>
    </form>
  );
}
