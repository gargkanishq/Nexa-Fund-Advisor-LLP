import { useState } from 'react';
import { RotateCcw, ArrowRight } from 'lucide-react';
import { calculateBalanceTransfer, formatINR } from '../utils/loanCalculators';
import { useEnquiryModal } from '../context/EnquiryModalContext';

const INITIAL_STATE = {
  principal: 1000000,
  currentRate: 9.5,
  tenureYears: 15,
  newRate: 8.5,
  transferCosts: 10000,
};

export default function BalanceTransferCalculatorWidget({ compactHeading = false }) {
  const [inputs, setInputs] = useState(INITIAL_STATE);
  const { openEnquiryModal } = useEnquiryModal();

  const result = calculateBalanceTransfer(inputs);

  function updateField(key, rawValue) {
    const val = rawValue === '' ? '' : Number(rawValue);
    setInputs((prev) => ({ ...prev, [key]: val }));
  }

  function handleReset() {
    setInputs(INITIAL_STATE);
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
          {compactHeading ? (
            <h3 style={{ margin: 0 }}>Home Loan Balance Transfer Inputs</h3>
          ) : (
            <h2 style={{ margin: 0, fontSize: '1.45rem' }}>Compare Your Existing Home Loan</h2>
          )}
          <button
            type="button"
            className="btn btn-outline-navy btn-sm"
            onClick={handleReset}
          >
            <RotateCcw size={15} />
            Reset
          </button>
        </div>

        <div className="calc-field">
          <div className="calc-label-row">
            <label htmlFor="bt-principal">Outstanding Loan Principal (₹)</label>
            <span className="calc-value-chip tabular-nums">
              {formatINR(inputs.principal || 0)}
            </span>
          </div>
          <input
            id="bt-principal"
            type="number"
            min="50000"
            max="100000000"
            step="50000"
            className="calc-input tabular-nums"
            value={inputs.principal}
            onChange={(e) => updateField('principal', e.target.value)}
          />
          <input
            type="range"
            min="200000"
            max="20000000"
            step="100000"
            aria-label="Outstanding Loan Principal Slider"
            className="calc-range"
            value={Math.min(20000000, Math.max(200000, Number(inputs.principal) || 200000))}
            onChange={(e) => updateField('principal', e.target.value)}
          />
        </div>

        <div className="form-grid-2">
          <div className="calc-field">
            <div className="calc-label-row">
              <label htmlFor="bt-current-rate">Current Annual Rate (%)</label>
            </div>
            <input
              id="bt-current-rate"
              type="number"
              min="0"
              max="35"
              step="0.05"
              className="calc-input tabular-nums"
              value={inputs.currentRate}
              onChange={(e) => updateField('currentRate', e.target.value)}
            />
          </div>

          <div className="calc-field">
            <div className="calc-label-row">
              <label htmlFor="bt-new-rate">Proposed New Rate (%)</label>
            </div>
            <input
              id="bt-new-rate"
              type="number"
              min="0"
              max="35"
              step="0.05"
              className="calc-input tabular-nums"
              value={inputs.newRate}
              onChange={(e) => updateField('newRate', e.target.value)}
            />
          </div>
        </div>

        <div className="calc-field">
          <div className="calc-label-row">
            <label htmlFor="bt-tenure">Remaining Tenure (Years)</label>
            <span className="calc-value-chip tabular-nums">{inputs.tenureYears || 0} yrs</span>
          </div>
          <input
            id="bt-tenure"
            type="number"
            min="0.5"
            max="30"
            step="0.5"
            className="calc-input tabular-nums"
            value={inputs.tenureYears}
            onChange={(e) => updateField('tenureYears', e.target.value)}
          />
          <input
            type="range"
            min="1"
            max="30"
            step="1"
            aria-label="Remaining Tenure Slider"
            className="calc-range"
            value={Math.min(30, Math.max(1, Number(inputs.tenureYears) || 1))}
            onChange={(e) => updateField('tenureYears', e.target.value)}
          />
        </div>

        <div className="calc-field" style={{ marginBottom: 0 }}>
          <div className="calc-label-row">
            <label htmlFor="bt-costs">Estimated Transfer &amp; Processing Costs (₹)</label>
            <span className="calc-value-chip tabular-nums">
              {formatINR(inputs.transferCosts || 0)}
            </span>
          </div>
          <input
            id="bt-costs"
            type="number"
            min="0"
            max="5000000"
            step="1000"
            className="calc-input tabular-nums"
            value={inputs.transferCosts}
            onChange={(e) => updateField('transferCosts', e.target.value)}
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
              <span>Net Estimated Savings (After Transfer Costs)</span>
              <strong className="tabular-nums">
                {formatINR(Math.round(result.netEstimatedSavings))}
              </strong>
              <p
                style={{
                  margin: '8px 0 0',
                  fontSize: '0.86rem',
                  color: result.isFinanciallyBeneficial ? '#BCEFD0' : '#FDE68A',
                }}
              >
                {result.isFinanciallyBeneficial
                  ? `Gross interest reduction of ${formatINR(Math.round(result.grossInterestSavings))} minus ${formatINR(Math.round(result.transferCosts))} estimated costs over ${result.months} months.`
                  : 'At these inputs, transfer costs meet or exceed gross interest savings. A transfer may not be financially beneficial.'}
              </p>
            </div>

            <div className="calc-metrics-grid">
              <div className="calc-metric-box">
                <span>Current Monthly EMI</span>
                <strong className="tabular-nums">{formatINR(Math.round(result.current.emi))}</strong>
              </div>
              <div className="calc-metric-box">
                <span>Proposed Monthly EMI</span>
                <strong className="tabular-nums">{formatINR(Math.round(result.proposed.emi))}</strong>
              </div>
              <div className="calc-metric-box">
                <span>Monthly EMI Difference</span>
                <strong className="tabular-nums" style={{ color: 'var(--gold-light)' }}>
                  {result.monthlyEmiDifference >= 0 ? 'Save ' : '+'}
                  {formatINR(Math.round(Math.abs(result.monthlyEmiDifference)))} / mo
                </strong>
              </div>
              <div className="calc-metric-box">
                <span>Gross Interest Savings</span>
                <strong className="tabular-nums">
                  {formatINR(Math.round(result.grossInterestSavings))}
                </strong>
              </div>
              <div className="calc-metric-box">
                <span>Current Remaining Interest</span>
                <strong className="tabular-nums">
                  {formatINR(Math.round(result.current.totalInterest))}
                </strong>
              </div>
              <div className="calc-metric-box">
                <span>Proposed Remaining Interest</span>
                <strong className="tabular-nums">
                  {formatINR(Math.round(result.proposed.totalInterest))}
                </strong>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-gold"
              style={{ width: '100%' }}
              onClick={() =>
                openEnquiryModal(
                  `Balance Transfer Estimate (Principal: ${formatINR(result.principal)}, ${inputs.currentRate}% -> ${inputs.newRate}%)`,
                  'Existing Loan'
                )
              }
            >
              Discuss This Estimate With Nexa
              <ArrowRight size={17} />
            </button>

            <p className="calc-disclaimer">
              Disclaimer: Calculations assume reducing-balance monthly compounding over the same remaining tenure ({result.months} months). These figures are illustrative estimates only; actual interest rates, eligible transfer amount, and processing/legal charges depend strictly on lender terms and borrower eligibility.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
