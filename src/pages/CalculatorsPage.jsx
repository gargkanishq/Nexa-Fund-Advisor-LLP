import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PageHead from '../components/PageHead';
import EmiCalculatorWidget from '../components/EmiCalculatorWidget';
import BalanceTransferCalculatorWidget from '../components/BalanceTransferCalculatorWidget';
import AffordabilityCalculatorWidget from '../components/AffordabilityCalculatorWidget';

const TABS = [
  { id: 'home-loan-emi', label: '1. Home Loan EMI' },
  { id: 'balance-transfer', label: '2. Home Loan Balance Transfer' },
  { id: 'personal-loan-emi', label: '3. Personal Loan EMI' },
  { id: 'affordability', label: '4. Loan Affordability' },
];

export default function CalculatorsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    TABS.some((t) => t.id === initialTab) ? initialTab : 'home-loan-emi'
  );

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && TABS.some((item) => item.id === t)) {
      setActiveTab(t);
    }
  }, [searchParams]);

  function selectTab(id) {
    setActiveTab(id);
    setSearchParams({ tab: id }, { replace: true });
  }

  return (
    <>
      <PageHead
        title="Home Loan EMI, Balance Transfer & Affordability Calculators"
        description="Use Nexa Fund Advisor LLP's interactive Indian Rupee financial calculators: Home Loan EMI, Home Loan Balance Transfer, Personal Loan EMI, and Loan Affordability."
        path="/calculators"
      />

      <section className="page-banner">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <span>Calculators</span>
          </nav>
          <h1>Financial &amp; Loan Planning Calculators</h1>
          <p className="lead-text">
            Accurate reducing-balance EMI, home loan balance transfer savings, and indicative affordability calculators designed in Indian Rupees (₹) to support informed planning.
          </p>
        </div>
      </section>

      <section className="section section-ivory">
        <div className="container">
          <div className="calc-tabs" role="tablist" aria-label="Financial Calculators">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`calc-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => selectTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div role="tabpanel">
            {activeTab === 'home-loan-emi' && (
              <EmiCalculatorWidget
                key="home-loan-emi"
                title="Home Loan EMI Calculator"
                defaultPrincipal={4000000}
                defaultRate={8.65}
                defaultTenure={20}
                maxPrincipal={100000000}
                maxTenure={30}
                enquiryContextLabel="Home Loan EMI Calculator"
              />
            )}

            {activeTab === 'balance-transfer' && (
              <BalanceTransferCalculatorWidget compactHeading />
            )}

            {activeTab === 'personal-loan-emi' && (
              <EmiCalculatorWidget
                key="personal-loan-emi"
                title="Personal Loan EMI Calculator"
                defaultPrincipal={500000}
                defaultRate={11.5}
                defaultTenure={4}
                maxPrincipal={10000000}
                maxTenure={7}
                enquiryContextLabel="Personal Loan EMI Calculator"
              />
            )}

            {activeTab === 'affordability' && <AffordabilityCalculatorWidget />}
          </div>
        </div>
      </section>
    </>
  );
}
