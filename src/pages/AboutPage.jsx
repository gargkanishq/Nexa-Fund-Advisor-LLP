import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Landmark, ShieldCheck } from 'lucide-react';
import PageHead from '../components/PageHead';
import { FOUNDER } from '../data/siteContent';
import { useEnquiryModal } from '../context/EnquiryModalContext';

export default function AboutPage() {
  const { openEnquiryModal } = useEnquiryModal();

  return (
    <>
      <PageHead
        title="About Us | Mr. Gopal Arora — 38 Years in Public Sector Banking"
        description="Learn about Nexa Fund Advisor LLP and founder Mr. Gopal Arora, Former Chief Manager at UCO Bank with 38 years of public sector banking experience."
        path="/about"
      />

      <section className="page-banner">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <span>About Us</span>
          </nav>
          <h1>Experience That Understands Banking. Guidance That Understands You.</h1>
          <p className="lead-text">
            Practical banking clarity from 38 years in public sector banking, paired with transparent loan facilitation.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container grid-2" style={{ alignItems: 'start' }}>
          <div>
            <div className="eyebrow eyebrow-navy">About Nexa Fund Advisor LLP</div>
            <h2>Why Loan Facilitation Matters</h2>
            <p className="lead-text">
              Navigating documentation rules, comparing offers, and coordinating with banks takes time and clarity. Nexa acts as a structured bridge between borrowers and lenders from first consultation through disbursement.
            </p>
          </div>

          <div className="card" style={{ background: 'var(--bg-ivory)' }}>
            <div className="eyebrow eyebrow-navy">Guiding Principle</div>
            <h3 style={{ marginBottom: '12px' }}>Our Philosophy</h3>
            <blockquote
              style={{
                margin: 0,
                padding: '16px 20px',
                borderLeft: '4px solid var(--gold)',
                background: 'var(--white)',
                borderRadius: '0 8px 8px 0',
                fontStyle: 'italic',
                fontSize: '1.02rem',
                lineHeight: 1.7,
                color: 'var(--navy)',
              }}
            >
              &ldquo;Borrowing for a home or business is rarely just paperwork—it is one of a family&apos;s biggest commitments. We believe guidance should be honest before it is persuasive, clear before you sign, and steady until the day your loan is disbursed.&rdquo;
            </blockquote>
          </div>
        </div>
      </section>

      <section className="section section-ivory" aria-labelledby="founder-profile-heading">
        <div className="container founder-grid">
          <div className="founder-photo-frame">
            <img
              src={FOUNDER.photo}
              alt="Mr. Gopal Arora, Founder of Nexa Fund Advisor LLP"
            />
            <div className="founder-caption-bar">
              <strong>{FOUNDER.name}</strong>
              <span>{FOUNDER.previousDesignation} • {FOUNDER.experienceHeadline}</span>
            </div>
          </div>

          <div>
            <div className="eyebrow eyebrow-navy">Founder Profile</div>
            <h2 id="founder-profile-heading">
              Mr. Gopal Arora — Former Chief Manager, UCO Bank
            </h2>
            <p className="lead-text">
              Mr. Gopal Arora leads Nexa Fund Advisor LLP with <strong>38 years of personal experience in Public Sector Banking</strong> across retail lending, credit appraisal, and documentation workflows.
            </p>
            <ul className="check-list">
              {FOUNDER.pillars.map((pillar) => (
                <li key={pillar}>
                  <CheckCircle2 size={17} />
                  <span>{pillar}</span>
                </li>
              ))}
            </ul>
            <p style={{ margin: '12px 0 0', fontSize: '0.86rem', color: 'var(--muted)' }}>
              Note: 38 years refers to Mr. Gopal Arora&apos;s personal public sector banking career prior to founding Nexa Fund Advisor LLP.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container grid-2">
          <div className="card">
            <Landmark size={22} style={{ color: 'var(--gold)', marginBottom: '12px' }} />
            <h3>Our Approach</h3>
            <p style={{ margin: 0 }}>
              We evaluate your profile calmly, calculate realistic EMIs, check paperwork before submission, and coordinate actively with bank teams until disbursement.
            </p>
          </div>

          <div className="card">
            <ShieldCheck size={22} style={{ color: 'var(--gold)', marginBottom: '12px' }} />
            <h3>Banking Relationships</h3>
            <p style={{ margin: 0 }}>
              Officially empanelled for home loans with multiple PSU banks (SBI, IOB, Indian Bank, UCO Bank, Bank of India), with broader facilitation across other loan categories.
            </p>
          </div>
        </div>
      </section>

      <section className="section section-navy">
        <div
          className="container"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
          }}
        >
          <div>
            <h2 style={{ marginBottom: '6px' }}>Have Questions About Your Next Loan?</h2>
            <p className="lead-text" style={{ marginBottom: 0 }}>
              Speak with our team for transparent guidance and a free preliminary estimate.
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-gold"
              onClick={() => openEnquiryModal('About Us Page Enquiry')}
            >
              Enquire Now
              <ArrowRight size={17} />
            </button>
            <Link to="/contact" className="btn btn-outline-light">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
