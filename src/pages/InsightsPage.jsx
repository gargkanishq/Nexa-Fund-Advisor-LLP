import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, Clock, ArrowRight } from 'lucide-react';
import { BLOG_CATEGORIES } from '../../shared/validation';
import PageHead from '../components/PageHead';
import InsightCard, { formatPostDate } from '../components/InsightCard';
import { useEnquiryModal } from '../context/EnquiryModalContext';

export default function InsightsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const { openEnquiryModal } = useEnquiryModal();

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch('/api/posts')
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data.ok && Array.isArray(data.posts)) {
          setPosts(data.posts);
        } else {
          setError('Unable to load articles right now.');
        }
      })
      .catch(() => {
        if (active) setError('Unable to connect to the insights server.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredPosts = posts.filter((post) => {
    const matchesCat = category === 'All' || post.category === category;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      post.title.toLowerCase().includes(q) ||
      post.excerpt.toLowerCase().includes(q) ||
      post.category.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const featuredPost =
    category === 'All' && !searchQuery.trim()
      ? filteredPosts.find((p) => p.featured) || filteredPosts[0]
      : null;

  const listPosts = featuredPost
    ? filteredPosts.filter((p) => p.id !== featuredPost.id)
    : filteredPosts;

  return (
    <>
      <PageHead
        title="Nexa Insights | Practical Banking & Loan Guidance by Mr. Gopal Arora"
        description="Read educational articles on home loans, balance transfers, loan documentation, and banking procedures written by Mr. Gopal Arora, Former Chief Manager, UCO Bank."
        path="/insights"
      />

      <section className="page-banner">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <span>Nexa Insights</span>
          </nav>
          <h1>Nexa Insights — Financial Knowledge Centre</h1>
          <p className="lead-text">
            Practical, plain-English guides authored primarily by Mr. Gopal Arora (Former Chief Manager, UCO Bank • 38 years in PSU banking) to help borrowers navigate loans with confidence.
          </p>
        </div>
      </section>

      <section className="section section-ivory">
        <div className="container">
          {/* Search and Category Filters */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '28px',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }} role="group" aria-label="Filter articles by category">
              {['All', ...BLOG_CATEGORIES].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`calc-tab-btn ${category === cat ? 'active' : ''}`}
                  style={{ minHeight: '38px', padding: '6px 14px', fontSize: '0.84rem' }}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', minWidth: '250px', flex: '0 1 320px' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--muted)',
                }}
              />
              <input
                type="search"
                aria-label="Search insights articles"
                placeholder="Search articles..."
                className="form-control"
                style={{ paddingLeft: '36px', minHeight: '42px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="card">
              <p style={{ margin: 0 }}>Loading Nexa Insights articles...</p>
            </div>
          ) : error ? (
            <div className="alert alert-error">{error}</div>
          ) : filteredPosts.length === 0 ? (
            <div className="card">
              <h3 style={{ marginBottom: '8px' }}>No matching articles found</h3>
              <p style={{ marginBottom: '14px' }}>
                Try clearing your search or selecting another category.
              </p>
              <div>
                <button
                  type="button"
                  className="btn btn-outline-navy btn-sm"
                  onClick={() => {
                    setCategory('All');
                    setSearchQuery('');
                  }}
                >
                  Reset Filters
                </button>
              </div>
            </div>
          ) : (
            <>
              {featuredPost && (
                <article className="featured-article-card">
                  <Link
                    to={`/insights/${featuredPost.slug}`}
                    className="insight-cover"
                    aria-label={featuredPost.title}
                  >
                    <img
                      src={featuredPost.coverImage || '/images/insights/banking-knowledge-cover.svg'}
                      alt={featuredPost.title}
                    />
                  </Link>
                  <div className="featured-article-body">
                    <div className="insight-meta">
                      <span className="insight-category-pill">Featured • {featuredPost.category}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={14} />
                        {formatPostDate(featuredPost.publishedAt)}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={14} />
                        {featuredPost.readingTimeMinutes || 4} min read
                      </span>
                    </div>
                    <h2 style={{ fontSize: '1.65rem', marginBottom: '12px' }}>
                      <Link
                        to={`/insights/${featuredPost.slug}`}
                        style={{ textDecoration: 'none', color: 'var(--navy)' }}
                      >
                        {featuredPost.title}
                      </Link>
                    </h2>
                    <p style={{ color: 'var(--muted)', marginBottom: '18px' }}>
                      {featuredPost.excerpt}
                    </p>
                    <div>
                      <Link to={`/insights/${featuredPost.slug}`} className="btn btn-navy btn-sm">
                        Read Full Article
                        <ArrowRight size={15} />
                      </Link>
                    </div>
                  </div>
                </article>
              )}

              {listPosts.length > 0 && (
                <div className="grid-3">
                  {listPosts.map((post) => (
                    <InsightCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="transparency-box">
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>
                Want Personalised Guidance on Your Specific Loan Situation?
              </h2>
              <p style={{ margin: 0, color: 'var(--muted)' }}>
                Educational articles provide general awareness. Speak with our team for a free, tailored preliminary evaluation.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-gold"
              onClick={() => openEnquiryModal('Nexa Insights Enquiry')}
            >
              Enquire Now
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
