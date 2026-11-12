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
          <div className="eyebrow eyebrow-navy">Banking Empanelment</div>
          <h2 id="banking-partners-heading" style={{ marginBottom: '10px' }}>
            Banking Relationships That Open Doors
          </h2>
          <p className="lead-text" style={{ marginBottom: 0 }}>
            Our banking partnerships help us connect customers with established lending institutions and explore suitable home financing options.
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
            Empanelled for home loan services with multiple public sector banks. Loan approval remains subject to lender eligibility.
          </p>
        </div>
      </div>
    </section>
  );
}
