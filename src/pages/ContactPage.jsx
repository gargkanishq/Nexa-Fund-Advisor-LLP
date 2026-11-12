import { Link } from 'react-router-dom';
import {
  Phone,
  Mail,
  MapPin,
  Instagram,
  MessageCircle,
  Navigation,
  ArrowRight,
  TrainFront,
} from 'lucide-react';
import PageHead from '../components/PageHead';
import { COMPANY } from '../data/siteContent';
import { useEnquiryModal } from '../context/EnquiryModalContext';

export default function ContactPage() {
  const { openEnquiryModal } = useEnquiryModal();

  return (
    <>
      <PageHead
        title="Contact Us | Rohini, Delhi Office — Beside Rohini East Metro Station"
        description="Visit or contact Nexa Fund Advisor LLP at D-12/25-26, IIIrd Floor, Rohini, Delhi – 110085 (Beside Rohini East Metro Station, Gate No. 2) or call +91 98914 43855."
        path="/contact"
      />

      <section className="page-banner">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <span>Contact Us</span>
          </nav>
          <h1>Contact Nexa Fund Advisor LLP</h1>
          <p className="lead-text">
            Speak with our advisory team or visit our Rohini, Delhi office for guidance on home loans, balance transfers, and loan documentation.
          </p>
        </div>
      </section>

      <section className="section section-ivory">
        <div className="container grid-2" style={{ alignItems: 'start' }}>
          <div style={{ display: 'grid', gap: '20px' }}>
            <div className="card">
              <div className="eyebrow eyebrow-navy">Head Office Location</div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>Rohini, New Delhi</h2>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' }}>
                <MapPin size={20} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: '3px' }} />
                <div>
                  <strong style={{ display: 'block', color: 'var(--navy)' }}>
                    {COMPANY.name}
                  </strong>
                  <div>{COMPANY.addressLine1}</div>
                  <div>{COMPANY.addressLine2}</div>
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: 'var(--gold-soft)',
                  border: '1px solid rgba(200, 163, 77, 0.45)',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  color: 'var(--navy)',
                  fontWeight: 600,
                  marginBottom: '18px',
                }}
              >
                <TrainFront size={18} style={{ color: 'var(--navy)', flexShrink: 0 }} />
                <span>Landmark: {COMPANY.landmark}</span>
              </div>
              <div>
                <a
                  href={COMPANY.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-gold"
                >
                  <Navigation size={17} />
                  Get Directions
                </a>
              </div>
            </div>

            <div className="card">
              <div className="eyebrow eyebrow-navy">Direct Contact Channels</div>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Phone size={19} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Phone</div>
                    <a
                      href={COMPANY.phoneHref}
                      style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--navy)', textDecoration: 'none' }}
                    >
                      {COMPANY.phoneDisplay}
                    </a>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <MessageCircle size={19} style={{ color: '#1B7A43', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>WhatsApp</div>
                    <a
                      href={COMPANY.whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontWeight: 700, fontSize: '1.02rem', color: 'var(--navy)', textDecoration: 'none' }}
                    >
                      Chat on WhatsApp ({COMPANY.phoneDisplay})
                    </a>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Mail size={19} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Email</div>
                    <a
                      href={COMPANY.emailHref}
                      style={{ fontWeight: 700, fontSize: '1.02rem', color: 'var(--navy)', textDecoration: 'none' }}
                    >
                      {COMPANY.email}
                    </a>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Instagram size={19} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Instagram</div>
                    <a
                      href={COMPANY.instagramHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontWeight: 700, fontSize: '1.02rem', color: 'var(--navy)', textDecoration: 'none' }}
                    >
                      {COMPANY.instagramHandle}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Map & Online Enquiry Card */}
          <div style={{ display: 'grid', gap: '20px' }}>
            <div className="card" style={{ padding: '14px' }}>
              <iframe
                title="Nexa Fund Advisor LLP Office Location — Rohini East Metro Station Gate No. 2"
                src={COMPANY.googleMapsEmbedUrl}
                width="100%"
                height="340"
                style={{ border: 0, borderRadius: '8px', display: 'block' }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="card" style={{ background: 'var(--navy)', color: 'var(--white)' }}>
              <div className="eyebrow">Request a Call Back</div>
              <h3 style={{ color: 'var(--white)' }}>Prefer Submitting Your Enquiry Online?</h3>
              <p style={{ color: '#D2DEEB' }}>
                Share whether you are exploring a new loan or reviewing an existing facility. Initial consultations and preliminary estimates carry zero upfront fees.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-gold"
                  onClick={() => openEnquiryModal('Contact Page Enquiry')}
                >
                  Open Enquiry Form
                  <ArrowRight size={17} />
                </button>
                <Link to="/enquire" className="btn btn-outline-light">
                  Go to Dedicated Enquiry Page
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
