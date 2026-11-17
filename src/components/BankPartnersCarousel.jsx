import { BANKING_PARTNERS } from '../data/siteContent';

/**
 * Homepage-only Banking Partners continuous marquee carousel.
 * Smooth, non-stopping CSS horizontal scroll across supplied bank logos.
 */
export default function BankPartnersCarousel() {
  const slides = [...BANKING_PARTNERS, ...BANKING_PARTNERS];

  return (
    <section className="section section-ivory" aria-labelledby="banking-partners-heading">
      <div className="container">
        <div className="section-header" style={{ marginBottom: '28px' }}>
          <div className="eyebrow eyebrow-navy">Banking &amp; Lending Network</div>
          <h2 id="banking-partners-heading" style={{ marginBottom: '10px' }}>
            Banking &amp; Lending Partners
          </h2>
          <p className="lead-text" style={{ marginBottom: 0 }}>
            Connecting homebuyers and borrowers with established public sector banks and leading housing finance institutions.
          </p>
        </div>

        <div className="carousel-shell">
          <div
            className="carousel-viewport"
            role="region"
            aria-label="Banking partners logo carousel"
          >
            <div className="carousel-track">
              {slides.map((bank, index) => (
                <div
                  key={`${bank.id}-${index}`}
                  className="bank-logo-card"
                  aria-hidden={index >= BANKING_PARTNERS.length ? 'true' : undefined}
                >
                  <div
                    className="bank-logo-frame"
                    style={{ backgroundColor: bank.bgTint }}
                  >
                    <img
                      src={bank.logo}
                      alt={index < BANKING_PARTNERS.length ? `${bank.name} logo` : ''}
                      loading="lazy"
                    />
                  </div>
                  <div className="bank-logo-caption">{bank.name}</div>
                </div>
              ))}
            </div>
          </div>

          <p
            style={{
              marginTop: '14px',
              marginBottom: 0,
              fontSize: '0.78rem',
              color: 'var(--muted)',
            }}
          >
            Empanelled for home loan services with multiple public sector banks and facilitating loan applications across partner lending institutions. All loan approvals and terms remain subject to individual lender credit appraisal and eligibility criteria.
          </p>
        </div>
      </div>
    </section>
  );
}
