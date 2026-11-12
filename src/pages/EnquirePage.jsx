import { Link } from 'react-router-dom';
import { Phone, MessageCircle } from 'lucide-react';
import PageHead from '../components/PageHead';
import EnquiryForm from '../components/EnquiryForm';
import { COMPANY } from '../data/siteContent';

export default function EnquirePage() {
  return (
    <>
      <PageHead
        title="Enquire Now | Free Loan Consultation & Preliminary Estimate"
        description="Submit a loan enquiry to Nexa Fund Advisor LLP for free preliminary guidance."
        path="/enquire"
      />

      <section className="page-banner">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <span>Enquire Now</span>
          </nav>
          <h1>Looking for the Right Loan?</h1>
          <p className="lead-text">
            Tell us a little about yourself. Our team will help you explore suitable options.
          </p>
        </div>
      </section>

      <section className="section section-ivory">
        <div className="container grid-2" style={{ alignItems: 'start' }}>
          <div className="card" style={{ padding: '28px' }}>
            <EnquiryForm contextNote="Dedicated Enquiry Page" />
          </div>

          <div className="card" style={{ background: 'var(--navy)', color: 'var(--white)' }}>
            <div className="eyebrow">Direct Support</div>
            <h3 style={{ color: 'var(--white)' }}>Prefer Speaking Directly?</h3>
            <p style={{ color: '#D2DEEB' }}>
              Initial consultations and preliminary estimates are completely free. Reach our team on phone or WhatsApp.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <a href={COMPANY.phoneHref} className="btn btn-gold btn-sm">
                <Phone size={15} />
                Call {COMPANY.phoneDisplay}
              </a>
              <a
                href={COMPANY.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-light btn-sm"
              >
                <MessageCircle size={15} />
                WhatsApp Us
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
