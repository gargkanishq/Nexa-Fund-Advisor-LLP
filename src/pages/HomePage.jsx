import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  Building2,
  CheckCircle2,
  FileCheck2,
  Landmark,
  Calculator,
} from 'lucide-react';
import PageHead from '../components/PageHead';
import BankPartnersCarousel from '../components/BankPartnersCarousel';
import InsightCard from '../components/InsightCard';
import {
  COMPANY,
  FOUNDER,
  HOW_IT_WORKS_STEPS,
  SERVICES,
  WHY_NEXA_ADVANTAGES,
} from '../data/siteContent';
import { useEnquiryModal } from '../context/EnquiryModalContext';

const LOCAL_BUSINESS_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FinancialService',
  name: COMPANY.name,
  description:
    'Loan facilitation, financial advisory, home loan assistance, and home loan balance transfer guidance in Delhi.',
  url: COMPANY.websiteUrl,
  telephone: '+91-98914-43855',
  email: COMPANY.email,
  logo: `${COMPANY.websiteUrl}/images/Company Design Assets/NFA LOGO.png`,
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'D-12/25-26, IIIrd Floor, Beside Rohini East Metro Station, Gate No. 2, Rohini',
    addressLocality: 'Delhi',
    postalCode: '110085',
    addressCountry: 'IN',
  },
  areaServed: ['Delhi'],
  founder: {
    '@type': 'Person',
    name: 'Gopal Arora',
    jobTitle: 'Founder',
  },
  sameAs: [COMPANY.instagramHref],
};

