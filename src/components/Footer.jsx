import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Instagram } from 'lucide-react';
import { COMPANY, SERVICES } from '../data/siteContent';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                textDecoration: 'none',
                marginBottom: '14px',
              }}
            >
              <img
                src={COMPANY.logoPrimary}
                alt="Nexa Fund Advisor LLP Logo"
                width="46"
                height="46"
                style={{
                  background: '#FFFFFF',
                  borderRadius: '8px',
                  padding: '2px',
                  objectFit: 'contain',
                }}
              />
              <div>
                <strong style={{ display: 'block', color: '#FFFFFF', fontSize: '1.05rem' }}>
                  {COMPANY.name}
                </strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--gold-light)' }}>
                  {COMPANY.tagline}
                </span>
              </div>
            </Link>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.65, color: '#C2D2E3', maxWidth: '340px' }}>
              Loan facilitation, financial advisory, and banking assistance designed to make borrowing simpler, more transparent, and less stressful.
            </p>
            <a
              href={COMPANY.instagramHref}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--gold-light)',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 600,
                marginTop: '6px',
              }}
            >
              <Instagram size={17} />
              {COMPANY.instagramHandle}
            </a>
          </div>

          <div>
            <div className="footer-heading">Navigation</div>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/services">Our Services</Link></li>
              <li><Link to="/home-loan-balance-transfer">Home Loan Transfer</Link></li>
              <li><Link to="/calculators">Financial Calculators</Link></li>
              <li><Link to="/insights">Nexa Insights</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
              <li><Link to="/enquire">Enquire Now</Link></li>
            </ul>
          </div>

          <div>
            <div className="footer-heading">Loan Services</div>
            <ul className="footer-links">
              {SERVICES.map((service) => (
                <li key={service.id}>
                  <Link to={service.route}>{service.title}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="footer-heading">Head Office &amp; Contact</div>
            <div style={{ display: 'grid', gap: '12px', fontSize: '0.9rem', color: '#D2DEEB' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <MapPin size={17} style={{ color: 'var(--gold-light)', flexShrink: 0, marginTop: '3px' }} />
                <div>
                  <div>{COMPANY.addressLine1}</div>
                  <div>{COMPANY.addressLine2}</div>
                  <div style={{ color: '#9FB3C8', fontSize: '0.84rem', marginTop: '2px' }}>
                    Landmark: {COMPANY.landmark}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Phone size={16} style={{ color: 'var(--gold-light)', flexShrink: 0 }} />
                <a href={COMPANY.phoneHref} style={{ textDecoration: 'none' }}>
                  {COMPANY.phoneDisplay}
                </a>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Mail size={16} style={{ color: 'var(--gold-light)', flexShrink: 0 }} />
                <a href={COMPANY.emailHref} style={{ textDecoration: 'none' }}>
                  {COMPANY.email}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div>
            &copy; {year} {COMPANY.name}. All rights reserved. Nexa Fund Advisor LLP is a loan facilitation and financial advisory firm, not a bank or direct lender.
          </div>
          <div className="footer-legal-links">
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms-and-conditions">Terms &amp; Conditions</Link>
            <Link to="/disclaimer">Disclaimer</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
