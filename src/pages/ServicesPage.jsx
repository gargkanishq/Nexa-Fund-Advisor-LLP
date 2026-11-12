import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Info, Calculator } from 'lucide-react';
import PageHead from '../components/PageHead';
import { SERVICES } from '../data/siteContent';
import { useEnquiryModal } from '../context/EnquiryModalContext';

export default function ServicesPage() {
  const { openEnquiryModal } = useEnquiryModal();

  return (
    <>
      <PageHead
        title="Our Loan Services | Home Loans, Balance Transfers & Loan Facilitation"
        description="Explore Home Loans, Home Loan Balance Transfers, Personal Loans, Education Loans, Car Loans, Business Loans, and Loan Against Property assistance from Nexa Fund Advisor LLP."
        path="/services"
      />

      <section className="page-banner">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <span>Our Services</span>
          </nav>
          <h1>Our Loan Services</h1>
          <p className="lead-text">
            Specializing in home loans with official PSU bank empanelment, alongside structured assistance across all major borrowing needs.
          </p>
        </div>
      </section>

      <section style={{ background: 'var(--gold-soft)', borderBottom: '1px solid rgba(200, 163, 77, 0.35)', padding: '16px 0' }}>
        <div className="container" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Info size={18} style={{ color: 'var(--navy)', flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--ink)' }}>
            Officially empanelled with multiple public sector banks for <strong>Home Loans</strong>; full loan facilitation and documentation assistance for all other categories.
          </p>
        </div>
      </section>

      {/* Clean Service Listing without repeated Enquire popups on every card */}
      <section className="section">
        <div className="container" style={{ display: 'grid', gap: '20px' }}>
          {SERVICES.map((service) => (
            <article
              key={service.id}
              id={service.slug}
              className="card"
              style={{
                padding: '26px 28px',
                borderColor: service.id === 'home-loans' ? 'var(--gold)' : 'var(--line)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '10px',
                }}
              >
                <div>
                  <span
                    className={`service-card-tag ${
                      service.id === 'home-loans' || service.id === 'home-loan-balance-transfer'
                        ? 'primary'
                        : ''
                    }`}
                    style={{ marginBottom: '6px' }}
                  >
                    {service.categoryTag}
                  </span>
                  <h2 style={{ fontSize: '1.45rem', marginBottom: 0 }}>{service.title}</h2>
                </div>
                {service.id === 'home-loan-balance-transfer' && (
                  <Link to="/home-loan-balance-transfer" className="btn btn-outline-navy btn-sm">
                    <Calculator size={15} />
                    Balance Transfer Calculator
                  </Link>
                )}
              </div>

              <p style={{ color: 'var(--muted)', marginBottom: '14px' }}>{service.details}</p>

              <ul className="check-list" style={{ margin: 0 }}>
                {service.highlights.map((pt) => (
                  <li key={pt}>
                    <CheckCircle2 size={16} />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}

          {/* Other Loan Requirements */}
          <article className="card" style={{ background: 'var(--bg-tint)', padding: '26px 28px' }}>
            <h2 style={{ fontSize: '1.35rem', marginBottom: '8px' }}>Other Loan Requirements</h2>
            <p style={{ margin: 0, color: 'var(--muted)' }}>
              Looking for another type of financing? We assist across additional loan requirements subject to suitable lending options and eligibility.
            </p>
          </article>
        </div>
      </section>

      {/* Single General Enquiry CTA */}
      <section className="section section-ivory" aria-labelledby="commercial-model-heading">
        <div className="container">
          <div className="transparency-box">
            <div>
              <h2 id="commercial-model-heading" style={{ fontSize: '1.55rem', marginBottom: '6px' }}>
                Ready to Discuss Your Loan Requirement?
              </h2>
              <p style={{ margin: 0, color: 'var(--muted)' }}>
                Request a free preliminary consultation and estimate with our advisory team.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-gold"
              onClick={() => openEnquiryModal('Services Page General Enquiry')}
            >
              Enquire Now
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