export default function HomePage() {
  const { openEnquiryModal } = useEnquiryModal();
  const [latestPosts, setLatestPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch('/api/posts?limit=3')
      .then((res) => res.json())
      .then((data) => {
        if (active && data.ok && Array.isArray(data.posts)) {
          setLatestPosts(data.posts);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setPostsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <PageHead
        title="Home Loan Consultant & Financial Advisory in Delhi"
        description="Nexa Fund Advisor LLP offers experienced home loan consultation, home loan balance transfer evaluation, and transparent loan assistance."
        path="/"
        structuredData={LOCAL_BUSINESS_SCHEMA}
      />

      {/* Section 2: Hero */}
      <section className="hero-section">
        <div className="container hero-grid">
          <div>
            <div className="eyebrow">
              <Landmark size={15} />
              Loan Facilitation &amp; Financial Advisory
            </div>
            <h1>Your Financial Goals. Our Banking Expertise.</h1>
            <p className="lead-text" style={{ maxWidth: '540px' }}>
              Experienced loan facilitation and home loan guidance—helping you compare options, simplify paperwork, and navigate banking smoothly.
            </p>
            <div className="hero-ctas" style={{ marginBottom: 0 }}>
              <Link to="/services" className="btn btn-gold">
                Explore Loan Solutions
                <ArrowRight size={17} />
              </Link>
              <button
                type="button"
                className="btn btn-outline-light"
                onClick={() => openEnquiryModal('Homepage Hero Enquire Now')}
              >
                Enquire Now
              </button>
            </div>
          </div>

          {/* Concise Advisory Credibility Panel */}
          <aside className="hero-visual-panel" aria-label="Nexa Advisory Highlights">
            <div className="hero-visual-top">
              <span className="hero-visual-badge">Advisory Credibility</span>
              <img
                src={COMPANY.logoMonogram}
                alt=""
                width="32"
                height="32"
                style={{
                  background: '#FFFFFF',
                  borderRadius: '6px',
                  padding: '3px',
                  objectFit: 'contain',
                }}
              />
            </div>

            <div className="hero-pillars">
              <div className="hero-pillar-item">
                <Award size={19} className="hero-pillar-icon" />
                <div>
                  <strong>38 Years of Banking Experience</strong>
                  <span>Mr. Gopal Arora • Former Chief Manager, UCO Bank</span>
                </div>
              </div>

              <div className="hero-pillar-item">
                <Building2 size={19} className="hero-pillar-icon" />
                <div>
                  <strong>Home Loan Bank Empanelment</strong>
                  <span>Official partnerships with leading PSU banks</span>
                </div>
              </div>

              <div className="hero-pillar-item">
                <FileCheck2 size={19} className="hero-pillar-icon" />
                <div>
                  <strong>End-to-End Loan Support</strong>
                  <span>Free initial estimates through disbursement</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Section 3: Editorial Philosophy Quote Banner (replaces repeating boxes) */}
      <section className="quote-banner" aria-label="Advisory Philosophy">
        <div className="container quote-banner-inner">
          <p className="quote-banner-quote">
            &ldquo;Make borrowing simpler, more transparent, and less stressful.&rdquo;
          </p>
          <span className="quote-banner-meta">
            38 Years of Banking Experience • Led by a Former Chief Manager, UCO Bank
          </span>
        </div>
      </section>

      {/* Section 4: Banking Partners Carousel (Homepage ONLY) */}
      <BankPartnersCarousel />

      {/* Section 5: Our Services */}
      <section className="section" aria-labelledby="home-services-heading">
        <div className="container">
          <div className="section-header-split" style={{ marginBottom: '28px' }}>
            <div>
              <div className="eyebrow eyebrow-navy">Our Services</div>
              <h2 id="home-services-heading" style={{ marginBottom: '8px' }}>
                Loan Solutions for Every Stage
              </h2>
              <p className="lead-text" style={{ marginBottom: 0 }}>
                Home loans are our specialization, alongside dedicated assistance across all major loan categories.
              </p>
            </div>
            <Link to="/services" className="btn btn-outline-navy">
              View All Services
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid-3">
            {SERVICES.map((service) => (
              <article key={service.id} className="card card-interactive">
                <span
                  className={`service-card-tag ${
                    service.id === 'home-loans' || service.id === 'home-loan-balance-transfer'
                      ? 'primary'
                      : ''
                  }`}
                >
                  {service.categoryTag}
                </span>
                <h3>{service.title}</h3>
                <p style={{ marginBottom: '12px' }}>{service.shortDescription}</p>
                <Link to={service.route} className="card-footer-link">
                  {service.ctaLabel} <ArrowRight size={15} />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6: Why Nexa? */}
      <section className="section section-tint" aria-labelledby="why-nexa-heading">
        <div className="container">
          <div className="section-header" style={{ marginBottom: '28px' }}>
            <h2
              id="why-nexa-heading"
              style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', marginBottom: '10px' }}
            >
              Why Nexa?
            </h2>
            <p className="lead-text" style={{ marginBottom: 0 }}>
              Practical banking insight and clear guidance—from initial comparison to disbursement.
            </p>
          </div>

          <div className="grid-3">
            {WHY_NEXA_ADVANTAGES.map((item) => (
              <div key={item.title} className="card" style={{ padding: '22px' }}>
                <CheckCircle2 size={20} style={{ color: 'var(--gold)', marginBottom: '10px' }} />
                <h3 style={{ fontSize: '1.05rem', marginBottom: '6px' }}>{item.title}</h3>
                <p style={{ marginBottom: 0, fontSize: '0.9rem' }}>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 7: Home Loan Balance Transfer Highlight */}
      <section className="section" aria-labelledby="bt-highlight-heading">
        <div className="container">
          <div className="bt-spotlight">
            <div>
              <div className="eyebrow">Home Loan Balance Transfer</div>
              <h2 id="bt-highlight-heading">
                Could Your Existing Home Loan Cost Less?
              </h2>
              <p className="lead-text">
                Compare your current rate against available alternatives—factoring in remaining tenure and transfer costs—before deciding.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '20px' }}>
                <Link to="/home-loan-balance-transfer" className="btn btn-gold">
                  <Calculator size={17} />
                  Calculate Your Savings
                </Link>
              </div>
            </div>

            <div className="bt-example-box">
              <div
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--gold-light)',
                  marginBottom: '8px',
                }}
              >
                Illustrative Example
              </div>
              <div className="bt-example-row">
                <span>Outstanding Principal</span>
                <strong className="tabular-nums">₹10,00,000</strong>
              </div>
              <div className="bt-example-row">
                <span>Current Rate</span>
                <strong className="tabular-nums">9.5% p.a.</strong>
              </div>
              <div className="bt-example-row">
                <span>Potential Rate</span>
                <strong className="tabular-nums">8.5% p.a.</strong>
              </div>
              <p
                style={{
                  margin: '12px 0 0',
                  fontSize: '0.8rem',
                  color: '#B8C9DC',
                }}
              >
                Savings depend on tenure, principal, and transfer charges.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 8: How It Works */}
      <section className="section section-ivory" aria-labelledby="how-it-works-heading">
        <div className="container">
          <div className="section-header" style={{ marginBottom: '28px' }}>
            <div className="eyebrow eyebrow-navy">How It Works</div>
            <h2 id="how-it-works-heading" style={{ marginBottom: 0 }}>
              Six Steps From Consultation to Disbursement
            </h2>
          </div>

          <div className="steps-grid">
            {HOW_IT_WORKS_STEPS.map((item) => (
              <div key={item.step} className="step-card">
                <div className="step-badge" aria-hidden="true">
                  {item.step}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.02rem', marginBottom: '4px' }}>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 9: Founder Introduction */}
      <section className="section" aria-labelledby="founder-heading">
        <div className="container founder-grid">
          <div className="founder-photo-frame">
            <img
              src={FOUNDER.photo}
              alt="Mr. Gopal Arora, Founder of Nexa Fund Advisor LLP"
              loading="lazy"
            />
            <div className="founder-caption-bar">
              <strong>{FOUNDER.name}</strong>
              <span>{FOUNDER.previousDesignation} • {FOUNDER.experienceHeadline}</span>
            </div>
          </div>

          <div>
            <div className="eyebrow eyebrow-navy">Leadership</div>
            <h2 id="founder-heading">Banking Expertise. Personalised Guidance.</h2>
            <p className="lead-text">{FOUNDER.shortBio}</p>
            <ul className="check-list">
              {FOUNDER.pillars.map((pillar) => (
                <li key={pillar}>
                  <CheckCircle2 size={17} />
                  <span>{pillar}</span>
                </li>
              ))}
            </ul>
            <div style={{ marginTop: '20px' }}>
              <Link to="/about" className="btn btn-navy">
                Know Our Story
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section 10: Free Consultation */}
      <section className="section section-tint" aria-labelledby="transparency-heading">
        <div className="container">
          <div className="transparency-box">
            <div style={{ maxWidth: '680px' }}>
              <div className="eyebrow eyebrow-navy">Free Initial Consultation</div>
              <h2 id="transparency-heading" style={{ fontSize: '1.7rem', marginBottom: '10px' }}>
                Transparent Assistance. No Upfront Consultation Charges.
              </h2>
              <p style={{ margin: 0, color: 'var(--muted)' }}>
                Explore your loan options and receive preliminary EMI and balance transfer estimates without any upfront consultation fee.
              </p>
            </div>
            <div style={{ flexShrink: 0 }}>
              <button
                type="button"
                className="btn btn-gold"
                onClick={() => openEnquiryModal('Free Estimate Request')}
              >
                Get a Free Estimate
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section 11: Nexa Insights Preview */}
      <section className="section" aria-labelledby="insights-preview-heading">
        <div className="container">
          <div className="section-header-split" style={{ marginBottom: '28px' }}>
            <div>
              <div className="eyebrow eyebrow-navy">Nexa Insights</div>
              <h2 id="insights-preview-heading" style={{ marginBottom: '6px' }}>
                Practical Banking &amp; Loan Guides
              </h2>
              <p className="lead-text" style={{ marginBottom: 0 }}>
                Written by Mr. Gopal Arora to help you make informed borrowing decisions.
              </p>
            </div>
            <Link to="/insights" className="btn btn-outline-navy">
              Explore All Insights
              <ArrowRight size={16} />
            </Link>
          </div>

          {postsLoading ? (
            <div className="grid-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="card" style={{ minHeight: '280px', justifyContent: 'center' }}>
                  <p style={{ margin: 0 }}>Loading latest article...</p>
                </div>
              ))}
            </div>
          ) : latestPosts.length > 0 ? (
            <div className="grid-3">
              {latestPosts.map((post) => (
                <InsightCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="card">
              <p style={{ margin: 0 }}>
                Browse articles in{' '}
                <Link to="/insights" style={{ color: 'var(--navy)', fontWeight: 700 }}>
                  Nexa Insights
                </Link>
                .
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Section 12: Final CTA */}
      <section className="section section-navy" aria-labelledby="final-cta-heading">
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
          <div style={{ maxWidth: '600px' }}>
            <h2 id="final-cta-heading" style={{ marginBottom: '8px' }}>
              Let&apos;s Make Your Next Financial Decision Smarter.
            </h2>
            <p className="lead-text" style={{ marginBottom: 0 }}>
              Connect with our team for a free preliminary consultation.
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-gold"
              onClick={() => openEnquiryModal('Homepage Final CTA')}
            >
              Talk to Our Team
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
