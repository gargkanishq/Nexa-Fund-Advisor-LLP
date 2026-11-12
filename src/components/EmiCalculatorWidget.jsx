import { useState } from 'react';
import { RotateCcw, ArrowRight } from 'lucide-react';
import { calculateEMI, formatINR } from '../utils/loanCalculators';
import { useEnquiryModal } from '../context/EnquiryModalContext';

export default function EmiCalculatorWidget({
  title,
  defaultPrincipal,
  defaultRate,
  defaultTenure,
  maxPrincipal = 50000000,
  maxTenure = 30,
  enquiryContextLabel = 'Loan EMI Estimate',
}) {
  const initial = {
    principal: defaultPrincipal,
    annualRate: defaultRate,
    tenureYears: defaultTenure,
  };

  const [inputs, setInputs] = useState(initial);
  const { openEnquiryModal } = useEnquiryModal();
  const result = calculateEMI(inputs);

  function updateField(key, rawValue) {
    setInputs((prev) => ({
      ...prev,
      [key]: rawValue === '' ? '' : Number(rawValue),
    }));
  }

  return (
    <div className="calc-workspace">
      <div className="calc-panel">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button
            type="button"
            className="btn btn-outline-navy btn-sm"
            onClick={() => setInputs(initial)}
          >
            <RotateCcw size={15} />
            Reset
          </button>
        </div>

        <div className="calc-field">
          <div className="calc-label-row">
            <label htmlFor={`${enquiryContextLabel}-principal`}>Loan Amount (₹)</label>
            <span className="calc-value-chip tabular-nums">
              {formatINR(inputs.principal || 0)}
            </span>
          </div>
          <input
            id={`${enquiryContextLabel}-principal`}
            type="number"
            min="10000"
            max={maxPrincipal}
            step="25000"
            className="calc-input tabular-nums"
            value={inputs.principal}
            onChange={(e) => updateField('principal', e.target.value)}
          />
          <input
            type="range"
            min="50000"
            max={maxPrincipal}
            step="50000"
            aria-label={`${title} Loan Amount Slider`}
            className="calc-range"
            value={Math.min(maxPrincipal, Math.max(50000, Number(inputs.principal) || 50000))}
            onChange={(e) => updateField('principal', e.target.value)}
          />
        </div>

        <div className="calc-field">
          <div className="calc-label-row">
            <label htmlFor={`${enquiryContextLabel}-rate`}>Annual Interest Rate (%)</label>
            <span className="calc-value-chip tabular-nums">{inputs.annualRate || 0}% p.a.</span>
          </div>
          <input
            id={`${enquiryContextLabel}-rate`}
            type="number"
            min="0"
            max="45"
            step="0.05"
            className="calc-input tabular-nums"
            value={inputs.annualRate}
            onChange={(e) => updateField('annualRate', e.target.value)}
          />
          <input
            type="range"
            min="0"
            max="25"
            step="0.1"
            aria-label={`${title} Interest Rate Slider`}
            className="calc-range"
            value={Math.min(25, Math.max(0, Number(inputs.annualRate) || 0))}
            onChange={(e) => updateField('annualRate', e.target.value)}
          />
        </div>

        <div className="calc-field" style={{ marginBottom: 0 }}>
          <div className="calc-label-row">
            <label htmlFor={`${enquiryContextLabel}-tenure`}>Loan Tenure (Years)</label>
            <span className="calc-value-chip tabular-nums">{inputs.tenureYears || 0} yrs</span>
          </div>
          <input
            id={`${enquiryContextLabel}-tenure`}
            type="number"
            min="0.5"
            max={maxTenure}
            step="0.5"
            className="calc-input tabular-nums"
            value={inputs.tenureYears}
            onChange={(e) => updateField('tenureYears', e.target.value)}
          />
          <input
            type="range"
            min="1"
            max={maxTenure}
            step="1"
            aria-label={`${title} Tenure Slider`}
            className="calc-range"
            value={Math.min(maxTenure, Math.max(1, Number(inputs.tenureYears) || 1))}
            onChange={(e) => updateField('tenureYears', e.target.value)}
          />
        </div>
      </div>

      <div className="calc-results-panel" aria-live="polite">
        {!result.valid ? (
          <div className="alert alert-warning" style={{ marginBottom: 0 }}>
            <strong>Check Input Values:</strong> {result.error}
          </div>
        ) : (
          <>
            <div className="calc-kpi-primary">
              <span>Estimated Monthly EMI ({result.months} months)</span>
              <strong className="tabular-nums">{formatINR(Math.round(result.emi))}</strong>
            </div>

            <div className="calc-metrics-grid">
              <div className="calc-metric-box">
                <span>Principal Amount</span>
                <strong className="tabular-nums">{formatINR(Math.round(result.principal))}</strong>
              </div>
              <div className="calc-metric-box">
                <span>Total Interest Payable</span>
                <strong className="tabular-nums">
                  {formatINR(Math.round(result.totalInterest))}
                </strong>
              </div>
              <div className="calc-metric-box" style={{ gridColumn: '1 / -1' }}>
                <span>Total Repayment (Principal + Interest)</span>
                <strong className="tabular-nums" style={{ color: 'var(--gold-light)' }}>
                  {formatINR(Math.round(result.totalRepayment))}
                </strong>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.84rem', color: '#D2DEEB', fontWeight: 600 }}>
                Repayment Composition
              </div>
              <div className="ratio-bar" aria-hidden="true">
                <div
                  className="ratio-bar-principal"
                  style={{ width: `${result.principalRatio.toFixed(1)}%` }}
                />
                <div
                  className="ratio-bar-interest"
                  style={{ width: `${result.interestRatio.toFixed(1)}%` }}
                />
              </div>
              <div className="ratio-legend tabular-nums">
                <span>Principal: {result.principalRatio.toFixed(1)}%</span>
                <span>Interest: {result.interestRatio.toFixed(1)}%</span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-gold"
              style={{ width: '100%', marginTop: '20px' }}
              onClick={() =>
                openEnquiryModal(
                  `${enquiryContextLabel}: ${formatINR(result.principal)} for ${inputs.tenureYears} yrs at ${inputs.annualRate}%`,
                  'New Loan'
                )
              }
            >
              Enquire Now About This Estimate
              <ArrowRight size={17} />
            </button>

            <p className="calc-disclaimer">
              Estimate Notice: Standard reducing-balance calculation for planning clarity. Actual EMI, interest rates, and applicable bank charges depend on lender assessment.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
