import { useState } from 'react';
import { RotateCcw, ArrowRight } from 'lucide-react';
import { calculateLoanAffordability, formatINR } from '../utils/loanCalculators';
import { useEnquiryModal } from '../context/EnquiryModalContext';

const INITIAL_AFFORDABILITY = {
  monthlyIncome: 120000,
  existingEmis: 15000,
  annualRate: 8.75,
  tenureYears: 20,
  emiToIncomePercent: 50,
};

export default function AffordabilityCalculatorWidget() {
  const [inputs, setInputs] = useState(INITIAL_AFFORDABILITY);
  const { openEnquiryModal } = useEnquiryModal();
  const result = calculateLoanAffordability(inputs);

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
          <h3 style={{ margin: 0 }}>Indicative Loan Affordability Inputs</h3>
          <button
            type="button"
            className="btn btn-outline-navy btn-sm"
            onClick={() => setInputs(INITIAL_AFFORDABILITY)}
          >
            <RotateCcw size={15} />
            Reset
          </button>
        </div>

        <div className="calc-field">
          <div className="calc-label-row">
            <label htmlFor="aff-income">Net Monthly Income (₹)</label>
            <span className="calc-value-chip tabular-nums">
              {formatINR(inputs.monthlyIncome || 0)}
            </span>
          </div>
          <input
            id="aff-income"
            type="number"
            min="10000"
            max="5000000"
            step="5000"
            className="calc-input tabular-nums"
            value={inputs.monthlyIncome}
            onChange={(e) => updateField('monthlyIncome', e.target.value)}
          />
        </div>

        <div className="calc-field">
          <div className="calc-label-row">
            <label htmlFor="aff-existing">Existing Monthly EMIs (₹)</label>
            <span className="calc-value-chip tabular-nums">
              {formatINR(inputs.existingEmis || 0)}
            </span>
          </div>
          <input
            id="aff-existing"
            type="number"
            min="0"
            max="2000000"
            step="1000"
            className="calc-input tabular-nums"
            value={inputs.existingEmis}
            onChange={(e) => updateField('existingEmis', e.target.value)}
          />
        </div>

        <div className="calc-field">
          <div className="calc-label-row">
            <label htmlFor="aff-ratio">Indicative EMI-to-Income Percentage (%)</label>
            <span className="calc-value-chip tabular-nums">{inputs.emiToIncomePercent || 0}%</span>
          </div>
          <input
            id="aff-ratio"
            type="number"
            min="10"
            max="80"
            step="1"
            className="calc-input tabular-nums"
            value={inputs.emiToIncomePercent}
            onChange={(e) => updateField('emiToIncomePercent', e.target.value)}
          />
          <input
            type="range"
            min="20"
            max="70"
            step="1"
            aria-label="Indicative EMI to Income Percentage Slider"
            className="calc-range"
            value={Math.min(70, Math.max(20, Number(inputs.emiToIncomePercent) || 50))}
            onChange={(e) => updateField('emiToIncomePercent', e.target.value)}
          />
        </div>

        <div className="form-grid-2">
          <div className="calc-field" style={{ marginBottom: 0 }}>
            <div className="calc-label-row">
              <label htmlFor="aff-rate">Proposed Interest Rate (%)</label>
            </div>
            <input
              id="aff-rate"
              type="number"
              min="0"
              max="35"
              step="0.05"
              className="calc-input tabular-nums"
              value={inputs.annualRate}
              onChange={(e) => updateField('annualRate', e.target.value)}
            />
          </div>

          <div className="calc-field" style={{ marginBottom: 0 }}>
            <div className="calc-label-row">
              <label htmlFor="aff-tenure">Proposed Tenure (Years)</label>
            </div>
            <input
              id="aff-tenure"
              type="number"
              min="1"
              max="30"
              step="1"
              className="calc-input tabular-nums"
              value={inputs.tenureYears}
              onChange={(e) => updateField('tenureYears', e.target.value)}
            />
          </div>
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
              <span>Indicative Affordable Loan Amount</span>
              <strong className="tabular-nums">
                {formatINR(Math.round(result.affordableLoanAmount))}
              </strong>
              {result.availableEmiCapacity <= 0 && (
                <p style={{ margin: '8px 0 0', fontSize: '0.86rem', color: '#FDE68A' }}>
                  Existing EMIs equal or exceed your selected EMI-to-income limit ({result.emiToIncomePercent}%). Increase income, adjust the ratio, or reduce existing obligations.
                </p>
              )}
            </div>

            <div className="calc-metrics-grid">
              <div className="calc-metric-box">
                <span>Estimated Available EMI Capacity</span>
                <strong className="tabular-nums" style={{ color: 'var(--gold-light)' }}>
                  {formatINR(Math.round(result.availableEmiCapacity))} / mo
                </strong>
              </div>
              <div className="calc-metric-box">
                <span>Max Total EMI Allocation ({result.emiToIncomePercent}%)</span>
                <strong className="tabular-nums">
                  {formatINR(Math.round(result.maxTotalEmiCapacity))} / mo
                </strong>
              </div>
              <div className="calc-metric-box">
                <span>Estimated Total Repayment</span>
                <strong className="tabular-nums">
                  {formatINR(Math.round(result.totalEstimatedRepayment))}
                </strong>
              </div>
              <div className="calc-metric-box">
                <span>Estimated Interest Component</span>
                <strong className="tabular-nums">
                  {formatINR(Math.round(result.totalEstimatedInterest))}
                </strong>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-gold"
              style={{ width: '100%' }}
              onClick={() =>
                openEnquiryModal(
                  `Loan Affordability Estimate (Income: ${formatINR(result.monthlyIncome)}/mo, Indicative Loan: ${formatINR(Math.round(result.affordableLoanAmount))})`,
                  'New Loan'
                )
              }
            >
              Get a Personalised Borrowing Assessment
              <ArrowRight size={17} />
            </button>

            <p className="calc-disclaimer">
              Important Notice: This tool provides an indicative financial planning estimate only—it is NOT a lender eligibility decision, credit score check, or loan approval prediction. Banks assess eligibility using internal FOIR norms, credit history, employment stability, age, and property valuation.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
