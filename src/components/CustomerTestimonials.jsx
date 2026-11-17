import { Building, Star } from 'lucide-react';
import { CUSTOMER_TESTIMONIALS } from '../data/siteContent';

/**
 * Customer Testimonials section highlighting customer experiences
 * with hassle-free loan processing through public sector banks.
 */
export default function CustomerTestimonials() {
  return (
    <section className="section section-ivory testimonials-section" aria-labelledby="testimonials-heading">
      <div className="container">
        <div className="section-header" style={{ marginBottom: '36px', textAlign: 'center' }}>
          <div className="eyebrow eyebrow-navy">Client Experiences</div>
          <h2 id="testimonials-heading" style={{ marginBottom: '10px' }}>
            Borrower Satisfaction with Public Sector Bank Processing
          </h2>
          <p className="lead-text" style={{ maxWidth: '680px', margin: '0 auto' }}>
            How our 38 years of banking background simplifies retail lending, documentation, and institutional coordination for everyday borrowers.
          </p>
        </div>

        <div className="testimonials-grid">
          {CUSTOMER_TESTIMONIALS.map((testimonial) => (
            <div key={testimonial.id} className="testimonial-card">
              <div className="testimonial-card-top">
                <div className="testimonial-bank-tag">
                  <Building size={14} aria-hidden="true" />
                  <span>{testimonial.bankType}</span>
                </div>
                <div className="testimonial-stars" aria-label="5 out of 5 stars">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={15}
                      fill="var(--gold)"
                      color="var(--gold)"
                      aria-hidden="true"
                    />
                  ))}
                </div>
              </div>

              <blockquote className="testimonial-quote">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>

              <div className="testimonial-meta">
                <div className="testimonial-avatar" aria-hidden="true">
                  {testimonial.clientName ? testimonial.clientName.charAt(0) : 'N'}
                </div>
                <div className="testimonial-client-info">
                  <div className="testimonial-client-name">
                    <span>{testimonial.clientName}</span>
                  </div>
                  <div className="testimonial-client-sub">
                    {testimonial.clientProfession ? `${testimonial.clientProfession} • ` : ''}
                    {testimonial.clientLocation}
                  </div>
                  <div className="testimonial-loan-badge">
                    {testimonial.loanType}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
