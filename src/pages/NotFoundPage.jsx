import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PageHead from '../components/PageHead';

export default function NotFoundPage() {
  return (
    <>
      <PageHead
        title="Page Not Found"
        description="The page you requested could not be found on Nexa Fund Advisor LLP."
        path="/404"
        noIndex
      />
      <section className="section">
        <div className="container" style={{ maxWidth: '680px', textAlign: 'center' }}>
          <div className="eyebrow eyebrow-navy">404 • Page Not Found</div>
          <h1>We Could Not Find That Page</h1>
          <p className="lead-text" style={{ marginInline: 'auto' }}>
            The link may be outdated or the address may have been typed incorrectly. Explore our services, financial calculators, or return to the homepage.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '24px' }}>
            <Link to="/" className="btn btn-navy">
              <ArrowLeft size={16} />
              Return to Homepage
            </Link>
            <Link to="/enquire" className="btn btn-gold">
              Enquire Now
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
