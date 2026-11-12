import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBalanceTransfer,
  calculateEMI,
  calculateLoanAffordability,
  formatINR,
} from '../src/utils/loanCalculators.js';
import {
  isValidIndianPhone,
  normalizeIndianPhone,
  validateEnquiryPayload,
} from '../shared/validation.js';

test('formatINR formats Indian lakh and crore amounts accurately', () => {
  assert.equal(formatINR(1000000), '₹10,00,000');
  assert.equal(formatINR(-25000), '-₹25,000');
  assert.equal(formatINR(0), '₹0');
});

test('calculateEMI computes accurate reducing-balance EMI and zero-interest edge case', () => {
  const standard = calculateEMI({ principal: 1000000, annualRate: 9.5, tenureYears: 15 });
  assert.equal(standard.valid, true);
  assert.equal(standard.months, 180);
  // 10,00,000 at 9.5% for 180 months = ~10,442.25/mo
  assert.ok(Math.abs(standard.emi - 10442.25) < 0.25);
  assert.ok(standard.totalInterest > 879000);

  const zeroRate = calculateEMI({ principal: 120000, annualRate: 0, tenureYears: 1 });
  assert.equal(zeroRate.valid, true);
  assert.equal(zeroRate.emi, 10000);
  assert.equal(zeroRate.totalInterest, 0);
  assert.equal(zeroRate.totalRepayment, 120000);
});

test('calculateEMI rejects invalid inputs cleanly', () => {
  assert.equal(calculateEMI({ principal: 0, annualRate: 8.5, tenureYears: 10 }).valid, false);
  assert.equal(calculateEMI({ principal: 500000, annualRate: -1, tenureYears: 10 }).valid, false);
  assert.equal(calculateEMI({ principal: 500000, annualRate: 8.5, tenureYears: 0 }).valid, false);
});

test('calculateBalanceTransfer distinguishes gross savings vs net savings after costs', () => {
  const res = calculateBalanceTransfer({
    principal: 1000000,
    currentRate: 9.5,
    tenureYears: 15,
    newRate: 8.5,
    transferCosts: 15000,
  });

  assert.equal(res.valid, true);
  assert.ok(res.monthlyEmiDifference > 550);
  assert.ok(res.grossInterestSavings > 100000);
  assert.equal(
    Math.round(res.netEstimatedSavings),
    Math.round(res.grossInterestSavings - 15000)
  );
  assert.equal(res.isFinanciallyBeneficial, true);

  const costlyTransfer = calculateBalanceTransfer({
    principal: 200000,
    currentRate: 8.75,
    tenureYears: 1,
    newRate: 8.5,
    transferCosts: 10000,
  });
  assert.equal(costlyTransfer.valid, true);
  assert.equal(costlyTransfer.isFinanciallyBeneficial, false);
});

test('calculateLoanAffordability handles EMI-to-income ratio and high existing EMIs', () => {
  const res = calculateLoanAffordability({
    monthlyIncome: 100000,
    existingEmis: 10000,
    annualRate: 9,
    tenureYears: 20,
    emiToIncomePercent: 50,
  });
  assert.equal(res.valid, true);
  assert.equal(res.maxTotalEmiCapacity, 50000);
  assert.equal(res.availableEmiCapacity, 40000);
  assert.ok(res.affordableLoanAmount > 4400000 && res.affordableLoanAmount < 4500000);

  const maxedOut = calculateLoanAffordability({
    monthlyIncome: 50000,
    existingEmis: 30000,
    annualRate: 9,
    tenureYears: 15,
    emiToIncomePercent: 50,
  });
  assert.equal(maxedOut.valid, true);
  assert.equal(maxedOut.availableEmiCapacity, 0);
  assert.equal(maxedOut.affordableLoanAmount, 0);
});

test('Indian mobile phone normalization and enquiry validation work consistently', () => {
  assert.equal(normalizeIndianPhone('+91 98914 43855'), '9891443855');
  assert.equal(normalizeIndianPhone('098914-43855'), '9891443855');
  assert.equal(isValidIndianPhone('5891443855'), false);

  const invalid = validateEnquiryPayload({
    enquiryType: 'New Loan',
    fullName: 'A',
    phone: '12345',
    city: '',
    gender: 'Invalid',
    employmentType: 'Salaried',
    consent: false,
  });
  assert.equal(invalid.isValid, false);
  assert.ok(invalid.errors.fullName);
  assert.ok(invalid.errors.phone);
  assert.ok(invalid.errors.city);
  assert.ok(invalid.errors.gender);
  assert.ok(invalid.errors.consent);

  const valid = validateEnquiryPayload({
    enquiryType: 'Existing Loan',
    fullName: 'Rohan Malhotra',
    phone: '+91 98914 43855',
    city: 'Delhi',
    gender: 'Male',
    employmentType: 'Salaried',
    consent: true,
  });
  assert.equal(valid.isValid, true);
  assert.equal(valid.sanitized.phone, '+91 98914 43855');
});
