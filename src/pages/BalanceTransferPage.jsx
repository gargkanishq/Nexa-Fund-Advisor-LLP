import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  ChevronDown,
  FileText,
} from 'lucide-react';
import PageHead from '../components/PageHead';
import BalanceTransferCalculatorWidget from '../components/BalanceTransferCalculatorWidget';
import { useEnquiryModal } from '../context/EnquiryModalContext';

const BT_FAQS = [
  {
    q: 'What is a Home Loan Balance Transfer?',
    a: 'It means transferring your remaining home loan principal from your current bank to another bank offering more favourable repayment terms.',
  },
  {
    q: 'Does transferring a home loan always save money?',
    a: 'No. Net savings depend on rate difference, outstanding principal, remaining tenure, and applicable transfer costs (processing, legal, and valuation fees).',
  },
  {
    q: 'Why does remaining tenure matter?',
    a: 'Interest is highest during earlier loan years. If very few years remain, transfer fees may outweigh the interest reduction.',
  },
  {
    q: 'Does Nexa guarantee transfer approval?',
    a: 'No. Approval and final terms depend strictly on the new bank’s credit, income, and property verification.',
  },
  {
    q: 'Is there a fee to evaluate my existing home loan?',
    a: 'No. Preliminary home loan balance transfer consultations and savings estimates are free.',
  },
  {
    q: 'Do you charge any fees?',
    a: 'We do not charge any fee from customers for Home Loans and Car Loans. For other loan segments, a nominal service fee may apply.',
  },
];

export default function BalanceTransferPage() {
  const { openEnquiryModal } = useEnquiryModal();
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <>
      <PageHead
        title="Home Loan Balance Transfer Delhi | Check Potential Interest Savings"
        description="Compare your existing home loan interest rate with alternative options using our live Home Loan Balance Transfer Calculator."
        path="/home-loan-balance-transfer"
      />

      <section className="page-banner">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <span>Home Loan Balance Transfer</span>
          </nav>
          <h1>Your Home Loan Could Be Costing You More Than It Should.</h1>
          <p className="lead-text" style={{ marginBottom: '22px' }}>
            Check whether transferring your existing home loan to another lender could reduce your interest burden.
          </p>
          <a href="#bt-calculator" className="btn btn-gold">
            <Calculator size={17} />
            Calculate Potential Savings
          </a>
        </div>
      </section>

      <section className="section">
        <div className="container grid-2" style={{ alignItems: 'start' }}>
          <div>
            <div className="eyebrow eyebrow-navy">How It Works</div>
            <h2>Why Rate Spread, Tenure &amp; Costs Matter</h2>
            <p style={{ color: 'var(--muted)' }}>
              For example, on an outstanding loan of <strong>₹10,00,000</strong> at <strong>9.5%</strong> compared against <strong>8.5%</strong>, lowering the rate can reduce total interest—provided your remaining tenure is sufficient and transfer costs do not erase the benefit.
            </p>
          </div>

          <div className="card" style={{ background: 'var(--bg-ivory)' }}>
            <ul className="check-list" style={{ margin: 0 }}>
              <li><CheckCircle2 size={17} /><span><strong>Rate Difference:</strong> Lower annual rate reduces interest outgo</span></li>
              <li><CheckCircle2 size={17} /><span><strong>Remaining Tenure:</strong> Longer remaining term increases savings impact</span></li>
              <li><CheckCircle2 size={17} /><span><strong>Net Savings:</strong> Always subtract processing, legal &amp; valuation fees</span></li>
            </ul>
          </div>
        </div>
      </section>

      <section id="bt-calculator" className="section section-tint" aria-labelledby="bt-calc-title">
        <div className="container">
          <div className="section-header" style={{ marginBottom: '24px' }}>
            <div className="eyebrow eyebrow-navy">Interactive Calculator</div>
            <h2 id="bt-calc-title" style={{ marginBottom: 0 }}>
              Home Loan Balance Transfer Calculator
            </h2>
          </div>

          <BalanceTransferCalculatorWidget compactHeading />
        </div>
      </section>

      <section className="section">
        <div className="container grid-2">
          <div className="card">
            <FileText size={22} style={{ color: 'var(--gold)', marginBottom: '10px' }} />
            <h3>Documents Generally Required</h3>
            <ul className="check-list" style={{ margin: 0 }}>
              <li><CheckCircle2 size={16} /><span>KYC (PAN, Aadhaar) &amp; income proofs (Salary slips / ITRs)</span></li>
              <li><CheckCircle2 size={16} /><span>Bank statements showing EMI history</span></li>
              <li><CheckCircle2 size={16} /><span>Sanction letter, foreclosure quote &amp; List of Documents (LOD)</span></li>
              <li><CheckCircle2 size={16} /><span>Property title chain copies</span></li>
            </ul>
          </div>

          <div className="card" style={{ background: 'var(--navy)', color: 'var(--white)', justifyContent: 'center' }}>
            <h3 style={{ color: 'var(--white)' }}>Free Balance Transfer Evaluation</h3>
            <p style={{ color: '#D2DEEB' }}>
              Get a clear side-by-side comparison and assistance across empanelled PSU banks.
            </p>
            <div>
              <button
                type="button"
                className="btn btn-gold"
                onClick={() =>
                  openEnquiryModal('Home Loan Balance Transfer Assistance', 'Existing Loan')
                }
              >
                Request Free Review
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="bt-faq-heading">
        <div className="container" style={{ maxWidth: '860px' }}>
          <h2 id="bt-faq-heading" style={{ marginBottom: '20px' }}>Frequently Asked Questions</h2>
          <div className="faq-list">
            {BT_FAQS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={item.q} className="faq-item">
                  <button
                    type="button"
                    className="faq-trigger"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      size={18}
                      style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.18s ease',
                        flexShrink: 0,
                      }}
                    />
                  </button>
                  {isOpen && <div className="faq-answer">{item.a}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
