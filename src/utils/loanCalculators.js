/**
 * Pure reducing-balance financial calculation utilities for Nexa Fund Advisor LLP.
 * All monetary figures are in INR (₹) and rates are annual percentages (% p.a.).
 */

export function formatINR(value, { decimals = 0 } = {}) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '₹0';
  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(num);
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(abs);
  return `${sign}${formatted}`;
}

export function formatIndianNumber(value, decimals = 0) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Standard reducing-balance EMI calculator.
 * Handles zero interest rate (r = 0) and rejects invalid/negative inputs cleanly.
 */
export function calculateEMI({ principal, annualRate, tenureYears }) {
  const P = Number(principal);
  const rAnnual = Number(annualRate);
  const years = Number(tenureYears);

  if (!Number.isFinite(P) || P <= 0) {
    return { valid: false, error: 'Please enter a loan amount greater than ₹0.' };
  }
  if (!Number.isFinite(rAnnual) || rAnnual < 0 || rAnnual > 60) {
    return { valid: false, error: 'Please enter a valid annual interest rate between 0% and 60%.' };
  }
  if (!Number.isFinite(years) || years <= 0 || years > 40) {
    return { valid: false, error: 'Please enter a valid loan tenure between 0.5 and 40 years.' };
  }

  const months = Math.max(1, Math.round(years * 12));
  const monthlyRate = rAnnual / 12 / 100;

  let emi;
  if (monthlyRate === 0) {
    emi = P / months;
  } else {
    const factor = Math.pow(1 + monthlyRate, months);
    emi = (P * monthlyRate * factor) / (factor - 1);
  }

  const totalRepayment = emi * months;
  const totalInterest = Math.max(0, totalRepayment - P);
  const principalRatio = totalRepayment > 0 ? (P / totalRepayment) * 100 : 100;
  const interestRatio = totalRepayment > 0 ? (totalInterest / totalRepayment) * 100 : 0;

  return {
    valid: true,
    principal: P,
    annualRate: rAnnual,
    tenureYears: years,
    months,
    emi,
    totalRepayment,
    totalInterest,
    principalRatio,
    interestRatio,
  };
}

/**
 * Home Loan Balance Transfer Calculator.
 * Compares existing loan vs proposed alternative over the same remaining tenure.
 * Clearly separates gross interest savings from net savings after transfer costs.
 */
export function calculateBalanceTransfer({
  principal,
  currentRate,
  tenureYears,
  newRate,
  transferCosts = 0,
}) {
  const P = Number(principal);
  const currR = Number(currentRate);
  const propR = Number(newRate);
  const years = Number(tenureYears);
  const costs = Number(transferCosts || 0);

  if (!Number.isFinite(P) || P <= 0) {
    return { valid: false, error: 'Please enter an outstanding principal greater than ₹0.' };
  }
  if (!Number.isFinite(currR) || currR < 0 || currR > 60) {
    return { valid: false, error: 'Please enter a valid current annual interest rate (0% – 60%).' };
  }
  if (!Number.isFinite(propR) || propR < 0 || propR > 60) {
    return { valid: false, error: 'Please enter a valid proposed annual interest rate (0% – 60%).' };
  }
  if (!Number.isFinite(years) || years <= 0 || years > 40) {
    return { valid: false, error: 'Please enter a valid remaining tenure (0.5 – 40 years).' };
  }
  if (!Number.isFinite(costs) || costs < 0) {
    return { valid: false, error: 'Transfer and processing costs cannot be negative.' };
  }

  const current = calculateEMI({ principal: P, annualRate: currR, tenureYears: years });
  const proposed = calculateEMI({ principal: P, annualRate: propR, tenureYears: years });

  if (!current.valid) return current;
  if (!proposed.valid) return proposed;

  const monthlyEmiDifference = current.emi - proposed.emi;
  const grossInterestSavings = current.totalInterest - proposed.totalInterest;
  const netEstimatedSavings = grossInterestSavings - costs;

  return {
    valid: true,
    principal: P,
    tenureYears: years,
    months: current.months,
    transferCosts: costs,
    current,
    proposed,
    monthlyEmiDifference,
    grossInterestSavings,
    netEstimatedSavings,
    isFinanciallyBeneficial: netEstimatedSavings > 0,
  };
}

/**
 * Indicative Loan Affordability Calculator.
 * Estimates affordable principal based on monthly income, existing EMIs,
 * user-adjustable EMI-to-income percentage, proposed interest rate, and tenure.
 */
export function calculateLoanAffordability({
  monthlyIncome,
  existingEmis = 0,
  annualRate,
  tenureYears,
  emiToIncomePercent = 50,
}) {
  const income = Number(monthlyIncome);
  const existing = Number(existingEmis || 0);
  const rAnnual = Number(annualRate);
  const years = Number(tenureYears);
  const ratio = Number(emiToIncomePercent);

  if (!Number.isFinite(income) || income <= 0) {
    return { valid: false, error: 'Please enter a monthly income greater than ₹0.' };
  }
  if (!Number.isFinite(existing) || existing < 0) {
    return { valid: false, error: 'Existing monthly EMIs cannot be negative.' };
  }
  if (!Number.isFinite(ratio) || ratio < 10 || ratio > 80) {
    return { valid: false, error: 'Indicative EMI-to-income percentage must be between 10% and 80%.' };
  }
  if (!Number.isFinite(rAnnual) || rAnnual < 0 || rAnnual > 60) {
    return { valid: false, error: 'Please enter a valid proposed interest rate (0% – 60%).' };
  }
  if (!Number.isFinite(years) || years <= 0 || years > 40) {
    return { valid: false, error: 'Please enter a valid loan tenure (0.5 – 40 years).' };
  }

  const maxTotalEmiCapacity = income * (ratio / 100);
  const availableEmiCapacity = Math.max(0, maxTotalEmiCapacity - existing);
  const months = Math.max(1, Math.round(years * 12));
  const monthlyRate = rAnnual / 12 / 100;

  let affordableLoanAmount = 0;
  if (availableEmiCapacity > 0) {
    if (monthlyRate === 0) {
      affordableLoanAmount = availableEmiCapacity * months;
    } else {
      const factor = Math.pow(1 + monthlyRate, months);
      affordableLoanAmount = availableEmiCapacity * ((factor - 1) / (monthlyRate * factor));
    }
  }

  const totalEstimatedRepayment = availableEmiCapacity * months;
  const totalEstimatedInterest = Math.max(0, totalEstimatedRepayment - affordableLoanAmount);

  return {
    valid: true,
    monthlyIncome: income,
    existingEmis: existing,
    emiToIncomePercent: ratio,
    maxTotalEmiCapacity,
    availableEmiCapacity,
    affordableLoanAmount,
    totalEstimatedRepayment,
    totalEstimatedInterest,
    months,
  };
}
