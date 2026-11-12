import { Link } from 'react-router-dom';
import PageHead from '../components/PageHead';
import { COMPANY } from '../data/siteContent';

const LEGAL_CONTENT = {
  privacy: {
    title: 'Privacy Policy',
    path: '/privacy-policy',
    description:
      'Privacy Policy explaining how Nexa Fund Advisor LLP collects, stores, and uses enquiry contact details with customer consent.',
    heading: 'Privacy Policy',
    updated: 'Effective Date: November 2026',
    sections: [
      {
        title: '1. Information We Collect',
        body: [
          'When you submit an enquiry through our website popup or enquiry page, we collect only the details necessary to understand your preliminary loan assistance request: your Enquiry Type (New Loan or Existing Loan), Full Name, Phone Number, City, Gender, Employment Type, and enquiry timestamp.',
          'We deliberately do not request sensitive financial credentials, bank account passwords, card numbers, Aadhaar/PAN document uploads, or OTPs through our initial website enquiry form.',
        ],
      },
      {
        title: '2. How We Use Your Information',
        body: [
          'Your submitted details are used strictly to respond to your enquiry, prepare preliminary estimates, discuss suitable loan options, and facilitate requested loan-related services with your explicit consent and knowledge.',
          'We do NOT sell, rent, or trade your personal contact information to third-party data brokers or unrelated marketers. Information is shared with relevant lending institutions only when you choose to proceed with a loan application and authorise us to coordinate on your behalf.',
        ],
      },
      {
        title: '3. Data Storage, Security & Consent',
        body: [
          'Enquiry records are transmitted securely to our backend server and maintained in our internal lead management database (Google Sheets accessible solely to authorised Nexa Fund Advisor LLP personnel) for tracking follow-up status.',
          'Our website uses minimal session-level browser storage (such as recording whether the automatic enquiry modal was already shown during your current browsing session) and an HttpOnly authentication cookie strictly for authorised blog administrators.',
        ],
      },
      {
        title: '4. Your Choices & Contact',
        body: [
          `You may request access to, correction of, or deletion of your enquiry contact details at any time by emailing ${COMPANY.email} or calling ${COMPANY.phoneDisplay}.`,
        ],
      },
    ],
  },
  terms: {
    title: 'Terms and Conditions',
    path: '/terms-and-conditions',
    description:
      'Terms and Conditions governing use of the Nexa Fund Advisor LLP website, financial calculators, and loan facilitation services.',
    heading: 'Terms and Conditions',
    updated: 'Effective Date: November 2026',
    sections: [
      {
        title: '1. Role of Nexa Fund Advisor LLP',
        body: [
          'Nexa Fund Advisor LLP is a loan facilitation, financial advisory, and banking assistance firm—not a bank, non-banking financial company (NBFC), or direct lender. Loan sanctions, interest rates, fees, and disbursements are decided solely by the respective lending institutions.',
          'Nexa holds official empanelment specifically for home loan services with multiple public sector banks. For other loan categories, Nexa provides loan facilitation and procedural assistance subject to suitable lender availability.',
        ],
      },
      {
        title: '2. Fees & Commercial Disclosures',
        body: [
          'Initial consultations are free; for Home Loans, Nexa receives its commission from the lending bank with no service commission charged to borrowers, while any applicable service charges for other loan categories are communicated upfront and payable only upon disbursement (lender-levied processing, legal, and valuation fees remain separate).',
        ],
      },
      {
        title: '3. Acceptable Use of Website & Calculators',
        body: [
          'Calculators and articles on this website are provided solely for educational and preliminary planning purposes. You agree not to misuse forms, submit automated spam, or attempt unauthorised access to restricted administrative endpoints.',
        ],
      },
      {
        title: '4. Governing Jurisdiction',
        body: [
          `These terms are governed by the laws of India, with primary operations headquartered at ${COMPANY.fullAddress}.`,
        ],
      },
    ],
  },
  disclaimer: {
    title: 'Financial Disclaimer',
    path: '/disclaimer',
    description:
      'Important Financial Disclaimer regarding calculators, illustrative examples, bank empanelment, and educational articles on Nexa Fund Advisor LLP.',
    heading: 'Financial Disclaimer',
    updated: 'Last Reviewed: November 2026',
    sections: [
      {
        title: '1. Calculator Results Are Indicative Estimates Only',
        body: [
          'All outputs generated by our Home Loan EMI, Home Loan Balance Transfer, Personal Loan EMI, and Loan Affordability calculators are mathematical estimates based on standard reducing-balance formulas and the numbers entered by the user.',
          'Actual EMIs, applicable interest rates, maximum eligible loan amounts, repayment tenures, and balance transfer savings depend entirely on the lending institution’s assessment, credit checks, property valuation, prevailing benchmark rates, and official sanction terms.',
        ],
      },
      {
        title: '2. No Guarantee of Approval or Savings',
        body: [
          'Nexa Fund Advisor LLP does not guarantee loan approval, balance transfer approval, specific interest rates, turnaround times, or disbursement. Illustrative examples (such as comparing 9.5% vs 8.5% on a sample loan amount) are purely mathematical demonstrations and do not constitute an offer or promised savings.',
        ],
      },
      {
        title: '3. Educational Content Notice',
        body: [
          'Articles published under Nexa Insights provide general educational awareness about retail banking procedures, documentation, and loan concepts. They do not constitute legal, tax, or binding financial commitments.',
        ],
      },
      {
        title: '4. Banking Partner Logos & Empanelment Scope',
        body: [
          'Bank names and logos appearing on the homepage reflect banking partners where Nexa holds home loan empanelment or institutional relationships. They do not imply guarantee of sanction or institutional endorsement beyond authorised facilitation relationships.',
        ],
      },
    ],
  },
};

export default function LegalPage({ type }) {
  const doc = LEGAL_CONTENT[type] || LEGAL_CONTENT.disclaimer;

  return (
    <>
      <PageHead title={doc.title} description={doc.description} path={doc.path} />

      <section className="page-banner">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <span>{doc.heading}</span>
          </nav>
          <h1>{doc.heading}</h1>
          <p className="lead-text">{doc.updated}</p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: '860px' }}>
          <div className="card" style={{ padding: '34px' }}>
            {doc.sections.map((sec) => (
              <div key={sec.title} style={{ marginBottom: '26px' }}>
                <h2 style={{ fontSize: '1.35rem', marginBottom: '10px' }}>{sec.title}</h2>
                {sec.body.map((para) => (
                  <p key={para} style={{ color: 'var(--muted)', marginBottom: '10px' }}>
                    {para}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
